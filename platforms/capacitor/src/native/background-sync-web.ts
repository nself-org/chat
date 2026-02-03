/**
 * Background Sync Web Fallback
 *
 * Provides a limited web fallback using Service Worker Background Sync API
 * and periodic sync (where supported).
 */

import type {
  BackgroundPlugin,
  BackgroundTaskResult,
  BackgroundSyncConfig,
} from './background-sync'
import type { PluginListenerHandle } from '@capacitor/core'

export class BackgroundSyncWeb implements BackgroundPlugin {
  private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()
  private periodicSyncRegistered = false

  /**
   * Register background fetch (limited on web)
   */
  async registerBackgroundFetch(_options: {
    taskIdentifier: string
    minimumInterval: number
  }): Promise<void> {
    // Check for Background Sync API support
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('Background Sync API available (one-time sync)')
    } else {
      console.warn('Background Sync API not supported')
    }

    // Check for Periodic Background Sync API support
    if (
      'serviceWorker' in navigator &&
      'periodicSync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready
        // @ts-ignore - periodicSync not in standard types
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        })

        if (status.state === 'granted') {
          // @ts-ignore
          await registration.periodicSync.register(_options.taskIdentifier, {
            minInterval: _options.minimumInterval * 1000,
          })
          this.periodicSyncRegistered = true
          console.log('Periodic background sync registered')
        } else {
          console.warn('Periodic background sync permission not granted')
        }
      } catch (error) {
        console.warn('Periodic background sync not supported:', error)
      }
    }
  }

  /**
   * Register background processing (not available on web)
   */
  async registerBackgroundProcessing(_options: {
    taskIdentifier: string
    requiresNetworkConnectivity?: boolean
    requiresExternalPower?: boolean
  }): Promise<void> {
    console.log('Background processing not available on web')
  }

  /**
   * Schedule one-time work (uses Background Sync API)
   */
  async scheduleOneTimeWork(options: {
    taskIdentifier: string
    constraints: Partial<BackgroundSyncConfig>
    initialDelay?: number
    inputData?: Record<string, unknown>
  }): Promise<{ workId: string }> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        // @ts-ignore
        await registration.sync.register(options.taskIdentifier)
        return { workId: options.taskIdentifier }
      } catch (error) {
        console.error('Failed to register sync:', error)
      }
    }

    return { workId: '' }
  }

  /**
   * Schedule periodic work (uses Periodic Background Sync API)
   */
  async schedulePeriodicWork(options: {
    taskIdentifier: string
    repeatInterval: number
    flexInterval?: number
    constraints: Partial<BackgroundSyncConfig>
  }): Promise<{ workId: string }> {
    await this.registerBackgroundFetch({
      taskIdentifier: options.taskIdentifier,
      minimumInterval: options.repeatInterval / 1000,
    })

    return { workId: options.taskIdentifier }
  }

  /**
   * Cancel work
   */
  async cancelWork(options: { workId?: string; taskIdentifier?: string }): Promise<void> {
    if (
      this.periodicSyncRegistered &&
      'serviceWorker' in navigator &&
      'periodicSync' in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready
        const tag = options.workId || options.taskIdentifier
        if (tag) {
          // @ts-ignore
          await registration.periodicSync.unregister(tag)
        }
      } catch (error) {
        console.error('Failed to cancel periodic sync:', error)
      }
    }
  }

  /**
   * Complete background task (no-op on web)
   */
  async completeBackgroundTask(_options: {
    taskIdentifier: string
    result: BackgroundTaskResult
  }): Promise<void> {
    console.log('Background task completion (web - no-op)')
  }

  /**
   * Check if background fetch is available
   */
  async isBackgroundFetchAvailable(): Promise<{ available: boolean }> {
    const hasSyncApi =
      'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype

    return { available: hasSyncApi }
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

    // Set up service worker message listener if needed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === eventName) {
          this.listeners.get(eventName)?.forEach((listener) => {
            listener(event.data.payload)
          })
        }
      })
    }

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

// =============================================================================
// Service Worker Registration Helper
// =============================================================================

/**
 * Register service worker with background sync support
 */
export async function registerBackgroundSyncServiceWorker(
  swPath: string = '/sw.js'
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath)
    console.log('Service worker registered:', registration)
    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

// =============================================================================
// Service Worker Script Template
// =============================================================================

/**
 * Template for service worker background sync handler.
 * Include this in your service worker file (sw.js)
 *
 * @example
 * // sw.js
 * self.addEventListener('sync', (event) => {
 *   if (event.tag === 'io.nself.chat.backgroundSync') {
 *     event.waitUntil(performBackgroundSync());
 *   }
 * });
 *
 * self.addEventListener('periodicsync', (event) => {
 *   if (event.tag === 'io.nself.chat.backgroundSync') {
 *     event.waitUntil(performBackgroundSync());
 *   }
 * });
 *
 * async function performBackgroundSync() {
 *   // Send message to main thread
 *   const clients = await self.clients.matchAll();
 *   clients.forEach(client => {
 *     client.postMessage({
 *       type: 'backgroundFetch',
 *       payload: { taskIdentifier: 'io.nself.chat.backgroundSync' }
 *     });
 *   });
 * }
 */
export const SERVICE_WORKER_TEMPLATE = `
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('io.nself.chat')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag.startsWith('io.nself.chat')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

async function handleBackgroundSync(tag) {
  console.log('[SW] Background sync triggered:', tag);

  // Notify all clients
  const clients = await self.clients.matchAll({ type: 'window' });

  for (const client of clients) {
    client.postMessage({
      type: 'backgroundFetch',
      payload: { taskIdentifier: tag }
    });
  }

  // If no clients are open, you could perform sync directly here
  if (clients.length === 0) {
    // Perform direct sync
    // await performDirectSync();
  }
}
`
