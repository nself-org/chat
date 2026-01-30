/**
 * CallKit Web Fallback
 *
 * Provides a mock implementation for web browsers that don't support
 * native call integration. Uses browser notifications as fallback.
 */

import type { CallKitPlugin, IncomingCallData, StartCallOptions, ReportCallEndedOptions, CallUpdate } from './call-kit'

export class CallKitWeb implements CallKitPlugin {
  private notificationPermission: NotificationPermission = 'default'

  async configure(options: {
    appName: string
    iconTemplateImageData?: string
    ringtoneSound?: string
    includesCallsInRecents?: boolean
    supportsVideo?: boolean
  }): Promise<void> {
    console.log('CallKit.configure (web):', options)

    // Request notification permission
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission()
    }

    return Promise.resolve()
  }

  async reportIncomingCall(options: IncomingCallData): Promise<{ uuid: string }> {
    console.log('CallKit.reportIncomingCall (web):', options)

    // Show browser notification
    if (this.notificationPermission === 'granted') {
      const notification = new Notification('Incoming Call', {
        body: `${options.callerDisplayName} is calling`,
        icon: options.callerImageUrl,
        tag: options.uuid,
        requireInteraction: true,
        actions: [
          { action: 'accept', title: 'Accept' },
          { action: 'decline', title: 'Decline' },
        ],
      })

      // Play notification sound
      this.playNotificationSound()

      // Handle notification click
      notification.onclick = () => {
        // Emit event to accept call
        window.dispatchEvent(
          new CustomEvent('callkit:callAnswered', {
            detail: { uuid: options.uuid },
          })
        )
        notification.close()
      }
    }

    return { uuid: options.uuid }
  }

  async startCall(options: StartCallOptions): Promise<{ uuid: string }> {
    console.log('CallKit.startCall (web):', options)

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callStarted', {
        detail: {
          uuid: options.uuid,
          handle: options.handle,
        },
      })
    )

    return { uuid: options.uuid }
  }

  async reportCallConnected(options: { uuid: string }): Promise<void> {
    console.log('CallKit.reportCallConnected (web):', options)

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callConnected', {
        detail: { uuid: options.uuid },
      })
    )

    return Promise.resolve()
  }

  async reportCallEnded(options: ReportCallEndedOptions): Promise<void> {
    console.log('CallKit.reportCallEnded (web):', options)

    // Close any active notifications
    if ('Notification' in window && this.notificationPermission === 'granted') {
      // Close notification with this UUID
      // Note: We can't directly close notifications by tag in all browsers
    }

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callEnded', {
        detail: {
          uuid: options.uuid,
          reason: options.reason,
        },
      })
    )

    return Promise.resolve()
  }

  async updateCall(options: CallUpdate): Promise<void> {
    console.log('CallKit.updateCall (web):', options)

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callUpdated', {
        detail: options,
      })
    )

    return Promise.resolve()
  }

  async setMuted(options: { uuid: string; muted: boolean }): Promise<void> {
    console.log('CallKit.setMuted (web):', options)

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callMuteChanged', {
        detail: options,
      })
    )

    return Promise.resolve()
  }

  async setOnHold(options: { uuid: string; onHold: boolean }): Promise<void> {
    console.log('CallKit.setOnHold (web):', options)

    // Emit event
    window.dispatchEvent(
      new CustomEvent('callkit:callHoldChanged', {
        detail: options,
      })
    )

    return Promise.resolve()
  }

  async isSupported(): Promise<{ supported: boolean }> {
    // Web doesn't support native call integration
    return { supported: false }
  }

  async requestPermissions(): Promise<{ granted: boolean }> {
    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return { granted: permission === 'granted' }
    }

    return { granted: false }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create audio element
      const audio = new Audio('/sounds/ringtone.mp3')
      audio.loop = true
      audio.volume = 0.5
      audio.play().catch((err) => {
        console.warn('Failed to play notification sound:', err)
      })

      // Stop after 30 seconds
      setTimeout(() => {
        audio.pause()
        audio.currentTime = 0
      }, 30000)
    } catch (err) {
      console.warn('Failed to create audio element:', err)
    }
  }
}
