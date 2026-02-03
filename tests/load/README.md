# ɳChat Performance Load Tests

Comprehensive performance testing infrastructure for validating ɳChat at scale with 10,000 concurrent users.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Run all tests
pnpm test:load

# Or run individual tests
pnpm test:load:websocket   # 10k concurrent WebSocket connections
pnpm test:load:messages    # 1,000 messages/second throughput
pnpm test:load:api         # API endpoints load test
pnpm test:load:files       # File upload performance
pnpm test:load:search      # Search query performance
```

## Test Scenarios

### 1. WebSocket Connections (10k Users)

- **File**: `websocket-connections.js`
- **Target**: 10,000 concurrent connections
- **Duration**: 30 minutes sustained
- **Metrics**: Connection time, message latency, stability

### 2. Message Throughput (1,000 msg/sec)

- **File**: `message-throughput.js`
- **Target**: 1,000 messages/second
- **Duration**: 10 minutes
- **Metrics**: Throughput, latency, delivery rate

### 3. API Endpoints

- **File**: `api-endpoints.js`
- **Target**: 100 concurrent VUs
- **Duration**: 5 minutes
- **Endpoints**: Auth, Channels, Messages, Search, Users, Notifications

### 4. File Uploads

- **File**: `file-uploads.js`
- **Target**: 100 concurrent uploads
- **Sizes**: 100KB - 50MB
- **Duration**: 5 minutes

### 5. Search Queries

- **File**: `search-queries.js`
- **Target**: 100 concurrent queries
- **Index**: 1M+ messages
- **Duration**: 5 minutes

## Performance Targets

| Metric                     | Target | Acceptable |
| -------------------------- | ------ | ---------- |
| WebSocket Connection (p95) | <500ms | <1s        |
| Message Latency (p95)      | <100ms | <200ms     |
| API Response (p95)         | <200ms | <500ms     |
| Concurrent Users           | 10,000 | 5,000      |
| Messages/Second            | 1,000  | 500        |
| Error Rate                 | <0.1%  | <1%        |

## Monitoring

**Grafana Dashboard**: http://localhost:3000/grafana

- Performance overview
- System resources
- Database metrics
- WebSocket metrics
- Cache performance

**Prometheus**: http://localhost:9090

- Raw metrics and queries
- Alert rules
- Target health

## Results

Test results are saved to:

```
test-results/
└── YYYYMMDD_HHMMSS/
    ├── raw/              # JSON test data
    ├── logs/             # Test execution logs
    └── PERFORMANCE-REPORT.md
```

## Documentation

- **Full Guide**: [../docs/PERFORMANCE-TESTING-GUIDE.md](../../docs/PERFORMANCE-TESTING-GUIDE.md)
- **Report Template**: [../docs/PERFORMANCE-REPORT-TEMPLATE.md](../../docs/PERFORMANCE-REPORT-TEMPLATE.md)

## Configuration

Environment variables:

```bash
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
VUS=10000
DURATION=30m
```

## CI/CD Integration

```yaml
# .github/workflows/performance.yml
- name: Run performance tests
  run: pnpm test:load
```

---

**Version**: 0.9.1
**Last Updated**: February 3, 2026
