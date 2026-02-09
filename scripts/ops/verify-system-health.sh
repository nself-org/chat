#!/bin/bash
# Comprehensive system health verification
# Used after recovery operations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED_CHECKS=0
TOTAL_CHECKS=0

check_result() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
}

echo "=== System Health Verification ==="
echo ""

# 1. Container Status
echo "=== Container Status ==="
EXPECTED_CONTAINERS=("nself-postgres" "nself-hasura" "nself-auth")
for container in "${EXPECTED_CONTAINERS[@]}"; do
  if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
    STATUS=$(docker inspect -f '{{.State.Status}}' $container)
    if [ "$STATUS" = "running" ]; then
      check_result 0 "$container is running"
    else
      check_result 1 "$container exists but status is $STATUS"
    fi
  else
    check_result 1 "$container not found"
  fi
done
echo ""

# 2. Service Health Checks
echo "=== Service Health Checks ==="

# PostgreSQL
if docker exec nself-postgres pg_isready -U postgres &>/dev/null; then
  check_result 0 "PostgreSQL accepting connections"
else
  check_result 1 "PostgreSQL not responding"
fi

# Redis
if docker ps --format '{{.Names}}' | grep -q "nself-redis"; then
  if docker exec nself-redis redis-cli ping &>/dev/null; then
    check_result 0 "Redis responding to ping"
  else
    check_result 1 "Redis not responding"
  fi
fi

# Hasura
HASURA_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/healthz 2>/dev/null || echo "000")
if [ "$HASURA_HEALTH" = "200" ]; then
  check_result 0 "Hasura health check passed"
else
  check_result 1 "Hasura health check failed (HTTP $HASURA_HEALTH)"
fi

# Auth
AUTH_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/healthz 2>/dev/null || echo "000")
if [ "$AUTH_HEALTH" = "200" ]; then
  check_result 0 "Auth service health check passed"
else
  check_result 1 "Auth service health check failed (HTTP $AUTH_HEALTH)"
fi

echo ""

# 3. Database Connectivity
echo "=== Database Connectivity ==="

# Check database exists
DB_EXISTS=$(docker exec nself-postgres psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -w nself_db | wc -l)
if [ "$DB_EXISTS" -gt 0 ]; then
  check_result 0 "nself_db database exists"
else
  check_result 1 "nself_db database not found"
fi

# Check table count
TABLE_COUNT=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -gt 0 ]; then
  check_result 0 "Found $TABLE_COUNT tables in database"
else
  check_result 1 "No tables found in database"
fi

# Check can write
WRITE_TEST=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "CREATE TABLE IF NOT EXISTS _health_check (id SERIAL, checked_at TIMESTAMP DEFAULT NOW()); INSERT INTO _health_check DEFAULT VALUES RETURNING id;" 2>/dev/null | tr -d ' ')
if [ ! -z "$WRITE_TEST" ]; then
  check_result 0 "Database write test passed"
  docker exec nself-postgres psql -U postgres -d nself_db -c "DROP TABLE _health_check" &>/dev/null
else
  check_result 1 "Database write test failed"
fi

echo ""

# 4. Resource Usage
echo "=== Resource Usage ==="

# Disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
  check_result 0 "Disk usage acceptable ($DISK_USAGE%)"
else
  check_result 1 "Disk usage high ($DISK_USAGE%)"
fi

# Memory (if available)
if command -v free &> /dev/null; then
  MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3*100/$2}')
  if [ "$MEM_USAGE" -lt 90 ]; then
    check_result 0 "Memory usage acceptable ($MEM_USAGE%)"
  else
    check_result 1 "Memory usage high ($MEM_USAGE%)"
  fi
fi

# Docker daemon
if docker info &>/dev/null; then
  check_result 0 "Docker daemon healthy"
else
  check_result 1 "Docker daemon issues detected"
fi

echo ""

# 5. Network Connectivity
echo "=== Network Connectivity ==="

# Can containers reach each other?
if docker exec nself-hasura ping -c 1 nself-postgres &>/dev/null; then
  check_result 0 "Hasura can reach PostgreSQL"
else
  check_result 1 "Hasura cannot reach PostgreSQL"
fi

if docker exec nself-auth ping -c 1 nself-postgres &>/dev/null; then
  check_result 0 "Auth can reach PostgreSQL"
else
  check_result 1 "Auth cannot reach PostgreSQL"
fi

echo ""

# 6. Critical Data Checks
echo "=== Critical Data Checks ==="

# Check if critical tables exist
CRITICAL_TABLES=("nchat_users" "nchat_channels" "nchat_messages")
for table in "${CRITICAL_TABLES[@]}"; do
  TABLE_EXISTS=$(docker exec nself-postgres psql -U postgres -d nself_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table')" 2>/dev/null | tr -d ' ')
  if [ "$TABLE_EXISTS" = "t" ]; then
    check_result 0 "Table $table exists"
  else
    check_result 1 "Table $table missing"
  fi
done

echo ""

# Summary
echo "=== Summary ==="
PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($TOTAL_CHECKS - $FAILED_CHECKS) * 100 / $TOTAL_CHECKS}")
echo "Checks passed: $(($TOTAL_CHECKS - $FAILED_CHECKS))/$TOTAL_CHECKS ($PASS_RATE%)"

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}All health checks passed!${NC}"
  exit 0
else
  echo -e "${RED}$FAILED_CHECKS checks failed${NC}"
  exit 1
fi
