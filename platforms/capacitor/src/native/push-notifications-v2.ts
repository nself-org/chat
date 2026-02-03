/**
 * Enhanced Push Notifications Integration for Capacitor v2
 *
 * Advanced push notification handling with:
 * - Rich notifications (images, actions, categories)
 * - Notification channels (Android 8.0+)
 * - Silent push for background sync
 * - VoIP push (iOS)
 * - Notification grouping
 * - Scheduled notifications
 */

import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
  DeliveredNotifications,
} from '@capacitor/push-notifications'
import {
  LocalNotifications,
  LocalNotificationSchema,
  ScheduleOptions,
} from '@capacitor/local-notifications'
import { Capacitor, PluginListenerHandle } from '@capacitor/core'

// =============================================================================
// Types
// =============================================================================

export interface NotificationChannel {
  id: string
  name: string
  description?: string
  importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max'
  visibility?: 'public' | 'private' | 'secret'
  sound?: string
  vibration?: boolean
  lights?: boolean
  lightColor?: string
}

export interface RichNotificationPayload {
  id: string
  title: string
  body: string
  subtitle?: string
  /** Large image URL */
  imageUrl?: string
  /** Thumbnail/badge image */
  thumbnailUrl?: string
  /** Android channel ID */
  channelId?: string
  /** iOS category identifier */
  categoryId?: string
  /** Notification group ID */
  groupId?: string
  /** Group summary (for first notification in group) */
  groupSummary?: string
  /** Action buttons */
  actions?: NotificationAction[]
  /** Deep link URL */
  deepLink?: string
  /** Custom data payload */
  data?: Record<string, unknown>
  /** Badge count */
  badge?: number
  /** Silent notification (for background sync) */
  silent?: boolean
  /** Priority level */
  priority?: 'min' | 'low' | 'default' | 'high' | 'max'
  /** Expiration timestamp */
  expiresAt?: number
}

export interface NotificationAction {
  id: string
  title: string
  /** Require device unlock */
  requiresAuthentication?: boolean
  /** Destructive action (iOS - red text) */
  destructive?: boolean
  /** Text input action */
  input?: boolean
  /** Input placeholder */
  inputPlaceholder?: string
}

export interface NotificationCategory {
  id: string
  actions: NotificationAction[]
}

export interface VoIPPushPayload {
  callId: string
  callerName: string
  callerAvatar?: string
  hasVideo: boolean
  timestamp: number
}

export interface NotificationStats {
  totalReceived: number
  totalDisplayed: number
  totalTapped: number
  totalDismissed: number
  byChannel: Record<string, number>
}

// =============================================================================
// Enhanced Push Notification Service
// =============================================================================

class EnhancedPushNotificationService {
  private token: string | null = null
  private voipToken: string | null = null
  private isRegistered = false
  private listeners: PluginListenerHandle[] = []
  private channels: Map<string, NotificationChannel> = new Map()
  private categories: Map<string, NotificationCategory> = new Map()
  private stats: NotificationStats = {
    totalReceived: 0,
    totalDisplayed: 0,
    totalTapped: 0,
    totalDismissed: 0,
    byChannel: {},
  }

  // Event handlers
  private onTokenReceived?: (token: string, isVoip: boolean) => void
  private onNotificationReceived?: (notification: RichNotificationPayload) => void
  private onNotificationTapped?: (notification: RichNotificationPayload, actionId?: string) => void
  private onNotificationDismissed?: (notificationId: string) => void
  private onVoIPPush?: (payload: VoIPPushPayload) => void
  private onSilentPush?: (data: Record<string, unknown>) => void

  /**
   * Initialize push notifications
   */
  async initialize(options?: {
    requestPermissionOnInit?: boolean
    channels?: NotificationChannel[]
    categories?: NotificationCategory[]
  }): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Push notifications require native platform')
      return false
    }

    try {
      // Set up channels (Android)
      if (options?.channels && Capacitor.getPlatform() === 'android') {
        await this.createNotificationChannels(options.channels)
      }

      // Set up categories (iOS)
      if (options?.categories && Capacitor.getPlatform() === 'ios') {
        await this.registerNotificationCategories(options.categories)
      }

      // Request permission if specified
      if (options?.requestPermissionOnInit !== false) {
        const hasPermission = await this.requestPermission()
        if (!hasPermission) {
          console.warn('Push notification permission denied')
          return false
        }
      }

      // Set up listeners
      await this.setupListeners()

      // Register with push service
      await PushNotifications.register()
      this.isRegistered = true

      console.log('Enhanced push notifications initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize push notifications:', error)
      return false
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await PushNotifications.requestPermissions()
      return permission.receive === 'granted'
    } catch (error) {
      console.error('Error requesting permission:', error)
      return false
    }
  }

  /**
   * Check notification permission
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      const permission = await PushNotifications.checkPermissions()
      return permission.receive as 'granted' | 'denied' | 'prompt'
    } catch (error) {
      console.error('Error checking permission:', error)
      return 'denied'
    }
  }

  /**
   * Create notification channels (Android 8.0+)
   */
  async createNotificationChannels(channels: NotificationChannel[]): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') return

    for (const channel of channels) {
      await LocalNotifications.createChannel({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        importance: this.getImportanceLevel(channel.importance),
        visibility: this.getVisibilityLevel(channel.visibility),
        sound: channel.sound,
        vibration: channel.vibration,
        lights: channel.lights,
        lightColor: channel.lightColor,
      })
      this.channels.set(channel.id, channel)
    }
  }

  /**
   * Register notification categories (iOS)
   */
  async registerNotificationCategories(categories: NotificationCategory[]): Promise<void> {
    if (Capacitor.getPlatform() !== 'ios') return

    // Note: This requires additional native code for iOS
    // Categories are typically registered in AppDelegate
    for (const category of categories) {
      this.categories.set(category.id, category)
    }
  }

  /**
   * Set up event listeners
   */
  private async setupListeners(): Promise<void> {
    // Registration success
    const regListener = await PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push token received:', token.value)
      this.token = token.value
      this.onTokenReceived?.(token.value, false)
    })
    this.listeners.push(regListener)

    // Registration error
    const regErrorListener = await PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error)
    })
    this.listeners.push(regErrorListener)

    // Notification received in foreground
    const receiveListener = await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this.stats.totalReceived++
        this.handleNotificationReceived(notification)
      }
    )
    this.listeners.push(receiveListener)

    // Notification action performed
    const actionListener = await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        this.stats.totalTapped++
        this.handleNotificationAction(action)
      }
    )
    this.listeners.push(actionListener)
  }

  /**
   * Handle received notification
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    const payload = this.convertToRichPayload(notification)

    // Check if silent push
    if (payload.silent || notification.data?.['content-available'] === '1') {
      this.onSilentPush?.(notification.data || {})
      return
    }

    // Track channel stats
    if (payload.channelId) {
      this.stats.byChannel[payload.channelId] = (this.stats.byChannel[payload.channelId] || 0) + 1
    }

    this.onNotificationReceived?.(payload)

    // Show local notification if in foreground
    this.showLocalNotification(payload)
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(action: ActionPerformed): void {
    const payload = this.convertToRichPayload(action.notification)
    const actionId = action.actionId === 'tap' ? undefined : action.actionId

    this.onNotificationTapped?.(payload, actionId)
  }

  /**
   * Convert push notification to rich payload
   */
  private convertToRichPayload(notification: PushNotificationSchema): RichNotificationPayload {
    const data = notification.data || {}

    return {
      id: notification.id || Date.now().toString(),
      title: notification.title || 'Notification',
      body: notification.body || '',
      subtitle: data['subtitle'] as string | undefined,
      imageUrl: data['imageUrl'] as string | undefined,
      thumbnailUrl: data['thumbnailUrl'] as string | undefined,
      channelId: data['channelId'] as string | undefined,
      categoryId: data['categoryId'] as string | undefined,
      groupId: data['groupId'] as string | undefined,
      deepLink: data['deepLink'] as string | undefined,
      data: data,
      badge: data['badge'] as number | undefined,
      silent: data['silent'] === true || data['content-available'] === '1',
      priority: data['priority'] as RichNotificationPayload['priority'] | undefined,
    }
  }

  /**
   * Show local notification (for foreground)
   */
  async showLocalNotification(payload: RichNotificationPayload): Promise<void> {
    const notification: LocalNotificationSchema = {
      id: parseInt(payload.id) || Date.now(),
      title: payload.title,
      body: payload.body,
      sound: 'notification.wav',
      extra: payload.data,
      channelId: payload.channelId,
      group: payload.groupId,
      groupSummary: payload.groupId ? payload.groupSummary : undefined,
    }

    // Add attachments for images
    if (payload.imageUrl) {
      notification.attachments = [
        {
          id: 'image',
          url: payload.imageUrl,
        },
      ]
    }

    // Add action types for iOS
    if (payload.categoryId) {
      notification.actionTypeId = payload.categoryId
    }

    await LocalNotifications.schedule({ notifications: [notification] })
    this.stats.totalDisplayed++
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(payload: RichNotificationPayload, scheduleAt: Date): Promise<void> {
    const notification: LocalNotificationSchema = {
      id: parseInt(payload.id) || Date.now(),
      title: payload.title,
      body: payload.body,
      schedule: { at: scheduleAt },
      sound: 'notification.wav',
      extra: payload.data,
      channelId: payload.channelId,
    }

    await LocalNotifications.schedule({ notifications: [notification] })
  }

  /**
   * Cancel scheduled notification
   */
  async cancelScheduledNotification(id: number): Promise<void> {
    await LocalNotifications.cancel({ notifications: [{ id }] })
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications })
    }
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<RichNotificationPayload[]> {
    const result = await PushNotifications.getDeliveredNotifications()
    return result.notifications.map((n) => this.convertToRichPayload(n))
  }

  /**
   * Remove delivered notification
   */
  async removeDeliveredNotification(id: string): Promise<void> {
    await PushNotifications.removeDeliveredNotifications({
      notifications: [{ id, title: '', body: '', data: {} }],
    })
  }

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications()
  }

  /**
   * Update badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Capacitor.getPlatform() === 'ios') {
      // iOS badge is set via local notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 0,
            title: '',
            body: '',
            extra: { badge: count },
          },
        ],
      })
    }
    // Android badge depends on launcher and requires additional plugins
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0)
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Get VoIP token (iOS only)
   */
  getVoIPToken(): string | null {
    return this.voipToken
  }

  /**
   * Get notification stats
   */
  getStats(): NotificationStats {
    return { ...this.stats }
  }

  /**
   * Reset stats
   */
  resetStats(): void {
    this.stats = {
      totalReceived: 0,
      totalDisplayed: 0,
      totalTapped: 0,
      totalDismissed: 0,
      byChannel: {},
    }
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: {
    onTokenReceived?: (token: string, isVoip: boolean) => void
    onNotificationReceived?: (notification: RichNotificationPayload) => void
    onNotificationTapped?: (notification: RichNotificationPayload, actionId?: string) => void
    onNotificationDismissed?: (notificationId: string) => void
    onVoIPPush?: (payload: VoIPPushPayload) => void
    onSilentPush?: (data: Record<string, unknown>) => void
  }): void {
    this.onTokenReceived = handlers.onTokenReceived
    this.onNotificationReceived = handlers.onNotificationReceived
    this.onNotificationTapped = handlers.onNotificationTapped
    this.onNotificationDismissed = handlers.onNotificationDismissed
    this.onVoIPPush = handlers.onVoIPPush
    this.onSilentPush = handlers.onSilentPush
  }

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    for (const listener of this.listeners) {
      await listener.remove()
    }
    this.listeners = []
    this.isRegistered = false
    this.token = null
  }

  /**
   * Convert importance string to number
   */
  private getImportanceLevel(importance: NotificationChannel['importance']): number {
    const levels = { none: 0, min: 1, low: 2, default: 3, high: 4, max: 5 }
    return levels[importance] ?? 3
  }

  /**
   * Convert visibility string to number
   */
  private getVisibilityLevel(visibility?: NotificationChannel['visibility']): number {
    const levels = { secret: -1, private: 0, public: 1 }
    return visibility ? (levels[visibility] ?? 0) : 0
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const enhancedPushNotifications = new EnhancedPushNotificationService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UsePushNotificationsResult {
  token: string | null
  isRegistered: boolean
  hasPermission: boolean | null
  lastNotification: RichNotificationPayload | null
  requestPermission: () => Promise<boolean>
  scheduleNotification: (payload: RichNotificationPayload, scheduleAt: Date) => Promise<void>
  cancelScheduledNotification: (id: number) => Promise<void>
  setBadgeCount: (count: number) => Promise<void>
  clearBadge: () => Promise<void>
  getDeliveredNotifications: () => Promise<RichNotificationPayload[]>
  removeDeliveredNotification: (id: string) => Promise<void>
  removeAllDeliveredNotifications: () => Promise<void>
}

export function usePushNotifications(options?: {
  onNotificationReceived?: (notification: RichNotificationPayload) => void
  onNotificationTapped?: (notification: RichNotificationPayload, actionId?: string) => void
  onSilentPush?: (data: Record<string, unknown>) => void
}): UsePushNotificationsResult {
  const [token, setToken] = React.useState<string | null>(null)
  const [isRegistered, setIsRegistered] = React.useState(false)
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null)
  const [lastNotification, setLastNotification] = React.useState<RichNotificationPayload | null>(
    null
  )

  React.useEffect(() => {
    let mounted = true

    async function init() {
      // Set handlers
      enhancedPushNotifications.setHandlers({
        onTokenReceived: (newToken) => {
          if (mounted) setToken(newToken)
        },
        onNotificationReceived: (notification) => {
          if (mounted) {
            setLastNotification(notification)
            options?.onNotificationReceived?.(notification)
          }
        },
        onNotificationTapped: (notification, actionId) => {
          if (mounted) {
            options?.onNotificationTapped?.(notification, actionId)
          }
        },
        onSilentPush: (data) => {
          if (mounted) {
            options?.onSilentPush?.(data)
          }
        },
      })

      // Initialize
      const success = await enhancedPushNotifications.initialize()
      if (mounted) {
        setIsRegistered(success)
        setHasPermission(success)
        setToken(enhancedPushNotifications.getToken())
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [options?.onNotificationReceived, options?.onNotificationTapped, options?.onSilentPush])

  const requestPermissionFn = React.useCallback(async () => {
    const granted = await enhancedPushNotifications.requestPermission()
    setHasPermission(granted)
    return granted
  }, [])

  const scheduleNotificationFn = React.useCallback(
    async (payload: RichNotificationPayload, scheduleAt: Date) => {
      await enhancedPushNotifications.scheduleNotification(payload, scheduleAt)
    },
    []
  )

  const cancelScheduledNotificationFn = React.useCallback(async (id: number) => {
    await enhancedPushNotifications.cancelScheduledNotification(id)
  }, [])

  const setBadgeCountFn = React.useCallback(async (count: number) => {
    await enhancedPushNotifications.setBadgeCount(count)
  }, [])

  const clearBadgeFn = React.useCallback(async () => {
    await enhancedPushNotifications.clearBadge()
  }, [])

  const getDeliveredNotificationsFn = React.useCallback(async () => {
    return enhancedPushNotifications.getDeliveredNotifications()
  }, [])

  const removeDeliveredNotificationFn = React.useCallback(async (id: string) => {
    await enhancedPushNotifications.removeDeliveredNotification(id)
  }, [])

  const removeAllDeliveredNotificationsFn = React.useCallback(async () => {
    await enhancedPushNotifications.removeAllDeliveredNotifications()
  }, [])

  return {
    token,
    isRegistered,
    hasPermission,
    lastNotification,
    requestPermission: requestPermissionFn,
    scheduleNotification: scheduleNotificationFn,
    cancelScheduledNotification: cancelScheduledNotificationFn,
    setBadgeCount: setBadgeCountFn,
    clearBadge: clearBadgeFn,
    getDeliveredNotifications: getDeliveredNotificationsFn,
    removeDeliveredNotification: removeDeliveredNotificationFn,
    removeAllDeliveredNotifications: removeAllDeliveredNotificationsFn,
  }
}

// =============================================================================
// Default Notification Channels
// =============================================================================

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    id: 'messages',
    name: 'Messages',
    description: 'New message notifications',
    importance: 'high',
    sound: 'notification.wav',
    vibration: true,
  },
  {
    id: 'mentions',
    name: 'Mentions',
    description: 'Direct mention notifications',
    importance: 'max',
    sound: 'mention.wav',
    vibration: true,
  },
  {
    id: 'calls',
    name: 'Calls',
    description: 'Incoming call notifications',
    importance: 'max',
    sound: 'ringtone.wav',
    vibration: true,
  },
  {
    id: 'system',
    name: 'System',
    description: 'System notifications',
    importance: 'default',
    vibration: false,
  },
  {
    id: 'silent',
    name: 'Silent',
    description: 'Silent background notifications',
    importance: 'min',
    vibration: false,
  },
]

// =============================================================================
// Default Notification Categories (iOS)
// =============================================================================

export const DEFAULT_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'message',
    actions: [
      { id: 'reply', title: 'Reply', input: true, inputPlaceholder: 'Type a reply...' },
      { id: 'mark_read', title: 'Mark as Read' },
    ],
  },
  {
    id: 'mention',
    actions: [
      { id: 'reply', title: 'Reply', input: true, inputPlaceholder: 'Type a reply...' },
      { id: 'view', title: 'View' },
    ],
  },
  {
    id: 'call',
    actions: [
      { id: 'answer', title: 'Answer' },
      { id: 'decline', title: 'Decline', destructive: true },
    ],
  },
]
