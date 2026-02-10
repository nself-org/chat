/**
 * Utils Index
 *
 * Barrel export for utility functions.
 *
 * @packageDocumentation
 * @module @nself-chat/state/utils
 */

// NOTE: createStore helpers removed due to complex Zustand middleware typing.
// Stores should be created directly using Zustand's create() API.
// export { createStore, createPersistedStore, createSlice } from './create-store'

export {
  safeJsonParse,
  safeJsonStringify,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorageWithPrefix,
  getStorageSize,
  isStorageAvailable,
  createNamespacedStorage,
  getStorageQuota,
} from './persist'
