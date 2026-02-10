#!/bin/bash
# Desktop Deployment Validation Script
# Validates that all components of the desktop deployment system are properly configured

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

log_check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -e "${BLUE}[CHECK ${TOTAL_CHECKS}]${NC} $1"
}

log_pass() {
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  echo -e "  ${GREEN}✓${NC} $1"
}

log_fail() {
  FAILED_CHECKS=$((FAILED_CHECKS + 1))
  echo -e "  ${RED}✗${NC} $1"
}

log_warning() {
  WARNING_CHECKS=$((WARNING_CHECKS + 1))
  echo -e "  ${YELLOW}⚠${NC} $1"
}

print_header() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

print_header "Desktop Deployment Validation"
echo "Validating desktop deployment system for nchat..."
echo ""

# Check 1: Deployment Scripts
print_header "Deployment Scripts"

log_check "Electron deployment script exists"
if [ -f "$PROJECT_ROOT/scripts/deploy-desktop-electron.sh" ]; then
  log_pass "Found: scripts/deploy-desktop-electron.sh"
  if [ -x "$PROJECT_ROOT/scripts/deploy-desktop-electron.sh" ]; then
    log_pass "Script is executable"
  else
    log_fail "Script is not executable"
  fi
else
  log_fail "Missing: scripts/deploy-desktop-electron.sh"
fi

log_check "Tauri deployment script exists"
if [ -f "$PROJECT_ROOT/scripts/deploy-desktop-tauri.sh" ]; then
  log_pass "Found: scripts/deploy-desktop-tauri.sh"
  if [ -x "$PROJECT_ROOT/scripts/deploy-desktop-tauri.sh" ]; then
    log_pass "Script is executable"
  else
    log_fail "Script is not executable"
  fi
else
  log_fail "Missing: scripts/deploy-desktop-tauri.sh"
fi

# Check 2: Electron Platform
print_header "Electron Platform"

log_check "Electron directory exists"
if [ -d "$PROJECT_ROOT/platforms/electron" ]; then
  log_pass "Found: platforms/electron/"
else
  log_fail "Missing: platforms/electron/"
fi

log_check "Electron main process files"
ELECTRON_MAIN_FILES=(
  "main/index.ts"
  "main/window.ts"
  "main/updates.ts"
  "main/tray.ts"
  "main/menu.ts"
  "main/notifications.ts"
  "main/deeplinks.ts"
  "main/ipc.ts"
  "main/autostart.ts"
  "main/shortcuts.ts"
  "main/store.ts"
)
for file in "${ELECTRON_MAIN_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/platforms/electron/$file" ]; then
    log_pass "$file"
  else
    log_fail "Missing: $file"
  fi
done

log_check "Electron configuration files"
ELECTRON_CONFIG_FILES=(
  "package.json"
  "electron-builder.json"
  "tsconfig.main.json"
  "tsconfig.preload.json"
)
for file in "${ELECTRON_CONFIG_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/platforms/electron/$file" ]; then
    log_pass "$file"
  else
    log_fail "Missing: $file"
  fi
done

log_check "Electron resources"
if [ -f "$PROJECT_ROOT/platforms/electron/resources/entitlements.mac.plist" ]; then
  log_pass "macOS entitlements file exists"
else
  log_fail "Missing: resources/entitlements.mac.plist"
fi

# Check 3: Tauri Platform
print_header "Tauri Platform"

log_check "Tauri directory exists"
if [ -d "$PROJECT_ROOT/platforms/tauri" ]; then
  log_pass "Found: platforms/tauri/"
else
  log_fail "Missing: platforms/tauri/"
fi

log_check "Tauri source files"
TAURI_SRC_FILES=(
  "src/main.rs"
  "src/lib.rs"
  "src/commands.rs"
  "src/menu.rs"
  "src/tray.rs"
  "src/notifications.rs"
  "src/autostart.rs"
  "src/deeplink.rs"
  "src/updater.rs"
  "src/shortcuts.rs"
)
for file in "${TAURI_SRC_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/platforms/tauri/$file" ]; then
    log_pass "$file"
  else
    log_fail "Missing: $file"
  fi
done

log_check "Tauri configuration files"
TAURI_CONFIG_FILES=(
  "Cargo.toml"
  "tauri.conf.json"
  "build.rs"
)
for file in "${TAURI_CONFIG_FILES[@]}"; do
  if [ -f "$PROJECT_ROOT/platforms/tauri/$file" ]; then
    log_pass "$file"
  else
    log_fail "Missing: $file"
  fi
done

# Check 4: Documentation
print_header "Documentation"

log_check "Desktop deployment guide"
if [ -f "$PROJECT_ROOT/docs/guides/deployment/desktop-deployment.md" ]; then
  log_pass "Found: docs/guides/deployment/desktop-deployment.md"
  word_count=$(wc -w < "$PROJECT_ROOT/docs/guides/deployment/desktop-deployment.md")
  log_pass "Document size: $word_count words"
else
  log_fail "Missing: desktop-deployment.md"
fi

log_check "Code signing guide"
if [ -f "$PROJECT_ROOT/docs/guides/deployment/code-signing.md" ]; then
  log_pass "Found: docs/guides/deployment/code-signing.md"
  word_count=$(wc -w < "$PROJECT_ROOT/docs/guides/deployment/code-signing.md")
  log_pass "Document size: $word_count words"
else
  log_fail "Missing: code-signing.md"
fi

log_check "Scripts documentation"
if [ -f "$PROJECT_ROOT/scripts/README-DESKTOP-DEPLOYMENT.md" ]; then
  log_pass "Found: scripts/README-DESKTOP-DEPLOYMENT.md"
else
  log_fail "Missing: README-DESKTOP-DEPLOYMENT.md"
fi

log_check "Implementation summary"
if [ -f "$PROJECT_ROOT/docs/DESKTOP-DEPLOYMENT-IMPLEMENTATION.md" ]; then
  log_pass "Found: docs/DESKTOP-DEPLOYMENT-IMPLEMENTATION.md"
else
  log_fail "Missing: DESKTOP-DEPLOYMENT-IMPLEMENTATION.md"
fi

# Check 5: Admin UI Component
print_header "Admin UI Component"

log_check "Desktop deployment helper component"
if [ -f "$PROJECT_ROOT/src/components/admin/deployment/DesktopDeployHelper.tsx" ]; then
  log_pass "Found: DesktopDeployHelper.tsx"
  line_count=$(wc -l < "$PROJECT_ROOT/src/components/admin/deployment/DesktopDeployHelper.tsx")
  log_pass "Component size: $line_count lines"
else
  log_fail "Missing: DesktopDeployHelper.tsx"
fi

# Check 6: Dependencies
print_header "System Dependencies"

log_check "Node.js"
if command -v node &> /dev/null; then
  node_version=$(node --version)
  log_pass "Node.js installed: $node_version"
else
  log_fail "Node.js not found"
fi

log_check "npm"
if command -v npm &> /dev/null; then
  npm_version=$(npm --version)
  log_pass "npm installed: $npm_version"
else
  log_fail "npm not found"
fi

log_check "Git"
if command -v git &> /dev/null; then
  git_version=$(git --version)
  log_pass "Git installed: $git_version"
else
  log_fail "Git not found"
fi

log_check "Rust (Tauri)"
if command -v rustc &> /dev/null; then
  rust_version=$(rustc --version)
  log_pass "Rust installed: $rust_version"
else
  log_warning "Rust not found (required for Tauri)"
fi

log_check "Cargo (Tauri)"
if command -v cargo &> /dev/null; then
  cargo_version=$(cargo --version)
  log_pass "Cargo installed: $cargo_version"
else
  log_warning "Cargo not found (required for Tauri)"
fi

log_check "Tauri CLI"
if cargo install --list 2>/dev/null | grep -q "^tauri-cli"; then
  log_pass "Tauri CLI installed"
else
  log_warning "Tauri CLI not found (install with: cargo install tauri-cli)"
fi

# Check 7: Code Signing (Optional)
print_header "Code Signing Setup (Optional)"

log_check "macOS code signing"
if [[ "$OSTYPE" == "darwin"* ]]; then
  if command -v codesign &> /dev/null; then
    log_pass "codesign available"

    # Check for signing identities
    identities=$(security find-identity -v -p codesigning 2>/dev/null | grep "Developer ID" | wc -l)
    if [ "$identities" -gt 0 ]; then
      log_pass "Found $identities Developer ID certificate(s)"
    else
      log_warning "No Developer ID certificates found"
    fi
  else
    log_warning "codesign not available"
  fi

  # Check for environment variables
  if [ -n "$APPLE_ID" ]; then
    log_pass "APPLE_ID environment variable set"
  else
    log_warning "APPLE_ID not set (required for notarization)"
  fi
else
  log_warning "Not running on macOS - skipping macOS signing checks"
fi

log_check "Windows code signing"
if [ -n "$WIN_CSC_LINK" ]; then
  log_pass "WIN_CSC_LINK environment variable set"
else
  log_warning "WIN_CSC_LINK not set (required for Windows signing)"
fi

# Check 8: Project Files
print_header "Project Files"

log_check "Main package.json"
if [ -f "$PROJECT_ROOT/package.json" ]; then
  log_pass "Found: package.json"

  # Check version
  if command -v node &> /dev/null; then
    version=$(node -p "require('$PROJECT_ROOT/package.json').version")
    log_pass "Project version: $version"
  fi
else
  log_fail "Missing: package.json"
fi

log_check "Next.js configuration"
if [ -f "$PROJECT_ROOT/next.config.js" ] || [ -f "$PROJECT_ROOT/next.config.mjs" ]; then
  log_pass "Next.js config found"
else
  log_warning "Next.js config not found"
fi

log_check "TypeScript configuration"
if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
  log_pass "TypeScript config found"
else
  log_warning "TypeScript config not found"
fi

# Summary
print_header "Validation Summary"

echo "Total Checks:   $TOTAL_CHECKS"
echo -e "${GREEN}Passed:${NC}         $PASSED_CHECKS"
echo -e "${RED}Failed:${NC}         $FAILED_CHECKS"
echo -e "${YELLOW}Warnings:${NC}       $WARNING_CHECKS"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}✓ All critical checks passed!${NC}"
  echo ""
  echo "Desktop deployment system is properly configured."
  echo "You can now build desktop applications:"
  echo ""
  echo "  Electron: ./scripts/deploy-desktop-electron.sh"
  echo "  Tauri:    ./scripts/deploy-desktop-tauri.sh"
  echo ""
  if [ $WARNING_CHECKS -gt 0 ]; then
    echo -e "${YELLOW}Note:${NC} Some optional dependencies are missing."
    echo "Check warnings above for details."
  fi
  exit 0
else
  echo -e "${RED}✗ Validation failed!${NC}"
  echo ""
  echo "Please fix the failed checks above before deploying."
  exit 1
fi
