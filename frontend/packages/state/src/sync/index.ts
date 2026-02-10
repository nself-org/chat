/**
 * Sync Index
 *
 * Barrel export for synchronization utilities.
 *
 * @packageDocumentation
 * @module @nself-chat/state/sync
 */

export {
  createStorageSync,
  createCrossTabSync,
  createBroadcastSync,
} from './storage-sync'

export {
  createOfflineQueue,
  isOnline,
  waitForOnline,
  subscribeToConnectionChanges,
} from './offline-sync'

export {
  resolveServerWins,
  resolveClientWins,
  resolveLastWriteWins,
  resolveConflict,
  mergeWithConflictDetection,
  detectConflicts,
  threeWayMerge,
} from './conflict-resolution'
