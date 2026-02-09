# Bot Development Guide

Bots are automated accounts that interact with nChat on behalf of an app. They have profiles, scopes, rate limits, and are subject to moderation controls.

## Bot Types

| Type | Purpose |
|------|---------|
| `automation` | Workflow and task automation |
| `notification` | Push notifications and alerts |
| `moderation` | Content moderation |
| `integration` | Third-party service integrations |
| `ai_assistant` | AI/ML powered assistants |
| `utility` | General utility bots |
| `custom` | Custom bots |

## Creating a Bot Account

Every bot belongs to a parent app (from the app contract system):

```typescript
import { BotIdentityManager, BotAccountStore } from '@/lib/plugins/bots'

const store = new BotAccountStore()
const identity = new BotIdentityManager(store)

const bot = identity.createBot({
  appId: 'com.example.weather',
  username: 'weather-bot',
  displayName: 'Weather Bot',
  description: 'Provides real-time weather updates',
  avatarUrl: 'https://example.com/weather-icon.png',
  botType: 'utility',
  version: '1.0.0',
  createdBy: 'user-123',
})

console.log('Bot ID:', bot.id)
console.log('Status:', bot.status) // 'active'
```

### Username Rules

- 3-32 characters
- Lowercase letters, numbers, and hyphens
- Must start with a letter
- Pattern: `^[a-z][a-z0-9-]{2,31}$`

## Bot Lifecycle

Bots are created with `active` status by default:

```
createBot() -> active -> suspended -> active
                 |                      |
                 v                      v
             disabled -> active     deleted (terminal)
                 |
                 v
             deleted (terminal)
```

Valid state transitions:

| From | To |
|------|----|
| `pending_review` | `active`, `suspended`, `deleted` |
| `active` | `suspended`, `disabled`, `deleted` |
| `suspended` | `active`, `deleted` |
| `disabled` | `active`, `deleted` |
| `deleted` | (none -- terminal) |

Note: The `pending_review` state is supported in the type system but `createBot()` initializes bots directly to `active` status.

## Installing a Bot

The `BotLifecycleManager` creates its own internal stores and managers:

```typescript
import { BotLifecycleManager } from '@/lib/plugins/bots'

const lifecycle = new BotLifecycleManager()

const installation = lifecycle.installBot({
  botId: bot.id,
  workspaceId: 'workspace-001',
  installedBy: 'admin-user-id',
  scopes: ['read:messages', 'write:messages'],
  channelIds: ['channel-weather'], // Restrict to specific channels
  config: { temperatureUnit: 'celsius' },
})
```

You can also install with a capability preset instead of explicit scopes:

```typescript
const installation = lifecycle.installBot({
  botId: bot.id,
  workspaceId: 'workspace-001',
  installedBy: 'admin-user-id',
  capabilityPreset: 'responder',
  channelIds: ['channel-weather'],
})
```

## Capability Presets

Use presets for common permission patterns:

```typescript
import { CAPABILITY_PRESET_SCOPES } from '@/lib/plugins/bots'

// Read-only bot: read:messages, read:channels, read:users
const readOnlyScopes = CAPABILITY_PRESET_SCOPES.read_only

// Responder bot: read + write:messages
const responderScopes = CAPABILITY_PRESET_SCOPES.responder

// Moderator bot: read + write + admin:moderation
const modScopes = CAPABILITY_PRESET_SCOPES.moderator

// Full access (requires admin approval)
const fullScopes = CAPABILITY_PRESET_SCOPES.full_access
```

## Scope Validation

Bot scopes support channel-level restrictions. Use `BotScopeManager` and its internal `BotScopeValidator`:

```typescript
import { BotScopeManager } from '@/lib/plugins/bots'

const scopeManager = new BotScopeManager()
const validator = scopeManager.getValidator()

// Check if a bot installation has scope for a specific channel
const hasScope = validator.hasScope(installation, 'write:messages', 'channel-weather')

// Check all required scopes at once
const hasAll = validator.hasAllScopes(installation, ['read:messages', 'write:messages'])

// Validate that requested scopes don't exceed manifest declarations
const validation = validator.validateAgainstManifest(
  ['admin:channels'],               // Requested scopes
  ['read:messages', 'write:messages'] // App's manifest scopes
)
// validation.valid === false, validation.violations === ['admin:channels']

// Enforce a scope (throws BotScopeError if missing)
scopeManager.enforceScope(installation, 'write:messages', 'channel-weather')
```

## Rate Limiting

Bots have three levels of rate limiting:

1. **Global**: Overall requests per minute
2. **Per-channel**: Messages per minute per channel
3. **Per-endpoint**: Specific limits for different API operations

```typescript
import { BotRateLimiter, DEFAULT_BOT_RATE_LIMITS } from '@/lib/plugins/bots'

const rateLimiter = new BotRateLimiter()

const result = rateLimiter.check(
  bot.id,
  DEFAULT_BOT_RATE_LIMITS,
  'messages:send',
  'channel-general'
)

if (!result.allowed) {
  console.log('Rate limited:', result.limitType)
  console.log('Retry after:', result.retryAfterMs, 'ms')
}
```

### Default Rate Limits

| Endpoint | Limit |
|----------|-------|
| Global | 60 req/min + 10 burst |
| Per-channel messages | 10/min |
| `messages:send` | 30/min + 5 burst |
| `messages:edit` | 20/min |
| `messages:delete` | 10/min |
| `reactions:add` | 20/min |
| `files:upload` | 5/min |
| `channels:create` | 2/min |
| `users:lookup` | 30/min |

## Moderation

### Moderation Actions

| Action | Description |
|--------|-------------|
| `warn` | Issue a warning to the bot owner |
| `restrict` | Restrict bot to specific channels |
| `rate_reduce` | Reduce the bot's rate limits |
| `suspend` | Temporarily suspend the bot |
| `force_uninstall` | Force uninstall from workspace |
| `ban` | Permanently ban the bot |

### Applying Moderation

Each moderation action has a dedicated method:

```typescript
import { BotModerationManager, BotModerationStore } from '@/lib/plugins/bots'

const modStore = new BotModerationStore()
const moderation = new BotModerationManager(modStore)

// Issue a warning
moderation.warn('bot-id', 'Minor policy violation', 'admin-user-id', 'workspace-001')

// Restrict to specific channels
moderation.restrict(
  'bot-id',
  'Spamming messages in multiple channels',
  'admin-user-id',
  'workspace-001',
  { restrictedChannels: ['channel-general'] }
)

// Suspend (with optional duration)
moderation.suspend(
  'bot-id',
  'Abuse detected',
  'admin-user-id',
  24 * 60 * 60 * 1000, // 24 hours
  'workspace-001'
)

// Reduce rate limits
moderation.reduceRateLimits('bot-id', 'High traffic', 'admin-user-id', 0.5)

// Force uninstall
moderation.forceUninstall('bot-id', 'Policy violation', 'admin-user-id', 'workspace-001')

// Permanent ban
moderation.ban('bot-id', 'Malicious activity', 'admin-user-id')

// Lift a moderation action
moderation.liftAction(record.id, 'admin-user-id')
```

### Abuse Detection

The system tracks abuse flags per bot:

```typescript
interface BotAbuseFlags {
  rateLimitViolations: number
  scopeEscalationAttempts: number
  spamScore: number
  unauthorizedChannelAttempts: number
  lastViolationAt?: string
  isFlagged: boolean
}
```

## Audit Logging

All bot actions are logged:

```typescript
type BotAuditEventType =
  | 'bot.created' | 'bot.updated' | 'bot.deleted'
  | 'bot.installed' | 'bot.uninstalled'
  | 'bot.enabled' | 'bot.disabled'
  | 'bot.suspended' | 'bot.unsuspended'
  | 'bot.scope_granted' | 'bot.scope_revoked'
  | 'bot.rate_limited' | 'bot.moderation_action'
  | 'bot.abuse_detected' | 'bot.version_updated'
  | 'bot.config_changed'
```

## Bot Profile Updates

```typescript
identity.updateProfile(bot.id, {
  displayName: 'Weather Pro Bot',
  description: 'Enhanced weather with forecasts',
  avatarUrl: 'https://example.com/weather-pro.png',
  botType: 'utility',
}, 'admin-user-id')
```

## Limits

| Constraint | Value |
|-----------|-------|
| Username length | 3-32 characters |
| Description length | Max 200 characters |
| Active channels per install | Max 500 |
| Scope grants per install | Max 50 |
