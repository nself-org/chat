/**
 * Message Throughput Load Test - 1,000 Messages/Second
 *
 * Tests message processing capacity and end-to-end latency.
 * Monitors message delivery, latency, and database performance.
 *
 * Usage:
 *   k6 run tests/load/message-throughput.js
 *
 * Environment Variables:
 *   API_URL - API base URL (default: http://localhost:3000)
 *   TARGET_RATE - Messages per second (default: 1000)
 *   DURATION - Test duration (default: 10m)
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Trend, Rate } from 'k6/metrics'

// Custom metrics
const messagesSent = new Counter('messages_sent')
const messagesDelivered = new Counter('messages_delivered')
const messageFailed = new Counter('messages_failed')
const messageLatency = new Trend('message_latency', true)
const deliveryRate = new Rate('delivery_rate')
const apiResponseTime = new Trend('api_response_time', true)

// Configuration
const API_URL = __ENV.API_URL || 'http://localhost:3000'
const TARGET_RATE = parseInt(__ENV.TARGET_RATE || '1000')
const DURATION = __ENV.DURATION || '10m'

// Calculate VUs needed to achieve target rate
// Each VU sends 1 message per second, so we need TARGET_RATE VUs
const VUS = TARGET_RATE

export const options = {
  scenarios: {
    message_throughput: {
      executor: 'constant-arrival-rate',
      rate: TARGET_RATE, // messages per second
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: VUS,
      maxVUs: VUS * 2,
    },
  },
  thresholds: {
    message_latency: ['p(95)<200', 'p(99)<500'], // 95% under 200ms, 99% under 500ms
    api_response_time: ['p(95)<200', 'p(99)<500'],
    delivery_rate: ['rate>0.99'], // 99% delivery success
    messages_failed: ['count<100'], // Less than 100 failures
    http_req_failed: ['rate<0.01'], // Less than 1% HTTP errors
  },
}

// Test data generators
function generateMessage(channelId, userId) {
  const messageTypes = ['text', 'mention', 'file', 'code']
  const type = messageTypes[Math.floor(Math.random() * messageTypes.length)]

  let content = {
    type: type,
    text: `Load test message ${Date.now()} from user ${userId}`,
    timestamp: Date.now(),
  }

  if (type === 'mention') {
    content.mentions = [`user_${Math.floor(Math.random() * 100)}`]
  } else if (type === 'code') {
    content.code = {
      language: 'javascript',
      content: 'console.log("Load test");',
    }
  } else if (type === 'file') {
    content.attachments = [
      {
        filename: 'test.txt',
        size: 1024,
        mimeType: 'text/plain',
      },
    ]
  }

  return {
    channel_id: channelId,
    user_id: userId,
    content: JSON.stringify(content),
    metadata: {
      load_test: true,
      timestamp: Date.now(),
    },
  }
}

// Setup function - runs once per VU
export function setup() {
  // Create test channels and authenticate users
  const setupData = {
    channels: [],
    users: [],
  }

  // Create 100 test channels
  for (let i = 0; i < 100; i++) {
    const channelRes = http.post(
      `${API_URL}/api/channels`,
      JSON.stringify({
        name: `load-test-channel-${i}`,
        type: 'public',
        description: 'Load test channel',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (channelRes.status === 200 || channelRes.status === 201) {
      const channel = JSON.parse(channelRes.body)
      setupData.channels.push(channel.id)
    }
  }

  console.log(`Created ${setupData.channels.length} test channels`)
  return setupData
}

export default function (data) {
  const userId = `load_test_user_${__VU}`
  const channelId = data.channels[Math.floor(Math.random() * data.channels.length)]
  const message = generateMessage(channelId, userId)

  const startTime = Date.now()

  // Send message via API
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    tags: { name: 'send_message' },
  }

  const response = http.post(`${API_URL}/api/messages`, JSON.stringify(message), params)

  const endTime = Date.now()
  const latency = endTime - startTime

  // Track metrics
  messagesSent.add(1)
  apiResponseTime.add(latency)

  // Validate response
  const success = check(response, {
    'Status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'Response has message ID': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.id !== undefined
      } catch (e) {
        return false
      }
    },
    'Response time < 500ms': (r) => latency < 500,
  })

  if (success) {
    messagesDelivered.add(1)
    messageLatency.add(latency)
    deliveryRate.add(true)
  } else {
    messageFailed.add(1)
    deliveryRate.add(false)
    console.error(`Message failed: ${response.status} - ${response.body}`)
  }

  // Optional: Verify message was persisted (sample 10% of messages)
  if (Math.random() < 0.1 && response.status === 200) {
    const messageId = JSON.parse(response.body).id
    const verifyRes = http.get(`${API_URL}/api/messages/${messageId}`, {
      headers: { 'X-User-Id': userId },
      tags: { name: 'verify_message' },
    })

    check(verifyRes, {
      'Message persisted': (r) => r.status === 200,
    })
  }
}

// Teardown function - runs once at end
export function teardown(data) {
  // Clean up test channels (optional)
  console.log('Cleaning up test data...')

  for (const channelId of data.channels) {
    http.del(`${API_URL}/api/channels/${channelId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  console.log('Cleanup complete')
}

export function handleSummary(data) {
  const summary = generateSummary(data)

  return {
    'test-results/message-throughput-summary.json': JSON.stringify(data, null, 2),
    'test-results/message-throughput-report.txt': summary,
    stdout: summary,
  }
}

function generateSummary(data) {
  const metrics = data.metrics

  let summary = '\n' + '='.repeat(80) + '\n'
  summary += 'Message Throughput Load Test - 1,000 Messages/Second\n'
  summary += '='.repeat(80) + '\n\n'

  // Throughput metrics
  const duration = (data.state.testRunDurationMs || 0) / 1000
  const messagesSentTotal = metrics.messages_sent?.values?.count || 0
  const messagesDeliveredTotal = metrics.messages_delivered?.values?.count || 0
  const messagesFailedTotal = metrics.messages_failed?.values?.count || 0
  const actualRate = messagesSentTotal / duration

  summary += 'Throughput Metrics:\n'
  summary += `  Target Rate: ${TARGET_RATE} msg/sec\n`
  summary += `  Actual Rate: ${actualRate.toFixed(2)} msg/sec\n`
  summary += `  Total Messages Sent: ${messagesSentTotal}\n`
  summary += `  Messages Delivered: ${messagesDeliveredTotal}\n`
  summary += `  Messages Failed: ${messagesFailedTotal}\n`
  summary += `  Delivery Rate: ${((metrics.delivery_rate?.values?.rate || 0) * 100).toFixed(2)}%\n\n`

  // Latency metrics
  summary += 'Latency Metrics:\n'
  summary += `  Average Latency: ${(metrics.message_latency?.values?.avg || 0).toFixed(2)}ms\n`
  summary += `  p50 Latency: ${(metrics.message_latency?.values?.['p(50)'] || 0).toFixed(2)}ms\n`
  summary += `  p95 Latency: ${(metrics.message_latency?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  p99 Latency: ${(metrics.message_latency?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += `  Max Latency: ${(metrics.message_latency?.values?.max || 0).toFixed(2)}ms\n\n`

  // API performance
  summary += 'API Performance:\n'
  summary += `  Average Response Time: ${(metrics.api_response_time?.values?.avg || 0).toFixed(2)}ms\n`
  summary += `  p95 Response Time: ${(metrics.api_response_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary += `  p99 Response Time: ${(metrics.api_response_time?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += `  HTTP Error Rate: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n\n`

  // Test result
  const passed =
    (metrics.delivery_rate?.values?.rate || 0) >= 0.99 &&
    (metrics.message_latency?.values?.['p(95)'] || 999999) < 200

  summary += 'Test Result: ' + (passed ? '✅ PASSED' : '❌ FAILED') + '\n'
  summary += '='.repeat(80) + '\n'

  return summary
}
