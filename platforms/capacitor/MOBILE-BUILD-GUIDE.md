# nChat Mobile App Build Guide

Complete guide for building, testing, and deploying nChat iOS and Android apps.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [iOS Development](#ios-development)
- [Android Development](#android-development)
- [Building for Production](#building-for-production)
- [App Store Submission](#app-store-submission)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### General Requirements

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Capacitor CLI**: 6.x

```bash
node --version  # Should be >= 20.0.0
pnpm --version  # Should be >= 9.0.0
npx cap --version  # Should be 6.x
```

### iOS Requirements

- **macOS**: 12.0 or later
- **Xcode**: 15.0 or later
- **CocoaPods**: Latest version
- **Apple Developer Account**: For distribution

```bash
# Check Xcode version
xcodebuild -version

# Install/Update CocoaPods
sudo gem install cocoapods
pod --version
```

### Android Requirements

- **Android Studio**: Latest version
- **Android SDK**: API 24+ (Android 7.0)
- **Java JDK**: 17 or later
- **Gradle**: Managed by wrapper

```bash
# Check Java version
java -version  # Should be 17+

# Check Android SDK
sdkmanager --list
```

---

## Initial Setup

### 1. Install Dependencies

```bash
# Navigate to capacitor directory
cd platforms/capacitor

# Install Node dependencies
pnpm install

# Generate web build
cd ../..
pnpm build
pnpm next export -o platforms/capacitor/out

cd platforms/capacitor
```

### 2. Initialize Platforms

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android

# Sync web assets
npx cap sync
```

### 3. Configure Environment

Create `.env` file in the capacitor directory:

```env
# API Configuration
API_URL=https://api.nchat.app
GRAPHQL_URL=https://api.nchat.app/v1/graphql
AUTH_URL=https://auth.nchat.app/v1/auth

# Firebase (for push notifications)
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=nchat-prod
FIREBASE_APP_ID=your_app_id

# Sentry (for error tracking)
SENTRY_DSN=your_sentry_dsn

# App Configuration
APP_VERSION=1.0.0
BUILD_NUMBER=1
```

---

## iOS Development

### Setup

#### 1. Install iOS Dependencies

```bash
cd ios/App
pod install
cd ../..
```

#### 2. Open in Xcode

```bash
npx cap open ios
```

#### 3. Configure Signing

In Xcode:

1. Select the App target
2. Go to "Signing & Capabilities"
3. Select your Team
4. Update Bundle Identifier if needed
5. Enable automatic signing

#### 4. Configure Capabilities

Enable the following capabilities:

- ✅ Push Notifications
- ✅ Background Modes (Audio, VoIP, Remote notifications)
- ✅ App Groups (`group.io.nself.chat`)
- ✅ Associated Domains (`applinks:nchat.app`)
- ✅ Sign in with Apple (if using Apple auth)

### Development Build

```bash
# Method 1: Using script
./scripts/build-ios.sh debug

# Method 2: Using Xcode
# 1. Open project: npx cap open ios
# 2. Select simulator
# 3. Press Cmd+R to build and run
```

### Running on Device

```bash
# Connect iPhone/iPad via USB
# In Xcode:
# 1. Select your device from device menu
# 2. Press Cmd+R

# Or use Capacitor CLI
npx cap run ios --target="Your iPhone Name"
```

### iOS Widgets

The iOS widget is located in `ios/Widget/NChatWidget.swift`:

- **Small Widget**: Shows app icon and unread count
- **Medium Widget**: Shows 2 recent messages
- **Large Widget**: Shows 3 recent messages with details

To test widgets:

1. Build and run app on simulator/device
2. Long-press home screen
3. Tap "+" button
4. Search for "nChat"
5. Add widget

### iOS Share Extension

Located in `ios/ShareExtension/ShareViewController.swift`:

Supports sharing:

- Text
- URLs
- Images
- Videos
- Files

To test:

1. Open Photos or Safari
2. Tap Share button
3. Select "nChat"
4. Choose channel and send

### iOS App Clips

Located in `ios/AppClip/AppClipViewController.swift`:

Lightweight version for:

- Quick channel joining
- Viewing shared messages
- Trial before install

To test:

1. Configure associated domains
2. Build App Clip target
3. Test with App Clip code or NFC tag

---

## Android Development

### Setup

#### 1. Open in Android Studio

```bash
npx cap open android
```

#### 2. Sync Gradle

Android Studio will automatically sync Gradle dependencies.

#### 3. Configure Signing (for Release)

Create `keystore.properties` in `android/` directory:

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=nchat
storeFile=../keystore/nchat-release.jks
```

Generate keystore:

```bash
keytool -genkey -v -keystore android/keystore/nchat-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias nchat
```

#### 4. Configure Firebase (for Push Notifications)

1. Download `google-services.json` from Firebase Console
2. Place in `android/app/` directory
3. Update package name in Firebase Console to match `io.nself.chat`

### Development Build

```bash
# Method 1: Using script
./scripts/build-android.sh debug

# Method 2: Using Android Studio
# 1. Open project: npx cap open android
# 2. Select device/emulator
# 3. Press Shift+F10 to build and run

# Method 3: Using Gradle
cd android
./gradlew installDebug
```

### Running on Device

```bash
# Connect Android device via USB
# Enable USB debugging in Developer Options

# List connected devices
adb devices

# Install APK
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Or use Capacitor CLI
npx cap run android
```

### Android Widgets

Widget provider located in `android/src/main/java/io/nself/chat/widgets/NChatWidgetProvider.kt`:

Features:

- Shows recent messages
- Displays unread count
- Tap to open app

Widget layouts in `android/app/src/main/res/layout/widget_nchat.xml`

To test:

1. Build and install app
2. Long-press home screen
3. Tap "Widgets"
4. Find "nChat"
5. Drag to home screen

### Android Share Target

Share activity located in `android/src/main/java/io/nself/chat/ShareActivity.kt`:

Supports sharing:

- Text from any app
- Images (single/multiple)
- Videos
- Files

To test:

1. Open any app (Photos, Chrome, etc.)
2. Share content
3. Select "nChat"
4. Choose channel and send

### Android Shortcuts

Shortcut manager in `android/src/main/java/io/nself/chat/shortcuts/ShortcutManager.kt`:

Static shortcuts:

- New Message
- Search
- Start Call

Dynamic shortcuts:

- Recent channels (up to 4)

To test:

1. Long-press app icon
2. See available shortcuts

---

## Building for Production

### iOS Production Build

```bash
# Method 1: Using build script
./scripts/build-ios.sh release app-store

# Method 2: Manual Xcode build
# 1. Open Xcode
# 2. Select "Any iOS Device (arm64)"
# 3. Product > Archive
# 4. Window > Organizer
# 5. Select archive > Distribute App
```

The script will:

1. Build web app
2. Export for Capacitor
3. Sync to iOS
4. Update version numbers
5. Create archive
6. Export IPA

Output: `ios/build/ipa/App.ipa`

### Android Production Build

```bash
# Build Android App Bundle (recommended for Play Store)
./scripts/build-android.sh release aab

# Build APK (for direct distribution)
./scripts/build-android.sh release apk
```

The script will:

1. Build web app
2. Export for Capacitor
3. Sync to Android
4. Update version code
5. Build release bundle/APK
6. Sign (if keystore configured)

Outputs:

- AAB: `dist/nchat-release.aab`
- APK: `dist/nchat-release.apk`

---

## App Store Submission

### iOS - App Store Connect

#### 1. Prepare Assets

Metadata location: `metadata/ios/`

Required:

- App icons (various sizes via Assets.xcassets)
- Screenshots (6.5", 5.5", 12.9" iPad)
- App preview videos (optional)
- App description, keywords
- Privacy policy URL
- Support URL

#### 2. Upload Build

```bash
# Using Xcode Organizer
# 1. Open Xcode > Window > Organizer
# 2. Select archive
# 3. Click "Distribute App"
# 4. Choose "App Store Connect"
# 5. Upload

# Or using command line
xcrun altool --upload-app \
  --file ios/build/ipa/App.ipa \
  --username your@email.com \
  --password app-specific-password
```

#### 3. Submit for Review

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select nChat app
3. Create new version
4. Fill in metadata (use `metadata/ios/app-store-metadata.json`)
5. Select uploaded build
6. Submit for review

#### 4. Review Notes

Provide test credentials:

```
Email: demo@nchat.app
Password: Demo2026!
```

Include notes from `metadata/ios/app-store-metadata.json`

### Android - Google Play Console

#### 1. Prepare Assets

Metadata location: `metadata/android/`

Required:

- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (phone, 7" tablet, 10" tablet)
- Short description (80 chars)
- Full description (4000 chars)
- Privacy policy URL

#### 2. Create App

1. Go to [Play Console](https://play.google.com/console)
2. Create new app
3. Fill in app details
4. Set up store listing
5. Upload graphics and screenshots

#### 3. Upload Bundle

```bash
# Upload to internal testing track first
# 1. Go to Production > Testing > Internal testing
# 2. Create new release
# 3. Upload AAB: dist/nchat-release.aab
# 4. Add release notes
# 5. Review and rollout

# Then promote to production when ready
```

#### 4. Content Rating

Complete the content rating questionnaire:

- No violence, sexual content, or harmful content
- Rating: Everyone

#### 5. Submit for Review

1. Complete all sections (checkmarks should all be green)
2. Review app content
3. Submit for review

Test instructions in `metadata/android/play-store-metadata.json`

---

## Testing

### Manual Testing Checklist

#### Core Features

- [ ] Login/Signup
- [ ] Channel browsing
- [ ] Send/receive messages
- [ ] Direct messages
- [ ] File upload/download
- [ ] Search
- [ ] Push notifications
- [ ] Voice calls
- [ ] Video calls

#### Platform-Specific

**iOS:**

- [ ] Face ID / Touch ID authentication
- [ ] CallKit integration for calls
- [ ] Home screen widget
- [ ] Share extension
- [ ] App Clips
- [ ] Dark mode
- [ ] iPad optimization

**Android:**

- [ ] Fingerprint / face unlock
- [ ] Telecom integration
- [ ] Home screen widget
- [ ] Share target
- [ ] App shortcuts
- [ ] Dark mode with dynamic colors
- [ ] Tablet optimization

### Automated Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests (requires built app)
pnpm test:e2e

# Run on specific platform
pnpm test:e2e:ios
pnpm test:e2e:android
```

---

## Troubleshooting

### iOS Issues

#### Pods Install Fails

```bash
cd ios/App
pod deintegrate
pod cache clean --all
pod install --repo-update
```

#### Code Signing Errors

1. Check Team selection in Xcode
2. Verify certificates in Keychain
3. Regenerate provisioning profiles
4. Clean build folder (Cmd+Shift+K)

#### Build Fails

```bash
# Clean Xcode build
cd ios/App
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reinstall pods
pod deintegrate
pod install
```

#### Can't Run on Device

1. Trust developer certificate on device
2. Check provisioning profile includes device UDID
3. Verify deployment target matches device iOS version

### Android Issues

#### Gradle Sync Fails

```bash
# Clean Gradle cache
cd android
./gradlew clean
./gradlew build --refresh-dependencies

# Or in Android Studio
# File > Invalidate Caches / Restart
```

#### APK Install Fails

```bash
# Check package name
adb shell pm list packages | grep nchat

# Uninstall old version
adb uninstall io.nself.chat

# Install fresh
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### Build Fails

```bash
# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version=8.2.1

# Clean and rebuild
./gradlew clean assembleDebug
```

### Capacitor Issues

#### Sync Fails

```bash
# Remove platforms
rm -rf ios android

# Re-add platforms
npx cap add ios
npx cap add android
npx cap sync
```

#### Web Assets Not Updating

```bash
# Rebuild web
cd ../..
rm -rf platforms/capacitor/out
pnpm build
pnpm next export -o platforms/capacitor/out

# Force sync
cd platforms/capacitor
npx cap copy
npx cap sync
```

---

## CI/CD

GitHub Actions workflows are available in `.github/workflows/`:

- `build-ios.yml` - iOS builds
- `build-android.yml` - Android builds
- `release-ios.yml` - App Store releases
- `release-android.yml` - Play Store releases

### Secrets Required

**iOS:**

- `APPLE_ID` - Apple Developer account email
- `APPLE_PASSWORD` - App-specific password
- `TEAM_ID` - Developer Team ID
- `CERTIFICATES_P12` - Base64 encoded certificate
- `CERTIFICATES_PASSWORD` - Certificate password
- `PROVISIONING_PROFILE` - Base64 encoded profile

**Android:**

- `KEYSTORE_FILE` - Base64 encoded keystore
- `KEYSTORE_PASSWORD` - Keystore password
- `KEY_ALIAS` - Key alias
- `KEY_PASSWORD` - Key password
- `PLAY_STORE_JSON_KEY` - Service account JSON

---

## Resources

### Official Documentation

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Developer](https://developer.apple.com)
- [Android Developer](https://developer.android.com)

### Tools

- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Firebase Console](https://console.firebase.google.com)

### Support

- GitHub Issues: https://github.com/nself/nchat/issues
- Email: support@nchat.app
- Documentation: https://nchat.app/docs

---

## Version History

- **v1.0.0** (2026-01-30) - Initial release

---

**Last Updated**: 2026-01-30
