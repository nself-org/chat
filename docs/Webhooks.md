# Webhook Integration System

Complete production-ready webhook system for nself-chat, supporting both incoming webhooks (post messages to channels) and outgoing webhooks (receive events from channels).

## Table of Contents

1. [Overview](#overview)
2. [Incoming Webhooks](#incoming-webhooks)
3. [Outgoing Webhooks](#outgoing-webhooks)
4. [Platform-Specific Webhooks](#platform-specific-webhooks)
5. [Security](#security)
6. [Configuration](#configuration)
7. [API Reference](#api-reference)

---

## Overview

The webhook system provides:

- **Incoming Webhooks**: Post messages to nself-chat channels from external services
- **Outgoing Webhooks**: Send nself-chat events to external services
- **Platform Integrations**: Pre-built handlers for Slack, GitHub, Jira, Discord, Telegram
- **Signature Verification**: HMAC-SHA256 signature verification for all webhooks
- **Rate Limiting**: 60 requests/minute per IP for incoming webhooks
- **Retry Logic**: Exponential backoff with configurable retry attempts
- **Delivery Tracking**: Complete audit trail for all webhook deliveries

---

## Incoming Webhooks

Incoming webhooks allow external services to post messages to nself-chat channels.

### Creating an Incoming Webhook

1. Navigate to Channel Settings → Integrations → Webhooks
2. Click "Create Incoming Webhook"
3. Provide:
   - Name (e.g., "Jenkins CI")
   - Channel to post to
   - Optional: Avatar URL, default username
4. Copy the generated webhook URL

### Using an Incoming Webhook

**Endpoint:** `POST /api/webhooks/incoming/{token}`

**Example Request:**

```bash
curl -X POST https://your-domain.com/api/webhooks/incoming/{TOKEN} \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Build completed successfully!",
    "username": "Jenkins Bot",
    "avatarUrl": "https://example.com/jenkins.png",
    "embeds": [{
      "title": "Build #123",
      "description": "All tests passed",
      "color": "#00ff00",
      "fields": [
        { "name": "Duration", "value": "2m 34s" },
        { "name": "Tests", "value": "145 passed" }
      ],
      "url": "https://jenkins.example.com/build/123"
    }]
  }'
```

**Payload Schema:**

```typescript
interface IncomingWebhookPayload {
  // Required: At least one must be present
  content?: string              // Message text
  embeds?: IncomingWebhookEmbed[]    // Rich embeds
  attachments?: IncomingWebhookAttachment[]  // File attachments

  // Optional
  username?: string             // Override display name
  avatarUrl?: string           // Override avatar
  threadId?: string            // Post to specific thread
}

interface IncomingWebhookEmbed {
  title?: string
  description?: string
  url?: string
  color?: string              // Hex color code
  thumbnail?: { url: string }
  image?: { url: string }
  footer?: { text: string; iconUrl?: string }
  author?: { name: string; url?: string; iconUrl?: string }
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  timestamp?: Date
}

interface IncomingWebhookAttachment {
  url: string
  filename?: string
  contentType?: string
}
```

**Response:**

```json
{
  "success": true,
  "message": "Message posted successfully",
  "messageId": "uuid",
  "channelId": "uuid",
  "timestamp": "2026-02-01T12:00:00Z",
  "duration": 145
}
```

### Rate Limits

- 60 requests per minute per IP address
- Response headers indicate rate limit status:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Outgoing Webhooks

Outgoing webhooks send nself-chat events to external services.

### Creating an Outgoing Webhook

1. Navigate to Workspace Settings → Webhooks → Outgoing
2. Click "Create Outgoing Webhook"
3. Configure:
   - Name (e.g., "Analytics Webhook")
   - Target URL
   - Events to subscribe to
   - Optional: Secret for signature verification
   - Optional: Custom headers
   - Optional: Filters (channel IDs, user IDs, content patterns)

### Event Types

```typescript
// Message events
'message.created'
'message.updated'
'message.deleted'
'message.pinned'
'message.unpinned'

// Reaction events
'reaction.added'
'reaction.removed'

// Channel events
'channel.created'
'channel.updated'
'channel.deleted'
'channel.archived'

// Member events
'member.joined'
'member.left'
'member.updated'

// User events
'user.created'
'user.updated'
'user.deactivated'

// Thread events
'thread.created'
'thread.updated'

// File events
'file.uploaded'
'file.deleted'
```

### Payload Format

All outgoing webhooks send a JSON payload:

```json
{
  "id": "delivery-uuid",
  "event": "message.created",
  "webhookId": "webhook-uuid",
  "timestamp": "2026-02-01T12:00:00Z",
  "version": "1.0",
  "data": {
    "message": {
      "id": "message-uuid",
      "channelId": "channel-uuid",
      "userId": "user-uuid",
      "content": "Hello, world!",
      "type": "text",
      "createdAt": "2026-02-01T12:00:00Z"
    },
    "channel": {
      "id": "channel-uuid",
      "name": "general",
      "type": "public"
    },
    "user": {
      "id": "user-uuid",
      "username": "john",
      "displayName": "John Doe"
    }
  }
}
```

### Signature Verification

Outgoing webhooks include an `X-Webhook-Signature` header for verification:

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Extract algorithm and signature
  const [algorithm, receivedSignature] = signature.split('=')

  // Compute expected signature
  const hmac = crypto.createHmac(algorithm, secret)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  )
}
```

### Retry Logic

Failed deliveries are automatically retried with exponential backoff:

```typescript
interface WebhookRetryConfig {
  enabled: true
  maxAttempts: 3
  initialDelay: 1          // seconds
  maxDelay: 60            // seconds
  backoffMultiplier: 2
  retryOnStatus: [408, 429, 500, 502, 503, 504]
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: After 1 second
- Attempt 3: After 2 seconds
- Attempt 4: After 4 seconds (if maxAttempts > 3)

---

## Platform-Specific Webhooks

### Slack

**Endpoint:** `POST /api/webhooks/slack`

**Setup:**
1. Create a Slack App at https://api.slack.com/apps
2. Enable Event Subscriptions
3. Set Request URL to `https://your-domain.com/api/webhooks/slack`
4. Subscribe to events:
   - `message.channels`
   - `message.groups`
   - `reaction_added`
   - `reaction_removed`
5. Set signing secret in `.env`: `SLACK_SIGNING_SECRET=xxx`

**Supported Events:**
- Message created/updated/deleted
- Reactions added/removed
- Channel created/renamed/deleted
- Member joined/left channel

---

### GitHub

**Endpoint:** `POST /api/webhooks/github`

**Setup:**
1. Go to repository Settings → Webhooks
2. Add webhook with URL: `https://your-domain.com/api/webhooks/github`
3. Set content type to `application/json`
4. Set secret and add to `.env`: `GITHUB_WEBHOOK_SECRET=xxx`
5. Select events:
   - Push
   - Pull request
   - Issues
   - Issue comments
   - Releases
   - Deployments

**Supported Events:**
- Push (with commit details)
- Pull request (opened, closed, merged)
- Issues (created, updated, closed)
- Comments on issues and PRs
- PR reviews
- Releases
- Deployment status

**Example Notification:**

```
🔨 john pushed 3 commits to main in my-repo

`a1b2c3d` Fix authentication bug
`e4f5g6h` Update documentation
`i7j8k9l` Add new feature

[View changes](https://github.com/org/repo/compare/...)
```

---

### Jira

**Endpoint:** `POST /api/webhooks/jira`

**Setup:**
1. Jira Settings → System → WebHooks
2. Create webhook with URL: `https://your-domain.com/api/webhooks/jira`
3. Select events:
   - Issue created/updated/deleted
   - Comment created/updated
   - Sprint started/closed
4. Optional: Configure secret in `.env`: `JIRA_WEBHOOK_SECRET=xxx`

**Supported Events:**
- Issue created/updated/deleted
- Comments on issues
- Sprint started/closed
- Status transitions
- Assignee changes

**Example Notification:**

```
🐛 John Doe created Bug PROJ-123

**Login page crashes on mobile**

Priority: High
Assignee: Jane Smith

> Users are reporting crashes when trying to log in on mobile devices...
```

---

### Discord

**Endpoint:** `POST /api/webhooks/discord?channel_id=YOUR_CHANNEL_ID`

**Setup:**
Discord primarily uses Gateway WebSocket for bot events, but this endpoint can receive webhook messages from Discord channels.

**Note:** For Discord → nself-chat sync, add `?channel_id=DISCORD_CHANNEL_ID` to webhook URL.

---

### Telegram

**Endpoint:** `POST /api/webhooks/telegram`

**Setup:**
1. Create bot with @BotFather
2. Get bot token
3. Generate secure secret: `openssl rand -hex 32`
4. Set webhook:

```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://your-domain.com/api/webhooks/telegram" \
  -d "secret_token={SECRET}"
```

5. Add secret to `.env`: `TELEGRAM_WEBHOOK_SECRET=xxx`

**Supported Updates:**
- Messages (text, photos, documents, videos, voice)
- Edited messages
- Channel posts
- Callback queries

---

## Security

### Signature Verification

All webhooks support signature verification using HMAC-SHA256:

**GitHub:**
- Header: `X-Hub-Signature-256`
- Format: `sha256={signature}`

**Slack:**
- Header: `X-Slack-Signature`
- Format: `v0={signature}`
- Uses timestamp to prevent replay attacks

**Jira:**
- Header: `X-Hub-Signature`
- Format: `sha256={signature}`

**Telegram:**
- Header: `X-Telegram-Bot-Api-Secret-Token`
- Uses simple token comparison

### Rate Limiting

Incoming webhooks enforce rate limits:
- 60 requests per minute per IP
- Configurable per-webhook limits
- Automatic backoff on limit exceeded

### Best Practices

1. **Always verify signatures** in production
2. **Use HTTPS** for all webhook URLs
3. **Rotate secrets** regularly
4. **Monitor delivery failures** for suspicious activity
5. **Implement IP whitelisting** if possible
6. **Use dedicated service users** for webhook messages
7. **Log all webhook activity** for auditing

---

## Configuration

### Environment Variables

```bash
# Database
HASURA_ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_GRAPHQL_URL=https://your-hasura.com/v1/graphql

# Webhook Secrets
SLACK_SIGNING_SECRET=your-slack-secret
GITHUB_WEBHOOK_SECRET=your-github-secret
JIRA_WEBHOOK_SECRET=your-jira-secret
TELEGRAM_WEBHOOK_SECRET=your-telegram-secret

# System User IDs (for webhook messages)
SLACK_SYSTEM_USER_ID=uuid
GITHUB_SYSTEM_USER_ID=uuid
JIRA_SYSTEM_USER_ID=uuid
DISCORD_SYSTEM_USER_ID=uuid
TELEGRAM_SYSTEM_USER_ID=uuid

# Redis (for webhook queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
```

### Database Tables

**nchat_webhooks:**
- `id` (uuid, primary key)
- `name` (text)
- `avatar_url` (text, nullable)
- `channel_id` (uuid, foreign key to channels)
- `token` (text, unique, for incoming webhooks)
- `url` (text, for outgoing webhooks)
- `status` (text: 'active', 'paused', 'disabled')
- `created_by` (uuid, foreign key to users)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `last_used_at` (timestamptz, nullable)

**nchat_webhook_deliveries:**
- `id` (uuid, primary key)
- `webhook_id` (uuid, foreign key)
- `status` (text: 'pending', 'success', 'failed', 'retrying')
- `request_body` (text)
- `request_headers` (jsonb)
- `response_body` (text, nullable)
- `response_status` (integer, nullable)
- `error_message` (text, nullable)
- `attempt_count` (integer, default 0)
- `created_at` (timestamptz)
- `delivered_at` (timestamptz, nullable)
- `next_retry_at` (timestamptz, nullable)

---

## API Reference

### GET /api/webhooks/incoming/{token}

Get webhook configuration and usage instructions.

**Response:**

```json
{
  "webhook": {
    "token": "xxx",
    "url": "https://your-domain.com/api/webhooks/incoming/{token}",
    "method": "POST",
    "contentType": "application/json"
  },
  "instructions": {
    "usage": "Send POST requests with JSON payload",
    "authentication": "Token is embedded in URL",
    "example": { ... }
  }
}
```

### POST /api/webhooks/incoming/{token}

Post a message to a channel via incoming webhook.

See [Incoming Webhooks](#incoming-webhooks) for full details.

### GET /api/webhooks/{platform}

Get setup instructions for platform-specific webhooks.

Platforms: `slack`, `github`, `jira`, `discord`, `telegram`

**Response:**

```json
{
  "webhook": {
    "url": "https://your-domain.com/api/webhooks/{platform}",
    "method": "POST",
    "contentType": "application/json",
    "events": ["..."]
  },
  "setup": {
    "steps": ["..."]
  }
}
```

### POST /api/webhooks/{platform}

Receive webhook events from external platforms.

Platform-specific payload formats and processing logic.

---

## Monitoring and Debugging

### Webhook Deliveries

View delivery history in the admin dashboard:

1. Navigate to Admin → Webhooks → Deliveries
2. Filter by webhook, status, date range
3. View request/response details
4. Retry failed deliveries

### Delivery States

- **pending**: Queued for delivery
- **success**: Delivered successfully (HTTP 2xx)
- **failed**: All retry attempts exhausted
- **retrying**: Temporary failure, will retry

### Logging

Webhook activity is logged with:
- Request ID
- Webhook ID
- Event type
- Delivery status
- Duration
- Error details (if failed)

### Health Checks

Monitor webhook system health:

```bash
# Check webhook queue status
GET /api/admin/webhooks/queue/stats

# Response
{
  "total": 150,
  "pending": 5,
  "active": 2,
  "completed": 140,
  "failed": 3,
  "delayed": 0
}
```

---

## Troubleshooting

### Common Issues

**Webhook not receiving events:**
1. Check webhook status is "active"
2. Verify URL is correct and accessible
3. Check firewall/network settings
4. Verify signature secret is correct
5. Check platform-specific configuration

**Signature verification failing:**
1. Ensure secret matches on both sides
2. Check payload is not modified before verification
3. Verify using raw request body (not parsed JSON)
4. Check timestamp for Slack webhooks (max 5 minutes old)

**High failure rate:**
1. Check target service availability
2. Review response status codes
3. Increase timeout if needed
4. Verify payload format is correct
5. Check rate limits on target service

**Messages not appearing in channel:**
1. Verify webhook has permission to post
2. Check channel mapping is configured
3. Ensure system user exists
4. Review webhook delivery logs
5. Check GraphQL mutations for errors

---

## Performance

### Throughput

- Incoming webhooks: 60 req/min per IP (configurable)
- Outgoing webhooks: 100 req/min per webhook
- Queue processing: 10 concurrent deliveries
- Average latency: <200ms for incoming, <1s for outgoing

### Scaling

For high-volume deployments:

1. **Horizontal scaling**: Deploy multiple webhook workers
2. **Redis cluster**: Use Redis cluster for queue distribution
3. **Database optimization**: Add indexes on webhook_id, status, created_at
4. **CDN/Load balancer**: Distribute incoming webhook requests
5. **Batch processing**: Group outgoing webhook deliveries

---

## Examples

See `/examples/webhooks/` for complete examples:

- `incoming-basic.sh` - Simple incoming webhook
- `incoming-rich.sh` - Rich embeds and attachments
- `outgoing-server.js` - Express server receiving outgoing webhooks
- `signature-verify.ts` - Signature verification examples
- `slack-integration/` - Complete Slack app example
- `github-integration/` - GitHub webhook handler
- `jira-integration/` - Jira webhook handler

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/nself-chat/issues
- Documentation: https://docs.nself-chat.com/webhooks
- Discord: https://discord.gg/nself-chat
