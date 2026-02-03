# Analytics Quick Reference

**Version**: 0.8.0

## Quick Start

### 1. Initialize Analytics

```typescript
import { initializeAnalytics } from '@/lib/analytics'

await initializeAnalytics()
```

### 2. Track an Event

```typescript
import { analytics } from '@/lib/analytics/events'

await analytics.trackMessageSent({
  channel_id: 'channel-123',
  channel_type: 'public',
  message_length: 50,
  has_attachment: false,
  has_mention: true,
  has_emoji: false,
  is_thread: false,
})
```

### 3. Use React Hook

```typescript
import { useAnalytics } from '@/hooks/use-analytics'

function MyComponent() {
  const analytics = useAnalytics()

  const handleClick = () => {
    analytics.trackScreenView('settings')
  }

  return <button onClick={handleClick}>Settings</button>
}
```

## Common Events

```typescript
// User login
await analytics.trackLogin('email', userId)

// User logout
await analytics.trackLogout()

// Message sent
await analytics.trackMessageSent({ ... })

// Channel created
await analytics.trackChannelCreated({ ... })

// Search performed
await analytics.trackSearch({ ... })

// File uploaded
await analytics.trackFileUploaded({ ... })

// Call started
await analytics.trackCallStarted({ ... })

// Error occurred
await analytics.trackError({ ... })

// Screen view
await analytics.trackScreenView('channel_list')
```

## Consent Management

```typescript
import { analyticsPrivacy } from '@/lib/analytics/privacy'

// Accept all
await analyticsPrivacy.acceptAll()

// Reject all
await analyticsPrivacy.rejectAll()

// Granular control
await analyticsPrivacy.setConsent({
  analytics: true,
  performance: true,
  errorTracking: false,
  crashReporting: false,
})

// Check if user has consented
const hasConsent = analyticsPrivacy.hasProvidedConsent()

// Get current consent
const consent = analyticsPrivacy.getConsent()

// Export user data
const data = await analyticsPrivacy.exportUserData()

// Clear all data
await analyticsPrivacy.clearAllData()
```

## User Tracking

```typescript
import { setupUserTracking } from '@/lib/analytics'

// Set user properties
await setupUserTracking({
  id: 'user-123',
  email: 'user@example.com',
  username: 'john_doe',
  role: 'member',
  organizationId: 'org-456',
})

// Clear user
await analytics.setUserId(null)
```

## Error Tracking

```typescript
import { sentryMobile } from '@/lib/analytics/sentry-mobile'

// Capture error
await sentryMobile.captureError(error, {
  tags: { feature: 'messaging' },
  extra: { channelId: '123' },
  level: 'error',
})

// Capture message
await sentryMobile.captureMessage('Something happened', 'info', {
  tags: { context: 'user-action' },
})

// Add breadcrumb
await sentryMobile.addBreadcrumb('navigation', 'User navigated to settings', { screen: 'settings' })
```

## Environment Variables

```bash
# Firebase (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token

# Control
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_RELEASE_VERSION=0.8.0
```

## Standard Events

```typescript
enum StandardEvents {
  // App
  APP_OPEN = 'app_open',
  APP_BACKGROUND = 'app_background',
  APP_FOREGROUND = 'app_foreground',

  // Auth
  LOGIN = 'login',
  LOGOUT = 'logout',
  SIGN_UP = 'sign_up',

  // Messages
  MESSAGE_SENT = 'message_sent',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',

  // Channels
  CHANNEL_CREATED = 'channel_created',
  CHANNEL_JOINED = 'channel_joined',
  CHANNEL_LEFT = 'channel_left',

  // Search
  SEARCH_PERFORMED = 'search_performed',
  SEARCH_RESULT_CLICKED = 'search_result_clicked',

  // Files
  FILE_UPLOADED = 'file_uploaded',
  FILE_DOWNLOADED = 'file_downloaded',

  // Calls
  CALL_STARTED = 'call_started',
  CALL_ENDED = 'call_ended',

  // Settings
  THEME_CHANGED = 'theme_changed',
  SETTINGS_CHANGED = 'settings_changed',

  // Performance
  SCREEN_LOAD_TIME = 'screen_load_time',
  API_CALL = 'api_call',

  // Errors
  ERROR_OCCURRED = 'error_occurred',
}
```

## UI Components

```typescript
// Consent Banner
import { ConsentBanner } from '@/components/analytics/ConsentBanner'

<ConsentBanner />

// Analytics Settings
import { AnalyticsSettings } from '@/components/settings/AnalyticsSettings'

<AnalyticsSettings />
```

## Debugging

```bash
# iOS Debug Mode
-FIRDebugEnabled

# Android Debug Mode
adb shell setprop debug.firebase.analytics.app io.nself.chat

# Web Debug Mode (Console)
window.analytics.isEnabled()
window.analytics.getSessionData()
```

## Privacy Compliance

```typescript
// Privacy banner message
const message = analyticsPrivacy.getConsentBannerMessage()

// Privacy policy summary
const summary = analyticsPrivacy.getPrivacyPolicySummary()

// Check what data we collect
console.log(summary.whatWeCollect)
console.log(summary.whatWeDontCollect)

// Anonymize user ID
const anonId = analyticsPrivacy.anonymizeUserId('user-123')
```

## Testing

```typescript
// Check if initialized
const isInitialized = analytics.isEnabled()

// Get session data
const session = analytics.getSessionData()

// Get platform
const platform = analytics.getPlatform() // 'ios', 'android', 'web', 'electron'
```

## Common Patterns

### Track feature usage

```typescript
const handleFeatureUse = async () => {
  await analytics.logEvent('feature_used', {
    feature_name: 'search',
    feature_category: 'discovery',
  })
}
```

### Track screen views automatically

```typescript
import { useEffect } from 'react'

function MyScreen() {
  useEffect(() => {
    analytics.trackScreenView('my_screen')
  }, [])

  return <div>My Screen</div>
}
```

### Track performance

```typescript
const trackPerformance = async () => {
  const startTime = performance.now()

  // Do something
  await fetchData()

  const duration = performance.now() - startTime

  await analytics.trackScreenLoadTime('data_screen', duration)
}
```

### Handle errors

```typescript
try {
  await riskyOperation()
} catch (error) {
  await analytics.trackError({
    error_type: error.name,
    error_message: error.message,
    error_stack: error.stack,
    fatal: false,
    context: 'risky_operation',
  })

  throw error
}
```

## File Locations

```
src/lib/analytics/
├── types.ts              # Types and interfaces
├── firebase.ts           # Firebase implementation
├── sentry-mobile.ts      # Sentry implementation
├── events.ts             # Event tracking API
├── privacy.ts            # Privacy controls
├── config.ts             # Platform config
└── index.ts              # Main exports

src/components/
├── analytics/ConsentBanner.tsx
└── settings/AnalyticsSettings.tsx

src/hooks/
└── use-analytics.ts      # React hook

docs/
├── ANALYTICS-SETUP.md                    # Full setup guide
├── ANALYTICS-IMPLEMENTATION-SUMMARY.md   # Implementation details
├── ANALYTICS-QUICK-REFERENCE.md          # This file
└── privacy/analytics-privacy.md          # Privacy policy
```

## Support

- Setup Guide: [ANALYTICS-SETUP.md](./ANALYTICS-SETUP.md)
- Implementation: [ANALYTICS-IMPLEMENTATION-SUMMARY.md](./ANALYTICS-IMPLEMENTATION-SUMMARY.md)
- Privacy Policy: [privacy/analytics-privacy.md](./privacy/analytics-privacy.md)
- Email: dev@nself.org
