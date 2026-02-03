# CI/CD Setup for nself-chat v0.8.0

Complete continuous integration and deployment automation for all platforms.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Scripts](#scripts)
- [Secrets Configuration](#secrets-configuration)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

The CI/CD system provides:

- **Automated builds** for all platforms (Web, iOS, Android, Windows, macOS, Linux)
- **Automated testing** on every PR
- **Automated deployments** to TestFlight, Play Store, and GitHub Releases
- **Build caching** for faster builds
- **Notifications** via Slack and email
- **Version management** with automated changelog generation
- **Code signing** for all platforms

### Build Matrix

| Platform | Framework      | Build Time | Cache                | Signing                          |
| -------- | -------------- | ---------- | -------------------- | -------------------------------- |
| iOS      | Capacitor      | ~15 min    | pnpm, CocoaPods      | Apple Certificate                |
| Android  | Capacitor      | ~10 min    | pnpm, Gradle         | Android Keystore                 |
| macOS    | Electron/Tauri | ~20 min    | pnpm, Electron, Rust | Apple Certificate + Notarization |
| Windows  | Electron/Tauri | ~15 min    | pnpm, Electron, Rust | Code Signing Certificate         |
| Linux    | Electron/Tauri | ~15 min    | pnpm, Electron, Rust | GPG Signature                    |
| Web      | Next.js        | ~5 min     | pnpm                 | N/A                              |
| Docker   | Multi-arch     | ~10 min    | Docker buildx        | N/A                              |

---

## Workflows

### 1. PR Checks (`.github/workflows/pr-checks.yml`)

**Triggers**: Pull requests to `main` or `develop`

**Jobs**:

- ✅ **Lint & Format** - ESLint + Prettier
- ✅ **Type Check** - TypeScript validation
- ✅ **Unit Tests** - Jest tests with coverage
- ✅ **Build Check** - Web app build verification
- ✅ **Mobile Build Check** - Android debug build (if mobile files changed)
- ✅ **Desktop Build Check** - Electron build (if desktop files changed)
- ✅ **Security Scan** - npm audit + Snyk
- ✅ **Bundle Size** - Bundle analysis
- ✅ **Accessibility** - a11y tests
- ✅ **Lighthouse** - Performance metrics

**Features**:

- Smart change detection (only run relevant checks)
- Parallel execution for speed
- PR comments with status summary
- Coverage reporting to Codecov

**Example PR Comment**:

```markdown
## PR Checks Summary

| Check         | Status     |
| ------------- | ---------- |
| Lint & Format | ✅ success |
| Type Check    | ✅ success |
| Unit Tests    | ✅ success |
| Build         | ✅ success |

✅ All checks passed! Ready for review.
```

### 2. iOS Build (`.github/workflows/ios-build.yml`)

**Triggers**:

- Push to `main` or `develop` (iOS files changed)
- Pull requests
- Manual dispatch

**Build Types**:

- **Debug**: Simulator build, automatic signing
- **Release**: Device build, manual signing, IPA export

**Caching**:

- pnpm store
- CocoaPods (Pods directory + cache)

**Deployment**:

- Automatic upload to TestFlight (main branch, release builds)
- Requires Apple ID + App-Specific Password

**Notifications**:

- Slack on success/failure
- Build summary in GitHub Actions

**Manual Trigger**:

```bash
gh workflow run ios-build.yml \
  -f build_type=release \
  -f deploy_testflight=true
```

### 3. Android Build (`.github/workflows/android-build.yml`)

**Triggers**:

- Push to `main` or `develop` (Android files changed)
- Pull requests
- Manual dispatch

**Build Types**:

- **Debug APK**: Unsigned, for testing
- **Release APK**: Signed, for direct distribution
- **Release AAB**: Signed, for Play Store

**Caching**:

- pnpm store
- Gradle cache (~/.gradle)

**Deployment**:

- Automatic upload to Play Store (internal track)
- Configurable rollout percentage
- Multiple tracks: internal, alpha, beta, production

**Manual Trigger**:

```bash
gh workflow run android-build.yml \
  -f build_type=release \
  -f output_format=aab \
  -f deploy_playstore=true \
  -f playstore_track=internal
```

### 4. Desktop Build (`.github/workflows/desktop-build.yml`)

**Triggers**:

- Push to `main` or `develop` (desktop files changed)
- Pull requests
- Manual dispatch

**Platforms**:

- **macOS**: Universal binary (.dmg), Apple signed & notarized
- **Windows**: x64 + ia32 (.exe, .msi), code signed
- **Linux**: x64 (.deb, .rpm, .AppImage, .snap), GPG signed

**Frameworks**:

- Electron (default)
- Tauri (optional)
- Both (build with both frameworks)

**Caching**:

- pnpm store
- Electron cache
- Rust cache (for Tauri)

**Signing**:

- macOS: Apple Certificate + Notarization
- Windows: Code Signing Certificate (.pfx)
- Linux: GPG signature

**Manual Trigger**:

```bash
gh workflow run desktop-build.yml \
  -f platform=all \
  -f framework=electron \
  -f create_release=true
```

### 5. Release (`.github/workflows/release-v080.yml`)

**Triggers**:

- Git tags (e.g., `v0.8.0`)
- Manual dispatch

**Jobs**:

1. **Prepare**: Version bump, changelog generation
2. **Build Web**: Next.js production build
3. **Build Docker**: Multi-arch images (amd64, arm64)
4. **Build Mobile**: iOS + Android (optional)
5. **Build Desktop**: All platforms (optional)
6. **Create Release**: GitHub Release with all artifacts
7. **Deploy Production**: Vercel deployment
8. **Notify**: Slack, email, Twitter announcements

**Artifacts**:

- Web tarball
- Docker images (ghcr.io)
- iOS IPA (if mobile enabled)
- Android APK/AAB (if mobile enabled)
- Desktop installers (if desktop enabled)

**Changelog**:
Automatically generated from commit messages using conventional commits:

- `feat:` → ✨ Features
- `fix:` → 🐛 Bug Fixes
- `perf:` → ⚡ Performance
- `security:` → 🔒 Security
- `docs:` → 📚 Documentation
- `refactor:` → ♻️ Refactoring
- `test:` → 🧪 Tests
- `build:` → 🔨 Build
- `ci:` → 👷 CI/CD

**Manual Trigger**:

```bash
# Automatic version bump
gh workflow run release-v080.yml \
  -f version=0.8.0 \
  -f version_type=minor \
  -f deploy_mobile=true \
  -f deploy_desktop=true

# Or create a tag
git tag v0.8.0
git push origin v0.8.0
```

---

## Scripts

All scripts are located in `/scripts/` and are executable.

### Version Management

#### `generate-changelog.sh`

Generates CHANGELOG.md from git commits using conventional commits.

```bash
./scripts/generate-changelog.sh 0.8.0
```

Features:

- Categorizes commits by type
- Supports emoji prefixes
- Handles breaking changes
- Links to commit hashes

#### `version-bump.sh`

Updates version across all platform configurations.

```bash
./scripts/version-bump.sh 0.8.0
```

Updates:

- `package.json`
- `platforms/tauri/tauri.conf.json`
- `platforms/tauri/Cargo.toml`
- iOS `Info.plist`
- Android `build.gradle`

### Mobile Deployment

#### `deploy-testflight.sh`

Uploads iOS app to TestFlight.

```bash
./scripts/deploy-testflight.sh \
  --ipa path/to/App.ipa \
  --beta-group "Internal Testers" \
  --notify
```

Requirements:

- `APPLE_ID` - Apple ID email
- `APPLE_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Team ID

#### `deploy-playstore.sh`

Uploads Android app to Google Play Store.

```bash
./scripts/deploy-playstore.sh \
  --track internal \
  --rollout 50 \
  --aab path/to/app-release.aab
```

Requirements:

- `PLAY_STORE_JSON_KEY` - Base64-encoded service account JSON

Tracks:

- `internal` - Internal testing
- `alpha` - Closed alpha
- `beta` - Open/closed beta
- `production` - Production release

### Desktop Signing

#### `sign-desktop.sh`

Signs desktop applications for all platforms.

```bash
# macOS
./scripts/sign-desktop.sh macos dist/nchat.app

# Windows
./scripts/sign-desktop.sh windows dist/nchat.exe

# Linux (GPG)
./scripts/sign-desktop.sh linux dist/nchat.AppImage
```

Requirements:

- **macOS**: `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_TEAM_ID`
- **Windows**: `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`
- **Linux**: `GPG_PRIVATE_KEY`, `GPG_PASSPHRASE`

#### `notarize-macos.sh`

Notarizes macOS applications with Apple.

```bash
./scripts/notarize-macos.sh dist/nchat.dmg
```

Requirements:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Process:

1. Submit to Apple notarization service
2. Wait for approval (5-15 minutes)
3. Staple ticket to app
4. Verify notarization

---

## Secrets Configuration

All secrets must be configured in GitHub repository settings:
Settings → Secrets and variables → Actions → New repository secret

### iOS/macOS Secrets

```bash
# Apple Developer
APPLE_ID=developer@example.com
APPLE_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX

# Certificates (base64-encoded)
CERTIFICATES_P12=<base64-encoded .p12 file>
CERTIFICATES_PASSWORD=certificate-password
PROVISIONING_PROFILE=<base64-encoded .mobileprovision>
KEYCHAIN_PASSWORD=temporary-keychain-password

# macOS Desktop
MAC_CERTS=<base64-encoded .p12 file>
MAC_CERTS_PASSWORD=certificate-password
```

**Generate base64-encoded certificates**:

```bash
# iOS/macOS certificate
base64 -i Certificates.p12 -o certificates.txt
cat certificates.txt  # Copy to CERTIFICATES_P12 secret

# Provisioning profile
base64 -i AppStore.mobileprovision -o profile.txt
cat profile.txt  # Copy to PROVISIONING_PROFILE secret
```

### Android Secrets

```bash
# Keystore (base64-encoded)
KEYSTORE_FILE=<base64-encoded .jks file>
KEYSTORE_PASSWORD=keystore-password
KEY_ALIAS=release-key
KEY_PASSWORD=key-password

# Play Store API
PLAY_STORE_JSON_KEY=<base64-encoded service-account.json>
```

**Generate Android keystore**:

```bash
# Create keystore
keytool -genkey -v -keystore nchat-release.jks \
  -alias release-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Encode to base64
base64 -i nchat-release.jks -o keystore.txt
cat keystore.txt  # Copy to KEYSTORE_FILE secret
```

**Create Play Store service account**:

1. Go to Google Play Console
2. Setup → API access
3. Create new service account
4. Download JSON key
5. Encode: `base64 -i service-account.json`

### Windows Secrets

```bash
# Code signing certificate (base64-encoded .pfx)
WIN_CERTS=<base64-encoded .pfx file>
WIN_CSC_KEY_PASSWORD=certificate-password
```

### Linux Secrets

```bash
# GPG key (base64-encoded)
GPG_PRIVATE_KEY=<base64-encoded private key>
GPG_PASSPHRASE=key-passphrase
```

**Export GPG key**:

```bash
# Export private key
gpg --export-secret-keys --armor KEY_ID > private-key.asc

# Encode to base64
base64 -i private-key.asc -o gpg-key.txt
cat gpg-key.txt  # Copy to GPG_PRIVATE_KEY secret
```

### Notification Secrets

```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
RELEASE_EMAIL_TO=team@example.com

# Twitter/X (optional)
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Other Secrets

```bash
# Codecov
CODECOV_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Snyk
SNYK_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Vercel (optional)
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxx

# Lighthouse CI (optional)
LHCI_GITHUB_APP_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Usage Guide

### Creating a Release

1. **Prepare code**:

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Run release workflow**:

   ```bash
   # Option 1: Manual workflow dispatch
   gh workflow run release-v080.yml \
     -f version=0.8.0 \
     -f version_type=minor \
     -f deploy_mobile=true \
     -f deploy_desktop=true

   # Option 2: Create tag
   git tag v0.8.0
   git push origin v0.8.0
   ```

3. **Monitor workflow**:

   ```bash
   gh run watch
   ```

4. **Verify release**:
   - Check GitHub Releases page
   - Verify Docker image: `docker pull ghcr.io/YOUR_ORG/nself-chat:0.8.0`
   - Test iOS build in TestFlight
   - Test Android build in Play Console

### Testing Changes

1. **Create PR**:

   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   gh pr create
   ```

2. **PR checks run automatically**:
   - Lint & Format
   - Type Check
   - Unit Tests
   - Build Check

3. **Monitor PR checks**:

   ```bash
   gh pr checks
   ```

4. **Fix failures**:
   ```bash
   pnpm lint:fix
   pnpm format
   pnpm type-check
   pnpm test
   ```

### Building Specific Platforms

**iOS only**:

```bash
gh workflow run ios-build.yml \
  -f build_type=release \
  -f deploy_testflight=true
```

**Android only**:

```bash
gh workflow run android-build.yml \
  -f build_type=release \
  -f output_format=aab \
  -f deploy_playstore=true
```

**Desktop (macOS only)**:

```bash
gh workflow run desktop-build.yml \
  -f platform=macos \
  -f framework=electron
```

**Desktop (all platforms)**:

```bash
gh workflow run desktop-build.yml \
  -f platform=all \
  -f framework=electron \
  -f create_release=true
```

---

## Troubleshooting

### iOS Build Issues

**Problem**: Certificate import fails

```
Error: The specified item could not be found in the keychain
```

**Solution**:

1. Verify `CERTIFICATES_P12` is valid base64
2. Check `CERTIFICATES_PASSWORD` matches certificate
3. Ensure certificate is not expired

**Problem**: Provisioning profile mismatch

```
Error: No matching provisioning profile found
```

**Solution**:

1. Regenerate provisioning profile in Apple Developer portal
2. Include correct devices for development
3. Re-encode and update `PROVISIONING_PROFILE` secret

### Android Build Issues

**Problem**: Keystore not found

```
Error: Keystore file not found
```

**Solution**:

1. Verify `KEYSTORE_FILE` secret is set
2. Check base64 encoding is valid
3. Ensure keystore was created with correct alias

**Problem**: Play Store upload fails

```
Error: Invalid service account JSON
```

**Solution**:

1. Verify service account has correct permissions
2. Re-download JSON key from Play Console
3. Re-encode and update `PLAY_STORE_JSON_KEY`

### Desktop Build Issues

**Problem**: macOS notarization fails

```
Error: Notarization failed with status: invalid
```

**Solution**:

1. Check notarization log: `cat notarization-log.json`
2. Common issues:
   - App not signed with Developer ID
   - Hardened runtime not enabled
   - Invalid entitlements
3. Re-sign with correct settings

**Problem**: Windows signing fails

```
Error: No Windows signing tool found
```

**Solution**:

1. Install osslsigncode: `brew install osslsigncode`
2. Or use Windows runner with signtool.exe

### Workflow Issues

**Problem**: Workflow not triggering

```
No workflow runs found
```

**Solution**:

1. Check workflow file syntax: `gh workflow view`
2. Verify trigger conditions match
3. Check branch protection rules

**Problem**: Cache not restoring

```
Cache not found
```

**Solution**:

1. Delete cache: `gh cache delete <cache-key>`
2. Wait for new cache to be created
3. Check cache key matches lock file hash

### Notification Issues

**Problem**: Slack notifications not sending

```
Slack webhook failed
```

**Solution**:

1. Verify `SLACK_WEBHOOK_URL` is valid
2. Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' $SLACK_WEBHOOK_URL`
3. Check Slack app permissions

---

## Best Practices

1. **Always test locally first**:

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm build
   ```

2. **Use conventional commits**:

   ```bash
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   chore: update dependencies
   ```

3. **Keep secrets secure**:
   - Never commit secrets to repository
   - Rotate secrets regularly
   - Use environment-specific secrets

4. **Monitor build times**:
   - Use caching effectively
   - Parallelize independent jobs
   - Skip unnecessary builds

5. **Version management**:
   - Follow semantic versioning
   - Update CHANGELOG.md
   - Tag releases properly

---

## Support

- 📧 Email: support@nself.org
- 💬 Discord: https://discord.gg/nself
- 📚 Docs: https://docs.nself.org
- 🐛 Issues: https://github.com/nself-chat/issues

---

**Last Updated**: 2026-01-31
**Version**: 0.8.0
