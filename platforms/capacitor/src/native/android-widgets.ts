/**
 * Android Widgets Integration
 *
 * Provides data and configuration management for Android App Widgets.
 * Supports multiple widget types and sizes.
 */

import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'

// =============================================================================
// Types
// =============================================================================

export type AndroidWidgetSize = 'small' | 'medium' | 'large' | 'wide'

export interface AndroidWidgetConfig {
  /** Widget ID */
  widgetId: number
  /** Widget type identifier */
  widgetType: AndroidWidgetType
  /** Widget size */
  size: AndroidWidgetSize
  /** Widget configuration options */
  options: Record<string, unknown>
  /** Last update timestamp */
  lastUpdated: number
}

export type AndroidWidgetType =
  | 'unread_counter'
  | 'recent_messages'
  | 'quick_compose'
  | 'channel_list'
  | 'status_widget'

export interface UnreadCounterWidgetData {
  type: 'unread_counter'
  totalUnread: number
  channelUnread: number
  dmUnread: number
  mentionCount: number
}

export interface RecentMessagesWidgetData {
  type: 'recent_messages'
  messages: AndroidWidgetMessage[]
  maxMessages: number
}

export interface AndroidWidgetMessage {
  id: string
  channelId: string
  channelName: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: number
  isUnread: boolean
  isMention: boolean
}

export interface QuickComposeWidgetData {
  type: 'quick_compose'
  recentRecipients: AndroidWidgetRecipient[]
  quickReplies: string[]
}

export interface AndroidWidgetRecipient {
  id: string
  type: 'user' | 'channel'
  name: string
  avatar?: string
}

export interface ChannelListWidgetData {
  type: 'channel_list'
  channels: AndroidWidgetChannel[]
  showUnreadOnly: boolean
}

export interface AndroidWidgetChannel {
  id: string
  name: string
  icon?: string
  unreadCount: number
  lastMessagePreview?: string
  lastMessageTime?: number
  isMuted: boolean
  isPinned: boolean
}

export interface StatusWidgetData {
  type: 'status_widget'
  isOnline: boolean
  currentStatus: 'online' | 'away' | 'busy' | 'offline' | 'invisible'
  userName: string
  userAvatar?: string
}

export type AndroidWidgetData =
  | UnreadCounterWidgetData
  | RecentMessagesWidgetData
  | QuickComposeWidgetData
  | ChannelListWidgetData
  | StatusWidgetData

export interface AndroidWidgetClickAction {
  /** Action type */
  action: 'open_app' | 'open_channel' | 'open_dm' | 'compose' | 'change_status'
  /** Action payload */
  payload?: Record<string, unknown>
  /** Target ID (channel/user ID) */
  targetId?: string
}

// =============================================================================
// Android Widget Plugin Interface
// =============================================================================

export interface AndroidWidgetPlugin {
  /**
   * Check if widgets are supported
   */
  isSupported(): Promise<{ supported: boolean }>

  /**
   * Get all configured widgets
   */
  getConfiguredWidgets(): Promise<{ widgets: AndroidWidgetConfig[] }>

  /**
   * Update widget data
   */
  updateWidget(options: { widgetId: number; data: AndroidWidgetData }): Promise<void>

  /**
   * Update all widgets of a specific type
   */
  updateWidgetsByType(options: {
    widgetType: AndroidWidgetType
    data: AndroidWidgetData
  }): Promise<{ updatedCount: number }>

  /**
   * Trigger widget update
   */
  requestUpdate(options: { widgetId?: number; widgetType?: AndroidWidgetType }): Promise<void>

  /**
   * Register pending intent for widget action
   */
  registerClickAction(options: {
    widgetId: number
    viewId: string
    action: AndroidWidgetClickAction
  }): Promise<void>

  /**
   * Update widget remote views
   */
  updateRemoteViews(options: {
    widgetId: number
    layoutUpdates: AndroidRemoteViewUpdate[]
  }): Promise<void>

  /**
   * Pin widget to home screen (Android 8.0+)
   */
  pinWidget(options: { widgetType: AndroidWidgetType }): Promise<{ success: boolean }>

  /**
   * Add listener for widget actions
   */
  addListener(
    eventName: 'widgetAction',
    listenerFunc: (data: { widgetId: number; action: AndroidWidgetClickAction }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for widget configuration changes
   */
  addListener(
    eventName: 'widgetConfigured',
    listenerFunc: (data: { widget: AndroidWidgetConfig }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for widget deletion
   */
  addListener(
    eventName: 'widgetDeleted',
    listenerFunc: (data: { widgetId: number }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>
}

export interface AndroidRemoteViewUpdate {
  viewId: string
  property: 'text' | 'textColor' | 'visibility' | 'imageUri' | 'progress' | 'alpha'
  value: string | number | boolean
}

import type { PluginListenerHandle } from '@capacitor/core'

// =============================================================================
// Register Plugin
// =============================================================================

const AndroidWidget = registerPlugin<AndroidWidgetPlugin>('AndroidWidget', {
  web: () => import('./android-widgets-web').then((m) => new m.AndroidWidgetWeb()),
})

// =============================================================================
// Android Widget Service
// =============================================================================

class AndroidWidgetService {
  private initialized = false
  private widgets: Map<number, AndroidWidgetConfig> = new Map()
  private listeners: PluginListenerHandle[] = []
  private actionHandlers: Map<string, (action: AndroidWidgetClickAction) => void> = new Map()

  /**
   * Initialize Android widget service
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true

    // Only supported on Android
    if (Capacitor.getPlatform() !== 'android') {
      console.log('Android widgets only supported on Android platform')
      return false
    }

    try {
      const { supported } = await AndroidWidget.isSupported()
      if (!supported) {
        console.log('Android widgets not supported on this device')
        return false
      }

      // Load configured widgets
      const { widgets } = await AndroidWidget.getConfiguredWidgets()
      widgets.forEach((widget) => {
        this.widgets.set(widget.widgetId, widget)
      })

      // Set up listeners
      await this.setupListeners()

      this.initialized = true
      console.log('Android widget service initialized', { widgetCount: widgets.length })

      return true
    } catch (error) {
      console.error('Failed to initialize Android widget service:', error)
      return false
    }
  }

  /**
   * Set up event listeners
   */
  private async setupListeners(): Promise<void> {
    // Widget action listener
    const actionListener = await AndroidWidget.addListener('widgetAction', (data) => {
      console.log('Widget action received:', data)
      this.handleWidgetAction(data.widgetId, data.action)
    })
    this.listeners.push(actionListener)

    // Widget configured listener
    const configuredListener = await AndroidWidget.addListener('widgetConfigured', (data) => {
      console.log('Widget configured:', data.widget)
      this.widgets.set(data.widget.widgetId, data.widget)
    })
    this.listeners.push(configuredListener)

    // Widget deleted listener
    const deletedListener = await AndroidWidget.addListener('widgetDeleted', (data) => {
      console.log('Widget deleted:', data.widgetId)
      this.widgets.delete(data.widgetId)
    })
    this.listeners.push(deletedListener)
  }

  /**
   * Handle widget action
   */
  private handleWidgetAction(widgetId: number, action: AndroidWidgetClickAction): void {
    const handler = this.actionHandlers.get(action.action)
    if (handler) {
      handler(action)
    } else {
      console.warn('No handler for widget action:', action.action)
    }
  }

  /**
   * Register action handler
   */
  registerActionHandler(
    action: AndroidWidgetClickAction['action'],
    handler: (action: AndroidWidgetClickAction) => void
  ): void {
    this.actionHandlers.set(action, handler)
  }

  /**
   * Update unread counter widget
   */
  async updateUnreadCounterWidget(data: Omit<UnreadCounterWidgetData, 'type'>): Promise<void> {
    const widgetData: UnreadCounterWidgetData = {
      type: 'unread_counter',
      ...data,
    }

    await AndroidWidget.updateWidgetsByType({
      widgetType: 'unread_counter',
      data: widgetData,
    })
  }

  /**
   * Update recent messages widget
   */
  async updateRecentMessagesWidget(
    messages: AndroidWidgetMessage[],
    maxMessages: number = 5
  ): Promise<void> {
    const widgetData: RecentMessagesWidgetData = {
      type: 'recent_messages',
      messages: messages.slice(0, maxMessages),
      maxMessages,
    }

    await AndroidWidget.updateWidgetsByType({
      widgetType: 'recent_messages',
      data: widgetData,
    })
  }

  /**
   * Update quick compose widget
   */
  async updateQuickComposeWidget(
    recentRecipients: AndroidWidgetRecipient[],
    quickReplies: string[]
  ): Promise<void> {
    const widgetData: QuickComposeWidgetData = {
      type: 'quick_compose',
      recentRecipients: recentRecipients.slice(0, 8),
      quickReplies: quickReplies.slice(0, 5),
    }

    await AndroidWidget.updateWidgetsByType({
      widgetType: 'quick_compose',
      data: widgetData,
    })
  }

  /**
   * Update channel list widget
   */
  async updateChannelListWidget(
    channels: AndroidWidgetChannel[],
    showUnreadOnly: boolean = false
  ): Promise<void> {
    let filteredChannels = channels
    if (showUnreadOnly) {
      filteredChannels = channels.filter((c) => c.unreadCount > 0)
    }

    const widgetData: ChannelListWidgetData = {
      type: 'channel_list',
      channels: filteredChannels.slice(0, 10),
      showUnreadOnly,
    }

    await AndroidWidget.updateWidgetsByType({
      widgetType: 'channel_list',
      data: widgetData,
    })
  }

  /**
   * Update status widget
   */
  async updateStatusWidget(
    isOnline: boolean,
    currentStatus: StatusWidgetData['currentStatus'],
    userName: string,
    userAvatar?: string
  ): Promise<void> {
    const widgetData: StatusWidgetData = {
      type: 'status_widget',
      isOnline,
      currentStatus,
      userName,
      userAvatar,
    }

    await AndroidWidget.updateWidgetsByType({
      widgetType: 'status_widget',
      data: widgetData,
    })
  }

  /**
   * Update all widgets with current data
   */
  async refreshAllWidgets(): Promise<void> {
    await AndroidWidget.requestUpdate({})
  }

  /**
   * Pin a widget to home screen
   */
  async pinWidget(widgetType: AndroidWidgetType): Promise<boolean> {
    try {
      const { success } = await AndroidWidget.pinWidget({ widgetType })
      return success
    } catch (error) {
      console.error('Failed to pin widget:', error)
      return false
    }
  }

  /**
   * Get configured widgets
   */
  getWidgets(): AndroidWidgetConfig[] {
    return Array.from(this.widgets.values())
  }

  /**
   * Get widgets by type
   */
  getWidgetsByType(widgetType: AndroidWidgetType): AndroidWidgetConfig[] {
    return Array.from(this.widgets.values()).filter((widget) => widget.widgetType === widgetType)
  }

  /**
   * Check if any widgets are configured
   */
  hasConfiguredWidgets(): boolean {
    return this.widgets.size > 0
  }

  /**
   * Clean up
   */
  async cleanup(): Promise<void> {
    await AndroidWidget.removeAllListeners()
    this.listeners = []
    this.widgets.clear()
    this.initialized = false
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const androidWidgets = new AndroidWidgetService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UseAndroidWidgetsResult {
  isSupported: boolean
  widgets: AndroidWidgetConfig[]
  updateUnreadCounter: (data: Omit<UnreadCounterWidgetData, 'type'>) => Promise<void>
  updateRecentMessages: (messages: AndroidWidgetMessage[]) => Promise<void>
  updateChannelList: (channels: AndroidWidgetChannel[]) => Promise<void>
  pinWidget: (widgetType: AndroidWidgetType) => Promise<boolean>
  refreshAll: () => Promise<void>
}

export function useAndroidWidgets(): UseAndroidWidgetsResult {
  const [isSupported, setIsSupported] = React.useState(false)
  const [widgets, setWidgets] = React.useState<AndroidWidgetConfig[]>([])

  React.useEffect(() => {
    let mounted = true

    async function init() {
      const success = await androidWidgets.initialize()
      if (!mounted) return

      setIsSupported(success)
      if (success) {
        setWidgets(androidWidgets.getWidgets())
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const updateUnreadCounter = React.useCallback(
    async (data: Omit<UnreadCounterWidgetData, 'type'>) => {
      await androidWidgets.updateUnreadCounterWidget(data)
    },
    []
  )

  const updateRecentMessages = React.useCallback(async (messages: AndroidWidgetMessage[]) => {
    await androidWidgets.updateRecentMessagesWidget(messages)
  }, [])

  const updateChannelList = React.useCallback(async (channels: AndroidWidgetChannel[]) => {
    await androidWidgets.updateChannelListWidget(channels)
  }, [])

  const pinWidget = React.useCallback(async (widgetType: AndroidWidgetType) => {
    return androidWidgets.pinWidget(widgetType)
  }, [])

  const refreshAll = React.useCallback(async () => {
    await androidWidgets.refreshAllWidgets()
  }, [])

  return {
    isSupported,
    widgets,
    updateUnreadCounter,
    updateRecentMessages,
    updateChannelList,
    pinWidget,
    refreshAll,
  }
}
