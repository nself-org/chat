# nChat React Native - iOS & Android Mobile Apps

This directory contains the React Native mobile application for nChat, supporting both iOS and Android platforms with native performance and full access to device features.

## Overview

React Native provides:

- True native performance
- Full access to native APIs
- Platform-specific UI components
- Large ecosystem of third-party packages
- Hot reload for rapid development

### Native Features

- Push notifications (APNs & FCM)
- Camera and media library
- Biometric authentication
- Real-time messaging with Socket.IO
- Offline sync with MMKV storage
- Haptic feedback
- Native sharing
- Deep linking
- Background sync

## Prerequisites

### General Requirements

- Node.js >= 20.0.0
- pnpm >= 9.15.4
- React Native CLI
- Watchman (recommended for macOS)

```bash
# Install Watchman (macOS)
brew install watchman

# Install React Native CLI globally
npm install -g react-native-cli
```

### iOS Requirements

- macOS (required for iOS development)
- Xcode 15.0 or later
- CocoaPods 1.10 or later
- iOS 14.0+ deployment target
- Apple Developer account

```bash
# Install CocoaPods
sudo gem install cocoapods

# Or via Homebrew
brew install cocoapods
```

### Android Requirements

- Android Studio Hedgehog (2023.1.1) or later
- Android SDK API 34
- Java JDK 17
- Android NDK
- Gradle 8.0+

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install iOS Pods

```bash
pnpm run pod:install
# or
cd ios && pod install && cd ..
```

### 3. Start Metro Bundler

```bash
pnpm start
```

### 4. Run on iOS

In a new terminal:

```bash
pnpm run ios
# or for specific simulator
pnpm run ios -- --simulator="iPhone 15 Pro"
```

### 5. Run on Android

In a new terminal:

```bash
pnpm run android
```

## Project Setup

### Initialize Native Projects

If starting from scratch, initialize React Native:

```bash
npx react-native init nchat --template react-native-template-typescript
```

Then merge the configuration files from this directory.

### iOS Setup

#### 1. Configure Info.plist

Merge `ios-info.plist.template` into `ios/nchat/Info.plist`:

```bash
# The template contains all required permissions and configurations
```

Key configurations:

- Camera, microphone, photo library permissions
- Face ID usage description
- Background modes (audio, fetch, remote-notification, voip)
- URL schemes for deep linking
- Associated domains for universal links

#### 2. Configure Podfile

Copy `ios.podfile` to `ios/Podfile` and install:

```bash
cp ios.podfile ios/Podfile
cd ios
pod install
cd ..
```

#### 3. Configure Firebase (iOS)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add an iOS app with bundle ID: `org.nself.nchat`
3. Download `GoogleService-Info.plist`
4. Add it to Xcode project:
   - Open `ios/nchat.xcworkspace` in Xcode
   - Drag `GoogleService-Info.plist` into the project
   - Ensure "Copy items if needed" is checked

#### 4. Configure Signing

In Xcode:

1. Open `ios/nchat.xcworkspace`
2. Select the `nchat` target
3. Go to "Signing & Capabilities"
4. Select your development team
5. Enable "Automatically manage signing"

#### 5. Add Capabilities

In Xcode, add these capabilities:

- Push Notifications
- Background Modes (check: Audio, Fetch, Remote notifications, Voice over IP)
- Associated Domains (add: `applinks:nchat.nself.org`)

### Android Setup

#### 1. Configure AndroidManifest.xml

Merge `android-manifest.template.xml` into `android/app/src/main/AndroidManifest.xml`.

Key configurations:

- All required permissions
- Deep linking intents
- Firebase messaging service
- Network security config

#### 2. Configure build.gradle

Merge `android-build.gradle.template` into `android/app/build.gradle`.

Key configurations:

- Application ID: `org.nself.nchat`
- Min SDK: 24
- Target SDK: 34
- Firebase dependencies
- Product flavors (production, staging, development)
- ProGuard configuration

#### 3. Add ProGuard Rules

Copy `android-proguard-rules.pro` to `android/app/proguard-rules.pro`.

#### 4. Configure Firebase (Android)

1. In Firebase Console, add an Android app with package name: `org.nself.nchat`
2. Download `google-services.json`
3. Copy it to `android/app/google-services.json`

#### 5. Configure Signing

Create `android/keystore.properties`:

```properties
storeFile=/path/to/nchat-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=nchat
keyPassword=YOUR_KEY_PASSWORD
```

Generate a release keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore nchat-release.keystore -alias nchat -keyalg RSA -keysize 2048 -validity 10000
```

Update `android/app/build.gradle` to reference `keystore.properties`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
}
```

#### 6. Network Security Config

Create `android/app/src/main/res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
    </domain-config>
</network-security-config>
```

## Deep Linking

### iOS Universal Links

1. Create `apple-app-site-association` file at:

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
           "appID": "TEAM_ID.org.nself.nchat",
           "paths": ["*"]
         }
       ]
     }
   }
   ```

### Android App Links

1. Create `assetlinks.json` file at:

   ```
   https://nchat.nself.org/.well-known/assetlinks.json
   ```

2. File contents:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "org.nself.nchat",
         "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
       }
     }
   ]
   ```

3. Get SHA256 fingerprint:

   ```bash
   # Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256

   # Release keystore
   keytool -list -v -keystore nchat-release.keystore -alias nchat
   ```

### Handling Deep Links

Deep links are handled in `src/navigation/linking.ts`:

```typescript
import { LinkingOptions } from '@react-navigation/native'

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['nchat://', 'https://nchat.nself.org'],
  config: {
    screens: {
      Chat: {
        path: 'chat/:channelId',
      },
      Profile: {
        path: 'profile/:userId',
      },
      // ... more screens
    },
  },
}
```

## Development

### Running on Devices

#### iOS Device

1. Connect device via USB
2. Trust computer on device
3. In Xcode, select your device
4. Run:
   ```bash
   pnpm run ios:device
   ```

#### Android Device

1. Enable Developer Options:
   - Settings > About Phone
   - Tap "Build Number" 7 times

2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging

3. Connect via USB and verify:

   ```bash
   adb devices
   ```

4. Run:
   ```bash
   pnpm run android:device
   ```

### Live Reload

Metro bundler provides fast refresh by default. Changes to JavaScript/TypeScript will reload automatically.

For native code changes:

- iOS: Rebuild in Xcode or run `pnpm run ios`
- Android: Run `pnpm run android`

### Debugging

#### React Native Debugger

1. Install React Native Debugger:

   ```bash
   brew install --cask react-native-debugger
   ```

2. Open React Native Debugger
3. In app, shake device or press Cmd+D (iOS) / Cmd+M (Android)
4. Select "Debug"

#### Flipper

Flipper is integrated for advanced debugging:

1. Install Flipper: https://fbflipper.com/
2. Open Flipper
3. Run app in debug mode
4. Flipper will auto-connect

Features:

- Network inspector
- Layout inspector
- Logs viewer
- Shared preferences inspector
- Database inspector

#### Chrome DevTools (Android)

```bash
# Open Chrome and navigate to:
chrome://inspect

# Your app will appear under "Remote Target"
```

#### Safari Web Inspector (iOS)

1. Enable Web Inspector on device:
   - Settings > Safari > Advanced > Web Inspector

2. Connect device to Mac
3. Run app
4. In Safari: Develop > [Your Device] > [App]

### Logging

```bash
# iOS logs
pnpm run ios:logs
# or
xcrun simctl spawn booted log stream --predicate 'processImagePath endswith "nchat"'

# Android logs
pnpm run android:logs
# or
adb logcat *:S ReactNative:V ReactNativeJS:V
```

## Building for Production

### iOS Build

#### Via Xcode

1. Open `ios/nchat.xcworkspace`
2. Select "Any iOS Device (arm64)"
3. Product > Archive
4. Distribute App

#### Via Command Line

```bash
# Build IPA
pnpm run build:ios

# Or using Fastlane
cd fastlane
fastlane ios release
```

### Android Build

#### Debug APK

```bash
pnpm run build:android
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Release APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

#### Release Bundle (AAB)

For Google Play Store:

```bash
pnpm run build:android:bundle
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

#### Using Fastlane

```bash
cd fastlane
fastlane android release
```

## Fastlane Automation

### Setup Fastlane

```bash
# Install Fastlane
sudo gem install fastlane

# Or via Homebrew
brew install fastlane
```

### Configuration

1. Set environment variables in `.env`:

```bash
# iOS
APPLE_ID=your-apple-id@email.com
TEAM_ID=YOUR_TEAM_ID
ITC_TEAM_ID=YOUR_ITC_TEAM_ID

# Android
PLAY_STORE_JSON_KEY=/path/to/play-store-key.json
NCHAT_RELEASE_STORE_FILE=/path/to/nchat-release.keystore
NCHAT_RELEASE_STORE_PASSWORD=your-store-password
NCHAT_RELEASE_KEY_ALIAS=nchat
NCHAT_RELEASE_KEY_PASSWORD=your-key-password
```

### Available Lanes

#### iOS

```bash
cd fastlane

# Development build
fastlane ios dev

# Release build
fastlane ios release

# Upload to TestFlight
fastlane ios beta

# Upload to App Store
fastlane ios deploy

# Run tests
fastlane ios test

# Take screenshots
fastlane ios screenshots
```

#### Android

```bash
cd fastlane

# Development build
fastlane android dev

# Release build
fastlane android release

# Upload to Play Store (internal)
fastlane android internal

# Upload to Play Store (beta)
fastlane android beta

# Upload to Play Store (production)
fastlane android deploy

# Run tests
fastlane android test

# Take screenshots
fastlane android screenshots
```

## Native Modules

### Push Notifications

```typescript
import { pushNotifications } from '@native/push-notifications'

// Initialize
await pushNotifications.initialize()

// Get token
const token = await pushNotifications.getToken()

// Handle notification
pushNotifications.onNotificationReceived((notification) => {
  console.log('Received:', notification)
})
```

### Camera

```typescript
import { camera } from '@native/camera'

// Take photo
const photo = await camera.takePhoto()

// Pick from gallery
const photo = await camera.pickImage()

// Record video
const video = await camera.recordVideo()
```

### Biometrics

```typescript
import { biometrics } from '@native/biometrics'

// Check availability
const available = await biometrics.isAvailable()

// Authenticate
const success = await biometrics.authenticate({
  reason: 'Login to nChat',
})
```

### Offline Storage

```typescript
import { OfflineStorage, MessageCache, SyncQueue } from '@utils/offline-storage'

// Store data
OfflineStorage.set('key', { data: 'value' })

// Get data
const data = OfflineStorage.get('key')

// Cache messages
MessageCache.setChannelMessages('channel-id', messages)

// Add to sync queue
SyncQueue.addToQueue({
  type: 'SEND_MESSAGE',
  payload: { text: 'Hello' },
})
```

### Platform Detection

```typescript
import { isIOS, isAndroid, platformSelect, scale } from '@utils/platform'

// Platform check
if (isIOS) {
  // iOS-specific code
}

// Platform-specific value
const padding = platformSelect({
  ios: 20,
  android: 16,
  default: 12,
})

// Responsive sizing
const fontSize = scale(16)
```

## Testing

### Unit Tests

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### E2E Tests

Install Detox:

```bash
npm install -g detox-cli
```

Run E2E tests:

```bash
# iOS
detox test --configuration ios.sim.debug

# Android
detox test --configuration android.emu.debug
```

## Performance Optimization

### Bundle Size

Analyze bundle:

```bash
npx react-native-bundle-visualizer
```

### Hermes Engine

Hermes is enabled by default for better performance. To disable:

```javascript
// android/app/build.gradle
project.ext.react = [
    enableHermes: false
]

// ios/Podfile
:hermes_enabled => false
```

### ProGuard (Android)

ProGuard is configured for release builds to:

- Minify code
- Remove unused code
- Obfuscate class names

### Image Optimization

```bash
# Compress images
pnpm run optimize:images
```

## Troubleshooting

### iOS Issues

**Pods not found**

```bash
cd ios
pod deintegrate
pod install
```

**Build fails after updating packages**

```bash
pnpm run clean:ios
cd ios && pod install && cd ..
pnpm run ios
```

**CocoaPods version issues**

```bash
sudo gem install cocoapods
pod repo update
```

### Android Issues

**Gradle build failed**

```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
pnpm run android
```

**ADB not found**

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Metro bundler issues**

```bash
pnpm start -- --reset-cache
```

### General Issues

**Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
pnpm start -- --reset-cache
```

**Watchman issues (macOS)**

```bash
watchman watch-del-all
rm -rf $TMPDIR/react-*
```

**Build artifacts cleanup**

```bash
# iOS
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Android
cd android
./gradlew clean
cd ..

# Node
rm -rf node_modules
pnpm install
```

## Scripts Reference

```bash
# Development
pnpm start                # Start Metro bundler
pnpm run ios              # Run on iOS simulator
pnpm run android          # Run on Android emulator
pnpm run ios:device       # Run on iOS device
pnpm run android:device   # Run on Android device

# Building
pnpm run build:ios        # Build iOS app
pnpm run build:android    # Build Android APK
pnpm run build:android:bundle  # Build Android bundle

# Release
pnpm run ios:release      # Run iOS in release mode
pnpm run android:release  # Run Android in release mode

# Cleaning
pnpm run clean            # Clear Metro cache
pnpm run clean:ios        # Clean iOS build
pnpm run clean:android    # Clean Android build

# Testing
pnpm test                 # Run unit tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Generate coverage report

# Linting
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix ESLint errors
pnpm run type-check       # TypeScript type checking

# Pods
pnpm run pod:install      # Install iOS pods
pnpm run pod:update       # Update iOS pods
```

## Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Fastlane Documentation](https://docs.fastlane.tools/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review React Native docs: https://reactnative.dev
3. Check GitHub issues
4. Contact the nChat team

## License

Copyright © 2025 nself. All rights reserved.
