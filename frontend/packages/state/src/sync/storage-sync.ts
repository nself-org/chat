/**
 * Storage Sync
 *
 * Synchronizes Zustand store state with localStorage/sessionStorage.
 *
 * @packageDocumentation
 * @module @nself-chat/state/sync/storage-sync
 */

import type { StorageSyncConfig } from '../types/sync'
import { getStorageItem, setStorageItem } from '../utils/persist'

/**
 * Debounce function for sync operations
 */
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Creates a storage sync manager for a store
 */
export function createStorageSync<TState>(
  storeName: string,
  config: Partial<StorageSyncConfig> = {}
) {
  const fullConfig: StorageSyncConfig = {
    autoSync: config.autoSync ?? true,
    debounceMs: config.debounceMs ?? 300,
    keyPrefix: config.keyPrefix ?? 'nchat',
    encrypt: config.encrypt ?? false,
  }

  const storageKey = `${fullConfig.keyPrefix}:${storeName}`

  /**
   * Load state from storage
   */
  function load(): Partial<TState> | null {
    return getStorageItem<Partial<TState>>(storageKey)
  }

  /**
   * Save state to storage
   */
  function save(state: Partial<TState>): boolean {
    return setStorageItem(storageKey, state)
  }

  /**
   * Debounced save function
   */
  const debouncedSave = debounce(save, fullConfig.debounceMs)

  /**
   * Auto-sync function to call on state changes
   */
  function autoSync(state: Partial<TState>) {
    if (fullConfig.autoSync) {
      debouncedSave(state)
    }
  }

  /**
   * Clear storage for this store
   */
  function clear(): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(storageKey)
      return true
    } catch {
      return false
    }
  }

  return {
    load,
    save,
    autoSync,
    clear,
    storageKey,
    config: fullConfig,
  }
}

/**
 * Sync state between multiple tabs/windows
 */
export function createCrossTabSync<TState>(
  storeName: string,
  onStateChange: (state: Partial<TState>) => void
) {
  if (typeof window === 'undefined') return null

  const storageKey = `nchat:${storeName}`

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === storageKey && event.newValue) {
      try {
        const newState = JSON.parse(event.newValue) as Partial<TState>
        onStateChange(newState)
      } catch {
        // Ignore parse errors
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)

  return {
    unsubscribe: () => {
      window.removeEventListener('storage', handleStorageChange)
    },
  }
}

/**
 * Broadcast state changes across tabs using BroadcastChannel API
 */
export function createBroadcastSync<TState>(
  storeName: string,
  onStateChange: (state: Partial<TState>) => void
) {
  if (typeof window === 'undefined' || !window.BroadcastChannel) return null

  const channelName = `nchat:${storeName}`
  const channel = new BroadcastChannel(channelName)

  channel.onmessage = (event: MessageEvent) => {
    try {
      const state = event.data as Partial<TState>
      onStateChange(state)
    } catch {
      // Ignore errors
    }
  }

  return {
    broadcast: (state: Partial<TState>) => {
      channel.postMessage(state)
    },
    unsubscribe: () => {
      channel.close()
    },
  }
}
