# ɳChat Performance Testing Guide

## Overview

This guide covers performance testing for ɳChat with 10,000 concurrent users. It includes load testing, benchmarking, monitoring setup, and optimization recommendations.

**Target Specifications:**

- 10,000 concurrent WebSocket connections
- 1,000 messages per second throughput
- Sub-200ms message latency (p95)
- Sub-500ms API response time (p95)
- 99%+ delivery success rate

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Load Testing Tools](#load-testing-tools)
3. [Test Scenarios](#test-scenarios)
4. [Running Tests](#running-tests)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Performance Targets](#performance-targets)
7. [Optimization Guide](#optimization-guide)
8. [Troubleshooting](#troubleshooting)

---

## Test Environment Setup

### Prerequisites

```bash
# Install k6 (load testing)
brew install k6

# Install Artillery (WebSocket load testing)
npm install -g artillery

# Install monitoring tools (via Docker)
docker-compose -f docker-compose.monitoring.yml up -d
```

### Environment Configuration

Create `.env.test` file:

```bash
# API Configuration
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000

# Database
POSTGRES_MAX_CONNECTIONS=200
POSTGRES_SHARED_BUFFERS=2GB
POSTGRES_WORK_MEM=50MB

# Redis Cache
REDIS_MAXMEMORY=4GB
REDIS_MAXMEMORY_POLICY=allkeys-lru

# WebSocket
WEBSOCKET_MAX_CONNECTIONS=15000
WEBSOCKET_HEARTBEAT_INTERVAL=10s

# Performance Tuning
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"
UV_THREADPOOL_SIZE=128
```

### Resource Requirements

**Minimum Hardware:**

- CPU: 8 cores (16 recommended)
- RAM: 16GB (32GB recommended)
- Disk: 100GB SSD
- Network: 1Gbps

**Cloud Instance Recommendations:**

- AWS: c6i.4xlarge or c6i.8xlarge
- GCP: n2-highcpu-16 or n2-highcpu-32
- Azure: F16s v2 or F32s v2

---

## Load Testing Tools

### k6 (Primary Tool)

k6 is used for most load tests due to its powerful scripting capabilities and accurate metrics.

**Features:**

- High-performance load generation
- Custom metrics and thresholds
- VU (Virtual User) scheduling
- JSON output for analysis

**Installation:**

```bash
brew install k6
# or
wget https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-macos-amd64.tar.gz
```

### Artillery (WebSocket-specific)

Artillery is used for WebSocket-specific testing scenarios.

**Installation:**

```bash
npm install -g artillery
```

### Autocannon (HTTP Benchmarking)

Autocannon for quick HTTP benchmarking.

**Installation:**

```bash
npm install -g autocannon
```

---

## Test Scenarios

### 1. WebSocket Connections (10k Concurrent Users)

**File:** `tests/load/websocket-connections.js`

**Purpose:** Test WebSocket connection stability with 10,000 concurrent users.

**Metrics:**

- Connection time (p95, p99)
- Active connections
- Message latency
- Connection errors
- Messages sent/received

**Run:**

```bash
k6 run tests/load/websocket-connections.js
```

**Custom Configuration:**

```bash
k6 run \
  --env WS_URL="wss://your-domain.com" \
  --env VUS=10000 \
  --env DURATION="30m" \
  tests/load/websocket-connections.js
```

---

### 2. Message Throughput (1,000 msg/sec)

**File:** `tests/load/message-throughput.js`

**Purpose:** Test message processing capacity and end-to-end latency.

**Metrics:**

- Messages sent per second
- Delivery rate
- Message latency (p50, p95, p99)
- API response time
- Failed message count

**Run:**

```bash
k6 run tests/load/message-throughput.js
```

**Custom Configuration:**

```bash
k6 run \
  --env API_URL="https://api.your-domain.com" \
  --env TARGET_RATE=1000 \
  --env DURATION="10m" \
  tests/load/message-throughput.js
```

---

### 3. API Endpoints Load Test

**File:** `tests/load/api-endpoints.js`

**Purpose:** Test all major API endpoints under load to identify bottlenecks.

**Endpoints Tested:**

- `/api/auth/refresh`
- `/api/channels`
- `/api/messages`
- `/api/search`
- `/api/users/me`
- `/api/notifications`

**Metrics:**

- Request rate
- Response time (p50, p95, p99)
- Error rate
- Endpoint-specific performance

**Run:**

```bash
k6 run tests/load/api-endpoints.js
```

---

### 4. File Upload Load Test

**File:** `tests/load/file-uploads.js`

**Purpose:** Test file upload performance with various file sizes.

**File Sizes:**

- Small: 100KB
- Medium: 1MB
- Large: 10MB
- X-Large: 50MB

**Metrics:**

- Upload time (p95, p99)
- Upload speed (Mbps)
- Processing time
- Success rate
- Failed uploads

**Run:**

```bash
k6 run tests/load/file-uploads.js
```

---

### 5. Search Performance Load Test

**File:** `tests/load/search-queries.js`

**Purpose:** Test search performance with large index (1M+ messages).

**Metrics:**

- Query time (p95, p99)
- Results count
- Relevance score
- Index time
- Cache hit rate

**Run:**

```bash
k6 run tests/load/search-queries.js
```

---

## Running Tests

### Quick Start

Run all tests with default configuration:

```bash
./tests/load/run-all-tests.sh
```

### Individual Tests

Run specific tests:

```bash
# WebSocket test only
k6 run tests/load/websocket-connections.js

# Message throughput only
k6 run tests/load/message-throughput.js

# API endpoints only
k6 run tests/load/api-endpoints.js
```

### Custom Configuration

Override environment variables:

```bash
export API_URL="https://staging.your-domain.com"
export TARGET_USERS=5000
./tests/load/run-all-tests.sh
```

### Staged Load Testing

Test with gradual ramp-up:

```bash
# Stage 1: 1,000 users
k6 run --env VUS=1000 tests/load/websocket-connections.js

# Stage 2: 5,000 users
k6 run --env VUS=5000 tests/load/websocket-connections.js

# Stage 3: 10,000 users
k6 run --env VUS=10000 tests/load/websocket-connections.js
```

---

## Monitoring & Metrics

### Grafana Dashboards

**Access:** http://localhost:3000/grafana (default)

**Dashboards:**

1. **Performance Overview** - Real-time performance metrics
2. **System Resources** - CPU, memory, disk, network
3. **Database Performance** - Query performance, connections
4. **WebSocket Metrics** - Connections, messages, latency
5. **Cache Performance** - Redis hit rate, memory usage

**Setup:**

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana
open http://localhost:3000/grafana

# Default credentials
Username: admin
Password: admin
```

### Prometheus Metrics

**Access:** http://localhost:9090

**Key Metrics:**

- `http_request_duration_seconds` - HTTP request latency
- `websocket_connections_active` - Active WebSocket connections
- `messages_sent_total` - Total messages sent
- `pg_stat_database_numbackends` - Database connections
- `redis_keyspace_hits_total` - Cache hits

### Real-time Monitoring

Monitor tests in real-time:

```bash
# Watch active connections
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=websocket_connections_active | jq'

# Watch message rate
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=rate(messages_sent_total[1m]) | jq'

# Watch error rate
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[1m]) | jq'
```

---

## Performance Targets

### Tier 1: Critical Thresholds

These MUST be met for production readiness:

| Metric                          | Target | Acceptable |
| ------------------------------- | ------ | ---------- |
| WebSocket Connection Time (p95) | <500ms | <1s        |
| Message Latency (p95)           | <100ms | <200ms     |
| API Response Time (p95)         | <200ms | <500ms     |
| Concurrent Users                | 10,000 | 5,000      |
| Messages/Second                 | 1,000  | 500        |
| Error Rate                      | <0.1%  | <1%        |
| Delivery Success Rate           | >99.9% | >99%       |

### Tier 2: Quality Targets

These should be met for optimal user experience:

| Metric                    | Target | Acceptable |
| ------------------------- | ------ | ---------- |
| Page Load Time (FCP)      | <1.5s  | <3s        |
| Database Query Time (p95) | <50ms  | <100ms     |
| Cache Hit Rate            | >90%   | >80%       |
| CPU Usage                 | <70%   | <80%       |
| Memory Usage              | <70%   | <80%       |

### Tier 3: Scaling Targets

These indicate system scaling capabilities:

| Metric                | Target  | Acceptable |
| --------------------- | ------- | ---------- |
| Max Concurrent Users  | 15,000+ | 10,000+    |
| Max Messages/Second   | 2,000+  | 1,000+     |
| Database Connections  | 200     | 150        |
| WebSocket Connections | 15,000  | 10,000     |

---

## Optimization Guide

### Database Optimization

**Connection Pooling:**

```typescript
// apollo-client.ts
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
    fetchOptions: {
      // Connection pool settings
      agent: new https.Agent({
        keepAlive: true,
        maxSockets: 50,
      }),
    },
  }),
})
```

**Query Optimization:**

```sql
-- Add indexes for common queries
CREATE INDEX idx_messages_channel_created ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- Optimize full-text search
CREATE INDEX idx_messages_content_gin ON messages USING gin(to_tsvector('english', content));
```

**Connection Configuration:**

```bash
# PostgreSQL tuning (postgresql.conf)
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 8GB
maintenance_work_mem = 1GB
work_mem = 50MB
wal_buffers = 16MB
max_wal_size = 4GB
```

### Cache Optimization

**Redis Configuration:**

```bash
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
maxmemory-samples 10

# Enable persistence
save 900 1
save 300 10
save 60 10000
```

**Application-level Caching:**

```typescript
// Implement cache-aside pattern
async function getMessage(id: string) {
  // Try cache first
  const cached = await redis.get(`message:${id}`)
  if (cached) return JSON.parse(cached)

  // Fetch from database
  const message = await db.getMessage(id)

  // Cache for 1 hour
  await redis.setex(`message:${id}`, 3600, JSON.stringify(message))

  return message
}
```

### WebSocket Optimization

**Connection Management:**

```typescript
// Increase connection limits
const io = new Server(httpServer, {
  maxHttpBufferSize: 1e8, // 100 MB
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  cors: {
    origin: '*',
    credentials: true,
  },
})

// Implement connection throttling
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 connections per minute per IP
})
```

**Message Batching:**

```typescript
// Batch messages to reduce overhead
const messageBuffer: Message[] = []
const BATCH_SIZE = 10
const BATCH_INTERVAL = 100 // ms

function queueMessage(message: Message) {
  messageBuffer.push(message)

  if (messageBuffer.length >= BATCH_SIZE) {
    flushMessages()
  }
}

function flushMessages() {
  if (messageBuffer.length === 0) return

  socket.emit('messages:batch', messageBuffer)
  messageBuffer.length = 0
}

// Flush periodically
setInterval(flushMessages, BATCH_INTERVAL)
```

### API Optimization

**Response Compression:**

```typescript
// next.config.js
module.exports = {
  compress: true,
  poweredByHeader: false,
}
```

**CDN Caching:**

```typescript
// API route
export async function GET(request: Request) {
  const data = await fetchData()

  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Content-Type': 'application/json',
    },
  })
}
```

### Search Optimization

**MeiliSearch Configuration:**

```json
{
  "searchableAttributes": ["content", "title"],
  "filterableAttributes": ["channel_id", "user_id", "created_at"],
  "sortableAttributes": ["created_at", "relevance"],
  "rankingRules": ["words", "typo", "proximity", "attribute", "sort", "exactness"]
}
```

---

## Troubleshooting

### High CPU Usage

**Symptoms:**

- API response times increase
- WebSocket connections drop
- Database queries slow down

**Solutions:**

1. Check for infinite loops or recursive queries
2. Optimize database indexes
3. Implement query caching
4. Scale horizontally (add more instances)

### Memory Leaks

**Symptoms:**

- Memory usage steadily increases
- Application crashes with OOM errors
- Slow performance over time

**Solutions:**

1. Use Node.js profiler: `node --inspect`
2. Analyze heap snapshots
3. Check for unclosed database connections
4. Review event listener cleanup

### Database Connection Exhaustion

**Symptoms:**

- "Too many connections" errors
- Slow database queries
- Failed API requests

**Solutions:**

1. Increase connection pool size
2. Implement connection timeout
3. Use connection pooler (PgBouncer)
4. Monitor active connections

### WebSocket Connection Issues

**Symptoms:**

- Frequent disconnections
- Message delivery failures
- High latency

**Solutions:**

1. Increase heartbeat timeout
2. Implement reconnection logic
3. Use load balancer with sticky sessions
4. Monitor network bandwidth

---

## Test Results Storage

Test results are saved to:

```
tests/load/test-results/
├── 20260203_120000/
│   ├── raw/
│   │   ├── websocket-connections.json
│   │   ├── message-throughput.json
│   │   ├── api-endpoints.json
│   │   ├── file-uploads.json
│   │   └── search-queries.json
│   ├── logs/
│   │   ├── websocket-connections.log
│   │   ├── message-throughput.log
│   │   ├── api-endpoints.log
│   │   ├── file-uploads.log
│   │   └── search-queries.log
│   └── PERFORMANCE-REPORT.md
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin

      - name: Run performance tests
        run: ./tests/load/run-all-tests.sh

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: tests/load/test-results/
```

---

## Additional Resources

- **k6 Documentation:** https://k6.io/docs/
- **Artillery Documentation:** https://www.artillery.io/docs
- **Grafana Dashboards:** https://grafana.com/grafana/dashboards
- **Prometheus Query Language:** https://prometheus.io/docs/prometheus/latest/querying/basics/

---

_Last Updated: February 3, 2026_
_Version: 0.9.1_
