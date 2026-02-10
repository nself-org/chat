import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const burstResponseTime = new Trend('burst_response_time');
const normalResponseTime = new Trend('normal_response_time');
const burstErrorRate = new Rate('burst_errors');
const normalErrorRate = new Rate('normal_errors');
const queueDepth = new Trend('queue_depth');
const recoveryTime = new Trend('recovery_time_seconds');

// Environment variables
const API_URL = __ENV.API_URL || 'http://localhost:3000';
const BASE_VUS = parseInt(__ENV.BASE_VUS) || 100;
const BURST_VUS = parseInt(__ENV.BURST_VUS) || 10000;
const BURST_DURATION = __ENV.BURST_DURATION || '2m';
const REST_DURATION = __ENV.REST_DURATION || '5m';
const TOTAL_DURATION = __ENV.TOTAL_DURATION || '30m';

// Calculate stages for burst pattern
function generateBurstStages() {
  const stages = [];
  const burstMinutes = 2; // 2 min burst
  const restMinutes = 5;  // 5 min rest
  const totalMinutes = 30;

  let currentTime = 0;

  while (currentTime < totalMinutes) {
    // Ramp up to burst
    stages.push({ duration: '30s', target: BURST_VUS });
    currentTime += 0.5;

    // Stay at burst
    stages.push({ duration: `${burstMinutes}m`, target: BURST_VUS });
    currentTime += burstMinutes;

    // Ramp down to base
    stages.push({ duration: '30s', target: BASE_VUS });
    currentTime += 0.5;

    // Rest period
    if (currentTime < totalMinutes) {
      stages.push({ duration: `${restMinutes}m`, target: BASE_VUS });
      currentTime += restMinutes;
    }
  }

  return stages;
}

export const options = {
  scenarios: {
    burst_traffic: {
      executor: 'ramping-vus',
      startVUs: BASE_VUS,
      stages: generateBurstStages(),
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    'burst_response_time': ['p(95)<5000', 'p(99)<10000'],
    'normal_response_time': ['p(95)<1000', 'p(99)<2000'],
    'burst_errors': ['rate<0.1'],
    'normal_errors': ['rate<0.01'],
    'recovery_time_seconds': ['avg<120'], // Should recover within 2 minutes
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Track if we're in a burst period
let inBurst = false;
let burstStartTime = null;
let burstEndTime = null;

function isBurstPeriod() {
  // Detect burst based on VU count
  return __VU > BASE_VUS;
}

function authenticate() {
  const authPayload = JSON.stringify({
    email: `burst-user${__VU}@test.com`,
    password: 'testpassword123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = http.post(`${API_URL}/api/auth/signin`, authPayload, params);

  const inBurstNow = isBurstPeriod();
  const success = response.status === 200;

  if (inBurstNow) {
    burstErrorRate.add(!success);
  } else {
    normalErrorRate.add(!success);
  }

  return response.json('token');
}

function testAPIUnderBurst(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const inBurstNow = isBurstPeriod();

  // Track burst state changes
  if (inBurstNow && !inBurst) {
    inBurst = true;
    burstStartTime = Date.now();
    console.log(`VU ${__VU}: Burst started`);
  } else if (!inBurstNow && inBurst) {
    inBurst = false;
    burstEndTime = Date.now();
    console.log(`VU ${__VU}: Burst ended`);
  }

  group('API During Burst', () => {
    // Send message
    const startTime = Date.now();
    const messagePayload = JSON.stringify({
      content: `Burst test message from VU ${__VU}`,
      channelId: 'burst-test-channel',
    });

    const sendRes = http.post(`${API_URL}/api/messages`, messagePayload, { headers });
    const responseTime = Date.now() - startTime;

    if (inBurstNow) {
      burstResponseTime.add(responseTime);
      check(sendRes, {
        'burst: message sent or queued': (r) => r.status === 200 || r.status === 201 || r.status === 202,
      }) || burstErrorRate.add(1);
    } else {
      normalResponseTime.add(responseTime);
      check(sendRes, {
        'normal: message sent': (r) => r.status === 200 || r.status === 201,
      }) || normalErrorRate.add(1);
    }

    // Check queue depth from response headers
    if (sendRes.headers['X-Queue-Depth']) {
      queueDepth.add(parseInt(sendRes.headers['X-Queue-Depth']));
    }

    sleep(0.5);

    // Get messages
    const messagesRes = http.get(`${API_URL}/api/messages?limit=20`, { headers });
    const messagesResponseTime = Date.now() - startTime;

    if (inBurstNow) {
      burstResponseTime.add(messagesResponseTime);
    } else {
      normalResponseTime.add(messagesResponseTime);
    }
  });
}

function testWebSocketUnderBurst(token) {
  const wsUrl = `${WS_URL}/api/ws?token=${token}`;
  const inBurstNow = isBurstPeriod();

  const connectStart = Date.now();

  const res = ws.connect(wsUrl, { timeout: '30s' }, (socket) => {
    const connectTime = Date.now() - connectStart;

    if (inBurstNow) {
      burstResponseTime.add(connectTime);
    } else {
      normalResponseTime.add(connectTime);
    }

    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'join', channel: 'burst-test' }));
    });

    socket.on('error', (e) => {
      if (inBurstNow) {
        burstErrorRate.add(1);
      } else {
        normalErrorRate.add(1);
      }
    });

    // Keep connection for 1-5 minutes
    const duration = (60 + Math.random() * 240) * 1000;
    socket.setTimeout(() => {
      socket.close();
    }, duration);

    // Send periodic messages
    const interval = socket.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'message',
          content: 'Burst test',
          timestamp: Date.now(),
        }));
      }
    }, 10000);

    socket.on('close', () => {
      socket.clearInterval(interval);
    });
  });

  const success = res && res.status === 101;
  if (inBurstNow) {
    burstErrorRate.add(!success);
  } else {
    normalErrorRate.add(!success);
  }
}

function measureRecoveryTime(token) {
  if (burstEndTime && Date.now() - burstEndTime < 300000) { // Within 5 min of burst end
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    // Measure response time after burst
    const startTime = Date.now();
    const res = http.get(`${API_URL}/api/messages?limit=10`, { headers });
    const responseTime = Date.now() - startTime;

    if (res.status === 200 && responseTime < 1000) {
      // System has recovered
      const recoveryDuration = (Date.now() - burstEndTime) / 1000;
      recoveryTime.add(recoveryDuration);
      console.log(`VU ${__VU}: System recovered in ${recoveryDuration}s`);
      burstEndTime = null; // Reset
    }
  }
}

export default function() {
  // Authenticate
  const token = authenticate();
  if (!token) {
    return;
  }

  sleep(1);

  // 70% test API
  if (Math.random() < 0.7) {
    testAPIUnderBurst(token);
  }

  // 30% test WebSocket
  if (Math.random() < 0.3) {
    testWebSocketUnderBurst(token);
  }

  // Measure recovery after burst
  measureRecoveryTime(token);

  // Variable think time
  const thinkTime = isBurstPeriod() ? 1 + Math.random() * 2 : 5 + Math.random() * 10;
  sleep(thinkTime);
}

export function setup() {
  console.log('Starting burst traffic pattern test...');
  console.log(`Base load: ${BASE_VUS} VUs`);
  console.log(`Burst load: ${BURST_VUS} VUs`);
  console.log(`Total duration: ${TOTAL_DURATION}`);
}

export function teardown(data) {
  console.log('Burst traffic test complete');
}
