// ═══════════════════════════════════════════════════════════════════════════════
// Discord Feature Set
// ═══════════════════════════════════════════════════════════════════════════════
//
// Complete Discord feature parity definitions including:
// - Servers (workspaces/guilds)
// - Channel types (text, voice, stage, forum, announcement)
// - Categories
// - Roles with colors and permissions
// - Server boosts
// - Nitro features
// - Activities
// - Streaming
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Channel Types
// ─────────────────────────────────────────────────────────────────────────────

export type DiscordChannelType =
  | 'text'           // Regular text channel
  | 'voice'          // Voice channel
  | 'stage'          // Stage channel (like concert/presentation)
  | 'forum'          // Forum channel for organized discussions
  | 'announcement'   // Announcement channel (can be followed)
  | 'dm'             // Direct message
  | 'group_dm'       // Group DM (up to 10 people)
  | 'thread'         // Thread (attached to a message)
  | 'private_thread' // Private thread
  | 'public_thread'  // Public thread

export interface DiscordChannel {
  id: string
  name: string
  type: DiscordChannelType
  categoryId?: string
  position: number
  topic?: string
  nsfw?: boolean
  slowMode?: number // Seconds between messages
  lastMessageId?: string
  lastMessageAt?: Date
  permissions?: DiscordPermissionOverwrite[]
  // Voice/Stage specific
  bitrate?: number
  userLimit?: number
  rtcRegion?: string
  // Forum specific
  defaultReactionEmoji?: string
  defaultSortOrder?: 'latest_activity' | 'creation_date'
  defaultForumLayout?: 'not_set' | 'list' | 'gallery'
  availableTags?: DiscordForumTag[]
  // Thread specific
  parentId?: string
  ownerId?: string
  messageCount?: number
  memberCount?: number
  archived?: boolean
  autoArchiveDuration?: 60 | 1440 | 4320 | 10080 // Minutes
  locked?: boolean
}

export interface DiscordCategory {
  id: string
  name: string
  position: number
  collapsed?: boolean
  permissions?: DiscordPermissionOverwrite[]
}

export interface DiscordForumTag {
  id: string
  name: string
  emoji?: string
  moderated?: boolean // Can only be applied by moderators
}

// ─────────────────────────────────────────────────────────────────────────────
// Channel Icons
// ─────────────────────────────────────────────────────────────────────────────

export const discordChannelIcons = {
  text: 'Hash',           // #
  voice: 'Volume2',       // Speaker
  stage: 'Radio',         // Stage/broadcast
  forum: 'MessagesSquare', // Forum
  announcement: 'Megaphone', // Announcement
  dm: 'AtSign',           // @
  thread: 'MessageSquare', // Thread
  private: 'Lock',        // Private
  nsfw: 'AlertTriangle',  // NSFW
  rules: 'BookOpen',      // Rules channel
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Server (Guild) Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordServer {
  id: string
  name: string
  icon?: string
  banner?: string
  splash?: string // Invite splash image
  description?: string
  ownerId: string
  region?: string
  afkChannelId?: string
  afkTimeout?: number
  verificationLevel: DiscordVerificationLevel
  defaultNotifications: 'all_messages' | 'only_mentions'
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members'
  features: DiscordServerFeature[]
  mfaLevel: 0 | 1 // 0 = none, 1 = elevated (admin requires 2FA)
  systemChannelId?: string
  rulesChannelId?: string
  publicUpdatesChannelId?: string
  preferredLocale?: string
  premiumTier: 0 | 1 | 2 | 3 // Boost level
  premiumSubscriptionCount?: number // Number of boosts
  vanityUrlCode?: string
  maxMembers?: number
  maxVideoChannelUsers?: number
  approximateMemberCount?: number
  approximatePresenceCount?: number
  nsfwLevel: 'default' | 'explicit' | 'safe' | 'age_restricted'
  createdAt: Date
}

export type DiscordVerificationLevel =
  | 'none'        // Unrestricted
  | 'low'         // Must have verified email
  | 'medium'      // Must be registered for 5+ minutes
  | 'high'        // Must be member for 10+ minutes
  | 'very_high'   // Must have verified phone

export type DiscordServerFeature =
  | 'ANIMATED_BANNER'
  | 'ANIMATED_ICON'
  | 'APPLICATION_COMMAND_PERMISSIONS_V2'
  | 'AUTO_MODERATION'
  | 'BANNER'
  | 'COMMUNITY'
  | 'CREATOR_MONETIZABLE_PROVISIONAL'
  | 'CREATOR_STORE_PAGE'
  | 'DEVELOPER_SUPPORT_SERVER'
  | 'DISCOVERABLE'
  | 'FEATURABLE'
  | 'INVITES_DISABLED'
  | 'INVITE_SPLASH'
  | 'MEMBER_VERIFICATION_GATE_ENABLED'
  | 'MORE_STICKERS'
  | 'NEWS'
  | 'PARTNERED'
  | 'PREVIEW_ENABLED'
  | 'ROLE_ICONS'
  | 'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE'
  | 'ROLE_SUBSCRIPTIONS_ENABLED'
  | 'TICKETED_EVENTS_ENABLED'
  | 'VANITY_URL'
  | 'VERIFIED'
  | 'VIP_REGIONS'
  | 'WELCOME_SCREEN_ENABLED'

// ─────────────────────────────────────────────────────────────────────────────
// Roles & Permissions
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordRole {
  id: string
  name: string
  color: number // Integer color code
  hoist: boolean // Display separately in member list
  icon?: string
  unicodeEmoji?: string
  position: number
  permissions: bigint | string // Permission bitfield
  managed: boolean // Managed by integration
  mentionable: boolean
  tags?: {
    botId?: string
    integrationId?: string
    premiumSubscriber?: boolean
    subscriptionListingId?: string
    availableForPurchase?: boolean
    guildConnections?: boolean
  }
}

export interface DiscordPermissionOverwrite {
  id: string // Role or user ID
  type: 'role' | 'member'
  allow: bigint | string
  deny: bigint | string
}

// Discord permission flags
export const DiscordPermissions = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_INSIGHTS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n, // Voice Activity Detection
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_GUILD_EXPRESSIONS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  CREATE_PUBLIC_THREADS: 1n << 35n,
  CREATE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_EMBEDDED_ACTIVITIES: 1n << 39n,
  MODERATE_MEMBERS: 1n << 40n,
  VIEW_CREATOR_MONETIZATION_ANALYTICS: 1n << 41n,
  USE_SOUNDBOARD: 1n << 42n,
  USE_EXTERNAL_SOUNDS: 1n << 45n,
  SEND_VOICE_MESSAGES: 1n << 46n,
} as const

// Default role presets
export const discordRolePresets = {
  admin: {
    name: 'Admin',
    color: 0xE74C3C, // Red
    permissions: DiscordPermissions.ADMINISTRATOR,
    hoist: true,
    mentionable: true,
  },
  moderator: {
    name: 'Moderator',
    color: 0x3498DB, // Blue
    permissions:
      DiscordPermissions.KICK_MEMBERS |
      DiscordPermissions.BAN_MEMBERS |
      DiscordPermissions.MANAGE_MESSAGES |
      DiscordPermissions.MANAGE_NICKNAMES |
      DiscordPermissions.MUTE_MEMBERS |
      DiscordPermissions.MOVE_MEMBERS |
      DiscordPermissions.MODERATE_MEMBERS,
    hoist: true,
    mentionable: true,
  },
  member: {
    name: 'Member',
    color: 0x2ECC71, // Green
    permissions:
      DiscordPermissions.VIEW_CHANNEL |
      DiscordPermissions.SEND_MESSAGES |
      DiscordPermissions.READ_MESSAGE_HISTORY |
      DiscordPermissions.ADD_REACTIONS |
      DiscordPermissions.USE_EXTERNAL_EMOJIS |
      DiscordPermissions.CONNECT |
      DiscordPermissions.SPEAK,
    hoist: false,
    mentionable: false,
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Member Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordMember {
  id: string
  username: string
  displayName?: string
  discriminator?: string // Legacy (pre-2023 #0000)
  globalName?: string
  avatar?: string
  banner?: string
  bannerColor?: string
  accentColor?: number
  bio?: string
  pronouns?: string
  status: DiscordUserStatus
  customStatus?: {
    emoji?: string
    text?: string
    expiresAt?: Date
  }
  activities?: DiscordActivity[]
  roles: string[] // Role IDs
  joinedAt: Date
  premiumSince?: Date // Nitro boosting since
  pending?: boolean // Hasn't passed membership screening
  communicationDisabledUntil?: Date // Timeout
  flags?: number
  nick?: string // Server nickname
  deaf?: boolean
  mute?: boolean
  isOwner?: boolean
  isBot?: boolean
  isSystem?: boolean
}

export type DiscordUserStatus =
  | 'online'
  | 'idle'
  | 'dnd' // Do Not Disturb
  | 'offline'
  | 'invisible'

export interface DiscordActivity {
  name: string
  type: DiscordActivityType
  url?: string // For streaming
  createdAt: Date
  timestamps?: {
    start?: Date
    end?: Date
  }
  applicationId?: string
  details?: string
  state?: string
  emoji?: {
    name: string
    id?: string
    animated?: boolean
  }
  party?: {
    id?: string
    size?: [number, number] // [current, max]
  }
  assets?: {
    largeImage?: string
    largeText?: string
    smallImage?: string
    smallText?: string
  }
  buttons?: string[]
}

export type DiscordActivityType =
  | 0 // Playing
  | 1 // Streaming
  | 2 // Listening
  | 3 // Watching
  | 4 // Custom
  | 5 // Competing

export const discordActivityTypeLabels = {
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening to',
  3: 'Watching',
  4: '', // Custom status - no label
  5: 'Competing in',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordMessage {
  id: string
  channelId: string
  author: DiscordMember
  content: string
  timestamp: Date
  editedTimestamp?: Date
  tts: boolean
  mentionEveryone: boolean
  mentions: DiscordMember[]
  mentionRoles: string[]
  mentionChannels?: DiscordChannel[]
  attachments: DiscordAttachment[]
  embeds: DiscordEmbed[]
  reactions?: DiscordReaction[]
  pinned: boolean
  type: DiscordMessageType
  activity?: {
    type: 1 | 2 | 3 | 5 // JOIN, SPECTATE, LISTEN, JOIN_REQUEST
    partyId?: string
  }
  application?: {
    id: string
    name: string
    icon?: string
  }
  messageReference?: {
    messageId?: string
    channelId?: string
    guildId?: string
  }
  flags?: number
  referencedMessage?: DiscordMessage
  thread?: DiscordChannel
  components?: DiscordComponent[]
  stickerItems?: DiscordSticker[]
}

export type DiscordMessageType =
  | 0  // Default
  | 1  // Recipient Add
  | 2  // Recipient Remove
  | 3  // Call
  | 4  // Channel Name Change
  | 5  // Channel Icon Change
  | 6  // Channel Pinned Message
  | 7  // User Join
  | 8  // Guild Boost
  | 9  // Guild Boost Tier 1
  | 10 // Guild Boost Tier 2
  | 11 // Guild Boost Tier 3
  | 12 // Channel Follow Add
  | 14 // Guild Discovery Disqualified
  | 15 // Guild Discovery Requalified
  | 16 // Guild Discovery Grace Period Initial Warning
  | 17 // Guild Discovery Grace Period Final Warning
  | 18 // Thread Created
  | 19 // Reply
  | 20 // Chat Input Command
  | 21 // Thread Starter Message
  | 22 // Guild Invite Reminder
  | 23 // Context Menu Command
  | 24 // Auto Moderation Action
  | 25 // Role Subscription Purchase
  | 26 // Interaction Premium Upsell
  | 27 // Stage Start
  | 28 // Stage End
  | 29 // Stage Speaker
  | 31 // Stage Topic
  | 32 // Guild Application Premium Subscription

export interface DiscordAttachment {
  id: string
  filename: string
  description?: string
  contentType?: string
  size: number
  url: string
  proxyUrl: string
  height?: number
  width?: number
  ephemeral?: boolean
  durationSecs?: number // For voice messages
  waveform?: string // Base64 encoded waveform for voice messages
}

export interface DiscordEmbed {
  title?: string
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link'
  description?: string
  url?: string
  timestamp?: Date
  color?: number
  footer?: {
    text: string
    iconUrl?: string
    proxyIconUrl?: string
  }
  image?: {
    url: string
    proxyUrl?: string
    height?: number
    width?: number
  }
  thumbnail?: {
    url: string
    proxyUrl?: string
    height?: number
    width?: number
  }
  video?: {
    url?: string
    proxyUrl?: string
    height?: number
    width?: number
  }
  provider?: {
    name?: string
    url?: string
  }
  author?: {
    name: string
    url?: string
    iconUrl?: string
    proxyIconUrl?: string
  }
  fields?: {
    name: string
    value: string
    inline?: boolean
  }[]
}

export interface DiscordReaction {
  count: number
  me: boolean // Current user reacted
  emoji: {
    id?: string
    name: string
    animated?: boolean
  }
}

export interface DiscordSticker {
  id: string
  name: string
  formatType: 1 | 2 | 3 | 4 // PNG, APNG, LOTTIE, GIF
}

export interface DiscordComponent {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 // ActionRow, Button, SelectMenu, TextInput, UserSelect, RoleSelect, MentionableSelect, ChannelSelect
  components?: DiscordComponent[]
  style?: 1 | 2 | 3 | 4 | 5 // Primary, Secondary, Success, Danger, Link
  label?: string
  emoji?: {
    id?: string
    name?: string
    animated?: boolean
  }
  customId?: string
  url?: string
  disabled?: boolean
  placeholder?: string
  minValues?: number
  maxValues?: number
  options?: {
    label: string
    value: string
    description?: string
    emoji?: {
      id?: string
      name?: string
      animated?: boolean
    }
    default?: boolean
  }[]
  minLength?: number
  maxLength?: number
  required?: boolean
  value?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mentions
// ─────────────────────────────────────────────────────────────────────────────

export const discordMentionTypes = {
  user: '@',
  role: '@&',
  channel: '#',
  everyone: '@everyone',
  here: '@here',
} as const

export interface DiscordMentionConfig {
  allowEveryone: boolean
  allowHere: boolean
  allowRoleMentions: boolean
  allowUserMentions: boolean
  suppressEveryone?: boolean
  suppressRoles?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Boosts
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordBoostTier {
  level: 0 | 1 | 2 | 3
  boostsRequired: number
  perks: string[]
}

export const discordBoostTiers: DiscordBoostTier[] = [
  {
    level: 0,
    boostsRequired: 0,
    perks: [],
  },
  {
    level: 1,
    boostsRequired: 2,
    perks: [
      '50 additional emoji slots (100 total)',
      '15 additional sticker slots (20 total)',
      '128 Kbps audio quality',
      'Animated server icon',
      'Custom server invite background',
      '+100MB max upload size (25MB total)',
    ],
  },
  {
    level: 2,
    boostsRequired: 7,
    perks: [
      '100 additional emoji slots (150 total)',
      '15 additional sticker slots (30 total)',
      '256 Kbps audio quality',
      'Server banner',
      '50MB max upload size',
      'Custom role icons',
    ],
  },
  {
    level: 3,
    boostsRequired: 14,
    perks: [
      '150 additional emoji slots (250 total)',
      '30 additional sticker slots (60 total)',
      '384 Kbps audio quality',
      'Vanity URL',
      '100MB max upload size',
      'Animated server banner',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Nitro Features (Placeholder)
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordNitroFeatures {
  tier: 'none' | 'basic' | 'full'
  customEmoji: boolean
  animatedAvatar: boolean
  animatedEmoji: boolean
  customStickers: boolean
  uploadSize: number // In MB
  streamQuality: '720p' | '1080p' | '4k'
  serverBoostDiscount: boolean
  boostsIncluded: number
  profileBadge: boolean
  profileBanner: boolean
  profileColors: boolean
  customTag: boolean
}

export const discordNitroTiers: Record<'none' | 'basic' | 'full', DiscordNitroFeatures> = {
  none: {
    tier: 'none',
    customEmoji: false,
    animatedAvatar: false,
    animatedEmoji: false,
    customStickers: false,
    uploadSize: 25,
    streamQuality: '720p',
    serverBoostDiscount: false,
    boostsIncluded: 0,
    profileBadge: false,
    profileBanner: false,
    profileColors: false,
    customTag: false,
  },
  basic: {
    tier: 'basic',
    customEmoji: true,
    animatedAvatar: true,
    animatedEmoji: true,
    customStickers: false,
    uploadSize: 50,
    streamQuality: '1080p',
    serverBoostDiscount: false,
    boostsIncluded: 0,
    profileBadge: true,
    profileBanner: false,
    profileColors: false,
    customTag: false,
  },
  full: {
    tier: 'full',
    customEmoji: true,
    animatedAvatar: true,
    animatedEmoji: true,
    customStickers: true,
    uploadSize: 500,
    streamQuality: '4k',
    serverBoostDiscount: true,
    boostsIncluded: 2,
    profileBadge: true,
    profileBanner: true,
    profileColors: true,
    customTag: true,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Activities (Placeholder)
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordEmbeddedActivity {
  id: string
  name: string
  description: string
  icon: string
  maxParticipants?: number
  premium?: boolean
  guildTier?: number // Required boost level
}

export const discordActivities: DiscordEmbeddedActivity[] = [
  {
    id: 'poker',
    name: 'Poker Night',
    description: 'Play poker with friends',
    icon: 'cards',
    maxParticipants: 7,
    premium: true,
  },
  {
    id: 'chess',
    name: 'Chess in the Park',
    description: 'Play chess with a friend',
    icon: 'chess',
    maxParticipants: 2,
    premium: false,
  },
  {
    id: 'youtube',
    name: 'Watch Together',
    description: 'Watch YouTube together',
    icon: 'youtube',
    premium: false,
  },
  {
    id: 'sketch',
    name: 'Sketch Heads',
    description: 'Drawing game like Pictionary',
    icon: 'pencil',
    maxParticipants: 8,
    premium: false,
  },
  {
    id: 'letter',
    name: 'Letter League',
    description: 'Word game',
    icon: 'text',
    maxParticipants: 8,
    premium: false,
  },
  {
    id: 'spellcast',
    name: 'SpellCast',
    description: 'Word spelling game',
    icon: 'wand',
    maxParticipants: 6,
    premium: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Voice & Streaming (Placeholder)
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordVoiceState {
  userId: string
  channelId?: string
  guildId?: string
  deaf: boolean
  mute: boolean
  selfDeaf: boolean
  selfMute: boolean
  selfVideo: boolean
  selfStream: boolean
  suppress: boolean
  requestToSpeakTimestamp?: Date
}

export interface DiscordStreamSettings {
  quality: 'auto' | '720p30' | '720p60' | '1080p30' | '1080p60' | '1440p60' | '4k60'
  soundEnabled: boolean
  frameRate: 15 | 30 | 60
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto Moderation
// ─────────────────────────────────────────────────────────────────────────────

export interface DiscordAutoModRule {
  id: string
  guildId: string
  name: string
  creatorId: string
  eventType: 1 // Message Send
  triggerType: 1 | 3 | 4 | 5 // Keyword, Spam, KeywordPreset, MentionSpam
  triggerMetadata?: {
    keywordFilter?: string[]
    regexPatterns?: string[]
    presets?: (1 | 2 | 3)[] // Profanity, SexualContent, Slurs
    allowList?: string[]
    mentionTotalLimit?: number
    mentionRaidProtectionEnabled?: boolean
  }
  actions: DiscordAutoModAction[]
  enabled: boolean
  exemptRoles?: string[]
  exemptChannels?: string[]
}

export interface DiscordAutoModAction {
  type: 1 | 2 | 3 | 4 // BlockMessage, SendAlertMessage, Timeout, BlockMemberInteraction
  metadata?: {
    channelId?: string
    durationSeconds?: number
    customMessage?: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Flags
// ─────────────────────────────────────────────────────────────────────────────

export const discordFeatureFlags = {
  // Core features (always enabled)
  servers: true,
  textChannels: true,
  directMessages: true,
  groupDMs: true,
  threads: true,
  reactions: true,
  embeds: true,
  attachments: true,
  mentions: true,

  // Voice features (placeholder - not implemented)
  voiceChannels: false,
  stageChannels: false,
  streaming: false,
  videoChat: false,
  screenShare: false,
  goLive: false,

  // Advanced channel types
  forumChannels: true,
  announcementChannels: true,
  categories: true,

  // Role features
  roles: true,
  roleColors: true,
  roleHierarchy: true,
  roleIcons: false, // Boost level 2
  customPermissions: true,

  // Moderation
  autoModeration: true,
  timeouts: true,
  bans: true,
  kicks: true,
  messageManagement: true,
  auditLog: true,

  // Server features
  serverBoosts: false, // Placeholder
  vanityUrl: false, // Boost level 3
  serverBanner: false, // Boost level 2
  animatedIcon: false, // Boost level 1
  inviteSplash: false, // Boost level 1
  welcomeScreen: true,
  membershipScreening: true,

  // Nitro features (placeholder)
  nitro: false,
  customEmoji: true, // Limited without Nitro
  animatedEmoji: false, // Nitro only
  customStickers: false, // Nitro only
  largeFileUploads: false, // Nitro only

  // Activities (placeholder)
  activities: false,

  // Integrations
  webhooks: true,
  bots: true,
  apps: true,
  linkedRoles: false,
} as const

export type DiscordFeatureFlag = keyof typeof discordFeatureFlags

// ─────────────────────────────────────────────────────────────────────────────
// Export All Types
// ─────────────────────────────────────────────────────────────────────────────

export type {
  DiscordServer as Server,
  DiscordChannel as Channel,
  DiscordCategory as Category,
  DiscordRole as Role,
  DiscordMember as Member,
  DiscordMessage as Message,
  DiscordReaction as Reaction,
  DiscordEmbed as Embed,
  DiscordAttachment as Attachment,
}
