// ═══════════════════════════════════════════════════════════════════════════════
// Slack Feature Set - Complete Feature Parity
// ═══════════════════════════════════════════════════════════════════════════════
//
// Complete enumeration of all Slack features with their implementation status
// and configuration options.
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// Feature Status Types
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureStatus = 'implemented' | 'partial' | 'placeholder' | 'planned'

export interface SlackFeature {
  id: string
  name: string
  description: string
  status: FeatureStatus
  category: FeatureCategory
  enabled: boolean
  premium?: boolean
  beta?: boolean
}

export type FeatureCategory =
  | 'messaging'
  | 'channels'
  | 'dms'
  | 'threads'
  | 'search'
  | 'files'
  | 'apps'
  | 'calls'
  | 'workflow'
  | 'admin'
  | 'notifications'
  | 'accessibility'

// ─────────────────────────────────────────────────────────────────────────────
// Channel Features
// ─────────────────────────────────────────────────────────────────────────────

export const channelFeatures: SlackFeature[] = [
  {
    id: 'public-channels',
    name: 'Public Channels',
    description: 'Open channels anyone in the workspace can join',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'private-channels',
    name: 'Private Channels',
    description: 'Invite-only channels with restricted access',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'channel-sections',
    name: 'Channel Sections',
    description: 'Organize channels into custom sections in the sidebar',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'channel-bookmarks',
    name: 'Channel Bookmarks',
    description: 'Pin links and files to the top of a channel',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'channel-description',
    name: 'Channel Description',
    description: 'Set a description and topic for channels',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'channel-settings',
    name: 'Channel Settings',
    description: 'Configure notifications, posting permissions, and more',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'shared-channels',
    name: 'Shared Channels',
    description: 'Connect channels across different workspaces',
    status: 'placeholder',
    category: 'channels',
    enabled: false,
    premium: true,
  },
  {
    id: 'channel-archive',
    name: 'Channel Archive',
    description: 'Archive inactive channels to keep workspace organized',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
  {
    id: 'default-channels',
    name: 'Default Channels',
    description: 'Channels new members automatically join',
    status: 'implemented',
    category: 'channels',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Direct Message Features
// ─────────────────────────────────────────────────────────────────────────────

export const dmFeatures: SlackFeature[] = [
  {
    id: 'direct-messages',
    name: 'Direct Messages',
    description: 'Private 1:1 conversations',
    status: 'implemented',
    category: 'dms',
    enabled: true,
  },
  {
    id: 'group-dms',
    name: 'Group Direct Messages',
    description: 'Private conversations with up to 9 people',
    status: 'implemented',
    category: 'dms',
    enabled: true,
  },
  {
    id: 'dm-mute',
    name: 'Mute DMs',
    description: 'Silence notifications from specific conversations',
    status: 'implemented',
    category: 'dms',
    enabled: true,
  },
  {
    id: 'dm-star',
    name: 'Star DMs',
    description: 'Keep important conversations easily accessible',
    status: 'implemented',
    category: 'dms',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Messaging Features
// ─────────────────────────────────────────────────────────────────────────────

export const messagingFeatures: SlackFeature[] = [
  {
    id: 'rich-text',
    name: 'Rich Text Formatting',
    description: 'Bold, italic, strikethrough, code, and more',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'markdown',
    name: 'Markdown Support',
    description: 'Write messages using markdown syntax',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'emoji',
    name: 'Emoji',
    description: 'Express yourself with emoji',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'custom-emoji',
    name: 'Custom Emoji',
    description: 'Upload and use custom emoji in your workspace',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'reactions',
    name: 'Message Reactions',
    description: 'React to messages with emoji',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'mentions',
    name: '@Mentions',
    description: 'Mention users, channels, @here, and @channel',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'mention-here',
    name: '@here Mention',
    description: 'Notify all active members in a channel',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'mention-channel',
    name: '@channel Mention',
    description: 'Notify all members in a channel',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'mention-everyone',
    name: '@everyone Mention',
    description: 'Notify everyone in the workspace',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'link-previews',
    name: 'Link Previews',
    description: 'Automatically unfurl links with rich previews',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'code-blocks',
    name: 'Code Blocks',
    description: 'Share code with syntax highlighting',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'code-snippets',
    name: 'Code Snippets',
    description: 'Create titled code snippets with language selection',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-edit',
    name: 'Edit Messages',
    description: 'Edit your sent messages',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-delete',
    name: 'Delete Messages',
    description: 'Delete your sent messages',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-pin',
    name: 'Pin Messages',
    description: 'Pin important messages to a channel',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-bookmark',
    name: 'Save Messages',
    description: 'Save messages to your Later list',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-share',
    name: 'Share Messages',
    description: 'Forward messages to other channels or DMs',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-link',
    name: 'Copy Message Link',
    description: 'Get a direct link to any message',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'scheduled-messages',
    name: 'Scheduled Messages',
    description: 'Schedule messages to send later',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'message-reminders',
    name: 'Message Reminders',
    description: 'Set reminders for messages',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
  {
    id: 'typing-indicators',
    name: 'Typing Indicators',
    description: 'See when others are typing',
    status: 'implemented',
    category: 'messaging',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Thread Features
// ─────────────────────────────────────────────────────────────────────────────

export const threadFeatures: SlackFeature[] = [
  {
    id: 'threads',
    name: 'Message Threads',
    description: 'Reply to messages in threads to keep conversations organized',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
  {
    id: 'thread-panel',
    name: 'Thread Panel',
    description: 'View and reply to threads in a dedicated side panel',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
  {
    id: 'thread-broadcast',
    name: 'Also Send to Channel',
    description: 'Post thread replies to the main channel',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
  {
    id: 'thread-notifications',
    name: 'Thread Notifications',
    description: 'Get notified about new replies in threads you follow',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
  {
    id: 'threads-view',
    name: 'Threads View',
    description: 'See all threads you\'re following in one place',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
  {
    id: 'thread-unfollow',
    name: 'Unfollow Thread',
    description: 'Stop receiving notifications for a thread',
    status: 'implemented',
    category: 'threads',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Search Features
// ─────────────────────────────────────────────────────────────────────────────

export const searchFeatures: SlackFeature[] = [
  {
    id: 'global-search',
    name: 'Global Search',
    description: 'Search messages, files, and people across the workspace',
    status: 'implemented',
    category: 'search',
    enabled: true,
  },
  {
    id: 'search-filters',
    name: 'Search Filters',
    description: 'Filter search by date, person, channel, and file type',
    status: 'implemented',
    category: 'search',
    enabled: true,
  },
  {
    id: 'search-modifiers',
    name: 'Search Modifiers',
    description: 'Use from:, in:, has:, before:, after: and more',
    status: 'implemented',
    category: 'search',
    enabled: true,
  },
  {
    id: 'quick-switcher',
    name: 'Quick Switcher',
    description: 'Quickly navigate to channels, DMs, and more with Cmd+K',
    status: 'implemented',
    category: 'search',
    enabled: true,
  },
  {
    id: 'recent-searches',
    name: 'Recent Searches',
    description: 'Access your recent search queries',
    status: 'implemented',
    category: 'search',
    enabled: true,
  },
  {
    id: 'saved-searches',
    name: 'Saved Searches',
    description: 'Save frequently used search queries',
    status: 'partial',
    category: 'search',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// File Features
// ─────────────────────────────────────────────────────────────────────────────

export const fileFeatures: SlackFeature[] = [
  {
    id: 'file-upload',
    name: 'File Upload',
    description: 'Upload and share files up to 1GB',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'drag-drop-upload',
    name: 'Drag & Drop Upload',
    description: 'Drag files directly into a channel to upload',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'clipboard-upload',
    name: 'Paste from Clipboard',
    description: 'Paste images and files directly from clipboard',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'file-preview',
    name: 'File Preview',
    description: 'Preview images, PDFs, and documents inline',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    description: 'View multiple images in a gallery view',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'file-comments',
    name: 'File Comments',
    description: 'Add comments to uploaded files',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'file-search',
    name: 'File Search',
    description: 'Search for files by name, type, or content',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'file-browser',
    name: 'File Browser',
    description: 'Browse all files shared in the workspace',
    status: 'implemented',
    category: 'files',
    enabled: true,
  },
  {
    id: 'external-files',
    name: 'External Files',
    description: 'Connect Google Drive, Dropbox, and other services',
    status: 'placeholder',
    category: 'files',
    enabled: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// App & Integration Features
// ─────────────────────────────────────────────────────────────────────────────

export const appFeatures: SlackFeature[] = [
  {
    id: 'app-directory',
    name: 'App Directory',
    description: 'Browse and install apps from the Slack App Directory',
    status: 'placeholder',
    category: 'apps',
    enabled: false,
  },
  {
    id: 'webhooks',
    name: 'Incoming Webhooks',
    description: 'Post messages to Slack from external services',
    status: 'placeholder',
    category: 'apps',
    enabled: false,
  },
  {
    id: 'slash-commands',
    name: 'Slash Commands',
    description: 'Trigger actions with / commands',
    status: 'implemented',
    category: 'apps',
    enabled: true,
  },
  {
    id: 'bots',
    name: 'Bot Users',
    description: 'Automated bot users that can interact with members',
    status: 'placeholder',
    category: 'apps',
    enabled: false,
  },
  {
    id: 'message-buttons',
    name: 'Interactive Messages',
    description: 'Messages with buttons, menus, and other interactive elements',
    status: 'partial',
    category: 'apps',
    enabled: true,
  },
  {
    id: 'modals',
    name: 'App Modals',
    description: 'Full-featured modal dialogs for app interactions',
    status: 'placeholder',
    category: 'apps',
    enabled: false,
  },
  {
    id: 'app-home',
    name: 'App Home',
    description: 'Dedicated tab for app interactions and settings',
    status: 'placeholder',
    category: 'apps',
    enabled: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Calls & Huddles Features
// ─────────────────────────────────────────────────────────────────────────────

export const callFeatures: SlackFeature[] = [
  {
    id: 'huddles',
    name: 'Huddles',
    description: 'Lightweight audio calls in any channel or DM',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
    beta: true,
  },
  {
    id: 'huddle-video',
    name: 'Huddle Video',
    description: 'Turn on video during a huddle',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
    beta: true,
  },
  {
    id: 'huddle-screenshare',
    name: 'Huddle Screen Share',
    description: 'Share your screen during a huddle',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
  },
  {
    id: 'huddle-thread',
    name: 'Huddle Thread',
    description: 'Text chat during a huddle',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
  },
  {
    id: 'huddle-reactions',
    name: 'Huddle Reactions',
    description: 'React with emoji during a huddle',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
  },
  {
    id: 'clips',
    name: 'Clips',
    description: 'Record and share audio and video messages',
    status: 'placeholder',
    category: 'calls',
    enabled: false,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Workflow Features
// ─────────────────────────────────────────────────────────────────────────────

export const workflowFeatures: SlackFeature[] = [
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    description: 'Create automated workflows without code',
    status: 'placeholder',
    category: 'workflow',
    enabled: false,
    premium: true,
  },
  {
    id: 'workflow-forms',
    name: 'Workflow Forms',
    description: 'Collect information with custom forms',
    status: 'placeholder',
    category: 'workflow',
    enabled: false,
  },
  {
    id: 'workflow-triggers',
    name: 'Workflow Triggers',
    description: 'Start workflows from messages, emoji, or schedules',
    status: 'placeholder',
    category: 'workflow',
    enabled: false,
  },
  {
    id: 'canvas',
    name: 'Canvas',
    description: 'Collaborative documents within Slack',
    status: 'placeholder',
    category: 'workflow',
    enabled: false,
  },
  {
    id: 'lists',
    name: 'Lists',
    description: 'Track projects and tasks with collaborative lists',
    status: 'placeholder',
    category: 'workflow',
    enabled: false,
    beta: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Admin Features
// ─────────────────────────────────────────────────────────────────────────────

export const adminFeatures: SlackFeature[] = [
  {
    id: 'user-management',
    name: 'User Management',
    description: 'Invite, manage, and remove workspace members',
    status: 'implemented',
    category: 'admin',
    enabled: true,
  },
  {
    id: 'user-groups',
    name: 'User Groups',
    description: 'Create groups of users for easier mentioning',
    status: 'implemented',
    category: 'admin',
    enabled: true,
  },
  {
    id: 'custom-roles',
    name: 'Custom Roles',
    description: 'Create custom admin roles with specific permissions',
    status: 'partial',
    category: 'admin',
    enabled: true,
    premium: true,
  },
  {
    id: 'workspace-settings',
    name: 'Workspace Settings',
    description: 'Configure workspace-wide settings and defaults',
    status: 'implemented',
    category: 'admin',
    enabled: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'View workspace usage and engagement metrics',
    status: 'partial',
    category: 'admin',
    enabled: true,
    premium: true,
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    description: 'Track security and compliance events',
    status: 'placeholder',
    category: 'admin',
    enabled: false,
    premium: true,
  },
  {
    id: 'data-export',
    name: 'Data Export',
    description: 'Export workspace data and messages',
    status: 'partial',
    category: 'admin',
    enabled: true,
  },
  {
    id: 'retention-policies',
    name: 'Retention Policies',
    description: 'Set message and file retention policies',
    status: 'placeholder',
    category: 'admin',
    enabled: false,
    premium: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Notification Features
// ─────────────────────────────────────────────────────────────────────────────

export const notificationFeatures: SlackFeature[] = [
  {
    id: 'push-notifications',
    name: 'Push Notifications',
    description: 'Receive notifications on desktop and mobile',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'notification-preferences',
    name: 'Notification Preferences',
    description: 'Customize when and how you receive notifications',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'channel-notifications',
    name: 'Channel Notifications',
    description: 'Set notification preferences per channel',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'keyword-notifications',
    name: 'Keyword Notifications',
    description: 'Get notified when specific words are mentioned',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'do-not-disturb',
    name: 'Do Not Disturb',
    description: 'Pause notifications on a schedule or manually',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'notification-schedule',
    name: 'Notification Schedule',
    description: 'Set work hours when notifications are active',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
  {
    id: 'email-notifications',
    name: 'Email Notifications',
    description: 'Receive email digests for missed messages',
    status: 'implemented',
    category: 'notifications',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility Features
// ─────────────────────────────────────────────────────────────────────────────

export const accessibilityFeatures: SlackFeature[] = [
  {
    id: 'keyboard-navigation',
    name: 'Keyboard Navigation',
    description: 'Full keyboard support for all actions',
    status: 'implemented',
    category: 'accessibility',
    enabled: true,
  },
  {
    id: 'screen-reader',
    name: 'Screen Reader Support',
    description: 'Compatible with popular screen readers',
    status: 'implemented',
    category: 'accessibility',
    enabled: true,
  },
  {
    id: 'high-contrast',
    name: 'High Contrast Mode',
    description: 'Increase contrast for better visibility',
    status: 'partial',
    category: 'accessibility',
    enabled: true,
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    description: 'Minimize animations for accessibility',
    status: 'implemented',
    category: 'accessibility',
    enabled: true,
  },
  {
    id: 'font-scaling',
    name: 'Font Scaling',
    description: 'Adjust text size for readability',
    status: 'implemented',
    category: 'accessibility',
    enabled: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Combined Feature List
// ─────────────────────────────────────────────────────────────────────────────

export const allSlackFeatures: SlackFeature[] = [
  ...channelFeatures,
  ...dmFeatures,
  ...messagingFeatures,
  ...threadFeatures,
  ...searchFeatures,
  ...fileFeatures,
  ...appFeatures,
  ...callFeatures,
  ...workflowFeatures,
  ...adminFeatures,
  ...notificationFeatures,
  ...accessibilityFeatures,
]

// ─────────────────────────────────────────────────────────────────────────────
// Feature Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getFeaturesByCategory(category: FeatureCategory): SlackFeature[] {
  return allSlackFeatures.filter((f) => f.category === category)
}

export function getFeaturesByStatus(status: FeatureStatus): SlackFeature[] {
  return allSlackFeatures.filter((f) => f.status === status)
}

export function getEnabledFeatures(): SlackFeature[] {
  return allSlackFeatures.filter((f) => f.enabled)
}

export function getPremiumFeatures(): SlackFeature[] {
  return allSlackFeatures.filter((f) => f.premium)
}

export function getBetaFeatures(): SlackFeature[] {
  return allSlackFeatures.filter((f) => f.beta)
}

export function getFeatureById(id: string): SlackFeature | undefined {
  return allSlackFeatures.find((f) => f.id === id)
}

export function isFeatureEnabled(id: string): boolean {
  const feature = getFeatureById(id)
  return feature?.enabled ?? false
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Statistics
// ─────────────────────────────────────────────────────────────────────────────

export const featureStats = {
  total: allSlackFeatures.length,
  implemented: allSlackFeatures.filter((f) => f.status === 'implemented').length,
  partial: allSlackFeatures.filter((f) => f.status === 'partial').length,
  placeholder: allSlackFeatures.filter((f) => f.status === 'placeholder').length,
  planned: allSlackFeatures.filter((f) => f.status === 'planned').length,
  enabled: allSlackFeatures.filter((f) => f.enabled).length,
  premium: allSlackFeatures.filter((f) => f.premium).length,
  beta: allSlackFeatures.filter((f) => f.beta).length,
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard Shortcuts
// ─────────────────────────────────────────────────────────────────────────────

export const slackKeyboardShortcuts = {
  // Navigation
  quickSwitcher: { mac: 'Cmd+K', windows: 'Ctrl+K', description: 'Open quick switcher' },
  search: { mac: 'Cmd+G', windows: 'Ctrl+G', description: 'Search messages' },
  jumpToConversation: { mac: 'Cmd+Shift+K', windows: 'Ctrl+Shift+K', description: 'Open DM browser' },
  browseChannels: { mac: 'Cmd+Shift+L', windows: 'Ctrl+Shift+L', description: 'Browse channels' },
  threads: { mac: 'Cmd+Shift+T', windows: 'Ctrl+Shift+T', description: 'Open threads view' },
  activity: { mac: 'Cmd+Shift+M', windows: 'Ctrl+Shift+M', description: 'Open activity' },
  later: { mac: 'Cmd+Shift+S', windows: 'Ctrl+Shift+S', description: 'Open saved items' },
  previousChannel: { mac: 'Alt+Up', windows: 'Alt+Up', description: 'Previous channel' },
  nextChannel: { mac: 'Alt+Down', windows: 'Alt+Down', description: 'Next channel' },
  previousUnread: { mac: 'Alt+Shift+Up', windows: 'Alt+Shift+Up', description: 'Previous unread' },
  nextUnread: { mac: 'Alt+Shift+Down', windows: 'Alt+Shift+Down', description: 'Next unread' },

  // Messaging
  sendMessage: { mac: 'Enter', windows: 'Enter', description: 'Send message' },
  newLine: { mac: 'Shift+Enter', windows: 'Shift+Enter', description: 'New line' },
  bold: { mac: 'Cmd+B', windows: 'Ctrl+B', description: 'Bold text' },
  italic: { mac: 'Cmd+I', windows: 'Ctrl+I', description: 'Italic text' },
  strikethrough: { mac: 'Cmd+Shift+X', windows: 'Ctrl+Shift+X', description: 'Strikethrough' },
  code: { mac: 'Cmd+Shift+C', windows: 'Ctrl+Shift+C', description: 'Code format' },
  link: { mac: 'Cmd+Shift+U', windows: 'Ctrl+Shift+U', description: 'Create link' },
  emoji: { mac: 'Cmd+Shift+\\', windows: 'Ctrl+Shift+\\', description: 'Open emoji picker' },
  uploadFile: { mac: 'Cmd+U', windows: 'Ctrl+U', description: 'Upload file' },
  editLastMessage: { mac: 'Up', windows: 'Up', description: 'Edit last message' },

  // Actions
  markAsRead: { mac: 'Esc', windows: 'Esc', description: 'Mark channel as read' },
  markAllAsRead: { mac: 'Shift+Esc', windows: 'Shift+Esc', description: 'Mark all as read' },
  toggleSidebar: { mac: 'Cmd+.', windows: 'Ctrl+.', description: 'Toggle sidebar' },
  openPreferences: { mac: 'Cmd+,', windows: 'Ctrl+,', description: 'Open preferences' },
  shortcutsHelp: { mac: 'Cmd+/', windows: 'Ctrl+/', description: 'Show keyboard shortcuts' },
}

export default allSlackFeatures
