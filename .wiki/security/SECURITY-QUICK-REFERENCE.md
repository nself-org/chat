# Security Quick Reference Card

**Last Updated**: January 31, 2026

---

## Quick Commands

### Before Every Commit

```bash
# 1. Run linting
npm run lint

# 2. Type check
npm run type-check

# 3. Security audit
npm audit --audit-level=high

# 4. Run tests
npm test

# 5. Check for secrets
git diff --cached | grep -i "secret\|password\|api.key"
```

### Before Every Deployment

```bash
# 1. Security audit
npm audit

# 2. Build test
npm run build

# 3. Verify no dev auth
grep "NEXT_PUBLIC_USE_DEV_AUTH" .env.production

# 4. Check security headers
curl -I https://your-domain.com | grep -i "content-security\|strict-transport"
```

---

## Middleware Patterns

### Protect API Route (Full Stack)

```typescript
import {
  compose,
  withErrorHandler,
  withRateLimit,
  withCsrfProtection,
  withAuth,
  withAdmin,
} from '@/lib/api/middleware'

export const POST = compose(
  withErrorHandler, // 1. Catch errors
  withRateLimit({ limit: 10, window: 60 }), // 2. Rate limit
  withCsrfProtection, // 3. CSRF check
  withAuth, // 4. Require auth
  withAdmin // 5. Require admin role
)(handler)
```

### Common Combinations

```typescript
// Public endpoint (rate limited)
export const GET = compose(withErrorHandler, withRateLimit({ limit: 100, window: 60 }))(handler)

// Authenticated endpoint
export const POST = compose(
  withErrorHandler,
  withRateLimit({ limit: 30, window: 60 }),
  withAuth
)(handler)

// Admin-only endpoint with CSRF
export const PUT = compose(withErrorHandler, withCsrfProtection, withAuth, withAdmin)(handler)
```

---

## Input Validation

### Use Zod Schemas

```typescript
import { validateRequestBody } from '@/lib/validation/validate'
import { sendMessageSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  // Automatically validates and throws on error
  const body = await validateRequestBody(request, sendMessageSchema)

  // body is now typed and validated
  const { channelId, content } = body
}
```

### Available Schemas

```typescript
// Authentication
;(signInSchema, signUpSchema, changePasswordSchema)

// User management
;(updateProfileSchema, updateSettingsSchema)

// Channels
;(createChannelSchema, updateChannelSchema)

// Messages
;(sendMessageSchema, updateMessageSchema, addReactionSchema)

// File uploads
uploadInitSchema

// Configuration
updateConfigSchema

// Search
searchSchema
```

### Custom Validation

```typescript
import { z } from 'zod'

const customSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18),
  username: z.string().regex(/^[a-zA-Z0-9_]+$/),
})
```

---

## Security Checklist

### ✅ DO

- [ ] Use middleware for all API routes
- [ ] Validate all user input with Zod
- [ ] Use parameterized queries
- [ ] Rate limit critical endpoints
- [ ] Return generic error messages
- [ ] Log errors (but not sensitive data)
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags
- [ ] Sanitize HTML before rendering

### ❌ DON'T

- [ ] Trust client-side validation
- [ ] Use string concatenation in SQL
- [ ] Expose stack traces
- [ ] Store passwords in plain text
- [ ] Use wildcard CORS with credentials
- [ ] Put secrets in code
- [ ] Skip authentication checks
- [ ] Allow unrestricted file uploads

---

## Common Vulnerabilities

### SQL Injection

```typescript
// ❌ BAD
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ GOOD
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

### XSS

```typescript
// ❌ BAD
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### CSRF

```typescript
// ❌ BAD (no protection)
export async function POST(request: NextRequest) {
  // Handle request
}

// ✅ GOOD (with CSRF protection)
export const POST = compose(withErrorHandler, withCsrfProtection, withAuth)(handler)
```

### Insecure File Upload

```typescript
// ❌ BAD
const filePath = `/uploads/${userFilename}`

// ✅ GOOD
import { randomUUID } from 'crypto'
import { sanitizeFilename } from '@/lib/validation/validate'

const safeFilename = sanitizeFilename(userFilename)
const filePath = `/uploads/${randomUUID()}-${safeFilename}`
```

---

## Rate Limiting

### Standard Limits

```typescript
// Login/signup
{ limit: 5, window: 900 }   // 5 per 15 min

// File upload
{ limit: 30, window: 60 }   // 30 per minute

// API calls
{ limit: 100, window: 60 }  // 100 per minute

// Webhooks
{ limit: 60, window: 60 }   // 60 per minute
```

### Custom Rate Limit

```typescript
import { withRateLimit } from '@/lib/api/middleware'

export const POST = withRateLimit({
  limit: 10, // 10 requests
  window: 60, // per minute
  keyGenerator: (req) => {
    // per user
    const user = getAuthenticatedUser(req)
    return `user:${user?.id || getClientIp(req)}`
  },
})(handler)
```

---

## CSRF Protection

### Server-Side

```typescript
import { withCsrfProtection } from '@/lib/security/csrf'

export const POST = compose(withErrorHandler, withCsrfProtection, withAuth)(handler)
```

### Client-Side

```typescript
// Get CSRF token
const response = await fetch('/api/csrf')
const { csrfToken, headerName } = await response.json()

// Include in requests
fetch('/api/protected', {
  method: 'POST',
  headers: {
    [headerName]: csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
```

---

## Error Handling

### Safe Error Responses

```typescript
import { errorResponse, internalErrorResponse } from '@/lib/api/response'

try {
  // Operation
} catch (error) {
  // ✅ Log internal details
  console.error('Detailed error:', error)

  // ✅ Return generic message
  return internalErrorResponse('Operation failed')
}
```

### Error Response Types

```typescript
// 400 Bad Request
badRequestResponse('Invalid input', 'INVALID_INPUT')

// 401 Unauthorized
unauthorizedResponse('Authentication required')

// 403 Forbidden
forbiddenResponse('Insufficient permissions')

// 404 Not Found
notFoundResponse('Resource not found')

// 429 Too Many Requests
rateLimitResponse(900) // retry after 900s

// 500 Internal Server Error
internalErrorResponse('Operation failed')
```

---

## Secrets Management

### Environment Variables

```bash
# ✅ GOOD: Required, no defaults
const SECRET = process.env.SECRET
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SECRET must be set')
}

# ❌ BAD: Weak default
const SECRET = process.env.SECRET || 'default123'
```

### Generate Secure Secrets

```bash
# Generate 32-byte secrets
openssl rand -base64 32

# Generate UUIDs
uuidgen
```

### .env Files

```bash
# .env.local (development - gitignored)
JWT_SECRET=dev-secret-change-in-production
DATABASE_URL=postgresql://localhost:5432/nchat_dev

# .env.production (production - gitignored)
JWT_SECRET=<actual-production-secret>
DATABASE_URL=<actual-production-url>

# .env.example (committed to git)
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=your-database-url-here
```

---

## Testing Security

### Authentication Tests

```typescript
describe('POST /api/protected', () => {
  it('requires authentication', async () => {
    const response = await fetch('/api/protected', { method: 'POST' })
    expect(response.status).toBe(401)
  })

  it('requires correct role', async () => {
    const response = await fetch('/api/protected', {
      method: 'POST',
      headers: { Authorization: 'Bearer member-token' },
    })
    expect(response.status).toBe(403)
  })
})
```

### Input Validation Tests

```typescript
import { emailSchema } from '@/lib/validation/schemas'

describe('Email Validation', () => {
  it('blocks SQL injection', () => {
    expect(() => emailSchema.parse("admin' OR '1'='1")).toThrow()
  })

  it('validates format', () => {
    expect(() => emailSchema.parse('invalid-email')).toThrow()
    expect(emailSchema.parse('valid@example.com')).toBe('valid@example.com')
  })
})
```

### Rate Limiting Tests

```typescript
describe('Rate Limiting', () => {
  it('blocks after limit', async () => {
    // Make 6 requests (limit is 5)
    const requests = Array(6)
      .fill(null)
      .map(() => fetch('/api/signin', { method: 'POST', body: '{}' }))
    const responses = await Promise.all(requests)
    expect(responses[5].status).toBe(429)
  })
})
```

---

## Emergency Response

### Security Incident

```bash
# 1. Rotate all secrets immediately
openssl rand -base64 32 > new-secret.txt

# 2. Review access logs
tail -f /var/log/nginx/access.log | grep "suspicious-pattern"

# 3. Notify team
# Email security@nself.org with details

# 4. Deploy fix
git commit -m "security: fix vulnerability"
git push origin main

# 5. Post-mortem
# Document in docs/security/incidents/
```

### Compromised Credentials

```bash
# 1. Invalidate all sessions
# Update JWT_SECRET and restart

# 2. Force password reset
# Send reset emails to all users

# 3. Review access logs
# Check for unauthorized access

# 4. Notify users
# Email notification of breach
```

---

## Resources

### Documentation

- [Security Audit Report](./security-audit.md)
- [Security Best Practices](./security-best-practices.md)
- [Security Policy](./SECURITY.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Tools

- `npm audit` - Dependency scanning
- `curl -I` - Check headers
- `openssl rand` - Generate secrets

---

**Keep this card handy during development!**
