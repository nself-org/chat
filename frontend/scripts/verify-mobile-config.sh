#!/usr/bin/env bash
#
# Verify mobile packaging configuration
# Usage: ./scripts/verify-mobile-config.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Verifying Mobile Packaging Configuration${NC}"
echo ""

cd "$PROJECT_ROOT"

# Check Fastlane configuration
echo -e "${BLUE}Fastlane Configuration:${NC}"
if [ -f "platforms/capacitor/fastlane/Fastfile" ]; then
    echo -e "  ${GREEN}✓${NC} Fastfile exists"
    LANES=$(grep -c "lane :" platforms/capacitor/fastlane/Fastfile || echo 0)
    echo -e "    - Found $LANES lanes"
else
    echo -e "  ${YELLOW}✗${NC} Fastfile not found"
fi

if [ -f "platforms/capacitor/fastlane/Appfile" ]; then
    echo -e "  ${GREEN}✓${NC} Appfile exists"
else
    echo -e "  ${YELLOW}✗${NC} Appfile not found"
fi

if [ -f "platforms/capacitor/fastlane/Matchfile" ]; then
    echo -e "  ${GREEN}✓${NC} Matchfile exists"
else
    echo -e "  ${YELLOW}✗${NC} Matchfile not found"
fi

# Check deployment scripts
echo ""
echo -e "${BLUE}Deployment Scripts:${NC}"
for script in deploy-testflight.sh deploy-playstore.sh deploy-mobile-ios.sh deploy-mobile-android.sh; do
    if [ -f "scripts/$script" ] || [ -f ".github/workflows/$script" ]; then
        echo -e "  ${GREEN}✓${NC} $script exists"
    else
        echo -e "  ${YELLOW}✗${NC} $script not found"
    fi
done

# Check GitHub workflows
echo ""
echo -e "${BLUE}GitHub Workflows:${NC}"
for workflow in deploy-mobile-ios.yml deploy-mobile-android.yml build-capacitor.yml; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "  ${GREEN}✓${NC} $workflow exists"
    else
        echo -e "  ${YELLOW}✗${NC} $workflow not found"
    fi
done

# Check signing documentation
echo ""
echo -e "${BLUE}Documentation:${NC}"
docs=(
    "platforms/capacitor/ios/SIGNING-SETUP.md"
    "platforms/capacitor/android/SIGNING-SETUP.md"
    "platforms/capacitor/DEPLOYMENT-GUIDE.md"
    "platforms/capacitor/ios/ExportOptions.plist.template"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✓${NC} $doc"
    else
        echo -e "  ${YELLOW}✗${NC} $doc not found"
    fi
done

# Check capacitor configuration
echo ""
echo -e "${BLUE}Capacitor Configuration:${NC}"
if [ -f "platforms/capacitor/capacitor.config.ts" ]; then
    echo -e "  ${GREEN}✓${NC} capacitor.config.ts exists"
    APP_ID=$(grep "appId:" platforms/capacitor/capacitor.config.ts | awk -F"'" '{print $2}' || echo "unknown")
    APP_NAME=$(grep "appName:" platforms/capacitor/capacitor.config.ts | awk -F"'" '{print $2}' || echo "unknown")
    echo -e "    - App ID: $APP_ID"
    echo -e "    - App Name: $APP_NAME"
fi

# Check Android build configuration
echo ""
echo -e "${BLUE}Android Build Configuration:${NC}"
if [ -f "platforms/capacitor/android/app/build.gradle" ]; then
    echo -e "  ${GREEN}✓${NC} app/build.gradle exists"

    # Extract version info
    if grep -q "versionCode" platforms/capacitor/android/app/build.gradle; then
        VERSION_CODE=$(grep "versionCode" platforms/capacitor/android/app/build.gradle | head -1 | awk '{print $2}')
        VERSION_NAME=$(grep "versionName" platforms/capacitor/android/app/build.gradle | head -1 | awk -F'"' '{print $2}')
        echo -e "    - Version Code: $VERSION_CODE"
        echo -e "    - Version Name: $VERSION_NAME"
    fi

    # Check for signing config
    if grep -q "signingConfigs" platforms/capacitor/android/app/build.gradle; then
        echo -e "  ${GREEN}✓${NC} Signing configuration present"
    else
        echo -e "  ${YELLOW}✗${NC} Signing configuration not found"
    fi

    # Check for build variants
    if grep -q "buildTypes" platforms/capacitor/android/app/build.gradle; then
        echo -e "  ${GREEN}✓${NC} Build types configured"
        echo -e "    - debug, release, beta variants"
    fi
fi

# Check iOS configuration
echo ""
echo -e "${BLUE}iOS Configuration:${NC}"
if [ -f "platforms/capacitor/ios/App/App/Info.plist" ]; then
    echo -e "  ${GREEN}✓${NC} Info.plist exists"

    if command -v /usr/libexec/PlistBuddy &> /dev/null; then
        VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" platforms/capacitor/ios/App/App/Info.plist 2>/dev/null || echo "unknown")
        BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" platforms/capacitor/ios/App/App/Info.plist 2>/dev/null || echo "unknown")
        echo -e "    - Version: $VERSION"
        echo -e "    - Build: $BUILD"
    fi
fi

if [ -f "platforms/capacitor/ios/App/App.xcworkspace" ]; then
    echo -e "  ${GREEN}✓${NC} Xcode workspace exists"
fi

# Check build scripts
echo ""
echo -e "${BLUE}Build Scripts:${NC}"
for script in build-ios.sh build-android.sh; do
    if [ -f "platforms/capacitor/scripts/$script" ]; then
        echo -e "  ${GREEN}✓${NC} $script exists"
        if [ -x "platforms/capacitor/scripts/$script" ]; then
            echo -e "    - Executable: yes"
        else
            echo -e "    ${YELLOW}- Executable: no${NC}"
        fi
    else
        echo -e "  ${YELLOW}✗${NC} $script not found"
    fi
done

# Check package.json version
echo ""
echo -e "${BLUE}Package Version:${NC}"
if [ -f "package.json" ]; then
    VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
    echo -e "  Version: $VERSION"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure signing credentials (see SIGNING-SETUP.md)"
echo "  2. Run: ./scripts/test-mobile-builds.sh --all"
echo "  3. Test builds with Fastlane"
echo "  4. Deploy to TestFlight/Play Store"
