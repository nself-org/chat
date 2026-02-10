# Logging Guide for nself-chat

Quick reference for using the production logging system.

---

## Quick Start

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('YourModuleName')
```

---

## API Reference

### Basic Logging

```typescript
// Debug (development only, not shown in production)
log.debug('Detailed debug information', { variable: value })

// Info (general information)
log.info('User logged in successfully', { userId: 'abc123' })

// Warning (non-critical issues)
log.warn('API rate limit approaching', { remaining: 10 })

// Error (critical errors, sent to Sentry in production)
log.error('Database connection failed', error, { operation: 'fetchUsers' })
```

### Specialized Logging

```typescript
// Performance tracking
const start = Date.now()
// ... your operation
log.perf('User query', Date.now() - start, { query: 'complex' })

// Security events (always logged and sent to Sentry)
log.security('Failed login attempt', {
  ip: req.ip,
  userId: attemptedUserId,
  reason: 'invalid_password',
})

// Audit trails (compliance and tracking)
log.audit('User role changed', currentUserId, {
  targetUser: targetUserId,
  oldRole: 'member',
  newRole: 'admin',
})
```

---

## When to Use What

| Level      | Use When                               | Example                                    |
| ---------- | -------------------------------------- | ------------------------------------------ |
| `debug`    | Development debugging, verbose details | Variable values, function calls            |
| `info`     | Important state changes, user actions  | User login, file upload complete           |
| `warn`     | Recoverable issues, deprecations       | API rate limit warning, deprecated feature |
| `error`    | Errors that need investigation         | API failures, database errors              |
| `perf`     | Performance monitoring                 | Slow queries, long operations              |
| `security` | Security-related events                | Failed auth, suspicious activity           |
| `audit`    | Compliance and user actions            | Permission changes, data access            |

---

## Best Practices

### ✅ DO

```typescript
// Include context
log.error('Failed to fetch user', error, {
  userId: 'abc123',
  endpoint: '/api/users/abc123',
})

// Use scoped loggers
const log = createLogger('AuthService')
log.info('User authenticated', { userId })

// Log performance metrics
log.perf('Database query', duration, { table: 'users', rows: 1000 })

// Log security events
log.security('Suspicious login pattern', { userId, ip, attempts: 5 })
```

### ❌ DON'T

```typescript
// Don't use console.log in production code
console.log('Debug info') // ❌

// Don't log sensitive data
log.info('User logged in', { password: '...' }) // ❌

// Don't log without context
log.error('Error occurred') // ❌ (no context)

// Don't over-log in tight loops
for (const item of items) {
  log.debug('Processing item', item) // ❌ (too verbose)
}
```

---

## Environment Configuration

Control logging behavior with environment variables:

```bash
# Production
NEXT_PUBLIC_LOG_LEVEL=warn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Development
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_SENTRY_DSN=  # Optional in dev

# Staging
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## Sentry Integration

All `error`, `warn`, `security`, and `audit` logs are automatically sent to Sentry in production.

### What Gets Sent to Sentry

- ✅ Errors (with stack traces)
- ✅ Warnings (as Sentry messages)
- ✅ Security events (tagged as security)
- ✅ Audit logs (tagged as audit)
- ❌ Debug logs (never sent)
- ❌ Info logs (never sent)

### Sentry Context

The logger automatically includes:

- Error stack traces
- User context (if available)
- Environment information
- Custom context you provide

---

## Examples by Use Case

### API Route Error Handling

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('UserAPI')

export async function GET(req: Request) {
  try {
    const users = await fetchUsers()
    return Response.json(users)
  } catch (error) {
    log.error('Failed to fetch users', error, {
      endpoint: '/api/users',
      method: 'GET',
    })
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### React Component Error

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('UserProfile')

export function UserProfile({ userId }: Props) {
  useEffect(() => {
    fetchUser(userId).catch((error) => {
      log.error('Failed to load user profile', error, { userId })
    })
  }, [userId])

  // ...
}
```

### Authentication Security

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('Auth')

async function login(email: string, password: string) {
  const user = await authenticateUser(email, password)

  if (!user) {
    log.security('Failed login attempt', {
      email,
      ip: getClientIP(),
      timestamp: Date.now(),
    })
    throw new Error('Invalid credentials')
  }

  log.audit('User login', user.id, {
    email: user.email,
    loginMethod: 'password',
  })

  return user
}
```

### Performance Monitoring

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('Database')

async function complexQuery(params: QueryParams) {
  const start = Date.now()

  try {
    const results = await db.query(params)
    const duration = Date.now() - start

    log.perf('Complex query executed', duration, {
      table: params.table,
      rows: results.length,
      filters: Object.keys(params.where).length,
    })

    return results
  } catch (error) {
    log.error('Query failed', error, { params })
    throw error
  }
}
```

---

## Migration from console.\*

### Before

```typescript
console.log('User logged in:', userId)
console.error('Error:', error)
console.warn('Deprecated feature used')
```

### After

```typescript
import { createLogger } from '@/lib/logger'

const log = createLogger('YourModule')

log.info('User logged in', { userId })
log.error('Operation failed', error, { context: 'details' })
log.warn('Deprecated feature used', { feature: 'oldAPI' })
```

---

## Testing

In tests, you can mock the logger:

```typescript
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    perf: jest.fn(),
    security: jest.fn(),
    audit: jest.fn(),
  }),
}))
```

---

## Troubleshooting

### Logs not appearing in Sentry?

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set
2. Verify you're in production mode (`NODE_ENV=production`)
3. Ensure error is being logged with `log.error()` not `console.error()`

### Too many logs in development?

Set `NEXT_PUBLIC_LOG_LEVEL=warn` to reduce verbosity

### Need more detail in production?

Temporarily set `NEXT_PUBLIC_LOG_LEVEL=info` (not recommended long-term)

---

## Resources

- **Logger Implementation**: `src/lib/logger.ts`
- **Cleanup Report**: `docs/CLEANUP-REPORT-v0.9.1.md`
- **Sentry Setup**: `docs/Sentry-Setup.md`
- **Future Enhancements**: `docs/future-enhancements.md`

---

**Last Updated**: February 3, 2026
