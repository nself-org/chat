/**
 * Rate Limiting Middleware
 *
 * Edge-compatible rate limiting middleware for Next.js.
 * Applies rate limits at the middleware layer for optimal performance.
 *
 * @module middleware/rate-limit
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number
  /** Time window in seconds */
  windowSeconds: number
  /** Burst allowance */
  burst?: number
  /** Custom key prefix */
  keyPrefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number
  limit: number
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetAt: number
  requests: number[] // Timestamps for sliding window
}

// ============================================================================
// Edge-Compatible In-Memory Store
// ============================================================================

class EdgeRateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private lastCleanup = Date.now()
  private readonly CLEANUP_INTERVAL = 60000 // 1 minute

  /**
   * Check rate limit using sliding window algorithm
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000
    const limit = config.maxRequests + (config.burst || 0)

    // Periodic cleanup
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup()
    }

    let entry = this.store.get(key)

    if (!entry) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + windowMs,
        requests: [now],
      }
      this.store.set(key, entry)

      return {
        allowed: true,
        remaining: limit - 1,
        reset: Math.ceil((now + windowMs) / 1000),
        limit,
      }
    }

    // Sliding window: remove requests outside the window
    const windowStart = now - windowMs
    entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart)

    // Add current request
    entry.requests.push(now)
    entry.count = entry.requests.length

    // Update reset time
    if (entry.requests.length > 0) {
      entry.resetAt = entry.requests[0] + windowMs
    }

    const allowed = entry.count <= limit
    const remaining = Math.max(0, limit - entry.count)

    // Calculate retry after if rate limited
    let retryAfter: number | undefined
    if (!allowed && entry.requests.length > 0) {
      const oldestRequest = entry.requests[0]
      retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)
    }

    this.store.set(key, entry)

    return {
      allowed,
      remaining,
      reset: Math.ceil(entry.resetAt / 1000),
      limit,
      retryAfter,
    }
  }

  /**
   * Get current status without incrementing
   */
  status(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000
    const limit = config.maxRequests + (config.burst || 0)
    const entry = this.store.get(key)

    if (!entry) {
      return {
        allowed: true,
        remaining: limit,
        reset: Math.ceil((now + windowMs) / 1000),
        limit,
      }
    }

    // Sliding window: count requests in window
    const windowStart = now - windowMs
    const requestsInWindow = entry.requests.filter((timestamp) => timestamp > windowStart)
    const count = requestsInWindow.length
    const remaining = Math.max(0, limit - count)

    return {
      allowed: count < limit,
      remaining,
      reset: Math.ceil(entry.resetAt / 1000),
      limit,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key)
      }
    }
    this.lastCleanup = now
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear()
  }
}

// Singleton store instance
const edgeStore = new EdgeRateLimitStore()

// ============================================================================
// Rate Limit Configurations by Endpoint
// ============================================================================

export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  '/api/auth/signin': {
    maxRequests: 5,
    windowSeconds: 60, // 5 per minute
    keyPrefix: 'rl:auth:signin',
  },
  '/api/auth/signup': {
    maxRequests: 3,
    windowSeconds: 3600, // 3 per hour
    keyPrefix: 'rl:auth:signup',
  },
  '/api/auth/2fa/verify': {
    maxRequests: 5,
    windowSeconds: 300, // 5 per 5 minutes
    keyPrefix: 'rl:auth:2fa',
  },
  '/api/auth/change-password': {
    maxRequests: 3,
    windowSeconds: 900, // 3 per 15 minutes
    keyPrefix: 'rl:auth:password',
  },

  // Message endpoints
  '/api/messages': {
    maxRequests: 10,
    windowSeconds: 60, // 10 per minute
    burst: 5,
    keyPrefix: 'rl:messages',
  },

  // Upload endpoints
  '/api/upload': {
    maxRequests: 5,
    windowSeconds: 60, // 5 per minute
    keyPrefix: 'rl:upload',
  },

  // Search endpoints
  '/api/search': {
    maxRequests: 20,
    windowSeconds: 60, // 20 per minute
    burst: 10,
    keyPrefix: 'rl:search',
  },

  // AI endpoints
  '/api/ai': {
    maxRequests: 10,
    windowSeconds: 60, // 10 per minute
    keyPrefix: 'rl:ai',
  },

  // Export endpoints
  '/api/export': {
    maxRequests: 3,
    windowSeconds: 3600, // 3 per hour
    keyPrefix: 'rl:export',
  },

  // Analytics endpoints
  '/api/analytics/track': {
    maxRequests: 200,
    windowSeconds: 60, // 200 per minute
    keyPrefix: 'rl:analytics',
  },

  // Webhook endpoints
  '/api/webhook': {
    maxRequests: 50,
    windowSeconds: 60, // 50 per minute
    keyPrefix: 'rl:webhook',
  },

  // Bot API endpoints
  '/api/bots': {
    maxRequests: 60,
    windowSeconds: 60, // 60 per minute
    burst: 10,
    keyPrefix: 'rl:bots',
  },

  // Admin endpoints
  '/api/admin': {
    maxRequests: 100,
    windowSeconds: 60, // 100 per minute
    keyPrefix: 'rl:admin',
  },
}

// Default rate limit for all API routes
export const DEFAULT_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60, // 100 per minute
  burst: 20,
  keyPrefix: 'rl:api',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  return '127.0.0.1'
}

/**
 * Get user ID from request (if authenticated)
 */
export function getUserId(request: NextRequest): string | null {
  // Try to extract user ID from session cookie
  const sessionCookie =
    request.cookies.get('nchat-session')?.value ||
    request.cookies.get('nhostSession')?.value ||
    request.cookies.get('nchat-dev-session')?.value

  if (sessionCookie) {
    try {
      const parsed = JSON.parse(sessionCookie)
      return parsed.userId || parsed.sub || null
    } catch {
      // Ignore parsing errors
    }
  }

  // Try to extract from JWT in Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7)
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        return payload.sub || payload.userId || null
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return null
}

/**
 * Get rate limit identifier for request
 */
export function getRateLimitIdentifier(request: NextRequest): string {
  const userId = getUserId(request)
  const ip = getClientIp(request)

  // Prefer user ID over IP for authenticated requests
  if (userId) {
    return `user:${userId}`
  }

  return `ip:${ip}`
}

/**
 * Get rate limit configuration for a path
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check for exact match
  if (ENDPOINT_RATE_LIMITS[pathname]) {
    return ENDPOINT_RATE_LIMITS[pathname]
  }

  // Check for prefix match
  for (const [path, config] of Object.entries(ENDPOINT_RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config
    }
  }

  // Return default
  return DEFAULT_API_RATE_LIMIT
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${result.retryAfter || 60} seconds.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  )

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', '0')
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  return response
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }

  return response
}

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * Check if path should have rate limiting applied
 */
export function shouldApplyRateLimit(pathname: string): boolean {
  // Always rate limit API routes
  if (pathname.startsWith('/api/')) {
    return true
  }

  // Don't rate limit static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js)$/)
  ) {
    return false
  }

  return false
}

/**
 * Apply rate limiting to request
 */
export function applyRateLimit(request: NextRequest, pathname: string): RateLimitResult {
  const identifier = getRateLimitIdentifier(request)
  const config = getRateLimitConfig(pathname)
  const key = `${config.keyPrefix}:${identifier}`

  return edgeStore.check(key, config)
}

/**
 * Rate limiting middleware for Next.js
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  // Skip if rate limiting shouldn't be applied
  if (!shouldApplyRateLimit(pathname)) {
    return null
  }

  // Apply rate limit
  const result = applyRateLimit(request, pathname)

  // Return 429 if rate limited
  if (!result.allowed) {
    return createRateLimitResponse(result)
  }

  // Allow request to proceed
  return null
}

/**
 * Get rate limit status without incrementing
 */
export function getRateLimitStatus(
  request: NextRequest,
  pathname: string
): RateLimitResult {
  const identifier = getRateLimitIdentifier(request)
  const config = getRateLimitConfig(pathname)
  const key = `${config.keyPrefix}:${identifier}`

  return edgeStore.status(key, config)
}

/**
 * Reset rate limit for identifier
 */
export function resetRateLimit(identifier: string, config: RateLimitConfig): void {
  const key = `${config.keyPrefix}:${identifier}`
  edgeStore.reset(key)
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  edgeStore.clear()
}

// ============================================================================
// Advanced Features
// ============================================================================

/**
 * Rate limit by custom key (e.g., API key, email address)
 */
export function rateLimitByKey(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const fullKey = `${config.keyPrefix}:custom:${key}`
  return edgeStore.check(fullKey, config)
}

/**
 * Penalty box - temporarily block abusive IPs
 */
const penaltyBox = new Map<string, number>() // IP -> unblock timestamp

/**
 * Add IP to penalty box
 */
export function addToPenaltyBox(ip: string, durationSeconds: number = 3600): void {
  const unblockAt = Date.now() + durationSeconds * 1000
  penaltyBox.set(ip, unblockAt)
}

/**
 * Check if IP is in penalty box
 */
export function isInPenaltyBox(ip: string): boolean {
  const unblockAt = penaltyBox.get(ip)
  if (!unblockAt) return false

  if (Date.now() > unblockAt) {
    penaltyBox.delete(ip)
    return false
  }

  return true
}

/**
 * Remove IP from penalty box
 */
export function removeFromPenaltyBox(ip: string): void {
  penaltyBox.delete(ip)
}

/**
 * Get penalty box unblock time
 */
export function getPenaltyBoxUnblockTime(ip: string): number | null {
  const unblockAt = penaltyBox.get(ip)
  if (!unblockAt) return null

  if (Date.now() > unblockAt) {
    penaltyBox.delete(ip)
    return null
  }

  return Math.ceil((unblockAt - Date.now()) / 1000)
}

/**
 * Check penalty box and return response if blocked
 */
export function checkPenaltyBox(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request)

  if (isInPenaltyBox(ip)) {
    const retryAfter = getPenaltyBoxUnblockTime(ip) || 3600

    return NextResponse.json(
      {
        error: 'Forbidden',
        message: 'Your IP has been temporarily blocked due to abuse',
        code: 'IP_BLOCKED',
        retryAfter,
      },
      {
        status: 403,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }

  return null
}
