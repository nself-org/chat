/**
 * Background Sync Service for Capacitor
 *
 * Provides background fetch and sync capabilities:
 * - iOS Background Fetch
 * - iOS Background Processing
 * - Android WorkManager
 * - Silent push triggered sync
 */

import { registerPlugin, PluginListenerHandle } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

// =============================================================================
// Types
// =============================================================================

export type BackgroundSyncStatus = 'idle' | 'syncing' | 'completed' | 'failed' | 'cancelled'

export type BackgroundTaskResult = 'newData' | 'noData' | 'failed'

export interface BackgroundSyncConfig {
  /** Minimum interval between syncs (seconds) */
  minimumInterval: number
  /** Whether to require network connectivity */
  requiresNetworkConnectivity: boolean
  /** Network type required */
  networkType: 'any' | 'unmetered' | 'not_roaming' | 'connected'
  /** Whether to require charging */
  requiresCharging: boolean
  /** Whether to require device idle */
  requiresDeviceIdle: boolean
  /** Whether to require storage not low */
  requiresStorageNotLow: boolean
  /** Whether to require battery not low */
  requiresBatteryNotLow: boolean
  /** Task identifier */
  taskIdentifier: string
}

export interface SyncTask {
  id: string
  type: SyncTaskType
  priority: 'high' | 'normal' | 'low'
  data: Record<string, unknown>
  createdAt: number
  attempts: number
  maxAttempts: number
  lastAttempt?: number
  error?: string
}

export type SyncTaskType =
  | 'send_message'
  | 'update_message'
  | 'delete_message'
  | 'mark_read'
  | 'update_status'
  | 'upload_file'
  | 'sync_channels'
  | 'sync_messages'
  | 'sync_users'
  | 'custom'

export interface SyncProgress {
  total: number
  completed: number
  failed: number
  pending: number
  currentTask?: string
}

export interface BackgroundSyncStats {
  lastSyncTime: number | null
  lastSyncResult: BackgroundTaskResult | null
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  averageDuration: number
  tasksProcessed: number
}

// =============================================================================
// Background Plugin Interface
// =============================================================================

export interface BackgroundPlugin {
  /**
   * Register background fetch (iOS/Android)
   */
  registerBackgroundFetch(options: {
    taskIdentifier: string
    minimumInterval: number
  }): Promise<void>

  /**
   * Register background processing task (iOS 13+)
   */
  registerBackgroundProcessing(options: {
    taskIdentifier: string
    requiresNetworkConnectivity?: boolean
    requiresExternalPower?: boolean
  }): Promise<void>

  /**
   * Schedule one-time work (Android WorkManager)
   */
  scheduleOneTimeWork(options: {
    taskIdentifier: string
    constraints: Partial<BackgroundSyncConfig>
    initialDelay?: number
    inputData?: Record<string, unknown>
  }): Promise<{ workId: string }>

  /**
   * Schedule periodic work (Android WorkManager)
   */
  schedulePeriodicWork(options: {
    taskIdentifier: string
    repeatInterval: number
    flexInterval?: number
    constraints: Partial<BackgroundSyncConfig>
  }): Promise<{ workId: string }>

  /**
   * Cancel work
   */
  cancelWork(options: { workId?: string; taskIdentifier?: string }): Promise<void>

  /**
   * Complete background task (must call within time limit)
   */
  completeBackgroundTask(options: {
    taskIdentifier: string
    result: BackgroundTaskResult
  }): Promise<void>

  /**
   * Check if background fetch is available
   */
  isBackgroundFetchAvailable(): Promise<{ available: boolean }>

  /**
   * Add listener for background task execution
   */
  addListener(
    eventName: 'backgroundFetch',
    listenerFunc: (data: { taskIdentifier: string }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Add listener for background processing
   */
  addListener(
    eventName: 'backgroundProcessing',
    listenerFunc: (data: { taskIdentifier: string }) => void
  ): Promise<PluginListenerHandle>

  /**
   * Remove all listeners
   */
  removeAllListeners(): Promise<void>
}

// =============================================================================
// Register Plugin
// =============================================================================

const Background = registerPlugin<BackgroundPlugin>('Background', {
  web: () => import('./background-sync-web').then((m) => new m.BackgroundSyncWeb()),
})

// =============================================================================
// Constants
// =============================================================================

const TASK_QUEUE_KEY = 'background_sync_queue'
const SYNC_STATS_KEY = 'background_sync_stats'
const LAST_SYNC_KEY = 'background_sync_last'
const TASK_IDENTIFIER = 'io.nself.chat.backgroundSync'
const PROCESSING_IDENTIFIER = 'io.nself.chat.backgroundProcessing'

// =============================================================================
// Background Sync Service
// =============================================================================

class BackgroundSyncService {
  private initialized = false
  private status: BackgroundSyncStatus = 'idle'
  private config: BackgroundSyncConfig = {
    minimumInterval: 900, // 15 minutes
    requiresNetworkConnectivity: true,
    networkType: 'any',
    requiresCharging: false,
    requiresDeviceIdle: false,
    requiresStorageNotLow: false,
    requiresBatteryNotLow: true,
    taskIdentifier: TASK_IDENTIFIER,
  }
  private taskQueue: SyncTask[] = []
  private stats: BackgroundSyncStats = {
    lastSyncTime: null,
    lastSyncResult: null,
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageDuration: 0,
    tasksProcessed: 0,
  }
  private listeners: PluginListenerHandle[] = []
  private taskHandlers: Map<SyncTaskType, (task: SyncTask) => Promise<boolean>> = new Map()
  private onProgressUpdate?: (progress: SyncProgress) => void
  private onSyncComplete?: (result: BackgroundTaskResult, stats: BackgroundSyncStats) => void

  /**
   * Initialize background sync
   */
  async initialize(config?: Partial<BackgroundSyncConfig>): Promise<boolean> {
    if (this.initialized) return true

    if (config) {
      this.config = { ...this.config, ...config }
    }

    try {
      // Check availability
      const { available } = await Background.isBackgroundFetchAvailable()
      if (!available) {
        console.warn('Background fetch not available on this device')
        return false
      }

      // Load persisted data
      await this.loadPersistedData()

      // Register background tasks
      await this.registerBackgroundTasks()

      // Set up listeners
      await this.setupListeners()

      this.initialized = true
      console.log('Background sync initialized', this.config)

      return true
    } catch (error) {
      console.error('Failed to initialize background sync:', error)
      return false
    }
  }

  /**
   * Register background tasks with the system
   */
  private async registerBackgroundTasks(): Promise<void> {
    const platform = Capacitor.getPlatform()

    if (platform === 'ios') {
      // Register iOS background fetch
      await Background.registerBackgroundFetch({
        taskIdentifier: TASK_IDENTIFIER,
        minimumInterval: this.config.minimumInterval,
      })

      // Register iOS background processing (iOS 13+)
      await Background.registerBackgroundProcessing({
        taskIdentifier: PROCESSING_IDENTIFIER,
        requiresNetworkConnectivity: this.config.requiresNetworkConnectivity,
        requiresExternalPower: this.config.requiresCharging,
      })
    } else if (platform === 'android') {
      // Register Android periodic work
      await Background.schedulePeriodicWork({
        taskIdentifier: TASK_IDENTIFIER,
        repeatInterval: this.config.minimumInterval * 1000,
        constraints: this.config,
      })
    }
  }

  /**
   * Set up event listeners
   */
  private async setupListeners(): Promise<void> {
    // Background fetch listener
    const fetchListener = await Background.addListener('backgroundFetch', async (data) => {
      console.log('Background fetch triggered:', data.taskIdentifier)
      await this.performSync('backgroundFetch')
    })
    this.listeners.push(fetchListener)

    // Background processing listener
    const processingListener = await Background.addListener(
      'backgroundProcessing',
      async (data) => {
        console.log('Background processing triggered:', data.taskIdentifier)
        await this.performSync('backgroundProcessing')
      }
    )
    this.listeners.push(processingListener)
  }

  /**
   * Perform sync operation
   */
  private async performSync(
    source: 'backgroundFetch' | 'backgroundProcessing' | 'manual' | 'silentPush'
  ): Promise<BackgroundTaskResult> {
    if (this.status === 'syncing') {
      console.log('Sync already in progress')
      return 'noData'
    }

    this.status = 'syncing'
    const startTime = Date.now()
    let result: BackgroundTaskResult = 'noData'
    let processedCount = 0
    let failedCount = 0

    try {
      // Reload queue from storage
      await this.loadTaskQueue()

      if (this.taskQueue.length === 0) {
        console.log('No tasks to sync')
        result = 'noData'
      } else {
        console.log(`Starting sync with ${this.taskQueue.length} tasks`)

        // Process tasks by priority
        const sortedTasks = this.sortTasksByPriority([...this.taskQueue])

        for (const task of sortedTasks) {
          // Update progress
          this.onProgressUpdate?.({
            total: sortedTasks.length,
            completed: processedCount,
            failed: failedCount,
            pending: sortedTasks.length - processedCount - failedCount,
            currentTask: task.type,
          })

          const success = await this.processTask(task)

          if (success) {
            processedCount++
            this.removeTaskFromQueue(task.id)
          } else {
            failedCount++
            this.updateTaskAttempt(task)
          }
        }

        result = processedCount > 0 ? 'newData' : failedCount > 0 ? 'failed' : 'noData'
      }

      this.status = 'completed'
    } catch (error) {
      console.error('Sync error:', error)
      this.status = 'failed'
      result = 'failed'
    }

    // Update stats
    const duration = Date.now() - startTime
    await this.updateStats(result, duration, processedCount)

    // Persist queue
    await this.saveTaskQueue()

    // Complete background task
    if (source === 'backgroundFetch' || source === 'backgroundProcessing') {
      await Background.completeBackgroundTask({
        taskIdentifier: source === 'backgroundFetch' ? TASK_IDENTIFIER : PROCESSING_IDENTIFIER,
        result,
      })
    }

    // Notify completion
    this.onSyncComplete?.(result, this.stats)

    return result
  }

  /**
   * Process a single task
   */
  private async processTask(task: SyncTask): Promise<boolean> {
    const handler = this.taskHandlers.get(task.type)

    if (!handler) {
      console.warn(`No handler for task type: ${task.type}`)
      return false
    }

    try {
      task.lastAttempt = Date.now()
      return await handler(task)
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error)
      task.error = error instanceof Error ? error.message : 'Unknown error'
      return false
    }
  }

  /**
   * Sort tasks by priority
   */
  private sortTasksByPriority(tasks: SyncTask[]): SyncTask[] {
    const priorityOrder = { high: 0, normal: 1, low: 2 }
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  /**
   * Add task to sync queue
   */
  async addTask(
    type: SyncTaskType,
    data: Record<string, unknown>,
    options?: {
      priority?: 'high' | 'normal' | 'low'
      maxAttempts?: number
    }
  ): Promise<string> {
    const task: SyncTask = {
      id: this.generateId(),
      type,
      priority: options?.priority || 'normal',
      data,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
    }

    this.taskQueue.push(task)
    await this.saveTaskQueue()

    console.log('Task added to sync queue:', task.id, task.type)

    return task.id
  }

  /**
   * Remove task from queue
   */
  private removeTaskFromQueue(taskId: string): void {
    this.taskQueue = this.taskQueue.filter((t) => t.id !== taskId)
  }

  /**
   * Update task attempt count
   */
  private updateTaskAttempt(task: SyncTask): void {
    task.attempts++
    if (task.attempts >= task.maxAttempts) {
      console.log(`Task ${task.id} exceeded max attempts, removing`)
      this.removeTaskFromQueue(task.id)
    }
  }

  /**
   * Register task handler
   */
  registerTaskHandler(type: SyncTaskType, handler: (task: SyncTask) => Promise<boolean>): void {
    this.taskHandlers.set(type, handler)
  }

  /**
   * Unregister task handler
   */
  unregisterTaskHandler(type: SyncTaskType): void {
    this.taskHandlers.delete(type)
  }

  /**
   * Trigger manual sync
   */
  async triggerSync(): Promise<BackgroundTaskResult> {
    return this.performSync('manual')
  }

  /**
   * Handle silent push (for background sync)
   */
  async handleSilentPush(_data: Record<string, unknown>): Promise<BackgroundTaskResult> {
    return this.performSync('silentPush')
  }

  /**
   * Get current status
   */
  getStatus(): BackgroundSyncStatus {
    return this.status
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.taskQueue.length
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): SyncTask[] {
    return [...this.taskQueue]
  }

  /**
   * Get sync stats
   */
  getStats(): BackgroundSyncStats {
    return { ...this.stats }
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: SyncProgress) => void): void {
    this.onProgressUpdate = callback
  }

  /**
   * Set completion callback
   */
  setCompletionCallback(
    callback: (result: BackgroundTaskResult, stats: BackgroundSyncStats) => void
  ): void {
    this.onSyncComplete = callback
  }

  /**
   * Clear all pending tasks
   */
  async clearQueue(): Promise<void> {
    this.taskQueue = []
    await this.saveTaskQueue()
  }

  /**
   * Cancel pending sync
   */
  cancelSync(): void {
    if (this.status === 'syncing') {
      this.status = 'cancelled'
    }
  }

  /**
   * Load persisted data
   */
  private async loadPersistedData(): Promise<void> {
    await this.loadTaskQueue()
    await this.loadStats()
  }

  /**
   * Load task queue from storage
   */
  private async loadTaskQueue(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: TASK_QUEUE_KEY })
      if (value) {
        this.taskQueue = JSON.parse(value)
      }
    } catch (error) {
      console.error('Error loading task queue:', error)
      this.taskQueue = []
    }
  }

  /**
   * Save task queue to storage
   */
  private async saveTaskQueue(): Promise<void> {
    try {
      await Preferences.set({
        key: TASK_QUEUE_KEY,
        value: JSON.stringify(this.taskQueue),
      })
    } catch (error) {
      console.error('Error saving task queue:', error)
    }
  }

  /**
   * Load stats from storage
   */
  private async loadStats(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: SYNC_STATS_KEY })
      if (value) {
        this.stats = JSON.parse(value)
      }
    } catch (error) {
      console.error('Error loading sync stats:', error)
    }
  }

  /**
   * Update and save stats
   */
  private async updateStats(
    result: BackgroundTaskResult,
    duration: number,
    tasksProcessed: number
  ): Promise<void> {
    this.stats.lastSyncTime = Date.now()
    this.stats.lastSyncResult = result
    this.stats.totalSyncs++
    this.stats.tasksProcessed += tasksProcessed

    if (result === 'newData') {
      this.stats.successfulSyncs++
    } else if (result === 'failed') {
      this.stats.failedSyncs++
    }

    // Update average duration
    const totalDuration = this.stats.averageDuration * (this.stats.totalSyncs - 1) + duration
    this.stats.averageDuration = totalDuration / this.stats.totalSyncs

    try {
      await Preferences.set({
        key: SYNC_STATS_KEY,
        value: JSON.stringify(this.stats),
      })
    } catch (error) {
      console.error('Error saving sync stats:', error)
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Clean up
   */
  async cleanup(): Promise<void> {
    await Background.removeAllListeners()
    this.listeners = []
    this.initialized = false
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const backgroundSync = new BackgroundSyncService()

// =============================================================================
// React Hook
// =============================================================================

import * as React from 'react'

export interface UseBackgroundSyncResult {
  status: BackgroundSyncStatus
  queueSize: number
  stats: BackgroundSyncStats
  progress: SyncProgress | null
  addTask: (
    type: SyncTaskType,
    data: Record<string, unknown>,
    priority?: 'high' | 'normal' | 'low'
  ) => Promise<string>
  triggerSync: () => Promise<BackgroundTaskResult>
  clearQueue: () => Promise<void>
}

export function useBackgroundSync(): UseBackgroundSyncResult {
  const [status, setStatus] = React.useState<BackgroundSyncStatus>('idle')
  const [queueSize, setQueueSize] = React.useState(0)
  const [stats, setStats] = React.useState<BackgroundSyncStats>(backgroundSync.getStats())
  const [progress, setProgress] = React.useState<SyncProgress | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function init() {
      await backgroundSync.initialize()

      if (!mounted) return

      setQueueSize(backgroundSync.getQueueSize())
      setStats(backgroundSync.getStats())

      backgroundSync.setProgressCallback((p) => {
        if (mounted) {
          setProgress(p)
          setStatus('syncing')
        }
      })

      backgroundSync.setCompletionCallback((result, newStats) => {
        if (mounted) {
          setStatus(result === 'failed' ? 'failed' : 'completed')
          setStats(newStats)
          setProgress(null)
          setQueueSize(backgroundSync.getQueueSize())
        }
      })
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const addTask = React.useCallback(
    async (
      type: SyncTaskType,
      data: Record<string, unknown>,
      priority?: 'high' | 'normal' | 'low'
    ) => {
      const taskId = await backgroundSync.addTask(type, data, { priority })
      setQueueSize(backgroundSync.getQueueSize())
      return taskId
    },
    []
  )

  const triggerSync = React.useCallback(async () => {
    setStatus('syncing')
    return backgroundSync.triggerSync()
  }, [])

  const clearQueue = React.useCallback(async () => {
    await backgroundSync.clearQueue()
    setQueueSize(0)
  }, [])

  return {
    status,
    queueSize,
    stats,
    progress,
    addTask,
    triggerSync,
    clearQueue,
  }
}
