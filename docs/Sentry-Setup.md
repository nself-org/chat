# Sentry Error Tracking Setup Guide

This guide explains how to set up Sentry error tracking and performance monitoring for nself-chat (nchat) in production environments.

## Overview

Sentry is configured for comprehensive error tracking across all runtime environments:

- **Browser/Client-side**: Track frontend errors, user interactions, and performance
- **Node.js/Server-side**: Track API errors, server component errors, and backend issues
- **Edge Runtime**: Track middleware and edge function errors

## Quick Start

### 1. Create a Sentry Account

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new organization (or use existing)
3. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue** (recommended for production)

### 2. Get Your DSN

After creating your project, you'll receive a DSN (Data Source Name) that looks like:

```
https://[key]@[org].ingest.sentry.io/[project]
```

### 3. Configure Environment Variables

Add the following to your production environment variables:

**Required:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

**Optional (for sourcemap uploads):**
```bash
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

**For release tracking:**
```bash
NEXT_PUBLIC_RELEASE_VERSION=1.0.0  # Or use git commit SHA
```

### 4. Enable in Development (Optional)

By default, Sentry is **disabled in development** to avoid noise. To enable:

```bash
SENTRY_ENABLE_DEV=true
NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
```

## Architecture

### File Structure

```
src/
├── instrumentation.ts           # Entry point for Next.js instrumentation
├── instrumentation.node.ts      # Server-side (Node.js) configuration
├── instrumentation.edge.ts      # Edge runtime configuration
└── sentry.client.config.ts      # Client-side (Browser) configuration
```

### How It Works

1. **Next.js 15 Instrumentation Hook**: The `instrumentation.ts` file is automatically loaded by Next.js
2. **Runtime Detection**: Automatically detects and loads the correct configuration based on runtime
3. **Client-side Initialization**: The client config must be imported in your app

### Client-side Setup

Import the client configuration in your root layout:

```typescript
// src/app/layout.tsx
import '@/sentry.client.config'  // Add this import

export default function RootLayout({ children }) {
  // ... rest of your layout
}
```

## Features

### 🔍 Error Tracking

- **Automatic Error Capture**: All unhandled errors are captured automatically
- **Source Maps**: Production builds include source maps for readable stack traces
- **Context**: Errors include user context, breadcrumbs, and environment details

### 📊 Performance Monitoring

- **Transaction Tracing**: Track request/response times
- **Sample Rates**: Configurable sampling to control volume and costs
  - Production: 10% of transactions
  - Development: 100% of transactions

### 🎬 Session Replay (Client-side)

- **Visual Debugging**: See what users did before an error occurred
- **Privacy-first**: All text and media are masked by default
- **Sample Rates**:
  - Normal sessions: 1% in production
  - Error sessions: 50% in production

### 🍞 Breadcrumbs

Track user actions leading up to errors:
- Console logs (dev only)
- DOM events (clicks, inputs)
- Network requests (fetch, XHR)
- Navigation history
- User actions

### 🔒 Privacy & Security

All configurations include automatic filtering of sensitive data:

**Filtered Headers:**
- `authorization`
- `cookie`
- `x-api-key`

**Filtered Fields:**
- `password`
- `token`
- `secret`
- `apiKey`
- `creditCard`
- `ssn`

**User Opt-out:**
Users can opt-out by setting `localStorage.setItem('sentry-opt-out', 'true')`

## Configuration Options

### Sample Rates

Adjust in the respective configuration files:

**Server-side (`instrumentation.node.ts`):**
```typescript
tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
```

**Client-side (`sentry.client.config.ts`):**
```typescript
tracesSampleRate: 0.1,  // 10% of transactions
replaysSessionSampleRate: 0.01,  // 1% of sessions
replaysOnErrorSampleRate: 0.5,   // 50% of error sessions
```

### Ignored Errors

Common noisy errors are automatically ignored:
- Browser extension errors
- Network failures (expected)
- Navigation cancellations
- Next.js redirects
- ResizeObserver errors

Add custom patterns in the `ignoreErrors` array.

### Custom Tags

All events are tagged with:
- `runtime`: `browser`, `nodejs`, or `edge`
- `nextjs`: `15`
- `app`: `nself-chat`

Add custom tags in `initialScope.tags`.

## User Context

Set user context to identify who experienced errors:

```typescript
import * as Sentry from '@sentry/nextjs'

// In your auth context or user login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
})

// On logout
Sentry.setUser(null)
```

## Manual Error Capture

Capture custom errors or events:

```typescript
import * as Sentry from '@sentry/nextjs'

try {
  riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'chat',
      action: 'send-message',
    },
    extra: {
      channelId: channel.id,
      messageLength: message.length,
    },
  })
}

// Capture custom messages
Sentry.captureMessage('Payment processing started', {
  level: 'info',
  tags: { feature: 'payments' },
})
```

## Breadcrumbs

Add custom breadcrumbs for better context:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
  data: {
    userId: user.id,
    method: 'email',
  },
})
```

## Performance Monitoring

Track custom transactions:

```typescript
import * as Sentry from '@sentry/nextjs'

const transaction = Sentry.startTransaction({
  op: 'task',
  name: 'Process Bulk Upload',
})

try {
  await processBulkUpload(files)
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

## Deployment

### Vercel

Sentry works out-of-the-box on Vercel:

1. Add environment variables in Vercel dashboard
2. Enable source maps in `next.config.js` (already enabled)
3. Deploy normally

### Docker

Environment variables can be passed during container runtime:

```bash
docker run \
  -e NEXT_PUBLIC_SENTRY_DSN=your-dsn \
  -e SENTRY_ORG=your-org \
  -e SENTRY_PROJECT=your-project \
  nself-chat:latest
```

### Kubernetes

Add secrets to your deployment:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sentry-secrets
type: Opaque
stringData:
  NEXT_PUBLIC_SENTRY_DSN: "https://[key]@[org].ingest.sentry.io/[project]"
  SENTRY_AUTH_TOKEN: "your-auth-token"
```

Reference in deployment:

```yaml
env:
  - name: NEXT_PUBLIC_SENTRY_DSN
    valueFrom:
      secretKeyRef:
        name: sentry-secrets
        key: NEXT_PUBLIC_SENTRY_DSN
```

## Source Maps

Source maps are automatically uploaded during production builds if configured:

1. Create a Sentry auth token: [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/)
2. Add to environment:
   ```bash
   SENTRY_AUTH_TOKEN=your-token
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

The Sentry Next.js SDK will automatically upload source maps during `next build`.

## Best Practices

### 1. Use Environments

Set different DSNs for staging and production:

```bash
# Staging
NEXT_PUBLIC_SENTRY_DSN=https://staging-key@org.ingest.sentry.io/staging-project

# Production
NEXT_PUBLIC_SENTRY_DSN=https://prod-key@org.ingest.sentry.io/prod-project
```

### 2. Set Alerts

Configure alerts in Sentry dashboard:
- **Immediate**: Critical errors, payment failures
- **Hourly digest**: General errors
- **Daily digest**: Performance issues

### 3. Monitor Performance Budget

Set performance budgets in Sentry:
- Page load: < 2s
- API responses: < 500ms
- Database queries: < 100ms

### 4. Review Regularly

Schedule regular reviews:
- Weekly: New error types
- Monthly: Performance trends
- Quarterly: User impact analysis

### 5. Add Context

Always add relevant context to errors:
```typescript
Sentry.setContext('channel', {
  id: channel.id,
  type: channel.type,
  memberCount: channel.memberCount,
})
```

## Troubleshooting

### No Errors Appearing

1. Check DSN is correctly set
2. Verify environment is not `test`
3. Confirm `SENTRY_ENABLE_DEV` is true (if in development)
4. Check browser console for initialization log

### Too Many Errors

1. Adjust sample rates
2. Add more patterns to `ignoreErrors`
3. Filter specific URLs with `denyUrls`

### Missing Source Maps

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check build logs for upload confirmation
3. Ensure project name matches in Sentry dashboard

### Performance Issues

1. Reduce sample rates
2. Disable Session Replay
3. Limit breadcrumb collection

## Cost Optimization

Sentry pricing is based on events and transactions:

1. **Adjust Sample Rates**: Lower rates = lower costs
2. **Filter Noise**: Use `ignoreErrors` and `beforeSend`
3. **Quotas**: Set monthly quotas in Sentry dashboard
4. **Spike Protection**: Enable in project settings

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## Support

For issues specific to nself-chat Sentry integration:
- Create an issue: [GitHub Issues](https://github.com/nself-chat/issues)
- Email: support@nself.org
- Discord: [nself Community](https://discord.gg/nself)
