/**
 * URL Unfurl API Route
 *
 * This API route fetches URL metadata server-side to avoid CORS issues.
 * It returns structured data that can be used for rich link previews.
 *
 * @endpoint GET /api/unfurl?url=https://example.com
 * @endpoint POST /api/unfurl { url: string, urls?: string[], forceRefresh?: boolean }
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/unfurl?url=https://github.com/vercel/next.js')
 * const data = await response.json()
 * // { url, title, description, image, siteName, ... }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseHtmlForUnfurl, type UnfurlData } from '@/lib/embeds/unfurl-service';
import { detectEmbedType, isValidUrl, isEmbeddable } from '@/lib/embeds/embed-patterns';
import type { UnfurlResponse, LinkPreviewData } from '@/lib/link-preview';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Maximum time to wait for a URL response
  FETCH_TIMEOUT: 10000,
  // Maximum response body size to process (5MB)
  MAX_BODY_SIZE: 5 * 1024 * 1024,
  // User agent to use for requests
  USER_AGENT: 'nchat-unfurl-bot/1.0 (+https://nchat.app)',
  // Cache control header
  CACHE_CONTROL: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  // Rate limiting
  RATE_LIMIT_PER_MINUTE: 30,
  // Maximum URLs per batch request
  MAX_BATCH_SIZE: 10,
};

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Server-side cache (simple in-memory, use Redis in production)
const serverCache = new Map<string, { data: UnfurlData; expiresAt: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Domains that are known to block bots
const PROBLEMATIC_DOMAINS = [
  'linkedin.com',
  'facebook.com',
  'instagram.com',
];

// Blocked domains for security (SSRF protection)
const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
];

// ============================================================================
// RATE LIMITING
// ============================================================================

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }

  if (record.count >= CONFIG.RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// ============================================================================
// SERVER CACHE
// ============================================================================

function getCachedPreview(url: string): UnfurlData | null {
  const cached = serverCache.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  if (cached) {
    serverCache.delete(url);
  }
  return null;
}

function setCachedPreview(url: string, data: UnfurlData): void {
  // Limit cache size
  if (serverCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(serverCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    for (let i = 0; i < 100; i++) {
      serverCache.delete(entries[i][0]);
    }
  }

  serverCache.set(url, {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  });
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

function isPrivateUrl(url: string): boolean {
  const domain = new URL(url).hostname;

  // Check for private IP ranges
  const privatePatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^0\.0\.0\.0$/,
    /^\[::1\]$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  return privatePatterns.some((pattern) => pattern.test(domain));
}

function isDomainBlocked(url: string): boolean {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some((blocked) =>
      domain === blocked || domain.endsWith(`.${blocked}`)
    );
  } catch {
    return true;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Create an error response
 */
function errorResponse(
  message: string,
  errorCode: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { error: message, errorCode },
    { status }
  );
}

/**
 * Fetch a URL with timeout and size limits
 */
async function fetchWithLimits(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Read response body with size limit
 */
async function readBodyWithLimit(response: Response): Promise<string> {
  const contentLength = response.headers.get('content-length');

  if (contentLength && parseInt(contentLength, 10) > CONFIG.MAX_BODY_SIZE) {
    throw new Error('Response too large');
  }

  // Read as text
  const text = await response.text();

  if (text.length > CONFIG.MAX_BODY_SIZE) {
    // Truncate if too large (shouldn't happen often with text/html)
    return text.substring(0, CONFIG.MAX_BODY_SIZE);
  }

  return text;
}

/**
 * Check if the response is HTML
 */
function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
}

/**
 * Get favicon URL for a domain
 */
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Use Google's favicon service as a reliable fallback
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return '';
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Get client identifier for rate limiting
  const clientId =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', errorCode: 'RATE_LIMITED' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const forceRefresh = searchParams.get('refresh') === 'true';

  // Validate URL parameter
  if (!url) {
    return errorResponse('URL parameter is required', 'MISSING_URL');
  }

  // Validate URL format
  if (!isValidUrl(url)) {
    return errorResponse('Invalid URL format', 'INVALID_URL');
  }

  // Security checks
  try {
    if (isPrivateUrl(url)) {
      return errorResponse('Private URLs are not allowed', 'PRIVATE_URL', 403);
    }
    if (isDomainBlocked(url)) {
      return errorResponse('Domain is blocked', 'BLOCKED_DOMAIN', 403);
    }
  } catch {
    return errorResponse('Invalid URL format', 'INVALID_URL');
  }

  // Check server cache (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedPreview(url);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': CONFIG.CACHE_CONTROL,
          'X-Cache': 'HIT',
        },
      });
    }
  }

  // Check if URL is embeddable
  if (!isEmbeddable(url)) {
    return errorResponse('URL is not embeddable', 'NOT_EMBEDDABLE');
  }

  // Check for problematic domains
  const domain = new URL(url).hostname;
  const isProblematic = PROBLEMATIC_DOMAINS.some((d) => domain.includes(d));

  if (isProblematic) {
    // Return minimal data for problematic domains
    const embedType = detectEmbedType(url);
    const minimalData: UnfurlData = {
      url,
      embedType,
      siteName: domain.replace('www.', ''),
      favicon: getFaviconUrl(url),
    };

    return NextResponse.json(minimalData, {
      headers: {
        'Cache-Control': CONFIG.CACHE_CONTROL,
      },
    });
  }

  try {
    // Fetch the URL
    const response = await fetchWithLimits(url);

    // Check response status
    if (!response.ok) {
      // Try to return minimal data even on error
      const embedType = detectEmbedType(url);
      const minimalData: UnfurlData = {
        url,
        embedType,
        siteName: domain.replace('www.', ''),
        favicon: getFaviconUrl(url),
      };

      return NextResponse.json(minimalData, {
        headers: {
          'Cache-Control': CONFIG.CACHE_CONTROL,
        },
      });
    }

    // Check if response is HTML
    if (!isHtmlResponse(response)) {
      // For non-HTML responses, return minimal data
      const embedType = detectEmbedType(url);
      const contentType = response.headers.get('content-type') || '';

      const minimalData: UnfurlData = {
        url,
        embedType,
        siteName: domain.replace('www.', ''),
        favicon: getFaviconUrl(url),
      };

      // If it's an image, use the URL as the image
      if (contentType.includes('image/')) {
        minimalData.image = url;
      }

      return NextResponse.json(minimalData, {
        headers: {
          'Cache-Control': CONFIG.CACHE_CONTROL,
        },
      });
    }

    // Read and parse HTML
    const html = await readBodyWithLimit(response);
    const unfurlData = await parseHtmlForUnfurl(html, url);

    // Ensure we have a favicon
    if (!unfurlData.favicon) {
      unfurlData.favicon = getFaviconUrl(url);
    }

    // Cache the result
    setCachedPreview(url, unfurlData);

    return NextResponse.json(unfurlData, {
      headers: {
        'Cache-Control': CONFIG.CACHE_CONTROL,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return errorResponse('Request timeout', 'TIMEOUT', 504);
      }
      if (error.message === 'Response too large') {
        return errorResponse('Response too large', 'TOO_LARGE', 413);
      }
    }

    // For network errors, return minimal data
    const embedType = detectEmbedType(url);
    const minimalData: UnfurlData = {
      url,
      embedType,
      siteName: domain.replace('www.', ''),
      favicon: getFaviconUrl(url),
    };

    return NextResponse.json(minimalData, {
      headers: {
        'Cache-Control': CONFIG.CACHE_CONTROL,
      },
    });
  }
}

// ============================================================================
// POST HANDLER (for batch requests)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Get client identifier for rate limiting
  const clientId =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Check rate limit
  const rateLimit = checkRateLimit(clientId);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests', retryable: true },
      } as UnfurlResponse,
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      }
    );
  }

  try {
    const body = await request.json();
    const { url, urls, forceRefresh = false } = body;

    // Single URL request (new format for link-preview)
    if (url && !urls) {
      // Validate URL
      if (!isValidUrl(url)) {
        return NextResponse.json(
          {
            success: false,
            cached: false,
            error: { code: 'INVALID_URL', message: 'Invalid URL format', retryable: false },
          } as UnfurlResponse,
          { status: 400 }
        );
      }

      // Security checks
      try {
        if (isPrivateUrl(url)) {
          return NextResponse.json(
            {
              success: false,
              cached: false,
              error: { code: 'BLOCKED_DOMAIN', message: 'Private URLs are not allowed', retryable: false },
            } as UnfurlResponse,
            { status: 403 }
          );
        }
        if (isDomainBlocked(url)) {
          return NextResponse.json(
            {
              success: false,
              cached: false,
              error: { code: 'BLOCKED_DOMAIN', message: 'Domain is blocked', retryable: false },
            } as UnfurlResponse,
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            cached: false,
            error: { code: 'INVALID_URL', message: 'Invalid URL format', retryable: false },
          } as UnfurlResponse,
          { status: 400 }
        );
      }

      // Check server cache
      if (!forceRefresh) {
        const cached = getCachedPreview(url);
        if (cached) {
          // Convert to LinkPreviewData format
          const previewData: LinkPreviewData = {
            url: cached.url,
            type: cached.embedType === 'generic' ? 'generic' : cached.embedType as LinkPreviewData['type'],
            status: 'success',
            domain: new URL(url).hostname.replace(/^www\./, ''),
            isSecure: url.startsWith('https'),
            title: cached.title,
            description: cached.description,
            image: cached.image,
            imageWidth: cached.imageWidth,
            imageHeight: cached.imageHeight,
            siteName: cached.siteName,
            favicon: cached.favicon,
            author: cached.author,
            fetchedAt: Date.now(),
            expiresAt: Date.now() + CACHE_DURATION,
          };
          return NextResponse.json({ success: true, data: previewData, cached: true } as UnfurlResponse);
        }
      }

      // Redirect to GET handler for processing
      const getUrl = new URL(request.url);
      getUrl.searchParams.set('url', url);
      if (forceRefresh) getUrl.searchParams.set('refresh', 'true');
      const getRequest = new NextRequest(getUrl);
      const getResponse = await GET(getRequest);
      const responseData = await getResponse.json();

      // Check if it's an error response
      if (responseData.error) {
        return NextResponse.json(
          {
            success: false,
            cached: false,
            error: { code: responseData.errorCode || 'FETCH_FAILED', message: responseData.error, retryable: true },
          } as UnfurlResponse,
          { status: getResponse.status }
        );
      }

      // Convert to LinkPreviewData format
      const previewData: LinkPreviewData = {
        url: responseData.url,
        type: responseData.embedType === 'generic' ? 'generic' : responseData.embedType as LinkPreviewData['type'],
        status: 'success',
        domain: new URL(url).hostname.replace(/^www\./, ''),
        isSecure: url.startsWith('https'),
        title: responseData.title,
        description: responseData.description,
        image: responseData.image,
        imageWidth: responseData.imageWidth,
        imageHeight: responseData.imageHeight,
        siteName: responseData.siteName,
        favicon: responseData.favicon,
        author: responseData.author,
        fetchedAt: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION,
      };

      return NextResponse.json({ success: true, data: previewData, cached: false } as UnfurlResponse);
    }

    // Batch request (original format)
    if (!urls || !Array.isArray(urls)) {
      return errorResponse('urls array is required', 'MISSING_URLS');
    }

    if (urls.length > CONFIG.MAX_BATCH_SIZE) {
      return errorResponse(`Maximum ${CONFIG.MAX_BATCH_SIZE} URLs per request`, 'TOO_MANY_URLS');
    }

    // Process URLs in parallel
    const results = await Promise.all(
      urls.map(async (batchUrl: string) => {
        // Create a fake request to reuse GET logic
        const fakeRequest = new NextRequest(
          `${request.nextUrl.origin}/api/unfurl?url=${encodeURIComponent(batchUrl)}`
        );
        const response = await GET(fakeRequest);
        const data = await response.json();
        return { url: batchUrl, ...data };
      })
    );

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': CONFIG.CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/unfurl:', error);
    return errorResponse('Internal server error', 'INTERNAL_ERROR', 500);
  }
}
