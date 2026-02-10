/**
 * TypeScript Type Definitions
 *
 * @module @nself-chat/testing/types
 */

export type { TestUser } from '../factories/user.factory'
export type { TestChannel } from '../factories/channel.factory'
export type { TestMessage } from '../factories/message.factory'
export type { MockAuthSession } from '../mocks/auth'

/**
 * Test helper result type
 */
export interface TestHelperResult<T> {
  data: T
  error: Error | null
  loading: boolean
}

/**
 * Mock function type helper
 */
export type MockFn<T extends (...args: any[]) => any> = jest.MockedFunction<T>

/**
 * Async mock function type helper
 */
export type AsyncMockFn<T> = jest.MockedFunction<() => Promise<T>>
