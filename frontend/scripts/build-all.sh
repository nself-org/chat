#!/usr/bin/env bash
#
# Build all nself-chat targets
# Usage: ./scripts/build-all.sh [--web] [--desktop] [--mobile] [--docker]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Default: build all
BUILD_WEB=false
BUILD_DESKTOP=false
BUILD_MOBILE=false
BUILD_DOCKER=false
BUILD_ALL=true

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --web)
            BUILD_WEB=true
            BUILD_ALL=false
            shift
            ;;
        --desktop)
            BUILD_DESKTOP=true
            BUILD_ALL=false
            shift
            ;;
        --mobile)
            BUILD_MOBILE=true
            BUILD_ALL=false
            shift
            ;;
        --docker)
            BUILD_DOCKER=true
            BUILD_ALL=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--web] [--desktop] [--mobile] [--docker]"
            echo ""
            echo "Options:"
            echo "  --web      Build web application"
            echo "  --desktop  Build desktop applications (Tauri + Electron)"
            echo "  --mobile   Build mobile applications (Capacitor + React Native)"
            echo "  --docker   Build Docker image"
            echo ""
            echo "If no options specified, builds everything."
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

if $BUILD_ALL; then
    BUILD_WEB=true
    BUILD_DESKTOP=true
    BUILD_MOBILE=true
    BUILD_DOCKER=true
fi

cd "$PROJECT_ROOT"

log_info "Starting nself-chat build process..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install
fi

# Build web
if $BUILD_WEB; then
    log_info "Building web application..."
    "$SCRIPT_DIR/build-web.sh" || {
        log_error "Web build failed"
        exit 1
    }
    log_success "Web build completed"
    echo ""
fi

# Build desktop
if $BUILD_DESKTOP; then
    log_info "Building desktop applications..."
    "$SCRIPT_DIR/build-desktop.sh" || {
        log_warn "Desktop build failed or partially completed"
    }
    echo ""
fi

# Build mobile
if $BUILD_MOBILE; then
    log_info "Building mobile applications..."
    "$SCRIPT_DIR/build-mobile.sh" || {
        log_warn "Mobile build failed or partially completed"
    }
    echo ""
fi

# Build Docker
if $BUILD_DOCKER; then
    log_info "Building Docker image..."
    if command -v docker &> /dev/null; then
        docker build -t nself-chat:latest . || {
            log_error "Docker build failed"
            exit 1
        }
        log_success "Docker build completed"
    else
        log_warn "Docker not found, skipping Docker build"
    fi
    echo ""
fi

log_success "All builds completed!"
echo ""
echo "Build outputs:"
echo "  - Web: .next/"
echo "  - Tauri: platforms/tauri/target/release/bundle/"
echo "  - Electron: dist-electron/"
echo "  - Capacitor: ios/App/build/, android/app/build/"
echo "  - Docker: nself-chat:latest"
