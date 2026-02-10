#!/bin/bash
# Ordered service startup with health checks
# Used for disaster recovery scenarios

set -e  # Exit on error

echo "=== Starting Service Recovery ==="
START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait for service health
wait_for_service() {
  local service=$1
  local health_check=$2
  local max_wait=${3:-60}
  local waited=0

  echo -n "Waiting for $service to be healthy..."
  until eval $health_check &>/dev/null; do
    echo -n "."
    sleep 2
    waited=$((waited + 2))
    if [ $waited -ge $max_wait ]; then
      echo -e "\n${RED}ERROR: $service failed to start after ${max_wait}s${NC}"
      return 1
    fi
  done
  echo -e " ${GREEN}✓${NC}"
}

# Function to check if container exists
container_exists() {
  docker ps -a --format '{{.Names}}' | grep -q "^$1$"
}

# 1. Start PostgreSQL
echo ""
echo "=== Phase 1: Core Data Layer ==="
if container_exists "nself-postgres"; then
  echo "Starting PostgreSQL..."
  docker start nself-postgres
  wait_for_service "PostgreSQL" \
    "docker exec nself-postgres pg_isready -U postgres" \
    120
else
  echo -e "${YELLOW}Warning: PostgreSQL container not found${NC}"
fi

# 2. Start Redis
if container_exists "nself-redis"; then
  echo "Starting Redis..."
  docker start nself-redis
  wait_for_service "Redis" \
    "docker exec nself-redis redis-cli ping" \
    60
else
  echo -e "${YELLOW}Warning: Redis container not found${NC}"
fi

# 3. Start MinIO
if container_exists "nself-minio"; then
  echo "Starting MinIO..."
  docker start nself-minio
  wait_for_service "MinIO" \
    "curl -f -s http://localhost:9000/minio/health/live" \
    90
else
  echo -e "${YELLOW}Warning: MinIO container not found${NC}"
fi

# 4. Start Auth
echo ""
echo "=== Phase 2: Authentication Layer ==="
if container_exists "nself-auth"; then
  echo "Starting Auth..."
  docker start nself-auth
  wait_for_service "Auth" \
    "curl -f -s http://localhost:4000/healthz" \
    90
else
  echo -e "${YELLOW}Warning: Auth container not found${NC}"
fi

# 5. Start Hasura
echo ""
echo "=== Phase 3: API Layer ==="
if container_exists "nself-hasura"; then
  echo "Starting Hasura..."
  docker start nself-hasura
  wait_for_service "Hasura" \
    "curl -f -s http://localhost:8080/healthz" \
    120
else
  echo -e "${YELLOW}Warning: Hasura container not found${NC}"
fi

# 6. Start Functions
echo ""
echo "=== Phase 4: Application Layer ==="
if container_exists "nself-functions"; then
  echo "Starting Functions..."
  docker start nself-functions
  sleep 5
else
  echo "Functions not configured (optional)"
fi

# 7. Start MeiliSearch
if container_exists "nself-meilisearch"; then
  echo "Starting MeiliSearch..."
  docker start nself-meilisearch
  sleep 5
else
  echo "MeiliSearch not configured (optional)"
fi

# 8. Start Monitoring
echo ""
echo "=== Phase 5: Monitoring Layer ==="
for service in nself-prometheus nself-grafana nself-loki nself-tempo; do
  if container_exists "$service"; then
    echo "Starting $service..."
    docker start $service 2>/dev/null || true
  fi
done
sleep 5

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "=== Recovery Complete ==="
echo -e "${GREEN}Total time: ${DURATION} seconds ($(($DURATION / 60)) minutes ${$(($DURATION % 60))} seconds)${NC}"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/ops/verify-system-health.sh"
echo "2. Run: pnpm test:e2e:smoke"
echo "3. Check logs: cd .backend && nself logs --since 5m"
echo ""
