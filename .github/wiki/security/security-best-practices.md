# Security Best Practices for nself-chat Developers

**Last Updated**: January 31, 2026
**Version**: 1.0.0

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation](#input-validation)
3. [API Security](#api-security)
4. [Database Security](#database-security)
5. [File Upload Security](#file-upload-security)
6. [Frontend Security](#frontend-security)
7. [Secrets Management](#secrets-management)
8. [Error Handling](#error-handling)
9. [Testing Security](#testing-security)
10. [Code Review Guidelines](#code-review-guidelines)

---

## Authentication & Authorization

### DO ✅

**Always use middleware for protected routes:**

```typescript
// Good: Composable middleware pattern
export const POST = compose(
  withErrorHandler,
  withRateLimit({ limit: 10, window: 60 }),
  withAuth,
  withAdmin
)(handler)
```

**Validate user permissions at every level:**

```typescript
// Good: Check permissions before action
async function deleteChannel(channelId: string, userId: string) {
  const canDelete = await checkPermission(userId, channelId, 'DELETE_CHANNEL')
  if (!canDelete) {
    throw new ApiError('Insufficient permissions', 'FORBIDDEN', 403)
  }
  // Proceed with deletion
}
```

**Use strong password requirements:**

```typescript
// Good: Comprehensive password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain special character')
```

### DON'T ❌

**Never trust client-side validation alone:**

```typescript
// Bad: Only client-side check
if (user.role === 'admin') {
  // Allow admin action
}

// Good: Server-side verification
const user = await getAuthenticatedUser(request)
if (!['owner', 'admin'].includes(user.role)) {
  throw new ApiError('Forbidden', 'FORBIDDEN', 403)
}
```

**Never expose sensitive user data:**

```typescript
// Bad: Returning password hash
return { ...user, password: user.encrypted_password }

// Good: Exclude sensitive fields
const { encrypted_password, ...safeUser } = user
return safeUser
```

---

## Input Validation

### DO ✅

**Always validate input with Zod schemas:**

```typescript
// Good: Comprehensive validation
import { validateRequestBody } from '@/lib/validation/validate'
import { sendMessageSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  const body = await validateRequestBody(request, sendMessageSchema)
  // body is now typed and validated
}
```

**Sanitize user-generated content:**

```typescript
// Good: HTML sanitization
import { sanitizeHtml } from '@/lib/validation/validate'

const safeContent = sanitizeHtml(userInput)
```

**Validate file uploads thoroughly:**

```typescript
// Good: Multi-layer validation
const uploadInitSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename'),
  contentType: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i),
  size: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, 'Max 100MB'),
})
```

### DON'T ❌

**Never trust raw request data:**

```typescript
// Bad: Direct use of request data
const { email, password } = await request.json()
await db.query(`SELECT * FROM users WHERE email = '${email}'`)

// Good: Parameterized query with validation
const { email } = await validateRequestBody(request, signInSchema)
await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

**Never allow unvalidated redirects:**

```typescript
// Bad: Open redirect vulnerability
const redirectTo = request.query.get('redirect')
return NextResponse.redirect(redirectTo)

// Good: Validate against whitelist
const redirectTo = request.query.get('redirect')
const allowedUrls = ['/dashboard', '/profile', '/settings']
if (!allowedUrls.includes(redirectTo)) {
  return NextResponse.redirect('/dashboard')
}
```

---

## API Security

### DO ✅

**Implement rate limiting on all endpoints:**

```typescript
// Good: Aggressive rate limiting on auth endpoints
export const POST = compose(
  withErrorHandler,
  withRateLimit({ limit: 5, window: 900 }) // 5 per 15 min
)(handleSignIn)
```

**Use CSRF protection for state-changing operations:**

```typescript
// Good: CSRF protection on mutations
export const POST = compose(withErrorHandler, withCsrfProtection, withAuth)(handleUpdate)
```

**Return consistent error responses:**

```typescript
// Good: Structured error response
return errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401, { attemptedEmail: email })
```

### DON'T ❌

**Never expose stack traces in production:**

```typescript
// Bad: Leaking implementation details
catch (error) {
  return NextResponse.json({ error: error.stack }, { status: 500 })
}

// Good: Generic error message
catch (error) {
  console.error('Internal error:', error) // Log for debugging
  return internalErrorResponse('An error occurred')
}
```

**Never allow unrestricted CORS:**

```typescript
// Bad: Wildcard CORS with credentials
withCors({
  origin: '*',
  credentials: true,
})

// Good: Specific origins
withCors({
  origin: ['https://nchat.app', 'https://app.nchat.io'],
  credentials: true,
})
```

---

## Database Security

### DO ✅

**Always use parameterized queries:**

```typescript
// Good: Parameterized PostgreSQL query
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

**Use GraphQL with Hasura (auto-parameterized):**

```typescript
// Good: GraphQL mutation (safe by default)
const { data } = await apolloClient.mutate({
  mutation: UPDATE_USER,
  variables: { id, updates },
})
```

**Implement row-level security:**

```sql
-- Good: RLS policy
CREATE POLICY user_access ON messages
  FOR SELECT
  USING (
    user_id = current_user_id()
    OR channel_id IN (SELECT id FROM user_channels WHERE user_id = current_user_id())
  );
```

### DON'T ❌

**Never build SQL queries with string concatenation:**

```typescript
// Bad: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`
await pool.query(query)

// Good: Use parameters
await pool.query('SELECT * FROM users WHERE email = $1', [email])
```

**Never store passwords in plain text:**

```typescript
// Bad: Plain text password
await db.users.insert({ email, password })

// Good: Hashed with bcrypt
const hashedPassword = await bcrypt.hash(password, 12)
await db.users.insert({ email, encrypted_password: hashedPassword })
```

---

## File Upload Security

### DO ✅

**Validate file types with multiple checks:**

```typescript
// Good: Multi-layer file validation
function validateFile(file: File) {
  // 1. Extension check
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type')
  }

  // 2. MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid MIME type')
  }

  // 3. Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  // 4. Magic number check (optional)
  const magicNumber = await readMagicNumber(file)
  if (!isValidMagicNumber(magicNumber, ext)) {
    throw new Error('File content does not match extension')
  }
}
```

**Generate unique, unpredictable filenames:**

```typescript
// Good: UUID-based filename
import { randomUUID } from 'crypto'

const fileId = randomUUID()
const ext = filename.split('.').pop()
const key = `uploads/${year}/${month}/${day}/${fileId}.${ext}`
```

**Use presigned URLs with expiration:**

```typescript
// Good: Short-lived presigned URL
const presignedUrl = await generatePresignedUrl(
  bucket,
  key,
  contentType,
  900 // 15 minutes
)
```

### DON'T ❌

**Never trust user-provided filenames:**

```typescript
// Bad: Using user filename directly
const filePath = `/uploads/${userFilename}`

// Good: Sanitize and generate safe filename
const safeFilename = sanitizeFilename(userFilename)
const filePath = `/uploads/${randomUUID()}-${safeFilename}`
```

**Never allow executable uploads:**

```typescript
// Bad: Allowing any file type
const ALLOWED_TYPES = ['*']

// Good: Explicit whitelist
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
```

---

## Frontend Security

### DO ✅

**Use Content Security Policy:**

```typescript
// Good: Restrictive CSP in next.config.js
headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{NONCE}'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
    ].join('; '),
  },
]
```

**Sanitize before rendering user content:**

```typescript
// Good: Using DOMPurify for rich content
import DOMPurify from 'dompurify'

function MessageContent({ html }: { html: string }) {
  const sanitized = DOMPurify.sanitize(html)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}
```

**Use secure cookie settings:**

```typescript
// Good: Secure cookie configuration
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 86400,
})
```

### DON'T ❌

**Never use dangerouslySetInnerHTML without sanitization:**

```typescript
// Bad: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Good: Sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

**Never store sensitive data in localStorage:**

```typescript
// Bad: Sensitive data in localStorage
localStorage.setItem('accessToken', token)
localStorage.setItem('password', password)

// Good: Use httpOnly cookies for tokens, never store passwords
// Token stored in httpOnly cookie (not accessible to JavaScript)
```

---

## Secrets Management

### DO ✅

**Use environment variables for secrets:**

```typescript
// Good: Environment variable with validation
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured')
}
```

**Use a secrets manager in production:**

```typescript
// Good: AWS Secrets Manager integration
import { SecretsManager } from '@aws-sdk/client-secrets-manager'

async function getSecret(secretName: string) {
  const client = new SecretsManager({ region: 'us-east-1' })
  const response = await client.getSecretValue({ SecretId: secretName })
  return JSON.parse(response.SecretString)
}
```

**Rotate secrets regularly:**

```typescript
// Good: Implement secret rotation
async function rotateJwtSecret() {
  const newSecret = generateSecureSecret(32)
  await secretsManager.updateSecret('JWT_SECRET', newSecret)
  await notifyServices('JWT_SECRET rotated')
}
```

### DON'T ❌

**Never commit secrets to version control:**

```bash
# Bad: Secrets in .env file committed to Git
.env

# Good: .env in .gitignore
# Use .env.example with placeholder values
```

**Never use default or weak secrets:**

```typescript
// Bad: Weak default secret
const SECRET = process.env.SECRET || 'secret123'

// Good: Require strong secret, no defaults
const SECRET = process.env.SECRET
if (!SECRET) {
  throw new Error('SECRET environment variable is required')
}
if (SECRET.length < 32) {
  throw new Error('SECRET must be at least 32 characters')
}
```

**Never log sensitive information:**

```typescript
// Bad: Logging passwords
console.log('User login:', { email, password })

// Good: Log only non-sensitive data
console.log('User login:', { email })
```

---

## Error Handling

### DO ✅

**Use structured error handling:**

```typescript
// Good: Structured error with context
try {
  await processPayment(amount)
} catch (error) {
  if (error instanceof PaymentError) {
    return errorResponse('Payment failed', 'PAYMENT_ERROR', 400, { reason: error.reason })
  }
  throw error // Re-throw unexpected errors
}
```

**Log errors with context:**

```typescript
// Good: Contextual error logging
catch (error) {
  console.error('Payment processing failed:', {
    userId,
    amount,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error'
  })
  return internalErrorResponse()
}
```

### DON'T ❌

**Never expose internal errors to users:**

```typescript
// Bad: Exposing database errors
catch (error) {
  return NextResponse.json({
    error: 'Database query failed',
    details: error.message, // ❌ Leaks internal details
    query: sql // ❌ Exposes SQL
  })
}

// Good: Generic error message
catch (error) {
  console.error('Database error:', error) // Log internally
  return internalErrorResponse('An error occurred')
}
```

**Never suppress errors silently:**

```typescript
// Bad: Silent failure
try {
  await importantOperation()
} catch {
  // Ignored
}

// Good: Log and handle appropriately
try {
  await importantOperation()
} catch (error) {
  console.error('Important operation failed:', error)
  await notifyAdmins(error)
  throw error
}
```

---

## Testing Security

### DO ✅

**Write security-focused tests:**

```typescript
// Good: Test authentication
describe('POST /api/config', () => {
  it('requires authentication', async () => {
    const response = await fetch('/api/config', {
      method: 'POST',
      body: JSON.stringify({ branding: { appName: 'Test' } }),
    })
    expect(response.status).toBe(401)
  })

  it('requires admin role', async () => {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { Authorization: 'Bearer member-token' },
      body: JSON.stringify({ branding: { appName: 'Test' } }),
    })
    expect(response.status).toBe(403)
  })
})
```

**Test input validation:**

```typescript
// Good: Test validation boundaries
describe('Input Validation', () => {
  it('rejects SQL injection attempts', () => {
    const malicious = "admin' OR '1'='1"
    expect(() => emailSchema.parse(malicious)).toThrow()
  })

  it('rejects XSS attempts', () => {
    const malicious = "<script>alert('XSS')</script>"
    const result = safeTextSchema.parse(malicious)
    expect(result).not.toContain('<script>')
  })
})
```

**Test rate limiting:**

```typescript
// Good: Verify rate limiting works
describe('Rate Limiting', () => {
  it('blocks after limit exceeded', async () => {
    // Make 6 requests (limit is 5)
    const requests = Array(6)
      .fill(null)
      .map(() =>
        fetch('/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
        })
      )
    const responses = await Promise.all(requests)
    const lastResponse = responses[responses.length - 1]
    expect(lastResponse.status).toBe(429) // Too Many Requests
  })
})
```

### DON'T ❌

**Never skip security tests:**

```typescript
// Bad: Skipping security tests
it.skip('SQL injection protection', () => {
  /* ... */
})

// Good: Fix the test or the code
it('SQL injection protection', () => {
  // Test implementation
})
```

---

## Code Review Guidelines

### Security Checklist for Pull Requests

**Authentication & Authorization:**

- [ ] All new endpoints have appropriate authentication
- [ ] Role-based access control properly implemented
- [ ] No authentication bypasses in conditional logic

**Input Validation:**

- [ ] All user input validated with Zod schemas
- [ ] No direct use of `request.json()` without validation
- [ ] File uploads properly validated

**SQL & Database:**

- [ ] All queries parameterized (no string concatenation)
- [ ] No raw SQL with user input
- [ ] GraphQL queries use variables, not inline values

**Secrets & Configuration:**

- [ ] No hardcoded secrets or API keys
- [ ] Environment variables properly used
- [ ] No secrets in logs or error messages

**Error Handling:**

- [ ] Errors don't expose sensitive information
- [ ] Generic error messages for users
- [ ] Detailed errors only in server logs

**Dependencies:**

- [ ] New dependencies security-scanned
- [ ] No known vulnerabilities in new packages
- [ ] Dependency versions locked

**Frontend:**

- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] User content properly escaped
- [ ] No sensitive data in client-side storage

**Testing:**

- [ ] Security tests included for new features
- [ ] Edge cases tested
- [ ] Negative tests (invalid input) included

### Red Flags in Code Reviews 🚩

- String concatenation in SQL queries
- `ignoreBuildErrors` or disabled linting
- Wildcard CORS configuration
- Default passwords or secrets
- `eval()` or `Function()` with user input
- Disabled security middleware
- Direct file system access with user input
- Unvalidated redirects
- Missing rate limiting on new endpoints
- Authentication checks in frontend only

---

## Security Resources

### Documentation

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [GraphQL Security Best Practices](https://graphql.org/learn/best-practices/)

### Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerability scanning
- [Snyk](https://snyk.io/) - Continuous security monitoring
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration testing
- [SonarQube](https://www.sonarqube.org/) - Static code analysis

### Training

- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - Security training
- [PortSwigger Web Security Academy](https://portswigger.net/web-security) - Free courses
- [HackerOne CTF](https://www.hackerone.com/for-hackers/hacker101) - Capture the Flag challenges

---

## Quick Reference Card

### Before Every Commit

```bash
# 1. Run linting and type checking
npm run lint
npm run type-check

# 2. Check for security vulnerabilities
npm audit --audit-level=high

# 3. Run tests including security tests
npm test

# 4. Verify no secrets committed
git diff --cached | grep -i "secret\|password\|api.key"
```

### Before Every Deployment

```bash
# 1. Rotate secrets
# 2. Review environment variables
# 3. Run full security audit
npm audit
# 4. Check security headers
# 5. Verify rate limiting
# 6. Test authentication flows
# 7. Review access logs
```

### Emergency Security Response

```bash
# 1. Rotate all compromised credentials immediately
# 2. Review access logs for suspicious activity
# 3. Notify affected users
# 4. Document the incident
# 5. Implement fix and deploy
# 6. Post-mortem and prevention measures
```

---

**Remember: Security is not a feature, it's a requirement.**

Every line of code should be written with security in mind. When in doubt, ask for a security review.

**Last Updated**: January 31, 2026
**Next Review**: April 30, 2026
