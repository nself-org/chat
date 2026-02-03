/**
 * Android Widgets Web Fallback
 *
 * Provides a no-op web fallback for Android Widget functionality.
 */

import type {
  AndroidWidgetPlugin,
  AndroidWidgetConfig,
  AndroidWidgetData,
  AndroidWidgetType,
  AndroidWidgetClickAction,
  AndroidRemoteViewUpdate,
} from './android-widgets'
import type { PluginListenerHandle } from '@capacitor/core'

export class AndroidWidgetWeb implements AndroidWidgetPlugin {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  /**
   * Check if widgets are supported (always false on web)
   */
  async isSupported(): Promise<{ supported: boolean }> {
    return { supported: false }
  }

  /**
   * Get all configured widgets (empty on web)
   */
  async getConfiguredWidgets(): Promise<{ widgets: AndroidWidgetConfig[] }> {
    return { widgets: [] }
  }

  /**
   * Update widget data (no-op on web)
   */
  async updateWidget(_options: { widgetId: number; data: AndroidWidgetData }): Promise<void> {
    console.log('Android widget update ignored on web')
  }

  /**
   * Update all widgets of a specific type (no-op on web)
   */
  async updateWidgetsByType(_options: {
    widgetType: AndroidWidgetType
    data: AndroidWidgetData
  }): Promise<{ updatedCount: number }> {
    return { updatedCount: 0 }
  }

  /**
   * Trigger widget update (no-op on web)
   */
  async requestUpdate(_options: {
    widgetId?: number
    widgetType?: AndroidWidgetType
  }): Promise<void> {
    console.log('Android widget update request ignored on web')
  }

  /**
   * Register pending intent for widget action (no-op on web)
   */
  async registerClickAction(_options: {
    widgetId: number
    viewId: string
    action: AndroidWidgetClickAction
  }): Promise<void> {
    console.log('Android widget click action registration ignored on web')
  }

  /**
   * Update widget remote views (no-op on web)
   */
  async updateRemoteViews(_options: {
    widgetId: number
    layoutUpdates: AndroidRemoteViewUpdate[]
  }): Promise<void> {
    console.log('Android widget remote views update ignored on web')
  }

  /**
   * Pin widget to home screen (not supported on web)
   */
  async pinWidget(_options: { widgetType: AndroidWidgetType }): Promise<{ success: boolean }> {
    console.log('Android widget pinning not supported on web')
    return { success: false }
  }

  /**
   * Add event listener
   */
  async addListener(
    eventName: string,
    listenerFunc: (...args: unknown[]) => void
  ): Promise<PluginListenerHandle> {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(listenerFunc)

    return {
      remove: async () => {
        this.listeners.get(eventName)?.delete(listenerFunc)
      },
    }
  }

  /**
   * Remove all listeners
   */
  async removeAllListeners(): Promise<void> {
    this.listeners.clear()
  }
}
