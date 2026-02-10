#!/bin/bash

###############################################################################
# E2E Testing Setup Script
#
# This script sets up the E2E testing environment for nself-chat mobile apps
# Supports: iOS (macOS only), Android (macOS/Linux), and Appium
#
# Usage:
#   ./scripts/setup-e2e.sh [ios|android|all]
#
# Examples:
#   ./scripts/setup-e2e.sh ios       # Setup iOS testing only
#   ./scripts/setup-e2e.sh android   # Setup Android testing only
#   ./scripts/setup-e2e.sh all       # Setup both iOS and Android
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check OS
check_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    log_success "Detected OS: $OS"
}

# Check Node.js version
check_node() {
    log_info "Checking Node.js version..."

    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js 20+ is required. Current version: $(node -v)"
        exit 1
    fi

    log_success "Node.js version: $(node -v)"
}

# Check pnpm
check_pnpm() {
    log_info "Checking pnpm..."

    if ! command -v pnpm &> /dev/null; then
        log_warning "pnpm not found. Installing pnpm..."
        npm install -g pnpm@9.15.4
    fi

    log_success "pnpm version: $(pnpm -v)"
}

# Install npm dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    pnpm install
    log_success "Dependencies installed"
}

# Setup iOS testing
setup_ios() {
    if [ "$OS" != "macos" ]; then
        log_warning "iOS testing is only available on macOS. Skipping iOS setup."
        return
    fi

    log_info "Setting up iOS testing environment..."

    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        log_error "Xcode is not installed. Please install Xcode from the App Store."
        exit 1
    fi

    XCODE_VERSION=$(xcodebuild -version | head -1 | awk '{print $2}')
    log_success "Xcode version: $XCODE_VERSION"

    # Check command line tools
    if ! xcode-select -p &> /dev/null; then
        log_warning "Xcode command line tools not found. Installing..."
        xcode-select --install
    fi

    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        log_warning "CocoaPods not found. Installing..."
        sudo gem install cocoapods
    fi
    log_success "CocoaPods version: $(pod --version)"

    # Install iOS app dependencies
    log_info "Installing iOS app dependencies..."
    cd platforms/capacitor/ios/App
    pod install
    cd ../../../../
    log_success "iOS dependencies installed"

    # Create iOS simulators if needed
    log_info "Checking iOS simulators..."

    simulators=(
        "iPhone 15 Pro:com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro"
        "iPhone 14:com.apple.CoreSimulator.SimDeviceType.iPhone-14"
        "iPhone SE (3rd generation):com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation"
    )

    for sim in "${simulators[@]}"; do
        IFS=':' read -r name type <<< "$sim"
        if ! xcrun simctl list devices | grep -q "$name"; then
            log_warning "Creating simulator: $name"
            xcrun simctl create "$name" "$type" "com.apple.CoreSimulator.SimRuntime.iOS-17-2"
        fi
    done

    log_success "iOS testing environment ready"
}

# Setup Android testing
setup_android() {
    log_info "Setting up Android testing environment..."

    # Check Java
    if ! command -v java &> /dev/null; then
        log_error "Java is not installed. Please install JDK 17+ from https://adoptium.net/"
        exit 1
    fi

    JAVA_VERSION=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        log_error "Java 17+ is required. Current version: $(java -version 2>&1 | head -1)"
        exit 1
    fi
    log_success "Java version: $(java -version 2>&1 | head -1)"

    # Check ANDROID_HOME
    if [ -z "$ANDROID_HOME" ]; then
        if [ -d "$HOME/Library/Android/sdk" ]; then
            export ANDROID_HOME="$HOME/Library/Android/sdk"
        elif [ -d "$HOME/Android/Sdk" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"
        else
            log_error "ANDROID_HOME not set and Android SDK not found. Please install Android Studio."
            exit 1
        fi
        log_warning "ANDROID_HOME was not set. Set to: $ANDROID_HOME"
        log_warning "Add this to your ~/.bashrc or ~/.zshrc:"
        echo "export ANDROID_HOME=$ANDROID_HOME"
        echo "export PATH=\$PATH:\$ANDROID_HOME/emulator:\$ANDROID_HOME/tools:\$ANDROID_HOME/platform-tools"
    fi

    log_success "ANDROID_HOME: $ANDROID_HOME"

    # Check adb
    if ! command -v adb &> /dev/null; then
        export PATH="$PATH:$ANDROID_HOME/platform-tools"
    fi

    if command -v adb &> /dev/null; then
        log_success "ADB version: $(adb version | head -1)"
    else
        log_error "ADB not found. Please install Android SDK Platform-Tools."
        exit 1
    fi

    # Check emulator
    if ! command -v emulator &> /dev/null; then
        export PATH="$PATH:$ANDROID_HOME/emulator"
    fi

    # Create AVDs if needed
    log_info "Checking Android emulators..."

    if command -v avdmanager &> /dev/null; then
        avds=("Pixel_5_API_34" "Pixel_Tablet_API_34")

        for avd in "${avds[@]}"; do
            if ! avdmanager list avd | grep -q "$avd"; then
                log_warning "Creating AVD: $avd"
                # Note: This requires system images to be installed
                log_info "Please create $avd manually in Android Studio or run:"
                echo "  avdmanager create avd -n $avd -k 'system-images;android-34;google_apis;x86_64'"
            else
                log_success "AVD exists: $avd"
            fi
        done
    else
        log_warning "avdmanager not found. Please create AVDs manually in Android Studio."
    fi

    log_success "Android testing environment ready"
}

# Setup Appium
setup_appium() {
    log_info "Setting up Appium..."

    # Appium is installed via npm as part of dependencies
    log_info "Appium will be installed with project dependencies"

    log_success "Appium setup complete"
}

# Build test apps
build_apps() {
    log_info "Building test apps..."

    if [ "$SETUP_IOS" = true ] && [ "$OS" = "macos" ]; then
        log_info "Building iOS app for testing..."
        cd platforms/capacitor
        pnpm build:ios -- --configuration Debug --simulator || log_warning "iOS build failed. You may need to build manually."
        cd ../..
    fi

    if [ "$SETUP_ANDROID" = true ]; then
        log_info "Building Android app for testing..."
        cd platforms/capacitor
        pnpm build:android -- assembleDebug || log_warning "Android build failed. You may need to build manually."
        cd ../..
    fi

    log_success "Build complete"
}

# Create directories
create_directories() {
    log_info "Creating test directories..."

    mkdir -p e2e/mobile/artifacts/screenshots
    mkdir -p e2e/mobile/artifacts/videos
    mkdir -p e2e/mobile/artifacts/logs
    mkdir -p e2e/mobile/reports

    log_success "Directories created"
}

# Print next steps
print_next_steps() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "E2E Testing Environment Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Next Steps:"
    echo ""

    if [ "$SETUP_IOS" = true ] && [ "$OS" = "macos" ]; then
        echo "  iOS Testing:"
        echo "    pnpm test:e2e:ios                    # Run all iOS tests"
        echo "    pnpm exec detox test e2e/mobile/auth.spec.ts --configuration ios.sim.debug"
        echo ""
    fi

    if [ "$SETUP_ANDROID" = true ]; then
        echo "  Android Testing:"
        echo "    pnpm test:e2e:android                # Run all Android tests"
        echo "    pnpm exec detox test e2e/mobile/messaging.spec.ts --configuration android.emu.debug"
        echo ""
    fi

    echo "  Performance Testing:"
    echo "    pnpm test:performance                    # Run performance benchmarks"
    echo ""
    echo "  Real Device Testing:"
    echo "    pnpm test:e2e:appium                     # Run Appium tests"
    echo ""
    echo "📚 Documentation:"
    echo "    e2e/mobile/README.md                     # Comprehensive guide"
    echo "    .claude/quick-reference/e2e-quick-reference.md  # Quick reference"
    echo "    docs/features/E2E-Testing.md             # Implementation summary"
    echo ""
    log_info "For troubleshooting, see e2e/mobile/README.md"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  E2E Testing Setup for nself-chat"
    echo "  Version: 0.8.0"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Parse arguments
    SETUP_TYPE="${1:-all}"
    SETUP_IOS=false
    SETUP_ANDROID=false

    case $SETUP_TYPE in
        ios)
            SETUP_IOS=true
            ;;
        android)
            SETUP_ANDROID=true
            ;;
        all)
            SETUP_IOS=true
            SETUP_ANDROID=true
            ;;
        *)
            log_error "Invalid argument. Usage: $0 [ios|android|all]"
            exit 1
            ;;
    esac

    # Run setup steps
    check_os
    check_node
    check_pnpm
    install_dependencies
    create_directories

    if [ "$SETUP_IOS" = true ]; then
        setup_ios
    fi

    if [ "$SETUP_ANDROID" = true ]; then
        setup_android
    fi

    setup_appium
    # build_apps  # Commented out - can be slow, build manually when ready

    print_next_steps
}

# Run main function
main "$@"
