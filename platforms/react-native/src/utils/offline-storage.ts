/**
 * Offline Storage Utilities
 * Persistent storage using MMKV (React Native) or AsyncStorage fallback
 */

import { MMKV } from 'react-native-mmkv'

// Initialize MMKV storage
const storage = new MMKV({
  id: 'nchat-storage',
  encryptionKey: 'nchat-encryption-key-change-in-production',
})

export interface StorageValue {
  value: any
  timestamp: number
  expiresAt?: number
}

/**
 * Storage service with TTL support
 */
export class OfflineStorage {
  /**
   * Set item in storage
   */
  static set(key: string, value: any, ttl?: number): void {
    const data: StorageValue = {
      value,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    }

    storage.set(key, JSON.stringify(data))
  }

  /**
   * Get item from storage
   */
  static get<T = any>(key: string): T | null {
    try {
      const item = storage.getString(key)
      if (!item) return null

      const data: StorageValue = JSON.parse(item)

      // Check if expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        this.delete(key)
        return null
      }

      return data.value as T
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  }

  /**
   * Delete item from storage
   */
  static delete(key: string): void {
    storage.delete(key)
  }

  /**
   * Check if key exists
   */
  static has(key: string): boolean {
    return storage.contains(key)
  }

  /**
   * Clear all storage
   */
  static clear(): void {
    storage.clearAll()
  }

  /**
   * Get all keys
   */
  static getAllKeys(): string[] {
    return storage.getAllKeys()
  }

  /**
   * Get storage size
   */
  static getSize(): number {
    const keys = storage.getAllKeys()
    let size = 0

    keys.forEach((key) => {
      const value = storage.getString(key)
      if (value) {
        size += value.length
      }
    })

    return size
  }

  /**
   * Set multiple items
   */
  static setMultiple(items: Record<string, any>): void {
    Object.entries(items).forEach(([key, value]) => {
      this.set(key, value)
    })
  }

  /**
   * Get multiple items
   */
  static getMultiple(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {}

    keys.forEach((key) => {
      const value = this.get(key)
      if (value !== null) {
        result[key] = value
      }
    })

    return result
  }

  /**
   * Delete multiple items
   */
  static deleteMultiple(keys: string[]): void {
    keys.forEach((key) => {
      this.delete(key)
    })
  }
}

/**
 * Message cache for offline access
 */
export class MessageCache {
  private static prefix = 'message:'

  static setMessage(channelId: string, messageId: string, message: any): void {
    const key = `${this.prefix}${channelId}:${messageId}`
    OfflineStorage.set(key, message)
  }

  static getMessage(channelId: string, messageId: string): any | null {
    const key = `${this.prefix}${channelId}:${messageId}`
    return OfflineStorage.get(key)
  }

  static setChannelMessages(channelId: string, messages: any[]): void {
    const key = `${this.prefix}channel:${channelId}`
    OfflineStorage.set(key, messages)
  }

  static getChannelMessages(channelId: string): any[] | null {
    const key = `${this.prefix}channel:${channelId}`
    return OfflineStorage.get(key)
  }

  static clearChannelMessages(channelId: string): void {
    const key = `${this.prefix}channel:${channelId}`
    OfflineStorage.delete(key)
  }

  static clearAllMessages(): void {
    const keys = OfflineStorage.getAllKeys()
    const messageKeys = keys.filter((key) => key.startsWith(this.prefix))
    OfflineStorage.deleteMultiple(messageKeys)
  }
}

/**
 * User data cache
 */
export class UserCache {
  private static prefix = 'user:'

  static setUser(userId: string, user: any): void {
    const key = `${this.prefix}${userId}`
    OfflineStorage.set(key, user)
  }

  static getUser(userId: string): any | null {
    const key = `${this.prefix}${userId}`
    return OfflineStorage.get(key)
  }

  static setCurrentUser(user: any): void {
    OfflineStorage.set(`${this.prefix}current`, user)
  }

  static getCurrentUser(): any | null {
    return OfflineStorage.get(`${this.prefix}current`)
  }

  static clearCurrentUser(): void {
    OfflineStorage.delete(`${this.prefix}current`)
  }

  static clearAllUsers(): void {
    const keys = OfflineStorage.getAllKeys()
    const userKeys = keys.filter((key) => key.startsWith(this.prefix))
    OfflineStorage.deleteMultiple(userKeys)
  }
}

/**
 * Channel cache
 */
export class ChannelCache {
  private static prefix = 'channel:'

  static setChannel(channelId: string, channel: any): void {
    const key = `${this.prefix}${channelId}`
    OfflineStorage.set(key, channel)
  }

  static getChannel(channelId: string): any | null {
    const key = `${this.prefix}${channelId}`
    return OfflineStorage.get(key)
  }

  static setChannels(channels: any[]): void {
    OfflineStorage.set(`${this.prefix}list`, channels)
  }

  static getChannels(): any[] | null {
    return OfflineStorage.get(`${this.prefix}list`)
  }

  static clearAllChannels(): void {
    const keys = OfflineStorage.getAllKeys()
    const channelKeys = keys.filter((key) => key.startsWith(this.prefix))
    OfflineStorage.deleteMultiple(channelKeys)
  }
}

/**
 * Sync queue for offline operations
 */
export class SyncQueue {
  private static prefix = 'sync:'

  static addToQueue(operation: any): void {
    const queue = this.getQueue()
    queue.push({
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0,
    })
    OfflineStorage.set(`${this.prefix}queue`, queue)
  }

  static getQueue(): any[] {
    return OfflineStorage.get(`${this.prefix}queue`) || []
  }

  static removeFromQueue(id: string): void {
    const queue = this.getQueue()
    const filtered = queue.filter((item) => item.id !== id)
    OfflineStorage.set(`${this.prefix}queue`, filtered)
  }

  static updateQueueItem(id: string, updates: any): void {
    const queue = this.getQueue()
    const index = queue.findIndex((item) => item.id === id)
    if (index !== -1) {
      queue[index] = { ...queue[index], ...updates }
      OfflineStorage.set(`${this.prefix}queue`, queue)
    }
  }

  static clearQueue(): void {
    OfflineStorage.delete(`${this.prefix}queue`)
  }

  static getQueueSize(): number {
    return this.getQueue().length
  }
}

/**
 * App preferences
 */
export class Preferences {
  private static prefix = 'pref:'

  static set(key: string, value: any): void {
    OfflineStorage.set(`${this.prefix}${key}`, value)
  }

  static get<T = any>(key: string, defaultValue?: T): T | null {
    const value = OfflineStorage.get<T>(`${this.prefix}${key}`)
    return value !== null ? value : (defaultValue ?? null)
  }

  static delete(key: string): void {
    OfflineStorage.delete(`${this.prefix}${key}`)
  }

  static clear(): void {
    const keys = OfflineStorage.getAllKeys()
    const prefKeys = keys.filter((key) => key.startsWith(this.prefix))
    OfflineStorage.deleteMultiple(prefKeys)
  }
}

// Export singleton
export default OfflineStorage
