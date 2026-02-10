# Rate Limiting & API Protection - Quick Start Guide

Get started with rate limiting and API protection in 5 minutes.

## 1. Setup (Optional: Redis)

For production, use Redis for distributed rate limiting:

```bash
# Option A: Local Redis (development)
docker run -d -p 6379:6379 redis:alpine

# Option B: Upstash (production - serverless)
# Sign up at https://upstash.com
# Copy your Redis URL
```

Add to `.env.local`:

```bash
# Redis (optional - uses in-memory if not set)
REDIS_URL=redis://localhost:6379
# OR for Upstash
UPSTASH_REDIS_URL=rediss://your-upstash-url

# CSRF Secret (required for production)
CSRF_SECRET=your-32-character-minimum-secret-here
```

## 2. Protect an API Route (Basic)

```typescript
// src/app/api/my-endpoint/route.ts
import { NextRequest } from 'next/server'
import { applyRateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limiter'

export async function POST(request: NextRequest) {
  // 1. Apply rate limit
  const result = await applyRateLimit(
    request,
    RATE_LIMIT_PRESETS.MESSAGE_SEND // 10 requests/min
  )

  if (!result.allowed) {
    return Response.json(
      { error: 'Too many requests', retryAfter: result.retryAfter },
      { status: 429 }
    )
  }

  // 2. Your business logic
  return Response.json({ success: true })
}
```

## 3. Protect with Middleware (Advanced)

```typescript
// src/app/api/protected/route.ts
import { compose, withErrorHandler, withAuth, withLogging } from '@/lib/api/middleware'
import { withCsrfProtection } from '@/lib/security/csrf'

// Stack multiple protections
export const POST = compose(
  withErrorHandler, // Catch errors
  withLogging, // Log requests
  withCsrfProtection, // Prevent CSRF
  withAuth // Require auth
)(async (request, context) => {
  // Your handler - fully protected!
  return Response.json({ success: true })
})
```

## 4. Client-Side: Get CSRF Token

```typescript
// In your React component or API client

// 1. Get CSRF token
const getCsrfToken = async () => {
  const response = await fetch('/api/csrf')
  const { csrfToken, headerName } = await response.json()
  return { csrfToken, headerName }
}

// 2. Use in POST requests
const makeProtectedRequest = async (data) => {
  const { csrfToken, headerName } = await getCsrfToken()

  const response = await fetch('/api/protected', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [headerName]: csrfToken, // Usually 'X-CSRF-Token'
    },
    body: JSON.stringify(data),
  })

  return response.json()
}
```

## 5. Handle Rate Limit Responses

```typescript
// Client-side error handling
const makeRequest = async () => {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify({ data: 'example' }),
  })

  if (response.status === 429) {
    const error = await response.json()
    const retryAfter = response.headers.get('Retry-After')

    // Show user-friendly message
    toast.error(`Too many requests. Please wait ${retryAfter} seconds.`)

    // Optional: Auto-retry after delay
    setTimeout(() => makeRequest(), parseInt(retryAfter) * 1000)
    return
  }

  return response.json()
}
```

## 6. Admin: Manage IP Blocks

```typescript
// Block an IP (requires admin role)
await fetch('/api/admin/ip-blocks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    ip: '192.168.1.1',
    reason: 'Abuse detected',
    duration: 3600, // 1 hour (0 = permanent)
  }),
})

// View all blocked IPs
const { blocked, whitelist, blacklist, stats } = await fetch('/api/admin/ip-blocks').then((r) =>
  r.json()
)

// Unblock an IP
await fetch('/api/admin/ip-blocks?ip=192.168.1.1', {
  method: 'DELETE',
})

// Whitelist an IP (never block)
await fetch('/api/admin/ip-blocks/whitelist', {
  method: 'POST',
  body: JSON.stringify({ ip: '192.168.1.100' }),
})
```

## 7. Custom Rate Limits

```typescript
import { rateLimiter } from '@/lib/api/rate-limiter'

// Create custom limit
const customLimit = {
  maxRequests: 50,
  windowSeconds: 300, // 5 minutes
  burst: 10,
  keyPrefix: 'rl:custom',
}

// Use it
const result = await rateLimiter.check('user:123', customLimit)
```

## 8. Record Abuse Events

```typescript
import { recordAbuseFromRequest } from '@/lib/security/ip-blocker'

// In your API route
export async function POST(request: NextRequest) {
  // ... authentication logic ...

  if (loginFailed) {
    // Record the abuse event
    const wasBlocked = await recordAbuseFromRequest(request, 'FAILED_LOGIN', 'medium')

    if (wasBlocked) {
      // IP was auto-blocked due to too many failures
      return Response.json({ error: 'IP blocked due to abuse' }, { status: 403 })
    }
  }
}
```

## Available Rate Limit Presets

```typescript
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limiter'

// Authentication
RATE_LIMIT_PRESETS.AUTH // 5/min
RATE_LIMIT_PRESETS.AUTH_SIGNUP // 3/hour
RATE_LIMIT_PRESETS.AUTH_RESET // 3/15min

// Messaging
RATE_LIMIT_PRESETS.MESSAGE_SEND // 10/min + 5 burst
RATE_LIMIT_PRESETS.MESSAGE_EDIT // 20/min

// File Operations
RATE_LIMIT_PRESETS.FILE_UPLOAD // 5/min
RATE_LIMIT_PRESETS.FILE_UPLOAD_LARGE // 2/5min

// Search & AI
RATE_LIMIT_PRESETS.SEARCH // 20/min + 10 burst
RATE_LIMIT_PRESETS.AI_QUERY // 10/min

// General
RATE_LIMIT_PRESETS.API_USER // 100/min + 20 burst
RATE_LIMIT_PRESETS.API_IP // 500/min
RATE_LIMIT_PRESETS.GRAPHQL // 100/min
RATE_LIMIT_PRESETS.WEBHOOK // 50/min
```

## Automatic IP Blocking Rules

The system automatically blocks IPs based on these patterns:

| Rule             | Threshold     | Window  | Block Duration |
| ---------------- | ------------- | ------- | -------------- |
| FAILED_LOGIN     | 10 failures   | 15 min  | 1 hour         |
| RATE_LIMIT_ABUSE | 50 violations | 5 min   | 2 hours        |
| CSRF_VIOLATION   | 3 violations  | 5 min   | 2 hours        |
| SPAM_DETECTED    | 20 messages   | 1 hour  | 12 hours       |
| SQL_INJECTION    | 1 attempt     | instant | permanent      |
| XSS_ATTEMPT      | 1 attempt     | instant | permanent      |

## Middleware Layers (Automatic)

Your middleware (`src/middleware.ts`) automatically applies:

1. ✅ IP blocking check (whitelist/blacklist)
2. ✅ Penalty box check (temporary blocks)
3. ✅ Rate limiting (API routes)
4. ✅ Security headers (CSP, HSTS, etc.)

## Testing

```bash
# Run rate limiter tests
pnpm test src/lib/api/__tests__/rate-limiter.test.ts

# Test an endpoint manually
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' \
  -v  # View headers including rate limit info
```

## Common Patterns

### Pattern 1: Public endpoint with IP-based limiting

```typescript
export async function POST(request: NextRequest) {
  const result = await applyRateLimit(
    request,
    RATE_LIMIT_PRESETS.API_IP // IP-based, high limit
  )

  if (!result.allowed) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  // Public logic
}
```

### Pattern 2: Authenticated endpoint with user-based limiting

```typescript
export const POST = compose(withAuth)(async (request: AuthenticatedRequest) => {
  const result = await applyRateLimit(
    request,
    RATE_LIMIT_PRESETS.MESSAGE_SEND,
    `user:${request.user.id}` // User-specific limit
  )

  if (!result.allowed) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  // Authenticated logic
})
```

### Pattern 3: Combined protection (recommended)

```typescript
export const POST = compose(
  withErrorHandler, // Handle errors
  withLogging, // Log requests
  withCsrfProtection, // CSRF check
  withAuth // Auth check
)(async (request: AuthenticatedRequest) => {
  // Rate limit after auth
  const result = await applyRateLimit(
    request,
    RATE_LIMIT_PRESETS.MESSAGE_SEND,
    `user:${request.user.id}`
  )

  if (!result.allowed) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  // Fully protected logic
})
```

## Debugging

### Check rate limit status without consuming

```typescript
import { rateLimiter } from '@/lib/api/rate-limiter'

// Get status without incrementing counter
const status = await rateLimiter.status('user:123', RATE_LIMIT_PRESETS.MESSAGE_SEND)

console.log('Remaining:', status.remaining)
console.log('Reset at:', new Date(status.reset * 1000))
```

### View rate limit headers

```bash
# Make a request and view headers
curl -X GET http://localhost:3000/api/endpoint -v

# Look for:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1640000000
```

### Clear rate limits (testing)

```typescript
import { clearAllRateLimits } from '@/middleware/rate-limit'

// Clear all rate limits (useful in tests)
clearAllRateLimits()
```

## Production Checklist

- [ ] Set `REDIS_URL` or `UPSTASH_REDIS_URL`
- [ ] Set strong `CSRF_SECRET` (32+ characters)
- [ ] Enable HTTPS
- [ ] Test rate limits with your traffic patterns
- [ ] Set up monitoring for rate limit violations
- [ ] Configure alerting for IP blocks
- [ ] Review and adjust preset limits
- [ ] Test CSRF protection
- [ ] Document rate limits for API consumers

## Resources

- **Full Documentation**: `/docs/Rate-Limiting-API-Protection.md`
- **Example Code**: `/src/app/api/example-protected/route.ts`
- **Tests**: `/src/lib/api/__tests__/rate-limiter.test.ts`
- **Implementation Status**: `/RATE-LIMITING-IMPLEMENTATION.md`

## Need Help?

Common issues and solutions:

**Rate limits not working?**

- Check Redis connection
- Verify environment variables
- Check logs for errors

**Too many false positives?**

- Adjust thresholds
- Add IPs to whitelist
- Review block rules

**Performance issues?**

- Use Redis instead of in-memory
- Adjust cleanup intervals
- Check Redis memory usage

---

**You're ready! 🚀**

Start with Pattern 3 (combined protection) for most endpoints, and adjust rate limits based on your needs.
