#!/usr/bin/env bash
#
# Bump version in package.json and other files
# Usage: ./scripts/version-bump.sh <version>
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
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

if [ $# -ne 1 ]; then
    echo "Usage: $0 <version>"
    echo ""
    echo "Example: $0 1.2.3"
    exit 1
fi

NEW_VERSION="$1"

# Validate version format
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    log_error "Invalid version format: $NEW_VERSION"
    log_error "Expected format: X.Y.Z or X.Y.Z-prerelease"
    exit 1
fi

cd "$PROJECT_ROOT"

CURRENT_VERSION=$(node -p "require('./package.json').version")
log_info "Current version: $CURRENT_VERSION"
log_info "New version: $NEW_VERSION"

# Update package.json
log_info "Updating package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update Tauri config if exists
if [ -f "src-tauri/tauri.conf.json" ]; then
    log_info "Updating src-tauri/tauri.conf.json..."
    node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
if (config.package) config.package.version = '$NEW_VERSION';
if (config.version) config.version = '$NEW_VERSION';
fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(config, null, 2) + '\n');
"
fi

# Update Cargo.toml if exists
if [ -f "src-tauri/Cargo.toml" ]; then
    log_info "Updating src-tauri/Cargo.toml..."
    sed -i.bak "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml
    rm -f src-tauri/Cargo.toml.bak
fi

# Update iOS Info.plist if exists
if [ -f "ios/App/App/Info.plist" ]; then
    log_info "Updating iOS Info.plist..."
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" ios/App/App/Info.plist 2>/dev/null || true
fi

# Update Android build.gradle if exists
if [ -f "android/app/build.gradle" ]; then
    log_info "Updating Android build.gradle..."
    sed -i.bak "s/versionName \".*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
    rm -f android/app/build.gradle.bak
fi

# Update React Native package.json if exists
if [ -f "mobile/package.json" ]; then
    log_info "Updating mobile/package.json..."
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('mobile/package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('mobile/package.json', JSON.stringify(pkg, null, 2) + '\n');
"
fi

log_success "Version updated to $NEW_VERSION"
