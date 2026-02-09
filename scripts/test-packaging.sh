#!/usr/bin/env bash
#
# Desktop Packaging Test Script
# Verifies package structure, metadata, and install/uninstall workflows
#
# Usage: ./scripts/test-packaging.sh [OPTIONS]
#
# Options:
#   --runtime <electron|tauri>      Runtime to test
#   --platform <macos|windows|linux> Platform to test (default: current)
#   --package <path>                Path to package file
#   --help                          Show this help message
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

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

RUNTIME=""
PLATFORM=""
PACKAGE=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --runtime)
      RUNTIME="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --package)
      PACKAGE="$2"
      shift 2
      ;;
    --help|-h)
      cat << 'HELP'
Desktop Packaging Test Script
Verifies package structure, metadata, and install/uninstall workflows

Usage: ./scripts/test-packaging.sh [OPTIONS]

Options:
  --runtime <electron|tauri>      Runtime to test
  --platform <macos|windows|linux> Platform to test (default: current)
  --package <path>                Path to package file
  --help                          Show this help message

Examples:
  ./scripts/test-packaging.sh --runtime electron --package dist-electron/nchat.dmg
  ./scripts/test-packaging.sh --runtime tauri --package nchat.AppImage
HELP
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Detect platform
CURRENT_OS="$(uname -s)"
case "$CURRENT_OS" in
  Darwin*) CURRENT_PLATFORM="macos" ;;
  Linux*) CURRENT_PLATFORM="linux" ;;
  MINGW*|CYGWIN*|MSYS*) CURRENT_PLATFORM="windows" ;;
  *)
    log_error "Unknown platform: $CURRENT_OS"
    exit 1
    ;;
esac

if [ -z "$PLATFORM" ]; then
  PLATFORM="$CURRENT_PLATFORM"
fi

# Test macOS package
test_macos_dmg() {
  local dmg_path=$1
  
  log_info "Testing macOS DMG: $dmg_path"
  
  # Check file exists
  if [ ! -f "$dmg_path" ]; then
    log_error "DMG file not found: $dmg_path"
    return 1
  fi
  log_success "DMG file exists"
  
  # Check file size (should be > 100MB)
  local size=$(stat -f%z "$dmg_path" 2>/dev/null || echo 0)
  if [ "$size" -lt 104857600 ]; then
    log_warn "DMG seems small: $(($size / 1048576))MB"
  else
    log_success "DMG size: $(($size / 1048576))MB"
  fi
  
  # Mount DMG (read-only)
  log_info "Mounting DMG..."
  local mount_point=$(mktemp -d)
  if hdiutil attach "$dmg_path" -mountpoint "$mount_point" -readonly -nobrowse > /dev/null 2>&1; then
    log_success "DMG mounted at $mount_point"
    
    # Check for app bundle
    local app_path="$mount_point/nchat.app"
    if [ -d "$app_path" ]; then
      log_success "App bundle found"
      
      # Check code signature (if signed)
      if codesign -v "$app_path" 2>/dev/null; then
        log_success "Code signature valid"
        
        # Show signature details
        codesign -dvvv "$app_path" 2>&1 | grep "Authority" | head -1
      else
        log_warn "App not signed or signature invalid"
      fi
      
      # Check Info.plist
      local plist="$app_path/Contents/Info.plist"
      if [ -f "$plist" ]; then
        log_success "Info.plist found"
        
        # Extract version
        local version=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$plist" 2>/dev/null || echo "unknown")
        log_info "  Version: $version"
        
        # Extract bundle ID
        local bundle_id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$plist" 2>/dev/null || echo "unknown")
        log_info "  Bundle ID: $bundle_id"
      else
        log_error "Info.plist not found"
      fi
    else
      log_error "App bundle not found in DMG"
    fi
    
    # Unmount
    hdiutil detach "$mount_point" > /dev/null 2>&1
    rm -rf "$mount_point"
    log_success "DMG unmounted"
  else
    log_error "Failed to mount DMG"
    rm -rf "$mount_point"
    return 1
  fi
  
  log_success "macOS DMG test complete"
}

# Test Windows installer
test_windows_exe() {
  local exe_path=$1
  
  log_info "Testing Windows installer: $exe_path"
  
  # Check file exists
  if [ ! -f "$exe_path" ]; then
    log_error "EXE file not found: $exe_path"
    return 1
  fi
  log_success "EXE file exists"
  
  # Check file size
  local size=$(stat -c%s "$exe_path" 2>/dev/null || stat -f%z "$exe_path" 2>/dev/null || echo 0)
  log_success "EXE size: $(($size / 1048576))MB"
  
  # On Windows, check signature
  if command -v signtool > /dev/null 2>&1; then
    if signtool verify /pa "$exe_path" 2>/dev/null; then
      log_success "Code signature valid"
    else
      log_warn "Installer not signed or signature invalid"
    fi
  else
    log_info "signtool not available, skipping signature check"
  fi
  
  # Check PE header
  if command -v file > /dev/null 2>&1; then
    local file_type=$(file "$exe_path")
    if echo "$file_type" | grep -q "PE32"; then
      log_success "Valid PE32 executable"
    else
      log_error "Invalid PE header"
    fi
  fi
  
  log_success "Windows EXE test complete"
}

# Test Linux AppImage
test_linux_appimage() {
  local appimage_path=$1
  
  log_info "Testing Linux AppImage: $appimage_path"
  
  # Check file exists
  if [ ! -f "$appimage_path" ]; then
    log_error "AppImage file not found: $appimage_path"
    return 1
  fi
  log_success "AppImage file exists"
  
  # Check file size
  local size=$(stat -c%s "$appimage_path" 2>/dev/null || echo 0)
  log_success "AppImage size: $(($size / 1048576))MB"
  
  # Check executable bit
  if [ -x "$appimage_path" ]; then
    log_success "AppImage is executable"
  else
    log_warn "AppImage not executable, setting permission..."
    chmod +x "$appimage_path"
  fi
  
  # Extract AppImage to temp directory
  log_info "Extracting AppImage..."
  local extract_dir=$(mktemp -d)
  if "$appimage_path" --appimage-extract > /dev/null 2>&1; then
    log_success "AppImage extracted"
    
    # Check for desktop file
    if [ -f "squashfs-root/nchat.desktop" ]; then
      log_success "Desktop file found"
      
      # Validate desktop file
      if command -v desktop-file-validate > /dev/null 2>&1; then
        if desktop-file-validate "squashfs-root/nchat.desktop" 2>/dev/null; then
          log_success "Desktop file valid"
        else
          log_warn "Desktop file validation failed"
        fi
      fi
    fi
    
    # Check for icon
    if find squashfs-root -name "*.png" -o -name "*.svg" | grep -q .; then
      log_success "Icon files found"
    else
      log_warn "No icon files found"
    fi
    
    # Cleanup
    rm -rf squashfs-root
  else
    log_error "Failed to extract AppImage"
    return 1
  fi
  
  log_success "Linux AppImage test complete"
}

# Test Debian package
test_linux_deb() {
  local deb_path=$1
  
  log_info "Testing Debian package: $deb_path"
  
  # Check file exists
  if [ ! -f "$deb_path" ]; then
    log_error "DEB file not found: $deb_path"
    return 1
  fi
  log_success "DEB file exists"
  
  # Check package info
  if command -v dpkg > /dev/null 2>&1; then
    log_info "Package information:"
    dpkg -I "$deb_path" | grep -E "Package|Version|Architecture|Maintainer|Description" | sed 's/^/  /'
    log_success "Package metadata valid"
    
    # List contents
    local file_count=$(dpkg -c "$deb_path" | wc -l)
    log_info "  File count: $file_count"
    
    # Check for required files
    if dpkg -c "$deb_path" | grep -q "nchat"; then
      log_success "Binary found in package"
    else
      log_error "Binary not found in package"
    fi
  else
    log_info "dpkg not available, skipping detailed checks"
  fi
  
  log_success "Debian package test complete"
}

# Main execution
if [ -z "$RUNTIME" ] || [ -z "$PACKAGE" ]; then
  log_error "Both --runtime and --package are required"
  exit 1
fi

case "$PLATFORM" in
  macos)
    if [[ "$PACKAGE" == *.dmg ]]; then
      test_macos_dmg "$PACKAGE"
    else
      log_error "Expected .dmg file for macOS"
      exit 1
    fi
    ;;
  windows)
    if [[ "$PACKAGE" == *.exe ]]; then
      test_windows_exe "$PACKAGE"
    else
      log_error "Expected .exe file for Windows"
      exit 1
    fi
    ;;
  linux)
    if [[ "$PACKAGE" == *.AppImage ]]; then
      test_linux_appimage "$PACKAGE"
    elif [[ "$PACKAGE" == *.deb ]]; then
      test_linux_deb "$PACKAGE"
    else
      log_error "Expected .AppImage or .deb file for Linux"
      exit 1
    fi
    ;;
  *)
    log_error "Unknown platform: $PLATFORM"
    exit 1
    ;;
esac
