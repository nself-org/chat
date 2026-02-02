# Real-time Features Documentation

Complete guide to real-time features in nself-chat, including WebSocket connections, presence tracking, typing indicators, and message delivery.

---

## Table of Contents

1. [Overview](#overview)
2. [WebSocket Connection](#websocket-connection)
3. [Presence System](#presence-system)
4. [Typing Indicators](#typing-indicators)
5. [Connection Status](#connection-status)
6. [Message Delivery](#message-delivery)
7. [API Reference](#api-reference)
8. [Examples](#examples)

---

## Overview

nself-chat provides production-ready real-time features built on Socket.io with:

- **WebSocket Optimization** - Connection pooling, message batching, compression
- **Auto-Reconnection** - Exponential backoff with connection quality monitoring
- **Presence Tracking** - Online/away/DND status with last seen timestamps
- **Typing Indicators** - Debounced, throttled typing events
- **Message Delivery** - Sent/delivered/read receipts
- **Connection Quality** - Latency monitoring and quality indicators

---

## WebSocket Connection

### Architecture

The WebSocket layer uses a singleton pattern with connection pooling:

```typescript
import { socketManager } from '@/lib/realtime'

// Connect (returns existing connection if available)
const socket = socketManager.connect(authToken)

// Emit events
socketManager.emit('message:new', { channelId, content })

// Subscribe to events
const unsubscribe = socketManager.on('message:new', (data) => {
  console.log('New message:', data)
})

// Disconnect
socketManager.disconnect()
```

### Features

#### Connection Pooling
- Maintains pool of idle connections for instant reconnect
- Round-robin load balancing for multiple connections
- Automatic cleanup of idle connections (5-minute timeout)

#### Message Batching
- Batches messages sent within 50ms window
- Maximum batch size: 10 messages
- Reduces network overhead for rapid operations

#### Compression
- Per-message deflate compression for payloads > 1KB
- Reduces bandwidth usage by ~60% for text messages

#### Heartbeat/Ping-Pong
- 30-second heartbeat interval to keep connections alive
- Latency measurement via ping/pong
- Automatic reconnection on missed heartbeats

#### Exponential Backoff
- Initial delay: 1000ms
- Max delay: 5000ms
- Max attempts: 5
- Auto-reconnect on unexpected disconnect

### React Hooks

```typescript
import { useSocket } from '@/hooks/use-socket'

function ChatComponent() {
  const { isConnected, emit, subscribe, socketId } = useSocket()

  useEffect(() => {
    if (!isConnected) return

    const unsubscribe = subscribe('message:new', (message) => {
      console.log('New message:', message)
    })

    return unsubscribe
  }, [isConnected, subscribe])

  const sendMessage = () => {
    emit('message:new', { content: 'Hello!' })
  }
}
```

---

## Presence System

### Overview

Track user online status with automatic away detection and last seen timestamps.

### Status Types

- **online** - User is active and available
- **away** - User is inactive (auto-set after 5 minutes)
- **dnd** - Do Not Disturb (manually set)
- **offline** - User is disconnected

### Usage

```typescript
import { usePresence } from '@/hooks/use-presence'

function PresenceDemo() {
  const {
    presence,
    getPresence,
    setOnline,
    setAway,
    setDnd,
    setOffline,
    setCustomStatus,
    currentStatus,
  } = usePresence(['user-1', 'user-2', 'user-3'])

  // Get presence for specific user
  const user1Presence = getPresence('user-1')
  console.log(user1Presence.status) // 'online' | 'away' | 'dnd' | 'offline'
  console.log(user1Presence.lastSeen) // ISO timestamp

  // Set own status
  return (
    <div>
      <button onClick={setOnline}>Set Online</button>
      <button onClick={setAway}>Set Away</button>
      <button onClick={setDnd}>Set DND</button>
      <button onClick={() => setCustomStatus('In a meeting')}>
        Set Custom Status
      </button>
    </div>
  )
}
```

### Auto-Away Detection

Automatically sets status to "away" after inactivity:

- **Default timeout**: 5 minutes
- **Activity events**: mousedown, keydown, touchstart, mousemove
- **Visibility tracking**: Sets away when tab is hidden
- **Online/offline**: Automatically updates on network changes

```typescript
const { recordActivity } = usePresence(userIds, {
  autoAwayTimeout: 300000, // 5 minutes
  heartbeatInterval: 30000, // 30 seconds
  trackLastSeen: true,
})

// Manually record activity
recordActivity()
```

### Components

#### PresenceIndicator

```tsx
import { PresenceIndicator } from '@/components/user/PresenceIndicator'

<PresenceIndicator
  userId="user-123"
  size="md"
  position="bottom-right"
  showTooltip
  showLastSeen
  animate
/>
```

#### PresenceBadge

```tsx
import { PresenceBadge } from '@/components/user/PresenceIndicator'

<PresenceBadge
  userId="user-123"
  showLabel
  showCustomStatus
/>
```

#### PresenceSelector

```tsx
import { PresenceSelector } from '@/components/user/PresenceIndicator'

<PresenceSelector
  value={currentStatus}
  onChange={(status) => updateOwnPresence(status)}
/>
```

---

## Typing Indicators

### Overview

Show who is typing with debounced, throttled indicators.

### Features

- **Debouncing** - 300ms debounce before sending typing event
- **Throttling** - 2-second minimum between typing events
- **Auto-timeout** - Removes typing indicator after 5 seconds of inactivity
- **Multi-user** - Shows up to 3 users typing, with overflow count

### Usage

```typescript
import { useTyping } from '@/hooks/use-typing'

function MessageInput({ channelId }) {
  const {
    typingUsers,
    handleTyping,
    forceStopTyping,
  } = useTyping(channelId)

  const handleChange = (e) => {
    const value = e.target.value
    setValue(value)

    // Trigger typing indicator on every keystroke
    if (value.trim()) {
      handleTyping()
    } else {
      forceStopTyping()
    }
  }

  const handleSend = () => {
    // Stop typing immediately on send
    forceStopTyping()
    sendMessage()
  }

  return (
    <div>
      <input onChange={handleChange} />
      <TypingIndicator users={typingUsers} />
    </div>
  )
}
```

### Components

#### TypingIndicator

```tsx
import { TypingIndicator } from '@/components/chat/typing-indicator'

<TypingIndicator
  users={typingUsers}
  maxAvatars={3}
/>
```

Output: "Alice, Bob, and Charlie are typing..."

#### InlineTypingIndicator

```tsx
import { InlineTypingIndicator } from '@/components/chat/typing-indicator'

<InlineTypingIndicator users={typingUsers} />
```

Shows avatar(s) with animated typing bubble.

#### MessageInputWithTyping

```tsx
import { MessageInputWithTyping } from '@/components/chat/MessageInputWithTyping'

<MessageInputWithTyping
  channelId="channel-123"
  onSendMessage={(content) => sendMessage(content)}
  placeholder="Type a message..."
  maxLength={2000}
  showCharCount
  autoFocus
/>
```

---

## Connection Status

### Overview

Display WebSocket connection state with quality indicators.

### Components

#### ConnectionStatus (Floating)

```tsx
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus'

<ConnectionStatus
  show={true}
  position="top-right"
  showStats
  compact={false}
/>
```

#### InlineConnectionStatus

```tsx
import { InlineConnectionStatus } from '@/components/realtime/ConnectionStatus'

<InlineConnectionStatus showLabel />
```

#### ConnectionQualityBar

```tsx
import { ConnectionQualityBar } from '@/components/realtime/ConnectionStatus'

<ConnectionQualityBar />
```

Shows 4 bars indicating connection quality:
- **4 bars (green)**: Excellent (< 100ms)
- **3 bars (yellow)**: Good (100-300ms)
- **2 bars (orange)**: Poor (> 300ms)
- **0 bars**: Offline

#### ConnectionStatusCard

```tsx
import { ConnectionStatusCard } from '@/components/realtime/ConnectionStatus'

<ConnectionStatusCard />
```

Full card showing:
- Connection status
- Quality indicator
- Latency
- Uptime
- Socket ID

### React Context

```typescript
import { useRealtime } from '@/contexts/realtime-context'

function Component() {
  const {
    connectionState, // 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
    isConnected,
    socketId,
    reconnectAttempts,
    lastError,
    reconnect,
    disconnect,
    clearError,
  } = useRealtime()

  return (
    <div>
      <p>Status: {connectionState}</p>
      <p>Attempts: {reconnectAttempts}</p>
      {lastError && <p>Error: {lastError.message}</p>}
      <button onClick={reconnect}>Reconnect</button>
    </div>
  )
}
```

---

## Message Delivery

### Overview

Track message delivery status with sent/delivered/read receipts.

### Events

```typescript
import { SOCKET_EVENTS } from '@/lib/realtime'

// Message sent acknowledgement
socket.on(SOCKET_EVENTS.MESSAGE_SENT, (data) => {
  console.log('Message sent:', data.messageId)
})

// Message delivered (received by recipient)
socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
  console.log('Delivered to:', data.deliveredCount, 'users')
})

// Message read
socket.on(SOCKET_EVENTS.MESSAGE_READ, (data) => {
  console.log('Read by:', data.userId)
})

// Message failed
socket.on(SOCKET_EVENTS.MESSAGE_FAILED, (data) => {
  console.error('Failed:', data.errorMessage)
  if (data.retryable) {
    // Retry sending
  }
})
```

### Payload Types

```typescript
interface MessageSentPayload {
  clientMessageId: string // Client-side ID for optimistic updates
  messageId: string // Server-assigned ID
  sentAt: string // ISO timestamp
}

interface MessageDeliveredPayload {
  messageId: string
  deliveredCount?: number // For group chats
  totalRecipients?: number
  deliveredAt: string
}

interface MessageReadPayload {
  messageId: string
  userId: string // User who read it
  readCount?: number // For group chats
  totalRecipients?: number
  readAt: string
}

interface MessageFailedPayload {
  clientMessageId: string
  errorCode: string
  errorMessage: string
  retryable: boolean
}
```

---

## API Reference

### Socket Events

```typescript
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Messages
  MESSAGE_NEW: 'message:new',
  MESSAGE_UPDATE: 'message:update',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_TYPING: 'message:typing',

  // Message Delivery
  MESSAGE_SENT: 'message:sent',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  MESSAGE_FAILED: 'message:failed',
  MESSAGE_ACK: 'message:ack',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_SUBSCRIBE: 'presence:subscribe',

  // Channels
  CHANNEL_JOIN: 'channel:join',
  CHANNEL_LEAVE: 'channel:leave',
  CHANNEL_UPDATE: 'channel:update',

  // Reactions
  REACTION_ADD: 'reaction:add',
  REACTION_REMOVE: 'reaction:remove',
}
```

### Configuration

```typescript
// WebSocket config
export const SOCKET_CONFIG = {
  url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  options: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  },
}

// Typing config
const typingConfig = {
  debounceMs: 300, // Debounce before sending
  timeoutMs: 5000, // Remove indicator after timeout
  throttleMs: 2000, // Min time between events
}

// Presence config
const presenceConfig = {
  autoAwayTimeout: 300000, // 5 minutes
  heartbeatInterval: 30000, // 30 seconds
  trackLastSeen: true,
}
```

---

## Examples

### Complete Chat Component

```tsx
import { useSocket } from '@/hooks/use-socket'
import { useTyping } from '@/hooks/use-typing'
import { usePresence } from '@/hooks/use-presence'
import { MessageInputWithTyping } from '@/components/chat/MessageInputWithTyping'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { PresenceIndicator } from '@/components/user/PresenceIndicator'
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus'

function ChatRoom({ channelId, members }) {
  const [messages, setMessages] = useState([])
  const { isConnected, subscribe, emit } = useSocket()
  const { typingUsers } = useTyping(channelId)
  const { getPresence } = usePresence(members.map(m => m.id))

  // Subscribe to new messages
  useEffect(() => {
    if (!isConnected) return

    const unsubscribe = subscribe('message:new', (message) => {
      setMessages((prev) => [...prev, message])
    })

    return unsubscribe
  }, [isConnected, subscribe])

  const handleSendMessage = async (content) => {
    emit('message:new', {
      channelId,
      content,
      clientMessageId: generateId(),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <ConnectionStatus position="top-right" />

      {/* Header with members */}
      <div className="flex items-center gap-2 p-4 border-b">
        {members.map((member) => (
          <div key={member.id} className="relative">
            <img src={member.avatar} className="h-8 w-8 rounded-full" />
            <PresenceIndicator
              userId={member.id}
              size="sm"
              position="bottom-right"
              showTooltip
            />
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <div className="relative">
              <img src={msg.author.avatar} className="h-8 w-8 rounded-full" />
              <PresenceIndicator
                userId={msg.author.id}
                size="xs"
                position="bottom-right"
              />
            </div>
            <div>
              <div className="font-medium">{msg.author.name}</div>
              <div className="text-sm">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Input */}
      <div className="p-4 border-t">
        <MessageInputWithTyping
          channelId={channelId}
          onSendMessage={handleSendMessage}
          maxLength={2000}
          showCharCount
        />
      </div>
    </div>
  )
}
```

### Presence Management

```tsx
import { usePresence } from '@/hooks/use-presence'
import { PresenceSelector } from '@/components/user/PresenceIndicator'

function UserSettings() {
  const {
    currentStatus,
    setOnline,
    setAway,
    setDnd,
    setOffline,
    setCustomStatus,
  } = usePresence([])

  return (
    <div className="space-y-4">
      <h2>Presence Settings</h2>

      <PresenceSelector
        value={currentStatus}
        onChange={(status) => {
          switch (status) {
            case 'online': setOnline(); break
            case 'away': setAway(); break
            case 'dnd': setDnd(); break
            case 'offline': setOffline(); break
          }
        }}
      />

      <input
        placeholder="Custom status message"
        onChange={(e) => setCustomStatus(e.target.value)}
      />
    </div>
  )
}
```

---

## Best Practices

1. **Always clean up subscriptions**
   ```typescript
   useEffect(() => {
     const unsubscribe = subscribe('event', handler)
     return unsubscribe // Cleanup on unmount
   }, [subscribe])
   ```

2. **Use forceStopTyping on message send**
   ```typescript
   const handleSend = () => {
     forceStopTyping() // Stop immediately
     sendMessage()
   }
   ```

3. **Check connection before emitting**
   ```typescript
   if (isConnected) {
     emit('message:new', data)
   }
   ```

4. **Handle reconnection gracefully**
   ```typescript
   useEffect(() => {
     if (isConnected) {
       // Re-subscribe to channels
       // Fetch missed messages
     }
   }, [isConnected])
   ```

5. **Debounce expensive operations**
   ```typescript
   const debouncedUpdate = useMemo(
     () => debounce(updatePresence, 1000),
     []
   )
   ```

---

## Troubleshooting

### Connection Issues

**Problem**: WebSocket won't connect

**Solutions**:
- Check `NEXT_PUBLIC_SOCKET_URL` environment variable
- Verify backend is running
- Check browser console for errors
- Test with `curl http://localhost:3001/socket.io/`

### Typing Indicators Not Working

**Problem**: Typing events not being received

**Solutions**:
- Ensure `channelId` is correct
- Check that other user is connected
- Verify event subscription is active
- Look for throttling (2-second minimum between events)

### Presence Not Updating

**Problem**: User status not changing

**Solutions**:
- Check auto-away timeout (default 5 minutes)
- Verify user activity events are firing
- Check that presence subscription includes user ID
- Look for connection issues

### High Latency

**Problem**: Slow message delivery

**Solutions**:
- Check network connection quality
- Disable message batching for critical messages
- Use `emitImmediate()` instead of `emit()`
- Monitor connection quality indicator

---

## Performance

### Metrics

- **Connection time**: < 500ms
- **Message latency**: < 100ms (local), < 300ms (remote)
- **Typing indicator delay**: 300ms debounce
- **Presence update**: 30-second heartbeat
- **Auto-reconnect**: 1-5 seconds exponential backoff

### Optimization Tips

1. **Use connection pooling** for multiple simultaneous connections
2. **Enable message batching** for bulk operations
3. **Enable compression** for large payloads
4. **Throttle typing events** to reduce network traffic
5. **Debounce presence updates** to avoid excessive updates

---

## License

MIT - See LICENSE file for details
