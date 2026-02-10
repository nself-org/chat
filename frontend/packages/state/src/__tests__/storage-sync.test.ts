/**
 * Storage Sync Tests
 */

import { createStorageSync, createCrossTabSync } from '../sync/storage-sync'

describe('Storage Sync', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllTimers()
  })

  describe('createStorageSync', () => {
    interface TestState {
      count: number
      name: string
    }

    it('should create sync manager with default config', () => {
      const sync = createStorageSync<TestState>('test-store')

      expect(sync.config).toEqual({
        autoSync: true,
        debounceMs: 300,
        keyPrefix: 'nchat',
        encrypt: false,
      })
      expect(sync.storageKey).toBe('nchat:test-store')
    })

    it('should create sync manager with custom config', () => {
      const sync = createStorageSync<TestState>('test-store', {
        autoSync: false,
        debounceMs: 500,
        keyPrefix: 'myapp',
      })

      expect(sync.config.autoSync).toBe(false)
      expect(sync.config.debounceMs).toBe(500)
      expect(sync.storageKey).toBe('myapp:test-store')
    })

    it('should save state to storage', () => {
      const sync = createStorageSync<TestState>('test-store')
      const state: TestState = { count: 42, name: 'test' }

      const success = sync.save(state)
      expect(success).toBe(true)

      const stored = localStorage.getItem('nchat:test-store')
      expect(stored).toBe(JSON.stringify(state))
    })

    it('should load state from storage', () => {
      const state: TestState = { count: 42, name: 'test' }
      localStorage.setItem('nchat:test-store', JSON.stringify(state))

      const sync = createStorageSync<TestState>('test-store')
      const loaded = sync.load()

      expect(loaded).toEqual(state)
    })

    it('should return null when loading from empty storage', () => {
      const sync = createStorageSync<TestState>('test-store')
      const loaded = sync.load()

      expect(loaded).toBeNull()
    })

    it('should clear storage', () => {
      const sync = createStorageSync<TestState>('test-store')
      sync.save({ count: 42, name: 'test' })

      const cleared = sync.clear()
      expect(cleared).toBe(true)
      expect(localStorage.getItem('nchat:test-store')).toBeNull()
    })

    it('should auto-sync when enabled', () => {
      jest.useFakeTimers()
      const sync = createStorageSync<TestState>('test-store', {
        autoSync: true,
        debounceMs: 300,
      })

      const state: TestState = { count: 1, name: 'test' }
      sync.autoSync(state)

      // Should not save immediately (debounced)
      expect(localStorage.getItem('nchat:test-store')).toBeNull()

      // Fast-forward time
      jest.advanceTimersByTime(300)

      // Should save after debounce
      expect(localStorage.getItem('nchat:test-store')).toBe(JSON.stringify(state))

      jest.useRealTimers()
    })

    it('should not auto-sync when disabled', () => {
      jest.useFakeTimers()
      const sync = createStorageSync<TestState>('test-store', {
        autoSync: false,
      })

      const state: TestState = { count: 1, name: 'test' }
      sync.autoSync(state)

      jest.advanceTimersByTime(1000)

      // Should not save
      expect(localStorage.getItem('nchat:test-store')).toBeNull()

      jest.useRealTimers()
    })

    it('should debounce multiple auto-sync calls', () => {
      jest.useFakeTimers()
      const sync = createStorageSync<TestState>('test-store', {
        autoSync: true,
        debounceMs: 300,
      })

      // Multiple rapid calls
      sync.autoSync({ count: 1, name: 'test1' })
      jest.advanceTimersByTime(100)
      sync.autoSync({ count: 2, name: 'test2' })
      jest.advanceTimersByTime(100)
      sync.autoSync({ count: 3, name: 'test3' })

      // Fast-forward to after debounce
      jest.advanceTimersByTime(300)

      // Should only save the last state
      const stored = localStorage.getItem('nchat:test-store')
      expect(stored).toBe(JSON.stringify({ count: 3, name: 'test3' }))

      jest.useRealTimers()
    })
  })

  describe('createCrossTabSync', () => {
    interface TestState {
      value: number
    }

    it('should create cross-tab sync', () => {
      const onStateChange = jest.fn()
      const sync = createCrossTabSync<TestState>('test-store', onStateChange)

      expect(sync).not.toBeNull()
      expect(sync?.unsubscribe).toBeDefined()
    })

    it('should call callback on storage event', () => {
      const onStateChange = jest.fn()
      const sync = createCrossTabSync<TestState>('test-store', onStateChange)

      const newState: TestState = { value: 42 }
      const event = new StorageEvent('storage', {
        key: 'nchat:test-store',
        newValue: JSON.stringify(newState),
        storageArea: localStorage,
      })

      window.dispatchEvent(event)

      expect(onStateChange).toHaveBeenCalledWith(newState)

      sync?.unsubscribe()
    })

    it('should ignore events for other keys', () => {
      const onStateChange = jest.fn()
      const sync = createCrossTabSync<TestState>('test-store', onStateChange)

      const event = new StorageEvent('storage', {
        key: 'other-store',
        newValue: JSON.stringify({ value: 42 }),
        storageArea: localStorage,
      })

      window.dispatchEvent(event)

      expect(onStateChange).not.toHaveBeenCalled()

      sync?.unsubscribe()
    })

    it('should unsubscribe from events', () => {
      const onStateChange = jest.fn()
      const sync = createCrossTabSync<TestState>('test-store', onStateChange)

      sync?.unsubscribe()

      const event = new StorageEvent('storage', {
        key: 'nchat:test-store',
        newValue: JSON.stringify({ value: 42 }),
        storageArea: localStorage,
      })

      window.dispatchEvent(event)

      expect(onStateChange).not.toHaveBeenCalled()
    })

    it('should handle invalid JSON gracefully', () => {
      const onStateChange = jest.fn()
      const sync = createCrossTabSync<TestState>('test-store', onStateChange)

      const event = new StorageEvent('storage', {
        key: 'nchat:test-store',
        newValue: 'invalid json',
        storageArea: localStorage,
      })

      window.dispatchEvent(event)

      expect(onStateChange).not.toHaveBeenCalled()

      sync?.unsubscribe()
    })
  })
})
