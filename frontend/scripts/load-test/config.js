/**
 * k6 Load Testing Configuration
 *
 * Defines test scenarios, thresholds, and configuration for load testing
 * the nself-chat application to support 10,000 concurrent users.
 */

// ============================================================================
// Environment Configuration
// ============================================================================

export const config = {
  // Base URLs
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',
  apiUrl: __ENV.API_URL || 'http://localhost:8080/v1/graphql',
  wsUrl: __ENV.WS_URL || 'ws://localhost:8080/v1/graphql',

  // Test users
  testUsers: {
    count: parseInt(__ENV.TEST_USERS || '1000'),
    batchSize: parseInt(__ENV.USER_BATCH_SIZE || '100'),
  },

  // Performance thresholds
  thresholds: {
    // HTTP metrics
    http_req_duration: ['p(95)<100', 'p(99)<200'], // 95% < 100ms, 99% < 200ms
    http_req_failed: ['rate<0.01'], // < 1% failure rate
    http_reqs: ['rate>100'], // > 100 requests/s

    // WebSocket metrics
    ws_connecting: ['p(95)<50'], // < 50ms connection time
    ws_msgs_received: ['count>10000'], // > 10k messages received
    ws_msgs_sent: ['count>10000'], // > 10k messages sent

    // Custom metrics
    message_send_duration: ['p(95)<50', 'p(99)<100'],
    message_receive_latency: ['p(95)<100', 'p(99)<200'],
    query_complexity: ['p(95)<500'],
  },

  // Test data
  channels: {
    count: 100,
    messagesPerChannel: 1000,
  },

  // Rate limiting expectations
  rateLimit: {
    requestsPerMinute: 1000,
    complexityPerMinute: 10000,
  },
}

// ============================================================================
// Load Test Scenarios
// ============================================================================

export const scenarios = {
  // Smoke test - minimal load to verify system works
  smoke: {
    executor: 'constant-vus',
    vus: 10,
    duration: '1m',
  },

  // Load test - expected normal load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 }, // Ramp up to 100 users
      { duration: '5m', target: 100 }, // Stay at 100 for 5 minutes
      { duration: '2m', target: 500 }, // Ramp up to 500
      { duration: '5m', target: 500 }, // Stay at 500 for 5 minutes
      { duration: '2m', target: 0 }, // Ramp down to 0
    ],
    gracefulRampDown: '30s',
  },

  // Stress test - beyond normal load
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 500 }, // Ramp to 500
      { duration: '5m', target: 500 },
      { duration: '2m', target: 1000 }, // Ramp to 1000
      { duration: '5m', target: 1000 },
      { duration: '2m', target: 2000 }, // Ramp to 2000
      { duration: '5m', target: 2000 },
      { duration: '5m', target: 0 }, // Ramp down
    ],
    gracefulRampDown: '1m',
  },

  // Spike test - sudden traffic spikes
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 100 }, // Normal load
      { duration: '1m', target: 100 },
      { duration: '10s', target: 2000 }, // Sudden spike
      { duration: '3m', target: 2000 }, // Sustained spike
      { duration: '10s', target: 100 }, // Drop back
      { duration: '2m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },

  // Soak test - sustained load over time
  soak: {
    executor: 'constant-vus',
    vus: 1000,
    duration: '1h',
  },

  // Scalability test - 10,000 concurrent users
  scalability: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '5m', target: 1000 },
      { duration: '10m', target: 1000 },
      { duration: '5m', target: 3000 },
      { duration: '10m', target: 3000 },
      { duration: '5m', target: 5000 },
      { duration: '10m', target: 5000 },
      { duration: '5m', target: 7000 },
      { duration: '10m', target: 7000 },
      { duration: '5m', target: 10000 },
      { duration: '20m', target: 10000 }, // 20 minutes at 10k users
      { duration: '10m', target: 0 },
    ],
    gracefulRampDown: '2m',
  },

  // Breakpoint test - find system limits
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 100,
    timeUnit: '1s',
    preAllocatedVUs: 500,
    maxVUs: 10000,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 500 },
      { duration: '5m', target: 1000 },
      { duration: '5m', target: 2000 },
      { duration: '5m', target: 5000 },
      { duration: '5m', target: 10000 },
    ],
  },
}

// ============================================================================
// Test Options by Scenario Type
// ============================================================================

export function getTestOptions(scenarioType = 'load') {
  return {
    scenarios: {
      [scenarioType]: scenarios[scenarioType],
    },
    thresholds: config.thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
    noConnectionReuse: false,
    userAgent: 'k6-load-test/1.0',
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// ============================================================================
// Test Data Generators
// ============================================================================

export function generateTestUser(index) {
  return {
    email: `testuser${index}@loadtest.local`,
    password: 'LoadTest123!',
    displayName: `Test User ${index}`,
    role: 'member',
  }
}

export function generateTestMessage(channelId, userId) {
  const messageTypes = [
    'Hello, this is a test message!',
    'Testing performance under load',
    'Lorem ipsum dolor sit amet',
    'Quick brown fox jumps over the lazy dog',
    'Performance testing in progress...',
  ]

  return {
    channelId,
    userId,
    content: randomItem(messageTypes) + ' ' + randomString(20),
    messageType: 'text',
  }
}

export function generateTestChannel(index) {
  return {
    name: `test-channel-${index}`,
    description: `Load test channel ${index}`,
    type: 'public',
    visibility: 'public',
  }
}

// ============================================================================
// Metrics Tracking
// ============================================================================

export const customMetrics = {
  messageSendDuration: 'message_send_duration',
  messageReceiveLatency: 'message_receive_latency',
  queryComplexity: 'query_complexity',
  cacheHitRate: 'cache_hit_rate',
  wsConnectDuration: 'ws_connect_duration',
  wsReconnectCount: 'ws_reconnect_count',
}
