# Desktop Application Deployment Guide

Complete guide for building, signing, and deploying nchat desktop applications for Windows, macOS, and Linux.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Code Signing Setup](#code-signing-setup)
- [Building Locally](#building-locally)
- [CI/CD Deployment](#cicd-deployment)
- [Distribution](#distribution)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### All Platforms

- Node.js 20.x or later
- npm or pnpm
- Git

### Windows Build Requirements

- Windows 10 or later
- Windows SDK 10.0.18362.0 or later (for SignTool)
- NSIS 3.x (automatically installed by electron-builder)

### macOS Build Requirements

- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer account (for code signing and notarization)

### Linux Build Requirements

- Ubuntu 20.04+ or equivalent
- Build tools: `sudo apt-get install rpm fakeroot dpkg`
- ImageMagick (for icon generation): `sudo apt-get install imagemagick`

## Code Signing Setup

### Windows Code Signing

#### Option 1: Traditional Code Signing Certificate (.pfx)

1. **Obtain a Code Signing Certificate**
   - Purchase from a Certificate Authority (DigiCert, Sectigo, GlobalSign)
   - Export as `.pfx` file with password

2. **Set Environment Variables**

   ```bash
   # Local development
   export WIN_CSC_LINK="/path/to/certificate.pfx"
   export WIN_CSC_KEY_PASSWORD="your-password"

   # Or base64 encode for CI
   base64 -i certificate.pfx -o certificate.b64
   export WIN_CSC_LINK="<base64-encoded-content>"
   ```

3. **GitHub Secrets** (for CI/CD)
   - `WIN_CSC_LINK`: Base64-encoded certificate
   - `WIN_CSC_KEY_PASSWORD`: Certificate password

#### Option 2: Azure Code Signing

1. **Set Up Azure Key Vault**
   - Create Azure Key Vault
   - Upload code signing certificate
   - Create service principal

2. **Install AzureSignTool**

   ```bash
   dotnet tool install --global AzureSignTool
   ```

3. **Set Environment Variables**
   ```bash
   export AZURE_KEY_VAULT_URI="https://your-vault.vault.azure.net/"
   export AZURE_CERT_NAME="your-cert-name"
   export AZURE_CLIENT_ID="your-client-id"
   export AZURE_CLIENT_SECRET="your-client-secret"
   export AZURE_TENANT_ID="your-tenant-id"
   ```

#### Windows SmartScreen Approval

After code signing, your application may still show SmartScreen warnings until it gains reputation:

1. **Extended Validation (EV) Certificate**: Provides immediate SmartScreen reputation
2. **Build Reputation**: Distribute to users and gather telemetry over time
3. **Microsoft Defender SmartScreen**: Submit your app for analysis

### macOS Code Signing and Notarization

#### Step 1: Get Developer Certificates

1. **Join Apple Developer Program**: https://developer.apple.com/programs/
2. **Create Certificates** in Apple Developer Portal:
   - Developer ID Application certificate (for distribution outside Mac App Store)
   - Developer ID Installer certificate (for .pkg installers)

3. **Download and Install Certificates**
   - Download from Apple Developer Portal
   - Double-click to install in Keychain Access
   - Verify with: `security find-identity -v -p codesigning`

#### Step 2: Configure Notarization

**Method 1: App-Specific Password (Apple ID)**

1. **Create App-Specific Password**
   - Go to https://appleid.apple.com/account/manage
   - Sign in with your Apple ID
   - Generate app-specific password under "Security"

2. **Set Environment Variables**
   ```bash
   export APPLE_ID="your-apple-id@example.com"
   export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
   export APPLE_TEAM_ID="YOUR_TEAM_ID"  # 10-character team ID
   ```

**Method 2: API Key (Recommended)**

1. **Create API Key** in App Store Connect
   - Go to Users and Access > Keys
   - Create new API key with "Developer" access
   - Download .p8 key file

2. **Set Environment Variables**

   ```bash
   export APPLE_API_KEY="/path/to/AuthKey_XXXXXXXXXX.p8"
   export APPLE_API_KEY_ID="XXXXXXXXXX"
   export APPLE_API_ISSUER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```

3. **GitHub Secrets**
   - `APPLE_API_KEY`: Base64-encoded .p8 file
   - `APPLE_API_KEY_ID`: Key ID
   - `APPLE_API_ISSUER`: Issuer ID

#### Step 3: Export Certificates for CI

```bash
# Export certificate to .p12 file
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities \
  -f pkcs12 \
  -o certificate.p12 \
  -P "export-password"

# Base64 encode for GitHub Secrets
base64 -i certificate.p12 -o certificate.b64
```

GitHub Secrets:

- `CSC_LINK`: Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD`: Export password
- `CSC_NAME`: Certificate name (e.g., "Developer ID Application: Your Name (TEAM_ID)")

### Linux Code Signing (Optional)

Linux packages typically don't require code signing, but you can sign packages for verification:

#### Debian/Ubuntu (.deb)

```bash
# Generate GPG key
gpg --gen-key

# Sign package
dpkg-sig --sign builder nchat_*.deb

# Verify
dpkg-sig --verify nchat_*.deb
```

#### Fedora/RHEL (.rpm)

```bash
# Import GPG key
rpm --import your-public-key.asc

# Sign package
rpmsign --addsign nchat-*.rpm

# Verify
rpm --checksig nchat-*.rpm
```

## Building Locally

### 1. Build Next.js Application

```bash
# From project root
pnpm install
pnpm build
```

This creates the `out/` directory with the static Next.js build.

### 2. Build Electron Application

```bash
cd platforms/electron

# Install dependencies
npm install

# Build TypeScript files
npm run build:all

# Package for current platform
npm run pack  # Creates unpacked app in dist-electron

# Or build distributables
npm run dist  # Current platform
npm run dist:mac  # macOS
npm run dist:win  # Windows
npm run dist:linux  # Linux
npm run dist:all  # All platforms (requires appropriate OS)
```

### 3. Platform-Specific Builds

#### Windows

```bash
# Build NSIS installer and portable
npm run dist:win

# Outputs:
# - dist-electron/nchat-Setup-1.0.0.exe (installer)
# - dist-electron/nchat-1.0.0-Portable.exe (portable)
```

#### macOS

```bash
# Build DMG and PKG for both architectures
npm run dist:mac

# Outputs:
# - dist-electron/nchat-1.0.0-mac-x64.dmg (Intel)
# - dist-electron/nchat-1.0.0-mac-arm64.dmg (Apple Silicon)
# - dist-electron/nchat-1.0.0-mac-x64.pkg (Intel installer)
# - dist-electron/nchat-1.0.0-mac-arm64.pkg (Apple Silicon installer)
# - dist-electron/nchat-1.0.0-mac-x64.zip (Intel archive)
# - dist-electron/nchat-1.0.0-mac-arm64.zip (Apple Silicon archive)
```

#### Linux

```bash
# Build all Linux packages
npm run dist:linux

# Outputs:
# - dist-electron/nchat-1.0.0-x86_64.AppImage
# - dist-electron/nchat_1.0.0_amd64.deb
# - dist-electron/nchat-1.0.0.x86_64.rpm
# - dist-electron/nchat-1.0.0-linux-x64.tar.gz
```

### 4. Generate Icons

If you need to regenerate icons from a source image:

```bash
cd platforms/electron

# From SVG or high-res PNG
node scripts/generate-icons.js /path/to/logo.svg

# This generates:
# - resources/icons/icon.icns (macOS)
# - resources/icons/icon.ico (Windows)
# - resources/icons/[size]x[size].png (all platforms)
# - resources/icons/[size]x[size]/apps/nchat.png (Linux hicolor)
```

## CI/CD Deployment

### GitHub Actions Workflow

The project includes a complete GitHub Actions workflow: `.github/workflows/desktop-release.yml`

#### Triggering a Release

**Option 1: Git Tag**

```bash
# Create and push a version tag
git tag v0.8.0
git push origin v0.8.0
```

**Option 2: Manual Workflow Dispatch**

1. Go to GitHub Actions
2. Select "Desktop Release" workflow
3. Click "Run workflow"
4. Enter version number (e.g., "0.8.0")
5. Check "pre-release" if applicable

#### Required GitHub Secrets

Configure these in your repository settings (Settings > Secrets and variables > Actions):

**Windows Code Signing:**

- `WIN_CSC_LINK`: Base64-encoded .pfx certificate
- `WIN_CSC_KEY_PASSWORD`: Certificate password

**macOS Code Signing:**

- `CSC_LINK`: Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD`: Certificate password
- `CSC_NAME`: Certificate name
- `KEYCHAIN_PASSWORD`: Random password for temporary keychain

**macOS Notarization (choose one method):**

_Method 1: Apple ID_

- `APPLE_ID`: Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Team ID

_Method 2: API Key (recommended)_

- `APPLE_API_KEY`: Base64-encoded .p8 file
- `APPLE_API_KEY_ID`: Key ID
- `APPLE_API_ISSUER`: Issuer ID

**GitHub Release:**

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

#### Workflow Process

1. **Build Web App**: Builds Next.js application (shared artifact)
2. **Build Windows**: Compiles and signs Windows executables
3. **Build macOS**: Compiles, signs, and notarizes macOS bundles
4. **Build Linux**: Creates AppImage, .deb, and .rpm packages
5. **Create Release**: Publishes GitHub release with all artifacts

## Distribution

### Direct Download

Upload built packages to:

- GitHub Releases (automated by CI)
- Your own CDN or file server
- S3 bucket

### Package Managers

#### Windows

**Winget**

```bash
# Create winget manifest
# Submit PR to: https://github.com/microsoft/winget-pkgs
```

**Chocolatey**

```bash
# Create nuspec file
choco pack
choco push nchat.1.0.0.nupkg --source https://push.chocolatey.org/
```

**Scoop**

```json
{
  "version": "1.0.0",
  "description": "Team Communication Platform",
  "homepage": "https://nself.org",
  "license": "MIT",
  "url": "https://github.com/nself/nself-chat/releases/download/v1.0.0/nchat-1.0.0-Portable.exe",
  "bin": "nchat.exe",
  "shortcuts": [["nchat.exe", "nchat"]],
  "checkver": "github",
  "autoupdate": {
    "url": "https://github.com/nself/nself-chat/releases/download/v$version/nchat-$version-Portable.exe"
  }
}
```

#### macOS

**Homebrew Cask**

```bash
# Create cask formula
brew create --cask https://github.com/nself/nself-chat/releases/download/v1.0.0/nchat-1.0.0-mac-x64.dmg

# Submit PR to: https://github.com/Homebrew/homebrew-cask
```

#### Linux

**Snap Store**

```bash
snapcraft
snapcraft upload --release=stable nchat_1.0.0_amd64.snap
```

**Flathub**

```bash
# Create flatpak manifest
# Submit to: https://github.com/flathub/flathub
```

**AppImage Hub**

- Upload to https://www.appimagehub.com/

### Auto-Update Server

The app uses electron-updater with GitHub Releases by default. For self-hosted updates:

1. **Configure Update Server**
   Edit `electron-builder.yml`:

   ```yaml
   publish:
     - provider: generic
       url: https://your-update-server.com/releases
       channel: latest
   ```

2. **Server Structure**

   ```
   /releases/
     /latest.yml (or latest-mac.yml, latest-linux.yml)
     /nchat-Setup-1.0.0.exe
     /nchat-1.0.0-mac.zip
     /nchat-1.0.0.AppImage
   ```

3. **Update Metadata File** (`latest.yml`)
   ```yaml
   version: 1.0.0
   files:
     - url: nchat-Setup-1.0.0.exe
       sha512: <file-hash>
       size: 12345678
   path: nchat-Setup-1.0.0.exe
   sha512: <file-hash>
   releaseDate: '2026-01-31T12:00:00.000Z'
   ```

## Testing Builds

### Pre-Release Checklist

- [ ] Version number updated in `package.json`
- [ ] Release notes prepared
- [ ] Code signed and notarized (macOS)
- [ ] Tested on clean systems
- [ ] Auto-updater tested
- [ ] Deep links working (nchat://)
- [ ] System tray functional
- [ ] Notifications working
- [ ] File size under 150MB
- [ ] Launch time under 2 seconds
- [ ] Memory usage under 100MB idle

### Testing on Clean Systems

**Windows:**

```bash
# Run in Windows Sandbox or VM
# Check SmartScreen behavior
# Verify installer options
# Test auto-launch
# Check protocol handler
```

**macOS:**

```bash
# Test on both Intel and Apple Silicon
# Verify Gatekeeper doesn't block
# Check notarization: spctl -a -vv /Applications/nchat.app
# Test auto-updater
```

**Linux:**

```bash
# Test on Ubuntu, Fedora, Arch
# Verify desktop file integration
# Check protocol handler
# Test AppImage on different distros
```

### Smoke Test Script

```bash
#!/bin/bash
# Quick smoke test for built applications

echo "Testing nchat build..."

# Check file exists
if [ ! -f "dist-electron/nchat"* ]; then
  echo "❌ Build not found"
  exit 1
fi

# Check file size
SIZE=$(du -sh dist-electron/nchat* | awk '{print $1}')
echo "✓ Build size: $SIZE"

# macOS: Check code signature
if [[ "$OSTYPE" == "darwin"* ]]; then
  codesign --verify --deep --strict dist-electron/nchat.app
  echo "✓ Code signature valid"

  spctl -a -vv dist-electron/nchat.app
  echo "✓ Notarization valid"
fi

# Windows: Check signature
if [[ "$OSTYPE" == "msys" ]]; then
  signtool verify /pa dist-electron/nchat-Setup-*.exe
  echo "✓ Code signature valid"
fi

echo "✅ All tests passed"
```

## Troubleshooting

### Windows Issues

**Error: SignTool not found**

```bash
# Install Windows SDK
# Or specify SignTool path
set SIGNTOOL_PATH=C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe
```

**SmartScreen Warning**

- Expected for new applications without reputation
- Use EV certificate for immediate trust
- Or build reputation over time

**NSIS Error**

```bash
# Clear electron-builder cache
rd /s /q %LOCALAPPDATA%\electron-builder\Cache
npm run dist:win
```

### macOS Issues

**Notarization Failed: Invalid Developer ID**

```bash
# Verify certificate name
security find-identity -v -p codesigning

# Ensure CSC_NAME matches exactly
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"
```

**Notarization Timeout**

- Notarization can take 10-60 minutes
- Check status: `xcrun notarytool history --apple-id YOUR_APPLE_ID`
- View logs: `xcrun notarytool log <submission-id> --apple-id YOUR_APPLE_ID`

**Gatekeeper Blocks App**

```bash
# Remove quarantine attribute (for testing only)
xattr -cr /Applications/nchat.app

# For distribution, ensure proper notarization
```

### Linux Issues

**AppImage Won't Run**

```bash
# Make executable
chmod +x nchat-*.AppImage

# Install FUSE if needed (older systems)
sudo apt-get install fuse libfuse2

# Or extract and run
./nchat-*.AppImage --appimage-extract
./squashfs-root/nchat
```

**.deb Install Fails**

```bash
# Check dependencies
dpkg -I nchat_*.deb

# Install missing dependencies
sudo apt-get install -f
```

**Protocol Handler Not Working**

```bash
# Re-register handler
xdg-mime default nchat.desktop x-scheme-handler/nchat

# Test
xdg-open nchat://test
```

### Build Performance

**Slow Builds**

- Use `--dir` flag for faster development builds
- Enable local caching
- Use faster compression for dev builds

**Large Package Size**

- Review included node_modules
- Use `asar` compression
- Exclude unnecessary files in `electron-builder.yml`

## Support

- **Documentation**: https://docs.nself.org
- **Issues**: https://github.com/nself/nself-chat/issues
- **Community**: https://community.nself.org

---

**Last Updated**: January 31, 2026
**Version**: 0.8.0
