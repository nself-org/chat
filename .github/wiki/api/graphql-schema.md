# GraphQL Schema Reference

Complete GraphQL schema documentation for nChat.

## Overview

The nChat GraphQL API is powered by Hasura and provides:

- **Queries** - Read data
- **Mutations** - Create, update, delete data
- **Subscriptions** - Real-time updates

**Endpoint**: `https://api.nchat.example.com/graphql`

## Core Types

### User

```graphql
type nchat_users {
  id: uuid!
  email: String!
  username: String
  display_name: String!
  avatar_url: String
  role: String!
  status: String!
  is_online: Boolean!
  last_seen_at: timestamptz
  created_at: timestamptz!
  updated_at: timestamptz!

  # Relations
  messages: [nchat_messages!]!
  channel_members: [nchat_channel_members!]!
  reactions: [nchat_reactions!]!
}
```

### Channel

```graphql
type nchat_channels {
  id: uuid!
  name: String!
  description: String
  type: String! # public, private, direct, group
  category: String
  is_archived: Boolean!
  created_by: uuid!
  created_at: timestamptz!
  updated_at: timestamptz!

  # Computed fields
  member_count: Int
  last_message_at: timestamptz

  # Relations
  creator: nchat_users!
  members: [nchat_channel_members!]!
  messages: [nchat_messages!]!
}
```

### Message

```graphql
type nchat_messages {
  id: uuid!
  channel_id: uuid!
  user_id: uuid!
  content: String!
  type: String! # text, file, image, video, audio, system
  parent_id: uuid
  is_edited: Boolean!
  is_pinned: Boolean!
  is_deleted: Boolean!
  created_at: timestamptz!
  updated_at: timestamptz!
  edited_at: timestamptz
  deleted_at: timestamptz

  # Computed fields
  thread_count: Int

  # Relations
  channel: nchat_channels!
  user: nchat_users!
  parent: nchat_messages
  replies: [nchat_messages!]!
  reactions: [nchat_reactions!]!
  attachments: [nchat_attachments!]!
  mentions: [nchat_mentions!]!
}
```

### Reaction

```graphql
type nchat_reactions {
  id: uuid!
  message_id: uuid!
  user_id: uuid!
  emoji: String!
  created_at: timestamptz!

  # Relations
  message: nchat_messages!
  user: nchat_users!
}
```

### Attachment

```graphql
type nchat_attachments {
  id: uuid!
  message_id: uuid!
  type: String! # file, image, video, audio
  name: String!
  url: String!
  thumbnail_url: String
  size: Int!
  mime_type: String!
  metadata: jsonb
  created_at: timestamptz!

  # Relations
  message: nchat_messages!
}
```

## Example Queries

### Get Channels

```graphql
query GetChannels {
  nchat_channels(
    where: { is_archived: { _eq: false } }
    order_by: { created_at: desc }
    limit: 10
  ) {
    id
    name
    description
    type
    member_count
    last_message_at
    created_at
  }
}
```

### Get Messages in Channel

```graphql
query GetMessages($channelId: uuid!, $limit: Int = 50) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
    order_by: { created_at: desc }
    limit: $limit
  ) {
    id
    content
    type
    created_at
    is_edited
    is_pinned
    thread_count
    user {
      id
      display_name
      avatar_url
    }
    reactions {
      emoji
      user {
        id
        display_name
      }
    }
    attachments {
      id
      type
      name
      url
      thumbnail_url
    }
  }
}
```

### Get Thread Replies

```graphql
query GetThreadReplies($parentId: uuid!) {
  nchat_messages(where: { parent_id: { _eq: $parentId } }, order_by: { created_at: asc }) {
    id
    content
    created_at
    user {
      id
      display_name
      avatar_url
    }
  }
}
```

## Example Mutations

### Send Message

```graphql
mutation SendMessage($channelId: uuid!, $content: String!) {
  insert_nchat_messages_one(object: { channel_id: $channelId, content: $content, type: "text" }) {
    id
    content
    created_at
    user {
      id
      display_name
    }
  }
}
```

### Create Channel

```graphql
mutation CreateChannel($name: String!, $description: String, $type: String!) {
  insert_nchat_channels_one(object: { name: $name, description: $description, type: $type }) {
    id
    name
    description
    type
    created_at
  }
}
```

### Add Reaction

```graphql
mutation AddReaction($messageId: uuid!, $emoji: String!) {
  insert_nchat_reactions_one(
    object: { message_id: $messageId, emoji: $emoji }
    on_conflict: { constraint: nchat_reactions_message_id_user_id_emoji_key, update_columns: [] }
  ) {
    id
    emoji
    user {
      id
      display_name
    }
  }
}
```

### Update Message

```graphql
mutation UpdateMessage($id: uuid!, $content: String!) {
  update_nchat_messages_by_pk(
    pk_columns: { id: $id }
    _set: { content: $content, is_edited: true, edited_at: "now()" }
  ) {
    id
    content
    is_edited
    edited_at
  }
}
```

### Delete Message

```graphql
mutation DeleteMessage($id: uuid!) {
  update_nchat_messages_by_pk(
    pk_columns: { id: $id }
    _set: { is_deleted: true, deleted_at: "now()" }
  ) {
    id
    is_deleted
  }
}
```

## Example Subscriptions

### Subscribe to New Messages

```graphql
subscription OnNewMessage($channelId: uuid!) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId }, is_deleted: { _eq: false } }
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    content
    created_at
    user {
      id
      display_name
      avatar_url
    }
  }
}
```

### Subscribe to Message Updates

```graphql
subscription OnMessageUpdate($messageId: uuid!) {
  nchat_messages_by_pk(id: $messageId) {
    id
    content
    is_edited
    is_deleted
    reactions_aggregate {
      aggregate {
        count
      }
    }
    reactions {
      emoji
      user {
        id
        display_name
      }
    }
  }
}
```

### Subscribe to User Presence

```graphql
subscription OnUserPresence {
  nchat_users(where: { is_online: { _eq: true } }) {
    id
    display_name
    is_online
    last_seen_at
  }
}
```

## Filtering and Sorting

### Where Clauses

```graphql
# Equality
where: { name: { _eq: "general" } }

# Not equal
where: { status: { _neq: "deleted" } }

# Greater than
where: { created_at: { _gt: "2024-01-01" } }

# Less than
where: { member_count: { _lt: 100 } }

# In array
where: { type: { _in: ["public", "private"] } }

# Like (case-insensitive)
where: { name: { _ilike: "%general%" } }

# Logical AND
where: {
  _and: [
    { type: { _eq: "public" } }
    { is_archived: { _eq: false } }
  ]
}

# Logical OR
where: {
  _or: [
    { type: { _eq: "public" } }
    { created_by: { _eq: $userId } }
  ]
}
```

### Order By

```graphql
# Single field
order_by: { created_at: desc }

# Multiple fields
order_by: [
  { is_pinned: desc }
  { created_at: desc }
]

# Nested ordering
order_by: {
  user: { display_name: asc }
}
```

### Pagination

```graphql
# Limit and offset
query GetMessages($limit: Int!, $offset: Int!) {
  nchat_messages(limit: $limit, offset: $offset, order_by: { created_at: desc }) {
    id
    content
  }
}

# Cursor-based (recommended for large datasets)
query GetMessages($cursor: timestamptz) {
  nchat_messages(
    where: { created_at: { _lt: $cursor } }
    limit: 50
    order_by: { created_at: desc }
  ) {
    id
    content
    created_at
  }
}
```

## Aggregations

```graphql
# Count
query CountMessages($channelId: uuid!) {
  nchat_messages_aggregate(where: { channel_id: { _eq: $channelId } }) {
    aggregate {
      count
    }
  }
}

# Average, sum, min, max
query ChannelStats {
  nchat_channels_aggregate {
    aggregate {
      count
      avg {
        member_count
      }
      max {
        member_count
      }
    }
  }
}
```

## Full Schema Download

Download the complete GraphQL schema:

```bash
# Using graphql-cli
graphql get-schema --endpoint https://api.nchat.example.com/graphql

# Using curl
curl https://api.nchat.example.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

## GraphQL Playground

Explore the API interactively:

https://api.nchat.example.com/graphql

## Next Steps

- [GraphQL Queries](./graphql-queries.md)
- [GraphQL Mutations](./graphql-mutations.md)
- [GraphQL Subscriptions](./graphql-subscriptions.md)
