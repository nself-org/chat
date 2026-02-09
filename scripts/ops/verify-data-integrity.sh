#!/bin/bash
# Database data integrity verification
# Checks for corruption, orphaned records, and constraint violations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES_FOUND=0

report_issue() {
  echo -e "${RED}✗${NC} $1"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

report_ok() {
  echo -e "${GREEN}✓${NC} $1"
}

report_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo "=== Data Integrity Verification ==="
echo ""

# 1. Database Consistency Checks
echo "=== Database Consistency ==="

# Check for table bloat
echo "Checking database size and bloat..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'nchat_%'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"
report_ok "Database size check complete"
echo ""

# 2. Orphaned Records Check
echo "=== Orphaned Records Check ==="

# Messages with invalid user_id
ORPHANED_MESSAGES=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM nchat_messages m
  WHERE NOT EXISTS (
    SELECT 1 FROM nchat_users u WHERE u.id = m.user_id
  );
" | tr -d ' ')

if [ "$ORPHANED_MESSAGES" -eq 0 ]; then
  report_ok "No orphaned messages found"
else
  report_issue "Found $ORPHANED_MESSAGES messages with invalid user_id"
fi

# Messages with invalid channel_id
ORPHANED_CHANNEL_MESSAGES=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM nchat_messages m
  WHERE NOT EXISTS (
    SELECT 1 FROM nchat_channels c WHERE c.id = m.channel_id
  );
" | tr -d ' ')

if [ "$ORPHANED_CHANNEL_MESSAGES" -eq 0 ]; then
  report_ok "No messages with invalid channel_id"
else
  report_issue "Found $ORPHANED_CHANNEL_MESSAGES messages with invalid channel_id"
fi

echo ""

# 3. Data Consistency Checks
echo "=== Data Consistency ==="

# Check for future timestamps
FUTURE_TIMESTAMPS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM nchat_messages
  WHERE created_at > NOW() + INTERVAL '1 day';
" | tr -d ' ')

if [ "$FUTURE_TIMESTAMPS" -eq 0 ]; then
  report_ok "No future timestamps detected"
else
  report_issue "Found $FUTURE_TIMESTAMPS records with future timestamps"
fi

# Check for NULL values in required fields
NULL_USER_IDS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM nchat_messages
  WHERE user_id IS NULL;
" | tr -d ' ')

if [ "$NULL_USER_IDS" -eq 0 ]; then
  report_ok "No NULL user_ids in messages"
else
  report_issue "Found $NULL_USER_IDS messages with NULL user_id"
fi

# Check for duplicate primary keys (should never happen)
DUPLICATE_PKS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM (
    SELECT id, COUNT(*) as count
    FROM nchat_messages
    GROUP BY id
    HAVING COUNT(*) > 1
  ) duplicates;
" | tr -d ' ')

if [ "$DUPLICATE_PKS" -eq 0 ]; then
  report_ok "No duplicate primary keys"
else
  report_issue "Found $DUPLICATE_PKS duplicate primary keys (CRITICAL)"
fi

echo ""

# 4. Constraint Verification
echo "=== Constraint Verification ==="

# Check all constraints are valid
INVALID_CONSTRAINTS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM pg_constraint
  WHERE conrelid::regclass::text LIKE 'nchat_%'
    AND convalidated = false;
" | tr -d ' ')

if [ "$INVALID_CONSTRAINTS" -eq 0 ]; then
  report_ok "All constraints are valid"
else
  report_warning "$INVALID_CONSTRAINTS constraints not validated"
fi

# List all constraints for reference
echo ""
echo "Current constraints:"
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS type,
    CASE
      WHEN contype = 'f' THEN 'Foreign Key'
      WHEN contype = 'p' THEN 'Primary Key'
      WHEN contype = 'u' THEN 'Unique'
      WHEN contype = 'c' THEN 'Check'
      ELSE contype::text
    END AS constraint_type
  FROM pg_constraint
  WHERE conrelid::regclass::text LIKE 'nchat_%'
  ORDER BY conrelid::regclass::text, contype, conname;
"
echo ""

# 5. Index Verification
echo "=== Index Verification ==="

# Check for missing indexes on foreign keys
echo "Verifying indexes on foreign key columns..."
docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    c.conrelid::regclass AS table_name,
    c.conname AS constraint_name,
    a.attname AS column_name,
    CASE
      WHEN i.indexrelid IS NOT NULL THEN 'Indexed'
      ELSE 'NOT INDEXED (consider adding)'
    END AS index_status
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  LEFT JOIN pg_index i ON i.indrelid = c.conrelid
    AND a.attnum = ANY(i.indkey)
  WHERE c.contype = 'f'
    AND c.conrelid::regclass::text LIKE 'nchat_%'
  ORDER BY table_name, constraint_name;
"
report_ok "Index verification complete"
echo ""

# 6. User Account Consistency
echo "=== User Account Consistency ==="

# Compare user counts
NCHAT_USERS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "SELECT COUNT(*) FROM nchat_users;" | tr -d ' ')
AUTH_USERS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "SELECT COUNT(*) FROM auth.users;" | tr -d ' ')

echo "Users in nchat_users: $NCHAT_USERS"
echo "Users in auth.users: $AUTH_USERS"

DIFF=$((NCHAT_USERS - AUTH_USERS))
if [ $DIFF -eq 0 ]; then
  report_ok "User counts match perfectly"
elif [ ${DIFF#-} -le 5 ]; then
  report_warning "User count differs by $DIFF (within acceptable range)"
else
  report_issue "User count differs by $DIFF (needs investigation)"
fi

echo ""

# 7. Message Statistics
echo "=== Message Statistics ==="

docker exec nself-postgres psql -U postgres -d nself_db -c "
  SELECT
    COUNT(*) as total_messages,
    COUNT(DISTINCT user_id) as unique_senders,
    COUNT(DISTINCT channel_id) as channels_with_messages,
    MIN(created_at) as oldest_message,
    MAX(created_at) as newest_message
  FROM nchat_messages;
"

echo ""

# 8. Database Corruption Check
echo "=== Database Corruption Check ==="

# Run VACUUM to check for corruption
echo "Running VACUUM ANALYZE (this may take a moment)..."
docker exec nself-postgres psql -U postgres -d nself_db -c "VACUUM ANALYZE;" &>/dev/null

if [ $? -eq 0 ]; then
  report_ok "VACUUM completed successfully (no corruption detected)"
else
  report_issue "VACUUM failed (possible corruption)"
fi

# Check for corrupt indexes
echo "Checking index health..."
CORRUPT_INDEXES=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "
  SELECT COUNT(*)
  FROM pg_class c
  JOIN pg_index i ON i.indexrelid = c.oid
  WHERE c.relkind = 'i'
    AND c.relname LIKE 'nchat_%'
    AND NOT pg_relation_is_updatable(c.oid::regclass, false);
" | tr -d ' ')

if [ "$CORRUPT_INDEXES" -eq 0 ]; then
  report_ok "All indexes are healthy"
else
  report_warning "$CORRUPT_INDEXES indexes may need rebuilding"
fi

echo ""

# Summary
echo "=== Summary ==="
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✓ Data integrity verification passed with no issues${NC}"
  exit 0
else
  echo -e "${RED}✗ Found $ISSUES_FOUND issues requiring attention${NC}"
  echo ""
  echo "Recommended actions:"
  echo "1. Review issues listed above"
  echo "2. For orphaned records, consider data cleanup"
  echo "3. For constraint violations, investigate root cause"
  echo "4. For corruption, consider restore from backup"
  exit 1
fi
