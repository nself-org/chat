# SDK Usage Guide

Complete guide to using the nChat TypeScript/JavaScript SDK.

## Installation

```bash
npm install @nchat/sdk
# or
yarn add @nchat/sdk
# or
pnpm add @nchat/sdk
```

## Quick Start

```typescript
import { NChatClient } from '@nchat/sdk'

// Initialize the client
const client = new NChatClient({
  apiUrl: 'https://api.nchat.example.com',
  apiKey: 'your-api-key',
})

// Authenticate
const { user, token } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'password123',
})

// Set the user token
client.setToken(token)

// Now you can make authenticated requests
const channels = await client.channels.list()
```

## Configuration

### Basic Configuration

```typescript
const client = new NChatClient({
  apiUrl: 'https://api.nchat.example.com',
  apiKey: 'your-api-key',
})
```

### Advanced Configuration

```typescript
const client = new NChatClient({
  apiUrl: 'https://api.nchat.example.com',
  graphqlUrl: 'https://api.nchat.example.com/graphql',
  apiKey: 'your-api-key',
  token: 'user-jwt-token', // Optional: Set initial token
  debug: true, // Enable debug logging
  timeout: 30000, // Request timeout (30 seconds)
  headers: {
    'X-Custom-Header': 'value',
  },
  retry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
})
```

## Authentication

### Sign Up

```typescript
const { user, token, refreshToken } = await client.auth.signUp({
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe',
  username: 'johndoe', // optional
})

// Store the token
client.setToken(token)
localStorage.setItem('nchat_token', token)
localStorage.setItem('nchat_refresh_token', refreshToken)
```

### Sign In

```typescript
const { user, token, refreshToken } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'password123',
})

client.setToken(token)
```

### Sign Out

```typescript
await client.auth.signOut()
client.clearAuth()
localStorage.removeItem('nchat_token')
localStorage.removeItem('nchat_refresh_token')
```

### Token Refresh

```typescript
const refreshToken = localStorage.getItem('nchat_refresh_token')

if (refreshToken) {
  try {
    const { token, refreshToken: newRefreshToken } = await client.auth.refreshToken(refreshToken)
    client.setToken(token)
    localStorage.setItem('nchat_token', token)
    localStorage.setItem('nchat_refresh_token', newRefreshToken)
  } catch (error) {
    // Refresh token expired, redirect to login
    window.location.href = '/login'
  }
}
```

### Password Management

```typescript
// Request password reset
await client.auth.requestPasswordReset('user@example.com')

// Reset password with token from email
await client.auth.resetPassword('reset-token', 'NewPassword123!')
```

### Two-Factor Authentication

```typescript
// Enable 2FA
const { secret, qrCode } = await client.auth.enable2FA()
// Display QR code to user for scanning with authenticator app

// Verify 2FA setup with code from authenticator
const { backupCodes } = await client.auth.verify2FA('123456')
// Store backup codes securely

// Disable 2FA
await client.auth.disable2FA('current-password')
```

## Channels

### Create Channel

```typescript
const channel = await client.channels.create({
  name: 'general',
  description: 'General discussion',
  type: 'public',
  category: 'general',
})
```

### List Channels

```typescript
const { data: channels, pagination } = await client.channels.list({
  limit: 50,
  orderBy: 'created_at',
  orderDirection: 'desc',
})

console.log(`Found ${channels.length} channels`)
console.log(`Total: ${pagination.total}`)
console.log(`Has more: ${pagination.hasMore}`)
```

### Get Channel

```typescript
const channel = await client.channels.get('channel-123')
console.log(channel.name, channel.memberCount)
```

### Update Channel

```typescript
await client.channels.update('channel-123', {
  name: 'New Name',
  description: 'Updated description',
})
```

### Delete Channel

```typescript
await client.channels.delete('channel-123')
```

### Join/Leave Channel

```typescript
// Join
await client.channels.join('channel-123')

// Leave
await client.channels.leave('channel-123')
```

### Manage Members

```typescript
// Get members
const { data: members } = await client.channels.getMembers('channel-123')

// Add members
await client.channels.addMembers('channel-123', ['user-456', 'user-789'])

// Remove member
await client.channels.removeMember('channel-123', 'user-456')
```

### Archive Channel

```typescript
// Archive
await client.channels.archive('channel-123')

// Unarchive
await client.channels.unarchive('channel-123')
```

## Messages

### Send Message

```typescript
// Simple text message
const message = await client.messages.send({
  channelId: 'channel-123',
  content: 'Hello, world!',
})

// Message with mentions
await client.messages.send({
  channelId: 'channel-123',
  content: 'Hey @john, check this out!',
  mentions: ['user-456'],
})

// Reply in thread
await client.messages.send({
  channelId: 'channel-123',
  content: 'This is a reply',
  parentId: 'message-789',
})

// Message with attachments
await client.messages.send({
  channelId: 'channel-123',
  content: 'Check out this image',
  attachments: ['attachment-id-1', 'attachment-id-2'],
})
```

### Get Message

```typescript
const message = await client.messages.get('message-123')
console.log(message.content, message.user.displayName)
```

### List Messages

```typescript
const { data: messages, pagination } = await client.messages.list('channel-123', {
  limit: 50,
  orderBy: 'created_at',
  orderDirection: 'desc',
})

// Pagination
if (pagination.hasMore) {
  const { data: moreMessages } = await client.messages.list('channel-123', {
    limit: 50,
    offset: pagination.offset + pagination.limit,
  })
}
```

### Update Message

```typescript
await client.messages.update('message-123', {
  content: 'Updated message content',
})
```

### Delete Message

```typescript
await client.messages.delete('message-123')
```

### Reactions

```typescript
// Add reaction
await client.messages.react('message-123', '👍')

// Remove reaction
await client.messages.unreact('message-123', '👍')
```

### Pin Message

```typescript
// Pin
await client.messages.pin('message-123')

// Unpin
await client.messages.unpin('message-123')
```

### Thread Replies

```typescript
const { data: replies } = await client.messages.getThread('message-123', {
  limit: 50,
})
```

### Mark as Read

```typescript
await client.messages.markAsRead('message-123')
```

## Users

### Get Current User

```typescript
const user = await client.users.me()
console.log(user.displayName, user.email, user.role)
```

### Get User

```typescript
const user = await client.users.get('user-123')
```

### List Users

```typescript
const { data: users } = await client.users.list({
  limit: 50,
})
```

### Update Profile

```typescript
await client.users.update({
  displayName: 'New Name',
  avatarUrl: 'https://example.com/avatar.jpg',
  status: 'Working on a project',
})
```

### Search Users

```typescript
const { data: users } = await client.users.search('john', {
  limit: 10,
})
```

### Presence

```typescript
// Get user presence
const presence = await client.users.getPresence('user-123')
console.log(presence.isOnline, presence.lastSeenAt)

// Update your presence
await client.users.updatePresence('online') // 'online' | 'away' | 'offline'
```

### Block/Unblock

```typescript
// Block user
await client.users.block('user-123')

// Unblock user
await client.users.unblock('user-123')

// Get blocked users
const { data: blocked } = await client.users.getBlocked()
```

## Webhooks

### Create Webhook

```typescript
const webhook = await client.webhooks.create({
  name: 'My Webhook',
  url: 'https://example.com/webhook',
  events: ['message.created', 'message.updated', 'channel.created'],
  secret: 'optional-secret', // For signature verification
})

console.log('Webhook ID:', webhook.id)
console.log('Webhook secret:', webhook.secret)
```

### List Webhooks

```typescript
const { data: webhooks } = await client.webhooks.list()
```

### Update Webhook

```typescript
await client.webhooks.update('webhook-123', {
  name: 'Updated Webhook',
  isActive: false,
})
```

### Test Webhook

```typescript
const { success, response } = await client.webhooks.test('webhook-123')
console.log('Test successful:', success)
```

### Regenerate Secret

```typescript
const { secret } = await client.webhooks.regenerateSecret('webhook-123')
console.log('New secret:', secret)
```

### Delete Webhook

```typescript
await client.webhooks.delete('webhook-123')
```

## Bots

### Create Bot

```typescript
const bot = await client.bots.create({
  name: 'Helper Bot',
  username: 'helperbot',
  description: 'A helpful bot',
  permissions: ['send_messages', 'read_messages'],
})

console.log('Bot ID:', bot.id)
console.log('Bot API key:', bot.apiKey)
```

### Send Message as Bot

```typescript
await client.bots.sendMessage(bot.id, {
  channelId: 'channel-123',
  content: 'Hello! I am a bot.',
})
```

### Add Reaction as Bot

```typescript
await client.bots.addReaction(bot.id, 'message-456', '🤖')
```

### Regenerate Bot API Key

```typescript
const { apiKey } = await client.bots.regenerateApiKey(bot.id)
console.log('New API key:', apiKey)
```

## Admin Operations

> **Note**: These operations require admin or owner role.

### Get System Stats

```typescript
const stats = await client.admin.getStats()
console.log('Total users:', stats.users.total)
console.log('Active users:', stats.users.active)
console.log('Total messages:', stats.messages.total)
```

### User Management

```typescript
// Get all users
const { data: users } = await client.admin.getUsers({
  limit: 100,
})

// Update user role
await client.admin.updateUserRole('user-123', {
  role: 'moderator',
})

// Suspend user
await client.admin.suspendUser('user-456', 'Violated terms')

// Unsuspend user
await client.admin.unsuspendUser('user-456')

// Delete user
await client.admin.deleteUser('user-789')
```

### Export Data

```typescript
const { downloadUrl } = await client.admin.exportData('json')
console.log('Download export:', downloadUrl)
```

## Error Handling

```typescript
import {
  NChatError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  NotFoundError,
} from '@nchat/sdk'

try {
  await client.messages.send({
    channelId: 'invalid',
    content: 'Test',
  })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Not authenticated. Redirect to login.')
    window.location.href = '/login'
  } else if (error instanceof AuthorizationError) {
    console.error('Insufficient permissions')
  } else if (error instanceof ValidationError) {
    console.error('Validation errors:', error.errors)
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`)
  } else if (error instanceof NotFoundError) {
    console.error('Resource not found')
  } else if (error instanceof NChatError) {
    console.error('API error:', error.message, error.statusCode)
  } else {
    console.error('Unknown error:', error)
  }
}
```

## TypeScript Support

The SDK is fully typed:

```typescript
import type {
  User,
  Channel,
  Message,
  Webhook,
  Bot,
  PaginatedResult
} from '@nchat/sdk'

// Types are automatically inferred
const message: Message = await client.messages.send({ ... })
const channels: PaginatedResult<Channel> = await client.channels.list()

// Custom type guards
function isPublicChannel(channel: Channel): boolean {
  return channel.type === 'public'
}
```

## Best Practices

### 1. Token Management

```typescript
// Store tokens securely
class TokenManager {
  private token: string | null = null
  private refreshToken: string | null = null

  async initialize() {
    this.token = localStorage.getItem('nchat_token')
    this.refreshToken = localStorage.getItem('nchat_refresh_token')

    if (this.token) {
      client.setToken(this.token)
    }
  }

  async refresh() {
    if (!this.refreshToken) throw new Error('No refresh token')

    const { token, refreshToken } = await client.auth.refreshToken(this.refreshToken)
    this.setTokens(token, refreshToken)
  }

  setTokens(token: string, refreshToken: string) {
    this.token = token
    this.refreshToken = refreshToken
    localStorage.setItem('nchat_token', token)
    localStorage.setItem('nchat_refresh_token', refreshToken)
    client.setToken(token)
  }

  clear() {
    this.token = null
    this.refreshToken = null
    localStorage.removeItem('nchat_token')
    localStorage.removeItem('nchat_refresh_token')
    client.clearAuth()
  }
}
```

### 2. Pagination Helper

```typescript
async function* paginateAll<T>(
  fetcher: (options: { limit: number; offset: number }) => Promise<PaginatedResult<T>>
) {
  let offset = 0
  const limit = 50

  while (true) {
    const result = await fetcher({ limit, offset })
    yield* result.data

    if (!result.pagination.hasMore) break
    offset += limit
  }
}

// Usage
for await (const message of paginateAll((opts) => client.messages.list('channel-123', opts))) {
  console.log(message.content)
}
```

### 3. Retry Logic

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const message = await withRetry(() => client.messages.send({ ... }))
```

## Next Steps

- [CLI Usage Guide](./cli-usage.md)
- [API Reference](../../api/README.md)
- [GraphQL Schema](../../api/graphql-schema.md)
- [Examples Repository](https://github.com/nself-chat/examples)
