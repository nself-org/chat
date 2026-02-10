/**
 * Text utilities for formatting and manipulation
 */

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Convert string to title case
 */
export function titleCase(text: string): string {
  return text
    .split(' ')
    .map(word => capitalize(word.toLowerCase()))
    .join(' ')
}

/**
 * Slugify a string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Extract initials from a name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  if (!name) return ''

  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].slice(0, maxLength).toUpperCase()
  }

  return words
    .slice(0, maxLength)
    .map(word => word[0])
    .join('')
    .toUpperCase()
}

/**
 * Check if string contains only whitespace
 */
export function isWhitespace(text: string): boolean {
  return /^\s*$/.test(text)
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Word count
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Character count (excluding whitespace)
 */
export function charCount(text: string): number {
  return text.replace(/\s/g, '').length
}
