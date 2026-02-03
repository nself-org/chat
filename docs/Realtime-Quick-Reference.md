# Real-time Features - Quick Reference Card

One-page reference for common real-time operations in nself-chat.

---

## Quick Start

```tsx
import { RealtimeProvider } from '@/contexts/realtime-context'
import { useSocket } from '@/hooks/use-socket'
import { useTyping } from '@/hooks/use-typing'
import { usePresence } from '@/hooks/use-presence'
```

---

## Connection

### Check Connection

```tsx
import { useRealtime } from '@/contexts/realtime-context'

const { isConnected, connectionState, reconnect } = useRealtime()
```

### Display Status

```tsx
import { InlineConnectionStatus, ConnectionStatus } from '@/components/realtime'

<InlineConnectionStatus showLabel />
<ConnectionStatus position="top-right" showStats />
```

---

## Typing Indicators

### Track Typing

```tsx
import { useTyping } from '@/hooks/use-typing'

const { typingUsers, handleTyping, forceStopTyping } = useTyping(channelId)

// On keystroke
<input onChange={(e) => {
  setValue(e.target.value)
  if (e.target.value.trim()) {
    handleTyping()  // Start typing
  } else {
    forceStopTyping()  // Stop if empty
  }
}} />

// On send
const handleSend = () => {
  forceStopTyping()  // Stop immediately
  sendMessage()
}
```

### Display Typing

```tsx
import { TypingIndicator } from '@/components/chat/typing-indicator'
;<TypingIndicator users={typingUsers} maxAvatars={3} />
```

### Pre-built Input

```tsx
import { MessageInputWithTyping } from '@/components/chat/MessageInputWithTyping'
;<MessageInputWithTyping
  channelId={channelId}
  onSendMessage={handleSend}
  showCharCount
  maxLength={2000}
/>
```

---

## Presence

### Track Presence

```tsx
import { usePresence } from '@/hooks/use-presence'

const { presence, getPresence, setOnline, setAway, setDnd, currentStatus } = usePresence([
  'user-1',
  'user-2',
])

// Get user status
const user1 = getPresence('user-1')
console.log(user1.status) // 'online' | 'away' | 'dnd' | 'offline'
console.log(user1.lastSeen) // ISO timestamp
```

### Change Status

```tsx
<button onClick={setOnline}>Online</button>
<button onClick={setAway}>Away</button>
<button onClick={setDnd}>DND</button>
<button onClick={() => setCustomStatus('In meeting')}>Custom</button>
```

### Display Presence

```tsx
import { PresenceIndicator, PresenceBadge } from '@/components/user/PresenceIndicator'

// As avatar badge
<div className="relative">
  <img src={avatar} />
  <PresenceIndicator
    userId={userId}
    size="md"
    position="bottom-right"
    showTooltip
  />
</div>

// As badge with label
<PresenceBadge userId={userId} showLabel showCustomStatus />
```

---

## Events

### Emit Events

```tsx
import { useSocket } from '@/hooks/use-socket'
import { SOCKET_EVENTS } from '@/lib/realtime'

const { emit } = useSocket()

emit(SOCKET_EVENTS.MESSAGE_NEW, {
  channelId: 'channel-123',
  content: 'Hello!',
})
```

### Subscribe to Events

```tsx
const { subscribe } = useSocket()

useEffect(() => {
  const unsubscribe = subscribe(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
    console.log('New message:', message)
  })

  return unsubscribe // Cleanup
}, [subscribe])
```

---

## Common Events

```typescript
SOCKET_EVENTS.CONNECT // Connected to server
SOCKET_EVENTS.DISCONNECT // Disconnected
SOCKET_EVENTS.ERROR // Connection error

SOCKET_EVENTS.MESSAGE_NEW // New message
SOCKET_EVENTS.MESSAGE_UPDATE // Message edited
SOCKET_EVENTS.MESSAGE_DELETE // Message deleted
SOCKET_EVENTS.MESSAGE_TYPING // User typing

SOCKET_EVENTS.MESSAGE_SENT // Message sent ACK
SOCKET_EVENTS.MESSAGE_DELIVERED // Message delivered
SOCKET_EVENTS.MESSAGE_READ // Message read

SOCKET_EVENTS.PRESENCE_UPDATE // User status change
SOCKET_EVENTS.CHANNEL_UPDATE // Channel updated
SOCKET_EVENTS.REACTION_ADD // Reaction added
```

---

## Message Delivery

### Track Delivery

```tsx
const { subscribe } = useSocket()

useEffect(() => {
  const unsubSent = subscribe(SOCKET_EVENTS.MESSAGE_SENT, (data) => {
    console.log('Sent:', data.messageId)
  })

  const unsubDelivered = subscribe(SOCKET_EVENTS.MESSAGE_DELIVERED, (data) => {
    console.log('Delivered to:', data.deliveredCount, 'users')
  })

  const unsubRead = subscribe(SOCKET_EVENTS.MESSAGE_READ, (data) => {
    console.log('Read by:', data.userId)
  })

  return () => {
    unsubSent()
    unsubDelivered()
    unsubRead()
  }
}, [subscribe])
```

---

## Configuration

### Typing Config

```tsx
const { typingUsers } = useTyping(channelId, {
  debounceMs: 300, // Stop typing delay
  timeoutMs: 5000, // Remove indicator after
  throttleMs: 2000, // Min time between events
})
```

### Presence Config

```tsx
const { presence } = usePresence(userIds, {
  autoAwayTimeout: 300000, // 5 minutes
  heartbeatInterval: 30000, // 30 seconds
  trackLastSeen: true,
})
```

---

## Complete Example

```tsx
'use client'

import { useSocket } from '@/hooks/use-socket'
import { useTyping } from '@/hooks/use-typing'
import { usePresence } from '@/hooks/use-presence'
import { MessageInputWithTyping } from '@/components/chat/MessageInputWithTyping'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import { PresenceIndicator } from '@/components/user/PresenceIndicator'
import { InlineConnectionStatus } from '@/components/realtime'

export function ChatRoom({ channelId, members }) {
  const [messages, setMessages] = useState([])

  // Real-time hooks
  const { isConnected, subscribe, emit } = useSocket()
  const { typingUsers } = useTyping(channelId)
  const { getPresence } = usePresence(members.map((m) => m.id))

  // Subscribe to new messages
  useEffect(() => {
    if (!isConnected) return

    const unsubscribe = subscribe('message:new', (message) => {
      setMessages((prev) => [...prev, message])
    })

    return unsubscribe
  }, [isConnected, subscribe])

  // Send message
  const handleSend = (content: string) => {
    emit('message:new', {
      channelId,
      content,
      clientMessageId: generateId(),
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2>Chat Room</h2>
        <InlineConnectionStatus showLabel />
      </div>

      {/* Members */}
      <div className="flex gap-2 p-4">
        {members.map((member) => (
          <div key={member.id} className="relative">
            <img src={member.avatar} className="h-8 w-8 rounded-full" />
            <PresenceIndicator userId={member.id} size="sm" position="bottom-right" showTooltip />
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.author.name}</strong>: {msg.content}
          </div>
        ))}
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Input */}
      <div className="border-t p-4">
        <MessageInputWithTyping
          channelId={channelId}
          onSendMessage={handleSend}
          maxLength={2000}
          showCharCount
        />
      </div>
    </div>
  )
}
```

---

## Cheat Sheet

| Feature           | Hook                   | Component                         |
| ----------------- | ---------------------- | --------------------------------- |
| Connection Status | `useRealtime()`        | `<ConnectionStatus />`            |
| Typing Indicators | `useTyping(channelId)` | `<TypingIndicator users={} />`    |
| Presence          | `usePresence(userIds)` | `<PresenceIndicator userId={} />` |
| Socket Events     | `useSocket()`          | -                                 |
| Message Input     | -                      | `<MessageInputWithTyping />`      |

---

## Best Practices

✅ **DO**:

- Always clean up subscriptions in `useEffect`
- Use `forceStopTyping()` when sending messages
- Check `isConnected` before emitting
- Handle reconnection in your components
- Use debouncing for expensive operations

❌ **DON'T**:

- Emit events without checking connection
- Forget to unsubscribe from events
- Track presence for 100+ users simultaneously
- Send typing events on every keystroke (use hook)
- Ignore connection quality indicators

---

## Performance Tips

1. **Limit presence tracking** to visible users only
2. **Use message batching** for bulk operations
3. **Throttle typing events** (built into hook)
4. **Debounce status updates** to avoid spam
5. **Enable compression** for large messages

---

## Troubleshooting

| Issue                 | Solution                       |
| --------------------- | ------------------------------ |
| Won't connect         | Check `NEXT_PUBLIC_SOCKET_URL` |
| No typing events      | Verify `channelId` matches     |
| High latency          | Check network quality          |
| Presence not updating | Wait for heartbeat (30s)       |
| Events not received   | Ensure subscription is active  |

---

## Links

- 📖 [Full Documentation](./Realtime-Features.md)
- 🎯 [Implementation Summary](./Realtime-Implementation-Summary.md)
- 🧪 [Demo Page](/demo/realtime)
- 🧪 [Tests](../src/hooks/__tests__/use-typing.test.ts)

---

**Last Updated**: February 1, 2026
