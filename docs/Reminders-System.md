# Reminders System - Complete Implementation Guide

**Version**: 1.0.0
**Last Updated**: February 1, 2026
**Status**: Production Ready ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Components](#components)
5. [API Reference](#api-reference)
6. [GraphQL Schema](#graphql-schema)
7. [Usage Examples](#usage-examples)
8. [Bot Commands](#bot-commands)
9. [Database Schema](#database-schema)
10. [Testing](#testing)

---

## Overview

The Reminders System provides a complete Slack-like reminder functionality for nself-chat. Users can set reminders on messages, create custom reminders, and configure recurring reminders with flexible scheduling options.

### Key Capabilities

- **Message Reminders**: Set reminders on any message in any channel
- **Custom Reminders**: Create standalone reminders with custom text
- **Recurring Reminders**: Daily, weekly, monthly, or yearly recurrence
- **Quick Time Selection**: Preset time options (20 minutes, 1 hour, tomorrow, etc.)
- **Snooze Functionality**: Postpone reminders temporarily
- **Multi-Channel Notifications**: In-app, desktop, and email notifications
- **Natural Language**: `/remind` command with natural language parsing
- **Timezone Support**: Full timezone awareness for global teams
- **Bulk Operations**: Complete or delete multiple reminders at once

---

## Features

### ✅ Implemented Features

#### Reminder Types

1. **Message Reminder**
   - Remind about a specific message
   - Jump to message when reminder fires
   - Shows message preview and author

2. **Custom Reminder**
   - Standalone reminder with custom text
   - No message association
   - Flexible notes and descriptions

3. **Follow-up Reminder**
   - Special type for follow-up tasks
   - Can be linked to channels or threads
   - Optimized for task management

#### Reminder Times

- **Quick Presets**:
  - In 20 minutes
  - In 1 hour
  - In 3 hours
  - Tomorrow (9:00 AM)
  - Next week (Monday 9:00 AM)

- **Custom Date/Time**:
  - Date picker with calendar
  - Time picker with hours/minutes
  - Timezone selector (IANA format)
  - Future validation

#### Recurring Reminders

- **Frequencies**: Daily, Weekly, Monthly, Yearly
- **Interval**: Repeat every N days/weeks/months/years
- **Days of Week**: Select specific days (for weekly)
- **End Conditions**: End date or occurrence count
- **Auto-generation**: Creates next occurrence on completion

#### Reminder Management

- **List All Reminders**: View all upcoming and completed reminders
- **Filter & Search**: Filter by status, type, channel; search content
- **Group By**: Group by date (Today, This Week, Later) or by channel
- **Edit Reminder**: Modify time, content, recurrence settings
- **Delete Reminder**: Permanently remove a reminder
- **Mark Complete**: Mark as done (keeps in history)
- **Snooze Reminder**: Postpone for 10m, 30m, 1h, or custom duration
- **Bulk Actions**: Complete or delete multiple reminders

#### Notifications

1. **In-App Notification**
   - Toast notification when reminder is due
   - Shows content and quick actions
   - Click to jump to message/channel

2. **Desktop Notification**
   - Native OS notification
   - Requires permission
   - Customizable sound and duration

3. **Email Notification** (Optional)
   - Email sent when reminder is due
   - Includes message preview and link
   - Configurable in user preferences

#### Bot Integration

- **`/remind` Command**: Natural language reminder creation
- **Examples**:
  - `/remind me in 2 hours to review the PR`
  - `/remind me tomorrow at 9am to call John`
  - `/remind @john in 1 hour about the meeting`
  - `/remind #general in 30 minutes to join standup`

---

## Architecture

### Tech Stack

```
Frontend:
├── React 19.0.0 (with hooks)
├── Zustand 5.0.3 (state management)
├── Radix UI (components)
├── TailwindCSS 3.4.17 (styling)
└── Framer Motion 11.18.0 (animations)

Backend:
├── Next.js 15.1.6 API Routes
├── Hasura GraphQL Engine
├── PostgreSQL (via nself CLI)
└── GraphQL Subscriptions (real-time)

Notifications:
├── Browser Notification API
├── Custom toast system
└── Email service integration
```

### Data Flow

```
User Action (UI)
    ↓
Component (React)
    ↓
Hook (useReminders)
    ↓
Store (Zustand) ←→ GraphQL Client (Apollo)
    ↓                    ↓
Local State         Hasura GraphQL
                         ↓
                    PostgreSQL
                         ↓
                    Subscriptions
                         ↓
                    Real-time Updates
```

### File Structure

```
src/
├── components/reminders/
│   ├── index.ts                    # Exports
│   ├── set-reminder-modal.tsx      # Main creation/edit modal
│   ├── reminders-list.tsx          # List view with filters
│   ├── reminder-item.tsx           # Individual reminder card
│   ├── reminder-notification.tsx   # Notification components
│   ├── reminder-time-picker.tsx    # Date/time picker
│   └── quick-remind.tsx            # Quick time selection
├── lib/reminders/
│   ├── index.ts                    # Exports
│   ├── reminder-store.ts           # Zustand store
│   └── use-reminders.ts            # Main React hook
├── graphql/
│   └── reminders.ts                # GraphQL queries/mutations
├── app/api/reminders/
│   └── route.ts                    # REST API endpoints
└── types/
    └── reminder.ts                 # TypeScript types
```

---

## Components

### 1. SetReminderModal

**Purpose**: Primary UI for creating and editing reminders

**Props**:
```typescript
interface SetReminderModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  userId: string
  messageId?: string              // For message reminders
  channelId?: string
  initialContent?: string
  editingReminder?: Reminder | null
  onSuccess?: (reminder: Reminder) => void
  onCancel?: () => void
}
```

**Features**:
- Quick time presets (tabs)
- Custom date/time picker
- Recurring reminder configuration
- Message preview (for message reminders)
- Real-time validation
- Preview panel

**Usage**:
```tsx
import { SetReminderModal } from '@/components/reminders'

<SetReminderModal
  open={isOpen}
  onOpenChange={setIsOpen}
  userId={currentUser.id}
  messageId={message.id}
  onSuccess={(reminder) => {
    console.log('Reminder created:', reminder)
  }}
/>
```

---

### 2. RemindersList

**Purpose**: Display and manage all reminders

**Props**:
```typescript
interface RemindersListProps {
  userId: string
  channelId?: string              // Filter to specific channel
  onEdit?: (reminder: Reminder) => void
  onCreateNew?: () => void
  showFilters?: boolean
  showSearch?: boolean
  showTabs?: boolean
  maxHeight?: string | number
  emptyMessage?: string
  className?: string
}
```

**Features**:
- Tabbed view (Upcoming / Completed)
- Search and filter bar
- Group by date or channel
- Bulk actions (complete all, delete all)
- Collapsible groups
- Empty states

**Usage**:
```tsx
import { RemindersList } from '@/components/reminders'

<RemindersList
  userId={currentUser.id}
  showFilters={true}
  showSearch={true}
  maxHeight="600px"
  onEdit={(reminder) => openEditModal(reminder)}
/>
```

---

### 3. ReminderNotification

**Purpose**: Display when reminder is due

**Components**:
- `ReminderNotification`: Full-featured notification
- `ReminderToast`: Toast-style notification
- `ReminderBell`: Badge with count
- `ReminderNotificationContainer`: Container for active notifications

**Features**:
- Auto-dismiss or persistent
- Quick actions (Complete, Snooze, Dismiss)
- Sound alerts
- Desktop notifications
- Click to navigate

**Usage**:
```tsx
import { ReminderNotificationContainer } from '@/components/reminders'

// Add to your app layout
<ReminderNotificationContainer userId={currentUser.id} />
```

---

### 4. QuickRemind

**Purpose**: Quick reminder creation from messages

**Components**:
- `QuickRemind`: Full dropdown menu
- `QuickRemindButtons`: Button grid
- `MessageQuickRemind`: Message action integration

**Features**:
- Preset time options
- One-click reminder creation
- Message context aware
- Custom time option

**Usage**:
```tsx
import { MessageQuickRemind } from '@/components/reminders'

<MessageQuickRemind
  messageId={message.id}
  channelId={channel.id}
  messageContent={message.content}
  userId={currentUser.id}
/>
```

---

## API Reference

### REST API

Base URL: `/api/reminders`

#### GET /api/reminders

Fetch reminders for authenticated user.

**Query Parameters**:
- `status`: Filter by status (`pending`, `completed`, `dismissed`, `snoozed`)
- `channelId`: Filter by channel ID
- `type`: Filter by type (`message`, `custom`, `followup`)
- `limit`: Maximum results (default 50, max 100)
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "uuid",
        "content": "Review PR",
        "remind_at": "2026-02-01T15:00:00Z",
        "status": "pending",
        "type": "custom"
      }
    ],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

#### POST /api/reminders

Create a new reminder.

**Request Body**:
```json
{
  "messageId": "uuid (optional)",
  "channelId": "uuid (optional)",
  "content": "Reminder text",
  "note": "Additional note (optional)",
  "remindAt": "2026-02-01T15:00:00Z",
  "timezone": "America/New_York",
  "type": "custom",
  "isRecurring": false,
  "recurrenceRule": {
    "frequency": "daily",
    "interval": 1,
    "endDate": "2026-03-01T00:00:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reminder": { /* full reminder object */ },
    "message": "Reminder created successfully"
  }
}
```

#### POST /api/reminders (Actions)

Perform actions on existing reminders.

**Request Body**:
```json
{
  "action": "complete | dismiss | snooze | unsnooze",
  "id": "uuid",
  "snoozeDuration": 3600000  // milliseconds (for snooze)
}
```

#### PUT /api/reminders

Update an existing reminder.

**Request Body**:
```json
{
  "id": "uuid",
  "content": "Updated text",
  "remindAt": "2026-02-02T10:00:00Z"
}
```

#### DELETE /api/reminders

Delete a reminder.

**Query Parameters**:
- `id`: Reminder ID

---

## GraphQL Schema

### Types

```graphql
type nchat_reminders {
  id: uuid!
  user_id: uuid!
  message_id: uuid
  channel_id: uuid
  content: String!
  note: String
  remind_at: timestamptz!
  timezone: String!
  status: String!
  type: String!
  is_recurring: Boolean!
  recurrence_rule: jsonb
  completed_at: timestamptz
  snoozed_until: timestamptz
  snooze_count: Int!
  created_at: timestamptz!
  updated_at: timestamptz!

  user: nchat_users!
  message: nchat_messages
  channel: nchat_channels
}
```

### Queries

```graphql
query GetReminders($userId: uuid!, $status: String) {
  nchat_reminders(
    where: { user_id: { _eq: $userId }, status: { _eq: $status } }
    order_by: { remind_at: asc }
  ) {
    ...ReminderFragment
  }
}

query GetDueReminders($userId: uuid!, $now: timestamptz!) {
  nchat_reminders(
    where: {
      user_id: { _eq: $userId }
      status: { _eq: "pending" }
      remind_at: { _lte: $now }
    }
  ) {
    ...ReminderFragment
  }
}
```

### Mutations

```graphql
mutation CreateReminder($userId: uuid!, $content: String!, $remindAt: timestamptz!) {
  insert_nchat_reminders_one(object: {
    user_id: $userId
    content: $content
    remind_at: $remindAt
    timezone: "UTC"
    status: "pending"
    type: "custom"
  }) {
    ...ReminderFragment
  }
}

mutation CompleteReminder($id: uuid!) {
  update_nchat_reminders_by_pk(
    pk_columns: { id: $id }
    _set: { status: "completed", completed_at: "now()" }
  ) {
    ...ReminderFragment
  }
}

mutation SnoozeReminder($id: uuid!, $snoozedUntil: timestamptz!) {
  update_nchat_reminders_by_pk(
    pk_columns: { id: $id }
    _set: {
      status: "snoozed"
      snoozed_until: $snoozedUntil
      remind_at: $snoozedUntil
    }
    _inc: { snooze_count: 1 }
  ) {
    ...ReminderFragment
  }
}
```

### Subscriptions

```graphql
subscription ReminderDue($userId: uuid!, $now: timestamptz!) {
  nchat_reminders(
    where: {
      user_id: { _eq: $userId }
      status: { _eq: "pending" }
      remind_at: { _lte: $now }
    }
  ) {
    ...ReminderFragment
  }
}
```

---

## Usage Examples

### Example 1: Message Reminder from Context Menu

```tsx
import { useReminders } from '@/lib/reminders/use-reminders'

function MessageActions({ message, user }) {
  const { setReminderForMessage } = useReminders({ userId: user.id })

  const handleRemindIn1Hour = async () => {
    const remindAt = new Date(Date.now() + 60 * 60 * 1000)

    await setReminderForMessage({
      messageId: message.id,
      channelId: message.channel_id,
      content: `Remind me about this message`,
      remindAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }

  return (
    <button onClick={handleRemindIn1Hour}>
      Remind me in 1 hour
    </button>
  )
}
```

### Example 2: Custom Reminder with Recurrence

```tsx
import { useReminders } from '@/lib/reminders/use-reminders'

function DailyStandupReminder({ user }) {
  const { createReminder } = useReminders({ userId: user.id })

  const setupDailyReminder = async () => {
    const tomorrow9am = new Date()
    tomorrow9am.setDate(tomorrow9am.getDate() + 1)
    tomorrow9am.setHours(9, 0, 0, 0)

    await createReminder({
      content: 'Daily standup meeting',
      note: 'Join the team standup',
      remindAt: tomorrow9am,
      timezone: 'America/New_York',
      type: 'custom',
      isRecurring: true,
      recurrenceRule: {
        frequency: 'daily',
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
      },
    })
  }

  return <button onClick={setupDailyReminder}>Setup Daily Standup</button>
}
```

### Example 3: Reminder List with Filtering

```tsx
import { RemindersList } from '@/components/reminders'
import { SetReminderModal } from '@/components/reminders'
import { useState } from 'react'

function RemindersPage({ user }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)

  return (
    <div>
      <RemindersList
        userId={user.id}
        showFilters={true}
        showSearch={true}
        onEdit={(reminder) => {
          setEditingReminder(reminder)
          setIsModalOpen(true)
        }}
        onCreateNew={() => setIsModalOpen(true)}
      />

      <SetReminderModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={user.id}
        editingReminder={editingReminder}
        onSuccess={() => {
          setIsModalOpen(false)
          setEditingReminder(null)
        }}
      />
    </div>
  )
}
```

### Example 4: Reminder Badge in Header

```tsx
import { useRemindersCount } from '@/lib/reminders/use-reminders'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function HeaderBell({ user }) {
  const { count } = useRemindersCount(user.id)

  return (
    <button className="relative">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </button>
  )
}
```

---

## Bot Commands

### `/remind` Command

Natural language reminder creation via bot commands.

#### Basic Syntax

```
/remind [target] [time] [message]
```

#### Examples

**Personal Reminders**:
```
/remind me in 2 hours to review the PR
/remind me tomorrow at 9am to call John
/remind me next week about the deadline
/remind me on Friday at 3pm to submit report
```

**Mention Reminders**:
```
/remind @john in 1 hour about the meeting
/remind @sarah tomorrow to review the document
```

**Channel Reminders**:
```
/remind #general in 30 minutes to join standup
/remind #dev-team tomorrow at 10am about deployment
```

#### Time Formats Supported

- **Relative**: `in X minutes/hours/days/weeks`
- **Specific Time**: `tomorrow at 9am`, `Friday at 3pm`
- **Date**: `on February 15`, `on 2026-02-15`
- **Combined**: `next Monday at 2pm`

#### Recurring Reminders

```
/remind me every day at 9am to check emails
/remind #team every Monday at 10am for standup
/remind me every week to submit timesheet
```

---

## Database Schema

### Table: `nchat_reminders`

```sql
CREATE TABLE nchat_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES nchat_messages(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES nchat_channels(id) ON DELETE SET NULL,

  content text NOT NULL,
  note text,

  remind_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'dismissed', 'snoozed')),
  type text NOT NULL DEFAULT 'custom'
    CHECK (type IN ('message', 'custom', 'followup')),

  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule jsonb,

  completed_at timestamptz,
  snoozed_until timestamptz,
  snooze_count integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reminders_user_status ON nchat_reminders(user_id, status);
CREATE INDEX idx_reminders_remind_at ON nchat_reminders(remind_at);
CREATE INDEX idx_reminders_message ON nchat_reminders(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX idx_reminders_channel ON nchat_reminders(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_reminders_due ON nchat_reminders(user_id, status, remind_at)
  WHERE status = 'pending';
```

### Permissions (Hasura)

```yaml
table: nchat_reminders
permissions:
  - role: user
    select:
      filter:
        user_id: { _eq: X-Hasura-User-Id }
      columns: '*'
    insert:
      check:
        user_id: { _eq: X-Hasura-User-Id }
      columns:
        - user_id
        - message_id
        - channel_id
        - content
        - note
        - remind_at
        - timezone
        - type
        - is_recurring
        - recurrence_rule
    update:
      filter:
        user_id: { _eq: X-Hasura-User-Id }
      columns:
        - content
        - note
        - remind_at
        - timezone
        - status
        - is_recurring
        - recurrence_rule
        - completed_at
        - snoozed_until
        - snooze_count
    delete:
      filter:
        user_id: { _eq: X-Hasura-User-Id }
```

---

## Testing

### Unit Tests

```typescript
// Example: reminder-store.test.ts
import { useReminderStore } from '@/lib/reminders/reminder-store'

describe('ReminderStore', () => {
  it('should add a reminder', () => {
    const { addReminder, reminders } = useReminderStore.getState()

    const newReminder = {
      id: '1',
      content: 'Test reminder',
      status: 'pending',
      // ... other fields
    }

    addReminder(newReminder)
    expect(reminders).toContainEqual(newReminder)
  })

  it('should update reminder status', () => {
    const { updateReminder, getReminderById } = useReminderStore.getState()

    updateReminder('1', { status: 'completed' })

    const reminder = getReminderById('1')
    expect(reminder?.status).toBe('completed')
  })
})
```

### Integration Tests

```typescript
// Example: reminder-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SetReminderModal } from '@/components/reminders'

describe('Reminder Creation Flow', () => {
  it('should create a reminder successfully', async () => {
    render(<SetReminderModal open={true} userId="user-1" />)

    // Enter content
    const contentInput = screen.getByPlaceholderText('Enter your reminder...')
    fireEvent.change(contentInput, { target: { value: 'Test reminder' } })

    // Select time preset
    const in1HourButton = screen.getByText('In 1 hour')
    fireEvent.click(in1HourButton)

    // Submit
    const submitButton = screen.getByText('Set Reminder')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Reminder created successfully')).toBeInTheDocument()
    })
  })
})
```

---

## Next Steps

### Future Enhancements

1. **Smart Reminders**: AI-powered suggestions based on message content
2. **Team Reminders**: Remind multiple people at once
3. **Follow-up Threads**: Auto-create thread on reminder
4. **Integration**: Sync with Google Calendar, Outlook
5. **Voice Reminders**: Voice command support
6. **Geofencing**: Location-based reminders
7. **Priority Queue**: Urgent vs. normal reminders
8. **Templates**: Pre-configured reminder templates

### Migration Guide

If upgrading from a previous system:

1. **Database Migration**: Run schema migration
2. **Data Migration**: Import existing reminders
3. **Update Imports**: Update component imports
4. **Test**: Verify all features work
5. **Deploy**: Roll out to production

---

## Support

For issues, questions, or feature requests:
- GitHub Issues: [nself-chat/issues](https://github.com/nself/nself-chat/issues)
- Documentation: [docs/Reminders-System.md](./Reminders-System.md)
- Email: support@nself.org

---

**Built with ❤️ by the nself-chat team**
