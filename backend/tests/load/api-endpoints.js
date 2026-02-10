/**
 * API Endpoints Load Test
 *
 * Tests all major API endpoints under load to identify bottlenecks.
 * Monitors response times, error rates, and throughput.
 *
 * Usage:
 *   k6 run tests/load/api-endpoints.js
 *
 * Environment Variables:
 *   API_URL - API base URL (default: http://localhost:3000)
 *   VUS - Virtual users (default: 100)
 *   DURATION - Test duration (default: 5m)
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Counter, Trend } from 'k6/metrics'

// Custom metrics
const endpointCalls = new Counter('endpoint_calls')
const endpointErrors = new Counter('endpoint_errors')
const authTime = new Trend('auth_time', true)
const channelsTime = new Trend('channels_time', true)
const messagesTime = new Trend('messages_time', true)
const searchTime = new Trend('search_time', true)
const usersTime = new Trend('users_time', true)
const notificationsTime = new Trend('notifications_time', true)

// Configuration
const API_URL = __ENV.API_URL || 'http://localhost:3000'
const VUS = parseInt(__ENV.VUS || '100')
const DURATION = __ENV.DURATION || '5m'

export const options = {
  stages: [
    { duration: '2m', target: VUS / 2 }, // Ramp up to 50% VUS
    { duration: '1m', target: VUS }, // Ramp to full VUS
    { duration: DURATION, target: VUS }, // Hold
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
    http_req_failed: ['rate<0.01'], // Less than 1% errors
    auth_time: ['p(95)<200'],
    channels_time: ['p(95)<300'],
    messages_time: ['p(95)<200'],
    search_time: ['p(95)<500'],
    users_time: ['p(95)<200'],
    notifications_time: ['p(95)<300'],
  },
}

// Test data
let authToken = ''
let testChannelId = ''
let testUserId = ''

export function setup() {
  // Create auth token
  const authRes = http.post(
    `${API_URL}/api/auth/signin`,
    JSON.stringify({
      email: 'loadtest@example.com',
      password: 'password123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  if (authRes.status === 200) {
    const auth = JSON.parse(authRes.body)
    authToken = auth.token
    testUserId = auth.user.id
  }

  // Create test channel
  const channelRes = http.post(
    `${API_URL}/api/channels`,
    JSON.stringify({
      name: 'load-test-channel',
      type: 'public',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    }
  )

  if (channelRes.status === 201) {
    testChannelId = JSON.parse(channelRes.body).id
  }

  return {
    authToken,
    testChannelId,
    testUserId,
  }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.authToken}`,
  }

  // Test 1: Authentication Endpoints
  group('Authentication', () => {
    const start = Date.now()

    // Refresh token
    const refreshRes = http.post(
      `${API_URL}/api/auth/refresh`,
      JSON.stringify({ token: data.authToken }),
      { headers, tags: { name: 'auth_refresh' } }
    )

    authTime.add(Date.now() - start)
    endpointCalls.add(1)

    const success = check(refreshRes, {
      'Auth refresh status 200': (r) => r.status === 200,
      'Auth has valid token': (r) => {
        try {
          return JSON.parse(r.body).token !== undefined
        } catch {
          return false
        }
      },
    })

    if (!success) endpointErrors.add(1)
  })

  sleep(0.5)

  // Test 2: Channel Operations
  group('Channels', () => {
    const start = Date.now()

    // List channels
    const listRes = http.get(`${API_URL}/api/channels`, {
      headers,
      tags: { name: 'channels_list' },
    })

    channelsTime.add(Date.now() - start)
    endpointCalls.add(1)

    const listSuccess = check(listRes, {
      'Channels list status 200': (r) => r.status === 200,
      'Channels list has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body))
        } catch {
          return false
        }
      },
    })

    if (!listSuccess) endpointErrors.add(1)

    // Get specific channel
    if (data.testChannelId) {
      const getStart = Date.now()
      const getRes = http.get(`${API_URL}/api/channels/${data.testChannelId}`, {
        headers,
        tags: { name: 'channels_get' },
      })

      channelsTime.add(Date.now() - getStart)
      endpointCalls.add(1)

      const getSuccess = check(getRes, {
        'Channel get status 200': (r) => r.status === 200,
        'Channel has id': (r) => {
          try {
            return JSON.parse(r.body).id !== undefined
          } catch {
            return false
          }
        },
      })

      if (!getSuccess) endpointErrors.add(1)
    }
  })

  sleep(0.5)

  // Test 3: Message Operations
  group('Messages', () => {
    if (!data.testChannelId) return

    // Send message
    const sendStart = Date.now()
    const sendRes = http.post(
      `${API_URL}/api/messages`,
      JSON.stringify({
        channel_id: data.testChannelId,
        content: `Load test message ${Date.now()}`,
      }),
      { headers, tags: { name: 'messages_send' } }
    )

    messagesTime.add(Date.now() - sendStart)
    endpointCalls.add(1)

    const sendSuccess = check(sendRes, {
      'Message send status 201': (r) => r.status === 200 || r.status === 201,
      'Message has id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined
        } catch {
          return false
        }
      },
    })

    if (!sendSuccess) endpointErrors.add(1)

    // List messages
    const listStart = Date.now()
    const listRes = http.get(`${API_URL}/api/messages?channel_id=${data.testChannelId}&limit=50`, {
      headers,
      tags: { name: 'messages_list' },
    })

    messagesTime.add(Date.now() - listStart)
    endpointCalls.add(1)

    const listSuccess = check(listRes, {
      'Messages list status 200': (r) => r.status === 200,
      'Messages list has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body))
        } catch {
          return false
        }
      },
    })

    if (!listSuccess) endpointErrors.add(1)
  })

  sleep(0.5)

  // Test 4: Search
  group('Search', () => {
    const start = Date.now()
    const searchRes = http.post(
      `${API_URL}/api/search`,
      JSON.stringify({
        query: 'load test',
        filters: { type: 'message' },
        limit: 20,
      }),
      { headers, tags: { name: 'search' } }
    )

    searchTime.add(Date.now() - start)
    endpointCalls.add(1)

    const success = check(searchRes, {
      'Search status 200': (r) => r.status === 200,
      'Search has results': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.results !== undefined
        } catch {
          return false
        }
      },
    })

    if (!success) endpointErrors.add(1)
  })

  sleep(0.5)

  // Test 5: User Profile
  group('Users', () => {
    const start = Date.now()
    const userRes = http.get(`${API_URL}/api/users/me`, { headers, tags: { name: 'users_me' } })

    usersTime.add(Date.now() - start)
    endpointCalls.add(1)

    const success = check(userRes, {
      'User profile status 200': (r) => r.status === 200,
      'User has id': (r) => {
        try {
          return JSON.parse(r.body).id !== undefined
        } catch {
          return false
        }
      },
    })

    if (!success) endpointErrors.add(1)
  })

  sleep(0.5)

  // Test 6: Notifications
  group('Notifications', () => {
    const start = Date.now()
    const notifRes = http.get(`${API_URL}/api/notifications?limit=20`, {
      headers,
      tags: { name: 'notifications_list' },
    })

    notificationsTime.add(Date.now() - start)
    endpointCalls.add(1)

    const success = check(notifRes, {
      'Notifications status 200': (r) => r.status === 200,
      'Notifications has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body))
        } catch {
          return false
        }
      },
    })

    if (!success) endpointErrors.add(1)
  })

  // Think time between iterations
  sleep(Math.random() * 2 + 1) // 1-3 seconds
}

export function handleSummary(data) {
  const summary = generateSummary(data)

  return {
    'test-results/api-endpoints-summary.json': JSON.stringify(data, null, 2),
    'test-results/api-endpoints-report.txt': summary,
    stdout: summary,
  }
}

function generateSummary(data) {
  const metrics = data.metrics

  let summary = '\n' + '='.repeat(80) + '\n'
  summary += 'API Endpoints Load Test\n'
  summary += '='.repeat(80) + '\n\n'

  // Overall metrics
  summary += 'Overall Metrics:\n'
  summary += `  Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`
  summary += `  Request Rate: ${(metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s\n`
  summary += `  Error Rate: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`
  summary += `  Average Duration: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n\n`

  // Endpoint-specific metrics
  summary += 'Endpoint Performance:\n'
  summary += `  Auth:          avg=${(metrics.auth_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.auth_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  Channels:      avg=${(metrics.channels_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.channels_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  Messages:      avg=${(metrics.messages_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.messages_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  Search:        avg=${(metrics.search_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.search_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  Users:         avg=${(metrics.users_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.users_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  Notifications: avg=${(metrics.notifications_time?.values?.avg || 0).toFixed(2)}ms  p95=${(metrics.notifications_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n\n`

  // HTTP metrics
  summary += 'HTTP Performance:\n'
  summary += `  p50: ${(metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms\n`
  summary += `  p95: ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  p99: ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += `  Max: ${(metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms\n\n`

  // Test result
  const passed =
    (metrics.http_req_failed?.values?.rate || 1) < 0.01 &&
    (metrics.http_req_duration?.values?.['p(95)'] || 999999) < 500

  summary += 'Test Result: ' + (passed ? '✅ PASSED' : '❌ FAILED') + '\n'
  summary += '='.repeat(80) + '\n'

  return summary
}
