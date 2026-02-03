# Offline Mode Quick Start Guide

Get offline mode working in your nself-chat app in 5 minutes.

## 1. Basic Setup (2 minutes)

Add the offline indicator to your main layout:

```tsx
// src/app/layout.tsx or src/components/layout/main-layout.tsx
import { OfflineIndicator } from '@/components/ui/offline-indicator'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <OfflineIndicator position="top" detailed={true} />
      {children}
    </div>
  )
}
```

## 2. Initialize Sync Manager (1 minute)

Initialize the sync manager when the app starts:

```tsx
// src/app/layout.tsx or src/contexts/app-provider.tsx
'use client'

import { useEffect } from 'react'
import { getSyncManager } from '@/lib/offline/sync-manager'

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize sync manager
    const syncManager = getSyncManager({
      autoSync: true,
      syncInterval: 30000, // 30 seconds
      syncOnReconnect: true,
    })

    syncManager.initialize().catch(console.error)

    return () => {
      syncManager.shutdown()
    }
  }, [])

  return <>{children}</>
}
```

## 3. Cache Messages (1 minute)

Save messages to cache when received:

```tsx
// src/hooks/use-messages.ts
import { messageStorage } from '@/lib/offline/offline-storage'
import { useEffect } from 'react'

export function useMessages(channelId: string) {
  const { data: messages } = useQuery(GET_MESSAGES, {
    variables: { channelId },
  })

  // Cache messages for offline access
  useEffect(() => {
    if (messages) {
      const cached = messages.map((msg) => ({
        id: msg.id,
        channelId: msg.channel_id,
        content: msg.content,
        senderId: msg.user_id,
        senderName: msg.user?.displayName || 'Unknown',
        createdAt: new Date(msg.created_at),
        reactions: msg.reactions || [],
        attachments: msg.attachments || [],
      }))

      messageStorage.saveMany(cached).catch(console.error)
    }
  }, [messages])

  return { messages }
}
```

## 4. Queue Offline Messages (1 minute)

Queue messages sent while offline:

```tsx
// src/components/chat/message-input.tsx
import { queueStorage } from '@/lib/offline/offline-storage'
import { useOfflineStatus } from '@/hooks/use-offline'
import { v4 as uuid } from 'uuid'

export function MessageInput({ channelId }: { channelId: string }) {
  const isOnline = useOfflineStatus()
  const [sendMessage] = useMutation(SEND_MESSAGE)

  const handleSend = async (content: string) => {
    if (isOnline) {
      // Send normally
      await sendMessage({ variables: { channelId, content } })
    } else {
      // Queue for later
      await queueStorage.add({
        id: uuid(),
        type: 'send_message',
        payload: {
          channelId,
          content,
          tempId: uuid(),
        },
        priority: 'high',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 5,
        lastError: null,
      })
    }
  }

  return (
    <input
      type="text"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleSend(e.currentTarget.value)
          e.currentTarget.value = ''
        }
      }}
      placeholder={isOnline ? 'Type a message...' : 'Offline - message will send later'}
    />
  )
}
```

## That's It!

You now have:

- ✅ Offline indicator showing connection status
- ✅ Automatic message caching
- ✅ Offline message queueing
- ✅ Auto-sync on reconnect
- ✅ Background sync (on mobile)

## Test It

1. Open DevTools → Network tab
2. Select "Offline" from the throttling dropdown
3. Send a message
4. See it appear with a pending indicator
5. Go back "Online"
6. Watch it sync automatically!

## Advanced Features

### Add Sync Button

```tsx
import { useSync } from '@/hooks/use-sync'

function SyncButton() {
  const { isSyncing, syncNow } = useSync()

  return (
    <button onClick={syncNow} disabled={isSyncing}>
      {isSyncing ? 'Syncing...' : 'Sync Now'}
    </button>
  )
}
```

### Show Pending Count

```tsx
import { usePendingCount } from '@/hooks/use-offline'

function PendingBadge() {
  const count = usePendingCount()

  if (count === 0) return null

  return <span className="badge">{count} pending</span>
}
```

### Monitor Sync Progress

```tsx
import { SyncProgressToast } from '@/components/ui/sync-progress'

function App() {
  return (
    <>
      <YourApp />
      <SyncProgressToast />
    </>
  )
}
```

### Cache Attachments

```tsx
import { getAttachmentCache } from '@/lib/offline/attachment-cache'

async function downloadAttachment(url: string, messageId: string) {
  const cache = getAttachmentCache()
  await cache.initialize()

  const attachment = await cache.download(
    url,
    {
      id: uuid(),
      messageId,
      channelId: 'channel-1',
      name: 'file.jpg',
      type: 'image/jpeg',
      size: 1024000,
    },
    (progress) => {
      console.log(`Downloaded ${progress.percent}%`)
    }
  )

  // Get data URL for display
  const dataUrl = await cache.getDataUrl(attachment.id)
  return dataUrl
}
```

## Mobile Setup

### iOS Background Fetch

```typescript
// src/app/layout.tsx (Capacitor app)
import { backgroundFetchService } from '@/lib/ios/background-fetch'

useEffect(() => {
  if (Capacitor.getPlatform() === 'ios') {
    backgroundFetchService.start()

    backgroundFetchService.onFetch('app', (result) => {
      if (result.newData) {
        // Show notification or update UI
      }
    })
  }
}, [])
```

### Android WorkManager

```typescript
// src/app/layout.tsx (Capacitor app)
import { workManager } from '@/lib/android/work-manager'

useEffect(() => {
  if (Capacitor.getPlatform() === 'android') {
    workManager.initialize({
      syncIntervalMinutes: 15,
      requiresCharging: false,
      requiresWifi: false,
    })
  }
}, [])
```

## Configuration

Customize offline behavior:

```typescript
import { getSyncManager } from '@/lib/offline/sync-manager'
import { getAttachmentCache } from '@/lib/offline/attachment-cache'

// Configure sync
const syncManager = getSyncManager({
  autoSync: true,
  syncInterval: 60000, // 1 minute
  batteryThreshold: 15, // Pause sync below 15%
  batchSize: 50,
})

// Configure attachment cache
const cache = getAttachmentCache({
  maxSize: 200 * 1024 * 1024, // 200MB
  maxFileSize: 50 * 1024 * 1024, // 50MB per file
  generateThumbnails: true,
})
```

## Troubleshooting

### Messages not syncing?

Check the queue:

```typescript
import { queueStorage } from '@/lib/offline/offline-storage'

const pending = await queueStorage.getPending()
console.log('Pending items:', pending)
```

### Sync failing?

Check sync state:

```typescript
import { getSyncManager } from '@/lib/offline/sync-manager'

const syncManager = getSyncManager()
const state = syncManager.getState()
console.log('Sync state:', state)
```

### Cache full?

Check storage stats:

```typescript
import { getStorageStats } from '@/lib/offline/offline-storage'

const stats = await getStorageStats()
console.log('Storage:', stats)
```

## Next Steps

- Read the [full documentation](./Offline-Mode-v0.8.0.md)
- Implement conflict resolution
- Add progress indicators
- Customize sync behavior
- Test on mobile devices

## Support

For issues or questions:

- Check the troubleshooting section in the full docs
- Review the test files for examples
- Look at the integration tests

Happy offline coding! 🚀
