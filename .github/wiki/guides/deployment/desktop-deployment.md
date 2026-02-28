# Desktop Deployment Guide

Comprehensive guide for building, signing, and deploying nchat desktop applications using Electron and Tauri.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Electron Deployment](#electron-deployment)
- [Tauri Deployment](#tauri-deployment)
- [Code Signing](#code-signing)
- [Auto-Updates](#auto-updates)
- [Release Process](#release-process)
- [Platform-Specific Notes](#platform-specific-notes)
- [Troubleshooting](#troubleshooting)

## Overview

nchat supports two desktop application frameworks:

| Framework    | Technology         | Pros                            | Cons                   | Bundle Size |
| ------------ | ------------------ | ------------------------------- | ---------------------- | ----------- |
| **Electron** | Chromium + Node.js | Mature ecosystem, rich features | Larger bundle (~150MB) | ~150-200 MB |
| **Tauri**    | WebView + Rust     | Small bundle, fast, secure      | Newer ecosystem        | ~10-20 MB   |

Choose based on your requirements:

- **Electron**: Maximum compatibility, feature-rich, easier debugging
- **Tauri**: Smaller downloads, better performance, modern security

## Prerequisites

### Common Requirements

```bash
# Node.js and npm
node >= 20.0.0
npm >= 9.0.0

# Git
git >= 2.0.0

# Development tools
xcode-select --install  # macOS
```

### Electron-Specific

```bash
# Install Electron dependencies
cd platforms/electron
npm install --legacy-peer-deps
```

### Tauri-Specific

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Platform-specific dependencies
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# Fedora/RHEL
sudo dnf install webkit2gtk4.0-devel \
  openssl-devel \
  curl \
  wget \
  libappindicator-gtk3 \
  librsvg2-devel

# Arch Linux
sudo pacman -S webkit2gtk \
  base-devel \
  curl \
  wget \
  openssl \
  appmenu-gtk-module \
  gtk3 \
  libappindicator-gtk3 \
  librsvg \
  libvips
```

## Environment Setup

### Environment Variables

Create environment-specific files:

**`.env.production`**

```bash
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production
TAURI_ENV=production

# Backend URLs (production)
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourchatdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.yourchatdomain.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.yourchatdomain.com/v1/storage

# Disable dev mode
NEXT_PUBLIC_USE_DEV_AUTH=false

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...

# Code Signing (see Code Signing section)
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=TEAM123456

# Windows Code Signing
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=certificate-password

# GitHub Release Token
GH_TOKEN=ghp_...

# Tauri Signing
TAURI_SIGNING_PRIVATE_KEY_PATH=/path/to/updater.key

# Release Server (for Tauri updates)
RELEASE_SERVER_URL=https://releases.yourchatdomain.com
AWS_S3_BUCKET=your-releases-bucket
```

**`.env.staging`**

```bash
# Similar to production but with staging URLs
NODE_ENV=staging
NEXT_PUBLIC_ENV=staging
# ... staging-specific values
```

### Secrets Management

Store sensitive values securely:

```bash
# Using environment variables
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"

# Or use a secrets manager
# - GitHub Secrets (for CI/CD)
# - AWS Secrets Manager
# - HashiCorp Vault
# - 1Password CLI
```

## Electron Deployment

### Quick Start

```bash
# Deploy to all platforms (macOS, Windows, Linux)
./scripts/deploy-desktop-electron.sh --env prod

# Deploy to specific platform
./scripts/deploy-desktop-electron.sh --platform mac --env prod

# Skip code signing (for testing)
./scripts/deploy-desktop-electron.sh --no-sign --no-publish
```

### Deployment Options

```bash
# Full deployment with all options
./scripts/deploy-desktop-electron.sh \
  --platform all \
  --env prod \
  --version 1.2.3 \
  --clean \
  --draft

# Options:
#   --platform <mac|win|linux|all>  Platform to build
#   --env <dev|staging|prod>        Environment
#   --no-sign                       Skip code signing
#   --no-publish                    Skip GitHub releases
#   --draft                         Create draft release
#   --prerelease                    Mark as pre-release
#   --clean                         Clean before build
#   --version <version>             Override version
```

### Manual Build Process

If you need more control:

```bash
cd platforms/electron

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Build TypeScript
npm run build:main
npm run build:preload

# 3. Build for specific platform
npm run dist:mac      # macOS (x64 + arm64)
npm run dist:win      # Windows (x64 + ia32)
npm run dist:linux    # Linux (x64)
npm run dist:all      # All platforms

# Artifacts will be in ../dist-electron/
```

### Build Configuration

The build is configured in `platforms/electron/electron-builder.json`:

```json
{
  "appId": "org.nself.nchat",
  "productName": "nchat",
  "mac": {
    "category": "public.app-category.productivity",
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] },
      { "target": "zip", "arch": ["x64", "arm64"] }
    ],
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "resources/entitlements.mac.plist"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64", "ia32"] },
      { "target": "portable", "arch": ["x64"] }
    ]
  },
  "linux": {
    "category": "Network;InstantMessaging;Chat",
    "target": ["AppImage", "deb", "rpm", "tar.gz"]
  }
}
```

## Tauri Deployment

### Quick Start

```bash
# Deploy to current platform
./scripts/deploy-desktop-tauri.sh --env prod

# Deploy with specific options
./scripts/deploy-desktop-tauri.sh \
  --platform mac \
  --env prod \
  --clean

# Debug build (faster, for testing)
./scripts/deploy-desktop-tauri.sh --debug --no-sign --no-publish
```

### Deployment Options

```bash
# Full deployment with all options
./scripts/deploy-desktop-tauri.sh \
  --platform mac \
  --env prod \
  --version 1.2.3 \
  --clean \
  --prerelease

# Options:
#   --platform <mac|win|linux|all>  Platform to build
#   --env <dev|staging|prod>        Environment
#   --no-sign                       Skip code signing
#   --no-publish                    Skip publishing
#   --draft                         Draft release
#   --prerelease                    Pre-release
#   --clean                         Clean before build
#   --version <version>             Version override
#   --target <target>               Rust target triple
#   --debug                         Debug build
```

### Manual Build Process

```bash
cd platforms/tauri

# 1. Build Next.js frontend
cd ../..
npm run build

# 2. Build Tauri app
cd platforms/tauri
cargo tauri build

# Release builds will be in src-tauri/target/release/bundle/
# - macOS: dmg, app
# - Windows: msi, nsis
# - Linux: deb, appimage
```

### Build Configuration

The build is configured in `platforms/tauri/tauri.conf.json`:

```json
{
  "productName": "nchat",
  "version": "1.0.0",
  "identifier": "org.nself.nchat",
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Productivity",
    "macOS": {
      "minimumSystemVersion": "10.15"
    }
  }
}
```

## Code Signing

Code signing is **required** for distributing desktop applications. Without it:

- macOS: Gatekeeper will block your app
- Windows: SmartScreen will show warnings
- Linux: No hard requirement, but recommended

### macOS Code Signing

#### 1. Get Apple Developer Account

Sign up at https://developer.apple.com ($99/year)

#### 2. Create Certificates

```bash
# In Xcode, go to:
# Preferences → Accounts → Manage Certificates
# Click "+" and create:
# - "Developer ID Application" (for distribution)
# - "Developer ID Installer" (for pkg files)
```

#### 3. Create App-Specific Password

```bash
# Go to https://appleid.apple.com
# Sign In → Security → App-Specific Passwords
# Generate password for "nchat Desktop"
```

#### 4. Set Environment Variables

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="TEAM123456"  # From developer.apple.com
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM123456)"
```

#### 5. Entitlements

Create `platforms/electron/resources/entitlements.mac.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.network.server</key>
  <true/>
</dict>
</plist>
```

#### 6. Notarization

Electron will handle notarization automatically if credentials are set:

```bash
# Notarization happens automatically during build
# Check status at: https://developer.apple.com/account/submissions
```

### Windows Code Signing

#### 1. Get Code Signing Certificate

Purchase from:

- DigiCert
- Sectigo
- GoDaddy
- SSL.com

Choose "Code Signing Certificate" for Windows applications.

#### 2. Export Certificate

```bash
# Export as PFX file with private key
# Set a strong password
```

#### 3. Set Environment Variables

```bash
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"

# For Tauri
export WINDOWS_CERTIFICATE="/path/to/certificate.pfx"
export WINDOWS_CERTIFICATE_PASSWORD="certificate-password"
```

#### 4. Sign Application

```bash
# Electron: automatic during build
# Tauri: automatic during build with credentials set
```

### Linux Code Signing

Linux doesn't require code signing, but you can:

#### GPG Signing

```bash
# Generate GPG key
gpg --full-generate-key

# Sign packages
gpg --detach-sign --armor your-package.deb

# Verify signature
gpg --verify your-package.deb.asc your-package.deb
```

## Auto-Updates

Both Electron and Tauri support automatic updates.

### Electron Auto-Updates

Uses `electron-updater` with GitHub Releases:

#### 1. Configure Update Server

In `platforms/electron/electron-builder.json`:

```json
{
  "publish": {
    "provider": "github",
    "owner": "nself",
    "repo": "nself-chat",
    "releaseType": "release"
  }
}
```

#### 2. Update Channels

Configure in app settings:

- **stable**: Production releases
- **beta**: Beta/RC releases
- **alpha**: Development builds

#### 3. Update Behavior

Configured in `platforms/electron/main/updates.ts`:

- Check for updates on startup
- Auto-download based on settings
- Notify user when ready
- Install on quit or on demand

### Tauri Auto-Updates

Uses Tauri's built-in updater with signed manifests:

#### 1. Generate Updater Keypair

```bash
# Generate keypair (do this once)
cargo tauri signer generate -w ~/.tauri/updater.key

# Public key is in ~/.tauri/updater.pub
# Add to tauri.conf.json
```

#### 2. Configure Update Server

In `platforms/tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "endpoints": [
        "https://releases.yourchatdomain.com/nchat/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

#### 3. Sign and Upload Updates

```bash
# Build generates signed .sig files automatically
cargo tauri build

# Upload to your update server:
# - .tar.gz (Linux)
# - .tar.gz.sig (signature)
# - .app.tar.gz (macOS)
# - .app.tar.gz.sig
# - .nsis.zip (Windows)
# - .nsis.zip.sig
```

#### 4. Update Manifest

Create JSON manifest at update endpoint:

```json
{
  "version": "1.2.3",
  "notes": "Bug fixes and improvements",
  "pub_date": "2026-01-31T12:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "...",
      "url": "https://releases.../nchat-1.2.3-darwin-x86_64.app.tar.gz"
    },
    "darwin-aarch64": {
      "signature": "...",
      "url": "https://releases.../nchat-1.2.3-darwin-aarch64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "...",
      "url": "https://releases.../nchat-1.2.3-linux-x86_64.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "...",
      "url": "https://releases.../nchat-1.2.3-windows-x86_64.nsis.zip"
    }
  }
}
```

## Release Process

### 1. Version Bump

```bash
# Update version in package.json
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Or use script
./scripts/version-bump.sh --version 1.2.3
```

### 2. Update Changelog

```bash
# Update CHANGELOG.md
./scripts/update-changelog.sh

# Or manually edit
vim CHANGELOG.md
```

### 3. Build and Deploy

```bash
# Electron
./scripts/deploy-desktop-electron.sh --env prod --platform all

# Tauri
./scripts/deploy-desktop-tauri.sh --env prod
```

### 4. Create GitHub Release

```bash
# If using --no-publish, create release manually
gh release create v1.2.3 \
  --title "nchat v1.2.3" \
  --notes-file CHANGELOG.md \
  dist-electron/*
```

### 5. Verify Release

- Download and test installers
- Verify code signatures
- Test auto-update flow
- Check release notes

## Platform-Specific Notes

### macOS

#### Universal Builds (x64 + arm64)

Electron automatically builds universal binaries. For Tauri:

```bash
# Install both targets
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# Build universal binary
cargo tauri build --target universal-apple-darwin
```

#### Gatekeeper Issues

If users see "App is damaged and can't be opened":

```bash
# Remove quarantine attribute
xattr -cr /Applications/nchat.app

# Or users can right-click → Open
```

### Windows

#### SmartScreen Warnings

New apps will show SmartScreen warnings until they build reputation:

- Get EV code signing certificate (bypasses SmartScreen)
- Or wait for reputation to build (weeks/months)

#### NSIS vs MSI

- **NSIS**: More customizable, better auto-update support
- **MSI**: Enterprise-friendly, GPO deployment

### Linux

#### Distribution Formats

- **AppImage**: Universal, no installation required
- **deb**: Debian/Ubuntu (apt)
- **rpm**: Fedora/RHEL (dnf/yum)
- **tar.gz**: Manual extraction

#### Desktop Integration

```bash
# AppImage auto-integrates
./nchat.AppImage

# For manual .tar.gz:
# Extract and create .desktop file
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/nchat.desktop <<EOF
[Desktop Entry]
Name=nchat
Exec=/path/to/nchat
Icon=/path/to/icon.png
Type=Application
Categories=Network;InstantMessaging;
EOF
```

## Troubleshooting

### Electron Build Fails

```bash
# Clear caches
rm -rf node_modules package-lock.json
rm -rf platforms/electron/node_modules
npm install --legacy-peer-deps

# Rebuild native modules
cd platforms/electron
npm run postinstall
```

### Tauri Build Fails

```bash
# Update Rust
rustup update

# Clean and rebuild
cd platforms/tauri
cargo clean
cargo tauri build
```

### Code Signing Fails

```bash
# macOS: List available identities
security find-identity -v -p codesigning

# Verify certificate
codesign --verify --deep --strict /path/to/app

# Windows: Verify certificate
certutil -dump certificate.pfx
```

### Auto-Update Not Working

**Electron:**

```bash
# Check update server
curl -I https://api.github.com/repos/nself/nself-chat/releases/latest

# Check logs
# macOS: ~/Library/Logs/nchat/
# Windows: %USERPROFILE%\AppData\Roaming\nchat\logs\
# Linux: ~/.config/nchat/logs/
```

**Tauri:**

```bash
# Verify update endpoint
curl https://releases.../nchat/{{target}}/{{arch}}/{{version}}

# Check signature
cargo tauri signer verify /path/to/bundle.tar.gz -k ~/.tauri/updater.pub
```

### Application Won't Start

```bash
# Check logs
# macOS
cat ~/Library/Logs/nchat/main.log

# Windows
type %USERPROFILE%\AppData\Roaming\nchat\logs\main.log

# Linux
cat ~/.config/nchat/logs/main.log

# Run with debugging
# macOS
/Applications/nchat.app/Contents/MacOS/nchat --enable-logging

# Windows
nchat.exe --enable-logging

# Linux
./nchat --enable-logging
```

## Advanced Topics

### Cross-Platform Builds

#### Using GitHub Actions

See `.github/workflows/build-electron.yml` and `.github/workflows/build-tauri.yml`

#### Using Docker

```bash
# Electron builds
docker run --rm -ti \
  -v ${PWD}:/project \
  electronuserland/builder:wine \
  /bin/bash -c "npm install && npm run dist"

# Note: Tauri doesn't officially support Docker builds
```

### Custom Update Server

For Tauri, implement your own update server:

```typescript
// Express.js example
app.get('/nchat/:target/:arch/:version', async (req, res) => {
  const { target, arch, version } = req.params

  // Check if update is available
  const latestVersion = await getLatestVersion()
  if (semver.gt(latestVersion, version)) {
    res.json({
      version: latestVersion,
      notes: 'Bug fixes and improvements',
      pub_date: new Date().toISOString(),
      platforms: {
        [`${target}-${arch}`]: {
          signature: await getSignature(target, arch),
          url: `https://releases.../nchat-${latestVersion}-${target}-${arch}.tar.gz`,
        },
      },
    })
  } else {
    res.status(204).send()
  }
})
```

### Performance Optimization

#### Electron

```javascript
// Enable V8 code caching
app.commandLine.appendSwitch('js-flags', '--optimize-for-size')

// Disable unused features
app.commandLine.appendSwitch('disable-features', 'MediaRouter')
```

#### Tauri

```toml
# Cargo.toml
[profile.release]
opt-level = "z"  # Optimize for size
lto = true       # Link-time optimization
codegen-units = 1
strip = true     # Strip symbols
```

## Resources

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [electron-builder](https://www.electron.build/)

### Code Signing

- [Apple Developer](https://developer.apple.com)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

### Auto-Update

- [electron-updater](https://www.electron.build/auto-update)
- [Tauri Updater](https://tauri.app/v1/guides/distribution/updater)

### Community

- [Electron Discord](https://discord.gg/electron)
- [Tauri Discord](https://discord.com/invite/tauri)

## Support

For issues or questions:

- GitHub Issues: https://github.com/nself/nself-chat/issues
- Discord: https://discord.gg/nself
- Email: support@nself.org
