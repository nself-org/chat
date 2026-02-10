/**
 * Comprehensive Feature Flags Configuration
 *
 * This file defines all feature flags available in the nself-chat application
 * using a category-based structure. Feature flags allow granular control over
 * every feature, enabling white-label customization and progressive feature rollout.
 *
 * @example
 * ```typescript
 * import { FEATURE_FLAGS } from '@/config/feature-flags'
 *
 * if (FEATURE_FLAGS.messaging.threads) {
 *   // Show thread UI
 * }
 * ```
 */

export const FEATURE_FLAGS = {
  // ============================================================================
  // MESSAGING FEATURES
  // ============================================================================
  messaging: {
    /** Master switch for messaging functionality */
    enabled: true,
    /** Enable threaded replies on messages */
    threads: true,
    /** Enable emoji reactions on messages */
    reactions: true,
    /** Enable reply functionality */
    replies: true,
    /** Allow users to edit their own messages */
    editing: true,
    /** Allow users to delete their own messages */
    deletion: true,
    /** Allow forwarding messages to other channels/users */
    forwarding: true,
    /** Enable scheduled message sending */
    scheduling: false,
    /** Enable disappearing/ephemeral messages */
    disappearing: false,
  },

  // ============================================================================
  // VOICE FEATURES
  // ============================================================================
  voice: {
    /** Master switch for voice functionality */
    enabled: false,
    /** Enable voice calls */
    calls: false,
    /** Enable voice message recording and playback */
    voiceMessages: false,
    /** Enable voice channels (persistent audio rooms) */
    voiceChannels: false,
  },

  // ============================================================================
  // VIDEO FEATURES
  // ============================================================================
  video: {
    /** Master switch for video functionality */
    enabled: false,
    /** Enable video calls */
    calls: false,
    /** Enable screen sharing during calls */
    screenShare: false,
  },

  // ============================================================================
  // CHANNEL FEATURES
  // ============================================================================
  channels: {
    /** Enable public channels visible to all members */
    public: true,
    /** Enable private/invite-only channels */
    private: true,
    /** Enable direct messages between two users */
    directMessages: true,
    /** Enable group direct messages (3+ users) */
    groupDms: true,
    /** Enable channel organization into categories */
    categories: true,
    /** Enable threaded conversations in channels */
    threads: true,
  },

  // ============================================================================
  // MEDIA FEATURES
  // ============================================================================
  media: {
    /** Enable file uploading */
    fileUploads: true,
    /** Enable image uploads and inline display */
    imageUploads: true,
    /** Enable video file uploads */
    videoUploads: true,
    /** Maximum file size in MB */
    maxFileSize: 25,
    /** Allowed MIME types for file uploads */
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'] as string[],
  },

  // ============================================================================
  // SECURITY FEATURES
  // ============================================================================
  security: {
    /** Enable end-to-end encryption */
    e2eEncryption: false,
    /** Enable biometric authentication lock */
    biometricLock: false,
    /** Enable PIN code lock */
    pinLock: false,
    /** Enable two-factor authentication */
    twoFactor: true,
    /** Enable session management (view/revoke sessions) */
    sessionManagement: true,
  },

  // ============================================================================
  // INTEGRATION FEATURES
  // ============================================================================
  integrations: {
    /** Enable incoming/outgoing webhooks */
    webhooks: true,
    /** Enable bot accounts */
    bots: true,
    /** Enable importing data from Slack */
    slackImport: false,
    /** Enable external app integrations */
    externalApps: false,
  },

  // ============================================================================
  // PAYMENT FEATURES
  // ============================================================================
  payments: {
    /** Master switch for payment functionality */
    enabled: false,
    /** Enable subscription management */
    subscriptions: false,
    /** Enable cryptocurrency payments */
    crypto: false,
    /** Enable token-gated access to channels/features */
    tokenGating: false,
  },

  // ============================================================================
  // ADMIN FEATURES
  // ============================================================================
  admin: {
    /** Enable admin dashboard access */
    dashboard: true,
    /** Enable analytics viewing */
    analytics: false,
    /** Enable audit log viewing */
    auditLog: true,
    /** Enable user management */
    userManagement: true,
    /** Enable role management */
    roleManagement: true,
  },
} as const

/**
 * Type representing the complete feature flags object
 */
export type FeatureFlags = typeof FEATURE_FLAGS

/**
 * Type representing the categories available in feature flags
 */
export type FeatureCategory = keyof FeatureFlags

/**
 * Type helper to get the features within a specific category
 */
export type FeaturesInCategory<C extends FeatureCategory> = keyof FeatureFlags[C]

/**
 * Type for a feature path (e.g., 'messaging.threads')
 */
export type FeaturePath = {
  [C in FeatureCategory]: `${C}.${string & keyof FeatureFlags[C]}`
}[FeatureCategory]

/**
 * Default feature flag values (same as FEATURE_FLAGS but mutable for overrides)
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = { ...FEATURE_FLAGS }

/**
 * Get all categories from feature flags
 */
export function getFeatureCategories(): FeatureCategory[] {
  return Object.keys(FEATURE_FLAGS) as FeatureCategory[]
}

/**
 * Get all feature keys within a category
 */
export function getFeaturesInCategory<C extends FeatureCategory>(
  category: C
): (keyof FeatureFlags[C])[] {
  return Object.keys(FEATURE_FLAGS[category]) as (keyof FeatureFlags[C])[]
}

/**
 * Check if a category has an 'enabled' property
 */
export function categoryHasEnabledSwitch(category: FeatureCategory): boolean {
  return 'enabled' in FEATURE_FLAGS[category]
}
