/**
 * Sync Type Definitions
 *
 * Types for state synchronization, offline queue, and conflict resolution.
 *
 * @packageDocumentation
 * @module @nself-chat/state/types/sync
 */

/**
 * Sync status states
 */
export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'

/**
 * Sync operation types
 */
export type SyncOperation =
  | 'initial-sync'
  | 'incremental-sync'
  | 'manual-sync'
  | 'background-sync'
  | 'queue-sync'

/**
 * Conflict resolution strategies
 */
export type ConflictStrategy =
  | 'server-wins' // Server version always takes precedence
  | 'client-wins' // Client version always takes precedence
  | 'last-write-wins' // Most recent timestamp wins
  | 'manual' // Require manual resolution

/**
 * Sync state for tracking synchronization progress
 */
export interface SyncState {
  status: SyncStatus
  operation: SyncOperation | null
  progress: number // 0-100
  itemsProcessed: number
  itemsTotal: number
  lastSyncAt: Date | null
  lastSuccessfulSyncAt: Date | null
  error: string | null
  pendingChanges: number
}

/**
 * Queued action for offline support
 */
export interface QueuedAction<TPayload = unknown> {
  id: string
  type: string
  payload: TPayload
  timestamp: Date
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'failed' | 'completed'
  error?: string
}

/**
 * Conflict detected during sync
 */
export interface SyncConflict<TData = unknown> {
  id: string
  entityType: string
  entityId: string
  clientVersion: TData
  serverVersion: TData
  clientTimestamp: Date
  serverTimestamp: Date
  strategy: ConflictStrategy
  resolved: boolean
  resolution?: TData
}

/**
 * Sync result from a synchronization operation
 */
export interface SyncResult {
  success: boolean
  itemsSynced: number
  conflicts: SyncConflict[]
  errors: Array<{ message: string; code?: string }>
}

/**
 * Offline queue configuration
 */
export interface OfflineQueueConfig {
  /**
   * Enable offline queue
   * @default true
   */
  enabled: boolean

  /**
   * Maximum queue size
   * @default 1000
   */
  maxQueueSize: number

  /**
   * Maximum retry attempts per action
   * @default 3
   */
  maxRetries: number

  /**
   * Retry delay in milliseconds
   * @default 1000
   */
  retryDelay: number

  /**
   * Exponential backoff multiplier
   * @default 2
   */
  backoffMultiplier: number
}

/**
 * Storage sync configuration
 */
export interface StorageSyncConfig {
  /**
   * Enable automatic sync to localStorage
   * @default true
   */
  autoSync: boolean

  /**
   * Debounce delay for sync in milliseconds
   * @default 300
   */
  debounceMs: number

  /**
   * Storage key prefix
   * @default 'nchat'
   */
  keyPrefix: string

  /**
   * Encrypt stored data
   * @default false
   */
  encrypt: boolean
}

/**
 * Cache stats for offline storage
 */
export interface CacheStats {
  totalItems: number
  totalSize: number // bytes
  oldestItem: Date | null
  newestItem: Date | null
  cacheHitRate: number // 0-1
}

/**
 * Offline configuration
 */
export interface OfflineConfig {
  /**
   * Enable offline mode
   * @default true
   */
  enabled: boolean

  /**
   * Queue configuration
   */
  queue: OfflineQueueConfig

  /**
   * Storage configuration
   */
  storage: StorageSyncConfig

  /**
   * Default conflict resolution strategy
   */
  conflictStrategy: ConflictStrategy
}

/**
 * Default offline configuration
 */
export const DEFAULT_OFFLINE_CONFIG: OfflineConfig = {
  enabled: true,
  queue: {
    enabled: true,
    maxQueueSize: 1000,
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  storage: {
    autoSync: true,
    debounceMs: 300,
    keyPrefix: 'nchat',
    encrypt: false,
  },
  conflictStrategy: 'last-write-wins',
}
