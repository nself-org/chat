import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const dbErrors = new Counter('database_errors');
const recoveryTime = new Trend('recovery_time_seconds');
const errorRate = new Rate('error_rate');
const requestDuration = new Trend('request_duration');

const API_URL = __ENV.API_URL || 'http://localhost:3000';
const VUS = parseInt(__ENV.VUS) || 100;
const DURATION = __ENV.DURATION || '10m';

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    'error_rate': ['rate<0.5'], // Allow 50% errors during chaos
    'database_errors': ['count>0'], // We expect database errors
    'recovery_time_seconds': ['avg<30'], // Should recover within 30s
  },
};

let dbFailureDetected = false;
let dbFailureTime = null;
let dbRecoveryTime = null;

function authenticate() {
  const authPayload = JSON.stringify({
    email: `chaos-user${__VU}@test.com`,
    password: 'testpassword123',
  });

  try {
    const response = http.post(`${API_URL}/api/auth/signin`, authPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    });

    const success = response.status === 200;

    if (!success && response.status === 500 && response.body.includes('database')) {
      dbErrors.add(1);

      if (!dbFailureDetected) {
        dbFailureDetected = true;
        dbFailureTime = Date.now();
        console.log(`VU ${__VU}: Database failure detected at ${new Date().toISOString()}`);
      }
    }

    if (success && dbFailureDetected && !dbRecoveryTime) {
      dbRecoveryTime = Date.now();
      const recovery = (dbRecoveryTime - dbFailureTime) / 1000;
      recoveryTime.add(recovery);
      console.log(`VU ${__VU}: Database recovered after ${recovery}s`);
    }

    errorRate.add(!success);
    return success ? response.json('token') : null;
  } catch (e) {
    dbErrors.add(1);
    errorRate.add(1);
    return null;
  }
}

function testAPIWithRetry(token) {
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const startTime = Date.now();

  try {
    const response = http.get(`${API_URL}/api/messages?limit=10`, {
      headers,
      timeout: '10s',
    });

    requestDuration.add(Date.now() - startTime);

    const success = response.status === 200;

    if (!success && response.status === 500) {
      dbErrors.add(1);
    }

    check(response, {
      'request succeeded or failed gracefully': (r) => r.status === 200 || r.status === 503 || r.status === 500,
      'has proper error message': (r) => r.status !== 200 ? r.body.includes('temporarily unavailable') || r.body.includes('database') : true,
    });

    errorRate.add(!success);
  } catch (e) {
    dbErrors.add(1);
    errorRate.add(1);
    console.error(`VU ${__VU}: Request failed: ${e.message}`);
  }
}

export default function() {
  // Authenticate
  const token = authenticate();

  sleep(1);

  // Try to fetch data
  testAPIWithRetry(token);

  // Random think time
  sleep(2 + Math.random() * 3);
}

export function setup() {
  console.log('Starting database failure chaos test...');
  console.log(`VUs: ${VUS}`);
  console.log(`Duration: ${DURATION}`);
  console.log('Database will be stopped during this test');
}

export function teardown(data) {
  console.log('Database failure test complete');

  if (dbFailureDetected) {
    console.log(`Database failure was detected`);
    if (dbRecoveryTime) {
      const totalRecovery = (dbRecoveryTime - dbFailureTime) / 1000;
      console.log(`Total recovery time: ${totalRecovery}s`);
    } else {
      console.log('WARNING: Database did not recover during test');
    }
  } else {
    console.log('WARNING: Database failure was not detected');
  }
}
