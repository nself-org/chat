# Mobile Deployment Scripts

This directory contains automated deployment scripts for iOS and Android mobile applications.

## Overview

The deployment scripts automate the entire mobile app deployment process:

- **iOS**: Build, sign, archive, export, and upload to App Store Connect
- **Android**: Build, sign, create AAB/APK, and prepare for Google Play upload

## Scripts

### iOS Deployment (`deploy-mobile-ios.sh`)

Deploys iOS app to TestFlight or App Store.

**Usage:**

```bash
./scripts/deploy-mobile-ios.sh [options]
```

**Options:**

- `--testflight` - Deploy to TestFlight (default)
- `--production` - Deploy to App Store
- `--skip-build` - Skip web build step
- `--skip-tests` - Skip running tests
- `--team-id <id>` - Apple Team ID
- `--app-id <email>` - Apple ID email
- `--help` - Show help message

**Required Environment Variables:**

```bash
export APPLE_TEAM_ID="ABC123XYZ"           # Your Apple Team ID
export APPLE_ID="developer@example.com"     # Your Apple ID
export APP_SPECIFIC_PASSWORD="xxxx-xxxx"    # App-specific password
```

**Optional Environment Variables:**

```bash
export IOS_SIGNING_IDENTITY="iPhone Distribution"
export IOS_PROVISIONING_PROFILE="UUID-of-profile"
```

**Examples:**

```bash
# Deploy to TestFlight
./scripts/deploy-mobile-ios.sh --testflight

# Deploy to App Store with custom team ID
./scripts/deploy-mobile-ios.sh --production --team-id ABC123

# Skip build and tests, use existing archive
./scripts/deploy-mobile-ios.sh --skip-build --skip-tests
```

**Prerequisites:**

- macOS with Xcode installed
- Valid Apple Developer account
- App created in App Store Connect
- App-specific password generated

**What it does:**

1. Runs tests (unless `--skip-tests`)
2. Builds Next.js web assets
3. Syncs to iOS platform via Capacitor
4. Updates version and build number
5. Creates Xcode archive
6. Exports signed IPA
7. Validates IPA with Apple
8. Uploads to App Store Connect

**Output:**

- IPA file at: `platforms/capacitor/ios/build/ipa/App.ipa`
- Build logs in terminal
- Upload confirmation

---

### Android Deployment (`deploy-mobile-android.sh`)

Deploys Android app to Google Play testing tracks or production.

**Usage:**

```bash
./scripts/deploy-mobile-android.sh [options]
```

**Options:**

- `--internal` - Deploy to Internal Testing (default)
- `--beta` - Deploy to Beta track
- `--production` - Deploy to Production track
- `--skip-build` - Skip web build step
- `--skip-tests` - Skip running tests
- `--keystore <path>` - Path to keystore file
- `--key-alias <alias>` - Key alias
- `--help` - Show help message

**Required Environment Variables:**

```bash
export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEY_ALIAS="upload-key"
export ANDROID_KEY_PASSWORD="your-key-password"
```

**Optional Environment Variables:**

```bash
export GOOGLE_PLAY_SERVICE_ACCOUNT="/path/to/service-account.json"
```

**Examples:**

```bash
# Deploy to Internal Testing
./scripts/deploy-mobile-android.sh --internal

# Deploy to Beta
./scripts/deploy-mobile-android.sh --beta

# Deploy to Production
./scripts/deploy-mobile-android.sh --production

# Use custom keystore
./scripts/deploy-mobile-android.sh --keystore ./my-release.keystore
```

**Prerequisites:**

- Android SDK and build tools
- Valid Google Play Developer account
- App created in Google Play Console
- Release keystore created

**Creating a Release Keystore:**

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias upload-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# IMPORTANT: Backup this file and remember passwords!
```

**What it does:**

1. Runs tests (unless `--skip-tests`)
2. Builds Next.js web assets
3. Syncs to Android platform via Capacitor
4. Updates version name and version code
5. Configures signing with keystore
6. Builds signed Android App Bundle (AAB)
7. Builds signed APK (for testing)
8. Copies outputs to dist/ folder
9. Optionally uploads to Play Console (if service account configured)

**Output:**

- AAB file at: `platforms/capacitor/dist/nchat-release.aab`
- APK file at: `platforms/capacitor/dist/nchat-release.apk`
- Build logs in terminal

---

## Quick Start

### First-time iOS Setup

1. **Join Apple Developer Program**
   - Go to https://developer.apple.com
   - Pay $99/year fee
   - Accept agreements

2. **Create App in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Create new app
   - Fill in basic information

3. **Generate App-Specific Password**
   - Go to https://appleid.apple.com/account/manage
   - Security → App-Specific Passwords
   - Generate new password
   - Save it securely

4. **Set Environment Variables**

   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export APPLE_TEAM_ID="YOUR_TEAM_ID"
   export APPLE_ID="your@email.com"
   export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
   ```

5. **Deploy**
   ```bash
   ./scripts/deploy-mobile-ios.sh --testflight
   ```

### First-time Android Setup

1. **Join Google Play Developer Program**
   - Go to https://play.google.com/console/signup
   - Pay $25 one-time fee
   - Accept agreements

2. **Create App in Play Console**
   - Go to https://play.google.com/console
   - Create new app
   - Fill in basic information

3. **Create Release Keystore**

   ```bash
   keytool -genkey -v \
     -keystore release.keystore \
     -alias upload-key \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000

   # CRITICAL: Backup this file!
   # If lost, you cannot update your app
   ```

4. **Set Environment Variables**

   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
   export ANDROID_KEYSTORE_PASSWORD="your-password"
   export ANDROID_KEY_ALIAS="upload-key"
   export ANDROID_KEY_PASSWORD="your-password"
   ```

5. **Deploy**
   ```bash
   ./scripts/deploy-mobile-android.sh --internal
   ```

---

## Environment Variables Reference

### iOS

| Variable                   | Required | Description               | Example               |
| -------------------------- | -------- | ------------------------- | --------------------- |
| `APPLE_TEAM_ID`            | Yes      | Your Apple Team ID        | `ABC123XYZ`           |
| `APPLE_ID`                 | Yes      | Your Apple ID email       | `dev@example.com`     |
| `APP_SPECIFIC_PASSWORD`    | Yes      | App-specific password     | `xxxx-xxxx-xxxx-xxxx` |
| `IOS_SIGNING_IDENTITY`     | No       | Code signing identity     | `iPhone Distribution` |
| `IOS_PROVISIONING_PROFILE` | No       | Provisioning profile UUID | `UUID-string`         |

**Finding Your Team ID:**

1. Go to https://developer.apple.com/account/#/membership
2. Look for "Team ID" in membership details

**Generating App-Specific Password:**

1. Go to https://appleid.apple.com/account/manage
2. Security → App-Specific Passwords
3. Generate new password
4. Copy and save (shown only once)

### Android

| Variable                      | Required | Description           | Example                     |
| ----------------------------- | -------- | --------------------- | --------------------------- |
| `ANDROID_KEYSTORE_PATH`       | Yes      | Path to keystore file | `/path/to/release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD`   | Yes      | Keystore password     | `secure-password`           |
| `ANDROID_KEY_ALIAS`           | Yes      | Key alias name        | `upload-key`                |
| `ANDROID_KEY_PASSWORD`        | Yes      | Key password          | `secure-password`           |
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | No       | Service account JSON  | `/path/to/service.json`     |

**Keystore Security:**

- Store keystore in secure, backed-up location
- Use strong, unique passwords
- Never commit to version control
- **If lost, you cannot update your app!**

---

## Deployment Workflows

### iOS Workflow

```
┌─────────────────┐
│  Run Tests      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Build Web      │
│  Assets         │
└────────┬────────┘
         │
┌────────▼────────┐
│  Sync to iOS    │
│  (Capacitor)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Update Version │
│  & Build Number │
└────────┬────────┘
         │
┌────────▼────────┐
│  Create Archive │
│  (xcodebuild)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  Export IPA     │
│  (signed)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Validate IPA   │
│  (altool)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Upload to      │
│  App Store      │
│  Connect        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Processing     │
│  (10-30 min)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Available in   │
│  TestFlight     │
└─────────────────┘
```

### Android Workflow

```
┌─────────────────┐
│  Run Tests      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Build Web      │
│  Assets         │
└────────┬────────┘
         │
┌────────▼────────┐
│  Sync to        │
│  Android        │
│  (Capacitor)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Update Version │
│  Name & Code    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Configure      │
│  Signing        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Build AAB      │
│  (Gradle)       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Build APK      │
│  (optional)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Copy to dist/  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Manual Upload  │
│  to Play        │
│  Console        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Pre-launch     │
│  Report         │
│  (1-2 hours)    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Available to   │
│  Testers        │
└─────────────────┘
```

---

## Common Tasks

### Update App Version

The scripts automatically set version from `package.json`:

```json
{
  "version": "1.2.3"
}
```

To update:

```bash
# Update package.json version
npm version minor  # or major, patch

# Deploy with new version
./scripts/deploy-mobile-ios.sh
./scripts/deploy-mobile-android.sh
```

### Deploy to Multiple Platforms

```bash
# Deploy both platforms sequentially
./scripts/deploy-mobile-ios.sh --testflight && \
./scripts/deploy-mobile-android.sh --internal
```

### Test Build Locally

**iOS:**

```bash
# Build for simulator
cd platforms/capacitor
npx cap build ios

# Open in Xcode
npx cap open ios
```

**Android:**

```bash
# Build debug APK
cd platforms/capacitor
npx cap build android

# Install on device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Clean Build

If you encounter build issues:

**iOS:**

```bash
cd platforms/capacitor/ios
rm -rf build/
xcodebuild clean
pod install --repo-update
```

**Android:**

```bash
cd platforms/capacitor/android
./gradlew clean
rm -rf .gradle/
./gradlew --refresh-dependencies
```

---

## Troubleshooting

### iOS Issues

**"No signing certificate found"**

```bash
# Enable automatic signing in Xcode
# Or install certificates from developer.apple.com
```

**"Archive creation failed"**

```bash
# Open in Xcode for detailed error
cd platforms/capacitor
npx cap open ios

# Check Build Settings and Signing
```

**"Upload failed - authentication"**

```bash
# Verify app-specific password
# Regenerate if needed at appleid.apple.com
```

### Android Issues

**"Keystore not found"**

```bash
# Check ANDROID_KEYSTORE_PATH is correct
# Verify file exists
ls -la $ANDROID_KEYSTORE_PATH
```

**"Build failed - Gradle error"**

```bash
# Clean and rebuild
cd platforms/capacitor/android
./gradlew clean
./gradlew bundleRelease --stacktrace
```

**"Version code must be greater than..."**

```bash
# Script auto-increments using timestamp
# Or manually update in android/app/build.gradle
```

### Common Issues

**"Tests failed"**

```bash
# Skip tests temporarily
./scripts/deploy-mobile-ios.sh --skip-tests
./scripts/deploy-mobile-android.sh --skip-tests

# Or fix tests before deploying
pnpm test
```

**"Build takes too long"**

```bash
# Skip rebuild if already built
./scripts/deploy-mobile-ios.sh --skip-build
./scripts/deploy-mobile-android.sh --skip-build
```

---

## Documentation

For detailed guides, see:

- **[Mobile Deployment Guide](../docs/guides/deployment/mobile-deployment.md)** - Complete deployment instructions
- **[Troubleshooting Guide](../docs/guides/deployment/mobile-deployment-troubleshooting.md)** - Common issues and solutions
- **[Capacitor iOS](https://capacitorjs.com/docs/ios)** - Capacitor iOS documentation
- **[Capacitor Android](https://capacitorjs.com/docs/android)** - Capacitor Android documentation

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-mobile.yml`:

```yaml
name: Deploy Mobile Apps

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: ./scripts/deploy-mobile-ios.sh --testflight
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APP_SPECIFIC_PASSWORD: ${{ secrets.APP_SPECIFIC_PASSWORD }}

  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - run: pnpm install
      - run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > release.keystore
      - run: ./scripts/deploy-mobile-android.sh --internal
        env:
          ANDROID_KEYSTORE_PATH: ./release.keystore
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
```

---

## Security Best Practices

1. **Never commit sensitive data**
   - Add to `.gitignore`: `*.keystore`, `.env`, `keystore.properties`
   - Use environment variables
   - Store secrets in CI/CD secrets manager

2. **Backup keystores**
   - Android keystore cannot be recovered if lost
   - Store in multiple secure locations
   - Consider encrypted cloud storage

3. **Use strong passwords**
   - Unique passwords for each keystore
   - Store in password manager
   - Don't share passwords

4. **Rotate credentials**
   - Regenerate app-specific passwords periodically
   - Update service account keys
   - Review access permissions

5. **Limit access**
   - Only give deployment credentials to necessary team members
   - Use CI/CD for automated deployments
   - Audit access logs regularly

---

## Support

For issues or questions:

1. Check [Troubleshooting Guide](../docs/guides/deployment/mobile-deployment-troubleshooting.md)
2. Search [GitHub Issues](https://github.com/yourusername/nself-chat/issues)
3. Create new issue with:
   - Platform (iOS/Android)
   - Error message
   - Steps to reproduce
   - Environment details

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
