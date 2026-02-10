/**
 * Utils Tests
 *
 * Tests for utility functions.
 */

import {
  wait,
  flushPromises,
  waitForCondition,
  retryUntil,
  createDeferred,
  suppressConsoleError,
  suppressConsoleWarn,
} from '../utils'

describe('wait', () => {
  it('waits for specified duration', async () => {
    const start = Date.now()
    await wait(100)
    const elapsed = Date.now() - start

    expect(elapsed).toBeGreaterThanOrEqual(95) // Allow some timing variance
  })
})

describe('flushPromises', () => {
  it('flushes pending promises', async () => {
    let resolved = false
    Promise.resolve().then(() => {
      resolved = true
    })

    await flushPromises()
    expect(resolved).toBe(true)
  })
})

describe('waitForCondition', () => {
  it('waits for condition to be true', async () => {
    let value = false
    setTimeout(() => {
      value = true
    }, 50)

    await waitForCondition(() => value, { timeout: 1000, interval: 10 })
    expect(value).toBe(true)
  })

  it('throws on timeout', async () => {
    await expect(
      waitForCondition(() => false, { timeout: 100, interval: 10 })
    ).rejects.toThrow('timeout')
  })
})

describe('retryUntil', () => {
  it('retries until predicate is true', async () => {
    let attempts = 0
    const result = await retryUntil(
      () => ++attempts,
      (val) => val === 3,
      { maxAttempts: 5, interval: 10 }
    )

    expect(result).toBe(3)
  })

  it('throws after max attempts', async () => {
    await expect(
      retryUntil(() => 1, (val) => val === 2, { maxAttempts: 3, interval: 10 })
    ).rejects.toThrow('failed after')
  })
})

describe('createDeferred', () => {
  it('creates a deferred promise', async () => {
    const deferred = createDeferred<number>()

    setTimeout(() => deferred.resolve(42), 10)

    const result = await deferred.promise
    expect(result).toBe(42)
  })

  it('can reject', async () => {
    const deferred = createDeferred<number>()

    setTimeout(() => deferred.reject(new Error('Failed')), 10)

    await expect(deferred.promise).rejects.toThrow('Failed')
  })
})

describe('suppressConsoleError', () => {
  it('suppresses console.error', () => {
    const originalError = console.error
    const spy = jest.fn()
    console.error = spy

    suppressConsoleError(() => {
      console.error('This should be suppressed')
    })

    expect(spy).not.toHaveBeenCalled()
    console.error = originalError
  })

  it('restores console.error after callback', () => {
    const originalError = console.error

    suppressConsoleError(() => {
      console.error('Suppressed')
    })

    expect(console.error).toBe(originalError)
  })
})

describe('suppressConsoleWarn', () => {
  it('suppresses console.warn', () => {
    const originalWarn = console.warn
    const spy = jest.fn()
    console.warn = spy

    suppressConsoleWarn(() => {
      console.warn('This should be suppressed')
    })

    expect(spy).not.toHaveBeenCalled()
    console.warn = originalWarn
  })
})
