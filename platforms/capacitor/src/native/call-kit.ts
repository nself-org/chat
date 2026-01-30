/**
 * CallKit Integration (iOS) and Telecom Integration (Android)
 *
 * Provides native call integration for iOS (CallKit) and Android (Telecom Framework),
 * enabling system-level call UI, VoIP push notifications, and native call management.
 */

import { registerPlugin } from '@capacitor/core'

// =============================================================================
// Types
// =============================================================================

export type CallType = 'audio' | 'video'

export interface CallConfig {
  uuid: string
  handle: string
  handleType: 'generic' | 'email' | 'phoneNumber'
  hasVideo: boolean
  supportsGrouping: boolean
  supportsUngrouping: boolean
  supportsDTMF: boolean
  supportsHolding: boolean
}

export interface IncomingCallData {
  uuid: string
  handle: string
  handleType: 'generic' | 'email' | 'phoneNumber'
  hasVideo: boolean
  callerDisplayName: string
  callerImageUrl?: string
}

export interface StartCallOptions {
  uuid: string
  handle: string
  handleType?: 'generic' | 'email' | 'phoneNumber'
  hasVideo?: boolean
  contactIdentifier?: string
}

export interface ReportCallEndedOptions {
  uuid: string
  reason: 'failed' | 'remoteEnded' | 'unanswered' | 'answeredElsewhere' | 'declinedElsewhere'
}

export interface CallUpdate {
  uuid: string
  localizedCallerName?: string
  hasVideo?: boolean
  supportsHolding?: boolean
  supportsDTMF?: boolean
}

// =============================================================================
// CallKit Plugin Interface
// =============================================================================

export interface CallKitPlugin {
  /**
   * Configure CallKit/Telecom
   */
  configure(options: {
    appName: string
    iconTemplateImageData?: string
    ringtoneSound?: string
    includesCallsInRecents?: boolean
    supportsVideo?: boolean
  }): Promise<void>

  /**
   * Report incoming call (shows native call UI)
   */
  reportIncomingCall(options: IncomingCallData): Promise<{ uuid: string }>

  /**
   * Start outgoing call
   */
  startCall(options: StartCallOptions): Promise<{ uuid: string }>

  /**
   * Report call connected
   */
  reportCallConnected(options: { uuid: string }): Promise<void>

  /**
   * Report call ended
   */
  reportCallEnded(options: ReportCallEndedOptions): Promise<void>

  /**
   * Update call information
   */
  updateCall(options: CallUpdate): Promise<void>

  /**
   * Mute call
   */
  setMuted(options: { uuid: string; muted: boolean }): Promise<void>

  /**
   * Hold call
   */
  setOnHold(options: { uuid: string; onHold: boolean }): Promise<void>

  /**
   * Check if supported on this device
   */
  isSupported(): Promise<{ supported: boolean }>

  /**
   * Request permissions (Android only)
   */
  requestPermissions(): Promise<{ granted: boolean }>
}

// =============================================================================
// Register Plugin
// =============================================================================

export const CallKit = registerPlugin<CallKitPlugin>('CallKit', {
  web: () => import('./call-kit-web').then((m) => new m.CallKitWeb()),
})

// =============================================================================
// CallKit Manager
// =============================================================================

export class CallKitManager {
  private configured = false
  private activeCallUuid: string | null = null

  /**
   * Initialize CallKit/Telecom
   */
  async initialize(appName: string): Promise<void> {
    try {
      const { supported } = await CallKit.isSupported()

      if (!supported) {
        console.warn('CallKit/Telecom not supported on this device')
        return
      }

      // Request permissions on Android
      if (this.isAndroid()) {
        const { granted } = await CallKit.requestPermissions()
        if (!granted) {
          throw new Error('CallKit permissions not granted')
        }
      }

      // Configure
      await CallKit.configure({
        appName,
        includesCallsInRecents: true,
        supportsVideo: true,
      })

      this.configured = true
      console.log('CallKit initialized successfully')
    } catch (error) {
      console.error('Failed to initialize CallKit:', error)
      throw error
    }
  }

  /**
   * Show incoming call notification
   */
  async reportIncomingCall(options: IncomingCallData): Promise<string> {
    if (!this.configured) {
      throw new Error('CallKit not configured')
    }

    try {
      const { uuid } = await CallKit.reportIncomingCall(options)
      this.activeCallUuid = uuid
      return uuid
    } catch (error) {
      console.error('Failed to report incoming call:', error)
      throw error
    }
  }

  /**
   * Start outgoing call
   */
  async startOutgoingCall(options: StartCallOptions): Promise<string> {
    if (!this.configured) {
      throw new Error('CallKit not configured')
    }

    try {
      const { uuid } = await CallKit.startCall(options)
      this.activeCallUuid = uuid
      return uuid
    } catch (error) {
      console.error('Failed to start outgoing call:', error)
      throw error
    }
  }

  /**
   * Report call connected
   */
  async reportCallConnected(uuid?: string): Promise<void> {
    const callUuid = uuid || this.activeCallUuid

    if (!callUuid) {
      throw new Error('No active call')
    }

    try {
      await CallKit.reportCallConnected({ uuid: callUuid })
    } catch (error) {
      console.error('Failed to report call connected:', error)
      throw error
    }
  }

  /**
   * End call
   */
  async endCall(
    reason: ReportCallEndedOptions['reason'] = 'remoteEnded',
    uuid?: string
  ): Promise<void> {
    const callUuid = uuid || this.activeCallUuid

    if (!callUuid) {
      return
    }

    try {
      await CallKit.reportCallEnded({ uuid: callUuid, reason })
      this.activeCallUuid = null
    } catch (error) {
      console.error('Failed to end call:', error)
      throw error
    }
  }

  /**
   * Update call mute status
   */
  async setMuted(muted: boolean, uuid?: string): Promise<void> {
    const callUuid = uuid || this.activeCallUuid

    if (!callUuid) {
      throw new Error('No active call')
    }

    try {
      await CallKit.setMuted({ uuid: callUuid, muted })
    } catch (error) {
      console.error('Failed to set mute:', error)
      throw error
    }
  }

  /**
   * Update call hold status
   */
  async setOnHold(onHold: boolean, uuid?: string): Promise<void> {
    const callUuid = uuid || this.activeCallUuid

    if (!callUuid) {
      throw new Error('No active call')
    }

    try {
      await CallKit.setOnHold({ uuid: callUuid, onHold })
    } catch (error) {
      console.error('Failed to set hold:', error)
      throw error
    }
  }

  /**
   * Check if iOS
   */
  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  /**
   * Check if Android
   */
  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent)
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const callKitManager = new CallKitManager()

// =============================================================================
// Hook for React Components
// =============================================================================

export function useCallKit() {
  const [isSupported, setIsSupported] = React.useState(false)
  const [isConfigured, setIsConfigured] = React.useState(false)

  React.useEffect(() => {
    async function checkSupport() {
      try {
        const { supported } = await CallKit.isSupported()
        setIsSupported(supported)
      } catch (err) {
        console.error('Failed to check CallKit support:', err)
      }
    }

    checkSupport()
  }, [])

  const initialize = React.useCallback(async (appName: string) => {
    try {
      await callKitManager.initialize(appName)
      setIsConfigured(true)
    } catch (err) {
      console.error('Failed to initialize CallKit:', err)
    }
  }, [])

  const reportIncomingCall = React.useCallback(
    async (callData: IncomingCallData) => {
      try {
        return await callKitManager.reportIncomingCall(callData)
      } catch (err) {
        console.error('Failed to report incoming call:', err)
        throw err
      }
    },
    []
  )

  const startOutgoingCall = React.useCallback(async (callOptions: StartCallOptions) => {
    try {
      return await callKitManager.startOutgoingCall(callOptions)
    } catch (err) {
      console.error('Failed to start outgoing call:', err)
      throw err
    }
  }, [])

  const reportCallConnected = React.useCallback(async (uuid?: string) => {
    try {
      await callKitManager.reportCallConnected(uuid)
    } catch (err) {
      console.error('Failed to report call connected:', err)
    }
  }, [])

  const endCall = React.useCallback(
    async (reason?: ReportCallEndedOptions['reason'], uuid?: string) => {
      try {
        await callKitManager.endCall(reason, uuid)
      } catch (err) {
        console.error('Failed to end call:', err)
      }
    },
    []
  )

  return {
    isSupported,
    isConfigured,
    initialize,
    reportIncomingCall,
    startOutgoingCall,
    reportCallConnected,
    endCall,
  }
}

// =============================================================================
// Import React for hook
// =============================================================================

import * as React from 'react'
