/**
 * @nself-chat/state - Shared state management and offline sync
 *
 * This package provides centralized state management using Zustand with
 * offline-first capabilities, cross-tab sync, and conflict resolution.
 *
 * ## Features
 *
 * - **Zustand Stores**: Type-safe reactive state management
 * - **Offline Queue**: Automatic action queuing when offline
 * - **Storage Sync**: Persist state to localStorage/sessionStorage
 * - **Cross-Tab Sync**: Synchronize state across browser tabs
 * - **Conflict Resolution**: Handle sync conflicts with multiple strategies
 * - **React Contexts**: Context providers for backward compatibility
 *
 * ## Usage
 *
 * ### Using Stores
 *
 * ```typescript
 * import { useUserStore, selectCurrentUser } from '@nself-chat/state'
 *
 * function MyComponent() {
 *   const currentUser = useUserStore(selectCurrentUser)
 *   const setUser = useUserStore(state => state.setCurrentUser)
 *
 *   return <div>{currentUser?.displayName}</div>
 * }
 * ```
 *
 * ### Using Offline Queue
 *
 * ```typescript
 * import { createOfflineQueue } from '@nself-chat/state'
 *
 * const queue = createOfflineQueue({ maxQueueSize: 1000 })
 *
 * // Add action to queue
 * queue.enqueue('SEND_MESSAGE', { content: 'Hello' })
 *
 * // Process queue when online
 * await queue.processQueue(async (action) => {
 *   await api.executeAction(action)
 * })
 * ```
 *
 * ### Using Storage Sync
 *
 * ```typescript
 * import { createStorageSync } from '@nself-chat/state'
 *
 * const sync = createStorageSync('my-store', {
 *   autoSync: true,
 *   debounceMs: 300
 * })
 *
 * // Load state
 * const state = sync.load()
 *
 * // Save state
 * sync.save(myState)
 * ```
 *
 * @packageDocumentation
 * @module @nself-chat/state
 */

// Package metadata
export const PACKAGE_VERSION = '0.9.2'
export const PACKAGE_NAME = '@nself-chat/state'

// ============================================================================
// Stores
// ============================================================================

export * from './stores'

// ============================================================================
// Contexts
// ============================================================================

// NOTE: Contexts are not exported from this package due to app-specific
// dependencies (auth services, config, logger, etc.). They should be
// imported directly from the web app or adapted per application.
// export * from './contexts'

// ============================================================================
// Sync Utilities
// ============================================================================

export * from './sync'

// ============================================================================
// Utils
// ============================================================================

export * from './utils'

// ============================================================================
// Types
// ============================================================================

export * from './types'
