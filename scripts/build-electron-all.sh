#!/usr/bin/env bash
#
# Build Electron for all platforms
# Usage: ./scripts/build-electron-all.sh [--platform <platform>] [--debug]
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

PLATFORM=""
DEBUG=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--platform <platform>] [--debug]"
            echo ""
            echo "Options:"
            echo "  --platform  Target platform (macos, windows, linux, all)"
            echo "  --debug     Build debug version"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

# Check for electron-builder
if ! pnpm electron-builder --version &> /dev/null 2>&1; then
    log_info "Installing electron-builder..."
    pnpm add -D electron electron-builder
fi

# Check for electron configuration
if [ ! -f "electron/main.js" ] && [ ! -f "electron/main.ts" ] && [ ! -f "electron.config.js" ]; then
    log_error "Electron configuration not found."
    log_error "Create electron/main.js or electron/main.ts to get started."
    exit 1
fi

log_info "Building Electron application..."

# Detect current platform
CURRENT_OS="$(uname -s)"
case "$CURRENT_OS" in
    Darwin*)
        CURRENT_PLATFORM="macos"
        ;;
    Linux*)
        CURRENT_PLATFORM="linux"
        ;;
    MINGW*|CYGWIN*|MSYS*)
        CURRENT_PLATFORM="windows"
        ;;
    *)
        log_error "Unknown platform: $CURRENT_OS"
        exit 1
        ;;
esac

# If no platform specified, build for current platform
if [ -z "$PLATFORM" ]; then
    PLATFORM="$CURRENT_PLATFORM"
fi

# Build web first
log_info "Building web assets..."
pnpm build || {
    log_error "Web build failed"
    exit 1
}

# Build Electron
case "$PLATFORM" in
    macos)
        log_info "Building for macOS..."

        BUILD_ARGS="--mac --universal"
        if $DEBUG; then
            BUILD_ARGS="$BUILD_ARGS --dir"
        fi

        pnpm electron:build $BUILD_ARGS

        log_success "macOS build completed!"
        log_info "Output: dist-electron/"
        ;;

    windows)
        log_info "Building for Windows..."

        BUILD_ARGS="--win --x64"
        if $DEBUG; then
            BUILD_ARGS="$BUILD_ARGS --dir"
        fi

        pnpm electron:build $BUILD_ARGS

        log_success "Windows build completed!"
        log_info "Output: dist-electron/"
        ;;

    linux)
        log_info "Building for Linux..."

        BUILD_ARGS="--linux --x64"
        if $DEBUG; then
            BUILD_ARGS="$BUILD_ARGS --dir"
        fi

        pnpm electron:build $BUILD_ARGS

        log_success "Linux build completed!"
        log_info "Output: dist-electron/"
        ;;

    all)
        log_info "Building for all platforms from $CURRENT_PLATFORM..."

        case "$CURRENT_PLATFORM" in
            macos)
                # macOS can build for all platforms
                pnpm electron:build --mac --universal
                pnpm electron:build --win --x64
                pnpm electron:build --linux --x64
                ;;
            *)
                # Other platforms can only build for themselves
                log_warn "Cross-platform builds are best done from macOS"
                "$0" --platform "$CURRENT_PLATFORM" ${DEBUG:+--debug}
                ;;
        esac

        log_success "All builds completed!"
        log_info "Output: dist-electron/"
        ;;

    *)
        log_error "Unknown platform: $PLATFORM"
        exit 1
        ;;
esac
