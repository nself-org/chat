#!/usr/bin/env bash
#
# Build nself-chat web application
# Usage: ./scripts/build-web.sh [--analyze] [--dev]
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

ANALYZE=false
DEV_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --analyze)
            ANALYZE=true
            shift
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--analyze] [--dev]"
            echo ""
            echo "Options:"
            echo "  --analyze  Generate bundle analysis report"
            echo "  --dev      Build in development mode"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

log_info "Building nself-chat web application..."

# Set environment variables
export NODE_ENV="${DEV_MODE:+development}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_PUBLIC_USE_DEV_AUTH="${DEV_MODE:+true}"
export NEXT_PUBLIC_USE_DEV_AUTH="${NEXT_PUBLIC_USE_DEV_AUTH:-false}"

if $ANALYZE; then
    export ANALYZE=true
    log_info "Bundle analysis enabled"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Clean previous build
log_info "Cleaning previous build..."
rm -rf .next

# Run type check
log_info "Running type check..."
pnpm type-check || {
    log_error "Type check failed"
    exit 1
}

# Run linting
log_info "Running linter..."
pnpm lint || {
    log_error "Linting failed"
    exit 1
}

# Build
log_info "Building..."
if $ANALYZE; then
    pnpm build:analyze
else
    pnpm build
fi

log_success "Web build completed successfully!"
echo ""
echo "Output: .next/"
echo "Start with: pnpm start"

# Print bundle size
if [ -f ".next/BUILD_ID" ]; then
    log_info "Build ID: $(cat .next/BUILD_ID)"
fi

# Calculate build size
if command -v du &> /dev/null; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    log_info "Build size: $BUILD_SIZE"
fi
