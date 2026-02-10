// ═══════════════════════════════════════════════════════════════════════════════
// nself Default Template Configuration
// ═══════════════════════════════════════════════════════════════════════════════
//
// The default nself template combines the best features of Slack, Discord, and
// Telegram into a modern, clean design with nself's signature cyan accent.
//
// ═══════════════════════════════════════════════════════════════════════════════

import type { PlatformTemplate } from '../types'

export const defaultTemplate: PlatformTemplate = {
  // ─────────────────────────────────────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────────────────────────────────────

  id: 'default',
  name: 'nself',
  description: 'Modern team communication combining the best of Slack, Discord, and Telegram',
  version: '1.0.0',
  author: 'nself',

  // ─────────────────────────────────────────────────────────────────────────────
  // Theme Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  theme: {
    defaultMode: 'dark',

    light: {
      // Primary colors
      primaryColor: '#00D4FF',
      secondaryColor: '#6366F1',
      accentColor: '#10B981',

      // Background colors
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F8FAFC',
      cardColor: '#FFFFFF',
      popoverColor: '#FFFFFF',

      // Text colors
      textColor: '#0F172A',
      textMutedColor: '#64748B',
      textInverseColor: '#FFFFFF',

      // Border colors
      borderColor: '#E2E8F0',
      borderMutedColor: '#F1F5F9',

      // Button colors
      buttonPrimaryBg: '#00D4FF',
      buttonPrimaryText: '#0F172A',
      buttonSecondaryBg: '#F1F5F9',
      buttonSecondaryText: '#0F172A',
      buttonGhostHover: '#F1F5F9',

      // Status colors
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6',

      // Special colors
      linkColor: '#00D4FF',
      focusRingColor: '#00D4FF',
      selectionBg: '#E0F7FA',
      highlightBg: '#FEF9C3',
    },

    dark: {
      // Primary colors
      primaryColor: '#00D4FF',
      secondaryColor: '#818CF8',
      accentColor: '#34D399',

      // Background colors
      backgroundColor: '#0A0A0F',
      surfaceColor: '#12121A',
      cardColor: '#1A1A24',
      popoverColor: '#1A1A24',

      // Text colors
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      textInverseColor: '#0F172A',

      // Border colors
      borderColor: '#1E293B',
      borderMutedColor: '#0F172A',

      // Button colors
      buttonPrimaryBg: '#00D4FF',
      buttonPrimaryText: '#0A0A0F',
      buttonSecondaryBg: '#1E293B',
      buttonSecondaryText: '#F8FAFC',
      buttonGhostHover: '#1E293B',

      // Status colors
      successColor: '#34D399',
      warningColor: '#FBBF24',
      errorColor: '#F87171',
      infoColor: '#60A5FA',

      // Special colors
      linkColor: '#00D4FF',
      focusRingColor: '#00D4FF',
      selectionBg: '#0E7490',
      highlightBg: '#854D0E',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Layout Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  layout: {
    // Sidebar
    sidebarPosition: 'left',
    sidebarWidth: 260,
    sidebarCollapsible: true,
    sidebarCollapsedWidth: 72,

    // Header
    headerHeight: 48,
    showHeaderBorder: true,

    // Messages
    messageDensity: 'comfortable',
    messageGrouping: true,
    messageGroupingTimeout: 5, // 5 minutes

    // Avatars
    avatarStyle: 'circle',
    avatarSize: 'md',
    showAvatarInGroup: 'first',

    // Channels
    showChannelIcons: true,
    showChannelDescription: false,
    showMemberCount: true,
    channelListDensity: 'comfortable',

    // Users
    showUserStatus: true,
    showPresenceDots: true,
    presenceDotPosition: 'bottom-right',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Feature Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  features: {
    // Threads
    threads: true,
    threadStyle: 'panel',
    threadPanelWidth: 400,

    // Reactions
    reactions: true,
    reactionStyle: 'inline',
    quickReactions: ['👍', '❤️', '😂', '🎉', '🤔', '👀'],
    maxReactionsDisplay: 5,

    // Rich content
    fileUploads: true,
    voiceMessages: true,
    codeBlocks: true,
    markdown: true,
    linkPreviews: true,
    emojiPicker: 'custom',
    gifPicker: true,

    // Message actions
    messageActions: ['reply', 'react', 'thread', 'edit', 'delete', 'pin', 'bookmark', 'copy'],
    showActionsOnHover: true,

    // Real-time
    typing: true,
    typingIndicatorStyle: 'dots',
    presence: true,
    readReceipts: true,
    readReceiptStyle: 'checkmarks',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Terminology Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  terminology: {
    // Core concepts
    workspace: 'Workspace',
    workspacePlural: 'Workspaces',
    channel: 'Channel',
    channelPlural: 'Channels',
    directMessage: 'Direct Message',
    directMessagePlural: 'Direct Messages',
    directMessageShort: 'DM',
    thread: 'Thread',
    threadPlural: 'Threads',
    member: 'Member',
    memberPlural: 'Members',
    message: 'Message',
    messagePlural: 'Messages',
    reaction: 'Reaction',
    reactionPlural: 'Reactions',

    // Actions
    sendMessage: 'Send message',
    editMessage: 'Edit message',
    deleteMessage: 'Delete message',
    replyToThread: 'Reply in thread',
    createChannel: 'Create channel',
    joinChannel: 'Join channel',
    leaveChannel: 'Leave channel',

    // Placeholders
    messageInputPlaceholder: 'Message #{{channel}}',
    searchPlaceholder: 'Search messages, files, and people',
    newChannelPlaceholder: 'new-channel-name',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Animation Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  animations: {
    enableAnimations: true,
    reducedMotion: false,
    transitionDuration: 'normal',
    messageAppear: 'fade',
    sidebarTransition: 'slide',
    modalTransition: 'scale',
  },
}

export default defaultTemplate
