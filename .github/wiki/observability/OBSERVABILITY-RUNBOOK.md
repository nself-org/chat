# Observability Runbook

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Status**: Production Ready

This runbook provides step-by-step procedures for investigating production issues, debugging errors, and maintaining the observability infrastructure.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Investigating Errors](#investigating-errors)
3. [Performance Debugging](#performance-debugging)
4. [Alert Response Procedures](#alert-response-procedures)
5. [Common Issues](#common-issues)
6. [Debugging Workflows](#debugging-workflows)
7. [Metrics Reference](#metrics-reference)
8. [Dashboard Guide](#dashboard-guide)

---

## Quick Reference

### Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Sentry | https://sentry.io/organizations/nself-chat | Error tracking |
| Grafana | http://localhost:3000 | Metrics dashboard |
| Prometheus | http://localhost:9090 | Metrics storage |
| Application Logs | Docker logs | Structured logs |
| Metrics Endpoint | http://localhost:3000/api/metrics | Prometheus scrape |
| Health Check | http://localhost:3000/api/health | Service status |

### Key Metrics

```bash
# View real-time metrics
curl http://localhost:3000/api/metrics

# Check application health
curl http://localhost:3000/api/health

# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# View active alerts
curl http://localhost:9090/api/v1/alerts
```

### Log Commands

```bash
# View application logs
docker logs nself-chat-app -f

# View logs with timestamps
docker logs nself-chat-app --timestamps

# View last 100 lines
docker logs nself-chat-app --tail 100

# View logs from last hour
docker logs nself-chat-app --since 1h

# Search logs for errors
docker logs nself-chat-app 2>&1 | grep ERROR

# Search logs by request ID
docker logs nself-chat-app 2>&1 | grep "req-abc123"
```

---

## Investigating Errors

### Step 1: Identify the Error

**Check Sentry Dashboard**:
1. Go to https://sentry.io/organizations/nself-chat
2. View "Issues" tab
3. Sort by "Last Seen" or "Events"
4. Look for patterns in error messages

**Check Application Logs**:
```bash
# Recent errors
docker logs nself-chat-app --tail 500 | grep ERROR

# Errors in last hour
docker logs nself-chat-app --since 1h | grep ERROR
```

### Step 2: Gather Context

**From Sentry**:
- Error message and stack trace
- Affected users (count and IDs)
- Release version
- Environment (production/staging)
- Breadcrumbs (user actions before error)
- Tags (route, feature, etc.)

**From Logs**:
```bash
# Find request ID from Sentry
REQUEST_ID="req-abc123"

# Get full request context
docker logs nself-chat-app 2>&1 | grep $REQUEST_ID

# Get surrounding logs (10 lines before/after)
docker logs nself-chat-app 2>&1 | grep -A 10 -B 10 $REQUEST_ID
```

### Step 3: Reproduce Locally

1. Check release version in Sentry
2. Checkout that version: `git checkout <commit-sha>`
3. Start application: `pnpm dev`
4. Follow steps from breadcrumbs
5. Check browser console and network tab

### Step 4: Analyze Root Cause

**Common Patterns**:

| Error Type | Likely Cause | Investigation |
|------------|--------------|---------------|
| TypeError: Cannot read property 'X' | Null/undefined value | Check data flow |
| Network Error | API down or timeout | Check backend health |
| 401 Unauthorized | Auth token expired | Check token refresh |
| 500 Internal Server Error | Server-side exception | Check API logs |
| Database Error | Query timeout/deadlock | Check DB metrics |
| WebSocket Error | Connection dropped | Check WS latency |

**Check Related Metrics**:
```bash
# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=http_request_duration_seconds'

# Check error rate
curl 'http://localhost:9090/api/v1/query?query=rate(http_requests_total{status=~"5.."}[5m])'
```

### Step 5: Fix and Verify

1. Create fix in feature branch
2. Write test to prevent regression
3. Deploy to staging
4. Verify fix in Sentry (wait 1 hour)
5. Deploy to production
6. Monitor for 24 hours

---

## Performance Debugging

### Identify Performance Issues

**Symptoms**:
- Slow page loads
- Delayed API responses
- High WebSocket latency
- Database query timeouts

**Check Grafana Dashboard**:
1. Open http://localhost:3000/d/performance
2. Look for spikes in:
   - Response time (P95, P99)
   - Error rate
   - CPU/Memory usage
   - Database connections

### Debugging Slow API Endpoints

**Step 1: Identify Slow Endpoint**

```bash
# Query Prometheus for slowest endpoints
curl -G 'http://localhost:9090/api/v1/query' \
  --data-urlencode 'query=topk(10, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))'
```

**Step 2: Analyze Request**

In Sentry:
1. Go to Performance tab
2. Find transaction by endpoint
3. View flame graph
4. Identify slow spans (database, external API, etc.)

**Step 3: Check Database Queries**

```bash
# Check Hasura metrics
curl http://hasura:8080/v1/metrics

# Check PostgreSQL slow queries
docker exec -it postgres psql -U postgres -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Step 4: Optimize**

Common fixes:
- Add database index
- Implement query batching
- Add Redis caching
- Use GraphQL field limiting
- Implement pagination

**Step 5: Verify Improvement**

```bash
# Compare metrics before/after
curl 'http://localhost:9090/api/v1/query_range?query=histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{endpoint="/api/messages"}[5m]))&start=<before>&end=<after>&step=60'
```

### Debugging Memory Leaks

**Symptoms**:
- Gradual memory increase over time
- Memory usage doesn't decrease after load
- Out of memory errors

**Investigation**:

```bash
# Check memory usage trend
curl 'http://localhost:9090/api/v1/query?query=node_memory_MemAvailable_bytes'

# Check memory by process
docker stats nself-chat-app

# Take heap snapshot
node --inspect-brk src/server.js
```

**Common Causes**:
- Event listeners not cleaned up
- Global variables accumulating data
- WebSocket connections not closed
- Database connections not released
- Large in-memory caches

**Fix and Verify**:
1. Identify leaking component
2. Add cleanup in useEffect return
3. Implement connection pooling
4. Add cache TTL and eviction
5. Monitor memory over 24 hours

---

## Alert Response Procedures

### Critical Alerts

#### HighCPUUsage (Critical)

**Alert**: CPU usage > 95% for 2 minutes

**Response**:
1. **Acknowledge**: Respond within 5 minutes
2. **Assess**: Check Grafana CPU dashboard
3. **Identify**: Find process causing high CPU
   ```bash
   docker exec nself-chat-app top -b -n 1
   ```
4. **Mitigate**:
   - If infinite loop: Restart app
   - If high load: Scale horizontally
   - If attack: Enable rate limiting
5. **Document**: Create incident report

#### CriticalMemoryUsage

**Alert**: Available memory < 10% for 2 minutes

**Response**:
1. **Acknowledge**: Respond within 5 minutes
2. **Check**: Memory usage by process
   ```bash
   docker stats nself-chat-app
   ```
3. **Mitigate**:
   - Restart app to clear memory
   - Increase container memory limit
   - Clear Redis cache if needed
4. **Investigate**: Check for memory leaks
5. **Monitor**: Watch memory over next hour

#### CriticalAPILatency

**Alert**: P95 API latency > 1s for 2 minutes

**Response**:
1. **Acknowledge**: Respond within 10 minutes
2. **Identify**: Find slow endpoints
   - Check Sentry Performance
   - Query Prometheus metrics
3. **Check Dependencies**:
   - Database query time
   - External API calls
   - Cache hit rate
4. **Mitigate**:
   - Enable aggressive caching
   - Reduce query complexity
   - Increase connection pool
5. **Document**: Root cause and fix

#### CriticalErrorRate

**Alert**: Error rate > 5% for 2 minutes

**Response**:
1. **Acknowledge**: Immediately (< 2 minutes)
2. **Assess Impact**:
   - Check Sentry for error types
   - Identify affected endpoints
   - Count affected users
3. **Mitigate**:
   - If deployment issue: Rollback
   - If dependency down: Enable fallback
   - If database issue: Check DB health
4. **Communicate**: Post status update
5. **Resolve**: Deploy fix
6. **Post-Mortem**: Within 24 hours

### Warning Alerts

#### HighAPILatency (Warning)

**Alert**: P95 API latency > 500ms for 5 minutes

**Response**:
1. Acknowledge within 30 minutes
2. Investigate slow endpoints
3. Check database query performance
4. Schedule optimization work
5. Monitor trend over next day

#### HighErrorRate (Warning)

**Alert**: Error rate > 1% for 5 minutes

**Response**:
1. Acknowledge within 30 minutes
2. Check Sentry for error patterns
3. Identify affected users
4. Create fix if widespread
5. Monitor for escalation

#### LowCacheHitRate

**Alert**: Redis cache hit rate < 80% for 10 minutes

**Response**:
1. Acknowledge within 1 hour
2. Check cache configuration
3. Verify TTL settings
4. Review cache keys being used
5. Optimize cache strategy

---

## Common Issues

### Issue: High Error Rate After Deployment

**Symptoms**:
- Sudden spike in errors after deployment
- Errors in Sentry with new release tag

**Investigation**:
```bash
# Check recent deployments
git log -10 --oneline

# Check Sentry release
curl https://sentry.io/api/0/organizations/nself-chat/releases/
```

**Resolution**:
1. Review changes in deployment
2. Check for breaking API changes
3. Rollback if critical: `git revert <commit>`
4. Deploy fix
5. Add tests to prevent regression

### Issue: WebSocket Connections Dropping

**Symptoms**:
- Users report disconnections
- High reconnection rate in metrics

**Investigation**:
```bash
# Check WebSocket metrics
curl 'http://localhost:9090/api/v1/query?query=rate(websocket_disconnections_total[5m])'

# Check nginx logs
docker logs nginx | grep WebSocket
```

**Resolution**:
1. Check nginx timeout settings
2. Verify WebSocket heartbeat
3. Check load balancer configuration
4. Increase connection limits if needed

### Issue: Database Connection Pool Exhausted

**Symptoms**:
- "Too many connections" errors
- Slow query performance

**Investigation**:
```bash
# Check connection count
docker exec postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"

# Check max connections
docker exec postgres psql -U postgres -c \
  "SHOW max_connections;"
```

**Resolution**:
1. Identify connection leaks
2. Ensure connections are properly released
3. Increase max_connections if needed
4. Implement connection pooling

### Issue: Sentry Quota Exceeded

**Symptoms**:
- Warning emails from Sentry
- Events being dropped

**Investigation**:
1. Check Sentry quota usage
2. Identify noisy errors
3. Review error grouping

**Resolution**:
1. Add ignoreErrors for known issues
2. Implement error sampling
3. Increase quota if needed
4. Fix root cause of errors

---

## Debugging Workflows

### Frontend Issue Workflow

```
1. User Reports Issue
   ↓
2. Check Browser Console
   - Error messages
   - Network failures
   - Warnings
   ↓
3. Check Sentry
   - Error details
   - Breadcrumbs
   - User context
   ↓
4. Check Network Tab
   - API responses
   - Status codes
   - Timing
   ↓
5. Reproduce Locally
   - Follow breadcrumbs
   - Check React DevTools
   - Add console.logs
   ↓
6. Identify Root Cause
   ↓
7. Fix and Test
   ↓
8. Deploy
   ↓
9. Verify in Production
```

### Backend Issue Workflow

```
1. Alert Triggered
   ↓
2. Check Grafana
   - Identify affected metric
   - Find spike timing
   - Correlate with deployment
   ↓
3. Check Logs
   - Filter by time range
   - Search for errors
   - Find request IDs
   ↓
4. Check Sentry
   - Error details
   - Stack traces
   - User impact
   ↓
5. Check Dependencies
   - Database health
   - Redis health
   - External APIs
   ↓
6. Reproduce Locally
   - Use same data
   - Test with curl/Postman
   ↓
7. Identify Root Cause
   ↓
8. Fix and Test
   ↓
9. Deploy
   ↓
10. Monitor Metrics
```

### Performance Issue Workflow

```
1. Slow Response Reported
   ↓
2. Check Metrics
   - Response time (P95, P99)
   - Error rate
   - Throughput
   ↓
3. Identify Slow Endpoint
   - Query Prometheus
   - Check Sentry Performance
   ↓
4. Analyze Traces
   - View flame graph
   - Find slow spans
   ↓
5. Check Database
   - Query performance
   - Connection count
   - Indexes
   ↓
6. Check Cache
   - Hit rate
   - TTL
   - Memory usage
   ↓
7. Profile Code
   - Add instrumentation
   - Measure execution time
   ↓
8. Optimize
   - Add indexes
   - Implement caching
   - Optimize queries
   ↓
9. Measure Improvement
   ↓
10. Deploy and Monitor
```

---

## Metrics Reference

### Key Performance Indicators (KPIs)

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Response time (P95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Response time (P99)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Active WebSocket connections
websocket_connections_active

# Messages per second
rate(messages_sent_total[5m])

# Active users (last 5 minutes)
count(user_activity_timestamp > (time() - 300))

# Cache hit rate
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)

# Database connections
pg_stat_database_numbackends

# Queue depth
message_queue_depth
```

### System Metrics

```promql
# CPU usage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Disk usage
(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100

# Network throughput
rate(node_network_receive_bytes_total[5m])
rate(node_network_transmit_bytes_total[5m])
```

---

## Dashboard Guide

### Performance Overview Dashboard

**URL**: http://localhost:3000/d/performance

**Panels**:
1. Request Rate: Total requests per second
2. Response Time (P95/P99): API latency percentiles
3. Error Rate: Percentage of failed requests
4. Active WebSocket Connections: Current connection count
5. CPU Usage: Server CPU utilization
6. Memory Usage: Server memory utilization
7. Database Connections: Active DB connections
8. Cache Hit Rate: Redis cache efficiency

**How to Use**:
- Set time range (default: last 1 hour)
- Use variables to filter by endpoint, status code
- Click on graph to zoom in
- Hover for exact values
- Use annotations to mark deployments

### Business Metrics Dashboard

**URL**: http://localhost:3000/d/business

**Panels**:
1. Messages Sent: Message throughput
2. Active Users: User activity
3. Channels Created: Channel growth
4. File Uploads: Storage usage
5. Search Queries: Search activity

---

## Maintenance Tasks

### Daily

```bash
# Check system health
curl http://localhost:3000/api/health

# Review overnight errors
# Go to Sentry → Last 24 hours

# Check disk space
df -h

# Review active alerts
curl http://localhost:9090/api/v1/alerts
```

### Weekly

```bash
# Review performance trends
# Open Grafana → Last 7 days

# Check Sentry quota usage
# Sentry → Settings → Usage

# Clean up old logs
docker system prune -f

# Review slow queries
docker exec postgres psql -U postgres -c \
  "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Monthly

```bash
# Review and update alert thresholds
# Based on observed patterns

# Clean up unused metrics
# Remove metrics with no data

# Review observability costs
# Sentry usage
# Storage costs

# Update runbook
# Document new issues and solutions
```

---

## Escalation Paths

### Severity Levels

| Level | Response Time | Escalation |
|-------|---------------|------------|
| Critical | 5 minutes | Immediate escalation |
| High | 30 minutes | Escalate if not resolved in 1 hour |
| Medium | 4 hours | Escalate if not resolved in 8 hours |
| Low | 24 hours | Track in backlog |

### Contact Information

```
On-Call Engineer: [Your team's on-call rotation]
Engineering Manager: [Manager contact]
DevOps Lead: [DevOps contact]
Emergency Contact: [Emergency escalation]
```

### Incident Response

1. **Acknowledge**: Respond to alert
2. **Assess**: Determine severity and impact
3. **Communicate**: Post status update
4. **Mitigate**: Immediate fix or rollback
5. **Resolve**: Deploy permanent fix
6. **Post-Mortem**: Document lessons learned

---

## Additional Resources

### Documentation
- Sentry Documentation: https://docs.sentry.io
- Prometheus Query Language: https://prometheus.io/docs/prometheus/latest/querying/basics/
- Grafana Documentation: https://grafana.com/docs/

### Internal Links
- Architecture Docs: `/.wiki/ARCHITECTURE.md`
- API Documentation: `/docs/API.md`
- Deployment Guide: `/docs/DEPLOYMENT.md`

### Useful Commands

```bash
# Restart application
docker-compose restart nself-chat-app

# View real-time logs
docker-compose logs -f

# Check service health
docker-compose ps

# Access database
docker-compose exec postgres psql -U postgres

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

---

## Conclusion

This runbook covers the most common observability scenarios. For issues not covered here:

1. Check Sentry for similar errors
2. Search internal documentation
3. Consult with team
4. Update this runbook with solution

**Last Updated**: February 9, 2026
**Next Review**: March 9, 2026
