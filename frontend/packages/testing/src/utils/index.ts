/**
 * Test Utilities
 *
 * Helper functions for common testing operations.
 *
 * @module @nself-chat/testing/utils
 */

/**
 * Wait for a specified duration
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wait for the next tick of the event loop
 */
export const waitForNextTick = () => new Promise((resolve) => {
  if (typeof process !== 'undefined' && process.nextTick) {
    process.nextTick(resolve)
  } else {
    setTimeout(resolve, 0)
  }
})

/**
 * Flush all pending promises
 */
export const flushPromises = () => new Promise<void>((resolve) => {
  const immediate = (globalThis as any).setImmediate
  if (typeof immediate === 'function') {
    immediate(resolve)
  } else {
    setTimeout(resolve, 0)
  }
})

/**
 * Generate a deterministic test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  const counter = Math.floor(Math.random() * 10000)
  return `${prefix}-${counter.toString().padStart(5, '0')}`
}

/**
 * Generate a deterministic test email
 */
export function generateTestEmail(prefix: string = 'user'): string {
  const counter = Math.floor(Math.random() * 10000)
  return `${prefix}${counter}@test.example.com`
}

/**
 * Suppress console errors during a test
 */
export function suppressConsoleError<T>(callback: () => T): T {
  const originalError = console.error
  console.error = jest.fn()
  try {
    return callback()
  } finally {
    console.error = originalError
  }
}

/**
 * Suppress console warnings during a test
 */
export function suppressConsoleWarn<T>(callback: () => T): T {
  const originalWarn = console.warn
  console.warn = jest.fn()
  try {
    return callback()
  } finally {
    console.warn = originalWarn
  }
}

/**
 * Advance Jest timers and flush promises
 */
export async function advanceTimersAndFlush(ms: number) {
  jest.advanceTimersByTime(ms)
  await flushPromises()
}

/**
 * Create a deferred promise for testing async behavior
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void
  let reject: (reason?: any) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  }
}

/**
 * Retry a function until it succeeds or max attempts reached
 */
export async function retryUntil<T>(
  fn: () => T | Promise<T>,
  predicate: (result: T) => boolean,
  options: { maxAttempts?: number; interval?: number } = {}
): Promise<T> {
  const { maxAttempts = 10, interval = 100 } = options

  for (let i = 0; i < maxAttempts; i++) {
    const result = await fn()
    if (predicate(result)) {
      return result
    }
    await wait(interval)
  }

  throw new Error(`retryUntil failed after ${maxAttempts} attempts`)
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options
  const start = Date.now()

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error(`waitForCondition timeout after ${timeout}ms`)
    }
    await wait(interval)
  }
}

/**
 * Create a spy on console method
 */
export function spyOnConsole(method: 'log' | 'warn' | 'error' | 'info' | 'debug') {
  return jest.spyOn(console, method).mockImplementation(() => {})
}

/**
 * Restore all console spies
 */
export function restoreConsoleSpies() {
  ;(['log', 'warn', 'error', 'info', 'debug'] as const).forEach((method) => {
    const spy = console[method] as any
    if (spy.mockRestore) {
      spy.mockRestore()
    }
  })
}
