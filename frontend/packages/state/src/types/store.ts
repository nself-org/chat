/**
 * Store Type Definitions
 *
 * Common types used across all Zustand stores in the state package.
 *
 * @packageDocumentation
 * @module @nself-chat/state/types/store
 */

/**
 * Generic store state type for type safety
 */
export interface StoreState {
  [key: string]: unknown
}

/**
 * Generic store actions type
 */
export interface StoreActions {
  [key: string]: (...args: unknown[]) => unknown
}

/**
 * Combined store type (state + actions)
 */
export type Store<TState extends StoreState, TActions extends StoreActions> = TState & TActions

/**
 * Store slice type for composable stores
 */
export type StoreSlice<T> = (
  set: (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => void,
  get: () => T
) => T

/**
 * Store selector type
 */
export type StoreSelector<TStore, TResult> = (state: TStore) => TResult

/**
 * Store subscription callback type
 */
export type StoreSubscriber<TStore> = (state: TStore, prevState: TStore) => void

/**
 * Middleware options for Zustand stores
 */
export interface StoreMiddlewareOptions {
  /**
   * Enable Redux DevTools integration
   * @default true in development, false in production
   */
  devtools?: boolean

  /**
   * Enable persistence to localStorage/sessionStorage
   * @default false
   */
  persist?: boolean

  /**
   * Enable subscribe with selector middleware
   * @default false
   */
  subscribeWithSelector?: boolean

  /**
   * Enable immer middleware for immutable updates
   * @default true
   */
  immer?: boolean
}

/**
 * Persistence options for stores
 */
export interface PersistOptions<T> {
  /**
   * Storage key name
   */
  name: string

  /**
   * Storage engine (localStorage, sessionStorage, or custom)
   */
  storage?: Storage | 'localStorage' | 'sessionStorage'

  /**
   * Partial persistence - only persist specific keys
   */
  partialize?: (state: T) => Partial<T>

  /**
   * State migration for version upgrades
   */
  version?: number
  migrate?: (persistedState: unknown, version: number) => T | Promise<T>

  /**
   * Merge strategy when rehydrating
   */
  merge?: (persistedState: unknown, currentState: T) => T
}

/**
 * Reset action that all stores should implement
 */
export interface ResetAction {
  reset: () => void
}

/**
 * Loading state pattern used across stores
 */
export interface LoadingState {
  isLoading: boolean
  isLoadingMore?: boolean
  error: string | null
}

/**
 * Pagination state pattern
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

/**
 * Search/filter state pattern
 */
export interface SearchState {
  query: string
  filters: Record<string, unknown>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
