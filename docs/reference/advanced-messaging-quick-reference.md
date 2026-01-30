# Advanced Messaging Features - Quick Reference

**Version:** nself-chat v0.3.0
**For:** Developers integrating advanced messaging features

---

## Quick Start

### 1. Import the Hook

```typescript
import { useMessageMutations } from '@/hooks/use-messages'

function MyComponent() {
  const {
    updateMessage,
    deleteMessage,
    forwardMessage,
    pinMessage,
    starMessage,
    markMessageRead,
    startTyping,
    stopTyping,
  } = useMessageMutations()

  // Use the functions...
}
```

---

## Common Use Cases

### Edit a Message

```typescript
// User clicks "Edit" button
const handleEdit = async (messageId: string, newContent: string) => {
  try {
    await updateMessage(messageId, {
      content: newContent,
      mentions: extractMentions(newContent), // Helper function
    })
    // Success toast shown automatically
  } catch (error) {
    // Error toast shown automatically
  }
}
```

**Database side-effect:** Automatically records edit in `nchat_message_edit_history` via trigger.

---

### Delete a Message (Soft Delete)

```typescript
// User clicks "Delete" button
const handleDelete = async (messageId: string) => {
  const confirmed = await showConfirmDialog('Delete this message?')
  if (!confirmed) return

  try {
    await deleteMessage(messageId, true) // true = soft delete
    // Message content becomes "[deleted]"
    // is_deleted flag set to true
  } catch (error) {
    // Error handled
  }
}
```

---

### Forward a Message

```typescript
import { MessageForwardModal } from '@/components/chat/message-forward-modal'

function MyComponent() {
  const [forwardModalOpen, setForwardModalOpen] = useState(false)
  const [messageToForward, setMessageToForward] = useState(null)

  const handleForward = async (
    messages,
    destinations,
    mode,
    comment
  ) => {
    for (const dest of destinations) {
      await forwardMessage({
        messageId: messages[0].id,
        targetChannelId: dest.id,
        content: formatForwardedMessage(messages[0], mode, comment),
      })
    }
  }

  return (
    <>
      <Button onClick={() => {
        setMessageToForward(message)
        setForwardModalOpen(true)
      }}>
        Forward
      </Button>

      <MessageForwardModal
        isOpen={forwardModalOpen}
        onClose={() => setForwardModalOpen(false)}
        messages={[messageToForward]}
        availableDestinations={channels}
        onForward={handleForward}
      />
    </>
  )
}
```

---

### Pin a Message

```typescript
// User clicks "Pin" button (moderators only)
const handlePin = async (messageId: string, channelId: string) => {
  try {
    await pinMessage(messageId, channelId)
    // Success toast: "Message pinned to channel"
  } catch (error) {
    // Error toast shown
  }
}

// Unpin
const handleUnpin = async (messageId: string, channelId: string) => {
  await unpinMessage(messageId, channelId)
  // Success toast: "Message unpinned"
}
```

---

### Star/Save a Message

```typescript
// User clicks "Bookmark" button
const handleStar = async (messageId: string) => {
  try {
    await starMessage(messageId)
    // No toast (silent operation)
    // Update UI to show filled star icon
  } catch (error) {
    // Error logged
  }
}

// Unstar
const handleUnstar = async (messageId: string) => {
  await unstarMessage(messageId)
  // Update UI to show empty star icon
}
```

---

### Mark Message as Read

```typescript
// When message enters viewport
import { useInView } from 'react-intersection-observer'

function MessageItem({ message }) {
  const { ref, inView } = useInView({ threshold: 0.5 })
  const { markMessageRead } = useMessageMutations()

  useEffect(() => {
    if (inView && !message.isRead) {
      markMessageRead(message.id)
    }
  }, [inView, message.id, message.isRead])

  return <div ref={ref}>{/* message content */}</div>
}
```

---

### Typing Indicators

```typescript
function MessageInput({ channelId }) {
  const { startTyping, stopTyping } = useMessageMutations()
  const [content, setContent] = useState('')
  const typingTimeoutRef = useRef(null)

  const handleTyping = (e) => {
    setContent(e.target.value)

    // Start typing indicator
    startTyping(channelId)

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId)
    }, 3000)
  }

  const handleBlur = () => {
    stopTyping(channelId)
  }

  return (
    <input
      value={content}
      onChange={handleTyping}
      onBlur={handleBlur}
    />
  )
}
```

---

### View Edit History

```typescript
import { MessageEditHistory } from '@/components/chat/message-edit-history'
import { useQuery } from '@apollo/client'
import { GET_MESSAGE_EDIT_HISTORY } from '@/graphql/queries/messages'

function MessageWithHistory({ message }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data, loading, error } = useQuery(GET_MESSAGE_EDIT_HISTORY, {
    variables: { messageId: message.id },
    skip: !historyOpen,
  })

  return (
    <>
      {message.isEdited && (
        <button
          onClick={() => setHistoryOpen(true)}
          className="text-xs text-muted-foreground"
        >
          (edited)
        </button>
      )}

      <MessageEditHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={data?.message_edit_history || []}
        currentContent={message.content}
        author={message.user}
        isLoading={loading}
        error={error?.message}
      />
    </>
  )
}
```

---

## Permission Checking

```typescript
import { getMessagePermissions } from '@/components/chat/message-actions'

function MessageItem({ message, currentUser }) {
  const isOwnMessage = message.userId === currentUser.id
  const permissions = getMessagePermissions(isOwnMessage, currentUser.role)

  return (
    <div>
      {permissions.canEdit && <EditButton />}
      {permissions.canDelete && <DeleteButton />}
      {permissions.canPin && <PinButton />}
      {permissions.canForward && <ForwardButton />}
      {permissions.canReact && <ReactionPicker />}
    </div>
  )
}
```

**Permissions object:**
```typescript
{
  canEdit: boolean        // Own messages only
  canDelete: boolean      // Own or moderator+
  canPin: boolean         // Moderator+ only
  canReact: boolean       // Non-guests
  canReply: boolean       // Non-guests
  canThread: boolean      // Non-guests
  canBookmark: boolean    // Non-guests (use starMessage)
  canForward: boolean     // Non-guests
  canReport: boolean      // Others' messages, non-guests
  canCopy: boolean        // Everyone
  canMarkUnread: boolean  // Non-guests
}
```

---

## GraphQL Queries

### Get Message with Edit Info

```typescript
import { useQuery } from '@apollo/client'
import { gql } from '@apollo/client'

const GET_MESSAGE_DETAIL = gql`
  query GetMessageDetail($messageId: uuid!) {
    nchat_message_by_pk(id: $messageId) {
      id
      content
      is_edited
      edit_count
      last_edited_at
      is_deleted
      deleted_at
      deleted_by
      forwarded_from

      user {
        id
        display_name
        avatar_url
      }

      edit_history: message_edit_history(order_by: { edited_at: desc }) {
        id
        old_content
        new_content
        edited_at
        user {
          id
          display_name
          avatar_url
        }
      }

      starred_by: starred_messages {
        user_id
        starred_at
        note
      }

      read_by: message_read_receipts {
        user_id
        read_at
        user {
          id
          display_name
          avatar_url
        }
      }

      pinned_in: pinned_messages {
        channel_id
        pinned_by
        pinned_at
      }
    }
  }
`

function MessageDetail({ messageId }) {
  const { data, loading } = useQuery(GET_MESSAGE_DETAIL, {
    variables: { messageId },
  })

  if (loading) return <Spinner />

  const message = data.nchat_message_by_pk

  return (
    <div>
      <MessageContent content={message.content} />
      {message.is_edited && (
        <EditBadge count={message.edit_count} />
      )}
      {message.starred_by.length > 0 && (
        <StarCount count={message.starred_by.length} />
      )}
      {message.read_by.length > 0 && (
        <ReadReceipts users={message.read_by} />
      )}
    </div>
  )
}
```

---

## Database Queries (SQL)

### Get User's Starred Messages

```sql
SELECT * FROM nchat.get_user_starred_messages(
  'user-id-here'::uuid,
  50,  -- limit
  0    -- offset
);
```

### Get Message Edit History

```sql
SELECT * FROM nchat.get_message_edit_history(
  'message-id-here'::uuid
);
```

### Check if User Can Edit

```sql
SELECT nchat.can_edit_message(
  'user-id-here'::uuid,
  'message-id-here'::uuid
);
```

---

## Real-Time Updates

### Subscribe to Message Changes

```typescript
import { useSubscription } from '@apollo/client'

const MESSAGE_UPDATED_SUBSCRIPTION = gql`
  subscription MessageUpdated($messageId: uuid!) {
    nchat_message_by_pk(id: $messageId) {
      id
      content
      is_edited
      is_deleted
      edit_count
      last_edited_at
      deleted_at
    }
  }
`

function LiveMessage({ messageId }) {
  const { data } = useSubscription(MESSAGE_UPDATED_SUBSCRIPTION, {
    variables: { messageId },
  })

  const message = data?.nchat_message_by_pk

  return (
    <div>
      {message.is_deleted ? (
        <DeletedPlaceholder />
      ) : (
        <>
          <MessageContent content={message.content} />
          {message.is_edited && <EditBadge />}
        </>
      )}
    </div>
  )
}
```

---

## Styling Components

### Message with Edit Indicator

```typescript
function MessageItem({ message }) {
  return (
    <div className="group relative rounded-lg p-3 hover:bg-muted/50">
      {/* Message content */}
      <MessageContent content={message.content} />

      {/* Edit indicator */}
      {message.isEdited && (
        <span className="ml-1 text-xs text-muted-foreground">
          (edited)
        </span>
      )}

      {/* Hover actions */}
      <div className="absolute right-2 top-2 hidden group-hover:block">
        <MessageActions messageId={message.id} />
      </div>
    </div>
  )
}
```

### Deleted Message Placeholder

```typescript
function MessageItem({ message }) {
  if (message.isDeleted) {
    return (
      <div className="rounded-lg p-3 opacity-60">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trash2 className="h-4 w-4" />
          <span className="italic">Message deleted</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDate(message.deletedAt)}
        </div>
      </div>
    )
  }

  return <div>{/* Normal message */}</div>
}
```

---

## Error Handling

All mutations automatically:
- ✅ Show toast notifications on success/error
- ✅ Log errors to console (dev) and Sentry (prod)
- ✅ Return error objects for custom handling

```typescript
const { updateMessage } = useMessageMutations()

try {
  await updateMessage(messageId, { content: newContent })
  // Success toast shown automatically
} catch (error) {
  // Error toast shown automatically
  // Optional: Custom error handling
  if (error.message.includes('permission')) {
    showPermissionDeniedDialog()
  }
}
```

---

## Testing

### Unit Test Example

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMessageMutations } from '@/hooks/use-messages'

describe('useMessageMutations', () => {
  it('should update message', async () => {
    const { result } = renderHook(() => useMessageMutations())

    await act(async () => {
      await result.current.updateMessage('msg-123', {
        content: 'Updated content',
      })
    })

    expect(result.current.updatingMessage).toBe(false)
    // Verify mutation was called
  })

  it('should handle edit permissions', async () => {
    // Mock user without edit permission
    const { result } = renderHook(() => useMessageMutations())

    await expect(
      result.current.updateMessage('other-user-message', {
        content: 'Hacked',
      })
    ).rejects.toThrow('Permission denied')
  })
})
```

### E2E Test Example

```typescript
// e2e/advanced-messaging.spec.ts
import { test, expect } from '@playwright/test'

test('should edit and view message history', async ({ page }) => {
  await page.goto('/chat/general')

  // Send a message
  await page.fill('[data-testid="message-input"]', 'Original message')
  await page.click('[data-testid="send-button"]')

  // Edit the message
  await page.hover('[data-testid="message-1"]')
  await page.click('[data-testid="edit-button"]')
  await page.fill('[data-testid="edit-input"]', 'Edited message')
  await page.click('[data-testid="save-edit"]')

  // Verify edit indicator
  await expect(page.locator('text="(edited)"')).toBeVisible()

  // View history
  await page.click('text="(edited)"')
  await expect(page.locator('[data-testid="edit-history-modal"]')).toBeVisible()
  await expect(page.locator('text="Original message"')).toBeVisible()
  await expect(page.locator('text="Edited message"')).toBeVisible()
})
```

---

## Performance Tips

### 1. Debounce Typing Indicators

```typescript
import { useDebouncedCallback } from 'use-debounce'

const debouncedStartTyping = useDebouncedCallback(
  (channelId) => startTyping(channelId),
  500 // Wait 500ms before sending
)
```

### 2. Batch Read Receipts

```typescript
// Instead of marking each message individually
const markChannelRead = async (channelId: string, lastMessageId: string) => {
  // Use channel-level read receipt
  await updateChannelReadReceipt(channelId, lastMessageId)
}
```

### 3. Virtualize Message List

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function MessageList({ messages }) {
  const parentRef = useRef(null)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <MessageItem
          key={messages[virtualRow.index].id}
          message={messages[virtualRow.index]}
        />
      ))}
    </div>
  )
}
```

---

## Troubleshooting

### Issue: Edit history not showing

**Check:**
1. Is `is_edited` flag true?
2. Does `nchat_message_edit_history` table have rows?
3. Is the trigger `record_message_edit` active?

```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'message_edit_history_trigger';

-- Check edit history
SELECT * FROM nchat.nchat_message_edit_history
WHERE message_id = 'your-message-id';
```

### Issue: Typing indicator not appearing

**Check:**
1. Is WebSocket connected?
2. Is `nchat_typing_indicator` table being updated?
3. Has the indicator expired (TTL)?

```sql
-- Check active typing indicators
SELECT * FROM nchat.nchat_typing_indicator
WHERE channel_id = 'your-channel-id'
  AND expires_at > NOW();
```

### Issue: Read receipts not updating

**Check:**
1. Is user authenticated?
2. Is `nchat_message_read_receipt` table receiving inserts?
3. Are permissions set correctly in Hasura?

```sql
-- Check read receipts
SELECT * FROM nchat.nchat_message_read_receipt
WHERE message_id = 'your-message-id';
```

---

## Additional Resources

- **Full Implementation Doc:** `/Users/admin/Sites/nself-chat/docs/advanced-messaging-implementation-summary.md`
- **Database Migration:** `/Users/admin/Sites/nself-chat/.backend/migrations/012_advanced_messaging_features.sql`
- **GraphQL Mutations:** `/Users/admin/Sites/nself-chat/src/graphql/mutations/messages.ts`
- **React Hook:** `/Users/admin/Sites/nself-chat/src/hooks/use-messages.ts`
- **UI Components:** `/Users/admin/Sites/nself-chat/src/components/chat/`

---

**Last Updated:** January 30, 2026
**Version:** v0.3.0
