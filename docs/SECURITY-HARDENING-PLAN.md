# Security Hardening Implementation Plan

**Project**: nself-chat (nchat)
**Version**: v0.9.0+
**Last Updated**: February 3, 2026
**Status**: Implementation Plan

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Security Posture](#current-security-posture)
3. [Rate Limiting (Task 124)](#1-rate-limiting-task-124)
4. [CSRF Protection (Task 125)](#2-csrf-protection-task-125)
5. [SSRF Protection (Task 126)](#3-ssrf-protection-task-126)
6. [XSS Protection](#4-xss-protection)
7. [Secrets Audit (Task 127)](#5-secrets-audit-task-127)
8. [Security Scans (Task 128)](#6-security-scans-task-128)
9. [Additional Hardening](#7-additional-hardening)
10. [Implementation Checklist](#8-implementation-checklist)
11. [Security Testing](#9-security-testing)
12. [Monitoring & Alerting](#10-monitoring--alerting)

---

## Executive Summary

This document provides a comprehensive security hardening implementation plan for nself-chat covering Tasks 124-128 from the TODO.md backlog. The plan addresses rate limiting, CSRF protection, SSRF/XSS prevention, secrets management, and security scanning integration.

### Goals

- **Defense in Depth**: Multiple layers of security controls
- **Zero Trust**: Verify every request, assume breach
- **Compliance Ready**: Meet SOC 2, GDPR, and HIPAA requirements
- **Automated Security**: CI/CD integrated security scanning

### Key Metrics

| Metric                     | Current    | Target          |
| -------------------------- | ---------- | --------------- |
| Security Headers Score     | A          | A+              |
| Dependency Vulnerabilities | 0 critical | 0 critical/high |
| API Rate Limiting Coverage | ~60%       | 100%            |
| CSRF Protection Coverage   | Partial    | 100% mutations  |
| Security Scan Frequency    | Weekly     | Every PR        |

---

## Current Security Posture

### Existing Implementations

| Component                         | Status      | Location                               |
| --------------------------------- | ----------- | -------------------------------------- |
| **Security Headers**              | Implemented | `next.config.js`, `src/middleware.ts`  |
| **CSP (Content Security Policy)** | Implemented | Both static and dynamic nonce-based    |
| **Rate Limiting**                 | Partial     | `src/middleware/rate-limit.ts`         |
| **CSRF Protection**               | Implemented | `src/lib/security/csrf.ts`             |
| **Input Validation**              | Implemented | `src/lib/security/input-validation.ts` |
| **IP Blocking**                   | Implemented | `src/lib/security/ip-blocker.ts`       |
| **HTML Sanitization**             | Implemented | DOMPurify via `isomorphic-dompurify`   |
| **CodeQL Scanning**               | Implemented | `.github/workflows/codeql.yml`         |
| **Dependency Audit**              | Partial     | `pnpm audit` in CI                     |
| **SSRF Protection**               | Partial     | `/api/unfurl/route.ts`                 |

### Security Headers (Current)

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'...
X-Frame-Options: SAMEORIGIN (next.config.js) / DENY (middleware)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
```

---

## 1. Rate Limiting (Task 124)

### Current State

Rate limiting exists in `src/middleware/rate-limit.ts` with:

- In-memory sliding window algorithm
- Per-endpoint configurations
- User ID or IP-based tracking
- Penalty box for repeat offenders

### Implementation Plan

#### 1.1 Redis-Based Rate Limiting

**Priority**: High
**Effort**: 2-3 days

Replace in-memory store with Redis for distributed rate limiting:

```typescript
// src/lib/security/redis-rate-limiter.ts

import Redis from 'ioredis'

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  burst?: number
  keyPrefix: string
}

class RedisRateLimiter {
  private redis: Redis

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryDelayOnFailover: 100,
    })
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const fullKey = `${config.keyPrefix}:${key}`
    const now = Date.now()
    const windowStart = now - config.windowSeconds * 1000

    // Use Redis pipeline for atomicity
    const pipeline = this.redis.pipeline()

    // Remove old entries
    pipeline.zremrangebyscore(fullKey, 0, windowStart)

    // Add current request
    pipeline.zadd(fullKey, now, `${now}:${Math.random()}`)

    // Count requests in window
    pipeline.zcard(fullKey)

    // Set expiry
    pipeline.expire(fullKey, config.windowSeconds)

    const results = await pipeline.exec()
    const count = results?.[2]?.[1] as number

    const limit = config.maxRequests + (config.burst || 0)
    const allowed = count <= limit

    return {
      allowed,
      remaining: Math.max(0, limit - count),
      reset: Math.ceil((now + config.windowSeconds * 1000) / 1000),
      limit,
      retryAfter: allowed ? undefined : config.windowSeconds,
    }
  }
}
```

#### 1.2 Enhanced Endpoint Configurations

**Priority**: High
**Effort**: 1 day

Expand rate limit configurations:

```typescript
// src/middleware/rate-limit.ts (additions)

export const ENDPOINT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication - Strict
  '/api/auth/signin': { maxRequests: 5, windowSeconds: 60 },
  '/api/auth/signup': { maxRequests: 3, windowSeconds: 3600 },
  '/api/auth/2fa/verify': { maxRequests: 5, windowSeconds: 300 },
  '/api/auth/change-password': { maxRequests: 3, windowSeconds: 900 },
  '/api/auth/verify-password': { maxRequests: 5, windowSeconds: 300 },

  // Sensitive Operations
  '/api/admin': { maxRequests: 100, windowSeconds: 60 },
  '/api/admin/bulk-operations': { maxRequests: 5, windowSeconds: 60 },
  '/api/export': { maxRequests: 3, windowSeconds: 3600 },

  // Messages - Allow burst
  '/api/messages': { maxRequests: 30, windowSeconds: 60, burst: 10 },
  '/api/messages/schedule': { maxRequests: 10, windowSeconds: 60 },

  // Uploads - Resource intensive
  '/api/upload': { maxRequests: 10, windowSeconds: 60 },
  '/api/upload/complete': { maxRequests: 10, windowSeconds: 60 },

  // Search & AI - Compute intensive
  '/api/search': { maxRequests: 30, windowSeconds: 60 },
  '/api/translate': { maxRequests: 20, windowSeconds: 60 },
  '/api/ai': { maxRequests: 10, windowSeconds: 60 },

  // Webhooks - High throughput
  '/api/webhook': { maxRequests: 100, windowSeconds: 60 },
  '/api/bots': { maxRequests: 60, windowSeconds: 60 },

  // URL Unfurl - External requests
  '/api/unfurl': { maxRequests: 30, windowSeconds: 60 },

  // Health checks - No limit
  '/api/health': { maxRequests: 1000, windowSeconds: 60 },
  '/api/ready': { maxRequests: 1000, windowSeconds: 60 },
}
```

#### 1.3 Rate Limit Headers

**Priority**: Medium
**Effort**: 0.5 days

Ensure all API responses include rate limit headers:

```typescript
// Standard headers to include
'X-RateLimit-Limit': string      // Max requests
'X-RateLimit-Remaining': string  // Remaining requests
'X-RateLimit-Reset': string      // Unix timestamp of reset
'Retry-After': string            // Seconds until retry (on 429)
```

#### 1.4 User-Tier Rate Limits

**Priority**: Medium
**Effort**: 1 day

Implement tiered rate limits based on user role:

```typescript
const TIER_MULTIPLIERS = {
  guest: 0.5, // 50% of base limits
  member: 1.0, // Base limits
  moderator: 1.5, // 150% of base limits
  admin: 2.0, // 200% of base limits
  owner: 5.0, // 500% of base limits
}

function getRateLimitForUser(baseConfig: RateLimitConfig, userRole: string): RateLimitConfig {
  const multiplier = TIER_MULTIPLIERS[userRole] || 1.0
  return {
    ...baseConfig,
    maxRequests: Math.ceil(baseConfig.maxRequests * multiplier),
  }
}
```

### Rate Limiting Testing

```bash
# Test rate limit with curl
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/auth/signin
done

# Expected: 200 200 200 200 200 429 429 429 429 429
```

---

## 2. CSRF Protection (Task 125)

### Current State

CSRF protection is implemented in `src/lib/security/csrf.ts` with:

- Token generation and validation
- Double-submit cookie pattern
- HMAC signing
- Timing-safe comparison

### Implementation Plan

#### 2.1 Global CSRF Middleware

**Priority**: High
**Effort**: 1 day

Apply CSRF protection to all state-changing API routes:

```typescript
// src/middleware.ts (add to middleware chain)

import { validateCsrfToken, setCsrfToken } from '@/lib/security/csrf'

export async function middleware(request: NextRequest) {
  // ... existing code ...

  // CSRF validation for API mutations
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  ) {
    // Skip CSRF for webhooks (use signature verification instead)
    if (request.nextUrl.pathname.startsWith('/api/webhook')) {
      return NextResponse.next()
    }

    // Skip CSRF for public endpoints
    const publicEndpoints = ['/api/auth/signin', '/api/auth/signup']
    if (publicEndpoints.includes(request.nextUrl.pathname)) {
      return NextResponse.next()
    }

    // Validate CSRF token
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token', code: 'CSRF_INVALID' },
        { status: 403 }
      )
    }
  }

  // ... rest of middleware ...
}
```

#### 2.2 SameSite Cookie Configuration

**Priority**: High
**Effort**: 0.5 days

Ensure all session cookies use SameSite=Lax or Strict:

```typescript
// src/lib/security/csrf.ts

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Prevents CSRF from external sites
  path: '/',
  maxAge: 24 * 60 * 60, // 24 hours
}

// For auth sessions, use Strict
const AUTH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  sameSite: 'strict' as const, // Maximum protection
}
```

#### 2.3 Origin Validation

**Priority**: High
**Effort**: 0.5 days

Validate Origin/Referer headers for additional CSRF protection:

```typescript
// src/lib/security/origin-validation.ts

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'https://localhost:3000',
].filter(Boolean)

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // In development, be lenient
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Check Origin header first
  if (origin) {
    return ALLOWED_ORIGINS.some((allowed) => origin === allowed || origin.startsWith(allowed + '/'))
  }

  // Fall back to Referer
  if (referer) {
    return ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))
  }

  // No origin info - reject for mutations
  return false
}
```

#### 2.4 CSRF Token Refresh

**Priority**: Medium
**Effort**: 0.5 days

Implement automatic token refresh on the client:

```typescript
// src/hooks/use-csrf.ts

import { useEffect, useState, useCallback } from 'react'

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null)
  const [headerName, setHeaderName] = useState('X-CSRF-Token')

  const refreshToken = useCallback(async () => {
    const response = await fetch('/api/csrf')
    const data = await response.json()
    setToken(data.csrfToken)
    setHeaderName(data.headerName)
  }, [])

  useEffect(() => {
    refreshToken()
    // Refresh every 12 hours
    const interval = setInterval(refreshToken, 12 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshToken])

  return { token, headerName, refreshToken }
}

// Usage in fetch wrapper
export function createSecureFetch(csrfToken: string) {
  return async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': csrfToken,
      },
    })
  }
}
```

---

## 3. SSRF Protection (Task 126)

### Current State

Basic SSRF protection exists in `/api/unfurl/route.ts`:

- Private IP blocking
- Domain blocklist
- Timeout enforcement

### Implementation Plan

#### 3.1 Centralized URL Validation

**Priority**: High
**Effort**: 1 day

Create a comprehensive URL validation service:

```typescript
// src/lib/security/ssrf-protection.ts

import { URL } from 'url'
import dns from 'dns'
import { promisify } from 'util'

const resolve4 = promisify(dns.resolve4)
const resolve6 = promisify(dns.resolve6)

interface SsrfConfig {
  allowedProtocols: string[]
  blockedDomains: string[]
  allowedDomains?: string[] // Allowlist mode (if set, only these domains allowed)
  allowPrivateIPs: boolean
  allowLocalhost: boolean
  timeoutMs: number
  maxRedirects: number
}

const DEFAULT_CONFIG: SsrfConfig = {
  allowedProtocols: ['http:', 'https:'],
  blockedDomains: [
    'metadata.google.internal',
    '169.254.169.254', // AWS metadata
    'metadata.azure.internal',
  ],
  allowPrivateIPs: false,
  allowLocalhost: false,
  timeoutMs: 10000,
  maxRedirects: 5,
}

export class SsrfProtection {
  private config: SsrfConfig

  constructor(config: Partial<SsrfConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async validateUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
    try {
      const parsed = new URL(url)

      // 1. Protocol check
      if (!this.config.allowedProtocols.includes(parsed.protocol)) {
        return { valid: false, reason: `Protocol ${parsed.protocol} not allowed` }
      }

      // 2. Localhost check
      if (!this.config.allowLocalhost) {
        if (this.isLocalhost(parsed.hostname)) {
          return { valid: false, reason: 'Localhost URLs not allowed' }
        }
      }

      // 3. Blocklist check
      if (this.isBlockedDomain(parsed.hostname)) {
        return { valid: false, reason: 'Domain is blocked' }
      }

      // 4. Allowlist check (if configured)
      if (this.config.allowedDomains && !this.isAllowedDomain(parsed.hostname)) {
        return { valid: false, reason: 'Domain not in allowlist' }
      }

      // 5. DNS resolution check (prevent DNS rebinding)
      const ips = await this.resolveHostname(parsed.hostname)
      for (const ip of ips) {
        if (!this.config.allowPrivateIPs && this.isPrivateIP(ip)) {
          return { valid: false, reason: `Resolved to private IP: ${ip}` }
        }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, reason: `Invalid URL: ${error.message}` }
    }
  }

  private isLocalhost(hostname: string): boolean {
    const localhostPatterns = ['localhost', '127.0.0.1', '::1', '0.0.0.0']
    return localhostPatterns.some((p) => hostname.toLowerCase() === p)
  }

  private isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    const ipv4Private = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./, // Link-local
      /^0\./,
    ]

    // IPv6 private ranges
    const ipv6Private = [/^::1$/, /^fc00:/i, /^fd00:/i, /^fe80:/i]

    return ipv4Private.some((p) => p.test(ip)) || ipv6Private.some((p) => p.test(ip))
  }

  private isBlockedDomain(hostname: string): boolean {
    return this.config.blockedDomains.some(
      (blocked) =>
        hostname.toLowerCase() === blocked || hostname.toLowerCase().endsWith(`.${blocked}`)
    )
  }

  private isAllowedDomain(hostname: string): boolean {
    if (!this.config.allowedDomains) return true
    return this.config.allowedDomains.some(
      (allowed) =>
        hostname.toLowerCase() === allowed || hostname.toLowerCase().endsWith(`.${allowed}`)
    )
  }

  private async resolveHostname(hostname: string): Promise<string[]> {
    const results: string[] = []

    try {
      const ipv4 = await resolve4(hostname)
      results.push(...ipv4)
    } catch {
      // Ignore resolution errors
    }

    try {
      const ipv6 = await resolve6(hostname)
      results.push(...ipv6)
    } catch {
      // Ignore resolution errors
    }

    return results
  }
}

// Singleton instance
export const ssrfProtection = new SsrfProtection()
```

#### 3.2 Secure Fetch Wrapper

**Priority**: High
**Effort**: 0.5 days

Create a secure fetch function for external requests:

```typescript
// src/lib/security/secure-fetch.ts

import { ssrfProtection } from './ssrf-protection'

interface SecureFetchOptions extends RequestInit {
  maxRedirects?: number
  validateRedirects?: boolean
}

export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {}
): Promise<Response> {
  const { maxRedirects = 5, validateRedirects = true, ...fetchOptions } = options

  // Validate initial URL
  const validation = await ssrfProtection.validateUrl(url)
  if (!validation.valid) {
    throw new Error(`SSRF blocked: ${validation.reason}`)
  }

  // Set timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    // Disable automatic redirects to validate each hop
    const response = await fetch(url, {
      ...fetchOptions,
      redirect: validateRedirects ? 'manual' : 'follow',
      signal: controller.signal,
    })

    // Handle redirects manually
    if (validateRedirects && [301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) {
        throw new Error('Redirect without location header')
      }

      if (maxRedirects <= 0) {
        throw new Error('Too many redirects')
      }

      // Resolve relative URLs
      const redirectUrl = new URL(location, url).toString()

      // Validate redirect URL
      const redirectValidation = await ssrfProtection.validateUrl(redirectUrl)
      if (!redirectValidation.valid) {
        throw new Error(`SSRF blocked redirect: ${redirectValidation.reason}`)
      }

      // Follow redirect
      return secureFetch(redirectUrl, {
        ...options,
        maxRedirects: maxRedirects - 1,
      })
    }

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}
```

#### 3.3 DNS Rebinding Protection

**Priority**: High
**Effort**: 1 day

Implement DNS rebinding prevention:

```typescript
// src/lib/security/dns-cache.ts

interface CachedDnsEntry {
  ips: string[]
  resolvedAt: number
  ttl: number
}

class DnsCache {
  private cache = new Map<string, CachedDnsEntry>()
  private readonly DEFAULT_TTL = 300000 // 5 minutes

  async resolve(hostname: string): Promise<string[]> {
    const cached = this.cache.get(hostname)
    const now = Date.now()

    // Return cached if still valid
    if (cached && now - cached.resolvedAt < cached.ttl) {
      return cached.ips
    }

    // Resolve fresh
    const ips = await this.performDnsResolution(hostname)

    // Cache the result
    this.cache.set(hostname, {
      ips,
      resolvedAt: now,
      ttl: this.DEFAULT_TTL,
    })

    return ips
  }

  // Pin DNS resolution during request lifetime
  async validateAndPin(url: string): Promise<string> {
    const parsed = new URL(url)
    const ips = await this.resolve(parsed.hostname)

    if (ips.length === 0) {
      throw new Error('Could not resolve hostname')
    }

    // Validate all resolved IPs
    for (const ip of ips) {
      if (isPrivateIP(ip)) {
        throw new Error(`DNS resolution returned private IP: ${ip}`)
      }
    }

    // Return URL with first IP (pinned)
    // This prevents DNS rebinding during the request
    const pinnedUrl = new URL(url)
    pinnedUrl.hostname = ips[0]

    return pinnedUrl.toString()
  }
}

export const dnsCache = new DnsCache()
```

---

## 4. XSS Protection

### Current State

XSS protection is implemented via:

- DOMPurify (`isomorphic-dompurify`) for HTML sanitization
- CSP headers (with nonce support)
- Input validation schemas

### Implementation Plan

#### 4.1 Enhanced Content Security Policy

**Priority**: High
**Effort**: 1 day

Strengthen CSP with stricter directives:

```typescript
// src/middleware.ts

function getStrictCSP(nonce: string, isDev: boolean): string {
  const directives = [
    // Default: self only
    `default-src 'self'`,

    // Scripts: nonce-based, no inline
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ''}`,

    // Styles: self + inline (Tailwind needs this)
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // Fonts
    `font-src 'self' https://fonts.gstatic.com data:`,

    // Images: allow https + data for avatars/embeds
    `img-src 'self' data: blob: https:`,

    // Media
    `media-src 'self' blob: data:`,

    // Connections: API endpoints + WebSockets
    `connect-src 'self' ${getConnectSources(isDev)}`,

    // Frames: self only (no external embeds by default)
    `frame-src 'self' https://www.youtube.com https://player.vimeo.com`,

    // Objects: none (no Flash/Java)
    `object-src 'none'`,

    // Base: self only
    `base-uri 'self'`,

    // Forms: self only
    `form-action 'self'`,

    // Frame ancestors: none (prevent clickjacking)
    `frame-ancestors 'none'`,

    // Block mixed content
    `block-all-mixed-content`,

    // Upgrade HTTP to HTTPS
    `upgrade-insecure-requests`,

    // Report violations
    `report-uri /api/csp-report`,
    `report-to csp-endpoint`,
  ]

  return directives.join('; ')
}

function getConnectSources(isDev: boolean): string {
  const sources = [
    process.env.NEXT_PUBLIC_GRAPHQL_URL,
    process.env.NEXT_PUBLIC_AUTH_URL,
    process.env.NEXT_PUBLIC_STORAGE_URL,
    process.env.NEXT_PUBLIC_SOCKET_URL,
  ].filter(Boolean)

  if (isDev) {
    sources.push('ws://localhost:*', 'http://localhost:*')
  }

  return sources.join(' ')
}
```

#### 4.2 CSP Violation Reporting

**Priority**: Medium
**Effort**: 0.5 days

Implement CSP violation endpoint:

```typescript
// src/app/api/csp-report/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { captureError } from '@/lib/sentry-utils'

export async function POST(request: NextRequest) {
  try {
    const report = await request.json()

    // Log to monitoring
    console.warn('CSP Violation:', JSON.stringify(report, null, 2))

    // Send to Sentry for tracking
    captureError(new Error('CSP Violation'), {
      tags: { type: 'csp-violation' },
      extra: report,
    })

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  }
}
```

#### 4.3 Rich Text Sanitization

**Priority**: High
**Effort**: 1 day

Create a robust HTML sanitization service for TipTap content:

```typescript
// src/lib/security/html-sanitizer.ts

import DOMPurify from 'isomorphic-dompurify'

// Strict config for user messages
const MESSAGE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'h1',
    'h2',
    'h3',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-mention-id'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
}

// Relaxed config for admin content
const ADMIN_CONFIG = {
  ...MESSAGE_CONFIG,
  ALLOWED_TAGS: [...MESSAGE_CONFIG.ALLOWED_TAGS, 'img', 'video', 'audio'],
  ALLOWED_ATTR: [...MESSAGE_CONFIG.ALLOWED_ATTR, 'src', 'alt', 'width', 'height'],
}

export function sanitizeMessage(html: string): string {
  // Pre-process: normalize line breaks
  const normalized = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Sanitize
  const sanitized = DOMPurify.sanitize(normalized, MESSAGE_CONFIG)

  // Post-process: ensure external links open in new tab
  return sanitized.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  )
}

export function sanitizeAdminContent(html: string): string {
  return DOMPurify.sanitize(html, ADMIN_CONFIG)
}

// Escape for text-only display
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Remove all HTML tags
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
}
```

#### 4.4 Markdown Sanitization

**Priority**: Medium
**Effort**: 0.5 days

Secure markdown rendering:

```typescript
// src/lib/security/markdown-sanitizer.ts

import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Configure marked for security
marked.setOptions({
  headerIds: false,
  mangle: false,
  sanitize: false, // We use DOMPurify instead
})

export function renderMarkdown(markdown: string): string {
  // Convert markdown to HTML
  const html = marked.parse(markdown)

  // Sanitize the output
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'hr',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}
```

---

## 5. Secrets Audit (Task 127)

### Implementation Plan

#### 5.1 Automated Secrets Scanner

**Priority**: Critical
**Effort**: 1 day

Add pre-commit secrets scanning:

```bash
# Install detect-secrets
pip install detect-secrets

# Generate baseline
detect-secrets scan > .secrets.baseline

# Add to pre-commit hooks
# .pre-commit-config.yaml
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: |
          (?x)^(
            .*\.test\.ts|
            .*\.spec\.ts|
            \.secrets\.baseline
          )$
```

#### 5.2 Environment Variable Validation

**Priority**: High
**Effort**: 1 day

Enhance production environment validation:

```typescript
// scripts/validate-secrets.ts

import { z } from 'zod'

const ProductionSecretsSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(20),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  HASURA_ADMIN_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32),

  // Services
  REDIS_URL: z.string().url().optional(),
  MEILISEARCH_MASTER_KEY: z.string().min(16).optional(),

  // OAuth (if enabled)
  GOOGLE_CLIENT_SECRET: z.string().min(10).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(10).optional(),

  // Encryption
  SOCIAL_MEDIA_ENCRYPTION_KEY: z.string().min(32).optional(),
})

// Validation for no secrets in client bundle
const ClientBundleCheck = z
  .object({
    NEXT_PUBLIC_GRAPHQL_URL: z.string().url(),
    NEXT_PUBLIC_AUTH_URL: z.string().url(),
  })
  .strict()

export function validateProductionSecrets(): void {
  const env = process.env

  // Check that no sensitive vars have NEXT_PUBLIC_ prefix
  const sensitivePatterns = ['SECRET', 'PASSWORD', 'PRIVATE', 'KEY', 'TOKEN', 'CREDENTIAL']

  for (const key of Object.keys(env)) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      for (const pattern of sensitivePatterns) {
        if (key.includes(pattern)) {
          throw new Error(
            `CRITICAL: Sensitive variable ${key} has NEXT_PUBLIC_ prefix. ` +
              `This will expose the value to clients!`
          )
        }
      }
    }
  }

  // Validate required secrets exist
  const result = ProductionSecretsSchema.safeParse(env)
  if (!result.success) {
    console.error('Production secrets validation failed:')
    for (const error of result.error.errors) {
      console.error(`  - ${error.path.join('.')}: ${error.message}`)
    }
    process.exit(1)
  }

  console.log('All production secrets validated successfully')
}
```

#### 5.3 Secret Rotation Procedures

**Priority**: Medium
**Effort**: 1 day

Document and implement secret rotation:

````markdown
# Secret Rotation Runbook

## JWT_SECRET Rotation

1. Generate new secret:
   ```bash
   openssl rand -base64 64
   ```
````

2. Update environment variable in all environments

3. Deploy with grace period (both secrets valid for 24h)

4. Remove old secret after grace period

## HASURA_ADMIN_SECRET Rotation

1. Generate new secret
2. Update Hasura environment variable
3. Update application environment variable
4. Restart Hasura and application
5. Verify GraphQL connectivity

## OAuth Client Secret Rotation

1. Generate new secret in provider dashboard
2. Update environment variable
3. Deploy
4. Test OAuth flow
5. Revoke old secret in provider dashboard

````

#### 5.4 Git History Cleanup

**Priority**: Low
**Effort**: 0.5 days

Script to check for secrets in git history:

```bash
#!/bin/bash
# scripts/check-git-secrets.sh

echo "Checking git history for potential secrets..."

# Patterns to search for
PATTERNS=(
  "password\s*[=:]\s*['\"][^'\"]+['\"]"
  "secret\s*[=:]\s*['\"][^'\"]+['\"]"
  "api_key\s*[=:]\s*['\"][^'\"]+['\"]"
  "private_key"
  "-----BEGIN.*PRIVATE KEY-----"
  "sk-[a-zA-Z0-9]{20,}"
  "ghp_[a-zA-Z0-9]{36}"
)

for pattern in "${PATTERNS[@]}"; do
  echo "Searching for: $pattern"
  git log -p --all -S "$pattern" --source --all 2>/dev/null | head -20
done

echo "Done. Review output for any leaked secrets."
````

---

## 6. Security Scans (Task 128)

### Implementation Plan

#### 6.1 Enhanced Dependency Scanning

**Priority**: High
**Effort**: 1 day

Add comprehensive dependency scanning to CI:

```yaml
# .github/workflows/security-scan.yml

name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM

jobs:
  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # pnpm audit
      - name: Run pnpm audit
        run: pnpm audit --audit-level=moderate
        continue-on-error: true

      # npm audit for comparison
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

  snyk-scan:
    name: Snyk Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  trivy-scan:
    name: Trivy Filesystem Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  semgrep:
    name: Semgrep SAST
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        run: semgrep ci --config auto --sarif --output semgrep-results.sarif
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      - name: Upload Semgrep results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep-results.sarif
```

#### 6.2 Container Scanning

**Priority**: High
**Effort**: 0.5 days

Add container image scanning:

```yaml
# .github/workflows/container-scan.yml

name: Container Security

on:
  push:
    branches: [main]
    paths:
      - 'Dockerfile'
      - '.github/workflows/container-scan.yml'

jobs:
  container-scan:
    name: Scan Container Image
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t nself-chat:scan .

      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'nself-chat:scan'
          format: 'sarif'
          output: 'trivy-container.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy container results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-container.sarif'

      - name: Run Dockle lint
        uses: erzz/dockle-action@v1
        with:
          image: nself-chat:scan
          failure-threshold: high
```

#### 6.3 DAST (Dynamic Analysis)

**Priority**: Medium
**Effort**: 2 days

Implement OWASP ZAP scanning:

```yaml
# .github/workflows/dast.yml

name: DAST Scan

on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday

jobs:
  zap-scan:
    name: OWASP ZAP Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_USE_DEV_AUTH: 'true'

      - name: Start application
        run: |
          pnpm start &
          sleep 10

      - name: OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap-rules.tsv'

      - name: Upload ZAP report
        uses: actions/upload-artifact@v4
        with:
          name: zap-report
          path: report_html.html
```

ZAP rules configuration:

```tsv
# .zap-rules.tsv
# Rule ID    Alert threshold    Ignore
10015	IGNORE	# Incomplete or No Cache-control Header Set
10020	WARN	# X-Frame-Options Header
10021	FAIL	# X-Content-Type-Options Header Missing
10038	WARN	# Content Security Policy Header Not Set
10054	WARN	# Cookie without SameSite Attribute
10055	FAIL	# CSP: Wildcard Directive
90022	IGNORE	# Application Error Disclosure (dev mode)
```

#### 6.4 License Compliance

**Priority**: Low
**Effort**: 0.5 days

Add license checking:

```yaml
# .github/workflows/license-check.yml

name: License Compliance

on:
  pull_request:
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'

jobs:
  license-check:
    name: Check Licenses
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check licenses
        run: npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC0-1.0;CC-BY-3.0;CC-BY-4.0;0BSD;Unlicense"
```

---

## 7. Additional Hardening

### 7.1 HTTP Security Headers Enhancement

**Priority**: High
**Effort**: 0.5 days

Add additional security headers:

```typescript
// Additional headers to add to middleware.ts

const additionalHeaders = {
  // Prevent caching of sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',

  // Feature policy (more specific than Permissions-Policy)
  'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'",

  // Expect-CT for Certificate Transparency
  'Expect-CT': 'max-age=86400, enforce',
}
```

### 7.2 JWT Security

**Priority**: High
**Effort**: 1 day

Enhance JWT handling:

```typescript
// src/lib/security/jwt.ts

import { SignJWT, jwtVerify, JWTPayload } from 'jose'

const JWT_CONFIG = {
  algorithm: 'HS256' as const,
  issuer: 'nchat',
  audience: 'nchat-users',
  expiresIn: '1h',
  notBefore: '0s',
}

interface TokenPayload extends JWTPayload {
  userId: string
  role: string
  tenantId?: string
}

export async function createToken(payload: TokenPayload): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_CONFIG.algorithm })
    .setIssuedAt()
    .setIssuer(JWT_CONFIG.issuer)
    .setAudience(JWT_CONFIG.audience)
    .setExpirationTime(JWT_CONFIG.expiresIn)
    .setNotBefore(JWT_CONFIG.notBefore)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    })

    return payload as TokenPayload
  } catch {
    return null
  }
}
```

### 7.3 Password Policies

**Priority**: Medium
**Effort**: 0.5 days

Implement comprehensive password policies:

```typescript
// src/lib/security/password-policy.ts

import { z } from 'zod'

export const passwordPolicy = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((val) => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
  .refine((val) => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
  .refine((val) => /[0-9]/.test(val), 'Password must contain at least one number')
  .refine((val) => /[^a-zA-Z0-9]/.test(val), 'Password must contain at least one special character')
  .refine((val) => !commonPasswords.includes(val.toLowerCase()), 'This password is too common')
  .refine((val) => !containsRepeatingChars(val), 'Password cannot contain 4+ repeating characters')

// Top 1000 common passwords (abbreviated)
const commonPasswords = [
  'password',
  '123456',
  'qwerty',
  'admin',
  'letmein',
  // ... load from file
]

function containsRepeatingChars(str: string): boolean {
  return /(.)\1{3,}/.test(str)
}

export function checkPasswordStrength(password: string): {
  score: number // 0-100
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  // Length scoring
  if (password.length >= 8) score += 10
  if (password.length >= 12) score += 10
  if (password.length >= 16) score += 10

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 10
  if (/[A-Z]/.test(password)) score += 10
  if (/[0-9]/.test(password)) score += 10
  if (/[^a-zA-Z0-9]/.test(password)) score += 15

  // Variety scoring
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.6) score += 15

  // Entropy approximation
  if (password.length >= 16 && uniqueChars >= 10) score += 10

  // Feedback
  if (score < 40) feedback.push('Consider a longer password')
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters')
  if (uniqueChars < password.length * 0.5) feedback.push('Use more varied characters')

  return { score: Math.min(100, score), feedback }
}
```

### 7.4 Session Management

**Priority**: High
**Effort**: 1 day

Enhance session security:

```typescript
// src/lib/security/session-manager.ts

interface SessionConfig {
  maxConcurrentSessions: number
  sessionTimeout: number // milliseconds
  refreshThreshold: number // refresh if less than this time remaining
  absoluteTimeout: number // max session lifetime
}

const DEFAULT_CONFIG: SessionConfig = {
  maxConcurrentSessions: 5,
  sessionTimeout: 60 * 60 * 1000, // 1 hour
  refreshThreshold: 15 * 60 * 1000, // 15 minutes
  absoluteTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export class SessionManager {
  // Invalidate all sessions for user (logout everywhere)
  async invalidateAllSessions(userId: string): Promise<void> {
    // Implementation with Redis
  }

  // Invalidate specific session
  async invalidateSession(sessionId: string): Promise<void> {
    // Implementation
  }

  // Check if session should be refreshed
  shouldRefresh(session: Session): boolean {
    const timeRemaining = session.expiresAt - Date.now()
    return timeRemaining < DEFAULT_CONFIG.refreshThreshold
  }

  // Enforce concurrent session limit
  async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId)

    if (sessions.length >= DEFAULT_CONFIG.maxConcurrentSessions) {
      // Invalidate oldest session
      const oldest = sessions.sort((a, b) => a.createdAt - b.createdAt)[0]
      await this.invalidateSession(oldest.id)
    }
  }
}
```

---

## 8. Implementation Checklist

### Phase 1: Critical (Week 1)

- [ ] **Rate Limiting**
  - [ ] Implement Redis-based rate limiter
  - [ ] Apply rate limits to all API endpoints
  - [ ] Add rate limit headers to responses
  - [ ] Test rate limit bypass scenarios

- [ ] **CSRF Protection**
  - [ ] Verify CSRF middleware covers all mutations
  - [ ] Implement origin validation
  - [ ] Update client to include CSRF tokens

- [ ] **SSRF Protection**
  - [ ] Implement centralized URL validation
  - [ ] Add DNS rebinding protection
  - [ ] Update `/api/unfurl` to use secure fetch

### Phase 2: High Priority (Week 2)

- [ ] **XSS Protection**
  - [ ] Audit all HTML rendering points
  - [ ] Implement strict CSP with nonces
  - [ ] Add CSP violation reporting
  - [ ] Test with XSS payloads

- [ ] **Secrets Audit**
  - [ ] Run detect-secrets scan
  - [ ] Validate all environment variables
  - [ ] Document secret rotation procedures
  - [ ] Check git history for leaked secrets

### Phase 3: Security Scanning (Week 3)

- [ ] **CI Integration**
  - [ ] Add Snyk to CI pipeline
  - [ ] Add Semgrep SAST scanning
  - [ ] Add container scanning
  - [ ] Configure DAST with OWASP ZAP

- [ ] **Monitoring**
  - [ ] Set up security event alerting
  - [ ] Configure Sentry for security events
  - [ ] Create security dashboard

### Phase 4: Hardening (Week 4)

- [ ] **Additional Headers**
  - [ ] Add Cross-Origin policies
  - [ ] Configure Expect-CT
  - [ ] Review and tighten CSP

- [ ] **Authentication**
  - [ ] Implement enhanced password policies
  - [ ] Add session management improvements
  - [ ] Review JWT configuration

---

## 9. Security Testing

### 9.1 Penetration Testing Checklist

```markdown
## Authentication

- [ ] Brute force protection
- [ ] Account enumeration
- [ ] Password reset flow
- [ ] Session fixation
- [ ] Token security

## Authorization

- [ ] Horizontal privilege escalation
- [ ] Vertical privilege escalation
- [ ] IDOR (Insecure Direct Object Reference)
- [ ] Missing function-level access control

## Input Validation

- [ ] SQL injection
- [ ] XSS (reflected, stored, DOM)
- [ ] Command injection
- [ ] Path traversal
- [ ] XML/JSON injection

## API Security

- [ ] Rate limiting bypass
- [ ] CSRF bypass
- [ ] CORS misconfiguration
- [ ] Mass assignment
- [ ] Excessive data exposure

## Business Logic

- [ ] Race conditions
- [ ] Price manipulation
- [ ] Workflow bypass
```

### 9.2 Automated Security Tests

```typescript
// e2e/security/security.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  test('should have secure headers', async ({ page }) => {
    const response = await page.goto('/')

    expect(response?.headers()['x-frame-options']).toBe('DENY')
    expect(response?.headers()['x-content-type-options']).toBe('nosniff')
    expect(response?.headers()['strict-transport-security']).toContain('max-age=')
    expect(response?.headers()['content-security-policy']).toBeTruthy()
  })
})

test.describe('Authentication', () => {
  test('should rate limit login attempts', async ({ request }) => {
    // Make 10 failed login attempts
    for (let i = 0; i < 10; i++) {
      await request.post('/api/auth/signin', {
        data: { email: 'test@test.com', password: 'wrong' },
      })
    }

    // 11th attempt should be rate limited
    const response = await request.post('/api/auth/signin', {
      data: { email: 'test@test.com', password: 'wrong' },
    })

    expect(response.status()).toBe(429)
  })
})

test.describe('CSRF Protection', () => {
  test('should reject POST without CSRF token', async ({ request }) => {
    const response = await request.post('/api/messages', {
      data: { content: 'test' },
    })

    expect(response.status()).toBe(403)
  })
})
```

---

## 10. Monitoring & Alerting

### 10.1 Security Events to Monitor

| Event                    | Severity | Action                      |
| ------------------------ | -------- | --------------------------- |
| Multiple failed logins   | Medium   | Alert after 5 attempts      |
| Rate limit exceeded      | Low      | Log, block after repeat     |
| CSRF validation failure  | High     | Alert immediately           |
| XSS attempt detected     | High     | Alert, block IP             |
| SQL injection attempt    | Critical | Alert, block IP             |
| Admin access from new IP | Medium   | Alert for verification      |
| Password change          | Low      | Notify user                 |
| MFA disabled             | High     | Alert, require confirmation |

### 10.2 Sentry Security Alerts

```typescript
// src/lib/security/security-monitoring.ts

import { captureError, addSentryBreadcrumb } from '@/lib/sentry-utils'

export function logSecurityEvent(event: {
  type: 'auth_failure' | 'rate_limit' | 'csrf_failure' | 'xss_attempt' | 'ssrf_blocked'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ip: string
  details: Record<string, unknown>
}): void {
  // Add breadcrumb for context
  addSentryBreadcrumb('security', event.type, {
    severity: event.severity,
    ip: event.ip,
    ...event.details,
  })

  // Capture as error for high/critical
  if (['high', 'critical'].includes(event.severity)) {
    captureError(new Error(`Security Event: ${event.type}`), {
      tags: {
        security_event: event.type,
        severity: event.severity,
      },
      extra: {
        userId: event.userId,
        ip: event.ip,
        ...event.details,
      },
    })
  }

  // Log to console for all events
  console.warn(`[SECURITY] ${event.type}:`, {
    severity: event.severity,
    ip: event.ip,
    ...event.details,
  })
}
```

### 10.3 Security Dashboard Metrics

```typescript
// Metrics to track
const securityMetrics = {
  // Authentication
  'auth.login.success': Counter,
  'auth.login.failure': Counter,
  'auth.login.rate_limited': Counter,
  'auth.password.changed': Counter,
  'auth.mfa.enabled': Counter,
  'auth.mfa.disabled': Counter,

  // Authorization
  'authz.denied': Counter,
  'authz.role.escalation.attempt': Counter,

  // Input validation
  'input.xss.blocked': Counter,
  'input.sqli.blocked': Counter,
  'input.ssrf.blocked': Counter,

  // Rate limiting
  'ratelimit.exceeded': Counter,
  'ratelimit.ip.blocked': Counter,

  // CSRF
  'csrf.validation.failure': Counter,
}
```

---

## Appendix A: Security Configuration Reference

### Environment Variables

```bash
# Required for production
JWT_SECRET=<min 32 chars>
HASURA_ADMIN_SECRET=<min 32 chars>
CSRF_SECRET=<min 32 chars>
DATABASE_URL=<postgresql connection string>

# Optional security features
REDIS_URL=<redis connection string>  # For distributed rate limiting
SENTRY_DSN=<sentry dsn>              # For security monitoring
```

### Security-Related Dependencies

| Package                | Purpose           | Version |
| ---------------------- | ----------------- | ------- |
| `isomorphic-dompurify` | HTML sanitization | ^2.35.0 |
| `zod`                  | Input validation  | ^3.24.1 |
| `jose`                 | JWT handling      | ^5.2.0  |
| `ioredis`              | Redis client      | ^5.4.1  |
| `bcryptjs`             | Password hashing  | ^3.0.2  |

---

## Appendix B: Compliance Mapping

| Control             | SOC 2 | GDPR    | Implementation           |
| ------------------- | ----- | ------- | ------------------------ |
| Access Control      | CC6.1 | Art. 32 | RBAC, Session management |
| Encryption          | CC6.7 | Art. 32 | TLS, Encryption at rest  |
| Logging             | CC7.2 | Art. 30 | Audit logs, Sentry       |
| Data Retention      | CC6.5 | Art. 17 | Configurable retention   |
| Breach Notification | CC7.4 | Art. 33 | Security monitoring      |

---

## Document History

| Version | Date       | Author | Changes                         |
| ------- | ---------- | ------ | ------------------------------- |
| 1.0     | 2026-02-03 | Claude | Initial security hardening plan |
