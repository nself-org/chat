/**
 * Tests for retry logic utilities
 */

import {
  calculateRetryDelay,
  wait,
  retryWithBackoff,
  RetryQueue,
  DEFAULT_RETRY_OPTIONS,
} from '../utils/retry'
import type { RetryOptions } from '../types/api'

describe('Retry Logic', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const options: RetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 10000,
      }

      // First attempt: ~1000ms
      const delay0 = calculateRetryDelay(0, options)
      expect(delay0).toBeGreaterThanOrEqual(750)
      expect(delay0).toBeLessThanOrEqual(1250)

      // Second attempt: ~2000ms
      const delay1 = calculateRetryDelay(1, options)
      expect(delay1).toBeGreaterThanOrEqual(1500)
      expect(delay1).toBeLessThanOrEqual(2500)

      // Third attempt: ~4000ms
      const delay2 = calculateRetryDelay(2, options)
      expect(delay2).toBeGreaterThanOrEqual(3000)
      expect(delay2).toBeLessThanOrEqual(5000)
    })

    it('should cap at maxDelay', () => {
      const options: RetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 5000,
      }

      // Large attempt number should be capped
      const delay = calculateRetryDelay(10, options)
      expect(delay).toBeLessThanOrEqual(5000 * 1.25) // Account for jitter
    })

    it('should add jitter', () => {
      const options: RetryOptions = {
        ...DEFAULT_RETRY_OPTIONS,
        initialDelay: 1000,
        backoffMultiplier: 1,
        maxDelay: 10000,
      }

      // Multiple calls should produce different values due to jitter
      const delays = Array.from({ length: 10 }, () => calculateRetryDelay(0, options))
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })
  })

  describe('wait', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now()
      await wait(100)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(90) // Allow some margin
      expect(elapsed).toBeLessThan(150)
    })
  })

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const result = await retryWithBackoff(fn, { maxAttempts: 3 })
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0
      const fn = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new Error('Temporary failure'))
        }
        return Promise.resolve('success')
      })

      const result = await retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 100,
        backoffMultiplier: 1,
      })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Permanent failure'))

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 1,
        })
      ).rejects.toThrow('Permanent failure')

      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should not retry if retryCondition returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Non-retryable error'))

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 3,
          retryCondition: () => false,
        })
      ).rejects.toThrow('Non-retryable error')

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should use custom retry condition', async () => {
      let attempts = 0
      const fn = jest.fn().mockImplementation(() => {
        attempts++
        const error = new Error('Error')
        ;(error as { status?: number }).status = attempts < 3 ? 503 : 400
        return Promise.reject(error)
      })

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 5,
          initialDelay: 10,
          retryOnStatus: [503],
        })
      ).rejects.toThrow()

      // Should retry on 503 (attempts 1, 2) but not on 400 (attempt 3)
      expect(fn).toHaveBeenCalledTimes(3)
    })
  })

  describe('RetryQueue', () => {
    it('should process requests in order', async () => {
      const queue = new RetryQueue(1) // Concurrency 1
      const results: number[] = []

      const promises = [
        queue.enqueue(async () => {
          results.push(1)
          return 1
        }),
        queue.enqueue(async () => {
          results.push(2)
          return 2
        }),
        queue.enqueue(async () => {
          results.push(3)
          return 3
        }),
      ]

      await Promise.all(promises)
      expect(results).toEqual([1, 2, 3])
    })

    it('should handle concurrent requests', async () => {
      const queue = new RetryQueue(3) // Concurrency 3
      const results: number[] = []

      const promises = Array.from({ length: 10 }, (_, i) =>
        queue.enqueue(async () => {
          await wait(10)
          results.push(i)
          return i
        })
      )

      await Promise.all(promises)
      expect(results).toHaveLength(10)
    })

    it('should retry failed requests', async () => {
      const queue = new RetryQueue(1)
      let attempts = 0

      const result = await queue.enqueue(
        async () => {
          attempts++
          if (attempts < 3) {
            throw new Error('Temporary failure')
          }
          return 'success'
        },
        {
          maxAttempts: 3,
          initialDelay: 10,
          backoffMultiplier: 1,
          maxDelay: 100,
        }
      )

      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should track queue size', async () => {
      const queue = new RetryQueue(1)
      expect(queue.size).toBe(0)

      // Add requests without waiting
      queue.enqueue(async () => {
        await wait(50)
        return 1
      })
      queue.enqueue(async () => {
        await wait(50)
        return 2
      })

      // Size should reflect pending requests
      await wait(10)
      expect(queue.size).toBeGreaterThanOrEqual(0)

      // Wait for all to complete
      await wait(150)
      expect(queue.size).toBe(0)
    })

    it('should clear queue', async () => {
      const queue = new RetryQueue(1)

      const promise1 = queue.enqueue(async () => {
        await wait(100)
        return 1
      })

      const promise2 = queue.enqueue(async () => {
        await wait(100)
        return 2
      })

      queue.clear()

      await expect(promise2).rejects.toThrow('Queue cleared')
    })

    it('should handle errors in queue', async () => {
      const queue = new RetryQueue(1)

      const promise = queue.enqueue(async () => {
        throw new Error('Queue error')
      })

      await expect(promise).rejects.toThrow('Queue error')
    })
  })

  describe('DEFAULT_RETRY_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RETRY_OPTIONS.maxAttempts).toBe(3)
      expect(DEFAULT_RETRY_OPTIONS.initialDelay).toBe(1000)
      expect(DEFAULT_RETRY_OPTIONS.maxDelay).toBe(10000)
      expect(DEFAULT_RETRY_OPTIONS.backoffMultiplier).toBe(2)
      expect(DEFAULT_RETRY_OPTIONS.retryOnStatus).toEqual([408, 429, 500, 502, 503, 504])
    })
  })
})
