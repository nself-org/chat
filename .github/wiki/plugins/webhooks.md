# Webhooks Guide

nChat supports both **incoming webhooks** (external services posting to nChat) and **outgoing webhooks** (nChat sending events to external URLs).

## Incoming Webhooks

Incoming webhooks allow external services to post messages into nChat channels.

### Creating an Incoming Webhook

```typescript
import { WebhookRegistry, WebhookStore } from '@/lib/plugins/webhooks'

const store = new WebhookStore()
const registry = new WebhookRegistry(store, 'https://app.nchat.dev')

const webhook = registry.createIncoming(
  {
    name: 'CI/CD Notifications',
    description: 'Build status from GitHub Actions',
    channelId: 'channel-devops',
    avatarUrl: 'https://example.com/ci-bot.png',
    defaultUsername: 'CI Bot',
  },
  'admin-user-id'
)

console.log('Webhook URL:', webhook.url)
// https://app.nchat.dev/api/plugins/webhooks/incoming/wht_xxxxx
console.log('Token:', webhook.token)
console.log('Secret:', webhook.secret)
```

### Sending Messages via Incoming Webhook

External services POST JSON to the webhook URL:

```bash
curl -X POST https://app.nchat.dev/api/plugins/webhooks/incoming/wht_xxxxx \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Build #42 passed successfully!",
    "username": "GitHub Actions",
    "avatar_url": "https://github.com/favicon.ico",
    "embeds": [
      {
        "title": "Build Report",
        "description": "All 150 tests passed.",
        "color": "#00ff00",
        "url": "https://github.com/org/repo/actions/runs/42",
        "fields": [
          { "name": "Branch", "value": "main", "inline": true },
          { "name": "Duration", "value": "2m 30s", "inline": true }
        ]
      }
    ]
  }'
```

### Incoming Payload Format

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` or `text` | string | Yes* | Message text (max 4000 chars) |
| `username` | string | No | Override display name (max 80 chars) |
| `avatarUrl` / `avatar_url` | string | No | Override avatar URL |
| `threadId` / `thread_id` | string | No | Post in a thread |
| `attachments` | array | No | File attachments (max 10) |
| `embeds` | array | No | Rich embeds (max 10) |

*At least one of `content`, `embeds`, or `attachments` is required.

### Processing Incoming Webhooks

```typescript
import { IncomingWebhookProcessor } from '@/lib/plugins/webhooks'

const processor = new IncomingWebhookProcessor(
  async (params) => {
    // Create message in database
    const messageId = await createMessage(params)
    return { messageId }
  },
  { maxRequests: 60, windowSeconds: 60, burstAllowance: 10 }
)

// Register the webhook for token lookup
processor.registerWebhook(webhook)

// Process a request
const result = await processor.process({
  token: 'wht_xxxxx',
  body: { content: 'Hello from external service!' },
  headers: {},
  timestamp: Date.now(),
})

if (result.accepted) {
  console.log('Message created:', result.messageId)
} else {
  console.error('Rejected:', result.error, result.statusCode)
}
```

## Outgoing Webhooks

Outgoing webhooks send nChat events to external URLs.

### Creating an Outgoing Webhook

```typescript
const outgoing = registry.createOutgoing(
  {
    name: 'Event Logger',
    description: 'Log all message events to our service',
    url: 'https://api.example.com/nchat-events',
    events: ['message.created', 'message.deleted'],
    filters: {
      channelIds: ['channel-general'],
      excludeBots: true,
    },
    headers: {
      'X-Custom-Header': 'my-value',
    },
    retryConfig: {
      maxAttempts: 5,
      initialDelayMs: 1000,
    },
  },
  'admin-user-id'
)

console.log('Webhook ID:', outgoing.id)
console.log('Secret:', outgoing.secret) // Use this to verify signatures
```

### Delivery Engine

```typescript
import { WebhookDeliveryEngine } from '@/lib/plugins/webhooks'

const engine = new WebhookDeliveryEngine(
  async (url, init) => {
    const response = await fetch(url, init)
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text: () => response.text(),
    }
  }
)

const delivery = await engine.deliver(outgoing, {
  id: 'evt_001',
  event: 'message.created',
  webhookId: outgoing.id,
  timestamp: new Date().toISOString(),
  version: '1.0',
  idempotencyKey: 'msg_123_created',
  data: {
    messageId: 'msg_123',
    channelId: 'channel-general',
    content: 'Hello!',
    authorId: 'user_456',
  },
})

console.log('Delivery status:', delivery.status)
// 'delivered', 'failed', 'retrying', 'dead_letter'
```

## Signature Verification

All outgoing webhooks include HMAC signatures for verification.

### Generating Signatures

```typescript
import { generateSignature, generateCompositeSignature } from '@/lib/plugins/webhooks'

// Simple signature
const sig = generateSignature('{"event":"message.created"}', 'whsec_xxxxx')
// "sha256=abc123..."

// Composite signature (includes timestamp, Slack-style)
const timestamp = Math.floor(Date.now() / 1000)
const compositeSig = generateCompositeSignature(
  '{"event":"message.created"}',
  'whsec_xxxxx',
  timestamp
)
```

### Verifying Signatures on Your Server

```typescript
import { verifySignature, verifyWebhookRequest } from '@/lib/plugins/webhooks'

// Simple verification
const result = verifySignature(
  rawBody,
  request.headers['x-webhook-signature'],
  'whsec_xxxxx'
)
if (!result.valid) {
  return res.status(401).send(result.error)
}

// Full verification (signature + timestamp + replay protection)
import { ReplayProtector } from '@/lib/plugins/webhooks'

const protector = new ReplayProtector()
const fullResult = verifyWebhookRequest(
  rawBody,
  request.headers,
  'whsec_xxxxx',
  protector
)
```

### Webhook Request Headers

| Header | Description |
|--------|-------------|
| `x-webhook-signature` | HMAC-SHA256 signature |
| `x-webhook-timestamp` | Unix timestamp (seconds) |
| `x-webhook-nonce` | Unique nonce for replay protection |
| `x-delivery-id` | Unique delivery identifier |
| `x-event-type` | Event type string |
| `User-Agent` | `nchat-webhook/1.0` |

## Replay Protection

The `ReplayProtector` combines three mechanisms:

1. **Timestamp validation**: Rejects requests older than 5 minutes (configurable)
2. **Nonce tracking**: Tracks seen nonces to prevent duplicate delivery
3. **Idempotency keys**: Prevents duplicate processing of the same event

```typescript
import { ReplayProtector } from '@/lib/plugins/webhooks'

const protector = new ReplayProtector({
  validateTimestamps: true,
  timestampToleranceSeconds: 300,
  trackNonces: true,
  nonceTtlMs: 600000,
  checkIdempotencyKeys: true,
})

const check = protector.check(timestamp, nonce, idempotencyKey)
if (!check.allowed) {
  console.log('Replay detected:', check.reason)
}
```

## Circuit Breaker

The delivery engine uses a circuit breaker to protect failing endpoints:

```
Closed (normal) --[failures >= threshold]--> Open (blocked)
                                              |
                                        [timeout elapsed]
                                              |
                                              v
                                          Half-Open (testing)
                                              |
                    [successes >= threshold]---+---[failure]--> Open
                              |
                              v
                          Closed
```

```typescript
import { CircuitBreaker } from '@/lib/plugins/webhooks'

const cb = new CircuitBreaker({
  failureThreshold: 5,     // Open after 5 failures
  resetTimeoutMs: 60000,   // Try half-open after 1 minute
  successThreshold: 2,     // Close after 2 successes in half-open
})

cb.canDeliver('webhook-123') // true (closed)
cb.recordFailure('webhook-123') // 5 times...
cb.canDeliver('webhook-123') // false (open)
```

## Dead Letter Queue

Failed deliveries that exhaust all retries go to the dead letter queue:

```typescript
const dlq = engine.getDeadLetterQueue()

// List failed deliveries
const entries = dlq.list('webhook-123')

// Replay a failed delivery
const replayed = await engine.replayDeadLetter(entries[0].id, webhook)
```

## Webhook Management

### Update

```typescript
registry.update(webhook.id, {
  name: 'Updated Name',
  events: ['message.created', 'message.updated', 'message.deleted'],
})
```

### Enable / Disable / Pause

```typescript
registry.disable(webhook.id)  // Permanently disable
registry.pause(webhook.id)    // Temporarily pause
registry.enable(webhook.id)   // Re-enable
```

### Secret Rotation

```typescript
const newSecret = registry.rotateSecret(webhook.id)
// Update your server with the new secret
```

### Event Subscription Management

```typescript
registry.addEvents(webhook.id, ['reaction.added'])
registry.removeEvents(webhook.id, ['message.deleted'])
```

### Lifecycle Events

```typescript
const unsubscribe = registry.onEvent((event, webhook) => {
  console.log(`${event}: ${webhook.name}`)
})
// Events: webhook.created, webhook.updated, webhook.deleted,
//         webhook.enabled, webhook.disabled, webhook.secret_rotated
```

## SSRF Protection

The delivery engine blocks requests to private/internal URLs:

- `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`
- Private ranges: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Link-local: `169.254.x.x`
- Cloud metadata: `metadata.google.internal`

## Rate Limiting

Incoming webhooks are rate-limited per token:

- **Default**: 60 requests/minute with 10 burst allowance
- Configurable per webhook via `rateLimit` field

## Payload Size Limits

| Limit | Value |
|-------|-------|
| Incoming payload | 64 KB |
| Outgoing payload | 256 KB |
| Message content | 4000 chars |
| Embeds per message | 10 |
| Attachments per message | 10 |
| Embed fields | 25 |
