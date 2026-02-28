# Getting Started with nChat Plugin Development

This guide walks you through creating, registering, and installing your first nChat plugin.

## Prerequisites

- Node.js 20+
- pnpm 9.15+
- nChat development environment running on port 3000

## Core Concepts

Every plugin in nChat starts with an **App Manifest** -- a JSON document that declares what your plugin does, what permissions it needs, and how it integrates with the platform.

## Step 1: Define Your App Manifest

Create a manifest that describes your plugin:

```typescript
import type { AppManifest } from '@/lib/plugins/app-contract'

const myPluginManifest: AppManifest = {
  schemaVersion: '1.0',
  appId: 'com.example.my-first-plugin',
  name: 'My First Plugin',
  description: 'A simple plugin that responds to messages',
  version: '1.0.0',
  developer: {
    name: 'Your Name',
    email: 'you@example.com',
    url: 'https://example.com',
  },
  scopes: ['read:messages', 'write:messages'],
  events: ['message.created'],
  webhookUrl: 'https://your-server.com/webhook',
  commands: [
    {
      name: 'greet',
      description: 'Send a greeting message',
      arguments: [
        {
          name: 'name',
          description: 'Name to greet',
          type: 'string',
          required: false,
          default: 'World',
        },
      ],
    },
  ],
  categories: ['utility'],
}
```

### Manifest Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `schemaVersion` | Yes | Must be `"1.0"` |
| `appId` | Yes | Unique identifier (3-64 chars, lowercase, `[a-z0-9_.-]`) |
| `name` | Yes | Display name (1-64 chars) |
| `description` | Yes | Short description (1-200 chars) |
| `version` | Yes | Semver string (e.g., `"1.0.0"`) |
| `developer` | Yes | Object with `name` and `email` |
| `scopes` | Yes | Array of permission scopes |
| `events` | No | Event types to subscribe to |
| `webhookUrl` | No* | Webhook delivery URL (*required if `events` is set) |
| `commands` | No | Slash command definitions |
| `uiSurfaces` | No | UI surfaces: `message_action`, `channel_sidebar`, `settings_page`, `command_palette`, `message_composer` |
| `rateLimit` | No | Custom rate limit: `{ requestsPerMinute, burstAllowance }` |
| `categories` | No | Tags for discovery |

## Step 2: Validate the Manifest

Before registering, validate your manifest:

```typescript
import { validateManifest } from '@/lib/plugins/app-contract'

const result = validateManifest(myPluginManifest)
if (!result.valid) {
  console.error('Manifest errors:', result.errors)
} else {
  console.log('Manifest is valid')
}
```

Validation checks:
- All required fields are present and correctly typed
- `appId` matches the pattern `^[a-z][a-z0-9_.-]{2,63}$`
- `version` is valid semver
- All scopes and event types are recognized
- Commands have valid names and descriptions
- `webhookUrl` is present when events are subscribed

## Step 3: Register the App

Use the `AppLifecycleManager` to register your plugin:

```typescript
import { AppStore, AppLifecycleManager } from '@/lib/plugins/app-lifecycle'

const store = new AppStore()
const lifecycle = new AppLifecycleManager(store)

const registeredApp = lifecycle.registerApp(myPluginManifest, 'user-123')
console.log('Registered:', registeredApp.id)
console.log('Status:', registeredApp.status) // 'pending_review'
console.log('Client Secret:', registeredApp.clientSecret) // Save this securely
```

## Step 4: Approval and Installation

After registration, the app enters `pending_review` status. An admin approves it:

```typescript
// Admin approves the app
const approved = lifecycle.approveApp(registeredApp.id)
console.log('Status:', approved.status) // 'approved'

// Install into a workspace
const installation = lifecycle.installApp(
  registeredApp.id,
  'workspace-001',
  'admin-user-id',
  ['read:messages', 'write:messages'] // Grant specific scopes
)
console.log('Installation ID:', installation.id)
```

## Step 5: Obtain API Tokens

Authenticate your plugin to make API calls:

```typescript
import { AppTokenStore, AppAuthManager } from '@/lib/plugins/app-auth'

const tokenStore = new AppTokenStore()
const auth = new AppAuthManager(tokenStore)

const tokenResponse = auth.issueTokens(
  {
    appId: registeredApp.id,
    clientSecret: registeredApp.clientSecret,
    installationId: installation.id,
  },
  registeredApp,
  installation
)

console.log('Access Token:', tokenResponse.accessToken)
console.log('Expires In:', tokenResponse.expiresIn, 'seconds')
```

Use the access token in your API requests:

```
Authorization: Bearer nchat_at_xxxxx
```

## Step 6: Subscribe to Events

Set up event delivery to your webhook:

```typescript
import { EventSubscriptionStore, AppEventManager } from '@/lib/plugins/app-events'

const eventStore = new EventSubscriptionStore()
const eventManager = new AppEventManager(eventStore)

const subscription = eventManager.subscribe(
  registeredApp,
  installation,
  ['message.created', 'message.updated'],
  'https://your-server.com/webhook'
)
```

Events are delivered to your webhook URL as POST requests with:
- `X-Webhook-Signature`: HMAC-SHA256 signature
- `X-Webhook-Timestamp`: Unix timestamp
- `X-Delivery-Id`: Unique delivery ID
- `X-Event-Type`: Event type string

## Step 7: Register Slash Commands

Add interactive commands users can invoke:

```typescript
import { createSlashCommandEngine } from '@/lib/plugins/slash-commands'

const { registry, executor } = createSlashCommandEngine()

// Register a command for your app
registry.register({
  appId: 'com.example.my-first-plugin',
  name: 'greet',
  description: 'Send a greeting',
  args: [
    {
      name: 'name',
      description: 'Name to greet',
      type: 'string',
      required: false,
      default: 'World',
    },
  ],
  requiredRole: 'member',
  requiredScopes: ['write:messages'],
  allowedChannelTypes: ['public', 'private', 'direct', 'group'],
  isBuiltIn: false,
  enabled: true,
  handler: async (ctx) => {
    const name = ctx.args.name || 'World'
    return {
      success: true,
      message: `Hello, ${name}!`,
      visibility: 'channel',
    }
  },
})
```

Users invoke it by typing `/com.example.my-first-plugin:greet Alice` or simply `/greet Alice` if there is no name conflict.

## Next Steps

- [API Reference](./api-reference.md) -- Complete interface documentation
- [Slash Commands Guide](./slash-commands.md) -- Advanced command patterns
- [Webhooks Guide](./webhooks.md) -- Incoming and outgoing webhooks
- [Bot Development](./bots.md) -- Creating bot accounts
- [Workflow Automation](./workflows.md) -- Building automated pipelines
- [Examples](./examples.md) -- Full working plugin examples
