/**
 * Mobile-specific type definitions for nself-chat
 */

import { Photo } from '@capacitor/camera'
import { PushNotificationSchema } from '@capacitor/push-notifications'

/**
 * Mobile navigation routes
 */
export type MobileRoute =
  | 'home'
  | 'chat'
  | 'channels'
  | 'profile'
  | 'settings'
  | 'login'
  | 'signup'

/**
 * Navigation params for each route
 */
export interface MobileRouteParams {
  home: undefined
  chat: { channelId: string }
  channels: undefined
  profile: { userId?: string }
  settings: undefined
  login: undefined
  signup: undefined
}

/**
 * Mobile screen props
 */
export interface MobileScreenProps<T extends MobileRoute> {
  route: T
  params: MobileRouteParams[T]
  navigation: MobileNavigation
}

/**
 * Mobile navigation interface
 */
export interface MobileNavigation {
  navigate<T extends MobileRoute>(route: T, params?: MobileRouteParams[T]): void
  goBack(): void
  canGoBack(): boolean
}

/**
 * Platform-specific config
 */
export interface PlatformConfig {
  platform: 'ios' | 'android'
  version: string
  build: string
}

/**
 * Mobile app state
 */
export interface MobileAppState {
  isActive: boolean
  isBackground: boolean
  networkConnected: boolean
  pushToken: string | null
  biometricAvailable: boolean
}

/**
 * Mobile attachment (photo/file)
 */
export interface MobileAttachment {
  id: string
  type: 'photo' | 'video' | 'file'
  source: Photo | File
  preview?: string
  size?: number
  name?: string
}

/**
 * Mobile notification payload
 */
export interface MobileNotificationPayload {
  notification: PushNotificationSchema
  channelId?: string
  messageId?: string
  userId?: string
  type: 'message' | 'mention' | 'reaction' | 'system'
}

/**
 * Haptic feedback types
 */
export type HapticFeedback =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'

/**
 * Mobile offline queue item
 */
export interface OfflineQueueItem {
  id: string
  type: 'message' | 'reaction' | 'upload'
  payload: unknown
  timestamp: number
  retries: number
  maxRetries: number
}
