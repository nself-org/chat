# Features Overview

Complete reference of all 78+ features in nself-chat, organized by category.

---

## Feature Categories

| Category | Features | Status |
|----------|----------|--------|
| [Messaging](Features-Messaging) | 14 | Implemented |
| [Channels](Features-Channels) | 9 | Implemented |
| [Files & Media](Features-Files) | 8 | Implemented |
| [Users & Presence](Features-Users) | 7 | Implemented |
| [Real-time](Features-Realtime) | 5 | Implemented |
| [Search](Features-Search) | 6 | Implemented |
| [Notifications](Features-Notifications) | 6 | Implemented |
| [Emoji & Reactions](Features-Emoji) | 4 | Implemented |
| [Polls & Voting](Features-Polls) | 3 | Implemented |
| [Voice Messages](Features-Voice) | 4 | Implemented |
| [Bots & Automation](Features-Bots) | 6 | Implemented |
| [Admin](Admin-Dashboard) | 6 | Implemented |
| [Moderation](Admin-Moderation) | 6 | Implemented |

---

## Messaging Features (14)

| Feature | Description | Flag |
|---------|-------------|------|
| **Edit Messages** | Modify sent messages | `messages.edit` |
| **Delete Messages** | Remove messages | `messages.delete` |
| **Reactions** | Emoji reactions on messages | `messages.reactions` |
| **Threads** | Threaded replies | `messages.threads` |
| **Pins** | Pin important messages | `messages.pins` |
| **Bookmarks** | Save messages for later | `messages.bookmarks` |
| **Forward** | Forward to other channels | `messages.forward` |
| **Schedule** | Send messages later | `messages.schedule` |
| **Voice Messages** | Audio message recording | `messages.voice` |
| **Code Blocks** | Syntax-highlighted code | `messages.codeBlocks` |
| **Markdown** | Rich text formatting | `messages.markdown` |
| **Link Previews** | URL unfurling | `messages.linkPreviews` |
| **Mentions** | @user and @channel | `messages.mentions` |
| **Quotes** | Quote previous messages | `messages.quotes` |

---

## Channel Features (9)

| Feature | Description | Flag |
|---------|-------------|------|
| **Public Channels** | Open to all members | `channels.public` |
| **Private Channels** | Invite-only access | `channels.private` |
| **Direct Messages** | 1-on-1 conversations | `channels.direct` |
| **Group DMs** | Multi-user DMs | `channels.groupDm` |
| **Categories** | Organize channels | `channels.categories` |
| **Topics** | Channel descriptions | `channels.topics` |
| **Archive** | Archive inactive channels | `channels.archive` |
| **Favorites** | Star channels | `channels.favorites` |
| **Mute** | Silence notifications | `channels.mute` |

---

## File Features (8)

| Feature | Description | Flag |
|---------|-------------|------|
| **File Upload** | Upload attachments | `files.upload` |
| **Images** | Image attachments | `files.images` |
| **Documents** | PDF, DOC, etc. | `files.documents` |
| **Audio** | Audio file uploads | `files.audio` |
| **Video** | Video file uploads | `files.video` |
| **Preview** | In-app file viewing | `files.preview` |
| **Drag & Drop** | Drag files to upload | `files.dragDrop` |
| **Clipboard** | Paste images | `files.clipboard` |

---

## User Features (7)

| Feature | Description | Flag |
|---------|-------------|------|
| **Presence** | Online/away status | `users.presence` |
| **Custom Status** | Custom status messages | `users.customStatus` |
| **Profiles** | User profile pages | `users.profiles` |
| **Roles** | Role-based permissions | `users.roles` |
| **Blocking** | Block users | `users.blocking` |
| **Avatars** | Profile pictures | `users.avatars` |
| **Display Names** | Custom display names | `users.displayNames` |

---

## Real-time Features (5)

| Feature | Description | Flag |
|---------|-------------|------|
| **Typing Indicators** | Show who's typing | `realtime.typing` |
| **Read Receipts** | Message read status | `realtime.readReceipts` |
| **Presence Updates** | Live presence | `realtime.presence` |
| **Live Messages** | Instant delivery | `realtime.messages` |
| **Live Notifications** | Push notifications | `realtime.notifications` |

---

## Search Features (6)

| Feature | Description | Flag |
|---------|-------------|------|
| **Message Search** | Search messages | `search.messages` |
| **File Search** | Search files | `search.files` |
| **User Search** | Search users | `search.users` |
| **Global Search** | Cross-content search | `search.global` |
| **Search Filters** | Advanced filters | `search.filters` |
| **Highlighting** | Result highlighting | `search.highlighting` |

---

## Notification Features (6)

| Feature | Description | Flag |
|---------|-------------|------|
| **Desktop** | Browser notifications | `notifications.desktop` |
| **Sound** | Audio alerts | `notifications.sound` |
| **Email** | Email notifications | `notifications.email` |
| **Mobile** | Push notifications | `notifications.mobile` |
| **Do Not Disturb** | Pause notifications | `notifications.dnd` |
| **Schedule** | Quiet hours | `notifications.schedule` |

---

## Advanced Features (12)

| Feature | Description | Flag |
|---------|-------------|------|
| **Custom Emoji** | Upload custom emoji | `advanced.customEmoji` |
| **GIF Picker** | Giphy/Tenor integration | `advanced.gifPicker` |
| **Stickers** | Sticker packs | `advanced.stickers` |
| **Polls** | Create polls | `advanced.polls` |
| **Webhooks** | Incoming/outgoing hooks | `advanced.webhooks` |
| **Bots** | Bot accounts | `advanced.bots` |
| **Slash Commands** | /command support | `advanced.slashCommands` |
| **Integrations** | Third-party apps | `advanced.integrations` |
| **Reminders** | Set reminders | `advanced.reminders` |
| **Workflows** | Automation | `advanced.workflows` |
| **Video Calls** | Video conferencing | `advanced.videoCalls` |
| **Screen Share** | Share your screen | `advanced.screenShare` |

---

## Admin Features (6)

| Feature | Description | Flag |
|---------|-------------|------|
| **Dashboard** | Admin overview | `admin.dashboard` |
| **User Management** | Manage users | `admin.userManagement` |
| **Analytics** | Usage statistics | `admin.analytics` |
| **Audit Logs** | Activity logging | `admin.auditLogs` |
| **Bulk Operations** | Batch actions | `admin.bulkOperations` |
| **Export** | Data export | `admin.export` |

---

## Moderation Features (6)

| Feature | Description | Flag |
|---------|-------------|------|
| **Moderation Tools** | Content moderation | `moderation.tools` |
| **Reporting** | User reports | `moderation.reporting` |
| **Auto-filter** | Content filtering | `moderation.autoFilter` |
| **Warnings** | User warnings | `moderation.warnings` |
| **Bans** | User bans | `moderation.bans` |
| **Slow Mode** | Rate limiting | `moderation.slowMode` |

---

## Feature Flag System

All features can be toggled via the `AppConfig.features` object or environment variables.

### Enabling Features

```typescript
// Via AppConfig
const { updateConfig } = useAppConfig()
await updateConfig({
  features: {
    polls: true,
    voiceMessages: true,
    stickers: true
  }
})
```

### Checking Feature Status

```typescript
import { useFeature } from '@/lib/features'

function MyComponent() {
  const isPollsEnabled = useFeature('advanced.polls')

  if (!isPollsEnabled) return null

  return <PollCreator />
}
```

### Via Environment Variables

```env
NEXT_PUBLIC_ENABLE_POLLS=true
NEXT_PUBLIC_ENABLE_VOICE_MESSAGES=true
NEXT_PUBLIC_ENABLE_STICKERS=true
```

---

## Feature Dependencies

Some features depend on others:

| Feature | Requires |
|---------|----------|
| Threads | Messaging |
| Reactions | Messaging |
| Read Receipts | Real-time |
| Typing Indicators | Real-time |
| File Preview | File Upload |
| Custom Emoji | Reactions |

---

## Related Documentation

- [Feature Flags Reference](Feature-Flags)
- [Configuration Guide](Configuration)
- [Plugins](Plugins)
