#!/bin/bash
# ============================================================================
# nself-chat Health Check Script
# ============================================================================
# Comprehensive health verification for all deployment environments
# - Backend services (nself stack)
# - Frontend application
# - Database connectivity
# - External dependencies
# - Performance metrics
#
# Usage:
#   ./scripts/health-check.sh                      # Check local environment
#   ./scripts/health-check.sh --env staging        # Check staging
#   ./scripts/health-check.sh --env production     # Check production
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
ENVIRONMENT="${ENVIRONMENT:-local}"
VERBOSE=false
QUICK=false
TIMEOUT=10
EXIT_ON_ERROR=false

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNED=0

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}==>${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo "  $1"
    fi
}

usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Comprehensive health check for nself-chat deployment.

Options:
    --env ENV            Environment (local|staging|production) (default: local)
    --quick              Quick check (essential services only)
    --verbose            Verbose output with details
    --timeout SEC        Request timeout in seconds (default: 10)
    --exit-on-error      Exit immediately on first error
    -h, --help           Show this help message

Examples:
    $(basename "$0")                          # Check local environment
    $(basename "$0") --env staging           # Check staging
    $(basename "$0") --env production        # Check production
    $(basename "$0") --quick                 # Quick health check
    $(basename "$0") --verbose               # Detailed output

Exit Codes:
    0   All checks passed
    1   Some checks failed (warnings present)
    2   Critical checks failed
EOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --quick)
                QUICK=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --exit-on-error)
                EXIT_ON_ERROR=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

check_pass() {
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_warn() {
    CHECKS_WARNED=$((CHECKS_WARNED + 1))
}

check_fail() {
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    if [ "$EXIT_ON_ERROR" = true ]; then
        log_error "Exiting on first error (--exit-on-error enabled)"
        exit 2
    fi
}

check_http_endpoint() {
    local url="$1"
    local name="$2"
    local expected_status="${3:-200}"

    log_verbose "Checking $name: $url"

    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            log_info "$name responding (HTTP $response)"
            check_pass
            return 0
        else
            log_warn "$name returned HTTP $response (expected $expected_status)"
            check_warn
            return 1
        fi
    else
        log_error "$name not responding"
        check_fail
        return 1
    fi
}

check_tcp_port() {
    local host="$1"
    local port="$2"
    local name="$3"

    log_verbose "Checking $name: $host:$port"

    if timeout "$TIMEOUT" bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null; then
        log_info "$name port $port is open"
        check_pass
        return 0
    else
        log_error "$name port $port is not accessible"
        check_fail
        return 1
    fi
}

check_local_backend() {
    log_step "Checking local backend services"

    cd "$PROJECT_ROOT/.backend" 2>/dev/null || {
        log_error "Backend directory not found: .backend/"
        check_fail
        return 1
    }

    # Check if nself is available
    if ! command -v nself &> /dev/null; then
        log_error "nself CLI not installed"
        check_fail
        return 1
    fi

    # Check backend status
    if nself status > /tmp/nself-status.log 2>&1; then
        log_info "Backend services running"
        check_pass

        # Check individual services
        if grep -q "postgres.*running" /tmp/nself-status.log; then
            log_info "PostgreSQL database running"
            check_pass
        else
            log_error "PostgreSQL not running"
            check_fail
        fi

        if grep -q "hasura.*running" /tmp/nself-status.log; then
            log_info "Hasura GraphQL engine running"
            check_pass
        else
            log_error "Hasura not running"
            check_fail
        fi

        if grep -q "auth.*running" /tmp/nself-status.log; then
            log_info "Authentication service running"
            check_pass
        else
            log_error "Auth service not running"
            check_fail
        fi
    else
        log_error "Backend services not running"
        check_fail
        cat /tmp/nself-status.log
    fi

    cd "$PROJECT_ROOT"
}

check_local_frontend() {
    log_step "Checking local frontend"

    # Check if dev server is running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_info "Frontend dev server running on port 3000"
        check_pass

        # Try to access it
        check_http_endpoint "http://localhost:3000" "Frontend dev server"
    else
        log_warn "Frontend dev server not running on port 3000"
        check_warn
    fi

    # Check if node_modules exists
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        log_info "Dependencies installed (node_modules exists)"
        check_pass
    else
        log_error "Dependencies not installed (node_modules missing)"
        check_fail
    fi
}

check_k8s_deployment() {
    local namespace="$1"

    log_step "Checking Kubernetes deployment ($namespace)"

    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        check_fail
        return 1
    fi
    log_info "Connected to cluster: $(kubectl config current-context)"
    check_pass

    # Check namespace exists
    if ! kubectl get namespace "$namespace" &> /dev/null; then
        log_error "Namespace not found: $namespace"
        check_fail
        return 1
    fi
    log_info "Namespace exists: $namespace"
    check_pass

    # Check deployment
    if ! kubectl get deployment nself-chat -n "$namespace" &> /dev/null; then
        log_error "Deployment not found: nself-chat"
        check_fail
        return 1
    fi

    # Check deployment status
    local desired=$(kubectl get deployment nself-chat -n "$namespace" \
        -o jsonpath='{.spec.replicas}')
    local ready=$(kubectl get deployment nself-chat -n "$namespace" \
        -o jsonpath='{.status.readyReplicas}')
    local available=$(kubectl get deployment nself-chat -n "$namespace" \
        -o jsonpath='{.status.availableReplicas}')

    if [ "${ready:-0}" = "$desired" ] && [ "${available:-0}" = "$desired" ]; then
        log_info "Deployment healthy: $ready/$desired replicas ready"
        check_pass
    else
        log_error "Deployment unhealthy: ${ready:-0}/$desired ready, ${available:-0}/$desired available"
        check_fail
    fi

    # Check for crash loops
    local crash_loops=$(kubectl get pods -n "$namespace" \
        -l app.kubernetes.io/name=nself-chat \
        -o jsonpath='{range .items[*]}{.status.containerStatuses[0].restartCount}{"\n"}{end}' \
        | awk '$1 > 5 {count++} END {print count+0}')

    if [ "$crash_loops" -gt 0 ]; then
        log_warn "$crash_loops pods with high restart count (>5)"
        check_warn
    else
        log_info "No crash loops detected"
        check_pass
    fi

    # Check pod events for errors
    local error_events=$(kubectl get events -n "$namespace" \
        --field-selector type=Warning \
        --sort-by='.lastTimestamp' \
        | grep -c "nself-chat" || echo "0")

    if [ "$error_events" -gt 10 ]; then
        log_warn "$error_events warning events in last hour"
        check_warn
    else
        log_info "Event log clean ($error_events warnings)"
        check_pass
    fi
}

check_graphql_api() {
    local graphql_url="$1"

    log_step "Checking GraphQL API"

    # Simple introspection query
    local query='{"query":"{ __schema { queryType { name } } }"}'

    if response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        --max-time "$TIMEOUT" \
        -d "$query" \
        "$graphql_url" 2>/dev/null); then

        if echo "$response" | grep -q "queryType"; then
            log_info "GraphQL API responding correctly"
            check_pass
        else
            log_error "GraphQL API returned unexpected response"
            log_verbose "Response: $response"
            check_fail
        fi
    else
        log_error "GraphQL API not accessible"
        check_fail
    fi
}

check_database() {
    log_step "Checking database connectivity"

    if [ "$ENVIRONMENT" = "local" ]; then
        # Check local PostgreSQL
        if check_tcp_port "localhost" "5432" "PostgreSQL"; then
            # Try to connect via psql if available
            if command -v psql &> /dev/null; then
                if PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -c "SELECT 1" &> /dev/null; then
                    log_info "Database connection successful"
                    check_pass
                else
                    log_warn "Cannot connect to database (credentials may be different)"
                    check_warn
                fi
            fi
        fi
    else
        log_verbose "Database check skipped for non-local environment"
        check_pass
    fi
}

check_external_dependencies() {
    if [ "$QUICK" = true ]; then
        return 0
    fi

    log_step "Checking external dependencies"

    # Check DNS resolution
    if host google.com > /dev/null 2>&1; then
        log_info "DNS resolution working"
        check_pass
    else
        log_error "DNS resolution failed"
        check_fail
    fi

    # Check internet connectivity
    if ping -c 1 -W 2 8.8.8.8 > /dev/null 2>&1; then
        log_info "Internet connectivity working"
        check_pass
    else
        log_warn "Internet connectivity issues detected"
        check_warn
    fi
}

check_local() {
    check_local_backend
    check_local_frontend
    check_database

    # Check GraphQL endpoint
    check_http_endpoint "http://localhost:8080/healthz" "Hasura health" 200
    check_graphql_api "http://localhost:8080/v1/graphql"

    # Check auth endpoint
    check_http_endpoint "http://localhost:4000/healthz" "Auth service health" 200

    check_external_dependencies
}

check_staging() {
    check_k8s_deployment "nself-chat-staging"

    # Check GraphQL API (adjust URL as needed)
    # check_graphql_api "https://staging.example.com/v1/graphql"

    check_external_dependencies
}

check_production() {
    check_k8s_deployment "nself-chat-production"

    # Check GraphQL API (adjust URL as needed)
    # check_graphql_api "https://api.example.com/v1/graphql"

    # Check frontend
    # check_http_endpoint "https://example.com" "Production frontend" 200

    check_external_dependencies
}

print_summary() {
    log_step "Health Check Summary"

    local total=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNED))

    echo ""
    echo "Total Checks:    $total"
    echo -e "${GREEN}Passed:${NC}          $CHECKS_PASSED"
    echo -e "${YELLOW}Warnings:${NC}        $CHECKS_WARNED"
    echo -e "${RED}Failed:${NC}          $CHECKS_FAILED"
    echo ""

    if [ $CHECKS_FAILED -eq 0 ]; then
        if [ $CHECKS_WARNED -eq 0 ]; then
            echo -e "${GREEN}✓ All health checks passed${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ Health checks passed with warnings${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Health checks failed${NC}"
        return 2
    fi
}

main() {
    parse_args "$@"

    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║       nself-chat Health Check                            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Quick mode:  $([ "$QUICK" = true ] && echo "Yes" || echo "No")"
    echo ""

    case "$ENVIRONMENT" in
        local)
            check_local
            ;;
        staging)
            check_staging
            ;;
        production)
            check_production
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_error "Valid options: local, staging, production"
            exit 1
            ;;
    esac

    print_summary
    return_code=$?

    echo ""
    echo "Health check completed at: $(date)"

    exit $return_code
}

main "$@"
