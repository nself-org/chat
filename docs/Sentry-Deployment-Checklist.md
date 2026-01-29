# Sentry Deployment Checklist

Quick checklist for deploying nself-chat with Sentry monitoring.

## Pre-Deployment

### 1. Create Sentry Project

- [ ] Sign up/login at [sentry.io](https://sentry.io)
- [ ] Create organization (if new account)
- [ ] Create new project:
  - Platform: **Next.js**
  - Name: `nself-chat` (or your custom name)
  - Team: Select appropriate team
- [ ] Copy the DSN from project settings

### 2. Get Auth Token (Optional - for sourcemaps)

- [ ] Go to [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/)
- [ ] Create new token:
  - Name: `nself-chat-sourcemaps`
  - Scopes: `project:releases`, `project:write`
- [ ] Copy token securely

### 3. Configure Environment Variables

Add to your deployment platform:

**Required:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

**Optional (recommended):**
```bash
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
NEXT_PUBLIC_RELEASE_VERSION=1.0.0
```

## Platform-Specific Setup

### Vercel

- [ ] Go to Project Settings → Environment Variables
- [ ] Add `NEXT_PUBLIC_SENTRY_DSN` (Production, Preview, Development)
- [ ] Add `SENTRY_AUTH_TOKEN` (Production only, for sourcemaps)
- [ ] Add `SENTRY_ORG` and `SENTRY_PROJECT` (optional)
- [ ] Redeploy

### Netlify

- [ ] Go to Site Settings → Build & Deploy → Environment
- [ ] Add environment variables (same as Vercel)
- [ ] Redeploy

### Docker

- [ ] Add to `.env` or docker-compose:
  ```yaml
  services:
    app:
      environment:
        - NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
        - SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
  ```
- [ ] Build and deploy: `docker-compose up --build`

### Kubernetes

- [ ] Create secret:
  ```bash
  kubectl create secret generic sentry-secrets \
    --from-literal=NEXT_PUBLIC_SENTRY_DSN='your-dsn' \
    --from-literal=SENTRY_AUTH_TOKEN='your-token'
  ```
- [ ] Update deployment.yaml to reference secrets
- [ ] Apply: `kubectl apply -f deployment.yaml`

## Post-Deployment

### 1. Verify Installation

- [ ] Visit your deployed application
- [ ] Check browser console for: `[Sentry] Client-side monitoring initialized`
- [ ] Check server logs for: `[Sentry] Server-side monitoring initialized`
- [ ] No errors during initialization

### 2. Test Error Capture

**Option A: Create test page**

Add to `src/app/test-sentry/page.tsx`:
```typescript
'use client'
import { captureMessage } from '@/lib/sentry-utils'

export default function TestSentry() {
  return (
    <button onClick={() => {
      captureMessage('Test from nself-chat production', { level: 'info' })
      alert('Test event sent to Sentry!')
    }}>
      Send Test Event
    </button>
  )
}
```

- [ ] Visit `/test-sentry`
- [ ] Click button
- [ ] Check Sentry dashboard (Issues page)
- [ ] Verify event appears within 1 minute
- [ ] Delete test page after verification

**Option B: Trigger natural error**

- [ ] Perform an action that might fail (e.g., upload invalid file)
- [ ] Check Sentry dashboard for the error

### 3. Verify Source Maps (if configured)

- [ ] Check build logs for "Sourcemaps uploaded to Sentry"
- [ ] Trigger an error in production
- [ ] View error in Sentry dashboard
- [ ] Verify stack trace shows actual source code (not minified)

### 4. Configure Alerts

- [ ] Go to Sentry Project Settings → Alerts
- [ ] Create alert rule:
  - **When**: An event is seen
  - **If**: All events
  - **Then**: Send notification to email/Slack
- [ ] Test alert by triggering an error

### 5. Set Up Teams (Optional)

- [ ] Go to Organization Settings → Teams
- [ ] Create team for your project
- [ ] Assign team members
- [ ] Configure team notifications

### 6. Configure Performance Monitoring

- [ ] Go to Project Settings → Performance
- [ ] Set performance budgets:
  - Page load: < 2000ms
  - API responses: < 500ms
- [ ] Enable alerts for slow transactions

### 7. Session Replay Configuration

- [ ] Go to Project Settings → Replays
- [ ] Review privacy settings
- [ ] Adjust if needed (default: all text/media masked)
- [ ] Set retention period

## Monitoring Setup

### Daily Checks

- [ ] Review new error types
- [ ] Check error frequency trends
- [ ] Review performance metrics
- [ ] Check user impact

### Weekly Reviews

- [ ] Analyze error patterns
- [ ] Review performance trends
- [ ] Check session replays for UX issues
- [ ] Update alert rules if needed

### Monthly Reviews

- [ ] Review overall error rates
- [ ] Analyze user impact metrics
- [ ] Review performance budgets
- [ ] Plan improvements based on data

## Cost Optimization

- [ ] Review event volume in billing dashboard
- [ ] Adjust sample rates if needed (in config files)
- [ ] Set up quotas to prevent overages:
  - Go to Settings → Subscription
  - Set monthly quota limits
  - Enable spike protection

## Security

- [ ] Verify sensitive data is filtered (check a few errors)
- [ ] Ensure user PII is not captured
- [ ] Review privacy policy mentions Sentry
- [ ] Add opt-out UI for users (optional)

## Documentation

- [ ] Document DSN in team wiki/docs
- [ ] Share Sentry dashboard access with team
- [ ] Document alert escalation process
- [ ] Train team on using Sentry

## Rollback Plan

If issues arise:

- [ ] Temporarily disable by removing `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Redeploy
- [ ] Debug locally
- [ ] Re-enable when ready

## Checklist Complete

- [ ] Sentry account created
- [ ] Environment variables configured
- [ ] Deployed to production
- [ ] Error tracking verified
- [ ] Source maps working (if configured)
- [ ] Alerts configured
- [ ] Team access set up
- [ ] Monitoring routine established
- [ ] Documentation updated

## Support

If you encounter issues:

1. Check [docs/Sentry-Setup.md](./Sentry-Setup.md)
2. Check [docs/Sentry-Quick-Reference.md](./Sentry-Quick-Reference.md)
3. Review [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
4. Contact nself support: support@nself.org

## Next Steps

After Sentry is live:

1. Monitor error trends
2. Set up dashboards
3. Integrate with incident management (PagerDuty, Opsgenie)
4. Add custom instrumentation for critical flows
5. Review and optimize sample rates based on volume

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Sentry Project**: _____________
**Status**: ☐ Pending ☐ In Progress ☐ Complete
