# Disaster Recovery Procedures

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Owner**: Operations Team
**Review Cycle**: Quarterly

## Table of Contents

1. [Recovery Objectives](#recovery-objectives)
2. [Backup Strategy](#backup-strategy)
3. [Recovery Procedures](#recovery-procedures)
4. [Service Recovery Order](#service-recovery-order)
5. [Data Integrity Verification](#data-integrity-verification)
6. [Failover Procedures](#failover-procedures)

---

## Recovery Objectives

### RTO/RPO Targets

| Service | RTO (Recovery Time) | RPO (Recovery Point) | Priority |
|---------|---------------------|----------------------|----------|
| PostgreSQL | 30 minutes | 5 minutes | Critical |
| Hasura | 15 minutes | 0 (stateless) | Critical |
| Auth | 15 minutes | 5 minutes | Critical |
| Redis | 10 minutes | 15 minutes | High |
| MinIO | 1 hour | 1 hour | Medium |
| MeiliSearch | 2 hours | 1 day | Low |

### Business Impact by Service

**Critical Services** (Revenue/Reputation Impact)
- PostgreSQL: All data storage
- Hasura: API gateway
- Auth: User access

**High Priority Services** (Degraded Functionality)
- Redis: Session/cache
- MinIO: File storage

**Medium Priority Services** (Workarounds Available)
- MeiliSearch: Search (can use DB queries)
- Monitoring stack: Observability

---

## Backup Strategy

### Automated Backups

#### PostgreSQL - Continuous + Daily

**WAL (Write-Ahead Log) Archiving**
```bash
# Configured in docker-compose.yml
# WAL archives every 16MB or 60 seconds

# Location: /backups/postgres/wal/
# Retention: 7 days
# Enables Point-In-Time Recovery (PITR)
```

**Daily Full Backups**
```bash
# Automated via cron
# Time: 02:00 UTC daily
# Location: /backups/postgres/daily/
# Retention: 30 days
# Format: pg_dump custom format (compressed)
```

**Weekly Long-term Backups**
```bash
# Automated via cron
# Time: Sunday 03:00 UTC
# Location: /backups/postgres/weekly/
# Retention: 12 weeks
# Format: pg_dump custom format
```

#### Redis - Snapshot + AOF

**RDB Snapshots**
```bash
# Configuration in redis.conf
# save 900 1      # After 900 sec if 1 key changed
# save 300 10     # After 300 sec if 10 keys changed
# save 60 10000   # After 60 sec if 10000 keys changed

# Location: /data/redis/dump.rdb
# Retention: Keep last 7 snapshots
```

**AOF (Append Only File)**
```bash
# Configuration
# appendonly yes
# appendfsync everysec

# Location: /data/redis/appendonly.aof
# Auto-rewrite when size doubles
```

#### MinIO - Object Replication

```bash
# Versioning enabled on all buckets
# Lifecycle policy: retain 30 versions

# Optional: Replicate to secondary MinIO instance
# or S3 bucket for off-site backup
```

#### MeiliSearch - Index Snapshots

```bash
# Manual snapshots before major changes
# Location: /backups/meilisearch/
# Retention: Last 5 snapshots

# Can rebuild from database if needed
```

### Backup Verification

**Daily Verification**
```bash
#!/bin/bash
# /scripts/ops/verify-backups.sh

# 1. Check backup files exist
if [ ! -f "/backups/postgres/daily/$(date +%Y%m%d).dump" ]; then
  echo "ERROR: Daily PostgreSQL backup missing"
  exit 1
fi

# 2. Test restore to temporary database
pg_restore --dbname=test_restore /backups/postgres/daily/latest.dump

# 3. Verify row counts match production
psql -d test_restore -c "SELECT COUNT(*) FROM nchat_messages"

# 4. Cleanup
dropdb test_restore

# 5. Send notification
echo "Backup verification passed" | mail -s "Backup OK" ops@example.com
```

### Off-Site Backup

**Strategy**: 3-2-1 Rule
- 3 copies of data
- 2 different media types
- 1 off-site copy

**Implementation**:
```bash
# Daily sync to S3 or equivalent
aws s3 sync /backups/ s3://company-backups-offsite/ \
  --storage-class STANDARD_IA \
  --exclude "*.tmp"

# Encrypted with KMS
# Lifecycle: Transition to Glacier after 90 days
# Retention: 1 year minimum
```

---

## Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:**
- PostgreSQL crashes repeatedly
- Data inconsistency errors
- Checksum failures

**Recovery Steps:**

```bash
# 1. STOP ALL DEPENDENT SERVICES
echo "Stopping services that write to database..."
docker stop nself-hasura nself-auth nself-functions

# 2. ASSESS CORRUPTION
docker exec nself-postgres pg_dump -U postgres -d nself_db \
  --schema-only > /tmp/schema_check.sql

# If dump fails, corruption confirmed

# 3. BACKUP CURRENT STATE (even if corrupted)
docker exec nself-postgres pg_dumpall -U postgres \
  > /backups/emergency/corrupted_$(date +%Y%m%d_%H%M%S).sql

# 4. STOP DATABASE
docker stop nself-postgres

# 5. RENAME CORRUPTED DATA DIRECTORY
mv /data/postgres /data/postgres_corrupted_$(date +%Y%m%d_%H%M%S)

# 6. CREATE NEW DATA DIRECTORY
mkdir -p /data/postgres
chown -R 999:999 /data/postgres  # postgres user in container

# 7. START DATABASE (will initialize fresh)
docker start nself-postgres

# Wait for initialization
sleep 10

# 8. RESTORE FROM LATEST BACKUP
./scripts/ops/restore-database.sh /backups/postgres/daily/latest.dump

# 9. IF PITR NEEDED, REPLAY WAL
# See: Point-In-Time Recovery section below

# 10. VERIFY DATA INTEGRITY
./scripts/ops/verify-data-integrity.sh

# 11. RESTART DEPENDENT SERVICES
docker start nself-hasura nself-auth nself-functions

# 12. VERIFY APPLICATION FUNCTIONALITY
./scripts/ops/smoke-test.sh

# Expected recovery time: 20-30 minutes
# Data loss: Maximum 5 minutes (last WAL archive)
```

### Scenario 2: Complete Service Outage

**Symptoms:**
- All Docker containers stopped
- Host system crash/reboot
- Disk failure

**Recovery Steps:**

```bash
# 1. VERIFY SYSTEM HEALTH
df -h  # Check disk space
free -h  # Check memory
docker info  # Check Docker daemon

# 2. CHECK DATA DIRECTORY INTEGRITY
ls -lah /data/
# Should see: postgres/, redis/, minio/, meilisearch/

# 3. START SERVICES IN ORDER (see Service Recovery Order below)
./scripts/ops/start-services-ordered.sh

# 4. MONITOR STARTUP
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'

# 5. VERIFY CONNECTIVITY
./scripts/ops/verify-system-health.sh

# 6. CHECK LOGS FOR ERRORS
nself logs --since 5m | grep -i error

# 7. RUN SMOKE TESTS
pnpm test:e2e:smoke

# Expected recovery time: 10-15 minutes
# Data loss: None (if data directory intact)
```

### Scenario 3: Data Loss / Accidental Deletion

**Symptoms:**
- Critical data missing
- Tables dropped
- Mass deletion event

**Recovery Steps:**

```bash
# 1. IMMEDIATELY STOP WRITES
docker pause nself-hasura nself-auth

# This prevents WAL from being overwritten

# 2. IDENTIFY WHEN DATA WAS LAST GOOD
# Check application logs, audit logs, user reports

# 3. PERFORM POINT-IN-TIME RECOVERY
RECOVERY_TARGET="2026-02-09 14:30:00 UTC"

# Stop database
docker stop nself-postgres

# Move current data aside
mv /data/postgres /data/postgres_before_recovery

# Restore base backup
mkdir -p /data/postgres
./scripts/ops/restore-database.sh /backups/postgres/daily/[date].dump

# Create recovery.conf
cat > /data/postgres/recovery.conf <<EOF
restore_command = 'cp /backups/postgres/wal/%f %p'
recovery_target_time = '$RECOVERY_TARGET'
recovery_target_action = 'promote'
EOF

# Start database in recovery mode
docker start nself-postgres

# Monitor recovery
docker logs -f nself-postgres

# Wait for "database system is ready to accept connections"

# 4. VERIFY RECOVERED DATA
docker exec nself-postgres psql -U postgres -d nself_db -c \
  "SELECT COUNT(*) FROM nchat_messages WHERE created_at < '$RECOVERY_TARGET'"

# 5. IF CORRECT, RESUME SERVICES
docker unpause nself-hasura nself-auth

# Expected recovery time: 30-60 minutes
# Data loss: Depends on PITR target (can be sub-minute)
```

### Scenario 4: Service-Specific Failure

#### Hasura Failure
```bash
# Hasura is stateless - simple restart usually sufficient

# 1. Check configuration
docker exec nself-hasura env | grep HASURA

# 2. Verify database connectivity
docker exec nself-hasura curl -f http://nself-postgres:5432 || echo "DB unreachable"

# 3. Restart with clean state
docker stop nself-hasura
docker rm nself-hasura
cd .backend && nself build && nself start hasura

# 4. Apply migrations if needed
hasura migrate apply --endpoint http://localhost:8080

# Expected recovery time: 5 minutes
```

#### Auth Service Failure
```bash
# Auth stores sessions in Redis + user data in PostgreSQL

# 1. Verify dependencies
docker exec nself-auth curl -f http://nself-postgres:5432 || echo "DB down"
docker exec nself-auth curl -f http://nself-redis:6379 || echo "Redis down"

# 2. Check JWT configuration
docker exec nself-auth env | grep JWT_SECRET

# 3. Restart auth service
docker restart nself-auth

# 4. Verify users can login
curl -X POST http://localhost:4000/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Expected recovery time: 5 minutes
```

#### Redis Failure
```bash
# Redis failure means session loss but data is in PostgreSQL

# 1. Check if Redis process is running
docker exec nself-redis redis-cli ping

# 2. Check for memory issues
docker stats nself-redis --no-stream

# 3. If corrupted, restore from RDB + AOF
docker stop nself-redis
cp /backups/redis/dump.rdb /data/redis/dump.rdb
cp /backups/redis/appendonly.aof /data/redis/appendonly.aof
docker start nself-redis

# 4. If persistent issues, start fresh
docker stop nself-redis
rm -rf /data/redis/*
docker start nself-redis

# Users will need to re-login
# Expected recovery time: 5 minutes
```

#### MinIO Failure
```bash
# MinIO stores user-uploaded files

# 1. Check disk space
df -h /data/minio

# 2. Verify data directory
ls -lah /data/minio/.minio.sys

# 3. Restart MinIO
docker restart nself-minio

# 4. If data corrupted, restore from backup
docker stop nself-minio
rsync -av /backups/minio/ /data/minio/
docker start nself-minio

# 5. Verify buckets accessible
mc ls local/nchat-uploads

# Expected recovery time: 10-30 minutes depending on data size
```

---

## Service Recovery Order

### Dependency Graph

```
1. PostgreSQL (no dependencies)
   ↓
2. Redis (no dependencies)
   ↓
3. MinIO (no dependencies)
   ↓
4. Auth (depends on: PostgreSQL, Redis)
   ↓
5. Hasura (depends on: PostgreSQL)
   ↓
6. Functions (depends on: PostgreSQL, Hasura)
   ↓
7. MeiliSearch (optional, depends on: PostgreSQL)
   ↓
8. Monitoring (observability only)
```

### Automated Recovery Script

```bash
#!/bin/bash
# /scripts/ops/start-services-ordered.sh

set -e  # Exit on error

echo "=== Starting Service Recovery ==="
START_TIME=$(date +%s)

# Function to wait for service health
wait_for_service() {
  local service=$1
  local health_check=$2
  local max_wait=60
  local waited=0

  echo "Waiting for $service to be healthy..."
  until eval $health_check &>/dev/null; do
    sleep 2
    waited=$((waited + 2))
    if [ $waited -ge $max_wait ]; then
      echo "ERROR: $service failed to start after ${max_wait}s"
      exit 1
    fi
  done
  echo "✓ $service is healthy"
}

# 1. Start PostgreSQL
echo "Starting PostgreSQL..."
docker start nself-postgres
wait_for_service "PostgreSQL" \
  "docker exec nself-postgres pg_isready -U postgres"

# 2. Start Redis
echo "Starting Redis..."
docker start nself-redis
wait_for_service "Redis" \
  "docker exec nself-redis redis-cli ping"

# 3. Start MinIO
echo "Starting MinIO..."
docker start nself-minio
wait_for_service "MinIO" \
  "curl -f http://localhost:9000/minio/health/live"

# 4. Start Auth
echo "Starting Auth..."
docker start nself-auth
wait_for_service "Auth" \
  "curl -f http://localhost:4000/healthz"

# 5. Start Hasura
echo "Starting Hasura..."
docker start nself-hasura
wait_for_service "Hasura" \
  "curl -f http://localhost:8080/healthz"

# 6. Start Functions
echo "Starting Functions..."
docker start nself-functions || echo "Functions not configured"

# 7. Start MeiliSearch
echo "Starting MeiliSearch..."
docker start nself-meilisearch || echo "MeiliSearch not configured"
sleep 5

# 8. Start Monitoring
echo "Starting Monitoring Stack..."
docker start nself-prometheus nself-grafana nself-loki 2>/dev/null || echo "Monitoring not configured"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=== Recovery Complete ==="
echo "Total time: ${DURATION} seconds"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/ops/verify-system-health.sh"
echo "2. Run: pnpm test:e2e:smoke"
echo "3. Check logs: nself logs --since 5m"
```

---

## Data Integrity Verification

### Verification Script

```bash
#!/bin/bash
# /scripts/ops/verify-data-integrity.sh

echo "=== Data Integrity Verification ==="

# 1. Check database consistency
echo "Checking database consistency..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"

# 2. Check for orphaned records
echo ""
echo "Checking for orphaned records..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    'Messages with invalid user_id' as issue,
    COUNT(*) as count
  FROM nchat_messages m
  WHERE NOT EXISTS (SELECT 1 FROM nchat_users u WHERE u.id = m.user_id);
"

# 3. Check for future timestamps (data corruption indicator)
echo ""
echo "Checking for future timestamps..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    'Future timestamps' as issue,
    COUNT(*) as count
  FROM nchat_messages
  WHERE created_at > NOW() + INTERVAL '1 day';
"

# 4. Verify user counts match
echo ""
echo "Verifying user counts..."
USERS_COUNT=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c \
  "SELECT COUNT(*) FROM nchat_users;")
AUTH_USERS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c \
  "SELECT COUNT(*) FROM auth.users;")

echo "Users in nchat_users: $USERS_COUNT"
echo "Users in auth.users: $AUTH_USERS"

if [ "$USERS_COUNT" -ne "$AUTH_USERS" ]; then
  echo "WARNING: User count mismatch!"
fi

# 5. Check constraint violations
echo ""
echo "Checking constraint violations..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type
  FROM pg_constraint
  WHERE conrelid::regclass::text LIKE 'nchat_%'
  ORDER BY conrelid::regclass::text;
"

# 6. Verify indexes
echo ""
echo "Verifying critical indexes..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    tablename,
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename LIKE 'nchat_%'
  ORDER BY tablename, indexname;
"

echo ""
echo "=== Verification Complete ==="
```

### Expected Results

**Healthy System:**
- No orphaned records
- No future timestamps
- User counts match
- All constraints valid
- All indexes present

**Needs Attention:**
- Orphaned records > 0
- Future timestamps detected
- User count mismatch
- Missing indexes

---

## Failover Procedures

### Active-Passive Failover

**Architecture:**
```
Primary Site (Active)
  ↓ Continuous replication
Secondary Site (Passive)
  ↓ Automatic failover trigger
Becomes Active
```

#### PostgreSQL Streaming Replication

**Setup:**
```bash
# On primary
# In postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

# Create replication user
CREATE USER replicator REPLICATION LOGIN ENCRYPTED PASSWORD 'secure_password';

# On standby
# Create recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary port=5432 user=replicator password=secure_password'
trigger_file = '/tmp/postgresql.trigger.5432'
```

**Failover Process:**
```bash
# 1. Verify primary is down
pg_isready -h primary-host -p 5432

# 2. Promote standby to primary
touch /tmp/postgresql.trigger.5432

# 3. Wait for promotion
tail -f /var/log/postgresql/postgresql.log | grep "database system is ready"

# 4. Update DNS/Load Balancer to point to new primary
# or
# Update environment variables
export POSTGRES_HOST=standby-host

# 5. Restart application services
docker restart nself-hasura nself-auth

# Expected failover time: 2-5 minutes
# Data loss: Minimal (depends on replication lag)
```

### Geographic Failover

**Multi-Region Setup:**
```
US-East (Primary)
  ↓ Async replication
EU-West (Secondary)
  ↓ Manual failover
```

**Failover Checklist:**
- [ ] Verify primary region is down
- [ ] Check replication lag on secondary
- [ ] Promote secondary database
- [ ] Update DNS to point to secondary region
- [ ] Update CDN configuration
- [ ] Notify users of potential data loss window
- [ ] Monitor error rates
- [ ] Update status page

**Expected RTO**: 15-30 minutes
**Expected RPO**: 5-15 minutes (replication lag)

---

## Recovery Drills

### Monthly Drill Schedule

**Week 1**: Database restore drill
**Week 2**: Service recovery drill
**Week 3**: PITR (Point-In-Time Recovery) drill
**Week 4**: Full disaster recovery drill

### Drill Execution

```bash
# Run monthly recovery drill
./scripts/ops/run-recovery-drill.sh

# This script:
# 1. Creates test environment
# 2. Simulates failure
# 3. Executes recovery procedure
# 4. Verifies recovery
# 5. Generates report
```

See [RECOVERY-DRILL-SCENARIOS.md](./RECOVERY-DRILL-SCENARIOS.md) for detailed drill procedures.

---

## Contact Information

### Emergency Contacts

**On-Call Engineer**: [phone/email]
**Backup On-Call**: [phone/email]
**Database Administrator**: [phone/email]
**Infrastructure Lead**: [phone/email]

### Escalation

**After Hours**: Page on-call via PagerDuty
**Business Hours**: #ops-emergency Slack channel
**Critical Issues**: Call CTO directly

---

## Appendix

### Backup Locations

```
Local Backups:
/backups/
├── postgres/
│   ├── daily/          # Last 30 days
│   ├── weekly/         # Last 12 weeks
│   └── wal/           # Last 7 days
├── redis/
│   ├── dump.rdb       # Latest snapshot
│   └── appendonly.aof # AOF log
├── minio/             # Bucket replication
└── meilisearch/       # Index snapshots

Off-Site Backups:
s3://company-backups/
├── postgres/
├── redis/
└── minio/
```

### Recovery Time Estimates

| Scenario | RTO | RPO | Complexity |
|----------|-----|-----|------------|
| Single service restart | 5 min | 0 | Low |
| Database restore | 30 min | 5 min | Medium |
| Full system recovery | 1 hour | 5 min | High |
| PITR from corruption | 2 hours | <1 min | Very High |
| Geographic failover | 30 min | 15 min | High |

---

**Related Documents:**
- [Incident Response Playbook](./INCIDENT-RESPONSE-PLAYBOOK.md)
- [Recovery Drill Scenarios](./RECOVERY-DRILL-SCENARIOS.md)
- [Operations Runbook](./OPERATIONS-RUNBOOK.md)
- [Backup Configuration](./BACKUP-CONFIGURATION.md)
