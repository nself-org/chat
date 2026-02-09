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
