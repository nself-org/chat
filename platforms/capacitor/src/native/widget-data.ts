/**
 * Widget Data Provider for iOS and Android
 *
 * Provides data synchronization between the main app and widget extensions.
 * iOS: Today Extension / Widget Kit
 * Android: App Widgets
 */

import { registerPlugin } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// =============================================================================
// Types
// =============================================================================

export interface WidgetData {
  /** Unique identifier for the widget data */
  id: string
  /** Widget type identifier */
  widgetType: 'unread_messages' | 'recent_chats' | 'quick_compose' | 'status'
  /** Last update timestamp */
  lastUpdated: number
  /** Widget-specific payload */
  payload: Record<string, unknown>
}

export interface UnreadMessagesWidgetData extends WidgetData {
  widgetType: 'unread_messages'
  payload: {
    totalUnread: number
    channels: UnreadChannel[]
    directMessages: UnreadDirectMessage[]
  }
}

export interface UnreadChannel {
  id: string
  name: string
  unreadCount: number
  lastMessagePreview?: string
  lastMessageTime?: number
  icon?: string
}

export interface UnreadDirectMessage {
  userId: string
  userName: string
  userAvatar?: string
  unreadCount: number
  lastMessagePreview?: string
  lastMessageTime?: number
  isOnline?: boolean
}

export interface RecentChatsWidgetData extends WidgetData {
  widgetType: 'recent_chats'
  payload: {
    chats: RecentChat[]
    maxDisplay: number
  }
}

export interface RecentChat {
  id: string
  type: 'channel' | 'direct_message' | 'group'
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: number
  unreadCount: number
  isPinned: boolean
  isMuted: boolean
}

export interface QuickComposeWidgetData extends WidgetData {
  widgetType: 'quick_compose'
  payload: {
    recentRecipients: QuickComposeRecipient[]
    defaultChannel?: string
  }
}

export interface QuickComposeRecipient {
  id: string
  type: 'user' | 'channel'
  name: string
  avatar?: string
}

export interface StatusWidgetData extends WidgetData {
  widgetType: 'status'
  payload: {
    isOnline: boolean
    currentStatus: UserStatus
    connectionState: 'connected' | 'connecting' | 'disconnected'
    lastSyncTime?: number
  }
}

export type UserStatus = 'online' | 'away' | 'busy' | 'offline' | 'invisible'

export interface WidgetDataUpdateOptions {
  /** Force immediate update (may impact battery) */
  forceUpdate?: boolean
  /** Widget types to update (default: all) */
  widgetTypes?: WidgetData['widgetType'][]
}

// =============================================================================
// Widget Plugin Interface (Native)
// =============================================================================

export interface WidgetPlugin {
  /**
   * Initialize widget data sharing
   */
  initialize(options: { appGroupId: string }): Promise<void>

  /**
   * Update widget data
   */
  updateWidgetData(options: { widgetType: string; data: Record<string, unknown> }): Promise<void>

  /**
   * Get current widget data
   */
  getWidgetData(options: { widgetType: string }): Promise<{ data: Record<string, unknown> | null }>

  /**
   * Request widget refresh (iOS WidgetKit)
   */
  reloadWidgets(options: { kind?: string }): Promise<void>

  /**
   * Check if widgets are supported
   */
  isSupported(): Promise<{ supported: boolean; widgetTypes: string[] }>
}

// =============================================================================
// Register Plugin
// =============================================================================

const Widget = registerPlugin<WidgetPlugin>('Widget', {
  web: () => import('./widget-data-web').then((m) => new m.WidgetDataWeb()),
})

// =============================================================================
// Widget Data Service
// =============================================================================

const WIDGET_DATA_PREFIX = 'widget_data_'
const APP_GROUP_ID = 'group.io.nself.chat'

class WidgetDataService {
  private initialized = false
  private isNativeSupported = false
  private updateListeners: Map<string, Set<(data: WidgetData) => void>> = new Map()

  /**
   * Initialize widget data service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Check native support
      const { supported } = await Widget.isSupported()
      this.isNativeSupported = supported

      if (supported) {
        await Widget.initialize({ appGroupId: APP_GROUP_ID })
      }

      this.initialized = true
      console.log('Widget data service initialized', { nativeSupported: supported })
    } catch (error) {
      console.error('Failed to initialize widget data service:', error)
      // Fall back to local storage only
      this.initialized = true
    }
  }

  /**
   * Update unread messages widget
   */
  async updateUnreadMessagesWidget(
    channels: UnreadChannel[],
    directMessages: UnreadDirectMessage[]
  ): Promise<void> {
    const totalUnread =
      channels.reduce((sum, c) => sum + c.unreadCount, 0) +
      directMessages.reduce((sum, dm) => sum + dm.unreadCount, 0)

    const data: UnreadMessagesWidgetData = {
      id: 'unread_messages',
      widgetType: 'unread_messages',
      lastUpdated: Date.now(),
      payload: {
        totalUnread,
        channels: channels.slice(0, 5), // Limit for widget display
        directMessages: directMessages.slice(0, 5),
      },
    }

    await this.saveWidgetData(data)
  }

  /**
   * Update recent chats widget
   */
  async updateRecentChatsWidget(chats: RecentChat[], maxDisplay: number = 5): Promise<void> {
    // Sort by last message time and pin status
    const sortedChats = [...chats].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0)
    })

    const data: RecentChatsWidgetData = {
      id: 'recent_chats',
      widgetType: 'recent_chats',
      lastUpdated: Date.now(),
      payload: {
        chats: sortedChats.slice(0, maxDisplay),
        maxDisplay,
      },
    }

    await this.saveWidgetData(data)
  }

  /**
   * Update quick compose widget
   */
  async updateQuickComposeWidget(
    recentRecipients: QuickComposeRecipient[],
    defaultChannel?: string
  ): Promise<void> {
    const data: QuickComposeWidgetData = {
      id: 'quick_compose',
      widgetType: 'quick_compose',
      lastUpdated: Date.now(),
      payload: {
        recentRecipients: recentRecipients.slice(0, 8),
        defaultChannel,
      },
    }

    await this.saveWidgetData(data)
  }

  /**
   * Update status widget
   */
  async updateStatusWidget(
    isOnline: boolean,
    currentStatus: UserStatus,
    connectionState: 'connected' | 'connecting' | 'disconnected'
  ): Promise<void> {
    const data: StatusWidgetData = {
      id: 'status',
      widgetType: 'status',
      lastUpdated: Date.now(),
      payload: {
        isOnline,
        currentStatus,
        connectionState,
        lastSyncTime: Date.now(),
      },
    }

    await this.saveWidgetData(data)
  }

  /**
   * Get widget data
   */
  async getWidgetData<T extends WidgetData>(
    widgetType: WidgetData['widgetType']
  ): Promise<T | null> {
    try {
      // Try native first
      if (this.isNativeSupported) {
        const { data } = await Widget.getWidgetData({ widgetType })
        if (data) return data as T
      }

      // Fall back to local storage
      const key = `${WIDGET_DATA_PREFIX}${widgetType}`
      const { value } = await Preferences.get({ key })

      if (value) {
        return JSON.parse(value) as T
      }

      return null
    } catch (error) {
      console.error(`Failed to get widget data for ${widgetType}:`, error)
      return null
    }
  }

  /**
   * Save widget data
   */
  private async saveWidgetData(data: WidgetData): Promise<void> {
    try {
      // Save to local storage for fallback
      const key = `${WIDGET_DATA_PREFIX}${data.widgetType}`
      await Preferences.set({ key, value: JSON.stringify(data) })

      // Update native widget if supported
      if (this.isNativeSupported) {
        await Widget.updateWidgetData({
          widgetType: data.widgetType,
          data: data as unknown as Record<string, unknown>,
        })

        // Request widget refresh
        await Widget.reloadWidgets({ kind: data.widgetType })
      }

      // Notify listeners
      this.notifyListeners(data.widgetType, data)
    } catch (error) {
      console.error(`Failed to save widget data for ${data.widgetType}:`, error)
    }
  }

  /**
   * Request all widgets to refresh
   */
  async refreshAllWidgets(): Promise<void> {
    if (this.isNativeSupported) {
      try {
        await Widget.reloadWidgets({})
      } catch (error) {
        console.error('Failed to refresh widgets:', error)
      }
    }
  }

  /**
   * Clear all widget data
   */
  async clearAllWidgetData(): Promise<void> {
    const widgetTypes: WidgetData['widgetType'][] = [
      'unread_messages',
      'recent_chats',
      'quick_compose',
      'status',
    ]

    for (const widgetType of widgetTypes) {
      const key = `${WIDGET_DATA_PREFIX}${widgetType}`
      await Preferences.remove({ key })

      if (this.isNativeSupported) {
        await Widget.updateWidgetData({
          widgetType,
          data: {},
        })
      }
    }

    await this.refreshAllWidgets()
  }

  /**
   * Add listener for widget data updates
   */
  addUpdateListener(
    widgetType: WidgetData['widgetType'],
    listener: (data: WidgetData) => void
  ): () => void {
    if (!this.updateListeners.has(widgetType)) {
      this.updateListeners.set(widgetType, new Set())
    }

    this.updateListeners.get(widgetType)!.add(listener)

    // Return cleanup function
    return () => {
      this.updateListeners.get(widgetType)?.delete(listener)
    }
  }

  /**
   * Notify listeners of data update
   */
  private notifyListeners(widgetType: string, data: WidgetData): void {
    const listeners = this.updateListeners.get(widgetType as WidgetData['widgetType'])
    if (listeners) {
      listeners.forEach((listener) => listener(data))
    }
  }

  /**
   * Check if widgets are supported
   */
  isWidgetsSupported(): boolean {
    return this.isNativeSupported
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const widgetData = new WidgetDataService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export function useWidgetData<T extends WidgetData>(
  widgetType: WidgetData['widgetType']
): {
  data: T | null
  isLoading: boolean
  refresh: () => Promise<void>
} {
  const [data, setData] = React.useState<T | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const widgetDataResult = await widgetData.getWidgetData<T>(widgetType)
      setData(widgetDataResult)
    } catch (error) {
      console.error('Failed to load widget data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [widgetType])

  React.useEffect(() => {
    // Initialize service
    widgetData.initialize().then(loadData)

    // Subscribe to updates
    const unsubscribe = widgetData.addUpdateListener(widgetType, (newData) => {
      setData(newData as T)
    })

    return unsubscribe
  }, [widgetType, loadData])

  return {
    data,
    isLoading,
    refresh: loadData,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format message preview for widget display
 */
export function formatMessagePreview(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength - 3) + '...'
}

/**
 * Format timestamp for widget display
 */
export function formatWidgetTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return 'now'
}
