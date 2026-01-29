/**
 * Share - Native sharing functionality
 */

import { Share, Platform } from 'react-native'
import * as Sharing from 'expo-sharing'

export interface ShareContent {
  title?: string
  message?: string
  url?: string
}

export interface ShareFileOptions {
  mimeType?: string
  dialogTitle?: string
  UTI?: string // iOS only
}

/**
 * Share text content
 */
export async function shareText(content: ShareContent): Promise<boolean> {
  try {
    const result = await Share.share(
      {
        title: content.title,
        message: content.message,
        url: Platform.OS === 'ios' ? content.url : undefined,
      },
      {
        dialogTitle: content.title,
      }
    )

    return result.action === Share.sharedAction
  } catch (error) {
    console.error('Failed to share text:', error)
    return false
  }
}

/**
 * Share a URL
 */
export async function shareUrl(
  url: string,
  title?: string,
  message?: string
): Promise<boolean> {
  return shareText({
    url,
    title,
    message: Platform.OS === 'android' ? `${message || ''} ${url}`.trim() : message,
  })
}

/**
 * Check if sharing files is available
 */
export async function isFileSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync()
}

/**
 * Share a file
 */
export async function shareFile(
  uri: string,
  options?: ShareFileOptions
): Promise<void> {
  const isAvailable = await isFileSharingAvailable()
  if (!isAvailable) {
    throw new Error('File sharing is not available on this device')
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: options?.mimeType,
      dialogTitle: options?.dialogTitle,
      UTI: options?.UTI,
    })
  } catch (error) {
    console.error('Failed to share file:', error)
    throw error
  }
}

/**
 * Share an image
 */
export async function shareImage(
  uri: string,
  title?: string
): Promise<void> {
  return shareFile(uri, {
    mimeType: 'image/*',
    dialogTitle: title || 'Share Image',
  })
}

/**
 * Share a video
 */
export async function shareVideo(
  uri: string,
  title?: string
): Promise<void> {
  return shareFile(uri, {
    mimeType: 'video/*',
    dialogTitle: title || 'Share Video',
  })
}

/**
 * Share multiple items (message + file)
 */
export async function shareMultiple(
  content: ShareContent,
  fileUri?: string
): Promise<boolean> {
  // On iOS, we can share both at once
  // On Android, we typically need to choose one
  if (fileUri && Platform.OS === 'ios') {
    await shareFile(fileUri, {
      dialogTitle: content.title,
    })
    return true
  }

  // Share text content
  return shareText(content)
}

/**
 * Copy text to clipboard (as an alternative to sharing)
 */
export async function copyToClipboard(text: string): Promise<void> {
  const Clipboard = require('@react-native-clipboard/clipboard').default
  Clipboard.setString(text)
}

/**
 * Get text from clipboard
 */
export async function getFromClipboard(): Promise<string> {
  const Clipboard = require('@react-native-clipboard/clipboard').default
  return Clipboard.getString()
}

/**
 * Check if clipboard has content
 */
export async function hasClipboardContent(): Promise<boolean> {
  const Clipboard = require('@react-native-clipboard/clipboard').default
  return Clipboard.hasString()
}

/**
 * Share app invite
 */
export async function shareAppInvite(inviteCode?: string): Promise<boolean> {
  const appStoreUrl = Platform.select({
    ios: 'https://apps.apple.com/app/nchat/id123456789',
    android: 'https://play.google.com/store/apps/details?id=org.nself.nchat',
    default: 'https://nchat.nself.org',
  })

  const message = inviteCode
    ? `Join me on nChat! Use my invite code: ${inviteCode}`
    : `Join me on nChat!`

  return shareUrl(appStoreUrl, 'Join nChat', message)
}

/**
 * Share channel invite link
 */
export async function shareChannelInvite(
  channelName: string,
  inviteLink: string
): Promise<boolean> {
  return shareUrl(
    inviteLink,
    `Join #${channelName}`,
    `Join the #${channelName} channel on nChat`
  )
}
