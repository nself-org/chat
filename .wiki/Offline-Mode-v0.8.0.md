# Offline Mode & Background Sync - v0.8.0

Complete offline support with background synchronization for nself-chat.

## Overview

The offline mode system provides comprehensive support for working without an internet connection, including:

- **Message Caching**: Last 1000 messages per channel
- **Attachment Caching**: Configurable size limits (default 100MB)
- **Offline Queue**: Queue operations while offline for later sync
- **Background Sync**: iOS (15-min intervals) and Android (WorkManager)
- **Conflict Resolution**: Last-write-wins and merge strategies
- **Battery Optimization**: Respects low battery and charging states

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Application Layer                      │
│  (React Components + Hooks)                      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           Offline Manager                        │
│  - Network Detection                             │
│  - Sync Coordination                             │
│  - Queue Management                              │
└──────────────────┬──────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
│  Storage  │ │ Sync  │ │ Conflict  │
│  Manager  │ │ Queue │ │ Resolver  │
└───────────┘ └───────┘ └───────────┘
      │            │            │
┌─────▼────────────▼────────────▼─────┐
│         IndexedDB Storage            │
│  - Messages (1000/channel)           │
│  - Channels                          │
│  - Users                             │
│  - Queue                             │
│  - Attachments (100MB limit)         │
└──────────────────────────────────────┘
```

## Core Components

### 1. Offline Storage (`offline-storage.ts`)

IndexedDB wrapper for offline data persistence.

```typescript
import { messageStorage, channelStorage, queueStorage } from '@/lib/offline/offline-storage'

// Save messages
await messageStorage.save({
  id: 'msg-1',
  channelId: 'channel-1',
  content: 'Hello!',
  senderId: 'user-1',
  senderName: 'John',
  createdAt: new Date(),
  reactions: [],
  attachments: [],
})

// Get last 1000 messages for a channel
const messages = await messageStorage.getByChannel('channel-1', 1000)

// Queue an action while offline
await queueStorage.add({
  id: 'queue-1',
  type: 'send_message',
  payload: { channelId: 'channel-1', content: 'Offline message' },
  priority: 'high',
  status: 'pending',
  // ...
})
```

### 2. Sync Manager (`sync-manager.ts`)

Orchestrates sync operations with the server.

```typescript
import { getSyncManager } from '@/lib/offline/sync-manager'

const syncManager = getSyncManager({
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  syncOnReconnect: true,
  batteryThreshold: 20, // Don't sync below 20%
})

// Initialize
await syncManager.initialize()

// Perform incremental sync (only new data)
const result = await syncManager.incrementalSync()

// Perform full sync (all data)
const fullResult = await syncManager.fullSync()

// Sync specific channel
const channelResult = await syncManager.syncChannel('channel-1')

// Listen to sync events
syncManager.subscribe((event) => {
  console.log('Sync event:', event.type, event.data)
})
```

### 3. Conflict Resolver (`conflict-resolver.ts`)

Handles data conflicts during sync.

```typescript
import { getConflictResolver } from '@/lib/offline/conflict-resolver'

const resolver = getConflictResolver()

// Set user choice callback for complex conflicts
resolver.setUserChoiceCallback(async (conflict) => {
  // Show UI to user for manual resolution
  const choice = await showConflictDialog(conflict)
  return choice
})

// Resolve conflict automatically
const resolution = await resolver.autoResolve(conflict)

if (resolution.resolved) {
  // Use resolved result
  await save(resolution.result)
} else if (resolution.needsUserInput) {
  // Show UI for manual resolution
  await showConflictUI(conflict)
}
```

### 4. Attachment Cache (`attachment-cache.ts`)

Manages offline file caching with LRU eviction.

```typescript
import { getAttachmentCache } from '@/lib/offline/attachment-cache'

const cache = getAttachmentCache({
  maxSize: 100 * 1024 * 1024, // 100MB
  maxFileSize: 25 * 1024 * 1024, // 25MB per file
  generateThumbnails: true,
})

await cache.initialize()

// Download and cache an attachment
const attachment = await cache.download(
  'https://example.com/file.jpg',
  {
    id: 'att-1',
    messageId: 'msg-1',
    channelId: 'channel-1',
    name: 'photo.jpg',
    type: 'image/jpeg',
    size: 1024000,
  },
  (progress) => {
    console.log(`Downloaded ${progress.percent}%`)
  }
)

// Get cached attachment
const cached = await cache.get('att-1')
if (cached) {
  const dataUrl = await cache.getDataUrl('att-1')
  // Use data URL in <img> tag
}

// Get cache statistics
const stats = await cache.getStats()
console.log(`Cache: ${stats.count} files, ${stats.usagePercent}% full`)
```

### 5. Network Detector (`network-detector.ts`)

Monitors network status and quality.

```typescript
import { getNetworkDetector } from '@/lib/offline/network-detector'

const detector = getNetworkDetector()

// Subscribe to network changes
detector.subscribe((info) => {
  console.log('Network state:', info.state)
  console.log('Quality:', info.quality)
  console.log('Connection type:', info.type)
  console.log('RTT:', info.rtt)
})

// Check current status
const isOnline = detector.isOnline()
const quality = detector.getQuality()
const isSlow = detector.isSlowConnection()

// Start periodic connectivity check
detector.startPeriodicCheck(10000, '/api/health')
```

## React Hooks

### useOffline

Complete offline state management.

```typescript
import { useOffline } from '@/hooks/use-offline';

function ChatView() {
  const { state, actions } = useOffline();

  return (
    <div>
      <p>Status: {state.isOnline ? 'Online' : 'Offline'}</p>
      <p>Pending: {state.pendingCount}</p>
      <p>Last sync: {state.lastSyncAt?.toLocaleString()}</p>

      <button onClick={actions.syncNow} disabled={state.isSyncing}>
        {state.isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>

      <button onClick={actions.clearCache}>
        Clear Cache
      </button>
    </div>
  );
}
```

### useSync

Trigger sync operations.

```typescript
import { useSync } from '@/hooks/use-sync';

function SyncButton() {
  const { isSyncing, syncNow, state } = useSync();

  return (
    <button onClick={syncNow} disabled={isSyncing}>
      {isSyncing ? `Syncing... ${state.progress}%` : 'Sync'}
    </button>
  );
}
```

## UI Components

### OfflineIndicator

Shows offline status with pending changes.

```typescript
import { OfflineIndicator, OfflineIndicatorCompact } from '@/components/ui/offline-indicator';

// Full indicator (expandable details)
<OfflineIndicator position="top" detailed={true} />

// Compact floating indicator
<OfflineIndicatorCompact />
```

### SyncProgress

Visual progress indicator for sync operations.

```typescript
import { SyncProgress, SyncProgressToast } from '@/components/ui/sync-progress';

// Full progress card
<SyncProgress detailed={true} />

// Overlay progress
<SyncProgress overlay={true} />

// Toast notification
<SyncProgressToast />
```

## Platform-Specific Background Sync

### iOS Background Fetch

15-minute interval background updates.

```typescript
import { backgroundFetchService } from '@/lib/ios/background-fetch'

// Configure
await backgroundFetchService.configure({
  minimumInterval: 900, // 15 minutes (minimum allowed by iOS)
  stopOnTerminate: false,
  enableHeadless: true,
})

// Start
await backgroundFetchService.start()

// Listen for fetch events
backgroundFetchService.onFetch('my-handler', (result) => {
  console.log('Background fetch completed:', result)
  if (result.newData) {
    showNotification(`${result.messages} new messages`)
  }
})
```

### Android WorkManager

Battery-efficient background jobs.

```typescript
import { workManager } from '@/lib/android/work-manager'

// Initialize
await workManager.initialize({
  enablePeriodicSync: true,
  syncIntervalMinutes: 15,
  requiresCharging: false,
  requiresWifi: false,
})

// Trigger immediate sync
await workManager.syncNow()

// Update sync interval
await workManager.updateSyncInterval(30) // 30 minutes

// Get sync statistics
const stats = await workManager.getSyncStats()
console.log('Last sync:', new Date(stats.lastSyncTime))
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_OFFLINE_CONFIG = {
  // Cache settings
  cacheEnabled: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  cacheChannelMessages: 1000, // Messages per channel
  cacheChannels: 50,

  // Queue settings
  queueEnabled: true,
  maxQueueSize: 100,
  maxQueueAge: 24 * 60 * 60 * 1000, // 24 hours

  // Sync settings
  autoSync: true,
  syncInterval: 30 * 1000, // 30 seconds
  syncOnReconnect: true,
  backgroundSync: true,

  // Retry settings
  retry: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    strategy: 'exponential',
  },

  // Network settings
  networkCheckInterval: 10000,
  networkCheckUrl: '/api/health',
}
```

## Testing Offline Scenarios

### Airplane Mode Test

1. Enable airplane mode
2. Send messages (should queue)
3. Disable airplane mode
4. Messages should sync automatically

### Slow Connection Test

1. Throttle network to 3G
2. Send messages
3. Observe sync progress
4. Verify all messages synced

### Connection Switching Test

1. Switch between WiFi and cellular
2. Send messages during transition
3. Verify no message loss
4. Check sync queue status

### Battery Optimization Test

1. Set battery to <20%
2. Observe background sync pause
3. Plug in charger
4. Verify sync resumes

## Performance Metrics

### Targets

- **Cache Access**: <10ms average
- **Sync Queue Add**: <5ms
- **Incremental Sync**: <3s for 100 messages
- **Conflict Resolution**: <100ms per conflict
- **Battery Impact**: <5% per hour with background sync

### Monitoring

```typescript
import { getStorageStats } from '@/lib/offline/offline-storage'

const stats = await getStorageStats()
console.log('Storage stats:', {
  channels: stats.channels,
  messages: stats.messages,
  users: stats.users,
  queue: stats.queue,
  size: `${(stats.estimatedSize / 1024 / 1024).toFixed(2)}MB`,
})
```

## Best Practices

### 1. Cache Management

- Limit to 1000 messages per channel
- Clean up old cache regularly
- Monitor storage usage

### 2. Queue Management

- Prioritize user-facing operations (messages > reactions)
- Set reasonable retry limits
- Handle permanent failures gracefully

### 3. Sync Strategy

- Use incremental sync by default
- Full sync only when necessary
- Batch operations for efficiency

### 4. Battery Optimization

- Respect battery saver mode
- Reduce sync frequency on low battery
- Pause sync when battery < 20%

### 5. Conflict Resolution

- Use last-write-wins for simple conflicts
- Prompt user for important conflicts
- Maintain tombstone records for deletions

## Troubleshooting

### Sync Not Working

1. Check network status: `detector.isOnline()`
2. Check sync status: `syncManager.getState()`
3. Check queue: `queueStorage.getPending()`
4. Review error logs in sync events

### High Battery Usage

1. Check sync interval: reduce if needed
2. Disable background sync when idle
3. Respect battery threshold settings

### Storage Full

1. Check cache stats: `getStorageStats()`
2. Clear old messages: `messageStorage.clear()`
3. Reduce attachment cache size
4. Clean up completed queue items

## API Reference

See TypeScript definitions in:

- `/src/lib/offline/offline-types.ts` - All types and interfaces
- `/src/lib/offline/offline-storage.ts` - Storage API
- `/src/lib/offline/sync-manager.ts` - Sync API
- `/src/lib/offline/conflict-resolver.ts` - Conflict resolution API
- `/src/lib/offline/attachment-cache.ts` - Attachment cache API

## Version History

### v0.8.0 (Current)

- ✅ Complete offline storage with 1000-message caching
- ✅ Attachment caching with configurable limits
- ✅ Offline queue with priority management
- ✅ Incremental and full sync operations
- ✅ Conflict resolution (last-write-wins, merge)
- ✅ iOS background fetch integration
- ✅ Android WorkManager integration
- ✅ Battery-aware sync scheduling
- ✅ Network quality monitoring
- ✅ React hooks and UI components
- ✅ Comprehensive test suite

## License

MIT
