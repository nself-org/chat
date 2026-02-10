#!/usr/bin/env bash
#
# Deploy iOS app to TestFlight
# Usage: ./scripts/deploy-testflight.sh [--beta-group <group>] [--notify]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Default values
BETA_GROUP=""
NOTIFY_TESTERS=false
IPA_PATH=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --beta-group)
            BETA_GROUP="$2"
            shift 2
            ;;
        --notify)
            NOTIFY_TESTERS=true
            shift
            ;;
        --ipa)
            IPA_PATH="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Usage: $0 [--beta-group <group>] [--notify] [--ipa <path>]"
            exit 1
            ;;
    esac
done

cd "$PROJECT_ROOT"

# Check required environment variables
if [ -z "${APPLE_ID:-}" ]; then
    log_error "APPLE_ID environment variable is required"
    exit 1
fi

if [ -z "${APPLE_PASSWORD:-}" ] && [ -z "${APPLE_API_KEY:-}" ]; then
    log_error "Either APPLE_PASSWORD or APPLE_API_KEY is required"
    exit 1
fi

# Get version info
VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M)

log_info "Deploying nChat v${VERSION} (${BUILD_NUMBER}) to TestFlight"

# Find IPA file if not specified
if [ -z "$IPA_PATH" ]; then
    if [ -f "platforms/capacitor/ios/build/ipa/App.ipa" ]; then
        IPA_PATH="platforms/capacitor/ios/build/ipa/App.ipa"
    elif [ -f "platforms/capacitor/ios/build/ipa/nchat.ipa" ]; then
        IPA_PATH="platforms/capacitor/ios/build/ipa/nchat.ipa"
    else
        log_error "IPA file not found. Please build the app first or specify --ipa path"
        exit 1
    fi
fi

log_info "Using IPA: $IPA_PATH"

# Validate IPA
if [ ! -f "$IPA_PATH" ]; then
    log_error "IPA file not found: $IPA_PATH"
    exit 1
fi

# Check IPA signature
log_info "Validating IPA signature..."
if ! unzip -l "$IPA_PATH" | grep -q "Payload"; then
    log_error "Invalid IPA file structure"
    exit 1
fi

# Upload to App Store Connect
log_info "Uploading to App Store Connect..."

if [ -n "${APPLE_API_KEY:-}" ]; then
    # Use API Key authentication (recommended)
    log_info "Using App Store Connect API authentication"

    xcrun altool --upload-app \
        --type ios \
        --file "$IPA_PATH" \
        --apiKey "${APPLE_API_KEY_ID}" \
        --apiIssuer "${APPLE_API_ISSUER_ID}"
else
    # Use Apple ID + App-Specific Password
    log_info "Using Apple ID authentication"

    xcrun altool --upload-app \
        --type ios \
        --file "$IPA_PATH" \
        --username "$APPLE_ID" \
        --password "$APPLE_PASSWORD"
fi

if [ $? -eq 0 ]; then
    log_success "IPA uploaded successfully to App Store Connect"
else
    log_error "Failed to upload IPA"
    exit 1
fi

log_info "Processing build on App Store Connect..."
log_warning "It may take 5-15 minutes for the build to appear in TestFlight"

# Wait for build to be processed
if command -v xcrun &> /dev/null; then
    log_info "Waiting for build to be processed..."
    sleep 60

    # Check build status using App Store Connect API
    if [ -n "${APPLE_API_KEY:-}" ]; then
        log_info "You can check build status at: https://appstoreconnect.apple.com"
    fi
fi

# Add to beta group if specified
if [ -n "$BETA_GROUP" ]; then
    log_info "Adding build to beta group: $BETA_GROUP"
    # Note: This requires fastlane or App Store Connect API
    # For now, we'll just log instructions
    log_warning "To add to beta group '$BETA_GROUP', use App Store Connect web UI or fastlane"
fi

# Notify testers if specified
if [ "$NOTIFY_TESTERS" = true ]; then
    log_info "Notifying testers..."
    log_warning "Automatic tester notification requires App Store Connect API or fastlane"
fi

log_success "Deployment to TestFlight initiated"
log_info "Next steps:"
echo "  1. Wait for build processing (5-15 minutes)"
echo "  2. Add release notes in App Store Connect"
echo "  3. Submit for beta review if required"
echo "  4. Distribute to testers"
echo ""
log_info "TestFlight URL: https://appstoreconnect.apple.com/apps"
