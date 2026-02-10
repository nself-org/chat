/**
 * Retry Logic Utilities
 *
 * Provides retry functionality with exponential backoff for API requests.
 *
 * @packageDocumentation
 * @module @nself-chat/api/utils
 */

import { logger } from '@nself-chat/core'
import type { RetryOptions } from '../types/api'
import { isRetryableError, transformApolloError } from './error-handler'
import type { ApolloError } from '@apollo/client'

// ============================================================================
// Default Retry Configuration
// ============================================================================

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
}

// ============================================================================
// Retry Implementation
// ============================================================================

/**
 * Calculate delay for retry attempt
 *
 * Uses exponential backoff with jitter to prevent thundering herd.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number, options: RetryOptions): number {
  const { initialDelay, maxDelay, backoffMultiplier } = options

  // Exponential backoff: initialDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt)

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay)

  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() - 0.5)

  return Math.floor(cappedDelay + jitter)
}

/**
 * Wait for specified duration
 *
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if we should retry
      const shouldRetry = shouldRetryError(error, config)

      if (!shouldRetry || attempt === config.maxAttempts - 1) {
        // Last attempt or non-retryable error
        throw error
      }

      // Calculate delay and wait
      const delay = calculateRetryDelay(attempt, config)
      logger.warn(`Retry attempt ${attempt + 1}/${config.maxAttempts} after ${delay}ms`, {
        error: (error as Error).message,
      })

      await wait(delay)
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Retry failed')
}

/**
 * Check if error should trigger a retry
 *
 * @param error - Error to check
 * @param options - Retry options
 * @returns Whether to retry
 */
function shouldRetryError(error: unknown, options: RetryOptions): boolean {
  // Check custom retry condition first
  if (options.retryCondition) {
    const apiError = error instanceof Error ? transformApolloError(error as ApolloError) : undefined
    if (apiError) {
      return options.retryCondition(apiError)
    }
  }

  // Check if it's an Apollo error
  if (isApolloError(error)) {
    const apiError = transformApolloError(error)
    return isRetryableError(apiError)
  }

  // Check if it's a fetch error with retryable status code
  if (isFetchError(error) && options.retryOnStatus) {
    return options.retryOnStatus.includes(error.status)
  }

  // Default: don't retry unknown errors
  return false
}

/**
 * Type guard for Apollo errors
 */
function isApolloError(error: unknown): error is ApolloError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'graphQLErrors' in error &&
    'networkError' in error
  )
}

/**
 * Type guard for fetch errors with status code
 */
function isFetchError(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error
}

// ============================================================================
// Retry Decorators
// ============================================================================

/**
 * Retry decorator for async functions
 *
 * @param options - Retry options
 * @returns Decorator function
 */
export function Retry(options: Partial<RetryOptions> = {}) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: unknown[]) {
      return retryWithBackoff(() => originalMethod.apply(this, args), options)
    }

    return descriptor
  }
}

// ============================================================================
// Retry Queue
// ============================================================================

interface QueuedRequest<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  options: RetryOptions
}

/**
 * Retry queue for batching and managing retries
 */
export class RetryQueue {
  private queue: QueuedRequest<unknown>[] = []
  private processing = false
  private concurrency: number

  constructor(concurrency = 5) {
    this.concurrency = concurrency
  }

  /**
   * Add request to queue
   */
  async enqueue<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
    const config: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        options: config,
      })

      // Start processing if not already running
      if (!this.processing) {
        this.process()
      }
    })
  }

  /**
   * Process queued requests
   */
  private async process(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true

    // Process up to concurrency limit
    const batch = this.queue.splice(0, this.concurrency)

    await Promise.allSettled(
      batch.map(async (request) => {
        try {
          const result = await retryWithBackoff(request.fn, request.options)
          request.resolve(result)
        } catch (error) {
          request.reject(error as Error)
        }
      })
    )

    // Continue processing
    this.process()
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.length
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue.forEach((request) => {
      request.reject(new Error('Queue cleared'))
    })
    this.queue = []
  }
}

/**
 * Default retry queue instance
 */
export const defaultRetryQueue = new RetryQueue()
