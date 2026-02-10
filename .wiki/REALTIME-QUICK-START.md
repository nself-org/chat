# Realtime Features - Quick Start Guide

**5-Minute Setup Guide for Phase 7 Realtime Features**

## TL;DR

```typescript
// 1. Initialize (in your app layout or provider)
import { initializeRealtimeIntegration } from '@/services/realtime/realtime-integration.service'

initializeRealtimeIntegration({
  userId: user.id,
  token: user.token,
  enablePresence: true,
  enableTyping: true,
  enableDeliveryReceipts: true,
  enableOfflineQueue: true,
  autoConnect: true,
})

// 2. Use in components
import { useRealtimeIntegration } from '@/hooks/use-realtime-integration'

const { presence, typing, delivery } = useRealtimeIntegration()

// 3. Set presence
presence?.setStatus('online')

// 4. Handle typing
typing?.handleInputChange(channelId, inputValue)

// 5. Track delivery
delivery?.trackOutgoing(messageId, channelId)
```

## Step 1: Environment Setup

Add to `.env.local`:

```bash
NEXT_PUBLIC_REALTIME_URL=http://localhost:3101
```

## Step 2: Initialize Services

In your root layout or app provider:

```typescript
// app/layout.tsx or providers/realtime-provider.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { initializeRealtimeIntegration } from '@/services/realtime/realtime-integration.service'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      initializeRealtimeIntegration({
        userId: user.id,
        token: user.token || `user:${user.id}`, // Use real JWT in production
        enablePresence: true,
        enableTyping: true,
        enableDeliveryReceipts: true,
        enableOfflineQueue: true,
        debug: process.env.NODE_ENV === 'development',
        autoConnect: true,
      })
    }
  }, [user])

  return <>{children}</>
}
```

## Step 3: Add Connection Status

In your header/navbar:

```typescript
import { ConnectionStatus } from '@/components/realtime/connection-status'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <ConnectionStatus variant="header" showDetails />
    </header>
  )
}
```

## Step 4: Use in Chat Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRealtimeIntegration } from '@/hooks/use-realtime-integration'

export function ChatComponent({ channelId }: { channelId: string }) {
  const [inputValue, setInputValue] = useState('')
  const { isConnected, presence, typing, delivery, queue } = useRealtimeIntegration()

  // Set presence to online
  useEffect(() => {
    presence?.setStatus('online')
  }, [presence])

  // Handle typing
  const handleInput = (value: string) => {
    setInputValue(value)
    typing?.handleInputChange(channelId, value)
  }

  // Send message
  const sendMessage = async () => {
    const clientMessageId = `msg_${Date.now()}`

    // Track delivery
    delivery?.trackOutgoing(clientMessageId, channelId)

    if (isConnected) {
      // Send via API
      await sendToServer(inputValue)
    } else {
      // Queue if offline
      queue?.queueMessage({
        channelId,
        content: inputValue,
        type: 'text',
      })
    }

    setInputValue('')
    typing?.stopTyping(channelId)
  }

  // Get typing users
  const typingUsers = typing?.getTypingUsers(channelId) || []
  const typingText = typing?.getTypingText(channelId)

  return (
    <div>
      {/* Typing indicator */}
      {typingText && <div className="text-sm text-gray-500">{typingText}</div>}

      {/* Input */}
      <input
        value={inputValue}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="Type a message..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  )
}
```

## Common Use Cases

### 1. Show User Presence

```typescript
const { presence } = useRealtimeIntegration()

// Subscribe to users
useEffect(() => {
  if (presence) {
    presence.subscribeToUsers(['user1', 'user2'])
  }
}, [presence])

// Get presence
const userPresence = presence?.getPresence('user1')
const isOnline = userPresence?.status === 'online'

// Show indicator
<div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
```

### 2. Set Custom Status

```typescript
presence?.setCustomStatus({
  text: 'In a meeting',
  emoji: '📅',
  expiresAt: new Date('2026-02-03T15:00:00Z'),
})

// Clear custom status
presence?.setCustomStatus(null)
```

### 3. Track Message Delivery

```typescript
// When sending
delivery?.trackOutgoing(clientMessageId, channelId, recipientCount)

// Subscribe to updates (in useEffect)
delivery?.subscribe((event, data) => {
  if (event === 'message:delivered') {
    console.log('Message delivered:', data)
  }
})

// When message becomes visible
delivery?.acknowledgeRead(messageId, channelId)
```

### 4. Handle Offline Messages

```typescript
// Queue message when offline
if (!isConnected && queue) {
  queue.queueMessage({
    channelId,
    content,
    type: 'text',
  })
}

// Check queue count
const queuedCount = queue?.getQueueLength() || 0

// Subscribe to queue events
queue?.subscribe((event, data) => {
  if (event === 'queue:flushed') {
    console.log('Queue flushed:', data.count)
  }
})
```

### 5. Privacy Settings

```typescript
// Get presence service directly
import { getPresenceService } from '@/services/realtime/presence.service'

const presenceService = getPresenceService()

// Update privacy settings
await presenceService.updatePresenceSettings(userId, {
  visibility: 'contacts', // everyone | contacts | nobody
  showLastSeen: false,
  showOnlineStatus: true,
  invisibleMode: false,
})

// Enable invisible mode
await presenceService.setInvisibleMode(true)
```

## Debugging

Enable debug logs:

```typescript
initializeRealtimeIntegration({
  // ...other config
  debug: true,
})
```

Check status in console:

```typescript
import { getRealtimeIntegration } from '@/services/realtime/realtime-integration.service'

const integration = getRealtimeIntegration()
const status = integration.getStatus()

console.log('Status:', status)
// {
//   connected: true,
//   authenticated: true,
//   presenceEnabled: true,
//   typingEnabled: true,
//   deliveryReceiptsEnabled: true,
//   offlineQueueEnabled: true,
//   queuedMessageCount: 0,
//   connectionQuality: 'excellent',
//   reconnectAttempts: 0
// }
```

## Troubleshooting

### Connection Issues

```typescript
const { reconnect } = useRealtimeIntegration()

// Manual reconnect
await reconnect()
```

### Queue Not Flushing

```typescript
import { getOfflineQueueService } from '@/services/realtime/offline-queue'

const queue = getOfflineQueueService()

// Manual flush
await queue.flushQueue()

// Check queue state
console.log('Queue:', queue.getQueuedMessages())
```

### Presence Not Updating

```typescript
import { getPresenceService } from '@/services/realtime/presence.service'

const presence = getPresenceService()

// Force heartbeat
presence.startHeartbeat()

// Check current status
console.log('My status:', presence.getStatus())
console.log('Custom status:', presence.getCustomStatus())
```

## Performance Tips

1. **Subscribe only to needed users**

   ```typescript
   // Good: Subscribe to visible users
   presence?.subscribeToUsers(visibleUserIds)

   // Bad: Subscribe to all users
   presence?.subscribeToUsers(allUserIds) // Can be 1000s
   ```

2. **Unsubscribe when done**

   ```typescript
   useEffect(() => {
     presence?.subscribeToUsers(userIds)
     return () => presence?.unsubscribeFromUsers(userIds)
   }, [userIds])
   ```

3. **Use typing service's built-in debouncing**

   ```typescript
   // Good: Let service handle it
   typing?.handleInputChange(channelId, value)

   // Bad: Manual implementation
   const debounce = /* ... */
   ```

4. **Batch read receipts automatically**
   ```typescript
   // Reads are automatically batched every 1 second
   delivery?.acknowledgeRead(messageId, channelId)
   ```

## Next Steps

- Read full guide: `docs/PHASE-7-REALTIME-INTEGRATION.md`
- See examples: `docs/examples/realtime-integration-example.tsx`
- API reference: Check JSDoc comments in service files
- Advanced features: Privacy controls, connection quality, etc.

## Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: `docs/` folder
- Examples: `docs/examples/` folder

---

**Last Updated:** February 3, 2026
**Version:** 0.9.0
