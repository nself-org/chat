# Bot Framework Quick Start Guide

Get started with the nself-chat Bot Framework in 5 minutes.

## Installation

The bot framework is already integrated into nself-chat. No additional installation required!

## Quick Start

### 1. Start the Application

```bash
cd /Users/admin/Sites/nself-chat
pnpm dev
```

The application will start on `http://localhost:3000`.

### 2. List Available Bots

**API:**
```bash
curl http://localhost:3000/api/bots?type=available
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "reminder-bot",
      "name": "Reminder Bot",
      "description": "Set reminders for yourself or your team",
      "installed": false
    },
    {
      "id": "faq-bot",
      "name": "FAQ Bot",
      "description": "Answer frequently asked questions",
      "installed": false
    },
    {
      "id": "scheduler-bot",
      "name": "Scheduler Bot",
      "description": "Schedule messages and recurring tasks",
      "installed": false
    }
  ]
}
```

### 3. Install a Bot

**API:**
```bash
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "reminder-bot",
    "config": {
      "enabled": true,
      "settings": {
        "max_reminders": 25,
        "max_duration": 365
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "reminder-bot",
    "name": "Reminder Bot",
    "enabled": true,
    "manifest": { ... }
  },
  "message": "Bot installed successfully"
}
```

### 4. Use the Bot

In any chat channel, use the bot commands:

**Reminder Bot:**
```
/remind 5m "Check the build"
/reminders
/cancelreminder rem_abc123
```

**FAQ Bot:**
```
/faq how to reset password
/addfaq "How to reset password?" "Go to Settings > Reset"
/listfaqs
```

**Scheduler Bot:**
```
/schedule 1h "Team meeting reminder"
/recurring 1d "Daily standup reminder"
/scheduled
```

### 5. Manage Bots

**List Installed Bots:**
```bash
curl http://localhost:3000/api/bots?type=installed
```

**Get Bot Details:**
```bash
curl http://localhost:3000/api/bots/reminder-bot
```

**Disable a Bot:**
```bash
curl -X POST http://localhost:3000/api/bots/reminder-bot/enable \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**Update Bot Config:**
```bash
curl -X PATCH http://localhost:3000/api/bots/reminder-bot \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "max_reminders": 50
    }
  }'
```

**Uninstall a Bot:**
```bash
curl -X DELETE http://localhost:3000/api/bots/reminder-bot
```

## Available Bots

### 1. Reminder Bot
Set reminders for yourself or your team.

**Commands:**
- `/remind <time> "<message>"` - Set a reminder
- `/reminders` - List your reminders
- `/cancelreminder <id>` - Cancel a reminder
- `/snooze <id> [time]` - Snooze a reminder
- `/remindchannel <time> "<message>"` - Channel reminder

**Example:**
```
/remind 30m "Check the deployment"
/remind 1h "Team standup meeting"
/remind 1d "Submit weekly report"
```

### 2. Welcome Bot
Automatically welcome new members.

**Commands:**
- `/setwelcome "<message>"` - Set welcome message
- `/testwelcome` - Preview welcome message
- `/disablewelcome` - Disable welcomes

**Variables:**
- `{user}` - Username
- `{channel}` - Channel name
- `{memberCount}` - Member number
- `{date}` - Current date
- `{time}` - Current time

**Example:**
```
/setwelcome "Welcome {user}! You're member #{memberCount} 🎉"
```

### 3. Poll Bot
Create interactive polls and surveys.

**Commands:**
- `/poll "<question>" "<options>"` - Create a poll
- `/quickpoll "<question>"` - Yes/no poll
- `/pollresults <id>` - Show results
- `/endpoll <id>` - End poll early

**Example:**
```
/poll "What's for lunch?" "Pizza | Tacos | Sushi"
/quickpoll "Should we have a team meeting today?"
```

### 4. FAQ Bot
Answer frequently asked questions.

**Commands:**
- `/faq <question>` - Search FAQ
- `/addfaq "<question>" "<answer>"` - Add FAQ
- `/removefaq <id>` - Remove FAQ
- `/editfaq <id>` - Edit FAQ
- `/listfaqs [category]` - List all FAQs

**Example:**
```
/addfaq "How to reset password?" "Go to Settings > Security > Reset Password"
/faq how to reset password
/listfaqs General
```

### 5. Scheduler Bot
Schedule messages and recurring tasks.

**Commands:**
- `/schedule <when> "<message>"` - Schedule a message
- `/scheduled` - List scheduled messages
- `/cancelschedule <id>` - Cancel schedule
- `/recurring <interval> "<message>"` - Create recurring task
- `/recurringtasks` - List recurring tasks
- `/cancelrecurring <id>` - Cancel recurring task

**Example:**
```
/schedule 1h "Meeting reminder!"
/recurring 1d "Daily standup reminder!"
/scheduled
```

## Admin UI

Access the bot management UI at:

```
http://localhost:3000/admin/bots
```

Features:
- View all installed and available bots
- Search and filter bots
- Enable/disable bots
- Configure bot settings
- View bot statistics
- View bot logs

## Creating Your Own Bot

### 1. Create Bot Directory

```bash
mkdir -p src/bots/my-bot
cd src/bots/my-bot
```

### 2. Create manifest.json

```json
{
  "id": "my-bot",
  "name": "My Bot",
  "description": "A helpful bot",
  "version": "1.0.0",
  "author": "Your Name",
  "icon": "🤖",
  "permissions": ["read_messages", "send_messages"],
  "commands": [
    {
      "name": "hello",
      "description": "Say hello",
      "examples": ["/hello"]
    }
  ]
}
```

### 3. Create index.ts

```typescript
import { bot, command, response, embed } from '@/lib/bots'
import type { CommandContext, BotApi } from '@/lib/bots'
import manifest from './manifest.json'

export function createMyBot() {
  return bot(manifest.id)
    .name(manifest.name)
    .description(manifest.description)
    .version(manifest.version)
    .permissions('read_messages', 'send_messages')

    .command(
      command('hello')
        .description('Say hello')
        .example('/hello'),
      async (ctx: CommandContext, api: BotApi) => {
        return response()
          .embed(
            embed()
              .title('👋 Hello!')
              .description(`Hi ${ctx.user.displayName}!`)
              .color('#10B981')
          )
          .build()
      }
    )

    .build()
}

export default createMyBot
export { manifest }
```

### 4. Register Bot

Edit `/src/lib/bots/bot-registry.ts`:

```typescript
// Add import
import { default: createMyBot, manifest: myBotManifest } from '@/bots/my-bot'

// In registerDefaultBots():
registerBotFactory('my-bot', createMyBot, myBotManifest, {
  category: 'Utilities',
  featured: false,
  tags: ['greeting']
})
```

### 5. Install and Test

```bash
# Restart the app
pnpm dev

# Install your bot
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d '{"botId": "my-bot", "config": {"enabled": true}}'

# Test in chat
/hello
```

## Troubleshooting

### Bot not responding

1. Check if bot is enabled:
```bash
curl http://localhost:3000/api/bots/reminder-bot
```

2. Check bot logs (if available):
```bash
curl http://localhost:3000/api/bots/reminder-bot/logs
```

3. Check server logs:
```bash
# Look for errors in terminal
```

### Commands not working

1. Verify command prefix (default is `/`)
2. Check if bot is in the channel
3. Verify bot permissions
4. Check for rate limiting

### Storage issues

1. Bots store data in memory by default
2. For persistent storage, implement database integration
3. Check bot settings for storage configuration

## Next Steps

- **Read the complete guide**: `/docs/Bot-Framework-Complete.md`
- **Explore bot examples**: `/src/bots/`
- **Check API documentation**: `/src/app/api-docs/bots/`
- **Join the community**: Get help and share your bots

## Resources

- **Documentation**: `/docs/Bot-Framework-Complete.md`
- **Bot SDK**: `/src/lib/bots/`
- **Example Bots**: `/src/bots/`
- **API Reference**: REST endpoints at `/api/bots`

## Support

For issues or questions:
1. Check the documentation
2. Review example bots
3. Test with API endpoints
4. Check server logs

---

**Happy Bot Building! 🤖**
