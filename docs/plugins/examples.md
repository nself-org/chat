# Plugin Examples

Complete, working examples that demonstrate each subsystem of the nChat plugin framework.

## Example 1: Weather Bot Plugin

A full plugin that registers an app, creates a bot, installs a slash command, and handles incoming webhooks from a weather API.

### Step 1: Register the App

```typescript
import { validateManifest } from '@/lib/plugins/app-contract'
import { AppStore, AppLifecycleManager } from '@/lib/plugins/app-lifecycle'
import type { AppManifest } from '@/lib/plugins/app-contract'

const manifest: AppManifest = {
  schemaVersion: '1.0',
  appId: 'com.example.weather-bot',
  name: 'Weather Bot',
  description: 'Real-time weather updates and forecasts',
  version: '1.0.0',
  developer: {
    name: 'Weather Corp',
    email: 'dev@weathercorp.example.com',
    url: 'https://weathercorp.example.com',
  },
  scopes: ['read:messages', 'write:messages', 'read:channels'],
  events: ['message.created'],
  webhookUrl: 'https://weathercorp.example.com/nchat-webhook',
  commands: [
    {
      name: 'weather',
      description: 'Get current weather for a city',
      arguments: [
        { name: 'city', description: 'City name', type: 'string', required: true },
        { name: 'units', description: 'Temperature units', type: 'string', required: false, default: 'celsius' },
      ],
    },
    {
      name: 'forecast',
      description: 'Get 5-day forecast',
      arguments: [
        { name: 'city', description: 'City name', type: 'string', required: true },
      ],
    },
  ],
  categories: ['utility', 'weather'],
}

// Validate
const validation = validateManifest(manifest)
console.log('Valid:', validation.valid) // true

// Register
const store = new AppStore()
const lifecycle = new AppLifecycleManager(store)
const app = lifecycle.registerApp(manifest, 'user-admin')
console.log('App ID:', app.id)
console.log('Status:', app.status) // 'pending_review'
```

### Step 2: Approve and Install

```typescript
// Admin approves
const approved = lifecycle.approveApp(app.id)

// Install into workspace
const installation = lifecycle.installApp(
  app.id,
  'workspace-001',
  'user-admin',
  ['read:messages', 'write:messages', 'read:channels']
)
```

### Step 3: Obtain API Tokens

```typescript
import { AppTokenStore, AppAuthManager } from '@/lib/plugins/app-auth'

const tokenStore = new AppTokenStore()
const auth = new AppAuthManager(tokenStore)

const tokens = auth.issueTokens(
  {
    appId: app.id,
    clientSecret: app.clientSecret,
    installationId: installation.id,
  },
  app,
  installation
)

console.log('Access Token:', tokens.accessToken)
// Use: Authorization: Bearer nchat_at_xxxxx
```

### Step 4: Create the Bot Account

```typescript
import { BotAccountStore, BotIdentityManager } from '@/lib/plugins/bots'

const botStore = new BotAccountStore()
const identity = new BotIdentityManager(botStore)

const bot = identity.createBot({
  appId: manifest.appId,
  username: 'weather-bot',
  displayName: 'Weather Bot',
  description: 'Provides real-time weather updates',
  avatarUrl: 'https://weathercorp.example.com/bot-icon.png',
  botType: 'utility',
  version: '1.0.0',
  createdBy: 'user-admin',
})
```

### Step 5: Register Slash Commands

```typescript
import { createSlashCommandEngine } from '@/lib/plugins/slash-commands'

const { registry, executor } = createSlashCommandEngine()

registry.register({
  appId: manifest.appId,
  name: 'weather',
  description: 'Get current weather for a city',
  usage: '/weather <city> [units]',
  args: [
    {
      name: 'city',
      description: 'City name',
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    {
      name: 'units',
      description: 'Temperature units',
      type: 'string',
      required: false,
      default: 'celsius',
      choices: ['celsius', 'fahrenheit'],
    },
  ],
  requiredRole: 'member',
  requiredScopes: ['read:channels'],
  allowedChannelTypes: ['public', 'private', 'direct', 'group'],
  isBuiltIn: false,
  enabled: true,
  handler: async (ctx) => {
    const city = ctx.args.city as string
    const units = (ctx.args.units as string) || 'celsius'
    // In production, call a weather API here
    return {
      success: true,
      message: `Weather in ${city}: 22 degrees ${units}, partly cloudy`,
      visibility: 'channel',
    }
  },
})

// Test execution
const result = await executor.execute('/weather London celsius', {
  userId: 'user-123',
  username: 'alice',
  userRole: 'member',
  channelId: 'channel-general',
  channelType: 'public',
  grantedScopes: ['read:channels'],
})

console.log(result.success) // true
console.log(result.handlerResult?.message)
// "Weather in London: 22 degrees celsius, partly cloudy"
```

### Step 6: Set Up Incoming Webhook

```typescript
import { WebhookStore, WebhookRegistry, IncomingWebhookProcessor } from '@/lib/plugins/webhooks'

const webhookStore = new WebhookStore()
const webhookRegistry = new WebhookRegistry(webhookStore, 'https://app.nchat.dev')

// Create incoming webhook for weather alerts
const webhook = webhookRegistry.createIncoming(
  {
    name: 'Weather Alerts',
    description: 'Severe weather alerts from Weather API',
    channelId: 'channel-weather-alerts',
    avatarUrl: 'https://weathercorp.example.com/alert-icon.png',
    defaultUsername: 'Weather Alert',
  },
  'user-admin'
)

console.log('Webhook URL:', webhook.url)
// External service posts weather alerts to this URL

// Set up the processor
const processor = new IncomingWebhookProcessor(
  async (params) => {
    return { messageId: 'msg-new-' + Date.now() }
  },
  { maxRequests: 60, windowSeconds: 60, burstAllowance: 10 }
)

processor.registerWebhook(webhook)

// Process an incoming alert
const incomingResult = await processor.process({
  token: webhook.token,
  body: {
    content: 'Severe thunderstorm warning for New York area.',
    username: 'Weather Service',
  },
  headers: {},
  timestamp: Date.now(),
})

console.log('Accepted:', incomingResult.accepted)
```

---

## Example 2: GitHub Integration Plugin

A plugin that subscribes to GitHub events via outgoing webhooks and provides a `/deploy` slash command.

### App Registration

```typescript
import { validateManifest } from '@/lib/plugins/app-contract'
import { AppStore, AppLifecycleManager } from '@/lib/plugins/app-lifecycle'
import type { AppManifest } from '@/lib/plugins/app-contract'

const githubManifest: AppManifest = {
  schemaVersion: '1.0',
  appId: 'com.example.github-integration',
  name: 'GitHub Integration',
  description: 'GitHub notifications and deployment commands',
  version: '2.0.0',
  developer: {
    name: 'DevTools Inc',
    email: 'support@devtools.example.com',
  },
  scopes: ['read:messages', 'write:messages', 'read:channels', 'write:webhooks'],
  events: ['message.created'],
  webhookUrl: 'https://devtools.example.com/github-hook',
  commands: [
    {
      name: 'deploy',
      description: 'Deploy a branch to an environment',
      arguments: [
        { name: 'branch', description: 'Git branch', type: 'string', required: true },
        { name: 'env', description: 'Target environment', type: 'string', required: true },
      ],
    },
  ],
}

const validation = validateManifest(githubManifest)
console.log('Valid:', validation.valid) // true

const store = new AppStore()
const lifecycle = new AppLifecycleManager(store)
const app = lifecycle.registerApp(githubManifest, 'user-admin')
lifecycle.approveApp(app.id)

const installation = lifecycle.installApp(
  app.id,
  'workspace-001',
  'user-admin',
  ['read:messages', 'write:messages', 'read:channels', 'write:webhooks']
)
```

### Outgoing Webhook for GitHub Events

```typescript
import { WebhookStore, WebhookRegistry, WebhookDeliveryEngine } from '@/lib/plugins/webhooks'

const webhookStore = new WebhookStore()
const webhookRegistry = new WebhookRegistry(webhookStore, 'https://app.nchat.dev')

const outgoing = webhookRegistry.createOutgoing(
  {
    name: 'GitHub Event Forwarder',
    description: 'Forward nChat events to GitHub webhook',
    url: 'https://devtools.example.com/nchat-events',
    events: ['message.created', 'message.updated'],
    filters: {
      channelIds: ['channel-deployments'],
      excludeBots: true,
    },
    retryConfig: {
      maxAttempts: 5,
      initialDelayMs: 1000,
    },
  },
  'user-admin'
)

console.log('Outgoing Webhook Secret:', outgoing.secret)
```

### Delivery with Signature Verification

```typescript
import { WebhookDeliveryEngine, generateSignature, verifySignature } from '@/lib/plugins/webhooks'

const engine = new WebhookDeliveryEngine(
  async (url, init) => {
    // In production, use fetch()
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"received": true}',
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
    channelId: 'channel-deployments',
    content: 'Deploy v2.0 to staging',
  },
})

console.log('Delivery status:', delivery.status)
// 'delivered', 'failed', 'retrying', or 'dead_letter'

// On the receiving end, verify the signature
const body = '{"event":"message.created"}'
const sig = generateSignature(body, outgoing.secret)
// sig is a string like "sha256=abc123..."
const verified = verifySignature(body, sig, outgoing.secret)
console.log('Signature valid:', verified.valid) // true
```

### Deploy Command

```typescript
import { createSlashCommandEngine } from '@/lib/plugins/slash-commands'

const { registry, executor } = createSlashCommandEngine()

registry.register({
  appId: 'com.example.github-integration',
  name: 'deploy',
  description: 'Deploy a branch to an environment',
  usage: '/deploy <branch> <env>',
  args: [
    {
      name: 'branch',
      description: 'Git branch name',
      type: 'string',
      required: true,
      pattern: '^[a-zA-Z0-9/_.-]+$',
    },
    {
      name: 'env',
      description: 'Target environment',
      type: 'string',
      required: true,
      choices: ['dev', 'staging', 'production'],
    },
  ],
  requiredRole: 'moderator',
  requiredScopes: ['write:messages'],
  allowedChannelTypes: ['public', 'private'],
  isBuiltIn: false,
  enabled: true,
  handler: async (ctx) => {
    const branch = ctx.args.branch as string
    const env = ctx.args.env as string

    if (env === 'production' && ctx.userRole !== 'admin' && ctx.userRole !== 'owner') {
      return {
        success: false,
        error: 'Only admins can deploy to production',
        visibility: 'ephemeral',
      }
    }

    return {
      success: true,
      message: `Deploying \`${branch}\` to **${env}**... Triggered by @${ctx.username}`,
      visibility: 'channel',
    }
  },
})

// Test
const deployResult = await executor.execute('/deploy main staging', {
  userId: 'user-devops',
  username: 'devops-lead',
  userRole: 'moderator',
  channelId: 'channel-deployments',
  channelType: 'public',
  grantedScopes: ['write:messages'],
})

console.log(deployResult.handlerResult?.message)
// "Deploying `main` to **staging**... Triggered by @devops-lead"
```

---

## Example 3: Automated Onboarding Workflow

A workflow that runs when a new member joins, waits for manager approval, then sets up their channels.

```typescript
import {
  WorkflowBuilder,
  WorkflowExecutionEngine,
  TriggerEngine,
  ApprovalGateManager,
  ApprovalStore,
} from '@/lib/plugins/workflows'

// Build the workflow
const onboarding = new WorkflowBuilder('Employee Onboarding', 'hr-admin')
  .description('Automated onboarding for new team members')
  .onEvent('member.joined')
  .addInput({
    name: 'department',
    type: 'string',
    required: true,
    description: 'Employee department',
  })
  .addStep('welcome', 'Send welcome message', {
    type: 'send_message',
    channelId: 'channel-general',
    content: 'Welcome to the team! We are setting up your workspace.',
  })
  .addStep('approval', 'Manager approval', {
    type: 'approval',
    approverIds: ['user-hr-manager'],
    message: 'Approve onboarding for new employee?',
    timeoutMs: 86400000,  // 24 hours
    minApprovals: 1,
    escalationUserIds: ['user-hr-director'],
  }, { dependsOn: ['welcome'] })
  .addStep('add-channels', 'Add to department channels', {
    type: 'channel_action',
    subAction: 'add_member',
    channelId: '{{inputs.department}}-channel',
    userId: '{{trigger.userId}}',
  }, { dependsOn: ['approval'] })
  .addStep('notify-team', 'Notify the team', {
    type: 'send_message',
    channelId: '{{inputs.department}}-channel',
    content: 'Please welcome our new team member!',
  }, { dependsOn: ['add-channels'] })
  .settings({
    maxExecutionTimeMs: 600000,
    continueOnFailure: false,
  })
  .scopes(['write:messages', 'write:channels'])
  .tags(['onboarding', 'hr'])
  .build()

// Set up the execution
const triggerEngine = new TriggerEngine()
triggerEngine.registerWorkflow(onboarding)

const executionEngine = new WorkflowExecutionEngine({
  sleepFn: async () => {},
  enableAudit: true,
})

// Handle approval requests
const approvalGate = new ApprovalGateManager(new ApprovalStore())

executionEngine.onApprovalRequest = (runId, stepId, action) => {
  approvalGate.createRequest(runId, stepId, onboarding.id, action)
}

// Simulate new member joining
const matches = triggerEngine.evaluateEvent('member.joined', {
  userId: 'new-employee-001',
  channelId: 'channel-general',
})

for (const match of matches) {
  const run = await executionEngine.startRun(
    match.workflow,
    match.triggerInfo,
    { department: 'engineering' }
  )
  console.log('Onboarding run status:', run.status)
  // 'waiting_approval' (paused at the approval step)
}
```

---

## Example 4: Rate Limiting and Scope Validation

Demonstrating the rate limiter and scope checking utilities.

### App Rate Limiting

```typescript
import { AppRateLimiter, DEFAULT_APP_RATE_LIMIT } from '@/lib/plugins/app-rate-limiter'

const limiter = new AppRateLimiter()

// Check rate limit
const result = limiter.check('com.example.weather-bot', DEFAULT_APP_RATE_LIMIT)
console.log('Allowed:', result.allowed)     // true
console.log('Remaining:', result.remaining) // 69 (60 + 10 burst - 1)

// Check with per-scope override
const configWithOverrides = {
  requestsPerMinute: 60,
  burstAllowance: 10,
  scopeOverrides: {
    'messages:send': { requestsPerMinute: 30 },
    'files:upload': { requestsPerMinute: 5 },
  },
}

const msgResult = limiter.check(
  'com.example.weather-bot',
  configWithOverrides,
  'messages:send'
)
console.log('Message send allowed:', msgResult.allowed)

// Check status without consuming
const status = limiter.status('com.example.weather-bot', DEFAULT_APP_RATE_LIMIT)
console.log('Current remaining:', status.remaining)

// Cleanup when done
limiter.destroy()
```

### Scope Checking

```typescript
import { hasScope, hasAllScopes, expandScopes, isValidScope } from '@/lib/plugins/app-contract'

// Check single scope
hasScope(['read:messages', 'write:messages'], 'read:messages')  // true
hasScope(['read:messages'], 'write:messages')                    // false

// Wildcard expansion
hasScope(['read:*'], 'read:messages')  // true (read:* expands to all read scopes)
hasScope(['admin:*'], 'admin:users')   // true

// Check multiple scopes
hasAllScopes(
  ['read:messages', 'write:messages', 'read:channels'],
  ['read:messages', 'read:channels']
)  // true

// Expand wildcards
const expanded = expandScopes(['read:*'])
// ['read:messages', 'read:channels', 'read:users', 'read:user_email', ...]

// Validate scope strings
isValidScope('read:messages')   // true
isValidScope('invalid:scope')   // false
```

---

## Example 5: Event Subscription and Delivery

Setting up event delivery from nChat to an external service.

```typescript
import { EventSubscriptionStore, AppEventManager } from '@/lib/plugins/app-events'
import { computeEventSignature, verifyEventSignature } from '@/lib/plugins/app-events'

const eventStore = new EventSubscriptionStore()
const eventManager = new AppEventManager(eventStore)

// Subscribe to events
const subscription = eventManager.subscribe(
  app,           // RegisteredApp
  installation,  // AppInstallation
  ['message.created', 'message.updated', 'reaction.added'],
  'https://weathercorp.example.com/nchat-webhook'
)

console.log('Subscription ID:', subscription.id)

// Dispatch an event (nChat calls this internally)
const appSecrets = new Map([
  [app.manifest.appId, app.clientSecret],
])

const deliveries = await eventManager.dispatchEvent(
  'message.created',
  {
    messageId: 'msg_001',
    channelId: 'channel-general',
    content: 'Hello!',
    authorId: 'user-123',
  },
  appSecrets
)

// Signature verification on the receiver side
const payload = '{"event":"message.created","data":{"messageId":"msg_001"}}'
const secret = 'your_client_secret'

const signature = computeEventSignature(payload, secret)
const isValid = verifyEventSignature(payload, signature, secret)
console.log('Signature valid:', isValid)  // true
```

---

## Example 6: Bot with Moderation

A bot with rate limiting and moderation controls.

```typescript
import {
  BotLifecycleManager,
  BotRateLimiter,
  BotModerationStore,
  BotModerationManager,
  DEFAULT_BOT_RATE_LIMITS,
  CAPABILITY_PRESET_SCOPES,
} from '@/lib/plugins/bots'

// BotLifecycleManager creates its own internal stores and managers
const lifecycle = new BotLifecycleManager()

// Create the bot
const modBot = lifecycle.createBot({
  appId: 'com.example.automod',
  username: 'auto-moderator',
  displayName: 'AutoMod',
  description: 'Automated content moderation',
  botType: 'moderation',
  version: '1.0.0',
  createdBy: 'user-admin',
})

// Install with moderator-level capability preset
const botInstall = lifecycle.installBot({
  botId: modBot.id,
  workspaceId: 'workspace-001',
  installedBy: 'user-admin',
  capabilityPreset: 'moderator',
  channelIds: ['channel-general', 'channel-random'],
})

// Rate limit the bot
const rateLimiter = new BotRateLimiter()
const rateResult = rateLimiter.check(
  modBot.id,
  DEFAULT_BOT_RATE_LIMITS,
  'messages:send',
  'channel-general'
)

if (!rateResult.allowed) {
  console.log('Rate limited! Retry after:', rateResult.retryAfterMs, 'ms')
}

// Apply moderation action using dedicated methods
const modStore = new BotModerationStore()
const moderation = new BotModerationManager(modStore)

// Reduce rate limits
const record = moderation.reduceRateLimits(
  modBot.id,
  'Bot sending too many messages during peak hours',
  'user-admin',
  0.5,  // reduction factor
  'workspace-001'
)

console.log('Moderation record:', record.id)

// Other moderation actions:
// moderation.warn(botId, reason, performedBy, workspaceId)
// moderation.restrict(botId, reason, performedBy, workspaceId, metadata)
// moderation.suspend(botId, reason, performedBy, durationMs, workspaceId)
// moderation.forceUninstall(botId, reason, performedBy, workspaceId)
// moderation.ban(botId, reason, performedBy)

// Cleanup
lifecycle.destroy()
```

---

## Example 7: Webhook Replay Protection

Verifying incoming webhooks with full replay protection.

```typescript
import {
  generateSignature,
  generateCompositeSignature,
  verifySignature,
  verifyWebhookRequest,
  ReplayProtector,
  createSigningHeaders,
} from '@/lib/plugins/webhooks'

const secret = 'whsec_my_webhook_secret'
const body = JSON.stringify({ event: 'deploy.completed', status: 'success' })

// Generate signing headers for outgoing delivery (timestamp is generated internally)
const headers = createSigningHeaders(body, secret)
console.log('Signature:', headers['x-webhook-signature'])
console.log('Timestamp:', headers['x-webhook-timestamp'])
console.log('Nonce:', headers['x-webhook-nonce'])

// On the receiving server: verify with replay protection
const protector = new ReplayProtector({
  validateTimestamps: true,
  timestampToleranceSeconds: 300,
  trackNonces: true,
  nonceTtlMs: 600000,
  checkIdempotencyKeys: true,
})

const verification = verifyWebhookRequest(
  body,
  headers,
  secret,
  protector
)

console.log('Valid:', verification.valid)     // true
console.log('Error:', verification.error)     // undefined

// Second delivery with same nonce is rejected (replay protection)
const replay = verifyWebhookRequest(body, headers, secret, protector)
console.log('Replay valid:', replay.valid)   // false
console.log('Replay error:', replay.error)   // 'Replay detected: ...'
```

---

## Example 8: Scheduled Workflow with Cron

A workflow that runs on a schedule to send daily reports.

```typescript
import {
  WorkflowBuilder,
  WorkflowScheduler,
  ScheduleStore,
  WorkflowExecutionEngine,
  parseCronExpression,
  getNextCronTime,
} from '@/lib/plugins/workflows'

// Build the scheduled workflow
const dailyReport = new WorkflowBuilder('Daily Activity Report', 'admin')
  .description('Generate and post daily channel activity summary')
  .onSchedule('0 18 * * 1-5', { timezone: 'UTC' })
  .addStep('fetch-stats', 'Fetch activity stats', {
    type: 'http_request',
    url: 'https://api.nchat.dev/internal/stats/daily',
    method: 'GET',
  }, { outputKey: 'stats' })
  .addStep('post-report', 'Post report to channel', {
    type: 'send_message',
    channelId: 'channel-reports',
    content: 'Daily Activity Report generated.',
  }, { dependsOn: ['fetch-stats'] })
  .settings({
    maxExecutionTimeMs: 120000,
    maxRetryAttempts: 2,
  })
  .build()

// Schedule it
const scheduler = new WorkflowScheduler(new ScheduleStore())
const schedule = scheduler.createSchedule(dailyReport)

console.log('Next run:', schedule.nextRunAt)

// Check when it will fire next
const nextTime = getNextCronTime('0 18 * * 1-5', new Date(), 'UTC')
console.log('Next execution:', nextTime?.toISOString())

// Parse the cron expression for inspection
const fields = parseCronExpression('0 18 * * 1-5')
console.log('Minute:', fields?.minute)      // [0]
console.log('Hour:', fields?.hour)          // [18]
console.log('Day of week:', fields?.dayOfWeek)  // [1,2,3,4,5]

// Set up the execution callback
const engine = new WorkflowExecutionEngine({
  sleepFn: async () => {},
})

scheduler.onScheduleFired = async (sched) => {
  const run = await engine.startRun(dailyReport, {
    type: 'schedule',
    scheduledTime: new Date().toISOString(),
  })
  scheduler.updateLastRunStatus(sched.id, run.status)
}

// Process tick (in production, runs automatically via scheduler.start())
const fired = scheduler.tick(new Date('2026-02-09T18:00:00Z'))
console.log('Schedules fired:', fired.length)

// Cleanup
scheduler.stop()
```
