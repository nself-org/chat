# Message Scheduling & Drafts System

Complete production-ready implementation for message scheduling and drafts with auto-save, job queue, retry logic, and failure handling.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Components](#components)
- [Hooks](#hooks)
- [Libraries](#libraries)
- [Usage Examples](#usage-examples)
- [API Routes](#api-routes)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Message Scheduling & Drafts system provides:

1. **Draft Messages**
   - Auto-save as you type (debounced)
   - Multiple drafts per channel
   - Draft indicators in channel list
   - Restore drafts on channel switch
   - localStorage persistence

2. **Scheduled Messages**
   - Schedule messages for future delivery
   - Quick schedule presets (30min, 1hr, tomorrow, etc.)
   - Custom date/time picker
   - Timezone handling
   - Edit/cancel scheduled messages
   - Send scheduled messages immediately
   - Automatic retry on failure

3. **Job Queue**
   - Background message processor
   - Automatic sending at scheduled time
   - Configurable retry logic
   - Failure notifications
   - Queue persistence

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────────────────────────────────────────────────────┤
│  ScheduleMessageModal  │  MessageInputWithDrafts            │
│  ScheduledMessagesList │  Draft Indicators                  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                          Hooks Layer                         │
├─────────────────────────────────────────────────────────────┤
│  useDrafts              │  useMessageScheduler              │
│  useScheduledMessage    │  useScheduledMessagesList         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       Business Logic                         │
├─────────────────────────────────────────────────────────────┤
│  DraftManager           │  MessageScheduler                 │
│  - Auto-save            │  - Job queue                      │
│  - Multi-draft          │  - Retry logic                    │
│  - localStorage         │  - Failure handling               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      State Management                        │
├─────────────────────────────────────────────────────────────┤
│  Zustand Store (scheduled-messages)                         │
│  localStorage (drafts, scheduled queue)                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        API / Database                        │
├─────────────────────────────────────────────────────────────┤
│  /api/messages/schedule │  GraphQL Mutations               │
│  GET, POST, PATCH, DELETE                                   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Draft Messages

#### Auto-Save

- Debounced auto-save (default: 1 second delay)
- Saves to localStorage automatically
- No manual save required

```typescript
import { useDrafts } from '@/hooks/use-drafts'

const { updateDraft, draftContent } = useDrafts({ channelId })

// Auto-saves after 1 second of inactivity
updateDraft(content)
```

#### Multi-Draft Support

- Multiple drafts per channel (default: 5)
- Separate drafts for replies and threads
- Draft indicators in channel list

```typescript
// Main channel draft
const mainDraft = useDrafts({ channelId })

// Reply draft (separate from main)
const replyDraft = useDrafts({ channelId, replyToId })

// Thread draft (separate from main)
const threadDraft = useDrafts({ channelId, threadId })
```

#### Draft Restoration

- Automatically restored on channel switch
- Callback when draft is restored
- Manual restore available

```typescript
const { restoreDraft } = useDrafts({
  channelId,
  onDraftRestored: (draft) => {
    console.log('Draft restored:', draft.content)
  },
})

// Manual restore
const draft = restoreDraft()
```

### Scheduled Messages

#### Quick Schedules

- 30 minutes
- 1 hour
- 2 hours
- 4 hours
- Tomorrow 9 AM
- Tomorrow 2 PM
- 1 week

```typescript
<ScheduleMessageModal
  channelId={channelId}
  isOpen={isOpen}
  onClose={onClose}
  defaultContent="Hello!"
/>
```

#### Custom Scheduling

- Date picker
- Time picker
- Timezone aware
- Validation (min 5 minutes future)

#### Edit Scheduled Messages

- Update content
- Change scheduled time
- Cannot edit sent messages

```typescript
const { updateMessage } = useScheduledMessage(messageId)

updateMessage({
  content: 'Updated content',
  scheduledAt: new Date('2024-12-25 09:00'),
})
```

#### Cancel/Delete

- Cancel pending messages
- Delete any message
- Confirmation dialog

```typescript
const { cancelMessage, deleteMessage } = useScheduledMessage(messageId)

// Cancel (keeps in list with 'cancelled' status)
cancelMessage()

// Delete (removes from list)
deleteMessage()
```

#### Send Now

- Send scheduled message immediately
- Bypasses scheduled time
- Marks as sent

```typescript
const { sendNow } = useMessageScheduler()

await sendNow(messageId)
```

### Job Queue

#### Automatic Processing

- Polls every 30 seconds (configurable)
- Processes messages due for sending
- Batch processing (10 messages per cycle)
- Grace period (5 seconds before scheduled time)

```typescript
const { start, stop } = useMessageScheduler({
  autoStart: true,
  pollInterval: 30000, // 30 seconds
})
```

#### Retry Logic

- Maximum 3 retry attempts (configurable)
- 1-minute delay between retries (configurable)
- Exponential backoff available
- Failure notifications

```typescript
// Scheduler config
{
  maxRetries: 3,
  retryDelay: 60000, // 1 minute
  batchSize: 10,
  gracePeriod: 5000 // 5 seconds
}
```

#### Failure Handling

- Error tracking
- User notifications
- Manual retry option
- Error messages displayed

```typescript
const { retryMessage } = useScheduledMessage(messageId)

// Manually retry failed message
retryMessage()
```

## Components

### ScheduleMessageModal

Modal for scheduling messages.

```typescript
import { ScheduleMessageModal } from '@/components/chat/ScheduleMessageModal'

<ScheduleMessageModal
  channelId="channel-123"
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  defaultContent="Hello world"
  replyToId="msg-456" // Optional
  threadId="thread-789" // Optional
  onMessageScheduled={(messageId) => {
    console.log('Message scheduled:', messageId)
  }}
/>
```

**Props:**

- `channelId` (required): Channel to send message to
- `isOpen` (required): Modal open state
- `onClose` (required): Close handler
- `defaultContent`: Pre-fill message content
- `replyToId`: Reply to message ID
- `threadId`: Thread ID
- `onMessageScheduled`: Callback when message is scheduled

### ScheduledMessagesList

List and manage scheduled messages.

```typescript
import { ScheduledMessagesList } from '@/components/chat/ScheduledMessagesList'

<ScheduledMessagesList
  channelId="channel-123" // Optional: filter by channel
  userId="user-456" // Optional: filter by user
  className="custom-class"
/>
```

**Features:**

- View all scheduled messages
- Edit scheduled messages
- Cancel scheduled messages
- Delete scheduled messages
- Send now
- Retry failed messages
- Status indicators
- Stats (pending, failed, upcoming, overdue)

### MessageInputWithDrafts

Example message input with drafts and scheduling.

```typescript
import { MessageInputWithDrafts } from '@/components/chat/MessageInputWithDrafts'

<MessageInputWithDrafts
  channelId="channel-123"
  replyToId="msg-456" // Optional
  threadId="thread-789" // Optional
  placeholder="Type a message..."
  onMessageSent={() => console.log('Message sent')}
  className="custom-class"
/>
```

**Features:**

- Auto-save drafts
- Draft indicator
- Character count
- Schedule button
- Send button
- Reply/thread badges

## Hooks

### useDrafts

Hook for managing draft messages.

```typescript
import { useDrafts } from '@/hooks/use-drafts'

const {
  // State
  draftContent,
  hasDraft,
  draftUpdatedAt,

  // Actions
  updateDraft,
  saveDraft,
  clearDraft,
  restoreDraft,

  // Multi-draft
  channelDrafts,
  channelDraftCount,
  allDrafts,
  totalDraftCount,
} = useDrafts({
  channelId: 'channel-123',
  replyToId: 'msg-456', // Optional
  threadId: 'thread-789', // Optional
  onDraftRestored: (draft) => {
    console.log('Draft restored:', draft)
  },
})
```

**Methods:**

- `updateDraft(content, options)`: Update draft with auto-save
- `saveDraft(content, options)`: Save draft immediately
- `clearDraft()`: Clear current draft
- `restoreDraft()`: Restore draft from storage

### useAllDrafts

Hook for getting all drafts for current user.

```typescript
import { useAllDrafts } from '@/hooks/use-drafts'

const { drafts, draftsByChannel, totalCount, channelCount, clearAllDrafts, clearChannelDrafts } =
  useAllDrafts()
```

### useChannelDraftIndicator

Hook for draft indicators in channel list.

```typescript
import { useChannelDraftIndicator } from '@/hooks/use-drafts'

const { hasDraft, draftCount } = useChannelDraftIndicator('channel-123')

// Show indicator in channel list
{hasDraft && <Badge>{draftCount}</Badge>}
```

### useMessageScheduler

Hook for managing the message scheduler.

```typescript
import { useMessageScheduler } from '@/hooks/use-message-scheduler'

const { isRunning, start, stop, sendNow } = useMessageScheduler({
  autoStart: true, // Auto-start on mount
  pollInterval: 30000, // 30 seconds
})
```

### useScheduledMessagesList

Hook for getting scheduled messages list.

```typescript
import { useScheduledMessagesList } from '@/hooks/use-message-scheduler'

const { messages, pendingCount, failedCount, upcomingMessages, overdueMessages } =
  useScheduledMessagesList('channel-123', 'user-456')
```

### useScheduledMessage

Hook for managing a single scheduled message.

```typescript
import { useScheduledMessage } from '@/hooks/use-message-scheduler'

const { message, updateMessage, cancelMessage, deleteMessage, retryMessage } =
  useScheduledMessage('sched-123')
```

## Libraries

### DraftManager

Core draft management library.

```typescript
import { getDraftManager, DraftManager } from '@/lib/messaging/drafts'

const draftManager = getDraftManager(
  {
    autoSaveDelay: 1000, // 1 second
    maxDraftsPerChannel: 5,
    maxDraftAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  {
    onDraftSaved: (draft) => console.log('Draft saved'),
    onDraftDeleted: (draftId) => console.log('Draft deleted'),
    onDraftRestored: (draft) => console.log('Draft restored'),
  }
)

// Save draft
draftManager.saveDraft(
  {
    channelId: 'channel-123',
    userId: 'user-456',
    content: 'Hello world',
  },
  true
) // true = auto-save

// Get draft
const draft = draftManager.getDraft('channel-123', 'user-456')

// Clear old drafts
const cleared = draftManager.clearOldDrafts()
```

### MessageScheduler

Core scheduling and job queue library.

```typescript
import { getScheduler, MessageScheduler } from '@/lib/messaging/scheduler'

const scheduler = getScheduler(
  // Send message function
  async (message) => {
    return await sendMessage(message)
  },
  // Config
  {
    pollInterval: 30000,
    maxRetries: 3,
    retryDelay: 60000,
    batchSize: 10,
    gracePeriod: 5000,
  },
  // Callbacks
  {
    onMessageSent: (message) => console.log('Sent:', message.id),
    onMessageFailed: (message, error) => console.error('Failed:', error),
    onMessageCancelled: (message) => console.log('Cancelled:', message.id),
  }
)

// Start scheduler
scheduler.start()

// Schedule message
const scheduled = await scheduler.scheduleMessage({
  channelId: 'channel-123',
  userId: 'user-456',
  content: 'Hello world',
  scheduledAt: Date.now() + 3600000, // 1 hour from now
  maxRetries: 3,
})

// Stop scheduler
scheduler.stop()
```

## Usage Examples

### Basic Draft Usage

```typescript
import { MessageInputWithDrafts } from '@/components/chat/MessageInputWithDrafts'

function ChatChannel({ channelId }) {
  return (
    <div>
      <MessageInputWithDrafts
        channelId={channelId}
        placeholder="Type a message..."
        onMessageSent={() => console.log('Message sent!')}
      />
    </div>
  )
}
```

### Basic Scheduling Usage

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleMessageModal } from '@/components/chat/ScheduleMessageModal'

function ChatInput({ channelId }) {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [content, setContent] = useState('')

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button onClick={() => setIsScheduleOpen(true)}>
        Schedule
      </Button>

      <ScheduleMessageModal
        channelId={channelId}
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        defaultContent={content}
        onMessageScheduled={() => {
          setContent('')
          setIsScheduleOpen(false)
        }}
      />
    </div>
  )
}
```

### Scheduled Messages Management

```typescript
import { ScheduledMessagesList } from '@/components/chat/ScheduledMessagesList'

function ScheduledMessagesView({ channelId }) {
  return (
    <div className="p-4">
      <h2>Scheduled Messages</h2>
      <ScheduledMessagesList channelId={channelId} />
    </div>
  )
}
```

### Draft Indicators in Channel List

```typescript
import { useChannelDraftIndicator } from '@/hooks/use-drafts'
import { Badge } from '@/components/ui/badge'

function ChannelListItem({ channel }) {
  const { hasDraft, draftCount } = useChannelDraftIndicator(channel.id)

  return (
    <div className="channel-item">
      <span>{channel.name}</span>
      {hasDraft && (
        <Badge variant="secondary">
          {draftCount} draft{draftCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  )
}
```

### Custom Scheduler Integration

```typescript
import { useEffect } from 'react'
import { useMessageScheduler } from '@/hooks/use-message-scheduler'

function App() {
  const { isRunning, start, stop } = useMessageScheduler({
    autoStart: true,
    pollInterval: 30000,
  })

  useEffect(() => {
    console.log('Scheduler running:', isRunning)
  }, [isRunning])

  return (
    <div>
      <button onClick={start} disabled={isRunning}>
        Start Scheduler
      </button>
      <button onClick={stop} disabled={!isRunning}>
        Stop Scheduler
      </button>
    </div>
  )
}
```

## API Routes

### GET /api/messages/schedule

Get scheduled messages.

**Query Parameters:**

- `channelId` (optional): Filter by channel
- `userId` (optional): Filter by user
- `status` (optional): Filter by status (pending, sent, failed, cancelled)

**Response:**

```json
{
  "scheduledMessages": [...],
  "count": 10
}
```

### POST /api/messages/schedule

Create a scheduled message.

**Body:**

```json
{
  "channelId": "channel-123",
  "userId": "user-456",
  "content": "Hello world",
  "scheduledAt": 1234567890000,
  "replyToId": "msg-789",
  "threadId": "thread-012",
  "attachments": [],
  "mentions": []
}
```

**Response:**

```json
{
  "scheduledMessage": {...},
  "message": "Message scheduled successfully"
}
```

### PATCH /api/messages/schedule

Update a scheduled message.

**Body:**

```json
{
  "messageId": "sched-123",
  "content": "Updated content",
  "scheduledAt": 1234567890000
}
```

**Response:**

```json
{
  "scheduledMessage": {...},
  "message": "Scheduled message updated successfully"
}
```

### DELETE /api/messages/schedule

Cancel/delete a scheduled message.

**Query Parameters:**

- `messageId` (required): Message ID to cancel

**Response:**

```json
{
  "message": "Scheduled message cancelled successfully",
  "messageId": "sched-123"
}
```

## Configuration

### Draft Manager Config

```typescript
{
  autoSaveDelay: 1000,        // Debounce delay (ms)
  maxDraftsPerChannel: 5,     // Max drafts per channel
  maxDraftAge: 604800000      // 7 days in ms
}
```

### Message Scheduler Config

```typescript
{
  pollInterval: 30000,        // Poll interval (ms)
  maxRetries: 3,              // Max retry attempts
  retryDelay: 60000,          // Delay between retries (ms)
  batchSize: 10,              // Messages per batch
  gracePeriod: 5000           // Grace period (ms)
}
```

## Testing

### Testing Drafts

```typescript
import { getDraftManager } from '@/lib/messaging/drafts'

describe('DraftManager', () => {
  it('should save and retrieve draft', () => {
    const manager = getDraftManager()

    const draft = manager.saveDraft({
      channelId: 'test',
      userId: 'user',
      content: 'Test draft',
    })

    const retrieved = manager.getDraft('test', 'user')
    expect(retrieved?.content).toBe('Test draft')
  })
})
```

### Testing Scheduler

```typescript
import { getScheduler } from '@/lib/messaging/scheduler'

describe('MessageScheduler', () => {
  it('should schedule and send message', async () => {
    const sendMock = jest.fn()
    const scheduler = getScheduler(sendMock)

    await scheduler.scheduleMessage({
      channelId: 'test',
      userId: 'user',
      content: 'Test',
      scheduledAt: Date.now() + 1000,
      maxRetries: 3,
    })

    // Wait for message to be due
    await new Promise((resolve) => setTimeout(resolve, 2000))

    expect(sendMock).toHaveBeenCalled()
  })
})
```

## Troubleshooting

### Drafts not saving

1. Check localStorage is available
2. Check browser console for errors
3. Verify `useDrafts` hook is being called
4. Check auto-save delay configuration

### Scheduled messages not sending

1. Check scheduler is running (`isRunning = true`)
2. Check scheduled time is in the future
3. Check browser console for errors
4. Verify `sendMessage` function is working
5. Check retry count hasn't exceeded max

### Drafts not restoring

1. Check `channelId` matches exactly
2. Check `userId` is correct
3. Check draft hasn't expired (7 days default)
4. Check `onDraftRestored` callback is firing

### Performance issues

1. Reduce `pollInterval` (default 30s)
2. Reduce `batchSize` (default 10)
3. Clear old drafts regularly
4. Clear completed scheduled messages

## Best Practices

1. **Always handle errors** in callbacks
2. **Clear drafts** after sending messages
3. **Validate content** before scheduling
4. **Use debounced updates** for drafts
5. **Show feedback** to users (toasts, indicators)
6. **Clean up** old data regularly
7. **Test edge cases** (timezone changes, clock skew)
8. **Monitor performance** with logging
9. **Handle offline scenarios** gracefully
10. **Provide manual controls** (retry, cancel, delete)

## Additional Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [date-fns Documentation](https://date-fns.org/)
- [React Hooks Best Practices](https://react.dev/reference/react)
