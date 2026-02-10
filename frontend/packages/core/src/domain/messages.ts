/**
 * Message domain logic
 */

/**
 * Check if a message can be edited
 * Messages can be edited within 15 minutes of creation
 */
export function canEditMessage(createdAt: Date, editedAt?: Date): boolean {
  const now = new Date()
  const fifteenMinutes = 15 * 60 * 1000
  const timeSinceCreation = now.getTime() - createdAt.getTime()

  return timeSinceCreation < fifteenMinutes
}

/**
 * Check if a message can be deleted
 * Messages can be deleted within 1 hour of creation
 */
export function canDeleteMessage(createdAt: Date): boolean {
  const now = new Date()
  const oneHour = 60 * 60 * 1000
  const timeSinceCreation = now.getTime() - createdAt.getTime()

  return timeSinceCreation < oneHour
}

/**
 * Extract mentions from message content
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1])
  }

  return [...new Set(mentions)] // Remove duplicates
}

/**
 * Extract hashtags from message content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g
  const hashtags: string[] = []
  let match

  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1])
  }

  return [...new Set(hashtags)]
}

/**
 * Check if message content contains a mention
 */
export function hasMention(content: string, username: string): boolean {
  return content.includes(`@${username}`)
}

/**
 * Format message for display (basic sanitization)
 */
export function formatMessage(content: string): string {
  return content.trim()
}

/**
 * Calculate message reading time (in seconds)
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  const minutes = words / wordsPerMinute
  return Math.ceil(minutes * 60)
}
