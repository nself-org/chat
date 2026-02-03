# Code Signing Guide

Complete guide for code signing nchat desktop applications on all platforms.

## Table of Contents

- [Why Code Signing](#why-code-signing)
- [macOS Code Signing](#macos-code-signing)
- [Windows Code Signing](#windows-code-signing)
- [Linux Code Signing](#linux-code-signing)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Why Code Signing

Code signing is essential for desktop application distribution:

### macOS

- **Required** for distribution outside Mac App Store
- Gatekeeper will block unsigned apps
- Users see scary warnings
- Notarization requires valid signing

### Windows

- **Recommended** for professional distribution
- SmartScreen flags unsigned apps
- Users see warnings: "Unknown publisher"
- Enterprise deployment requires signing

### Linux

- **Optional** but recommended
- Builds trust with users
- Enables repository distribution

## macOS Code Signing

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Join Apple Developer Program

2. **Xcode** (macOS only)
   ```bash
   xcode-select --install
   ```

### Step 1: Create Certificates

#### Option A: Using Xcode (Easiest)

1. Open **Xcode**
2. Go to **Xcode → Preferences → Accounts**
3. Click **+** to add Apple ID
4. Select your account → **Manage Certificates**
5. Click **+** → Create:
   - **Developer ID Application** (for apps)
   - **Developer ID Installer** (for pkg installers)

#### Option B: Using Developer Portal

1. Go to https://developer.apple.com/account/resources/certificates
2. Click **+** to create certificate
3. Choose **Developer ID Application**
4. Follow instructions to create CSR:
   ```bash
   # On macOS, open Keychain Access
   # Certificate Assistant → Request a Certificate from a Certificate Authority
   # Save to disk
   ```
5. Upload CSR, download certificate
6. Double-click to install in Keychain

### Step 2: Verify Certificates

```bash
# List all code signing identities
security find-identity -v -p codesigning

# Output should show:
# 1) ABC123... "Developer ID Application: Your Name (TEAM123)"
# 2) DEF456... "Developer ID Installer: Your Name (TEAM123)"
```

### Step 3: Get Team ID

```bash
# From developer.apple.com → Membership
# Or from certificate:
security find-identity -v -p codesigning | grep "Developer ID"
# Team ID is in parentheses: (TEAM123)
```

### Step 4: Create App-Specific Password

For notarization:

1. Go to https://appleid.apple.com
2. Sign in with Apple ID
3. **Security → App-Specific Passwords**
4. Click **+** to generate
5. Name: "nchat Desktop Notarization"
6. Copy password (format: xxxx-xxxx-xxxx-xxxx)

### Step 5: Set Environment Variables

```bash
# In ~/.zshrc or ~/.bashrc
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
export APPLE_TEAM_ID="TEAM123456"
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM123456)"

# Reload shell
source ~/.zshrc
```

Or for CI/CD, use GitHub Secrets:

```yaml
# .github/workflows/build-electron.yml
env:
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### Step 6: Configure Entitlements

Entitlements are already configured in:

- `platforms/electron/resources/entitlements.mac.plist`
- `platforms/tauri/src-tauri/Info.plist` (auto-generated)

To customize, edit the plist file to add/remove permissions.

### Step 7: Sign and Notarize

#### Electron

```bash
# Build will automatically sign and notarize
./scripts/deploy-desktop-electron.sh --platform mac --env prod

# Or manually:
cd platforms/electron
npm run dist:mac

# Check notarization status
xcrun notarytool history --apple-id "$APPLE_ID" --password "$APPLE_ID_PASSWORD"
```

#### Tauri

```bash
# Build will automatically sign
./scripts/deploy-desktop-tauri.sh --platform mac --env prod

# Manually notarize (if needed)
xcrun notarytool submit \
  target/release/bundle/dmg/nchat.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_ID_PASSWORD" \
  --team-id "$APPLE_TEAM_ID" \
  --wait

# Staple ticket
xcrun stapler staple target/release/bundle/dmg/nchat.dmg
```

### Step 8: Verify Signature

```bash
# Verify app signature
codesign --verify --deep --strict /Applications/nchat.app

# Display signature info
codesign -dv --verbose=4 /Applications/nchat.app

# Check notarization
spctl -a -vvv -t install /Applications/nchat.app

# Should output: "accepted"
```

## Windows Code Signing

### Prerequisites

1. **Code Signing Certificate**
   - Purchase from certificate authority (CA)
   - Recommended: DigiCert, Sectigo, SSL.com
   - Choose "Code Signing Certificate"
   - ~$100-500/year

2. **Certificate Types**
   - **Standard Code Signing**: Basic signing
   - **EV (Extended Validation)**: Bypasses SmartScreen immediately
   - **OV (Organization Validation)**: Business verification required

### Step 1: Purchase Certificate

#### Recommended Providers

**DigiCert** (Premium)

- https://www.digicert.com/signing/code-signing-certificates
- EV available (best for instant SmartScreen bypass)
- ~$474/year (Standard), ~$599/year (EV)

**Sectigo** (Mid-tier)

- https://sectigo.com/ssl-certificates-tls/code-signing
- Good balance of price and reputation
- ~$179/year (Standard)

**SSL.com** (Budget)

- https://www.ssl.com/code-signing/
- Affordable option
- ~$99/year (Standard)

#### Purchase Process

1. Choose certificate type (Standard or EV)
2. Complete organization validation
3. Verify domain/business (can take 1-3 days)
4. Download certificate + private key

### Step 2: Export Certificate

You need a PFX/P12 file with private key:

#### If you have .cer + .key

```bash
# Combine into PFX
openssl pkcs12 -export \
  -out certificate.pfx \
  -inkey private.key \
  -in certificate.cer \
  -password pass:YourStrongPassword
```

#### If using Windows Certificate Manager

1. Open **certmgr.msc**
2. Find your certificate under **Personal → Certificates**
3. Right-click → **All Tasks → Export**
4. Choose **Yes, export the private key**
5. Select **Personal Information Exchange (PFX)**
6. Set strong password
7. Save as `certificate.pfx`

### Step 3: Set Environment Variables

```bash
# Linux/macOS
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="your-certificate-password"

# Windows (PowerShell)
$env:WIN_CSC_LINK="C:\path\to\certificate.pfx"
$env:WIN_CSC_KEY_PASSWORD="your-certificate-password"

# For Tauri
export WINDOWS_CERTIFICATE="/path/to/certificate.pfx"
export WINDOWS_CERTIFICATE_PASSWORD="your-certificate-password"
```

For CI/CD:

```yaml
# .github/workflows/build-electron.yml
env:
  WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }} # Base64 encoded cert
  WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
```

#### Encoding Certificate for CI/CD

```bash
# Encode certificate to base64
base64 -i certificate.pfx -o certificate.txt

# In GitHub Secrets, paste the base64 content
# The build will decode it automatically
```

### Step 4: Sign Application

#### Electron

```bash
# Build will automatically sign
./scripts/deploy-desktop-electron.sh --platform win --env prod

# Or manually
cd platforms/electron
npm run dist:win
```

#### Tauri

```bash
# Build will automatically sign
./scripts/deploy-desktop-tauri.sh --platform win --env prod
```

### Step 5: Verify Signature

On Windows:

```powershell
# Using signtool (Windows SDK)
signtool verify /pa /v nchat-setup.exe

# Or right-click .exe → Properties → Digital Signatures
# Should show your certificate details
```

### Step 6: Build SmartScreen Reputation

Even with valid signature, new apps show SmartScreen warnings.

**Solutions:**

1. **Get EV Certificate** ($599/year)
   - Bypasses SmartScreen immediately
   - Requires hardware token

2. **Build Reputation** (Free, slow)
   - Get downloads from users
   - Takes weeks to months
   - No guarantee

3. **Submit to Microsoft** (Free)
   - Upload to Microsoft for analysis
   - https://www.microsoft.com/en-us/wdsi/filesubmission
   - Can speed up reputation

## Linux Code Signing

Linux doesn't require code signing, but you can sign packages for trust.

### GPG Signing

#### Step 1: Generate GPG Key

```bash
# Generate key
gpg --full-generate-key

# Choose:
# - Key type: RSA and RSA
# - Key size: 4096
# - Expiration: 2 years
# - Name: Your Name
# - Email: your-email@example.com

# List keys
gpg --list-keys
```

#### Step 2: Export Public Key

```bash
# Export public key
gpg --export --armor your-email@example.com > public-key.asc

# Upload to key server
gpg --send-keys KEY_ID --keyserver keyserver.ubuntu.com
```

#### Step 3: Sign Packages

```bash
# Sign .deb
dpkg-sig --sign builder nchat_1.0.0_amd64.deb

# Sign .rpm
rpm --addsign nchat-1.0.0-1.x86_64.rpm

# Sign .AppImage (detached signature)
gpg --detach-sign --armor nchat.AppImage
# Creates nchat.AppImage.asc
```

#### Step 4: Verify Signatures

```bash
# Verify .deb
dpkg-sig --verify nchat_1.0.0_amd64.deb

# Verify .rpm
rpm --checksig nchat-1.0.0-1.x86_64.rpm

# Verify .AppImage
gpg --verify nchat.AppImage.asc nchat.AppImage
```

### Repository Signing (Advanced)

For hosting your own APT/YUM repository:

```bash
# Create GPG key for repository
gpg --gen-key

# Sign repository metadata
# APT
gpg --clearsign -o InRelease Release
gpg -abs -o Release.gpg Release

# YUM
gpg --detach-sign --armor repodata/repomd.xml
```

## Configuration

### Environment Variables Reference

```bash
# ============================================
# macOS Code Signing
# ============================================
APPLE_ID="your-apple-id@example.com"
APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # App-specific password
APPLE_TEAM_ID="TEAM123456"
APPLE_SIGNING_IDENTITY="Developer ID Application: Name (TEAM)"

# For Tauri
APPLE_SIGNING_IDENTITY="Developer ID Application: Name (TEAM)"
APPLE_ID="your-apple-id@example.com"
APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# ============================================
# Windows Code Signing
# ============================================
WIN_CSC_LINK="/path/to/certificate.pfx"
WIN_CSC_KEY_PASSWORD="certificate-password"

# For Tauri
WINDOWS_CERTIFICATE="/path/to/certificate.pfx"
WINDOWS_CERTIFICATE_PASSWORD="certificate-password"

# ============================================
# Linux GPG Signing
# ============================================
GPG_KEY_ID="your-gpg-key-id"
GPG_PASSPHRASE="gpg-key-passphrase"

# ============================================
# Common
# ============================================
# Skip signing (for testing)
CSC_IDENTITY_AUTO_DISCOVERY=false  # Electron
TAURI_SKIP_SIGNING=1               # Tauri
```

### Storage Best Practices

**DO:**

- Store certificates in secure location
- Use environment variables for passwords
- Use CI/CD secrets for automation
- Rotate passwords regularly
- Use hardware tokens for EV certificates

**DON'T:**

- Commit certificates to git
- Share private keys
- Use weak passwords
- Store passwords in plain text
- Reuse passwords across services

### CI/CD Configuration

#### GitHub Actions

```yaml
name: Build and Sign

on:
  push:
    tags:
      - 'v*'

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Import Code Signing Certificate
        env:
          CERTIFICATE_BASE64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
        run: |
          # Create keychain
          security create-keychain -p "$KEYCHAIN_PASSWORD" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "$KEYCHAIN_PASSWORD" build.keychain

          # Import certificate
          echo "$CERTIFICATE_BASE64" | base64 --decode > certificate.p12
          security import certificate.p12 -k build.keychain \
            -P "$CERTIFICATE_PASSWORD" -T /usr/bin/codesign

          security set-key-partition-list -S apple-tool:,apple:,codesign: \
            -s -k "$KEYCHAIN_PASSWORD" build.keychain

      - name: Build and Sign
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: |
          ./scripts/deploy-desktop-electron.sh --platform mac

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and Sign
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: |
          .\scripts\deploy-desktop-electron.sh --platform win
```

## Troubleshooting

### macOS: "App is damaged and can't be opened"

**Cause:** Gatekeeper quarantine attribute

**Solution:**

```bash
# Remove quarantine
xattr -cr /Applications/nchat.app

# Or users: Right-click → Open (first time only)
```

### macOS: "Developer cannot be verified"

**Cause:** App not notarized or signature invalid

**Solution:**

```bash
# Check signature
codesign --verify --deep --strict /Applications/nchat.app

# Check notarization
spctl -a -vvv -t install /Applications/nchat.app

# Re-notarize if needed
xcrun notarytool submit nchat.dmg \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_ID_PASSWORD" \
  --wait
```

### Windows: SmartScreen Warning

**Cause:** New certificate or low download count

**Solutions:**

1. Get EV certificate ($599/year) - instant bypass
2. Submit to Microsoft for analysis
3. Wait for reputation to build (weeks/months)

### Windows: "Certificate not trusted"

**Cause:** Certificate not from trusted CA

**Solution:**

- Purchase from major CA (DigiCert, Sectigo, SSL.com)
- Ensure certificate chain is complete
- Check certificate expiration date

### Electron: "No identity found for code signing"

**Cause:** Certificate not in keychain or environment variable not set

**Solution:**

```bash
# macOS: Check keychain
security find-identity -v -p codesigning

# Ensure APPLE_SIGNING_IDENTITY is set
echo $APPLE_SIGNING_IDENTITY

# Or disable signing for testing
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

### Tauri: Build fails with signing error

**Cause:** Certificate path incorrect or password wrong

**Solution:**

```bash
# Verify certificate exists
ls -la /path/to/certificate.pfx

# Check environment variables
echo $WINDOWS_CERTIFICATE
echo $WINDOWS_CERTIFICATE_PASSWORD

# Try manual signing first
# Windows:
signtool sign /f certificate.pfx /p password /tr http://timestamp.digicert.com app.exe

# macOS:
codesign --force --sign "Developer ID" --timestamp app.app
```

## Resources

### Documentation

- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Microsoft Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Tauri Code Signing](https://tauri.app/v1/guides/distribution/sign-macos)

### Certificate Providers

- [DigiCert](https://www.digicert.com/signing/code-signing-certificates)
- [Sectigo](https://sectigo.com/ssl-certificates-tls/code-signing)
- [SSL.com](https://www.ssl.com/code-signing/)

### Tools

- [Xcode](https://developer.apple.com/xcode/)
- [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
- [GPG Tools](https://gpgtools.org/)

## Support

For code signing issues:

- Check troubleshooting section above
- Review platform-specific documentation
- Contact your certificate provider
- Open issue: https://github.com/nself/nself-chat/issues
