#!/usr/bin/env bash
#
# Build nself-chat desktop applications
# Usage: ./scripts/build-desktop.sh [--tauri] [--electron] [--platform <platform>]
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

BUILD_TAURI=false
BUILD_ELECTRON=false
PLATFORM=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --tauri)
            BUILD_TAURI=true
            shift
            ;;
        --electron)
            BUILD_ELECTRON=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--tauri] [--electron] [--platform <platform>]"
            echo ""
            echo "Options:"
            echo "  --tauri     Build Tauri application"
            echo "  --electron  Build Electron application"
            echo "  --platform  Target platform (macos, windows, linux)"
            echo ""
            echo "If no framework specified, builds both."
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default: build both
if ! $BUILD_TAURI && ! $BUILD_ELECTRON; then
    BUILD_TAURI=true
    BUILD_ELECTRON=true
fi

cd "$PROJECT_ROOT"

# Install dependencies
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Build Tauri
if $BUILD_TAURI; then
    log_info "Building Tauri desktop application..."

    # Check for Rust
    if ! command -v cargo &> /dev/null; then
        log_warn "Rust not found. Install from https://rustup.rs/"
        log_warn "Skipping Tauri build"
    else
        # Check for src-tauri directory
        if [ ! -d "src-tauri" ]; then
            log_warn "src-tauri directory not found. Run 'pnpm tauri init' first."
            log_warn "Skipping Tauri build"
        else
            "$SCRIPT_DIR/build-tauri-all.sh" ${PLATFORM:+--platform "$PLATFORM"} || {
                log_error "Tauri build failed"
            }
        fi
    fi
    echo ""
fi

# Build Electron
if $BUILD_ELECTRON; then
    log_info "Building Electron desktop application..."

    # Check for electron directory
    if [ ! -f "electron/main.js" ] && [ ! -f "electron/main.ts" ] && [ ! -f "electron.config.js" ]; then
        log_warn "Electron configuration not found. Run 'pnpm electron init' first."
        log_warn "Skipping Electron build"
    else
        "$SCRIPT_DIR/build-electron-all.sh" ${PLATFORM:+--platform "$PLATFORM"} || {
            log_error "Electron build failed"
        }
    fi
    echo ""
fi

log_success "Desktop build process completed!"
