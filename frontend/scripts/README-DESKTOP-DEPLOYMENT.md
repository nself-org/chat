# Desktop Deployment Scripts

Automated deployment scripts for building, signing, and publishing nchat desktop applications.

## Overview

This directory contains production-ready deployment scripts for both Electron and Tauri desktop applications:

- **`deploy-desktop-electron.sh`** - Electron deployment automation
- **`deploy-desktop-tauri.sh`** - Tauri deployment automation

Both scripts provide complete automation of:

- ✅ Dependency checking
- ✅ Frontend building (Next.js)
- ✅ Application bundling
- ✅ Code signing (macOS, Windows)
- ✅ Notarization (macOS)
- ✅ Multi-platform builds
- ✅ Release publishing
- ✅ Artifact verification

## Quick Start

### Electron Deployment

```bash
# Build for all platforms (production)
./scripts/deploy-desktop-electron.sh --env prod

# Build for specific platform
./scripts/deploy-desktop-electron.sh --platform mac --env prod

# Build without signing (for testing)
./scripts/deploy-desktop-electron.sh --no-sign --no-publish
```

### Tauri Deployment

```bash
# Build for current platform (production)
./scripts/deploy-desktop-tauri.sh --env prod

# Build with clean rebuild
./scripts/deploy-desktop-tauri.sh --env prod --clean

# Debug build (faster, for testing)
./scripts/deploy-desktop-tauri.sh --debug --no-sign --no-publish
```

## Script Options

### Common Options

Both scripts support these options:

| Option                  | Description          | Example           |
| ----------------------- | -------------------- | ----------------- |
| `--platform <platform>` | Target platform(s)   | `--platform mac`  |
| `--env <environment>`   | Build environment    | `--env prod`      |
| `--version <version>`   | Override version     | `--version 1.2.3` |
| `--clean`               | Clean before build   | `--clean`         |
| `--no-sign`             | Skip code signing    | `--no-sign`       |
| `--no-publish`          | Skip publishing      | `--no-publish`    |
| `--draft`               | Create draft release | `--draft`         |
| `--prerelease`          | Mark as pre-release  | `--prerelease`    |
| `--help`                | Show help message    | `--help`          |

### Tauri-Specific Options

| Option              | Description         | Example                         |
| ------------------- | ------------------- | ------------------------------- |
| `--target <target>` | Rust target triple  | `--target aarch64-apple-darwin` |
| `--debug`           | Build in debug mode | `--debug`                       |

### Platform Values

- `mac` - macOS only
- `win` - Windows only
- `linux` - Linux only
- `all` - All platforms (Electron only)

### Environment Values

- `development` - Development environment
- `staging` - Staging environment
- `production` - Production environment

## Prerequisites

### System Requirements

**All Platforms:**

```bash
node >= 20.0.0
npm >= 9.0.0
git >= 2.0.0
```

**Electron:**

```bash
# macOS
xcode-select --install

# Windows
# No additional requirements

# Linux
# Standard build tools (gcc, make, etc.)
```

**Tauri:**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev

# See docs for other Linux distros
```

### Environment Variables

Create `.env.production` file in project root:

```bash
# Environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production

# Backend URLs
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourchatdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.yourchatdomain.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.yourchatdomain.com/v1/storage

# Disable dev mode
NEXT_PUBLIC_USE_DEV_AUTH=false

# Code Signing - macOS
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=TEAM123456
APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM123456)"

# Code Signing - Windows
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=certificate-password

# GitHub Release Token
GH_TOKEN=ghp_...

# Tauri Updater
TAURI_SIGNING_PRIVATE_KEY_PATH=/path/to/updater.key

# Release Server (optional)
RELEASE_SERVER_URL=https://releases.yourchatdomain.com
AWS_S3_BUCKET=your-releases-bucket
```

## Usage Examples

### Basic Production Build

```bash
# Electron - all platforms
./scripts/deploy-desktop-electron.sh --env prod --platform all

# Tauri - current platform
./scripts/deploy-desktop-tauri.sh --env prod
```

### Development/Testing Build

```bash
# Fast build without signing or publishing
./scripts/deploy-desktop-electron.sh --env dev --no-sign --no-publish

# Tauri debug build
./scripts/deploy-desktop-tauri.sh --debug --no-sign --no-publish
```

### Platform-Specific Builds

```bash
# macOS only
./scripts/deploy-desktop-electron.sh --platform mac --env prod

# Windows only
./scripts/deploy-desktop-electron.sh --platform win --env prod

# Linux only
./scripts/deploy-desktop-electron.sh --platform linux --env prod
```

### Version Override

```bash
# Build with specific version
./scripts/deploy-desktop-electron.sh --env prod --version 1.2.3

# Build pre-release
./scripts/deploy-desktop-tauri.sh --env prod --version 1.2.3-beta.1 --prerelease
```

### Clean Build

```bash
# Remove all previous artifacts and rebuild
./scripts/deploy-desktop-electron.sh --env prod --clean

# Tauri clean build
./scripts/deploy-desktop-tauri.sh --env prod --clean
```

### Draft Release

```bash
# Create draft release (not published)
./scripts/deploy-desktop-electron.sh --env prod --draft

# Review and publish manually on GitHub
```

## Build Process Flow

Both scripts follow a similar flow:

1. **Check Dependencies**
   - Verify Node.js, npm, git
   - Check platform-specific tools
   - Validate code signing credentials

2. **Load Environment**
   - Load `.env.{environment}` file
   - Set environment variables
   - Configure build parameters

3. **Clean (Optional)**
   - Remove previous build artifacts
   - Clear distribution directories

4. **Build Frontend**
   - Install npm dependencies
   - Build Next.js application
   - Generate static export

5. **Build Desktop App**
   - **Electron**: Compile TypeScript, bundle app
   - **Tauri**: Build Rust backend, compile app

6. **Code Signing**
   - **macOS**: Sign with Developer ID, notarize
   - **Windows**: Sign with code signing certificate
   - **Linux**: GPG sign packages (optional)

7. **Verify Artifacts**
   - Check build output
   - List generated installers
   - Generate checksums

8. **Publish (Optional)**
   - Upload to GitHub Releases
   - Update release server
   - Notify users

## Code Signing Setup

### macOS

Required for distribution:

```bash
# 1. Get Apple Developer account ($99/year)
# 2. Create certificates in Xcode
# 3. Get app-specific password from appleid.apple.com
# 4. Set environment variables

export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="TEAM123456"
export APPLE_SIGNING_IDENTITY="Developer ID Application: Name (TEAM)"
```

### Windows

Recommended for professional distribution:

```bash
# 1. Purchase code signing certificate
#    - DigiCert, Sectigo, SSL.com
#    - ~$100-500/year
# 2. Export as PFX file with private key
# 3. Set environment variables

export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"
```

### Linux

Optional but recommended:

```bash
# 1. Generate GPG key
gpg --full-generate-key

# 2. Export public key
gpg --export --armor your-email@example.com > public-key.asc

# 3. Sign packages
gpg --detach-sign --armor package.deb
```

For detailed setup instructions, see:

- [Desktop Deployment Guide](../docs/guides/deployment/desktop-deployment.md)
- [Code Signing Guide](../docs/guides/deployment/code-signing.md)

## Output Artifacts

### Electron

Artifacts are generated in `dist-electron/`:

**macOS:**

- `nchat-{version}-mac-x64.dmg` - Intel installer
- `nchat-{version}-mac-arm64.dmg` - Apple Silicon installer
- `nchat-{version}-mac-x64.zip` - Intel portable
- `nchat-{version}-mac-arm64.zip` - Apple Silicon portable

**Windows:**

- `nchat-{version}-win-x64.exe` - 64-bit installer (NSIS)
- `nchat-{version}-win-ia32.exe` - 32-bit installer (NSIS)
- `nchat-{version}-win-x64-portable.exe` - Portable executable

**Linux:**

- `nchat-{version}-linux-x64.AppImage` - Universal Linux app
- `nchat-{version}-linux-x64.deb` - Debian/Ubuntu package
- `nchat-{version}-linux-x64.rpm` - Fedora/RHEL package
- `nchat-{version}-linux-x64.tar.gz` - Tarball

### Tauri

Artifacts are generated in `platforms/tauri/src-tauri/target/release/bundle/`:

**macOS:**

- `dmg/nchat_{version}_x64.dmg` - Intel installer
- `dmg/nchat_{version}_aarch64.dmg` - Apple Silicon installer
- `macos/nchat.app` - Application bundle

**Windows:**

- `nsis/nchat_{version}_x64-setup.exe` - NSIS installer
- `msi/nchat_{version}_x64_en-US.msi` - MSI installer

**Linux:**

- `deb/nchat_{version}_amd64.deb` - Debian package
- `appimage/nchat_{version}_amd64.AppImage` - AppImage

## Troubleshooting

### Build Fails with Dependency Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# For Electron
cd platforms/electron
rm -rf node_modules
npm install --legacy-peer-deps

# For Tauri
rustup update
```

### Code Signing Fails

```bash
# macOS: Verify certificates
security find-identity -v -p codesigning

# Windows: Check certificate
certutil -dump certificate.pfx

# Disable signing for testing
./scripts/deploy-desktop-electron.sh --no-sign --no-publish
```

### Build is Very Slow

```bash
# Use debug mode for faster builds (Tauri)
./scripts/deploy-desktop-tauri.sh --debug

# Build single platform instead of all
./scripts/deploy-desktop-electron.sh --platform mac

# Clean might be removing too much
# Remove --clean flag for incremental builds
```

### Notarization Fails (macOS)

```bash
# Check notarization history
xcrun notarytool history --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD"

# Get detailed logs
xcrun notarytool log <submission-id> --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD"

# Common issues:
# - Hardened runtime not enabled
# - Missing entitlements
# - Unsigned frameworks/libraries
```

### Artifacts Not Found

```bash
# Check if build completed successfully
echo $?  # Should be 0

# Verify output directory
ls -la dist-electron/  # Electron
ls -la platforms/tauri/src-tauri/target/release/bundle/  # Tauri

# Check build logs for errors
```

## CI/CD Integration

Both scripts work seamlessly with GitHub Actions:

### Electron CI/CD

```yaml
# .github/workflows/build-electron.yml
name: Build Electron

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Deploy
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          chmod +x scripts/deploy-desktop-electron.sh
          ./scripts/deploy-desktop-electron.sh --env prod
```

### Tauri CI/CD

```yaml
# .github/workflows/build-tauri.yml
name: Build Tauri

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Tauri CLI
        run: cargo install tauri-cli

      - name: Deploy
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: |
          chmod +x scripts/deploy-desktop-tauri.sh
          ./scripts/deploy-desktop-tauri.sh --env prod
```

## Best Practices

1. **Always test locally first**

   ```bash
   ./scripts/deploy-desktop-electron.sh --no-sign --no-publish
   ```

2. **Use version tags**

   ```bash
   git tag v1.2.3
   ./scripts/deploy-desktop-electron.sh --env prod --version 1.2.3
   ```

3. **Enable clean builds for releases**

   ```bash
   ./scripts/deploy-desktop-electron.sh --env prod --clean
   ```

4. **Create draft releases for review**

   ```bash
   ./scripts/deploy-desktop-electron.sh --env prod --draft
   # Review on GitHub, then publish
   ```

5. **Use separate environment files**
   - `.env.development` - Local testing
   - `.env.staging` - Staging environment
   - `.env.production` - Production releases

6. **Never commit secrets**
   - Use `.gitignore` for `.env.*` files
   - Use CI/CD secrets for automation
   - Rotate credentials regularly

## Support

For issues or questions:

- **Documentation**:
  - [Desktop Deployment Guide](../docs/guides/deployment/desktop-deployment.md)
  - [Code Signing Guide](../docs/guides/deployment/code-signing.md)

- **Issues**: https://github.com/nself/nself-chat/issues

- **Community**:
  - Discord: https://discord.gg/nself
  - Email: support@nself.org

## License

MIT License - See [LICENSE](../LICENSE) file for details.
