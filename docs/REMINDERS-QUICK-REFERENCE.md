# Reminders System - Quick Reference Card

**Version**: 1.0.0 | **Status**: Production Ready ✅

---

## 🚀 Quick Start (30 seconds)

```tsx
// 1. Add to your app layout
import { ReminderNotificationContainer } from '@/components/reminders'

<ReminderNotificationContainer userId={user.id} />

// 2. Use in any component
import { useReminders } from '@/lib/reminders/use-reminders'

const { createReminder, reminders } = useReminders({ userId: user.id })
```

---

## 📦 Import Cheat Sheet

```tsx
// Components
import {
  RemindersList,           // Full list with filters
  SetReminderModal,        // Create/Edit modal
  ReminderItem,            // Single reminder card
  ReminderNotification,    // Notification UI
  QuickRemind,             // Quick time picker
  ReminderTimePicker,      // Date/time picker
} from '@/components/reminders'

// Hooks
import {
  useReminders,            // Main hook (full API)
  useChannelReminders,     // Channel-specific
  useRemindersCount,       // Count only
  useMessageReminder,      // Message reminder check
} from '@/lib/reminders/use-reminders'

// Store
import { useReminderStore } from '@/lib/reminders/reminder-store'

// Types
import type { Reminder, ReminderDraft } from '@/graphql/reminders'
```

---

## 🎯 Common Use Cases

### 1. Message Reminder (One-liner)

```tsx
const { setReminderForMessage } = useReminders({ userId: user.id })

// Set reminder for 1 hour from now
await setReminderForMessage({
  messageId: msg.id,
  remindAt: new Date(Date.now() + 3600000),
  timezone: 'America/New_York',
})
```

### 2. Custom Reminder

```tsx
const { createReminder } = useReminders({ userId: user.id })

await createReminder({
  content: 'Call John about the project',
  note: 'Discuss timeline',
  remindAt: new Date('2026-02-15T14:00:00'),
  timezone: 'America/New_York',
  type: 'custom',
  isRecurring: false,
})
```

### 3. Recurring Reminder (Daily Standup)

```tsx
await createReminder({
  content: 'Daily standup',
  remindAt: tomorrow9am,
  timezone: 'UTC',
  type: 'custom',
  isRecurring: true,
  recurrenceRule: {
    frequency: 'daily',
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
  },
})
```

### 4. Quick Remind Menu

```tsx
<QuickRemind
  messageId={msg.id}
  channelId={channel.id}
  messageContent={msg.content}
/>
```

### 5. Full Reminders List

```tsx
<RemindersList
  userId={user.id}
  showFilters
  showSearch
  onEdit={(r) => openEditModal(r)}
/>
```

---

## 🔧 Hook API Reference

### useReminders()

```tsx
const {
  // Data
  reminders,              // All reminders
  upcomingReminders,      // Pending only
  completedReminders,     // Completed/dismissed
  dueReminders,           // Currently due
  pendingCount,           // Count of pending
  nextReminder,           // Next upcoming

  // Loading states
  isLoading,
  isCreating,
  isUpdating,
  isDeleting,

  // CRUD
  createReminder,         // Create new
  updateReminder,         // Update existing
  deleteReminder,         // Delete by ID
  completeReminder,       // Mark complete
  snoozeReminder,         // Snooze for duration
  bulkComplete,           // Complete multiple
  bulkDelete,             // Delete multiple

  // Message-specific
  setReminderForMessage,  // Quick message reminder
  hasReminderForMessage,  // Check if exists
  getReminderForMessage,  // Get by message ID

  // UI helpers
  openReminderModal,      // Open creation modal
  closeReminderModal,     // Close modal
} = useReminders({ userId: user.id })
```

---

## 🎨 Component Props

### SetReminderModal

```tsx
<SetReminderModal
  open={boolean}
  onOpenChange={(open) => {}}
  userId={string}
  messageId={string}        // Optional: for message reminders
  channelId={string}        // Optional: context
  initialContent={string}   // Optional: pre-fill
  editingReminder={reminder} // Optional: edit mode
  onSuccess={(reminder) => {}}
  onCancel={() => {}}
/>
```

### RemindersList

```tsx
<RemindersList
  userId={string}
  channelId={string}        // Optional: filter by channel
  onEdit={(reminder) => {}}
  onCreateNew={() => {}}
  showFilters={true}
  showSearch={true}
  showTabs={true}
  maxHeight="600px"
  className="custom-class"
/>
```

---

## 📊 Quick Time Presets

```tsx
// Built-in presets
const presets = {
  '20min': Date.now() + 20 * 60 * 1000,
  '1hour': Date.now() + 60 * 60 * 1000,
  '3hours': Date.now() + 3 * 60 * 60 * 1000,
  'tomorrow': /* tomorrow 9am */,
  'nextWeek': /* next Monday 9am */,
}

// Use in QuickRemind component automatically
```

---

## 🔔 Notification Types

```tsx
// In-app notification (automatic)
<ReminderNotificationContainer userId={user.id} />

// Desktop notification (requires permission)
const { requestDesktopPermission } = useNotifications()
await requestDesktopPermission()

// Email notification (configure in user settings)
// Handled by backend automatically
```

---

## 🗄️ GraphQL Operations

### Queries

```graphql
# Get all reminders
query GetReminders($userId: uuid!) {
  nchat_reminders(where: { user_id: { _eq: $userId } }) {
    ...ReminderFragment
  }
}

# Get due reminders
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
# Create reminder
mutation CreateReminder($userId: uuid!, $content: String!, $remindAt: timestamptz!) {
  insert_nchat_reminders_one(object: {
    user_id: $userId
    content: $content
    remind_at: $remindAt
  }) {
    ...ReminderFragment
  }
}

# Complete reminder
mutation CompleteReminder($id: uuid!) {
  update_nchat_reminders_by_pk(
    pk_columns: { id: $id }
    _set: { status: "completed", completed_at: "now()" }
  ) {
    ...ReminderFragment
  }
}
```

---

## 🌐 REST API

```bash
# Get reminders
GET /api/reminders?status=pending&limit=50

# Create reminder
POST /api/reminders
{
  "content": "Review PR",
  "remindAt": "2026-02-15T14:00:00Z",
  "timezone": "America/New_York"
}

# Complete reminder
POST /api/reminders
{
  "action": "complete",
  "id": "uuid"
}

# Snooze reminder
POST /api/reminders
{
  "action": "snooze",
  "id": "uuid",
  "snoozeDuration": 3600000
}

# Update reminder
PUT /api/reminders
{
  "id": "uuid",
  "content": "Updated text",
  "remindAt": "2026-02-16T10:00:00Z"
}

# Delete reminder
DELETE /api/reminders?id=uuid
```

---

## 🎯 Status Values

```tsx
type ReminderStatus = 'pending' | 'completed' | 'dismissed' | 'snoozed'

type ReminderType = 'message' | 'custom' | 'followup'

type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
```

---

## 🔍 Filtering Examples

```tsx
const { setFilter } = useReminderStore()

// Filter by status
setFilter({ status: 'pending' })

// Filter by type
setFilter({ type: 'message' })

// Filter by channel
setFilter({ channelId: 'channel-uuid' })

// Combined filters
setFilter({
  status: 'pending',
  type: 'message',
  channelId: 'channel-uuid',
})

// Reset filters
setFilter({
  status: 'all',
  type: 'all',
  channelId: undefined,
})
```

---

## ⚡ Performance Tips

1. **Use Subscriptions** for real-time updates (already configured)
2. **Pagination**: Use `limit` and `offset` for large lists
3. **Memoization**: Components use `useMemo` internally
4. **Lazy Load**: Modal loads only when opened
5. **Batch Operations**: Use `bulkComplete`/`bulkDelete` for multiple items

---

## 🐛 Debugging

```tsx
// Check feature flag
const isEnabled = useFeatureEnabled(FEATURES.REMINDERS)

// View store state
const state = useReminderStore.getState()
console.log('Reminders:', state.reminders)
console.log('Due:', state.dueReminders)
console.log('Filter:', state.filter)

// Test notification
const { showNotification } = useReminderStore()
showNotification('reminder-id')

// Force refetch
const { fetchReminders } = useReminders({ userId: user.id })
await fetchReminders()
```

---

## 📱 Mobile/Desktop Compatibility

```tsx
// Capacitor (iOS/Android)
import { Plugins } from '@capacitor/core'
const { LocalNotifications } = Plugins

// Electron (Desktop)
if (window.electron) {
  window.electron.notification.show(...)
}

// Both handled automatically by ReminderNotificationContainer
```

---

## 🔐 Permissions

```tsx
// Desktop notifications
const { requestDesktopPermission } = useNotifications()
if (Notification.permission === 'default') {
  await requestDesktopPermission()
}

// User can only access their own reminders
// Enforced by Hasura permissions (user_id = X-Hasura-User-Id)
```

---

## ✅ Pre-flight Checklist

Before using reminders:

- [ ] Feature flag enabled: `FEATURES.REMINDERS`
- [ ] Database table exists: `nchat_reminders`
- [ ] Hasura permissions configured
- [ ] GraphQL endpoint accessible
- [ ] User authenticated

---

## 📚 More Resources

- **Full Documentation**: `/docs/Reminders-System.md`
- **Component Guide**: `/src/components/reminders/README.md`
- **Implementation**: `/REMINDERS-IMPLEMENTATION.md`
- **GraphQL Schema**: `/src/graphql/reminders.ts`
- **API Route**: `/src/app/api/reminders/route.ts`

---

## 🆘 Common Issues

**Reminder not showing?**
```tsx
// Check if due
const dueReminders = useReminderStore(s => s.dueReminders)

// Force check
const { checkDueReminders } = useReminders({ userId })
checkDueReminders()
```

**Desktop notification not working?**
```tsx
// Check permission
console.log(Notification.permission) // Should be "granted"

// Request permission
await requestDesktopPermission()
```

**Timezone issues?**
```tsx
// Use user's timezone
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

// Or specify
const tz = 'America/New_York'
```

---

## 💡 Pro Tips

1. **Combine with Message Actions**: Add to message dropdown menu
2. **Keyboard Shortcuts**: Use `Cmd+Shift+R` to open modal (if configured)
3. **Default Times**: Most users prefer 1 hour, tomorrow 9am, next week
4. **Batch Creating**: Use CSV import for bulk reminders (custom implementation)
5. **Analytics**: Track reminder completion rate for insights

---

**Print this page and keep it handy! 📄**

---

*Last updated: February 1, 2026*
