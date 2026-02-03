# Mobile Deployment Troubleshooting Guide

Comprehensive troubleshooting guide for common mobile deployment issues on iOS and Android.

## Table of Contents

- [iOS Troubleshooting](#ios-troubleshooting)
  - [Build Errors](#ios-build-errors)
  - [Code Signing Issues](#code-signing-issues)
  - [Upload Failures](#ios-upload-failures)
  - [TestFlight Issues](#testflight-issues)
  - [App Review Rejections](#app-review-rejections)
- [Android Troubleshooting](#android-troubleshooting)
  - [Build Errors](#android-build-errors)
  - [Signing Issues](#signing-issues)
  - [Upload Failures](#android-upload-failures)
  - [Play Console Issues](#play-console-issues)
- [Common Issues](#common-issues)
- [Debug Tools](#debug-tools)

---

## iOS Troubleshooting

### iOS Build Errors

#### Error: "Command PhaseScriptExecution failed"

**Symptom**: Build fails during script execution phase.

**Solution**:

```bash
# Clean build folder
cd platforms/capacitor/ios
rm -rf build/
rm -rf DerivedData/

# Update CocoaPods
pod deintegrate
pod install --repo-update

# Rebuild
cd ../..
./scripts/deploy-mobile-ios.sh
```

#### Error: "Module not found" or "No such module"

**Symptom**: Swift modules not found during build.

**Solution**:

```bash
# Clean build and derived data
cd platforms/capacitor/ios
xcodebuild clean

# Delete derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Update pods
pod install --repo-update

# Rebuild
cd ../..
./scripts/deploy-mobile-ios.sh
```

#### Error: "Build input file cannot be found"

**Symptom**: Xcode cannot find source files.

**Solution**:

1. Open Xcode: `cd platforms/capacitor && npx cap open ios`
2. Check file references in Project Navigator (red files = missing)
3. Remove missing file references
4. Re-add files if needed
5. Clean and rebuild

#### Error: "The operation couldn't be completed. Unable to launch..."

**Symptom**: App won't launch on simulator.

**Solution**:

```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all

# Rebuild and run
cd platforms/capacitor
npx cap sync ios
npx cap run ios
```

#### Error: "Cycle in dependencies" or "Circular dependency"

**Symptom**: Build fails due to circular dependencies between targets.

**Solution**:

1. Open project in Xcode
2. Select project → Build Phases
3. Check "Target Dependencies"
4. Remove any circular dependencies
5. Rebuild

### Code Signing Issues

#### Error: "No signing certificate 'iOS Distribution' found"

**Symptom**: Distribution certificate not found.

**Solution**:

**Option 1: Automatic Signing (Recommended)**

1. Open in Xcode: `npx cap open ios`
2. Select project → Signing & Capabilities
3. Enable "Automatically manage signing"
4. Select your Team
5. Xcode downloads certificates automatically

**Option 2: Manual Signing**

```bash
# Download certificates from developer.apple.com
# Double-click to install in Keychain
# Verify installation
security find-identity -v -p codesigning

# Should show: "iPhone Distribution: Your Name (TEAM_ID)"
```

#### Error: "No provisioning profiles matching found"

**Symptom**: No matching provisioning profile for bundle identifier.

**Solution**:

1. Go to https://developer.apple.com
2. Certificates, Identifiers & Profiles → Profiles
3. Create new profile:
   - Type: App Store
   - App ID: Your bundle identifier
   - Certificate: Your distribution certificate
   - Name: Descriptive name
4. Download and double-click to install
5. In Xcode, refresh provisioning profiles:
   - Xcode → Preferences → Accounts
   - Select your account
   - Download Manual Profiles

#### Error: "The entitlements specified in your application's Code Signing Entitlements file do not match those specified in your provisioning profile"

**Symptom**: Entitlements mismatch.

**Solution**:

1. Check App ID capabilities at developer.apple.com
2. Enable required capabilities (Push Notifications, etc.)
3. Regenerate provisioning profile
4. Download and install new profile
5. Clean build folder
6. Rebuild

#### Error: "Code signing is required for product type 'Application'"

**Symptom**: Signing not configured properly.

**Solution**:

```bash
# Set signing identity
export IOS_SIGNING_IDENTITY="iPhone Distribution"

# Or in Xcode:
# 1. Select project → Signing & Capabilities
# 2. Choose correct Team
# 3. Select correct Provisioning Profile
# 4. Clean and rebuild
```

### iOS Upload Failures

#### Error: "Unable to validate your application"

**Symptom**: Validation fails before upload.

**Causes & Solutions**:

**Missing App Icon**

```bash
# Ensure app icon is 1024x1024, no transparency
# Check: platforms/capacitor/ios/App/App/Assets.xcassets/AppIcon.appiconset/
# Must include all required sizes
```

**Invalid Bundle Identifier**

```bash
# Check Info.plist
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" \
  platforms/capacitor/ios/App/App/Info.plist

# Should match App Store Connect
```

**Missing Required Architecture**

```bash
# Ensure building for generic iOS device
xcodebuild -showBuildSettings -workspace ... | grep ARCHS
# Should include: arm64
```

#### Error: "This bundle is invalid. The key UIRequiredDeviceCapabilities contains value 'armv7' which is not supported"

**Symptom**: Old architecture specified.

**Solution**:

```bash
# Edit Info.plist
cd platforms/capacitor/ios/App/App
/usr/libexec/PlistBuddy -c "Delete :UIRequiredDeviceCapabilities" Info.plist
/usr/libexec/PlistBuddy -c "Add :UIRequiredDeviceCapabilities array" Info.plist
/usr/libexec/PlistBuddy -c "Add :UIRequiredDeviceCapabilities:0 string arm64" Info.plist
```

#### Error: "altool failed with error: Authentication failed"

**Symptom**: Cannot authenticate for upload.

**Solution**:

```bash
# Generate app-specific password at:
# https://appleid.apple.com/account/manage

# Set environment variable
export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Or store in keychain
xcrun altool --store-password-in-keychain-item "AC_PASSWORD" \
  -u "your@email.com" -p "xxxx-xxxx-xxxx-xxxx"

# Then use in uploads
xcrun altool --upload-app ... --password "@keychain:AC_PASSWORD"
```

#### Error: "Asset validation failed: Invalid Provisioning Profile"

**Symptom**: Provisioning profile issues during upload.

**Solution**:

```bash
# Use automatic signing with export
# Ensure ExportOptions.plist uses:
# <key>signingStyle</key>
# <string>automatic</string>

# Or regenerate provisioning profile
# Clean build and re-export
```

### TestFlight Issues

#### Issue: "Build stuck in Processing" for hours

**Symptom**: Build processing never completes.

**Common Causes & Solutions**:

1. **Large binary size**
   - Optimize assets
   - Remove unused resources
   - Use asset compression

2. **Missing encryption declaration**
   - Add to Info.plist:

   ```xml
   <key>ITSAppUsesNonExemptEncryption</key>
   <false/>
   ```

3. **Apple server issues**
   - Wait 24 hours
   - Check Apple Developer System Status
   - Re-upload if necessary

#### Issue: "Build not appearing in TestFlight"

**Symptom**: Upload successful but build not visible.

**Solution**:

1. Wait 10-30 minutes for processing
2. Check email for processing failure notification
3. Verify build number is newer than existing builds
4. Check TestFlight tab, not App Store tab
5. Refresh page in browser

#### Issue: "Beta app review rejected"

**Symptom**: External testing rejected by review team.

**Common Reasons**:

- Crash on launch
- Sign-in required with no test account
- Broken core functionality
- Inappropriate content

**Solution**:

1. Read rejection email carefully
2. Fix reported issues
3. Add test account in App Store Connect if needed
4. Submit new build for external testing

### App Review Rejections

#### Rejection: "Guideline 2.1 - Performance - App Completeness"

**Reason**: App crashes or has broken functionality.

**Solution**:

1. Test thoroughly before submission
2. Fix all crashes
3. Test on multiple iOS versions
4. Submit crash logs with resolution details
5. Resubmit

#### Rejection: "Guideline 4.0 - Design"

**Reason**: UI issues or poor user experience.

**Solution**:

1. Review Apple Human Interface Guidelines
2. Fix UI issues
3. Test on all screen sizes
4. Ensure consistent design
5. Resubmit

#### Rejection: "Guideline 5.1.1 - Legal - Privacy"

**Reason**: Missing privacy policy or data collection disclosure.

**Solution**:

1. Add privacy policy URL in App Store Connect
2. Declare data collection in App Privacy section
3. Add privacy policy to app if needed
4. Be transparent about data usage
5. Resubmit

---

## Android Troubleshooting

### Android Build Errors

#### Error: "Gradle build failed with exit code 1"

**Symptom**: Generic Gradle build failure.

**Diagnosis**:

```bash
# Run with detailed logging
cd platforms/capacitor/android
./gradlew assembleRelease --stacktrace --info

# Check specific error in output
```

**Common Solutions**:

**OutOfMemoryError**

```bash
# Increase Gradle memory
echo "org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m" \
  >> gradle.properties
```

**Missing SDK/tools**

```bash
# Install via Android Studio
# Tools → SDK Manager → Install missing components

# Or via command line
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

#### Error: "Could not resolve all dependencies"

**Symptom**: Dependency resolution failures.

**Solution**:

```bash
# Clear Gradle cache
cd platforms/capacitor/android
./gradlew clean

# Delete cached files
rm -rf ~/.gradle/caches/
rm -rf .gradle/

# Sync again
./gradlew --refresh-dependencies assembleRelease
```

#### Error: "Execution failed for task ':app:mergeReleaseResources'"

**Symptom**: Resource merging conflicts.

**Solution**:

```bash
# Check for duplicate resources
# Look in: android/app/src/main/res/

# Remove duplicates or rename conflicting resources

# Clean and rebuild
./gradlew clean assembleRelease
```

#### Error: "Manifest merger failed"

**Symptom**: AndroidManifest.xml conflicts.

**Solution**:

```bash
# View detailed merger error
./gradlew assembleRelease --debug | grep -A 50 "Manifest merger"

# Common fix: Add tools namespace
# Edit android/app/src/main/AndroidManifest.xml
<manifest xmlns:android="..."
          xmlns:tools="http://schemas.android.com/tools">

    <!-- Override conflicting attributes -->
    <application
        tools:replace="android:allowBackup,android:label">
```

#### Error: "Duplicate class found in modules"

**Symptom**: Same class defined in multiple dependencies.

**Solution**:

```bash
# Edit android/app/build.gradle
dependencies {
    // Exclude duplicate modules
    implementation("some.library") {
        exclude group: 'duplicate.group', module: 'duplicate-module'
    }
}

# Or use exclude strategy
configurations.all {
    exclude group: 'duplicate.group', module: 'duplicate-module'
}
```

### Signing Issues

#### Error: "Keystore file not found"

**Symptom**: Cannot find keystore for signing.

**Solution**:

```bash
# Verify path
ls -la "$ANDROID_KEYSTORE_PATH"

# If missing, create new keystore (ONLY for new apps)
keytool -genkey -v \
  -keystore release.keystore \
  -alias upload-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Set correct path
export ANDROID_KEYSTORE_PATH="/full/path/to/release.keystore"
```

#### Error: "Failed to read key from keystore"

**Symptom**: Wrong password or corrupted keystore.

**Solution**:

```bash
# Verify keystore
keytool -list -v -keystore release.keystore

# If password is correct but still fails:
# Keystore may be corrupted, you'll need to:
# 1. Create new keystore (only for unreleased apps)
# 2. Or recover from backup

# Check keystore format
file release.keystore
# Should show: Java KeyStore
```

#### Error: "Entry ... has been previously signed"

**Symptom**: APK/AAB already signed.

**Solution**:

```bash
# Clean build completely
cd platforms/capacitor/android
./gradlew clean

# Remove old outputs
rm -rf app/build/outputs/

# Rebuild
./gradlew bundleRelease
```

### Android Upload Failures

#### Error: "Upload failed: Invalid APK/AAB"

**Symptom**: Play Console rejects upload.

**Common Causes**:

**Version Code Too Low**

```bash
# Version code must be higher than previous
# Edit android/app/build.gradle
versionCode 123456789  # Must be > previous

# Or let script auto-increment
# (deployment script uses timestamp)
```

**Missing Permissions**

```bash
# Ensure required permissions in AndroidManifest.xml
<uses-permission android:name="android.permission.INTERNET" />
# etc.
```

**Invalid Package Name**

```bash
# Verify package name matches Play Console
# android/app/build.gradle:
applicationId "com.yourcompany.nchat"

# Must match Play Console exactly
```

#### Error: "This release is not compliant with Google Play 64-bit requirement"

**Symptom**: Missing 64-bit architecture.

**Solution**:

```bash
# Edit android/app/build.gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }
    }
}

# Or ensure AAB upload (Google generates all ABIs)
./gradlew bundleRelease
```

#### Error: "Minimum SDK version too low"

**Symptom**: Target SDK requirements not met.

**Solution**:

```bash
# Edit android/app/build.gradle
android {
    defaultConfig {
        minSdkVersion 24  // Minimum 24
        targetSdkVersion 34  // Latest is best
        compileSdkVersion 34
    }
}

# Clean and rebuild
./gradlew clean bundleRelease
```

### Play Console Issues

#### Issue: "App not appearing in Play Store after approval"

**Symptom**: App approved but not visible.

**Common Causes**:

1. **Country restrictions** - Check availability
2. **Device compatibility** - Check supported devices
3. **Age restrictions** - Content rating applied
4. **Search indexing** - Can take 24-48 hours

**Solution**:

1. Go to Play Console → Production
2. Check rollout status
3. Verify "Available on Google Play" is Yes
4. Check country/device availability settings
5. Wait up to 48 hours for indexing

#### Issue: "Pre-launch report failed"

**Symptom**: App crashes during automated testing.

**Solution**:

1. Review Pre-launch report in Play Console
2. Check crash logs and screenshots
3. Common issues:
   - App requires login (add test account)
   - App requires specific permissions
   - Crashes on older Android versions
4. Fix issues and upload new build

#### Issue: "Can't create new release - previous release still in review"

**Symptom**: Cannot create new release while one is pending.

**Solution**:

- Wait for current review to complete
- Or cancel current review (loses position in queue)
- Or create release in different track

---

## Common Issues

### Build takes too long

**iOS**:

```bash
# Disable Bitcode (if not needed)
# In Xcode: Build Settings → Enable Bitcode → No

# Use incremental builds
# Only clean when necessary

# Disable optimization for debug builds
# Build Settings → Optimization Level → None [-O0]
```

**Android**:

```bash
# Enable Gradle daemon
echo "org.gradle.daemon=true" >> gradle.properties

# Enable parallel execution
echo "org.gradle.parallel=true" >> gradle.properties

# Increase memory
echo "org.gradle.jvmargs=-Xmx4096m" >> gradle.properties

# Use incremental builds
# Only run ./gradlew clean when necessary
```

### Out of disk space

```bash
# iOS: Clean Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode

# Android: Clean Gradle cache
rm -rf ~/.gradle/caches/
rm -rf ~/.android/build-cache/

# Clean project builds
cd platforms/capacitor
rm -rf ios/build/
rm -rf android/build/
rm -rf android/app/build/
```

### Wrong icon/splash screen appears

```bash
# iOS: Regenerate assets
cd platforms/capacitor
npx capacitor-assets generate --ios

# Android: Regenerate assets
npx capacitor-assets generate --android

# Or manually:
# iOS: Replace in ios/App/App/Assets.xcassets/
# Android: Replace in android/app/src/main/res/
```

### App crashes on launch

**Debug Steps**:

**iOS**:

```bash
# View crash logs in Xcode
# Window → Devices and Simulators → View Device Logs

# Or on device:
# Settings → Privacy → Analytics → Analytics Data
```

**Android**:

```bash
# View logcat
adb logcat | grep "com.yourcompany.nchat"

# Or in Android Studio:
# Logcat tab at bottom
```

**Common Causes**:

- Missing native dependencies
- Capacitor plugin not synced
- Native code errors
- Missing permissions

**Solution**:

```bash
# Re-sync Capacitor
cd platforms/capacitor
npx cap sync

# Update native dependencies
# iOS:
cd ios && pod install

# Android:
cd android && ./gradlew clean
```

---

## Debug Tools

### iOS Debugging

**Xcode Console**:

```bash
# Open iOS project
cd platforms/capacitor
npx cap open ios

# Run and view console output in Xcode
# Debug area at bottom shows logs
```

**Safari Web Inspector**:

```bash
# Enable in Safari: Develop → Simulator → localhost
# Inspect web content in Capacitor WebView
# Console, Network, Elements tabs available
```

**Instruments**:

```bash
# Profile performance
# Xcode → Product → Profile
# Choose template (Time Profiler, Allocations, etc.)
```

### Android Debugging

**Android Studio Logcat**:

```bash
# View real-time logs
# Android Studio → Logcat tab
# Filter by package name
```

**Chrome DevTools**:

```bash
# Navigate to: chrome://inspect
# Click "Inspect" next to your app
# Full DevTools available for WebView
```

**ADB Commands**:

```bash
# View logs
adb logcat

# Filter by tag
adb logcat -s "Capacitor"

# Clear logs
adb logcat -c

# Install APK
adb install -r app.apk

# Uninstall
adb uninstall com.yourcompany.nchat

# View device info
adb shell getprop ro.build.version.release
```

### Network Debugging

**iOS**:

```bash
# Use Charles Proxy or Proxyman
# Configure simulator/device to use proxy
# Settings → Wi-Fi → HTTP Proxy

# Or use Safari Web Inspector Network tab
```

**Android**:

```bash
# Use Charles Proxy or Proxyman
# Or Chrome DevTools Network tab

# View network calls
adb shell am broadcast -a android.intent.action.PROXY_CHANGE

# Configure proxy in Android settings
```

### Performance Monitoring

**Sentry Integration**:

```bash
# Already configured in nself-chat
# View errors at: sentry.io

# Track deployment
# Errors automatically tagged with release version
```

**Firebase Performance**:

```bash
# Add to iOS: ios/App/App/GoogleService-Info.plist
# Add to Android: android/app/google-services.json

# Monitor in Firebase Console
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Check Existing Issues**:
   - [GitHub Issues](https://github.com/yourusername/nself-chat/issues)
   - Search for your error message

2. **Community Support**:
   - [Capacitor Discussions](https://github.com/ionic-team/capacitor/discussions)
   - [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)
   - [Ionic Forum](https://forum.ionicframework.com/)

3. **Create New Issue**:
   Include:
   - Platform (iOS/Android)
   - Error message (full output)
   - Steps to reproduce
   - Environment details:

     ```bash
     # iOS
     xcodebuild -version
     pod --version

     # Android
     ./gradlew --version
     java -version

     # Node/Capacitor
     node --version
     npx cap --version
     ```

4. **Official Documentation**:
   - [iOS Developer Documentation](https://developer.apple.com/documentation/)
   - [Android Developer Documentation](https://developer.android.com/docs)
   - [Capacitor Documentation](https://capacitorjs.com/docs)

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
