# ɳChat API Documentation

**Version**: 1.0.0
**Base URL**: `https://api.nchat.example.com`
**GraphQL Endpoint**: `/v1/graphql`
**Auth**: JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [GraphQL API](#graphql-api)
3. [REST API](#rest-api)
4. [WebSocket/Subscriptions](#websocket-subscriptions)
5. [Rate Limits](#rate-limits)
6. [Error Handling](#error-handling)
7. [Webhooks](#webhooks)
8. [Examples](#examples)

---

## Authentication

### JWT Token Authentication

All API requests require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

**Endpoint**: `POST /v1/auth/signin`

**Request**:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "member"
  }
}
```

### Token Refresh

**Endpoint**: `POST /v1/auth/token/refresh`

**Request**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## GraphQL API

### Endpoint

```
POST /v1/graphql
```

### Headers

```http
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

### Queries

#### Get Channels

```graphql
query GetChannels($userId: uuid!) {
  channels(where: { channel_members: { user_id: { _eq: $userId } } }) {
    id
    name
    description
    is_private
    created_at
    channel_members {
      user {
        id
        display_name
        avatar_url
      }
      role
    }
  }
}
```

#### Get Messages

```graphql
query GetMessages($channelId: uuid!, $limit: Int = 50, $offset: Int = 0) {
  messages(
    where: { channel_id: { _eq: $channelId } }
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    content
    created_at
    user {
      id
      display_name
      avatar_url
    }
    reactions {
      emoji
      user_id
    }
    attachments {
      id
      filename
      url
      mime_type
      size
    }
  }
}
```

#### Get User Profile

```graphql
query GetUserProfile($userId: uuid!) {
  users_by_pk(id: $userId) {
    id
    email
    display_name
    avatar_url
    bio
    status
    role
    created_at
    last_seen
  }
}
```

### Mutations

#### Create Channel

```graphql
mutation CreateChannel($input: channels_insert_input!) {
  insert_channels_one(object: $input) {
    id
    name
    description
    is_private
    created_at
  }
}
```

**Variables**:

```json
{
  "input": {
    "name": "general",
    "description": "General discussion",
    "is_private": false,
    "owner_id": "user-uuid"
  }
}
```

#### Send Message

```graphql
mutation SendMessage($input: messages_insert_input!) {
  insert_messages_one(object: $input) {
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

**Variables**:

```json
{
  "input": {
    "channel_id": "channel-uuid",
    "user_id": "user-uuid",
    "content": "Hello, world!"
  }
}
```

#### Add Reaction

```graphql
mutation AddReaction($input: message_reactions_insert_input!) {
  insert_message_reactions_one(object: $input) {
    id
    emoji
    message_id
    user_id
  }
}
```

#### Update User Profile

```graphql
mutation UpdateUserProfile($userId: uuid!, $updates: users_set_input!) {
  update_users_by_pk(pk_columns: { id: $userId }, _set: $updates) {
    id
    display_name
    bio
    avatar_url
  }
}
```

### Subscriptions

#### Subscribe to New Messages

```graphql
subscription OnNewMessage($channelId: uuid!) {
  messages(where: { channel_id: { _eq: $channelId } }, order_by: { created_at: desc }, limit: 1) {
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

#### Subscribe to Typing Indicators

```graphql
subscription OnTyping($channelId: uuid!) {
  typing_indicators(where: { channel_id: { _eq: $channelId }, is_typing: { _eq: true } }) {
    user_id
    user {
      display_name
    }
    updated_at
  }
}
```

#### Subscribe to User Presence

```graphql
subscription OnUserPresence($userIds: [uuid!]!) {
  users(where: { id: { _in: $userIds } }) {
    id
    status
    last_seen
  }
}
```

---

## REST API

### Health Checks

#### Basic Health Check

```http
GET /api/health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T19:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

#### Readiness Check

```http
GET /api/health/ready
```

**Response**:

```json
{
  "ready": true,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

#### Liveness Check

```http
GET /api/health/live
```

**Response**:

```json
{
  "alive": true,
  "timestamp": "2026-01-29T19:00:00.000Z"
}
```

### File Upload

#### Upload File

```http
POST /api/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Data**:

- `file`: File to upload
- `channelId`: Channel UUID (optional)
- `messageId`: Message UUID (optional)

**Response**:

```json
{
  "id": "file-uuid",
  "filename": "image.png",
  "url": "https://storage.nchat.example.com/files/file-uuid.png",
  "mime_type": "image/png",
  "size": 102400,
  "created_at": "2026-01-29T19:00:00.000Z"
}
```

**Limits**:

- Max file size: 100MB
- Allowed types: Images, videos, audio, documents

### Link Preview

#### Generate Link Preview

```http
POST /api/link-preview
Authorization: Bearer <token>
Content-Type: application/json
```

**Request**:

```json
{
  "url": "https://example.com/article"
}
```

**Response**:

```json
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Article description...",
  "image": "https://example.com/og-image.jpg",
  "site_name": "Example Site",
  "favicon": "https://example.com/favicon.ico"
}
```

---

## WebSocket/Subscriptions

### Connection

Connect to WebSocket endpoint:

```javascript
const ws = new WebSocket('wss://api.nchat.example.com/v1/graphql', 'graphql-ws')

// Send connection init with auth token
ws.send(
  JSON.stringify({
    type: 'connection_init',
    payload: {
      headers: {
        Authorization: 'Bearer <your-jwt-token>',
      },
    },
  })
)
```

### Subscribe to Events

```javascript
// Subscribe to new messages
ws.send(
  JSON.stringify({
    id: '1',
    type: 'start',
    payload: {
      query: `
      subscription OnNewMessage($channelId: uuid!) {
        messages(where: {channel_id: {_eq: $channelId}}) {
          id
          content
          user {
            display_name
          }
        }
      }
    `,
      variables: {
        channelId: 'channel-uuid',
      },
    },
  })
)
```

### Heartbeat

Send ping every 30 seconds to keep connection alive:

```javascript
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ka' }))
}, 30000)
```

---

## Rate Limits

| Endpoint              | Limit          | Window     |
| --------------------- | -------------- | ---------- |
| Authentication        | 5 attempts     | 15 minutes |
| GraphQL Queries       | 100 requests   | 1 minute   |
| GraphQL Mutations     | 100 requests   | 1 minute   |
| File Uploads          | 50 uploads     | 1 hour     |
| WebSocket Connections | 10 connections | 1 minute   |
| API (per IP)          | 500 requests   | 1 minute   |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1643481600000
```

**Rate Limit Exceeded Response**:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retry_after": 60
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |
| 503  | Service Unavailable   |

### Error Response Format

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "validation error details"
  }
}
```

### Common Errors

#### Invalid Token

```json
{
  "error": "invalid_token",
  "message": "The provided token is invalid or expired"
}
```

#### Insufficient Permissions

```json
{
  "error": "insufficient_permissions",
  "message": "You do not have permission to perform this action",
  "required_role": "admin"
}
```

#### Validation Error

```json
{
  "error": "validation_error",
  "message": "Input validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## Webhooks

### Configuring Webhooks

Webhooks allow you to receive real-time notifications for events.

**Endpoint**: `POST /api/webhooks`

**Request**:

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["message.created", "channel.created", "user.joined"],
  "secret": "your-webhook-secret"
}
```

### Webhook Events

| Event             | Description               |
| ----------------- | ------------------------- |
| `message.created` | New message sent          |
| `message.updated` | Message edited            |
| `message.deleted` | Message deleted           |
| `channel.created` | New channel created       |
| `channel.updated` | Channel updated           |
| `channel.deleted` | Channel deleted           |
| `user.joined`     | User joined channel       |
| `user.left`       | User left channel         |
| `reaction.added`  | Reaction added to message |
| `file.uploaded`   | File uploaded             |

### Webhook Payload

```json
{
  "event": "message.created",
  "timestamp": "2026-01-29T19:00:00.000Z",
  "data": {
    "id": "message-uuid",
    "channel_id": "channel-uuid",
    "user_id": "user-uuid",
    "content": "Hello, world!",
    "created_at": "2026-01-29T19:00:00.000Z"
  }
}
```

### Webhook Signature

Verify webhook authenticity using HMAC-SHA256:

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  const computed = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed))
}
```

**Header**: `X-Webhook-Signature`

---

## Examples

### JavaScript/TypeScript

#### Initialize Client

```typescript
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = new HttpLink({
  uri: 'https://api.nchat.example.com/v1/graphql',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://api.nchat.example.com/v1/graphql',
    connectionParams: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
)

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpLink
)

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
```

#### Send Message

```typescript
import { gql } from '@apollo/client'

const SEND_MESSAGE = gql`
  mutation SendMessage($input: messages_insert_input!) {
    insert_messages_one(object: $input) {
      id
      content
      created_at
    }
  }
`

async function sendMessage(channelId: string, content: string) {
  const { data } = await client.mutate({
    mutation: SEND_MESSAGE,
    variables: {
      input: {
        channel_id: channelId,
        user_id: currentUserId,
        content,
      },
    },
  })
  return data.insert_messages_one
}
```

#### Subscribe to Messages

```typescript
import { gql } from '@apollo/client'

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($channelId: uuid!) {
    messages(where: { channel_id: { _eq: $channelId } }, order_by: { created_at: desc }, limit: 1) {
      id
      content
      user {
        display_name
      }
    }
  }
`

const subscription = client
  .subscribe({
    query: MESSAGE_SUBSCRIPTION,
    variables: { channelId },
  })
  .subscribe({
    next: ({ data }) => {
      console.log('New message:', data.messages[0])
    },
    error: (err) => {
      console.error('Subscription error:', err)
    },
  })
```

### Python

```python
import requests
import json

BASE_URL = 'https://api.nchat.example.com'
ACCESS_TOKEN = 'your-jwt-token'

headers = {
    'Authorization': f'Bearer {ACCESS_TOKEN}',
    'Content-Type': 'application/json'
}

# Send GraphQL query
query = '''
query GetChannels($userId: uuid!) {
  channels(where: {channel_members: {user_id: {_eq: $userId}}}) {
    id
    name
  }
}
'''

response = requests.post(
    f'{BASE_URL}/v1/graphql',
    headers=headers,
    json={
        'query': query,
        'variables': {'userId': 'user-uuid'}
    }
)

channels = response.json()['data']['channels']
print(channels)
```

### cURL

```bash
# Get channels
curl -X POST https://api.nchat.example.com/v1/graphql \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { channels { id name } }"
  }'

# Send message
curl -X POST https://api.nchat.example.com/v1/graphql \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation SendMessage($input: messages_insert_input!) { insert_messages_one(object: $input) { id } }",
    "variables": {
      "input": {
        "channel_id": "channel-uuid",
        "user_id": "user-uuid",
        "content": "Hello from cURL!"
      }
    }
  }'
```

---

## SDK & Libraries

### Official SDKs

- **JavaScript/TypeScript**: `@nchat/sdk` (npm)
- **Python**: `nchat-sdk` (pip)
- **Go**: `github.com/nchat/sdk-go`
- **Ruby**: `nchat-sdk` (gem)

### Community SDKs

- **PHP**: `nchat/php-sdk`
- **Java**: `io.nchat:sdk`
- **.NET**: `NChat.SDK`

---

## Support

- **Documentation**: https://docs.nchat.example.com
- **API Status**: https://status.nchat.example.com
- **Support Email**: support@nchat.example.com
- **GitHub Issues**: https://github.com/nself/nself-chat/issues

---

**Last Updated**: January 29, 2026
**API Version**: 1.0.0
