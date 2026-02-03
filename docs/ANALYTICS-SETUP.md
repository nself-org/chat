# Analytics Setup Guide

**Version**: 0.8.0
**Platform**: iOS, Android, Electron, Web

## Overview

This guide explains how to set up Firebase Analytics and Sentry for the nChat mobile and desktop apps.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Sentry Setup](#sentry-setup)
4. [iOS Configuration](#ios-configuration)
5. [Android Configuration](#android-configuration)
6. [Electron Configuration](#electron-configuration)
7. [Environment Variables](#environment-variables)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Firebase project created
- Sentry account created
- Node.js 20+ installed
- iOS: Xcode 15+ and CocoaPods
- Android: Android Studio and JDK 17

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `nchat-production` (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account
6. Click "Create project"

### 2. Enable Required Services

In Firebase Console:

1. **Analytics**: Enabled by default
2. **Crashlytics**:
   - Go to Crashlytics in left menu
   - Click "Enable Crashlytics"
3. **Performance Monitoring**:
   - Go to Performance in left menu
   - Click "Get started"
4. **Remote Config** (optional):
   - Go to Remote Config
   - Click "Create configuration"

### 3. Add iOS App

1. Click "Add app" → iOS
2. Enter iOS Bundle ID: `com.nself.nchat`
3. Enter App nickname: `nChat iOS`
4. Download `GoogleService-Info.plist`
5. Save to: `platforms/capacitor/ios/App/App/GoogleService-Info.plist`

### 4. Add Android App

1. Click "Add app" → Android
2. Enter package name: `io.nself.chat`
3. Enter App nickname: `nChat Android`
4. Download `google-services.json`
5. Save to: `platforms/capacitor/android/app/google-services.json`

### 5. Add Web App (optional)

1. Click "Add app" → Web
2. Enter App nickname: `nChat Web`
3. Copy Firebase config object
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Sentry Setup

### 1. Create Sentry Project

1. Go to [Sentry.io](https://sentry.io)
2. Click "Create Project"
3. Select platform: "React Native" (for mobile) or "Electron" (for desktop)
4. Enter project name: `nchat-mobile` or `nchat-desktop`
5. Copy the DSN

### 2. Create Additional Projects

For better organization, create separate projects:

- `nchat-ios`
- `nchat-android`
- `nchat-electron`
- `nchat-web`

### 3. Generate Auth Token

1. Go to Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Scopes required:
   - `project:releases`
   - `project:write`
   - `org:read`
4. Copy the token
5. Add to `sentry.properties`

## iOS Configuration

### 1. Install CocoaPods Dependencies

```bash
cd platforms/capacitor/ios/App
pod install
```

### 2. Add GoogleService-Info.plist

1. Open `platforms/capacitor/ios/App/App.xcworkspace` in Xcode
2. Right-click on "App" folder
3. Add Files to "App"
4. Select `GoogleService-Info.plist`
5. Ensure "Copy items if needed" is checked
6. Add to "App" target

### 3. Configure Sentry

Edit `platforms/capacitor/ios/App/App/Info.plist`:

```xml
<key>SentryDSN</key>
<string>YOUR_SENTRY_DSN</string>
```

### 4. Update Podfile

Edit `platforms/capacitor/ios/App/Podfile`:

```ruby
# Firebase
pod 'Firebase/Analytics'
pod 'Firebase/Crashlytics'
pod 'Firebase/Performance'

# Sentry
pod 'Sentry', :git => 'https://github.com/getsentry/sentry-cocoa.git', :tag => '8.17.2'
```

Then run:

```bash
pod install
```

### 5. Build Settings

In Xcode:

1. Select "App" target
2. Build Phases → Add "Run Script"
3. Add Firebase Crashlytics script:

```bash
"${PODS_ROOT}/FirebaseCrashlytics/run"
```

4. Add Sentry upload script:

```bash
export SENTRY_PROPERTIES=../sentry.properties
"${PODS_ROOT}/../../node_modules/@sentry/cli/bin/sentry-cli" upload-dif "$DWARF_DSYM_FOLDER_PATH"
```

## Android Configuration

### 1. Add google-services.json

Copy `google-services.json` to:

```
platforms/capacitor/android/app/google-services.json
```

### 2. Configure build.gradle

The build.gradle is already configured with:

- Firebase plugins
- Sentry plugin
- Required dependencies

### 3. Add Sentry Properties

Create `platforms/capacitor/android/sentry.properties`:

```properties
defaults.url=https://sentry.io/
defaults.org=YOUR_SENTRY_ORG
defaults.project=nchat-android
auth.token=YOUR_SENTRY_AUTH_TOKEN
```

### 4. ProGuard Rules

If using ProGuard, add to `platforms/capacitor/android/app/proguard-rules.pro`:

```proguard
# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Sentry
-keepattributes LineNumberTable,SourceFile
-dontwarn org.slf4j.**
-dontwarn javax.**
-keep class io.sentry.** { *; }
```

## Electron Configuration

### 1. Install Dependencies

```bash
npm install @sentry/electron
```

### 2. Initialize Sentry

Create `platforms/electron/main/sentry.ts`:

```typescript
import * as Sentry from '@sentry/electron/main'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `nchat@${process.env.APP_VERSION}`,
  tracesSampleRate: 0.2,
})
```

### 3. Update main.js

```javascript
// At the top
require('./main/sentry')

// Rest of your code
```

## Environment Variables

Create `.env.local` in project root:

```bash
# Firebase (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_ORG=your_sentry_org
NEXT_PUBLIC_SENTRY_PROJECT=nchat
SENTRY_AUTH_TOKEN=your_auth_token

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_RELEASE_VERSION=0.8.0

# Performance
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SAMPLE_RATE=0.1
```

## Initializing Analytics

### In Your App

Create `src/lib/analytics/init.ts`:

```typescript
import { initializeAnalytics } from '@/lib/analytics'

export async function initAnalytics() {
  await initializeAnalytics({
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    providers: ['firebase', 'sentry'],
  })
}
```

### On App Start

In `src/app/layout.tsx` or main app component:

```typescript
import { initAnalytics } from '@/lib/analytics/init'

useEffect(() => {
  initAnalytics()
}, [])
```

## Testing

### 1. Enable Debug Mode

**iOS**:

1. In Xcode, Edit Scheme → Run → Arguments
2. Add argument: `-FIRDebugEnabled`

**Android**:

```bash
adb shell setprop debug.firebase.analytics.app io.nself.chat
```

### 2. Verify Events

**Firebase**:

1. Open Firebase Console
2. Go to Analytics → DebugView
3. Should see events in real-time

**Sentry**:

1. Open Sentry dashboard
2. Go to Issues
3. Trigger a test error:

```typescript
import { sentryMobile } from '@/lib/analytics/sentry-mobile'

sentryMobile.captureMessage('Test message', 'info')
```

### 3. Test Crash Reporting

**iOS**:

```swift
fatalError("Test crash")
```

**Android**:

```kotlin
throw RuntimeException("Test crash")
```

Should appear in Firebase Crashlytics and Sentry within a few minutes.

## Troubleshooting

### Firebase Not Tracking Events

**Issue**: Events not appearing in Firebase Console

**Solutions**:

1. Check `GoogleService-Info.plist` / `google-services.json` is correctly placed
2. Verify app is in debug mode
3. Wait up to 24 hours for production data
4. Check DebugView for real-time events

### Sentry Not Capturing Errors

**Issue**: Errors not appearing in Sentry

**Solutions**:

1. Verify DSN is correct
2. Check network connectivity
3. Ensure Sentry is initialized before errors occur
4. Check beforeSend filter isn't blocking events

### iOS Build Fails

**Issue**: Build fails with Firebase/Sentry errors

**Solutions**:

```bash
cd platforms/capacitor/ios/App
pod deintegrate
pod install
```

### Android Build Fails

**Issue**: Build fails with Firebase/Sentry errors

**Solutions**:

```bash
cd platforms/capacitor/android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Consent Not Saving

**Issue**: User consent resets on app restart

**Solutions**:

1. Check localStorage permissions
2. Verify Capacitor Preferences plugin is installed
3. Check for errors in console

## Best Practices

### 1. Privacy First

- Always request consent before tracking
- Provide granular controls
- Respect user choices
- Be transparent about data collection

### 2. Performance

- Sample performance data (don't track 100%)
- Use appropriate sample rates:
  - Production: 0.1 (10%)
  - Staging: 0.5 (50%)
  - Development: 1.0 (100%)

### 3. Error Filtering

- Filter sensitive data from error reports
- Don't send passwords, tokens, API keys
- Scrub PII from breadcrumbs

### 4. Event Naming

- Use consistent naming conventions
- Follow Firebase event naming rules:
  - Lowercase with underscores
  - Max 40 characters
  - No spaces or special characters

### 5. Testing

- Test on real devices, not just simulators
- Test in different network conditions
- Test opt-out functionality
- Test data export/deletion

## Resources

- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Capacitor Firebase Plugin](https://github.com/capawesome-team/capacitor-firebase)
- [Privacy Policy Template](./privacy/analytics-privacy.md)

## Support

For issues:

1. Check [Common Issues](../COMMON-ISSUES.md)
2. Search GitHub issues
3. Contact: dev@nself.org
