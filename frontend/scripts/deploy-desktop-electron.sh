#!/bin/bash
# Electron Desktop Deployment Script
# Builds, signs, and deploys Electron desktop applications for macOS, Windows, and Linux
#
# Usage:
#   ./deploy-desktop-electron.sh [options]
#
# Options:
#   --platform <mac|win|linux|all>  Platform to build (default: all)
#   --env <dev|staging|prod>        Environment (default: prod)
#   --no-sign                       Skip code signing
#   --no-publish                    Skip publishing to GitHub releases
#   --draft                         Create draft release
#   --prerelease                    Mark as pre-release
#   --clean                         Clean build directories before build
#   --version <version>             Override version number
#   --help                          Show this help message

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM="all"
ENVIRONMENT="prod"
SIGN=true
PUBLISH=true
DRAFT=false
PRERELEASE=false
CLEAN=false
VERSION=""

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ELECTRON_DIR="${PROJECT_ROOT}/platforms/electron"
DIST_DIR="${PROJECT_ROOT}/dist-electron"
WEB_OUT_DIR="${PROJECT_ROOT}/out"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --no-sign)
      SIGN=false
      shift
      ;;
    --no-publish)
      PUBLISH=false
      shift
      ;;
    --draft)
      DRAFT=true
      shift
      ;;
    --prerelease)
      PRERELEASE=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    --help)
      grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Validate environment
check_dependencies() {
  print_header "Checking Dependencies"

  local missing_deps=()

  if ! command -v node &> /dev/null; then
    missing_deps+=("node")
  fi

  if ! command -v npm &> /dev/null; then
    missing_deps+=("npm")
  fi

  if ! command -v git &> /dev/null; then
    missing_deps+=("git")
  fi

  if [ "$SIGN" = true ]; then
    if [ "$PLATFORM" = "mac" ] || [ "$PLATFORM" = "all" ]; then
      if [[ "$OSTYPE" == "darwin"* ]] && ! command -v codesign &> /dev/null; then
        log_warning "codesign not found - macOS code signing will be skipped"
      fi
    fi

    if [ "$PLATFORM" = "win" ] || [ "$PLATFORM" = "all" ]; then
      if [ -z "$WIN_CSC_LINK" ] && [ -z "$WIN_CSC_KEY_PASSWORD" ]; then
        log_warning "Windows code signing credentials not found"
      fi
    fi
  fi

  if [ ${#missing_deps[@]} -ne 0 ]; then
    log_error "Missing required dependencies: ${missing_deps[*]}"
    exit 1
  fi

  log_success "All required dependencies are installed"
}

# Load environment variables
load_environment() {
  print_header "Loading Environment: $ENVIRONMENT"

  local env_file="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
  if [ -f "$env_file" ]; then
    log_info "Loading environment from $env_file"
    set -a
    source "$env_file"
    set +a
    log_success "Environment loaded"
  else
    log_warning "Environment file not found: $env_file"
  fi

  # Set required environment variables
  export NODE_ENV="${ENVIRONMENT}"
  export NEXT_PUBLIC_ENV="${ENVIRONMENT}"

  if [ -n "$VERSION" ]; then
    export npm_package_version="$VERSION"
    log_info "Version override: $VERSION"
  fi
}

# Clean build directories
clean_build() {
  if [ "$CLEAN" = true ]; then
    print_header "Cleaning Build Directories"

    log_info "Removing dist directories..."
    rm -rf "$DIST_DIR"
    rm -rf "$WEB_OUT_DIR"
    rm -rf "${ELECTRON_DIR}/main"
    rm -rf "${ELECTRON_DIR}/preload"

    log_success "Build directories cleaned"
  fi
}

# Build Next.js frontend
build_frontend() {
  print_header "Building Next.js Frontend"

  cd "$PROJECT_ROOT"

  log_info "Installing dependencies..."
  npm install --legacy-peer-deps

  log_info "Building Next.js application..."
  npm run build

  log_success "Frontend build complete"
}

# Build Electron TypeScript
build_electron_ts() {
  print_header "Building Electron TypeScript"

  cd "$ELECTRON_DIR"

  log_info "Installing Electron dependencies..."
  npm install --legacy-peer-deps

  log_info "Compiling TypeScript (main process)..."
  npm run build:main

  log_info "Compiling TypeScript (preload script)..."
  npm run build:preload

  log_success "Electron TypeScript build complete"
}

# Configure code signing
configure_signing() {
  if [ "$SIGN" = false ]; then
    log_warning "Code signing disabled"
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    return
  fi

  print_header "Configuring Code Signing"

  # macOS code signing
  if [ "$PLATFORM" = "mac" ] || [ "$PLATFORM" = "all" ]; then
    if [ -n "$APPLE_ID" ] && [ -n "$APPLE_ID_PASSWORD" ]; then
      log_info "macOS code signing configured"
      export APPLE_ID="${APPLE_ID}"
      export APPLE_ID_PASSWORD="${APPLE_ID_PASSWORD}"
      export APPLE_TEAM_ID="${APPLE_TEAM_ID:-}"
    else
      log_warning "macOS code signing credentials not found"
      if [ "$PLATFORM" = "mac" ]; then
        export CSC_IDENTITY_AUTO_DISCOVERY=false
      fi
    fi
  fi

  # Windows code signing
  if [ "$PLATFORM" = "win" ] || [ "$PLATFORM" = "all" ]; then
    if [ -n "$WIN_CSC_LINK" ] && [ -n "$WIN_CSC_KEY_PASSWORD" ]; then
      log_info "Windows code signing configured"
      export CSC_LINK="${WIN_CSC_LINK}"
      export CSC_KEY_PASSWORD="${WIN_CSC_KEY_PASSWORD}"
    else
      log_warning "Windows code signing credentials not found"
    fi
  fi
}

# Build Electron application
build_electron_app() {
  print_header "Building Electron Application"

  cd "$ELECTRON_DIR"

  local build_cmd="npm run dist"

  case $PLATFORM in
    mac)
      build_cmd="npm run dist:mac"
      log_info "Building for macOS (x64 + arm64)..."
      ;;
    win)
      build_cmd="npm run dist:win"
      log_info "Building for Windows (x64 + ia32)..."
      ;;
    linux)
      build_cmd="npm run dist:linux"
      log_info "Building for Linux (x64)..."
      ;;
    all)
      build_cmd="npm run dist:all"
      log_info "Building for all platforms..."
      ;;
    *)
      log_error "Invalid platform: $PLATFORM"
      exit 1
      ;;
  esac

  # Configure publishing
  if [ "$PUBLISH" = true ]; then
    if [ -z "$GH_TOKEN" ]; then
      log_warning "GH_TOKEN not set - publishing will fail"
    else
      export GH_TOKEN="${GH_TOKEN}"

      if [ "$DRAFT" = true ]; then
        export ELECTRON_BUILDER_RELEASE_TYPE="draft"
      elif [ "$PRERELEASE" = true ]; then
        export ELECTRON_BUILDER_RELEASE_TYPE="prerelease"
      else
        export ELECTRON_BUILDER_RELEASE_TYPE="release"
      fi
    fi
  else
    # Disable publishing
    build_cmd="$build_cmd --publish never"
  fi

  # Execute build
  eval "$build_cmd"

  log_success "Electron application build complete"
}

# Verify build artifacts
verify_artifacts() {
  print_header "Verifying Build Artifacts"

  if [ ! -d "$DIST_DIR" ]; then
    log_error "Distribution directory not found: $DIST_DIR"
    exit 1
  fi

  local artifact_count=$(find "$DIST_DIR" -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) | wc -l)

  if [ "$artifact_count" -eq 0 ]; then
    log_error "No build artifacts found"
    exit 1
  fi

  log_success "Found $artifact_count build artifact(s)"

  # List artifacts
  log_info "Build artifacts:"
  find "$DIST_DIR" -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.zip" \) -exec basename {} \; | while read -r file; do
    echo "  - $file"
  done
}

# Generate checksums
generate_checksums() {
  print_header "Generating Checksums"

  cd "$DIST_DIR"

  local checksum_file="checksums.txt"
  rm -f "$checksum_file"

  find . -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" -o -name "*.zip" \) -exec shasum -a 256 {} \; | tee "$checksum_file"

  log_success "Checksums generated: $checksum_file"
}

# Upload to release
upload_to_release() {
  if [ "$PUBLISH" = false ]; then
    log_info "Skipping upload (--no-publish)"
    return
  fi

  print_header "Publishing to GitHub Releases"

  if [ -z "$GH_TOKEN" ]; then
    log_error "GH_TOKEN not set - cannot publish"
    exit 1
  fi

  log_info "Publishing handled by electron-builder..."
  log_success "Release published successfully"
}

# Print deployment summary
print_summary() {
  print_header "Deployment Summary"

  echo -e "${GREEN}Build Configuration:${NC}"
  echo "  Platform:     $PLATFORM"
  echo "  Environment:  $ENVIRONMENT"
  echo "  Version:      ${VERSION:-$(node -p "require('${PROJECT_ROOT}/package.json').version")}"
  echo "  Signed:       $SIGN"
  echo "  Publish:      $PUBLISH"
  echo ""
  echo -e "${GREEN}Artifacts Location:${NC}"
  echo "  $DIST_DIR"
  echo ""

  if [ "$PUBLISH" = true ]; then
    echo -e "${GREEN}Release Status:${NC}"
    if [ "$DRAFT" = true ]; then
      echo "  Draft release created"
    elif [ "$PRERELEASE" = true ]; then
      echo "  Pre-release published"
    else
      echo "  Release published"
    fi
  fi

  echo ""
  log_success "Deployment complete!"
}

# Main execution
main() {
  print_header "Electron Desktop Deployment"

  check_dependencies
  load_environment
  clean_build
  build_frontend
  build_electron_ts
  configure_signing
  build_electron_app
  verify_artifacts
  generate_checksums
  upload_to_release
  print_summary
}

# Run main function
main "$@"
