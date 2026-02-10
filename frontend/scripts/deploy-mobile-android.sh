#!/usr/bin/env bash
#
# Android Google Play Deployment Script
# Deploy nself-chat to Google Play Console (Internal/Beta/Production)
#
# Usage: ./scripts/deploy-mobile-android.sh [options]
#
# Options:
#   --internal        Deploy to Internal Testing track (default)
#   --beta            Deploy to Beta track
#   --production      Deploy to Production track
#   --skip-build      Skip build step (use existing AAB)
#   --skip-tests      Skip running tests
#   --keystore <path> Path to keystore file
#   --key-alias <alias> Key alias for signing
#   --help            Show this help message
#
# Environment Variables:
#   ANDROID_KEYSTORE_PATH      Path to your keystore file (required for release)
#   ANDROID_KEYSTORE_PASSWORD  Keystore password (required for release)
#   ANDROID_KEY_ALIAS          Key alias (required for release)
#   ANDROID_KEY_PASSWORD       Key password (required for release)
#   GOOGLE_PLAY_SERVICE_ACCOUNT Path to Google Play service account JSON
#
# Prerequisites:
#   - Android SDK and build tools installed
#   - Valid Google Play Developer account
#   - App created in Google Play Console
#   - Release keystore created and configured
#   - Service account created (optional, for automated uploads)
#
# Keystore Setup:
#   Create a release keystore if you don't have one:
#   keytool -genkey -v -keystore release.keystore -alias upload-key \
#           -keyalg RSA -keysize 2048 -validity 10000
#
# Service Account Setup (for automated uploads):
#   1. Go to Google Play Console
#   2. Settings > API access
#   3. Create new service account
#   4. Download JSON key file
#   5. Set GOOGLE_PLAY_SERVICE_ACCOUNT env var
#
# Examples:
#   # Deploy to Internal Testing
#   ./scripts/deploy-mobile-android.sh --internal
#
#   # Deploy to Beta
#   ./scripts/deploy-mobile-android.sh --beta
#
#   # Deploy to Production (requires manual submission)
#   ./scripts/deploy-mobile-android.sh --production
#
#   # Use existing build
#   ./scripts/deploy-mobile-android.sh --skip-build
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
DEPLOY_TRACK="internal"
SKIP_BUILD=false
SKIP_TESTS=false
KEYSTORE_PATH="${ANDROID_KEYSTORE_PATH:-}"
KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-}"
KEY_ALIAS="${ANDROID_KEY_ALIAS:-}"
KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-}"
SERVICE_ACCOUNT_JSON="${GOOGLE_PLAY_SERVICE_ACCOUNT:-}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --internal)
            DEPLOY_TRACK="internal"
            shift
            ;;
        --beta)
            DEPLOY_TRACK="beta"
            shift
            ;;
        --production)
            DEPLOY_TRACK="production"
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
        --keystore)
            KEYSTORE_PATH="$2"
            shift 2
            ;;
        --key-alias)
            KEY_ALIAS="$2"
            shift 2
            ;;
        --help|-h)
            head -n 60 "$0" | grep "^#" | sed 's/^# //; s/^#//'
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
if [ -z "$KEYSTORE_PATH" ]; then
    log_error "Keystore path is required. Set ANDROID_KEYSTORE_PATH env var or use --keystore"
    log_info "Create a keystore with:"
    log_info "  keytool -genkey -v -keystore release.keystore -alias upload-key \\"
    log_info "          -keyalg RSA -keysize 2048 -validity 10000"
    exit 1
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
    log_error "Keystore file not found at: $KEYSTORE_PATH"
    exit 1
fi

if [ -z "$KEYSTORE_PASSWORD" ]; then
    log_error "Keystore password is required. Set ANDROID_KEYSTORE_PASSWORD env var"
    exit 1
fi

if [ -z "$KEY_ALIAS" ]; then
    log_error "Key alias is required. Set ANDROID_KEY_ALIAS env var or use --key-alias"
    exit 1
fi

if [ -z "$KEY_PASSWORD" ]; then
    log_error "Key password is required. Set ANDROID_KEY_PASSWORD env var"
    exit 1
fi

# Check for required tools
if ! command -v gradle &> /dev/null && ! command -v ./gradlew &> /dev/null; then
    log_error "Gradle not found. Please install Android SDK and build tools."
    exit 1
fi

log_step "Android Deployment - $DEPLOY_TRACK Track"
log_info "Keystore: $KEYSTORE_PATH"
log_info "Key Alias: $KEY_ALIAS"

cd "$PROJECT_ROOT"

# Get version info
VERSION=$(node -p "require('./package.json').version")
VERSION_CODE=$(date +%Y%m%d%H%M)

log_info "Version Name: $VERSION"
log_info "Version Code: $VERSION_CODE"

# Step 1: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
    log_step "Step 1/8: Running Tests"

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
    log_step "Step 2/8: Building Web Assets"

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

# Step 3: Sync to Capacitor Android
log_step "Step 3/8: Syncing to Android Platform"

cd "$CAPACITOR_DIR"

if [ ! -d "android" ]; then
    log_error "Android platform not found. Run: cd platforms/capacitor && npx cap add android"
    exit 1
fi

if [ "$SKIP_BUILD" = false ]; then
    log_info "Copying web assets to Capacitor..."
    npx cap copy android

    log_info "Syncing Capacitor to Android..."
    npx cap sync android || {
        log_error "Capacitor sync failed"
        exit 1
    }

    log_success "Capacitor sync completed"
fi

# Step 4: Update version information
log_step "Step 4/8: Updating Version Information"

BUILD_GRADLE="android/app/build.gradle"

if [ ! -f "$BUILD_GRADLE" ]; then
    log_error "build.gradle not found at $BUILD_GRADLE"
    exit 1
fi

log_info "Updating versionName to $VERSION"
sed -i.bak "s/versionName \".*\"/versionName \"$VERSION\"/" "$BUILD_GRADLE"

log_info "Updating versionCode to $VERSION_CODE"
sed -i.bak "s/versionCode .*/versionCode $VERSION_CODE/" "$BUILD_GRADLE"

# Clean up backup files
rm -f "${BUILD_GRADLE}.bak"

log_success "Version information updated"

# Step 5: Configure signing
log_step "Step 5/8: Configuring Release Signing"

KEYSTORE_PROPERTIES="android/keystore.properties"

log_info "Creating keystore.properties..."
cat > "$KEYSTORE_PROPERTIES" <<EOF
storeFile=$KEYSTORE_PATH
storePassword=$KEYSTORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF

# Ensure keystore.properties is not committed
if ! grep -q "keystore.properties" android/.gitignore 2>/dev/null; then
    echo "keystore.properties" >> android/.gitignore
fi

log_success "Signing configuration created"

# Step 6: Build Android App Bundle (AAB)
log_step "Step 6/8: Building Android App Bundle"

cd android

# Clean previous builds
log_info "Cleaning previous builds..."
./gradlew clean

# Build release AAB
log_info "Building release bundle..."
log_info "This may take several minutes..."

./gradlew bundleRelease || {
    log_error "Build failed"
    cd "$CAPACITOR_DIR"
    rm -f "$KEYSTORE_PROPERTIES"
    exit 1
}

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ ! -f "$AAB_PATH" ]; then
    log_error "AAB file not found at $AAB_PATH"
    cd "$CAPACITOR_DIR"
    rm -f "$KEYSTORE_PROPERTIES"
    exit 1
fi

log_success "AAB created successfully"
log_info "AAB location: $CAPACITOR_DIR/android/$AAB_PATH"

# Step 7: Build APK (for testing)
log_step "Step 7/8: Building APK for Testing"

log_info "Building release APK..."
./gradlew assembleRelease || {
    log_warn "APK build failed (AAB build succeeded, so continuing...)"
}

APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    log_success "APK created successfully"
    log_info "APK location: $CAPACITOR_DIR/android/$APK_PATH"
fi

cd "$CAPACITOR_DIR"

# Step 8: Upload to Google Play (if service account configured)
log_step "Step 8/8: Upload to Google Play"

# Copy outputs to distribution folder
DIST_DIR="dist"
mkdir -p "$DIST_DIR"

cp "android/$AAB_PATH" "$DIST_DIR/nchat-release.aab"
log_info "AAB copied to: $CAPACITOR_DIR/$DIST_DIR/nchat-release.aab"

if [ -f "android/$APK_PATH" ]; then
    cp "android/$APK_PATH" "$DIST_DIR/nchat-release.apk"
    log_info "APK copied to: $CAPACITOR_DIR/$DIST_DIR/nchat-release.apk"
fi

# Upload using service account (if configured)
if [ -n "$SERVICE_ACCOUNT_JSON" ] && [ -f "$SERVICE_ACCOUNT_JSON" ]; then
    log_info "Service account found, attempting automated upload..."

    # Check if bundletool is available
    if command -v bundletool &> /dev/null; then
        log_info "Uploading to $DEPLOY_TRACK track..."

        # Note: This requires the Google Play Developer API to be enabled
        # and the proper Ruby/fastlane setup
        if command -v fastlane &> /dev/null; then
            log_info "Using fastlane for upload..."
            # This would use fastlane supply command
            log_warn "Fastlane upload not implemented yet"
            log_info "See docs/guides/deployment/mobile-deployment.md for fastlane setup"
        else
            log_warn "Fastlane not installed. Cannot upload automatically."
            log_info "Install with: gem install fastlane"
        fi
    else
        log_warn "bundletool not found. Cannot validate AAB."
        log_info "Install with: brew install bundletool"
    fi
else
    log_warn "Service account not configured. Manual upload required."
fi

# Clean up sensitive files
rm -f "$KEYSTORE_PROPERTIES"

# Final instructions
log_step "Build Complete!"

echo ""
log_success "Android App Bundle (AAB) created successfully"
log_info "Version: $VERSION ($VERSION_CODE)"
echo ""

echo -e "${GREEN}Build Artifacts:${NC}"
echo "  AAB (for Play Store): $CAPACITOR_DIR/$DIST_DIR/nchat-release.aab"
if [ -f "$DIST_DIR/nchat-release.apk" ]; then
    echo "  APK (for testing):    $CAPACITOR_DIR/$DIST_DIR/nchat-release.apk"
fi
echo ""

echo -e "${GREEN}Manual Upload Instructions:${NC}"
echo "  1. Go to Google Play Console: https://play.google.com/console"
echo "  2. Select your app"
echo ""

if [ "$DEPLOY_TRACK" = "internal" ]; then
    echo "  3. Go to Testing > Internal testing"
    echo "  4. Create new release"
    echo "  5. Upload the AAB file: $DIST_DIR/nchat-release.aab"
    echo "  6. Add release notes"
    echo "  7. Review and roll out to Internal Testing"
    echo ""
    echo "  Internal testers can install immediately via Play Store link"
elif [ "$DEPLOY_TRACK" = "beta" ]; then
    echo "  3. Go to Testing > Closed testing"
    echo "  4. Create new release"
    echo "  5. Upload the AAB file: $DIST_DIR/nchat-release.aab"
    echo "  6. Add release notes"
    echo "  7. Review and roll out to Beta"
    echo ""
    echo "  Beta requires Pre-launch report (usually completes in 1-2 hours)"
    echo "  Testers need to opt-in via Play Store link"
else
    echo "  3. Go to Production"
    echo "  4. Create new release"
    echo "  5. Upload the AAB file: $DIST_DIR/nchat-release.aab"
    echo "  6. Complete all required metadata"
    echo "  7. Add release notes"
    echo "  8. Submit for review"
    echo ""
    echo "  Production review typically takes 1-7 days"
    echo "  You'll be notified via email when status changes"
fi

echo ""
echo -e "${YELLOW}Testing the APK locally:${NC}"
echo "  # Install on connected device"
echo "  adb install -r $DIST_DIR/nchat-release.apk"
echo ""
echo "  # Or install via Android Studio"
echo "  # Open android/ folder and run from IDE"
echo ""

echo -e "${BLUE}Automated Upload Setup (Optional):${NC}"
echo "  For automated uploads, set up fastlane:"
echo "  1. Install fastlane: gem install fastlane"
echo "  2. Set up service account in Google Play Console"
echo "  3. See: docs/guides/deployment/mobile-deployment.md"
echo ""

log_info "For troubleshooting, see: docs/guides/deployment/mobile-deployment.md"
echo ""

exit 0
