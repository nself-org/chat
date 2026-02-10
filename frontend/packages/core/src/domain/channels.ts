/**
 * Channel domain logic
 */

export type ChannelType = 'public' | 'private' | 'direct'

/**
 * Check if a channel name is valid
 */
export function isValidChannelName(name: string): boolean {
  // Channel names must be 1-100 characters
  if (name.length < 1 || name.length > 100) return false

  // For public/private channels, validate format
  // Direct channels can have any name
  const channelNameRegex = /^[a-zA-Z0-9-_\s]+$/
  return channelNameRegex.test(name)
}

/**
 * Format channel name for display
 */
export function formatChannelName(name: string, type: ChannelType): string {
  if (type === 'direct') return name
  if (type === 'private') return `🔒 ${name}`
  return `# ${name}`
}

/**
 * Check if user can access channel based on type
 */
export function canAccessChannel(
  channelType: ChannelType,
  isMember: boolean
): boolean {
  if (channelType === 'public') return true
  return isMember
}

/**
 * Generate channel slug from name
 */
export function generateChannelSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Check if channel is direct message
 */
export function isDirectMessage(type: ChannelType): boolean {
  return type === 'direct'
}

/**
 * Get channel display icon
 */
export function getChannelIcon(type: ChannelType): string {
  switch (type) {
    case 'public':
      return '#'
    case 'private':
      return '🔒'
    case 'direct':
      return '💬'
    default:
      return '#'
  }
}
