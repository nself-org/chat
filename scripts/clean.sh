#!/usr/bin/env bash
#
# Clean all build artifacts
# Usage: ./scripts/clean.sh [--all] [--deps]
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

CLEAN_DEPS=false
CLEAN_ALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CLEAN_ALL=true
            CLEAN_DEPS=true
            shift
            ;;
        --deps)
            CLEAN_DEPS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--all] [--deps]"
            echo ""
            echo "Options:"
            echo "  --all   Clean everything including node_modules"
            echo "  --deps  Clean node_modules only"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

log_info "Cleaning build artifacts..."

# Next.js build output
if [ -d ".next" ]; then
    log_info "Removing .next/"
    rm -rf .next
fi

# Turbo cache
if [ -d ".turbo" ]; then
    log_info "Removing .turbo/"
    rm -rf .turbo
fi

# TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    log_info "Removing tsconfig.tsbuildinfo"
    rm -f tsconfig.tsbuildinfo
fi

# Test coverage
if [ -d "coverage" ]; then
    log_info "Removing coverage/"
    rm -rf coverage
fi

# Playwright
if [ -d "playwright-report" ]; then
    log_info "Removing playwright-report/"
    rm -rf playwright-report
fi
if [ -d "test-results" ]; then
    log_info "Removing test-results/"
    rm -rf test-results
fi

# Electron
if [ -d "dist-electron" ]; then
    log_info "Removing dist-electron/"
    rm -rf dist-electron
fi

# Tauri
if [ -d "src-tauri/target" ]; then
    log_info "Removing src-tauri/target/"
    rm -rf src-tauri/target
fi

# Capacitor
if [ -d "ios/App/build" ]; then
    log_info "Removing ios/App/build/"
    rm -rf ios/App/build
fi
if [ -d "android/app/build" ]; then
    log_info "Removing android/app/build/"
    rm -rf android/app/build
fi

# React Native
if [ -d "mobile/ios/build" ]; then
    log_info "Removing mobile/ios/build/"
    rm -rf mobile/ios/build
fi
if [ -d "mobile/android/app/build" ]; then
    log_info "Removing mobile/android/app/build/"
    rm -rf mobile/android/app/build
fi

# Docker
if docker images | grep -q "nself-chat"; then
    log_info "Removing Docker images..."
    docker rmi nself-chat:latest 2>/dev/null || true
fi

# Clean dependencies
if $CLEAN_DEPS; then
    log_warn "Removing node_modules..."
    rm -rf node_modules
    rm -rf .pnpm-store

    # Mobile dependencies
    if [ -d "mobile/node_modules" ]; then
        rm -rf mobile/node_modules
    fi

    # iOS Pods
    if [ -d "ios/App/Pods" ]; then
        log_info "Removing ios/App/Pods/"
        rm -rf ios/App/Pods
    fi
    if [ -d "mobile/ios/Pods" ]; then
        log_info "Removing mobile/ios/Pods/"
        rm -rf mobile/ios/Pods
    fi
fi

log_success "Clean completed!"

if $CLEAN_DEPS; then
    echo ""
    log_info "Run 'pnpm install' to reinstall dependencies"
fi
