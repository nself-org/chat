# Offline & Sync Integration Guide

Quick guide for integrating the offline and sync system into nself-chat.

---

## Quick Start

### 1. Initialize the System

Add to your root layout or app initialization:

```typescript
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeOfflineSystem } from '@/lib/offline';

export function RootLayout({ children }) {
  useEffect(() => {
    // Initialize offline system
    initializeOfflineSystem({
      config: {
        autoSync: true,
        syncInterval: 30000, // 30 seconds
        syncOnReconnect: true,
      },
      fetchers: {
        // Define data fetchers for sync
        fetchChannels: async () => {
          // Fetch channels from API
          const response = await fetch('/api/channels');
          return response.json();
        },
        fetchMessages: async (channelId: string, since?: Date) => {
          // Fetch messages from API
          const url = since
            ? `/api/channels/${channelId}/messages?since=${since.toISOString()}`
            : `/api/channels/${channelId}/messages`;
          const response = await fetch(url);
          return response.json();
        },
        fetchUsers: async () => {
          // Fetch users from API
          const response = await fetch('/api/users');
          return response.json();
        },
      },
    });

    // Cleanup on unmount
    return () => {
      cleanupOfflineSystem();
    };
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## 2. Add UI Components

### Offline Indicator

Add to your main layout:

```typescript
// src/app/chat/layout.tsx
import { OfflineIndicator } from '@/components/ui/offline-indicator';

export default function ChatLayout({ children }) {
  return (
    <div>
      <OfflineIndicator position="top" detailed={true} />
      {children}
    </div>
  );
}
```

### Sync Progress

Add to your chat view:

```typescript
// src/app/chat/page.tsx
import { SyncProgressToast } from '@/components/ui/sync-progress';

export default function ChatPage() {
  return (
    <div>
      <SyncProgressToast />
      {/* Your chat UI */}
    </div>
  );
}
```

---

## 3. Use Offline Hook

In your chat components:

```typescript
// src/components/chat/ChatView.tsx
'use client';

import { useOffline } from '@/hooks/use-offline';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

export function ChatView() {
  const { state, actions } = useOffline();

  return (
    <div>
      {/* Show offline banner */}
      {!state.isOnline && (
        <div className="bg-yellow-100 p-2 text-center">
          You are offline. Messages will be sent when you reconnect.
          {state.pendingCount > 0 && ` (${state.pendingCount} pending)`}
        </div>
      )}

      <MessageList />
      <MessageInput disabled={!state.isOnline && state.pendingCount >= 10} />

      {/* Manual sync button */}
      <button
        onClick={actions.syncNow}
        disabled={state.isSyncing || !state.isOnline}
      >
        {state.isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}
```

---

## 4. Queue Messages While Offline

```typescript
// src/components/chat/MessageInput.tsx
'use client';

import { useState } from 'react';
import { getSyncQueue } from '@/lib/offline';
import { messageStorage } from '@/lib/offline/offline-storage';
import { v4 as uuidv4 } from 'uuid';

export function MessageInput({ channelId }: { channelId: string }) {
  const [content, setContent] = useState('');

  const handleSend = async () => {
    const tempId = uuidv4();
    const message = {
      id: tempId,
      channelId,
      content,
      senderId: 'current-user-id',
      senderName: 'Current User',
      createdAt: new Date(),
      reactions: [],
      attachments: [],
      isPending: true,
      tempId,
    };

    // Save to local cache immediately (optimistic UI)
    await messageStorage.save(message);

    // Queue for sync
    const queue = getSyncQueue();
    await queue.add('message', 'create', {
      channelId,
      content,
      tempId,
    }, {
      priority: 10, // High priority for messages
      channelId,
    });

    setContent('');
  };

  return (
    <div>
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

---

## 5. Register Queue Processors

```typescript
// src/lib/sync/processors.ts
import { getSyncQueue } from '@/lib/offline';
import { messageStorage } from '@/lib/offline/offline-storage';
import type { SyncQueueItem } from '@/lib/offline';

export function registerSyncProcessors() {
  const queue = getSyncQueue();

  // Message processor
  queue.registerProcessor('message', async (item: SyncQueueItem) => {
    if (item.operation === 'create') {
      const { channelId, content, tempId } = item.data as any;

      // Send to server
      const response = await fetch(`/api/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const serverMessage = await response.json();

      // Update local cache with server ID
      await messageStorage.remove(tempId);
      await messageStorage.save({
        ...serverMessage,
        isPending: false,
      });
    }
  });

  // Reaction processor
  queue.registerProcessor('reaction', async (item: SyncQueueItem) => {
    const { messageId, emoji } = item.data as any;

    const response = await fetch(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      throw new Error('Failed to add reaction');
    }
  });

  // Add more processors as needed...
}

// Call this during app initialization
registerSyncProcessors();
```

---

## 6. Load Cached Data

```typescript
// src/hooks/use-messages.ts
'use client';

import { useState, useEffect } from 'react';
import { messageStorage } from '@/lib/offline/offline-storage';
import { useOfflineStatus } from '@/hooks/use-offline';
import type { CachedMessage } from '@/lib/offline';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<CachedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOfflineStatus();

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);

      if (isOnline) {
        // Fetch from server
        try {
          const response = await fetch(`/api/channels/${channelId}/messages`);
          const serverMessages = await response.json();

          // Update cache
          await messageStorage.saveMany(serverMessages);
          setMessages(serverMessages);
        } catch (error) {
          // Fall back to cache on error
          const cached = await messageStorage.getByChannel(channelId);
          setMessages(cached);
        }
      } else {
        // Load from cache when offline
        const cached = await messageStorage.getByChannel(channelId);
        setMessages(cached);
      }

      setLoading(false);
    };

    loadMessages();
  }, [channelId, isOnline]);

  return { messages, loading };
}
```

---

## 7. Handle Attachments

```typescript
// src/hooks/use-attachment.ts
'use client';

import { useState, useEffect } from 'react';
import { getAttachmentCache } from '@/lib/offline';
import type { CachedAttachment } from '@/lib/offline';

export function useAttachment(attachmentId: string, url: string) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadAttachment = async () => {
      const cache = getAttachmentCache();

      // Check if cached
      const cached = await cache.get(attachmentId);
      if (cached) {
        const url = await cache.getDataUrl(attachmentId);
        setDataUrl(url);
        setLoading(false);
        return;
      }

      // Download and cache
      try {
        const attachment = await cache.download(
          url,
          {
            id: attachmentId,
            messageId: 'msg-id',
            channelId: 'ch-id',
            name: 'attachment.jpg',
            type: 'image/jpeg',
            size: 0, // Will be set from response
          },
          (p) => setProgress(p.percent)
        );

        const dataUrl = await cache.getDataUrl(attachmentId);
        setDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to load attachment:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttachment();
  }, [attachmentId, url]);

  return { dataUrl, loading, progress };
}
```

---

## 8. Settings Page Integration

```typescript
// src/app/settings/offline/page.tsx
'use client';

import { useOffline } from '@/hooks/use-offline';
import { useSync } from '@/hooks/use-sync';

export default function OfflineSettingsPage() {
  const { state, actions } = useOffline();
  const sync = useSync();

  return (
    <div className="space-y-6">
      <h1>Offline Settings</h1>

      {/* Connection Status */}
      <section>
        <h2>Connection Status</h2>
        <div>
          Status: {state.isOnline ? 'Online' : 'Offline'}
        </div>
        <div>
          Quality: {state.connectionInfo.quality}
        </div>
        <div>
          Type: {state.connectionInfo.type}
        </div>
        {state.connectionInfo.rtt && (
          <div>Latency: {state.connectionInfo.rtt}ms</div>
        )}
      </section>

      {/* Sync Settings */}
      <section>
        <h2>Sync Settings</h2>
        <label>
          <input
            type="checkbox"
            checked={sync.state.status !== 'idle'}
            onChange={(e) => sync.setAutoSync(e.target.checked)}
          />
          Auto Sync
        </label>
        <div>
          <label>Sync Interval (seconds):</label>
          <input
            type="number"
            value={30}
            onChange={(e) => sync.setSyncInterval(+e.target.value * 1000)}
          />
        </div>
        <button onClick={sync.syncNow} disabled={sync.isSyncing}>
          {sync.isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </section>

      {/* Queue Status */}
      <section>
        <h2>Queue Status</h2>
        <div>Pending: {state.pendingCount}</div>
        <button onClick={actions.retryFailed}>
          Retry Failed
        </button>
        <button onClick={actions.clearQueue}>
          Clear Queue
        </button>
      </section>

      {/* Cache Management */}
      <section>
        <h2>Cache Management</h2>
        <div>Channels: {state.cacheStats.channels}</div>
        <div>Messages: {state.cacheStats.messages}</div>
        <div>Users: {state.cacheStats.users}</div>
        <div>
          Size: {(state.cacheStats.estimatedSize / 1024 / 1024).toFixed(2)} MB
        </div>
        <button onClick={actions.refreshStats}>
          Refresh Stats
        </button>
        <button
          onClick={actions.clearCache}
          className="text-red-600"
        >
          Clear Cache
        </button>
      </section>
    </div>
  );
}
```

---

## 9. Conflict Resolution UI

```typescript
// src/components/sync/ConflictDialog.tsx
'use client';

import { useState } from 'react';
import { getConflictResolver } from '@/lib/offline';
import type { Conflict } from '@/lib/offline';

export function ConflictDialog({ conflict, onResolve }: {
  conflict: Conflict;
  onResolve: (result: any) => void;
}) {
  const [choice, setChoice] = useState<'local' | 'remote'>('local');

  const handleResolve = () => {
    const result = choice === 'local' ? conflict.local : conflict.remote;
    onResolve(result);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-2xl">
        <h2>Conflict Detected</h2>
        <p>
          This {conflict.itemType} was modified on multiple devices.
          Please choose which version to keep:
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Local version */}
          <div className={choice === 'local' ? 'border-blue-500 border-2' : ''}>
            <h3>Your Changes</h3>
            <div className="text-sm text-gray-600">
              {new Date(conflict.localTimestamp).toLocaleString()}
            </div>
            <pre className="mt-2 p-2 bg-gray-100">
              {JSON.stringify(conflict.local, null, 2)}
            </pre>
            <button onClick={() => setChoice('local')}>
              Choose This
            </button>
          </div>

          {/* Remote version */}
          <div className={choice === 'remote' ? 'border-blue-500 border-2' : ''}>
            <h3>Server Version</h3>
            <div className="text-sm text-gray-600">
              {new Date(conflict.remoteTimestamp).toLocaleString()}
            </div>
            <pre className="mt-2 p-2 bg-gray-100">
              {JSON.stringify(conflict.remote, null, 2)}
            </pre>
            <button onClick={() => setChoice('remote')}>
              Choose This
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={handleResolve} className="btn-primary">
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
}

// Register the callback
function registerConflictHandler() {
  const resolver = getConflictResolver();

  resolver.setUserChoiceCallback(async (conflict) => {
    return new Promise((resolve) => {
      // Show dialog (you'll need to manage this with state)
      showConflictDialog(conflict, resolve);
    });
  });
}
```

---

## 10. Service Worker Registration

```typescript
// src/lib/pwa/register-sw.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Registered:', registration.scope);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] New version available');
                // Optionally show update notification
              }
            });
          }
        });
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    });
  }
}

// Call in app initialization
registerServiceWorker();
```

---

## Testing Offline Functionality

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Check "Offline" checkbox
4. Or use "Slow 3G" / "Fast 3G" throttling

### Manual Testing

```typescript
// Simulate offline
window.dispatchEvent(new Event('offline'));

// Simulate online
window.dispatchEvent(new Event('online'));

// Check status
console.log('Online:', navigator.onLine);

// Check cached data
import { messageStorage } from '@/lib/offline/offline-storage';
const messages = await messageStorage.getAll();
console.log('Cached messages:', messages);

// Check queue
import { queueStorage } from '@/lib/offline/offline-storage';
const pending = await queueStorage.getPending();
console.log('Pending actions:', pending);
```

---

## Common Patterns

### 1. Optimistic UI Updates

```typescript
// Update UI immediately, sync in background
async function sendMessage(content: string) {
  const tempId = uuidv4();

  // 1. Show in UI immediately
  setMessages(prev => [...prev, {
    id: tempId,
    content,
    isPending: true,
    createdAt: new Date(),
  }]);

  // 2. Queue for sync
  await queueStorage.add({
    type: 'send_message',
    data: { content, tempId },
  });

  // 3. Will sync automatically when online
}
```

### 2. Fallback to Cache

```typescript
async function loadMessages(channelId: string) {
  try {
    // Try server first
    const response = await fetch(`/api/channels/${channelId}/messages`);
    const messages = await response.json();

    // Update cache
    await messageStorage.saveMany(messages);
    return messages;
  } catch (error) {
    // Fall back to cache
    console.log('Using cached messages');
    return await messageStorage.getByChannel(channelId);
  }
}
```

### 3. Progressive Enhancement

```typescript
function ChatComponent() {
  const { state } = useOffline();

  return (
    <div>
      {/* Works online */}
      {state.isOnline && <RealTimeIndicator />}

      {/* Works offline */}
      <MessageList />
      <MessageInput />

      {/* Enhanced when online */}
      {state.isOnline && state.connectionInfo.quality === 'excellent' && (
        <VideoCallButton />
      )}
    </div>
  );
}
```

---

## Best Practices

### 1. Always Cache Critical Data
- User profile
- Recent messages
- Active channels
- Contact list

### 2. Queue Important Actions
- Message sending
- Reactions
- Read receipts
- Status updates

### 3. Handle Edge Cases
- Queue full → Show warning
- Cache full → Auto-cleanup
- Sync conflict → User choice
- Network timeout → Retry

### 4. Provide Feedback
- Show offline indicator
- Display sync progress
- Indicate pending messages
- Show cache statistics

### 5. Optimize Performance
- Batch operations
- Limit concurrent syncs
- Use indexes for queries
- Implement pagination

### 6. Monitor & Debug
- Log sync operations
- Track error rates
- Monitor cache size
- Measure sync times

---

## Troubleshooting

### IndexedDB Quota Exceeded
```typescript
// Clear old data
await messageStorage.clear();
await channelStorage.clear();

// Or increase quota (if supported)
if ('storage' in navigator && 'persist' in navigator.storage) {
  const persisted = await navigator.storage.persist();
  console.log('Persistent storage:', persisted);
}
```

### Sync Not Working
```typescript
// Check sync manager status
const syncManager = getSyncManager();
const state = syncManager.getState();
console.log('Sync state:', state);

// Manually trigger sync
await syncManager.fullSync();
```

### Queue Not Processing
```typescript
// Check queue
const queue = getSyncQueue();
const pending = await queue.getPending();
console.log('Pending:', pending);

// Check processors
const config = queue.getConfig();
console.log('Config:', config);

// Manually process
await queue.process();
```

---

## Performance Tips

1. **Limit Cache Size**: Don't cache everything
2. **Use Indexes**: Query by indexed fields
3. **Batch Operations**: Use `putMany` instead of multiple `put` calls
4. **Lazy Load**: Load data as needed
5. **Throttle Sync**: Don't sync too frequently
6. **Monitor Memory**: Watch for memory leaks
7. **Clean Up**: Remove old data periodically

---

## Summary

The offline system is now fully integrated into your app. Key points:

- ✅ Initialize system on app start
- ✅ Add UI components for visibility
- ✅ Use hooks in components
- ✅ Queue actions when offline
- ✅ Register processors for sync
- ✅ Load cached data as fallback
- ✅ Handle conflicts gracefully
- ✅ Provide user feedback
- ✅ Monitor and debug

Your app now works seamlessly online and offline!
