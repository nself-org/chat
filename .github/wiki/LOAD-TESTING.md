# Load, Stress, and Chaos Testing Guide

**Project**: nself-chat (nchat)
**Version**: 0.9.1
**Last Updated**: February 2026

---

## Overview

This document describes the comprehensive testing strategy for validating nself-chat's performance, reliability, and resilience under various load conditions and failure scenarios.

---

## Test Suite Structure

```
tests/
├── load/                    # Load testing (k6)
│   ├── run-all-tests.sh    # Master test runner
│   ├── websocket-connections.js
│   ├── message-throughput.js
│   ├── api-endpoints.js
│   ├── file-uploads.js
│   └── search-queries.js
├── stress/                  # Stress testing
│   ├── stress-test-runner.sh
│   ├── peak-load.js        # 5,000 concurrent users
│   ├── sustained-load.js   # 4-8 hour soak test
│   ├── burst-traffic.js    # Traffic spike patterns
│   ├── connection-pool.js  # DB connection exhaustion
│   ├── memory-stress.js    # Large payload testing
│   └── endurance.js        # 8+ hour endurance test
└── chaos/                   # Chaos engineering
    ├── chaos-test-runner.sh
    ├── database-failure.js
    ├── network-partition.js
    ├── service-crashes.js
    ├── resource-exhaustion.js
    └── cascading-failures.js
```

---

## Load Testing

### Purpose
Validate system performance under normal and peak load conditions.

### Test Scenarios

#### 1. WebSocket Connections (10,000 Concurrent)
**Target**: 10,000 concurrent WebSocket connections
**Duration**: 30 minutes
**Metrics**:
- Connection time (p95 < 1s, p99 < 2s)
- Message latency (p95 < 200ms)
- Connection errors (< 100 total)

**Run**:
```bash
pnpm test:load:websocket
```

#### 2. Message Throughput (1,000/sec)
**Target**: 1,000 messages per second
**Duration**: 10 minutes
**Metrics**:
- Delivery rate (> 99%)
- Message latency (p95 < 200ms, p99 < 500ms)
- Database write performance

**Run**:
```bash
pnpm test:load:messages
```

#### 3. API Endpoints
**Target**: 100 concurrent users
**Duration**: 5 minutes
**Endpoints**: Auth, Channels, Messages, Search, Users, Notifications

**Metrics**:
- Response time (p95 < 500ms)
- Error rate (< 1%)
- Throughput (requests/second)

**Run**:
```bash
pnpm test:load:api
```

#### 4. File Uploads
**Target**: 100 concurrent uploads
**Duration**: 5 minutes
**File sizes**: 100KB - 50MB

**Metrics**:
- Upload time (p95 < 5s for 10MB)
- Success rate (> 99%)
- Storage throughput

**Run**:
```bash
pnpm test:load:files
```

#### 5. Search Queries
**Target**: 100 concurrent searches
**Duration**: 5 minutes
**Index size**: 1M+ messages

**Metrics**:
- Query time (p95 < 500ms)
- Relevance score
- Index performance

**Run**:
```bash
pnpm test:load:search
```

### Run All Load Tests
```bash
pnpm test:load

# Or with custom parameters
API_URL=https://staging.example.com tests/load/run-all-tests.sh
```

### Load Test Results
Results are saved to `tests/load/test-results/[timestamp]/`:
- `raw/` - JSON metrics from k6
- `logs/` - Console output logs
- `PERFORMANCE-REPORT.md` - Summary report

---

## Stress Testing

### Purpose
Identify system breaking points and performance degradation under extreme conditions.

### Test Scenarios

#### 1. Peak Load (5,000 Users)
**Description**: Ramp up to maximum capacity
**Duration**: 30 minutes (5m ramp-up + 20m sustained + 5m ramp-down)

**Pass Criteria**:
- p95 response time < 2s
- Error rate < 5%
- No system crashes
- Auto-scaling triggers correctly

#### 2. Sustained Load (4 Hours)
**Description**: Soak test for memory leaks and resource exhaustion
**Load**: 2,000 concurrent users
**Duration**: 4 hours (configurable up to 8 hours)

**Pass Criteria**:
- Memory usage stable (no upward trend)
- Response times remain consistent
- No connection pool leaks
- No file descriptor leaks

#### 3. Burst Traffic Pattern
**Description**: Recurring traffic spikes
**Pattern**: 100 users → 10,000 users → 100 users (repeat)
**Burst Duration**: 2 minutes
**Rest Period**: 5 minutes

**Pass Criteria**:
- Auto-scaling responds within 1 minute
- No dropped connections
- Queue backpressure works
- Recovery time < 2 minutes

#### 4. Database Connection Pool Stress
**Description**: Exhaust database connection pool
**Load**: 500 concurrent users with high query rate
**Duration**: 10 minutes

**Pass Criteria**:
- Connection pool doesn't exhaust
- Proper connection reuse
- Graceful handling of pool saturation

#### 5. Memory Stress (Large Payloads)
**Description**: Test with 10MB message payloads
**Load**: 200 concurrent users
**Duration**: 15 minutes

**Pass Criteria**:
- No out-of-memory errors
- Proper streaming for large files
- GC pause times < 100ms

#### 6. Endurance Test (8 Hours)
**Description**: Long-term stability validation
**Load**: 2,000 concurrent users
**Duration**: 8 hours

**Pass Criteria**:
- No memory growth beyond 10%
- Consistent response times
- No resource leaks

### Run Stress Tests
```bash
# Run all stress tests (prompts for endurance test)
cd tests/stress
./stress-test-runner.sh

# Run individual test
API_URL=http://localhost:3000 k6 run tests/stress/peak-load.js
```

### Stress Test Results
Results are saved to `tests/stress/stress-results/[timestamp]/`:
- `raw/` - JSON metrics
- `logs/` - Console output
- `STRESS-TEST-REPORT.md` - Summary report

---

## Chaos Engineering

### Purpose
Validate system resilience under failure conditions and verify disaster recovery procedures.

### Test Scenarios

#### 1. Database Failure and Recovery
**Chaos**: Complete database failure for 60 seconds
**Load**: 100 concurrent users

**Expected Behavior**:
- Graceful error messages
- Requests queue or timeout appropriately
- Auto-reconnect on recovery
- No data corruption
- Recovery within 30 seconds

#### 2. Network Partition
**Chaos**:
- Phase 1: 500ms network latency (2 minutes)
- Phase 2: 30% packet loss (2 minutes)

**Expected Behavior**:
- Graceful timeout handling
- Retry logic works correctly
- WebSocket auto-reconnect
- No cascading failures

#### 3. Service Crashes
**Chaos**: Random crashes of Hasura, Auth, Storage services
**Pattern**: 30s down, 90s recovery, repeat

**Expected Behavior**:
- Health checks detect failures
- Load balancer routes around failed instances
- Services auto-restart
- State recovers correctly

#### 4. Resource Exhaustion
**Chaos**: Fill disk with 5GB of data
**Duration**: 5 minutes

**Expected Behavior**:
- Graceful handling of disk full errors
- Alerts triggered
- No service crashes
- Recovery after disk space freed

#### 5. Cascading Failures
**Chaos**: Multiple failures in sequence
- Stage 1: Redis cache failure
- Stage 2: Network latency (200ms)
- Stage 3: Service instance failure

**Expected Behavior**:
- Circuit breakers prevent cascade
- Bulkheads isolate failures
- Graceful degradation
- Core functionality remains

### Run Chaos Tests
```bash
# WARNING: Do NOT run against production!
cd tests/chaos
./chaos-test-runner.sh

# Run with Kubernetes
USE_K8S=true ./chaos-test-runner.sh
```

### Chaos Test Results
Results are saved to `tests/chaos/chaos-results/[timestamp]/`:
- `raw/` - JSON metrics
- `logs/` - Console output
- `screenshots/` - Error screenshots
- `CHAOS-REPORT.md` - Summary report

---

## Performance Targets

### Response Times
| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| API (GET) | < 100ms | < 500ms | < 1000ms |
| API (POST) | < 200ms | < 1000ms | < 2000ms |
| WebSocket | < 50ms | < 200ms | < 500ms |
| Search | < 200ms | < 500ms | < 1000ms |
| File Upload | < 1s | < 5s | < 10s |

### Throughput
- Messages: 1,000/second sustained
- API Requests: 10,000/second
- Concurrent Users: 10,000
- WebSocket Connections: 10,000

### Resource Limits
- Memory: < 4GB per instance
- CPU: < 80% sustained
- Disk I/O: < 500 IOPS
- Network: < 1Gbps

---

## Monitoring During Tests

### Grafana Dashboards
Access during tests:
```
http://grafana.localhost/dashboards
```

**Key Metrics**:
- CPU usage per service
- Memory usage and GC activity
- Database connection pool
- Request latency histograms
- Error rates
- Queue depths

### Real-time Monitoring
```bash
# Watch Docker stats
docker stats

# Watch k6 output
k6 run --out influxdb=http://localhost:8086/k6 test.js

# Watch Postgres connections
docker exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Prerequisites

### Required Tools
```bash
# Install k6
brew install k6

# Install Artillery (optional)
npm install -g artillery

# Install Chaos Toolkit (optional)
pip install chaostoolkit
```

### Backend Services
Ensure all backend services are running:
```bash
cd .backend
nself status

# Should show:
# ✓ postgres
# ✓ hasura
# ✓ auth
# ✓ storage
# ✓ redis
# ✓ meilisearch
```

---

## Best Practices

### Before Testing
1. **Baseline**: Run tests on known-good build first
2. **Monitoring**: Ensure Grafana/Prometheus are running
3. **Backups**: Backup database before chaos tests
4. **Isolation**: Use staging environment, never production
5. **Resources**: Ensure sufficient system resources

### During Testing
1. **Monitor**: Watch dashboards actively
2. **Document**: Screenshot any issues
3. **Log**: Save all console output
4. **Alert**: Set up alerts for critical thresholds

### After Testing
1. **Review**: Analyze all reports
2. **Compare**: Compare against baseline
3. **Document**: Document any regressions
4. **Fix**: Create issues for problems found
5. **Repeat**: Run tests after fixes

---

## Interpreting Results

### Success Criteria
✅ **PASS**: All thresholds met, no critical errors
⚠️ **CONDITIONAL**: Minor threshold violations, non-critical issues
❌ **FAIL**: Major threshold violations, system crashes, data corruption

### Common Issues

#### High Response Times
- **Cause**: Database query inefficiency, N+1 queries
- **Solution**: Add indexes, optimize queries, implement caching

#### Memory Leaks
- **Cause**: WebSocket connections not cleaned up, event listeners
- **Solution**: Ensure proper cleanup, use weak references

#### Connection Pool Exhaustion
- **Cause**: Long-running queries, connections not returned
- **Solution**: Increase pool size, add query timeouts, optimize queries

#### Cascading Failures
- **Cause**: Missing circuit breakers, tight coupling
- **Solution**: Add circuit breakers, implement bulkheads, graceful degradation

---

## Continuous Testing

### CI/CD Integration
```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Load Tests
        run: |
          pnpm test:load
      - name: Upload Results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: tests/load/test-results/
```

### Regular Schedule
- **Daily**: Quick smoke tests (5 minutes)
- **Weekly**: Full load test suite (1 hour)
- **Monthly**: Stress tests (4-8 hours)
- **Quarterly**: Chaos engineering exercises

---

## Disaster Recovery Validation

### Scenarios to Test
1. ✅ Database failure and restore from backup
2. ✅ Complete datacenter failure
3. ✅ Partial service degradation
4. ✅ DDoS attack simulation
5. ✅ Data corruption recovery

### Recovery Time Objectives (RTO)
- **Critical services**: < 5 minutes
- **Core functionality**: < 15 minutes
- **Full functionality**: < 60 minutes

### Recovery Point Objectives (RPO)
- **Database**: < 5 minutes (WAL archiving)
- **File storage**: < 15 minutes (S3 replication)
- **Search index**: < 1 hour (rebuild from DB)

---

## Resources

### Documentation
- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Chaos Toolkit](https://chaostoolkit.org/)

### Grafana Dashboards
- k6 Performance: http://grafana.localhost/d/k6-performance
- System Metrics: http://grafana.localhost/d/system-metrics
- Database Performance: http://grafana.localhost/d/postgres

### Related Docs
- `/docs/DEPLOYMENT.md` - Deployment guide
- `/docs/MONITORING.md` - Monitoring setup
- `.claude/implementation/RUNBOOK.md` - Operations runbook

---

## Contact

For questions about load testing:
- Review results in `tests/*/test-results/`
- Check Grafana dashboards
- See `.claude/COMMON-ISSUES.md` for troubleshooting

---

*Last updated: February 2026*
*Test suite version: 1.0.0*
