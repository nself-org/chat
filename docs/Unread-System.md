# Unread Messages & Jump Navigation System

Complete documentation for the unread message tracking and navigation system in nself-chat.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Hooks](#hooks)
- [Core Library](#core-library)
- [Integration Guide](#integration-guide)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Advanced Features](#advanced-features)
- [Testing](#testing)
- [Performance](#performance)

---

## Overview

The unread system provides comprehensive tracking and navigation for unread messages across channels, with support for mentions, persistent storage, real-time sync, and cross-tab coordination.

### Features

**Tracking:**
- ✅ Per-channel last read position
- ✅ Unread message counts
- ✅ Unread mention tracking
- ✅ Persistent across sessions (localStorage)
- ✅ Cross-tab synchronization (BroadcastChannel)
- ✅ Auto mark-as-read on scroll
- ✅ Manual mark as read/unread

**UI Indicators:**
- ✅ Badge counts on channels
- ✅ Dots for unread (red for mentions)
- ✅ Unread line in message list
- ✅ Mention highlights
- ✅ Multiple display variants

**Navigation:**
- ✅ Jump to first unread message
- ✅ Jump to next/previous unread channel
- ✅ Jump between mentions
- ✅ Keyboard shortcuts
- ✅ Smooth scroll animations

**Integration:**
- ✅ Browser tab badge (title)
- ✅ Desktop app badge (Electron/Tauri)
- ✅ Push notifications
- ✅ Notification store sync

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  User Actions                        │
│  (scroll, click, navigate)                          │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│              React Components                        │
│  (MessageList, UnreadIndicator, JumpToUnread)       │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│               useUnread Hook                         │
│  - Manages unread state per channel                 │
│  - Syncs with tracker and notification store        │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│            UnreadTracker Class                       │
│  - Core tracking logic                              │
│  - Persistent storage (localStorage)                │
│  - Cross-tab sync (BroadcastChannel)               │
└───────────────┬─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│           NotificationStore (Zustand)                │
│  - Global unread counts                             │
│  - Notification management                          │
└─────────────────────────────────────────────────────┘
```

### State Management

**Per-Channel State:**
```typescript
interface ChannelUnreadState {
  channelId: string
  position?: {
    lastReadMessageId: string
    lastReadAt: Date
    messageTimestamp: Date
  }
  unreadCount: number
  mentionCount: number
  lastUpdated: Date
}
```

**Global State (via useNotificationStore):**
```typescript
interface UnreadCounts {
  total: number
  mentions: number
  directMessages: number
  threads: number
  byChannel: Record<string, { unread: number; mentions: number }>
}
```

---

## Components

### UnreadIndicator

Visual indicators for unread messages in various styles.

#### Variants

**Badge** - Full count badge:
```tsx
<UnreadBadge
  unreadCount={5}
  mentionCount={2}
  size="sm"
  position="inline"
/>
```

**Dot** - Minimal dot indicator:
```tsx
<UnreadDot
  unreadCount={3}
  mentionCount={1}
  size="sm"
  position="top-right"
/>
```

**Line** - Horizontal divider in message list:
```tsx
<UnreadLine
  count={10}
  label="New Messages"
/>
```

**Sidebar** - Channel list item with unread:
```tsx
<SidebarUnread
  channelName="general"
  channelType="channel"
  unreadCount={5}
  mentionCount={2}
  isActive={false}
  onClick={() => switchChannel('general')}
/>
```

**Inline** - Compact inline with tooltip:
```tsx
<InlineUnread
  unreadCount={3}
  mentionCount={1}
  showCount={true}
/>
```

#### Mention Highlight

Wrap messages that mention the current user:

```tsx
<MentionHighlight isMentioned={message.mentionedUsers?.includes(userId)}>
  <MessageItem message={message} />
</MentionHighlight>
```

### JumpToUnread

Floating action button for jumping to unread messages.

#### Basic Usage

```tsx
<JumpToUnreadButton
  hasUnread={hasUnread}
  unreadCount={unreadCount}
  mentionCount={mentionCount}
  onJumpToUnread={handleJumpToUnread}
  position="bottom-center"
  variant="default"
/>
```

#### Variants

**Default** - Full featured with text:
```tsx
<JumpToUnreadButton variant="default" {...props} />
```

**Compact** - Icon and count only:
```tsx
<JumpToUnreadButton variant="compact" {...props} />
```

**Minimal** - Subtle text button:
```tsx
<JumpToUnreadButton variant="minimal" {...props} />
```

#### Jump Between Channels

```tsx
<JumpToChannel
  onNextUnread={handleNextChannel}
  onPrevUnread={handlePrevChannel}
  hasUnreadChannels={hasUnread}
  unreadChannelCount={5}
/>
```

#### Combined Navigation

```tsx
<UnreadNavigation
  messageUnread={{
    hasUnread: true,
    unreadCount: 10,
    mentionCount: 2,
    onJumpToUnread: handleJump,
  }}
  channelUnread={{
    hasUnreadChannels: true,
    unreadChannelCount: 3,
    onNextUnread: handleNext,
    onPrevUnread: handlePrev,
  }}
  isAtBottom={isAtBottom}
/>
```

---

## Hooks

### useUnread

Main hook for tracking unread in a specific channel.

#### Usage

```tsx
const {
  unreadCount,
  mentionCount,
  firstUnreadMessageId,
  hasUnread,
  hasMentions,
  lastReadPosition,
  markAsRead,
  markChannelAsRead,
  markAsUnread,
  resetUnread,
  isMessageUnread,
  recalculate,
} = useUnread({
  channelId: 'channel-123',
  messages: messages,
  autoMarkRead: true,
  autoMarkReadDelay: 1000,
})
```

#### Options

```typescript
interface UseUnreadOptions {
  channelId: string           // Channel ID to track
  messages?: Message[]        // Messages in the channel
  autoMarkRead?: boolean      // Auto-mark as read on scroll
  autoMarkReadDelay?: number  // Delay before auto-mark (ms)
}
```

#### Return Values

```typescript
interface UseUnreadReturn {
  // Counts
  unreadCount: number
  mentionCount: number
  hasUnread: boolean
  hasMentions: boolean

  // Position
  firstUnreadMessageId?: string
  lastReadPosition?: UnreadPosition

  // Actions
  markAsRead: (messageId: string) => void
  markChannelAsRead: () => void
  markAsUnread: (messageId: string) => void
  resetUnread: () => void
  isMessageUnread: (message: Message) => boolean
  recalculate: () => void
}
```

### useAllUnread

Track unread across all channels.

```tsx
const {
  allStates,
  totalUnread,
  totalMentions,
  markAllAsRead,
} = useAllUnread()
```

### useUnreadNavigation

Navigate between unread channels.

```tsx
const {
  unreadChannels,
  mentionChannels,
  hasUnreadChannels,
  hasMentionChannels,
  getNextUnreadChannel,
  getPreviousUnreadChannel,
} = useUnreadNavigation(currentChannelId)

// Jump to next unread
const next = getNextUnreadChannel()
if (next) navigateToChannel(next)

// Jump to next mention
const nextMention = getNextUnreadChannel(true) // onlyMentions
```

---

## Core Library

### UnreadTracker

Core class for tracking unread messages with persistence.

#### Initialization

```tsx
import { getUnreadTracker } from '@/lib/messaging/unread-tracker'

// Get singleton instance
const tracker = getUnreadTracker()

// Initialize with user ID
tracker.initialize(userId)
```

#### Mark as Read

```tsx
// Mark up to a specific message as read
tracker.markAsRead(channelId, messageId, messageTimestamp)

// Reset all unread for a channel
tracker.resetChannel(channelId)
```

#### Mark as Unread

```tsx
// Mark from a specific message as unread
tracker.markAsUnread(channelId, messageId, messageTimestamp)
```

#### Calculate Unread

```tsx
const { unreadCount, mentionCount, firstUnreadMessageId } = tracker.calculateUnread(
  channelId,
  messages,
  currentUserId
)
```

#### Subscribe to Changes

```tsx
// Subscribe to channel changes
const unsubscribe = tracker.subscribe(channelId, () => {
  console.log('Unread state changed')
})

// Subscribe to all changes
const unsubscribeAll = tracker.subscribeAll(() => {
  console.log('Global unread state changed')
})

// Clean up
unsubscribe()
```

#### Cross-Tab Sync

The tracker automatically syncs across browser tabs using BroadcastChannel:

```typescript
// Automatically broadcasts on:
// - markAsRead
// - markAsUnread
// - resetChannel

// Other tabs receive and apply changes automatically
```

#### Persistence

State is automatically persisted to localStorage:

```typescript
// Storage key: 'nchat-unread-tracker'
// Auto-saves after 100ms debounce
// Loads on initialization
// Cleans up data older than 30 days
```

---

## Integration Guide

### Step 1: Basic Message List

```tsx
import { useUnread } from '@/hooks/use-unread'
import { JumpToUnreadButton } from '@/components/chat/JumpToUnread'

function ChatView({ channelId, messages }) {
  const messageListRef = useRef<MessageListRef>(null)

  const {
    unreadCount,
    mentionCount,
    firstUnreadMessageId,
    hasUnread,
    markChannelAsRead,
  } = useUnread({
    channelId,
    messages,
    autoMarkRead: true,
  })

  const handleJumpToUnread = () => {
    if (firstUnreadMessageId) {
      messageListRef.current?.scrollToMessage(firstUnreadMessageId)
    }
  }

  return (
    <div>
      <MessageList
        ref={messageListRef}
        messages={messages}
        onMarkAsRead={markChannelAsRead}
      />

      <JumpToUnreadButton
        hasUnread={hasUnread}
        unreadCount={unreadCount}
        mentionCount={mentionCount}
        onJumpToUnread={handleJumpToUnread}
      />
    </div>
  )
}
```

### Step 2: Add Unread Line

```tsx
// In MessageList component
import { UnreadLine } from '@/components/chat/UnreadIndicator'

function processMessages(messages, firstUnreadMessageId) {
  const items = []

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]

    // Insert unread line before first unread message
    if (message.id === firstUnreadMessageId) {
      items.push({ type: 'unread-line', count: messages.length - i })
    }

    items.push({ type: 'message', message })
  }

  return items
}

// Render
{item.type === 'unread-line' && <UnreadLine count={item.count} />}
```

### Step 3: Channel Sidebar

```tsx
import { SidebarUnread } from '@/components/chat/UnreadIndicator'
import { useAllUnread } from '@/hooks/use-unread'

function ChannelSidebar({ channels, currentChannelId, onSelect }) {
  const { allStates } = useAllUnread()

  return (
    <div>
      {channels.map(channel => (
        <SidebarUnread
          key={channel.id}
          channelName={channel.name}
          channelType={channel.type}
          unreadCount={allStates[channel.id]?.unreadCount || 0}
          mentionCount={allStates[channel.id]?.mentionCount || 0}
          isActive={channel.id === currentChannelId}
          onClick={() => onSelect(channel.id)}
        />
      ))}
    </div>
  )
}
```

### Step 4: Browser Badge

```tsx
import { useAllUnread } from '@/hooks/use-unread'

function useBrowserBadge() {
  const { totalUnread } = useAllUnread()

  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) nself-chat`
    } else {
      document.title = 'nself-chat'
    }
  }, [totalUnread])
}
```

### Step 5: Desktop App Badge

```tsx
// In Electron main process
ipcMain.on('set-badge-count', (event, count) => {
  app.setBadgeCount(count)
})

// In React app
useEffect(() => {
  if (window.electron) {
    window.electron.send('set-badge-count', totalUnread)
  }
}, [totalUnread])
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+U` | Jump to first unread message |
| `Alt+Shift+M` | Jump to next mention |
| `Alt+Shift+↑` | Previous unread channel |
| `Alt+Shift+↓` | Next unread channel |
| `Esc` | Mark channel as read |

### Custom Shortcuts

```tsx
import { useHotkey } from '@/hooks/use-hotkey'

function ChatView() {
  const { markChannelAsRead } = useUnread({ channelId })

  useHotkey('esc', markChannelAsRead)
  useHotkey('alt+shift+r', markChannelAsRead)
}
```

---

## Advanced Features

### Manual Mark as Unread

```tsx
function MessageContextMenu({ message }) {
  const { markAsUnread } = useUnread({ channelId })

  return (
    <ContextMenu>
      <ContextMenuItem onClick={() => markAsUnread(message.id)}>
        Mark as unread from here
      </ContextMenuItem>
    </ContextMenu>
  )
}
```

### Unread on Scroll Detection

```tsx
const [isAtBottom, setIsAtBottom] = useState(true)

const handleScroll = useCallback((e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  setIsAtBottom(distanceFromBottom < 100)
}, [])

// Auto-mark as read when scrolled to bottom
useEffect(() => {
  if (isAtBottom && hasUnread) {
    markChannelAsRead()
  }
}, [isAtBottom, hasUnread, markChannelAsRead])
```

### Custom Mention Detection

```tsx
function isUserMentioned(message: Message, userId: string): boolean {
  // Direct mention
  if (message.mentionedUsers?.includes(userId)) return true

  // @everyone or @here
  if (message.mentionsEveryone || message.mentionsHere) return true

  // Role mentions (if user has role)
  // if (message.mentionedRoles?.some(role => userRoles.includes(role))) return true

  // Custom logic...

  return false
}
```

### Batch Updates

```tsx
// Mark multiple channels as read
function markMultipleAsRead(channelIds: string[]) {
  const tracker = getUnreadTracker()

  channelIds.forEach(channelId => {
    tracker.resetChannel(channelId)
  })
}
```

---

## Testing

### Unit Tests

```tsx
import { renderHook, act } from '@testing-library/react'
import { useUnread } from '@/hooks/use-unread'

describe('useUnread', () => {
  it('tracks unread messages', () => {
    const { result } = renderHook(() => useUnread({
      channelId: 'test',
      messages: mockMessages,
    }))

    expect(result.current.unreadCount).toBe(5)
    expect(result.current.mentionCount).toBe(2)
  })

  it('marks as read', () => {
    const { result } = renderHook(() => useUnread({
      channelId: 'test',
      messages: mockMessages,
    }))

    act(() => {
      result.current.markChannelAsRead()
    })

    expect(result.current.unreadCount).toBe(0)
  })
})
```

### Integration Tests

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('JumpToUnread', () => {
  it('jumps to first unread message', async () => {
    const onJump = jest.fn()

    render(
      <JumpToUnreadButton
        hasUnread={true}
        unreadCount={5}
        onJumpToUnread={onJump}
      />
    )

    await userEvent.click(screen.getByRole('button'))
    expect(onJump).toHaveBeenCalled()
  })
})
```

---

## Performance

### Optimizations

**1. Batched Updates:**
- Debounced localStorage saves (100ms)
- Batch state updates in tracker

**2. Memoization:**
- `useMemo` for calculated values
- `useCallback` for stable references

**3. Efficient Storage:**
- Only store necessary data
- Auto-cleanup old data (30 days)
- Compressed JSON storage

**4. Smart Recalculation:**
- Only recalculate when messages change
- Cache counts in tracker
- Incremental updates

### Performance Metrics

```tsx
import { usePerformance } from '@/hooks/use-performance'

function ChatView() {
  const { measure } = usePerformance()

  const { unreadCount } = useUnread({
    channelId,
    messages,
  })

  useEffect(() => {
    measure('unread-calculation-time')
  }, [unreadCount])
}
```

### Memory Management

```tsx
// Clean up on unmount
useEffect(() => {
  const tracker = getUnreadTracker()

  return () => {
    // Tracker persists, but clean up listeners
    tracker.unsubscribe(channelId)
  }
}, [channelId])
```

---

## Best Practices

### 1. Initialize Tracker Early

```tsx
// In app initialization
function App() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      getUnreadTracker().initialize(user.id)
    }
  }, [user])
}
```

### 2. Sync with Notification Store

```tsx
const { unreadCount, mentionCount } = useUnread({ channelId, messages })
const notificationStore = useNotificationStore()

useEffect(() => {
  // Keep notification store in sync
  notificationStore.setUnreadCounts({
    ...notificationStore.unreadCounts,
    byChannel: {
      ...notificationStore.unreadCounts.byChannel,
      [channelId]: { unread: unreadCount, mentions: mentionCount },
    },
  })
}, [unreadCount, mentionCount, channelId])
```

### 3. Handle Edge Cases

```tsx
// Empty messages
if (messages.length === 0) {
  return { unreadCount: 0, mentionCount: 0 }
}

// Own messages don't count as unread
if (message.userId === currentUserId) {
  continue
}

// Deleted/hidden messages
if (message.isDeleted || message.isHidden) {
  continue
}
```

### 4. Accessibility

```tsx
<JumpToUnreadButton
  hasUnread={hasUnread}
  aria-label={`Jump to ${unreadCount} unread messages`}
  aria-keyshortcuts="Alt+Shift+U"
/>
```

---

## Troubleshooting

### Unread counts not updating

**Problem:** Counts don't update when new messages arrive.

**Solution:** Ensure messages are passed to `useUnread`:
```tsx
const { unreadCount } = useUnread({
  channelId,
  messages, // Must include new messages
})
```

### Cross-tab sync not working

**Problem:** Changes in one tab don't reflect in others.

**Solution:** BroadcastChannel not supported in browser. Falls back gracefully, but no cross-tab sync.

### Auto-mark not working

**Problem:** Messages don't auto-mark as read.

**Solution:** Check `autoMarkRead` option and scroll position:
```tsx
const { markChannelAsRead } = useUnread({
  channelId,
  messages,
  autoMarkRead: true,
  autoMarkReadDelay: 1000,
})
```

### Storage quota exceeded

**Problem:** localStorage quota exceeded.

**Solution:** Reduce storage age or clean up manually:
```tsx
const tracker = getUnreadTracker()
tracker.cleanupOldData() // Removes data >30 days
```

---

## API Reference

See TypeScript definitions in:
- `/src/lib/messaging/unread-tracker.ts`
- `/src/hooks/use-unread.ts`
- `/src/components/chat/UnreadIndicator.tsx`
- `/src/components/chat/JumpToUnread.tsx`

---

## Examples

Complete examples available in:
- `/src/components/chat/UnreadIntegrationExample.tsx`

---

## License

Part of nself-chat project. See main LICENSE file.
