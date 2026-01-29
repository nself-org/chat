#!/usr/bin/env bash
#
# Run TypeScript type checking
# Usage: ./scripts/type-check.sh [--watch]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--watch]"
            echo ""
            echo "Options:"
            echo "  --watch  Run in watch mode"
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

log_info "Running TypeScript type check..."

if $WATCH; then
    pnpm tsc --noEmit --watch
else
    pnpm type-check && log_success "No type errors found!" || {
        log_error "Type errors found"
        exit 1
    }
fi
