# Message Actions & Context Menu - Usage Guide

Complete guide for using the message actions and context menu system in nself-chat.

## Overview

The message actions system provides three main components:

1. **MessageActions** - Hover action bar with quick actions
2. **MessageContextMenu** - Right-click context menu with full action list
3. **useMessageActions** - Hook for handling all message actions

## Features

### Message Hover Actions

- ✅ Quick reactions (emoji picker)
- ✅ Reply
- ✅ Thread
- ✅ Share
- ✅ More menu (...)

### Context Menu (Right-Click)

- ✅ Copy text
- ✅ Copy link
- ✅ Edit message (if own)
- ✅ Delete message (if own/admin)
- ✅ Pin message
- ✅ Star/bookmark
- ✅ Forward message
- ✅ Report message
- ✅ Mark unread
- ✅ Remind me
- ✅ Start thread
- ✅ View message details
- ✅ View edit history
- ✅ View reactions

### Bulk Operations

- ✅ Select multiple messages
- ✅ Bulk delete
- ✅ Bulk forward
- ✅ Copy multiple

## Quick Start

### Basic Usage

```tsx
import { useState } from 'react'
import { MessageItem, MessageActions, MessageContextMenu } from '@/components/chat'
import { useMessageActions } from '@/hooks'

function MessageList({ channelId, messages }) {
  const { handlers, bulkHandlers, selection, handleAction, getPermissions } = useMessageActions({
    channelId,
    onReplyMessage: (message) => {
      // Handle reply
      console.log('Reply to:', message)
    },
    onOpenThread: (message) => {
      // Handle thread
      console.log('Open thread:', message)
    },
    onEditMessage: (message) => {
      // Handle edit
      console.log('Edit:', message)
    },
    onDeleteMessage: async (messageId) => {
      // Handle delete
      await deleteMessageMutation({ variables: { id: messageId } })
    },
  })

  return (
    <div>
      {messages.map((message) => {
        const permissions = getPermissions(message)

        return (
          <MessageContextMenu
            key={message.id}
            message={message}
            permissions={permissions}
            onAction={(action, data) => handleAction(action, message, data)}
          >
            <div className="relative">
              <MessageItem message={message} />

              {/* Show on hover */}
              <MessageActions
                message={message}
                permissions={permissions}
                onAction={(action, data) => handleAction(action, message, data)}
              />
            </div>
          </MessageContextMenu>
        )
      })}
    </div>
  )
}
```

## Components

### MessageActions

Hover action bar that appears on message hover.

```tsx
<MessageActions
  message={message}
  permissions={permissions}
  onAction={(action, data) => handleAction(action, message, data)}
  position="right" // 'left' | 'right'
  variant="default" // 'default' | 'compact' | 'mobile'
/>
```

**Variants:**

- `default` - Full hover bar with all actions
- `compact` - Smaller inline actions
- `mobile` - Mobile floating action sheet

**Actions:**

- React (opens emoji picker)
- Reply
- Thread
- Share
- More menu

### MessageContextMenu

Right-click context menu with comprehensive actions.

```tsx
<MessageContextMenu
  message={message}
  permissions={permissions}
  onAction={(action, data) => handleAction(action, message, data)}
  showAdvanced={true} // Show advanced options
  onEnterSelectionMode={() => selection.enterSelectionMode()}
  isSelected={selection.selectedMessages.has(message.id)}
>
  {children}
</MessageContextMenu>
```

**Menu Structure:**

1. Quick reactions (row of emoji buttons)
2. Copy text/link
3. Reply/Thread
4. Add reaction (submenu with categories)
5. Edit/Pin/Bookmark/Forward
6. Share submenu
7. Mark unread/Remind me
8. Message info submenu
9. Report/Delete

### SimpleMessageContextMenu

Simplified context menu for compact views.

```tsx
<SimpleMessageContextMenu
  message={message}
  permissions={permissions}
  onAction={(action, data) => handleAction(action, message, data)}
>
  {children}
</SimpleMessageContextMenu>
```

## Hook API

### useMessageActions

Main hook for managing message actions.

```tsx
const {
  handlers, // Individual action handlers
  bulkHandlers, // Bulk operation handlers
  selection, // Selection state
  handleAction, // Main action dispatcher
  canPerformAction, // Permission checker
  getPermissions, // Get message permissions
  isLoading, // Loading state
} = useMessageActions({
  channelId: 'channel-123',
  onReplyMessage: (message) => {},
  onOpenThread: (message) => {},
  onEditMessage: (message) => {},
  onDeleteMessage: async (id) => {},
  onForwardMessage: (message) => {},
  onReportMessage: (message) => {},
  onViewMessageDetails: (message) => {},
  enableBulkOperations: true,
})
```

### Handlers

Individual action handlers:

```tsx
// React/unreact
await handlers.onReact(messageId, '👍')
await handlers.onRemoveReaction(messageId, '👍')

// Navigation
handlers.onReply(message)
handlers.onThread(message)
handlers.onEdit(message)

// State changes
await handlers.onPin(messageId)
await handlers.onUnpin(messageId)
await handlers.onBookmark(messageId)
await handlers.onUnbookmark(messageId)

// Actions
handlers.onForward(message)
handlers.onCopy(message)
handlers.onCopyLink(message)
handlers.onReport(message)

// Utilities
await handlers.onDelete(messageId)
await handlers.onMarkUnread(messageId)
handlers.onViewDetails(message)
handlers.onViewEditHistory(message)
handlers.onViewReactions(message)
```

### Bulk Handlers

Bulk operation handlers:

```tsx
// Bulk delete
await bulkHandlers.onBulkDelete(['msg-1', 'msg-2', 'msg-3'])

// Bulk forward
bulkHandlers.onBulkForward([message1, message2])

// Bulk copy
bulkHandlers.onBulkCopy([message1, message2])
```

### Selection State

Message selection for bulk operations:

```tsx
// Enter/exit selection mode
selection.enterSelectionMode()
selection.exitSelectionMode()

// Toggle individual message
selection.toggleSelection(messageId)

// Select all
selection.selectAll(allMessageIds)

// Clear selection
selection.clearSelection()

// Check state
const isInSelectionMode = selection.isSelectionMode
const selectedIds = selection.selectedMessages // Set<string>
```

## Advanced Usage

### Custom Action Handlers

```tsx
const { handleAction } = useMessageActions({
  channelId,
  onReplyMessage: (message) => {
    // Custom reply logic
    setReplyTo(message)
    focusMessageInput()
  },
  onDeleteMessage: async (messageId) => {
    // Confirm before delete
    const confirmed = await showConfirmDialog({
      title: 'Delete message?',
      description: 'This cannot be undone.',
    })

    if (confirmed) {
      await deleteMessage(messageId)
    }
  },
})
```

### Permission Management

```tsx
const permissions = getPermissions(message)

// Check individual permissions
if (permissions.canEdit) {
  // Show edit UI
}

if (permissions.canDelete) {
  // Show delete UI
}

// Or check action availability
if (canPerformAction('pin', message)) {
  // Pin action is available
}
```

### Bulk Operations UI

```tsx
import { BulkMessageActions } from '@/components/chat'

function MessageListWithBulk() {
  const { selection, bulkHandlers } = useMessageActions({
    channelId,
    enableBulkOperations: true,
  })

  return (
    <>
      {selection.isSelectionMode && (
        <BulkMessageActions
          selectedCount={selection.selectedMessages.size}
          onDelete={() => bulkHandlers.onBulkDelete(Array.from(selection.selectedMessages))}
          onForward={() => {
            const selected = messages.filter((m) => selection.selectedMessages.has(m.id))
            bulkHandlers.onBulkForward(selected)
          }}
          onCopy={() => {
            const selected = messages.filter((m) => selection.selectedMessages.has(m.id))
            bulkHandlers.onBulkCopy(selected)
          }}
          onClearSelection={selection.clearSelection}
        />
      )}

      {/* Messages */}
    </>
  )
}
```

### Mobile Optimization

```tsx
import { MobileMessageActions } from '@/components/chat'

function MobileMessage({ message }) {
  const [showActions, setShowActions] = useState(false)
  const { handleAction, getPermissions } = useMessageActions({ channelId })

  return (
    <>
      <div onClick={() => setShowActions(true)}>
        <MessageItem message={message} />
      </div>

      {showActions && (
        <MobileMessageActions
          message={message}
          permissions={getPermissions(message)}
          onAction={(action, data) => handleAction(action, message, data)}
          onClose={() => setShowActions(false)}
        />
      )}
    </>
  )
}
```

## Keyboard Shortcuts

The context menu supports keyboard shortcuts:

- **⌘C** - Copy text
- **⌘⇧C** - Copy link
- **R** - Reply
- **T** - Reply in thread
- **E** - Edit (if own message)
- **P** - Pin/Unpin (if moderator)
- **S** - Save/Bookmark
- **⌘F** - Forward
- **U** - Mark as unread
- **⌘⌫** - Delete

## Styling

All components use Tailwind CSS and respect the theme system:

```tsx
// Custom styling
<MessageActions
  className="custom-class"
  // ... other props
/>

<MessageContextMenu
  className="custom-menu-class"
  // ... other props
>
  {children}
</MessageContextMenu>
```

## Integration with GraphQL

```tsx
import { useMutation } from '@apollo/client'
import {
  PIN_MESSAGE,
  UNPIN_MESSAGE,
  STAR_MESSAGE,
  DELETE_MESSAGE,
} from '@/graphql/mutations/messages'

function MessageWithActions({ message }) {
  const [pinMessage] = useMutation(PIN_MESSAGE)
  const [deleteMessage] = useMutation(DELETE_MESSAGE)

  const { handleAction, getPermissions } = useMessageActions({
    channelId: message.channelId,
    onDeleteMessage: async (messageId) => {
      await deleteMessage({
        variables: { id: messageId },
        update(cache) {
          // Update cache after delete
        },
      })
    },
  })

  // ... render with actions
}
```

## Best Practices

1. **Permission Checking**: Always check permissions before showing actions
2. **Optimistic Updates**: Use optimistic updates for instant feedback
3. **Error Handling**: Handle errors gracefully with toast notifications
4. **Accessibility**: Ensure keyboard navigation works
5. **Mobile**: Use mobile-specific components on mobile devices
6. **Performance**: Memoize callbacks and use useCallback
7. **Selection**: Clear selection after bulk operations

## Troubleshooting

### Actions not appearing

- Check that permissions are correctly set
- Verify the user is authenticated
- Ensure the message is not deleted

### Context menu not opening

- Make sure the MessageContextMenu wraps the entire message
- Check browser console for errors
- Verify Radix UI context menu is installed

### Permissions not working

- Check user role is correctly set
- Verify the isOwnMessage check
- Ensure message.userId matches current user

## Examples

See the following files for complete examples:

- `/Users/admin/Sites/nself-chat/src/components/chat/message-item.tsx`
- `/Users/admin/Sites/nself-chat/src/components/chat/message-list.tsx`
- `/Users/admin/Sites/nself-chat/src/app/chat/page.tsx`
