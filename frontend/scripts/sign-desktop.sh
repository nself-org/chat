#!/usr/bin/env bash
#
# Code Signing Configuration Script
# Generates signing configuration templates for desktop builds
#
# Usage: ./scripts/sign-desktop.sh [OPTIONS]
#
# Options:
#   --platform <macos|windows|linux>  Target platform
#   --check                           Check signing credentials
#   --generate                        Generate signing key templates
#   --help                            Show this help message
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
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PLATFORM="all"
CHECK=false
GENERATE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --check)
      CHECK=true
      shift
      ;;
    --generate)
      GENERATE=true
      shift
      ;;
    --help|-h)
      cat << 'HELP'
Code Signing Configuration Script
Generates signing configuration templates for desktop builds

Usage: ./scripts/sign-desktop.sh [OPTIONS]

Options:
  --platform <macos|windows|linux>  Target platform
  --check                           Check signing credentials
  --generate                        Generate signing key templates
  --help                            Show this help message

Examples:
  ./scripts/sign-desktop.sh --check --platform all
  ./scripts/sign-desktop.sh --generate
HELP
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check macOS signing credentials
check_macos() {
  log_info "Checking macOS signing credentials..."
  
  local missing=0
  
  # Code signing
  if [ -z "${CSC_LINK:-}" ]; then
    log_warn "  CSC_LINK not set (required for code signing)"
    missing=$((missing + 1))
  else
    log_success "  CSC_LINK: Set"
  fi
  
  if [ -z "${CSC_KEY_PASSWORD:-}" ]; then
    log_warn "  CSC_KEY_PASSWORD not set (required for code signing)"
    missing=$((missing + 1))
  else
    log_success "  CSC_KEY_PASSWORD: Set"
  fi
  
  # Notarization (optional)
  if [ -z "${APPLE_ID:-}" ]; then
    log_warn "  APPLE_ID not set (required for notarization)"
  else
    log_success "  APPLE_ID: ${APPLE_ID}"
  fi
  
  if [ -z "${APPLE_PASSWORD:-}" ]; then
    log_warn "  APPLE_PASSWORD not set (required for notarization)"
  else
    log_success "  APPLE_PASSWORD: Set"
  fi
  
  if [ -z "${APPLE_TEAM_ID:-}" ]; then
    log_warn "  APPLE_TEAM_ID not set (required for notarization)"
  else
    log_success "  APPLE_TEAM_ID: ${APPLE_TEAM_ID}"
  fi
  
  # Tauri signing
  if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]; then
    log_warn "  TAURI_SIGNING_PRIVATE_KEY not set (required for Tauri updates)"
  else
    log_success "  TAURI_SIGNING_PRIVATE_KEY: Set"
  fi
  
  if [ "$missing" -gt 0 ]; then
    log_error "Missing $missing required credentials for macOS code signing"
    return 1
  else
    log_success "All macOS signing credentials configured"
    return 0
  fi
}

# Check Windows signing credentials
check_windows() {
  log_info "Checking Windows signing credentials..."
  
  local missing=0
  
  if [ -z "${WIN_CSC_LINK:-}" ] && [ -z "${CSC_LINK:-}" ]; then
    log_warn "  WIN_CSC_LINK/CSC_LINK not set (required for code signing)"
    missing=$((missing + 1))
  else
    log_success "  WIN_CSC_LINK: Set"
  fi
  
  if [ -z "${WIN_CSC_KEY_PASSWORD:-}" ] && [ -z "${CSC_KEY_PASSWORD:-}" ]; then
    log_warn "  WIN_CSC_KEY_PASSWORD/CSC_KEY_PASSWORD not set (required for code signing)"
    missing=$((missing + 1))
  else
    log_success "  WIN_CSC_KEY_PASSWORD: Set"
  fi
  
  if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]; then
    log_warn "  TAURI_SIGNING_PRIVATE_KEY not set (required for Tauri updates)"
  else
    log_success "  TAURI_SIGNING_PRIVATE_KEY: Set"
  fi
  
  if [ "$missing" -gt 0 ]; then
    log_error "Missing $missing required credentials for Windows code signing"
    return 1
  else
    log_success "All Windows signing credentials configured"
    return 0
  fi
}

# Check Linux signing credentials
check_linux() {
  log_info "Checking Linux signing credentials..."
  
  # Linux packages can be unsigned or signed with GPG
  if [ -z "${GPG_PRIVATE_KEY:-}" ]; then
    log_warn "  GPG_PRIVATE_KEY not set (optional for package signing)"
  else
    log_success "  GPG_PRIVATE_KEY: Set"
  fi
  
  if [ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" ]; then
    log_warn "  TAURI_SIGNING_PRIVATE_KEY not set (required for Tauri updates)"
  else
    log_success "  TAURI_SIGNING_PRIVATE_KEY: Set"
  fi
  
  log_success "Linux signing credentials configured"
  return 0
}

# Generate signing templates
generate_templates() {
  log_info "Generating signing credential templates..."
  
  mkdir -p "$PROJECT_ROOT/platforms/electron/signing"
  mkdir -p "$PROJECT_ROOT/platforms/tauri/signing"
  
  # Create .env.signing template
  cat > "$PROJECT_ROOT/platforms/electron/signing/.env.signing.example" << 'TEMPLATE'
# Electron Code Signing Credentials
# Copy this file to .env.signing and fill in your credentials
# DO NOT commit .env.signing to version control!

# macOS Code Signing
CSC_LINK=/path/to/certificate.p12
CSC_KEY_PASSWORD=your-certificate-password

# macOS Notarization
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=your-app-specific-password
APPLE_TEAM_ID=YOUR10CHARTEAMID

# Windows Code Signing
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your-certificate-password

# Tauri Update Signing
TAURI_SIGNING_PRIVATE_KEY=your-base64-encoded-private-key
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your-key-password

# Optional: GPG signing for Linux packages
GPG_PRIVATE_KEY=your-gpg-private-key
GPG_PASSPHRASE=your-gpg-passphrase
TEMPLATE
  
  # Create signing documentation
  cat > "$PROJECT_ROOT/platforms/electron/signing/README.md" << 'DOC'
# Desktop Application Signing

This directory contains templates and documentation for code signing desktop applications.

## Security Notice

**NEVER commit signing credentials to version control!**

All `.env.signing` files are gitignored. Store credentials securely in:
- Local `.env.signing` files (for development)
- GitHub Secrets (for CI/CD)
- Secure credential management systems

## macOS Signing

### Required:
1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate** 
   - Download from Apple Developer portal
   - Export as .p12 file with password
   - Set `CSC_LINK` to .p12 file path
   - Set `CSC_KEY_PASSWORD` to certificate password

### Notarization (Recommended):
1. **App-Specific Password**
   - Generate at appleid.apple.com
   - Set `APPLE_ID` to your Apple ID email
   - Set `APPLE_PASSWORD` to app-specific password
   - Set `APPLE_TEAM_ID` to your 10-character team ID

### Commands:
```bash
# Build and sign
pnpm build:desktop --platform macos --sign

# Build, sign, and notarize
pnpm build:desktop --platform macos --sign --notarize
```

## Windows Signing

### Required:
1. **Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, etc.
   - Export as .pfx file with password
   - Set `WIN_CSC_LINK` to .pfx file path
   - Set `WIN_CSC_KEY_PASSWORD` to certificate password

### Commands:
```bash
# Build and sign
pnpm build:desktop --platform windows --sign
```

## Linux Signing

### Optional (GPG):
Linux packages can be unsigned or signed with GPG.

```bash
# Generate GPG key
gpg --full-generate-key

# Export private key
gpg --export-secret-keys -a "Your Name" > private.key

# Sign packages
debsign -k YOUR_KEY_ID package.deb
rpmsign --addsign package.rpm
```

## Tauri Auto-Update Signing

Tauri requires signing for auto-updates:

```bash
# Generate signing key pair
pnpm tauri signer generate

# This outputs:
# - Private key (store in TAURI_SIGNING_PRIVATE_KEY)
# - Public key (add to tauri.conf.json updater.pubkey)
```

## CI/CD Setup

Add these secrets to your CI/CD platform:

### GitHub Actions:
```yaml
secrets:
  CSC_LINK: ${{ secrets.CSC_LINK }}
  CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
  WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
  WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```

## Testing Signatures

### macOS:
```bash
# Verify code signature
codesign -vvv --deep --strict /path/to/nchat.app

# Verify notarization
spctl -a -vvv -t install /path/to/nchat.app
```

### Windows:
```bash
# Verify signature
signtool verify /pa /v nchat-Setup.exe
```

## Troubleshooting

### macOS: "App is damaged"
- Notarization failed or not completed
- Run: `xattr -cr /path/to/nchat.app`

### Windows: "Unknown publisher"
- Certificate not trusted
- Use Extended Validation (EV) certificate

### Builds work locally but fail in CI
- Check that all secrets are properly set
- Verify certificate formats (base64 encoding may be needed)
DOC
  
  log_success "Templates generated in platforms/*/signing/"
  log_info "  - .env.signing.example (credential template)"
  log_info "  - README.md (signing documentation)"
}

# Main execution
if [ "$CHECK" = true ]; then
  case "$PLATFORM" in
    macos)
      check_macos
      ;;
    windows)
      check_windows
      ;;
    linux)
      check_linux
      ;;
    all)
      echo ""
      check_macos || true
      echo ""
      check_windows || true
      echo ""
      check_linux || true
      ;;
    *)
      log_error "Unknown platform: $PLATFORM"
      exit 1
      ;;
  esac
fi

if [ "$GENERATE" = true ]; then
  generate_templates
fi

if [ "$CHECK" = false ] && [ "$GENERATE" = false ]; then
  log_error "No action specified. Use --check or --generate"
  exit 1
fi
