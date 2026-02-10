# Phase 7: Realtime & Presence Integration Guide

**Version:** 0.9.0
**Status:** ✅ Complete
**Date:** February 3, 2026

## Overview

Phase 7 implements comprehensive realtime functionality with WebSocket communication, presence tracking, typing indicators, delivery receipts, and offline queue management. All features are fully integrated and production-ready.

## Architecture

### Core Services

1. **RealtimeClient** (`src/services/realtime/realtime-client.ts`)
   - Socket.io WebSocket connection management
   - Authentication and reconnection logic
   - Connection quality monitoring
   - Offline detection

2. **PresenceService** (`src/services/realtime/presence.service.ts`)
   - Online/away/busy/offline status tracking
   - Custom status with emoji and text
   - Privacy controls (visibility settings)
   - Idle detection with auto-away

3. **TypingService** (`src/services/realtime/typing.service.ts`)
   - Typing indicators for channels, threads, DMs
   - Debouncing and throttling
   - Privacy filtering
   - Batch updates for performance

4. **DeliveryEventHandler** (`src/services/realtime/delivery.ts`)
   - Message sent/delivered/read status tracking
   - Batch read acknowledgements
   - Delivery status synchronization
   - Real-time status updates

5. **OfflineQueueService** (`src/services/realtime/offline-queue.ts`)
   - localStorage persistence
   - Automatic retry with exponential backoff
   - Queue management with size limits
   - Batch processing on reconnection

6. **RealtimeIntegrationService** (`src/services/realtime/realtime-integration.service.ts`)
   - Main orchestration service
   - Unified initialization
   - Status monitoring
   - Service coordination

## Quick Start

### 1. Initialize Realtime Services

```typescript
import { initializeRealtimeIntegration } from '@/services/realtime/realtime-integration.service'

// In your app initialization (e.g., layout or provider)
useEffect(() => {
  if (user) {
    initializeRealtimeIntegration({
      userId: user.id,
      token: user.token,
      enablePresence: true,
      enableTyping: true,
      enableDeliveryReceipts: true,
      enableOfflineQueue: true,
      debug: process.env.NODE_ENV === 'development',
      autoConnect: true,
    })
  }
}, [user])
```

### 2. Use in Components

```typescript
import { useRealtimeIntegration } from '@/hooks/use-realtime-integration'

function ChatComponent() {
  const { isConnected, presence, typing, delivery, queue } = useRealtimeIntegration()

  // Set presence status
  useEffect(() => {
    if (presence) {
      presence.setStatus('online')
    }
  }, [presence])

  // Handle typing
  const handleInputChange = (value: string) => {
    if (typing) {
      typing.handleInputChange(channelId, value)
    }
  }

  // Track message delivery
  const sendMessage = async (content: string) => {
    const clientMessageId = generateId()

    if (delivery) {
      delivery.trackOutgoing(clientMessageId, channelId)
    }

    // Send message...
  }

  // Queue message if offline
  const sendOrQueue = async (content: string) => {
    if (isConnected) {
      await sendMessage(content)
    } else if (queue) {
      queue.queueMessage({
        channelId,
        content,
        type: 'text',
      })
    }
  }

  return (
    // Your component JSX
  )
}
```

### 3. Display Connection Status

```typescript
import { ConnectionStatus } from '@/components/realtime/connection-status'

function Header() {
  return (
    <header>
      <ConnectionStatus
        variant="header"
        showDetails
      />
    </header>
  )
}
```

## Features Implemented

### ✅ Task 66: Realtime Event Wiring

**Files:**

- `src/services/realtime/realtime-integration.service.ts` - Main orchestration
- `src/lib/realtime/index.ts` - Unified exports
- `src/hooks/use-realtime-integration.ts` - React integration

**Features:**

- Unified service initialization
- Event dispatcher integration
- Room management
- Connection state synchronization
- Service coordination

### ✅ Task 67: Delivery Receipts

**Files:**

- `src/services/realtime/delivery.ts` - Delivery event handler
- `src/services/messages/receipt.service.ts` - Receipt persistence
- `src/lib/messaging/delivery-state.ts` - State management

**Features:**

- Sent/delivered/read status tracking
- Batch read acknowledgements
- Privacy-aware delivery updates
- GraphQL persistence
- Real-time status synchronization

**Status Flow:**

```
sending → sent → delivered → read
         ↓
       failed
```

### ✅ Task 68: Online Presence with Privacy Controls

**Files:**

- `src/services/realtime/presence.service.ts` - Presence management
- `src/graphql/presence-settings.ts` - Privacy settings schema
- `src/components/user/presence-selector.tsx` - UI component

**Features:**

- Status: online, away, busy, offline
- Custom status with emoji and expiration
- Privacy visibility: everyone, contacts, nobody
- Last seen tracking
- Invisible mode
- Contact relationship detection
- Idle detection with auto-away

**Privacy Matrix:**
| Visibility | Everyone | Contacts | Nobody |
|------------|----------|----------|--------|
| Online Status | ✅ | ✅ Contacts only | ❌ |
| Last Seen | ✅ | ✅ Contacts only | ❌ |
| Custom Status | ✅ | ✅ Contacts only | ❌ |

### ✅ Task 69: Typing Indicators with Throttling

**Files:**

- `src/services/realtime/typing.service.ts` - Typing management
- `src/components/chat/typing-indicator.tsx` - UI component

**Features:**

- Channel, thread, and DM typing support
- Debounced input detection (300ms)
- Throttled server emissions (1000ms)
- Auto-timeout (5 seconds)
- Batch updates for performance
- Privacy filtering
- User list formatting

**Room Keys:**

- Channel: `channel:${channelId}`
- Thread: `channel:${channelId}:thread:${threadId}`
- DM: `dm:${dmId}`

### ✅ Task 70: Reconnect Logic and Offline Queue

**Files:**

- `src/services/realtime/offline-queue.ts` - Queue management
- `src/services/realtime/realtime-client.ts` - Reconnection logic

**Features:**

- localStorage persistence
- Exponential backoff (1s → 30s max)
- Maximum retry attempts (5)
- Queue size limit (100 messages)
- Browser online/offline detection
- Automatic reconnection
- Queue flush on reconnection
- Connection quality monitoring

**Retry Delays:**

- Attempt 1: 1s
- Attempt 2: 2s
- Attempt 3: 4s
- Attempt 4: 8s
- Attempt 5: 16s
- Max: 30s

## API Reference

### RealtimeIntegrationService

```typescript
interface RealtimeIntegrationConfig {
  userId?: string
  token?: string
  enablePresence?: boolean // Default: true
  enableTyping?: boolean // Default: true
  enableDeliveryReceipts?: boolean // Default: true
  enableOfflineQueue?: boolean // Default: true
  debug?: boolean // Default: false
  autoConnect?: boolean // Default: true
  realtimeUrl?: string // Default: from env
}

interface IntegrationStatus {
  connected: boolean
  authenticated: boolean
  presenceEnabled: boolean
  typingEnabled: boolean
  deliveryReceiptsEnabled: boolean
  offlineQueueEnabled: boolean
  queuedMessageCount: number
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  reconnectAttempts: number
}
```

### PresenceService

```typescript
// Set status
presence.setStatus('online' | 'away' | 'busy' | 'offline')

// Set custom status
presence.setCustomStatus({
  text: 'In a meeting',
  emoji: '📅',
  expiresAt: new Date('2026-02-03T15:00:00Z'),
})

// Subscribe to users
presence.subscribeToUsers(['user1', 'user2'])

// Get presence
const userPresence = presence.getPresence('user1')
// { status: 'online', customStatus: { ... }, lastSeenAt: Date }

// Update privacy settings
await presence.updatePresenceSettings(userId, {
  visibility: 'contacts',
  showLastSeen: false,
  showOnlineStatus: true,
  invisibleMode: false,
})
```

### TypingService

```typescript
// Start typing
typing.startTyping(channelId, threadId?)

// Stop typing
typing.stopTyping(channelId?, threadId?)

// Handle input change (debounced)
typing.handleInputChange(channelId, inputValue, threadId?)

// Get typing users
const users = typing.getTypingUsers(channelId, threadId?)
// [{ userId, userName, userAvatar, startedAt }]

// Get formatted text
const text = typing.getTypingText(channelId, threadId?)
// "Alice is typing..." or "Alice and Bob are typing..."
```

### DeliveryEventHandler

```typescript
// Track outgoing message
delivery.trackOutgoing(clientMessageId, channelId, totalRecipients)

// Acknowledge read
delivery.acknowledgeRead(messageId, channelId)

// Sync delivery status
await delivery.syncDeliveryStatus([messageId1, messageId2])

// Subscribe to events
delivery.subscribe((event, data) => {
  switch (event) {
    case 'message:sent':
      // Message sent to server
      break
    case 'message:delivered':
      // Message delivered to recipient(s)
      break
    case 'message:read':
      // Message read by recipient(s)
      break
    case 'message:failed':
      // Message send failed
      break
  }
})
```

### OfflineQueueService

```typescript
// Queue a message
const queued = queue.queueMessage({
  channelId,
  content: 'Hello!',
  type: 'text',
  threadId?,
  mentions: ['user1']
})

// Get queued messages
const messages = queue.getQueuedMessages()

// Get queue length
const count = queue.getQueueLength()

// Clear queue
queue.clearQueue()

// Subscribe to events
queue.subscribe((event, data) => {
  switch (event) {
    case 'message:queued':
      // Message added to queue
      break
    case 'message:sent':
      // Queued message sent successfully
      break
    case 'queue:flushing':
      // Queue flush started
      break
    case 'queue:flushed':
      // Queue flush completed
      break
  }
})
```

## Connection Quality Monitoring

The realtime client automatically monitors connection quality:

```typescript
const integration = getRealtimeIntegration()
const status = integration.getStatus()

switch (status.connectionQuality) {
  case 'excellent': // < 100ms latency
    break
  case 'good': // 100-300ms
    break
  case 'fair': // 300-600ms
    break
  case 'poor': // > 600ms
    break
  case 'unknown': // Not measured yet
    break
}
```

## Error Handling

### Connection Errors

```typescript
integration.onStatusChange((status) => {
  if (!status.connected) {
    if (status.reconnectAttempts > 0) {
      showToast(`Reconnecting... (${status.reconnectAttempts})`)
    } else {
      showToast('Disconnected from server')
    }
  }
})
```

### Offline Detection

```typescript
realtimeClient.onOfflineStatusChange((isOnline) => {
  if (!isOnline) {
    showToast('You are offline. Messages will be queued.')
  } else {
    showToast('Back online. Syncing...')
  }
})
```

### Message Send Failures

```typescript
delivery.subscribe((event, data) => {
  if (event === 'message:failed') {
    showToast(`Message failed: ${data.error}`)
    // Optionally retry or show manual retry button
  }
})
```

## Testing

### Unit Tests

Run presence service tests:

```bash
npm test src/services/realtime/__tests__/presence.service.test.ts
```

Run typing service tests:

```bash
npm test src/services/realtime/__tests__/typing.service.test.ts
```

### Integration Tests

Test the full realtime stack:

```bash
npm test src/__tests__/integration/realtime-integration.test.ts
```

### E2E Tests

Test in browser environment:

```bash
npm run test:e2e -- --grep "realtime"
```

## Performance Considerations

1. **Throttling**: Typing events are throttled to 1 event/second per room
2. **Debouncing**: Input changes are debounced by 300ms
3. **Batching**: Read receipts are batched (1 second interval)
4. **Connection Pooling**: Socket connections are pooled and reused
5. **Cleanup**: Expired typing indicators cleaned up every 1 second
6. **Queue Management**: Offline queue limited to 100 messages

## Environment Variables

```bash
# Realtime server URL
NEXT_PUBLIC_REALTIME_URL=http://localhost:3101

# Alternative names (fallbacks)
NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:3101
NEXT_PUBLIC_SOCKET_URL=http://localhost:3101

# Debug mode
NEXT_PUBLIC_DEBUG_REALTIME=true
```

## Troubleshooting

### Connection Won't Establish

1. Check realtime server is running
2. Verify `NEXT_PUBLIC_REALTIME_URL` is set correctly
3. Check network tab for WebSocket connection
4. Enable debug mode for detailed logs

### Typing Indicators Not Showing

1. Verify typing service is enabled in config
2. Check privacy settings (user may have disabled broadcast)
3. Ensure typing events are not being filtered by privacy rules

### Delivery Receipts Missing

1. Verify delivery service is enabled
2. Check GraphQL permissions for receipt mutations
3. Ensure realtime connection is authenticated

### Offline Queue Not Working

1. Check localStorage is available and not full
2. Verify offline queue is enabled in config
3. Check browser console for quota errors

## Migration Guide

### From Old Realtime System

1. Replace individual service imports:

   ```typescript
   // Old
   import { getPresenceService } from '@/services/realtime/presence.service'
   import { getTypingService } from '@/services/realtime/typing.service'

   // New
   import { useRealtimeIntegration } from '@/hooks/use-realtime-integration'
   const { presence, typing } = useRealtimeIntegration()
   ```

2. Update initialization:

   ```typescript
   // Old
   initializePresenceService({ debug: true })
   initializeTypingService({ debug: true })

   // New
   initializeRealtimeIntegration({
     userId: user.id,
     token: user.token,
     enablePresence: true,
     enableTyping: true,
   })
   ```

3. Update status subscriptions:

   ```typescript
   // Old
   presence.onPresenceChange((userPresence) => { ... })

   // New - handled automatically by hook
   const { presence } = useRealtimeIntegration()
   const userPresence = presence?.getPresence(userId)
   ```

## Next Steps

With Phase 7 complete, the following phases can now be implemented:

- **Phase 8**: Advanced messaging features (threads, reactions)
- **Phase 9**: Voice/Video calling integration
- **Phase 10**: File sharing and media handling
- **Phase 11**: Search and indexing
- **Phase 12**: Mobile app builds

## Resources

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Presence System Design](https://docs.google.com/document/d/presence-architecture)
- [Offline-First Architecture](https://offlinefirst.org/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review error logs in browser console
3. Enable debug mode for detailed logging
4. Create an issue in the project repository

---

**Last Updated:** February 3, 2026
**Phase Status:** ✅ Complete
**Next Phase:** Phase 8 - Advanced Messaging
