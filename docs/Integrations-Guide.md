# Integrations & Webhooks Guide

**Version**: 0.5.0
**Last Updated**: January 2026

Complete guide to setting up and using integrations and webhooks in nself-chat.

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Integrations](#supported-integrations)
3. [Slack Integration](#slack-integration)
4. [Discord Integration](#discord-integration)
5. [Telegram Integration](#telegram-integration)
6. [GitHub Integration](#github-integration)
7. [Jira Integration](#jira-integration)
8. [Incoming Webhooks](#incoming-webhooks)
9. [Outgoing Webhooks](#outgoing-webhooks)
10. [Webhook Queue System](#webhook-queue-system)
11. [Database Schema](#database-schema)
12. [API Reference](#api-reference)

---

## Overview

nself-chat provides a comprehensive integration system that supports:

- **OAuth-based integrations** with popular services
- **Bidirectional message sync** between platforms
- **Incoming webhooks** to receive events from external services
- **Outgoing webhooks** to send events to external services
- **Webhook queue** with retry logic and rate limiting
- **Import wizards** for bulk message/channel imports

### Architecture

```
┌─────────────────┐
│  nself-chat     │
│  ┌───────────┐  │       ┌──────────┐
│  │ Outgoing  │──┼──────>│ External │
│  │ Webhooks  │  │       │ Services │
│  └───────────┘  │       └──────────┘
│                 │             │
│  ┌───────────┐  │             │
│  │ Incoming  │<─┼─────────────┘
│  │ Webhooks  │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │       ┌──────────┐
│  │Integration│<─┼──────>│  Redis   │
│  │  Queue    │  │       │  Queue   │
│  └───────────┘  │       └──────────┘
└─────────────────┘
```

---

## Supported Integrations

| Platform     | Type          | OAuth          | Webhooks | Import     | Bidirectional Sync |
| ------------ | ------------- | -------------- | -------- | ---------- | ------------------ |
| Slack        | Communication | ✅             | ✅       | ✅         | ✅                 |
| Discord      | Communication | ✅             | ✅       | ✅         | ✅                 |
| Telegram     | Communication | ❌ (Bot Token) | ✅       | ⚠️ Limited | ✅                 |
| GitHub       | DevTools      | ✅             | ✅       | ❌         | ❌                 |
| Jira         | DevTools      | ✅             | ✅       | ❌         | ❌                 |
| Google Drive | Storage       | ✅             | ❌       | ❌         | ❌                 |

---

## Slack Integration

### Setup

1. **Create Slack App**:
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Enter app name and workspace

2. **Configure OAuth**:
   - Navigate to "OAuth & Permissions"
   - Add redirect URL: `https://your-domain.com/api/auth/oauth/callback`
   - Add scopes:
     - `channels:history`
     - `channels:read`
     - `chat:write`
     - `files:read`
     - `users:read`
     - `users:read.email`

3. **Install App**:
   - Install to workspace
   - Copy OAuth tokens

4. **Setup Webhook** (Optional):
   - Navigate to "Event Subscriptions"
   - Enable events
   - Set Request URL: `https://your-domain.com/api/webhooks/slack`
   - Subscribe to bot events:
     - `message.channels`
     - `reaction_added`
     - `channel_created`

### Import Messages

```typescript
import { createSlackProvider } from '@/lib/integrations/slack/slack-client'

const provider = createSlackProvider({
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  redirectUri: 'https://your-domain.com/api/auth/oauth/callback',
})

// Import history
const result = await provider.importHistory(credentials, {
  channelIds: ['C1234567890'],
  startDate: '2024-01-01',
  endDate: '2024-12-31',
})
```

### Bidirectional Sync

- Messages posted in nself-chat → forwarded to Slack
- Messages posted in Slack → received via webhook → posted to nself-chat

---

## Discord Integration

### Setup

1. **Create Discord Application**:
   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Enter application name

2. **Configure Bot**:
   - Navigate to "Bot" section
   - Create bot user
   - Copy bot token
   - Enable required intents:
     - Presence Intent
     - Server Members Intent
     - Message Content Intent

3. **Configure OAuth2**:
   - Navigate to "OAuth2" section
   - Add redirect URL: `https://your-domain.com/api/auth/oauth/callback`
   - Select scopes: `bot`, `identify`, `guilds`
   - Select bot permissions: Read Messages, Send Messages, etc.

4. **Invite Bot**:
   - Use OAuth2 URL generator to create invite link
   - Invite bot to your Discord server

### Import Messages

```typescript
import { createDiscordProvider } from '@/lib/integrations/discord/discord-client'

const provider = createDiscordProvider({
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  botToken: process.env.DISCORD_BOT_TOKEN!,
  redirectUri: 'https://your-domain.com/api/auth/oauth/callback',
})

// Import history
const result = await provider.importHistory(credentials, {
  guildIds: ['123456789012345678'],
  channelIds: ['987654321098765432'],
  startDate: '2024-01-01',
})
```

### Webhook Integration

Discord primarily uses Gateway WebSocket for bot events, but you can also use channel webhooks:

```bash
# Create Discord webhook
curl -X POST "https://your-domain.com/api/webhooks/discord" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from external service!"}'
```

---

## Telegram Integration

### Setup

1. **Create Bot**:
   - Message @BotFather on Telegram
   - Send `/newbot` command
   - Follow prompts to create bot
   - Copy bot token

2. **Setup Webhook**:

   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -d "url=https://your-domain.com/api/webhooks/telegram&secret_token=<YOUR_SECRET>"
   ```

3. **Configure in nself-chat**:
   - No OAuth needed (uses bot token directly)
   - Store bot token in environment variable

### Important Notes

⚠️ **Limitations**:

- Telegram Bot API cannot fetch historical messages
- Bots can only see messages sent after they were added to the chat
- For full history import, you'd need MTProto API (user account)
- Messages sync in real-time via webhook

### Forward Messages

```typescript
import { createTelegramProvider } from '@/lib/integrations/telegram/telegram-client'

const provider = createTelegramProvider({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
  webhookUrl: 'https://your-domain.com/api/webhooks/telegram',
})

// Send message to chat
await provider.forwardMessage(
  credentials,
  -1001234567890, // Chat ID
  'Hello from nself-chat!'
)
```

---

## GitHub Integration

### Setup

1. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set Authorization callback URL: `https://your-domain.com/api/auth/oauth/callback`

2. **Setup Webhook**:
   - Go to repository settings
   - Navigate to Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/github`
   - Select events: push, pull_request, issues, etc.
   - Add secret for signature verification

### Supported Events

- `push` - Code pushed to repository
- `pull_request` - PR opened, closed, merged
- `issues` - Issues created, updated, closed
- `issue_comment` - Comments on issues/PRs
- `pull_request_review` - PR reviews
- `release` - New release created
- `deployment` - Deployment events

### Example: Create Issue from Message

```typescript
const client = provider.getClient(credentials)
const issue = await client.createIssue('owner', 'repo', {
  title: 'Bug report from chat',
  body: 'Issue details from message...',
  labels: ['bug', 'from-chat'],
})
```

---

## Jira Integration

### Setup

1. **Create Jira OAuth App**:
   - Go to https://developer.atlassian.com/console/myapps/
   - Create new app
   - Configure OAuth 2.0
   - Add callback URL: `https://your-domain.com/api/auth/oauth/callback`

2. **Setup Webhook**:
   - Log in to Jira as admin
   - Go to Settings > System > WebHooks
   - Create webhook with URL: `https://your-domain.com/api/webhooks/jira`
   - Select events: issue created, updated, etc.

### Supported Events

- `jira:issue_created`
- `jira:issue_updated`
- `comment_created`
- `worklog_created`
- `sprint_started`
- `sprint_closed`

### Example: Create Issue

```typescript
const client = provider.getClient(credentials)
const issue = await client.createIssue('PROJECT', {
  summary: 'Task from chat',
  description: 'Details...',
  issueType: 'Task',
})
```

---

## Incoming Webhooks

Incoming webhooks allow external services to POST messages to nself-chat channels.

### Create Incoming Webhook

```typescript
import { getIncomingWebhookManager } from '@/lib/webhooks/incoming-webhooks'

const manager = getIncomingWebhookManager()
const webhook = manager.createWebhook({
  name: 'External Service Webhook',
  targetChannelId: 'channel-uuid',
  enabled: true,
})

// Webhook URL
const url = `https://your-domain.com/api/webhooks/incoming/${webhook.token}`
```

### Use Incoming Webhook

```bash
curl -X POST "https://your-domain.com/api/webhooks/incoming/<TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from external service!",
    "username": "External Bot",
    "icon_url": "https://example.com/icon.png"
  }'
```

---

## Outgoing Webhooks

Outgoing webhooks send nself-chat events to external services.

### Create Outgoing Webhook

```typescript
import { getOutgoingWebhookManager } from '@/lib/webhooks/outgoing-webhooks'

const manager = getOutgoingWebhookManager()
const webhook = manager.createWebhook({
  name: 'External Service',
  url: 'https://external-service.com/webhook',
  secret: 'your-secret-key',
  events: ['message.created', 'channel.created', 'user.joined'],
})
```

### Trigger Webhook Event

```typescript
import { triggerWebhookEvent } from '@/lib/webhooks/outgoing-webhooks'

await triggerWebhookEvent(
  'message.created',
  {
    messageId: '123',
    channelId: '456',
    content: 'Hello!',
    author: { id: '789', username: 'user' },
  },
  {
    userId: '789',
    username: 'user',
  }
)
```

### Webhook Signature Verification

Outgoing webhooks include HMAC-SHA256 signature in `X-Webhook-Signature` header:

```typescript
// Verify signature (Node.js example)
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}
```

---

## Webhook Queue System

Webhooks use BullMQ + Redis for reliable delivery with retry logic.

### Configuration

```typescript
import { initializeWebhookQueue } from '@/lib/webhooks/webhook-queue'

const manager = initializeWebhookQueue({
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
  concurrency: 10,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  timeout: 30000, // 30 seconds
})
```

### Features

- **Automatic Retries**: Exponential backoff (5s, 10s, 20s)
- **Rate Limiting**: Configurable concurrency
- **Delivery Tracking**: Full audit log of all attempts
- **Dead Letter Queue**: Failed deliveries after max retries
- **Statistics**: Real-time queue metrics

### Queue Statistics

```typescript
const stats = await manager.getStats()
console.log(stats)
// {
//   total: 1000,
//   pending: 50,
//   active: 10,
//   completed: 900,
//   failed: 40,
//   delayed: 0
// }
```

---

## Database Schema

### Tables

- `nchat_integrations` - Integration configurations
- `nchat_integration_mappings` - Resource mappings (external ↔ internal)
- `nchat_outgoing_webhooks` - Outgoing webhook configs
- `nchat_webhook_deliveries` - Delivery log
- `nchat_incoming_webhooks` - Incoming webhook configs
- `nchat_integration_imports` - Import job tracking
- `nchat_integration_sync_queue` - Sync operation queue

### Example Queries

```sql
-- Get all active integrations
SELECT * FROM nchat_integrations
WHERE status = 'connected';

-- Get webhook delivery stats
SELECT
  webhook_id,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM nchat_webhook_deliveries
GROUP BY webhook_id;

-- Get pending sync operations
SELECT * FROM nchat_integration_sync_queue
WHERE status = 'pending'
AND scheduled_for <= NOW()
ORDER BY scheduled_for ASC
LIMIT 100;
```

---

## API Reference

### Integration Endpoints

- `POST /api/auth/oauth/connect` - Start OAuth flow
- `GET /api/auth/oauth/callback` - Handle OAuth callback
- `POST /api/integrations/:id/disconnect` - Disconnect integration
- `POST /api/integrations/:id/import` - Start import job
- `GET /api/integrations/:id/status` - Get integration status

### Webhook Endpoints

- `POST /api/webhooks/incoming/:token` - Receive incoming webhook
- `POST /api/webhooks/github` - GitHub webhook
- `POST /api/webhooks/slack` - Slack webhook
- `POST /api/webhooks/discord` - Discord webhook
- `POST /api/webhooks/telegram` - Telegram webhook
- `POST /api/webhooks/jira` - Jira webhook

---

## Best Practices

### Security

1. **Always verify webhook signatures** for incoming webhooks
2. **Use HTTPS** for all webhook URLs
3. **Rotate secrets** regularly
4. **IP whitelist** when possible
5. **Rate limit** webhook endpoints

### Performance

1. **Use webhook queue** for all outgoing webhooks
2. **Batch imports** for large message histories
3. **Set concurrency limits** to avoid overwhelming external APIs
4. **Monitor queue depth** and adjust workers

### Error Handling

1. **Log all webhook failures** with full context
2. **Implement dead letter queue** for manual review
3. **Alert on repeated failures**
4. **Provide retry mechanism** for transient failures

---

## Troubleshooting

### Common Issues

**OAuth Callback Not Working**:

- Verify redirect URI matches exactly
- Check OAuth app credentials
- Ensure callback endpoint is accessible

**Webhooks Not Delivering**:

- Check webhook queue is running
- Verify Redis connection
- Check network connectivity
- Review webhook logs

**Import Failing**:

- Verify API permissions/scopes
- Check rate limits
- Ensure date ranges are valid
- Review error logs

### Debug Mode

Enable debug logging:

```bash
DEBUG=integrations:* npm run dev
```

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/your-org/nself-chat/issues
- Documentation: https://docs.nself-chat.com
- Community: https://community.nself-chat.com
