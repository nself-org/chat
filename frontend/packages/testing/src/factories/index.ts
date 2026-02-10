/**
 * Test Data Factories
 *
 * Factory functions for creating test data with deterministic IDs and timestamps.
 *
 * @module @nself-chat/testing/factories
 */

export * from './user.factory'
export * from './channel.factory'
export * from './message.factory'

import { resetUserIdCounter } from './user.factory'
import { resetChannelIdCounter } from './channel.factory'
import { resetMessageIdCounter } from './message.factory'

/**
 * Reset all factory counters for deterministic tests
 *
 * Call this in beforeEach to ensure predictable test data
 */
export function resetAllFactories() {
  resetUserIdCounter()
  resetChannelIdCounter()
  resetMessageIdCounter()
}
