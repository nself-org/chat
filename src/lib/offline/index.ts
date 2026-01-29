/**
 * Offline Module - Central export for all offline functionality
 *
 * Provides offline mode support including:
 * - Network detection
 * - Connection management
 * - Offline storage (IndexedDB)
 * - Cache management
 * - Action queue
 * - Sync management
 * - Retry logic
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Connection types
  ConnectionState,
  NetworkQuality,
  ConnectionType,
  EffectiveConnectionType,
  ConnectionInfo,
  SocketConnectionState,

  // Queue types
  QueuedActionType,
  QueuePriority,
  QueueItemStatus,
  QueuedAction,
  QueuedSendMessage,
  QueuedEditMessage,
  QueuedDeleteMessage,
  QueuedReaction,
  QueuedAttachment,

  // Cache types
  CacheMetadata,
  CachedChannel,
  CachedMessage,
  CachedReaction,
  CachedAttachmentMeta,
  CachedUser,
  CacheStats,

  // Sync types
  SyncOperationType,
  SyncStatus,
  SyncState,
  SyncResult,
  SyncError,

  // Storage types
  StoreName,
  DatabaseConfig,
  StoreConfig,
  IndexConfig,

  // Retry types
  RetryStrategy,
  RetryConfig,
  RetryState,

  // Event types
  OfflineEventType,
  OfflineEvent,

  // Config types
  OfflineConfig,
} from './offline-types';

export { DEFAULT_OFFLINE_CONFIG } from './offline-types';

// =============================================================================
// Network Detection
// =============================================================================

export {
  NetworkDetector,
  getNetworkDetector,
  cleanupNetworkDetector,
  formatOfflineDuration,
  getConnectionStateText,
  getNetworkQualityText,
  type NetworkChangeListener,
} from './network-detector';

// =============================================================================
// Connection Management
// =============================================================================

export {
  ConnectionManager,
  getConnectionManager,
  initializeConnectionManager,
  cleanupConnectionManager,
  type CombinedConnectionState,
  type ConnectionStateListener,
  type ConnectionManagerOptions,
} from './connection-manager';

// =============================================================================
// Retry Management
// =============================================================================

export {
  RetryManager,
  createRetryManager,
  withRetry,
  makeRetryable,
  sleep,
  calculateRetryDelay,
  formatRetryDelay,
  type RetryResult,
  type RetryOperation,
  type RetryCondition,
  type RetryProgressCallback,
  type RetryOptions,
} from './retry-manager';

// =============================================================================
// Offline Storage
// =============================================================================

export {
  // Database
  openDatabase,
  closeDatabase,
  deleteDatabase,
  DATABASE_CONFIG,

  // Generic operations
  get,
  getAll,
  getByIndex,
  put,
  putMany,
  remove,
  removeMany,
  clear,
  count,

  // Typed storage
  channelStorage,
  messageStorage,
  userStorage,
  queueStorage,
  cacheMetaStorage,
  settingsStorage,

  // Stats
  getStorageStats,
} from './offline-storage';

// =============================================================================
// Offline Cache
// =============================================================================

export {
  OfflineCache,
  getOfflineCache,
  initializeOfflineCache,
  cleanupOfflineCache,
  type CacheEventType,
  type CacheEventListener,
} from './offline-cache';

// =============================================================================
// Offline Queue
// =============================================================================

export {
  OfflineQueue,
  getOfflineQueue,
  initializeOfflineQueue,
  cleanupOfflineQueue,
  type QueueEventType,
  type QueueEventListener,
  type ActionProcessor,
} from './offline-queue';

// =============================================================================
// Offline Sync
// =============================================================================

export {
  OfflineSync,
  getOfflineSync,
  initializeOfflineSync,
  cleanupOfflineSync,
  type SyncEventType,
  type SyncEventListener,
  type DataFetchers,
  type SyncOptions,
} from './offline-sync';

// =============================================================================
// Initialization Helper
// =============================================================================

import { initializeConnectionManager, cleanupConnectionManager } from './connection-manager';
import { initializeOfflineCache, cleanupOfflineCache } from './offline-cache';
import { initializeOfflineQueue, cleanupOfflineQueue } from './offline-queue';
import { initializeOfflineSync, cleanupOfflineSync, type DataFetchers } from './offline-sync';
import type { OfflineConfig, ConnectionManagerOptions } from './offline-types';

export interface OfflineSystemOptions {
  config?: Partial<OfflineConfig>;
  connectionOptions?: Partial<ConnectionManagerOptions>;
  fetchers?: DataFetchers;
  token?: string;
}

/**
 * Initialize the complete offline system
 */
export function initializeOfflineSystem(options: OfflineSystemOptions = {}): void {
  // Initialize connection manager
  initializeConnectionManager(options.token, options.connectionOptions);

  // Initialize cache
  initializeOfflineCache(options.config);

  // Initialize queue
  initializeOfflineQueue(options.config);

  // Initialize sync (if fetchers provided)
  if (options.fetchers) {
    initializeOfflineSync(options.fetchers);
  }

  console.log('[Offline] System initialized');
}

/**
 * Cleanup the complete offline system
 */
export function cleanupOfflineSystem(): void {
  cleanupOfflineSync();
  cleanupOfflineQueue();
  cleanupOfflineCache();
  cleanupConnectionManager();

  console.log('[Offline] System cleaned up');
}
