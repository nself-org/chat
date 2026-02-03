/**
 * Watch Connectivity for iOS Apple Watch Integration
 *
 * Provides bidirectional communication between the iOS app and Apple Watch.
 * Supports WatchConnectivity framework features:
 * - Application context (background sync)
 * - User info transfers
 * - Interactive messaging
 * - Complication updates
 */

import { registerPlugin, PluginListenerHandle } from '@capacitor/core'

// =============================================================================
// Types
// =============================================================================

export type WatchSessionState = 'notActivated' | 'inactive' | 'activated'

export type WatchReachability = 'reachable' | 'unreachable'

export interface WatchSessionStatus {
  isPaired: boolean
  isWatchAppInstalled: boolean
  isComplicationEnabled: boolean
  isReachable: boolean
  sessionState: WatchSessionState
  watchDirectoryURL?: string
}

export interface WatchMessage {
  /** Message type identifier */
  type: string
  /** Message payload */
  payload: Record<string, unknown>
  /** Timestamp when message was created */
  timestamp: number
  /** Message ID for tracking */
  messageId: string
}

export interface WatchApplicationContext {
  /** Current user info */
  user?: {
    id: string
    name: string
    avatar?: string
    status: 'online' | 'away' | 'busy' | 'offline'
  }
  /** Unread counts */
  unreadCounts?: {
    total: number
    channels: Record<string, number>
    directMessages: Record<string, number>
  }
  /** Recent conversations for quick access */
  recentConversations?: WatchConversation[]
  /** Quick reply options */
  quickReplies?: string[]
  /** Last sync timestamp */
  lastSync: number
}

export interface WatchConversation {
  id: string
  type: 'channel' | 'direct_message'
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
}

export interface WatchComplicationData {
  /** Complication family (e.g., 'circularSmall', 'modularLarge') */
  family: string
  /** Template type */
  template: string
  /** Data for the complication */
  data: Record<string, unknown>
}

export interface WatchUserInfo {
  /** Transfer ID */
  transferId: string
  /** User info payload */
  userInfo: Record<string, unknown>
  /** Whether the transfer is current */
  isCurrent: boolean
}

export interface MessageSendOptions {
  /** Reply handler timeout in seconds (default: 30) */
  replyTimeout?: number
  /** Priority level */
  priority?: 'high' | 'normal' | 'low'
}

// =============================================================================
// Watch Connectivity Plugin Interface
// =============================================================================

export interface WatchConnectivityPlugin {
  /**
   * Activate watch session
   */
  activateSession(): Promise<void>

  /**
   * Get current session status
   */
  getSessionStatus(): Promise<WatchSessionStatus>

  /**
   * Check if watch is reachable for immediate messaging
   */
  isReachable(): Promise<{ reachable: boolean }>

  /**
   * Send message to watch (requires reachability)
   */
  sendMessage(options: {
    message: WatchMessage
    replyTimeout?: number
  }): Promise<{ reply: Record<string, unknown> | null }>

  /**
   * Update application context (synced in background)
   */
  updateApplicationContext(options: { context: WatchApplicationContext }): Promise<void>

  /**
   * Get received application context from watch
   */
  getReceivedApplicationContext(): Promise<{
    context: WatchApplicationContext | null
  }>

  /**
   * Transfer user info (queued and guaranteed delivery)
   */
  transferUserInfo(options: { userInfo: Record<string, unknown> }): Promise<{ transferId: string }>

  /**
   * Get outstanding user info transfers
   */
  getOutstandingUserInfoTransfers(): Promise<{
    transfers: WatchUserInfo[]
  }>

  /**
   * Update complication data
   */
  updateComplication(options: { complicationData: WatchComplicationData[] }): Promise<void>

  /**
   * Check if complications are enabled
   */
  isComplicationEnabled(): Promise<{ enabled: boolean }>

  /**
   * Add listener for session state changes
   */
  addListener(
    eventName: 'sessionStateChanged',
    listenerFunc: (data: { state: WatchSessionState }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for reachability changes
   */
  addListener(
    eventName: 'reachabilityChanged',
    listenerFunc: (data: { reachable: boolean }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for received messages
   */
  addListener(
    eventName: 'messageReceived',
    listenerFunc: (data: { message: WatchMessage }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for application context updates
   */
  addListener(
    eventName: 'applicationContextReceived',
    listenerFunc: (data: { context: WatchApplicationContext }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for user info received
   */
  addListener(
    eventName: 'userInfoReceived',
    listenerFunc: (data: { userInfo: Record<string, unknown> }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>
}

// =============================================================================
// Register Plugin
// =============================================================================

const WatchConnectivity = registerPlugin<WatchConnectivityPlugin>('WatchConnectivity', {
  web: () => import('./watch-connectivity-web').then((m) => new m.WatchConnectivityWeb()),
})

// =============================================================================
// Watch Connectivity Service
// =============================================================================

class WatchConnectivityService {
  private sessionActivated = false
  private currentStatus: WatchSessionStatus | null = null
  private messageHandlers: Map<
    string,
    (message: WatchMessage) => Promise<Record<string, unknown> | void>
  > = new Map()
  private listeners: PluginListenerHandle[] = []

  /**
   * Initialize watch connectivity
   */
  async initialize(): Promise<boolean> {
    try {
      // Activate session
      await WatchConnectivity.activateSession()

      // Get initial status
      this.currentStatus = await WatchConnectivity.getSessionStatus()

      if (!this.currentStatus.isPaired) {
        console.log('No Apple Watch paired')
        return false
      }

      if (!this.currentStatus.isWatchAppInstalled) {
        console.log('Watch app not installed')
        return false
      }

      // Set up listeners
      await this.setupListeners()

      this.sessionActivated = true
      console.log('Watch connectivity initialized', this.currentStatus)

      return true
    } catch (error) {
      console.error('Failed to initialize watch connectivity:', error)
      return false
    }
  }

  /**
   * Set up event listeners
   */
  private async setupListeners(): Promise<void> {
    // Session state changes
    const stateListener = await WatchConnectivity.addListener('sessionStateChanged', (data) => {
      console.log('Watch session state changed:', data.state)
      if (this.currentStatus) {
        this.currentStatus.sessionState = data.state
      }
    })
    this.listeners.push(stateListener)

    // Reachability changes
    const reachabilityListener = await WatchConnectivity.addListener(
      'reachabilityChanged',
      (data) => {
        console.log('Watch reachability changed:', data.reachable)
        if (this.currentStatus) {
          this.currentStatus.isReachable = data.reachable
        }
      }
    )
    this.listeners.push(reachabilityListener)

    // Message received
    const messageListener = await WatchConnectivity.addListener('messageReceived', async (data) => {
      console.log('Message received from watch:', data.message)
      await this.handleReceivedMessage(data.message)
    })
    this.listeners.push(messageListener)

    // Application context received
    const contextListener = await WatchConnectivity.addListener(
      'applicationContextReceived',
      (data) => {
        console.log('Application context received from watch:', data.context)
        this.handleReceivedContext(data.context)
      }
    )
    this.listeners.push(contextListener)

    // User info received
    const userInfoListener = await WatchConnectivity.addListener('userInfoReceived', (data) => {
      console.log('User info received from watch:', data.userInfo)
      this.handleReceivedUserInfo(data.userInfo)
    })
    this.listeners.push(userInfoListener)
  }

  /**
   * Handle received message from watch
   */
  private async handleReceivedMessage(message: WatchMessage): Promise<void> {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      await handler(message)
    } else {
      console.warn('No handler for message type:', message.type)
    }
  }

  /**
   * Handle received application context from watch
   */
  private handleReceivedContext(context: WatchApplicationContext): void {
    // Override in subclass or register handlers
    console.log('Received context from watch:', context)
  }

  /**
   * Handle received user info from watch
   */
  private handleReceivedUserInfo(userInfo: Record<string, unknown>): void {
    // Override in subclass or register handlers
    console.log('Received user info from watch:', userInfo)
  }

  /**
   * Register message handler
   */
  registerMessageHandler(
    messageType: string,
    handler: (message: WatchMessage) => Promise<Record<string, unknown> | void>
  ): void {
    this.messageHandlers.set(messageType, handler)
  }

  /**
   * Unregister message handler
   */
  unregisterMessageHandler(messageType: string): void {
    this.messageHandlers.delete(messageType)
  }

  /**
   * Send message to watch
   */
  async sendMessage(
    type: string,
    payload: Record<string, unknown>,
    options?: MessageSendOptions
  ): Promise<Record<string, unknown> | null> {
    if (!this.sessionActivated) {
      throw new Error('Watch session not activated')
    }

    const { reachable } = await WatchConnectivity.isReachable()
    if (!reachable) {
      throw new Error('Watch is not reachable')
    }

    const message: WatchMessage = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId(),
    }

    const { reply } = await WatchConnectivity.sendMessage({
      message,
      replyTimeout: options?.replyTimeout || 30,
    })

    return reply
  }

  /**
   * Update application context (synced in background)
   */
  async updateContext(context: Partial<WatchApplicationContext>): Promise<void> {
    if (!this.sessionActivated) {
      throw new Error('Watch session not activated')
    }

    const fullContext: WatchApplicationContext = {
      ...context,
      lastSync: Date.now(),
    }

    await WatchConnectivity.updateApplicationContext({ context: fullContext })
  }

  /**
   * Sync unread counts to watch
   */
  async syncUnreadCounts(
    total: number,
    channels: Record<string, number>,
    directMessages: Record<string, number>
  ): Promise<void> {
    await this.updateContext({
      unreadCounts: { total, channels, directMessages },
    })
  }

  /**
   * Sync user status to watch
   */
  async syncUserStatus(user: WatchApplicationContext['user']): Promise<void> {
    await this.updateContext({ user })
  }

  /**
   * Sync recent conversations to watch
   */
  async syncRecentConversations(conversations: WatchConversation[]): Promise<void> {
    // Limit to what watch can display
    await this.updateContext({
      recentConversations: conversations.slice(0, 10),
    })
  }

  /**
   * Sync quick replies to watch
   */
  async syncQuickReplies(replies: string[]): Promise<void> {
    await this.updateContext({
      quickReplies: replies.slice(0, 10),
    })
  }

  /**
   * Transfer user info (guaranteed delivery)
   */
  async transferUserInfo(userInfo: Record<string, unknown>): Promise<string> {
    if (!this.sessionActivated) {
      throw new Error('Watch session not activated')
    }

    const { transferId } = await WatchConnectivity.transferUserInfo({ userInfo })
    return transferId
  }

  /**
   * Update complication data
   */
  async updateComplication(data: WatchComplicationData[]): Promise<void> {
    if (!this.sessionActivated) {
      throw new Error('Watch session not activated')
    }

    const { enabled } = await WatchConnectivity.isComplicationEnabled()
    if (!enabled) {
      console.log('Complications not enabled')
      return
    }

    await WatchConnectivity.updateComplication({ complicationData: data })
  }

  /**
   * Update unread badge complication
   */
  async updateUnreadBadgeComplication(unreadCount: number): Promise<void> {
    await this.updateComplication([
      {
        family: 'circularSmall',
        template: 'CLKComplicationTemplateCircularSmallSimpleText',
        data: {
          textProvider: unreadCount > 99 ? '99+' : unreadCount.toString(),
        },
      },
      {
        family: 'modularSmall',
        template: 'CLKComplicationTemplateModularSmallSimpleText',
        data: {
          textProvider: unreadCount > 99 ? '99+' : unreadCount.toString(),
        },
      },
      {
        family: 'utilitarianSmall',
        template: 'CLKComplicationTemplateUtilitarianSmallFlat',
        data: {
          textProvider: `${unreadCount} unread`,
        },
      },
    ])
  }

  /**
   * Get session status
   */
  async getStatus(): Promise<WatchSessionStatus> {
    this.currentStatus = await WatchConnectivity.getSessionStatus()
    return this.currentStatus
  }

  /**
   * Check if watch is reachable
   */
  async isReachable(): Promise<boolean> {
    const { reachable } = await WatchConnectivity.isReachable()
    return reachable
  }

  /**
   * Check if watch is paired and app installed
   */
  isWatchAvailable(): boolean {
    return this.currentStatus?.isPaired === true && this.currentStatus?.isWatchAppInstalled === true
  }

  /**
   * Clean up listeners
   */
  async cleanup(): Promise<void> {
    await WatchConnectivity.removeAllListeners()
    this.listeners = []
    this.sessionActivated = false
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const watchConnectivity = new WatchConnectivityService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UseWatchConnectivityResult {
  isAvailable: boolean
  isReachable: boolean
  status: WatchSessionStatus | null
  sendMessage: (
    type: string,
    payload: Record<string, unknown>
  ) => Promise<Record<string, unknown> | null>
  syncUnreadCounts: (
    total: number,
    channels: Record<string, number>,
    directMessages: Record<string, number>
  ) => Promise<void>
  syncRecentConversations: (conversations: WatchConversation[]) => Promise<void>
}

export function useWatchConnectivity(): UseWatchConnectivityResult {
  const [isAvailable, setIsAvailable] = React.useState(false)
  const [isReachable, setIsReachable] = React.useState(false)
  const [status, setStatus] = React.useState<WatchSessionStatus | null>(null)

  React.useEffect(() => {
    let mounted = true
    let reachabilityListener: PluginListenerHandle | null = null

    async function init() {
      try {
        const success = await watchConnectivity.initialize()
        if (!mounted) return

        setIsAvailable(success)

        if (success) {
          const currentStatus = await watchConnectivity.getStatus()
          setStatus(currentStatus)
          setIsReachable(currentStatus.isReachable)

          // Listen for reachability changes
          reachabilityListener = await WatchConnectivity.addListener(
            'reachabilityChanged',
            (data) => {
              if (mounted) {
                setIsReachable(data.reachable)
              }
            }
          )
        }
      } catch (error) {
        console.error('Failed to initialize watch connectivity:', error)
      }
    }

    init()

    return () => {
      mounted = false
      reachabilityListener?.remove()
    }
  }, [])

  const sendMessage = React.useCallback(async (type: string, payload: Record<string, unknown>) => {
    return watchConnectivity.sendMessage(type, payload)
  }, [])

  const syncUnreadCounts = React.useCallback(
    async (
      total: number,
      channels: Record<string, number>,
      directMessages: Record<string, number>
    ) => {
      await watchConnectivity.syncUnreadCounts(total, channels, directMessages)
    },
    []
  )

  const syncRecentConversations = React.useCallback(async (conversations: WatchConversation[]) => {
    await watchConnectivity.syncRecentConversations(conversations)
  }, [])

  return {
    isAvailable,
    isReachable,
    status,
    sendMessage,
    syncUnreadCounts,
    syncRecentConversations,
  }
}

// =============================================================================
// Message Types for Watch App
// =============================================================================

export const WatchMessageTypes = {
  // From iPhone to Watch
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  STATUS_UPDATE: 'status_update',
  TYPING_INDICATOR: 'typing_indicator',

  // From Watch to iPhone
  SEND_MESSAGE: 'send_message',
  MARK_AS_READ: 'mark_as_read',
  CHANGE_STATUS: 'change_status',
  REQUEST_SYNC: 'request_sync',
} as const
