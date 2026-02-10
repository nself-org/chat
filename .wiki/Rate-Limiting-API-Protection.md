# Rate Limiting & API Protection

Complete documentation for the nself-chat rate limiting and API protection system.

## Overview

The application implements a comprehensive multi-layered security approach:

1. **IP Blocking** - Whitelist/blacklist management with automatic abuse detection
2. **Rate Limiting** - Sliding window algorithm with Redis support
3. **CSRF Protection** - Double-submit cookie pattern
4. **Authentication** - JWT-based auth with role-based access control

## Architecture

```
Request Flow:
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Layer 1: Next.js Middleware (Edge)                 │
│  • IP Blocking Check (whitelist/blacklist)                      │
│  • Penalty Box Check (temporary blocks)                         │
│  • Rate Limiting (edge-compatible)                              │
│  • Security Headers (CSP, HSTS)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           Layer 2: API Route Middleware (Server)                │
│  • Error Handling (withErrorHandler)                            │
│  • Logging (withLogging)                                        │
│  • CSRF Protection (withCsrfProtection)                         │
│  • Authentication (withAuth)                                    │
│  • Rate Limiting (withRateLimit)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Business Logic Handler                      │
└─────────────────────────────────────────────────────────────────┘
```

## Rate Limiting

### Algorithms

#### 1. Sliding Window (Default)

The sliding window algorithm provides smooth rate limiting by tracking individual request timestamps:

```typescript
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limiter'

// Check rate limit
const result = await rateLimiter.check('user:123', RATE_LIMIT_PRESETS.MESSAGE_SEND)

if (!result.allowed) {
  // Rate limited - return 429
  return Response.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter.toString(),
      },
    }
  )
}
```

**How it works:**

- Stores timestamp for each request in a sorted set (Redis) or array (in-memory)
- Removes requests outside the time window
- Counts remaining requests in the current window
- Smooth rate limiting without sudden resets

#### 2. Token Bucket

The token bucket algorithm allows controlled bursts:

```typescript
const result = await rateLimiter.checkTokenBucket('user:123', {
  maxRequests: 10,
  windowSeconds: 60,
  burst: 5, // Allow bursts up to 15 total
})
```

**How it works:**

- Tokens refill at a constant rate
- Each request consumes 1 token
- Allows bursts when tokens are available
- Better UX for bursty traffic patterns

### Rate Limit Presets

Pre-configured rate limits for common scenarios:

```typescript
// Authentication endpoints
RATE_LIMIT_PRESETS.AUTH // 5/min
RATE_LIMIT_PRESETS.AUTH_SIGNUP // 3/hour
RATE_LIMIT_PRESETS.AUTH_RESET // 3/15min

// Message operations
RATE_LIMIT_PRESETS.MESSAGE_SEND // 10/min + 5 burst
RATE_LIMIT_PRESETS.MESSAGE_EDIT // 20/min

// File uploads
RATE_LIMIT_PRESETS.FILE_UPLOAD // 5/min
RATE_LIMIT_PRESETS.FILE_UPLOAD_LARGE // 2/5min

// Search
RATE_LIMIT_PRESETS.SEARCH // 20/min + 10 burst

// AI operations
RATE_LIMIT_PRESETS.AI_QUERY // 10/min

// General API
RATE_LIMIT_PRESETS.API_USER // 100/min + 20 burst
RATE_LIMIT_PRESETS.API_IP // 500/min

// Other
RATE_LIMIT_PRESETS.GRAPHQL // 100/min
RATE_LIMIT_PRESETS.WEBHOOK // 50/min
RATE_LIMIT_PRESETS.EMAIL_SEND // 10/hour
RATE_LIMIT_PRESETS.EXPORT // 3/hour
```

### Usage in API Routes

#### Basic Rate Limiting

```typescript
import { applyRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limiter'

export async function POST(request: NextRequest) {
  // Apply rate limit
  const result = await applyRateLimit(
    request,
    RATE_LIMIT_PRESETS.MESSAGE_SEND,
    'user:123' // Optional custom identifier
  )

  if (!result.allowed) {
    return Response.json(
      {
        error: 'Too many requests',
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    )
  }

  // Continue with business logic...
}
```

#### Using Middleware

```typescript
import { compose, withAuth, withRateLimit } from '@/lib/api/middleware'

export const POST = compose(
  withErrorHandler,
  withRateLimit({ limit: 10, window: 60 }),
  withAuth
)(async (request, context) => {
  // Your handler code - rate limit already applied
  return Response.json({ success: true })
})
```

### Custom Rate Limits

```typescript
const customLimit: RateLimitConfig = {
  maxRequests: 50,
  windowSeconds: 300, // 5 minutes
  burst: 10,
  keyPrefix: 'rl:custom',
}

const result = await rateLimiter.check('identifier', customLimit)
```

### Redis vs In-Memory

The rate limiter automatically uses Redis if available, falling back to in-memory:

```bash
# .env.local
REDIS_URL=redis://localhost:6379
# OR
UPSTASH_REDIS_URL=rediss://...
```

**Redis Benefits:**

- Distributed rate limiting across multiple servers
- Persistent rate limits (survive server restarts)
- Better performance for high-traffic scenarios
- Atomic operations with Lua scripts

**In-Memory Benefits:**

- No external dependencies
- Zero latency
- Good for development and low-traffic scenarios
- Automatic cleanup

## CSRF Protection

### Double-Submit Cookie Pattern

The application uses the secure double-submit cookie pattern:

```typescript
import { withCsrfProtection } from '@/lib/security/csrf'

export const POST = compose(
  withErrorHandler,
  withCsrfProtection, // Validates CSRF token
  withAuth
)(async (request, context) => {
  // CSRF token validated - safe to proceed
})
```

### Getting CSRF Token

Client-side:

```typescript
// 1. Get CSRF token
const response = await fetch('/api/csrf')
const { csrfToken, headerName } = await response.json()

// 2. Include in state-changing requests
await fetch('/api/protected', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    [headerName]: csrfToken, // Usually 'X-CSRF-Token'
  },
  body: JSON.stringify({ data: 'example' }),
})
```

### Configuration

```bash
# .env.local

# CSRF secret (required in production, auto-generated in dev)
CSRF_SECRET=your-32-character-secret-here

# Skip CSRF validation in development (optional)
SKIP_CSRF=true
```

### Token Lifecycle

- **Generation**: Random 32-byte token, HMAC-signed
- **Storage**: HTTP-only cookie (secure in production)
- **Validation**: Header token must match cookie token
- **Expiry**: 24 hours
- **Refresh**: Call `/api/csrf` to get new token

## IP Blocking

### Automatic Abuse Detection

The IP blocker automatically blocks IPs based on configurable rules:

```typescript
import { ipBlocker, DEFAULT_BLOCK_RULES } from '@/lib/security/ip-blocker'

// Automatically applied in middleware
// Triggers based on abuse patterns:
// - Failed login attempts
// - Rate limit violations
// - CSRF violations
// - SQL injection attempts
// - XSS attempts
```

### Block Rules

```typescript
DEFAULT_BLOCK_RULES = {
  FAILED_LOGIN: {
    threshold: 10, // 10 failed attempts
    windowSeconds: 900, // in 15 minutes
    blockDurationSeconds: 3600, // block for 1 hour
  },
  RATE_LIMIT_ABUSE: {
    threshold: 50, // 50 rate limit hits
    windowSeconds: 300, // in 5 minutes
    blockDurationSeconds: 7200, // block for 2 hours
  },
  SQL_INJECTION: {
    threshold: 1, // immediate block
    windowSeconds: 60,
    blockDurationSeconds: 0, // permanent
  },
  // ... more rules
}
```

### Manual IP Management

```typescript
import { ipBlocker } from '@/lib/security/ip-blocker'

// Block an IP
await ipBlocker.blockIP(
  '192.168.1.1',
  'Suspicious activity',
  3600 // 1 hour (0 = permanent)
)

// Unblock an IP
await ipBlocker.unblockIP('192.168.1.1')

// Whitelist (never block)
await ipBlocker.addToWhitelist('192.168.1.100')

// Blacklist (always block)
await ipBlocker.addToBlacklist('192.168.1.200')

// Check if blocked
const blocked = await ipBlocker.isBlocked('192.168.1.1')
if (blocked) {
  console.log(blocked.reason)
  console.log(blocked.expiresAt)
}

// Get all blocked IPs
const allBlocked = await ipBlocker.getAllBlockedIPs()
```

### Recording Abuse

```typescript
import { recordAbuseFromRequest } from '@/lib/security/ip-blocker'

// In your API route
const wasBlocked = await recordAbuseFromRequest(
  request,
  'FAILED_LOGIN',
  'medium' // severity: low | medium | high | critical
)

if (wasBlocked) {
  // IP was automatically blocked due to threshold
  console.log('IP blocked due to abuse')
}
```

### Penalty Box

Temporary blocks for immediate abuse:

```typescript
import { addToPenaltyBox, isInPenaltyBox, removeFromPenaltyBox } from '@/middleware/rate-limit'

// Add IP to penalty box (1 hour)
addToPenaltyBox('192.168.1.1', 3600)

// Check
if (isInPenaltyBox('192.168.1.1')) {
  // Blocked temporarily
}

// Remove
removeFromPenaltyBox('192.168.1.1')
```

## Response Headers

### Rate Limit Headers

All rate-limited responses include:

```
X-RateLimit-Limit: 100          // Max requests in window
X-RateLimit-Remaining: 95       // Remaining requests
X-RateLimit-Reset: 1640000000   // Unix timestamp when limit resets
Retry-After: 60                 // Seconds to wait (if rate limited)
```

### Security Headers

Applied by middleware:

```
Content-Security-Policy: ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## Error Responses

### 429 Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### 403 Forbidden (IP Blocked)

```json
{
  "error": "Access Denied",
  "message": "Your IP address has been blocked",
  "code": "IP_BLOCKED",
  "reason": "FAILED_LOGIN (10 violations)",
  "blockedAt": "2024-01-01T00:00:00.000Z",
  "retryAfter": 3600
}
```

### 403 Forbidden (CSRF)

```json
{
  "error": "Forbidden",
  "message": "Invalid or missing CSRF token",
  "code": "CSRF_VALIDATION_FAILED"
}
```

## Best Practices

### 1. Layer Your Protection

```typescript
// Use multiple layers of protection
export const POST = compose(
  withErrorHandler,      // Handle errors gracefully
  withLogging,          // Log all requests
  withCsrfProtection,   // Prevent CSRF attacks
  withAuth,             // Require authentication
  withRateLimit(...)    // Prevent abuse
)(async (request, context) => {
  // Your secure handler
})
```

### 2. Use Appropriate Rate Limits

- **Auth endpoints**: Very strict (3-5/min)
- **Read operations**: Lenient (100/min)
- **Write operations**: Moderate (10-20/min)
- **Expensive operations**: Strict (5/min)

### 3. Provide Clear Error Messages

```typescript
if (!result.allowed) {
  return Response.json(
    {
      error: 'Too Many Requests',
      message: `You've sent too many messages. Please wait ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      helpUrl: 'https://docs.example.com/rate-limits',
    },
    { status: 429 }
  )
}
```

### 4. Monitor and Alert

```typescript
// Log rate limit violations
if (!result.allowed) {
  console.warn('[RateLimit]', {
    identifier: 'user:123',
    endpoint: '/api/messages',
    limit: result.limit,
    timestamp: new Date().toISOString(),
  })

  // Send to monitoring service
  captureMessage('Rate limit exceeded', {
    tags: { endpoint: '/api/messages' },
    extra: { identifier: 'user:123', limit: result.limit },
  })
}
```

### 5. Test Rate Limits

```typescript
// __tests__/rate-limit.test.ts
import { clearAllRateLimits } from '@/middleware/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits() // Clear between tests
  })

  it('should block after limit exceeded', async () => {
    // Make 11 requests (limit is 10)
    for (let i = 0; i < 11; i++) {
      const response = await fetch('/api/test')
      if (i < 10) {
        expect(response.status).toBe(200)
      } else {
        expect(response.status).toBe(429)
      }
    }
  })
})
```

## Environment Variables

```bash
# Redis (optional, falls back to in-memory)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_URL=rediss://...

# CSRF Protection
CSRF_SECRET=your-32-character-secret-minimum
SKIP_CSRF=true  # Development only

# Skip validation during build
SKIP_ENV_VALIDATION=true
```

## Monitoring

### Rate Limit Status Endpoint

```typescript
// GET /api/rate-limit-status
import { getRateLimitStatus } from '@/middleware/rate-limit'

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('path') || '/api/messages'
  const status = getRateLimitStatus(request, pathname)

  return Response.json({
    limit: status.limit,
    remaining: status.remaining,
    reset: new Date(status.reset * 1000).toISOString(),
    allowed: status.allowed,
  })
}
```

### Blocked IPs Dashboard

```typescript
// GET /api/admin/blocked-ips
import { ipBlocker } from '@/lib/security/ip-blocker'

export async function GET() {
  const blocked = await ipBlocker.getAllBlockedIPs()
  const whitelist = await ipBlocker.getWhitelist()
  const blacklist = await ipBlocker.getBlacklist()

  return Response.json({
    blocked: blocked.map((b) => ({
      ip: b.ip,
      reason: b.reason,
      blockedAt: new Date(b.blockedAt).toISOString(),
      expiresAt: b.expiresAt ? new Date(b.expiresAt).toISOString() : null,
      type: b.blockType,
    })),
    whitelist,
    blacklist,
    stats: {
      totalBlocked: blocked.length,
      totalWhitelisted: whitelist.length,
      totalBlacklisted: blacklist.length,
    },
  })
}
```

## Example: Complete Protected Endpoint

See `/src/app/api/example-protected/route.ts` for a complete example implementing all protections.

## Troubleshooting

### Rate Limit Not Working

1. Check Redis connection:

   ```bash
   # Test Redis connection
   redis-cli ping
   ```

2. Check logs for errors:

   ```bash
   # Look for [RateLimiter] errors
   ```

3. Verify environment variables

### False Positives

If legitimate users are being blocked:

1. Adjust rate limit thresholds
2. Add to whitelist:
   ```typescript
   await ipBlocker.addToWhitelist('trusted-ip')
   ```
3. Review block rules

### Performance Issues

1. Use Redis for distributed systems
2. Adjust cleanup intervals
3. Consider using edge middleware only
4. Monitor Redis memory usage

## Security Considerations

1. **Always use HTTPS in production** - Required for secure cookies
2. **Set strong CSRF_SECRET** - Minimum 32 characters
3. **Monitor rate limit violations** - Alert on suspicious patterns
4. **Regularly review blocked IPs** - Clean up expired blocks
5. **Test your limits** - Ensure they work as expected
6. **Use whitelisting carefully** - Only for trusted IPs
7. **Log security events** - For audit and forensics

## Migration Guide

### From Basic to Advanced

```typescript
// Before
export async function POST(request: NextRequest) {
  // No protection
  return Response.json({ success: true })
}

// After
export const POST = compose(
  withErrorHandler,
  withLogging,
  withCsrfProtection,
  withAuth,
  withRateLimit({ limit: 10, window: 60 })
)(async (request: AuthenticatedRequest, context) => {
  return successResponse({ success: true })
})
```

## Related Documentation

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [CSRF Protection](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
