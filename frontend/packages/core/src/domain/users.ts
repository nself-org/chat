/**
 * User domain logic
 */

import type { Role } from '../constants/roles'

/**
 * Check if username is valid
 */
export function isValidUsername(username: string): boolean {
  // Username must be 3-30 characters, alphanumeric with underscores/hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Check if email is valid (basic check)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format user display name
 */
export function formatUserDisplayName(
  displayName: string,
  username: string
): string {
  return displayName || username
}

/**
 * Get user initials from display name
 */
export function getUserInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Check if user is online based on last seen
 */
export function isUserOnline(lastSeenAt: Date | null): boolean {
  if (!lastSeenAt) return false

  const now = new Date()
  const fiveMinutes = 5 * 60 * 1000
  const timeSinceLastSeen = now.getTime() - lastSeenAt.getTime()

  return timeSinceLastSeen < fiveMinutes
}

/**
 * Get user presence status
 */
export function getUserPresenceStatus(
  lastSeenAt: Date | null
): 'online' | 'away' | 'offline' {
  if (!lastSeenAt) return 'offline'

  const now = new Date()
  const fiveMinutes = 5 * 60 * 1000
  const thirtyMinutes = 30 * 60 * 1000
  const timeSinceLastSeen = now.getTime() - lastSeenAt.getTime()

  if (timeSinceLastSeen < fiveMinutes) return 'online'
  if (timeSinceLastSeen < thirtyMinutes) return 'away'
  return 'offline'
}

/**
 * Format last seen time
 */
export function formatLastSeen(lastSeenAt: Date): string {
  const now = new Date()
  const diff = now.getTime() - lastSeenAt.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return lastSeenAt.toLocaleDateString()
}

/**
 * Get role color for display
 */
export function getRoleColor(role: Role): string {
  switch (role) {
    case 'owner':
      return '#FF0000'
    case 'admin':
      return '#FFA500'
    case 'moderator':
      return '#FFD700'
    case 'member':
      return '#808080'
    case 'guest':
      return '#C0C0C0'
    default:
      return '#808080'
  }
}

/**
 * Get role badge text
 */
export function getRoleBadge(role: Role): string {
  switch (role) {
    case 'owner':
      return '👑'
    case 'admin':
      return '⭐'
    case 'moderator':
      return '🛡️'
    case 'member':
      return ''
    case 'guest':
      return '👤'
    default:
      return ''
  }
}
