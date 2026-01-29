#!/usr/bin/env bash
#
# Build Tauri for all platforms
# Usage: ./scripts/build-tauri-all.sh [--platform <platform>] [--debug]
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
            echo "  --platform  Target platform (macos, windows, linux)"
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

# Check for Rust
if ! command -v cargo &> /dev/null; then
    log_error "Rust not found. Install from https://rustup.rs/"
    exit 1
fi

# Check for Tauri CLI
if ! command -v cargo-tauri &> /dev/null && ! pnpm tauri --version &> /dev/null; then
    log_info "Installing Tauri CLI..."
    pnpm add -D @tauri-apps/cli
fi

# Check for src-tauri
if [ ! -d "src-tauri" ]; then
    log_error "src-tauri directory not found. Initialize with 'pnpm tauri init'"
    exit 1
fi

log_info "Building Tauri application..."

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

# Build
BUILD_ARGS=""
if $DEBUG; then
    BUILD_ARGS="--debug"
fi

case "$PLATFORM" in
    macos)
        if [ "$CURRENT_PLATFORM" != "macos" ]; then
            log_error "macOS builds can only be done on macOS"
            exit 1
        fi

        log_info "Building for macOS (Universal)..."

        # Add targets for universal binary
        rustup target add aarch64-apple-darwin 2>/dev/null || true
        rustup target add x86_64-apple-darwin 2>/dev/null || true

        pnpm tauri build --target universal-apple-darwin $BUILD_ARGS

        log_success "macOS build completed!"
        log_info "Output: src-tauri/target/universal-apple-darwin/release/bundle/"
        ;;

    windows)
        if [ "$CURRENT_PLATFORM" != "windows" ]; then
            log_error "Windows builds can only be done on Windows"
            exit 1
        fi

        log_info "Building for Windows..."
        pnpm tauri build $BUILD_ARGS

        log_success "Windows build completed!"
        log_info "Output: src-tauri/target/release/bundle/"
        ;;

    linux)
        if [ "$CURRENT_PLATFORM" != "linux" ]; then
            log_error "Linux builds can only be done on Linux"
            exit 1
        fi

        log_info "Building for Linux..."
        pnpm tauri build $BUILD_ARGS

        log_success "Linux build completed!"
        log_info "Output: src-tauri/target/release/bundle/"
        ;;

    all)
        log_info "Building for current platform: $CURRENT_PLATFORM"
        "$0" --platform "$CURRENT_PLATFORM" ${DEBUG:+--debug}
        ;;

    *)
        log_error "Unknown platform: $PLATFORM"
        exit 1
        ;;
esac
