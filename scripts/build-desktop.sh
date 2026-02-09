#!/usr/bin/env bash
#
# Unified Desktop Build Script
# Builds both Electron and Tauri packages for all platforms
#
# Usage: ./scripts/build-desktop.sh [OPTIONS]
#
# Options:
#   --runtime <electron|tauri|all>  Build runtime (default: all)
#   --platform <macos|windows|linux|all>  Target platform (default: current)
#   --sign                           Enable code signing (requires credentials)
#   --notarize                       Enable notarization (macOS only, requires credentials)
#   --release                        Build release artifacts (vs debug)
#   --clean                          Clean build directories first
#   --help                           Show this help message
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Default options
RUNTIME="all"
PLATFORM=""
SIGN=false
NOTARIZE=false
RELEASE=true
CLEAN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --runtime)
      RUNTIME="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --sign)
      SIGN=true
      shift
      ;;
    --notarize)
      NOTARIZE=true
      shift
      ;;
    --release)
      RELEASE=true
      shift
      ;;
    --debug)
      RELEASE=false
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    --help|-h)
      cat << 'HELP'
Unified Desktop Build Script
Builds both Electron and Tauri packages for all platforms

Usage: ./scripts/build-desktop.sh [OPTIONS]

Options:
  --runtime <electron|tauri|all>  Build runtime (default: all)
  --platform <macos|windows|linux|all>  Target platform (default: current)
  --sign                           Enable code signing (requires credentials)
  --notarize                       Enable notarization (macOS only, requires credentials)
  --release                        Build release artifacts (vs debug)
  --debug                          Build debug artifacts
  --clean                          Clean build directories first
  --help                           Show this help message

Examples:
  ./scripts/build-desktop.sh
  ./scripts/build-desktop.sh --runtime electron --platform macos
  ./scripts/build-desktop.sh --runtime all --sign --notarize --clean
HELP
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

# Detect platform
CURRENT_OS="$(uname -s)"
case "$CURRENT_OS" in
  Darwin*) CURRENT_PLATFORM="macos" ;;
  Linux*) CURRENT_PLATFORM="linux" ;;
  MINGW*|CYGWIN*|MSYS*) CURRENT_PLATFORM="windows" ;;
  *)
    log_error "Unknown platform: $CURRENT_OS"
    exit 1
    ;;
esac

if [ -z "$PLATFORM" ]; then
  PLATFORM="$CURRENT_PLATFORM"
fi

log_info "Build Configuration:"
log_info "  Runtime: $RUNTIME"
log_info "  Platform: $PLATFORM"
log_info "  Release: $RELEASE"
log_info "  Sign: $SIGN"
log_info "  Notarize: $NOTARIZE"
log_info "  Clean: $CLEAN"
echo ""

# Clean build directories
if [ "$CLEAN" = true ]; then
  log_step "Cleaning build directories..."
  rm -rf dist-electron dist-tauri
  rm -rf platforms/electron/dist
  rm -rf platforms/tauri/target
  log_success "Clean complete"
fi

# Build web assets
log_step "Building web assets..."
pnpm build || {
  log_error "Web build failed"
  exit 1
}
log_success "Web build complete"

# Function to build Electron
build_electron() {
  local platform=$1
  
  log_step "Building Electron for $platform..."
  
  cd "$PROJECT_ROOT/platforms/electron"
  
  # Compile TypeScript
  pnpm build:all || {
    log_error "Electron TypeScript compilation failed"
    exit 1
  }
  
  # Set environment variables for signing
  if [ "$SIGN" = true ]; then
    export CSC_LINK="${CSC_LINK:-}"
    export CSC_KEY_PASSWORD="${CSC_KEY_PASSWORD:-}"
    
    if [ "$platform" = "macos" ] && [ "$NOTARIZE" = true ]; then
      export APPLE_ID="${APPLE_ID:-}"
      export APPLE_PASSWORD="${APPLE_PASSWORD:-}"
      export APPLE_TEAM_ID="${APPLE_TEAM_ID:-}"
    fi
  else
    export CSC_IDENTITY_AUTO_DISCOVERY=false
  fi
  
  # Build for platform
  case "$platform" in
    macos)
      if [ "$RELEASE" = true ]; then
        pnpm dist:mac
      else
        pnpm pack
      fi
      ;;
    windows)
      if [ "$RELEASE" = true ]; then
        pnpm dist:win
      else
        pnpm pack
      fi
      ;;
    linux)
      if [ "$RELEASE" = true ]; then
        pnpm dist:linux
      else
        pnpm pack
      fi
      ;;
    all)
      if [ "$RELEASE" = true ]; then
        pnpm dist:all
      else
        log_warn "Debug builds only supported for single platform"
        pnpm pack
      fi
      ;;
    *)
      log_error "Unknown platform: $platform"
      exit 1
      ;;
  esac
  
  cd "$PROJECT_ROOT"
  log_success "Electron build complete for $platform"
}

# Function to build Tauri
build_tauri() {
  local platform=$1
  
  log_step "Building Tauri for $platform..."
  
  cd "$PROJECT_ROOT"
  
  # Set environment variables for signing
  if [ "$SIGN" = true ]; then
    export TAURI_SIGNING_PRIVATE_KEY="${TAURI_SIGNING_PRIVATE_KEY:-}"
    export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}"
    
    if [ "$platform" = "macos" ]; then
      export APPLE_CERTIFICATE="${APPLE_CERTIFICATE:-}"
      export APPLE_CERTIFICATE_PASSWORD="${APPLE_CERTIFICATE_PASSWORD:-}"
      export APPLE_SIGNING_IDENTITY="${APPLE_SIGNING_IDENTITY:-}"
      
      if [ "$NOTARIZE" = true ]; then
        export APPLE_ID="${APPLE_ID:-}"
        export APPLE_PASSWORD="${APPLE_PASSWORD:-}"
        export APPLE_TEAM_ID="${APPLE_TEAM_ID:-}"
      fi
    fi
  fi
  
  # Build for platform
  case "$platform" in
    macos)
      if [ "$RELEASE" = true ]; then
        pnpm tauri build --target universal-apple-darwin
      else
        pnpm tauri build --debug --target universal-apple-darwin
      fi
      ;;
    windows)
      if [ "$RELEASE" = true ]; then
        pnpm tauri build
      else
        pnpm tauri build --debug
      fi
      ;;
    linux)
      if [ "$RELEASE" = true ]; then
        pnpm tauri build
      else
        pnpm tauri build --debug
      fi
      ;;
    all)
      log_warn "Cross-platform Tauri builds require platform-specific runners"
      build_tauri "$CURRENT_PLATFORM"
      ;;
    *)
      log_error "Unknown platform: $platform"
      exit 1
      ;;
  esac
  
  log_success "Tauri build complete for $platform"
}

# Execute builds
case "$RUNTIME" in
  electron)
    build_electron "$PLATFORM"
    ;;
  tauri)
    build_tauri "$PLATFORM"
    ;;
  all)
    build_electron "$PLATFORM"
    build_tauri "$PLATFORM"
    ;;
  *)
    log_error "Unknown runtime: $RUNTIME"
    exit 1
    ;;
esac

# Report artifacts
log_info ""
log_info "Build artifacts:"
if [ "$RUNTIME" = "electron" ] || [ "$RUNTIME" = "all" ]; then
  if [ -d "$PROJECT_ROOT/dist-electron" ]; then
    find "$PROJECT_ROOT/dist-electron" -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec ls -lh {} \;
  fi
fi

if [ "$RUNTIME" = "tauri" ] || [ "$RUNTIME" = "all" ]; then
  if [ -d "$PROJECT_ROOT/platforms/tauri/target" ]; then
    find "$PROJECT_ROOT/platforms/tauri/target" -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.msi" \) -exec ls -lh {} \;
  fi
fi

log_success "Desktop build complete!"
