# Session Management Integration Guide

Quick guide to integrate the new SessionManagement component into your application.

## Option 1: Replace Existing ActiveSessions (Recommended)

The application already has a security page at `/src/app/settings/security/page.tsx` that uses the `<ActiveSessions />` component. You can enhance this by replacing it with the new `<SessionManagement />` component.

### Step 1: Update the Security Page

Replace the import in `/src/app/settings/security/page.tsx`:

```typescript
// OLD
import { ActiveSessions } from '@/components/settings/active-sessions'

// NEW
import { SessionManagement } from '@/components/settings/SessionManagement'
```

Then update the Sessions tab content:

```typescript
<TabsContent value="sessions" className="space-y-6">
  {/* OLD */}
  {/* <SettingsSection
    title="Active Sessions"
    description="Manage devices that are currently signed in to your account"
  >
    <ActiveSessions />
  </SettingsSection> */}

  {/* NEW - SessionManagement includes its own header, so no SettingsSection needed */}
  <SessionManagement />
</TabsContent>
```

### Why This Approach?

The new `SessionManagement` component includes:
- All features from `ActiveSessions`
- Enhanced security notifications
- Suspicious activity detection
- Geographic anomaly alerts
- Real-time security score
- Notification panel
- Better UX with cards and badges

## Option 2: Keep Both Components

If you want to keep the existing `ActiveSessions` for simplicity and add the enhanced version elsewhere:

### Create a New "Advanced Security" Page

```typescript
// src/app/settings/advanced-security/page.tsx
'use client'

import { SettingsLayout } from '@/components/settings'
import { SessionManagement } from '@/components/settings/SessionManagement'
import { Shield } from 'lucide-react'

export default function AdvancedSecurityPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Advanced Security
          </h1>
          <p className="text-muted-foreground">
            Advanced session management with security monitoring
          </p>
        </div>

        <SessionManagement />
      </div>
    </SettingsLayout>
  )
}
```

Then add a link to this page in your settings navigation.

## Option 3: Standalone Page (No Settings Layout)

For a dedicated security dashboard:

```typescript
// src/app/security-dashboard/page.tsx
'use client'

import { SessionManagement } from '@/components/settings/SessionManagement'

export default function SecurityDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SessionManagement />
    </div>
  )
}
```

## Using the Hook Directly

If you want to build your own custom UI, use the `useSessions` hook:

```typescript
'use client'

import { useSessions } from '@/hooks/use-sessions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function MyCustomSessionView() {
  const {
    sessions,
    currentSession,
    otherSessions,
    loading,
    revokeSession,
    suspiciousActivityScore,
    notifications,
    unreadCount,
  } = useSessions()

  if (loading) {
    return <div>Loading sessions...</div>
  }

  return (
    <div>
      {/* Security Score */}
      {suspiciousActivityScore !== null && (
        <div>
          <h2>Security Score: {suspiciousActivityScore}/100</h2>
          {suspiciousActivityScore >= 70 && (
            <Badge variant="destructive">High Risk</Badge>
          )}
        </div>
      )}

      {/* Notifications */}
      {unreadCount > 0 && (
        <Badge>{unreadCount} new security alerts</Badge>
      )}

      {/* Current Session */}
      {currentSession && (
        <div>
          <h3>Current Session</h3>
          <p>{currentSession.device} - {currentSession.browser}</p>
          <p>Location: {currentSession.location?.city}</p>
        </div>
      )}

      {/* Other Sessions */}
      <div>
        <h3>Other Sessions ({otherSessions.length})</h3>
        {otherSessions.map((session) => (
          <div key={session.id}>
            <span>{session.device}</span>
            <Button onClick={() => revokeSession(session.id)}>
              Sign Out
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Configuration

### Update Session Timeouts

```typescript
// In your app config or initialization
import { sessionManager } from '@/lib/auth/session-manager'

sessionManager.updateConfig({
  sessionTimeout: 1440,      // 24 hours
  idleTimeout: 60,           // 1 hour
  rememberMeDuration: 90,    // 90 days
  maxConcurrentSessions: 20, // 20 sessions max
})
```

### Adjust Security Thresholds

```typescript
sessionManager.updateConfig({
  suspiciousActivityThreshold: 80,  // Stricter (only flag high-risk)
  geoAnomalyDistanceKm: 1000,       // 1000km before alert
  detectSuspiciousActivity: true,
  detectGeoAnomaly: true,
  notifyNewLogin: true,
  notifyNewDevice: true,
})
```

### Disable Features in Dev Mode

```typescript
import { authConfig } from '@/config/auth.config'

if (authConfig.useDevAuth) {
  sessionManager.updateConfig({
    detectSuspiciousActivity: false,
    detectGeoAnomaly: false,
    notifyNewLogin: false,
  })
}
```

## Database Setup

Make sure the required tables exist in your database. Run these migrations:

```sql
-- 1. Create sessions table (if not exists)
CREATE TABLE IF NOT EXISTS nchat_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  device TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT NOT NULL,
  location JSONB,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON nchat_user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON nchat_user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_active
  ON nchat_user_sessions(user_id, expires_at)
  WHERE expires_at > NOW();

-- 3. Create login history table (if not exists)
CREATE TABLE IF NOT EXISTS nchat_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT NOT NULL,
  device TEXT,
  browser TEXT,
  os TEXT,
  location JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for login history
CREATE INDEX IF NOT EXISTS idx_login_history_user_id
  ON nchat_login_history(user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_created_at
  ON nchat_login_history(created_at DESC);
```

## Hasura Permissions

Configure Hasura permissions for the tables:

```yaml
# nchat_user_sessions
- role: user
  permission:
    filter:
      user_id: { _eq: X-Hasura-User-Id }
    columns:
      - id
      - user_id
      - device
      - browser
      - os
      - ip_address
      - location
      - is_current
      - created_at
      - last_active_at
      - expires_at
    allow_aggregations: false

# nchat_login_history
- role: user
  permission:
    filter:
      user_id: { _eq: X-Hasura-User-Id }
    columns:
      - id
      - user_id
      - success
      - ip_address
      - device
      - browser
      - os
      - location
      - failure_reason
      - created_at
    allow_aggregations: true
```

## Environment Variables

Add to your `.env.local`:

```bash
# Required
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://localhost:4000

# Optional - for geolocation (defaults to ipapi.co if not set)
GEOLOCATION_API_KEY=your-api-key-here

# Optional - session configuration
SESSION_TIMEOUT_MINUTES=480
IDLE_TIMEOUT_MINUTES=30
MAX_CONCURRENT_SESSIONS=10
SUSPICIOUS_ACTIVITY_THRESHOLD=70
```

## Testing in Development

The component works in dev mode with mock data:

```bash
# 1. Start your dev server
pnpm dev

# 2. Navigate to security settings
http://localhost:3000/settings/security

# 3. Switch to "Sessions" tab

# 4. You should see:
- Current session (auto-detected)
- 2-3 mock other sessions
- Security score (if any risk detected)
- Notification panel (bell icon)
```

## Production Checklist

Before deploying to production:

- [ ] Database tables created with indexes
- [ ] Hasura permissions configured
- [ ] GraphQL endpoint accessible
- [ ] Session timeouts configured appropriately
- [ ] Security thresholds adjusted for your use case
- [ ] Geolocation API configured (optional)
- [ ] Email notifications set up (optional)
- [ ] Monitoring/alerts configured
- [ ] Rate limiting on API endpoints
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Session cleanup cron job scheduled
- [ ] Load testing performed
- [ ] Security audit completed

## Troubleshooting

### Sessions Not Loading

1. Check GraphQL endpoint in browser console
2. Verify user is authenticated
3. Check Hasura permissions
4. Review database table structure

### Activity Not Updating

1. Check `/api/auth/sessions/activity` endpoint
2. Verify session ID is valid
3. Check browser console for errors
4. Ensure throttling is working (only 1 update/minute)

### Notifications Not Appearing

1. Check suspicious activity threshold setting
2. Verify notification features are enabled in config
3. Review browser console for errors
4. Ensure sessions have enough history for comparison

### High Security Scores

This is expected if:
- Testing from multiple locations rapidly
- Using different browsers/devices
- Logging in at unusual times
- Creating many sessions quickly

Lower thresholds in dev mode if needed.

## Support

For issues or questions:

1. Check `/docs/Session-Management.md` for full documentation
2. Review implementation details in source files
3. Check browser console for errors
4. Review GraphQL queries in Network tab
5. Check Hasura logs for permission issues

## Next Steps

After integration:

1. **Monitor Usage**: Track session metrics in your analytics
2. **Tune Thresholds**: Adjust security settings based on real usage
3. **Add Tests**: Write E2E tests for session flows
4. **Configure Alerts**: Set up monitoring for security events
5. **User Education**: Inform users about security features
6. **Compliance**: Ensure GDPR/CCPA compliance for data retention
