import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Custom metrics for memory leak detection
const memoryUsage = new Gauge('memory_usage_mb');
const activeConnections = new Gauge('active_connections');
const gcPauseTime = new Trend('gc_pause_time_ms');
const responseTimeDrift = new Trend('response_time_drift');
const errorRate = new Rate('errors');

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';
const VUS = parseInt(__ENV.VUS) || 2000;
const DURATION = __ENV.DURATION || '4h';
const RAMP_UP = __ENV.RAMP_UP || '10m';

// Test configuration for soak testing
export const options = {
  scenarios: {
    sustained_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: VUS },     // Ramp up
        { duration: DURATION, target: VUS },    // Sustained load
        { duration: '10m', target: 0 },         // Ramp down
      ],
      gracefulRampDown: '1m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    response_time_drift: ['avg<100'], // Response times shouldn't drift more than 100ms
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Track baseline metrics
let baselineResponseTime = null;
let iterationCount = 0;

function authenticate() {
  const authPayload = JSON.stringify({
    email: `soak-user${__VU}@test.com`,
    password: 'testpassword123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = http.post(`${API_URL}/api/auth/signin`, authPayload, params);

  check(response, {
    'auth successful': (r) => r.status === 200,
  }) || errorRate.add(1);

  return response.json('token');
}

function monitorSystemMetrics(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
  };

  // Get system metrics
  const metricsRes = http.get(`${API_URL}/api/metrics`, { headers });

  if (metricsRes.status === 200) {
    const metrics = metricsRes.json();

    // Track memory usage
    if (metrics.memory) {
      memoryUsage.add(metrics.memory.heapUsed / 1024 / 1024);
    }

    // Track active connections
    if (metrics.connections) {
      activeConnections.add(metrics.connections.active);
    }

    // Track GC pause times
    if (metrics.gc) {
      gcPauseTime.add(metrics.gc.pauseTime);
    }
  }
}

function testLongLivedConnection(token) {
  const wsUrl = `${WS_URL}/api/ws?token=${token}`;

  const res = ws.connect(wsUrl, {}, (socket) => {
    let messagesSent = 0;
    let messagesReceived = 0;

    socket.on('open', () => {
      // Send initial message
      socket.send(JSON.stringify({ type: 'join', channel: 'soak-test' }));
    });

    socket.on('message', (data) => {
      messagesReceived++;
    });

    socket.on('error', (e) => {
      errorRate.add(1);
      console.error('WebSocket error:', e);
    });

    // Send periodic heartbeat every 30 seconds
    const heartbeatInterval = socket.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    // Send occasional message every 2-5 minutes
    const messageInterval = socket.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        messagesSent++;
        socket.send(JSON.stringify({
          type: 'message',
          content: `Soak test message ${messagesSent}`,
          timestamp: Date.now(),
        }));
      }
    }, (120 + Math.random() * 180) * 1000);

    // Keep connection alive for 10-30 minutes
    const connectionDuration = (600 + Math.random() * 1200) * 1000;
    socket.setTimeout(() => {
      socket.clearInterval(heartbeatInterval);
      socket.clearInterval(messageInterval);

      console.log(`VU ${__VU}: Closing connection after ${connectionDuration/1000}s. Sent: ${messagesSent}, Received: ${messagesReceived}`);
      socket.close();
    }, connectionDuration);
  });

  check(res, {
    'long-lived connection established': (r) => r && r.status === 101,
  }) || errorRate.add(1);
}

function performNormalActivity(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('Normal User Activity', () => {
    // List channels
    const startTime = Date.now();
    const channelsRes = http.get(`${API_URL}/api/channels`, { headers });
    const responseTime = Date.now() - startTime;

    // Track response time drift
    if (baselineResponseTime === null) {
      baselineResponseTime = responseTime;
    } else {
      const drift = Math.abs(responseTime - baselineResponseTime);
      responseTimeDrift.add(drift);
    }

    check(channelsRes, {
      'channels loaded': (r) => r.status === 200,
      'response time stable': (r) => r.timings.duration < baselineResponseTime * 1.5,
    }) || errorRate.add(1);

    sleep(5 + Math.random() * 10);

    // Get messages
    const messagesRes = http.get(`${API_URL}/api/messages?limit=50`, { headers });
    check(messagesRes, {
      'messages loaded': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(10 + Math.random() * 20);

    // Send a message occasionally (10% of requests)
    if (Math.random() < 0.1) {
      const messagePayload = JSON.stringify({
        content: `Soak test message from VU ${__VU}`,
        channelId: 'soak-test-channel',
      });

      const sendRes = http.post(`${API_URL}/api/messages`, messagePayload, { headers });
      check(sendRes, {
        'message sent': (r) => r.status === 200 || r.status === 201,
      }) || errorRate.add(1);
    }

    sleep(5 + Math.random() * 10);
  });
}

export default function() {
  iterationCount++;

  // Authenticate
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }

  sleep(2);

  // Monitor system metrics every 100 iterations
  if (iterationCount % 100 === 0) {
    monitorSystemMetrics(token);
  }

  // 40% maintain long-lived connections
  if (Math.random() < 0.4) {
    testLongLivedConnection(token);
  }

  // 60% perform normal activity
  if (Math.random() < 0.6) {
    performNormalActivity(token);
  }

  // Variable think time to simulate real users
  sleep(30 + Math.random() * 60);
}

export function setup() {
  console.log('Starting sustained load (soak) test...');
  console.log(`Target VUs: ${VUS}`);
  console.log(`Duration: ${DURATION}`);
  console.log('Monitoring for memory leaks and resource exhaustion...');
}

export function teardown(data) {
  console.log('Sustained load test complete');
  console.log(`Total iterations: ${iterationCount}`);
}
