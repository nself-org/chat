# Channels and Communities Implementation Plan

**Version**: 0.9.1
**Status**: Planning Phase
**Tasks Covered**: TODO.md Tasks 60-65 (Phase 6)
**Last Updated**: 2026-02-03

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Research Summary](#platform-research-summary)
3. [Channel Types (Task 60)](#1-channel-types-task-60)
4. [Channel CRUD](#2-channel-crud)
5. [Categories/Sections (Task 61)](#3-categoriessections-task-61)
6. [Discord-Style Servers (Task 62)](#4-discord-style-servers-task-62)
7. [Telegram/WhatsApp Structures (Task 63)](#5-telegramwhatsapp-structures-task-63)
8. [Broadcast Lists (Task 64)](#6-broadcast-lists-task-64)
9. [Channel Permissions (Task 65)](#7-channel-permissions-task-65)
10. [Database Schema](#8-database-schema)
11. [API Endpoints](#9-api-endpoints)
12. [Real-time Events](#10-real-time-events)
13. [UI Components](#11-ui-components)
14. [Implementation Phases](#12-implementation-phases)
15. [Testing Requirements](#13-testing-requirements)
16. [Migration Strategy](#14-migration-strategy)

---

## Executive Summary

This document provides a comprehensive implementation plan for channels and communities in nchat (nself-chat), achieving feature parity with Slack, Discord, Telegram, and WhatsApp while maintaining a unified, flexible architecture.

### Goals

- Support all major channel types (public, private, DM, group DM, broadcast)
- Implement Discord-style server/guild hierarchy
- Support Telegram-style channels, groups, and supergroups
- Support WhatsApp-style communities with sub-groups
- Granular permission system with role and user-level overrides
- Real-time synchronization across all clients

### Existing Infrastructure

The codebase already has foundational types and components:

- `/src/types/channel.ts` - Core channel type definitions
- `/src/stores/channel-store.ts` - Zustand store for channel state
- `/src/lib/rbac/channel-permissions.ts` - Permission management
- `/src/lib/channels/channel-categories.ts` - Category definitions
- `/src/graphql/mutations/channels.ts` - GraphQL mutations

---

## Platform Research Summary

### Slack Conversations API

- **Unified API**: Single `conversations.*` API handles all channel-like entities
- **Channel Types**: public_channel, private_channel, mpim (group DM), im (DM)
- **Channel IDs**: Prefix indicates type (C=channel, G=group, D=DM)
- **Workspaces**: Enterprise Grid supports multi-workspace channels
- **Permissions**: Scoped by type (channels:read, groups:read, mpim:read, im:read)

**Reference**: [Slack Conversations API](https://api.slack.com/docs/conversations-api)

### Discord Guilds/Servers

- **Guild Hierarchy**: Guild > Categories > Channels > Threads
- **Channel Types**: Text, Voice, Announcement, Stage, Forum
- **Permission Overwrites**: 53-bit integer with bitwise operations
- **Hierarchy**: Channel(User) > Channel(Role) > Channel(@everyone) > Server(@everyone) > Server(Role)
- **Categories**: Channels can inherit or override category permissions

**Reference**: [Discord Permissions](https://discordjs.guide/popular-topics/permissions)

### Telegram Channels & Groups

- **Basic Groups**: Up to 200 members, shared message ID sequence
- **Supergroups**: Up to 200,000 members, separate message sequence
- **Gigagroups**: No member limit, admin-only posting
- **Channels**: One-way broadcast, admin posting only
- **Forums**: Supergroups split into distinct topics

**Reference**: [Telegram API Channels](https://core.telegram.org/api/channel)

### WhatsApp Communities

- **Structure**: Community > Announcement Group + Sub-groups
- **Limits**: 100 sub-groups, 2,000 members total, 1,024 per sub-group
- **Channels**: One-way broadcast, unlimited followers
- **Broadcast Lists**: Up to 256 contacts, requires mutual contact

**Reference**: [WhatsApp Communities](https://respond.io/blog/whatsapp-communities)

---

## 1. Channel Types (Task 60)

### 1.1 Type Definitions

```typescript
// Extended channel type enum
export enum ChannelType {
  // Standard channels
  PUBLIC = 'public', // Anyone can join
  PRIVATE = 'private', // Invite only

  // Direct messaging
  DIRECT = 'direct', // 1:1 DM
  GROUP_DM = 'group_dm', // Multi-user DM (up to 10)

  // Broadcast types
  BROADCAST = 'broadcast', // One-way announcements
  ANNOUNCEMENT = 'announcement', // Read-only except admins

  // Special types
  VOICE = 'voice', // Voice-only channel
  STAGE = 'stage', // Presentation/event channel
  FORUM = 'forum', // Topic-based discussions
  THREAD = 'thread', // Message thread
}

// Channel subtype for more granular control
export enum ChannelSubtype {
  STANDARD = 'standard',
  SUPERGROUP = 'supergroup', // Telegram-style large group
  GIGAGROUP = 'gigagroup', // Telegram-style admin-only
  COMMUNITY_ANNOUNCEMENT = 'community_announcement',
  NEWS = 'news', // Discord-style news channel
}
```

### 1.2 Channel Interface

```typescript
export interface Channel {
  id: string
  workspaceId: string // Server/workspace this belongs to
  parentId?: string // For threads: parent channel
  categoryId?: string // Category grouping

  name: string
  slug: string
  description?: string
  topic?: string

  type: ChannelType
  subtype?: ChannelSubtype

  // Visibility & Access
  visibility: 'visible' | 'hidden' | 'archived'
  isPrivate: boolean
  isNsfw: boolean
  isReadOnly: boolean
  isDefault: boolean // Auto-join for new members

  // Media & Display
  icon?: string
  color?: string
  banner?: string

  // Ordering
  position: number

  // Ownership
  ownerId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date

  // Archive state
  isArchived: boolean
  archivedAt?: Date
  archivedBy?: string

  // Stats (denormalized)
  memberCount: number
  messageCount: number
  lastMessageAt?: Date
  lastMessageId?: string

  // Settings
  settings: ChannelSettings

  // Permission template (null = inherit)
  permissionSyncId?: string
}
```

### 1.3 Implementation Tasks

| Task                               | Priority | Effort | Dependencies      |
| ---------------------------------- | -------- | ------ | ----------------- |
| Define extended ChannelType enum   | P0       | 2h     | None              |
| Update Channel interface           | P0       | 4h     | ChannelType       |
| Create channel type validators     | P0       | 2h     | Channel interface |
| Build channel type icons/labels    | P1       | 2h     | None              |
| Implement type-specific behaviors  | P1       | 8h     | Validators        |
| Add broadcast channel restrictions | P1       | 4h     | Type behaviors    |

---

## 2. Channel CRUD

### 2.1 Create Channel

```typescript
interface CreateChannelInput {
  workspaceId: string
  name: string
  type: ChannelType

  // Optional
  description?: string
  topic?: string
  categoryId?: string
  icon?: string
  isPrivate?: boolean
  isDefault?: boolean
  settings?: Partial<ChannelSettings>

  // For DMs
  memberIds?: string[]

  // Template to copy settings from
  templateId?: string
}

interface CreateChannelResult {
  channel: Channel
  membership: ChannelMember
}
```

**Validation Rules**:

- Name: 1-100 chars, no excessive spaces
- Slug: Auto-generated, unique within workspace
- Type-specific: DM requires 2 members, Group DM requires 2-10
- Permission check: user must have `channel.create` permission

### 2.2 Update Channel

```typescript
interface UpdateChannelInput {
  channelId: string

  name?: string
  description?: string
  topic?: string
  icon?: string
  color?: string
  categoryId?: string
  position?: number
  isPrivate?: boolean
  isReadOnly?: boolean
  isNsfw?: boolean
  settings?: Partial<ChannelSettings>
}
```

**Restrictions**:

- Cannot change channel type (except supergroup promotions)
- Cannot change DM participants (create new instead)
- Slug regeneration on name change (optional)

### 2.3 Archive/Delete Channel

```typescript
// Soft delete - preserves history
interface ArchiveChannelInput {
  channelId: string
  reason?: string
}

// Hard delete - removes all data
interface DeleteChannelInput {
  channelId: string
  confirmPhrase: string // Must match channel name
}
```

**Deletion Policy**:

- DMs: Hide from list, preserve messages (per user)
- Regular channels: Archive first, delete after 30 days
- Cascade: Delete messages, memberships, invites, pins

### 2.4 Membership Management

```typescript
interface ChannelMember {
  channelId: string
  userId: string

  // Role within channel
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'

  // Timestamps
  joinedAt: Date
  lastReadAt?: Date
  lastReadMessageId?: string

  // User preferences
  notificationLevel: 'all' | 'mentions' | 'none'
  isMuted: boolean
  mutedUntil?: Date
  isPinned: boolean

  // Read state
  unreadCount: number
  unreadMentionCount: number

  // Optional
  nickname?: string
  customPermissions?: ChannelPermissionOverride
}
```

### 2.5 Implementation Tasks

| Task                     | Priority | Effort | Dependencies      |
| ------------------------ | -------- | ------ | ----------------- |
| Create channel mutation  | P0       | 4h     | DB schema         |
| Update channel mutation  | P0       | 4h     | Create channel    |
| Archive channel mutation | P0       | 2h     | Update channel    |
| Delete channel mutation  | P1       | 4h     | Archive channel   |
| Join/leave channel       | P0       | 4h     | Membership schema |
| Add/remove members       | P0       | 4h     | Join/leave        |
| Update member role       | P1       | 2h     | Add/remove        |
| Bulk member operations   | P2       | 4h     | Member CRUD       |

---

## 3. Categories/Sections (Task 61)

### 3.1 Category Structure

```typescript
interface ChannelCategory {
  id: string
  workspaceId: string

  name: string
  description?: string
  icon?: string
  color?: string

  // Ordering
  position: number

  // UI state (per-user)
  isCollapsed?: boolean

  // Permissions
  defaultPermissions?: ChannelPermissionFlags
  permissionOverrides?: ChannelPermissionOverride[]

  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

### 3.2 Category Features

**Ordering**:

- Categories have positions (0-indexed)
- Channels have positions within categories
- Drag-and-drop reordering
- Channels without category go to "Uncategorized"

**Collapsible Sections**:

- Per-user collapse state (stored in localStorage + synced)
- Show unread badge on collapsed category
- Keyboard navigation support

**Permission Inheritance**:

- Channels can "sync" with category permissions
- Sync status: `synced | not_synced`
- Sync toggle in channel settings
- Breaking sync on permission edit shows warning

### 3.3 Default Categories

```typescript
const DEFAULT_CATEGORIES = [
  { id: 'general', name: 'General', icon: 'MessageSquare', position: 0, isDefault: true },
  { id: 'announcements', name: 'Announcements', icon: 'Megaphone', position: 1 },
  { id: 'teams', name: 'Teams', icon: 'Users', position: 2 },
  { id: 'projects', name: 'Projects', icon: 'FolderKanban', position: 3 },
  { id: 'support', name: 'Support', icon: 'HelpCircle', position: 4 },
  { id: 'social', name: 'Social', icon: 'Coffee', position: 5 },
  { id: 'archived', name: 'Archived', icon: 'Archive', position: 99, isSystem: true },
]
```

### 3.4 Implementation Tasks

| Task                     | Priority | Effort | Dependencies        |
| ------------------------ | -------- | ------ | ------------------- |
| Category CRUD mutations  | P0       | 4h     | DB schema           |
| Category reordering API  | P0       | 2h     | CRUD                |
| Move channel to category | P0       | 2h     | CRUD                |
| Per-user collapse state  | P1       | 4h     | User preferences    |
| Permission inheritance   | P1       | 6h     | Permissions system  |
| Category unread badges   | P1       | 4h     | Read state tracking |
| Drag-and-drop UI         | P1       | 8h     | Categories/channels |

---

## 4. Discord-Style Servers (Task 62)

### 4.1 Server/Workspace Concept

Discord's "Server" = nchat "Workspace"

```typescript
interface Workspace {
  id: string

  // Identity
  name: string
  slug: string
  description?: string
  icon?: string
  banner?: string
  splash?: string // Invite splash image

  // Ownership
  ownerId: string
  createdAt: Date
  updatedAt: Date

  // Settings
  settings: WorkspaceSettings

  // Discovery
  isPublic: boolean
  isDiscoverable: boolean // Listed in server discovery
  discoverySplash?: string
  vanityUrl?: string

  // Verification
  verificationLevel: 'none' | 'low' | 'medium' | 'high' | 'very_high'
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members'

  // Stats
  memberCount: number
  onlineCount: number
  boostCount: number
  boostTier: 0 | 1 | 2 | 3

  // Limits
  maxMembers: number
  maxChannels: number
  maxRoles: number
}

interface WorkspaceSettings {
  defaultChannelId?: string
  rulesChannelId?: string
  systemChannelId?: string

  // Notification settings
  systemChannelFlags: number

  // Features
  features: WorkspaceFeature[]

  // Premium
  premiumTier: 'free' | 'starter' | 'pro' | 'enterprise'
  premiumSubscribersCount: number
}

type WorkspaceFeature =
  | 'COMMUNITY'
  | 'DISCOVERABLE'
  | 'VANITY_URL'
  | 'BANNER'
  | 'ANIMATED_ICON'
  | 'WELCOME_SCREEN'
  | 'NEWS_CHANNELS'
  | 'FORUM_CHANNELS'
  | 'PRIVATE_THREADS'
```

### 4.2 Server Discovery

```typescript
interface WorkspaceDiscoveryCard {
  workspaceId: string
  name: string
  description: string
  icon?: string
  splash?: string

  memberCount: number
  onlineCount: number

  categories: string[] // Discovery categories
  tags: string[]

  primaryLanguage?: string
  isPartnered: boolean
  isVerified: boolean
}

interface WorkspaceInvite {
  code: string
  workspaceId: string
  channelId?: string // Specific channel to join

  createdBy: string
  createdAt: Date
  expiresAt?: Date

  maxUses?: number
  uses: number

  isTemporary: boolean // Grant temporary membership
  targetType?: 'stream' // For stream invites
}
```

### 4.3 Server Roles

```typescript
interface WorkspaceRole {
  id: string
  workspaceId: string

  name: string
  color?: string
  icon?: string
  unicodeEmoji?: string

  position: number // Hierarchy position

  // Permission bitfield
  permissions: bigint

  // Display settings
  isHoisted: boolean // Show separately in member list
  isMentionable: boolean

  // Special flags
  isDefault: boolean // @everyone role
  isManaged: boolean // Managed by integration

  // Limits
  memberCount: number

  createdAt: Date
  updatedAt: Date
}
```

### 4.4 Implementation Tasks

| Task                     | Priority | Effort | Dependencies        |
| ------------------------ | -------- | ------ | ------------------- |
| Workspace model & schema | P0       | 8h     | None                |
| Workspace CRUD API       | P0       | 8h     | Model               |
| Workspace settings       | P1       | 6h     | CRUD                |
| Server discovery API     | P2       | 8h     | Settings            |
| Discovery UI             | P2       | 12h    | Discovery API       |
| Invite system            | P1       | 8h     | Workspace model     |
| Role management          | P0       | 12h    | Workspace model     |
| Role permissions         | P0       | 8h     | Role management     |
| Boost system             | P3       | 16h    | Billing integration |

---

## 5. Telegram/WhatsApp Structures (Task 63)

### 5.1 Telegram-Style Groups

```typescript
// Promotion path: BasicGroup -> Supergroup -> Gigagroup

interface TelegramStyleSettings {
  // Group type flags
  isSupergroup: boolean // >200 members capability
  isGigagroup: boolean // Admin-only posting
  isForum: boolean // Topic-based

  // Limits
  memberLimit: number // 200 | 200000 | unlimited

  // Features
  hasLinkedChannel: boolean
  linkedChannelId?: string

  // Slow mode
  slowModeDelay: number // seconds

  // Admin features
  signMessages: boolean // Show admin name
  hasProtectedContent: boolean
  hasAggressiveAntiSpam: boolean
}
```

**Group Types**:

1. **Basic Group**: Up to 200 members, basic features
2. **Supergroup**: Up to 200,000 members, advanced features
3. **Gigagroup**: Unlimited members, admin-only posting
4. **Forum**: Supergroup with topic threads

**Promotion Flow**:

```
BasicGroup (type: 'group')
    ↓ (auto at 200 members OR manual)
Supergroup (type: 'group', subtype: 'supergroup')
    ↓ (manual, one-way)
Gigagroup (type: 'group', subtype: 'gigagroup')
```

### 5.2 Telegram-Style Channels

```typescript
interface BroadcastChannel extends Channel {
  type: 'broadcast'

  // Broadcast-specific
  subscriberCount: number
  isPublic: boolean

  // Discussion group
  discussionGroupId?: string

  // Monetization (future)
  isPremium: boolean
  subscriptionPrice?: number
}
```

**Features**:

- One-way communication (admin posts only)
- Unlimited subscribers
- Optional discussion group linkage
- Message signatures (show which admin posted)

### 5.3 WhatsApp-Style Communities

```typescript
interface Community {
  id: string
  workspaceId: string

  name: string
  description?: string
  icon?: string

  // Announcement channel (auto-created)
  announcementChannelId: string

  // Sub-groups
  groupIds: string[]
  maxGroups: number // Default: 100

  // Stats
  totalMemberCount: number
  maxMembers: number // Default: 2000

  // Settings
  settings: CommunitySettings

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface CommunitySettings {
  // Who can add groups
  addGroupsPermission: 'admin' | 'member'

  // Member permissions
  membersCanInvite: boolean

  // Moderation
  approvalRequired: boolean

  // Events
  eventsEnabled: boolean
}
```

**Community Structure**:

```
Community
├── Announcement Channel (one-way, admin only)
├── Sub-Group 1 (two-way chat)
├── Sub-Group 2 (two-way chat)
└── Sub-Group N (up to 100)
```

### 5.4 Implementation Tasks

| Task                       | Priority | Effort | Dependencies   |
| -------------------------- | -------- | ------ | -------------- |
| Supergroup promotion logic | P1       | 8h     | Channel types  |
| Gigagroup restrictions     | P2       | 4h     | Supergroup     |
| Forum topics               | P2       | 16h    | Threads        |
| Broadcast channel type     | P1       | 8h     | Channel types  |
| Discussion group linking   | P2       | 6h     | Broadcast      |
| Community model            | P1       | 8h     | Workspace      |
| Community CRUD             | P1       | 8h     | Model          |
| Announcement channel       | P1       | 4h     | Community CRUD |
| Sub-group management       | P1       | 8h     | Community      |

---

## 6. Broadcast Lists (Task 64)

### 6.1 Broadcast List Model

```typescript
interface BroadcastList {
  id: string
  workspaceId: string

  name: string
  description?: string
  icon?: string

  // Creator
  ownerId: string
  createdAt: Date
  updatedAt: Date

  // Subscribers
  subscriberIds: string[]
  subscriberCount: number
  maxSubscribers: number // Default: 256 (WhatsApp), configurable

  // Settings
  settings: BroadcastListSettings

  // Stats
  totalMessagesSent: number
  lastBroadcastAt?: Date
}

interface BroadcastListSettings {
  // Who can subscribe
  subscriptionMode: 'open' | 'invite' | 'admin'

  // Delivery settings
  allowReplies: boolean // If true, replies go to creator
  showSenderName: boolean

  // Analytics
  trackDelivery: boolean
  trackReads: boolean
}
```

### 6.2 Broadcast Message

```typescript
interface BroadcastMessage {
  id: string
  broadcastListId: string

  content: string
  attachments?: Attachment[]

  sentBy: string
  sentAt: Date

  // Delivery tracking
  deliveryStats: {
    total: number
    delivered: number
    read: number
    failed: number
  }

  // Schedule
  scheduledFor?: Date
  isScheduled: boolean
}
```

### 6.3 Subscriber Management

```typescript
interface BroadcastSubscriber {
  broadcastListId: string
  userId: string

  subscribedAt: Date
  subscribedBy?: string // If invited

  // Preferences
  notificationsEnabled: boolean

  // Status
  status: 'active' | 'unsubscribed' | 'blocked'
  unsubscribedAt?: Date
}
```

### 6.4 Implementation Tasks

| Task                   | Priority | Effort | Dependencies |
| ---------------------- | -------- | ------ | ------------ |
| Broadcast list model   | P1       | 4h     | None         |
| Create broadcast list  | P1       | 4h     | Model        |
| Subscriber management  | P1       | 6h     | Create list  |
| Send broadcast message | P1       | 8h     | Subscribers  |
| Delivery tracking      | P2       | 8h     | Send message |
| Scheduled broadcasts   | P2       | 6h     | Jobs plugin  |
| Analytics dashboard    | P3       | 12h    | Tracking     |
| Unsubscribe flow       | P1       | 4h     | Subscribers  |

---

## 7. Channel Permissions (Task 65)

### 7.1 Permission System Design

**Permission Resolution Order** (Discord-style):

1. Channel user override (highest priority)
2. Channel role overrides
3. Channel @everyone override
4. Category permissions (if synced)
5. Workspace role permissions
6. Workspace @everyone permissions (lowest)

### 7.2 Permission Flags

```typescript
// 53-bit permission bitfield (BigInt for safety)
export const CHANNEL_PERMISSIONS = {
  // View
  VIEW_CHANNEL: 1n << 0n,
  READ_MESSAGE_HISTORY: 1n << 1n,

  // Messages
  SEND_MESSAGES: 1n << 2n,
  SEND_MESSAGES_IN_THREADS: 1n << 3n,
  EMBED_LINKS: 1n << 4n,
  ATTACH_FILES: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  USE_EXTERNAL_EMOJIS: 1n << 7n,
  USE_EXTERNAL_STICKERS: 1n << 8n,
  MENTION_EVERYONE: 1n << 9n,
  MENTION_ROLES: 1n << 10n,

  // Threads
  CREATE_PUBLIC_THREADS: 1n << 11n,
  CREATE_PRIVATE_THREADS: 1n << 12n,

  // Voice
  CONNECT: 1n << 13n,
  SPEAK: 1n << 14n,
  VIDEO: 1n << 15n,
  USE_SOUNDBOARD: 1n << 16n,
  USE_VOICE_ACTIVITY: 1n << 17n,
  PRIORITY_SPEAKER: 1n << 18n,
  MUTE_MEMBERS: 1n << 19n,
  DEAFEN_MEMBERS: 1n << 20n,
  MOVE_MEMBERS: 1n << 21n,

  // Moderation
  MANAGE_MESSAGES: 1n << 22n,
  MANAGE_THREADS: 1n << 23n,
  MANAGE_CHANNEL: 1n << 24n,

  // Special
  SEND_VOICE_MESSAGES: 1n << 25n,
  SEND_POLLS: 1n << 26n,
  USE_APPLICATION_COMMANDS: 1n << 27n,
} as const

type ChannelPermission = keyof typeof CHANNEL_PERMISSIONS
```

### 7.3 Permission Override

```typescript
interface ChannelPermissionOverride {
  id: string
  channelId: string

  // Target
  targetType: 'role' | 'user'
  targetId: string

  // Permission changes (null = inherit)
  allow: bigint // Explicitly allowed
  deny: bigint // Explicitly denied

  // Metadata
  createdAt: Date
  createdBy: string
  expiresAt?: Date // Temporary overrides
}
```

### 7.4 Permission Calculation

```typescript
function calculateEffectivePermissions(
  userId: string,
  channelId: string,
  context: PermissionContext
): bigint {
  // 1. Start with workspace @everyone permissions
  let permissions = context.workspace.everyonePermissions

  // 2. Apply workspace role permissions (OR together)
  for (const role of context.userRoles) {
    permissions |= role.permissions
  }

  // 3. Apply category permissions (if channel synced)
  if (context.channel.permissionSyncId && context.category) {
    // Category @everyone
    const categoryEveryone = context.category.overrides.find(
      (o) => o.targetType === 'role' && o.targetId === '@everyone'
    )
    if (categoryEveryone) {
      permissions &= ~categoryEveryone.deny
      permissions |= categoryEveryone.allow
    }

    // Category role overrides
    for (const role of context.userRoles) {
      const override = context.category.overrides.find(
        (o) => o.targetType === 'role' && o.targetId === role.id
      )
      if (override) {
        permissions &= ~override.deny
        permissions |= override.allow
      }
    }
  }

  // 4. Apply channel @everyone override
  const channelEveryone = context.channel.overrides.find(
    (o) => o.targetType === 'role' && o.targetId === '@everyone'
  )
  if (channelEveryone) {
    permissions &= ~channelEveryone.deny
    permissions |= channelEveryone.allow
  }

  // 5. Apply channel role overrides
  for (const role of context.userRoles) {
    const override = context.channel.overrides.find(
      (o) => o.targetType === 'role' && o.targetId === role.id
    )
    if (override) {
      permissions &= ~override.deny
      permissions |= override.allow
    }
  }

  // 6. Apply channel user override (highest priority)
  const userOverride = context.channel.overrides.find(
    (o) => o.targetType === 'user' && o.targetId === userId
  )
  if (userOverride) {
    permissions &= ~userOverride.deny
    permissions |= userOverride.allow
  }

  return permissions
}
```

### 7.5 Default Permission Templates

```typescript
const PERMISSION_TEMPLATES = {
  // Standard member
  member: {
    allow:
      VIEW_CHANNEL |
      READ_MESSAGE_HISTORY |
      SEND_MESSAGES |
      EMBED_LINKS |
      ATTACH_FILES |
      ADD_REACTIONS,
    deny: 0n,
  },

  // Read-only (announcements)
  readonly: {
    allow: VIEW_CHANNEL | READ_MESSAGE_HISTORY,
    deny: SEND_MESSAGES,
  },

  // Moderator
  moderator: {
    allow: MANAGE_MESSAGES | MANAGE_THREADS,
    deny: 0n,
  },

  // Voice participant
  voice_participant: {
    allow: CONNECT | SPEAK,
    deny: 0n,
  },

  // Muted user
  muted: {
    allow: VIEW_CHANNEL | READ_MESSAGE_HISTORY,
    deny: SEND_MESSAGES | ADD_REACTIONS | CONNECT | SPEAK,
  },
}
```

### 7.6 Implementation Tasks

| Task                               | Priority | Effort | Dependencies    |
| ---------------------------------- | -------- | ------ | --------------- |
| Permission bitfield implementation | P0       | 4h     | None            |
| Permission override schema         | P0       | 4h     | Bitfield        |
| Permission calculation engine      | P0       | 8h     | Override schema |
| Server-side permission checks      | P0       | 8h     | Calculation     |
| Client-side permission cache       | P1       | 6h     | Calculation     |
| Permission editor UI               | P1       | 12h    | Calculation     |
| Temporary permission overrides     | P2       | 4h     | Override schema |
| Permission audit log               | P2       | 6h     | All above       |

---

## 8. Database Schema

### 8.1 Core Tables

```sql
-- Workspaces/Servers
CREATE TABLE nchat_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  splash_url TEXT,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Discovery
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_discoverable BOOLEAN NOT NULL DEFAULT FALSE,
  vanity_url VARCHAR(50) UNIQUE,

  -- Verification
  verification_level SMALLINT NOT NULL DEFAULT 0,
  explicit_content_filter SMALLINT NOT NULL DEFAULT 0,

  -- Settings (JSONB for flexibility)
  settings JSONB NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',

  -- Stats (denormalized)
  member_count INTEGER NOT NULL DEFAULT 0,
  channel_count INTEGER NOT NULL DEFAULT 0,

  -- Limits
  max_members INTEGER NOT NULL DEFAULT 500000,
  max_channels INTEGER NOT NULL DEFAULT 500,
  max_roles INTEGER NOT NULL DEFAULT 250
);

CREATE INDEX idx_workspaces_owner ON nchat_workspaces(owner_id);
CREATE INDEX idx_workspaces_discoverable ON nchat_workspaces(is_discoverable) WHERE is_discoverable = TRUE;

-- Workspace Roles
CREATE TABLE nchat_workspace_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),
  icon_url TEXT,
  unicode_emoji VARCHAR(8),

  position INTEGER NOT NULL DEFAULT 0,
  permissions BIGINT NOT NULL DEFAULT 0,

  is_hoisted BOOLEAN NOT NULL DEFAULT FALSE,
  is_mentionable BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_managed BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, name)
);

CREATE INDEX idx_roles_workspace ON nchat_workspace_roles(workspace_id);
CREATE INDEX idx_roles_position ON nchat_workspace_roles(workspace_id, position);

-- Channel Categories
CREATE TABLE nchat_channel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),

  position INTEGER NOT NULL DEFAULT 0,

  -- Default permissions for channels in this category
  default_permissions BIGINT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, name)
);

CREATE INDEX idx_categories_workspace ON nchat_channel_categories(workspace_id);
CREATE INDEX idx_categories_position ON nchat_channel_categories(workspace_id, position);

-- Channels
CREATE TABLE nchat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  category_id UUID REFERENCES nchat_channel_categories(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES nchat_channels(id) ON DELETE CASCADE, -- For threads

  -- Identity
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  topic TEXT,

  -- Type
  type VARCHAR(20) NOT NULL DEFAULT 'public',
  subtype VARCHAR(30),

  -- Visibility
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  is_nsfw BOOLEAN NOT NULL DEFAULT FALSE,
  is_read_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES nchat_users(id),

  -- Display
  icon VARCHAR(100),
  color VARCHAR(7),
  banner_url TEXT,

  -- Ordering
  position INTEGER NOT NULL DEFAULT 0,

  -- Ownership
  owner_id UUID NOT NULL REFERENCES nchat_users(id),
  created_by UUID NOT NULL REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Permission sync
  permission_sync_id UUID REFERENCES nchat_channel_categories(id),

  -- Stats (denormalized)
  member_count INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_id UUID,

  -- Settings
  settings JSONB NOT NULL DEFAULT '{}',

  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_channels_workspace ON nchat_channels(workspace_id);
CREATE INDEX idx_channels_category ON nchat_channels(category_id);
CREATE INDEX idx_channels_parent ON nchat_channels(parent_id);
CREATE INDEX idx_channels_type ON nchat_channels(workspace_id, type);
CREATE INDEX idx_channels_position ON nchat_channels(category_id, position);

-- Channel Members
CREATE TABLE nchat_channel_members (
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,

  -- Role within channel
  role VARCHAR(20) NOT NULL DEFAULT 'member',

  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  last_read_message_id UUID,

  -- Preferences
  notification_level VARCHAR(20) NOT NULL DEFAULT 'all',
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,

  -- Read state
  unread_count INTEGER NOT NULL DEFAULT 0,
  unread_mention_count INTEGER NOT NULL DEFAULT 0,

  -- Optional customization
  nickname VARCHAR(32),

  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user ON nchat_channel_members(user_id);
CREATE INDEX idx_channel_members_joined ON nchat_channel_members(channel_id, joined_at);

-- Channel Permission Overrides
CREATE TABLE nchat_channel_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,

  target_type VARCHAR(10) NOT NULL, -- 'role' | 'user'
  target_id UUID NOT NULL,

  allow_permissions BIGINT NOT NULL DEFAULT 0,
  deny_permissions BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES nchat_users(id),
  expires_at TIMESTAMPTZ,

  UNIQUE(channel_id, target_type, target_id)
);

CREATE INDEX idx_permission_overrides_channel ON nchat_channel_permission_overrides(channel_id);
CREATE INDEX idx_permission_overrides_target ON nchat_channel_permission_overrides(target_type, target_id);

-- Channel Invites
CREATE TABLE nchat_channel_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,

  workspace_id UUID REFERENCES nchat_workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES nchat_channels(id) ON DELETE CASCADE,

  created_by UUID NOT NULL REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,

  is_temporary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_invites_code ON nchat_channel_invites(code) WHERE is_active = TRUE;
CREATE INDEX idx_invites_workspace ON nchat_channel_invites(workspace_id);
CREATE INDEX idx_invites_channel ON nchat_channel_invites(channel_id);

-- Communities (WhatsApp-style)
CREATE TABLE nchat_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,

  -- Auto-created announcement channel
  announcement_channel_id UUID NOT NULL REFERENCES nchat_channels(id),

  -- Settings
  settings JSONB NOT NULL DEFAULT '{}',

  -- Limits
  max_groups INTEGER NOT NULL DEFAULT 100,
  max_members INTEGER NOT NULL DEFAULT 2000,

  -- Stats
  total_member_count INTEGER NOT NULL DEFAULT 0,
  group_count INTEGER NOT NULL DEFAULT 0,

  created_by UUID NOT NULL REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communities_workspace ON nchat_communities(workspace_id);

-- Community Groups (Sub-groups)
CREATE TABLE nchat_community_groups (
  community_id UUID NOT NULL REFERENCES nchat_communities(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,

  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID NOT NULL REFERENCES nchat_users(id),

  PRIMARY KEY (community_id, channel_id)
);

CREATE INDEX idx_community_groups_channel ON nchat_community_groups(channel_id);

-- Broadcast Lists
CREATE TABLE nchat_broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES nchat_workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),

  owner_id UUID NOT NULL REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Settings
  subscription_mode VARCHAR(20) NOT NULL DEFAULT 'admin',
  allow_replies BOOLEAN NOT NULL DEFAULT FALSE,
  show_sender_name BOOLEAN NOT NULL DEFAULT TRUE,
  track_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  track_reads BOOLEAN NOT NULL DEFAULT TRUE,

  -- Limits
  max_subscribers INTEGER NOT NULL DEFAULT 256,

  -- Stats
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  total_messages_sent INTEGER NOT NULL DEFAULT 0,
  last_broadcast_at TIMESTAMPTZ
);

CREATE INDEX idx_broadcast_lists_workspace ON nchat_broadcast_lists(workspace_id);
CREATE INDEX idx_broadcast_lists_owner ON nchat_broadcast_lists(owner_id);

-- Broadcast Subscribers
CREATE TABLE nchat_broadcast_subscribers (
  broadcast_list_id UUID NOT NULL REFERENCES nchat_broadcast_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,

  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscribed_by UUID REFERENCES nchat_users(id),

  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  status VARCHAR(20) NOT NULL DEFAULT 'active',
  unsubscribed_at TIMESTAMPTZ,

  PRIMARY KEY (broadcast_list_id, user_id)
);

CREATE INDEX idx_broadcast_subscribers_user ON nchat_broadcast_subscribers(user_id);
CREATE INDEX idx_broadcast_subscribers_status ON nchat_broadcast_subscribers(broadcast_list_id, status);

-- Broadcast Messages
CREATE TABLE nchat_broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_list_id UUID NOT NULL REFERENCES nchat_broadcast_lists(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  attachments JSONB,

  sent_by UUID NOT NULL REFERENCES nchat_users(id),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Schedule
  scheduled_for TIMESTAMPTZ,
  is_scheduled BOOLEAN NOT NULL DEFAULT FALSE,

  -- Delivery stats
  total_recipients INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  read_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_broadcast_messages_list ON nchat_broadcast_messages(broadcast_list_id);
CREATE INDEX idx_broadcast_messages_scheduled ON nchat_broadcast_messages(scheduled_for) WHERE is_scheduled = TRUE;
```

### 8.2 RLS Policies

```sql
-- Workspace visibility
CREATE POLICY workspace_visibility ON nchat_workspaces
  FOR SELECT
  USING (
    is_public = TRUE
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nchat_workspace_members
      WHERE workspace_id = nchat_workspaces.id
      AND user_id = auth.uid()
    )
  );

-- Channel visibility (based on permissions)
CREATE POLICY channel_visibility ON nchat_channels
  FOR SELECT
  USING (
    -- User is a member
    EXISTS (
      SELECT 1 FROM nchat_channel_members
      WHERE channel_id = nchat_channels.id
      AND user_id = auth.uid()
    )
    -- Or it's a public channel and user is workspace member
    OR (
      NOT is_private
      AND EXISTS (
        SELECT 1 FROM nchat_workspace_members
        WHERE workspace_id = nchat_channels.workspace_id
        AND user_id = auth.uid()
      )
    )
  );

-- Channel member operations
CREATE POLICY channel_member_read ON nchat_channel_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM nchat_channel_members cm
      WHERE cm.channel_id = nchat_channel_members.channel_id
      AND cm.user_id = auth.uid()
    )
  );
```

---

## 9. API Endpoints

### 9.1 Channel Endpoints

```typescript
// REST API Routes (or GraphQL equivalents)

// Channel CRUD
POST   /api/channels              // Create channel
GET    /api/channels/:id          // Get channel
PATCH  /api/channels/:id          // Update channel
DELETE /api/channels/:id          // Delete channel
POST   /api/channels/:id/archive  // Archive channel

// Channel Discovery
GET    /api/channels              // List accessible channels
GET    /api/channels/search       // Search channels

// Membership
POST   /api/channels/:id/join     // Join channel
POST   /api/channels/:id/leave    // Leave channel
GET    /api/channels/:id/members  // List members
POST   /api/channels/:id/members  // Add member
DELETE /api/channels/:id/members/:userId  // Remove member
PATCH  /api/channels/:id/members/:userId  // Update member role

// Invites
POST   /api/channels/:id/invites  // Create invite
GET    /api/channels/:id/invites  // List invites
DELETE /api/invites/:code         // Revoke invite
POST   /api/invites/:code/use     // Use invite

// Permissions
GET    /api/channels/:id/permissions         // Get permissions
PUT    /api/channels/:id/permissions         // Update permissions
POST   /api/channels/:id/permissions/sync    // Sync with category
```

### 9.2 Category Endpoints

```typescript
// Category CRUD
POST   /api/categories            // Create category
GET    /api/categories            // List categories
PATCH  /api/categories/:id        // Update category
DELETE /api/categories/:id        // Delete category
PUT    /api/categories/reorder    // Reorder categories

// Channel ordering
PUT    /api/categories/:id/channels/reorder  // Reorder channels
POST   /api/channels/:id/move     // Move to category
```

### 9.3 Workspace Endpoints

```typescript
// Workspace CRUD
POST   /api/workspaces            // Create workspace
GET    /api/workspaces/:id        // Get workspace
PATCH  /api/workspaces/:id        // Update workspace
DELETE /api/workspaces/:id        // Delete workspace

// Discovery
GET    /api/workspaces/discover   // Discover public workspaces
GET    /api/workspaces/:id/preview // Preview workspace (before joining)

// Roles
GET    /api/workspaces/:id/roles           // List roles
POST   /api/workspaces/:id/roles           // Create role
PATCH  /api/workspaces/:id/roles/:roleId   // Update role
DELETE /api/workspaces/:id/roles/:roleId   // Delete role
PUT    /api/workspaces/:id/roles/reorder   // Reorder roles
```

### 9.4 Community Endpoints

```typescript
// Community CRUD
POST   /api/communities           // Create community
GET    /api/communities/:id       // Get community
PATCH  /api/communities/:id       // Update community
DELETE /api/communities/:id       // Delete community

// Groups
POST   /api/communities/:id/groups           // Add group
DELETE /api/communities/:id/groups/:groupId  // Remove group
PUT    /api/communities/:id/groups/reorder   // Reorder groups
```

### 9.5 Broadcast Endpoints

```typescript
// Broadcast Lists
POST   /api/broadcast-lists                  // Create list
GET    /api/broadcast-lists                  // List my broadcast lists
GET    /api/broadcast-lists/:id              // Get list
PATCH  /api/broadcast-lists/:id              // Update list
DELETE /api/broadcast-lists/:id              // Delete list

// Subscribers
GET    /api/broadcast-lists/:id/subscribers  // List subscribers
POST   /api/broadcast-lists/:id/subscribers  // Add subscriber
DELETE /api/broadcast-lists/:id/subscribers/:userId  // Remove subscriber

// Messages
POST   /api/broadcast-lists/:id/send         // Send broadcast
GET    /api/broadcast-lists/:id/messages     // List messages
GET    /api/broadcast-lists/:id/messages/:msgId/stats  // Get delivery stats
```

---

## 10. Real-time Events

### 10.1 Channel Events

```typescript
// Socket.io / Realtime Plugin Events

// Channel lifecycle
'channel:created' // { channel: Channel, workspace_id }
'channel:updated' // { channel_id, updates, previous }
'channel:deleted' // { channel_id, workspace_id }
'channel:archived' // { channel_id, archived_by, reason }
'channel:unarchived' // { channel_id, unarchived_by }

// Membership
'channel:member_joined' // { channel_id, user_id, member }
'channel:member_left' // { channel_id, user_id }
'channel:member_updated' // { channel_id, user_id, updates }
'channel:member_kicked' // { channel_id, user_id, kicked_by, reason }
'channel:member_banned' // { channel_id, user_id, banned_by, reason, expires_at }

// Settings & Permissions
'channel:settings_updated' // { channel_id, settings }
'channel:permissions_updated' // { channel_id, overrides }
'channel:synced' // { channel_id, category_id }
'channel:unsynced' // { channel_id }
```

### 10.2 Category Events

```typescript
'category:created' // { category, workspace_id }
'category:updated' // { category_id, updates }
'category:deleted' // { category_id, workspace_id }
'category:reordered' // { workspace_id, category_ids }
'channels:reordered' // { category_id, channel_ids }
```

### 10.3 Workspace Events

```typescript
'workspace:updated' // { workspace_id, updates }
'workspace:deleted' // { workspace_id }
'workspace:role_created' // { workspace_id, role }
'workspace:role_updated' // { workspace_id, role_id, updates }
'workspace:role_deleted' // { workspace_id, role_id }
```

### 10.4 Community Events

```typescript
'community:created' // { community, workspace_id }
'community:updated' // { community_id, updates }
'community:deleted' // { community_id }
'community:group_added' // { community_id, channel_id }
'community:group_removed' // { community_id, channel_id }
```

### 10.5 Broadcast Events

```typescript
'broadcast:sent' // { broadcast_list_id, message_id }
'broadcast:delivered' // { broadcast_list_id, message_id, user_id }
'broadcast:read' // { broadcast_list_id, message_id, user_id }
'broadcast:subscribed' // { broadcast_list_id, user_id }
'broadcast:unsubscribed' // { broadcast_list_id, user_id }
```

### 10.6 Event Subscription Patterns

```typescript
// Client-side subscription
socket.join(`workspace:${workspaceId}`)
socket.join(`channel:${channelId}`)
socket.join(`user:${userId}`) // For DM notifications

// Event handlers
socket.on('channel:created', (data) => {
  channelStore.addChannel(data.channel)
})

socket.on('channel:member_joined', (data) => {
  if (data.user_id === currentUserId) {
    // I joined a new channel
    channelStore.addChannel(await fetchChannel(data.channel_id))
  } else {
    // Someone else joined
    channelStore.addChannelMember(data.channel_id, data.member)
  }
})
```

---

## 11. UI Components

### 11.1 Channel List Sidebar

**File**: `/src/components/channel/channel-list.tsx`

```typescript
interface ChannelListProps {
  workspaceId: string
  activeChannelId?: string
  onChannelSelect: (channelId: string) => void
}

// Structure:
// - Starred/Pinned Channels (collapsible)
// - Direct Messages (collapsible)
// - Categories with Channels
//   - Category Header (collapsible)
//   - Channel Items
// - Uncategorized Channels
```

**Features**:

- Drag-and-drop reordering
- Collapse/expand categories
- Unread badges
- Mute indicators
- Context menu on right-click
- Quick actions on hover

### 11.2 Channel Settings Modal

**File**: `/src/components/channel/channel-settings-modal.tsx`

**Tabs**:

1. **Overview**: Name, topic, description, icon
2. **Permissions**: Role/user permission editor
3. **Integrations**: Webhooks, bots
4. **Members**: Member list with role management
5. **Invites**: Active invites, create new
6. **Danger Zone**: Archive, delete, transfer

### 11.3 Member List Panel

**File**: `/src/components/channel/channel-members.tsx`

```typescript
interface ChannelMembersProps {
  channelId: string
  showOnlineStatus?: boolean
  groupByRole?: boolean
}
```

**Features**:

- Online/offline grouping
- Role-based grouping
- Search/filter members
- Quick actions (DM, kick, ban)
- Member count display

### 11.4 Permission Editor

**File**: `/src/components/permissions/permission-editor.tsx`

```typescript
interface PermissionEditorProps {
  channelId: string
  categoryId?: string
  onSave: (overrides: PermissionOverride[]) => void
}
```

**Features**:

- Visual permission grid
- Role/user toggle views
- Allow/Deny/Inherit states
- Permission inheritance visualization
- Sync with category toggle

### 11.5 Category Management

**File**: `/src/components/channel/category-manager.tsx`

**Features**:

- Create/edit categories
- Drag-drop reorder
- Set default permissions
- Collapse all / expand all
- Category context menu

### 11.6 Component Inventory

| Component            | Status | Location                                             |
| -------------------- | ------ | ---------------------------------------------------- |
| ChannelList          | Exists | `/src/components/channel/channel-list.tsx`           |
| ChannelItem          | Exists | `/src/components/channel/channel-item.tsx`           |
| ChannelCategory      | Exists | `/src/components/channel/channel-category.tsx`       |
| ChannelHeader        | Exists | `/src/components/channel/channel-header.tsx`         |
| ChannelMembers       | Exists | `/src/components/channel/channel-members.tsx`        |
| ChannelSettingsModal | Exists | `/src/components/channel/channel-settings-modal.tsx` |
| CreateChannelModal   | Exists | `/src/components/channel/create-channel-modal.tsx`   |
| ChannelInviteModal   | Exists | `/src/components/channel/channel-invite-modal.tsx`   |
| ChannelInfoPanel     | Exists | `/src/components/channel/channel-info-panel.tsx`     |
| PermissionEditor     | New    | `/src/components/permissions/permission-editor.tsx`  |
| CategoryManager      | New    | `/src/components/channel/category-manager.tsx`       |
| WorkspaceSettings    | New    | `/src/components/workspace/workspace-settings.tsx`   |
| CommunityManager     | New    | `/src/components/community/community-manager.tsx`    |
| BroadcastComposer    | New    | `/src/components/broadcast/broadcast-composer.tsx`   |

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Core channel types and CRUD working with database

| Task                       | Effort | Owner    |
| -------------------------- | ------ | -------- |
| Update database schema     | 8h     | Backend  |
| Extended channel type enum | 2h     | Frontend |
| Channel CRUD mutations     | 8h     | Backend  |
| Channel CRUD hooks         | 6h     | Frontend |
| Basic permission checks    | 8h     | Backend  |
| Update channel store       | 4h     | Frontend |

**Deliverables**:

- All channel types can be created/updated/deleted
- Basic membership management works
- Permissions are checked server-side

### Phase 2: Categories & Organization (Week 3)

**Goal**: Full category support with permission inheritance

| Task                   | Effort | Owner    |
| ---------------------- | ------ | -------- |
| Category CRUD          | 6h     | Backend  |
| Category UI components | 8h     | Frontend |
| Drag-drop reordering   | 8h     | Frontend |
| Permission inheritance | 8h     | Backend  |
| Sync/unsync UI         | 4h     | Frontend |

**Deliverables**:

- Categories can be created/edited/deleted
- Channels can be moved between categories
- Permission sync works correctly

### Phase 3: Workspaces & Roles (Week 4-5)

**Goal**: Discord-style server structure

| Task                       | Effort | Owner    |
| -------------------------- | ------ | -------- |
| Workspace model & API      | 16h    | Backend  |
| Role management            | 16h    | Backend  |
| Permission bitfield system | 8h     | Backend  |
| Role assignment UI         | 12h    | Frontend |
| Workspace settings UI      | 12h    | Frontend |

**Deliverables**:

- Workspaces with full settings
- Role-based permissions working
- Permission editor functional

### Phase 4: Communities & Broadcast (Week 6)

**Goal**: WhatsApp-style communities and broadcast lists

| Task                  | Effort | Owner    |
| --------------------- | ------ | -------- |
| Community model & API | 12h    | Backend  |
| Community UI          | 12h    | Frontend |
| Broadcast list system | 12h    | Backend  |
| Broadcast UI          | 8h     | Frontend |
| Delivery tracking     | 8h     | Backend  |

**Deliverables**:

- Communities with sub-groups
- Broadcast lists functional
- Delivery analytics working

### Phase 5: Real-time & Polish (Week 7-8)

**Goal**: Real-time sync and UI polish

| Task                     | Effort | Owner      |
| ------------------------ | ------ | ---------- |
| Socket event handlers    | 16h    | Full-stack |
| Optimistic updates       | 8h     | Frontend   |
| Error handling           | 8h     | Full-stack |
| Loading states           | 4h     | Frontend   |
| Accessibility audit      | 8h     | Frontend   |
| Performance optimization | 8h     | Full-stack |

**Deliverables**:

- All events sync in real-time
- Smooth UX with loading states
- WCAG AA compliance

---

## 13. Testing Requirements

### 13.1 Unit Tests

```typescript
// Channel type tests
describe('ChannelType', () => {
  it('validates channel types correctly')
  it('enforces type-specific constraints')
  it('handles type promotion correctly')
})

// Permission tests
describe('ChannelPermissions', () => {
  it('calculates effective permissions correctly')
  it('applies overrides in correct order')
  it('handles permission inheritance')
  it('respects owner/admin bypass')
})

// Store tests
describe('ChannelStore', () => {
  it('adds and removes channels')
  it('updates channel properties')
  it('manages categories correctly')
  it('handles optimistic updates')
})
```

### 13.2 Integration Tests

```typescript
// API tests
describe('Channel API', () => {
  it('creates channel with correct permissions')
  it('enforces membership restrictions')
  it('handles concurrent updates')
  it('cascades deletions correctly')
})

// Real-time tests
describe('Channel Events', () => {
  it('broadcasts channel updates to members')
  it('handles reconnection gracefully')
  it('syncs state across clients')
})
```

### 13.3 E2E Tests

```typescript
// User flows
describe('Channel Management', () => {
  it('creates a new channel and invites members')
  it('manages channel permissions')
  it('archives and restores channels')
  it('handles category organization')
})

describe('Community Features', () => {
  it('creates community with announcement channel')
  it('adds and removes sub-groups')
  it('sends community-wide announcements')
})
```

### 13.4 Coverage Requirements

| Area               | Target |
| ------------------ | ------ |
| Unit tests         | 100%   |
| Integration tests  | 100%   |
| E2E critical paths | 100%   |
| Edge cases         | 90%+   |

---

## 14. Migration Strategy

### 14.1 Data Migration

For existing nchat installations:

```sql
-- Step 1: Add new columns with defaults
ALTER TABLE nchat_channels
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  ADD COLUMN IF NOT EXISTS subtype VARCHAR(30),
  ADD COLUMN IF NOT EXISTS permission_sync_id UUID;

-- Step 2: Create default workspace
INSERT INTO nchat_workspaces (id, name, slug, owner_id)
SELECT gen_random_uuid(), 'Default Workspace', 'default',
  (SELECT id FROM nchat_users WHERE role = 'owner' LIMIT 1);

-- Step 3: Assign channels to default workspace
UPDATE nchat_channels
SET workspace_id = (SELECT id FROM nchat_workspaces WHERE slug = 'default')
WHERE workspace_id IS NULL;

-- Step 4: Migrate permissions to new format
INSERT INTO nchat_channel_permission_overrides (channel_id, target_type, target_id, allow_permissions, deny_permissions)
SELECT
  c.id,
  'role',
  r.id,
  -- Convert old permission format to bitfield
  CASE WHEN (c.settings->>'allowSendMessages')::boolean THEN 4 ELSE 0 END |
  CASE WHEN (c.settings->>'allowReactions')::boolean THEN 64 ELSE 0 END,
  0
FROM nchat_channels c
CROSS JOIN nchat_workspace_roles r
WHERE r.is_default = TRUE;
```

### 14.2 API Versioning

- New endpoints: `/api/v2/channels`
- Deprecated endpoints: Mark `/api/channels` as deprecated
- Migration period: 6 months
- Breaking changes documented in changelog

### 14.3 Rollback Plan

```bash
# Rollback SQL
BEGIN;
-- Restore old schema
ALTER TABLE nchat_channels DROP COLUMN workspace_id;
-- etc.
COMMIT;
```

---

## References

### Platform Documentation

- [Slack Conversations API](https://api.slack.com/docs/conversations-api)
- [Discord Permissions](https://discordjs.guide/popular-topics/permissions)
- [Telegram API Channels](https://core.telegram.org/api/channel)
- [WhatsApp Communities](https://respond.io/blog/whatsapp-communities)

### Internal Documentation

- `/src/types/channel.ts` - Existing channel types
- `/src/lib/rbac/channel-permissions.ts` - Permission system
- `/src/stores/channel-store.ts` - Zustand store
- `/TODO.md` - Tasks 60-65

---

## Appendix A: Permission Bitfield Reference

| Permission               | Bit | Value     | Description                    |
| ------------------------ | --- | --------- | ------------------------------ |
| VIEW_CHANNEL             | 0   | 1         | View channel and read messages |
| READ_MESSAGE_HISTORY     | 1   | 2         | Read message history           |
| SEND_MESSAGES            | 2   | 4         | Send messages                  |
| SEND_MESSAGES_IN_THREADS | 3   | 8         | Send in threads                |
| EMBED_LINKS              | 4   | 16        | Embed links                    |
| ATTACH_FILES             | 5   | 32        | Attach files                   |
| ADD_REACTIONS            | 6   | 64        | Add reactions                  |
| USE_EXTERNAL_EMOJIS      | 7   | 128       | Use external emojis            |
| USE_EXTERNAL_STICKERS    | 8   | 256       | Use external stickers          |
| MENTION_EVERYONE         | 9   | 512       | @everyone and @here            |
| MENTION_ROLES            | 10  | 1024      | @role mentions                 |
| CREATE_PUBLIC_THREADS    | 11  | 2048      | Create public threads          |
| CREATE_PRIVATE_THREADS   | 12  | 4096      | Create private threads         |
| CONNECT                  | 13  | 8192      | Connect to voice               |
| SPEAK                    | 14  | 16384     | Speak in voice                 |
| VIDEO                    | 15  | 32768     | Use video                      |
| USE_SOUNDBOARD           | 16  | 65536     | Use soundboard                 |
| USE_VOICE_ACTIVITY       | 17  | 131072    | Use voice activity             |
| PRIORITY_SPEAKER         | 18  | 262144    | Priority speaker               |
| MUTE_MEMBERS             | 19  | 524288    | Mute others                    |
| DEAFEN_MEMBERS           | 20  | 1048576   | Deafen others                  |
| MOVE_MEMBERS             | 21  | 2097152   | Move others                    |
| MANAGE_MESSAGES          | 22  | 4194304   | Delete others' messages        |
| MANAGE_THREADS           | 23  | 8388608   | Manage threads                 |
| MANAGE_CHANNEL           | 24  | 16777216  | Edit channel settings          |
| SEND_VOICE_MESSAGES      | 25  | 33554432  | Send voice messages            |
| SEND_POLLS               | 26  | 67108864  | Create polls                   |
| USE_APPLICATION_COMMANDS | 27  | 134217728 | Use slash commands             |

---

## Appendix B: Feature Flag Reference

```typescript
const CHANNEL_FEATURE_FLAGS = {
  // Channel types
  'channels.public': true,
  'channels.private': true,
  'channels.dm': true,
  'channels.group_dm': true,
  'channels.broadcast': true,
  'channels.voice': false, // Requires voice infrastructure
  'channels.stage': false, // Requires voice infrastructure
  'channels.forum': true,

  // Features
  'channels.categories': true,
  'channels.threads': true,
  'channels.permissions': true,
  'channels.invites': true,

  // Structures
  'workspaces.enabled': true,
  'workspaces.discovery': false, // Requires moderation
  'communities.enabled': true,
  'broadcast_lists.enabled': true,

  // Telegram-style
  'channels.supergroups': true,
  'channels.gigagroups': false, // Enterprise only
}
```

---

_Document generated: 2026-02-03_
_Last updated by: Claude Code_
