# Bot SDK Documentation - Complete Reference

**Version**: 1.0.0 (v0.7.0)
**Last Updated**: January 31, 2026

Complete guide to building intelligent bots for nself-chat using the Bot SDK.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [SDK API Reference](#sdk-api-reference)
3. [Event System](#event-system)
4. [Context API Reference](#context-api-reference)
5. [Response API Reference](#response-api-reference)
6. [State Management](#state-management)
7. [Bot Lifecycle](#bot-lifecycle)
8. [Debugging Bots](#debugging-bots)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Getting Started

### Prerequisites

**Required**:

- Node.js >= 20.0.0
- TypeScript >= 5.0.0
- nself-chat development environment

**Recommended**:

- VS Code with TypeScript extension
- Basic understanding of async/await
- Familiarity with React (for UI components)

### Installation

The Bot SDK is included with nself-chat. No additional installation needed.

```bash
# If setting up a new project
npm install @nself/bot-sdk

# Or use the included SDK in nself-chat
# Located at: src/lib/bots/bot-sdk.ts
```

### Your First Bot

Create a simple bot in 5 minutes:

```typescript
// src/lib/bots/my-first-bot.ts
import { bot, text, command } from '@/lib/bots/bot-sdk'

export const myFirstBot = bot('my-first-bot')
  .name('My First Bot')
  .description('A simple bot that says hello')
  .icon('👋')

  // Add a command
  .command('hello', 'Say hello', (ctx) => {
    return text(`Hello, ${ctx.user.displayName}! 👋`)
  })

  // Respond to mentions
  .onMention((ctx) => {
    return text(`You called? I'm ${ctx.bot.name}!`)
  })

  .build()
```

**Register your bot**:

```typescript
// src/lib/bots/index.ts
import { myFirstBot } from './my-first-bot'

export function initializeBots() {
  // Bot is automatically registered when .build() is called
  // Just import to ensure it's loaded
}
```

**Test it**:

1. Start the dev server: `pnpm dev`
2. Open nself-chat
3. Type `/hello` in any channel
4. See your bot respond!

### Bot Builder vs Class-Based Bots

**Two approaches to building bots**:

#### 1. Bot Builder (Recommended)

Fluent API, concise syntax:

```typescript
const myBot = bot('my-bot-id')
  .name('My Bot')
  .command('hello', 'Say hello', (ctx) => text('Hello!'))
  .build()
```

**Pros**:

- ✅ Less boilerplate
- ✅ Easier to read
- ✅ Type-safe
- ✅ Chainable

**Best for**: Most bots, quick prototypes, simple to medium complexity

#### 2. Class-Based Bots

Traditional OOP approach:

```typescript
import { BaseBot, Command } from '@/lib/bots/bot-sdk'

class MyBot extends BaseBot {
  constructor() {
    super('my-bot-id', 'My Bot', 'Description')
  }

  @Command('hello')
  async handleHello(ctx: CommandContext) {
    return text('Hello!')
  }
}

const myBot = new MyBot()
```

**Pros**:

- ✅ Familiar OOP patterns
- ✅ Better for complex state
- ✅ Easier testing (dependency injection)
- ✅ Decorator support

**Best for**: Complex bots, team projects, when you need inheritance

---

## SDK API Reference

### BotBuilder API

#### Creating a Bot

```typescript
import { bot } from '@/lib/bots/bot-sdk'

const builder = bot(id: string)
```

**Parameters**:

- `id` - Unique bot identifier (e.g., 'weather-bot')

**Returns**: `BotBuilder` instance

---

#### Configuration Methods

```typescript
.name(name: string): BotBuilder
```

Set bot display name.

```typescript
.description(description: string): BotBuilder
```

Set bot description (shown in bot list).

```typescript
.version(version: string): BotBuilder
```

Set semantic version (default: '1.0.0').

```typescript
.author(author: string): BotBuilder
```

Set bot author name.

```typescript
.icon(icon: string): BotBuilder
```

Set bot icon (emoji or image URL).

```typescript
.permissions(...permissions: BotPermission[]): BotBuilder
```

Set required permissions.

**Available Permissions**:

- `'read_messages'` - Read messages in channels
- `'send_messages'` - Send messages
- `'manage_messages'` - Edit/delete messages
- `'read_users'` - Access user information
- `'manage_channels'` - Modify channel settings
- `'admin'` - Full admin access

```typescript
.addPermission(permission: BotPermission): BotBuilder
```

Add a single permission.

```typescript
.channels(...channelIds: ChannelId[]): BotBuilder
```

Restrict bot to specific channels.

```typescript
.settings(settings: Record<string, unknown>): BotBuilder
```

Set bot configuration settings.

---

#### Command Methods

```typescript
.command(
  name: string,
  description: string,
  handler: CommandHandler
): BotBuilder
```

Add a slash command.

**Parameters**:

- `name` - Command name (without `/`)
- `description` - Help text
- `handler` - Function to handle the command

**Example**:

```typescript
.command('hello', 'Say hello', (ctx) => {
  return text(`Hello, ${ctx.user.displayName}!`)
})
```

```typescript
.command(
  cmd: CommandBuilder,
  handler: CommandHandler
): BotBuilder
```

Add a command with advanced options.

**Example**:

```typescript
import { command } from '@/lib/bots/bot-sdk'

.command(
  command('weather')
    .description('Get weather forecast')
    .option('location', 'City name', { required: true })
    .option('units', 'Temperature units', {
      choices: ['celsius', 'fahrenheit'],
      default: 'celsius'
    }),
  async (ctx) => {
    const location = ctx.args.location
    const units = ctx.args.units
    // Fetch and return weather
  }
)
```

---

#### Event Handlers

```typescript
.onMessage(handler: MessageHandler): BotBuilder
```

Handle all messages in channels the bot is in.

**Example**:

```typescript
.onMessage((ctx) => {
  if (ctx.message.content.includes('help')) {
    return text('Need help? Try /help')
  }
})
```

```typescript
.onMention(handler: MessageHandler): BotBuilder
```

Handle messages that mention the bot.

**Example**:

```typescript
.onMention((ctx) => {
  return text(`You mentioned me! How can I help?`)
})
```

```typescript
.onKeyword(keywords: string[], handler: MessageHandler): BotBuilder
```

Trigger on specific keywords.

**Example**:

```typescript
.onKeyword(['hello', 'hi', 'hey'], (ctx) => {
  return text('Hello! 👋')
})
```

```typescript
.onPattern(patterns: string[], handler: MessageHandler): BotBuilder
```

Trigger on regex patterns.

**Example**:

```typescript
.onPattern(['/bug-\\d+/', '/issue-\\d+/'], (ctx) => {
  // Extract issue number and fetch details
  const match = ctx.message.content.match(/(?:bug|issue)-(\d+)/)
  const issueId = match[1]
  return text(`Fetching issue #${issueId}...`)
})
```

```typescript
.onUserJoin(handler: UserEventHandler): BotBuilder
```

Handle user joining a channel.

```typescript
.onUserLeave(handler: UserEventHandler): BotBuilder
```

Handle user leaving a channel.

```typescript
.onReaction(handler: ReactionHandler): BotBuilder
```

Handle reactions added to messages.

```typescript
.onInit(handler: (bot, api) => void | Promise<void>): BotBuilder
```

Run code when bot initializes.

**Example**:

```typescript
.onInit(async (bot, api) => {
  console.log(`${bot.manifest.name} initialized`)
  // Load saved state
  const state = await api.getStorage('config')
  // Schedule periodic tasks
})
```

---

#### Building

```typescript
.build(): BotInstance
```

Build and register the bot. Call this as the last step.

**Returns**: `BotInstance` - The active bot instance

---

### CommandBuilder API

Create complex commands with options and arguments:

```typescript
import { command } from '@/lib/bots/bot-sdk'

const cmd = command(name: string)
  .description(desc: string)
  .option(name, description, options?)
  .build()
```

#### Command Options

```typescript
.option(
  name: string,
  description: string,
  options?: {
    type?: 'string' | 'number' | 'boolean'
    required?: boolean
    default?: any
    choices?: any[]
  }
): CommandBuilder
```

**Example**:

```typescript
command('create-poll')
  .description('Create a poll')
  .option('question', 'Poll question', { required: true })
  .option('duration', 'Duration in minutes', {
    type: 'number',
    default: 60,
  })
  .option('anonymous', 'Anonymous voting', {
    type: 'boolean',
    default: false,
  })
```

---

## Event System

### Event Types

Bots can subscribe to various events:

| Event          | Trigger                | Context Type      | Common Use Cases               |
| -------------- | ---------------------- | ----------------- | ------------------------------ |
| **Command**    | User types `/command`  | `CommandContext`  | Execute actions, fetch data    |
| **Message**    | Any message sent       | `MessageContext`  | Monitor keywords, auto-respond |
| **Mention**    | Bot is @mentioned      | `MessageContext`  | Help requests, Q&A             |
| **User Join**  | User joins channel     | `UserContext`     | Welcome messages, onboarding   |
| **User Leave** | User leaves channel    | `UserContext`     | Goodbye messages, cleanup      |
| **Reaction**   | Reaction added/removed | `ReactionContext` | Polls, bookmarks, votes        |

### Event Handling Patterns

#### 1. Simple Handler

```typescript
.onMessage((ctx) => {
  // Handle synchronously
  return text('Response')
})
```

#### 2. Async Handler

```typescript
.onMessage(async (ctx) => {
  // Async operations
  const data = await fetchData()
  return text(`Result: ${data}`)
})
```

#### 3. Conditional Handler

```typescript
.onMessage((ctx) => {
  if (ctx.message.content.startsWith('!')) {
    return text('Command detected')
  }
  // Return nothing to ignore
})
```

#### 4. Multiple Handlers

```typescript
.onMessage(handler1)
.onMessage(handler2)
.onMessage(handler3)
```

**Execution**: All handlers run in order. First non-null response is returned.

### Event Helpers

```typescript
import { matchesKeyword, matchesPattern, parseDuration, formatDuration } from '@/lib/bots/bot-sdk'
```

#### matchesKeyword

```typescript
matchesKeyword(text: string, keywords: string[]): boolean
```

Check if text contains any keyword (case-insensitive).

**Example**:

```typescript
if (matchesKeyword(ctx.message.content, ['help', 'support'])) {
  return text('How can I help you?')
}
```

#### matchesPattern

```typescript
matchesPattern(text: string, patterns: string[]): boolean
```

Check if text matches any regex pattern.

**Example**:

```typescript
if (matchesPattern(ctx.message.content, ['/bug-\\d+/', '/issue-\\d+/'])) {
  // Handle bug/issue reference
}
```

#### parseDuration

```typescript
parseDuration(text: string): number
```

Parse natural language duration to milliseconds.

**Examples**:

- `'30 minutes'` → 1800000
- `'2 hours'` → 7200000
- `'1 day'` → 86400000

#### formatDuration

```typescript
formatDuration(ms: number): string
```

Format milliseconds to human-readable duration.

**Example**:

```typescript
formatDuration(90000) // '1 minute 30 seconds'
```

---

## Context API Reference

### CommandContext

Provided to command handlers:

```typescript
interface CommandContext {
  // Command info
  command: string // Command name (without /)
  args: {
    [key: string]: any // Parsed arguments
    _raw: string // Raw argument string
  }

  // Message info
  message: {
    id: MessageId
    content: string
    channelId: ChannelId
    threadId?: string
    createdAt: Date
  }

  // User info
  user: {
    id: UserId
    displayName: string
    email: string
    avatarUrl?: string
    role: UserRole
  }

  // Channel info
  channel: {
    id: ChannelId
    name: string
    type: 'public' | 'private' | 'dm' | 'group_dm'
  }

  // Bot info
  bot: {
    id: string
    name: string
    manifest: BotManifest
  }

  // Helpers
  isMention: boolean // Is bot mentioned?
  isDM: boolean // Is this a DM?
}
```

### MessageContext

Provided to message handlers:

```typescript
interface MessageContext {
  // Same as CommandContext, plus:

  message: {
    // ... base fields
    attachments: Attachment[]
    mentions: User[]
    reactions: Reaction[]
    isEdited: boolean
    editedAt?: Date
    replyTo?: MessageId
  }

  // Thread info (if in thread)
  thread?: {
    id: string
    parentMessageId: MessageId
    participantCount: number
  }
}
```

### UserContext

Provided to user event handlers (join/leave):

```typescript
interface UserContext {
  // User who joined/left
  user: {
    id: UserId
    displayName: string
    email: string
    avatarUrl?: string
    role: UserRole
    joinedAt: Date // When they joined the workspace
  }

  // Channel context
  channel: {
    id: ChannelId
    name: string
    type: ChannelType
    memberCount: number
  }

  // Event type
  eventType: 'join' | 'leave'
}
```

### ReactionContext

Provided to reaction handlers:

```typescript
interface ReactionContext {
  // Reaction details
  reaction: {
    emoji: string
    userId: UserId
    messageId: MessageId
    createdAt: Date
  }

  // User who reacted
  user: {
    id: UserId
    displayName: string
    avatarUrl?: string
  }

  // Message that was reacted to
  message: {
    id: MessageId
    content: string
    authorId: UserId
    channelId: ChannelId
  }

  // Channel context
  channel: {
    id: ChannelId
    name: string
  }
}
```

---

## Response API Reference

### Response Builders

Import response builders:

```typescript
import {
  text,
  embed,
  error,
  success,
  info,
  warning,
  confirm,
  list,
  code,
  quote,
  button,
  select,
} from '@/lib/bots/bot-sdk'
```

### Basic Responses

#### text

```typescript
text(content: string): BotResponse
```

Simple text response.

**Example**:

```typescript
return text('Hello, world!')
```

#### error

```typescript
error(message: string): BotResponse
```

Error message (red styling).

```typescript
return error('Command failed: Invalid arguments')
```

#### success

```typescript
success(message: string): BotResponse
```

Success message (green styling).

```typescript
return success('Poll created successfully!')
```

#### info

```typescript
info(message: string): BotResponse
```

Info message (blue styling).

```typescript
return info('Reminder: Meeting in 30 minutes')
```

#### warning

```typescript
warning(message: string): BotResponse
```

Warning message (yellow styling).

```typescript
return warning('This action cannot be undone')
```

### Rich Responses

#### embed

```typescript
embed(options: {
  title?: string
  description?: string
  color?: string
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  footer?: string
  timestamp?: string | Date
  image?: string
  thumbnail?: string
  author?: {
    name: string
    icon?: string
    url?: string
  }
}): BotResponse
```

Rich embed with formatted content.

**Example**:

```typescript
return embed({
  title: '📊 Poll Results',
  description: 'Final results for: "What should we have for lunch?"',
  color: '#6366f1',
  fields: [
    { name: '🍕 Pizza', value: '45% (9 votes)', inline: true },
    { name: '🌮 Tacos', value: '55% (11 votes)', inline: true },
  ],
  footer: 'Poll closed',
  timestamp: new Date(),
})
```

#### list

```typescript
list(items: string[], title?: string): BotResponse
```

Bulleted list.

**Example**:

```typescript
return list(
  ['Install dependencies', 'Configure environment', 'Run tests', 'Deploy to production'],
  '📋 Deployment Checklist'
)
```

#### code

```typescript
code(content: string, language?: string): BotResponse
```

Code block with syntax highlighting.

**Example**:

```typescript
return code(
  `
function greet(name) {
  return \`Hello, \${name}!\`
}
`,
  'javascript'
)
```

#### quote

```typescript
quote(text: string, author?: string): BotResponse
```

Blockquote formatting.

**Example**:

```typescript
return quote('The best way to predict the future is to invent it.', 'Alan Kay')
```

### Interactive Responses

#### button

```typescript
button(options: {
  label: string
  action: string
  style?: 'primary' | 'secondary' | 'success' | 'danger'
  disabled?: boolean
}): ButtonComponent
```

Create a button.

**Example**:

```typescript
import { response, button } from '@/lib/bots/bot-sdk'

return response({
  content: 'Choose an option:',
  components: [
    button({ label: 'Approve', action: 'approve', style: 'success' }),
    button({ label: 'Reject', action: 'reject', style: 'danger' }),
  ],
})
```

#### select

```typescript
select(options: {
  placeholder?: string
  options: Array<{ label: string; value: string }>
  action: string
}): SelectComponent
```

Create a dropdown select.

**Example**:

```typescript
return response({
  content: 'Select a priority:',
  components: [
    select({
      placeholder: 'Choose priority...',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      action: 'set_priority',
    }),
  ],
})
```

### Confirm Dialog

```typescript
confirm(message: string, options?: {
  confirmText?: string
  cancelText?: string
  confirmAction?: string
  cancelAction?: string
}): BotResponse
```

Confirmation dialog with yes/no buttons.

**Example**:

```typescript
return confirm('Are you sure you want to delete this poll?', {
  confirmText: 'Yes, delete',
  cancelText: 'Cancel',
  confirmAction: 'confirm_delete',
  cancelAction: 'cancel_delete',
})
```

### Response Options

All response functions accept additional options:

```typescript
text('Message', {
  ephemeral: true, // Only visible to user who triggered
  threadId: 'thread-123', // Reply in thread
  mentionUser: 'user-456', // Mention a user
  deleteAfter: 5000, // Auto-delete after 5 seconds
})
```

---

## State Management

### Bot Storage API

Bots can store persistent data:

```typescript
// In any handler
const api = ctx.api // or passed to handler

// Store data
await api.setStorage('key', value)

// Retrieve data
const value = await api.getStorage<Type>('key')

// Delete data
await api.deleteStorage('key')
```

### Storage Examples

#### User Preferences

```typescript
.command('setlang', 'Set your preferred language', async (ctx, api) => {
  const lang = ctx.args._raw

  // Store user preference
  await api.setStorage(`user:${ctx.user.id}:lang`, lang)

  return success(`Language set to ${lang}`)
})

.command('hello', 'Say hello in your language', async (ctx, api) => {
  // Retrieve user preference
  const lang = await api.getStorage<string>(`user:${ctx.user.id}:lang`) || 'en'

  const greetings = {
    en: 'Hello',
    es: 'Hola',
    fr: 'Bonjour'
  }

  return text(greetings[lang] || greetings.en)
})
```

#### Leaderboard

```typescript
.onReaction(async (ctx, api) => {
  if (ctx.reaction.emoji === '⭐') {
    // Increment star count for message author
    const key = `stars:${ctx.message.authorId}`
    const current = await api.getStorage<number>(key) || 0
    await api.setStorage(key, current + 1)
  }
})

.command('leaderboard', 'Show star leaderboard', async (ctx, api) => {
  // Fetch all star counts
  // Note: In production, use proper database queries
  // This is simplified for example

  return embed({
    title: '⭐ Star Leaderboard',
    description: 'Top contributors this month',
    fields: [
      { name: 'Alice', value: '47 stars' },
      { name: 'Bob', value: '32 stars' },
      { name: 'Charlie', value: '28 stars' }
    ]
  })
})
```

#### Bot Configuration

```typescript
.onInit(async (bot, api) => {
  // Load config on startup
  const config = await api.getStorage<BotConfig>('config')

  if (!config) {
    // Set defaults
    await api.setStorage('config', {
      enabled: true,
      prefix: '/',
      maxPollDuration: 604800000 // 7 days
    })
  }
})

.command('config', 'View bot configuration', async (ctx, api) => {
  const config = await api.getStorage<BotConfig>('config')

  return code(JSON.stringify(config, null, 2), 'json')
})
```

### Storage Best Practices

1. **Namespace your keys**: Use prefixes like `user:${id}:pref` or `poll:${id}:votes`
2. **Type your data**: Use TypeScript generics: `getStorage<Type>(key)`
3. **Handle missing data**: Always provide defaults
4. **Clean up**: Delete old data periodically
5. **Don't abuse storage**: Use for configuration and state, not large datasets

---

## Bot Lifecycle

### Lifecycle Phases

```
┌─────────────┐
│   Created   │  Constructor/Builder called
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Registered  │  .build() called, bot added to registry
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Starting   │  .start() called (auto or manual)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Running   │  Handlers active, receiving events
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Stopping   │  .stop() called
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stopped   │  Handlers inactive
└─────────────┘
```

### Lifecycle Hooks

```typescript
.onInit((bot, api) => {
  // Called when bot starts
  console.log(`${bot.manifest.name} starting...`)

  // Load state, set up timers, etc.
})

.onStop(() => {
  // Called when bot stops
  console.log('Bot stopping...')

  // Clean up resources, clear timers
})
```

### Manual Control

```typescript
const myBot = bot('my-bot')
  .name('My Bot')
  // ... configuration
  .build()

// Bot auto-starts by default

// Manual control
myBot.stop() // Stop the bot
myBot.start() // Restart the bot
```

### Error Handling

```typescript
.command('risky', 'A command that might fail', async (ctx) => {
  try {
    const result = await riskyOperation()
    return success(`Result: ${result}`)
  } catch (error) {
    console.error('Command failed:', error)
    return error(`Operation failed: ${error.message}`)
  }
})

// Global error handler
.onInit((bot, api) => {
  // Catch unhandled errors
  process.on('unhandledRejection', (error) => {
    console.error(`[${bot.manifest.name}] Unhandled error:`, error)
  })
})
```

---

## Debugging Bots

### Console Logging

```typescript
.onMessage((ctx) => {
  console.log('[MyBot] Message received:', {
    content: ctx.message.content,
    from: ctx.user.displayName,
    channel: ctx.channel.name
  })
})
```

### Debug Mode

Enable verbose logging:

```typescript
const DEBUG =
  process.env.BOT_DEBUG ===
  'true'.onMessage((ctx) => {
    if (DEBUG) {
      console.log('Full context:', JSON.stringify(ctx, null, 2))
    }
  })
```

### Testing Commands

Use the test endpoint:

```bash
curl -X POST http://localhost:3000/api/bots/test \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "my-bot",
    "command": "hello",
    "args": {},
    "userId": "user-1"
  }'
```

### Common Issues

#### Bot Not Responding

**Check**:

1. Bot is registered: Check `initializeBots()` is called
2. Bot is started: `myBot.start()` called
3. Bot has permission: Check `manifest.permissions`
4. Command syntax correct: Use `/help` to verify

#### Storage Not Working

**Check**:

1. Storage service configured
2. Using correct key format
3. Handling async properly (await)
4. Type casting correct

#### Events Not Firing

**Check**:

1. Bot is in the channel
2. Bot has `read_messages` permission
3. Event handler registered before `.build()`
4. Not returning early from handler

---

## Best Practices

### 1. Security

**✅ Do**:

- Validate all user input
- Use typed arguments
- Check permissions before actions
- Sanitize output
- Rate limit commands

**❌ Don't**:

- Trust user input blindly
- Store sensitive data in bot storage
- Grant excessive permissions
- Expose internal errors to users

**Example**:

```typescript
.command('admin', 'Admin command', (ctx) => {
  // Check permissions
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
    return error('You do not have permission to use this command')
  }

  // Validate input
  const action = ctx.args.action
  if (!['backup', 'restore', 'status'].includes(action)) {
    return error('Invalid action')
  }

  // Execute safely
  return success(`${action} completed`)
})
```

### 2. Performance

**✅ Do**:

- Cache expensive operations
- Use async/await properly
- Implement timeouts
- Batch API calls
- Clean up resources

**❌ Don't**:

- Block the event loop
- Make synchronous network calls
- Store large data in memory
- Create memory leaks

**Example**:

```typescript
// Cache expensive data
const cache = new Map<string, { data: any; expires: number }>().command(
  'fetch',
  'Fetch data',
  async (ctx) => {
    const key = ctx.args.key

    // Check cache first
    const cached = cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return text(`Cached: ${cached.data}`)
    }

    // Fetch with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`/api/data/${key}`, {
        signal: controller.signal,
      })
      const data = await response.json()

      // Cache for 5 minutes
      cache.set(key, {
        data,
        expires: Date.now() + 300000,
      })

      return text(`Fresh: ${data}`)
    } catch (error) {
      return error('Fetch timeout or failed')
    } finally {
      clearTimeout(timeout)
    }
  }
)
```

### 3. User Experience

**✅ Do**:

- Provide clear error messages
- Use progress indicators for slow operations
- Confirm destructive actions
- Provide helpful usage examples
- Use consistent formatting

**❌ Don't**:

- Show technical errors to users
- Make users wait without feedback
- Use jargon in messages
- Spam channels

**Example**:

```typescript
.command('delete', 'Delete data', async (ctx) => {
  const id = ctx.args.id

  // 1. Validate
  if (!id) {
    return error('Usage: /delete <id>\nExample: /delete 123')
  }

  // 2. Confirm
  const confirmed = await confirm(`Delete item ${id}?`, {
    confirmText: 'Yes, delete it',
    cancelText: 'Cancel'
  })

  // 3. Show progress
  await ctx.api.sendMessage(ctx.channel.id, info('Deleting...'))

  // 4. Execute
  try {
    await deleteItem(id)
    return success(`Item ${id} deleted successfully`)
  } catch (error) {
    return error(`Failed to delete item ${id}. Please try again.`)
  }
})
```

### 4. Code Organization

**✅ Do**:

- One bot per file
- Group related commands
- Extract complex logic to functions
- Use TypeScript types
- Document your code

**Example Structure**:

```
src/lib/bots/
  ├── weather-bot/
  │   ├── index.ts              # Bot registration
  │   ├── commands/
  │   │   ├── forecast.ts       # /forecast command
  │   │   ├── current.ts        # /current command
  │   │   └── alerts.ts         # /alerts command
  │   ├── services/
  │   │   └── weather-api.ts    # External API client
  │   └── types.ts              # TypeScript interfaces
  └── index.ts                  # Register all bots
```

---

## Examples

### Complete Bot Examples

See [Bot Templates Guide](bot-templates.md) for ready-to-use templates and [Bots.md](../../features/Bots.md) for detailed examples of:

- HelloBot - Greetings and jokes
- PollBot - Polls and voting
- ReminderBot - Reminders and scheduling
- WelcomeBot - Welcome messages
- SearchBot - Semantic search
- SummaryBot - AI summaries

---

## Next Steps

1. **Build your first bot** using this guide
2. **Explore templates** in [Bot Templates Guide](bot-templates.md)
3. **Review examples** in the codebase
4. **Test thoroughly** before deploying
5. **Share with the community** on the Bot Marketplace

---

## Related Documentation

- **[Bot Templates Guide](bot-templates.md)** - Pre-built bot templates
- **[Bot API Implementation](../../api/BOT_API_IMPLEMENTATION.md)** - Low-level API docs
- **[Bots Feature Guide](../../features/Bots.md)** - User-facing bot documentation
- **[AI Features Guide](../features/ai-features-complete.md)** - AI integration

---

## Support

- **Documentation**: This guide
- **Examples**: `src/lib/bots/examples/`
- **Community**: [community.nself.org/bot-development](https://community.nself.org/bot-development)
- **Issues**: [github.com/nself/nself-chat/issues](https://github.com/nself/nself-chat/issues)

---

**Last Updated**: January 31, 2026
**Version**: v0.7.0
**SDK Version**: 1.0.0
