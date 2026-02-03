# iOS Troubleshooting Guide - nChat v0.8.0

Comprehensive troubleshooting guide for iOS deployment and development issues.

## Table of Contents

1. [Code Signing Issues](#code-signing-issues)
2. [Build Errors](#build-errors)
3. [Xcode Issues](#xcode-issues)
4. [CocoaPods Problems](#cocoapods-problems)
5. [Provisioning Profile Issues](#provisioning-profile-issues)
6. [App Store Connect Issues](#app-store-connect-issues)
7. [TestFlight Issues](#testflight-issues)
8. [Notarization Issues](#notarization-issues)
9. [Runtime Issues](#runtime-issues)
10. [Performance Issues](#performance-issues)

---

## Code Signing Issues

### Issue: "No valid iOS Distribution certificate found"

**Symptoms**:

```
error: No valid iOS Distribution signing identity found
```

**Solutions**:

1. **Check installed certificates**:

```bash
security find-identity -v -p codesigning

# Should show:
# "iPhone Distribution: Your Name (TEAM_ID)"
```

2. **Download certificate from Apple Developer Portal**:
   - Go to https://developer.apple.com/account
   - Certificates, Identifiers & Profiles
   - Download your distribution certificate
   - Double-click to install in Keychain

3. **Verify certificate in Keychain Access**:
   - Open Keychain Access
   - Look for "iPhone Distribution" certificate
   - Ensure private key is present (arrow next to certificate)
   - If missing private key, re-create certificate with proper CSR

4. **Reset signing**:

```bash
# Remove duplicate certificates
security delete-certificate -c "iPhone Distribution"

# Re-install certificate
# Double-click downloaded .cer file
```

---

### Issue: "Provisioning profile doesn't include signing certificate"

**Symptoms**:

```
error: Provisioning profile "..." doesn't include signing certificate "..."
```

**Solutions**:

1. **Regenerate provisioning profile**:
   - Go to Apple Developer Portal
   - Edit the provisioning profile
   - Ensure your distribution certificate is selected
   - Download and install new profile

2. **Install provisioning profile**:

```bash
# Download from developer portal
# Double-click to install

# Or drag to Xcode icon in Dock

# Verify installation
ls ~/Library/MobileDevice/Provisioning\ Profiles/
```

3. **Clean Xcode cache**:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Developer/Xcode/Archives/*
```

4. **Refresh profiles in Xcode**:
   - Xcode > Preferences > Accounts
   - Select your Apple ID
   - Click "Download Manual Profiles"

---

### Issue: "The executable was signed with invalid entitlements"

**Symptoms**:

```
error: The executable was signed with invalid entitlements.
error: The entitlements specified in your application's Code Signing Entitlements file are invalid, not permitted, or do not match those specified in your provisioning profile.
```

**Solutions**:

1. **Check entitlements file**:

```bash
cd platforms/capacitor/ios/App/App
cat App.entitlements

# Compare with capabilities in Xcode:
# Target > Signing & Capabilities
```

2. **Common entitlement mismatches**:

**Push Notifications:**

```xml
<!-- App.entitlements -->
<key>aps-environment</key>
<string>production</string>  <!-- or development -->
```

**Associated Domains:**

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:nchat.nself.org</string>
</array>
```

**App Groups:**

```xml
<key>com.apple.security.application-groups</key>
<array>
  <string>group.io.nself.chat</string>
</array>
```

3. **Regenerate provisioning profile with correct capabilities**:
   - In Developer Portal, edit App ID
   - Ensure all capabilities match your entitlements
   - Regenerate provisioning profile
   - Download and install

4. **Verify capability is enabled in Xcode**:
   - Target > Signing & Capabilities
   - Add missing capabilities
   - Match capability settings with entitlements file

---

### Issue: "Code signing is required for product type 'Application'"

**Symptoms**:

```
error: Code signing is required for product type 'Application' in SDK 'iOS 17.2'
```

**Solutions**:

1. **Enable automatic signing** (quickest):
   - Select App target in Xcode
   - Signing & Capabilities tab
   - Check "Automatically manage signing"
   - Select your Team

2. **Configure manual signing**:
   - Uncheck "Automatically manage signing"
   - Select Provisioning Profile: Choose profile
   - Ensure Signing Certificate is selected

3. **Verify signing settings in build settings**:

```bash
# Check project.pbxproj
cd platforms/capacitor/ios/App
grep "CODE_SIGN" App.xcodeproj/project.pbxproj

# Should show:
# CODE_SIGN_IDENTITY = "iPhone Distribution";
# CODE_SIGN_STYLE = Automatic; # or Manual
# DEVELOPMENT_TEAM = YOUR_TEAM_ID;
```

---

## Build Errors

### Issue: "Command PhaseScriptExecution failed with a nonzero exit code"

**Symptoms**:

```
error: Command PhaseScriptExecution failed with a nonzero exit code
```

**Solutions**:

1. **Check build phase scripts**:
   - Target > Build Phases
   - Expand "Run Script" phases
   - Look for error in build log

2. **Common script issues**:

**CocoaPods script:**

```bash
# Should be present in Build Phases
# If missing, run:
cd platforms/capacitor/ios/App
pod install
```

**Capacitor script:**

```bash
# Ensure Capacitor scripts are present
# Should see: [CP] Copy Pods Resources
```

3. **Clean and rebuild**:

```bash
cd platforms/capacitor/ios
rm -rf App/Pods
rm App/Podfile.lock
cd App
pod install

# In Xcode:
# Product > Clean Build Folder (Cmd+Shift+K)
# Product > Build (Cmd+B)
```

4. **Check script permissions**:

```bash
# Make scripts executable
chmod +x platforms/capacitor/ios/App/App/build-scripts/*.sh
```

---

### Issue: "Module 'XXX' not found"

**Symptoms**:

```
error: Module 'Capacitor' not found
error: Module 'CapacitorCordova' not found
```

**Solutions**:

1. **Reinstall pods**:

```bash
cd platforms/capacitor/ios/App
rm -rf Pods Podfile.lock
pod deintegrate
pod install
```

2. **Sync Capacitor**:

```bash
cd platforms/capacitor
npx cap sync ios
```

3. **Check Podfile**:

```ruby
# platforms/capacitor/ios/App/Podfile
platform :ios, '14.0'
use_frameworks!

target 'App' do
  pod 'CapacitorCordova'
  pod 'Capacitor', :path => '../../../node_modules/@capacitor/ios'
  # ... other pods
end
```

4. **Verify Framework Search Paths**:
   - Build Settings > Framework Search Paths
   - Should include: `$(inherited)`
   - Should include: `${PODS_ROOT}/**`

---

### Issue: "Undefined symbols for architecture arm64"

**Symptoms**:

```
Undefined symbols for architecture arm64:
  "_OBJC_CLASS_$_SomeClass", referenced from:
```

**Solutions**:

1. **Missing framework**:
   - Check if required framework is linked
   - Target > General > Frameworks, Libraries, and Embedded Content
   - Add missing framework

2. **Pod installation issue**:

```bash
cd platforms/capacitor/ios/App
pod deintegrate
pod install --repo-update
```

3. **Architecture mismatch**:
   - Build Settings > Architectures
   - Ensure "arm64" is included
   - Valid Architectures: arm64

4. **Clean derived data**:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

---

### Issue: "The app ID cannot be registered to your development team"

**Symptoms**:

```
error: The app ID "io.nself.chat" cannot be registered to your development team. Change your bundle identifier to a unique string.
```

**Solutions**:

1. **Change bundle identifier**:
   - Target > General > Identity
   - Change Bundle Identifier to: `io.nself.chat.dev`
   - Or: `com.yourcompany.nchat`

2. **Register App ID in Developer Portal**:
   - Go to Certificates, Identifiers & Profiles
   - Register new App ID with your bundle identifier
   - Create provisioning profile for new ID

3. **Use personal team for development**:
   - Signing & Capabilities
   - Select "Personal Team" for development
   - Use different bundle ID for development builds

---

## Xcode Issues

### Issue: Xcode cannot find Swift compiler

**Symptoms**:

```
error: unable to find utility "swiftc", not a developer tool or in PATH
```

**Solutions**:

1. **Set command line tools**:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcode-select --install
```

2. **Verify installation**:

```bash
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer

xcrun --find swiftc
# Should show path to swiftc
```

3. **Restart Xcode** after changing command line tools

---

### Issue: "Failed to prepare device for development"

**Symptoms**:

```
error: Failed to prepare device for development.
error: This operation can fail if the version of the OS on the device is incompatible with the installed version of Xcode.
```

**Solutions**:

1. **Update Xcode**:
   - Download latest Xcode from App Store
   - Or from https://developer.apple.com/download/

2. **Download device support files**:
   - Xcode > Preferences > Components
   - Download iOS support files for your device version

3. **Manually download support files**:

```bash
# Download from https://github.com/filsv/iOSDeviceSupport
# Extract to:
~/Library/Developer/Xcode/iOS\ DeviceSupport/
```

4. **Restart both Xcode and device**:
   - Quit Xcode completely
   - Restart iPhone/iPad
   - Reconnect and trust computer

---

### Issue: Xcode freezes during indexing

**Symptoms**:

- Xcode becomes unresponsive
- "Indexing..." never completes
- High CPU usage

**Solutions**:

1. **Delete derived data**:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

2. **Delete module cache**:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex
```

3. **Disable indexing temporarily**:

```bash
# Disable
defaults write com.apple.dt.XCODEBuild IDEIndexDisable -bool YES

# Re-enable after cleanup
defaults delete com.apple.dt.XCODEBuild IDEIndexDisable
```

4. **Restart Xcode** and rebuild

---

## CocoaPods Problems

### Issue: "Unable to find a specification for pod"

**Symptoms**:

```
[!] Unable to find a specification for `Capacitor`
```

**Solutions**:

1. **Update CocoaPods repo**:

```bash
pod repo update
```

2. **Install pods with repo update**:

```bash
cd platforms/capacitor/ios/App
pod install --repo-update
```

3. **Clear CocoaPods cache**:

```bash
pod cache clean --all
pod deintegrate
pod install
```

4. **Check Podfile sources**:

```ruby
# Add at top of Podfile
source 'https://cdn.cocoapods.org/'
```

---

### Issue: "The platform of the target is not compatible"

**Symptoms**:

```
[!] The platform of the target `App` (iOS 14.0) is not compatible with `SomePod` which has a minimum requirement of iOS 15.0.
```

**Solutions**:

1. **Update platform version**:

```ruby
# Edit Podfile
platform :ios, '15.0'  # Increase version
```

2. **Run pod install**:

```bash
cd platforms/capacitor/ios/App
pod install
```

3. **Update deployment target in Xcode**:
   - Target > General > Deployment Info
   - Set iOS Deployment Target to 15.0

---

### Issue: "CocoaPods could not find compatible versions"

**Symptoms**:

```
[!] CocoaPods could not find compatible versions for pod "Firebase/Core":
  In Podfile:
    Firebase/Core (~> 10.0)

  Specs satisfying the Firebase/Core dependency were found, but they required a higher minimum deployment target.
```

**Solutions**:

1. **Update minimum deployment target**:

```ruby
# Podfile
platform :ios, '13.0'  # Or higher as required
```

2. **Update pod versions**:

```ruby
# Use specific compatible versions
pod 'Firebase/Core', '~> 9.0'  # Use older version
```

3. **Update all pods**:

```bash
pod update
```

---

## Provisioning Profile Issues

### Issue: "No provisioning profile found matching"\*\*

**Symptoms**:

```
error: Provisioning profile "..." doesn't include signing certificate "..."
```

**Solutions**:

1. **Download profiles from Developer Portal**:
   - https://developer.apple.com/account
   - Download all provisioning profiles
   - Double-click to install

2. **Refresh profiles in Xcode**:
   - Xcode > Preferences > Accounts
   - Select Apple ID
   - Download Manual Profiles

3. **Use automatic signing** (recommended for development):
   - Target > Signing & Capabilities
   - Enable "Automatically manage signing"
   - Select Team

---

### Issue: "Provisioning profile has expired"

**Symptoms**:

```
error: Provisioning profile "..." has expired
```

**Solutions**:

1. **Renew provisioning profile**:
   - Go to Apple Developer Portal
   - Edit expired profile
   - Generate new profile
   - Download and install

2. **Check expiration dates**:

```bash
# List all profiles and expiration dates
ls ~/Library/MobileDevice/Provisioning\ Profiles/ | while read profile; do
  security cms -D -i ~/Library/MobileDevice/Provisioning\ Profiles/"$profile" | grep -A2 ExpirationDate
done
```

3. **Delete expired profiles**:

```bash
# Remove all provisioning profiles
rm ~/Library/MobileDevice/Provisioning\ Profiles/*.mobileprovision

# Download fresh profiles from Xcode or Developer Portal
```

---

## App Store Connect Issues

### Issue: "Invalid Bundle - Missing Info.plist values"

**Symptoms**:

```
ERROR ITMS-90474: "Invalid Bundle. iPad Multitasking support requires these orientations: 'UIInterfaceOrientationPortrait,UIInterfaceOrientationPortraitUpsideDown,UIInterfaceOrientationLandscapeLeft,UIInterfaceOrientationLandscapeRight'."
```

**Solutions**:

1. **Add required Info.plist entries**:

```xml
<!-- Info.plist -->
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationPortraitUpsideDown</string>
  <string>UIInterfaceOrientationLandscapeLeft</string>
  <string>UIInterfaceOrientationLandscapeRight</string>
</array>
```

2. **Configure in Xcode**:
   - Target > General > Deployment Info
   - Check all orientations for iPad

---

### Issue: "Missing required icon file"

**Symptoms**:

```
ERROR ITMS-90717: "Invalid App Store Icon. The App Store Icon in the asset catalog in 'App.app' can't be transparent nor contain an alpha channel."
```

**Solutions**:

1. **Fix app icon**:
   - Remove transparency from icon
   - Ensure icon is RGB (not RGBA)
   - Size must be exactly 1024x1024

2. **Regenerate icons**:

```bash
# Use tool like app-icon.co or create manually
# Place in:
# ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Or use Capacitor assets
npx @capacitor/assets generate --ios
```

3. **Verify icon**:

```bash
# Check if icon has alpha channel
sips -g hasAlpha icon-1024.png
# Should show: hasAlpha: no
```

---

### Issue: "Missing Privacy Usage Descriptions"

**Symptoms**:

```
ERROR ITMS-90683: "Missing Purpose String in Info.plist. Your app's code references one or more APIs that access sensitive user data. The app's Info.plist file should contain a NSCameraUsageDescription key with a user-facing purpose string explaining clearly and completely why your app needs the data."
```

**Solutions**:

**Add all required usage descriptions to Info.plist**:

```xml
<!-- Camera -->
<key>NSCameraUsageDescription</key>
<string>nChat needs camera access to take photos and videos to share with your team.</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>nChat needs photo library access to share images with your team.</string>

<!-- Microphone -->
<key>NSMicrophoneUsageDescription</key>
<string>nChat needs microphone access for voice messages and calls.</string>

<!-- Location (if used) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>nChat can share your location with teammates when you choose.</string>

<!-- Contacts (if used) -->
<key>NSContactsUsageDescription</key>
<string>nChat can import contacts to help you find teammates.</string>

<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>nChat uses Face ID to securely unlock the app.</string>

<!-- Motion (if used) -->
<key>NSMotionUsageDescription</key>
<string>nChat uses motion data to enhance your experience.</string>
```

---

## TestFlight Issues

### Issue: Build stuck in "Processing"

**Symptoms**:

- Build uploaded successfully
- Shows "Processing" status for hours
- Never becomes available for testing

**Solutions**:

1. **Wait longer**:
   - Normal processing: 10-30 minutes
   - Sometimes up to 2 hours
   - Check back later before taking action

2. **Check for email from Apple**:
   - Look for processing error emails
   - Check spam folder

3. **Upload new build**:
   - Increment build number
   - Upload again

4. **Contact Apple Support**:
   - If stuck for 24+ hours
   - Use App Store Connect support

---

### Issue: "Could not install app on device"

**Symptoms**:

```
Unable to install "nChat"
This app could not be installed at this time.
```

**Solutions**:

1. **Check device storage**:
   - Settings > General > iPhone Storage
   - Ensure enough free space

2. **Check iOS version**:
   - Settings > General > About > Software Version
   - Must meet minimum deployment target

3. **Delete old version**:
   - Remove existing app from device
   - Try installing TestFlight build again

4. **Reinstall TestFlight app**:
   - Delete TestFlight
   - Reinstall from App Store
   - Try again

---

## Notarization Issues

### Issue: "The software is not notarized"

**Symptoms**:

```
"nchat.app" cannot be opened because the developer cannot be verified.
```

**Solutions**:

1. **Notarize the app**:

```bash
# Archive app
xcodebuild archive -workspace App.xcworkspace -scheme App -archivePath build/App.xcarchive

# Export for notarization
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/export -exportOptionsPlist ExportOptions.plist

# Submit for notarization
xcrun notarytool submit build/export/App.ipa \
  --apple-id "your@apple.id" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "TEAM_ID" \
  --wait

# Staple notarization ticket
xcrun stapler staple build/export/App.ipa
```

2. **Check notarization status**:

```bash
xcrun notarytool history \
  --apple-id "your@apple.id" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "TEAM_ID"
```

3. **View notarization log**:

```bash
xcrun notarytool log <submission-id> \
  --apple-id "your@apple.id" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "TEAM_ID"
```

---

## Runtime Issues

### Issue: App crashes on launch

**Symptoms**:

- App opens briefly then crashes
- Black screen then crashes
- Immediate crash on tap

**Solutions**:

1. **Check crash logs**:
   - Xcode > Window > Devices and Simulators
   - Select device
   - View Device Logs
   - Find crash log for your app

2. **Common crash causes**:

**Missing framework:**

```
dyld: Library not loaded: @rpath/Framework.framework/Framework
```

Solution: Embed framework (Target > General > Frameworks)

**Entitlement error:**

```
Process launch failed: Security
```

Solution: Check entitlements match provisioning profile

**Code signing issue:**

```
Code signature not valid for use in process
```

Solution: Re-sign app with correct certificate

3. **Test in simulator first**:

```bash
# Build for simulator
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -sdk iphonesimulator \
  -configuration Debug

# Check console for errors
```

---

### Issue: Push notifications not working

**Symptoms**:

- App doesn't register for push
- Notifications don't arrive
- Device token not generated

**Solutions**:

1. **Check capabilities**:
   - Ensure "Push Notifications" capability is enabled
   - Background Modes > Remote notifications enabled

2. **Check entitlements**:

```xml
<!-- App.entitlements -->
<key>aps-environment</key>
<string>development</string>  <!-- or production -->
```

3. **Verify APNs certificate/key**:
   - Check certificate is not expired
   - Ensure key is uploaded to Firebase/backend

4. **Test registration**:

```swift
// In AppDelegate
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("Device Token: \(token)")
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register: \(error)")
}
```

5. **Check Info.plist**:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

---

## Performance Issues

### Issue: App is slow/laggy

**Solutions**:

1. **Profile with Instruments**:
   - Product > Profile (Cmd+I)
   - Select "Time Profiler"
   - Identify bottlenecks

2. **Check memory usage**:
   - Debug Navigator > Memory
   - Look for memory leaks
   - Reduce large image sizes

3. **Optimize images**:
   - Use appropriate image sizes
   - Compress images
   - Use WebP format if possible

4. **Enable build optimizations**:
   - Build Settings > Optimization Level
   - Set to "Fastest, Smallest [-Os]" for release

---

### Issue: Large app size

**Solutions**:

1. **Check app size breakdown**:
   - Xcode > Window > Organizer
   - Select archive > App Thinning Size Report

2. **Reduce assets**:
   - Compress images
   - Remove unused assets
   - Use asset catalogs for app thinning

3. **Enable bitcode** (if applicable):
   - Build Settings > Enable Bitcode = YES

4. **Strip debug symbols**:
   - Build Settings > Strip Debug Symbols = YES (Release)

---

## Additional Resources

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [Apple Developer Forums](https://developer.apple.com/forums/)
- [Xcode Help](https://help.apple.com/xcode/)
- [CocoaPods Troubleshooting](https://guides.cocoapods.org/using/troubleshooting)
- [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios/troubleshooting)

---

**Document Version**: 1.0.0
**Last Updated**: January 2026
**Maintained By**: nChat Team

For urgent issues, contact: ios-support@nchat.nself.org
