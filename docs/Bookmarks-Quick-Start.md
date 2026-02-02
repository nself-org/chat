# Bookmarks & Saved Messages - Quick Start Guide

Get started with bookmarks and saved messages in under 5 minutes!

---

## Installation

The bookmarks feature is built-in. No installation required!

---

## Quick Start

### 1. Bookmark a Message

#### From Message Actions
```typescript
// Hover over any message and click the bookmark icon
<MessageActions messageId={messageId}>
  <BookmarkButton />
</MessageActions>
```

#### Using Hook
```typescript
import { useBookmarkMutations } from '@/hooks/use-bookmarks'

function MyComponent() {
  const { addBookmark } = useBookmarkMutations()

  const handleBookmark = async (messageId: string) => {
    await addBookmark({
      messageId,
      note: 'Important discussion',
      tags: ['important'],
    })
  }
}
```

### 2. View Your Bookmarks

Navigate to `/bookmarks` or use the component directly:

```typescript
import { BookmarkList } from '@/components/bookmarks/BookmarkList'

<BookmarkList
  showFilters={true}
  showStats={true}
  viewMode="list"
/>
```

### 3. Create a Collection

```typescript
import { useBookmarkCollectionMutations } from '@/hooks/use-bookmarks'

const { createCollection } = useBookmarkCollectionMutations()

await createCollection({
  name: 'Work Tasks',
  description: 'Important work messages',
  icon: 'briefcase',
  color: 'blue',
})
```

### 4. Save a Personal Message

```typescript
import { useSavedMessageMutations } from '@/hooks/use-bookmarks'

const { saveMessage } = useSavedMessageMutations()

await saveMessage({
  content: 'Remember to follow up on project X',
  note: 'Action item from meeting',
  tags: ['todo', 'urgent'],
})
```

### 5. Export Your Bookmarks

```typescript
import { useBookmarkExport } from '@/hooks/use-bookmarks'

const { exportBookmarks } = useBookmarkExport()

// Export as JSON
await exportBookmarks('json', {
  includeContent: true,
  includeAttachments: true,
})

// Export as CSV
await exportBookmarks('csv')
```

---

## Common Use Cases

### Use Case 1: Save Important Messages for Later

```typescript
// Quick bookmark
const { addBookmark } = useBookmarkMutations()
await addBookmark({ messageId: 'msg-123' })

// With context
await addBookmark({
  messageId: 'msg-123',
  note: 'Follow up next week',
  tags: ['action-item'],
})
```

### Use Case 2: Organize by Project

```typescript
// Create project collections
const { createCollection } = useBookmarkCollectionMutations()

await createCollection({
  name: 'Project Alpha',
  icon: 'folder',
  color: 'blue',
})

await createCollection({
  name: 'Project Beta',
  icon: 'folder',
  color: 'green',
})

// Add bookmark to collection
const { addBookmark } = useBookmarkMutations()
await addBookmark({
  messageId: 'msg-456',
  collectionIds: ['collection-alpha-id'],
  tags: ['design', 'review'],
})
```

### Use Case 3: Personal Note Taking

```typescript
// Save a personal note
const { saveMessage } = useSavedMessageMutations()

await saveMessage({
  content: 'Ideas for next sprint:\n- Feature A\n- Feature B\n- Bug fixes',
  tags: ['planning', 'sprint'],
})
```

### Use Case 4: Search Your Bookmarks

```typescript
// Search with filters
const { bookmarks } = useBookmarks({
  searchQuery: 'deployment',
  channelId: 'channel-devops',
  hasAttachments: true,
}, 'bookmarked_at_desc')

// Filter by tag
const { bookmarks } = useBookmarks({
  tag: 'urgent',
})

// Filter by collection
const { bookmarks } = useBookmarks({
  collectionId: 'collection-work-id',
})
```

### Use Case 5: Jump Back to Original Message

```typescript
import { useJumpToMessage } from '@/hooks/use-messages'

const { jumpToMessage } = useJumpToMessage()

// Jump to the original message from a bookmark
jumpToMessage(bookmark.message_id, bookmark.message.channel_id)
```

---

## Component Examples

### Full-Featured Bookmark List

```typescript
import { BookmarkList } from '@/components/bookmarks/BookmarkList'

export default function MyBookmarksPage() {
  return (
    <div className="container mx-auto py-6">
      <BookmarkList
        showFilters={true}
        showStats={true}
        viewMode="list"
      />
    </div>
  )
}
```

### Saved Messages View

```typescript
import { SavedMessages } from '@/components/bookmarks/SavedMessages'

export default function SavedMessagesPage() {
  return (
    <div className="container mx-auto py-6">
      <SavedMessages />
    </div>
  )
}
```

### Compact Bookmark Button

```typescript
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarkByMessage, useBookmarkMutations } from '@/hooks/use-bookmarks'
import { Button } from '@/components/ui/button'

function BookmarkButton({ messageId }: { messageId: string }) {
  const { isBookmarked, bookmark } = useBookmarkByMessage(messageId)
  const { toggleBookmark } = useBookmarkMutations()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleBookmark(messageId, bookmark?.id)}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  )
}
```

---

## GraphQL Examples

### Fetch Bookmarks

```graphql
query GetMyBookmarks {
  nchat_bookmarks(
    where: { user_id: { _eq: $userId } }
    order_by: { bookmarked_at: desc }
    limit: 50
  ) {
    id
    note
    tags
    bookmarked_at
    message {
      id
      content
      channel {
        name
      }
      user {
        display_name
      }
    }
  }
}
```

### Add Bookmark

```graphql
mutation AddBookmark(
  $messageId: uuid!
  $userId: uuid!
  $note: String
  $tags: jsonb
) {
  insert_nchat_bookmarks_one(
    object: {
      message_id: $messageId
      user_id: $userId
      note: $note
      tags: $tags
    }
  ) {
    id
    bookmarked_at
  }
}
```

### Search Bookmarks

```graphql
query SearchBookmarks($userId: uuid!, $query: String!) {
  nchat_bookmarks(
    where: {
      user_id: { _eq: $userId }
      _or: [
        { message: { content: { _ilike: $query } } }
        { note: { _ilike: $query } }
      ]
    }
  ) {
    id
    message {
      content
    }
  }
}
```

---

## Keyboard Shortcuts (Planned)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + D` | Toggle bookmark on selected message |
| `Cmd/Ctrl + Shift + B` | Open bookmarks panel |
| `Cmd/Ctrl + Shift + S` | Open saved messages |
| `/bookmark` | Quick bookmark command |
| `/save` | Quick save to saved messages |

---

## Tips & Tricks

### 1. Use Tags for Organization
```typescript
// Create a tagging system
const commonTags = [
  'important',
  'follow-up',
  'action-item',
  'reference',
  'decision',
  'feedback',
]

// Tag your bookmarks
await addBookmark({
  messageId: id,
  tags: ['important', 'action-item'],
})
```

### 2. Create Subject-Based Collections
```typescript
// Organize by topic
const collections = [
  { name: 'Design Reviews', icon: 'palette' },
  { name: 'Bug Reports', icon: 'bug' },
  { name: 'Feature Requests', icon: 'sparkles' },
  { name: 'Documentation', icon: 'book' },
]
```

### 3. Weekly Review
```typescript
// Get bookmarks from last week
const oneWeekAgo = new Date()
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

const { bookmarks } = useBookmarks({
  dateRange: {
    start: oneWeekAgo,
    end: new Date(),
  },
})
```

### 4. Export for Reporting
```typescript
// Export specific collection as CSV for reports
await exportBookmarks('csv', {
  includeContent: true,
  collectionIds: ['project-alpha-collection'],
})
```

### 5. Use Saved Messages as a Personal Inbox
```typescript
// Save messages that need your attention
await saveMessage({
  content: message.content,
  originalMessageId: message.id,
  sourceChannelId: message.channelId,
  tags: ['needs-response'],
})
```

---

## Best Practices

1. **Add Notes**: Always add context to important bookmarks
2. **Use Tags Consistently**: Create a standard set of tags
3. **Regular Cleanup**: Review and remove outdated bookmarks
4. **Organize with Collections**: Group related bookmarks
5. **Export Periodically**: Backup your bookmarks regularly

---

## Troubleshooting

### Bookmarks Not Showing Up?
- Check your filters - you might have active filters
- Clear search query
- Refresh the page
- Check network connection

### Can't Add Bookmark?
- Ensure you're authenticated
- Check if message still exists
- Verify permissions

### Export Not Working?
- Check browser popup blocker
- Try different format (JSON instead of CSV)
- Check browser console for errors

---

## Next Steps

- Read the [Full Feature Documentation](./Bookmarks-Feature.md)
- Explore [Advanced Features](#)
- Check out [API Reference](#)
- Join the [Community](#)

---

**Need Help?**
- File an issue on GitHub
- Check the FAQ
- Ask in the community Discord

---

**Last Updated**: 2026-02-01
