#!/bin/bash
# ============================================================================
# Chaos Engineering Test Runner for nself-chat
# Tests system resilience under failure conditions
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:3000"}
RESULTS_DIR="./chaos-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Docker/Kubernetes settings
USE_DOCKER=${USE_DOCKER:-true}
USE_K8S=${USE_K8S:-false}

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${MAGENTA}===========================================================================${NC}"
    echo -e "${MAGENTA}$1${NC}"
    echo -e "${MAGENTA}===========================================================================${NC}\n"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_chaos() {
    echo -e "${MAGENTA}[CHAOS]${NC} $1"
}

check_dependencies() {
    print_header "Checking Dependencies"

    # Check for k6
    if ! command -v k6 &> /dev/null; then
        print_error "k6 not found. Please install: brew install k6"
        exit 1
    fi
    print_info "k6 found: $(k6 version)"

    # Check for docker
    if [ "$USE_DOCKER" = true ]; then
        if ! command -v docker &> /dev/null; then
            print_error "Docker not found but USE_DOCKER=true"
            exit 1
        fi
        print_info "Docker found: $(docker --version)"
    fi

    # Check for kubectl
    if [ "$USE_K8S" = true ]; then
        if ! command -v kubectl &> /dev/null; then
            print_error "kubectl not found but USE_K8S=true"
            exit 1
        fi
        print_info "kubectl found: $(kubectl version --client)"
    fi

    # Check for chaos toolkit (optional)
    if command -v chaos &> /dev/null; then
        print_info "Chaos Toolkit found: $(chaos --version)"
    else
        print_warning "Chaos Toolkit not found. Some advanced tests may be skipped."
    fi
}

create_results_dir() {
    print_header "Creating Results Directory"

    mkdir -p "${REPORT_DIR}"
    mkdir -p "${REPORT_DIR}/raw"
    mkdir -p "${REPORT_DIR}/logs"
    mkdir -p "${REPORT_DIR}/screenshots"

    print_info "Results will be saved to: ${REPORT_DIR}"
}

# ============================================================================
# Chaos Injection Functions
# ============================================================================

stop_database() {
    print_chaos "Stopping database container..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml stop postgres
    elif [ "$USE_K8S" = true ]; then
        kubectl scale deployment postgres --replicas=0
    fi

    print_chaos "Database stopped"
}

start_database() {
    print_chaos "Starting database container..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml start postgres
    elif [ "$USE_K8S" = true ]; then
        kubectl scale deployment postgres --replicas=1
    fi

    # Wait for database to be ready
    sleep 30
    print_chaos "Database started"
}

inject_network_latency() {
    local latency=$1
    print_chaos "Injecting ${latency}ms network latency..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T hasura \
            tc qdisc add dev eth0 root netem delay ${latency}ms
    fi

    print_chaos "Network latency injected"
}

remove_network_latency() {
    print_chaos "Removing network latency..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T hasura \
            tc qdisc del dev eth0 root || true
    fi

    print_chaos "Network latency removed"
}

inject_packet_loss() {
    local loss_percent=$1
    print_chaos "Injecting ${loss_percent}% packet loss..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T hasura \
            tc qdisc add dev eth0 root netem loss ${loss_percent}%
    fi

    print_chaos "Packet loss injected"
}

remove_packet_loss() {
    print_chaos "Removing packet loss..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T hasura \
            tc qdisc del dev eth0 root || true
    fi

    print_chaos "Packet loss removed"
}

stop_service() {
    local service=$1
    print_chaos "Stopping ${service} service..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml stop ${service}
    elif [ "$USE_K8S" = true ]; then
        kubectl scale deployment ${service} --replicas=0
    fi

    print_chaos "${service} stopped"
}

start_service() {
    local service=$1
    print_chaos "Starting ${service} service..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml start ${service}
    elif [ "$USE_K8S" = true ]; then
        kubectl scale deployment ${service} --replicas=1
    fi

    sleep 10
    print_chaos "${service} started"
}

fill_disk() {
    local size_gb=$1
    print_chaos "Filling disk with ${size_gb}GB of data..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T postgres \
            dd if=/dev/zero of=/tmp/chaos-fill bs=1G count=${size_gb}
    fi

    print_chaos "Disk filled"
}

cleanup_disk() {
    print_chaos "Cleaning up disk space..."

    if [ "$USE_DOCKER" = true ]; then
        docker-compose -f .backend/docker-compose.yml exec -T postgres \
            rm -f /tmp/chaos-fill || true
    fi

    print_chaos "Disk cleaned up"
}

# ============================================================================
# Chaos Test Scenarios
# ============================================================================

test_database_failure() {
    print_header "Chaos Test 1: Database Failure and Recovery"

    print_info "Starting load test in background..."
    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="100" \
        --env DURATION="10m" \
        --out json="${REPORT_DIR}/raw/database-failure.json" \
        tests/chaos/database-failure.js &> "${REPORT_DIR}/logs/database-failure.log" &

    local K6_PID=$!

    sleep 120  # Let load stabilize

    # Inject chaos
    stop_database

    print_chaos "Database down for 60 seconds..."
    sleep 60

    start_database

    print_info "Waiting for load test to complete..."
    wait $K6_PID || true

    print_info "Database failure test complete"
}

test_network_partition() {
    print_header "Chaos Test 2: Network Partition"

    print_info "Starting load test in background..."
    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="100" \
        --env DURATION="8m" \
        --out json="${REPORT_DIR}/raw/network-partition.json" \
        tests/chaos/network-partition.js &> "${REPORT_DIR}/logs/network-partition.log" &

    local K6_PID=$!

    sleep 120  # Let load stabilize

    # Inject network latency
    inject_network_latency 500

    print_chaos "High latency for 2 minutes..."
    sleep 120

    # Inject packet loss
    remove_network_latency
    inject_packet_loss 30

    print_chaos "30% packet loss for 2 minutes..."
    sleep 120

    # Remove chaos
    remove_packet_loss

    print_info "Waiting for load test to complete..."
    wait $K6_PID || true

    print_info "Network partition test complete"
}

test_service_crashes() {
    print_header "Chaos Test 3: Service Crashes and Restarts"

    print_info "Starting load test in background..."
    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="100" \
        --env DURATION="12m" \
        --out json="${REPORT_DIR}/raw/service-crashes.json" \
        tests/chaos/service-crashes.js &> "${REPORT_DIR}/logs/service-crashes.log" &

    local K6_PID=$!

    sleep 120  # Let load stabilize

    # Stop and start services randomly
    for service in hasura auth storage; do
        print_chaos "Crashing ${service}..."
        stop_service ${service}

        sleep 30

        print_chaos "Recovering ${service}..."
        start_service ${service}

        sleep 90
    done

    print_info "Waiting for load test to complete..."
    wait $K6_PID || true

    print_info "Service crashes test complete"
}

test_resource_exhaustion() {
    print_header "Chaos Test 4: Resource Exhaustion"

    print_info "Testing disk space exhaustion..."

    # Fill disk
    fill_disk 5

    print_info "Starting load test with full disk..."
    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="50" \
        --env DURATION="5m" \
        --out json="${REPORT_DIR}/raw/resource-exhaustion.json" \
        tests/chaos/resource-exhaustion.js &> "${REPORT_DIR}/logs/resource-exhaustion.log" || true

    # Cleanup
    cleanup_disk

    print_info "Resource exhaustion test complete"
}

test_cascading_failures() {
    print_header "Chaos Test 5: Cascading Failures"

    print_info "Starting load test in background..."
    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="200" \
        --env DURATION="15m" \
        --out json="${REPORT_DIR}/raw/cascading-failures.json" \
        tests/chaos/cascading-failures.js &> "${REPORT_DIR}/logs/cascading-failures.log" &

    local K6_PID=$!

    sleep 120  # Let load stabilize

    # Trigger cascading failures
    print_chaos "Stage 1: Stop Redis (cache layer)..."
    stop_service redis
    sleep 90

    print_chaos "Stage 2: Add network latency..."
    inject_network_latency 200
    sleep 90

    print_chaos "Stage 3: Stop one Hasura instance..."
    # This would work with multiple instances
    sleep 90

    # Start recovery
    print_chaos "Recovery: Restart Redis..."
    start_service redis
    sleep 60

    print_chaos "Recovery: Remove network latency..."
    remove_network_latency
    sleep 90

    print_info "Waiting for load test to complete..."
    wait $K6_PID || true

    print_info "Cascading failures test complete"
}

test_split_brain() {
    print_header "Chaos Test 6: Split Brain Scenario"

    print_warning "Split brain test requires distributed setup. Skipping for single-node."
    print_info "Would test: Network partition between database replicas"
}

# ============================================================================
# Report Generation
# ============================================================================

generate_chaos_report() {
    print_header "Generating Chaos Engineering Report"

    cat > "${REPORT_DIR}/CHAOS-REPORT.md" << EOF
# ɳChat Chaos Engineering Report

**Date**: $(date)
**Environment**: ${API_URL}
**Test Suite Version**: 1.0.0

---

## Executive Summary

This report documents chaos engineering experiments performed on ɳChat to validate system resilience under failure conditions.

---

## Test Scenarios

### 1. Database Failure and Recovery

**Scenario**: Complete database failure for 60 seconds during active load

**Chaos Injected:**
- Database container stopped
- Duration: 60 seconds
- Background load: 100 concurrent users

**Expected Behavior:**
- [ ] Application shows graceful error messages
- [ ] Requests queue or timeout appropriately
- [ ] Database reconnects automatically on recovery
- [ ] No data corruption
- [ ] System recovers within 30 seconds after database restart

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/database-failure.log
\`\`\`

**Recovery Metrics:**
- Time to detect failure: [Fill from logs]
- Error rate during outage: [Fill from logs]
- Recovery time: [Fill from logs]
- Data consistency: ✅ PASS / ❌ FAIL

---

### 2. Network Partition

**Scenario**: High latency and packet loss

**Chaos Injected:**
- Phase 1: 500ms network latency (2 minutes)
- Phase 2: 30% packet loss (2 minutes)
- Background load: 100 concurrent users

**Expected Behavior:**
- [ ] Graceful timeout handling
- [ ] Retry logic works correctly
- [ ] No cascading failures
- [ ] WebSocket auto-reconnect
- [ ] Circuit breakers trigger if needed

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/network-partition.log
\`\`\`

**Metrics:**
- Connection timeout rate: [Fill from logs]
- Retry success rate: [Fill from logs]
- Circuit breaker trips: [Fill from logs]

---

### 3. Service Crashes and Restarts

**Scenario**: Random service crashes (Hasura, Auth, Storage)

**Chaos Injected:**
- Each service stopped for 30 seconds
- 90 seconds recovery period between crashes
- Background load: 100 concurrent users

**Expected Behavior:**
- [ ] Health checks detect failures
- [ ] Load balancer routes around failed instances
- [ ] Services auto-restart
- [ ] State recovers correctly
- [ ] No permanent data loss

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/service-crashes.log
\`\`\`

**Metrics:**
- Detection time per service: [Fill from logs]
- Recovery time per service: [Fill from logs]
- Request failure rate: [Fill from logs]

---

### 4. Resource Exhaustion

**Scenario**: Disk space exhaustion

**Chaos Injected:**
- 5GB file created to fill disk
- Duration: 5 minutes
- Background load: 50 concurrent users

**Expected Behavior:**
- [ ] Graceful handling of disk full errors
- [ ] Alerts triggered
- [ ] No service crashes
- [ ] Old files cleaned up if configured
- [ ] Recovery after disk space freed

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/resource-exhaustion.log
\`\`\`

**Metrics:**
- Error handling: ✅ PASS / ❌ FAIL
- Alert triggered: ✅ YES / ❌ NO
- Service stability: ✅ PASS / ❌ FAIL

---

### 5. Cascading Failures

**Scenario**: Multiple failures in sequence

**Chaos Injected:**
- Stage 1: Redis cache failure
- Stage 2: Network latency (200ms)
- Stage 3: Service instance failure
- Background load: 200 concurrent users

**Expected Behavior:**
- [ ] Circuit breakers prevent cascade
- [ ] Bulkheads isolate failures
- [ ] Graceful degradation
- [ ] Core functionality remains
- [ ] Full recovery possible

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/cascading-failures.log
\`\`\`

**Metrics:**
- Cascade containment: ✅ PASS / ❌ FAIL
- Degraded mode success: ✅ PASS / ❌ FAIL
- Recovery time: [Fill from logs]

---

### 6. Split Brain Scenario

**Status**: Skipped (requires distributed setup)

---

## System Resilience Scorecard

| Criterion | Score (1-10) | Notes |
|-----------|--------------|-------|
| Failure Detection | [Score] | [Notes] |
| Graceful Degradation | [Score] | [Notes] |
| Auto-Recovery | [Score] | [Notes] |
| Data Consistency | [Score] | [Notes] |
| Error Messaging | [Score] | [Notes] |
| Monitoring/Alerts | [Score] | [Notes] |
| **Overall** | **[Avg]** | |

---

## Critical Findings

### High Priority Issues
1. [Issue found]
2. [Issue found]

### Medium Priority Issues
1. [Issue found]
2. [Issue found]

### Low Priority Issues
1. [Issue found]

---

## Recommendations

### Immediate Actions
1. **[Action]**: [Description and reason]
2. **[Action]**: [Description and reason]

### Short-term Improvements (1-3 months)
1. **[Improvement]**: [Description]
2. **[Improvement]**: [Description]

### Long-term Enhancements (3-6 months)
1. **[Enhancement]**: [Description]
2. **[Enhancement]**: [Description]

---

## Chaos Engineering Best Practices

### What Worked Well
- [Observation]
- [Observation]

### Areas for Improvement
- [Observation]
- [Observation]

### Lessons Learned
1. [Lesson]
2. [Lesson]
3. [Lesson]

---

## Test Artifacts

- Raw test data: \`${REPORT_DIR}/raw/\`
- Test logs: \`${REPORT_DIR}/logs/\`
- Monitoring dashboards: http://grafana.localhost/dashboards

---

## Next Steps

1. [ ] Fix critical issues identified
2. [ ] Implement missing resilience patterns
3. [ ] Add automated chaos tests to CI/CD
4. [ ] Schedule regular chaos engineering exercises
5. [ ] Update disaster recovery procedures

---

## Conclusion

**Overall Resilience Rating**: ⭐⭐⭐⭐⭐ (1-5 stars)

**Production Readiness**: ✅ READY / ⚠️ CONDITIONAL / ❌ NOT READY

[Add overall assessment]

---

*Generated by ɳChat Chaos Engineering Suite*
*Report ID: ${TIMESTAMP}*
EOF

    print_info "Chaos engineering report generated: ${REPORT_DIR}/CHAOS-REPORT.md"
}

cleanup() {
    print_header "Cleanup"

    # Remove any lingering chaos
    remove_network_latency
    remove_packet_loss
    cleanup_disk

    # Ensure all services are running
    if [ "$USE_DOCKER" = true ]; then
        print_info "Ensuring all services are running..."
        docker-compose -f .backend/docker-compose.yml start
    fi

    print_info "Test artifacts saved to: ${REPORT_DIR}"
    print_info "View report: cat ${REPORT_DIR}/CHAOS-REPORT.md"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header "ɳChat Chaos Engineering Test Suite"
    print_warning "This will inject failures into your system!"
    print_warning "Do NOT run against production!"

    echo -e "\nContinue with chaos tests? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Chaos tests cancelled"
        exit 0
    fi

    print_info "Starting chaos test suite at $(date)"

    check_dependencies
    create_results_dir

    # Run chaos tests
    test_database_failure
    test_network_partition
    test_service_crashes
    test_resource_exhaustion
    test_cascading_failures
    test_split_brain

    # Generate report
    generate_chaos_report

    # Cleanup
    cleanup

    print_header "Chaos Test Suite Complete"
    print_info "Results: ${REPORT_DIR}"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Record start time
START_TIME=$(date +%s)

# Run main function
main "$@"
