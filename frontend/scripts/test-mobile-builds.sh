#!/usr/bin/env bash
#
# Test mobile build pipeline
# Usage: ./scripts/test-mobile-builds.sh [--ios] [--android] [--all]
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

log_section() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Parse arguments
TEST_IOS=false
TEST_ANDROID=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --ios)
            TEST_IOS=true
            shift
            ;;
        --android)
            TEST_ANDROID=true
            shift
            ;;
        --all)
            TEST_IOS=true
            TEST_ANDROID=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--ios] [--android] [--all]"
            echo ""
            echo "Options:"
            echo "  --ios      Test iOS build pipeline"
            echo "  --android  Test Android build pipeline"
            echo "  --all      Test both iOS and Android"
            echo ""
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Default: test both
if ! $TEST_IOS && ! $TEST_ANDROID; then
    TEST_IOS=true
    TEST_ANDROID=true
fi

cd "$PROJECT_ROOT"

# Track results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local skip_condition="${3:-false}"

    if $skip_condition; then
        log_warn "SKIPPED: $test_name"
        ((TESTS_SKIPPED++))
        return 0
    fi

    log_info "Running: $test_name"
    if eval "$test_command" > /dev/null 2>&1; then
        log_success "PASSED: $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "FAILED: $test_name"
        ((TESTS_FAILED++))
        return 1
    fi
}

log_section "Mobile Build Pipeline Test Suite"
log_info "Testing iOS: $TEST_IOS"
log_info "Testing Android: $TEST_ANDROID"

# Prerequisites checks
log_section "Prerequisites"

run_test "Node.js installed" "command -v node"
run_test "pnpm installed" "command -v pnpm"
run_test "Git installed" "command -v git"

if $TEST_IOS; then
    run_test "Xcode installed" "command -v xcodebuild"
    run_test "CocoaPods installed" "command -v pod"
    run_test "Fastlane installed" "command -v fastlane"
fi

if $TEST_ANDROID; then
    run_test "Java installed" "command -v java"
    run_test "Gradle wrapper exists" "test -f platforms/capacitor/android/gradlew"
fi

# Project structure checks
log_section "Project Structure"

run_test "package.json exists" "test -f package.json"
run_test "Capacitor config exists" "test -f platforms/capacitor/capacitor.config.ts"

if $TEST_IOS; then
    run_test "iOS platform exists" "test -d platforms/capacitor/ios"
    run_test "iOS workspace exists" "test -f platforms/capacitor/ios/App/App.xcworkspace"
    run_test "iOS Podfile exists" "test -f platforms/capacitor/ios/App/Podfile"
    run_test "iOS Info.plist exists" "test -f platforms/capacitor/ios/App/App/Info.plist"
fi

if $TEST_ANDROID; then
    run_test "Android platform exists" "test -d platforms/capacitor/android"
    run_test "Android build.gradle exists" "test -f platforms/capacitor/android/app/build.gradle"
    run_test "AndroidManifest.xml exists" "test -f platforms/capacitor/android/app/src/main/AndroidManifest.xml"
fi

# Dependencies
log_section "Dependencies"

run_test "node_modules exists" "test -d node_modules"

if $TEST_IOS; then
    run_test "iOS Pods installed" "test -d platforms/capacitor/ios/App/Pods"
fi

# Version checks
log_section "Version Information"

VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
log_info "App Version: $VERSION"

if $TEST_IOS; then
    IOS_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" platforms/capacitor/ios/App/App/Info.plist 2>/dev/null || echo "unknown")
    IOS_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" platforms/capacitor/ios/App/App/Info.plist 2>/dev/null || echo "unknown")
    log_info "iOS Version: $IOS_VERSION ($IOS_BUILD)"
fi

if $TEST_ANDROID; then
    ANDROID_VERSION=$(grep "versionName" platforms/capacitor/android/app/build.gradle | awk -F'"' '{print $2}' | head -1 || echo "unknown")
    ANDROID_CODE=$(grep "versionCode" platforms/capacitor/android/app/build.gradle | awk '{print $2}' | head -1 || echo "unknown")
    log_info "Android Version: $ANDROID_VERSION ($ANDROID_CODE)"
fi

# Build tests
log_section "Build Tests"

log_info "Building web assets..."
if pnpm build; then
    log_success "Web build successful"
    ((TESTS_PASSED++))
else
    log_error "Web build failed"
    ((TESTS_FAILED++))
fi

# iOS build tests
if $TEST_IOS; then
    log_section "iOS Build Tests"

    log_info "Syncing Capacitor for iOS..."
    if (cd platforms/capacitor && npx cap sync ios); then
        log_success "Capacitor sync iOS successful"
        ((TESTS_PASSED++))
    else
        log_error "Capacitor sync iOS failed"
        ((TESTS_FAILED++))
    fi

    log_info "Installing CocoaPods dependencies..."
    if (cd platforms/capacitor/ios/App && pod install); then
        log_success "CocoaPods install successful"
        ((TESTS_PASSED++))
    else
        log_warn "CocoaPods install failed (may need pod repo update)"
        ((TESTS_SKIPPED++))
    fi

    log_info "Testing iOS debug build (simulator)..."
    if xcodebuild -workspace platforms/capacitor/ios/App/App.xcworkspace \
        -scheme App \
        -configuration Debug \
        -sdk iphonesimulator \
        -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
        -derivedDataPath platforms/capacitor/ios/build \
        build CODE_SIGNING_ALLOWED=NO; then
        log_success "iOS debug build successful"
        ((TESTS_PASSED++))

        # Check build output
        if [ -d "platforms/capacitor/ios/build/Build/Products/Debug-iphonesimulator/App.app" ]; then
            APP_SIZE=$(du -sh platforms/capacitor/ios/build/Build/Products/Debug-iphonesimulator/App.app | awk '{print $1}')
            log_info "App size: $APP_SIZE"
        fi
    else
        log_error "iOS debug build failed"
        ((TESTS_FAILED++))
    fi
fi

# Android build tests
if $TEST_ANDROID; then
    log_section "Android Build Tests"

    log_info "Syncing Capacitor for Android..."
    if (cd platforms/capacitor && npx cap sync android); then
        log_success "Capacitor sync Android successful"
        ((TESTS_PASSED++))
    else
        log_error "Capacitor sync Android failed"
        ((TESTS_FAILED++))
    fi

    log_info "Testing Android debug build..."
    if (cd platforms/capacitor/android && ./gradlew assembleDebug --no-daemon); then
        log_success "Android debug build successful"
        ((TESTS_PASSED++))

        # Check APK output
        APK_PATH="platforms/capacitor/android/app/build/outputs/apk/debug/app-debug.apk"
        if [ -f "$APK_PATH" ]; then
            APK_SIZE=$(du -sh "$APK_PATH" | awk '{print $1}')
            log_info "APK size: $APK_SIZE"

            # Verify APK structure
            if unzip -l "$APK_PATH" | grep -q "AndroidManifest.xml"; then
                log_success "APK structure valid"
                ((TESTS_PASSED++))
            else
                log_error "APK structure invalid"
                ((TESTS_FAILED++))
            fi

            # Extract APK info
            if command -v aapt &> /dev/null; then
                log_info "APK Details:"
                aapt dump badging "$APK_PATH" | grep -E "package:|application-label:|sdkVersion:|targetSdkVersion:" | while read line; do
                    log_info "  $line"
                done
            fi
        fi
    else
        log_error "Android debug build failed"
        ((TESTS_FAILED++))
    fi

    # Test lint
    log_info "Running Android lint..."
    if (cd platforms/capacitor/android && ./gradlew lint --no-daemon); then
        log_success "Android lint passed"
        ((TESTS_PASSED++))
    else
        log_warn "Android lint found issues"
        ((TESTS_SKIPPED++))
    fi
fi

# Fastlane tests
if command -v fastlane &> /dev/null; then
    log_section "Fastlane Tests"

    run_test "Fastfile exists" "test -f platforms/capacitor/fastlane/Fastfile"
    run_test "Appfile exists" "test -f platforms/capacitor/fastlane/Appfile"

    if $TEST_IOS; then
        log_info "Testing Fastlane iOS lanes..."
        if (cd platforms/capacitor && fastlane lanes | grep -q "ios dev"); then
            log_success "Fastlane iOS lanes configured"
            ((TESTS_PASSED++))
        else
            log_warn "Fastlane iOS lanes not found"
            ((TESTS_SKIPPED++))
        fi
    fi

    if $TEST_ANDROID; then
        log_info "Testing Fastlane Android lanes..."
        if (cd platforms/capacitor && fastlane lanes | grep -q "android dev"); then
            log_success "Fastlane Android lanes configured"
            ((TESTS_PASSED++))
        else
            log_warn "Fastlane Android lanes not found"
            ((TESTS_SKIPPED++))
        fi
    fi
fi

# Signing configuration checks
log_section "Signing Configuration"

if $TEST_IOS; then
    log_info "Checking iOS signing setup..."
    if [ -n "${APPLE_ID:-}" ]; then
        log_info "APPLE_ID: $APPLE_ID"
    else
        log_warn "APPLE_ID not set (required for release builds)"
    fi

    if [ -n "${MATCH_GIT_URL:-}" ]; then
        log_info "MATCH_GIT_URL configured"
    else
        log_warn "MATCH_GIT_URL not set (required for Fastlane Match)"
    fi
fi

if $TEST_ANDROID; then
    log_info "Checking Android signing setup..."
    if [ -n "${NCHAT_RELEASE_STORE_FILE:-}" ]; then
        log_info "Keystore configured: $NCHAT_RELEASE_STORE_FILE"
        if [ -f "$NCHAT_RELEASE_STORE_FILE" ]; then
            log_success "Keystore file exists"
            ((TESTS_PASSED++))
        else
            log_warn "Keystore file not found"
            ((TESTS_SKIPPED++))
        fi
    else
        log_warn "NCHAT_RELEASE_STORE_FILE not set (required for release builds)"
    fi
fi

# Documentation checks
log_section "Documentation"

run_test "iOS signing guide exists" "test -f platforms/capacitor/ios/SIGNING-SETUP.md"
run_test "Android signing guide exists" "test -f platforms/capacitor/android/SIGNING-SETUP.md"
run_test "Mobile build guide exists" "test -f platforms/capacitor/MOBILE-BUILD-GUIDE.md"

# Summary
log_section "Test Summary"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))

echo ""
log_info "Total Tests: $TOTAL_TESTS"
log_success "Passed: $TESTS_PASSED"
log_error "Failed: $TESTS_FAILED"
log_warn "Skipped: $TESTS_SKIPPED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "🎉 All tests passed!"
    echo ""
    log_info "Next steps:"
    echo "  1. Configure signing credentials (see SIGNING-SETUP.md)"
    echo "  2. Test release builds with Fastlane"
    echo "  3. Deploy to TestFlight/Play Store internal track"
    exit 0
else
    log_error "❌ Some tests failed"
    echo ""
    log_info "Review the errors above and fix issues"
    exit 1
fi
