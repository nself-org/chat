# GraphQL Operations Quick Reference

**Quick lookup guide for nself-chat GraphQL operations**

---

## Common Usage Patterns

### Using Operations in Components

```typescript
import { useQuery, useMutation, useSubscription } from '@apollo/client'
import {
  GET_MESSAGES,
  SEND_MESSAGE,
  MESSAGE_SUBSCRIPTION
} from '@/graphql'

// Query
const { data, loading, error } = useQuery(GET_MESSAGES, {
  variables: { channelId: '123', limit: 50 }
})

// Mutation
const [sendMessage] = useMutation(SEND_MESSAGE)
await sendMessage({
  variables: {
    channelId: '123',
    content: 'Hello!'
  }
})

// Subscription
const { data } = useSubscription(MESSAGE_SUBSCRIPTION, {
  variables: { channelId: '123' }
})
```

---

## Quick Operation Lookup

### 🧑 USER OPERATIONS

```typescript
// Get user
import { GET_USER, GET_CURRENT_USER } from '@/graphql'

// Update profile
import { UPDATE_PROFILE, UPDATE_AVATAR } from '@/graphql'

// Presence
import { UPDATE_PRESENCE, GET_ONLINE_USERS } from '@/graphql'

// Status
import { UPDATE_STATUS, CLEAR_STATUS } from '@/graphql'

// Subscriptions
import { PRESENCE_SUBSCRIPTION, USER_PROFILE_SUBSCRIPTION } from '@/graphql'
```

### 💬 CHANNEL OPERATIONS

```typescript
// Get channels
import { GET_CHANNELS, GET_USER_CHANNELS } from '@/graphql'

// Channel CRUD
import { CREATE_CHANNEL, UPDATE_CHANNEL, DELETE_CHANNEL } from '@/graphql'

// Membership
import { JOIN_CHANNEL, LEAVE_CHANNEL, ADD_CHANNEL_MEMBER } from '@/graphql'

// Settings
import { MUTE_CHANNEL, PIN_CHANNEL, STAR_CHANNEL } from '@/graphql'

// Direct Messages
import { CREATE_DIRECT_MESSAGE, GET_DIRECT_MESSAGE_CHANNEL } from '@/graphql'
```

### 📨 MESSAGE OPERATIONS

```typescript
// Send/Edit/Delete
import { SEND_MESSAGE, UPDATE_MESSAGE, DELETE_MESSAGE } from '@/graphql'

// Get messages
import { GET_MESSAGES, GET_MESSAGE_BY_ID } from '@/graphql'

// Interactions
import { PIN_MESSAGE, STAR_MESSAGE, FORWARD_MESSAGE } from '@/graphql'

// Threads
import { CREATE_THREAD, REPLY_TO_THREAD, GET_THREAD_MESSAGES } from '@/graphql'

// Typing
import { START_TYPING, STOP_TYPING } from '@/graphql'

// Subscriptions
import { MESSAGE_SUBSCRIPTION, TYPING_SUBSCRIPTION } from '@/graphql'
```

### 🧵 THREAD OPERATIONS

```typescript
// Get threads
import { GET_THREAD, GET_CHANNEL_THREADS, GET_USER_THREADS } from '@/graphql'

// Thread details
import { GET_THREAD_PARTICIPANTS, GET_THREAD_MESSAGES } from '@/graphql'

// Manage threads
import { SUBSCRIBE_TO_THREAD, UNSUBSCRIBE_FROM_THREAD } from '@/graphql'
```

### 👍 REACTION OPERATIONS

```typescript
// Reactions
import { ADD_REACTION, REMOVE_REACTION, TOGGLE_REACTION } from '@/graphql'

// Subscription
import { REACTION_SUBSCRIPTION } from '@/graphql'
```

### 🔔 NOTIFICATION OPERATIONS

```typescript
// Get notifications
import { GET_NOTIFICATIONS, GET_UNREAD_COUNT } from '@/graphql'

// Mark read
import { MARK_AS_READ, MARK_ALL_AS_READ } from '@/graphql'

// Settings
import { MUTE_CHANNEL_NOTIFICATIONS, UPDATE_NOTIFICATION_PREFERENCES } from '@/graphql'

// Push notifications
import { REGISTER_PUSH_TOKEN, UNREGISTER_PUSH_TOKEN } from '@/graphql'

// Subscriptions
import { NOTIFICATION_SUBSCRIPTION, UNREAD_COUNT_SUBSCRIPTION } from '@/graphql'
```

### 🔍 SEARCH OPERATIONS

```typescript
// Search all types
import { SEARCH_ALL, QUICK_SEARCH } from '@/graphql'

// Specific searches
import { SEARCH_MESSAGES, SEARCH_USERS, SEARCH_CHANNELS } from '@/graphql'

// Advanced search
import { SEARCH_MESSAGES_FTS, SEARCH_MESSAGES_BY_DATE } from '@/graphql'

// Search history
import { GET_RECENT_SEARCHES, SAVE_SEARCH } from '@/graphql'
```

### 📎 ATTACHMENT/FILE OPERATIONS

```typescript
// Get files
import { GET_CHANNEL_FILES, GET_CHANNEL_FILES_BY_TYPE } from '@/graphql'

// Upload
import { GET_UPLOAD_URL, CREATE_ATTACHMENT, CONFIRM_UPLOAD } from '@/graphql'

// Delete
import { DELETE_ATTACHMENT, DELETE_MESSAGE_ATTACHMENTS } from '@/graphql'

// Subscription
import { CHANNEL_ATTACHMENTS_SUBSCRIPTION } from '@/graphql'
```

### 📖 READ RECEIPTS

```typescript
// Mark read
import { MARK_MESSAGE_READ, MARK_CHANNEL_READ } from '@/graphql'

// Get receipts
import { GET_READ_RECEIPTS } from '@/graphql'

// Subscription
import { READ_RECEIPT_SUBSCRIPTION } from '@/graphql'
```

### 🔖 BOOKMARKS

```typescript
// Manage bookmarks
import { ADD_BOOKMARK, REMOVE_BOOKMARK, GET_BOOKMARKS } from '@/graphql'
```

### 📊 POLLS

```typescript
// Create poll
import { CREATE_POLL } from '@/graphql'

// Vote
import { VOTE_ON_POLL } from '@/graphql'

// Get results
import { GET_POLL, GET_POLL_RESULTS } from '@/graphql'
```

### ⏰ SCHEDULED MESSAGES

```typescript
// Schedule
import { SCHEDULE_MESSAGE, UPDATE_SCHEDULED_MESSAGE } from '@/graphql'

// Get scheduled
import { GET_SCHEDULED_MESSAGES } from '@/graphql'

// Cancel
import { CANCEL_SCHEDULED_MESSAGE } from '@/graphql'
```

### 🛡️ ADMIN OPERATIONS

```typescript
// User management
import { BAN_USER, UNBAN_USER, SUSPEND_USER } from '@/graphql/admin'

// Get stats
import { GET_ADMIN_STATS, GET_ADMIN_USERS } from '@/graphql/admin'

// Reports
import { GET_REPORTS, RESOLVE_REPORT } from '@/graphql/admin'
```

### 🚫 MODERATION

```typescript
// Block users
import { BLOCK_USER, UNBLOCK_USER, GET_BLOCKED_USERS } from '@/graphql'

// Report
import { REPORT_USER, REPORT_MESSAGE } from '@/graphql'

// Mute
import { MUTE_USER, UNMUTE_USER } from '@/graphql'
```

---

## Common Patterns

### Pagination

```typescript
const { data, fetchMore } = useQuery(GET_MESSAGES, {
  variables: { channelId, limit: 50, offset: 0 }
})

// Load more
fetchMore({
  variables: { offset: data.messages.length }
})
```

### Real-time Updates

```typescript
// Subscribe to new messages
useSubscription(MESSAGE_SUBSCRIPTION, {
  variables: { channelId },
  onData: ({ data }) => {
    // Update cache or state
  }
})
```

### Optimistic Updates

```typescript
const [sendMessage] = useMutation(SEND_MESSAGE, {
  optimisticResponse: {
    insert_nchat_messages_one: {
      __typename: 'nchat_messages',
      id: 'temp-id',
      content,
      created_at: new Date().toISOString(),
      // ... other fields
    }
  }
})
```

### Error Handling

```typescript
const { data, error } = useQuery(GET_MESSAGES)

if (error) {
  console.error('GraphQL Error:', error.message)
  // Handle error
}
```

### Refetch Queries

```typescript
const [updateChannel] = useMutation(UPDATE_CHANNEL, {
  refetchQueries: [
    { query: GET_CHANNELS },
    { query: GET_CHANNEL_BY_ID, variables: { channelId } }
  ]
})
```

---

## File Locations

### Main Entry Point
```typescript
import * from '@/graphql'
// or
import { messages, channels, users } from '@/graphql'
```

### Organized Imports
```typescript
// Queries
import { GET_MESSAGES } from '@/graphql/queries/messages'

// Mutations
import { SEND_MESSAGE } from '@/graphql/mutations/messages'

// Subscriptions
import { MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions/messages'
```

---

## Type Definitions

All operations export TypeScript types:

```typescript
import type {
  SendMessageInput,
  UpdateMessageInput,
  GetMessagesVariables
} from '@/graphql'

const variables: GetMessagesVariables = {
  channelId: '123',
  limit: 50,
  offset: 0
}
```

---

## Fragments

Reusable fragments for consistency:

```typescript
import {
  USER_BASIC_FRAGMENT,
  USER_PROFILE_FRAGMENT,
  CHANNEL_BASIC_FRAGMENT,
  MESSAGE_FULL_FRAGMENT
} from '@/graphql/fragments'

// Use in custom queries
const CUSTOM_QUERY = gql`
  query CustomQuery($id: uuid!) {
    user: nchat_users_by_pk(id: $id) {
      ...UserProfile
    }
  }
  ${USER_PROFILE_FRAGMENT}
`
```

---

## Best Practices

### ✅ DO

```typescript
// Use typed variables
const variables: GetMessagesVariables = { channelId, limit: 50 }

// Handle loading states
if (loading) return <Spinner />

// Handle errors
if (error) return <ErrorMessage error={error} />

// Use fragments
const { data } = useQuery(GET_USER, {
  variables: { id }
})
```

### ❌ DON'T

```typescript
// Don't skip error handling
const { data } = useQuery(GET_MESSAGES) // Missing error check

// Don't ignore loading states
if (data) return <Messages data={data} /> // May render null

// Don't duplicate fragments
// Use shared fragments instead of inline fields
```

---

## Performance Tips

### 1. Use Pagination
```typescript
// Good: Paginated
GET_MESSAGES({ limit: 50, offset: 0 })

// Bad: Load everything
GET_MESSAGES({ limit: 10000 })
```

### 2. Selective Fields
```typescript
// Good: Only needed fields
query GetUser {
  user { id, name, avatar }
}

// Bad: All fields
query GetUser {
  user { ...UserProfile }
}
```

### 3. Cache Policies
```typescript
useQuery(GET_MESSAGES, {
  fetchPolicy: 'cache-first' // Use cache when available
})
```

### 4. Batch Operations
```typescript
// Good: Single mutation
ADD_MULTIPLE_MEMBERS({ members: [...] })

// Bad: Multiple mutations
members.forEach(m => ADD_CHANNEL_MEMBER({ ...m }))
```

---

## Troubleshooting

### Common Issues

**Issue**: Subscription not working
```typescript
// Check: WebSocket connection configured?
// Check: Subscription variables correct?
// Check: Network tab shows WebSocket?
```

**Issue**: Stale data
```typescript
// Solution: Refetch or use subscription
refetch()
// or
subscribeToMore({ ... })
```

**Issue**: Cache not updating
```typescript
// Solution: Update cache manually
update: (cache, { data }) => {
  cache.modify({
    fields: {
      messages(existing = []) {
        return [...existing, data.insert_nchat_messages_one]
      }
    }
  })
}
```

---

## Additional Resources

- **Main Index**: `/Users/admin/Sites/nself-chat/src/graphql/index.ts`
- **Fragments**: `/Users/admin/Sites/nself-chat/src/graphql/fragments.ts`
- **Apollo Config**: `/Users/admin/Sites/nself-chat/src/lib/apollo-client.ts`
- **Full Audit**: `/Users/admin/Sites/nself-chat/GRAPHQL-OPERATIONS-AUDIT.md`

---

**Last Updated**: February 1, 2026
