# Migration Safety Guide

**Task 139: Data migration and rollback rehearsals**

## Overview

This guide provides comprehensive procedures for safely executing database migrations in production environments. All migrations must be tested, reviewed, and executed following these protocols.

---

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Execution Procedure](#migration-execution-procedure)
3. [Rollback Procedures](#rollback-procedures)
4. [Zero-Downtime Migrations](#zero-downtime-migrations)
5. [Data Integrity Verification](#data-integrity-verification)
6. [Emergency Procedures](#emergency-procedures)
7. [Post-Migration Checklist](#post-migration-checklist)

---

## Pre-Migration Checklist

### 1. Development Testing

- [ ] Migration tested in local development environment
- [ ] Unit tests pass for affected database interactions
- [ ] Integration tests pass
- [ ] Rollback script generated and tested
- [ ] Performance impact assessed

### 2. Staging Environment Testing

- [ ] Migration applied to staging environment
- [ ] Application functions correctly after migration
- [ ] Rollback tested successfully in staging
- [ ] Data integrity verified post-migration
- [ ] Performance metrics collected

### 3. Risk Assessment

- [ ] Migration complexity assessed (Low/Medium/High)
- [ ] Breaking changes identified
- [ ] Affected tables and relationships documented
- [ ] Downtime requirement estimated
- [ ] Rollback plan documented

### 4. Communication

- [ ] Stakeholders notified of planned migration
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback decision tree prepared
- [ ] Support team briefed

### 5. Backup & Recovery

- [ ] Full database backup completed
- [ ] Backup integrity verified
- [ ] Backup restoration tested
- [ ] Backup retention policy confirmed
- [ ] Point-in-time recovery (PITR) enabled

### 6. Code Deployment

- [ ] Application code compatible with old schema (if zero-downtime)
- [ ] Application code compatible with new schema
- [ ] Feature flags configured (if needed)
- [ ] Deployment order documented

---

## Migration Execution Procedure

### Standard Migration (With Downtime)

```bash
# 1. Create backup
pg_dump -Fc nself_production > backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Verify backup
pg_restore --list backup_*.dump | wc -l

# 3. Put application in maintenance mode
kubectl scale deployment nself-chat --replicas=0

# 4. Wait for all connections to close
SELECT count(*) FROM pg_stat_activity WHERE datname = 'nself_production';

# 5. Apply migration
psql nself_production < migrations/XXX_migration.sql

# 6. Verify migration
psql nself_production -c "SELECT * FROM information_schema.tables WHERE table_name = 'new_table';"

# 7. Run data integrity checks
npm run migration:verify

# 8. Restore application
kubectl scale deployment nself-chat --replicas=3

# 9. Monitor application logs
kubectl logs -f deployment/nself-chat
```

### Zero-Downtime Migration

**Phase 1: Additive Changes (No Downtime)**

```sql
-- Add new columns as nullable
ALTER TABLE users ADD COLUMN new_field TEXT NULL;

-- Create new tables
CREATE TABLE new_feature_table (...);

-- Create new indexes concurrently
CREATE INDEX CONCURRENTLY idx_users_new_field ON users(new_field);
```

**Phase 2: Data Migration (Background)**

```sql
-- Migrate data in batches
UPDATE users
SET new_field = legacy_field
WHERE new_field IS NULL
  AND id >= $1 AND id < $2;

-- Use advisory locks to prevent conflicts
SELECT pg_advisory_lock(123456);
-- ... perform migration ...
SELECT pg_advisory_unlock(123456);
```

**Phase 3: Application Deployment**

```bash
# Deploy new application version that uses new schema
kubectl set image deployment/nself-chat nself-chat=nself-chat:v2.0.0

# Monitor rollout
kubectl rollout status deployment/nself-chat
```

**Phase 4: Cleanup (After Verification)**

```sql
-- Make columns NOT NULL if needed
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

-- Drop old columns
ALTER TABLE users DROP COLUMN legacy_field;

-- Drop old indexes
DROP INDEX idx_users_legacy_field;
```

---

## Rollback Procedures

### Automatic Rollback Triggers

Execute rollback immediately if:

- Migration fails with errors
- Application health checks fail after migration
- Data integrity checks fail
- Error rate exceeds 5% in first 10 minutes
- Performance degrades by >50%

### Rollback Execution

```bash
# 1. Put application in maintenance mode (if not already)
kubectl scale deployment nself-chat --replicas=0

# 2. Execute rollback script
psql nself_production < migrations/XXX_migration.rollback.sql

# 3. If rollback fails, restore from backup
pg_restore -d nself_production backup_*.dump

# 4. Verify database state
npm run migration:verify

# 5. Restore previous application version
kubectl set image deployment/nself-chat nself-chat=nself-chat:v1.9.0

# 6. Restore application
kubectl scale deployment nself-chat --replicas=3

# 7. Monitor and verify
kubectl logs -f deployment/nself-chat
```

### Rollback Decision Tree

```
Migration Applied
    ├─ Errors during migration?
    │   └─ YES → Rollback immediately
    └─ NO → Continue
        ├─ Application starts successfully?
        │   ├─ NO → Rollback immediately
        │   └─ YES → Continue
        │       ├─ Health checks passing?
        │       │   ├─ NO → Rollback immediately
        │       │   └─ YES → Continue
        │       │       ├─ Error rate < 5%?
        │       │       │   ├─ NO → Rollback immediately
        │       │       │   └─ YES → Continue
        │       │       │       └─ Monitor for 1 hour
        │       │       │           ├─ Issues detected? → Rollback
        │       │       │           └─ All clear → Success!
```

---

## Zero-Downtime Migrations

### Compatible Change Patterns

**Safe Changes (Zero Downtime)**

- Adding nullable columns
- Creating new tables
- Creating new indexes (CONCURRENTLY)
- Adding CHECK constraints (NOT VALID, then VALIDATE)
- Adding foreign keys (NOT VALID, then VALIDATE)

**Example: Adding a Column**

```sql
-- Phase 1: Add column as nullable
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NULL DEFAULT false;

-- Application can now be deployed (handles both null and boolean)

-- Phase 2: Backfill data
UPDATE users SET email_verified = true WHERE email_confirmed_at IS NOT NULL;

-- Phase 3: Make NOT NULL
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
```

**Example: Adding a Foreign Key**

```sql
-- Phase 1: Add FK as NOT VALID (doesn't check existing data)
ALTER TABLE messages
ADD CONSTRAINT fk_messages_user_id
FOREIGN KEY (user_id) REFERENCES users(id)
NOT VALID;

-- Phase 2: Fix any invalid data
UPDATE messages m
SET user_id = (SELECT id FROM users WHERE username = 'deleted_user' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);

-- Phase 3: Validate constraint
ALTER TABLE messages VALIDATE CONSTRAINT fk_messages_user_id;
```

### Incompatible Change Patterns

**Requires Downtime or Multi-Phase**

- Dropping columns (unless unused)
- Renaming columns
- Changing column types
- Adding NOT NULL constraints to existing columns
- Dropping tables

**Multi-Phase Approach for Renaming**

```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN display_name TEXT NULL;

-- Phase 2: Dual-write (application writes to both)
-- Deploy app version that writes to both columns

-- Phase 3: Backfill
UPDATE users SET display_name = full_name WHERE display_name IS NULL;

-- Phase 4: Switch reads
-- Deploy app version that reads from display_name

-- Phase 5: Remove old column
ALTER TABLE users DROP COLUMN full_name;
```

---

## Data Integrity Verification

### Automated Checks

```sql
-- Check foreign key constraints
SELECT
  conname,
  conrelid::regclass AS table_name,
  confrelid::regclass AS foreign_table,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace::regnamespace::text NOT IN ('pg_catalog', 'information_schema')
ORDER BY conrelid::regclass::text, conname;

-- Check for orphaned records
SELECT
  'messages' AS table_name,
  COUNT(*) AS orphaned_count
FROM nchat.nchat_messages m
WHERE NOT EXISTS (
  SELECT 1 FROM nchat.nchat_users u WHERE u.id = m.user_id
);

-- Check unique constraints
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
  AND table_schema = 'nchat';

-- Check NOT NULL constraints
SELECT
  table_name,
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'nchat'
  AND is_nullable = 'NO'
ORDER BY table_name, column_name;

-- Check index validity
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'nchat'
  AND indexname NOT LIKE 'pg_%'
ORDER BY tablename, indexname;
```

### Manual Verification

```bash
# Run integrity check script
npm run migration:verify

# Run integration tests against production database
npm run test:integration:production

# Check data counts
psql -c "SELECT 'users' AS table, COUNT(*) FROM nchat.nchat_users
         UNION ALL
         SELECT 'messages', COUNT(*) FROM nchat.nchat_messages
         UNION ALL
         SELECT 'channels', COUNT(*) FROM nchat.nchat_channels;"
```

---

## Emergency Procedures

### Critical Migration Failure

**Symptoms:**
- Database errors preventing application startup
- Data corruption detected
- Complete service outage

**Response:**

```bash
# 1. IMMEDIATE: Scale down application
kubectl scale deployment nself-chat --replicas=0

# 2. Assess database state
psql nself_production -c "SELECT version();"
psql nself_production -c "SELECT COUNT(*) FROM nchat.nchat_users;"

# 3. Attempt rollback
psql nself_production < migrations/XXX_migration.rollback.sql

# 4. If rollback fails, restore from backup
pg_restore -d nself_production -c backup_latest.dump

# 5. Verify restoration
npm run migration:verify

# 6. Restore previous app version
kubectl set image deployment/nself-chat nself-chat=nself-chat:previous

# 7. Scale up
kubectl scale deployment nself-chat --replicas=3

# 8. Notify stakeholders
# Post incident report with timeline
```

### Partial Migration Failure

**Symptoms:**
- Some tables/indexes created, others failed
- Application partially functional
- Some features broken

**Response:**

```bash
# 1. Document current state
psql nself_production -c "\dt nchat.*" > migration_state.txt
psql nself_production -c "\di nchat.*" >> migration_state.txt

# 2. Analyze partial migration
diff migrations/XXX_migration.sql migration_state.txt

# 3. Create custom rollback for partial state
# (Manual SQL based on what was applied)

# 4. Execute custom rollback
psql nself_production < custom_rollback.sql

# 5. Verify and restore
npm run migration:verify
```

---

## Post-Migration Checklist

### Immediate (0-1 hour)

- [ ] Application health checks passing
- [ ] Error rate within normal range (<1%)
- [ ] Response times within SLA
- [ ] Database connection pool stable
- [ ] No deadlocks or lock timeouts
- [ ] Critical user flows tested manually

### Short-term (1-24 hours)

- [ ] Performance metrics compared to baseline
- [ ] Database size/growth monitored
- [ ] Query performance analyzed
- [ ] User-reported issues tracked
- [ ] Automated tests passing
- [ ] Backup schedule resumed

### Long-term (1-7 days)

- [ ] No regression detected in analytics
- [ ] Resource utilization stable
- [ ] Cost impact assessed
- [ ] Documentation updated
- [ ] Lessons learned documented
- [ ] Rollback scripts archived

---

## Migration Complexity Matrix

### Low Complexity (Safe for any time)

- Adding nullable columns
- Creating new tables (unused initially)
- Creating indexes on small tables (<1M rows)
- Adding comments
- Creating views

**Risk Level:** 🟢 Low
**Downtime:** None
**Testing Required:** Development + Staging

### Medium Complexity (Maintenance window recommended)

- Adding NOT NULL columns with defaults
- Creating indexes on large tables (>1M rows)
- Adding foreign keys
- Modifying non-critical functions
- Batch data updates

**Risk Level:** 🟡 Medium
**Downtime:** 0-5 minutes
**Testing Required:** Development + Staging + Performance testing

### High Complexity (Planned maintenance window required)

- Dropping columns with data
- Renaming columns
- Changing column types
- Dropping tables
- Major schema restructuring
- Large data migrations

**Risk Level:** 🔴 High
**Downtime:** 5-60 minutes
**Testing Required:** Development + Staging + Load testing + Rehearsal

---

## Monitoring During Migration

### Key Metrics

```bash
# Database connections
SELECT count(*) FROM pg_stat_activity;

# Long-running queries
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE query != '<IDLE>' AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start ASC;

# Lock waits
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.usename AS blocked_user,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

# Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'nchat'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Application Health

```bash
# Health endpoint
curl -f http://localhost:3000/api/health

# Error rates (from logs)
kubectl logs -l app=nself-chat --tail=1000 | grep -i error | wc -l

# Response times
kubectl logs -l app=nself-chat --tail=1000 | grep "response_time" | awk '{sum+=$NF; count++} END {print sum/count}'
```

---

## Testing Framework

### Running Migration Tests

```bash
# Generate rollback scripts
npm run migration:generate-rollbacks

# Test migrations in isolated environment
npm run migration:test

# Test specific migration
npm run migration:test -- 051_user_settings_tables.sql

# Performance test
npm run migration:test:perf
```

### Test Coverage Requirements

- [ ] Forward migration succeeds
- [ ] Rollback migration succeeds
- [ ] Data integrity maintained
- [ ] Application functions with new schema
- [ ] Application functions after rollback
- [ ] Performance acceptable (<30s for migration)
- [ ] No orphaned data
- [ ] All constraints valid

---

## Common Migration Patterns

### Adding a Feature Toggle Column

```sql
-- Safe: nullable with default
ALTER TABLE nchat.nchat_users
ADD COLUMN feature_enabled BOOLEAN NULL DEFAULT false;

-- Make NOT NULL after backfill
ALTER TABLE nchat.nchat_users
ALTER COLUMN feature_enabled SET NOT NULL;
```

### Splitting a Column

```sql
-- Phase 1: Add new columns
ALTER TABLE users ADD COLUMN first_name TEXT NULL;
ALTER TABLE users ADD COLUMN last_name TEXT NULL;

-- Phase 2: Backfill
UPDATE users
SET
  first_name = split_part(full_name, ' ', 1),
  last_name = split_part(full_name, ' ', 2)
WHERE first_name IS NULL;

-- Phase 3: Drop old column
ALTER TABLE users DROP COLUMN full_name;
```

### Adding an Index on Large Table

```sql
-- Use CONCURRENTLY to avoid blocking writes
CREATE INDEX CONCURRENTLY idx_messages_created_at
ON nchat.nchat_messages(created_at DESC);

-- Check index is valid
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE indexname = 'idx_messages_created_at';
```

---

## Rollback Script Template

```sql
-- Rollback for XXX_migration_name.sql
-- Generated: YYYY-MM-DD
-- Complexity: [LOW|MEDIUM|HIGH]
-- Estimated Duration: XX minutes

-- WARNING: Test this rollback script thoroughly before use!

BEGIN;

-- Create backup of affected tables (if needed)
CREATE TABLE backup_table_name AS SELECT * FROM original_table;

-- Revert changes in reverse order

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_name ON table_name CASCADE;

-- 2. Drop views
DROP VIEW IF EXISTS view_name CASCADE;

-- 3. Revert table alterations
ALTER TABLE table_name DROP COLUMN IF EXISTS new_column CASCADE;
ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name CASCADE;

-- 4. Drop indexes
DROP INDEX IF EXISTS index_name CASCADE;

-- 5. Drop functions
DROP FUNCTION IF EXISTS function_name CASCADE;

-- 6. Drop tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS table_name CASCADE;

-- Verify rollback
SELECT COUNT(*) FROM original_table;

COMMIT;

-- Rollback complete
-- Next steps:
-- 1. Verify application functionality
-- 2. Check data integrity
-- 3. Monitor error rates
```

---

## Migration Approval Process

### Development Environment

- **Approval Required:** No
- **Review Required:** No
- **Documentation:** Optional

### Staging Environment

- **Approval Required:** Technical Lead
- **Review Required:** Peer review
- **Documentation:** Migration plan

### Production Environment

#### Low Complexity

- **Approval Required:** Technical Lead
- **Review Required:** Peer review + QA
- **Documentation:** Migration plan + rollback script

#### Medium Complexity

- **Approval Required:** Technical Lead + Product Owner
- **Review Required:** Peer review + QA + Load testing
- **Documentation:** Full migration playbook

#### High Complexity

- **Approval Required:** Technical Lead + Product Owner + CTO
- **Review Required:** Architecture review + Security review
- **Documentation:** Full migration playbook + rehearsal report + stakeholder communication

---

## Tools and Scripts

### Migration Testing

- `scripts/test-migrations.ts` - Automated migration testing framework
- `scripts/generate-rollbacks.ts` - Automatic rollback script generation
- `scripts/verify-integrity.ts` - Database integrity verification

### Execution

```bash
# Test all migrations
npm run migration:test

# Generate rollback scripts
npm run migration:generate-rollbacks

# Verify data integrity
npm run migration:verify

# Performance test
npm run migration:test:perf
```

---

## Incident Response

### Severity Levels

**P0 - Critical**
- Complete service outage
- Data corruption
- Security breach
- **Response Time:** Immediate
- **Rollback Decision:** Automatic

**P1 - High**
- Major feature broken
- Performance degradation >50%
- Error rate >10%
- **Response Time:** 15 minutes
- **Rollback Decision:** After 30 min assessment

**P2 - Medium**
- Minor feature broken
- Performance degradation 25-50%
- Error rate 5-10%
- **Response Time:** 1 hour
- **Rollback Decision:** After 2 hour assessment

**P3 - Low**
- Cosmetic issues
- Performance degradation <25%
- Error rate <5%
- **Response Time:** Next business day
- **Rollback Decision:** Not required

---

## Best Practices

### DO

✅ Test migrations in development first
✅ Generate and test rollback scripts
✅ Use transactions for atomic changes
✅ Create database backups before migrations
✅ Monitor application after deployment
✅ Document all changes
✅ Use feature flags for risky changes
✅ Communicate with stakeholders
✅ Verify data integrity post-migration
✅ Keep migrations small and focused

### DON'T

❌ Skip testing in staging
❌ Apply migrations during peak hours (unless zero-downtime)
❌ Drop columns without backup
❌ Make multiple unrelated changes in one migration
❌ Assume rollback will always work
❌ Deploy code before database migration
❌ Ignore performance impact on large tables
❌ Forget to update documentation
❌ Rush through post-migration verification
❌ Skip the rollback rehearsal

---

## Contact and Escalation

### Migration Issues

- **Technical Lead:** [Contact info]
- **DevOps Team:** [Contact info]
- **On-Call Engineer:** [On-call rotation]

### Emergency Escalation

1. On-Call Engineer (immediate)
2. Technical Lead (if unresolved in 15 min)
3. CTO (if unresolved in 1 hour)

---

## Appendix

### Sample Migration

```sql
-- 054_add_message_bookmarks.sql
-- Add bookmarking feature to messages
-- Complexity: LOW
-- Estimated Duration: 30 seconds

BEGIN;

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS nchat.nchat_message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat.nchat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create indexes
CREATE INDEX idx_message_bookmarks_user
ON nchat.nchat_message_bookmarks(user_id, created_at DESC);

CREATE INDEX idx_message_bookmarks_message
ON nchat.nchat_message_bookmarks(message_id);

-- Add comment
COMMENT ON TABLE nchat.nchat_message_bookmarks IS 'User bookmarks for messages';

COMMIT;
```

### Sample Rollback

```sql
-- 054_add_message_bookmarks.rollback.sql
-- Rollback for message bookmarking feature
-- Generated: 2026-02-09

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS nchat.idx_message_bookmarks_user CASCADE;
DROP INDEX IF EXISTS nchat.idx_message_bookmarks_message CASCADE;

-- Drop table
DROP TABLE IF EXISTS nchat.nchat_message_bookmarks CASCADE;

COMMIT;
```

---

## Version History

- **v1.0.0** (2026-02-09): Initial version
- Task 139: Data migration and rollback rehearsals

---

## References

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Zero-Downtime Migrations: https://fly.io/ruby-dispatch/zero-downtime-postgres-migrations/
- nself CLI Documentation: ~/Sites/nself/README.md
- Project Database Schema: .backend/migrations/
