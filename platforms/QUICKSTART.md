# Mobile Apps Quick Start Guide

Get nChat mobile apps running on iOS and Android in under 30 minutes!

## Prerequisites Checklist

### Everyone Needs

- ✅ Node.js 20+ installed
- ✅ pnpm 9.15.4+ installed
- ✅ Git installed

### For iOS Development

- ✅ macOS (required)
- ✅ Xcode 15+ installed from App Store
- ✅ Xcode Command Line Tools: `xcode-select --install`
- ✅ CocoaPods: `sudo gem install cocoapods`

### For Android Development

- ✅ Android Studio Hedgehog+ installed
- ✅ Android SDK API 34 installed
- ✅ Java JDK 17 installed
- ✅ Add to PATH:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

---

## Option A: Capacitor (Recommended for MVP)

### Step 1: Install Dependencies

```bash
cd platforms/capacitor
pnpm install
```

### Step 2: Build Web App

```bash
cd ../..
pnpm build
pnpm export  # Exports to 'out/' directory
```

### Step 3: Initialize Native Projects

```bash
cd platforms/capacitor

# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

### Step 4: Sync Web Assets

```bash
pnpm run sync
```

### Step 5: Run on iOS

```bash
# Open in Xcode
pnpm run open:ios

# In Xcode:
# 1. Select a simulator (iPhone 15 Pro)
# 2. Click ▶️ Run button
```

### Step 6: Run on Android

```bash
# Open in Android Studio
pnpm run open:android

# In Android Studio:
# 1. Wait for Gradle sync to complete
# 2. Select an emulator or connected device
# 3. Click ▶️ Run button
```

### That's it! 🎉

Your app should now be running on both platforms!

---

## Option B: React Native (For Native Performance)

### Step 1: Install Dependencies

```bash
cd platforms/react-native
pnpm install
```

### Step 2: Install iOS Pods

```bash
pnpm run pod:install
# or
cd ios && pod install && cd ..
```

### Step 3: Start Metro Bundler

```bash
pnpm start
```

### Step 4: Run on iOS (New Terminal)

```bash
pnpm run ios
# or for specific simulator
pnpm run ios -- --simulator="iPhone 15 Pro"
```

### Step 5: Run on Android (New Terminal)

```bash
# Make sure an Android emulator is running or device is connected
pnpm run android
```

### That's it! 🎉

Your app should now be running on both platforms!

---

## Testing on Physical Devices

### iOS Device

1. **Connect iPhone via USB**
2. **Trust computer on device** (popup will appear)
3. **In Xcode**:
   - Select your device from the dropdown
   - Go to Signing & Capabilities
   - Select your Apple Developer account
   - Click ▶️ Run

4. **On Device**:
   - Settings > General > VPN & Device Management
   - Trust your developer certificate

### Android Device

1. **Enable Developer Options**:
   - Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect via USB**

4. **Verify Connection**:

   ```bash
   adb devices
   # Should show your device
   ```

5. **Run**:

   ```bash
   # Capacitor
   cd platforms/capacitor
   pnpm run run:android

   # React Native
   cd platforms/react-native
   pnpm run android
   ```

---

## Common Issues & Fixes

### iOS Issues

**"Command PhaseScriptExecution failed"**

```bash
cd ios
pod deintegrate
rm -rf Pods Podfile.lock
pod install
```

**"No Bundle URL present"**

```bash
# Make sure Metro is running
pnpm start -- --reset-cache
```

### Android Issues

**"SDK location not found"**

```bash
# Create android/local.properties
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

**"Execution failed for task ':app:installDebug'"**

```bash
cd android
./gradlew clean
cd ..
pnpm run android
```

### Both Platforms

**"Unable to resolve module"**

```bash
# Clear all caches
rm -rf node_modules
pnpm install

# Capacitor
pnpm run sync

# React Native
pnpm start -- --reset-cache
```

---

## Next Steps

### 1. Enable Hot Reload (Development)

**Capacitor**:

```typescript
// capacitor.config.ts
server: {
  url: 'http://YOUR_LOCAL_IP:3000',
  cleartext: true,
}
```

**React Native**:
Hot reload is enabled by default!

### 2. Configure Firebase (Required for Push Notifications)

1. **Create Firebase Project**: https://console.firebase.google.com
2. **Add iOS App**:
   - Bundle ID: `io.nself.chat` (Capacitor) or `org.nself.nchat` (RN)
   - Download `GoogleService-Info.plist`
   - Add to Xcode project

3. **Add Android App**:
   - Package name: Same as above
   - Download `google-services.json`
   - Place in `android/app/`

### 3. Test Native Features

**Push Notifications**:

```typescript
import { pushNotifications } from '@native/push-notifications'
await pushNotifications.initialize()
```

**Camera**:

```typescript
import { camera } from '@native/camera'
const photo = await camera.takePhoto()
```

**Biometrics**:

```typescript
import { biometrics } from '@native/biometrics'
const authenticated = await biometrics.authenticate()
```

### 4. Build for Production

**Capacitor**:

```bash
cd platforms/capacitor

# iOS
pnpm run build:ios

# Android
pnpm run build:android
```

**React Native**:

```bash
cd platforms/react-native

# iOS
pnpm run build:ios

# Android
pnpm run build:android:bundle
```

---

## Quick Command Reference

### Capacitor

```bash
# Development
pnpm run dev              # Build web + sync
pnpm run sync             # Sync web to native
pnpm run open:ios         # Open Xcode
pnpm run open:android     # Open Android Studio

# Running
pnpm run run:ios          # Run on iOS
pnpm run run:android      # Run on Android

# Building
pnpm run build:ios        # Build iOS
pnpm run build:android    # Build Android

# Maintenance
pnpm run clean            # Remove native projects
pnpm run doctor           # Check setup
```

### React Native

```bash
# Development
pnpm start                # Start Metro
pnpm run ios              # Run on iOS
pnpm run android          # Run on Android

# Building
pnpm run build:ios        # Build iOS
pnpm run build:android    # Build Android

# Maintenance
pnpm run clean            # Clear cache
pnpm run clean:ios        # Clean iOS build
pnpm run clean:android    # Clean Android build
pnpm run pod:install      # Install iOS pods
```

---

## Getting Help

### Documentation

- Capacitor: `platforms/capacitor/README.md` (400+ lines)
- React Native: `platforms/react-native/README.md` (600+ lines)
- Summary: `platforms/MOBILE-APPS-SUMMARY.md`

### Online Resources

- Capacitor Docs: https://capacitorjs.com/docs
- React Native Docs: https://reactnative.dev/docs
- Firebase Setup: https://firebase.google.com/docs/ios/setup

### Troubleshooting

Check the README files for your platform - they contain detailed troubleshooting sections!

---

## Success Checklist

- [ ] iOS app builds and runs on simulator
- [ ] Android app builds and runs on emulator
- [ ] App runs on physical iOS device
- [ ] App runs on physical Android device
- [ ] Firebase configured
- [ ] Push notifications work
- [ ] Camera/photo library access works
- [ ] Biometric authentication works
- [ ] Deep linking works (nchat://)
- [ ] Offline mode works

---

## Time Estimates

| Task                         | Time          |
| ---------------------------- | ------------- |
| Initial setup (Capacitor)    | 15 min        |
| Initial setup (React Native) | 20 min        |
| Firebase setup               | 10 min        |
| First iOS build              | 10 min        |
| First Android build          | 10 min        |
| **Total**                    | **30-45 min** |

---

## Ready for Production?

When your app is ready:

1. ✅ Test all features on physical devices
2. ✅ Generate release builds
3. ✅ Create App Store Connect record (iOS)
4. ✅ Create Play Console app (Android)
5. ✅ Upload builds for review
6. ✅ Submit for review

See the full README files for detailed deployment instructions!

---

**Questions?** Check the platform-specific README files for comprehensive documentation.

**Happy Coding!** 🚀
