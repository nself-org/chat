/**
 * Storage Adapter for Desktop
 *
 * Provides a unified storage interface using electron-store
 * Compatible with LocalStorage interface for web compatibility
 */

import Store from 'electron-store'

/**
 * Storage adapter interface matching Web Storage API
 */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
  keys(): string[]
}

/**
 * Create electron-store instance
 */
const store = new Store({
  name: 'nself-chat',
  clearInvalidConfig: true,
})

/**
 * Desktop storage implementation using electron-store
 *
 * Provides persistent storage across app restarts
 *
 * @example
 * ```typescript
 * import { desktopStorage } from '@/adapters/storage'
 *
 * // Store data
 * desktopStorage.setItem('user_token', 'abc123')
 *
 * // Retrieve data
 * const token = desktopStorage.getItem('user_token')
 *
 * // Remove data
 * desktopStorage.removeItem('user_token')
 *
 * // Clear all data
 * desktopStorage.clear()
 * ```
 */
export const desktopStorage: StorageAdapter = {
  /**
   * Get an item from storage
   */
  getItem(key: string): string | null {
    try {
      const value = store.get(key)
      return value !== undefined ? String(value) : null
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error)
      return null
    }
  },

  /**
   * Set an item in storage
   */
  setItem(key: string, value: string): void {
    try {
      store.set(key, value)
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error)
      throw error
    }
  },

  /**
   * Remove an item from storage
   */
  removeItem(key: string): void {
    try {
      store.delete(key)
    } catch (error) {
      console.error(`[Storage] Error removing item ${key}:`, error)
      throw error
    }
  },

  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      store.clear()
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error)
      throw error
    }
  },

  /**
   * Get all keys in storage
   */
  keys(): string[] {
    try {
      return Object.keys(store.store)
    } catch (error) {
      console.error('[Storage] Error getting keys:', error)
      return []
    }
  },
}

/**
 * Typed storage helpers for common use cases
 */
export const typedStorage = {
  /**
   * Get a JSON object from storage
   */
  getJSON<T>(key: string): T | null {
    const value = desktopStorage.getItem(key)
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  },

  /**
   * Set a JSON object in storage
   */
  setJSON<T>(key: string, value: T): void {
    desktopStorage.setItem(key, JSON.stringify(value))
  },

  /**
   * Get a boolean from storage
   */
  getBoolean(key: string): boolean | null {
    const value = desktopStorage.getItem(key)
    if (value === null) return null
    return value === 'true'
  },

  /**
   * Set a boolean in storage
   */
  setBoolean(key: string, value: boolean): void {
    desktopStorage.setItem(key, value.toString())
  },

  /**
   * Get a number from storage
   */
  getNumber(key: string): number | null {
    const value = desktopStorage.getItem(key)
    if (value === null) return null
    const num = Number(value)
    return isNaN(num) ? null : num
  },

  /**
   * Set a number in storage
   */
  setNumber(key: string, value: number): void {
    desktopStorage.setItem(key, value.toString())
  },
}

/**
 * Get the electron-store instance for advanced usage
 */
export function getStore(): Store {
  return store
}

/**
 * Get the storage file path
 */
export function getStoragePath(): string {
  return store.path
}

export default desktopStorage
