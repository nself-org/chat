# Bot SDK Documentation

Complete guide to building custom bots for nself-chat using the Bot SDK.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Examples](#examples)
6. [Best Practices](#best-practices)
7. [Advanced Topics](#advanced-topics)

---

## Introduction

The nself-chat Bot SDK provides a powerful, type-safe way to create custom bots that can:

- Respond to messages and commands
- React to user events (join, leave, reactions)
- Store persistent state
- Schedule tasks
- Call external webhooks
- And much more!

### Features

✅ **TypeScript-first** - Full type safety and IntelliSense support
✅ **Fluent API** - Chain methods for readable code
✅ **Event-driven** - Subscribe to chat events easily
✅ **Sandboxed** - Safe execution environment
✅ **Versioned** - Track bot versions automatically
✅ **Template system** - Start from pre-built templates

---

## Getting Started

### Installation

The Bot SDK is built into nself-chat. No additional installation required!

### Your First Bot

Create a simple bot that responds to a command:

```typescript
import { bot, text } from '@/lib/bots/bot-sdk'

export default bot('hello-bot')
  .name('Hello Bot')
  .description('A simple greeting bot')
  .command('hello', 'Say hello', (ctx) => {
    return text(`Hello, ${ctx.user.displayName}!`)
  })
  .build()
```

### Using Templates

Start from a pre-built template:

```typescript
import { createWelcomeBot } from '@/lib/bots/templates'

// Create a welcome bot with default settings
const myWelcomeBot = createWelcomeBot()
```

---

## Core Concepts

### Bot Builder

The `bot()` function returns a `BotBuilder` instance with a fluent API:

```typescript
import { bot } from '@/lib/bots/bot-sdk'

const myBot = bot('my-bot-id')
  .name('My Bot')
  .description('What my bot does')
  .version('1.0.0')
  .icon('🤖')
  .permissions('read_messages', 'send_messages')
  .build()
```

### Event Handlers

Bots respond to various events:

#### Message Events

```typescript
bot('echo-bot')
  .name('Echo Bot')
  .onMessage((ctx, api) => {
    if (ctx.isMention) {
      return text(`You said: "${ctx.message.content}"`)
    }
  })
  .build()
```

#### Command Events

```typescript
bot('poll-bot')
  .name('Poll Bot')
  .command('poll', 'Create a poll', async (ctx, api) => {
    const question = ctx.args.question as string
    const options = (ctx.args.options as string).split(',')

    return embed()
      .title(`📊 ${question}`)
      .description(options.map((o, i) => `${i + 1}. ${o}`).join('\n'))
      .build()
  })
  .build()
```

#### User Events

```typescript
bot('welcome-bot')
  .name('Welcome Bot')
  .onUserJoin((ctx, api) => {
    return text(`Welcome ${api.mentionUser(ctx.user.id)} to #${ctx.channel.name}!`)
  })
  .onUserLeave((ctx, api) => {
    return text(`Goodbye ${ctx.user.displayName}!`)
  })
  .build()
```

#### Reaction Events

```typescript
bot('reaction-bot')
  .name('Reaction Bot')
  .onReaction((ctx, api) => {
    if (ctx.reaction.emoji === '⭐' && ctx.reaction.action === 'add') {
      return text('Someone starred a message!')
    }
  })
  .build()
```

### Triggers

Use keyword and pattern matching:

```typescript
bot('faq-bot')
  .name('FAQ Bot')
  // Respond to keywords
  .onKeyword(['help', 'support', 'faq'], (ctx, api) => {
    return text('How can I help you?')
  })
  // Respond to patterns
  .onPattern(['how do i.*', 'how to.*'], (ctx, api) => {
    return text('Let me help you with that...')
  })
  .build()
```

---

## API Reference

### BotBuilder API

#### `.name(name: string)`
Set the bot's display name.

```typescript
.name('My Awesome Bot')
```

#### `.description(description: string)`
Set the bot's description.

```typescript
.description('Helps users with common tasks')
```

#### `.version(version: string)`
Set the bot's version (semantic versioning recommended).

```typescript
.version('1.2.3')
```

#### `.icon(icon: string)`
Set the bot's icon (emoji or URL).

```typescript
.icon('🤖')
```

#### `.permissions(...permissions: BotPermission[])`
Set required permissions.

```typescript
.permissions('read_messages', 'send_messages', 'add_reactions')
```

#### `.settings(settings: Record<string, unknown>)`
Set bot configuration.

```typescript
.settings({
  maxPollOptions: 10,
  defaultDuration: 3600000, // 1 hour
})
```

#### `.command(name, description, handler)`
Register a command handler.

```typescript
.command('ping', 'Check if bot is alive', (ctx) => {
  return text('Pong!')
})
```

#### `.onMessage(handler)`
Handle incoming messages.

```typescript
.onMessage((ctx, api) => {
  if (ctx.message.content.includes('bot')) {
    return text('Did someone call me?')
  }
})
```

#### `.onUserJoin(handler)`
Handle user join events.

```typescript
.onUserJoin((ctx, api) => {
  return text(`Welcome ${ctx.user.displayName}!`)
})
```

#### `.onUserLeave(handler)`
Handle user leave events.

```typescript
.onUserLeave((ctx, api) => {
  return text(`Goodbye ${ctx.user.displayName}!`)
})
```

#### `.onReaction(handler)`
Handle reaction events.

```typescript
.onReaction((ctx, api) => {
  console.log(`${ctx.user.displayName} reacted with ${ctx.reaction.emoji}`)
})
```

#### `.onInit(handler)`
Run code when bot initializes.

```typescript
.onInit(async (bot, api) => {
  console.log('Bot started!', bot.manifest.name)
  // Load data, set up scheduled tasks, etc.
})
```

### Response Builders

#### `text(content: string)`
Send a simple text message.

```typescript
return text('Hello, world!')
```

#### `embed()`
Create a rich embed.

```typescript
return embed()
  .title('Hello')
  .description('This is a rich embed')
  .color('#6366f1')
  .field('Field 1', 'Value 1', true)
  .field('Field 2', 'Value 2', true)
  .footer('Footer text')
  .build()
```

#### `success(message: string)`
Send a success message.

```typescript
return success('Operation completed successfully!')
```

#### `error(message: string)`
Send an error message.

```typescript
return error('Something went wrong!')
```

#### `info(message: string)`
Send an info message.

```typescript
return info('Here is some information...')
```

#### `warning(message: string)`
Send a warning message.

```typescript
return warning('Be careful!')
```

### Bot API

The `api` parameter provides access to bot operations:

#### `api.sendMessage(channelId, response)`
Send a message to a channel.

```typescript
await api.sendMessage(ctx.channel.id, text('Hello!'))
```

#### `api.replyToMessage(messageId, response)`
Reply to a specific message.

```typescript
await api.replyToMessage(ctx.message.id, text('Replying!'))
```

#### `api.addReaction(messageId, emoji)`
Add a reaction to a message.

```typescript
await api.addReaction(ctx.message.id, '👍')
```

#### `api.getChannel(channelId)`
Get channel information.

```typescript
const channel = await api.getChannel(ctx.channel.id)
console.log(channel.name)
```

#### `api.getUser(userId)`
Get user information.

```typescript
const user = await api.getUser(ctx.user.id)
console.log(user.displayName)
```

#### `api.mentionUser(userId)`
Create a user mention string.

```typescript
const mention = api.mentionUser(ctx.user.id)
return text(`Hello ${mention}!`)
```

#### `api.getStorage<T>(key)`
Get value from persistent storage.

```typescript
const data = await api.getStorage<MyData>('my-key')
```

#### `api.setStorage<T>(key, value)`
Save value to persistent storage.

```typescript
await api.setStorage('my-key', { count: 42 })
```

#### `api.deleteStorage(key)`
Delete value from storage.

```typescript
await api.deleteStorage('my-key')
```

#### `api.scheduleMessage(channelId, response, delay)`
Schedule a message for later delivery.

```typescript
await api.scheduleMessage(
  ctx.channel.id,
  text('Reminder!'),
  60000 // 1 minute
)
```

---

## Examples

### Poll Bot

```typescript
import { bot, embed, parseDuration } from '@/lib/bots/bot-sdk'

export default bot('poll-bot')
  .name('Poll Bot')
  .description('Create polls and surveys')
  .permissions('read_messages', 'send_messages', 'add_reactions')

  .command('poll', 'Create a poll', async (ctx, api) => {
    const question = ctx.args.question as string
    const options = (ctx.args.options as string).split(',')

    const pollId = Math.random().toString(36).substring(7)

    await api.setStorage(`poll:${pollId}`, {
      question,
      options,
      votes: {},
    })

    return embed()
      .title(`📊 ${question}`)
      .description(options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))
      .footer(`Poll ID: ${pollId}`)
      .build()
  })

  .build()
```

### FAQ Bot

```typescript
import { bot, embed, list } from '@/lib/bots/bot-sdk'

interface FAQ {
  question: string
  answer: string
  keywords: string[]
}

export default bot('faq-bot')
  .name('FAQ Bot')
  .description('Answer frequently asked questions')

  .settings({
    faqs: [
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page.',
        keywords: ['password', 'reset', 'forgot'],
      },
    ] as FAQ[],
  })

  .onMessage(async (ctx, api) => {
    const config = api.getBotConfig()
    const faqs = config.settings?.faqs as FAQ[] || []

    const message = ctx.message.content.toLowerCase()

    // Find matching FAQ
    const match = faqs.find(faq =>
      faq.keywords.some(keyword => message.includes(keyword))
    )

    if (match) {
      return embed()
        .title(`💡 ${match.question}`)
        .description(match.answer)
        .build()
    }
  })

  .build()
```

### Reminder Bot

```typescript
import { bot, text, parseDuration } from '@/lib/bots/bot-sdk'

export default bot('reminder-bot')
  .name('Reminder Bot')
  .description('Set reminders')

  .command('remind', 'Set a reminder', async (ctx, api) => {
    const message = ctx.args.message as string
    const time = ctx.args.time as string

    const delay = parseDuration(time)

    await api.scheduleMessage(
      ctx.channel.id,
      text(`⏰ Reminder: ${message}`),
      delay
    )

    return text(`Reminder set for ${time} from now!`)
  })

  .build()
```

---

## Best Practices

### 1. Use Type Safety

Always type your storage data:

```typescript
interface PollData {
  question: string
  options: string[]
  votes: Record<string, number>
}

const poll = await api.getStorage<PollData>('poll:123')
```

### 2. Handle Errors Gracefully

```typescript
.onMessage(async (ctx, api) => {
  try {
    // Your code here
  } catch (error) {
    return error('Something went wrong. Please try again.')
  }
})
```

### 3. Validate User Input

```typescript
.command('poll', 'Create poll', (ctx) => {
  if (!ctx.args.question || !ctx.args.options) {
    return text('Usage: /poll question:<question> options:<opt1,opt2,opt3>')
  }

  // Create poll...
})
```

### 4. Use Permissions Wisely

Only request permissions you actually need:

```typescript
.permissions('read_messages', 'send_messages')
// Don't request 'manage_messages' unless you need to delete messages
```

### 5. Clean Up Resources

```typescript
.onInit((bot, api) => {
  const interval = setInterval(() => {
    // Do something periodically
  }, 60000)

  // Register cleanup
  bot.registerCleanup(() => {
    clearInterval(interval)
  })
})
```

### 6. Use Storage Efficiently

```typescript
// Good: Store only what you need
await api.setStorage('poll-count', 42)

// Bad: Storing redundant data
await api.setStorage('poll-count', {
  count: 42,
  timestamp: Date.now(),
  user: ctx.user,
  channel: ctx.channel,
  // etc...
})
```

### 7. Rate Limit External Calls

```typescript
let lastApiCall = 0

.onMessage(async (ctx, api) => {
  const now = Date.now()

  if (now - lastApiCall < 1000) {
    return // Rate limit: 1 call per second
  }

  lastApiCall = now

  // Make external API call...
})
```

---

## Advanced Topics

### Class-Based Bots

Use decorators for class-based bot development:

```typescript
import { BaseBot, Command } from '@/lib/bots/bot-sdk'

export class MyBot extends BaseBot {
  constructor() {
    super('my-bot', 'My Bot', 'A custom bot')
  }

  @Command('hello')
  async handleHello(ctx: CommandContext) {
    return text('Hello!')
  }

  @Command({ name: 'ping', description: 'Check bot status' })
  async handlePing(ctx: CommandContext) {
    return text('Pong!')
  }
}
```

### State Management

Use bot state for complex data:

```typescript
interface BotState {
  activePolls: Map<string, Poll>
  userPreferences: Map<string, UserPrefs>
}

.onInit(async (bot, api) => {
  const state: BotState = {
    activePolls: new Map(),
    userPreferences: new Map(),
  }

  // Load from storage
  const saved = await api.getStorage<any>('bot-state')
  if (saved) {
    state.activePolls = new Map(saved.activePolls)
  }
})
```

### Webhook Integration

Call external webhooks:

```typescript
.command('notify', 'Send notification', async (ctx) => {
  const response = await fetch('https://api.example.com/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: ctx.user.displayName,
      message: ctx.args.message,
    }),
  })

  if (response.ok) {
    return success('Notification sent!')
  } else {
    return error('Failed to send notification')
  }
})
```

### Scheduled Tasks

Run tasks on a schedule:

```typescript
.onInit(async (bot, api) => {
  // Daily reminder at 9 AM
  const scheduleDaily = () => {
    const now = new Date()
    const target = new Date()
    target.setHours(9, 0, 0, 0)

    if (target < now) {
      target.setDate(target.getDate() + 1)
    }

    const delay = target.getTime() - now.getTime()

    setTimeout(async () => {
      await api.sendMessage(
        'general',
        text('Good morning! Time for standup!')
      )
      scheduleDaily() // Reschedule for next day
    }, delay)
  }

  scheduleDaily()
})
```

---

## Troubleshooting

### Bot Not Responding

1. Check that the bot is enabled
2. Verify permissions are granted
3. Check bot logs for errors
4. Test in sandbox mode

### Storage Issues

1. Ensure unique keys
2. Check storage quotas
3. Clean up old data regularly
4. Use expiration for temporary data

### Performance Issues

1. Add rate limiting
2. Cache frequently accessed data
3. Optimize database queries
4. Use pagination for large datasets

---

## Support & Resources

- **GitHub**: [https://github.com/nself/nself-chat](https://github.com/nself/nself-chat)
- **Discord**: Join our community
- **Docs**: [https://docs.nself.chat](https://docs.nself.chat)
- **Examples**: Check `/lib/bots/templates/` for more examples

---

**Happy Bot Building! 🤖**
