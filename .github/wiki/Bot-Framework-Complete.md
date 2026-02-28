# Complete Bot Framework Implementation

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Date**: February 1, 2026

## Overview

The nself-chat Bot Framework is a complete, production-ready system for building, managing, and deploying bots in the nchat platform. It provides a comprehensive SDK, bot manager, registry, and REST API for bot lifecycle management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Bot Framework                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Bot Registry │  │ Bot Manager  │  │  Bot API     │      │
│  │              │  │              │  │              │      │
│  │ - Register   │  │ - Lifecycle  │  │ - REST       │      │
│  │ - Discover   │  │ - Events     │  │ - GraphQL    │      │
│  │ - Search     │  │ - Commands   │  │ - Webhooks   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│         ┌─────────────────┴─────────────────┐               │
│         │                                   │               │
│  ┌──────▼──────┐  ┌──────────────┐  ┌──────▼──────┐        │
│  │  Bot SDK    │  │ Event System │  │ Command Sys │        │
│  │             │  │              │  │             │        │
│  │ - Builders  │  │ - Emitters   │  │ - Parser    │        │
│  │ - Responses │  │ - Handlers   │  │ - Registry  │        │
│  │ - Commands  │  │ - Routing    │  │ - Help      │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Bot Manager (`/src/lib/bots/bot-manager.ts`)

Central management system for all bots.

**Features:**

- Bot lifecycle (register, enable, disable, destroy)
- Event routing to bots
- Command dispatching
- Bot state management
- Error handling and auto-disable
- Statistics tracking

**Key Methods:**

```typescript
const manager = getBotManager()

// Lifecycle
await manager.registerBot(bot, config, manifest)
await manager.unregisterBot(botId)
await manager.enableBot(botId)
await manager.disableBot(botId)

// Event routing
await manager.handleMessage(context)
await manager.handleCommand(context)
await manager.handleUserJoin(context)
await manager.handleUserLeave(context)
await manager.handleReaction(context)

// Queries
const bot = manager.getBot(botId)
const allBots = manager.getAllBots()
const enabledBots = manager.getEnabledBots()
const stats = manager.getBotStats(botId)
```

### 2. Bot Registry (`/src/lib/bots/bot-registry.ts`)

Central registry for all available bots.

**Features:**

- Bot factory registration
- Bot discovery and search
- Category management
- Featured bots
- Bulk instantiation

**Key Methods:**

```typescript
// Registration
registerBotFactory(botId, factory, manifest, {
  category: 'Productivity',
  featured: true,
  tags: ['reminders', 'time-management'],
})

// Discovery
const bots = getRegisteredBots()
const featured = getFeaturedBots()
const byCategory = getBotsByCategory('Productivity')
const searchResults = searchBots('reminder')

// Instantiation
const bot = await instantiateBot(botId, config)
const bots = await instantiateBots([
  { botId: 'reminder-bot', config: {} },
  { botId: 'welcome-bot', config: {} },
])
```

### 3. Bot SDK (`/src/lib/bots/bot-sdk.ts`)

Fluent API for building bots.

**Example:**

```typescript
import { bot, command, response, embed } from '@/lib/bots'

export function createMyBot() {
  return bot('my-bot')
    .name('My Bot')
    .description('A helpful bot')
    .version('1.0.0')
    .permissions('read_messages', 'send_messages')

    .command(
      command('greet')
        .description('Greet a user')
        .stringArg('name', 'User name', true)
        .example('/greet Alice'),
      async (ctx, api) => {
        return response()
          .embed(embed().title('👋 Hello!').description(`Hi ${ctx.args.name}!`).color('#10B981'))
          .build()
      }
    )

    .onMessage(async (ctx, api) => {
      if (ctx.message.content.includes('hello')) {
        return response().text('Hello there! 👋').build()
      }
    })

    .onInit(async (instance, api) => {
      console.log('Bot initialized!')
    })

    .build()
}
```

## Implemented Bots

### 1. Reminder Bot (`/src/bots/reminder-bot/`)

Set reminders for yourself or your team.

**Commands:**

- `/remind <time> "<message>"` - Set a reminder
- `/reminders` - List your reminders
- `/cancelreminder <id>` - Cancel a reminder
- `/snooze <id> [time]` - Snooze a reminder
- `/remindchannel <time> "<message>"` - Set channel reminder

**Features:**

- Personal and channel reminders
- Snooze functionality
- Recurring reminders
- Persistent storage
- Auto-cleanup

### 2. Welcome Bot (`/src/bots/welcome-bot/`)

Automatically welcome new members.

**Commands:**

- `/setwelcome "<message>"` - Set welcome message
- `/testwelcome` - Preview welcome message
- `/disablewelcome` - Disable welcomes

**Features:**

- Customizable messages with variables
- Template system
- Per-channel configuration
- User mentions
- Member count display

### 3. Poll Bot (`/src/bots/poll-bot/`)

Create interactive polls and surveys.

**Commands:**

- `/poll "<question>" "<options>"` - Create a poll
- `/quickpoll "<question>"` - Yes/no poll
- `/pollresults <id>` - Show results
- `/endpoll <id>` - End poll early

**Features:**

- Multiple choice polls
- Yes/no quick polls
- Timed polls
- Vote reactions
- Results visualization

### 4. FAQ Bot (`/src/bots/faq-bot/`)

Answer frequently asked questions automatically.

**Commands:**

- `/faq <question>` - Search FAQ
- `/addfaq "<question>" "<answer>"` - Add FAQ
- `/removefaq <id>` - Remove FAQ
- `/editfaq <id> [fields]` - Edit FAQ
- `/listfaqs [category]` - List all FAQs

**Features:**

- Knowledge base management
- Keyword matching
- Auto-answer detection
- Categories and tags
- Related questions
- Import/export

### 5. Scheduler Bot (`/src/bots/scheduler-bot/`)

Schedule messages and recurring tasks.

**Commands:**

- `/schedule <when> "<message>"` - Schedule a message
- `/scheduled` - List scheduled messages
- `/cancelschedule <id>` - Cancel schedule
- `/recurring <interval> "<message>"` - Create recurring task
- `/recurringtasks` - List recurring tasks
- `/cancelrecurring <id>` - Cancel recurring task

**Features:**

- Scheduled messages
- Recurring tasks
- Per-user and per-channel
- Persistent storage
- Auto-execution

## REST API

### Bot Endpoints

```bash
# List all bots (installed and available)
GET /api/bots?type=all|installed|available&category=X&featured=true&query=X

# Install a bot
POST /api/bots
{
  "botId": "reminder-bot",
  "config": {
    "enabled": true,
    "channels": [],
    "settings": {}
  }
}

# Get bot details
GET /api/bots/:id

# Update bot config
PATCH /api/bots/:id
{
  "settings": { ... },
  "channels": ["channel-id"]
}

# Uninstall bot
DELETE /api/bots/:id

# Enable/disable bot
POST /api/bots/:id/enable
{
  "enabled": true
}

# Get bot logs
GET /api/bots/:id/logs?limit=100&offset=0
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "reminder-bot",
    "name": "Reminder Bot",
    "description": "Set reminders for yourself or your team",
    "version": "1.0.0",
    "enabled": true,
    "config": {
      "settings": {},
      "channels": []
    },
    "manifest": { ... },
    "stats": {
      "messagesHandled": 150,
      "commandsExecuted": 45,
      "eventsProcessed": 200,
      "errors": 0,
      "startedAt": "2026-02-01T00:00:00.000Z",
      "lastActivity": "2026-02-01T12:00:00.000Z"
    }
  }
}
```

## Bot Management UI

### Admin Components (`/src/components/admin/bots/`)

**1. BotManager.tsx** - Main bot listing with:

- Search and filters
- Sorting (name, status, activity)
- Pagination
- Quick actions
- Status indicators
- Statistics

**2. bot-management.tsx** - Re-export wrapper for BotManager

**Usage:**

```tsx
import { BotManagement } from '@/components/admin/bots/bot-management'

function AdminPage() {
  return (
    <BotManagement
      bots={bots}
      loading={loading}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleStatus={handleToggle}
      onViewLogs={handleViewLogs}
      onViewAnalytics={handleViewAnalytics}
      onRefresh={handleRefresh}
    />
  )
}
```

## Bot Development Guide

### Creating a New Bot

1. **Create bot directory:**

```bash
mkdir -p src/bots/my-bot
```

2. **Create manifest.json:**

```json
{
  "id": "my-bot",
  "name": "My Bot",
  "description": "A helpful bot",
  "version": "1.0.0",
  "author": "nself",
  "icon": "🤖",
  "permissions": ["read_messages", "send_messages"],
  "commands": [...],
  "settings": [...],
  "triggers": [...]
}
```

3. **Create index.ts:**

```typescript
import { bot, command } from '@/lib/bots'
import manifest from './manifest.json'

export function createMyBot() {
  return bot(manifest.id)
    .name(manifest.name)
    .description(manifest.description)
    .version(manifest.version)
    .permissions(...manifest.permissions)

    // Register commands
    .command(...)

    // Event handlers
    .onMessage(...)
    .onUserJoin(...)

    // Initialization
    .onInit(...)

    .build()
}

export default createMyBot
export { manifest }
```

4. **Register in bot-registry.ts:**

```typescript
import { default: createMyBot, manifest: myBotManifest } from '@/bots/my-bot'

registerBotFactory('my-bot', createMyBot, myBotManifest, {
  category: 'Productivity',
  featured: true,
  tags: ['automation']
})
```

### Command Builder API

```typescript
command('name')
  .description('Description')
  .aliases('alias1', 'alias2')
  .stringArg('arg1', 'Description', required)
  .numberArg('arg2', 'Description')
  .booleanArg('arg3', 'Description')
  .durationArg('time', 'Description')
  .choiceArg('choice', 'Description', [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ])
  .example('/name arg1 arg2')
  .cooldown(30)
```

### Response Builder API

```typescript
response()
  .text('Hello!')
  .embed(
    embed()
      .title('Title')
      .description('Description')
      .field('Name', 'Value', inline)
      .color('#10B981')
      .footer('Footer text')
      .timestamp()
  )
  .button(button('button-id').label('Click Me').style('primary').emoji('👍'))
  .build()
```

### Event Handlers

```typescript
// Message handler
.onMessage(async (ctx, api) => {
  if (ctx.isCommand) return // Skip commands

  // Handle message
  return response()...
})

// User join handler
.onUserJoin(async (ctx, api) => {
  await api.sendMessage(ctx.channel.id,
    response()
      .text(`Welcome ${ctx.user.displayName}!`)
      .build()
  )
})

// Reaction handler
.onReaction(async (ctx, api) => {
  if (ctx.reaction.emoji === '👍') {
    // Handle thumbs up
  }
})
```

### Bot API Reference

```typescript
// Messaging
await api.sendMessage(channelId, response)
await api.replyToMessage(messageId, response)
await api.editMessage(messageId, response)
await api.deleteMessage(messageId)

// Reactions
await api.addReaction(messageId, '👍')
await api.removeReaction(messageId, '👍')

// Channels
const channel = await api.getChannel(channelId)
const members = await api.getChannelMembers(channelId)

// Users
const user = await api.getUser(userId)
const mention = api.mentionUser(userId)

// Storage
await api.setStorage('key', value)
const value = await api.getStorage('key')
await api.deleteStorage('key')

// Scheduling
const scheduleId = await api.scheduleMessage(channelId, response, delay)
await api.cancelScheduledMessage(scheduleId)

// Config
const config = api.getBotConfig()
const manifest = api.getBotInfo()
```

## Testing

### Unit Tests

```typescript
import { createMyBot } from '@/bots/my-bot'
import { createMockServices } from '@/lib/bots'

describe('MyBot', () => {
  it('handles commands correctly', async () => {
    const bot = createMyBot()
    const api = createBotApi('my-bot', config, createMockServices())

    const context = createMockCommandContext({
      command: { name: 'greet', args: { name: 'Alice' } },
    })

    const response = await bot.onCommand(context, api)

    expect(response).toBeDefined()
    expect(response.content).toContain('Alice')
  })
})
```

## Deployment

### Production Checklist

- [ ] All bots registered in bot-registry.ts
- [ ] Bot manifests are complete
- [ ] Commands are documented
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Storage persistence enabled
- [ ] Logs configured
- [ ] Tests passing
- [ ] API endpoints secured
- [ ] Webhooks configured (if needed)

### Environment Variables

```bash
# Bot configuration
BOT_COMMAND_PREFIX=/
BOT_RATE_LIMIT_PER_MINUTE=60
BOT_TIMEOUT_MS=5000
BOT_SANDBOX_ENABLED=true

# Features
ENABLE_BOT_MARKETPLACE=true
ENABLE_CUSTOM_BOTS=true
```

## Monitoring

### Bot Statistics

Each bot tracks:

- Messages handled
- Commands executed
- Events processed
- Errors count
- Started at
- Last activity

Access via:

```typescript
const stats = manager.getBotStats(botId)
const allStats = manager.getAllStats()
```

### Error Handling

Bots auto-disable after:

- Error rate > 50%
- More than 10 events processed

Re-enable manually or fix issues.

## Security

### Permissions

All bots must declare permissions:

- `read_messages` - Read channel messages
- `send_messages` - Send messages
- `manage_messages` - Edit/delete messages
- `read_channels` - Read channel info
- `manage_channels` - Create/modify channels
- `read_users` - Read user profiles
- `mention_users` - Mention users
- `add_reactions` - Add reactions
- `manage_reactions` - Remove reactions
- `upload_files` - Upload files
- `use_webhooks` - Use webhooks
- `admin` - Full access

### Sandboxing

Bots run in isolated contexts with:

- Rate limiting
- Timeout protection
- Permission validation
- Error boundaries

## Roadmap

### v1.1.0 (Planned)

- [ ] Bot templates UI
- [ ] Visual bot builder
- [ ] Bot analytics dashboard
- [ ] Bot marketplace
- [ ] Custom bot upload

### v1.2.0 (Planned)

- [ ] AI-powered bots
- [ ] Natural language processing
- [ ] Bot-to-bot communication
- [ ] Advanced scheduling (cron)
- [ ] Multi-language support

## Support

### Documentation

- Main docs: `/docs/Bot-Framework-Complete.md`
- API docs: `/src/app/api-docs/bots/page.tsx`
- Examples: `/src/bots/*/`

### Common Issues

**Bot not responding:**

1. Check if bot is enabled
2. Check permissions
3. Check logs for errors
4. Verify command syntax

**Commands not working:**

1. Check command prefix (default: `/`)
2. Verify bot is in channel
3. Check rate limiting
4. Review command cooldown

**Storage issues:**

1. Check storage permissions
2. Verify data serialization
3. Check storage limits

## Contributing

### Adding a New Bot

1. Fork the repository
2. Create bot in `/src/bots/my-bot/`
3. Write tests
4. Update documentation
5. Submit pull request

### Code Style

- Use TypeScript
- Follow ESLint rules
- Write JSDoc comments
- Include examples
- Test thoroughly

## License

MIT License - See LICENSE file for details

---

**Complete Bot Framework v1.0.0**
Built with ❤️ by the nself team
