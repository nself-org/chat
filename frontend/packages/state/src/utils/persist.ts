/**
 * Persistence Utilities
 *
 * Helper functions for localStorage/sessionStorage persistence.
 *
 * @packageDocumentation
 * @module @nself-chat/state/utils/persist
 */

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify<T>(value: T): string | null {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

/**
 * Get item from storage with type safety
 */
export function getStorageItem<T>(key: string, storage: Storage = localStorage): T | null {
  if (typeof window === 'undefined') return null

  try {
    const item = storage.getItem(key)
    return item ? (JSON.parse(item) as T) : null
  } catch {
    return null
  }
}

/**
 * Set item in storage with type safety
 */
export function setStorageItem<T>(key: string, value: T, storage: Storage = localStorage): boolean {
  if (typeof window === 'undefined') return false

  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove item from storage
 */
export function removeStorageItem(key: string, storage: Storage = localStorage): boolean {
  if (typeof window === 'undefined') return false

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

/**
 * Clear all items with a specific prefix
 */
export function clearStorageWithPrefix(prefix: string, storage: Storage = localStorage): number {
  if (typeof window === 'undefined') return 0

  let cleared = 0
  const keys: string[] = []

  try {
    // Collect keys to clear
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(prefix)) {
        keys.push(key)
      }
    }

    // Clear collected keys
    keys.forEach((key) => {
      storage.removeItem(key)
      cleared++
    })
  } catch {
    // Ignore errors
  }

  return cleared
}

/**
 * Get storage size in bytes
 */
export function getStorageSize(storage: Storage = localStorage): number {
  if (typeof window === 'undefined') return 0

  let size = 0

  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key) {
        const value = storage.getItem(key)
        if (value) {
          size += key.length + value.length
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return size
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(storage: Storage = localStorage): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__storage_test__'
    storage.setItem(testKey, 'test')
    storage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Create a namespaced storage wrapper
 */
export function createNamespacedStorage(prefix: string, storage: Storage = localStorage) {
  return {
    getItem: <T>(key: string) => getStorageItem<T>(`${prefix}:${key}`, storage),
    setItem: <T>(key: string, value: T) => setStorageItem(`${prefix}:${key}`, value, storage),
    removeItem: (key: string) => removeStorageItem(`${prefix}:${key}`, storage),
    clear: () => clearStorageWithPrefix(`${prefix}:`, storage),
    size: () => getStorageSize(storage),
    isAvailable: () => isStorageAvailable(storage),
  }
}

/**
 * Storage quota information (if available)
 */
export async function getStorageQuota(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 0
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return { usage, quota, percentage }
  } catch {
    return null
  }
}
