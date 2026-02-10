# Load Testing Suite

Performance and load testing suite for nself-chat using k6.

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Test Scenarios

### 1. Smoke Test

Quick validation with minimal load (10 users, 1 minute)

```bash
k6 run --env SCENARIO=smoke api-load-test.js
```

### 2. Load Test

Normal expected load (ramps to 500 users over 16 minutes)

```bash
k6 run --env SCENARIO=load api-load-test.js
```

### 3. Stress Test

Beyond normal load to test limits (up to 2,000 users)

```bash
k6 run --env SCENARIO=stress api-load-test.js
```

### 4. Spike Test

Sudden traffic spike simulation

```bash
k6 run --env SCENARIO=spike api-load-test.js
```

### 5. Soak Test

Sustained load over extended period (1 hour)

```bash
k6 run --env SCENARIO=soak api-load-test.js
```

### 6. Scalability Test

Target capacity test (10,000 users, 85 minutes)

```bash
k6 run --env SCENARIO=scalability api-load-test.js
```

### 7. Breakpoint Test

Find system limits (keeps increasing load until failure)

```bash
k6 run --env SCENARIO=breakpoint api-load-test.js
```

## Environment Variables

Configure test parameters via environment variables:

```bash
# Base URLs
export BASE_URL=http://localhost:3000
export API_URL=http://localhost:8080/v1/graphql
export WS_URL=ws://localhost:8080/v1/graphql

# Test configuration
export SCENARIO=load
export TEST_USERS=1000
export USER_BATCH_SIZE=100

# Run test
k6 run api-load-test.js
```

## Interpreting Results

### Good Results ✅

```
✓ http_req_duration..........: avg=45ms  p(95)=89ms  p(99)=156ms
✓ http_req_failed............: 0.12%
✓ message_send_duration......: avg=32ms  p(95)=67ms
✓ cache_hit_rate.............: 78%
```

- p95 < 100ms
- Error rate < 1%
- Cache hit > 70%

### Warning Signs ⚠️

```
⚠ http_req_duration..........: avg=180ms p(95)=340ms p(99)=678ms
⚠ http_req_failed............: 4.5%
⚠ cache_hit_rate.............: 42%
```

- p95 > 200ms
- Error rate > 5%
- Cache hit < 50%

## Output Files

Test results are saved to:

```
scripts/load-test/results/
├── summary.json          # Overall test summary
├── metrics.csv           # Detailed metrics
└── report.html          # HTML report
```

Generate HTML report:

```bash
k6 run --out json=results/metrics.json api-load-test.js
k6 report results/metrics.json --out results/report.html
```

## Monitoring During Tests

### Watch k6 Output

```bash
k6 run api-load-test.js
```

### Monitor Application

```bash
# Application logs
docker-compose logs -f app

# Database connections
psql -h localhost -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Redis stats
redis-cli INFO stats

# PgBouncer pools
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS;"
```

### System Resources

```bash
# CPU and Memory
htop

# Network
iftop

# Disk I/O
iotop
```

## Troubleshooting

### Connection Refused

```
WARN[0005] Request Failed  error="dial tcp: lookup localhost: no such host"
```

**Solution**: Verify services are running

```bash
docker-compose ps
curl http://localhost:8080/healthz
```

### Out of Memory

```
ERRO[0234] thresholds: failed  error="not enough memory"
```

**Solution**: Reduce concurrent users or increase available memory

```bash
export SCENARIO=load  # Use smaller scenario
k6 run --vus 100 api-load-test.js  # Override VUs
```

### Rate Limiting

```
✗ http_req_failed............: 45.2%  (rate limit errors)
```

**Solution**: Adjust rate limits in application or space out requests

```javascript
// In test script
sleep(randomIntBetween(1, 3))
```

## Best Practices

1. **Start Small**: Run smoke test first, then gradually increase load
2. **Monitor Resources**: Watch CPU, memory, and database connections
3. **Realistic Data**: Use representative test data
4. **Clean State**: Reset database between major tests
5. **Incremental Load**: Use ramping scenarios, not sudden spikes
6. **Document Baselines**: Record baseline metrics for comparison
7. **Test in Isolation**: Run load tests on dedicated environment

## Performance Targets

| Metric            | Target (p95) | Target (p99) |
| ----------------- | ------------ | ------------ |
| API Response      | <100ms       | <200ms       |
| WebSocket Latency | <50ms        | <100ms       |
| Database Query    | <50ms        | <100ms       |
| Error Rate        | <1%          | <5%          |
| Cache Hit Rate    | >70%         | >60%         |

## Continuous Integration

Add to CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run smoke test
        run: |
          k6 run --env SCENARIO=smoke scripts/load-test/api-load-test.js
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: scripts/load-test/results/
```

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)
- [Performance Testing Guide](../docs/Performance-Optimization.md)
