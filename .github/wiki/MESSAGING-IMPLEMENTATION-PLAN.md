# Core Messaging Implementation Plan

**Version**: 0.9.1
**Date**: February 3, 2026
**Status**: Implementation Specification
**Tasks**: 48-59 (Phase 5 - Core Messaging Parity)

This document provides a comprehensive implementation plan for achieving feature parity with WhatsApp, Telegram, Slack, and Discord for core messaging functionality.

---

## Table of Contents

1. [Overview](#overview)
2. [Task 48: Message CRUD](#task-48-message-crud)
3. [Task 49: Threads and Replies](#task-49-threads-and-replies)
4. [Task 50: Message Edit History](#task-50-message-edit-history)
5. [Task 51: Pinning and Bookmarking](#task-51-pinning-and-bookmarking)
6. [Task 52: Forwarding and Quoting](#task-52-forwarding-and-quoting)
7. [Task 53: Scheduled Messages](#task-53-scheduled-messages)
8. [Task 54: Disappearing Messages](#task-54-disappearing-messages)
9. [Task 55: Reactions](#task-55-reactions)
10. [Task 56: Mentions](#task-56-mentions)
11. [Task 57: Link Unfurling](#task-57-link-unfurling)
12. [Task 58: Markdown Sanitization](#task-58-markdown-sanitization)
13. [Task 59: Attachments](#task-59-attachments)
14. [Cross-Cutting Concerns](#cross-cutting-concerns)
15. [Testing Strategy](#testing-strategy)
16. [Parity Matrix](#parity-matrix)

---

## Overview

### Current State Analysis

The codebase has significant scaffolding in place:

| Component                 | Status   | Location                            |
| ------------------------- | -------- | ----------------------------------- |
| Message Types             | Complete | `src/types/message.ts`              |
| GraphQL Queries/Mutations | Partial  | `src/graphql/messages.ts`           |
| Message Store (Zustand)   | Complete | `src/stores/message-store.ts`       |
| Hooks                     | Partial  | `src/hooks/use-messages.ts`         |
| Thread Support            | Partial  | `src/graphql/threads.ts`            |
| Reactions                 | Partial  | `src/graphql/reactions.ts`          |
| Bookmarks                 | Partial  | `src/graphql/bookmarks.ts`          |
| Scheduled Messages        | Partial  | `src/graphql/scheduled.ts`          |
| Mentions                  | Partial  | `src/graphql/mentions.ts`           |
| Attachments               | Partial  | `src/graphql/attachments.ts`        |
| Forwarding                | Partial  | `src/graphql/forward.ts`            |
| Disappearing              | Partial  | `src/graphql/disappearing/index.ts` |

### Implementation Principles

1. **Backend First**: All features must be server-enforced, not client-only
2. **Plugin Integration**: Use nself plugins for jobs, notifications, file-processing
3. **Real-time**: All mutations must trigger appropriate subscriptions
4. **RBAC**: Every action must check user permissions
5. **Audit Trail**: All modifications must be logged

---

## Task 48: Message CRUD

### Requirements

Implement complete message Create, Read, Update, Delete operations with full validation and permissions.

### Database Schema

```sql
-- Core messages table (extends existing nchat_messages)
CREATE TABLE nchat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  content TEXT NOT NULL,
  content_html TEXT, -- Pre-rendered HTML (server-side)
  type VARCHAR(50) NOT NULL DEFAULT 'text',
  thread_id UUID REFERENCES nchat_threads(id),
  parent_id UUID REFERENCES nchat_messages(id), -- Inline reply
  forwarded_from_id UUID REFERENCES nchat_messages(id),

  -- State flags
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES nchat_users(id),

  -- Indexing
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(content, '')), 'A')
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_messages_channel_created ON nchat_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_thread ON nchat_messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_messages_search ON nchat_messages USING GIN(search_vector);
CREATE INDEX idx_messages_user ON nchat_messages(user_id);
CREATE INDEX idx_messages_not_deleted ON nchat_messages(channel_id, created_at DESC) WHERE is_deleted = FALSE;
```

### RLS Policies

```sql
-- Users can read messages in channels they belong to
CREATE POLICY "Channel members can read messages"
  ON nchat_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT channel_id FROM nchat_channel_members
      WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM nchat_channels
      WHERE id = channel_id AND NOT is_private
    )
  );

-- Users can create messages in channels they belong to
CREATE POLICY "Channel members can create messages"
  ON nchat_messages FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT channel_id FROM nchat_channel_members
      WHERE user_id = auth.uid()
      AND (role != 'guest' OR channel.allow_guest_messages)
    )
  );

-- Users can only edit their own messages (within time limit for non-admins)
CREATE POLICY "Users can edit own messages"
  ON nchat_messages FOR UPDATE
  USING (
    user_id = auth.uid()
    AND NOT is_deleted
    AND (
      -- Within edit window or user is admin
      created_at > NOW() - INTERVAL '24 hours'
      OR EXISTS (
        SELECT 1 FROM nchat_channel_members
        WHERE channel_id = nchat_messages.channel_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- Users can soft-delete own messages, moderators can delete any
CREATE POLICY "Delete permissions"
  ON nchat_messages FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nchat_channel_members
      WHERE channel_id = nchat_messages.channel_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'moderator')
    )
  );
```

### API Endpoints

#### GraphQL Mutations

```graphql
# Create message with validation
mutation SendMessage(
  $channelId: uuid!
  $content: String!
  $type: String = "text"
  $replyToId: uuid
  $threadId: uuid
  $metadata: jsonb
) {
  send_message(
    channel_id: $channelId
    content: $content
    type: $type
    reply_to_id: $replyToId
    thread_id: $threadId
    metadata: $metadata
  ) {
    id
    content
    content_html
    created_at
    user {
      id
      display_name
      avatar_url
    }
  }
}

# Edit message (stores previous version in history)
mutation EditMessage($messageId: uuid!, $content: String!) {
  edit_message(message_id: $messageId, content: $content) {
    id
    content
    content_html
    is_edited
    edited_at
  }
}

# Soft delete message
mutation DeleteMessage($messageId: uuid!) {
  delete_message(message_id: $messageId) {
    id
    is_deleted
    deleted_at
  }
}
```

#### Hasura Actions (Backend Functions)

```typescript
// backend/functions/send_message.ts
export async function sendMessage(input: SendMessageInput): Promise<Message> {
  // 1. Validate content (length, format, rate limiting)
  await validateMessageContent(input.content)

  // 2. Check permissions
  await checkChannelMembership(input.channelId, input.userId)

  // 3. Parse and sanitize content
  const sanitized = sanitizeMarkdown(input.content)
  const contentHtml = renderMarkdown(sanitized)

  // 4. Extract mentions and notify
  const mentions = extractMentions(sanitized)

  // 5. Insert message
  const message = await db.messages.insert({
    channel_id: input.channelId,
    user_id: input.userId,
    content: sanitized,
    content_html: contentHtml,
    type: input.type,
    reply_to_id: input.replyToId,
    thread_id: input.threadId,
    metadata: input.metadata,
  })

  // 6. Create mention records and trigger notifications
  if (mentions.length > 0) {
    await createMentionRecords(message.id, mentions)
    await triggerMentionNotifications(message, mentions)
  }

  // 7. Update channel activity
  await updateChannelActivity(input.channelId)

  return message
}
```

### Real-time Events

```typescript
// Subscription events for messages
interface MessageEvents {
  'message:created': { channelId: string; message: Message }
  'message:updated': { channelId: string; messageId: string; updates: Partial<Message> }
  'message:deleted': { channelId: string; messageId: string; deletedBy: string }
}
```

### UI Components

| Component        | Path                                      | Purpose                     |
| ---------------- | ----------------------------------------- | --------------------------- |
| `MessageInput`   | `src/components/chat/message-input.tsx`   | Composition input           |
| `MessageList`    | `src/components/chat/message-list.tsx`    | Virtualized message display |
| `MessageItem`    | `src/components/chat/message-item.tsx`    | Single message render       |
| `MessageContent` | `src/components/chat/message-content.tsx` | Content with mentions/links |
| `MessageActions` | `src/components/chat/message-actions.tsx` | Edit/delete/reply buttons   |

### Test Requirements

```typescript
describe('Message CRUD', () => {
  describe('Create', () => {
    it('should create message with valid content')
    it('should reject empty messages')
    it('should reject messages exceeding length limit')
    it('should sanitize HTML/script injection')
    it('should parse markdown correctly')
    it('should extract mentions')
    it('should enforce rate limiting')
    it('should require channel membership')
    it('should handle guest restrictions')
  })

  describe('Read', () => {
    it('should paginate messages correctly')
    it('should enforce visibility rules')
    it('should include user and attachment data')
    it('should filter deleted messages')
    it('should support search')
  })

  describe('Update', () => {
    it('should allow author to edit')
    it('should create edit history record')
    it('should mark message as edited')
    it('should re-parse mentions on edit')
    it('should enforce edit time window')
    it('should allow admin override')
  })

  describe('Delete', () => {
    it('should soft delete by default')
    it('should allow author to delete')
    it('should allow moderator to delete any')
    it('should record who deleted')
    it('should clean up attachments')
  })
})
```

---

## Task 49: Threads and Replies

### Requirements

Implement full threading support with thread creation, replies, and thread-level notifications.

### Database Schema

```sql
CREATE TABLE nchat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  parent_message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nchat_thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES nchat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(thread_id, user_id)
);

-- Add thread_id to messages
ALTER TABLE nchat_messages ADD COLUMN thread_id UUID REFERENCES nchat_threads(id);
CREATE INDEX idx_messages_thread ON nchat_messages(thread_id) WHERE thread_id IS NOT NULL;
```

### API Endpoints

```graphql
mutation CreateThread($channelId: uuid!, $parentMessageId: uuid!, $content: String!) {
  create_thread(
    channel_id: $channelId
    parent_message_id: $parentMessageId
    initial_content: $content
  ) {
    thread {
      id
      message_count
      parent_message {
        id
        content
      }
    }
    message {
      id
      content
    }
  }
}

mutation ReplyToThread($threadId: uuid!, $content: String!) {
  reply_to_thread(thread_id: $threadId, content: $content) {
    id
    content
    thread {
      message_count
      last_reply_at
    }
  }
}

subscription ThreadMessages($threadId: uuid!) {
  nchat_messages(
    where: { thread_id: { _eq: $threadId }, is_deleted: { _eq: false } }
    order_by: { created_at: asc }
  ) {
    id
    content
    user {
      id
      display_name
      avatar_url
    }
    created_at
  }
}
```

### Notification Triggers

```typescript
// backend/functions/thread_notification.ts
async function notifyThreadParticipants(
  threadId: string,
  newMessage: Message,
  excludeUserId: string
) {
  const participants = await db.threadParticipants.find({
    thread_id: threadId,
    user_id: { _neq: excludeUserId },
    notifications_enabled: true,
  })

  for (const participant of participants) {
    await notificationsPlugin.send({
      userId: participant.user_id,
      type: 'thread_reply',
      title: `New reply in thread`,
      body: truncate(newMessage.content, 100),
      data: {
        threadId,
        messageId: newMessage.id,
        channelId: newMessage.channel_id,
      },
    })
  }
}
```

### UI Components

| Component            | Path                                             | Purpose                       |
| -------------------- | ------------------------------------------------ | ----------------------------- |
| `ThreadPanel`        | `src/components/thread/thread-panel.tsx`         | Side panel for thread view    |
| `ThreadMessageList`  | `src/components/thread/thread-message-list.tsx`  | Messages in thread            |
| `ThreadPreview`      | `src/components/chat/message-thread-preview.tsx` | Thread info on parent message |
| `ThreadParticipants` | `src/components/thread/thread-participants.tsx`  | Who's in thread               |

### Test Requirements

```typescript
describe('Threads', () => {
  it('should create thread from message')
  it('should add author as participant')
  it('should track message count')
  it('should update last_reply_at')
  it('should notify participants of new replies')
  it('should allow joining/leaving thread')
  it('should support thread muting')
  it('should enforce thread lock')
  it('should display thread preview in channel')
})
```

---

## Task 50: Message Edit History

### Requirements

Store and display message edit history with full audit trail.

### Database Schema

```sql
CREATE TABLE nchat_message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  previous_content_html TEXT,
  edited_by UUID NOT NULL REFERENCES nchat_users(id),
  edited_at TIMESTAMPTZ DEFAULT NOW(),
  edit_reason VARCHAR(255)
);

CREATE INDEX idx_edit_history_message ON nchat_message_edit_history(message_id, edited_at DESC);
```

### API Implementation

```typescript
// backend/functions/edit_message.ts
async function editMessage(
  messageId: string,
  newContent: string,
  editedBy: string,
  reason?: string
): Promise<Message> {
  // 1. Get current message
  const message = await db.messages.findById(messageId)

  // 2. Validate permissions
  if (message.user_id !== editedBy) {
    const membership = await getChannelMembership(message.channel_id, editedBy)
    if (!['owner', 'admin'].includes(membership.role)) {
      throw new Error('Not authorized to edit this message')
    }
  }

  // 3. Store edit history
  await db.messageEditHistory.insert({
    message_id: messageId,
    previous_content: message.content,
    previous_content_html: message.content_html,
    edited_by: editedBy,
    edit_reason: reason,
  })

  // 4. Update message
  const sanitized = sanitizeMarkdown(newContent)
  const contentHtml = renderMarkdown(sanitized)

  const updated = await db.messages.update(messageId, {
    content: sanitized,
    content_html: contentHtml,
    is_edited: true,
    edited_at: new Date(),
    updated_at: new Date(),
  })

  // 5. Re-process mentions
  await updateMessageMentions(messageId, sanitized)

  return updated
}
```

### GraphQL Queries

```graphql
query GetMessageEditHistory($messageId: uuid!) {
  nchat_message_edit_history(
    where: { message_id: { _eq: $messageId } }
    order_by: { edited_at: desc }
  ) {
    id
    previous_content
    edited_at
    edit_reason
    edited_by_user {
      id
      display_name
      avatar_url
    }
  }
}
```

### UI Components

| Component            | Path                                           | Purpose                       |
| -------------------- | ---------------------------------------------- | ----------------------------- |
| `MessageEditHistory` | `src/components/chat/message-edit-history.tsx` | View edit history modal       |
| `EditedIndicator`    | `src/components/chat/edited-indicator.tsx`     | "(edited)" label with tooltip |

### Test Requirements

```typescript
describe('Edit History', () => {
  it('should store previous content on edit')
  it('should record who edited')
  it('should record edit timestamp')
  it('should display edit indicator on message')
  it('should show full history in modal')
  it('should track multiple edits')
  it('should handle moderator edits')
})
```

---

## Task 51: Pinning and Bookmarking

### Requirements

- **Pinning**: Channel-level feature for important messages (moderator action)
- **Bookmarking**: User-level feature for personal saved messages

### Database Schema

```sql
-- Pinned messages (channel-level)
CREATE TABLE nchat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES nchat_users(id),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  pin_note TEXT,
  UNIQUE(channel_id, message_id)
);

-- Bookmarks (user-level)
CREATE TABLE nchat_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  note TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

CREATE INDEX idx_bookmarks_user ON nchat_bookmarks(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_tags ON nchat_bookmarks USING GIN(tags);
```

### API Endpoints

```graphql
# Pinning (requires moderator role)
mutation PinMessage($messageId: uuid!, $channelId: uuid!, $note: String) {
  pin_message(message_id: $messageId, channel_id: $channelId, note: $note) {
    id
    pinned_at
    pin_note
  }
}

mutation UnpinMessage($messageId: uuid!, $channelId: uuid!) {
  unpin_message(message_id: $messageId, channel_id: $channelId) {
    success
  }
}

query GetPinnedMessages($channelId: uuid!) {
  nchat_pinned_messages(where: { channel_id: { _eq: $channelId } }, order_by: { pinned_at: desc }) {
    id
    pin_note
    pinned_at
    pinned_by_user {
      display_name
    }
    message {
      ...MessageFull
    }
  }
}

# Bookmarking (user action)
mutation AddBookmark($messageId: uuid!, $note: String, $tags: [String!]) {
  add_bookmark(message_id: $messageId, note: $note, tags: $tags) {
    id
    note
    tags
  }
}

query GetMyBookmarks($limit: Int = 50, $offset: Int = 0, $tag: String) {
  nchat_bookmarks(
    where: { user_id: { _eq: $userId }, tags: { _contains: [$tag] } }
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    note
    tags
    created_at
    message {
      ...MessageFull
      channel {
        id
        name
        slug
      }
    }
  }
}
```

### UI Components

| Component         | Path                                          | Purpose               |
| ----------------- | --------------------------------------------- | --------------------- |
| `PinnedMessages`  | `src/components/channel/pinned-messages.tsx`  | Channel pinned list   |
| `PinMessageModal` | `src/components/modals/pin-message-modal.tsx` | Pin with note         |
| `BookmarksList`   | `src/components/bookmarks/bookmarks-list.tsx` | User's saved messages |
| `BookmarkButton`  | `src/components/chat/bookmark-button.tsx`     | Quick bookmark action |

### Test Requirements

```typescript
describe('Pinning', () => {
  it('should require moderator role')
  it('should limit pins per channel')
  it('should create system message on pin')
  it('should display pinned messages list')
  it('should support pin notes')
})

describe('Bookmarking', () => {
  it('should allow any user to bookmark')
  it('should support notes')
  it('should support tags')
  it('should search bookmarks')
  it('should filter by tag')
})
```

---

## Task 52: Forwarding and Quoting

### Requirements

- **Forwarding**: Send message to other channels/users with attribution
- **Quoting**: Include quoted text in reply with visual distinction

### Database Schema

```sql
-- Forward tracking
ALTER TABLE nchat_messages ADD COLUMN forwarded_from_id UUID REFERENCES nchat_messages(id);
ALTER TABLE nchat_messages ADD COLUMN forward_comment TEXT;

-- Forward log for analytics
CREATE TABLE nchat_forward_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID NOT NULL REFERENCES nchat_messages(id),
  forwarded_message_id UUID NOT NULL REFERENCES nchat_messages(id),
  forwarded_by UUID NOT NULL REFERENCES nchat_users(id),
  forwarded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

```graphql
mutation ForwardMessage($messageId: uuid!, $targetChannelIds: [uuid!]!, $comment: String) {
  forward_message(
    message_id: $messageId
    target_channel_ids: $targetChannelIds
    comment: $comment
  ) {
    forwarded_count
    messages {
      id
      channel_id
    }
  }
}

# Quote is handled in content with special markdown
# > [Quoted from @user](link-to-message)
# > Original content here
```

### Forwarding Logic

```typescript
// backend/functions/forward_message.ts
async function forwardMessage(
  messageId: string,
  targetChannelIds: string[],
  forwardedBy: string,
  comment?: string
): Promise<ForwardResult> {
  // 1. Get original message
  const original = await db.messages.findById(messageId)

  // 2. Check source channel permissions (can user see this message?)
  await checkMessageVisibility(messageId, forwardedBy)

  // 3. Check target channel permissions
  for (const channelId of targetChannelIds) {
    await checkChannelMembership(channelId, forwardedBy)
  }

  // 4. Check if forwarding is allowed (disappearing messages may block)
  if (original.disappearing_type && original.metadata?.prevent_forwarding) {
    throw new Error('This message cannot be forwarded')
  }

  // 5. Create forwarded messages
  const forwarded = await Promise.all(
    targetChannelIds.map(async (channelId) => {
      return db.messages.insert({
        channel_id: channelId,
        user_id: forwardedBy,
        content: comment || '',
        type: 'forwarded',
        forwarded_from_id: messageId,
        forward_comment: comment,
      })
    })
  )

  // 6. Log forwards for analytics
  await db.forwardLog.insertMany(
    forwarded.map((msg) => ({
      original_message_id: messageId,
      forwarded_message_id: msg.id,
      forwarded_by: forwardedBy,
    }))
  )

  return { forwarded_count: forwarded.length, messages: forwarded }
}
```

### UI Components

| Component             | Path                                               | Purpose                   |
| --------------------- | -------------------------------------------------- | ------------------------- |
| `ForwardMessageModal` | `src/components/forward/forward-message-modal.tsx` | Channel/user picker       |
| `ForwardedMessage`    | `src/components/forward/forwarded-message.tsx`     | Forwarded message display |
| `QuotedMessage`       | `src/components/chat/quoted-message.tsx`           | Quote block in content    |

### Test Requirements

```typescript
describe('Forwarding', () => {
  it('should forward to single channel')
  it('should forward to multiple channels')
  it('should preserve original attribution')
  it('should include optional comment')
  it('should check target permissions')
  it('should respect disappearing message restrictions')
  it('should log forward analytics')
})

describe('Quoting', () => {
  it('should render quote block')
  it('should link to original message')
  it('should show original author')
  it('should truncate long quotes')
})
```

---

## Task 53: Scheduled Messages

### Requirements

Schedule messages for future delivery using the nself jobs plugin.

### Database Schema

```sql
CREATE TABLE nchat_scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  content TEXT NOT NULL,
  content_html TEXT,
  type VARCHAR(50) DEFAULT 'text',
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, cancelled, failed
  metadata JSONB DEFAULT '{}',

  -- Job tracking
  job_id VARCHAR(255), -- nself jobs plugin job ID

  -- Results
  sent_at TIMESTAMPTZ,
  sent_message_id UUID REFERENCES nchat_messages(id),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_pending ON nchat_scheduled_messages(scheduled_at)
  WHERE status = 'pending';
CREATE INDEX idx_scheduled_user ON nchat_scheduled_messages(user_id, status);
```

### Jobs Plugin Integration

```typescript
// backend/jobs/send_scheduled_message.ts
import { jobsPlugin } from '@nself/plugins/jobs'

export async function registerScheduledMessageJob() {
  jobsPlugin.registerHandler('send_scheduled_message', async (job) => {
    const { scheduledMessageId } = job.data

    try {
      // 1. Get scheduled message
      const scheduled = await db.scheduledMessages.findById(scheduledMessageId)

      if (scheduled.status !== 'pending') {
        return { skipped: true, reason: `Status is ${scheduled.status}` }
      }

      // 2. Verify user still has permission
      const canSend = await checkChannelMembership(scheduled.channel_id, scheduled.user_id)

      if (!canSend) {
        await db.scheduledMessages.update(scheduledMessageId, {
          status: 'failed',
          error_message: 'User no longer has permission to send to this channel',
        })
        return { failed: true, reason: 'Permission denied' }
      }

      // 3. Send the message
      const message = await sendMessage({
        channelId: scheduled.channel_id,
        userId: scheduled.user_id,
        content: scheduled.content,
        type: scheduled.type,
        metadata: { ...scheduled.metadata, scheduled: true },
      })

      // 4. Update scheduled message record
      await db.scheduledMessages.update(scheduledMessageId, {
        status: 'sent',
        sent_at: new Date(),
        sent_message_id: message.id,
      })

      return { success: true, messageId: message.id }
    } catch (error) {
      await db.scheduledMessages.update(scheduledMessageId, {
        status: 'failed',
        error_message: error.message,
      })
      throw error
    }
  })
}

// Schedule a message
async function scheduleMessage(input: ScheduleMessageInput): Promise<ScheduledMessage> {
  // 1. Validate scheduled time (must be in future)
  const scheduledAt = new Date(input.scheduledAt)
  if (scheduledAt <= new Date()) {
    throw new Error('Scheduled time must be in the future')
  }

  // 2. Create scheduled message record
  const scheduled = await db.scheduledMessages.insert({
    channel_id: input.channelId,
    user_id: input.userId,
    content: sanitizeMarkdown(input.content),
    content_html: renderMarkdown(input.content),
    scheduled_at: scheduledAt,
    timezone: input.timezone || 'UTC',
    type: input.type || 'text',
    metadata: input.metadata,
  })

  // 3. Schedule job with jobs plugin
  const job = await jobsPlugin.schedule({
    name: 'send_scheduled_message',
    data: { scheduledMessageId: scheduled.id },
    runAt: scheduledAt,
    retries: 3,
    retryDelay: 60000, // 1 minute
  })

  // 4. Update with job ID
  await db.scheduledMessages.update(scheduled.id, {
    job_id: job.id,
  })

  return scheduled
}
```

### Timezone Handling

```typescript
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz'

function convertToUTC(localTime: string, timezone: string): Date {
  return zonedTimeToUtc(localTime, timezone)
}

function displayInUserTimezone(utcTime: Date, timezone: string): string {
  const zonedTime = utcToZonedTime(utcTime, timezone)
  return format(zonedTime, 'PPpp', { timeZone: timezone })
}
```

### UI Components

| Component               | Path                                                   | Purpose          |
| ----------------------- | ------------------------------------------------------ | ---------------- |
| `ScheduleMessageModal`  | `src/components/scheduled/schedule-message-modal.tsx`  | Date/time picker |
| `ScheduledMessagesList` | `src/components/scheduled/scheduled-messages-list.tsx` | View pending     |
| `ScheduledMessageItem`  | `src/components/scheduled/scheduled-message-item.tsx`  | Edit/cancel      |

### Test Requirements

```typescript
describe('Scheduled Messages', () => {
  it('should schedule message for future')
  it('should reject past times')
  it('should handle timezone conversion')
  it('should send at scheduled time')
  it('should allow editing before send')
  it('should allow cancellation')
  it('should handle send failures')
  it('should verify permissions at send time')
  it('should support attachments')
})
```

---

## Task 54: Disappearing Messages

### Requirements

Implement time-limited messages with server-side TTL enforcement.

### Database Schema

```sql
-- Channel-level settings
CREATE TABLE nchat_disappearing_settings (
  channel_id UUID PRIMARY KEY REFERENCES nchat_channels(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  default_duration INTEGER NOT NULL, -- seconds
  can_modify VARCHAR(20) DEFAULT 'admin', -- owner, admin, all
  show_banner BOOLEAN DEFAULT TRUE,
  is_secret_chat BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  screenshot_warning BOOLEAN DEFAULT FALSE,
  prevent_forwarding BOOLEAN DEFAULT FALSE,
  prevent_copying BOOLEAN DEFAULT FALSE,
  hide_notification_content BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES nchat_users(id)
);

-- Message-level disappearing fields
ALTER TABLE nchat_messages ADD COLUMN disappearing_type VARCHAR(20); -- regular, view_once, burn_after_reading
ALTER TABLE nchat_messages ADD COLUMN disappearing_duration INTEGER;
ALTER TABLE nchat_messages ADD COLUMN disappearing_expires_at TIMESTAMPTZ;
ALTER TABLE nchat_messages ADD COLUMN disappearing_viewed BOOLEAN DEFAULT FALSE;
ALTER TABLE nchat_messages ADD COLUMN disappearing_viewed_at TIMESTAMPTZ;
ALTER TABLE nchat_messages ADD COLUMN disappearing_viewed_by UUID REFERENCES nchat_users(id);

-- Screenshot detection log
CREATE TABLE nchat_screenshot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  message_id UUID REFERENCES nchat_messages(id),
  detected_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Server-Side Enforcement

```typescript
// backend/jobs/expire_messages.ts
import { jobsPlugin } from '@nself/plugins/jobs'

// Run every minute to clean up expired messages
jobsPlugin.schedule({
  name: 'expire_disappearing_messages',
  cron: '* * * * *', // Every minute
  handler: async () => {
    // 1. Find expired messages
    const expired = await db.messages.find({
      disappearing_expires_at: { _lte: new Date() },
      is_deleted: false,
    })

    // 2. Delete messages and their attachments
    for (const message of expired) {
      // Delete attachments from storage
      if (message.attachments?.length > 0) {
        await storagePlugin.deleteFiles(message.attachments.map((a) => a.file_url))
      }

      // Soft delete the message
      await db.messages.update(message.id, {
        is_deleted: true,
        deleted_at: new Date(),
        content: '', // Clear content for privacy
      })

      // Broadcast deletion to connected clients
      await realtimePlugin.broadcast({
        channel: `channel:${message.channel_id}`,
        event: 'message:expired',
        data: { messageId: message.id },
      })
    }

    return { deleted: expired.length }
  },
})
```

### View-Once Messages

```typescript
// backend/functions/view_message.ts
async function viewDisappearingMessage(
  messageId: string,
  viewerId: string
): Promise<Message | null> {
  const message = await db.messages.findById(messageId)

  if (!message || message.is_deleted) {
    return null
  }

  // View-once: can only be viewed once by recipient
  if (message.disappearing_type === 'view_once') {
    if (message.disappearing_viewed) {
      // Already viewed, return null content
      return { ...message, content: '[Message expired]', attachments: [] }
    }

    // Mark as viewed
    await db.messages.update(messageId, {
      disappearing_viewed: true,
      disappearing_viewed_at: new Date(),
      disappearing_viewed_by: viewerId,
    })

    // Schedule deletion after short delay
    await jobsPlugin.schedule({
      name: 'delete_view_once',
      data: { messageId },
      runAt: new Date(Date.now() + 5000), // 5 seconds
    })
  }

  // Burn after reading: start timer when opened
  if (message.disappearing_type === 'burn_after_reading') {
    if (!message.disappearing_expires_at) {
      const expiresAt = new Date(Date.now() + message.disappearing_duration * 1000)
      await db.messages.update(messageId, {
        disappearing_expires_at: expiresAt,
      })
    }
  }

  return message
}
```

### UI Components

| Component              | Path                                                | Purpose                   |
| ---------------------- | --------------------------------------------------- | ------------------------- |
| `DisappearingBanner`   | `src/components/chat/disappearing-banner.tsx`       | Channel setting indicator |
| `DisappearingTimer`    | `src/components/chat/disappearing-timer.tsx`        | Countdown on message      |
| `ViewOnceMessage`      | `src/components/chat/view-once-message.tsx`         | Reveal on click           |
| `DisappearingSettings` | `src/components/settings/disappearing-settings.tsx` | Configuration             |

### Test Requirements

```typescript
describe('Disappearing Messages', () => {
  describe('Regular TTL', () => {
    it('should set expiration on send')
    it('should delete after duration')
    it('should clear content and attachments')
    it('should broadcast deletion')
  })

  describe('View Once', () => {
    it('should allow single view')
    it('should delete after viewed')
    it('should show placeholder if already viewed')
  })

  describe('Burn After Reading', () => {
    it('should start timer on open')
    it('should show countdown')
    it('should delete when timer expires')
  })

  describe('Settings', () => {
    it('should apply to new messages')
    it('should respect can_modify permission')
    it('should show banner when enabled')
  })
})
```

---

## Task 55: Reactions

### Requirements

Implement emoji reactions with real-time sync across clients.

### Database Schema

```sql
CREATE TABLE nchat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  emoji VARCHAR(50) NOT NULL, -- Unicode emoji or custom emoji ID
  is_custom_emoji BOOLEAN DEFAULT FALSE,
  custom_emoji_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON nchat_reactions(message_id);
CREATE INDEX idx_reactions_emoji ON nchat_reactions(message_id, emoji);
```

### API Endpoints

```graphql
mutation AddReaction($messageId: uuid!, $emoji: String!) {
  insert_nchat_reactions_one(
    object: { message_id: $messageId, user_id: $userId, emoji: $emoji }
    on_conflict: { constraint: nchat_reactions_message_id_user_id_emoji_key, update_columns: [] }
  ) {
    id
    emoji
  }
}

mutation RemoveReaction($messageId: uuid!, $emoji: String!) {
  delete_nchat_reactions(
    where: { message_id: { _eq: $messageId }, user_id: { _eq: $userId }, emoji: { _eq: $emoji } }
  ) {
    affected_rows
  }
}

# Toggle reaction (add if not exists, remove if exists)
mutation ToggleReaction($messageId: uuid!, $emoji: String!) {
  toggle_reaction(message_id: $messageId, emoji: $emoji) {
    action # 'added' or 'removed'
    reaction_count
  }
}

subscription MessageReactions($messageId: uuid!) {
  nchat_reactions(where: { message_id: { _eq: $messageId } }) {
    emoji
    user {
      id
      display_name
      avatar_url
    }
  }
}
```

### Real-time Sync

```typescript
// Real-time reaction updates
realtimePlugin.on('reaction:add', async (data) => {
  const { messageId, emoji, userId } = data

  // Broadcast to all clients viewing this channel
  await realtimePlugin.broadcast({
    channel: `channel:${data.channelId}`,
    event: 'reaction:added',
    data: {
      messageId,
      emoji,
      user: await db.users.findById(userId, ['id', 'display_name', 'avatar_url']),
    },
  })
})
```

### UI Components

| Component          | Path                                        | Purpose          |
| ------------------ | ------------------------------------------- | ---------------- |
| `MessageReactions` | `src/components/chat/message-reactions.tsx` | Reaction display |
| `ReactionPicker`   | `src/components/chat/reaction-picker.tsx`   | Emoji picker     |
| `QuickReactions`   | `src/components/chat/quick-reactions.tsx`   | Frequent emojis  |
| `ReactionTooltip`  | `src/components/chat/reaction-tooltip.tsx`  | Who reacted      |

### Test Requirements

```typescript
describe('Reactions', () => {
  it('should add reaction')
  it('should remove reaction')
  it('should toggle reaction')
  it('should prevent duplicate reactions')
  it('should broadcast to clients in real-time')
  it('should show reaction count')
  it('should show who reacted')
  it('should support custom emojis')
})
```

---

## Task 56: Mentions

### Requirements

Implement @mentions with notification triggering and autocomplete.

### Database Schema

```sql
CREATE TABLE nchat_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES nchat_users(id) ON DELETE CASCADE, -- NULL for @everyone/@here
  type VARCHAR(20) NOT NULL, -- user, channel, everyone, here, role
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, type)
);

CREATE INDEX idx_mentions_user_unread ON nchat_mentions(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_mentions_message ON nchat_mentions(message_id);
```

### Mention Parsing

```typescript
// backend/lib/mentions.ts
const MENTION_PATTERNS = {
  user: /@([a-zA-Z0-9_-]+)/g, // @username
  userId: /<@([A-Za-z0-9-]+)>/g, // <@user-id>
  channel: /#([a-zA-Z0-9_-]+)/g, // #channel-name
  channelId: /<#([A-Za-z0-9-]+)>/g, // <#channel-id>
  everyone: /@everyone/gi,
  here: /@here/gi,
  role: /@&([A-Za-z0-9-]+)/g, // @&role-id
}

interface ExtractedMention {
  type: 'user' | 'channel' | 'everyone' | 'here' | 'role'
  id?: string
  username?: string
  start: number
  end: number
}

function extractMentions(content: string): ExtractedMention[] {
  const mentions: ExtractedMention[] = []

  // @everyone
  for (const match of content.matchAll(MENTION_PATTERNS.everyone)) {
    mentions.push({
      type: 'everyone',
      start: match.index!,
      end: match.index! + match[0].length,
    })
  }

  // @here
  for (const match of content.matchAll(MENTION_PATTERNS.here)) {
    mentions.push({
      type: 'here',
      start: match.index!,
      end: match.index! + match[0].length,
    })
  }

  // @username
  for (const match of content.matchAll(MENTION_PATTERNS.user)) {
    mentions.push({
      type: 'user',
      username: match[1],
      start: match.index!,
      end: match.index! + match[0].length,
    })
  }

  // <@user-id>
  for (const match of content.matchAll(MENTION_PATTERNS.userId)) {
    mentions.push({
      type: 'user',
      id: match[1],
      start: match.index!,
      end: match.index! + match[0].length,
    })
  }

  return mentions
}
```

### Notification Triggering

```typescript
// backend/functions/create_mention_notifications.ts
async function createMentionNotifications(
  message: Message,
  mentions: ExtractedMention[]
): Promise<void> {
  const notifiedUserIds = new Set<string>()

  for (const mention of mentions) {
    let userIdsToNotify: string[] = []

    if (mention.type === 'everyone') {
      // Get all channel members
      const members = await db.channelMembers.find({
        channel_id: message.channel_id,
        user_id: { _neq: message.user_id },
      })
      userIdsToNotify = members.map((m) => m.user_id)
    } else if (mention.type === 'here') {
      // Get online channel members
      const members = await db.channelMembers.find({
        channel_id: message.channel_id,
        user_id: { _neq: message.user_id },
      })
      const presences = await db.userPresence.find({
        user_id: { _in: members.map((m) => m.user_id) },
        status: { _in: ['online', 'away'] },
      })
      userIdsToNotify = presences.map((p) => p.user_id)
    } else if (mention.type === 'user') {
      // Resolve username to ID if needed
      const userId = mention.id || (await resolveUsername(mention.username!))
      if (userId && userId !== message.user_id) {
        userIdsToNotify = [userId]
      }
    }

    // Create mention records and notifications
    for (const userId of userIdsToNotify) {
      if (notifiedUserIds.has(userId)) continue
      notifiedUserIds.add(userId)

      // Create mention record
      await db.mentions.insert({
        message_id: message.id,
        user_id: userId,
        type: mention.type,
      })

      // Send notification
      await notificationsPlugin.send({
        userId,
        type: 'mention',
        title: `${message.user.display_name} mentioned you`,
        body: truncate(message.content, 100),
        data: {
          messageId: message.id,
          channelId: message.channel_id,
          mentionType: mention.type,
        },
      })
    }
  }
}
```

### Autocomplete

```graphql
query SearchMentionableUsers($search: String!, $channelId: uuid!, $limit: Int = 10) {
  # Channel members first
  channel_users: nchat_channel_members(
    where: {
      channel_id: { _eq: $channelId }
      user: { _or: [{ username: { _ilike: $search } }, { display_name: { _ilike: $search } }] }
    }
    limit: $limit
  ) {
    user {
      id
      username
      display_name
      avatar_url
      presence {
        status
      }
    }
  }

  # Mentionable channels
  channels: nchat_channels(
    where: {
      _or: [{ name: { _ilike: $search } }, { slug: { _ilike: $search } }]
      is_archived: { _eq: false }
    }
    limit: 5
  ) {
    id
    name
    slug
    type
  }
}
```

### UI Components

| Component             | Path                                           | Purpose             |
| --------------------- | ---------------------------------------------- | ------------------- |
| `MentionAutocomplete` | `src/components/chat/mention-autocomplete.tsx` | User/channel picker |
| `MentionHighlight`    | `src/components/chat/mention-highlight.tsx`    | Styled @mention     |
| `MentionsList`        | `src/components/mentions/mentions-list.tsx`    | All user mentions   |

### Test Requirements

```typescript
describe('Mentions', () => {
  describe('Parsing', () => {
    it('should parse @username')
    it('should parse <@user-id>')
    it('should parse @everyone')
    it('should parse @here')
    it('should parse #channel')
  })

  describe('Notifications', () => {
    it('should notify mentioned user')
    it('should notify all members for @everyone')
    it('should notify online members for @here')
    it('should not self-notify')
    it('should deduplicate notifications')
  })

  describe('Autocomplete', () => {
    it('should search channel members')
    it('should show online status')
    it('should search channels')
    it('should prioritize recent interactions')
  })
})
```

---

## Task 57: Link Unfurling

### Requirements

Detect URLs, fetch metadata, and display rich previews with SSRF protection.

### Database Schema

```sql
CREATE TABLE nchat_link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  favicon TEXT,
  theme_color VARCHAR(7),
  video_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  fetch_status VARCHAR(20) DEFAULT 'success', -- success, failed, blocked
  error_message TEXT
);

-- Link to message
CREATE TABLE nchat_message_link_previews (
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  link_preview_id UUID NOT NULL REFERENCES nchat_link_previews(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order in message
  PRIMARY KEY (message_id, link_preview_id)
);

CREATE INDEX idx_link_previews_url ON nchat_link_previews(url);
CREATE INDEX idx_link_previews_expires ON nchat_link_previews(expires_at);
```

### SSRF Protection

```typescript
// backend/lib/ssrf-protection.ts
import { URL } from 'url'
import { isPrivateIP } from 'net'
import dns from 'dns/promises'

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254', // AWS metadata
  'metadata.azure.com',
]

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'gopher:']

async function validateUrl(urlString: string): Promise<void> {
  let url: URL

  try {
    url = new URL(urlString)
  } catch {
    throw new Error('Invalid URL')
  }

  // Check protocol
  if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
    throw new Error('Protocol not allowed')
  }

  // Check hostname
  if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) {
    throw new Error('Host not allowed')
  }

  // Resolve DNS and check for private IPs
  try {
    const addresses = await dns.resolve4(url.hostname)
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        throw new Error('Private IP not allowed')
      }
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      throw new Error('Host not found')
    }
    throw error
  }
}

async function fetchWithSsrfProtection(url: string, options: RequestInit = {}): Promise<Response> {
  await validateUrl(url)

  // Add timeout
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: 'manual', // Handle redirects manually
      headers: {
        ...options.headers,
        'User-Agent': 'nChat-LinkPreview/1.0',
      },
    })

    // Handle redirects with SSRF check
    if ([301, 302, 307, 308].includes(response.status)) {
      const redirectUrl = response.headers.get('Location')
      if (redirectUrl) {
        await validateUrl(redirectUrl)
        return fetchWithSsrfProtection(redirectUrl, options)
      }
    }

    return response
  } finally {
    clearTimeout(timeout)
  }
}
```

### Link Unfurling Service

```typescript
// backend/services/link-unfurl.ts
import * as cheerio from 'cheerio'

interface LinkPreviewData {
  title?: string
  description?: string
  imageUrl?: string
  siteName?: string
  favicon?: string
  themeColor?: string
  videoUrl?: string
  author?: string
  publishedAt?: Date
}

async function unfurlLink(url: string): Promise<LinkPreviewData> {
  // 1. Check cache first
  const cached = await db.linkPreviews.findOne({
    url,
    expires_at: { _gt: new Date() },
  })

  if (cached) {
    return cached
  }

  // 2. Fetch with SSRF protection
  const response = await fetchWithSsrfProtection(url, {
    headers: { Accept: 'text/html' },
  })

  // 3. Check content type
  const contentType = response.headers.get('Content-Type') || ''
  if (!contentType.includes('text/html')) {
    throw new Error('Not an HTML page')
  }

  // 4. Parse HTML
  const html = await response.text()
  const $ = cheerio.load(html)

  // 5. Extract metadata (Open Graph, Twitter Cards, standard meta)
  const preview: LinkPreviewData = {
    title:
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      undefined,

    description:
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      undefined,

    imageUrl:
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      undefined,

    siteName: $('meta[property="og:site_name"]').attr('content') || undefined,

    favicon:
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      '/favicon.ico',

    themeColor: $('meta[name="theme-color"]').attr('content') || undefined,

    videoUrl:
      $('meta[property="og:video"]').attr('content') ||
      $('meta[property="og:video:url"]').attr('content') ||
      undefined,

    author:
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      undefined,

    publishedAt: parseDate($('meta[property="article:published_time"]').attr('content')),
  }

  // 6. Resolve relative URLs
  const baseUrl = new URL(url)
  if (preview.imageUrl && !preview.imageUrl.startsWith('http')) {
    preview.imageUrl = new URL(preview.imageUrl, baseUrl).toString()
  }
  if (preview.favicon && !preview.favicon.startsWith('http')) {
    preview.favicon = new URL(preview.favicon, baseUrl).toString()
  }

  // 7. Cache result
  await db.linkPreviews.upsert({
    url,
    ...preview,
    fetched_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    fetch_status: 'success',
  })

  return preview
}
```

### UI Components

| Component           | Path                                          | Purpose             |
| ------------------- | --------------------------------------------- | ------------------- |
| `LinkPreview`       | `src/components/chat/link-preview.tsx`        | Rich preview card   |
| `LinkPreviewLoader` | `src/components/chat/link-preview-loader.tsx` | Loading skeleton    |
| `VideoEmbed`        | `src/components/chat/video-embed.tsx`         | YouTube/Vimeo embed |

### Test Requirements

```typescript
describe('Link Unfurling', () => {
  describe('SSRF Protection', () => {
    it('should block localhost')
    it('should block private IPs')
    it('should block internal metadata endpoints')
    it('should block file:// protocol')
    it('should validate redirect targets')
    it('should timeout slow requests')
  })

  describe('Metadata Extraction', () => {
    it('should extract Open Graph tags')
    it('should extract Twitter Cards')
    it('should fall back to standard meta tags')
    it('should resolve relative URLs')
    it('should handle missing metadata gracefully')
  })

  describe('Caching', () => {
    it('should cache results')
    it('should respect cache expiration')
    it('should handle cache misses')
  })
})
```

---

## Task 58: Markdown Sanitization

### Requirements

Server-side sanitization of markdown content to prevent XSS while allowing rich formatting.

### Implementation

````typescript
// backend/lib/markdown-sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import hljs from 'highlight.js'

// Configure marked for security
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch {
        // Ignore errors
      }
    }
    return code
  },
})

// DOMPurify configuration
const PURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Block elements
    'p',
    'br',
    'hr',
    // Headings
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Text formatting
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'ins',
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'mark',
    'small',
    'sub',
    'sup',
    // Lists
    'ul',
    'ol',
    'li',
    // Quotes
    'blockquote',
    'q',
    'cite',
    // Links (will sanitize href)
    'a',
    // Tables
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    // Other
    'details',
    'summary',
    'span',
    'div',
  ],
  ALLOWED_ATTR: [
    'href',
    'title',
    'alt',
    'class', // For syntax highlighting
    'target',
    'rel', // For links
    'colspan',
    'rowspan', // For tables
    'align',
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  // Transform hooks
  ADD_ATTR: ['target'],
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
}

// Add hooks for link sanitization
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // Force links to open in new tab safely
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')

    // Validate href
    const href = node.getAttribute('href')
    if (href) {
      // Block javascript: URLs
      if (href.toLowerCase().startsWith('javascript:')) {
        node.setAttribute('href', '#')
      }
      // Block data: URLs (except images)
      if (href.toLowerCase().startsWith('data:') && !href.toLowerCase().startsWith('data:image/')) {
        node.setAttribute('href', '#')
      }
    }
  }
})

/**
 * Sanitize raw markdown content (before rendering)
 */
export function sanitizeMarkdown(content: string): string {
  // Remove any HTML that might be in the markdown
  let sanitized = content

  // Escape HTML entities in non-code contexts
  // (preserve code blocks and inline code)
  const codeBlocks: string[] = []
  const inlineCode: string[] = []

  // Extract code blocks
  sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  // Extract inline code
  sanitized = sanitized.replace(/`[^`]+`/g, (match) => {
    inlineCode.push(match)
    return `__INLINE_CODE_${inlineCode.length - 1}__`
  })

  // Escape HTML in remaining content
  sanitized = sanitized.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    sanitized = sanitized.replace(`__CODE_BLOCK_${i}__`, block)
  })

  // Restore inline code
  inlineCode.forEach((code, i) => {
    sanitized = sanitized.replace(`__INLINE_CODE_${i}__`, code)
  })

  return sanitized
}

/**
 * Render markdown to sanitized HTML
 */
export function renderMarkdown(content: string): string {
  // First sanitize the markdown source
  const sanitizedMarkdown = sanitizeMarkdown(content)

  // Render to HTML
  const html = marked.parse(sanitizedMarkdown)

  // Sanitize the rendered HTML
  const sanitizedHtml = DOMPurify.sanitize(html, PURIFY_CONFIG)

  return sanitizedHtml
}

/**
 * Strip all formatting from content (plain text)
 */
export function stripFormatting(content: string): string {
  const html = renderMarkdown(content)
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
}
````

### Allowed Formatting

| Format        | Markdown                 | Result                     |
| ------------- | ------------------------ | -------------------------- |
| Bold          | `**text**` or `__text__` | **text**                   |
| Italic        | `*text*` or `_text_`     | _text_                     |
| Strikethrough | `~~text~~`               | ~~text~~                   |
| Code          | `` `code` ``             | `code`                     |
| Code block    | ` ```lang ... ``` `      | Syntax highlighted         |
| Link          | `[text](url)`            | [text](url)                |
| Quote         | `> quote`                | Blockquote                 |
| List          | `- item` or `1. item`    | List                       |
| Heading       | `# text`                 | Heading (disabled in chat) |

### Test Requirements

```typescript
describe('Markdown Sanitization', () => {
  describe('XSS Prevention', () => {
    it('should remove script tags')
    it('should remove onclick handlers')
    it('should remove javascript: URLs')
    it('should remove dangerous data: URLs')
    it('should handle nested XSS attempts')
    it('should sanitize malformed HTML')
  })

  describe('Allowed Formatting', () => {
    it('should render bold')
    it('should render italic')
    it('should render code blocks')
    it('should syntax highlight code')
    it('should render links with noopener')
    it('should render blockquotes')
    it('should render lists')
  })

  describe('Edge Cases', () => {
    it('should handle empty content')
    it('should handle very long content')
    it('should preserve whitespace in code')
    it('should handle unicode')
    it('should handle RTL text')
  })
})
```

---

## Task 59: Attachments

### Requirements

Implement file upload with MinIO storage, access control, and file-processing plugin integration.

### Database Schema

```sql
CREATE TABLE nchat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,

  -- File info
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,

  -- Storage
  storage_key TEXT NOT NULL, -- MinIO object key
  bucket TEXT DEFAULT 'attachments',

  -- Media metadata
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For audio/video

  -- Processing status
  processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, complete, failed
  processing_error TEXT,

  -- Security
  virus_scan_status VARCHAR(20) DEFAULT 'pending', -- pending, clean, infected, error
  virus_scan_result TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON nchat_attachments(message_id);
CREATE INDEX idx_attachments_processing ON nchat_attachments(processing_status);
```

### Upload Flow

```typescript
// backend/functions/upload_attachment.ts
import { fileProcessingPlugin } from '@nself/plugins/file-processing'
import { minioClient } from '@nself/storage'

interface UploadInput {
  channelId: string
  userId: string
  fileName: string
  fileType: string
  fileSize: number
}

interface PresignedUploadResponse {
  uploadUrl: string
  fileKey: string
  expiresAt: Date
}

// Step 1: Get presigned upload URL
async function requestUploadUrl(input: UploadInput): Promise<PresignedUploadResponse> {
  // 1. Validate file type and size
  validateFileUpload(input)

  // 2. Check user permission
  await checkChannelMembership(input.channelId, input.userId)

  // 3. Check storage quota
  await checkStorageQuota(input.userId, input.fileSize)

  // 4. Generate storage key
  const fileKey = `channels/${input.channelId}/${Date.now()}-${sanitizeFileName(input.fileName)}`

  // 5. Get presigned URL from MinIO
  const uploadUrl = await minioClient.presignedPutObject(
    'attachments',
    fileKey,
    3600 // 1 hour expiry
  )

  return {
    uploadUrl,
    fileKey,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  }
}

// Step 2: Confirm upload and process file
async function confirmUpload(
  messageId: string,
  fileKey: string,
  metadata?: Record<string, unknown>
): Promise<Attachment> {
  // 1. Verify file exists in storage
  const stat = await minioClient.statObject('attachments', fileKey)

  // 2. Create attachment record
  const attachment = await db.attachments.insert({
    message_id: messageId,
    file_name: extractFileName(fileKey),
    file_type: stat.metaData['content-type'],
    file_size: stat.size,
    file_url: `${STORAGE_URL}/${fileKey}`,
    storage_key: fileKey,
    metadata,
    processing_status: 'pending',
    virus_scan_status: 'pending',
  })

  // 3. Queue file processing
  await fileProcessingPlugin.process({
    attachmentId: attachment.id,
    fileKey,
    tasks: ['virus_scan', 'strip_exif', 'generate_thumbnail', 'optimize'],
  })

  return attachment
}

// File validation
function validateFileUpload(input: UploadInput): void {
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]

  if (input.fileSize > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  if (!ALLOWED_TYPES.includes(input.fileType)) {
    throw new Error('File type not allowed')
  }
}
```

### File Processing Integration

```typescript
// backend/handlers/file-processing.ts
import { fileProcessingPlugin } from '@nself/plugins/file-processing'

fileProcessingPlugin.on('processing:complete', async (result) => {
  const { attachmentId, tasks } = result

  const updates: Partial<Attachment> = {
    processing_status: 'complete',
  }

  // Update with processing results
  if (tasks.thumbnail) {
    updates.thumbnail_url = tasks.thumbnail.url
  }

  if (tasks.dimensions) {
    updates.width = tasks.dimensions.width
    updates.height = tasks.dimensions.height
  }

  if (tasks.duration) {
    updates.duration = tasks.duration.seconds
  }

  if (tasks.virus_scan) {
    updates.virus_scan_status = tasks.virus_scan.clean ? 'clean' : 'infected'
    updates.virus_scan_result = tasks.virus_scan.result

    // If infected, delete the file
    if (!tasks.virus_scan.clean) {
      await deleteInfectedFile(attachmentId)
      return
    }
  }

  await db.attachments.update(attachmentId, updates)
})

fileProcessingPlugin.on('processing:error', async (error) => {
  await db.attachments.update(error.attachmentId, {
    processing_status: 'failed',
    processing_error: error.message,
  })
})
```

### Access Control

```typescript
// backend/middleware/attachment-access.ts
async function checkAttachmentAccess(attachmentId: string, userId: string): Promise<boolean> {
  const attachment = await db.attachments.findById(attachmentId)
  const message = await db.messages.findById(attachment.message_id)

  // Check if user has access to the channel
  const membership = await db.channelMembers.findOne({
    channel_id: message.channel_id,
    user_id: userId,
  })

  if (!membership) {
    // Check if channel is public
    const channel = await db.channels.findById(message.channel_id)
    return !channel.is_private
  }

  return true
}

// Generate signed URL for access
async function getSignedUrl(attachmentId: string, userId: string): Promise<string> {
  const hasAccess = await checkAttachmentAccess(attachmentId, userId)
  if (!hasAccess) {
    throw new Error('Access denied')
  }

  const attachment = await db.attachments.findById(attachmentId)

  return minioClient.presignedGetObject(
    attachment.bucket,
    attachment.storage_key,
    300 // 5 minute expiry
  )
}
```

### UI Components

| Component            | Path                                          | Purpose            |
| -------------------- | --------------------------------------------- | ------------------ |
| `FileUpload`         | `src/components/upload/file-upload.tsx`       | Drag & drop upload |
| `UploadProgress`     | `src/components/upload/upload-progress.tsx`   | Progress indicator |
| `MessageAttachments` | `src/components/chat/message-attachments.tsx` | Attachment display |
| `ImageGallery`       | `src/components/media/image-gallery.tsx`      | Image viewer       |
| `VideoPlayer`        | `src/components/media/video-player.tsx`       | Video playback     |
| `AudioPlayer`        | `src/components/media/audio-player.tsx`       | Audio playback     |
| `FilePreview`        | `src/components/media/file-preview.tsx`       | Document preview   |

### Test Requirements

```typescript
describe('Attachments', () => {
  describe('Upload', () => {
    it('should validate file type')
    it('should validate file size')
    it('should check storage quota')
    it('should generate presigned URL')
    it('should handle upload completion')
  })

  describe('Processing', () => {
    it('should scan for viruses')
    it('should strip EXIF data')
    it('should generate thumbnails')
    it('should extract dimensions')
    it('should handle processing errors')
  })

  describe('Access Control', () => {
    it('should check channel membership')
    it('should allow public channel access')
    it('should generate signed URLs')
    it('should expire access tokens')
  })
})
```

---

## Cross-Cutting Concerns

### Feature Flags

All messaging features must respect feature flags from AppConfig:

```typescript
interface MessagingFeatureFlags {
  threads: boolean
  reactions: boolean
  mentions: boolean
  forwarding: boolean
  scheduling: boolean
  disappearing: boolean
  linkPreviews: boolean
  fileUploads: boolean
  voiceMessages: boolean
  messageEdit: boolean
  messageEditHistory: boolean
  pinning: boolean
  bookmarking: boolean
}
```

### Rate Limiting

```typescript
const RATE_LIMITS = {
  sendMessage: { window: '1m', max: 30 },
  editMessage: { window: '1m', max: 20 },
  addReaction: { window: '1m', max: 60 },
  uploadFile: { window: '1h', max: 100, maxSizeMB: 500 },
  createThread: { window: '1h', max: 50 },
  forwardMessage: { window: '1m', max: 10 },
}
```

### Audit Logging

All message operations must be logged:

```typescript
interface AuditLogEntry {
  timestamp: Date
  userId: string
  action: string
  resourceType: 'message' | 'thread' | 'reaction' | 'attachment'
  resourceId: string
  channelId: string
  metadata: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}
```

---

## Testing Strategy

### Test Pyramid

```
                    /\
                   /  \  E2E Tests (10%)
                  /----\  - User journeys
                 /      \  - Cross-feature flows
                /--------\
               /  Integ.  \  Integration Tests (30%)
              /   Tests    \  - API endpoints
             /              \  - Database operations
            /----------------\
           /    Unit Tests    \  Unit Tests (60%)
          /                    \  - Functions
         /                      \  - Components
        /--------------------------\
```

### Test Coverage Requirements

| Area              | Coverage Target |
| ----------------- | --------------- |
| GraphQL Mutations | 100%            |
| GraphQL Queries   | 100%            |
| Backend Functions | 100%            |
| RLS Policies      | 100%            |
| UI Components     | 90%             |
| Hooks             | 100%            |

### E2E Test Scenarios

```typescript
// e2e/messaging.spec.ts
describe('Core Messaging E2E', () => {
  test('Send and receive message in channel', async () => {
    // Login as user A
    // Navigate to channel
    // Send message
    // Verify message appears
    // Login as user B
    // Verify message visible
  })

  test('Create thread and reply', async () => {
    // Send message
    // Start thread
    // Add reply
    // Verify thread count
    // Verify notification
  })

  test('Full reaction workflow', async () => {
    // Send message
    // Add reaction
    // Verify reaction visible to others
    // Remove reaction
    // Verify removal
  })

  // ... more scenarios
})
```

---

## Parity Matrix

| Feature             | WhatsApp | Telegram | Slack | Discord | nChat        |
| ------------------- | -------- | -------- | ----- | ------- | ------------ |
| Text messages       | Yes      | Yes      | Yes   | Yes     | Implementing |
| Message edit        | No       | Yes      | Yes   | Yes     | Implementing |
| Edit history        | N/A      | Yes      | No    | No      | Implementing |
| Delete for everyone | Yes      | Yes      | Yes   | Yes     | Implementing |
| Threads             | No       | Yes      | Yes   | Yes     | Implementing |
| Reactions           | Yes      | Yes      | Yes   | Yes     | Implementing |
| @mentions           | Yes      | Yes      | Yes   | Yes     | Implementing |
| @everyone           | No       | No       | Yes   | Yes     | Implementing |
| Forwarding          | Yes      | Yes      | Yes   | No      | Implementing |
| Quoting             | Yes      | Yes      | Yes   | Yes     | Implementing |
| Pinning             | Yes      | Yes      | Yes   | Yes     | Implementing |
| Bookmarks           | Yes      | Yes      | Yes   | Yes     | Implementing |
| Scheduled           | No       | Yes      | Yes   | No      | Implementing |
| Disappearing        | Yes      | Yes      | No    | No      | Implementing |
| Link previews       | Yes      | Yes      | Yes   | Yes     | Implementing |
| File uploads        | Yes      | Yes      | Yes   | Yes     | Implementing |
| Voice messages      | Yes      | Yes      | No    | No      | Future       |

---

## Implementation Order

### Phase 1: Foundation (Week 1-2)

1. Task 48: Message CRUD (base for everything)
2. Task 58: Markdown Sanitization (needed for all content)
3. Task 56: Mentions (core feature)

### Phase 2: Interactions (Week 3-4)

4. Task 55: Reactions
5. Task 49: Threads and Replies
6. Task 50: Message Edit History

### Phase 3: Organization (Week 5-6)

7. Task 51: Pinning and Bookmarking
8. Task 52: Forwarding and Quoting
9. Task 57: Link Unfurling

### Phase 4: Advanced (Week 7-8)

10. Task 59: Attachments
11. Task 53: Scheduled Messages
12. Task 54: Disappearing Messages

---

## Dependencies

### External Packages

```json
{
  "marked": "^12.0.0",
  "isomorphic-dompurify": "^2.0.0",
  "highlight.js": "^11.9.0",
  "cheerio": "^1.0.0",
  "date-fns-tz": "^2.0.0",
  "minio": "^7.1.0"
}
```

### nself Plugins Required

- `@nself/plugins/realtime` - Real-time message delivery
- `@nself/plugins/notifications` - Push/email notifications
- `@nself/plugins/jobs` - Scheduled messages, cleanup
- `@nself/plugins/file-processing` - Thumbnail, virus scan

---

## Success Criteria

1. All 12 messaging features fully implemented and tested
2. 100% test coverage for backend functions
3. Real-time sync working across all clients
4. RBAC enforced for all operations
5. Feature flags working correctly
6. Audit logging for all modifications
7. Performance benchmarks met:
   - Message send: < 100ms
   - Message list load: < 500ms
   - Real-time delivery: < 200ms
8. Zero known security vulnerabilities
9. Documentation updated and complete
