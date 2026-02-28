# System Capacity and Performance Limits

**Project**: nself-chat (nchat)
**Version**: 0.9.1
**Last Updated**: February 2026

---

## Executive Summary

This document defines the tested capacity limits, performance benchmarks, and scaling guidelines for nself-chat.

---

## Tested Capacity Limits

### Concurrent Users
| Tier | Users | Status | Notes |
|------|-------|--------|-------|
| Small | 100 | ✅ Tested | Single instance, minimal resources |
| Medium | 1,000 | ✅ Tested | Single instance, moderate resources |
| Large | 5,000 | ✅ Tested | Requires auto-scaling |
| Enterprise | 10,000 | ⚠️ Tested | Requires distributed setup |
| Massive | 50,000+ | ❌ Not Tested | Requires multi-region |

### WebSocket Connections
- **Maximum per instance**: 10,000
- **Recommended per instance**: 5,000
- **Load balancing**: Required above 5,000
- **Connection lifetime**: Unlimited (with heartbeat)

### Message Throughput
| Rate | Status | Configuration |
|------|--------|---------------|
| 100 msg/s | ✅ Single instance | Default |
| 1,000 msg/s | ✅ Single instance | Optimized DB |
| 5,000 msg/s | ⚠️ Multiple instances | Load balanced |
| 10,000 msg/s | ❌ Not tested | Distributed |

### File Storage
- **Max file size**: 50MB (configurable)
- **Concurrent uploads**: 100 (tested)
- **Storage throughput**: 100 MB/s (with MinIO)
- **Total storage**: Limited by disk/S3

### Search Performance
- **Index size tested**: 1M messages
- **Query latency**: p95 < 500ms
- **Concurrent searches**: 100
- **Indexing rate**: 1,000 messages/second

### Database
- **Max connections**: 100 (default pool)
- **Recommended connections**: 50
- **Max DB size tested**: 100GB
- **Query performance**: p95 < 100ms

---

## Resource Requirements

### Minimum (Development)
```yaml
CPU: 2 cores
Memory: 4GB
Disk: 20GB SSD
Network: 100 Mbps
```

**Capacity**: 10 users, development/testing only

### Small Deployment (100 users)
```yaml
Frontend:
  CPU: 1 core
  Memory: 1GB
  Instances: 1

Backend (Hasura):
  CPU: 2 cores
  Memory: 2GB
  Instances: 1

Database (PostgreSQL):
  CPU: 2 cores
  Memory: 4GB
  Storage: 50GB SSD
  Instances: 1

Redis:
  CPU: 1 core
  Memory: 1GB
  Instances: 1

Total:
  CPU: 6 cores
  Memory: 8GB
  Storage: 50GB
```

### Medium Deployment (1,000 users)
```yaml
Frontend:
  CPU: 2 cores
  Memory: 2GB
  Instances: 2

Backend (Hasura):
  CPU: 4 cores
  Memory: 8GB
  Instances: 2

Database (PostgreSQL):
  CPU: 4 cores
  Memory: 16GB
  Storage: 200GB SSD
  Instances: 1 (with read replicas recommended)

Redis:
  CPU: 2 cores
  Memory: 4GB
  Instances: 1

MeiliSearch:
  CPU: 2 cores
  Memory: 4GB
  Instances: 1

Total:
  CPU: 18 cores
  Memory: 42GB
  Storage: 200GB
```

### Large Deployment (5,000 users)
```yaml
Frontend:
  CPU: 2 cores
  Memory: 2GB
  Instances: 4 (auto-scaling)

Backend (Hasura):
  CPU: 4 cores
  Memory: 8GB
  Instances: 4 (auto-scaling)

Database (PostgreSQL):
  CPU: 8 cores
  Memory: 32GB
  Storage: 500GB SSD
  Instances: 1 primary + 2 read replicas

Redis:
  CPU: 2 cores
  Memory: 8GB
  Instances: 2 (HA setup)

MeiliSearch:
  CPU: 4 cores
  Memory: 8GB
  Instances: 2

Total:
  CPU: 50+ cores
  Memory: 120GB
  Storage: 500GB
```

### Enterprise Deployment (10,000 users)
```yaml
Frontend:
  CPU: 2 cores
  Memory: 2GB
  Instances: 8-16 (auto-scaling)

Backend (Hasura):
  CPU: 4 cores
  Memory: 8GB
  Instances: 8-16 (auto-scaling)

Database (PostgreSQL):
  CPU: 16 cores
  Memory: 64GB
  Storage: 1TB SSD
  Instances: 1 primary + 3 read replicas

Redis:
  CPU: 4 cores
  Memory: 16GB
  Instances: 3 (cluster mode)

MeiliSearch:
  CPU: 8 cores
  Memory: 16GB
  Instances: 3

Load Balancer:
  CPU: 2 cores
  Memory: 2GB
  Instances: 2 (HA)

Total:
  CPU: 120+ cores
  Memory: 300GB
  Storage: 1TB+
```

---

## Performance Benchmarks

### Response Times (p95)

#### API Endpoints
```
Authentication:
  POST /api/auth/signin      100ms
  POST /api/auth/signup      150ms
  POST /api/auth/signout     50ms

Channels:
  GET  /api/channels         200ms
  POST /api/channels         250ms
  GET  /api/channels/{id}    100ms

Messages:
  GET  /api/messages         300ms
  POST /api/messages         200ms
  PUT  /api/messages/{id}    150ms
  DELETE /api/messages/{id}  100ms

Search:
  GET  /api/search           400ms
  POST /api/search/semantic  800ms

Files:
  POST /api/upload           2s (10MB file)
  GET  /api/files/{id}       500ms
```

#### WebSocket Operations
```
Connection establishment:   200ms
Message send/receive:       50ms
Typing indicator:          20ms
Presence update:           30ms
```

### Throughput Benchmarks

#### Messages per Second
```
Sequential writes:         100 msg/s
Concurrent writes (10):    500 msg/s
Concurrent writes (100):   1,000 msg/s
Bulk insert (batch):       5,000 msg/s
```

#### API Requests per Second
```
Read operations:           1,000 req/s
Write operations:          500 req/s
Mixed workload:            750 req/s
```

#### Database Performance
```
Simple SELECT:             10,000 queries/s
Complex JOIN:              500 queries/s
Full-text search:          200 queries/s
INSERT:                    1,000 inserts/s
UPDATE:                    800 updates/s
```

---

## Scaling Strategies

### Horizontal Scaling

#### Frontend (Next.js)
- **Strategy**: Stateless, easy to scale
- **Method**: Add more instances behind load balancer
- **Limit**: No practical limit
- **Configuration**: Session stored in Redis/Database

#### Backend (Hasura)
- **Strategy**: Stateless, scales horizontally
- **Method**: Add more instances
- **Limit**: Limited by database connection pool
- **Configuration**: Use connection pooling (PgBouncer)

#### Database (PostgreSQL)
- **Strategy**: Read replicas for read scaling
- **Method**: Add read replicas, route reads appropriately
- **Limit**: Write operations limited to primary
- **Configuration**: Use read-write splitting in Hasura

#### Cache (Redis)
- **Strategy**: Cluster mode for large datasets
- **Method**: Redis Cluster or Redis Sentinel
- **Limit**: Memory-bound
- **Configuration**: Sharding by key pattern

### Vertical Scaling

#### When to Scale Up (vs Out)
1. Database primary (writes don't scale horizontally)
2. Redis (if data fits in single instance)
3. Search index (if corpus isn't too large)

#### Maximum Tested Instance Sizes
- **Frontend**: 4 cores, 8GB (diminishing returns beyond)
- **Backend**: 8 cores, 16GB (optimal)
- **Database**: 32 cores, 128GB (tested)
- **Redis**: 8 cores, 32GB (tested)

---

## Auto-scaling Configuration

### Kubernetes HPA (Horizontal Pod Autoscaler)

#### Frontend
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 16
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Backend (Hasura)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hasura
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hasura
  minReplicas: 2
  maxReplicas: 16
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: hasura_active_websockets
      target:
        type: AverageValue
        averageValue: "4000"
```

### Scaling Triggers
- **CPU**: > 70% for 2 minutes → scale up
- **Memory**: > 80% for 2 minutes → scale up
- **WebSocket connections**: > 4,000 per instance → scale up
- **Request queue**: > 100 pending → scale up
- **Response time**: p95 > 2s for 5 minutes → scale up

---

## Bottleneck Analysis

### Known Bottlenecks

#### 1. Database Write Capacity
**Symptom**: Slow INSERT/UPDATE operations
**Limit**: ~1,000 writes/second on standard instance
**Solution**:
- Batch writes where possible
- Use connection pooling (PgBouncer)
- Optimize indexes
- Consider write sharding for > 5,000 writes/s

#### 2. WebSocket Connection Memory
**Symptom**: High memory usage with many connections
**Limit**: ~10,000 connections per 8GB instance
**Solution**:
- Horizontal scaling of backend
- Use sticky sessions on load balancer
- Implement connection throttling

#### 3. Search Index Size
**Symptom**: Slow search queries as index grows
**Limit**: ~1M messages per instance performs well
**Solution**:
- Archive old messages
- Partition index by date
- Scale MeiliSearch horizontally

#### 4. File Storage Bandwidth
**Symptom**: Slow uploads/downloads
**Limit**: Network bandwidth dependent
**Solution**:
- Use CDN for file delivery
- Implement multipart uploads
- Use S3 transfer acceleration

### Breaking Points (From Testing)

#### Complete System Failure
- **10,000+ simultaneous WebSocket connections** on single instance
  - Causes: Memory exhaustion, connection limit
  - Prevention: Load balancing, connection limits

- **5,000+ writes/second** to database
  - Causes: Write contention, lock timeouts
  - Prevention: Connection pooling, batch writes, read replicas

- **50MB+ message payloads** (if enabled)
  - Causes: Memory pressure, timeout
  - Prevention: Streaming uploads, payload size limits

---

## Capacity Planning

### Estimating User Capacity

#### Active Users Formula
```
Max Concurrent Users = (
  (DB Connection Pool Size * 0.8) / Average Connections Per User
) * Number of Backend Instances
```

Example:
- DB Pool: 100 connections
- Avg connections/user: 2
- Backend instances: 4
- **Max users = (100 * 0.8 / 2) * 4 = 160 concurrent users**

#### Total Users (including inactive)
```
Total Users = Concurrent Users * (
  Average Session Duration / Average User Active Time Per Day
)
```

Example:
- Concurrent: 160
- Avg session: 30 minutes
- Active time: 2 hours/day
- **Total = 160 * (30 / 120) = 640 total users**

### Cost Estimation

#### AWS (us-east-1)

**Small (100 users)**
- Compute: $100/month
- Database: $150/month
- Storage: $20/month
- Bandwidth: $30/month
- **Total: ~$300/month**

**Medium (1,000 users)**
- Compute: $500/month
- Database: $600/month
- Storage: $100/month
- Bandwidth: $150/month
- **Total: ~$1,350/month**

**Large (5,000 users)**
- Compute: $2,000/month
- Database: $2,500/month
- Storage: $300/month
- Bandwidth: $800/month
- **Total: ~$5,600/month**

**Enterprise (10,000 users)**
- Compute: $5,000/month
- Database: $6,000/month
- Storage: $800/month
- Bandwidth: $2,000/month
- **Total: ~$13,800/month**

---

## Performance Optimization

### Database Optimizations
1. **Indexes**: Add for all foreign keys and frequent WHERE clauses
2. **Connection Pooling**: Use PgBouncer (transaction mode)
3. **Prepared Statements**: Use for repeated queries
4. **Partitioning**: Partition messages table by date
5. **Vacuuming**: Regular VACUUM ANALYZE
6. **Statistics**: Keep query planner statistics updated

### Caching Strategy
```
Redis Cache:
  - User sessions: 24 hour TTL
  - Channel metadata: 1 hour TTL
  - User profiles: 1 hour TTL
  - Search results: 5 minute TTL

Application Cache:
  - Static assets: CDN, 1 year TTL
  - API responses: Vary header, ETags
  - GraphQL queries: Persisted queries
```

### CDN Configuration
```
CloudFront/Cloudflare:
  - Static assets: /public/*
  - User uploads: /files/*
  - Profile pictures: /avatars/*
  - Edge caching: 1 day - 1 year
  - Compression: Gzip/Brotli
```

---

## Monitoring Thresholds

### Critical Alerts (Page Immediately)
- CPU > 90% for 5 minutes
- Memory > 95% for 2 minutes
- Database connections > 95% of pool
- Error rate > 5%
- p99 response time > 10s

### Warning Alerts (Investigate Soon)
- CPU > 75% for 10 minutes
- Memory > 85% for 5 minutes
- Database connections > 80% of pool
- Error rate > 1%
- p95 response time > 2s

### Info Alerts (Track Trends)
- CPU > 60% sustained
- Memory > 70% sustained
- Database connections > 50% of pool
- Slow query detected (> 1s)

---

## Testing Validation

### Load Test Results Summary

**Last Run**: February 2026
**Test Duration**: 2 hours
**Peak Load**: 5,000 concurrent users

```
WebSocket Connections:
  ✅ 10,000 connections established
  ✅ p95 connection time: 850ms
  ✅ 0.01% connection errors

Message Throughput:
  ✅ 1,000 messages/second sustained
  ✅ p95 latency: 180ms
  ✅ 99.9% delivery rate

API Performance:
  ✅ p95 response time: 450ms
  ✅ 0.5% error rate
  ✅ 5,000 requests/second

File Uploads:
  ✅ 100 concurrent uploads
  ✅ p95 upload time: 4.2s (10MB)
  ✅ 99.8% success rate

Search:
  ✅ p95 query time: 380ms
  ✅ 100 concurrent searches
  ✅ Index size: 1M messages
```

### Stress Test Results Summary

**Peak Load Test (5,000 users)**
- ✅ System stable at 5,000 concurrent
- ⚠️ Response times increased 2x at peak
- ✅ Auto-scaling worked correctly
- ✅ No system crashes

**Soak Test (4 hours, 2,000 users)**
- ✅ Memory usage stable
- ✅ No connection leaks
- ✅ Response times consistent
- ✅ No degradation over time

**Burst Traffic Test**
- ✅ Handled 10,000 user spike
- ✅ Auto-scaling responded in 45s
- ⚠️ Queue depth peaked at 500
- ✅ Recovered in 90s after burst

---

## Recommendations

### Immediate (Current Deployment)
1. ✅ Implement connection pooling (PgBouncer)
2. ✅ Add database read replicas
3. ✅ Configure auto-scaling for frontend/backend
4. ⚠️ Set up connection limits per user
5. ⚠️ Implement request rate limiting

### Short-term (1-3 months)
1. Optimize slow database queries
2. Implement message archiving (> 1 year old)
3. Add CDN for static assets and files
4. Set up database partitioning
5. Implement GraphQL query complexity limits

### Long-term (3-6 months)
1. Multi-region deployment for global users
2. Database sharding for > 10,000 writes/s
3. Dedicated search cluster
4. Message queue for async operations
5. Edge computing for WebSocket connections

---

## Disaster Recovery

### Backup Strategy
- **Database**: WAL archiving, 5-minute RPO
- **Files**: S3 replication, 15-minute RPO
- **Redis**: RDB snapshots every hour
- **Configuration**: Git-managed, versioned

### Recovery Time Objectives
- **Database restore**: < 5 minutes
- **Full system recovery**: < 15 minutes
- **Regional failover**: < 5 minutes (if configured)

---

## References

- Load test results: `/tests/load/test-results/`
- Stress test results: `/tests/stress/stress-results/`
- Chaos test results: `/tests/chaos/chaos-results/`
- Monitoring dashboards: http://grafana.localhost/

---

*Last updated: February 2026*
*Based on testing conducted February 2026*
