/**
 * Deep Links - Handle app deep links and universal links
 */

import { Linking, Platform } from 'react-native'
import { DEEP_LINK_SCHEME, DEEP_LINK_HOST } from '@shared/constants'

export interface DeepLinkRoute {
  screen: string
  params?: Record<string, string>
}

export type DeepLinkHandler = (route: DeepLinkRoute) => void

// Deep link patterns
const DEEP_LINK_PATTERNS = {
  // nchat://channel/123
  channel: /^\/channel\/([a-zA-Z0-9-]+)$/,
  // nchat://chat/user123
  chat: /^\/chat\/([a-zA-Z0-9-]+)$/,
  // nchat://profile/user123
  profile: /^\/profile\/([a-zA-Z0-9-]+)$/,
  // nchat://invite/abc123
  invite: /^\/invite\/([a-zA-Z0-9-]+)$/,
  // nchat://search?q=hello
  search: /^\/search/,
  // nchat://settings
  settings: /^\/settings$/,
}

/**
 * Parse a deep link URL into a route
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname

    // Channel link
    const channelMatch = path.match(DEEP_LINK_PATTERNS.channel)
    if (channelMatch) {
      return {
        screen: 'Channel',
        params: { channelId: channelMatch[1] },
      }
    }

    // Chat link
    const chatMatch = path.match(DEEP_LINK_PATTERNS.chat)
    if (chatMatch) {
      return {
        screen: 'Chat',
        params: { channelId: chatMatch[1] },
      }
    }

    // Profile link
    const profileMatch = path.match(DEEP_LINK_PATTERNS.profile)
    if (profileMatch) {
      return {
        screen: 'Profile',
        params: { userId: profileMatch[1] },
      }
    }

    // Invite link
    const inviteMatch = path.match(DEEP_LINK_PATTERNS.invite)
    if (inviteMatch) {
      return {
        screen: 'Invite',
        params: { code: inviteMatch[1] },
      }
    }

    // Search link
    if (DEEP_LINK_PATTERNS.search.test(path)) {
      const query = parsed.searchParams.get('q')
      return {
        screen: 'Search',
        params: query ? { query } : undefined,
      }
    }

    // Settings link
    if (DEEP_LINK_PATTERNS.settings.test(path)) {
      return { screen: 'Settings' }
    }

    return null
  } catch (error) {
    console.error('Failed to parse deep link:', error)
    return null
  }
}

/**
 * Get the initial URL that launched the app
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    return Linking.getInitialURL()
  } catch (error) {
    console.error('Failed to get initial deep link:', error)
    return null
  }
}

/**
 * Subscribe to deep link events
 */
export function subscribeToDeepLinks(handler: DeepLinkHandler): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const route = parseDeepLink(url)
    if (route) {
      handler(route)
    }
  })

  return () => subscription.remove()
}

/**
 * Build a deep link URL
 */
export function buildDeepLink(path: string, params?: Record<string, string>): string {
  let url = `${DEEP_LINK_SCHEME}://${DEEP_LINK_HOST}${path}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }
  return url
}

/**
 * Build a universal link URL
 */
export function buildUniversalLink(path: string, params?: Record<string, string>): string {
  let url = `https://nchat.nself.org${path}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }
  return url
}

/**
 * Build channel deep link
 */
export function buildChannelLink(channelId: string): string {
  return buildDeepLink(`/channel/${channelId}`)
}

/**
 * Build chat deep link
 */
export function buildChatLink(userId: string): string {
  return buildDeepLink(`/chat/${userId}`)
}

/**
 * Build profile deep link
 */
export function buildProfileLink(userId: string): string {
  return buildDeepLink(`/profile/${userId}`)
}

/**
 * Build invite deep link
 */
export function buildInviteLink(code: string): string {
  return buildUniversalLink(`/invite/${code}`)
}

/**
 * Check if URL can be opened
 */
export async function canOpenUrl(url: string): Promise<boolean> {
  try {
    return Linking.canOpenURL(url)
  } catch {
    return false
  }
}

/**
 * Open external URL
 */
export async function openUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await canOpenUrl(url)
    if (canOpen) {
      await Linking.openURL(url)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to open URL:', error)
    return false
  }
}

/**
 * Open app settings
 */
export async function openAppSettings(): Promise<void> {
  await Linking.openSettings()
}

/**
 * Open email app
 */
export async function openEmail(
  to: string,
  subject?: string,
  body?: string
): Promise<boolean> {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString()
  const url = `mailto:${to}${query ? `?${query}` : ''}`
  return openUrl(url)
}

/**
 * Open phone dialer
 */
export async function openPhone(number: string): Promise<boolean> {
  return openUrl(`tel:${number}`)
}

/**
 * Open SMS app
 */
export async function openSms(number: string, body?: string): Promise<boolean> {
  const url = Platform.select({
    ios: `sms:${number}${body ? `&body=${encodeURIComponent(body)}` : ''}`,
    android: `sms:${number}${body ? `?body=${encodeURIComponent(body)}` : ''}`,
    default: `sms:${number}`,
  })
  return openUrl(url)
}
