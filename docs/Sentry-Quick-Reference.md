# Sentry Quick Reference

Quick reference for using Sentry error tracking in nself-chat.

## Setup (One-time)

1. Get DSN from [sentry.io](https://sentry.io)
2. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
   ```
3. Deploy - errors automatically captured!

## Common Tasks

### Track User Identity

```typescript
import { setSentryUser, clearSentryUser } from '@/lib/sentry-utils'

// On login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
})

// On logout
clearSentryUser()
```

### Capture Errors

```typescript
import { captureError } from '@/lib/sentry-utils'

try {
  await riskyOperation()
} catch (error) {
  captureError(error as Error, {
    tags: { feature: 'upload', type: 'image' },
    extra: { fileSize: file.size },
    level: 'error',
  })
  throw error
}
```

### Log Events

```typescript
import { captureMessage } from '@/lib/sentry-utils'

captureMessage('Payment initiated', {
  level: 'info',
  tags: { feature: 'payments' },
  extra: { amount: 99.99, currency: 'USD' },
})
```

### Track User Actions

```typescript
import { addSentryBreadcrumb } from '@/lib/sentry-utils'

addSentryBreadcrumb(
  'chat',
  'Message sent',
  { channelId: channel.id, length: message.length },
  'info'
)
```

### Add Context

```typescript
import { setSentryContext } from '@/lib/sentry-utils'

setSentryContext('channel', {
  id: channel.id,
  type: channel.type,
  memberCount: channel.members.length,
})
```

### Track Performance

```typescript
import { trackTransaction } from '@/lib/sentry-utils'

const result = await trackTransaction(
  'Load Dashboard',
  'ui.load',
  async () => {
    return await loadDashboardData()
  }
)
```

### Manual Transaction

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  op: 'task',
  name: 'Process Upload',
})

try {
  await processUpload()
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

## Privacy & Opt-out

### Check Opt-out Status

```typescript
import { hasOptedOutOfTracking } from '@/lib/sentry-utils'

if (hasOptedOutOfTracking()) {
  // Show opt-in UI
}
```

### User Opt-out

```typescript
import { optOutOfTracking } from '@/lib/sentry-utils'

optOutOfTracking()
```

### User Opt-in

```typescript
import { optInToTracking } from '@/lib/sentry-utils'

optInToTracking()
// User needs to refresh page for changes to take effect
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes (prod) | Sentry project DSN |
| `SENTRY_ORG` | No | Organization slug (for uploads) |
| `SENTRY_PROJECT` | No | Project slug (for uploads) |
| `SENTRY_AUTH_TOKEN` | No | Auth token (for sourcemaps) |
| `NEXT_PUBLIC_RELEASE_VERSION` | No | Release tracking version |
| `SENTRY_ENABLE_DEV` | No | Enable in development |

## Automatic Features

These work without any code changes:

- ✅ **All unhandled errors** captured automatically
- ✅ **Server-side errors** (API routes, server components)
- ✅ **Client-side errors** (React components, hooks)
- ✅ **Edge runtime errors** (middleware)
- ✅ **Performance monitoring** (request/response times)
- ✅ **Sensitive data filtering** (passwords, tokens, secrets)
- ✅ **Source maps** (readable stack traces in production)

## Sensitive Data

These are **automatically filtered** from all events:

**Headers:**
- `authorization`
- `cookie`
- `x-api-key`

**Fields/Parameters:**
- `password`
- `token`
- `secret`
- `apiKey` / `api_key`
- `creditCard`
- `ssn`

**Query Parameters:**
- Same as fields above

## Tips

### 1. Use Specific Error Messages

❌ Bad:
```typescript
throw new Error('Failed')
```

✅ Good:
```typescript
throw new Error('Failed to upload file: Invalid format (expected PNG/JPG)')
```

### 2. Add Context to Errors

❌ Bad:
```typescript
catch (error) {
  captureError(error)
}
```

✅ Good:
```typescript
catch (error) {
  captureError(error, {
    tags: { feature: 'upload', fileType: file.type },
    extra: { fileSize: file.size, fileName: file.name },
  })
}
```

### 3. Use Breadcrumbs for Flow

```typescript
// Track user flow
addSentryBreadcrumb('ui', 'Clicked upload button')
addSentryBreadcrumb('validation', 'File validated')
addSentryBreadcrumb('upload', 'Upload started')
// If error occurs, you'll see the entire flow
```

### 4. Set User Context Early

```typescript
// In your auth provider
useEffect(() => {
  if (user) {
    setSentryUser({ id: user.id, email: user.email })
  } else {
    clearSentryUser()
  }
}, [user])
```

## Viewing Errors

1. Go to [sentry.io](https://sentry.io)
2. Select your project
3. View **Issues** for errors
4. View **Performance** for slow transactions
5. View **Replays** to see user sessions

## Alerts

Configure alerts in Sentry dashboard:

1. **Critical errors** → Immediate Slack/email
2. **High volume** → Alert when error count spikes
3. **Performance** → Alert when response time > 2s
4. **New issues** → Daily digest

## Troubleshooting

### No errors appearing

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set
2. Verify environment is not `test`
3. Check browser console for "Sentry initialized" message
4. Try manually capturing: `captureMessage('Test')`

### Too many errors

1. Lower sample rates in config files
2. Add patterns to `ignoreErrors` arrays
3. Use `beforeSend` to filter specific cases

### Missing stack traces

1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Check build logs for "Sourcemaps uploaded"
3. Verify release version matches

## Learn More

- [Full Setup Guide](./Sentry-Setup.md)
- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)
