#!/usr/bin/env bash
#
# Run all linters
# Usage: ./scripts/lint-all.sh [--fix] [--format]
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

FIX=false
FORMAT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX=true
            shift
            ;;
        --format)
            FORMAT=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--fix] [--format]"
            echo ""
            echo "Options:"
            echo "  --fix     Auto-fix linting issues"
            echo "  --format  Run Prettier formatting (or check if --fix not specified)"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
fi

EXIT_CODE=0

# Run ESLint
log_info "Running ESLint..."
if $FIX; then
    pnpm lint:fix || {
        log_error "ESLint found errors that could not be auto-fixed"
        EXIT_CODE=1
    }
else
    pnpm lint || {
        log_error "ESLint found errors"
        EXIT_CODE=1
    }
fi
echo ""

# Run Prettier
if $FORMAT || $FIX; then
    log_info "Running Prettier..."
    if $FIX; then
        pnpm format || {
            log_error "Prettier failed"
            EXIT_CODE=1
        }
    else
        pnpm format:check || {
            log_error "Prettier found formatting issues"
            EXIT_CODE=1
        }
    fi
    echo ""
fi

# Run TypeScript check
log_info "Running TypeScript check..."
pnpm type-check || {
    log_error "TypeScript found errors"
    EXIT_CODE=1
}
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    log_success "All checks passed!"
else
    log_error "Some checks failed"
fi

exit $EXIT_CODE
