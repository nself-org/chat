# Plugin System

nself-chat is designed with modularity in mind. Many features can be extracted as **nself-plugins** for flexible deployment.

---

## Overview

The plugin system allows you to:

- **Add features** without modifying core code
- **Remove unused features** to reduce bundle size
- **Share features** across multiple projects
- **Version features** independently
- **Create custom features** using the plugin API

---

## Plugin Architecture

```
@nself/plugin-{name}/
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── graphql/          # GraphQL operations
│   └── types.ts          # TypeScript types
├── package.json
└── README.md
```

---

## Available Plugins (32 Total)

### Core Communication Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **Channels** | `@nself/plugin-channels` | Channel management | None |
| **Direct Messages** | `@nself/plugin-dm` | 1-on-1 messaging | None |
| **Threads** | `@nself/plugin-threads` | Threaded replies | Channels |
| **Reactions** | `@nself/plugin-reactions` | Emoji reactions | None |
| **Mentions** | `@nself/plugin-mentions` | @user mentions | None |
| **Search** | `@nself/plugin-search` | Full-text search | None |

### Media & Files Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **File Upload** | `@nself/plugin-files` | File attachments | None |
| **Voice Messages** | `@nself/plugin-voice` | Audio recording | Files |
| **Video Calls** | `@nself/plugin-video` | Video conferencing | WebRTC |
| **Screen Share** | `@nself/plugin-screen-share` | Screen sharing | Video |
| **Media Gallery** | `@nself/plugin-gallery` | Media viewer | Files |
| **GIF Picker** | `@nself/plugin-gifs` | Giphy/Tenor | None |
| **Stickers** | `@nself/plugin-stickers` | Sticker packs | None |

### Rich Content Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **Polls** | `@nself/plugin-polls` | Create & vote | None |
| **Code Blocks** | `@nself/plugin-code` | Syntax highlighting | None |
| **Link Previews** | `@nself/plugin-unfurl` | URL unfurling | None |
| **Custom Emoji** | `@nself/plugin-emoji` | Custom emoji | Reactions |
| **Markdown** | `@nself/plugin-markdown` | Rich text | None |

### Automation Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **Bots** | `@nself/plugin-bots` | Bot SDK | Webhooks |
| **Webhooks** | `@nself/plugin-webhooks` | Incoming/outgoing | None |
| **Slash Commands** | `@nself/plugin-commands` | /commands | None |
| **Workflows** | `@nself/plugin-workflows` | Automation | Webhooks |
| **Reminders** | `@nself/plugin-reminders` | Set reminders | None |
| **Scheduled Messages** | `@nself/plugin-scheduled` | Send later | None |

### Authentication Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **ID.me** | `@nself/plugin-idme` | Identity verification | OAuth |
| **Phone Auth** | `@nself/plugin-phone-auth` | SMS OTP | None |
| **OAuth** | `@nself/plugin-oauth` | Social login | None |
| **MFA** | `@nself/plugin-mfa` | Two-factor auth | None |

### Admin & Analytics Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **Analytics** | `@nself/plugin-analytics` | Usage metrics | None |
| **Audit Logs** | `@nself/plugin-audit` | Activity logging | None |
| **Moderation** | `@nself/plugin-moderation` | Content moderation | None |
| **Compliance** | `@nself/plugin-compliance` | GDPR, retention | Audit |

### Platform Plugins

| Plugin | Package | Description | Dependencies |
|--------|---------|-------------|--------------|
| **Desktop** | `@nself/plugin-desktop` | Tauri/Electron | None |
| **Mobile** | `@nself/plugin-mobile` | Capacitor | None |
| **PWA** | `@nself/plugin-pwa` | Service worker | None |
| **Offline** | `@nself/plugin-offline` | Offline mode | PWA |

---

## Plugin Details

### @nself/plugin-voice

Voice message recording and playback.

**Features:**
- Audio recording via MediaRecorder API
- Waveform visualization
- Playback controls
- Audio compression
- Duration limits

**Installation:**
```bash
pnpm add @nself/plugin-voice
```

**Usage:**
```typescript
import { VoicePlugin, VoiceRecorder, VoicePlayer } from '@nself/plugin-voice'

// Register plugin
app.use(VoicePlugin)

// Use components
<VoiceRecorder onComplete={handleRecording} maxDuration={300} />
<VoicePlayer src={audioUrl} waveform={waveformData} />
```

**Configuration:**
```typescript
VoicePlugin.configure({
  maxDuration: 300,      // 5 minutes
  format: 'webm',        // audio format
  sampleRate: 44100,     // sample rate
  bitRate: 128000,       // bit rate
  showWaveform: true,    // show visualization
})
```

---

### @nself/plugin-video

Video calling and conferencing.

**Features:**
- 1-on-1 video calls
- Group video calls (up to 50 participants)
- Screen sharing
- Virtual backgrounds
- Call recording
- Noise suppression

**Installation:**
```bash
pnpm add @nself/plugin-video
```

**Usage:**
```typescript
import { VideoPlugin, VideoCall, VideoRoom } from '@nself/plugin-video'

// Start a call
<VideoCall
  roomId="meeting-123"
  userId={user.id}
  onEnd={handleEndCall}
/>

// Join a room
<VideoRoom
  roomId="room-456"
  participants={participants}
/>
```

**Configuration:**
```typescript
VideoPlugin.configure({
  provider: 'livekit',   // or 'twilio', 'daily', 'custom'
  maxParticipants: 50,
  recording: {
    enabled: true,
    storage: 's3'
  },
  features: {
    screenShare: true,
    virtualBackground: true,
    noiseSuppression: true
  }
})
```

---

### @nself/plugin-bots

Bot SDK for creating custom bots.

**Features:**
- Bot account creation
- Command handling
- Event subscriptions
- Rich responses
- Bot marketplace

**Installation:**
```bash
pnpm add @nself/plugin-bots
```

**Usage:**
```typescript
import { BotPlugin, Bot, BotBuilder } from '@nself/plugin-bots'

// Create a bot
const myBot = BotBuilder.create('my-bot')
  .name('My Bot')
  .avatar('🤖')
  .command('hello', async (ctx) => ({
    type: 'message',
    content: `Hello, ${ctx.user.displayName}!`
  }))
  .onMessage(async (ctx) => {
    if (ctx.message.content.includes('help')) {
      return { type: 'message', content: 'How can I help?' }
    }
    return null
  })
  .build()

// Register bot
BotPlugin.register(myBot)
```

**Bot Interface:**
```typescript
interface Bot {
  id: string
  name: string
  description: string
  avatar: string
  version: string

  getCommands(): BotCommand[]
  onMessage(ctx: BotContext): Promise<BotResponse | null>
  onCommand(cmd: string, args: string[], ctx: BotContext): Promise<BotResponse>
  onMention(ctx: BotContext): Promise<BotResponse>
  onMemberJoin?(ctx: BotContext): Promise<BotResponse | null>
}
```

---

### @nself/plugin-idme

ID.me identity verification.

**Features:**
- Military verification
- Veteran verification
- First responder verification
- Government employee verification
- Teacher/student verification
- Nurse verification
- Verification badges

**Installation:**
```bash
pnpm add @nself/plugin-idme
```

**Usage:**
```typescript
import { IDmePlugin, IDmeButton, useIDmeVerification } from '@nself/plugin-idme'

// Verification button
<IDmeButton
  groups={['military', 'veteran']}
  onVerified={handleVerified}
/>

// Check verification status
const { isVerified, groups, badges } = useIDmeVerification(userId)
```

**Configuration:**
```typescript
IDmePlugin.configure({
  clientId: process.env.IDME_CLIENT_ID,
  clientSecret: process.env.IDME_CLIENT_SECRET,
  environment: 'production',
  scopes: ['military', 'veteran', 'first_responder'],
  badgeDisplay: true
})
```

---

### @nself/plugin-polls

Interactive polls and voting.

**Features:**
- Multiple choice polls
- Anonymous voting
- Time-limited polls
- Results visualization
- Poll analytics

**Installation:**
```bash
pnpm add @nself/plugin-polls
```

**Usage:**
```typescript
import { PollPlugin, PollCreator, PollDisplay, usePoll } from '@nself/plugin-polls'

// Create a poll
<PollCreator
  onSubmit={handleCreatePoll}
  maxOptions={10}
/>

// Display a poll
<PollDisplay
  pollId={poll.id}
  onVote={handleVote}
/>
```

---

### @nself/plugin-analytics

Usage analytics and metrics.

**Features:**
- Message statistics
- User activity tracking
- Channel analytics
- Search analytics
- Real-time dashboards
- Export capabilities

**Installation:**
```bash
pnpm add @nself/plugin-analytics
```

**Usage:**
```typescript
import { AnalyticsPlugin, AnalyticsDashboard, useAnalytics } from '@nself/plugin-analytics'

// Dashboard component
<AnalyticsDashboard
  dateRange={{ start, end }}
  metrics={['messages', 'users', 'channels']}
/>

// Hook usage
const { trackEvent, getMetrics } = useAnalytics()
trackEvent('message_sent', { channelId, userId })
```

---

### @nself/plugin-audit

Audit logging and compliance.

**Features:**
- All user actions logged
- Admin action tracking
- Search and filter logs
- Export for compliance
- Retention policies
- Real-time log streaming

**Installation:**
```bash
pnpm add @nself/plugin-audit
```

**Usage:**
```typescript
import { AuditPlugin, AuditLogViewer, useAuditLog } from '@nself/plugin-audit'

// View audit logs
<AuditLogViewer
  filters={{ userId, action, dateRange }}
  onExport={handleExport}
/>

// Log custom events
const { logEvent } = useAuditLog()
logEvent('custom_action', { details })
```

---

## Creating Custom Plugins

### Plugin Structure

```typescript
// src/index.ts
import type { Plugin, PluginContext } from '@nself/core'

export interface MyPluginConfig {
  option1: string
  option2: boolean
}

export const MyPlugin: Plugin<MyPluginConfig> = {
  name: 'my-plugin',
  version: '1.0.0',

  // Called when plugin is registered
  install(ctx: PluginContext, config: MyPluginConfig) {
    // Register components
    ctx.components.register('MyComponent', MyComponent)

    // Register hooks
    ctx.hooks.register('useMyHook', useMyHook)

    // Add GraphQL operations
    ctx.graphql.register(MY_QUERIES, MY_MUTATIONS)

    // Subscribe to events
    ctx.events.on('message:created', handleMessage)
  },

  // Called when plugin is uninstalled
  uninstall(ctx: PluginContext) {
    ctx.events.off('message:created', handleMessage)
  }
}
```

### Plugin Context API

```typescript
interface PluginContext {
  // Component registration
  components: {
    register(name: string, component: React.FC): void
    unregister(name: string): void
  }

  // Hook registration
  hooks: {
    register(name: string, hook: Function): void
    unregister(name: string): void
  }

  // GraphQL operations
  graphql: {
    register(queries: DocumentNode, mutations?: DocumentNode): void
    extend(schema: string): void
  }

  // Event system
  events: {
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
    emit(event: string, data: any): void
  }

  // Storage
  storage: {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    remove(key: string): Promise<void>
  }

  // Configuration
  config: {
    get<T>(key: string): T
    set(key: string, value: any): void
  }
}
```

### Publishing Plugins

```bash
# Build plugin
pnpm build

# Publish to npm
pnpm publish --access public
```

---

## Installing Plugins

### Via npm/pnpm

```bash
pnpm add @nself/plugin-polls @nself/plugin-voice @nself/plugin-bots
```

### Registration

```typescript
// src/plugins.ts
import { registerPlugins } from '@nself/core'
import { PollPlugin } from '@nself/plugin-polls'
import { VoicePlugin } from '@nself/plugin-voice'
import { BotPlugin } from '@nself/plugin-bots'

registerPlugins([
  PollPlugin.configure({ /* config */ }),
  VoicePlugin.configure({ /* config */ }),
  BotPlugin.configure({ /* config */ }),
])
```

### Via Setup Wizard

The setup wizard (Step 5: Features) allows enabling plugins visually.

---

## Plugin Compatibility

| Core Version | Plugin API Version |
|--------------|-------------------|
| 1.x | 1.x |
| 2.x | 2.x |

Plugins specify their compatible versions in `package.json`:

```json
{
  "peerDependencies": {
    "@nself/core": "^1.0.0"
  }
}
```

---

## Related Documentation

- [Plugins List](Plugins-List)
- [Creating Plugins](Plugins-Creating)
- [Feature Flags](Feature-Flags)
- [Configuration](Configuration)
