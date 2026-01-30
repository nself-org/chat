# Messaging Features

Complete guide to all messaging features in nself-chat.

---

## Overview

nself-chat provides 14 messaging features covering everything from basic text to voice messages.

| Feature | Flag | Default |
|---------|------|---------|
| Edit Messages | `messages.edit` | Enabled |
| Delete Messages | `messages.delete` | Enabled |
| Reactions | `messages.reactions` | Enabled |
| Threads | `messages.threads` | Enabled |
| Pins | `messages.pins` | Enabled |
| Bookmarks | `messages.bookmarks` | Enabled |
| Forward | `messages.forward` | Enabled |
| Schedule | `messages.schedule` | Enabled |
| Voice Messages | `messages.voice` | Enabled |
| Code Blocks | `messages.codeBlocks` | Enabled |
| Markdown | `messages.markdown` | Enabled |
| Link Previews | `messages.linkPreviews` | Enabled |
| Mentions | `messages.mentions` | Enabled |
| Quotes | `messages.quotes` | Enabled |

---

## Edit Messages

Allow users to modify sent messages within a configurable time window.

### Configuration

```typescript
const editConfig = {
  enabled: true,
  timeWindow: 3600, // seconds (1 hour default)
  showEditHistory: true,
  markAsEdited: true
}
```

### Usage

```typescript
import { useMessages } from '@/hooks/use-messages'

function MessageEditor({ messageId, content }) {
  const { editMessage } = useMessages()

  const handleEdit = async (newContent: string) => {
    await editMessage(messageId, newContent)
  }

  return <EditForm onSubmit={handleEdit} initialContent={content} />
}
```

### Edit History

View previous versions of edited messages:

```typescript
import { useMessageVersions } from '@/hooks/use-message-versions'

function EditHistory({ messageId }) {
  const { versions } = useMessageVersions(messageId)

  return (
    <ul>
      {versions.map((v) => (
        <li key={v.version}>
          Version {v.version}: {v.content} ({v.editedAt})
        </li>
      ))}
    </ul>
  )
}
```

---

## Delete Messages

Allow users to remove their own messages.

### Configuration

```typescript
const deleteConfig = {
  enabled: true,
  timeWindow: 86400, // seconds (24 hours)
  softDelete: true,  // Keep in database, hide from UI
  adminCanDeleteAny: true
}
```

### Soft vs Hard Delete

- **Soft Delete**: Message hidden but retained for compliance
- **Hard Delete**: Permanently removed from database

---

## Reactions

Emoji reactions on messages.

### Adding Reactions

```typescript
import { useReactions } from '@/hooks/use-reactions'

function ReactionButton({ messageId }) {
  const { addReaction, removeReaction } = useReactions(messageId)

  return (
    <EmojiPicker
      onSelect={(emoji) => addReaction(emoji)}
    />
  )
}
```

### Reaction Display

```tsx
<MessageReactions
  reactions={message.reactions}
  onReact={handleReact}
  currentUserId={user.id}
/>
```

### Configuration

```typescript
const reactionConfig = {
  enabled: true,
  maxPerMessage: 20,
  maxPerUser: 5,
  allowCustomEmoji: true
}
```

---

## Threads

Threaded replies to messages.

### Thread Structure

```
Message (parent)
├── Reply 1
├── Reply 2
│   └── (threads can be nested or flat)
└── Reply 3
```

### Creating Thread Replies

```typescript
import { useThreads } from '@/hooks/use-threads'

function ThreadReply({ parentMessageId }) {
  const { createReply } = useThreads(parentMessageId)

  return (
    <MessageComposer
      onSend={(content) => createReply(content)}
      placeholder="Reply in thread..."
    />
  )
}
```

### Thread Panel

```tsx
<ThreadPanel
  messageId={selectedMessage.id}
  onClose={() => setSelectedMessage(null)}
/>
```

---

## Pins

Pin important messages to channel.

### Pinning Messages

```typescript
import { usePins } from '@/hooks/use-pins'

function PinButton({ messageId, channelId }) {
  const { pinMessage, unpinMessage, isPinned } = usePins(channelId)

  return (
    <Button
      onClick={() => isPinned(messageId)
        ? unpinMessage(messageId)
        : pinMessage(messageId)
      }
    >
      {isPinned(messageId) ? 'Unpin' : 'Pin'}
    </Button>
  )
}
```

### Viewing Pinned Messages

```tsx
<PinnedMessagesPanel channelId={channel.id} />
```

---

## Bookmarks

Save messages for personal reference.

### Bookmarking

```typescript
import { useBookmarks } from '@/lib/bookmarks'

function BookmarkButton({ messageId }) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks()

  return (
    <Button onClick={() =>
      isBookmarked(messageId)
        ? removeBookmark(messageId)
        : addBookmark(messageId)
    }>
      {isBookmarked(messageId) ? 'Saved' : 'Save'}
    </Button>
  )
}
```

### Saved Messages Page

Access at `/saved` - shows all bookmarked messages with organization options.

---

## Forward Messages

Forward messages to other channels or users.

### Forward Dialog

```tsx
<ForwardDialog
  messageId={message.id}
  onForward={(targetId, type) => forwardMessage(message.id, targetId, type)}
/>
```

### Forward Options

- Forward to channel
- Forward to direct message
- Forward with comment
- Forward multiple messages

---

## Scheduled Messages

Schedule messages to send later.

### Scheduling

```typescript
import { useScheduled } from '@/lib/scheduled'

function ScheduleButton({ content, channelId }) {
  const { scheduleMessage } = useScheduled()

  return (
    <DateTimePicker
      onSelect={(date) => scheduleMessage({
        content,
        channelId,
        sendAt: date
      })}
    />
  )
}
```

### Managing Scheduled Messages

Access at `/drafts` - view and manage all scheduled messages.

---

## Voice Messages

Record and send audio messages.

### Recording

```typescript
import { useVoiceRecorder } from '@/lib/voice'

function VoiceRecorder({ onSend }) {
  const {
    isRecording,
    duration,
    start,
    stop,
    cancel
  } = useVoiceRecorder()

  return (
    <div>
      {isRecording ? (
        <>
          <span>{duration}s</span>
          <Button onClick={stop}>Send</Button>
          <Button onClick={cancel}>Cancel</Button>
        </>
      ) : (
        <Button onClick={start}>Record</Button>
      )}
    </div>
  )
}
```

### Playback

```tsx
<VoiceMessagePlayer
  src={message.audioUrl}
  duration={message.audioDuration}
  waveform={message.waveform}
/>
```

---

## Code Blocks

Syntax-highlighted code snippets.

### Syntax

````markdown
```javascript
const greeting = 'Hello, World!'
console.log(greeting)
```
````

### Supported Languages

50+ languages including:
- JavaScript/TypeScript
- Python
- Go
- Rust
- Java
- C/C++
- SQL
- And more...

### Configuration

```typescript
const codeBlockConfig = {
  enabled: true,
  lineNumbers: true,
  maxLines: 100,
  copyButton: true,
  theme: 'github-dark'
}
```

---

## Markdown Support

Rich text formatting using Markdown.

### Supported Syntax

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strike~~` | ~~strike~~ |
| `` `code` `` | `code` |
| `[link](url)` | link |
| `> quote` | blockquote |
| `- item` | bullet list |
| `1. item` | numbered list |

### Configuration

```typescript
const markdownConfig = {
  enabled: true,
  allowHtml: false,
  sanitize: true,
  linkify: true
}
```

---

## Link Previews

Automatic URL unfurling with preview cards.

### Supported Sites

- General websites (Open Graph)
- YouTube videos
- Twitter/X posts
- GitHub repos/issues
- And more...

### Configuration

```typescript
const linkPreviewConfig = {
  enabled: true,
  timeout: 5000,
  maxWidth: 400,
  showImage: true,
  showDescription: true
}
```

---

## Mentions

@mention users and channels.

### Mention Types

| Type | Syntax | Description |
|------|--------|-------------|
| User | `@username` | Mention specific user |
| Channel | `#channel` | Link to channel |
| Everyone | `@everyone` | Notify all members |
| Here | `@here` | Notify online members |

### Autocomplete

```tsx
<MentionAutocomplete
  onSelect={(mention) => insertMention(mention)}
  filter={searchText}
/>
```

### Configuration

```typescript
const mentionConfig = {
  enabled: true,
  allowEveryone: 'admin', // 'all' | 'admin' | 'none'
  allowHere: 'admin',
  highlightStyle: 'background' // 'background' | 'bold' | 'color'
}
```

---

## Quotes

Quote previous messages in replies.

### Quote Syntax

```
> Original message content
> - @author

My reply to this
```

### Quote Component

```tsx
<QuotedMessage
  originalMessage={quotedMessage}
  onClick={() => scrollToMessage(quotedMessage.id)}
/>
```

---

## Message Configuration Summary

```typescript
// Full message configuration
const messageConfig = {
  maxLength: 10000,

  edit: {
    enabled: true,
    timeWindow: 3600,
    showHistory: true
  },

  delete: {
    enabled: true,
    timeWindow: 86400,
    softDelete: true
  },

  reactions: {
    enabled: true,
    maxPerMessage: 20
  },

  threads: {
    enabled: true,
    maxDepth: 1
  },

  pins: {
    enabled: true,
    maxPerChannel: 50
  },

  bookmarks: {
    enabled: true,
    maxPerUser: 1000
  },

  voice: {
    enabled: true,
    maxDuration: 300,
    format: 'webm'
  },

  codeBlocks: {
    enabled: true,
    lineNumbers: true
  },

  markdown: {
    enabled: true,
    sanitize: true
  },

  linkPreviews: {
    enabled: true,
    timeout: 5000
  },

  mentions: {
    enabled: true,
    allowEveryone: 'admin'
  }
}
```

---

## Related Documentation

- [Features Overview](Features)
- [Real-time Features](Features-Realtime)
- [Emoji & Reactions](Features-Emoji)
- [Voice Messages](Features-Voice)
