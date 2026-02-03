# Mobile App Deployment Guide

Complete guide for deploying nself-chat mobile applications to iOS App Store and Google Play Store.

## Table of Contents

- [Overview](#overview)
- [iOS Deployment](#ios-deployment)
  - [Prerequisites](#ios-prerequisites)
  - [TestFlight Setup](#testflight-setup)
  - [App Store Submission](#app-store-submission)
  - [Code Signing](#ios-code-signing)
  - [Screenshot Requirements](#ios-screenshots)
- [Android Deployment](#android-deployment)
  - [Prerequisites](#android-prerequisites)
  - [Google Play Beta Setup](#google-play-beta-setup)
  - [Production Release](#android-production-release)
  - [Code Signing](#android-code-signing)
  - [Screenshot Requirements](#android-screenshots)
- [Fastlane Integration](#fastlane-integration)
- [Automated Deployments](#automated-deployments)
- [Troubleshooting](#troubleshooting)

---

## Overview

nself-chat supports deployment to both iOS and Android platforms using Capacitor. This guide covers the complete deployment process for both platforms.

### Quick Links

- **iOS**: Use `scripts/deploy-mobile-ios.sh`
- **Android**: Use `scripts/deploy-mobile-android.sh`
- **Troubleshooting**: See [Troubleshooting](#troubleshooting) section

### Deployment Tracks

**iOS:**

- TestFlight (Internal/External testing)
- App Store Production

**Android:**

- Internal Testing (immediate rollout)
- Closed Testing (Beta, requires opt-in)
- Open Testing (Public beta)
- Production

---

## iOS Deployment

### iOS Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
   - Agree to developer agreements

2. **App Store Connect Access**
   - Go to: https://appstoreconnect.apple.com
   - Create your app listing

3. **Development Environment**
   - macOS with Xcode installed
   - Xcode Command Line Tools: `xcode-select --install`
   - Valid signing certificates and provisioning profiles

4. **App-Specific Password**
   - Generate at: https://appleid.apple.com/account/manage
   - Required for command-line uploads
   - Store securely (use in APP_SPECIFIC_PASSWORD env var)

5. **Required Information**
   - Apple Team ID (found in developer.apple.com/account)
   - Bundle Identifier (e.g., `com.yourcompany.nchat`)
   - App Name and Description

### TestFlight Setup

TestFlight allows you to distribute beta builds to internal and external testers.

#### Step 1: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in required information:
   - Platform: iOS
   - Name: Your app name (e.g., "nChat")
   - Primary Language: English
   - Bundle ID: Select your bundle identifier
   - SKU: Unique identifier (can be bundle ID)

#### Step 2: Configure App Information

1. Go to App Information
2. Set Privacy Policy URL
3. Set Category (Social Networking or Productivity)
4. Configure Age Rating
5. Upload app icon (1024x1024px, no transparency)

#### Step 3: Deploy to TestFlight

```bash
# Set required environment variables
export APPLE_TEAM_ID="ABC123XYZ"
export APPLE_ID="developer@yourcompany.com"
export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"

# Deploy to TestFlight
cd /path/to/nself-chat
./scripts/deploy-mobile-ios.sh --testflight
```

The script will:

1. Run tests
2. Build web assets
3. Sync to iOS platform
4. Create archive
5. Export IPA
6. Upload to App Store Connect

#### Step 4: Configure TestFlight

After upload completes (10-30 minutes for processing):

1. Go to App Store Connect → TestFlight
2. Select the new build
3. Add "What to Test" notes for testers
4. Configure test information:
   - Beta App Description
   - Beta App Review Information
   - Test Information
   - Screenshot (optional)

#### Step 5: Add Internal Testers

1. Go to TestFlight → Internal Testing
2. Click "+" to add testers
3. Enter email addresses
4. Testers receive invitation email immediately
5. They can install via TestFlight app

**Internal Testing:**

- Up to 100 testers
- No App Review required
- Immediate availability after processing
- 90-day expiration

#### Step 6: Add External Testers (Optional)

1. Go to TestFlight → External Testing
2. Create a new group
3. Add testers (up to 10,000)
4. Submit for Beta App Review
5. Wait for approval (1-2 days)

**External Testing:**

- Requires Beta App Review
- Public link available after approval
- 90-day expiration
- Can distribute publicly

### App Store Submission

#### Step 1: Prepare App Store Listing

1. Go to App Store Connect → My Apps → Your App
2. Create new version (if needed)
3. Complete required information:
   - App Name (max 30 characters)
   - Subtitle (max 30 characters)
   - Description (max 4,000 characters)
   - Keywords (max 100 characters)
   - Support URL
   - Marketing URL (optional)
   - Promotional Text (170 characters, can update without new version)

#### Step 2: Upload Screenshots

See [iOS Screenshots](#ios-screenshots) section for requirements.

Required sizes:

- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796 px
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688 px
- 5.5" Display (iPhone 8 Plus): 1242 x 2208 px

Minimum 3 screenshots per size, maximum 10.

#### Step 3: Deploy to Production

```bash
# Deploy to production (requires manual submission)
./scripts/deploy-mobile-ios.sh --production
```

#### Step 4: Submit for Review

1. Select the uploaded build
2. Set App Store release options:
   - Manual release
   - Automatic release
   - Scheduled release
3. Configure Age Rating
4. Complete Export Compliance information
5. Submit for Review

**Review Timeline:**

- 24-48 hours typically
- May be faster or slower depending on complexity
- Check status in App Store Connect

#### Step 5: Release

After approval:

- **Manual**: Click "Release This Version" when ready
- **Automatic**: Released immediately upon approval
- **Scheduled**: Released at specified date/time

### iOS Code Signing

#### Automatic Signing (Recommended)

The deployment script uses automatic signing by default:

```bash
# Xcode manages certificates and profiles automatically
./scripts/deploy-mobile-ios.sh --testflight
```

Xcode will:

- Create/download required certificates
- Create/download provisioning profiles
- Handle signing automatically

#### Manual Signing (Advanced)

If you need manual control:

1. **Create Certificates** (developer.apple.com):
   - Development: iOS App Development
   - Distribution: iOS Distribution

2. **Create App ID**:
   - Go to Certificates, Identifiers & Profiles
   - Create App ID with your Bundle Identifier
   - Enable required capabilities (Push Notifications, etc.)

3. **Create Provisioning Profiles**:
   - Development: For testing on devices
   - Ad Hoc: For limited distribution
   - App Store: For App Store distribution

4. **Install in Xcode**:
   - Download certificates and profiles
   - Double-click to install
   - Select in Xcode project settings

5. **Configure Build Script**:
   ```bash
   export IOS_SIGNING_IDENTITY="iPhone Distribution: Your Name"
   export IOS_PROVISIONING_PROFILE="UUID-of-profile"
   ./scripts/deploy-mobile-ios.sh
   ```

#### Code Signing Troubleshooting

**"No signing certificate found"**

- Install certificates from developer.apple.com
- Check in Xcode → Preferences → Accounts → Download Manual Profiles

**"No provisioning profile found"**

- Create provisioning profile in developer portal
- Ensure it includes your device UDIDs (for development)
- Download and install in Xcode

**"Code signing entitlements don't match"**

- Check App ID capabilities
- Regenerate provisioning profile
- Clean build folder and rebuild

### iOS Screenshots

#### Required Sizes

Apple requires screenshots for multiple device sizes:

| Device                   | Resolution     | Orientation |
| ------------------------ | -------------- | ----------- |
| 6.7" (iPhone 14 Pro Max) | 1290 x 2796 px | Portrait    |
| 6.5" (iPhone 11 Pro Max) | 1242 x 2688 px | Portrait    |
| 5.5" (iPhone 8 Plus)     | 1242 x 2208 px | Portrait    |
| 12.9" iPad Pro           | 2048 x 2732 px | Portrait    |

**Notes:**

- Minimum 3 screenshots, maximum 10 per size
- PNG or JPEG format
- RGB color space
- No transparency
- Can show app in use, not device frame

#### Creating Screenshots

**Method 1: Simulator**

```bash
# Start iOS Simulator
cd platforms/capacitor
npx cap open ios

# In Simulator:
# 1. Device → Select device type (iPhone 14 Pro Max)
# 2. Navigate to screens you want to capture
# 3. Cmd+S to save screenshot
# 4. Screenshots saved to Desktop
```

**Method 2: Actual Device**

```bash
# Connect device via USB
# Take screenshots on device (Power + Volume Up)
# Transfer via AirDrop or cable
```

**Method 3: Automated (Fastlane Snapshot)**

```bash
# Install fastlane
gem install fastlane

# Set up snapshot
cd platforms/capacitor/ios
fastlane snapshot init

# Configure Snapfile and UI tests
# Run snapshot
fastlane snapshot
```

#### Screenshot Guidelines

**Content Guidelines:**

- Show actual app functionality
- Use realistic data (not Lorem Ipsum)
- Avoid offensive content
- No pricing/promotion in screenshots (use promotional text)
- Localize for each language

**Technical Guidelines:**

- High quality, sharp images
- Proper color calibration
- No pixelation or artifacts
- Consistent status bar (can be hidden or standardized)

**Best Practices:**

- First screenshot is most important (shows in search)
- Show key features in order of importance
- Use captions to explain features
- Keep text readable
- Consider adding device frames for visual appeal (external tools)

#### Tools for Screenshots

- **Simulator**: Built into Xcode
- **fastlane snapshot**: Automated screenshot generation
- **Shotbot**: AI-powered screenshot generation
- **DaVinci**: Create marketing screenshots with device frames
- **Screenshot Studio**: Add device frames and backgrounds

---

## Android Deployment

### Android Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at: https://play.google.com/console/signup
   - Pay registration fee
   - Agree to developer agreements

2. **Google Play Console Access**
   - Go to: https://play.google.com/console
   - Create your app listing

3. **Development Environment**
   - Android Studio installed
   - Android SDK and build tools
   - Java Development Kit (JDK 17+)

4. **Release Keystore**
   - Create signing keystore (see below)
   - Store securely and backup (cannot be recovered if lost)

5. **Required Information**
   - Application ID (e.g., `com.yourcompany.nchat`)
   - App Name and Description
   - Privacy Policy URL

### Google Play Beta Setup

#### Step 1: Create App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in required information:
   - App name
   - Default language
   - App or game: App
   - Free or paid: Free (or Paid)
   - Declarations: Accept all required policies

#### Step 2: Create Release Keystore

```bash
# Generate release keystore
keytool -genkey -v \
  -keystore release.keystore \
  -alias upload-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Follow prompts to enter:
# - Keystore password (SAVE THIS!)
# - Key password (SAVE THIS!)
# - Your information (CN, OU, O, L, ST, C)

# IMPORTANT: Backup this file securely!
# If lost, you cannot update your app
```

#### Step 3: Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEY_ALIAS="upload-key"
export ANDROID_KEY_PASSWORD="your-key-password"

# Or create .env file (DO NOT COMMIT)
echo "ANDROID_KEYSTORE_PATH=/path/to/release.keystore" >> .env.local
echo "ANDROID_KEYSTORE_PASSWORD=your-password" >> .env.local
echo "ANDROID_KEY_ALIAS=upload-key" >> .env.local
echo "ANDROID_KEY_PASSWORD=your-password" >> .env.local
```

#### Step 4: Deploy to Internal Testing

```bash
# Build and prepare for upload
./scripts/deploy-mobile-android.sh --internal

# AAB file created at: platforms/capacitor/dist/nchat-release.aab
```

#### Step 5: Upload to Play Console

**Manual Upload:**

1. Go to Play Console → Testing → Internal testing
2. Click "Create new release"
3. Upload AAB file: `platforms/capacitor/dist/nchat-release.aab`
4. Add release notes
5. Review and click "Start rollout to Internal testing"
6. Create email list for internal testers
7. Share internal testing link with team

**Internal Testing Features:**

- Up to 100 testers
- Immediate availability (no review)
- Can test for up to 90 days
- Fast iteration

#### Step 6: Promote to Closed Testing (Beta)

1. Go to Testing → Closed testing
2. Create testing track
3. Click "Create new release"
4. Option 1: Promote from Internal testing
5. Option 2: Upload new AAB
6. Add release notes
7. Review and rollout
8. Wait for Pre-launch report (1-2 hours)
9. Create opt-in URL for beta testers

**Closed Testing Features:**

- Up to 100,000 testers
- Requires Pre-launch report review
- Opt-in via link
- More thorough testing

### Android Production Release

#### Step 1: Complete Store Listing

1. Go to Play Console → Main store listing
2. Fill in required fields:
   - App name (max 50 characters)
   - Short description (max 80 characters)
   - Full description (max 4,000 characters)
   - App icon (512 x 512 px, 32-bit PNG)
   - Feature graphic (1,024 x 500 px)
   - Screenshots (see below)
   - Category (Social or Communication)
   - Contact details
   - Privacy Policy URL

#### Step 2: Upload Screenshots

See [Android Screenshots](#android-screenshots) for requirements.

#### Step 3: Complete Content Rating

1. Go to Content rating
2. Start questionnaire
3. Answer all questions honestly
4. Receive rating (Everyone, Teen, Mature, etc.)

#### Step 4: Set Up Pricing & Distribution

1. Go to Pricing & distribution
2. Select countries
3. Set pricing (Free recommended for open-source)
4. Confirm content guidelines compliance

#### Step 5: Deploy to Production

```bash
# Build release bundle
./scripts/deploy-mobile-android.sh --production

# AAB created at: platforms/capacitor/dist/nchat-release.aab
```

#### Step 6: Upload and Submit for Review

1. Go to Production
2. Create new release
3. Upload AAB file
4. Add release notes
5. Review all details
6. Submit for review

**Review Timeline:**

- Usually 1-7 days
- First submission may take longer
- Subsequent updates faster
- Check status in Play Console

#### Step 7: Gradual Rollout (Optional)

Instead of releasing to 100%, you can:

1. Start with 5% rollout
2. Monitor crash rates and ratings
3. Increase to 10%, 20%, 50%
4. Roll back if issues found
5. Eventually reach 100%

### Android Code Signing

#### Understanding Android Signing

Android requires two types of keys:

1. **Upload Key**: Used to sign APKs/AABs uploaded to Play Store
2. **App Signing Key**: Google manages this for Play App Signing

**Play App Signing (Recommended):**

- Google manages your app signing key
- You keep your upload key
- Benefits:
  - Can reset upload key if lost
  - Optimized APKs for devices
  - Enhanced security

#### Initial Setup

When you first upload:

1. Google generates app signing key, or
2. You can upload your own signing key

**Recommended: Let Google generate**

- More secure
- Easier upload key reset
- No action needed

#### Signing Configuration

The deployment script handles signing automatically:

```bash
# Create keystore (one time)
keytool -genkey -v -keystore release.keystore \
  -alias upload-key -keyalg RSA -keysize 2048 -validity 10000

# Set environment variables
export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
export ANDROID_KEYSTORE_PASSWORD="password"
export ANDROID_KEY_ALIAS="upload-key"
export ANDROID_KEY_PASSWORD="password"

# Deploy (automatically signs)
./scripts/deploy-mobile-android.sh
```

#### Manual Signing (Advanced)

If you need to sign manually:

```bash
# Build unsigned
cd platforms/capacitor/android
./gradlew bundleRelease

# Sign with jarsigner
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore /path/to/release.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  upload-key

# Verify signature
jarsigner -verify -verbose -certs \
  app/build/outputs/bundle/release/app-release.aab
```

#### Keystore Security Best Practices

1. **Backup Your Keystore**
   - Store in multiple secure locations
   - Use encrypted cloud storage
   - Keep offline backup
   - **CRITICAL**: You cannot update app if keystore is lost

2. **Protect Passwords**
   - Use strong, unique passwords
   - Store in password manager
   - Never commit to git
   - Use environment variables

3. **Secure Storage**
   - Encrypt keystore file
   - Restrict file permissions: `chmod 600 release.keystore`
   - Store in secure location
   - Consider hardware security module for CI/CD

### Android Screenshots

#### Required Sizes

Google Play requires screenshots for phone and tablet:

| Device Type | Min Resolution | Max Resolution   | Quantity |
| ----------- | -------------- | ---------------- | -------- |
| Phone       | 320 x 320 px   | 3,840 x 3,840 px | 2-8      |
| 7" Tablet   | 320 x 320 px   | 3,840 x 3,840 px | 0-8      |
| 10" Tablet  | 320 x 320 px   | 3,840 x 3,840 px | 0-8      |

**Common Sizes:**

- Phone: 1080 x 1920 px (16:9) or 1080 x 2340 px (19.5:9)
- Tablet: 1200 x 1920 px or 2560 x 1600 px

**Notes:**

- PNG or JPEG format
- 16:9 or 9:16 aspect ratio recommended
- Can upload up to 8 per device type
- First screenshot is most prominent

#### Creating Screenshots

**Method 1: Emulator**

```bash
# Start Android emulator
cd platforms/capacitor
npx cap open android

# In Android Studio:
# 1. Run app on emulator
# 2. Navigate to screens
# 3. Click camera icon in emulator toolbar
# 4. Or use Ctrl+S / Cmd+S
# 5. Screenshots saved to project folder
```

**Method 2: Actual Device**

```bash
# Connect device via USB
# Enable USB Debugging
# Take screenshots: Power + Volume Down
# Use adb to pull screenshots
adb pull /sdcard/Screenshots/ ./screenshots/
```

**Method 3: Automated (Fastlane Screengrab)**

```bash
# Install fastlane
gem install fastlane

# Set up screengrab
cd platforms/capacitor/android
fastlane screengrab init

# Configure Screengrabfile
# Run screengrab
fastlane screengrab
```

#### Screenshot Guidelines

**Content Guidelines:**

- Show actual app functionality
- Use realistic, appropriate content
- Avoid graphic violence or adult content
- No misleading features
- Localize for supported languages

**Technical Guidelines:**

- High resolution (1080p or higher recommended)
- Sharp, clear images
- Proper color reproduction
- No alpha channel/transparency
- No device chrome (just app content)

**Best Practices:**

- First screenshot is most important
- Show key features first
- Use captions to explain features
- Consistent styling across screenshots
- Show diverse use cases

#### Feature Graphic

Required for Play Store listing:

- **Size**: 1,024 x 500 px
- **Format**: PNG or JPEG
- **Purpose**: Shown at top of store listing
- **Content**: App name, key features, branding
- **No device frames**: Just app branding/features

Create feature graphic with:

- App logo
- Tagline
- Key feature preview
- Brand colors
- No text overlap on important areas (can be cut off on mobile)

---

## Fastlane Integration

Fastlane automates screenshot generation, signing, and deployment.

### Installing Fastlane

```bash
# Install via RubyGems
gem install fastlane

# Or via Homebrew
brew install fastlane

# Verify installation
fastlane --version
```

### iOS Fastlane Setup

```bash
# Navigate to iOS project
cd platforms/capacitor/ios

# Initialize fastlane
fastlane init

# Select option 4 (Manual setup)

# Configure Appfile
cat > fastlane/Appfile <<'EOF'
app_identifier("com.yourcompany.nchat")
apple_id("developer@yourcompany.com")
team_id("ABC123XYZ")

# App Store Connect API key (optional)
# api_key_path("./AuthKey_ABC123.p8")
EOF

# Configure Fastfile
cat > fastlane/Fastfile <<'EOF'
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    increment_build_number
    build_app(
      workspace: "App/App.xcworkspace",
      scheme: "App",
      export_method: "app-store"
    )
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Deploy to App Store"
  lane :release do
    build_app(
      workspace: "App/App.xcworkspace",
      scheme: "App",
      export_method: "app-store"
    )
    upload_to_app_store(
      submit_for_review: false,
      automatic_release: false
    )
  end

  desc "Generate screenshots"
  lane :screenshots do
    snapshot
  end
end
EOF
```

### Android Fastlane Setup

```bash
# Navigate to Android project
cd platforms/capacitor/android

# Initialize fastlane
fastlane init

# Follow prompts to set up Google Play integration

# Configure Appfile
cat > fastlane/Appfile <<'EOF'
json_key_file("path/to/service-account.json")
package_name("com.yourcompany.nchat")
EOF

# Configure Fastfile
cat > fastlane/Fastfile <<'EOF'
default_platform(:android)

platform :android do
  desc "Deploy to Internal Testing"
  lane :internal do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "internal",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Deploy to Beta"
  lane :beta do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "beta",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Deploy to Production"
  lane :production do
    gradle(
      task: "bundle",
      build_type: "Release"
    )
    upload_to_play_store(
      track: "production",
      aab: "app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Generate screenshots"
  lane :screenshots do
    screengrab
  end
end
EOF
```

### Using Fastlane

```bash
# iOS: Deploy to TestFlight
cd platforms/capacitor/ios
fastlane beta

# iOS: Deploy to App Store
fastlane release

# iOS: Generate screenshots
fastlane screenshots

# Android: Deploy to Internal Testing
cd platforms/capacitor/android
fastlane internal

# Android: Deploy to Beta
fastlane beta

# Android: Deploy to Production
fastlane production

# Android: Generate screenshots
fastlane screenshots
```

### Service Account Setup (Android)

For automated Android deployments:

1. Go to Google Play Console
2. Settings → API access
3. Create new service account
4. Grant permissions:
   - Release apps
   - View app information
   - Manage testing tracks
5. Download JSON key file
6. Store securely (do not commit)
7. Reference in Fastfile

```bash
# Set up service account
export GOOGLE_PLAY_SERVICE_ACCOUNT="/path/to/service-account.json"

# Use in deployment
fastlane beta
```

---

## Automated Deployments

### GitHub Actions Setup

Create workflow for automated deployments.

#### iOS Deployment Workflow

```yaml
# .github/workflows/deploy-ios.yml
name: Deploy iOS

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web assets
        run: pnpm build

      - name: Setup iOS certificates
        uses: apple-actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.IOS_DIST_CERT }}
          p12-password: ${{ secrets.IOS_CERT_PASSWORD }}

      - name: Deploy to TestFlight
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APP_SPECIFIC_PASSWORD: ${{ secrets.APP_SPECIFIC_PASSWORD }}
        run: |
          chmod +x scripts/deploy-mobile-ios.sh
          ./scripts/deploy-mobile-ios.sh --testflight
```

#### Android Deployment Workflow

```yaml
# .github/workflows/deploy-android.yml
name: Deploy Android

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build web assets
        run: pnpm build

      - name: Decode keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > release.keystore

      - name: Deploy to Play Store
        env:
          ANDROID_KEYSTORE_PATH: ./release.keystore
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          GOOGLE_PLAY_SERVICE_ACCOUNT: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
        run: |
          chmod +x scripts/deploy-mobile-android.sh
          ./scripts/deploy-mobile-android.sh --internal
```

#### Required Secrets

Add these secrets to your GitHub repository:

**iOS:**

- `APPLE_TEAM_ID`: Your Apple Team ID
- `APPLE_ID`: Your Apple ID email
- `APP_SPECIFIC_PASSWORD`: App-specific password
- `IOS_DIST_CERT`: Distribution certificate (base64)
- `IOS_CERT_PASSWORD`: Certificate password

**Android:**

- `ANDROID_KEYSTORE_BASE64`: Keystore file (base64 encoded)
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias
- `ANDROID_KEY_PASSWORD`: Key password
- `GOOGLE_PLAY_SERVICE_ACCOUNT`: Service account JSON (base64)

---

## Troubleshooting

See the dedicated [Mobile Deployment Troubleshooting Guide](./mobile-deployment-troubleshooting.md) for common issues and solutions.

### Quick Fixes

**iOS build fails:**

```bash
# Clean build
cd platforms/capacitor/ios
rm -rf build/
xcodebuild clean

# Update pods
pod install --repo-update
```

**Android build fails:**

```bash
# Clean build
cd platforms/capacitor/android
./gradlew clean

# Update Gradle
./gradlew wrapper --gradle-version=8.0
```

**Code signing errors:**

```bash
# iOS: Reset signing
# Open in Xcode and disable/enable automatic signing

# Android: Verify keystore
keytool -list -v -keystore release.keystore
```

---

## Additional Resources

### Official Documentation

- [iOS App Distribution Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Google Play Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Fastlane Documentation](https://docs.fastlane.tools/)

### Community Resources

- [nself-chat GitHub](https://github.com/yourusername/nself-chat)
- [Capacitor Community Slack](https://ionic.link/slack)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)

### Tools

- [Transporter](https://apps.apple.com/app/transporter/id1450874784) - Upload iOS builds
- [bundletool](https://github.com/google/bundletool) - Test Android App Bundles
- [fastlane](https://fastlane.tools/) - Automate deployments
- [Screener](https://screener.app/) - Generate app screenshots

---

## Support

For issues or questions:

1. Check the [Troubleshooting Guide](./mobile-deployment-troubleshooting.md)
2. Search [GitHub Issues](https://github.com/yourusername/nself-chat/issues)
3. Create new issue with:
   - Platform (iOS/Android)
   - Error message
   - Steps to reproduce
   - Environment details

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
