#!/usr/bin/env bash
#
# Run all tests
# Usage: ./scripts/test-all.sh [--unit] [--e2e] [--coverage] [--watch]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

RUN_UNIT=false
RUN_E2E=false
COVERAGE=false
WATCH=false
RUN_ALL=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit)
            RUN_UNIT=true
            RUN_ALL=false
            shift
            ;;
        --e2e)
            RUN_E2E=true
            RUN_ALL=false
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--unit] [--e2e] [--coverage] [--watch]"
            echo ""
            echo "Options:"
            echo "  --unit      Run unit tests only"
            echo "  --e2e       Run E2E tests only"
            echo "  --coverage  Generate coverage report"
            echo "  --watch     Run in watch mode (unit tests only)"
            echo ""
            echo "If no test type specified, runs all tests."
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

if $RUN_ALL; then
    RUN_UNIT=true
    RUN_E2E=true
fi

cd "$PROJECT_ROOT"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
fi

EXIT_CODE=0

# Run unit tests
if $RUN_UNIT; then
    log_info "Running unit tests..."

    JEST_ARGS=""
    if $COVERAGE; then
        JEST_ARGS="$JEST_ARGS --coverage"
    fi
    if $WATCH; then
        JEST_ARGS="$JEST_ARGS --watch"
    fi
    JEST_ARGS="$JEST_ARGS --ci"

    pnpm test $JEST_ARGS || {
        log_error "Unit tests failed"
        EXIT_CODE=1
    }

    if $COVERAGE && [ -d "coverage" ]; then
        log_info "Coverage report: coverage/lcov-report/index.html"
    fi
    echo ""
fi

# Run E2E tests
if $RUN_E2E && ! $WATCH; then
    log_info "Running E2E tests..."

    # Install Playwright browsers if needed
    if ! pnpm exec playwright --version &> /dev/null 2>&1; then
        log_info "Installing Playwright browsers..."
        pnpm exec playwright install --with-deps chromium
    fi

    pnpm test:e2e || {
        log_error "E2E tests failed"
        EXIT_CODE=1
    }

    if [ -d "playwright-report" ]; then
        log_info "E2E report: playwright-report/index.html"
    fi
    echo ""
fi

if [ $EXIT_CODE -eq 0 ]; then
    log_success "All tests passed!"
else
    log_error "Some tests failed"
fi

exit $EXIT_CODE
