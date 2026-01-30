# TypeScript Types Reference

> Complete TypeScript type definitions for nself-chat

Source: `/Users/admin/Sites/nself-chat/src/types/`

---

## Table of Contents

1. [Type Files Overview](#type-files-overview)
2. [User Types](#user-types)
3. [Channel Types](#channel-types)
4. [Message Types](#message-types)
5. [Attachment Types](#attachment-types)
6. [Notification Types](#notification-types)
7. [Poll Types](#poll-types)
8. [Emoji Types](#emoji-types)
9. [Search Types](#search-types)
10. [Webhook Types](#webhook-types)
11. [Bot Types](#bot-types)
12. [Sticker Types](#sticker-types)
13. [API Types](#api-types)
14. [Socket Types](#socket-types)
15. [Config Types](#config-types)
16. [GIF Types](#gif-types)
17. [Importing Types](#importing-types)

---

## Type Files Overview

Location: `/src/types/`

| File | Lines | Description |
|------|-------|-------------|
| `index.ts` | 795+ | Export barrel |
| `user.ts` | | User-related types |
| `channel.ts` | | Channel-related types |
| `message.ts` | | Message-related types |
| `attachment.ts` | | Attachment/upload types |
| `notification.ts` | | Notification types |
| `poll.ts` | | Poll/voting types |
| `emoji.ts` | | Emoji/reaction types |
| `search.ts` | | Search types |
| `webhook.ts` | | Webhook types |
| `bot.ts` | | Bot types |
| `sticker.ts` | | Sticker types |
| `api.ts` | | API/GraphQL types |
| `socket.ts` | | Socket.io types |
| `config.ts` | | Configuration types |
| `gif.ts` | | GIF picker types |

---

## User Types

Source: `/src/types/user.ts`

### Core User Types

```typescript
// User roles (ordered by permission level)
type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest'

// Core user type
interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
}

// Basic info (for lists, mentions)
interface UserBasicInfo {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
}

// User with presence
interface UserWithPresence extends User {
  presence: UserPresence
  status?: UserStatus
}

// User in message context
interface MessageUser {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  role: UserRole
}
```

### Presence Types

```typescript
type UserPresenceStatus = 'online' | 'away' | 'dnd' | 'offline'

interface UserPresence {
  status: UserPresenceStatus
  lastSeenAt?: string
  customStatus?: string
}

interface UserStatus {
  emoji?: string
  text?: string
  expiresAt?: string
}

// Preset statuses
interface UserStatusPreset {
  emoji: string
  text: string
  duration?: number // minutes
}
```

### Profile Types

```typescript
interface UserProfile extends User {
  bio?: string
  timezone?: string
  locale?: string
  socialLinks?: UserSocialLinks
  joinedAt: string
}

interface UserSocialLinks {
  twitter?: string
  linkedin?: string
  github?: string
  website?: string
}
```

### Settings Types

```typescript
interface UserSettings {
  notifications: UserNotificationSettings
  privacy: UserPrivacySettings
  appearance: UserAppearanceSettings
}

interface UserNotificationSettings {
  desktop: boolean
  sound: boolean
  email: boolean
  mentions: boolean
  directMessages: boolean
  threads: boolean
}

interface UserPrivacySettings {
  showOnlineStatus: boolean
  showLastSeen: boolean
  allowDirectMessages: 'everyone' | 'contacts' | 'none'
}

interface UserAppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'normal' | 'large'
  messageDensity: 'compact' | 'comfortable' | 'spacious'
}
```

### Permission Types

```typescript
interface UserPermissions {
  canManageOrganization: boolean
  canManageRoles: boolean
  canManageUsers: boolean
  canManageChannels: boolean
  canManageMessages: boolean
  canDeleteAnyMessage: boolean
  canPinMessages: boolean
  canCreatePublicChannel: boolean
  canCreatePrivateChannel: boolean
  canInviteUsers: boolean
  canBanUsers: boolean
  canViewAnalytics: boolean
  canManageIntegrations: boolean
  canManageBilling: boolean
}
```

### Constants

```typescript
const UserRoleLevel = {
  owner: 0,
  admin: 1,
  moderator: 2,
  member: 3,
  guest: 4
}

const UserPresenceLabels = {
  online: 'Online',
  away: 'Away',
  dnd: 'Do Not Disturb',
  offline: 'Offline'
}

const DefaultStatusPresets: UserStatusPreset[] = [
  { emoji: '📅', text: 'In a meeting' },
  { emoji: '🚌', text: 'Commuting' },
  { emoji: '🤒', text: 'Out sick' },
  { emoji: '🌴', text: 'Vacationing' },
  { emoji: '🏠', text: 'Working remotely' }
]
```

---

## Channel Types

Source: `/src/types/channel.ts`

### Core Channel Types

```typescript
type ChannelType = 'public' | 'private' | 'direct' | 'group'
type ChannelVisibility = 'visible' | 'hidden' | 'archived'

interface Channel {
  id: string
  name: string
  slug: string
  description?: string
  type: ChannelType
  visibility: ChannelVisibility
  isArchived: boolean
  isDefault: boolean
  topic?: string
  creatorId: string
  memberCount: number
  createdAt: string
  updatedAt: string
}

// Direct message channel
interface DirectMessageChannel {
  id: string
  type: 'direct'
  participants: UserBasicInfo[]
  lastMessageAt?: string
}

// Group DM
interface GroupDMChannel {
  id: string
  type: 'group'
  name?: string
  participants: UserBasicInfo[]
  creatorId: string
  lastMessageAt?: string
}

type AnyChannel = Channel | DirectMessageChannel | GroupDMChannel
```

### Thread Types

```typescript
interface Thread {
  id: string
  messageId: string
  channelId: string
  participantCount: number
  messageCount: number
  lastMessageAt?: string
  createdAt: string
}
```

### Category Types

```typescript
interface ChannelCategory {
  id: string
  name: string
  position: number
  isCollapsed: boolean
  channels: Channel[]
}
```

### Settings Types

```typescript
type SlowModeDuration = 0 | 5 | 10 | 15 | 30 | 60 | 120 | 300 | 600 | 900 | 1800 | 3600

type ChannelNotificationLevel = 'all' | 'mentions' | 'nothing'

interface ChannelSettings {
  slowMode: SlowModeDuration
  notificationLevel: ChannelNotificationLevel
  allowThreads: boolean
  allowReactions: boolean
  allowFileUploads: boolean
  messageRetentionDays: number
}

interface ChannelPermissionOverrides {
  userId?: string
  roleId?: string
  allow: ChannelPermissionFlags
  deny: ChannelPermissionFlags
}

interface ChannelPermissionFlags {
  viewChannel: boolean
  sendMessages: boolean
  manageMessages: boolean
  manageChannel: boolean
  addReactions: boolean
  attachFiles: boolean
  mentionEveryone: boolean
}
```

### Member Types

```typescript
interface ChannelMember {
  userId: string
  channelId: string
  role: 'admin' | 'member'
  joinedAt: string
  lastReadAt?: string
  notificationsEnabled: boolean
  user: UserBasicInfo
}

interface ChannelMemberBasic {
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
}
```

### Utility Functions

```typescript
function isDirectMessage(channel: AnyChannel): channel is DirectMessageChannel
function isRegularChannel(channel: AnyChannel): channel is Channel
function getChannelDisplayName(channel: AnyChannel, currentUserId?: string): string
```

---

## Message Types

Source: `/src/types/message.ts`

### Core Message Types

```typescript
type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | 'system'

interface Message {
  id: string
  channelId: string
  userId: string
  parentId?: string
  content: string
  type: MessageType
  metadata: Record<string, unknown>
  isEdited: boolean
  isDeleted: boolean
  editedAt?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  user: MessageUser
  attachments: Attachment[]
  reactions: Reaction[]
  mentions: MessageMention[]
  thread?: ThreadInfo
}
```

### Thread Info

```typescript
interface ThreadInfo {
  id: string
  replyCount: number
  participantCount: number
  lastReplyAt?: string
  participants: UserBasicInfo[]
}
```

### Mention Types

```typescript
type MentionType = 'user' | 'channel' | 'everyone'

interface MessageMention {
  id: string
  type: MentionType
  userId?: string
  channelId?: string
  displayText: string
}
```

### Reaction Types

```typescript
interface Reaction {
  emoji: string
  count: number
  users: UserBasicInfo[]
  hasReacted: boolean
}

interface ReactionEvent {
  messageId: string
  userId: string
  emoji: string
  action: 'add' | 'remove'
}
```

### Draft Types

```typescript
interface MessageDraft {
  channelId: string
  content: string
  attachments: UploadQueueItem[]
  mentions: MessageMention[]
  parentId?: string
  savedAt: string
}

interface SendMessageInput {
  channelId: string
  content: string
  parentId?: string
  attachmentIds?: string[]
  mentions?: MessageMention[]
}

interface EditMessageInput {
  messageId: string
  content: string
  attachmentIds?: string[]
}
```

### List Types

```typescript
interface MessageGroup {
  type: 'messages'
  userId: string
  user: MessageUser
  messages: Message[]
  timestamp: string
}

interface DateSeparator {
  type: 'date'
  date: string
}

interface UnreadIndicator {
  type: 'unread'
  count: number
}

interface NewMessagesIndicator {
  type: 'new-messages'
}

type MessageListItem = MessageGroup | DateSeparator | UnreadIndicator | NewMessagesIndicator
```

### System Messages

```typescript
interface SystemMessageData {
  action: 'user_joined' | 'user_left' | 'channel_created' | 'channel_renamed' | 'pinned' | 'unpinned'
  userId?: string
  oldValue?: string
  newValue?: string
}

function isSystemMessage(message: Message): boolean
function formatSystemMessage(message: Message): string
```

### Typing Types

```typescript
interface TypingUser {
  userId: string
  username: string
  displayName: string
  startedAt: string
}

interface ChannelTypingState {
  channelId: string
  users: TypingUser[]
}

function formatTypingIndicator(users: TypingUser[]): string
```

---

## Attachment Types

Source: `/src/types/attachment.ts`

### Core Attachment Types

```typescript
type AttachmentType = 'image' | 'video' | 'audio' | 'file'
type AttachmentCategory = 'media' | 'document' | 'archive' | 'other'

interface Attachment {
  id: string
  messageId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  thumbnailUrl?: string
  metadata: FileMetadata | ImageMetadata | VideoMetadata | AudioMetadata
}

// Specific attachment types
interface ImageAttachment extends Attachment {
  metadata: ImageMetadata
}

interface VideoAttachment extends Attachment {
  metadata: VideoMetadata
}

interface AudioAttachment extends Attachment {
  metadata: AudioMetadata
}

interface FileAttachment extends Attachment {
  metadata: FileMetadata
}

type AnyAttachment = ImageAttachment | VideoAttachment | AudioAttachment | FileAttachment
```

### Metadata Types

```typescript
interface FileMetadata {
  mimeType: string
}

interface ImageMetadata extends FileMetadata {
  width: number
  height: number
  hasAlpha?: boolean
  exif?: ImageExifData
}

interface VideoMetadata extends FileMetadata {
  width: number
  height: number
  duration: number
  codec?: string
  bitrate?: number
}

interface AudioMetadata extends FileMetadata {
  duration: number
  bitrate?: number
  sampleRate?: number
  channels?: number
  tags?: AudioTags
}

interface AudioTags {
  title?: string
  artist?: string
  album?: string
}
```

### Upload Types

```typescript
type UploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadQueueItem {
  id: string
  file: File
  status: UploadStatus
  progress: UploadProgress
  error?: string
  attachmentId?: string
  thumbnailUrl?: string
}

interface UploadSettings {
  maxFileSize: number
  maxFilesPerMessage: number
  allowedMimeTypes: string[]
}

const DefaultUploadSettings: UploadSettings = {
  maxFileSize: 104857600, // 100MB
  maxFilesPerMessage: 10,
  allowedMimeTypes: ['*/*']
}
```

### Utility Functions

```typescript
function getAttachmentType(mimeType: string): AttachmentType
function getAttachmentCategory(mimeType: string): AttachmentCategory
function formatFileSize(bytes: number): string
function isFileTypeAllowed(mimeType: string, allowed: string[]): boolean
function getFileIcon(mimeType: string): string
```

---

## Notification Types

Source: `/src/types/notification.ts`

### Core Types

```typescript
type NotificationType =
  | 'message_mention'
  | 'message_reply'
  | 'thread_reply'
  | 'channel_invite'
  | 'channel_join'
  | 'reaction'
  | 'system'
  | 'integration'

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'
type NotificationChannel = 'in_app' | 'push' | 'email'
type NotificationStatus = 'unread' | 'read' | 'archived'

interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  priority: NotificationPriority
  status: NotificationStatus
  metadata: NotificationContent
  readAt?: string
  createdAt: string
}

interface GroupedNotification {
  type: NotificationType
  notifications: Notification[]
  count: number
  latestAt: string
}
```

### Content Types

```typescript
interface MessageNotificationContent {
  messageId: string
  channelId: string
  senderId: string
  senderName: string
  preview: string
}

interface ReactionNotificationContent {
  messageId: string
  channelId: string
  userId: string
  userName: string
  emoji: string
}

interface ChannelNotificationContent {
  channelId: string
  channelName: string
  inviterId?: string
  inviterName?: string
}

type NotificationContent =
  | MessageNotificationContent
  | ReactionNotificationContent
  | ChannelNotificationContent
  | SystemNotificationContent
  | IntegrationNotificationContent
```

### Preferences

```typescript
interface NotificationPreferences {
  channels: {
    inApp: boolean
    push: boolean
    email: boolean
  }
  types: Record<NotificationType, boolean>
  schedule?: NotificationSchedule
  keywords: KeywordNotificationSettings
}

interface NotificationSchedule {
  enabled: boolean
  startTime: string // HH:mm
  endTime: string   // HH:mm
  timezone: string
  days: number[]    // 0-6 (Sunday-Saturday)
}
```

---

## Poll Types

Source: `/src/types/poll.ts`

### Core Types

```typescript
type PollType = 'single' | 'multiple' | 'ranked'
type PollStatus = 'draft' | 'active' | 'closed'
type PollResultsVisibility = 'always' | 'after_vote' | 'after_close'

interface Poll {
  id: string
  channelId: string
  creatorId: string
  question: string
  options: PollOption[]
  type: PollType
  status: PollStatus
  settings: PollSettings
  totalVotes: number
  endsAt?: string
  closedAt?: string
  createdAt: string
}

interface PollOption {
  id: string
  text: string
  emoji?: string
  position: number
}

interface PollVote {
  optionId: string
  userId: string
  rank?: number // For ranked choice
  votedAt: string
}

interface PollSettings {
  allowMultiple: boolean
  maxChoices?: number
  showResultsBeforeVote: boolean
  resultsVisibility: PollResultsVisibility
  allowChangeVote: boolean
  anonymous: boolean
}
```

### Utility Functions

```typescript
function isPollOpen(poll: Poll): boolean
function canVoteInPoll(poll: Poll, userId: string): boolean
function calculatePollPercentages(poll: PollWithResults): PollOptionResult[]
function getWinningOptions(poll: PollWithResults): PollOption[]
```

---

## Emoji Types

Source: `/src/types/emoji.ts`

### Core Types

```typescript
type StandardEmojiCategory = 'smileys' | 'people' | 'animals' | 'food' | 'travel' | 'activities' | 'objects' | 'symbols' | 'flags'
type EmojiCategory = StandardEmojiCategory | 'custom' | 'recent' | 'frequent'

type SkinTone = 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'

interface Emoji {
  id: string
  native: string
  name: string
  shortName: string
  category: StandardEmojiCategory
  keywords: string[]
  skinTones?: boolean
}

interface CustomEmoji {
  id: string
  name: string
  shortName: string
  imageUrl: string
  creatorId: string
  packId?: string
  isAnimated: boolean
  createdAt: string
}

type AnyEmoji = Emoji | CustomEmoji
```

### Reaction Types

```typescript
interface Reaction {
  emoji: string
  count: number
  users: UserBasicInfo[]
  hasReacted: boolean
}

interface ReactionWithUsers {
  emoji: string
  users: UserBasicInfo[]
}

interface ReactionSummary {
  totalCount: number
  topReactions: Reaction[]
  hasUserReacted: boolean
}
```

### Utility Functions

```typescript
function formatEmojiShortName(name: string): string
function parseEmojiShortName(text: string): string | null
function isValidEmojiName(name: string): boolean
function applyEmojiSkinTone(emoji: Emoji, skinTone: SkinTone): string
function getEmojiLabel(emoji: AnyEmoji): string
```

---

## Search Types

Source: `/src/types/search.ts`

### Core Types

```typescript
type SearchResultType = 'message' | 'file' | 'channel' | 'user' | 'thread'
type SearchScope = 'all' | 'channel' | 'dm' | 'thread'
type SearchSortBy = 'relevance' | 'date' | 'popularity'
type SearchSortOrder = 'asc' | 'desc'

interface SearchQuery {
  query: string
  scope: SearchScope
  types: SearchResultType[]
  filters: SearchFilters
  sort: SearchSortOptions
  pagination: SearchPagination
}

interface SearchFilters {
  channelIds?: string[]
  userIds?: string[]
  dateRange?: DateRangeFilter
  hasAttachments?: boolean
  hasReactions?: boolean
  isThreaded?: boolean
}

interface DateRangeFilter {
  from?: string
  to?: string
  relative?: RelativeDateRange
}

type RelativeDateRange = 'today' | 'week' | 'month' | 'year'
```

### Result Types

```typescript
interface SearchHighlight {
  field: string
  snippet: string
  matchPositions: [number, number][]
}

interface MessageSearchResult {
  type: 'message'
  message: Message
  highlights: SearchHighlight[]
  score: number
}

interface FileSearchResult {
  type: 'file'
  attachment: Attachment
  message: Message
  highlights: SearchHighlight[]
  score: number
}

interface ChannelSearchResult {
  type: 'channel'
  channel: Channel
  memberCount: number
  highlights: SearchHighlight[]
  score: number
}

interface UserSearchResult {
  type: 'user'
  user: User
  highlights: SearchHighlight[]
  score: number
}

type SearchResult = MessageSearchResult | FileSearchResult | ChannelSearchResult | UserSearchResult
```

---

## Webhook Types

Source: `/src/types/webhook.ts`

### Core Types

```typescript
type WebhookDirection = 'incoming' | 'outgoing'
type WebhookStatus = 'active' | 'paused' | 'error'
type WebhookEventType =
  | 'message.created'
  | 'message.updated'
  | 'message.deleted'
  | 'reaction.added'
  | 'reaction.removed'
  | 'channel.created'
  | 'channel.updated'
  | 'member.joined'
  | 'member.left'
  | 'user.updated'
  | 'file.uploaded'

interface IncomingWebhook {
  id: string
  channelId: string
  name: string
  description?: string
  token: string
  avatarUrl?: string
  status: WebhookStatus
  createdBy: string
  createdAt: string
}

interface OutgoingWebhook {
  id: string
  name: string
  url: string
  events: WebhookEventType[]
  filters: WebhookFilters
  auth: WebhookAuth
  status: WebhookStatus
  retryConfig: WebhookRetryConfig
  createdBy: string
  createdAt: string
}
```

### Utility Functions

```typescript
function generateWebhookSignature(payload: string, secret: string): string
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean
function getEventCategory(event: WebhookEventType): string
```

---

## Bot Types

Source: `/src/types/bot.ts`

### Core Types

```typescript
type BotStatus = 'online' | 'offline' | 'maintenance'
type BotVisibility = 'public' | 'private' | 'workspace'
type BotCategory = 'productivity' | 'moderation' | 'fun' | 'utility' | 'integration' | 'custom'

interface Bot {
  id: string
  name: string
  username: string
  description: string
  avatarUrl?: string
  category: BotCategory
  visibility: BotVisibility
  status: BotStatus
  commands: BotCommand[]
  permissions: BotPermissions
  ownerId: string
  installCount: number
  createdAt: string
}

interface BotCommand {
  name: string
  description: string
  options: BotCommandOption[]
  permissions?: BotPermissionScope[]
}

type BotCommandOptionType = 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role'

interface BotCommandOption {
  name: string
  description: string
  type: BotCommandOptionType
  required: boolean
  choices?: BotCommandChoice[]
}
```

### Permission Types

```typescript
type BotPermissionScope =
  | 'read_messages'
  | 'send_messages'
  | 'manage_messages'
  | 'read_members'
  | 'manage_members'
  | 'read_channels'
  | 'manage_channels'
  | 'add_reactions'
  | 'manage_webhooks'
  | 'use_slash_commands'

interface BotPermissions {
  scopes: BotPermissionScope[]
  channels: BotChannelPermission[]
}
```

---

## Sticker Types

Source: `/src/types/sticker.ts`

### Core Types

```typescript
type StickerType = 'static' | 'animated'
type StickerFormat = 'png' | 'gif' | 'webp' | 'lottie'
type StickerVisibility = 'public' | 'private' | 'workspace'

interface Sticker {
  id: string
  name: string
  imageUrl: string
  type: StickerType
  format: StickerFormat
  tags: string[]
  packId?: string
  creatorId?: string
  createdAt: string
}

interface StickerPack {
  id: string
  name: string
  description?: string
  coverStickerId?: string
  stickers: Sticker[]
  visibility: StickerVisibility
  creatorId: string
  installCount: number
  createdAt: string
}
```

---

## API Types

Source: `/src/types/api.ts`

### Response Types

```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: APIError
  meta?: APIResponseMeta
}

interface APIError {
  code: APIErrorCode
  message: string
  details?: Record<string, unknown>
  fieldErrors?: APIFieldError[]
}

type APIErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
```

### Pagination Types

```typescript
interface PaginationInput {
  limit?: number
  offset?: number
  cursor?: string
}

interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  cursor?: string
}

interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Relay-style connections
interface Connection<T> {
  edges: Edge<T>[]
  pageInfo: CursorPaginationInfo
}

interface Edge<T> {
  node: T
  cursor: string
}
```

### GraphQL Types

```typescript
type GraphQLOperationType = 'query' | 'mutation' | 'subscription'

interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
  operationName?: string
}

interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

interface GraphQLError {
  message: string
  locations?: GraphQLErrorLocation[]
  path?: (string | number)[]
  extensions?: HasuraErrorExtensions
}
```

---

## Socket Types

Source: `/src/types/socket.ts`

### Connection Types

```typescript
type SocketConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

interface SocketConnectionInfo {
  state: SocketConnectionState
  latency?: number
  reconnectAttempts: number
  lastConnectedAt?: string
}

interface SocketConnectionOptions {
  autoConnect: boolean
  reconnection: boolean
  reconnectionAttempts: number
  reconnectionDelay: number
  timeout: number
}
```

### Event Types

```typescript
// Client -> Server events
type ClientToServerEvent =
  | 'authenticate'
  | 'channel:join'
  | 'channel:leave'
  | 'message:send'
  | 'message:edit'
  | 'message:delete'
  | 'message:read'
  | 'typing:start'
  | 'typing:stop'
  | 'reaction:add'
  | 'reaction:remove'
  | 'presence:update'
  | 'presence:subscribe'
  | 'thread:subscribe'
  | 'thread:unsubscribe'

// Server -> Client events
type ServerToClientEvent =
  | 'connected'
  | 'authenticated'
  | 'authentication:error'
  | 'message:new'
  | 'message:updated'
  | 'message:deleted'
  | 'typing:update'
  | 'read:receipt'
  | 'reaction:added'
  | 'reaction:removed'
  | 'presence:changed'
  | 'presence:bulk'
  | 'channel:created'
  | 'channel:updated'
  | 'channel:member:joined'
  | 'channel:member:left'
  | 'notification:new'
  | 'notification:count'
  | 'user:status'
```

---

## Config Types

Source: `/src/types/config.ts`

### AppConfig Types

```typescript
interface AppConfig {
  setup: SetupConfig
  owner: OwnerConfig
  branding: BrandingConfig
  landingTheme: LandingTheme
  homepage: HomepageConfig
  authProviders: AuthProvidersConfig
  authPermissions: AuthPermissionsConfig
  features: FeatureFlags
  integrations: IntegrationsConfig
  moderation: ModerationConfig
  theme: ThemeConfig
  seo: SEOConfig
  legal: LegalConfig
  social: SocialLinksConfig
}

interface SetupConfig {
  isCompleted: boolean
  currentStep: number
  visitedSteps: number[]
  completedAt?: Date
}

interface ThemeConfig {
  preset?: ThemePreset
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  mutedColor: string
  borderColor: string
  buttonPrimaryBg: string
  buttonPrimaryText: string
  buttonSecondaryBg: string
  buttonSecondaryText: string
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string
  borderRadius: string
  fontFamily: string
  colorScheme: ColorScheme
  customCSS?: string
}

type ThemePreset = 'nself' | 'slack' | 'discord' | 'ocean' | 'sunset' | 'midnight' | /* Tailwind colors */ | 'custom'
type ColorScheme = 'light' | 'dark' | 'system'
type LandingTheme = 'login-only' | 'simple-landing' | 'full-homepage' | 'corporate' | 'community'
type PermissionMode = 'allow-all' | 'verified-only' | 'idme-roles' | 'domain-restricted' | 'admin-only'
```

---

## GIF Types

Source: `/src/types/gif.ts`

### Core Types

```typescript
type GifProvider = 'giphy' | 'tenor'

interface Gif {
  id: string
  title: string
  url: string
  previewUrl: string
  thumbnailUrl: string
  width: number
  height: number
  provider: GifProvider
}

interface GifSearchParams {
  query: string
  limit?: number
  offset?: number
  rating?: 'g' | 'pg' | 'pg-13' | 'r'
}

interface GifSearchResponse {
  gifs: Gif[]
  pagination: GifPagination
}

interface GifCategory {
  id: string
  name: string
  imageUrl: string
}
```

---

## Importing Types

### Recommended Import Pattern

```typescript
// Import from the barrel file
import type {
  User,
  UserRole,
  Channel,
  ChannelType,
  Message,
  MessageType,
  AppConfig,
  ThemeConfig
} from '@/types'

// Import utility functions
import {
  isDirectMessage,
  formatFileSize,
  formatTypingIndicator,
  isPollOpen
} from '@/types'
```

### Type Path Aliases

Configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/types": ["./src/types"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

---

*This document covers all TypeScript types defined in nself-chat. See individual type files for complete definitions.*
