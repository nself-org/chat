#!/usr/bin/env bash
#
# Build nself-chat mobile applications
# Usage: ./scripts/build-mobile.sh [--capacitor] [--react-native] [--platform <platform>] [--release]
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

BUILD_CAPACITOR=false
BUILD_RN=false
PLATFORM=""
RELEASE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --capacitor)
            BUILD_CAPACITOR=true
            shift
            ;;
        --react-native)
            BUILD_RN=true
            shift
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --release)
            RELEASE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--capacitor] [--react-native] [--platform <platform>] [--release]"
            echo ""
            echo "Options:"
            echo "  --capacitor     Build Capacitor application"
            echo "  --react-native  Build React Native application"
            echo "  --platform      Target platform (ios, android)"
            echo "  --release       Build release version"
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
if ! $BUILD_CAPACITOR && ! $BUILD_RN; then
    BUILD_CAPACITOR=true
    BUILD_RN=true
fi

cd "$PROJECT_ROOT"

# Install dependencies
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
fi

# Build web assets first (needed for Capacitor)
log_info "Building web assets..."
pnpm build || {
    log_error "Web build failed"
    exit 1
}

# Build Capacitor
if $BUILD_CAPACITOR; then
    log_info "Building Capacitor mobile application..."

    if [ ! -f "capacitor.config.ts" ] && [ ! -f "capacitor.config.json" ]; then
        log_warn "Capacitor configuration not found. Run 'pnpm cap init' first."
        log_warn "Skipping Capacitor build"
    else
        # Sync Capacitor
        pnpm cap sync || {
            log_warn "Capacitor sync failed"
        }

        # Build iOS
        if [ -z "$PLATFORM" ] || [ "$PLATFORM" = "ios" ]; then
            if [ -d "ios" ]; then
                log_info "Building iOS..."
                cd ios/App
                if $RELEASE; then
                    xcodebuild -workspace App.xcworkspace \
                        -scheme App \
                        -configuration Release \
                        -destination 'generic/platform=iOS' \
                        -archivePath build/App.xcarchive \
                        archive || log_warn "iOS build failed"
                else
                    xcodebuild -workspace App.xcworkspace \
                        -scheme App \
                        -configuration Debug \
                        -destination 'generic/platform=iOS Simulator' \
                        build || log_warn "iOS build failed"
                fi
                cd "$PROJECT_ROOT"
            else
                log_warn "iOS directory not found. Run 'pnpm cap add ios' first."
            fi
        fi

        # Build Android
        if [ -z "$PLATFORM" ] || [ "$PLATFORM" = "android" ]; then
            if [ -d "android" ]; then
                log_info "Building Android..."
                cd android
                if $RELEASE; then
                    ./gradlew assembleRelease bundleRelease || log_warn "Android build failed"
                else
                    ./gradlew assembleDebug || log_warn "Android build failed"
                fi
                cd "$PROJECT_ROOT"
            else
                log_warn "Android directory not found. Run 'pnpm cap add android' first."
            fi
        fi
    fi
    echo ""
fi

# Build React Native
if $BUILD_RN; then
    log_info "Building React Native mobile application..."

    if [ ! -d "mobile" ]; then
        log_warn "React Native directory (mobile/) not found."
        log_warn "Skipping React Native build"
    else
        cd mobile

        # Install mobile dependencies
        if [ ! -d "node_modules" ]; then
            pnpm install --frozen-lockfile
        fi

        # Build iOS
        if [ -z "$PLATFORM" ] || [ "$PLATFORM" = "ios" ]; then
            if [ -d "ios" ]; then
                log_info "Building iOS..."
                cd ios
                pod install
                if $RELEASE; then
                    xcodebuild -workspace NselfChat.xcworkspace \
                        -scheme NselfChat \
                        -configuration Release \
                        -destination 'generic/platform=iOS' \
                        -archivePath build/NselfChat.xcarchive \
                        archive || log_warn "iOS build failed"
                else
                    xcodebuild -workspace NselfChat.xcworkspace \
                        -scheme NselfChat \
                        -configuration Debug \
                        -destination 'generic/platform=iOS Simulator' \
                        build || log_warn "iOS build failed"
                fi
                cd ..
            fi
        fi

        # Build Android
        if [ -z "$PLATFORM" ] || [ "$PLATFORM" = "android" ]; then
            if [ -d "android" ]; then
                log_info "Building Android..."
                cd android
                if $RELEASE; then
                    ./gradlew assembleRelease bundleRelease || log_warn "Android build failed"
                else
                    ./gradlew assembleDebug || log_warn "Android build failed"
                fi
                cd ..
            fi
        fi

        cd "$PROJECT_ROOT"
    fi
    echo ""
fi

log_success "Mobile build process completed!"
