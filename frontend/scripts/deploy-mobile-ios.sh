#!/usr/bin/env bash
#
# iOS App Store Deployment Script
# Deploy nself-chat to TestFlight and App Store
#
# Usage: ./scripts/deploy-mobile-ios.sh [options]
#
# Options:
#   --testflight      Deploy to TestFlight only (default)
#   --production      Deploy to App Store production
#   --skip-build      Skip build step (use existing archive)
#   --skip-tests      Skip running tests
#   --team-id <id>    Apple Team ID (can also set APPLE_TEAM_ID env var)
#   --app-id <id>     Apple ID email (can also set APPLE_ID env var)
#   --help            Show this help message
#
# Environment Variables:
#   APPLE_TEAM_ID           Your Apple Team ID (required)
#   APPLE_ID                Your Apple ID email (required)
#   APP_SPECIFIC_PASSWORD   App-specific password for altool (required for upload)
#   IOS_SIGNING_IDENTITY    Code signing identity (default: "iPhone Distribution")
#   IOS_PROVISIONING_PROFILE Provisioning profile UUID (optional)
#
# Prerequisites:
#   - Xcode Command Line Tools installed
#   - Valid Apple Developer account with App Store Connect access
#   - App created in App Store Connect
#   - Provisioning profiles and certificates configured
#   - App-specific password generated (https://appleid.apple.com/account/manage)
#
# Examples:
#   # Deploy to TestFlight
#   ./scripts/deploy-mobile-ios.sh --testflight --team-id ABC123 --app-id developer@example.com
#
#   # Deploy to production
#   ./scripts/deploy-mobile-ios.sh --production
#
#   # Use existing build
#   ./scripts/deploy-mobile-ios.sh --skip-build
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CAPACITOR_DIR="$PROJECT_ROOT/platforms/capacitor"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
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

log_step() {
    echo ""
    echo -e "${CYAN}===================================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}===================================================================${NC}"
}

# Default values
DEPLOY_TARGET="testflight"
SKIP_BUILD=false
SKIP_TESTS=false
TEAM_ID="${APPLE_TEAM_ID:-}"
APPLE_ID_EMAIL="${APPLE_ID:-}"
SIGNING_IDENTITY="${IOS_SIGNING_IDENTITY:-iPhone Distribution}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --testflight)
            DEPLOY_TARGET="testflight"
            shift
            ;;
        --production)
            DEPLOY_TARGET="production"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --team-id)
            TEAM_ID="$2"
            shift 2
            ;;
        --app-id)
            APPLE_ID_EMAIL="$2"
            shift 2
            ;;
        --help|-h)
            head -n 40 "$0" | grep "^#" | sed 's/^# //; s/^#//'
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validation
if [ -z "$TEAM_ID" ]; then
    log_error "Apple Team ID is required. Set APPLE_TEAM_ID env var or use --team-id"
    log_info "Find your Team ID at: https://developer.apple.com/account/#/membership"
    exit 1
fi

if [ -z "$APPLE_ID_EMAIL" ]; then
    log_error "Apple ID email is required. Set APPLE_ID env var or use --app-id"
    exit 1
fi

if [ -z "${APP_SPECIFIC_PASSWORD:-}" ]; then
    log_warn "APP_SPECIFIC_PASSWORD not set. You may be prompted for password during upload."
    log_info "Generate one at: https://appleid.apple.com/account/manage"
fi

# Check for Xcode
if ! command -v xcodebuild &> /dev/null; then
    log_error "xcodebuild not found. Please install Xcode Command Line Tools."
    log_info "Install with: xcode-select --install"
    exit 1
fi

# Check for xcrun altool (for app upload)
if ! command -v xcrun &> /dev/null; then
    log_error "xcrun not found. Xcode Command Line Tools may not be properly installed."
    exit 1
fi

log_step "iOS Deployment - $DEPLOY_TARGET"
log_info "Team ID: $TEAM_ID"
log_info "Apple ID: $APPLE_ID_EMAIL"
log_info "Signing Identity: $SIGNING_IDENTITY"

cd "$PROJECT_ROOT"

# Get version info
VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%Y%m%d%H%M)

log_info "Version: $VERSION"
log_info "Build Number: $BUILD_NUMBER"

# Step 1: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    log_step "Step 1/7: Running Tests"

    if [ -f "package.json" ]; then
        if grep -q '"test"' package.json; then
            pnpm test || {
                log_error "Tests failed. Fix tests or use --skip-tests to bypass."
                exit 1
            }
            log_success "Tests passed"
        else
            log_warn "No test script found, skipping tests"
        fi
    fi
else
    log_warn "Skipping tests (--skip-tests flag)"
fi

# Step 2: Build web assets
if [ "$SKIP_BUILD" = false ]; then
    log_step "Step 2/7: Building Web Assets"

    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile

    log_info "Building Next.js application..."
    pnpm build || {
        log_error "Web build failed"
        exit 1
    }

    log_success "Web assets built successfully"
else
    log_warn "Skipping web build (--skip-build flag)"
fi

# Step 3: Sync to Capacitor iOS
log_step "Step 3/7: Syncing to iOS Platform"

cd "$CAPACITOR_DIR"

if [ ! -d "ios" ]; then
    log_error "iOS platform not found. Run: cd platforms/capacitor && npx cap add ios"
    exit 1
fi

if [ "$SKIP_BUILD" = false ]; then
    log_info "Copying web assets to Capacitor..."
    npx cap copy ios

    log_info "Syncing Capacitor to iOS..."
    npx cap sync ios || {
        log_error "Capacitor sync failed"
        exit 1
    }

    log_success "Capacitor sync completed"
fi

# Step 4: Update version and build number
log_step "Step 4/7: Updating Version Information"

INFO_PLIST="ios/App/App/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
    log_error "Info.plist not found at $INFO_PLIST"
    exit 1
fi

log_info "Updating CFBundleShortVersionString to $VERSION"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$INFO_PLIST"

log_info "Updating CFBundleVersion to $BUILD_NUMBER"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$INFO_PLIST"

log_success "Version information updated"

# Step 5: Build and Archive
log_step "Step 5/7: Building iOS App"

WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
ARCHIVE_PATH="ios/build/App.xcarchive"
EXPORT_PATH="ios/build/ipa"

if [ ! -d "$(dirname "$WORKSPACE")" ]; then
    log_error "Xcode workspace not found at $WORKSPACE"
    exit 1
fi

# Clean build folder
log_info "Cleaning previous builds..."
rm -rf ios/build

# Archive
log_info "Creating archive..."
xcodebuild -workspace "$WORKSPACE" \
           -scheme "$SCHEME" \
           -configuration Release \
           -archivePath "$ARCHIVE_PATH" \
           -destination 'generic/platform=iOS' \
           -allowProvisioningUpdates \
           DEVELOPMENT_TEAM="$TEAM_ID" \
           CODE_SIGN_IDENTITY="$SIGNING_IDENTITY" \
           archive | xcpretty || {
    log_error "Archive creation failed"
    log_info "Trying without xcpretty..."
    xcodebuild -workspace "$WORKSPACE" \
               -scheme "$SCHEME" \
               -configuration Release \
               -archivePath "$ARCHIVE_PATH" \
               -destination 'generic/platform=iOS' \
               -allowProvisioningUpdates \
               DEVELOPMENT_TEAM="$TEAM_ID" \
               CODE_SIGN_IDENTITY="$SIGNING_IDENTITY" \
               archive || {
        log_error "Archive creation failed. Check Xcode for details."
        exit 1
    }
}

log_success "Archive created successfully"

# Step 6: Export IPA
log_step "Step 6/7: Exporting IPA"

# Determine export method
if [ "$DEPLOY_TARGET" = "production" ]; then
    EXPORT_METHOD="app-store"
else
    EXPORT_METHOD="app-store"  # TestFlight also uses app-store method
fi

# Create ExportOptions.plist
EXPORT_OPTIONS="ios/build/ExportOptions.plist"
cat > "$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>$EXPORT_METHOD</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>signingCertificate</key>
    <string>$SIGNING_IDENTITY</string>
</dict>
</plist>
EOF

log_info "Exporting archive to IPA..."
xcodebuild -exportArchive \
           -archivePath "$ARCHIVE_PATH" \
           -exportPath "$EXPORT_PATH" \
           -exportOptionsPlist "$EXPORT_OPTIONS" \
           -allowProvisioningUpdates | xcpretty || {
    log_error "IPA export failed"
    log_info "Trying without xcpretty..."
    xcodebuild -exportArchive \
               -archivePath "$ARCHIVE_PATH" \
               -exportPath "$EXPORT_PATH" \
               -exportOptionsPlist "$EXPORT_OPTIONS" \
               -allowProvisioningUpdates || {
        log_error "IPA export failed. Check provisioning profiles and certificates."
        exit 1
    }
}

IPA_FILE="$EXPORT_PATH/App.ipa"

if [ ! -f "$IPA_FILE" ]; then
    log_error "IPA file not found at $IPA_FILE"
    exit 1
fi

log_success "IPA exported successfully"
log_info "IPA location: $CAPACITOR_DIR/$IPA_FILE"

# Step 7: Upload to App Store Connect
log_step "Step 7/7: Uploading to App Store Connect"

if [ "$DEPLOY_TARGET" = "testflight" ]; then
    log_info "Uploading to TestFlight..."
elif [ "$DEPLOY_TARGET" = "production" ]; then
    log_warn "Uploading to App Store Connect (you'll need to submit for review manually)"
fi

# Validate the IPA first
log_info "Validating IPA..."
xcrun altool --validate-app \
             --type ios \
             --file "$IPA_FILE" \
             --username "$APPLE_ID_EMAIL" \
             --password "${APP_SPECIFIC_PASSWORD:-@keychain:AC_PASSWORD}" || {
    log_error "IPA validation failed"
    log_info "You can manually validate and upload using Xcode or Transporter app"
    exit 1
}

log_success "IPA validation passed"

# Upload the IPA
log_info "Uploading IPA to App Store Connect..."
log_warn "This may take several minutes..."

xcrun altool --upload-app \
             --type ios \
             --file "$IPA_FILE" \
             --username "$APPLE_ID_EMAIL" \
             --password "${APP_SPECIFIC_PASSWORD:-@keychain:AC_PASSWORD}" || {
    log_error "IPA upload failed"
    log_info "You can manually upload using:"
    log_info "  1. Transporter app (https://apps.apple.com/app/transporter/id1450874784)"
    log_info "  2. Xcode > Window > Organizer > Archives"
    log_info "  3. xcrun altool with the correct credentials"
    exit 1
}

log_success "Upload completed successfully!"

# Final instructions
log_step "Deployment Complete!"

echo ""
log_success "Your app has been uploaded to App Store Connect"
log_info "Version: $VERSION ($BUILD_NUMBER)"
echo ""

if [ "$DEPLOY_TARGET" = "testflight" ]; then
    echo -e "${GREEN}Next Steps for TestFlight:${NC}"
    echo "  1. Go to App Store Connect: https://appstoreconnect.apple.com"
    echo "  2. Select your app"
    echo "  3. Go to TestFlight tab"
    echo "  4. Wait for processing to complete (usually 10-30 minutes)"
    echo "  5. Add build to your test groups"
    echo "  6. Invite internal/external testers"
    echo ""
    echo "  Internal testers can install immediately after processing"
    echo "  External testers require App Review (1-2 days)"
else
    echo -e "${GREEN}Next Steps for App Store Production:${NC}"
    echo "  1. Go to App Store Connect: https://appstoreconnect.apple.com"
    echo "  2. Select your app"
    echo "  3. Create a new version (if needed)"
    echo "  4. Wait for build processing to complete"
    echo "  5. Select the build for your version"
    echo "  6. Complete all required metadata"
    echo "  7. Submit for App Review"
    echo ""
    echo "  App Review typically takes 24-48 hours"
    echo "  You'll be notified via email when status changes"
fi

echo ""
log_info "Build artifacts saved at: $CAPACITOR_DIR/ios/build"
log_info "IPA file: $CAPACITOR_DIR/$IPA_FILE"
echo ""
log_info "For troubleshooting, see: docs/guides/deployment/mobile-deployment.md"
echo ""

exit 0
