# Bot SDK

Complete guide to creating and managing bots in nself-chat.

---

## Overview

nself-chat includes a powerful Bot SDK for creating automated interactions:

- **Custom Commands** - /slash commands
- **Message Handling** - Respond to messages
- **Event Subscriptions** - React to events
- **Rich Responses** - Cards, embeds, buttons
- **Bot Marketplace** - Share and discover bots

---

## Quick Start

### Creating a Simple Bot

```typescript
// src/bots/my-bot.ts
import { Bot, BotContext, BotResponse } from '@/lib/bots'

export class MyBot implements Bot {
  readonly id = 'my-bot'
  readonly name = 'My Bot'
  readonly description = 'Does something useful'
  readonly avatar = '🤖'
  readonly version = '1.0.0'

  getCommands() {
    return [
      {
        name: 'hello',
        description: 'Say hello',
        usage: '/hello [name]'
      }
    ]
  }

  async onMessage(ctx: BotContext): Promise<BotResponse | null> {
    // Don't respond to own messages
    if (ctx.message.author.id === this.id) return null

    // Respond to greetings
    if (ctx.message.content.toLowerCase().includes('hello bot')) {
      return {
        type: 'message',
        content: `Hi there, ${ctx.user.displayName}! 👋`
      }
    }

    return null // Don't respond to other messages
  }

  async onCommand(command: string, args: string[], ctx: BotContext): Promise<BotResponse> {
    if (command === 'hello') {
      const name = args.join(' ') || ctx.user.displayName
      return {
        type: 'message',
        content: `Hello, ${name}! 🎉`
      }
    }

    return {
      type: 'message',
      content: 'Unknown command'
    }
  }

  async onMention(ctx: BotContext): Promise<BotResponse> {
    return {
      type: 'message',
      content: `You called? I'm ${this.name}. Use /hello to say hi!`
    }
  }
}
```

### Registering a Bot

```typescript
// src/bots/index.ts
import { registerBot } from '@/lib/bots'
import { MyBot } from './my-bot'

registerBot(new MyBot())
```

---

## Bot Interface

```typescript
interface Bot {
  // Required properties
  readonly id: string           // Unique identifier
  readonly name: string         // Display name
  readonly description: string  // Short description
  readonly avatar: string       // Emoji or image URL
  readonly version: string      // Semantic version

  // Required methods
  getCommands(): BotCommand[]
  onCommand(command: string, args: string[], ctx: BotContext): Promise<BotResponse>

  // Optional methods
  onMessage?(ctx: BotContext): Promise<BotResponse | null>
  onMention?(ctx: BotContext): Promise<BotResponse>
  onMemberJoin?(ctx: BotContext): Promise<BotResponse | null>
  onMemberLeave?(ctx: BotContext): Promise<BotResponse | null>
  onReaction?(ctx: BotContext): Promise<BotResponse | null>

  // Lifecycle methods
  start?(): void | Promise<void>
  stop?(): void | Promise<void>
}
```

---

## Context Object

```typescript
interface BotContext {
  // Message info
  message: {
    id: string
    content: string
    author: User
    channelId: string
    threadId?: string
    attachments: Attachment[]
    mentions: User[]
    reactions: Reaction[]
    createdAt: Date
  }

  // User who triggered
  user: {
    id: string
    displayName: string
    email: string
    avatarUrl?: string
    role: Role
  }

  // Channel info
  channel: {
    id: string
    name: string
    type: 'public' | 'private' | 'dm' | 'group_dm'
    members: User[]
  }

  // Thread info (if in thread)
  thread?: {
    id: string
    parentMessageId: string
    participantCount: number
  }

  // For member events
  newMember?: User
  leftMember?: User

  // For reaction events
  reaction?: {
    emoji: string
    user: User
    messageId: string
  }
}
```

---

## Response Types

### Simple Message

```typescript
return {
  type: 'message',
  content: 'Hello, World!'
}
```

### Rich Embed

```typescript
return {
  type: 'rich',
  content: {
    title: 'Poll Results',
    description: 'Here are the results...',
    color: '#6366f1',
    fields: [
      { name: 'Option A', value: '45%', inline: true },
      { name: 'Option B', value: '55%', inline: true }
    ],
    footer: 'Vote closed',
    timestamp: new Date().toISOString()
  }
}
```

### Ephemeral (Private) Message

```typescript
return {
  type: 'message',
  content: 'Only you can see this',
  ephemeral: true
}
```

### With Attachments

```typescript
return {
  type: 'message',
  content: 'Here is your file',
  attachments: [
    {
      type: 'file',
      url: 'https://example.com/file.pdf',
      name: 'document.pdf'
    }
  ]
}
```

### With Actions (Buttons)

```typescript
return {
  type: 'message',
  content: 'Choose an option:',
  actions: [
    {
      type: 'button',
      label: 'Option A',
      style: 'primary',
      action: 'select_a'
    },
    {
      type: 'button',
      label: 'Option B',
      style: 'secondary',
      action: 'select_b'
    }
  ]
}
```

---

## Example Bots

### Hello Bot

Basic greeting bot with jokes.

```typescript
// Located at: src/lib/bots/examples/hello-bot.ts

Commands:
- /hello [name] - Get a greeting
- /hi - Say hi
- /greet @user - Greet someone
- /joke - Get a programming joke
```

### Poll Bot

Create and manage polls.

```typescript
// Located at: src/lib/bots/examples/poll-bot.ts

Commands:
- /poll "Question" "Option 1" "Option 2" [--anonymous] [--duration 30]
- /vote <poll-id> <option-number>
- /results <poll-id>
- /closepoll <poll-id>
```

### Reminder Bot

Set and manage reminders.

```typescript
// Located at: src/lib/bots/examples/reminder-bot.ts

Commands:
- /remind in 30 minutes to check email
- /remind at 3pm to call mom
- /remind tomorrow at 9am to submit report
- /reminders - List your reminders
- /cancel-reminder <id>
```

### Welcome Bot

Welcome new members to channels.

```typescript
// Located at: src/lib/bots/examples/welcome-bot.ts

Commands:
- /setwelcome on|off - Enable/disable
- /welcomemessage <message> - Set custom message
- /testwelcome - Preview welcome message
- /welcomesettings - View settings

Placeholders: {user}, {channel}, {server}
```

---

## Bot Builder API

Use the fluent builder for simpler bot creation:

```typescript
import { BotBuilder } from '@/lib/bots'

const myBot = BotBuilder.create('weather-bot')
  .name('Weather Bot')
  .description('Get weather forecasts')
  .avatar('🌤️')

  .command('weather', async (ctx, args) => {
    const location = args.join(' ') || 'New York'
    const weather = await fetchWeather(location)
    return {
      type: 'rich',
      content: {
        title: `Weather in ${location}`,
        description: `${weather.temp}°F - ${weather.condition}`,
        color: '#3b82f6'
      }
    }
  })

  .command('forecast', async (ctx, args) => {
    // ... implementation
  })

  .onMessage(async (ctx) => {
    if (ctx.message.content.includes('weather')) {
      return {
        type: 'message',
        content: 'Try /weather <city> to get the forecast!'
      }
    }
    return null
  })

  .build()
```

---

## Bot Store

Use the Zustand store for bot state management:

```typescript
import { useBotStore } from '@/lib/bots/bot-store'

function BotManager() {
  const {
    bots,
    enabledBots,
    enableBot,
    disableBot,
    getBotByCommand
  } = useBotStore()

  return (
    <div>
      {bots.map(bot => (
        <div key={bot.id}>
          <span>{bot.name}</span>
          <Switch
            checked={enabledBots.includes(bot.id)}
            onCheckedChange={(checked) =>
              checked ? enableBot(bot.id) : disableBot(bot.id)
            }
          />
        </div>
      ))}
    </div>
  )
}
```

---

## Bot Hooks

### useBot

```typescript
import { useBot } from '@/lib/bots/use-bots'

function BotInfo({ botId }) {
  const { bot, isEnabled, enable, disable } = useBot(botId)

  return (
    <div>
      <h3>{bot.avatar} {bot.name}</h3>
      <p>{bot.description}</p>
      <Button onClick={() => isEnabled ? disable() : enable()}>
        {isEnabled ? 'Disable' : 'Enable'}
      </Button>
    </div>
  )
}
```

### useBotCommands

```typescript
import { useBotCommands } from '@/lib/bots/use-bots'

function CommandPalette() {
  const { commands, executeCommand } = useBotCommands()

  return (
    <div>
      {commands.map(cmd => (
        <div key={cmd.name} onClick={() => executeCommand(cmd.name)}>
          /{cmd.name} - {cmd.description}
        </div>
      ))}
    </div>
  )
}
```

---

## Bot Events

Subscribe to events for complex behaviors:

```typescript
class EventBot implements Bot {
  // ... other properties

  async onMemberJoin(ctx: BotContext): Promise<BotResponse | null> {
    return {
      type: 'message',
      content: `Welcome to the team, ${ctx.newMember.displayName}! 🎉`
    }
  }

  async onMemberLeave(ctx: BotContext): Promise<BotResponse | null> {
    return {
      type: 'message',
      content: `${ctx.leftMember.displayName} has left the channel.`
    }
  }

  async onReaction(ctx: BotContext): Promise<BotResponse | null> {
    if (ctx.reaction.emoji === '⭐') {
      // Track starred messages
      await saveStarredMessage(ctx.reaction.messageId)
    }
    return null
  }
}
```

---

## Bot Configuration

Configure bots via AppConfig:

```typescript
const botConfig = {
  enabled: true,
  allowedBots: ['hello-bot', 'poll-bot', 'reminder-bot'],
  defaultBots: ['hello-bot'],
  maxBotsPerChannel: 10,
  botPrefix: '/',
  allowCustomBots: true
}
```

---

## Security

### Bot Permissions

```typescript
interface BotPermissions {
  canReadMessages: boolean
  canSendMessages: boolean
  canDeleteMessages: boolean
  canManageChannels: boolean
  canMentionEveryone: boolean
  canUploadFiles: boolean
}
```

### Rate Limiting

Bots are subject to rate limits:

- 30 messages per minute
- 10 API calls per second
- 100 events per minute

### Sandbox

Bots run in a sandboxed environment:

- No direct database access
- No file system access
- Limited network access
- Memory limits

---

## Deploying Bots

### As Part of nself-chat

```typescript
// src/lib/bots/index.ts
import { registerBot } from './bot-registry'
import { HelloBot } from './examples/hello-bot'
import { PollBot } from './examples/poll-bot'

export function initializeBots() {
  registerBot(new HelloBot())
  registerBot(new PollBot())
}
```

### As External Service

```typescript
// External bot service
import express from 'express'
import { Bot } from '@nself/bot-sdk'

const app = express()

app.post('/webhook', async (req, res) => {
  const { event, context } = req.body
  const response = await bot.handle(event, context)
  res.json(response)
})
```

---

## Related Documentation

- [Example Bots](Bots-Examples)
- [Slash Commands](Slash-Commands)
- [Webhooks](Webhooks)
- [Plugins](Plugins)
