# nChat Capacitor - iOS & Android Mobile Apps

This directory contains the Capacitor-based mobile application for nChat, supporting both iOS and Android platforms.

## Overview

Capacitor allows us to build native iOS and Android apps using the same web codebase, while providing access to native device features like:

- Push notifications (APNs & FCM)
- Camera and photo library
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- File system access
- Haptic feedback
- Native sharing
- Offline sync

## Prerequisites

### General Requirements
- Node.js >= 20.0.0
- pnpm >= 9.15.4
- Capacitor CLI 6.x

### iOS Requirements
- macOS (required for iOS development)
- Xcode 15.0 or later
- CocoaPods 1.10 or later
- iOS 14.0+ deployment target
- Apple Developer account (for device testing and App Store)

### Android Requirements
- Android Studio Hedgehog (2023.1.1) or later
- Android SDK API 34
- Java JDK 17
- Gradle 8.0+

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Web Assets

The Capacitor app wraps the Next.js web application. Build it first:

```bash
cd ../..
pnpm build
pnpm export
```

### 3. Initialize Native Projects

Create the iOS and Android projects:

```bash
# Add iOS platform
pnpm run add:ios

# Add Android platform
pnpm run add:android

# Or both at once
npx cap add ios
npx cap add android
```

### 4. Sync Web Assets to Native

```bash
pnpm run sync
```

This copies the built web assets (`out/` directory) to both native projects.

### 5. Open in Native IDE

```bash
# Open iOS in Xcode
pnpm run open:ios

# Open Android in Android Studio
pnpm run open:android
```

## iOS Setup

### 1. Configure Signing

In Xcode:
1. Open `ios/App/App.xcworkspace`
2. Select the `App` target
3. Go to "Signing & Capabilities"
4. Select your development team
5. Enable "Automatically manage signing"

### 2. Configure Push Notifications (APNs)

#### Enable Push Notifications Capability
1. In Xcode, select the `App` target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Push Notifications"
5. Add "Background Modes" and enable:
   - Remote notifications
   - Background fetch
   - Voice over IP (for calls)
   - Audio (for voice messages)

#### Create APNs Key
1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select "Keys" and create a new key
4. Enable "Apple Push Notifications service (APNs)"
5. Download the `.p8` key file
6. Note the Key ID and Team ID

### 3. Configure Deep Linking

The app supports deep linking via `nchat://` URL scheme and Universal Links.

#### Universal Links Setup
1. Create an `apple-app-site-association` file on your server at:
   ```
   https://nchat.nself.org/.well-known/apple-app-site-association
   ```

2. File contents:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAM_ID.io.nself.chat",
           "paths": ["*"]
         }
       ]
     }
   }
   ```

3. Enable "Associated Domains" capability in Xcode
4. Add domain: `applinks:nchat.nself.org`

### 4. Configure Firebase (for analytics/crashlytics)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add an iOS app with bundle ID: `io.nself.chat`
3. Download `GoogleService-Info.plist`
4. Add it to `ios/App/App/` directory
5. Install CocoaPods dependencies:
   ```bash
   cd ios/App
   pod install
   ```

### 5. Build and Run

```bash
# Run on simulator
pnpm run run:ios

# Run on connected device
pnpm run run:ios -- --device

# Build for release
pnpm run build:ios
```

### 6. App Icons and Splash Screen

Generate iOS icons and splash screens:

```bash
npx @capacitor/assets generate --ios
```

Or manually add assets to:
- Icons: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Splash: `ios/App/App/Assets.xcassets/Splash.imageset/`

## Android Setup

### 1. Configure Package Name

The package name is already set to `io.nself.chat` in:
- `android/app/build.gradle`
- `AndroidManifest.xml`

### 2. Configure Push Notifications (FCM)

#### Setup Firebase Cloud Messaging
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add an Android app with package name: `io.nself.chat`
3. Download `google-services.json`
4. Copy it to `android/app/google-services.json`

#### Update build.gradle
The Firebase dependency is already configured. Just sync the project:

```bash
cd android
./gradlew clean build
```

### 3. Configure Deep Linking

The app supports deep linking via `nchat://` URL scheme and App Links.

#### App Links Setup
1. Create an `assetlinks.json` file on your server at:
   ```
   https://nchat.nself.org/.well-known/assetlinks.json
   ```

2. File contents:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "io.nself.chat",
       "sha256_cert_fingerprints": [
         "YOUR_SHA256_FINGERPRINT"
       ]
     }
   }]
   ```

3. Get your SHA256 fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

### 4. Configure Signing (for Release)

Create `android/keystore.properties`:

```properties
storeFile=/path/to/your/keystore.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=YOUR_KEY_ALIAS
keyPassword=YOUR_KEY_PASSWORD
```

Generate a keystore:

```bash
keytool -genkey -v -keystore nchat-release.keystore -alias nchat -keyalg RSA -keysize 2048 -validity 10000
```

### 5. ProGuard Rules

ProGuard rules are configured in `android/app/proguard-rules.pro` to protect the app in release builds.

### 6. Build and Run

```bash
# Run on emulator/device
pnpm run run:android

# Build debug APK
pnpm run build:android

# Build release APK
cd android
./gradlew assembleRelease

# Build release bundle (for Play Store)
pnpm run build:android:bundle
```

### 7. App Icons and Splash Screen

Generate Android icons and splash screens:

```bash
npx @capacitor/assets generate --android
```

Or manually add assets to:
- Icons: `android/app/src/main/res/mipmap-*/`
- Splash: `android/app/src/main/res/drawable*/`

## Native Features Integration

### Push Notifications

```typescript
import { pushNotifications } from './src/native/push-notifications';

// Initialize
await pushNotifications.initialize();

// Get device token
const token = pushNotifications.getToken();

// Show local notification
await pushNotifications.showLocalNotification({
  title: 'New Message',
  body: 'You have a new message from John',
  channelId: 'channel-123',
});

// Set badge count (iOS)
await pushNotifications.setBadgeCount(5);
```

### Camera

```typescript
import { camera } from './src/native/camera';

// Take photo
const photo = await camera.takePhoto();

// Pick from gallery
const photo = await camera.pickPhoto();

// Request permissions
const hasPermission = await camera.requestCameraPermission();
```

### Biometric Authentication

```typescript
import { biometrics } from './src/native/biometrics';

// Initialize
await biometrics.initialize();

// Check availability
const isAvailable = await biometrics.checkAvailability();

// Authenticate
const success = await biometrics.authenticate({
  title: 'Authenticate',
  description: 'Verify your identity',
});
```

### File Picker

```typescript
import { filePicker } from './src/native/file-picker';

// Pick a file
const file = await filePicker.pickFile();

// Pick image
const image = await filePicker.pickImage();

// Pick multiple files
const files = await filePicker.pickFiles({ multiple: true });
```

### Haptic Feedback

```typescript
import { haptics } from './src/native/haptics';

// Button press
await haptics.buttonPress();

// Message sent
await haptics.messageSent();

// Error
await haptics.error();
```

### Share

```typescript
import { share } from './src/native/share';

// Share text
await share.shareText('Check out nChat!');

// Share URL
await share.shareUrl('https://nchat.nself.org', 'nChat');

// Share file
await share.shareFile('/path/to/file', 'image/png');
```

### Offline Sync

```typescript
import { offlineSync } from './src/native/offline-sync';

// Initialize
await offlineSync.initialize();

// Add to queue
await offlineSync.addToQueue('SEND_MESSAGE', {
  channelId: '123',
  text: 'Hello',
});

// Force sync
await offlineSync.forceSync();
```

## Development Workflow

### Daily Development

1. **Make changes to web code** (in `src/` directory at root)
2. **Rebuild web assets**:
   ```bash
   cd ../..
   pnpm dev  # or pnpm build for production
   ```
3. **Sync to native**:
   ```bash
   cd platforms/capacitor
   pnpm run sync
   ```
4. **Run on device/emulator**:
   ```bash
   pnpm run run:ios
   # or
   pnpm run run:android
   ```

### Live Reload (Development)

For faster development, use Capacitor's live reload:

1. **Start dev server**:
   ```bash
   cd ../..
   pnpm dev
   ```

2. **Update capacitor.config.ts**:
   ```typescript
   server: {
     url: 'http://192.168.1.100:3000',  // Your local IP
     cleartext: true,
   }
   ```

3. **Sync and run**:
   ```bash
   pnpm run sync
   pnpm run run:ios
   ```

Now changes will hot-reload on the device!

### Debugging

#### iOS
- Use Safari Web Inspector (Safari > Develop > [Device] > [App])
- View native logs in Xcode console

#### Android
- Use Chrome DevTools (chrome://inspect)
- View native logs with adb logcat:
  ```bash
  adb logcat | grep Capacitor
  ```

## Testing on Devices

### iOS

1. **Connect device via USB**
2. **Trust computer on device**
3. **Run**:
   ```bash
   pnpm run run:ios -- --device
   ```

### Android

1. **Enable Developer Options** on device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings > Developer Options > USB Debugging

3. **Connect via USB**

4. **Verify connection**:
   ```bash
   adb devices
   ```

5. **Run**:
   ```bash
   pnpm run run:android
   ```

## Publishing

### iOS (App Store)

1. **Create App Store Connect record**
2. **Archive in Xcode**:
   - Product > Archive
3. **Upload to App Store Connect**
4. **Submit for review**

Or use Fastlane (see Fastlane section below).

### Android (Play Store)

1. **Build release bundle**:
   ```bash
   pnpm run build:android:bundle
   ```

2. **Upload to Play Console**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new release
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`

Or use Fastlane (see Fastlane section below).

## Fastlane Setup

Fastlane automates the build and deployment process.

### Install Fastlane

```bash
# macOS
brew install fastlane

# Or via RubyGems
sudo gem install fastlane
```

### iOS Fastlane Setup

```bash
cd ios
fastlane init
```

### Android Fastlane Setup

```bash
cd android
fastlane init
```

See the Fastlane documentation in the `/fastlane` directory for detailed configuration.

## Common Scripts

```bash
# Development
pnpm run dev              # Build web + sync
pnpm run sync             # Sync web assets to native
pnpm run sync:ios         # Sync iOS only
pnpm run sync:android     # Sync Android only

# Running
pnpm run run:ios          # Run on iOS simulator
pnpm run run:android      # Run on Android emulator

# Building
pnpm run build:ios        # Build iOS app
pnpm run build:android    # Build Android APK

# Opening IDEs
pnpm run open:ios         # Open Xcode
pnpm run open:android     # Open Android Studio

# Maintenance
pnpm run clean            # Remove native projects
pnpm run clean:ios        # Remove iOS project
pnpm run clean:android    # Remove Android project
pnpm run pod:install      # Install iOS pods
pnpm run pod:update       # Update iOS pods

# Diagnostics
pnpm run doctor           # Run Capacitor doctor
```

## Troubleshooting

### iOS Issues

**CocoaPods issues**
```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

**Signing issues**
- Ensure you have a valid development team selected in Xcode
- Check Bundle ID matches your Apple Developer account

**Build errors**
```bash
cd ios/App
rm -rf Pods Podfile.lock
pod install
```

### Android Issues

**Gradle sync failed**
```bash
cd android
./gradlew clean
./gradlew --stop
./gradlew build
```

**SDK version issues**
- Open Android Studio
- File > Project Structure
- Update SDK versions to match requirements

**ADB not found**
- Add Android SDK platform-tools to PATH:
  ```bash
  export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
  ```

### General Issues

**Changes not appearing**
```bash
# Full rebuild
cd ../..
pnpm build
cd platforms/capacitor
pnpm run sync
```

**Plugin not found**
```bash
pnpm install
pnpm run sync
```

**Native projects corrupted**
```bash
pnpm run clean
npx cap add ios
npx cap add android
pnpm run sync
```

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Capacitor docs: https://capacitorjs.com/docs
3. Check GitHub issues: https://github.com/ionic-team/capacitor/issues
4. Contact the nChat team

## License

Copyright © 2025 nself. All rights reserved.
