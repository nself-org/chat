/**
 * Push Notifications - Native notification handling
 */

import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

import { STORAGE_KEYS } from '@shared/constants'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export interface NotificationData {
  type: 'message' | 'mention' | 'call' | 'channel_invite' | 'system'
  channelId?: string
  senderId?: string
  messageId?: string
  [key: string]: unknown
}

export interface PushNotificationToken {
  token: string
  platform: 'ios' | 'android'
  deviceId?: string
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices')
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  return finalStatus === 'granted'
}

/**
 * Get the push notification token
 */
export async function getPushToken(): Promise<PushNotificationToken | null> {
  const hasPermission = await requestNotificationPermissions()
  if (!hasPermission) {
    return null
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'nchat-mobile', // Your Expo project ID
    })

    return {
      token: token.data,
      platform: Platform.OS as 'ios' | 'android',
    }
  } catch (error) {
    console.error('Failed to get push token:', error)
    return null
  }
}

/**
 * Register push token with the server
 */
export async function registerPushToken(token: PushNotificationToken): Promise<void> {
  // API call to register token with backend
  // This would be implemented with your actual API
  console.log('Registering push token:', token)
}

/**
 * Unregister push token (e.g., on logout)
 */
export async function unregisterPushToken(): Promise<void> {
  // API call to unregister token from backend
  console.log('Unregistering push token')
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count)
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0)
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  })
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier)
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Get delivered notifications
 */
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  return Notifications.getPresentedNotificationsAsync()
}

/**
 * Dismiss a delivered notification
 */
export async function dismissNotification(identifier: string): Promise<void> {
  await Notifications.dismissNotificationAsync(identifier)
}

/**
 * Dismiss all delivered notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync()
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback)
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback)
}

/**
 * Handle notification response - navigate to appropriate screen
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigate: (screen: string, params?: object) => void
): void {
  const data = response.notification.request.content.data as NotificationData

  switch (data?.type) {
    case 'message':
    case 'mention':
      if (data.channelId) {
        navigate('Channel', { channelId: data.channelId })
      }
      break
    case 'call':
      // Handle incoming call
      break
    case 'channel_invite':
      if (data.channelId) {
        navigate('Channel', { channelId: data.channelId })
      }
      break
    default:
      // Navigate to notifications screen
      navigate('Notifications')
  }
}
