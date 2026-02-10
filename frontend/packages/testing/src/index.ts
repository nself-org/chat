/**
 * @nself-chat/testing - Shared Testing Utilities
 *
 * Comprehensive testing package providing fixtures, factories, mocks, and utilities
 * for consistent and reliable testing across the nself-chat application.
 *
 * ## Features
 *
 * - **Deterministic Test Data**: Fixed IDs, predictable timestamps, no randomness
 * - **Flake Reduction**: Reliable test utilities with retry logic and proper cleanup
 * - **Complete Mocks**: ESM packages, API, auth, browser APIs
 * - **Custom Matchers**: Domain-specific Jest matchers
 * - **Factory Functions**: Easy creation of test users, channels, messages
 * - **Pre-built Fixtures**: Common test scenarios ready to use
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createUser,
 *   createChannel,
 *   createMessage,
 *   fixtures,
 *   mockAuthService,
 *   setupAllBrowserMocks,
 *   registerCustomMatchers,
 * } from '@nself-chat/testing'
 *
 * // In your tests
 * describe('MyComponent', () => {
 *   beforeAll(() => {
 *     registerCustomMatchers()
 *     setupAllBrowserMocks()
 *   })
 *
 *   it('works with test data', () => {
 *     const user = createUser({ role: 'admin' })
 *     expect(user).toBeValidUser()
 *     expect(user).toHavePermission('manage_users')
 *   })
 * })
 * ```
 *
 * @packageDocumentation
 * @module @nself-chat/testing
 */

// Package metadata
export const PACKAGE_VERSION = '0.9.2'
export const PACKAGE_NAME = '@nself-chat/testing'

// Factories - Create test data with deterministic IDs
export * from './factories'

// Fixtures - Pre-built test scenarios
export * from './fixtures'

// Mocks - Mock implementations for external dependencies
export * from './mocks'

// Utils - Helper functions for testing
export * from './utils'

// Matchers - Custom Jest matchers
export * from './matchers'

// Config - Jest setup and test configuration
export * from './config'

// Types - TypeScript type definitions
export * from './types'

/**
 * Quick setup function for tests
 *
 * Registers custom matchers and sets up browser mocks
 */
export function setupTesting() {
  const { registerCustomMatchers } = require('./matchers')
  const { setupAllBrowserMocks } = require('./mocks/browser')

  registerCustomMatchers()
  setupAllBrowserMocks()
}

/**
 * Reset all test state
 *
 * Call this in beforeEach to ensure clean state between tests
 */
export function resetAllTestState() {
  const { resetAllFactories } = require('./factories')
  resetAllFactories()
  jest.clearAllMocks()
}
