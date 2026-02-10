#!/bin/bash
# ============================================================================
# Performance Test Runner for nself-chat
# Runs all load tests and generates comprehensive performance report
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
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Performance targets
TARGET_USERS=10000
TARGET_MSG_RATE=1000
TARGET_API_VUS=100
TARGET_FILE_VUS=100
TARGET_SEARCH_VUS=100

# Test durations
WEBSOCKET_DURATION="30m"
MESSAGE_DURATION="10m"
API_DURATION="5m"
FILE_DURATION="5m"
SEARCH_DURATION="5m"

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

    # Check for k6
    if ! command -v k6 &> /dev/null; then
        print_error "k6 not found. Please install: brew install k6"
        exit 1
    fi
    print_info "k6 found: $(k6 version)"

    # Check for Artillery
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery not found. WebSocket tests will use k6 only."
    else
        print_info "Artillery found: $(artillery version)"
    fi

    # Check API availability
    print_info "Checking API availability at ${API_URL}..."
    if curl -s -o /dev/null -w "%{http_code}" "${API_URL}/api/health" | grep -q "200"; then
        print_info "API is reachable"
    else
        print_warning "API health check failed. Some tests may fail."
    fi
}

create_results_dir() {
    print_header "Creating Results Directory"

    mkdir -p "${REPORT_DIR}"
    print_info "Results will be saved to: ${REPORT_DIR}"

    # Create subdirectories
    mkdir -p "${REPORT_DIR}/raw"
    mkdir -p "${REPORT_DIR}/graphs"
    mkdir -p "${REPORT_DIR}/logs"
}

run_websocket_test() {
    print_header "Test 1: WebSocket Connections (10,000 Concurrent Users)"

    print_info "Starting WebSocket connection test..."
    print_info "Target: ${TARGET_USERS} concurrent users"
    print_info "Duration: ${WEBSOCKET_DURATION}"

    k6 run \
        --env WS_URL="${WS_URL}" \
        --env VUS="${TARGET_USERS}" \
        --env DURATION="${WEBSOCKET_DURATION}" \
        --out json="${REPORT_DIR}/raw/websocket-connections.json" \
        tests/load/websocket-connections.js \
        | tee "${REPORT_DIR}/logs/websocket-connections.log"

    print_info "WebSocket test complete"
}

run_message_throughput_test() {
    print_header "Test 2: Message Throughput (1,000 Messages/Second)"

    print_info "Starting message throughput test..."
    print_info "Target: ${TARGET_MSG_RATE} messages/second"
    print_info "Duration: ${MESSAGE_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env TARGET_RATE="${TARGET_MSG_RATE}" \
        --env DURATION="${MESSAGE_DURATION}" \
        --out json="${REPORT_DIR}/raw/message-throughput.json" \
        tests/load/message-throughput.js \
        | tee "${REPORT_DIR}/logs/message-throughput.log"

    print_info "Message throughput test complete"
}

run_api_endpoints_test() {
    print_header "Test 3: API Endpoints Load Test"

    print_info "Starting API endpoints test..."
    print_info "Virtual Users: ${TARGET_API_VUS}"
    print_info "Duration: ${API_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${TARGET_API_VUS}" \
        --env DURATION="${API_DURATION}" \
        --out json="${REPORT_DIR}/raw/api-endpoints.json" \
        tests/load/api-endpoints.js \
        | tee "${REPORT_DIR}/logs/api-endpoints.log"

    print_info "API endpoints test complete"
}

run_file_upload_test() {
    print_header "Test 4: File Upload Load Test"

    print_info "Starting file upload test..."
    print_info "Virtual Users: ${TARGET_FILE_VUS}"
    print_info "Duration: ${FILE_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${TARGET_FILE_VUS}" \
        --env DURATION="${FILE_DURATION}" \
        --out json="${REPORT_DIR}/raw/file-uploads.json" \
        tests/load/file-uploads.js \
        | tee "${REPORT_DIR}/logs/file-uploads.log"

    print_info "File upload test complete"
}

run_search_test() {
    print_header "Test 5: Search Performance Load Test"

    print_info "Starting search performance test..."
    print_info "Virtual Users: ${TARGET_SEARCH_VUS}"
    print_info "Duration: ${SEARCH_DURATION}"

    k6 run \
        --env API_URL="${API_URL}" \
        --env VUS="${TARGET_SEARCH_VUS}" \
        --env DURATION="${SEARCH_DURATION}" \
        --out json="${REPORT_DIR}/raw/search-queries.json" \
        tests/load/search-queries.js \
        | tee "${REPORT_DIR}/logs/search-queries.log"

    print_info "Search performance test complete"
}

generate_summary_report() {
    print_header "Generating Performance Summary Report"

    cat > "${REPORT_DIR}/PERFORMANCE-REPORT.md" << EOF
# ɳChat Performance Test Report
**Date**: $(date)
**Environment**: ${API_URL}
**Duration**: Total test suite runtime

---

## Executive Summary

This report summarizes the performance testing of ɳChat under load conditions with 10,000 concurrent users.

### Test Scenarios

1. **WebSocket Connections**: ${TARGET_USERS} concurrent users over ${WEBSOCKET_DURATION}
2. **Message Throughput**: ${TARGET_MSG_RATE} messages/second over ${MESSAGE_DURATION}
3. **API Endpoints**: ${TARGET_API_VUS} virtual users over ${API_DURATION}
4. **File Uploads**: ${TARGET_FILE_VUS} concurrent uploads over ${FILE_DURATION}
5. **Search Queries**: ${TARGET_SEARCH_VUS} concurrent searches over ${SEARCH_DURATION}

---

## Test Results

### 1. WebSocket Connections (10k Concurrent Users)

**Test Parameters:**
- Target Users: ${TARGET_USERS}
- Test Duration: ${WEBSOCKET_DURATION}
- Connection Protocol: WebSocket

**Results:**
$(grep "Connection Time (p95)" "${REPORT_DIR}/logs/websocket-connections.log" 2>/dev/null || echo "See raw log file for details")

**Pass/Fail:**
- Connection Time p95 < 1s: [Check log]
- Connection Time p99 < 2s: [Check log]
- Connection Errors < 100: [Check log]

---

### 2. Message Throughput (1,000 msg/sec)

**Test Parameters:**
- Target Rate: ${TARGET_MSG_RATE} messages/second
- Test Duration: ${MESSAGE_DURATION}

**Results:**
$(grep "Actual Rate" "${REPORT_DIR}/logs/message-throughput.log" 2>/dev/null || echo "See raw log file for details")

**Pass/Fail:**
- p95 Latency < 200ms: [Check log]
- p99 Latency < 500ms: [Check log]
- Delivery Rate > 99%: [Check log]

---

### 3. API Endpoints

**Test Parameters:**
- Virtual Users: ${TARGET_API_VUS}
- Test Duration: ${API_DURATION}
- Endpoints Tested: Auth, Channels, Messages, Search, Users, Notifications

**Results:**
$(grep "Average Duration" "${REPORT_DIR}/logs/api-endpoints.log" 2>/dev/null || echo "See raw log file for details")

**Pass/Fail:**
- p95 Response Time < 500ms: [Check log]
- Error Rate < 1%: [Check log]

---

### 4. File Uploads (100 Concurrent)

**Test Parameters:**
- Virtual Users: ${TARGET_FILE_VUS}
- Test Duration: ${FILE_DURATION}
- File Sizes: 100KB - 50MB

**Results:**
$(grep "Average Upload Time" "${REPORT_DIR}/logs/file-uploads.log" 2>/dev/null || echo "See raw log file for details")

**Pass/Fail:**
- p95 Upload Time < 5s: [Check log]
- Success Rate > 99%: [Check log]

---

### 5. Search Performance

**Test Parameters:**
- Virtual Users: ${TARGET_SEARCH_VUS}
- Test Duration: ${SEARCH_DURATION}
- Index Size: 1M+ messages

**Results:**
$(grep "Average Query Time" "${REPORT_DIR}/logs/search-queries.log" 2>/dev/null || echo "See raw log file for details")

**Pass/Fail:**
- p95 Query Time < 500ms: [Check log]
- Relevance Score > 80%: [Check log]

---

## System Metrics

### Resource Utilization
- CPU Usage: [Monitor Grafana]
- Memory Usage: [Monitor Grafana]
- Disk I/O: [Monitor Grafana]
- Network I/O: [Monitor Grafana]

### Database Performance
- Connection Pool Usage: [Monitor Grafana]
- Query Performance: [Monitor Grafana]
- Lock Contention: [Monitor Grafana]

### Cache Performance
- Redis Hit Rate: [Monitor Grafana]
- Memory Usage: [Monitor Grafana]

---

## Bottlenecks Identified

1. [Add identified bottlenecks here]
2. [Add identified bottlenecks here]
3. [Add identified bottlenecks here]

---

## Optimization Recommendations

1. **Database**: [Add recommendations]
2. **Caching**: [Add recommendations]
3. **WebSocket**: [Add recommendations]
4. **API**: [Add recommendations]
5. **Search**: [Add recommendations]

---

## Test Artifacts

- Raw test data: \`${REPORT_DIR}/raw/\`
- Test logs: \`${REPORT_DIR}/logs/\`
- Grafana dashboards: http://grafana.localhost/dashboards

---

## Conclusion

[Add overall conclusion based on test results]

**Overall Status**: ✅ PASSED / ❌ FAILED

---

*Generated by ɳChat Performance Test Suite*
*Report ID: ${TIMESTAMP}*
EOF

    print_info "Performance report generated: ${REPORT_DIR}/PERFORMANCE-REPORT.md"
}

cleanup() {
    print_header "Cleanup"
    print_info "Test artifacts saved to: ${REPORT_DIR}"
    print_info "View report: cat ${REPORT_DIR}/PERFORMANCE-REPORT.md"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_header "ɳChat Performance Test Suite"
    print_info "Starting performance test suite at $(date)"

    check_dependencies
    create_results_dir

    # Run all tests
    run_websocket_test
    run_message_throughput_test
    run_api_endpoints_test
    run_file_upload_test
    run_search_test

    # Generate report
    generate_summary_report
    cleanup

    print_header "Test Suite Complete"
    print_info "Total duration: $(( $(date +%s) - START_TIME )) seconds"
    print_info "Results: ${REPORT_DIR}"
}

# Record start time
START_TIME=$(date +%s)

# Run main function
main "$@"
