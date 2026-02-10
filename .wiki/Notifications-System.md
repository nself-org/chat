# Notification System Documentation

## Overview

The nChat notification system provides comprehensive, production-ready notification infrastructure with:

- **Web Push Notifications** - Native browser push via Web Push API
- **Email Digests** - Scheduled email summaries
- **Batch Operations** - Efficient bulk notifications
- **Reminders** - User reminders with snooze/recurrence
- **Per-Channel Preferences** - Granular control
- **Keyword Alerts** - Custom keyword notifications
- **Quiet Hours** - Do-not-disturb scheduling
- **Multiple Channels** - Email, Push, SMS

## Quick Start

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
```

### 2. Subscribe to Push

```typescript
import { usePushSubscription } from '@/hooks/use-push-subscription'

const { subscribe } = usePushSubscription()
await subscribe()
```

### 3. Send Notification

```typescript
await fetch('/api/notifications', {
  method: 'POST',
  body: JSON.stringify({
    type: 'mention',
    title: 'You were mentioned',
    body: '@alice mentioned you',
    userId: 'user-uuid',
  }),
})
```

## API Endpoints

### Notifications

- `GET /api/notifications` - List
- `POST /api/notifications` - Create
- `PUT /api/notifications` - Update
- `DELETE /api/notifications` - Delete

### Preferences

- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`

### Push

- `POST /api/notifications/subscribe`
- `DELETE /api/notifications/subscribe`

### Digest

- `POST /api/notifications/digest` - Send now
- `PUT /api/notifications/digest` - Settings

### Batch

- `POST /api/notifications/batch` - Create
- `GET /api/notifications/batch` - Status

### Reminders

- `GET /api/reminders`
- `POST /api/reminders`
- `PUT /api/reminders`
- `DELETE /api/reminders`

## React Hooks

### usePushSubscription

```typescript
const { isSubscribed, subscribe } = usePushSubscription()
```

### useNotificationPreferences

```typescript
const { preferences, updatePreferences } = useNotificationPreferences()
```

## Support

- Docs: `/docs/Notifications-System.md`
- Issues: GitHub
- Email: support@nself.org
