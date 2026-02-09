# Mobile Deployment Guide

Complete guide for deploying nChat mobile apps to TestFlight and Google Play Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [iOS Deployment](#ios-deployment)
4. [Android Deployment](#android-deployment)
5. [CI/CD Automation](#cicd-automation)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts

- **Apple Developer Account** ($99/year)
  - Individual or Organization account
  - Two-factor authentication enabled
  - App Store Connect access

- **Google Play Developer Account** ($25 one-time)
  - Google account with payment method
  - Developer agreement accepted

### Required Tools

- **macOS** (for iOS builds)
  - Xcode 15.0+ with Command Line Tools
  - CocoaPods 1.12+
  - Fastlane 2.220+

- **Development Machine** (for Android)
  - JDK 17+
  - Android SDK 34+
  - Gradle 8.0+

- **Both Platforms**
  - Node.js 20+
  - pnpm 9+
  - Git 2.30+

### Environment Setup

```bash
# Install Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node pnpm ruby fastlane cocoapods

# Install bundletool (Android)
brew install bundletool

# Verify installations
node --version
pnpm --version
fastlane --version
pod --version
```

## Initial Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/nself-chat.git
cd nself-chat

# Install dependencies
pnpm install

# Build web assets
pnpm build
```

### 2. Configure Capacitor

Ensure `platforms/capacitor/capacitor.config.ts` is configured:

```typescript
const config: CapacitorConfig = {
  appId: 'io.nself.chat',
  appName: 'nChat',
  webDir: 'out',
  // ... other settings
}
```

### 3. Sync Platforms

```bash
cd platforms/capacitor

# Sync iOS
npx cap sync ios

# Sync Android
npx cap sync android
```

## iOS Deployment

### Step 1: Configure Signing

See [iOS Signing Setup Guide](ios/SIGNING-SETUP.md) for detailed instructions.

Quick setup with Fastlane Match:

```bash
cd platforms/capacitor

# Initialize Match
fastlane match init

# Generate certificates
fastlane match development
fastlane match appstore
```

Set environment variables:

```bash
export APPLE_ID="your.email@example.com"
export MATCH_PASSWORD="your-match-password"
export MATCH_GIT_URL="git@github.com:your-org/certificates.git"
export DEVELOPER_PORTAL_TEAM_ID="TEAM123ABC"
export APP_STORE_CONNECT_TEAM_ID="123456789"
```

### Step 2: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "Apps" → "+" → "New App"
3. Fill in details:
   - Platform: iOS
   - Name: nChat (or your branded name)
   - Primary Language: English
   - Bundle ID: io.nself.chat
   - SKU: nchat-ios
4. Click "Create"

### Step 3: Configure App Information

1. **App Information**
   - Privacy Policy URL
   - Category: Social Networking
   - Content Rights: Yes (if applicable)

2. **Pricing and Availability**
   - Price: Free
   - Availability: All territories

3. **App Privacy**
   - Complete privacy survey
   - Add privacy policy

### Step 4: Build and Archive

Using Fastlane (recommended):

```bash
cd platforms/capacitor

# Development build (simulator)
fastlane ios dev

# Release build
fastlane ios release

# Upload to TestFlight
fastlane ios beta

# Submit to App Store
fastlane ios deploy
```

Manual build:

```bash
cd platforms/capacitor/scripts
./build-ios.sh release app-store
```

### Step 5: Upload to TestFlight

Automatic (via Fastlane):
```bash
cd platforms/capacitor
fastlane ios beta
```

Manual (via Xcode):
```bash
# Open Xcode
open ios/App/App.xcworkspace

# Product → Archive
# Window → Organizer → Distribute App → App Store Connect
```

### Step 6: TestFlight Testing

1. Go to App Store Connect → TestFlight
2. Wait for build processing (5-15 minutes)
3. Add internal testers (up to 100)
4. Add external testers (requires beta review)
5. Distribute build to testers

### Step 7: Submit for Review

1. Complete all app information
2. Add screenshots (required sizes):
   - 6.7" display (1290x2796)
   - 6.5" display (1242x2688)
   - 5.5" display (1242x2208)
3. Write app description
4. Add keywords (max 100 characters)
5. Submit for review

## Android Deployment

### Step 1: Configure Signing

See [Android Signing Setup Guide](android/SIGNING-SETUP.md) for detailed instructions.

Quick setup:

```bash
cd platforms/capacitor/android

# Generate keystore
keytool -genkeypair \
  -v -storetype PKCS12 \
  -keystore nchat-release.keystore \
  -alias nchat \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Set environment variables
export NCHAT_RELEASE_STORE_FILE=/path/to/nchat-release.keystore
export NCHAT_RELEASE_STORE_PASSWORD="your-password"
export NCHAT_RELEASE_KEY_ALIAS="nchat"
export NCHAT_RELEASE_KEY_PASSWORD="your-password"
```

### Step 2: Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in details:
   - App name: nChat
   - Default language: English (United States)
   - App type: App
   - Category: Communication
4. Accept declarations
5. Click "Create app"

### Step 3: Set Up App Content

1. **App content**
   - Privacy policy URL (required)
   - App access: All functionality available without restrictions
   - Ads: Does app contain ads? (Yes/No)
   - Content rating: Complete questionnaire
   - Target audience: Select age groups
   - News app: No

2. **Store listing**
   - Short description (80 characters)
   - Full description (4000 characters)
   - Screenshots (required):
     - Phone: 2-8 screenshots
     - 7-inch tablet: 1-8 screenshots
     - 10-inch tablet: 1-8 screenshots
   - Feature graphic (1024x500)
   - App icon (512x512)

3. **Data safety**
   - Complete data safety form
   - Specify data collection and usage
   - Link privacy policy

### Step 4: Build Release

Using Fastlane (recommended):

```bash
cd platforms/capacitor

# Development build
fastlane android dev

# Release build (AAB + APK)
fastlane android release

# Upload to internal track
fastlane android internal

# Upload to beta track
fastlane android beta

# Deploy to production
fastlane android deploy
```

Manual build:

```bash
cd platforms/capacitor/scripts
./build-android.sh release aab
```

### Step 5: Upload to Play Console

Automatic (via Fastlane):
```bash
cd platforms/capacitor
fastlane android internal
```

Manual:
1. Go to Play Console → Production → Create new release
2. Upload AAB file
3. Add release notes
4. Save and review
5. Start rollout

### Step 6: Testing Tracks

**Internal Testing**
- Up to 100 testers
- No review required
- Instant updates
```bash
fastlane android internal
```

**Closed Testing (Alpha/Beta)**
- Unlimited testers
- Optional review
- Email invites or opt-in URL
```bash
fastlane android beta
```

**Open Testing**
- Public beta
- Anyone can join
- Appears in Play Store

**Production**
- Full public release
- Complete review
- Staged rollout available (10%, 20%, 50%, 100%)
```bash
fastlane android deploy
```

### Step 7: Release to Production

1. Complete all required content
2. Submit for review
3. Review typically takes 1-3 days
4. Once approved, start staged rollout:
   - 10% for first day
   - Monitor crash rates and ratings
   - Increase to 50% if stable
   - 100% after confidence

## CI/CD Automation

### GitHub Actions Setup

Set repository secrets:

**iOS Secrets:**
```
APPLE_ID
MATCH_PASSWORD
MATCH_GIT_URL
MATCH_GIT_BASIC_AUTHORIZATION
DEVELOPER_PORTAL_TEAM_ID
APP_STORE_CONNECT_TEAM_ID
APP_STORE_CONNECT_API_KEY_BASE64
```

**Android Secrets:**
```
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
PLAY_STORE_JSON_KEY
```

### Manual Workflow Trigger

**iOS to TestFlight:**
```bash
# Via GitHub UI
Actions → Deploy iOS to TestFlight → Run workflow

# Via GitHub CLI
gh workflow run deploy-mobile-ios.yml \
  -f environment=testflight \
  -f notify_testers=false
```

**Android to Play Store:**
```bash
# Via GitHub UI
Actions → Deploy Android to Play Store → Run workflow

# Via GitHub CLI
gh workflow run deploy-mobile-android.yml \
  -f track=internal \
  -f rollout_percentage=10
```

### Tag-Based Deployment

Create and push tags to trigger automatic deployment:

```bash
# iOS TestFlight
git tag mobile-ios-v1.0.0
git push origin mobile-ios-v1.0.0

# Android Play Store
git tag mobile-android-v1.0.0
git push origin mobile-android-v1.0.0
```

## Troubleshooting

### Common iOS Issues

**"No signing certificate found"**
```bash
# Regenerate certificates
cd platforms/capacitor
fastlane match appstore --force
```

**"Provisioning profile doesn't match"**
```bash
# Update bundle identifier in Info.plist
# Regenerate provisioning profile
fastlane match appstore --force
```

**"Upload to App Store failed"**
```bash
# Use Application Loader or Transporter app
# Check App Store Connect for status
```

### Common Android Issues

**"Keystore not found"**
```bash
# Set absolute path
export NCHAT_RELEASE_STORE_FILE=/absolute/path/to/keystore
```

**"Wrong password"**
```bash
# Verify password
keytool -list -v -keystore nchat-release.keystore
```

**"Version code already exists"**
```bash
# Increment versionCode in app/build.gradle
# Or use automated versioning
```

### Build Failures

**Clear build cache:**
```bash
# iOS
cd platforms/capacitor/ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Android
cd platforms/capacitor/android
./gradlew clean
rm -rf .gradle build
```

**Reinstall dependencies:**
```bash
# iOS
cd platforms/capacitor/ios/App
rm -rf Pods Podfile.lock
pod install

# Android
cd platforms/capacitor
npx cap sync android
```

## Version Management

### Semantic Versioning

Follow [SemVer](https://semver.org/): MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes

### Version Bumping

```bash
# Update package.json
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Build numbers are auto-incremented
# iOS: CFBundleVersion
# Android: versionCode
```

### Release Checklist

- [ ] All tests passing
- [ ] No critical bugs
- [ ] Release notes prepared
- [ ] Screenshots updated
- [ ] Privacy policy current
- [ ] Version numbers bumped
- [ ] Changelog updated
- [ ] Beta testing completed
- [ ] Crash rates acceptable
- [ ] Performance metrics good

## Support and Resources

- [iOS Signing Guide](ios/SIGNING-SETUP.md)
- [Android Signing Guide](android/SIGNING-SETUP.md)
- [Mobile Build Guide](MOBILE-BUILD-GUIDE.md)
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://support.google.com/googleplay/android-developer/topic/9858052)
