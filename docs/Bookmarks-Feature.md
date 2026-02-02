# Bookmarks & Saved Messages Feature

**Version**: 1.0.0
**Status**: Production Ready
**Date**: 2026-02-01

---

## Overview

The Bookmarks & Saved Messages system provides a comprehensive solution for users to save, organize, and retrieve important messages. This feature includes:

- **Bookmarks**: Star/save any message with notes, tags, and collections
- **Collections**: Organize bookmarks into custom folders
- **Saved Messages**: Personal message space (like Telegram) for saving content
- **Search & Filter**: Advanced search with multiple filter options
- **Export**: Export bookmarks to JSON, CSV, Markdown, or HTML
- **Cloud Sync**: Automatic synchronization across devices

---

## Features

### 1. Bookmark Messages

Users can bookmark any message with:

- **Star Icon**: Quick bookmark from message actions
- **Notes**: Add personal notes to bookmarks
- **Tags**: Organize with custom tags
- **Collections**: Group related bookmarks
- **Quick Actions**: Jump to message, remove, edit

### 2. Bookmark Collections

Organize bookmarks into collections:

- **Create Collections**: Custom named folders
- **Icons & Colors**: Visual customization
- **Private/Public**: Control collection visibility
- **Sort Order**: Custom ordering
- **Bulk Operations**: Add/remove multiple bookmarks

### 3. Saved Messages

Personal message space:

- **Save from Any Chat**: Save messages from any channel
- **Create Notes**: Write personal notes and reminders
- **Original Source**: Track where messages came from
- **Quick Access**: Access from sidebar
- **Full Search**: Search through saved content

### 4. Search & Filtering

Powerful search capabilities:

- **Full-Text Search**: Search message content and notes
- **Filter by Channel**: View bookmarks from specific channels
- **Filter by Collection**: View specific collection contents
- **Filter by Tags**: Find tagged bookmarks
- **Date Range**: Filter by bookmark date
- **Has Attachments**: Filter messages with files

### 5. Sorting Options

Multiple sort options:

- **Newest First**: Most recently bookmarked
- **Oldest First**: Earliest bookmarks
- **Message Date**: Sort by original message date
- **Channel Name**: Alphabetical by channel

### 6. View Modes

- **List View**: Detailed list with full content
- **Grid View**: Card-based layout for visual browsing

### 7. Export Functionality

Export bookmarks in multiple formats:

- **JSON**: Machine-readable format
- **CSV**: Spreadsheet-compatible
- **Markdown**: Human-readable text
- **HTML**: Styled web page

Export options:
- Include/exclude content
- Include/exclude attachments
- Include/exclude metadata
- Filter by collection or channel
- Date range filtering

---

## Architecture

### Database Schema

#### `nchat_bookmarks` Table

```sql
CREATE TABLE nchat_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  tags JSONB DEFAULT '[]',
  collection_ids JSONB DEFAULT '[]',
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_bookmarks_user_id ON nchat_bookmarks(user_id);
CREATE INDEX idx_bookmarks_message_id ON nchat_bookmarks(message_id);
CREATE INDEX idx_bookmarks_bookmarked_at ON nchat_bookmarks(bookmarked_at DESC);
CREATE INDEX idx_bookmarks_tags ON nchat_bookmarks USING GIN(tags);
```

#### `nchat_bookmark_collections` Table

```sql
CREATE TABLE nchat_bookmark_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  is_private BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookmark_collections_user_id ON nchat_bookmark_collections(user_id);
CREATE INDEX idx_bookmark_collections_sort_order ON nchat_bookmark_collections(sort_order);
```

#### `nchat_saved_messages` Table

```sql
CREATE TABLE nchat_saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  original_message_id UUID REFERENCES nchat_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  source_channel_id UUID REFERENCES nchat_channels(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]'
);

CREATE INDEX idx_saved_messages_user_id ON nchat_saved_messages(user_id);
CREATE INDEX idx_saved_messages_saved_at ON nchat_saved_messages(saved_at DESC);
CREATE INDEX idx_saved_messages_tags ON nchat_saved_messages USING GIN(tags);
```

### GraphQL API

#### Queries

```graphql
# Get all bookmarks
query GetBookmarks($userId: uuid!, $limit: Int, $offset: Int) {
  nchat_bookmarks(
    where: { user_id: { _eq: $userId } }
    order_by: { bookmarked_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    message_id
    bookmarked_at
    note
    tags
    collection_ids
    message {
      id
      content
      channel {
        id
        name
      }
      user {
        id
        display_name
        avatar_url
      }
    }
  }
}

# Search bookmarks
query SearchBookmarks(
  $userId: uuid!
  $searchQuery: String!
  $channelId: uuid
  $collectionId: uuid
) {
  nchat_bookmarks(
    where: {
      user_id: { _eq: $userId }
      _or: [
        { message: { content: { _ilike: $searchQuery } } }
        { note: { _ilike: $searchQuery } }
      ]
      message: { channel_id: { _eq: $channelId } }
      collection_ids: { _contains: $collectionId }
    }
  ) {
    # ... fields
  }
}

# Get collections
query GetBookmarkCollections($userId: uuid!) {
  nchat_bookmark_collections(
    where: { user_id: { _eq: $userId } }
    order_by: { sort_order: asc }
  ) {
    id
    name
    description
    icon
    color
    bookmarks_aggregate {
      aggregate {
        count
      }
    }
  }
}

# Get saved messages
query GetSavedMessages($userId: uuid!, $limit: Int, $offset: Int) {
  nchat_saved_messages(
    where: { user_id: { _eq: $userId } }
    order_by: { saved_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    content
    saved_at
    note
    tags
    source_channel {
      id
      name
    }
    original_message {
      id
      user {
        display_name
      }
    }
  }
}
```

#### Mutations

```graphql
# Add bookmark
mutation AddBookmark(
  $messageId: uuid!
  $userId: uuid!
  $note: String
  $tags: jsonb
  $collectionIds: jsonb
) {
  insert_nchat_bookmarks_one(
    object: {
      message_id: $messageId
      user_id: $userId
      note: $note
      tags: $tags
      collection_ids: $collectionIds
    }
  ) {
    id
    bookmarked_at
  }
}

# Remove bookmark
mutation RemoveBookmark($bookmarkId: uuid!) {
  delete_nchat_bookmarks_by_pk(id: $bookmarkId) {
    id
  }
}

# Update bookmark
mutation UpdateBookmark(
  $bookmarkId: uuid!
  $note: String
  $tags: jsonb
  $collectionIds: jsonb
) {
  update_nchat_bookmarks_by_pk(
    pk_columns: { id: $bookmarkId }
    _set: { note: $note, tags: $tags, collection_ids: $collectionIds }
  ) {
    id
    note
    tags
    collection_ids
  }
}

# Create collection
mutation CreateBookmarkCollection(
  $userId: uuid!
  $name: String!
  $description: String
  $icon: String
  $color: String
) {
  insert_nchat_bookmark_collections_one(
    object: {
      user_id: $userId
      name: $name
      description: $description
      icon: $icon
      color: $color
    }
  ) {
    id
    name
  }
}

# Save message
mutation SaveMessage(
  $userId: uuid!
  $content: String!
  $originalMessageId: uuid
  $sourceChannelId: uuid
  $note: String
  $tags: jsonb
) {
  insert_nchat_saved_messages_one(
    object: {
      user_id: $userId
      content: $content
      original_message_id: $originalMessageId
      source_channel_id: $sourceChannelId
      note: $note
      tags: $tags
    }
  ) {
    id
    saved_at
  }
}
```

### REST API

#### Endpoints

```
GET    /api/bookmarks?userId=xxx&export=json
POST   /api/bookmarks { action: "add", messageId, userId, ... }
POST   /api/bookmarks { action: "remove", bookmarkId }
POST   /api/bookmarks { action: "update", bookmarkId, ... }
POST   /api/bookmarks { action: "export", userId, format, options }
```

---

## Usage

### React Hooks

```typescript
import {
  useBookmarks,
  useBookmarkMutations,
  useBookmarkCollections,
  useBookmarkCollectionMutations,
  useSavedMessages,
  useSavedMessageMutations,
  useBookmarkExport,
} from '@/hooks/use-bookmarks'

// Get bookmarks
function MyComponent() {
  const { bookmarks, loading } = useBookmarks(filter, sortBy)
  const { addBookmark, removeBookmark } = useBookmarkMutations()

  // Add bookmark
  const handleBookmark = async (messageId: string) => {
    await addBookmark({
      messageId,
      note: 'Important message',
      tags: ['important', 'follow-up'],
    })
  }

  // Remove bookmark
  const handleRemove = async (bookmarkId: string) => {
    await removeBookmark(bookmarkId)
  }
}

// Collections
function CollectionManager() {
  const { collections } = useBookmarkCollections()
  const { createCollection, updateCollection } = useBookmarkCollectionMutations()

  const handleCreate = async () => {
    await createCollection({
      name: 'Work Tasks',
      description: 'Important work-related messages',
      icon: 'briefcase',
      color: 'blue',
    })
  }
}

// Saved messages
function SavedMessagesView() {
  const { savedMessages } = useSavedMessages()
  const { saveMessage, deleteSavedMessage } = useSavedMessageMutations()

  const handleSave = async (content: string) => {
    await saveMessage({
      content,
      note: 'Reminder',
      tags: ['todo'],
    })
  }
}

// Export
function ExportButton() {
  const { exportBookmarks } = useBookmarkExport()

  const handleExport = async () => {
    await exportBookmarks('json', {
      includeContent: true,
      includeAttachments: true,
    })
  }
}
```

### Components

```typescript
import { BookmarkList } from '@/components/bookmarks/BookmarkList'
import { SavedMessages } from '@/components/bookmarks/SavedMessages'

// Bookmark list
<BookmarkList
  showFilters={true}
  showStats={true}
  viewMode="list"
/>

// Saved messages
<SavedMessages />
```

---

## UI Components

### Message Actions Integration

Add bookmark button to message actions:

```typescript
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useBookmarkByMessage, useBookmarkMutations } from '@/hooks/use-bookmarks'

function MessageActions({ messageId }) {
  const { bookmark, isBookmarked } = useBookmarkByMessage(messageId)
  const { toggleBookmark } = useBookmarkMutations()

  return (
    <Button
      onClick={() => toggleBookmark(messageId, bookmark?.id)}
      variant="ghost"
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

### Sidebar Integration

Add bookmarks and saved messages to sidebar:

```typescript
import { Bookmark, Save } from 'lucide-react'

function Sidebar() {
  return (
    <div>
      <SidebarItem href="/bookmarks" icon={Bookmark}>
        Bookmarks
      </SidebarItem>
      <SidebarItem href="/saved" icon={Save}>
        Saved Messages
      </SidebarItem>
    </div>
  )
}
```

---

## Testing

### Unit Tests

```typescript
// Test bookmark mutations
describe('useBookmarkMutations', () => {
  it('should add a bookmark', async () => {
    const { result } = renderHook(() => useBookmarkMutations())
    await act(async () => {
      await result.current.addBookmark({
        messageId: 'msg-123',
        note: 'Test note',
      })
    })
    // Assert bookmark was added
  })

  it('should remove a bookmark', async () => {
    const { result } = renderHook(() => useBookmarkMutations())
    await act(async () => {
      await result.current.removeBookmark('bookmark-123')
    })
    // Assert bookmark was removed
  })
})
```

### Integration Tests

```typescript
// Test bookmark list
describe('BookmarkList', () => {
  it('should display bookmarks', () => {
    render(<BookmarkList />)
    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
  })

  it('should filter by channel', async () => {
    render(<BookmarkList />)
    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    await userEvent.click(screen.getByText('general'))
    // Assert filtered results
  })
})
```

---

## Performance Considerations

### Optimization Strategies

1. **Pagination**: Load bookmarks in batches (50 per page)
2. **Lazy Loading**: Load more on scroll
3. **Virtual Scrolling**: For large bookmark lists
4. **Memoization**: Cache filtered/sorted results
5. **Subscription**: Real-time updates via GraphQL subscriptions
6. **Indexing**: Database indexes on frequently queried columns

### Caching

```typescript
// Apollo Client caching
const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          nchat_bookmarks: {
            keyArgs: ['userId'],
            merge(existing = [], incoming) {
              return [...existing, ...incoming]
            },
          },
        },
      },
    },
  }),
})
```

---

## Security

### Access Control

- Users can only access their own bookmarks
- Collections can be private or public
- Saved messages are always private
- Export requires authentication

### Permissions

```typescript
// GraphQL permissions
permissions: {
  nchat_bookmarks: {
    select: { user_id: { _eq: 'X-Hasura-User-Id' } },
    insert: { user_id: { _eq: 'X-Hasura-User-Id' } },
    update: { user_id: { _eq: 'X-Hasura-User-Id' } },
    delete: { user_id: { _eq: 'X-Hasura-User-Id' } },
  },
}
```

---

## Future Enhancements

### Planned Features

1. **Shared Collections**: Share collections with other users
2. **Smart Collections**: Auto-organize based on rules
3. **Bookmark Reminders**: Set reminders for bookmarked messages
4. **Bookmark Analytics**: Usage statistics and insights
5. **Import**: Import bookmarks from other platforms
6. **Browser Extension**: Save web content to saved messages
7. **Mobile App**: Native bookmark management
8. **AI Summaries**: Automatically summarize long bookmarked messages
9. **Duplicate Detection**: Find and merge duplicate bookmarks
10. **Collaborative Collections**: Team-shared bookmark folders

---

## Troubleshooting

### Common Issues

**Issue**: Bookmarks not syncing across devices
- **Solution**: Check WebSocket connection, verify GraphQL subscriptions

**Issue**: Export not downloading
- **Solution**: Check browser popup blocker, verify API response headers

**Issue**: Search not working
- **Solution**: Check search query length (min 2 characters), verify database indexes

**Issue**: Collections not showing bookmarks
- **Solution**: Verify collection_ids array in bookmark record

---

## API Reference

See:
- `/src/types/bookmark.ts` - TypeScript type definitions
- `/src/graphql/queries/bookmarks.ts` - GraphQL queries
- `/src/graphql/mutations/bookmarks.ts` - GraphQL mutations
- `/src/hooks/use-bookmarks.ts` - React hooks
- `/src/components/bookmarks/` - UI components

---

## Migration Guide

### Database Migration

```sql
-- Run these migrations to add bookmark tables

-- 1. Create bookmarks table
CREATE TABLE nchat_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  tags JSONB DEFAULT '[]',
  collection_ids JSONB DEFAULT '[]',
  UNIQUE(message_id, user_id)
);

-- 2. Create collections table
CREATE TABLE nchat_bookmark_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  is_private BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create saved messages table
CREATE TABLE nchat_saved_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  original_message_id UUID REFERENCES nchat_messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  source_channel_id UUID REFERENCES nchat_channels(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  tags JSONB DEFAULT '[]'
);

-- 4. Create indexes
CREATE INDEX idx_bookmarks_user_id ON nchat_bookmarks(user_id);
CREATE INDEX idx_bookmarks_message_id ON nchat_bookmarks(message_id);
CREATE INDEX idx_bookmarks_bookmarked_at ON nchat_bookmarks(bookmarked_at DESC);
CREATE INDEX idx_bookmarks_tags ON nchat_bookmarks USING GIN(tags);

CREATE INDEX idx_bookmark_collections_user_id ON nchat_bookmark_collections(user_id);
CREATE INDEX idx_bookmark_collections_sort_order ON nchat_bookmark_collections(sort_order);

CREATE INDEX idx_saved_messages_user_id ON nchat_saved_messages(user_id);
CREATE INDEX idx_saved_messages_saved_at ON nchat_saved_messages(saved_at DESC);
CREATE INDEX idx_saved_messages_tags ON nchat_saved_messages USING GIN(tags);
```

### Migrate from Starred Messages

If you have existing starred messages (nchat_starred_messages):

```sql
-- Migrate starred messages to bookmarks
INSERT INTO nchat_bookmarks (message_id, user_id, bookmarked_at, tags, collection_ids)
SELECT
  message_id,
  user_id,
  starred_at as bookmarked_at,
  '[]'::jsonb as tags,
  '[]'::jsonb as collection_ids
FROM nchat_starred_messages
ON CONFLICT (message_id, user_id) DO NOTHING;
```

---

## License

Part of nself-chat platform. See main LICENSE file.

---

**Last Updated**: 2026-02-01
**Maintainer**: nself-chat team
**Support**: Create an issue on GitHub
