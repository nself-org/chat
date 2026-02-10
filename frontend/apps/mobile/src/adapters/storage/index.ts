/**
 * Storage Adapter for nself-chat Mobile
 *
 * Provides a unified storage interface using Capacitor Preferences API
 * Compatible with LocalStorage interface for web compatibility
 */

import { Preferences } from '@capacitor/preferences'

/**
 * Storage adapter interface matching Web Storage API
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

/**
 * Mobile storage implementation using Capacitor Preferences
 *
 * @example
 * ```typescript
 * import { mobileStorage } from '@/adapters/storage'
 *
 * // Store data
 * await mobileStorage.setItem('user_token', 'abc123')
 *
 * // Retrieve data
 * const token = await mobileStorage.getItem('user_token')
 *
 * // Remove data
 * await mobileStorage.removeItem('user_token')
 *
 * // Clear all data
 * await mobileStorage.clear()
 * ```
 */
export const mobileStorage: StorageAdapter = {
  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key })
      return value
    } catch (error) {
      console.error(`[Storage] Error getting item ${key}:`, error)
      return null
    }
  },

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value })
    } catch (error) {
      console.error(`[Storage] Error setting item ${key}:`, error)
      throw error
    }
  },

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await Preferences.remove({ key })
    } catch (error) {
      console.error(`[Storage] Error removing item ${key}:`, error)
      throw error
    }
  },

  /**
   * Clear all items from storage
   */
  async clear(): Promise<void> {
    try {
      await Preferences.clear()
    } catch (error) {
      console.error('[Storage] Error clearing storage:', error)
      throw error
    }
  },

  /**
   * Get all keys in storage
   */
  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys()
      return keys
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
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await mobileStorage.getItem(key)
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
  async setJSON<T>(key: string, value: T): Promise<void> {
    await mobileStorage.setItem(key, JSON.stringify(value))
  },

  /**
   * Get a boolean from storage
   */
  async getBoolean(key: string): Promise<boolean | null> {
    const value = await mobileStorage.getItem(key)
    if (value === null) return null
    return value === 'true'
  },

  /**
   * Set a boolean in storage
   */
  async setBoolean(key: string, value: boolean): Promise<void> {
    await mobileStorage.setItem(key, value.toString())
  },

  /**
   * Get a number from storage
   */
  async getNumber(key: string): Promise<number | null> {
    const value = await mobileStorage.getItem(key)
    if (value === null) return null
    const num = Number(value)
    return isNaN(num) ? null : num
  },

  /**
   * Set a number in storage
   */
  async setNumber(key: string, value: number): Promise<void> {
    await mobileStorage.setItem(key, value.toString())
  },
}

export default mobileStorage
