# Notifications System - Complete Documentation

**Status**: ✅ **FULLY IMPLEMENTED** (v0.9.0)
**Last Updated**: February 1, 2026

The nself-chat notifications system is a production-ready, feature-complete implementation providing in-app, desktop, mobile, email, and sound notifications with comprehensive user controls.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Components](#components)
- [API Reference](#api-reference)
- [Notification Types](#notification-types)
- [User Preferences](#user-preferences)
- [Sound System](#sound-system)
- [Keyword Alerts](#keyword-alerts)
- [Do Not Disturb](#do-not-disturb)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The notification system provides real-time alerts for user activity across multiple channels:

- **In-App Notifications**: Notification center with inbox, badges, and toast messages
- **Desktop Notifications**: Browser notifications via Web Notification API
- **Mobile Push**: Native push notifications via Capacitor
- **Email Notifications**: Digest and instant email alerts
- **Sound Alerts**: Customizable notification sounds
- **Keyword Alerts**: Custom keyword monitoring with highlighting

### Key Capabilities

✅ **Rich Notification Types**: Mentions, DMs, threads, reactions, channels, system
✅ **Priority Levels**: Low, Normal, High, Urgent
✅ **Delivery Methods**: Desktop, mobile, email, in-app
✅ **Granular Controls**: Global, per-channel, per-type settings
✅ **Sound Profiles**: 25+ built-in sounds + custom uploads
✅ **Keyword Monitoring**: Custom keywords with categories
✅ **Quiet Hours**: DND schedules with breakthrough rules
✅ **Permission Handling**: Graceful permission request flows
✅ **Notification Grouping**: Stack and group related notifications
✅ **Read/Unread Tracking**: Per-notification and bulk operations
✅ **History & Archive**: Full notification history with search

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
├─────────────────────────────────────────────────────────────┤
│  NotificationBell  │  NotificationCenter  │  Toast/Banner  │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────────────┐
        │      Notification Store (Zustand)           │
        │  - State management                         │
        │  - Preferences (localStorage + DB sync)     │
        │  - Real-time updates                        │
        └──────┬──────────────────────────────────────┘
               │
    ┌──────────┼────────────┬─────────────┬──────────┐
    │          │            │             │          │
┌───▼───┐  ┌──▼──┐  ┌─────▼─────┐  ┌────▼────┐  ┌─▼──┐
│ API   │  │ GQL │  │  Socket   │  │ Desktop │  │Web │
│Routes │  │Subs │  │   I/O     │  │  API    │  │Push│
└───────┘  └─────┘  └───────────┘  └─────────┘  └────┘
```

### Data Flow

1. **Notification Creation**: Backend creates notification (GraphQL mutation)
2. **Real-time Distribution**: GraphQL subscription or Socket.io pushes to clients
3. **Store Update**: Zustand store receives and processes notification
4. **Delivery**: Notification delivered via enabled channels (desktop, mobile, sound)
5. **User Interaction**: User reads/dismisses notification
6. **State Sync**: Updated state synced to database

---

## Features

### Core Features (Implemented)

| Feature | Status | Description |
|---------|--------|-------------|
| **In-App Notification Center** | ✅ | Full inbox with filtering, search, grouping |
| **Notification Badges** | ✅ | Unread counts on bell icon and channels |
| **Unread Count** | ✅ | Real-time unread tracking |
| **Mark as Read** | ✅ | Individual and bulk mark as read |
| **Mark All as Read** | ✅ | Clear all unread notifications |
| **Notification Grouping** | ✅ | Group by channel, type, or thread |
| **Notification Sounds** | ✅ | 25+ sounds, custom uploads, sound profiles |
| **Desktop Notifications** | ✅ | Web Notification API with permission handling |
| **Mobile Push** | ✅ | Capacitor push notifications (iOS/Android) |
| **Rich Notifications** | ✅ | Images, actions, custom data |
| **Notification Actions** | ✅ | Reply, mark read, dismiss, archive |
| **Do Not Disturb** | ✅ | DND mode with schedule |
| **DND Schedule** | ✅ | Time-based quiet hours (weekdays/weekends) |
| **Per-Channel Settings** | ✅ | Mute, notification level, custom sounds |
| **Mute Channel** | ✅ | Temporary or permanent channel muting |
| **Keyword Alerts** | ✅ | Custom keywords with highlighting |
| **@Mention Notifications** | ✅ | User, @here, @channel, @everyone |
| **DM Notifications** | ✅ | Separate settings for direct messages |
| **Thread Reply Notifications** | ✅ | Notify on thread replies |
| **Notification Preferences UI** | ✅ | Complete settings interface |
| **Test Notification** | ✅ | Test button with templates |

### Advanced Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Email Notifications** | ✅ | Instant and digest emails |
| **Email Digest** | ✅ | Hourly, daily, weekly digests |
| **Notification History** | ✅ | Full history with archive |
| **Sound Profiles** | ✅ | Custom sound themes |
| **Sound Packs** | ✅ | Importable sound collections |
| **Keyword Categories** | ✅ | Organize keywords into groups |
| **Priority-Based Filtering** | ✅ | Filter by urgency level |
| **Breakthrough Notifications** | ✅ | Override DND for urgent items |
| **Notification Analytics** | ✅ | Statistics and insights |

---

## Components

### Main Components

#### 1. NotificationBell
**Location**: `src/components/notifications/notification-bell.tsx`

Main notification bell icon with unread badge.

```tsx
import { NotificationBell } from '@/components/notifications/notification-bell';

<NotificationBell
  onClick={() => setNotificationCenterOpen(true)}
/>
```

**Props**:
- `onClick`: Callback when bell is clicked
- `showCount`: Show unread count badge (default: true)
- `variant`: Bell style variant

#### 2. NotificationCenter
**Location**: `src/components/notifications/notification-center.tsx`

Full notification inbox/panel.

```tsx
import { NotificationCenter } from '@/components/notifications/notification-center';

<NotificationCenter
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  position="dropdown" // or 'left' | 'right'
  maxHeight="600px"
/>
```

**Props**:
- `isOpen`: Control panel visibility
- `onClose`: Close callback
- `position`: Panel position ('dropdown', 'left', 'right')
- `maxHeight`: Maximum height for scrolling
- `onSettingsClick`: Callback for settings button

**Features**:
- Filter tabs (All, Mentions, Threads, Reactions)
- Mark all as read
- Individual notification actions
- Empty states
- Infinite scroll (future)

#### 3. NotificationItem
**Location**: `src/components/notifications/notification-item.tsx`

Individual notification display.

```tsx
import { NotificationItem } from '@/components/notifications/notification-item';

<NotificationItem
  notification={notification}
  onRead={(id) => markAsRead(id)}
  onDismiss={(id) => removeNotification(id)}
  onClick={(id) => navigateToNotification(id)}
/>
```

#### 4. NotificationSettings
**Location**: `src/components/notifications/NotificationSettings.tsx`

Complete notification preferences UI.

```tsx
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

<NotificationSettings />
```

**Sections**:
- Global settings (enable/disable)
- Desktop notifications
- Mobile push notifications
- Email notifications
- Sound settings
- Quiet hours / DND
- Per-channel settings
- Keyword alerts
- Mention settings

#### 5. TestNotificationButton
**Location**: `src/components/notifications/test-notification-button.tsx`

Test notification generator for development.

```tsx
import { TestNotificationButton } from '@/components/notifications/test-notification-button';

<TestNotificationButton variant="outline" />
```

**Templates**:
- Mention (Normal, Urgent)
- Direct Message (Normal, High)
- Thread Reply
- Reaction
- Channel Invite/Update
- System
- Announcement
- Keyword Alert

---

## API Reference

### REST API

**Base URL**: `/api/notifications`

#### GET /api/notifications

Fetch notifications for the authenticated user.

**Query Parameters**:
```typescript
{
  userId: string;          // User UUID (required)
  limit?: number;          // Max results (1-100, default: 20)
  offset?: number;         // Pagination offset (default: 0)
  filter?: string;         // 'all' | 'mentions' | 'threads' | 'reactions' | 'dms' | 'unread'
  unreadOnly?: boolean;    // Show only unread (default: false)
  includeArchived?: boolean; // Include archived (default: false)
  channelId?: string;      // Filter by channel
  type?: string;           // Filter by notification type
  priority?: string;       // Filter by priority level
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [...],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 45,
      "hasMore": true
    },
    "unreadCount": 12
  }
}
```

#### POST /api/notifications

Create a new notification.

**Body**:
```json
{
  "type": "mention",
  "priority": "normal",
  "title": "John mentioned you",
  "body": "Hey @you, can you review this?",
  "userId": "uuid",
  "actor": {
    "id": "uuid",
    "name": "John Doe",
    "avatarUrl": "https://..."
  },
  "channelId": "uuid",
  "channelName": "#general",
  "messageId": "uuid",
  "actionUrl": "/chat/general/msg-123",
  "metadata": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

#### PUT /api/notifications

Update notification(s) - mark as read/archived.

**Body**:
```json
{
  "notificationIds": ["uuid1", "uuid2"],
  "isRead": true,
  "isArchived": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "affectedRows": 2,
    "notifications": [...]
  }
}
```

#### DELETE /api/notifications

Delete notification(s).

**Query Parameters**:
```
?ids=uuid1,uuid2,uuid3
```

**Response**:
```json
{
  "success": true,
  "data": {
    "affectedRows": 3,
    "deletedIds": ["uuid1", "uuid2", "uuid3"]
  }
}
```

#### PATCH /api/notifications (Mark All Read)

Mark all notifications as read for a user.

**Body**:
```json
{
  "userId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "affectedRows": 15
  }
}
```

### GraphQL API

See `src/graphql/notifications/` for query and mutation definitions.

---

## Notification Types

```typescript
type NotificationType =
  | 'mention'          // @username mention
  | 'direct_message'   // DM received
  | 'thread_reply'     // Reply to your thread
  | 'reaction'         // Reaction to your message
  | 'channel_invite'   // Invited to channel
  | 'channel_update'   // Channel settings changed
  | 'system'           // System notification
  | 'announcement'     // Announcement
  | 'keyword';         // Keyword match alert
```

### Priority Levels

```typescript
type NotificationPriority =
  | 'low'      // Gray badge, no breakthrough DND
  | 'normal'   // Blue badge, standard delivery
  | 'high'     // Orange badge, priority delivery
  | 'urgent';  // Red badge, breakthrough DND, persistent
```

---

## User Preferences

### Global Settings

```typescript
interface NotificationPreferences {
  // Master toggle
  globalEnabled: boolean;

  // Desktop notifications
  desktop: {
    enabled: boolean;
    showPreview: boolean;
    showAvatar: boolean;
    playSound: boolean;
    requireInteraction: boolean;
    showWhenFocused: boolean;
  };

  // Mobile push
  push: {
    enabled: boolean;
    showPreview: boolean;
    playSound: boolean;
    vibrate: boolean;
    priority: 'low' | 'normal' | 'high';
  };

  // Email notifications
  email: {
    enabled: boolean;
    digestFrequency: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
    urgentImmediate: boolean;
  };

  // Sound settings
  sound: {
    enabled: boolean;
    volume: number; // 0-100
    defaultSound: string;
    mentionSound: string;
    dmSound: string;
    playWhenFocused: boolean;
  };

  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
    days: number[];    // [0,1,2,3,4,5,6]
    allowMentionsBreakthrough: boolean;
  };
}
```

### Per-Channel Settings

```typescript
interface ChannelNotificationSettings {
  channelId: string;
  level: 'all' | 'mentions' | 'nothing' | 'custom';
  muteUntil?: string; // ISO date or null
  customSound?: string;
  overrideGlobal: boolean;
}
```

---

## Sound System

### Built-in Sounds

Located in `/public/sounds/`:

- `default.mp3` - Standard notification
- `mention.mp3` - @mention alert
- `dm.mp3` - Direct message
- `thread.mp3` - Thread reply
- `reaction.mp3` - Reaction received
- `ding.mp3` - Simple ding
- `pop.mp3` - Pop sound
- `chime.mp3` - Chime
- `bell.mp3` - Bell
- `knock.mp3` - Knock
- `whoosh.mp3` - Whoosh
- `subtle.mp3` - Subtle tone
- `alert.mp3` - Alert tone
- `system.mp3` - System sound

### Sound Profiles

Create custom sound profiles:

```typescript
import { createSoundProfile, setActiveProfile } from '@/lib/notifications/sounds';

// Create profile
const profile = createSoundProfile('My Profile', {
  mention: 'mention',
  direct_message: 'chime',
  thread_reply: 'subtle',
  reaction: 'none',
  // ...
}, {
  description: 'My custom sound theme',
  volume: 70
});

// Activate profile
setActiveProfile(profile.id);
```

### Custom Sound Upload

```typescript
import { uploadCustomSound } from '@/lib/notifications/sounds';

const sound = await uploadCustomSound({
  name: 'My Custom Sound',
  file: audioFile,
});
```

### Sound Themes

Preset themes available:

- **Minimal**: Subtle sounds only
- **Professional**: Clean, business-appropriate sounds
- **Playful**: Fun, energetic sounds
- **Silent**: No sounds

---

## Keyword Alerts

### Creating Keywords

```typescript
import { createKeyword } from '@/lib/notifications/keyword-matcher';

const keyword = createKeyword('deployment', {
  caseSensitive: false,
  wholeWord: true,
  enabled: true,
  highlightColor: '#ef4444',
  soundId: 'alert',
  channelIds: ['uuid1', 'uuid2'], // Empty = all channels
});
```

### Keyword Categories

Organize keywords into categories:

```typescript
import { createCategory, addKeywordToCategory } from '@/lib/notifications/keyword-alerts';

const category = createCategory('Critical', '#ef4444', 'AlertTriangle');
addKeywordToCategory(category.id, keyword.id);
```

### Bulk Operations

```typescript
import { addKeywordsBulk, enableKeywordsBulk } from '@/lib/notifications/keyword-alerts';

// Add multiple keywords
const updated = addKeywordsBulk(preferences, [
  'bug',
  'error',
  'critical',
  'urgent'
], {
  highlightColor: '#ef4444',
  soundId: 'alert'
});

// Enable multiple keywords
const enabled = enableKeywordsBulk(preferences, keywordIds);
```

### Import/Export

```typescript
import { exportKeywords, importKeywords } from '@/lib/notifications/keyword-alerts';

// Export
const json = exportKeywords(preferences);

// Import
const result = importKeywords(preferences, json);
console.log(`Imported ${result.importedKeywords} keywords`);
```

---

## Do Not Disturb

### Basic DND

```typescript
const preferences = {
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    allowMentionsBreakthrough: true,
    enableOnWeekends: true,
  }
};
```

### DND Schedule

```typescript
import { isInQuietHours, canBreakthrough } from '@/lib/notifications/quiet-hours';

// Check if currently in quiet hours
if (isInQuietHours(preferences.quietHours)) {
  // Skip notification or check breakthrough
  if (canBreakthrough(notification, preferences.quietHours)) {
    // Allow notification
  }
}
```

### Weekend Quiet Hours

```typescript
const preferences = {
  weekendQuietHours: {
    enabled: true,
    startTime: '00:00',
    endTime: '10:00',
  }
};
```

---

## Testing

### Using Test Button

Add the test button to your UI:

```tsx
import { TestNotificationButton } from '@/components/notifications/test-notification-button';

<TestNotificationButton />
```

### Programmatic Testing

```typescript
import { useNotificationStore } from '@/stores/notification-store';

const addNotification = useNotificationStore(state => state.addNotification);

addNotification({
  id: 'test-123',
  type: 'mention',
  priority: 'normal',
  title: 'Test Notification',
  body: 'This is a test',
  isRead: false,
  isArchived: false,
  createdAt: new Date().toISOString(),
});
```

### Testing Desktop Permissions

```typescript
import { useNotifications } from '@/hooks/use-notifications';

const { requestDesktopPermission } = useNotifications();

const permission = await requestDesktopPermission();
console.log('Permission:', permission); // 'granted', 'denied', or 'default'
```

---

## Troubleshooting

### Desktop Notifications Not Showing

1. **Check browser permission**: Settings → Site Settings → Notifications
2. **Verify preferences**: Ensure `desktopEnabled: true`
3. **Check DND**: Verify not in quiet hours
4. **Browser support**: Ensure browser supports Notification API

### Sounds Not Playing

1. **Check volume**: Verify `soundVolume > 0`
2. **Check preferences**: Ensure `soundEnabled: true`
3. **Autoplay policy**: User interaction may be required first
4. **Check sound files**: Verify `/public/sounds/` files exist

### Notifications Not Persisting

1. **Check localStorage**: Verify localStorage is not full
2. **Check API connection**: Verify GraphQL endpoint is accessible
3. **Check authentication**: Verify user is logged in

### Keyword Alerts Not Triggering

1. **Check keyword settings**: Verify `enabled: true`
2. **Check channel restrictions**: Verify keyword applies to channel
3. **Check case sensitivity**: Adjust `caseSensitive` setting
4. **Check whole word**: Adjust `wholeWord` setting

---

## Best Practices

### Performance

- Limit notifications in memory to 100-200
- Archive old notifications regularly
- Use pagination for history
- Debounce rapid notification creation

### User Experience

- Request permissions at appropriate times
- Provide clear permission explanations
- Allow granular control (per-channel)
- Respect quiet hours
- Group related notifications

### Security

- Validate all inputs
- Sanitize notification content
- Use authenticated APIs
- Implement rate limiting
- Audit notification access

---

## Related Documentation

- [API Documentation](./API.md)
- [GraphQL Schema](./GraphQL-Schema.md)
- [Real-time Events](./Real-time-Events.md)
- [Mobile Push Setup](./Mobile-Push-Setup.md)
- [Sound System](./Sound-System.md)

---

## Migration Guide

If upgrading from a previous version:

1. **Update store structure**: New Zustand store with middleware
2. **Update API routes**: New REST API endpoints
3. **Update GraphQL schema**: New notification tables
4. **Migrate preferences**: Convert old settings format
5. **Test permissions**: Re-request desktop permissions

---

## Future Enhancements

Planned features for future versions:

- [ ] Notification scheduling
- [ ] Smart bundling (ML-based)
- [ ] Cross-device sync
- [ ] Notification templates
- [ ] A/B testing for notifications
- [ ] Advanced analytics dashboard
- [ ] Notification actions (reply inline)
- [ ] Rich media (video thumbnails)
- [ ] Notification forwarding
- [ ] Third-party integrations (Slack, Email)

---

**Version**: 0.9.0
**Last Updated**: February 1, 2026
**Status**: Production Ready ✅
