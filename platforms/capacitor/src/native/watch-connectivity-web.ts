/**
 * Watch Connectivity Web Fallback
 *
 * Provides a no-op web fallback for WatchConnectivity.
 * Apple Watch connectivity is only available on iOS.
 */

import type {
  WatchConnectivityPlugin,
  WatchSessionStatus,
  WatchMessage,
  WatchApplicationContext,
  WatchComplicationData,
  WatchUserInfo,
} from './watch-connectivity'
import type { PluginListenerHandle } from '@capacitor/core'

export class WatchConnectivityWeb implements WatchConnectivityPlugin {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()

  /**
   * Activate watch session (no-op on web)
   */
  async activateSession(): Promise<void> {
    console.log('Watch connectivity not available on web')
  }

  /**
   * Get current session status
   */
  async getSessionStatus(): Promise<WatchSessionStatus> {
    return {
      isPaired: false,
      isWatchAppInstalled: false,
      isComplicationEnabled: false,
      isReachable: false,
      sessionState: 'notActivated',
    }
  }

  /**
   * Check if watch is reachable
   */
  async isReachable(): Promise<{ reachable: boolean }> {
    return { reachable: false }
  }

  /**
   * Send message to watch (no-op on web)
   */
  async sendMessage(_options: {
    message: WatchMessage
    replyTimeout?: number
  }): Promise<{ reply: Record<string, unknown> | null }> {
    console.warn('Cannot send message to watch on web')
    return { reply: null }
  }

  /**
   * Update application context (no-op on web)
   */
  async updateApplicationContext(_options: { context: WatchApplicationContext }): Promise<void> {
    console.log('Application context update ignored on web')
  }

  /**
   * Get received application context
   */
  async getReceivedApplicationContext(): Promise<{
    context: WatchApplicationContext | null
  }> {
    return { context: null }
  }

  /**
   * Transfer user info (no-op on web)
   */
  async transferUserInfo(_options: {
    userInfo: Record<string, unknown>
  }): Promise<{ transferId: string }> {
    return { transferId: '' }
  }

  /**
   * Get outstanding user info transfers
   */
  async getOutstandingUserInfoTransfers(): Promise<{
    transfers: WatchUserInfo[]
  }> {
    return { transfers: [] }
  }

  /**
   * Update complication data (no-op on web)
   */
  async updateComplication(_options: { complicationData: WatchComplicationData[] }): Promise<void> {
    console.log('Complication update ignored on web')
  }

  /**
   * Check if complications are enabled
   */
  async isComplicationEnabled(): Promise<{ enabled: boolean }> {
    return { enabled: false }
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
