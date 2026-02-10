/**
 * WebSocket Load Test - 10,000 Concurrent Users
 *
 * Tests WebSocket connection stability with high concurrent user count.
 * Monitors connection time, message latency, and connection stability.
 *
 * Usage:
 *   k6 run tests/load/websocket-connections.js
 *
 * Environment Variables:
 *   WS_URL - WebSocket URL (default: ws://localhost:3000)
 *   VUS - Virtual users (default: 10000)
 *   DURATION - Test duration (default: 30m)
 */

import ws from 'k6/ws'
import { check, sleep } from 'k6'
import { Counter, Trend, Gauge } from 'k6/metrics'

// Custom metrics
const connectionTime = new Trend('ws_connection_time', true)
const messageLatency = new Trend('ws_message_latency', true)
const activeConnections = new Gauge('ws_active_connections')
const messagesSent = new Counter('ws_messages_sent')
const messagesReceived = new Counter('ws_messages_received')
const connectionErrors = new Counter('ws_connection_errors')

// Configuration
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000/socket.io/'
const VUS = parseInt(__ENV.VUS || '10000')
const DURATION = __ENV.DURATION || '30m'

// Test stages - ramp up to 10k users over 5 minutes
export const options = {
  stages: [
    { duration: '5m', target: 1000 }, // Ramp up to 1k
    { duration: '5m', target: 5000 }, // Ramp to 5k
    { duration: '5m', target: 10000 }, // Ramp to 10k
    { duration: DURATION, target: 10000 }, // Hold at 10k
    { duration: '5m', target: 5000 }, // Ramp down to 5k
    { duration: '5m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    ws_connection_time: ['p(95)<1000', 'p(99)<2000'], // 95% under 1s, 99% under 2s
    ws_message_latency: ['p(95)<200', 'p(99)<500'], // 95% under 200ms, 99% under 500ms
    ws_connection_errors: ['count<100'], // Less than 100 errors total
    checks: ['rate>0.95'], // 95% of checks pass
  },
}

export default function () {
  const userId = `user_${__VU}_${Date.now()}`
  const startTime = Date.now()

  const url = `${WS_URL}?userId=${userId}`

  const res = ws.connect(url, {}, function (socket) {
    const connTime = Date.now() - startTime
    connectionTime.add(connTime)
    activeConnections.add(1)

    // Connection established
    check(socket, {
      'WebSocket connected': (s) => s !== null,
    })

    // Handle incoming messages
    socket.on('open', () => {
      console.log(`User ${userId} connected`)

      // Send authentication/join message
      socket.send(
        JSON.stringify({
          type: 'auth',
          userId: userId,
          timestamp: Date.now(),
        })
      )
    })

    socket.on('message', (data) => {
      const msg = JSON.parse(data)
      messagesReceived.add(1)

      // Calculate latency if timestamp present
      if (msg.timestamp) {
        const latency = Date.now() - msg.timestamp
        messageLatency.add(latency)
      }

      check(msg, {
        'Message received': (m) => m !== null,
        'Message has type': (m) => m.type !== undefined,
      })
    })

    socket.on('error', (e) => {
      console.error(`WebSocket error for ${userId}:`, e)
      connectionErrors.add(1)
    })

    socket.on('close', () => {
      console.log(`User ${userId} disconnected`)
      activeConnections.add(-1)
    })

    // Send periodic heartbeat/ping messages
    const interval = setInterval(() => {
      if (socket.readyState === 1) {
        // OPEN
        socket.send(
          JSON.stringify({
            type: 'ping',
            userId: userId,
            timestamp: Date.now(),
          })
        )
        messagesSent.add(1)
      } else {
        clearInterval(interval)
      }
    }, 10000) // Ping every 10 seconds

    // Keep connection alive for random duration (simulate varied user sessions)
    const sessionDuration = Math.random() * 60000 + 30000 // 30-90 seconds
    socket.setTimeout(() => {
      console.log(`User ${userId} ending session`)
      clearInterval(interval)
      socket.close()
    }, sessionDuration)
  })

  // Check connection result
  check(res, {
    'WebSocket connection successful': (r) => r && r.status === 101,
  })

  if (!res || res.status !== 101) {
    connectionErrors.add(1)
  }

  // Small sleep between iterations
  sleep(1)
}

export function handleSummary(data) {
  return {
    'test-results/websocket-connections-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data, options) {
  const indent = options.indent || ''
  const enableColors = options.enableColors || false

  let summary = '\n' + indent + '='.repeat(80) + '\n'
  summary += indent + 'WebSocket Load Test - 10,000 Concurrent Users\n'
  summary += indent + '='.repeat(80) + '\n\n'

  // Test metrics
  const metrics = data.metrics

  summary += indent + 'Connection Metrics:\n'
  summary += indent + `  Total Connections: ${metrics.ws_active_connections?.values?.value || 0}\n`
  summary +=
    indent +
    `  Connection Time (p95): ${(metrics.ws_connection_time?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary +=
    indent +
    `  Connection Time (p99): ${(metrics.ws_connection_time?.values?.['p(99)'] || 0).toFixed(2)}ms\n`
  summary += indent + `  Connection Errors: ${metrics.ws_connection_errors?.values?.count || 0}\n\n`

  summary += indent + 'Message Metrics:\n'
  summary += indent + `  Messages Sent: ${metrics.ws_messages_sent?.values?.count || 0}\n`
  summary += indent + `  Messages Received: ${metrics.ws_messages_received?.values?.count || 0}\n`
  summary +=
    indent +
    `  Message Latency (p95): ${(metrics.ws_message_latency?.values?.['p(95)'] || 0).toFixed(2)}ms\n`
  summary +=
    indent +
    `  Message Latency (p99): ${(metrics.ws_message_latency?.values?.['p(99)'] || 0).toFixed(2)}ms\n\n`

  summary += indent + 'Check Results:\n'
  summary += indent + `  Pass Rate: ${((metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%\n`

  summary += indent + '='.repeat(80) + '\n'

  return summary
}
