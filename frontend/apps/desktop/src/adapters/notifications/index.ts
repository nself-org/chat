/**
 * Notifications Adapter for Desktop
 *
 * Provides native desktop notifications via Electron
 */

/**
 * Notifications adapter interface
 */
export interface NotificationsAdapter {
  show(title: string, body: string, options?: NotificationOptions): Promise<boolean>
  requestPermission(): Promise<NotificationPermission>
  isSupported(): boolean
}

/**
 * Notification options
 */
export interface NotificationOptions {
  silent?: boolean
  icon?: string
  urgency?: 'normal' | 'critical' | 'low'
  onClick?: () => void
}

/**
 * Desktop notifications implementation using Electron Notification API
 *
 * @example
 * ```typescript
 * import { desktopNotifications } from '@/adapters/notifications'
 *
 * // Show notification
 * await desktopNotifications.show('New Message', 'Hello from nself-chat!')
 *
 * // Show with options
 * await desktopNotifications.show('Important', 'Action required', {
 *   silent: false,
 *   urgency: 'critical',
 *   onClick: () => {
 *     console.log('Notification clicked')
 *   }
 * })
 * ```
 */
export const desktopNotifications: NotificationsAdapter = {
  /**
   * Show a desktop notification
   */
  async show(
    title: string,
    body: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    try {
      // Use Electron's Notification API via IPC if in renderer process
      if (window.desktop) {
        await window.desktop.notification.show({
          title,
          body,
          silent: options?.silent,
        })
        return true
      }

      // Fallback to web notifications (shouldn't happen in Electron)
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          const notification = new Notification(title, {
            body,
            silent: options?.silent,
            icon: options?.icon,
          })

          if (options?.onClick) {
            notification.onclick = options.onClick
          }

          return true
        }
      }

      return false
    } catch (error) {
      console.error('[Notifications] Error showing notification:', error)
      return false
    }
  },

  /**
   * Request notification permission
   * Always granted in Electron desktop apps
   */
  async requestPermission(): Promise<NotificationPermission> {
    return 'granted'
  },

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return !!window.desktop || 'Notification' in window
  },
}

/**
 * Helper functions for notifications
 */
export const notificationHelpers = {
  /**
   * Show success notification
   */
  async showSuccess(message: string): Promise<boolean> {
    return desktopNotifications.show('Success', message, {
      urgency: 'normal',
    })
  },

  /**
   * Show error notification
   */
  async showError(message: string): Promise<boolean> {
    return desktopNotifications.show('Error', message, {
      urgency: 'critical',
    })
  },

  /**
   * Show info notification
   */
  async showInfo(message: string): Promise<boolean> {
    return desktopNotifications.show('Info', message, {
      urgency: 'low',
    })
  },

  /**
   * Show message notification
   */
  async showMessage(from: string, message: string): Promise<boolean> {
    return desktopNotifications.show(`Message from ${from}`, message, {
      urgency: 'normal',
    })
  },
}

export default desktopNotifications
