/**
 * Offline Sync
 *
 * Manages offline queue and synchronization with the server.
 *
 * @packageDocumentation
 * @module @nself-chat/state/sync/offline-sync
 */

import type { QueuedAction, OfflineQueueConfig, SyncResult } from '../types/sync'
import { getStorageItem, setStorageItem } from '../utils/persist'

/**
 * Generate unique ID for queued actions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(retryCount: number, config: OfflineQueueConfig): number {
  return config.retryDelay * Math.pow(config.backoffMultiplier, retryCount)
}

/**
 * Creates an offline queue manager
 */
export function createOfflineQueue(config: Partial<OfflineQueueConfig> = {}) {
  const fullConfig: OfflineQueueConfig = {
    enabled: config.enabled ?? true,
    maxQueueSize: config.maxQueueSize ?? 1000,
    maxRetries: config.maxRetries ?? 3,
    retryDelay: config.retryDelay ?? 1000,
    backoffMultiplier: config.backoffMultiplier ?? 2,
  }

  const QUEUE_KEY = 'nchat:offline-queue'
  let queue: QueuedAction[] = []
  let processing = false

  /**
   * Load queue from storage
   */
  function loadQueue(): QueuedAction[] {
    const stored = getStorageItem<QueuedAction[]>(QUEUE_KEY)
    return stored ?? []
  }

  /**
   * Save queue to storage
   */
  function saveQueue(): void {
    setStorageItem(QUEUE_KEY, queue)
  }

  /**
   * Initialize queue from storage
   */
  function initialize(): void {
    if (!fullConfig.enabled) return
    queue = loadQueue()
  }

  /**
   * Add action to queue
   */
  function enqueue<TPayload>(type: string, payload: TPayload): QueuedAction<TPayload> | null {
    if (!fullConfig.enabled) return null
    if (queue.length >= fullConfig.maxQueueSize) {
      // Queue is full - remove oldest pending action
      const oldestIndex = queue.findIndex((action) => action.status === 'pending')
      if (oldestIndex >= 0) {
        queue.splice(oldestIndex, 1)
      }
    }

    const action: QueuedAction<TPayload> = {
      id: generateId(),
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: fullConfig.maxRetries,
      status: 'pending',
    }

    queue.push(action)
    saveQueue()

    return action
  }

  /**
   * Remove action from queue
   */
  function dequeue(actionId: string): boolean {
    const index = queue.findIndex((action) => action.id === actionId)
    if (index >= 0) {
      queue.splice(index, 1)
      saveQueue()
      return true
    }
    return false
  }

  /**
   * Update action status
   */
  function updateAction(actionId: string, updates: Partial<QueuedAction>): boolean {
    const action = queue.find((a) => a.id === actionId)
    if (action) {
      Object.assign(action, updates)
      saveQueue()
      return true
    }
    return false
  }

  /**
   * Get pending actions
   */
  function getPendingActions(): QueuedAction[] {
    return queue.filter((action) => action.status === 'pending')
  }

  /**
   * Get failed actions
   */
  function getFailedActions(): QueuedAction[] {
    return queue.filter((action) => action.status === 'failed')
  }

  /**
   * Process queue with a handler function
   */
  async function processQueue(
    handler: (action: QueuedAction) => Promise<void>
  ): Promise<SyncResult> {
    if (processing) {
      return {
        success: false,
        itemsSynced: 0,
        conflicts: [],
        errors: [{ message: 'Queue is already being processed' }],
      }
    }

    processing = true
    const errors: Array<{ message: string; code?: string }> = []
    let itemsSynced = 0

    const pendingActions = getPendingActions()

    for (const action of pendingActions) {
      updateAction(action.id, { status: 'processing' })

      try {
        await handler(action)
        dequeue(action.id)
        itemsSynced++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (action.retryCount < action.maxRetries) {
          // Schedule retry
          const delay = calculateRetryDelay(action.retryCount, fullConfig)
          updateAction(action.id, {
            status: 'pending',
            retryCount: action.retryCount + 1,
            error: errorMessage,
          })

          // Wait before next retry
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // Max retries reached
          updateAction(action.id, {
            status: 'failed',
            error: errorMessage,
          })
          errors.push({ message: errorMessage })
        }
      }
    }

    processing = false

    return {
      success: errors.length === 0,
      itemsSynced,
      conflicts: [],
      errors,
    }
  }

  /**
   * Clear queue
   */
  function clearQueue(): void {
    queue = []
    saveQueue()
  }

  /**
   * Get queue stats
   */
  function getStats() {
    return {
      total: queue.length,
      pending: queue.filter((a) => a.status === 'pending').length,
      processing: queue.filter((a) => a.status === 'processing').length,
      failed: queue.filter((a) => a.status === 'failed').length,
      completed: queue.filter((a) => a.status === 'completed').length,
    }
  }

  // Initialize on creation
  initialize()

  return {
    enqueue,
    dequeue,
    updateAction,
    getPendingActions,
    getFailedActions,
    processQueue,
    clearQueue,
    getStats,
    config: fullConfig,
  }
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Wait for online connection
 */
export function waitForOnline(): Promise<void> {
  if (isOnline()) return Promise.resolve()

  return new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline)
      resolve()
    }
    window.addEventListener('online', handleOnline)
  })
}

/**
 * Subscribe to online/offline events
 */
export function subscribeToConnectionChanges(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
