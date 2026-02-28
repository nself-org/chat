# Workflow Automation ɳPlugin

**Version**: 1.0.0
**Category**: automation
**Port**: 3110
**Status**: Production Ready

---

## Overview

Visual workflow builder and automation engine for ɳChat. Create custom workflows with triggers, conditions, and actions without writing code.

## Key Features

- **Visual Builder**: Drag-and-drop workflow designer
- **Triggers**: Message events, scheduled tasks, webhooks
- **Actions**: Send messages, create channels, HTTP requests
- **Conditions**: If/else logic, loops, pattern matching
- **Templates**: Pre-built workflow templates
- **Integrations**: 1000+ third-party services

## Installation

```bash
cd backend
nself plugin install workflows
```

## Configuration

```bash
# .env.plugins
WORKFLOWS_ENABLED=true
WORKFLOWS_PORT=3110
WORKFLOWS_MAX_CONCURRENT=10
WORKFLOWS_TIMEOUT=300000
WORKFLOWS_ENABLE_CODE_ACTIONS=true
```

## Triggers

- **Message Events**: message.sent, message.edited, message.deleted
- **Channel Events**: channel.created, member.joined, member.left
- **User Events**: user.registered, status.changed, profile.updated
- **Scheduled**: Cron expressions (hourly, daily, weekly, monthly)
- **Webhook**: HTTP POST triggers
- **Custom**: Custom event names

## Actions

- **Messaging**: Send message, edit message, delete message, pin message
- **Channels**: Create channel, archive channel, invite user, remove user
- **Users**: Assign role, send DM, update profile, ban user
- **Notifications**: Push notification, email, SMS
- **HTTP**: GET, POST, PUT, DELETE requests
- **Database**: Query, insert, update, delete
- **Code**: Run JavaScript/Python code
- **Workflows**: Call another workflow, delay execution

## Example Workflow

**Name**: Welcome New Users

**Trigger**: user.registered

**Actions**:

1. Send welcome DM
2. Assign "member" role
3. Add to #general channel
4. Post announcement in #welcome

```json
{
  "name": "Welcome New Users",
  "trigger": {
    "type": "event",
    "event": "user.registered"
  },
  "actions": [
    {
      "type": "send_dm",
      "userId": "{{trigger.userId}}",
      "message": "Welcome to ɳChat! 👋"
    },
    {
      "type": "assign_role",
      "userId": "{{trigger.userId}}",
      "role": "member"
    },
    {
      "type": "add_to_channel",
      "userId": "{{trigger.userId}}",
      "channelId": "general"
    },
    {
      "type": "send_message",
      "channelId": "welcome",
      "message": "Please welcome {{trigger.user.name}}!"
    }
  ]
}
```

## Frontend Integration

```typescript
import { WorkflowBuilder } from '@/components/workflows'

function WorkflowsPage() {
  return (
    <WorkflowBuilder
      onSave={(workflow) => saveWorkflow(workflow)}
      templates={templates}
    />
  )
}
```

## Templates

- Auto-responder for off-hours
- Daily standup reminder
- Inactive user re-engagement
- Spam message detection and removal
- Backup channel to external storage
- Cross-post to multiple channels
- Notify admins of keywords
- Archive inactive channels

---

**Full Documentation**: See `/docs/plugins/WORKFLOWS-PLUGIN.md`
