import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const connectionTime = new Trend('connection_time', true);
const messageLatency = new Trend('message_latency', true);
const errorRate = new Rate('errors');
const wsErrors = new Counter('websocket_errors');

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';
const VUS = parseInt(__ENV.VUS) || 5000;
const DURATION = __ENV.DURATION || '30m';
const RAMP_UP = __ENV.RAMP_UP || '5m';
const RAMP_DOWN = __ENV.RAMP_DOWN || '5m';

// Test configuration
export const options = {
  scenarios: {
    peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: VUS },      // Ramp up to peak
        { duration: DURATION, target: VUS },     // Stay at peak
        { duration: RAMP_DOWN, target: 0 },      // Ramp down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    connection_time: ['p(95)<1000', 'p(99)<2000'],
    message_latency: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.05'],
    websocket_errors: ['count<100'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Generate random test data
function generateRandomMessage() {
  const messages = [
    'Hello, how are you?',
    'This is a test message',
    'Can you help me with this?',
    'Great work everyone!',
    'Let me know if you need anything',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Authenticate user
function authenticate() {
  const authPayload = JSON.stringify({
    email: `user${__VU}@test.com`,
    password: 'testpassword123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = http.post(`${API_URL}/api/auth/signin`, authPayload, params);

  check(response, {
    'auth successful': (r) => r.status === 200,
    'has auth token': (r) => r.json('token') !== undefined,
  }) || errorRate.add(1);

  return response.json('token');
}

// Test HTTP API endpoints
function testAPIEndpoints(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('API Endpoints', () => {
    // Get channels
    const channelsRes = http.get(`${API_URL}/api/channels`, { headers });
    check(channelsRes, {
      'channels list status 200': (r) => r.status === 200,
      'channels response time OK': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(0.5);

    // Get messages
    const messagesRes = http.get(`${API_URL}/api/messages`, { headers });
    check(messagesRes, {
      'messages list status 200': (r) => r.status === 200,
      'messages response time OK': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(0.5);

    // Send message
    const messagePayload = JSON.stringify({
      content: generateRandomMessage(),
      channelId: 'test-channel-1',
    });

    const sendRes = http.post(`${API_URL}/api/messages`, messagePayload, { headers });
    check(sendRes, {
      'message sent successfully': (r) => r.status === 200 || r.status === 201,
      'message send time OK': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);
  });
}

// Test WebSocket connections
function testWebSocket(token) {
  const wsUrl = `${WS_URL}/api/ws?token=${token}`;
  const startTime = Date.now();

  const res = ws.connect(wsUrl, {}, (socket) => {
    connectionTime.add(Date.now() - startTime);

    socket.on('open', () => {
      // Send heartbeat
      socket.send(JSON.stringify({ type: 'ping' }));
    });

    socket.on('message', (data) => {
      const message = JSON.parse(data);
      const latency = Date.now() - message.timestamp;
      messageLatency.add(latency);
    });

    socket.on('error', (e) => {
      wsErrors.add(1);
      console.error('WebSocket error:', e);
    });

    // Keep connection alive for 30-60 seconds
    const duration = 30 + Math.random() * 30;
    socket.setTimeout(() => {
      socket.close();
    }, duration * 1000);

    // Send periodic messages
    const interval = socket.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'message',
          content: generateRandomMessage(),
          timestamp: Date.now(),
        }));
      }
    }, 5000);

    socket.on('close', () => {
      socket.clearInterval(interval);
    });
  });

  check(res, {
    'websocket connected': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

// Main test function
export default function() {
  // Authenticate
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }

  sleep(1);

  // 70% of users test HTTP APIs
  if (Math.random() < 0.7) {
    testAPIEndpoints(token);
    sleep(2 + Math.random() * 3);
  }

  // 30% of users maintain WebSocket connections
  if (Math.random() < 0.3) {
    testWebSocket(token);
  }

  // Random think time
  sleep(1 + Math.random() * 4);
}

// Setup function
export function setup() {
  console.log('Starting peak load test...');
  console.log(`Target VUs: ${VUS}`);
  console.log(`Duration: ${DURATION}`);
  console.log(`Ramp-up: ${RAMP_UP}`);
  console.log(`Ramp-down: ${RAMP_DOWN}`);
}

// Teardown function
export function teardown(data) {
  console.log('Peak load test complete');
}
