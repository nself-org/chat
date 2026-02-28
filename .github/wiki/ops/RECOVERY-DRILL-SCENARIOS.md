# Recovery Drill Scenarios

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Owner**: Operations Team
**Drill Frequency**: Monthly rotating scenarios

## Table of Contents

1. [Drill Overview](#drill-overview)
2. [Scenario 1: Database Corruption](#scenario-1-database-corruption)
3. [Scenario 2: Complete Service Outage](#scenario-2-complete-service-outage)
4. [Scenario 3: Partial Failure Cascade](#scenario-3-partial-failure-cascade)
5. [Scenario 4: Data Loss Recovery](#scenario-4-data-loss-recovery)
6. [Scenario 5: Regional Failover](#scenario-5-regional-failover)
7. [Drill Execution Framework](#drill-execution-framework)
8. [Metrics and Reporting](#metrics-and-reporting)

---

## Drill Overview

### Purpose

- **Validate** recovery procedures work as documented
- **Train** team on recovery processes
- **Identify** gaps in documentation or tooling
- **Improve** RTO/RPO metrics
- **Build** confidence in disaster recovery capabilities

### Drill Types

**Announced Drills** (Monthly)
- Team is notified 48 hours in advance
- Focused on procedure validation
- Lower stress, learning focused

**Surprise Drills** (Quarterly)
- Team notified at drill start time
- Tests real-world response
- Higher stress, realistic timing

### Safety Measures

All drills are conducted in:
- **Test environment** (default)
- **Isolated production replica** (for advanced drills)
- **Never on live production** (unless explicitly approved by CTO)

### Success Criteria

Each drill must achieve:
- ✅ RTO within target
- ✅ RPO within target
- ✅ Data integrity verified
- ✅ All services functional
- ✅ No unintended side effects
- ✅ Team coordination effective

---

## Scenario 1: Database Corruption

### Objective

Validate ability to recover from PostgreSQL database corruption within 30 minutes (RTO) with <5 minute data loss (RPO).

### Preparation (T-48 hours)

```bash
# 1. Schedule drill
# Send notification to team

# 2. Verify backups are current
./scripts/ops/verify-backups.sh

# 3. Prepare test environment
./scripts/ops/create-drill-environment.sh corruption-drill

# 4. Seed test data with known state
./scripts/ops/seed-drill-data.sh --scenario corruption

# 5. Document current state
./scripts/ops/capture-system-state.sh > /tmp/pre-drill-state.txt
```

### Execution (Drill Day)

**Timeline:** 30 minutes target

#### Phase 1: Simulate Corruption (T+0)

```bash
# Start timer
DRILL_START=$(date +%s)

# Simulate database corruption
# Method 1: Force crash during write
docker exec nself-postgres bash -c "
  kill -9 \$(pgrep postgres)
  dd if=/dev/urandom of=/var/lib/postgresql/data/base/16384/16385 bs=1024 count=100
"

# Method 2: Corrupt pg_control file
docker exec nself-postgres bash -c "
  dd if=/dev/zero of=/var/lib/postgresql/data/global/pg_control bs=512 count=1
"

# Verify corruption
docker start nself-postgres
sleep 5
docker logs nself-postgres --tail 50 | grep -i "corrupt\|panic\|fatal"

# Expected: Database won't start or crashes immediately
```

#### Phase 2: Detection and Response (T+0 to T+5)

```bash
# Simulate monitoring alert
echo "[CRITICAL] PostgreSQL health check failed" | \
  tee -a /tmp/drill-timeline.txt

# Incident Commander declares P0 incident
echo "$(date): P0 incident declared - Database Corruption" | \
  tee -a /tmp/drill-timeline.txt

# Team assembles in war room
# Create incident ticket (in test system)
```

#### Phase 3: Assessment (T+5 to T+10)

```bash
# Check database status
docker exec nself-postgres pg_isready -U postgres
# Expected: "no response"

# Try to dump schema
docker exec nself-postgres pg_dump -U postgres -d nself_db --schema-only \
  > /tmp/schema-check.sql 2>&1
# Expected: Connection error or corruption error

# Confirm corruption scenario
echo "$(date): Corruption confirmed, proceeding with restore" | \
  tee -a /tmp/drill-timeline.txt

# Identify latest good backup
LATEST_BACKUP=$(ls -t /backups/postgres/daily/*.dump | head -1)
echo "Latest backup: $LATEST_BACKUP"
```

#### Phase 4: Recovery (T+10 to T+25)

```bash
# Stop dependent services
echo "$(date): Stopping dependent services" | tee -a /tmp/drill-timeline.txt
docker stop nself-hasura nself-auth nself-functions

# Emergency backup of corrupted state
echo "$(date): Backing up corrupted state" | tee -a /tmp/drill-timeline.txt
docker exec nself-postgres pg_dumpall -U postgres \
  > /backups/emergency/corrupted_$(date +%Y%m%d_%H%M%S).sql 2>&1 || true

# Stop database
docker stop nself-postgres

# Rename corrupted data
mv /data/postgres /data/postgres_corrupted_drill_$(date +%Y%m%d_%H%M%S)

# Initialize fresh database
mkdir -p /data/postgres
chown -R 999:999 /data/postgres
docker start nself-postgres

# Wait for initialization
sleep 10

# Restore from backup
echo "$(date): Restoring from backup" | tee -a /tmp/drill-timeline.txt
./scripts/ops/restore-database.sh $LATEST_BACKUP

# Apply WAL for PITR if needed
echo "$(date): Applying WAL logs" | tee -a /tmp/drill-timeline.txt
./scripts/ops/apply-wal-logs.sh --target "5 minutes ago"
```

#### Phase 5: Verification (T+25 to T+30)

```bash
# Verify database health
docker exec nself-postgres pg_isready -U postgres

# Run data integrity checks
./scripts/ops/verify-data-integrity.sh

# Compare to pre-drill state
./scripts/ops/compare-data-state.sh /tmp/pre-drill-state.txt

# Restart dependent services
echo "$(date): Restarting services" | tee -a /tmp/drill-timeline.txt
docker start nself-hasura nself-auth nself-functions

# Wait for services to be healthy
sleep 15

# Run smoke tests
pnpm test:e2e:smoke

# Calculate recovery time
DRILL_END=$(date +%s)
RTO=$((DRILL_END - DRILL_START))

echo "=== DRILL COMPLETE ==="
echo "Total Recovery Time: ${RTO} seconds ($(($RTO / 60)) minutes)"
echo "Target RTO: 1800 seconds (30 minutes)"

if [ $RTO -le 1800 ]; then
  echo "✅ RTO TARGET MET"
else
  echo "❌ RTO TARGET MISSED by $(($RTO - 1800)) seconds"
fi
```

### Post-Drill Analysis

**Questions to Answer:**

1. What was the actual RTO? Did we meet target?
2. What was the actual RPO? How much data was lost?
3. Which steps took longer than expected?
4. Were the procedures clear and accurate?
5. What tools or automation would have helped?
6. Did team coordination work smoothly?
7. What improvements should we make?

**Deliverables:**

- Timeline of events
- RTO/RPO measurements
- Data integrity report
- Team feedback survey
- Action items for improvement

---

## Scenario 2: Complete Service Outage

### Objective

Recover all services after complete system shutdown within 15 minutes.

### Preparation

```bash
# 1. Notify team
# 2. Verify test environment ready
./scripts/ops/create-drill-environment.sh outage-drill

# 3. Start all services and verify healthy
cd /Users/admin/Sites/nself-chat/.backend
nself start
sleep 30
nself status

# 4. Capture baseline metrics
./scripts/ops/capture-metrics.sh baseline
```

### Execution

#### Phase 1: Simulate Outage (T+0)

```bash
DRILL_START=$(date +%s)

# Simulate complete outage (choose one method)

# Method 1: Stop all containers
docker stop $(docker ps -q)

# Method 2: Simulate host reboot
# (in test environment only)
sudo systemctl restart docker

# Method 3: Simulate disk unmount
# sudo umount /data (DANGEROUS - test only)

echo "$(date): Complete outage simulated" | tee -a /tmp/drill-timeline.txt
```

#### Phase 2: Detection (T+0 to T+3)

```bash
# Monitoring should alert
# Team assembles
# Incident Commander takes control

echo "$(date): P0 incident - Complete outage" | tee -a /tmp/drill-timeline.txt

# Quick assessment
docker ps
# Expected: No containers running or very few
```

#### Phase 3: Recovery (T+3 to T+12)

```bash
echo "$(date): Starting ordered recovery" | tee -a /tmp/drill-timeline.txt

# Use automated recovery script
./scripts/ops/start-services-ordered.sh

# Monitor progress
watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

#### Phase 4: Verification (T+12 to T+15)

```bash
# Verify all services healthy
nself status

# Run health checks
./scripts/ops/verify-system-health.sh

# Test critical paths
./scripts/ops/smoke-test.sh

# Measure RTO
DRILL_END=$(date +%s)
RTO=$((DRILL_END - DRILL_START))

echo "Total Recovery Time: ${RTO} seconds ($(($RTO / 60)) minutes)"
echo "Target RTO: 900 seconds (15 minutes)"

if [ $RTO -le 900 ]; then
  echo "✅ RTO TARGET MET"
else
  echo "❌ RTO TARGET MISSED by $(($RTO - 900)) seconds"
fi
```

### Success Criteria

- [ ] All services started in correct order
- [ ] No manual intervention required
- [ ] Data integrity maintained
- [ ] RTO < 15 minutes
- [ ] All smoke tests pass

---

## Scenario 3: Partial Failure Cascade

### Objective

Identify and recover from cascading failures when one service affects others.

### Scenario Description

Redis runs out of memory → Auth service fails → Users can't login → New message sends fail → System appears down but database is fine.

### Execution

#### Phase 1: Simulate Initial Failure (T+0)

```bash
DRILL_START=$(date +%s)

# Limit Redis memory to cause OOM
docker update --memory 50m nself-redis

# Generate load to exhaust memory
docker exec nself-redis redis-cli <<EOF
CONFIG SET maxmemory 10mb
CONFIG SET maxmemory-policy noeviction
EOF

# Fill Redis to capacity
for i in {1..10000}; do
  docker exec nself-redis redis-cli SET key_$i "$(openssl rand -base64 1000)"
done

# Redis should now reject writes
echo "$(date): Redis memory exhausted" | tee -a /tmp/drill-timeline.txt
```

#### Phase 2: Observe Cascade (T+0 to T+5)

```bash
# Watch services fail in cascade

# Auth service starts failing (can't write sessions)
docker logs nself-auth --tail 50 | grep -i error

# Users can't login
curl -X POST http://localhost:4000/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
# Expected: Error

# New message sends might fail (if using Redis for queue)

# Monitor error rates
# Should see spike in Sentry

echo "$(date): Cascade detected - Auth failing, users impacted" | \
  tee -a /tmp/drill-timeline.txt
```

#### Phase 3: Root Cause Analysis (T+5 to T+10)

```bash
# Team investigates
# Check all service health
nself status

# Check Redis
docker exec nself-redis redis-cli INFO memory

# Identify Redis as root cause
echo "$(date): Root cause identified - Redis OOM" | \
  tee -a /tmp/drill-timeline.txt
```

#### Phase 4: Recovery (T+10 to T+15)

```bash
# Option 1: Increase memory limit
docker update --memory 512m nself-redis
docker restart nself-redis

# Option 2: Flush and restart (if sessions can be lost)
docker exec nself-redis redis-cli FLUSHALL
docker restart nself-redis

# Wait for Redis to be healthy
until docker exec nself-redis redis-cli ping > /dev/null 2>&1; do
  sleep 2
done

# Restart dependent services
docker restart nself-auth

echo "$(date): Services restarted" | tee -a /tmp/drill-timeline.txt
```

#### Phase 5: Verification (T+15 to T+20)

```bash
# Verify auth working
curl -X POST http://localhost:4000/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Verify message sending
./scripts/ops/test-message-send.sh

# Check error rates returned to normal

DRILL_END=$(date +%s)
RTO=$((DRILL_END - DRILL_START))

echo "Total Recovery Time: ${RTO} seconds ($(($RTO / 60)) minutes)"
```

### Learning Points

- How to identify root cause in cascade
- Service dependency mapping
- Health check importance
- Resource monitoring

---

## Scenario 4: Data Loss Recovery

### Objective

Recover from accidental data deletion using Point-In-Time Recovery (PITR).

### Scenario Description

At 14:30 UTC, someone accidentally deletes a critical channel with all its messages. Detection happens at 14:35 UTC. Need to recover to 14:29 UTC.

### Execution

#### Phase 1: Simulate Data Loss (T+0)

```bash
DRILL_START=$(date +%s)

# Note the exact time
DELETION_TIME=$(date -u +"%Y-%m-%d %H:%M:%S")
echo "Deletion time: $DELETION_TIME" | tee -a /tmp/drill-timeline.txt

# Simulate accidental deletion
docker exec nself-postgres psql -U postgres -d nself_db -c "
  DELETE FROM nchat_messages WHERE channel_id = 'test-channel-123';
  DELETE FROM nchat_channels WHERE id = 'test-channel-123';
"

# Wait 5 minutes to simulate delay in detection
sleep 300

echo "$(date): Data loss detected" | tee -a /tmp/drill-timeline.txt
```

#### Phase 2: Immediate Response (T+5 to T+8)

```bash
# CRITICAL: Stop all writes immediately
docker pause nself-hasura nself-auth

echo "$(date): Write operations halted" | tee -a /tmp/drill-timeline.txt

# This prevents WAL from being overwritten
# Preserves ability to do PITR

# Calculate recovery target (1 minute before deletion)
RECOVERY_TARGET=$(date -u -d "$DELETION_TIME - 1 minute" +"%Y-%m-%d %H:%M:%S")
echo "Recovery target: $RECOVERY_TARGET" | tee -a /tmp/drill-timeline.txt
```

#### Phase 3: PITR Execution (T+8 to T+40)

```bash
# Stop database
docker stop nself-postgres

# Move current data aside
mv /data/postgres /data/postgres_before_pitr_$(date +%Y%m%d_%H%M%S)

# Restore base backup (latest before deletion)
mkdir -p /data/postgres
./scripts/ops/restore-database.sh /backups/postgres/daily/latest.dump

# Configure recovery
cat > /data/postgres/recovery.conf <<EOF
restore_command = 'cp /backups/postgres/wal/%f %p'
recovery_target_time = '$RECOVERY_TARGET'
recovery_target_action = 'promote'
EOF

echo "$(date): Starting PITR to $RECOVERY_TARGET" | \
  tee -a /tmp/drill-timeline.txt

# Start database in recovery mode
docker start nself-postgres

# Monitor recovery logs
docker logs -f nself-postgres &
LOGS_PID=$!

# Wait for recovery completion
until docker logs nself-postgres 2>&1 | grep -q "database system is ready"; do
  sleep 5
done

kill $LOGS_PID

echo "$(date): PITR complete" | tee -a /tmp/drill-timeline.txt
```

#### Phase 4: Verification (T+40 to T+50)

```bash
# Verify deleted data is restored
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT id, name, created_at
  FROM nchat_channels
  WHERE id = 'test-channel-123';
"

docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT COUNT(*)
  FROM nchat_messages
  WHERE channel_id = 'test-channel-123';
"

# Verify timestamps are before deletion
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT MAX(created_at)
  FROM nchat_messages;
"
# Should be <= RECOVERY_TARGET

# Resume services
docker unpause nself-hasura nself-auth

# Run smoke tests
./scripts/ops/smoke-test.sh

DRILL_END=$(date +%s)
RTO=$((DRILL_END - DRILL_START))
RPO=$(($(date -d "$DELETION_TIME" +%s) - $(date -d "$RECOVERY_TARGET" +%s)))

echo "=== PITR DRILL COMPLETE ==="
echo "Total Recovery Time: ${RTO} seconds ($(($RTO / 60)) minutes)"
echo "Data Loss Window: ${RPO} seconds ($(($RPO / 60)) minutes)"
```

### Success Criteria

- [ ] Deleted data recovered
- [ ] Recovery point accurate (within 1 minute of target)
- [ ] No additional data loss
- [ ] Services resume normally
- [ ] RTO < 60 minutes

---

## Scenario 5: Regional Failover

### Objective

Practice failing over to secondary region when primary region is unavailable.

### Prerequisites

- Multi-region setup (primary + secondary)
- Database replication configured
- DNS failover capability

### Execution

#### Phase 1: Simulate Regional Outage (T+0)

```bash
DRILL_START=$(date +%s)

# Simulate primary region becoming unavailable
# In test: Block all traffic to primary

# Method 1: Firewall rules
sudo iptables -A INPUT -s primary-region-ip -j DROP
sudo iptables -A OUTPUT -d primary-region-ip -j DROP

# Method 2: Stop primary services
ssh primary-region "docker stop \$(docker ps -q)"

echo "$(date): Primary region offline" | tee -a /tmp/drill-timeline.txt
```

#### Phase 2: Detection and Decision (T+0 to T+5)

```bash
# Monitoring alerts fire
# Team assembles
# Assess replication lag

ssh secondary-region "docker exec nself-postgres psql -U postgres -c \"
  SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;
\""

# Decision: Proceed with failover
echo "$(date): Failover decision made - Replication lag: Xs" | \
  tee -a /tmp/drill-timeline.txt
```

#### Phase 3: Promote Secondary (T+5 to T+15)

```bash
# Promote secondary to primary
ssh secondary-region "
  docker exec nself-postgres pg_ctl promote -D /var/lib/postgresql/data
"

# Wait for promotion
ssh secondary-region "
  until docker logs nself-postgres 2>&1 | grep -q 'database system is ready'; do
    sleep 2
  done
"

echo "$(date): Secondary promoted to primary" | tee -a /tmp/drill-timeline.txt
```

#### Phase 4: Update DNS/Load Balancer (T+15 to T+20)

```bash
# Update DNS to point to secondary region
# (In test: Update hosts file or test DNS)

# Update Route53 (example)
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch "{
    \"Changes\": [{
      \"Action\": \"UPSERT\",
      \"ResourceRecordSet\": {
        \"Name\": \"api.example.com\",
        \"Type\": \"A\",
        \"TTL\": 60,
        \"ResourceRecords\": [{\"Value\": \"secondary-region-ip\"}]
      }
    }]
  }"

echo "$(date): DNS updated" | tee -a /tmp/drill-timeline.txt
```

#### Phase 5: Verification (T+20 to T+30)

```bash
# Wait for DNS propagation
sleep 60

# Test application connectivity
curl https://api.example.com/healthz

# Run smoke tests
./scripts/ops/smoke-test.sh --region secondary

# Monitor error rates
# Should return to normal after DNS propagates

DRILL_END=$(date +%s)
RTO=$((DRILL_END - DRILL_START))

echo "=== FAILOVER DRILL COMPLETE ==="
echo "Total Failover Time: ${RTO} seconds ($(($RTO / 60)) minutes)"
echo "Target RTO: 1800 seconds (30 minutes)"
```

### Success Criteria

- [ ] Secondary promoted successfully
- [ ] DNS updated correctly
- [ ] Application functional in secondary region
- [ ] RTO < 30 minutes
- [ ] RPO < 5 minutes (replication lag)

---

## Drill Execution Framework

### Pre-Drill Checklist

- [ ] Drill scheduled and team notified
- [ ] Test environment prepared
- [ ] Backups verified current
- [ ] Baseline metrics captured
- [ ] Runbook reviewed by team
- [ ] Observer assigned (to document)
- [ ] Timer ready
- [ ] Communication channels prepared

### During Drill

- [ ] Start timer when failure simulated
- [ ] Document all actions with timestamps
- [ ] Take screenshots of key moments
- [ ] Note any deviations from procedure
- [ ] Capture team communication
- [ ] Monitor metrics throughout
- [ ] Stop timer when fully recovered

### Post-Drill Checklist

- [ ] Calculate RTO/RPO
- [ ] Run data integrity verification
- [ ] Capture final metrics
- [ ] Cleanup test environment
- [ ] Collect team feedback
- [ ] Document lessons learned
- [ ] Create action items
- [ ] Update runbooks
- [ ] Schedule follow-up drill

---

## Metrics and Reporting

### Drill Metrics Template

```yaml
drill_id: DR-2026-02-09-001
scenario: Database Corruption
drill_type: Announced
date: 2026-02-09
participants:
  - Alice (Incident Commander)
  - Bob (DBA)
  - Charlie (Observer)

targets:
  rto: 1800  # 30 minutes
  rpo: 300   # 5 minutes

actuals:
  rto: 1650  # 27.5 minutes
  rpo: 240   # 4 minutes

phases:
  detection:
    target: 300
    actual: 240
    status: pass
  assessment:
    target: 300
    actual: 360
    status: fail
  recovery:
    target: 900
    actual: 840
    status: pass
  verification:
    target: 300
    actual: 210
    status: pass

overall_status: PASS
data_integrity: VERIFIED

issues:
  - Assessment took 1 minute longer than target
  - Backup restore command had typo (fixed during drill)
  - Missing verification for foreign key constraints

action_items:
  - Update backup restore script with better error handling
  - Add foreign key check to verification script
  - Create automated assessment checklist

lessons_learned:
  - Team coordination was excellent
  - Documentation was mostly accurate
  - Need better automated detection
  - Consider automating recovery steps
```

### Quarterly Drill Report

```markdown
# Disaster Recovery Drill Report - Q1 2026

## Executive Summary

Conducted 3 drills this quarter with 100% success rate.
Average RTO improved by 15% compared to Q4 2025.

## Drill Summary

| Date | Scenario | RTO Target | RTO Actual | Status |
|------|----------|------------|------------|--------|
| 2026-01-15 | DB Corruption | 30 min | 28 min | PASS |
| 2026-02-09 | Service Outage | 15 min | 13 min | PASS |
| 2026-03-12 | Data Loss | 60 min | 55 min | PASS |

## Trends

- ✅ RTO consistently meeting targets
- ✅ Team response time improving
- ✅ Documentation accuracy high (95%)
- ⚠️ Automation coverage at 60% (target: 80%)

## Key Improvements

1. Automated service recovery script created
2. Updated backup verification procedure
3. Added pre-drill checklist
4. Improved team training materials

## Action Items for Q2

1. Increase automation coverage to 75%
2. Conduct surprise drill
3. Test regional failover procedure
4. Update disaster recovery plan based on learnings

## Recommendations

- Continue monthly drill schedule
- Focus on automation gaps
- Cross-train additional team members
- Document edge cases discovered
```

---

## Appendix

### Drill Environment Setup

```bash
#!/bin/bash
# /scripts/ops/create-drill-environment.sh

SCENARIO=$1

echo "Creating drill environment for scenario: $SCENARIO"

# 1. Create isolated Docker network
docker network create drill-network

# 2. Clone production data to test environment
./scripts/ops/clone-prod-to-test.sh

# 3. Start services on drill network
docker-compose -f docker-compose.drill.yml up -d

# 4. Seed scenario-specific data
./scripts/ops/seed-drill-data.sh --scenario $SCENARIO

# 5. Verify environment ready
./scripts/ops/verify-drill-environment.sh

echo "Drill environment ready"
```

### Cleanup Script

```bash
#!/bin/bash
# /scripts/ops/cleanup-drill-environment.sh

echo "Cleaning up drill environment..."

# Stop and remove drill containers
docker-compose -f docker-compose.drill.yml down -v

# Remove drill network
docker network rm drill-network

# Archive drill logs
mkdir -p /archives/drills/$(date +%Y%m%d)
mv /tmp/drill-timeline.txt /archives/drills/$(date +%Y%m%d)/

echo "Cleanup complete"
```

---

**Related Documents:**
- [Incident Response Playbook](./INCIDENT-RESPONSE-PLAYBOOK.md)
- [Disaster Recovery Procedures](./DISASTER-RECOVERY-PROCEDURES.md)
- [Operations Runbook](./OPERATIONS-RUNBOOK.md)
