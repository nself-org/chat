/**
 * Test Configuration
 *
 * Configuration values for testing.
 *
 * @module @nself-chat/testing/config/test-config
 */

export const testConfig = {
  /**
   * Default timeout for async operations in tests
   */
  defaultTimeout: 5000,

  /**
   * Default retry attempts for flaky operations
   */
  defaultRetryAttempts: 3,

  /**
   * Default interval between retries
   */
  defaultRetryInterval: 100,

  /**
   * Base timestamp for deterministic date generation
   * 2024-01-01 00:00:00 UTC
   */
  baseTimestamp: new Date('2024-01-01T00:00:00Z').getTime(),

  /**
   * Test API URLs
   */
  apiUrls: {
    graphql: 'http://localhost:8080/v1/graphql',
    auth: 'http://localhost:4000/v1/auth',
    storage: 'http://localhost:9000/v1/storage',
  },

  /**
   * Feature flags for testing
   */
  features: {
    enableDebugLogs: process.env.TEST_DEBUG === 'true',
    enableCoverage: process.env.TEST_COVERAGE === 'true',
    enableE2E: process.env.TEST_E2E === 'true',
  },
}

/**
 * Get test configuration value
 */
export function getTestConfig<K extends keyof typeof testConfig>(key: K): typeof testConfig[K] {
  return testConfig[key]
}

/**
 * Update test configuration
 */
export function updateTestConfig(updates: Partial<typeof testConfig>) {
  Object.assign(testConfig, updates)
}
