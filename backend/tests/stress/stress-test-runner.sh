#!/bin/bash
# ============================================================================
# Stress Test Runner for nself-chat
# Tests system behavior under extreme load conditions
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:3000"}
WS_URL=${WS_URL:-"ws://localhost:3000"}
RESULTS_DIR="./stress-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Stress test parameters
PEAK_LOAD_VUS=5000          # Peak concurrent users
SUSTAINED_LOAD_VUS=2000     # Sustained high load
BURST_LOAD_VUS=10000        # Burst traffic spike
SOAK_TEST_DURATION="4h"     # Soak test duration
SPIKE_TEST_DURATION="30m"   # Spike test duration
ENDURANCE_TEST_DURATION="8h" # Endurance test duration

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "\n${BLUE}===========================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================================================${NC}\n"
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

check_dependencies() {
    print_header "Checking Dependencies"

    if ! command -v k6 &> /dev/null; then
        print_error "k6 not found. Please install: brew install k6"
        exit 1
    fi
    print_info "k6 found: $(k6 version)"

    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery not found. Some tests may be skipped."
    else
        print_info "Artillery found: $(artillery version)"
    fi
}

create_results_dir() {
    print_header "Creating Results Directory"

    mkdir -p "${REPORT_DIR}"
    mkdir -p "${REPORT_DIR}/raw"
    mkdir -p "${REPORT_DIR}/graphs"
    mkdir -p "${REPORT_DIR}/logs"

    print_info "Results will be saved to: ${REPORT_DIR}"
}

run_peak_load_test() {
    print_header "Stress Test 1: Peak Load (5,000 Concurrent Users)"

    print_info "Testing system at peak capacity..."
    print_info "Target: ${PEAK_LOAD_VUS} concurrent users"
    print_info "Duration: 30 minutes"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${PEAK_LOAD_VUS}" \
        --env DURATION="30m" \
        --env RAMP_UP="5m" \
        --env RAMP_DOWN="5m" \
        --out json="${REPORT_DIR}/raw/peak-load.json" \
        tests/stress/peak-load.js \
        | tee "${REPORT_DIR}/logs/peak-load.log"

    print_info "Peak load test complete"
}

run_sustained_load_test() {
    print_header "Stress Test 2: Sustained High Load (${SOAK_TEST_DURATION})"

    print_info "Testing system stability under sustained load..."
    print_info "Target: ${SUSTAINED_LOAD_VUS} concurrent users"
    print_info "Duration: ${SOAK_TEST_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${SUSTAINED_LOAD_VUS}" \
        --env DURATION="${SOAK_TEST_DURATION}" \
        --env RAMP_UP="10m" \
        --out json="${REPORT_DIR}/raw/sustained-load.json" \
        tests/stress/sustained-load.js \
        | tee "${REPORT_DIR}/logs/sustained-load.log"

    print_info "Sustained load test complete"
}

run_burst_traffic_test() {
    print_header "Stress Test 3: Burst Traffic Pattern"

    print_info "Testing sudden traffic spikes..."
    print_info "Burst size: ${BURST_LOAD_VUS} users"
    print_info "Pattern: Recurring bursts over ${SPIKE_TEST_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env BASE_VUS="100" \
        --env BURST_VUS="${BURST_LOAD_VUS}" \
        --env BURST_DURATION="2m" \
        --env REST_DURATION="5m" \
        --env TOTAL_DURATION="${SPIKE_TEST_DURATION}" \
        --out json="${REPORT_DIR}/raw/burst-traffic.json" \
        tests/stress/burst-traffic.js \
        | tee "${REPORT_DIR}/logs/burst-traffic.log"

    print_info "Burst traffic test complete"
}

run_endurance_test() {
    print_header "Stress Test 4: Endurance Test (${ENDURANCE_TEST_DURATION})"

    print_warning "This test will run for ${ENDURANCE_TEST_DURATION}. Continue? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_warning "Endurance test skipped"
        return
    fi

    print_info "Testing for memory leaks and resource exhaustion..."
    print_info "Target: ${SUSTAINED_LOAD_VUS} concurrent users"
    print_info "Duration: ${ENDURANCE_TEST_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${SUSTAINED_LOAD_VUS}" \
        --env DURATION="${ENDURANCE_TEST_DURATION}" \
        --env RAMP_UP="15m" \
        --out json="${REPORT_DIR}/raw/endurance.json" \
        tests/stress/endurance.js \
        | tee "${REPORT_DIR}/logs/endurance.log"

    print_info "Endurance test complete"
}

run_connection_pool_stress() {
    print_header "Stress Test 5: Database Connection Pool Exhaustion"

    print_info "Testing database connection pool limits..."

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="500" \
        --env DURATION="10m" \
        --env QUERY_RATE="high" \
        --out json="${REPORT_DIR}/raw/connection-pool.json" \
        tests/stress/connection-pool.js \
        | tee "${REPORT_DIR}/logs/connection-pool.log"

    print_info "Connection pool stress test complete"
}

run_memory_stress() {
    print_header "Stress Test 6: Memory Stress (Large Payloads)"

    print_info "Testing with large message payloads..."

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="200" \
        --env DURATION="15m" \
        --env PAYLOAD_SIZE="10MB" \
        --out json="${REPORT_DIR}/raw/memory-stress.json" \
        tests/stress/memory-stress.js \
        | tee "${REPORT_DIR}/logs/memory-stress.log"

    print_info "Memory stress test complete"
}

generate_stress_report() {
    print_header "Generating Stress Test Report"

    cat > "${REPORT_DIR}/STRESS-TEST-REPORT.md" << EOF
# ɳChat Stress Test Report

**Date**: $(date)
**Environment**: ${API_URL}
**Test Suite Version**: 1.0.0

---

## Executive Summary

This report documents the stress testing of ɳChat under extreme load conditions to identify system breaking points and performance degradation patterns.

---

## Test Scenarios

### 1. Peak Load Test (5,000 Concurrent Users)

**Parameters:**
- Concurrent Users: ${PEAK_LOAD_VUS}
- Duration: 30 minutes
- Ramp-up: 5 minutes
- Ramp-down: 5 minutes

**Objectives:**
- Identify maximum sustainable capacity
- Measure performance degradation at peak
- Verify auto-scaling behavior

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/peak-load.log
\`\`\`

**Pass Criteria:**
- [ ] p95 response time < 2s
- [ ] Error rate < 5%
- [ ] No system crashes
- [ ] Auto-scaling triggers correctly

---

### 2. Sustained Load Test (${SOAK_TEST_DURATION})

**Parameters:**
- Concurrent Users: ${SUSTAINED_LOAD_VUS}
- Duration: ${SOAK_TEST_DURATION}
- Ramp-up: 10 minutes

**Objectives:**
- Detect memory leaks
- Identify resource exhaustion
- Verify stability over time

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/sustained-load.log
\`\`\`

**Pass Criteria:**
- [ ] Memory usage stable (no upward trend)
- [ ] CPU usage stable
- [ ] No connection pool leaks
- [ ] Response times stable throughout

---

### 3. Burst Traffic Pattern

**Parameters:**
- Base Load: 100 users
- Burst Load: ${BURST_LOAD_VUS} users
- Burst Duration: 2 minutes
- Rest Period: 5 minutes
- Total Duration: ${SPIKE_TEST_DURATION}

**Objectives:**
- Test auto-scaling responsiveness
- Verify graceful degradation
- Test queue backpressure

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/burst-traffic.log
\`\`\`

**Pass Criteria:**
- [ ] Auto-scaling responds within 1 minute
- [ ] No dropped connections
- [ ] Queue backpressure works correctly
- [ ] Recovery time < 2 minutes after burst

---

### 4. Endurance Test (${ENDURANCE_TEST_DURATION})

**Parameters:**
- Concurrent Users: ${SUSTAINED_LOAD_VUS}
- Duration: ${ENDURANCE_TEST_DURATION}

**Objectives:**
- Long-term stability validation
- Memory leak detection
- Resource exhaustion identification

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/endurance.log
\`\`\`

**Pass Criteria:**
- [ ] No memory growth beyond 10%
- [ ] No file descriptor leaks
- [ ] No database connection leaks
- [ ] Consistent response times

---

### 5. Database Connection Pool Stress

**Parameters:**
- Concurrent Users: 500
- Query Rate: High
- Duration: 10 minutes

**Objectives:**
- Test connection pool limits
- Verify connection pooling behavior
- Test connection recovery

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/connection-pool.log
\`\`\`

**Pass Criteria:**
- [ ] Connection pool doesn't exhaust
- [ ] Proper connection reuse
- [ ] Graceful handling of pool saturation
- [ ] No connection timeouts

---

### 6. Memory Stress (Large Payloads)

**Parameters:**
- Concurrent Users: 200
- Payload Size: 10MB per message
- Duration: 15 minutes

**Objectives:**
- Test large payload handling
- Verify memory management
- Test garbage collection

**Results:**
\`\`\`
See: ${REPORT_DIR}/logs/memory-stress.log
\`\`\`

**Pass Criteria:**
- [ ] No out-of-memory errors
- [ ] Proper streaming for large files
- [ ] GC pause times < 100ms
- [ ] Memory pressure handled gracefully

---

## System Limits Identified

### Breaking Points
1. **Maximum Concurrent Users**: [Fill from results]
2. **Maximum Message Throughput**: [Fill from results]
3. **Maximum WebSocket Connections**: [Fill from results]
4. **Database Query Limit**: [Fill from results]

### Resource Saturation Points
1. **CPU**: [Fill from results]
2. **Memory**: [Fill from results]
3. **Network**: [Fill from results]
4. **Disk I/O**: [Fill from results]

---

## Performance Degradation Patterns

### At 50% Capacity
- Response Time: [Fill from results]
- Error Rate: [Fill from results]

### At 75% Capacity
- Response Time: [Fill from results]
- Error Rate: [Fill from results]

### At 90% Capacity
- Response Time: [Fill from results]
- Error Rate: [Fill from results]

### At 100% Capacity
- Response Time: [Fill from results]
- Error Rate: [Fill from results]

---

## Recommendations

### Immediate Actions Required
1. [Add critical issues found]

### Capacity Planning
1. **Recommended Max Capacity**: [Fill from results]
2. **Safety Margin**: [Fill from results]
3. **Auto-scaling Thresholds**: [Fill from results]

### Optimization Opportunities
1. [Add optimization recommendations]
2. [Add optimization recommendations]
3. [Add optimization recommendations]

---

## Test Artifacts

- Raw test data: \`${REPORT_DIR}/raw/\`
- Test logs: \`${REPORT_DIR}/logs/\`
- Monitoring dashboards: http://grafana.localhost/dashboards

---

## Conclusion

**Overall Stress Test Status**: ⚠️ REVIEW REQUIRED

**Critical Issues**: [Number]
**Warnings**: [Number]
**Passed**: [Number]

---

*Generated by ɳChat Stress Test Suite*
*Report ID: ${TIMESTAMP}*
EOF

    print_info "Stress test report generated: ${REPORT_DIR}/STRESS-TEST-REPORT.md"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header "ɳChat Stress Test Suite"
    print_info "Starting stress test suite at $(date)"

    check_dependencies
    create_results_dir

    # Run stress tests
    run_peak_load_test
    run_sustained_load_test
    run_burst_traffic_test
    run_connection_pool_stress
    run_memory_stress

    # Optional: Run endurance test (long-running)
    run_endurance_test

    # Generate report
    generate_stress_report

    print_header "Stress Test Suite Complete"
    print_info "Results: ${REPORT_DIR}"
    print_info "Review report: ${REPORT_DIR}/STRESS-TEST-REPORT.md"
}

# Record start time
START_TIME=$(date +%s)

# Run main function
main "$@"
