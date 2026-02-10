/**
 * Type Definitions Index
 *
 * Barrel export for all state management types.
 *
 * @packageDocumentation
 * @module @nself-chat/state/types
 */

// Store types
export type {
  StoreState,
  StoreActions,
  Store,
  StoreSlice,
  StoreSelector,
  StoreSubscriber,
  StoreMiddlewareOptions,
  PersistOptions,
  ResetAction,
  LoadingState,
  PaginationState,
  SearchState,
} from './store'

// Sync types
export type {
  SyncStatus,
  SyncOperation,
  ConflictStrategy,
  SyncState,
  QueuedAction,
  SyncConflict,
  SyncResult,
  OfflineQueueConfig,
  StorageSyncConfig,
  CacheStats,
  OfflineConfig,
} from './sync'

export { DEFAULT_OFFLINE_CONFIG } from './sync'
