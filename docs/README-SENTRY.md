# Sentry Integration for nself-chat

> **Production-ready error tracking and performance monitoring**

## What is Sentry?

Sentry provides real-time error tracking and performance monitoring for nself-chat. It helps you:

- 🐛 **Catch bugs** before users report them
- ⚡ **Monitor performance** and identify bottlenecks
- 🎬 **Replay sessions** to see what users experienced
- 📊 **Track trends** over time
- 🔔 **Get alerted** when critical errors occur

## Quick Links

- **Setup Guide**: [Sentry-Setup.md](./Sentry-Setup.md) - Complete installation and configuration
- **Quick Reference**: [Sentry-Quick-Reference.md](./Sentry-Quick-Reference.md) - Code examples and common tasks
- **Deployment Checklist**: [Sentry-Deployment-Checklist.md](./Sentry-Deployment-Checklist.md) - Pre/post deployment steps
- **Implementation Summary**: [../SENTRY_IMPLEMENTATION.md](../SENTRY_IMPLEMENTATION.md) - Technical details

## 5-Minute Setup

### 1. Get Sentry DSN

```bash
# Sign up at https://sentry.io
# Create a Next.js project
# Copy your DSN
```

### 2. Configure Environment

Add to `.env.local` (or production environment):

```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

### 3. Deploy

That's it! Sentry is already integrated and will start capturing errors automatically.

## What Gets Tracked?

### ✅ Automatically Tracked

- All unhandled errors (client + server + edge)
- API route errors
- Server component errors
- Client component errors
- Network failures
- Performance metrics
- User navigation

### 🔒 Automatically Filtered

For your security, these are NEVER sent to Sentry:

- Passwords
- API keys
- Auth tokens
- Credit card numbers
- Social security numbers
- Cookie values
- Authorization headers

## Basic Usage

### Track Errors

```typescript
import { captureError } from '@/lib/sentry-utils'

try {
  await uploadFile(file)
} catch (error) {
  captureError(error as Error, {
    tags: { feature: 'upload' },
    extra: { fileSize: file.size },
  })
  throw error
}
```

### Track User Actions

```typescript
import { addSentryBreadcrumb } from '@/lib/sentry-utils'

addSentryBreadcrumb('chat', 'Message sent', {
  channelId: channel.id,
  messageLength: message.length,
})
```

### Set User Context

Already done in auth context! But you can also do it manually:

```typescript
import { setSentryUser } from '@/lib/sentry-utils'

setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
})
```

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Error Tracking | ✅ Active | Automatic error capture across all runtimes |
| Performance Monitoring | ✅ Active | Track response times and slow transactions |
| Session Replay | ✅ Active | Visual playback of user sessions (privacy-safe) |
| Breadcrumbs | ✅ Active | Track user actions leading to errors |
| Source Maps | ✅ Active | Readable stack traces in production |
| User Context | ✅ Active | Know which user experienced the error |
| Privacy Filtering | ✅ Active | Automatic removal of sensitive data |
| User Opt-out | ✅ Active | Users can disable tracking |

## Environment Configuration

### Development

By default, Sentry is **disabled in development** to avoid noise. To enable:

```bash
SENTRY_ENABLE_DEV=true
NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
```

### Production

Just set the DSN:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

### Optional Variables

```bash
# For sourcemap uploads
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token

# For release tracking
NEXT_PUBLIC_RELEASE_VERSION=1.0.0
```

## Privacy & GDPR Compliance

Sentry is configured with privacy-first defaults:

1. **All text and media are masked** in session replays
2. **Sensitive data is automatically filtered** from error reports
3. **Users can opt-out** via localStorage
4. **No PII is captured** without explicit configuration
5. **Data retention** can be configured in Sentry settings

### User Opt-out

Users can disable tracking:

```typescript
import { optOutOfTracking } from '@/lib/sentry-utils'

// User clicks "Disable error tracking"
optOutOfTracking()

// Or directly via localStorage
localStorage.setItem('sentry-opt-out', 'true')
```

## Performance Impact

Sentry is designed to be lightweight:

- **Bundle size**: ~30KB gzipped (client-side)
- **Performance overhead**: < 1ms per request
- **Sample rates**: Configurable to reduce volume
  - Production: 10% of transactions tracked
  - Can be adjusted based on traffic

## Costs

Sentry offers a free tier:

- **Free**: Up to 5,000 errors/month
- **Team**: $26/month for 50,000 errors/month
- **Business**: $80/month for 500,000 errors/month

See [sentry.io/pricing](https://sentry.io/pricing) for current pricing.

### Cost Optimization

1. Adjust sample rates in config files
2. Filter noisy errors with `ignoreErrors`
3. Set monthly quotas in Sentry dashboard
4. Enable spike protection

## Troubleshooting

### No errors appearing in Sentry

1. Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Verify you're not in test environment
3. Check browser console for initialization message
4. Try manually sending a test: `captureMessage('Test')`

### Too many errors

1. Lower sample rates in config files
2. Add patterns to `ignoreErrors` arrays
3. Set quotas in Sentry dashboard

### Missing stack traces

1. Ensure `SENTRY_AUTH_TOKEN` is set
2. Check build logs for "Sourcemaps uploaded"
3. Verify release version matches

## Getting Help

1. **Documentation**: Start with [Sentry-Setup.md](./Sentry-Setup.md)
2. **Quick Reference**: See [Sentry-Quick-Reference.md](./Sentry-Quick-Reference.md)
3. **Sentry Docs**: [docs.sentry.io](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
4. **nself Support**: support@nself.org

## Next Steps

1. **Set up Sentry account**: [sentry.io](https://sentry.io)
2. **Configure DSN**: Add to environment variables
3. **Deploy**: Errors will start appearing automatically
4. **Configure alerts**: Get notified of critical errors
5. **Review regularly**: Make data-driven improvements

## Learn More

- [Complete Setup Guide](./Sentry-Setup.md)
- [Quick Reference & Code Examples](./Sentry-Quick-Reference.md)
- [Deployment Checklist](./Sentry-Deployment-Checklist.md)
- [Implementation Details](../SENTRY_IMPLEMENTATION.md)

---

**Questions?** Check the [Setup Guide](./Sentry-Setup.md) or contact support@nself.org
