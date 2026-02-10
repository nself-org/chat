/**
 * Offline Sync Tests
 */

import {
  createOfflineQueue,
  isOnline,
  waitForOnline,
  subscribeToConnectionChanges,
} from '../sync/offline-sync'

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
})

describe('Offline Sync', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('createOfflineQueue', () => {
    it('should create queue with default config', () => {
      const queue = createOfflineQueue()
      expect(queue.config).toEqual({
        enabled: true,
        maxQueueSize: 1000,
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      })
    })

    it('should enqueue actions', () => {
      const queue = createOfflineQueue()
      const action = queue.enqueue('TEST_ACTION', { data: 'test' })

      expect(action).not.toBeNull()
      expect(action?.type).toBe('TEST_ACTION')
      expect(action?.payload).toEqual({ data: 'test' })
      expect(action?.status).toBe('pending')
    })

    it('should respect max queue size', () => {
      const queue = createOfflineQueue({ maxQueueSize: 2 })

      queue.enqueue('ACTION1', {})
      queue.enqueue('ACTION2', {})
      queue.enqueue('ACTION3', {}) // Should remove oldest

      const stats = queue.getStats()
      expect(stats.total).toBe(2)
    })

    it('should get pending actions', () => {
      const queue = createOfflineQueue()

      queue.enqueue('ACTION1', {})
      queue.enqueue('ACTION2', {})

      const pending = queue.getPendingActions()
      expect(pending).toHaveLength(2)
      expect(pending[0].type).toBe('ACTION1')
    })

    it('should dequeue actions', () => {
      const queue = createOfflineQueue()
      const action = queue.enqueue('TEST', {})

      if (action) {
        const removed = queue.dequeue(action.id)
        expect(removed).toBe(true)
        expect(queue.getStats().total).toBe(0)
      }
    })

    it('should update action status', () => {
      const queue = createOfflineQueue()
      const action = queue.enqueue('TEST', {})

      if (action) {
        queue.updateAction(action.id, { status: 'processing' })
        const pending = queue.getPendingActions()
        expect(pending).toHaveLength(0)
      }
    })

    it('should process queue successfully', async () => {
      const queue = createOfflineQueue()
      queue.enqueue('ACTION1', {})
      queue.enqueue('ACTION2', {})

      const handler = jest.fn().mockResolvedValue(undefined)
      const result = await queue.processQueue(handler)

      expect(result.success).toBe(true)
      expect(result.itemsSynced).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should handle processing errors with retries', async () => {
      const queue = createOfflineQueue({ maxRetries: 2, retryDelay: 10 })
      queue.enqueue('FAILING_ACTION', {})

      let attemptCount = 0
      const handler = jest.fn().mockImplementation(() => {
        attemptCount++
        throw new Error('Processing failed')
      })

      const result = await queue.processQueue(handler)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(attemptCount).toBeGreaterThan(1) // Should retry
    })

    it('should mark actions as failed after max retries', async () => {
      const queue = createOfflineQueue({ maxRetries: 1, retryDelay: 10 })
      queue.enqueue('FAILING_ACTION', {})

      const handler = jest.fn().mockRejectedValue(new Error('Failed'))
      await queue.processQueue(handler)

      const failed = queue.getFailedActions()
      expect(failed).toHaveLength(1)
      expect(failed[0].status).toBe('failed')
    })

    it('should clear queue', () => {
      const queue = createOfflineQueue()
      queue.enqueue('ACTION1', {})
      queue.enqueue('ACTION2', {})

      queue.clearQueue()
      expect(queue.getStats().total).toBe(0)
    })

    it('should get queue stats', () => {
      const queue = createOfflineQueue()
      queue.enqueue('ACTION1', {})
      queue.enqueue('ACTION2', {})

      const stats = queue.getStats()
      expect(stats.total).toBe(2)
      expect(stats.pending).toBe(2)
      expect(stats.processing).toBe(0)
      expect(stats.failed).toBe(0)
      expect(stats.completed).toBe(0)
    })

    it('should persist queue to storage', () => {
      const queue = createOfflineQueue()
      queue.enqueue('ACTION1', { data: 'test' })

      // Create new queue instance - should load from storage
      const queue2 = createOfflineQueue()
      expect(queue2.getPendingActions()).toHaveLength(1)
    })

    it('should not enqueue when disabled', () => {
      const queue = createOfflineQueue({ enabled: false })
      const action = queue.enqueue('TEST', {})
      expect(action).toBeNull()
    })
  })

  describe('isOnline', () => {
    it('should return true when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })
      expect(isOnline()).toBe(true)
    })

    it('should return false when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })
      expect(isOnline()).toBe(false)
    })
  })

  describe('waitForOnline', () => {
    it('should resolve immediately if already online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      })

      await expect(waitForOnline()).resolves.toBeUndefined()
    })

    it('should wait for online event', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      })

      const promise = waitForOnline()

      // Simulate going online
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: true })
        window.dispatchEvent(new Event('online'))
      }, 100)

      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('subscribeToConnectionChanges', () => {
    it('should call callbacks on connection changes', () => {
      const onOnline = jest.fn()
      const onOffline = jest.fn()

      const unsubscribe = subscribeToConnectionChanges(onOnline, onOffline)

      window.dispatchEvent(new Event('online'))
      expect(onOnline).toHaveBeenCalledTimes(1)

      window.dispatchEvent(new Event('offline'))
      expect(onOffline).toHaveBeenCalledTimes(1)

      unsubscribe()

      // Should not call after unsubscribe
      window.dispatchEvent(new Event('online'))
      expect(onOnline).toHaveBeenCalledTimes(1)
    })
  })
})
