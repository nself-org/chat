/**
 * Push Notifications Integration for Capacitor
 * Handles both iOS (APNs) and Android (FCM) push notifications
 */

import { PushNotifications, PushNotificationSchema, Token } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

export interface NotificationPayload {
  title: string
  body: string
  channelId?: string
  userId?: string
  messageId?: string
  deepLink?: string
  image?: string
  badge?: number
}

class PushNotificationService {
  private token: string | null = null
  private isRegistered = false

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Push notifications not available on web')
      return
    }

    // Request permission
    const permission = await PushNotifications.requestPermissions()

    if (permission.receive === 'granted') {
      await this.register()
      this.setupListeners()
    } else {
      console.warn('Push notification permission denied')
    }
  }

  /**
   * Register for push notifications
   */
  private async register(): Promise<void> {
    try {
      await PushNotifications.register()
      this.isRegistered = true
      console.log('Push notifications registered')
    } catch (error) {
      console.error('Error registering push notifications:', error)
      throw error
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Registration success
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value)
      this.token = token.value
      this.onTokenReceived(token.value)
    })

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error)
      this.onRegistrationError(error)
    })

    // Notification received (app in foreground)
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification)
        this.onNotificationReceived(notification)
      }
    )

    // Notification tapped (app in background/closed)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
      console.log('Push notification action performed:', notification)
      this.onNotificationTapped(notification.notification)
    })
  }

  /**
   * Get current device token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Show local notification (when app is in foreground)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    const permission = await LocalNotifications.requestPermissions()

    if (permission.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: payload.title,
            body: payload.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
            sound: 'notification.wav',
            attachments: payload.image ? [{ id: 'image', url: payload.image }] : undefined,
            extra: {
              channelId: payload.channelId,
              userId: payload.userId,
              messageId: payload.messageId,
              deepLink: payload.deepLink,
            },
          },
        ],
      })
    }
  }

  /**
   * Update badge count (iOS)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Capacitor.getPlatform() === 'ios') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '',
            body: '',
            id: 0,
            extra: { badge: count },
          },
        ],
      })
    }
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0)
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<any[]> {
    const result = await PushNotifications.getDeliveredNotifications()
    return result.notifications
  }

  /**
   * Remove delivered notifications
   */
  async removeDeliveredNotifications(notifications: any[]): Promise<void> {
    await PushNotifications.removeDeliveredNotifications({ notifications })
  }

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications()
  }

  /**
   * Callback for token received
   * Override this method to send token to your backend
   */
  protected onTokenReceived(token: string): void {
    console.log('Device token received:', token)
    // TODO: Send token to backend
    // Example: api.registerPushToken(token)
  }

  /**
   * Callback for registration error
   */
  protected onRegistrationError(error: any): void {
    console.error('Push registration failed:', error)
    // TODO: Handle registration error
  }

  /**
   * Callback for notification received in foreground
   */
  protected onNotificationReceived(notification: PushNotificationSchema): void {
    console.log('Notification received in foreground:', notification)

    // Show local notification to display it to user
    this.showLocalNotification({
      title: notification.title || 'New Message',
      body: notification.body || '',
      channelId: notification.data?.channelId,
      userId: notification.data?.userId,
      messageId: notification.data?.messageId,
      deepLink: notification.data?.deepLink,
      image: notification.data?.image,
    })
  }

  /**
   * Callback for notification tapped
   */
  protected onNotificationTapped(notification: PushNotificationSchema): void {
    console.log('Notification tapped:', notification)

    // Handle deep linking
    if (notification.data?.deepLink) {
      this.handleDeepLink(notification.data.deepLink)
    } else if (notification.data?.channelId) {
      this.navigateToChannel(notification.data.channelId)
    }
  }

  /**
   * Handle deep link navigation
   */
  private handleDeepLink(deepLink: string): void {
    console.log('Handling deep link:', deepLink)
    // TODO: Implement deep link navigation
    // Example: router.push(deepLink)
  }

  /**
   * Navigate to channel
   */
  private navigateToChannel(channelId: string): void {
    console.log('Navigating to channel:', channelId)
    // TODO: Implement channel navigation
    // Example: router.push(`/chat/${channelId}`)
  }

  /**
   * Unregister from push notifications
   */
  async unregister(): Promise<void> {
    await PushNotifications.removeAllListeners()
    this.isRegistered = false
    this.token = null
    console.log('Push notifications unregistered')
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationService()
