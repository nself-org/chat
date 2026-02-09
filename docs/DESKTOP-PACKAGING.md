# Desktop Packaging Guide

Complete guide for packaging and distributing nchat desktop applications using Electron and Tauri.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Platform-Specific Requirements](#platform-specific-requirements)
4. [Build Commands](#build-commands)
5. [Code Signing](#code-signing)
6. [Auto-Updates](#auto-updates)
7. [Testing](#testing)
8. [Distribution](#distribution)
9. [Troubleshooting](#troubleshooting)

## Overview

nchat supports two desktop runtimes:

- **Electron**: Cross-platform using Chromium and Node.js
- **Tauri**: Lightweight using system WebView and Rust

### Supported Platforms

| Platform | Electron | Tauri | Formats |
|----------|----------|-------|---------|
| macOS    | ✅       | ✅    | .dmg, .zip, .app |
| Windows  | ✅       | ✅    | .exe (NSIS), .msi, portable |
| Linux    | ✅       | ✅    | .AppImage, .deb, .rpm, .tar.gz |

## Prerequisites

### All Platforms

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Git

### macOS

```bash
# Xcode Command Line Tools
xcode-select --install

# For Tauri
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Windows

```bash
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# For Tauri
# Install Rust from: https://rustup.rs/
```

### Linux (Ubuntu/Debian)

```bash
# For Electron
sudo apt-get install -y \
  libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 \
  xdg-utils libatspi2.0-0 libuuid1 libsecret-1-0

# For Tauri
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libssl-dev libgtk-3-dev

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Platform-Specific Requirements

### macOS Code Signing

Required for distribution:

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate**
   ```bash
   # Request certificate in Xcode or Apple Developer portal
   # Export as .p12 file with password
   ```

3. **For Notarization** (highly recommended)
   ```bash
   # Create app-specific password at appleid.apple.com
   # Get Team ID from Apple Developer portal
   ```

### Windows Code Signing

Required for Windows SmartScreen reputation:

1. **Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, or other CA
   - Export as .pfx file with password
   - Extended Validation (EV) certificate recommended

### Linux

- Optional GPG signing for package repositories
- No signature required for basic distribution

## Build Commands

### Quick Start

```bash
# Build for current platform (unsigned)
pnpm build:desktop

# Build with code signing
pnpm build:desktop:signed

# Build with code signing and notarization (macOS)
pnpm build:desktop:notarized

# Build specific runtime
pnpm build:desktop --runtime electron
pnpm build:desktop --runtime tauri

# Build specific platform
pnpm build:desktop --platform macos
pnpm build:desktop --platform windows
pnpm build:desktop --platform linux
```

### Advanced Options

```bash
# Build with all options
./scripts/build-desktop.sh \
  --runtime all \
  --platform macos \
  --sign \
  --notarize \
  --release \
  --clean
```

### Electron-Specific

```bash
cd platforms/electron

# Compile TypeScript
pnpm build:all

# Package for current platform
pnpm dist

# Package for specific platform
pnpm dist:mac
pnpm dist:win
pnpm dist:linux

# Package for all platforms (macOS host recommended)
pnpm dist:all
```

### Tauri-Specific

```bash
# Build for current platform
pnpm tauri build

# Build with debug symbols
pnpm tauri build --debug

# Build for specific target (macOS)
pnpm tauri build --target universal-apple-darwin
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target aarch64-apple-darwin

# Build for specific target (Windows)
pnpm tauri build --target x86_64-pc-windows-msvc

# Build for specific target (Linux)
pnpm tauri build --target x86_64-unknown-linux-gnu
```

## Code Signing

### Check Signing Credentials

```bash
# Check all platforms
pnpm sign:check

# Check specific platform
./scripts/sign-desktop.sh --check --platform macos
./scripts/sign-desktop.sh --check --platform windows
```

### Generate Signing Templates

```bash
pnpm sign:generate
```

This creates:
- `platforms/electron/signing/.env.signing.example`
- `platforms/tauri/signing/.env.signing.example`
- `platforms/*/signing/README.md`

### Environment Variables

#### macOS (Electron)

```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your-certificate-password
export APPLE_ID=your-apple-id@example.com
export APPLE_PASSWORD=your-app-specific-password
export APPLE_TEAM_ID=YOUR10CHARTEAMID
```

#### macOS (Tauri)

```bash
export APPLE_CERTIFICATE=/path/to/certificate.p12
export APPLE_CERTIFICATE_PASSWORD=your-certificate-password
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID=your-apple-id@example.com
export APPLE_PASSWORD=your-app-specific-password
export APPLE_TEAM_ID=YOUR10CHARTEAMID
```

#### Windows (Both)

```bash
export WIN_CSC_LINK=/path/to/certificate.pfx
export WIN_CSC_KEY_PASSWORD=your-certificate-password
```

#### Tauri Auto-Update Signing

```bash
# Generate key pair
pnpm tauri signer generate

# Set private key
export TAURI_SIGNING_PRIVATE_KEY=your-base64-private-key
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=your-key-password

# Add public key to platforms/tauri/tauri.conf.json
# under plugins.updater.pubkey
```

### Verify Signatures

#### macOS

```bash
# Verify code signature
codesign -vvv --deep --strict /path/to/nchat.app

# Verify notarization
spctl -a -vvv -t install /path/to/nchat.app

# Check entitlements
codesign -d --entitlements - /path/to/nchat.app
```

#### Windows

```bash
# Verify signature (requires Windows SDK)
signtool verify /pa /v nchat-Setup.exe

# View signature details
signtool verify /pa /v /d nchat-Setup.exe
```

#### Linux

```bash
# Verify GPG signature (if signed)
gpg --verify package.deb.asc package.deb
```

## Auto-Updates

### Electron (electron-updater)

Configuration in `platforms/electron/electron-builder.yml`:

```yaml
publish:
  - provider: github
    owner: nself
    repo: nself-chat
    releaseType: release
```

Update check in main process:

```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

### Tauri (tauri-plugin-updater)

Configuration in `platforms/tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://releases.nself.org/nchat/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

## Testing

### Package Structure Testing

```bash
# Test package structure and metadata
pnpm test:packaging --runtime electron --package dist-electron/nchat-1.0.0.dmg
pnpm test:packaging --runtime tauri --package platforms/tauri/target/release/bundle/dmg/nchat.dmg
```

### Manual Testing

#### macOS

```bash
# Install from DMG
open dist-electron/nchat-1.0.0.dmg
# Drag to Applications

# Test from Applications folder
open /Applications/nchat.app

# Test protocol handler
open nchat://test

# Check logs
tail -f ~/Library/Logs/nchat/main.log
```

#### Windows

```bash
# Run installer
dist-electron/nchat-Setup-1.0.0.exe

# Test from Start Menu
# Search for "nchat"

# Test protocol handler
start nchat://test

# Check logs
type %APPDATA%\nchat\logs\main.log
```

#### Linux

```bash
# AppImage
chmod +x dist-electron/nchat-1.0.0.AppImage
./dist-electron/nchat-1.0.0.AppImage

# Debian
sudo dpkg -i dist-electron/nchat_1.0.0_amd64.deb

# RPM
sudo rpm -i dist-electron/nchat-1.0.0.x86_64.rpm

# Test protocol handler
xdg-open nchat://test

# Check logs
tail -f ~/.config/nchat/logs/main.log
```

### Automated Testing

```bash
# Run packaging tests
pnpm test:packaging

# CI/CD testing via GitHub Actions
# See .github/workflows/build-electron.yml
# See .github/workflows/build-tauri.yml
```

## Distribution

### GitHub Releases

```bash
# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Upload artifacts via GitHub Actions
# Workflows automatically create draft releases
```

### Direct Distribution

```bash
# Upload to S3
aws s3 cp dist-electron/ s3://releases.nself.org/nchat/ --recursive

# Upload to CDN
scp dist-electron/* user@cdn.nself.org:/var/www/releases/nchat/
```

### Mac App Store (Future)

Requires:
- Mac App Store distribution certificate
- App-specific provisioning profile
- Sandboxed entitlements
- App Store Connect submission

### Microsoft Store (Future)

Requires:
- Microsoft Store developer account
- App package (.msix)
- Store listing

### Snap Store / Flathub (Future)

Requires:
- Snapcraft/Flatpak configuration
- Store account
- Package submission

## Build Artifacts

### Output Locations

```
# Electron
dist-electron/
├── nchat-1.0.0-mac-x64.dmg          # macOS DMG
├── nchat-1.0.0-mac-arm64.dmg        # macOS ARM DMG
├── nchat-1.0.0-mac.zip              # macOS ZIP
├── nchat-Setup-1.0.0.exe            # Windows installer
├── nchat-1.0.0-Portable.exe         # Windows portable
├── nchat-1.0.0-x64.AppImage         # Linux AppImage
├── nchat_1.0.0_amd64.deb            # Debian package
└── nchat-1.0.0.x86_64.rpm           # RPM package

# Tauri
platforms/tauri/target/
├── universal-apple-darwin/release/bundle/
│   ├── dmg/nchat.dmg                # macOS DMG
│   └── macos/nchat.app              # macOS app bundle
├── release/bundle/
│   ├── msi/nchat.msi                # Windows MSI
│   ├── nsis/nchat.exe               # Windows NSIS
│   ├── appimage/nchat.AppImage      # Linux AppImage
│   ├── deb/nchat.deb                # Debian package
│   └── rpm/nchat.rpm                # RPM package
```

### Typical Sizes

| Platform | Electron | Tauri |
|----------|----------|-------|
| macOS    | ~150MB   | ~15MB |
| Windows  | ~120MB   | ~10MB |
| Linux    | ~130MB   | ~12MB |

## Troubleshooting

### macOS: "App is damaged and can't be opened"

**Cause**: Gatekeeper blocking unsigned or improperly signed app

**Solution**:
```bash
# Remove quarantine attribute
xattr -cr /Applications/nchat.app

# Or allow in System Settings > Security & Privacy
```

### macOS: Notarization fails

**Causes**:
- Invalid signing certificate
- Missing entitlements
- Incorrect bundle structure

**Debug**:
```bash
# Check notarization status
xcrun altool --notarization-info REQUEST_UUID \
  --username "your@email.com" \
  --password "app-specific-password"

# Check notarization log for errors
```

### Windows: SmartScreen warning

**Cause**: Unsigned app or certificate without reputation

**Solutions**:
- Use Extended Validation (EV) certificate (instant reputation)
- Build download reputation over time
- Sign with standard certificate and inform users

### Linux: AppImage won't execute

**Cause**: Missing executable permission or FUSE

**Solution**:
```bash
# Add executable permission
chmod +x nchat.AppImage

# Install FUSE (if needed)
sudo apt-get install fuse

# Or extract and run
./nchat.AppImage --appimage-extract
./squashfs-root/AppRun
```

### Build fails: Missing dependencies

**Electron**:
```bash
# Reinstall dependencies
cd platforms/electron
rm -rf node_modules
pnpm install
```

**Tauri**:
```bash
# Update Rust
rustup update

# Clear Cargo cache
cargo clean

# Rebuild
pnpm tauri build
```

### Code signing fails: Invalid certificate

**Check certificate validity**:
```bash
# macOS
security find-identity -v -p codesigning

# Windows
certutil -dump certificate.pfx
```

### Cross-platform builds fail

**Solution**: Use platform-specific runners
- macOS: Can build for macOS, Windows (with wine), Linux (with docker)
- Windows: Can only build for Windows
- Linux: Can only build for Linux

**Best practice**: Use CI/CD with matrix builds

## CI/CD Integration

### GitHub Actions Secrets

Add these to your repository secrets:

```
# macOS
CSC_LINK (base64-encoded .p12 file)
CSC_KEY_PASSWORD
APPLE_ID
APPLE_PASSWORD (app-specific password)
APPLE_TEAM_ID

# Windows
WIN_CSC_LINK (base64-encoded .pfx file)
WIN_CSC_KEY_PASSWORD

# Tauri
TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

### Workflow Dispatch

```bash
# Trigger via GitHub CLI
gh workflow run build-electron.yml \
  -f platform=macos \
  -f sign=true \
  -f release=true
```

## Additional Resources

- [Electron Builder Docs](https://www.electron.build/)
- [Tauri Docs](https://tauri.app/v1/guides/)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
