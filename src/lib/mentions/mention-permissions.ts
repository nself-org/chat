/**
 * Mention Permissions - Permission checking for mention features
 *
 * Provides utilities for:
 * - Checking who can use @everyone, @here, @channel
 * - Role-based permission checks
 * - Channel-specific mention settings
 *
 * @example
 * ```typescript
 * import { canUseMention, getMentionPermissions } from '@/lib/mentions/mention-permissions'
 *
 * if (canUseMention('everyone', userRole, channelSettings)) {
 *   // Allow @everyone mention
 * }
 * ```
 */

import type {
  MentionType,
  MentionPermissions,
  ChannelMentionSettings,
} from './mention-types'
import {
  DEFAULT_MENTION_PERMISSIONS,
  DEFAULT_CHANNEL_MENTION_SETTINGS,
} from './mention-types'

// ============================================================================
// Types
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest'

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 100,
  admin: 80,
  moderator: 60,
  member: 40,
  guest: 20,
}

/**
 * Context for permission checks
 */
export interface PermissionContext {
  /** Current user's role */
  userRole: UserRole
  /** User's role in the specific channel (may differ from global role) */
  channelRole?: UserRole
  /** Whether user is the channel creator */
  isChannelCreator?: boolean
  /** Whether user is the workspace owner */
  isWorkspaceOwner?: boolean
  /** Channel-specific mention settings */
  channelSettings?: ChannelMentionSettings
  /** Whether the channel is a DM */
  isDirectMessage?: boolean
  /** Whether the channel is archived */
  isArchived?: boolean
}

// ============================================================================
// Role Hierarchy Helpers
// ============================================================================

/**
 * Check if a role meets or exceeds a minimum role requirement
 */
export function roleAtLeast(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Get the effective role (highest of global and channel role)
 */
export function getEffectiveRole(
  globalRole: UserRole,
  channelRole?: UserRole
): UserRole {
  if (!channelRole) return globalRole
  return ROLE_HIERARCHY[globalRole] >= ROLE_HIERARCHY[channelRole]
    ? globalRole
    : channelRole
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  return roleAtLeast(role, 'admin')
}

/**
 * Check if user has moderator privileges
 */
export function isModerator(role: UserRole): boolean {
  return roleAtLeast(role, 'moderator')
}

// ============================================================================
// Mention Permission Checks
// ============================================================================

/**
 * Check if a user can use a specific mention type
 */
export function canUseMention(
  mentionType: MentionType,
  context: PermissionContext
): boolean {
  const {
    userRole,
    channelRole,
    isChannelCreator = false,
    isWorkspaceOwner = false,
    channelSettings = DEFAULT_CHANNEL_MENTION_SETTINGS,
    isDirectMessage = false,
    isArchived = false,
  } = context

  // Can't mention in archived channels
  if (isArchived) {
    return false
  }

  // Get effective role
  const effectiveRole = getEffectiveRole(userRole, channelRole)

  // Workspace owner can do anything
  if (isWorkspaceOwner) {
    return true
  }

  switch (mentionType) {
    case 'user':
      // Everyone can mention users
      return true

    case 'channel':
      // Everyone can link to channels
      return true

    case 'everyone':
      // Check if @everyone is allowed in this channel
      if (!channelSettings.allowEveryone) {
        return false
      }
      // Check role requirement
      return roleAtLeast(effectiveRole, channelSettings.everyoneMinRole)

    case 'here':
      // Check if @here is allowed in this channel
      if (!channelSettings.allowHere) {
        return false
      }
      // In DMs, @here is always allowed
      if (isDirectMessage) {
        return true
      }
      // Check role requirement
      return roleAtLeast(effectiveRole, channelSettings.hereMinRole)

    case 'role':
      // Role mentions require moderator or higher by default
      return isModerator(effectiveRole)

    default:
      return false
  }
}

/**
 * Get all mention permissions for a user in a context
 */
export function getMentionPermissions(
  context: PermissionContext
): MentionPermissions {
  return {
    canMentionUsers: canUseMention('user', context),
    canMentionChannels: canUseMention('channel', context),
    canMentionEveryone: canUseMention('everyone', context),
    canMentionHere: canUseMention('here', context),
    canMentionChannel: canUseMention('channel', context),
    canMentionRoles: canUseMention('role', context),
  }
}

/**
 * Check if user can use any group mention
 */
export function canUseAnyGroupMention(context: PermissionContext): boolean {
  return (
    canUseMention('everyone', context) ||
    canUseMention('here', context)
  )
}

// ============================================================================
// Channel Settings Helpers
// ============================================================================

/**
 * Merge channel settings with defaults
 */
export function mergeChannelSettings(
  settings?: Partial<ChannelMentionSettings>
): ChannelMentionSettings {
  return {
    ...DEFAULT_CHANNEL_MENTION_SETTINGS,
    ...settings,
  }
}

/**
 * Check if channel allows any group mentions
 */
export function channelAllowsGroupMentions(
  settings: ChannelMentionSettings = DEFAULT_CHANNEL_MENTION_SETTINGS
): boolean {
  return (
    settings.allowEveryone ||
    settings.allowHere ||
    settings.allowChannel
  )
}

/**
 * Get the minimum role needed for any group mention in a channel
 */
export function getMinRoleForGroupMentions(
  settings: ChannelMentionSettings = DEFAULT_CHANNEL_MENTION_SETTINGS
): UserRole {
  const roles: UserRole[] = []

  if (settings.allowEveryone) {
    roles.push(settings.everyoneMinRole)
  }
  if (settings.allowHere) {
    roles.push(settings.hereMinRole)
  }
  if (settings.allowChannel) {
    roles.push(settings.channelMinRole)
  }

  if (roles.length === 0) {
    return 'owner' // No group mentions allowed
  }

  // Return the lowest required role (most permissive)
  return roles.reduce((lowest, role) =>
    ROLE_HIERARCHY[role] < ROLE_HIERARCHY[lowest] ? role : lowest
  )
}

// ============================================================================
// Permission Validation
// ============================================================================

/**
 * Validate mentions before sending a message
 */
export interface MentionValidationResult {
  valid: boolean
  errors: MentionValidationError[]
  warnings: MentionValidationWarning[]
}

export interface MentionValidationError {
  type: MentionType
  message: string
  identifier: string
}

export interface MentionValidationWarning {
  type: MentionType
  message: string
  identifier: string
}

/**
 * Validate that user can use the mentions in their message
 */
export function validateMentions(
  mentionTypes: Array<{ type: MentionType; identifier: string }>,
  context: PermissionContext
): MentionValidationResult {
  const errors: MentionValidationError[] = []
  const warnings: MentionValidationWarning[] = []

  for (const { type, identifier } of mentionTypes) {
    if (!canUseMention(type, context)) {
      if (type === 'everyone') {
        errors.push({
          type,
          identifier,
          message: 'You do not have permission to use @everyone in this channel',
        })
      } else if (type === 'here') {
        errors.push({
          type,
          identifier,
          message: 'You do not have permission to use @here in this channel',
        })
      } else if (type === 'role') {
        errors.push({
          type,
          identifier,
          message: `You do not have permission to mention @${identifier}`,
        })
      }
    }
  }

  // Add warnings for large group mentions
  const everyoneMention = mentionTypes.find((m) => m.type === 'everyone')
  if (everyoneMention && !errors.some((e) => e.type === 'everyone')) {
    warnings.push({
      type: 'everyone',
      identifier: 'everyone',
      message: 'This will notify all members in the workspace',
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitState {
  count: number
  windowStart: number
}

const mentionRateLimits = new Map<string, RateLimitState>()

/**
 * Rate limit configuration for group mentions
 */
export const GROUP_MENTION_RATE_LIMIT = {
  maxMentions: 5, // Max group mentions
  windowMs: 60 * 1000, // Per minute
}

/**
 * Check if a user is rate limited for group mentions
 */
export function isRateLimitedForGroupMentions(userId: string): boolean {
  const now = Date.now()
  const state = mentionRateLimits.get(userId)

  if (!state) {
    return false
  }

  // Reset if window has passed
  if (now - state.windowStart > GROUP_MENTION_RATE_LIMIT.windowMs) {
    mentionRateLimits.delete(userId)
    return false
  }

  return state.count >= GROUP_MENTION_RATE_LIMIT.maxMentions
}

/**
 * Record a group mention for rate limiting
 */
export function recordGroupMention(userId: string): void {
  const now = Date.now()
  const state = mentionRateLimits.get(userId)

  if (!state || now - state.windowStart > GROUP_MENTION_RATE_LIMIT.windowMs) {
    mentionRateLimits.set(userId, { count: 1, windowStart: now })
  } else {
    state.count++
  }
}

/**
 * Get remaining group mentions for a user
 */
export function getRemainingGroupMentions(userId: string): number {
  const now = Date.now()
  const state = mentionRateLimits.get(userId)

  if (!state || now - state.windowStart > GROUP_MENTION_RATE_LIMIT.windowMs) {
    return GROUP_MENTION_RATE_LIMIT.maxMentions
  }

  return Math.max(0, GROUP_MENTION_RATE_LIMIT.maxMentions - state.count)
}

// ============================================================================
// Permission Display Helpers
// ============================================================================

/**
 * Get human-readable permission message
 */
export function getPermissionMessage(
  mentionType: MentionType,
  allowed: boolean,
  context: PermissionContext
): string {
  const { channelSettings = DEFAULT_CHANNEL_MENTION_SETTINGS } = context

  if (allowed) {
    return `You can use @${mentionType} in this channel`
  }

  switch (mentionType) {
    case 'everyone':
      if (!channelSettings.allowEveryone) {
        return '@everyone is disabled in this channel'
      }
      return `Only ${channelSettings.everyoneMinRole}s and above can use @everyone`

    case 'here':
      if (!channelSettings.allowHere) {
        return '@here is disabled in this channel'
      }
      return `Only ${channelSettings.hereMinRole}s and above can use @here`

    case 'role':
      return 'Only moderators and above can mention roles'

    default:
      return `You cannot use @${mentionType} in this channel`
  }
}

/**
 * Get tooltip content for mention permission
 */
export function getMentionPermissionTooltip(
  mentionType: MentionType,
  context: PermissionContext
): string {
  const allowed = canUseMention(mentionType, context)
  return getPermissionMessage(mentionType, allowed, context)
}
