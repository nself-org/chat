# Android Deployment Guide - nChat v0.8.0

Complete guide to deploying nChat Android application to Google Play Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Play Console Setup](#google-play-console-setup)
3. [Signing Configuration](#signing-configuration)
4. [Building for Release](#building-for-release)
5. [Internal Testing](#internal-testing)
6. [Closed Beta Testing](#closed-beta-testing)
7. [Open Beta Testing](#open-beta-testing)
8. [Production Release](#production-release)
9. [Automated Deployment](#automated-deployment)
10. [Version Management](#version-management)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: 20.0.0 or later
- **pnpm**: 9.15.4 or later
- **Java JDK**: 17 (OpenJDK or Oracle)
- **Android Studio**: Hedgehog (2023.1.1) or later
- **Android SDK**: API Level 34 (Android 14)
- **Gradle**: 8.0+ (bundled with Android Studio)
- **Capacitor CLI**: 6.x

### Required Accounts

- **Google Play Developer Account**: $25 one-time fee
  - Sign up at: https://play.google.com/console/signup
- **Google Cloud Console Account**: Free (for Firebase, Play Services)
- **Firebase Account** (optional): For push notifications and analytics

### Install Required Tools

#### macOS/Linux

```bash
# Install Homebrew (macOS)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Enable corepack for pnpm
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Install Java JDK 17
brew install openjdk@17
sudo ln -sfn $(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# Verify Java installation
java -version  # Should show 17.x.x
```

#### Install Android Studio

1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. Launch and complete setup wizard
4. Install required SDK components:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools
   - Android Emulator

#### Configure Environment Variables

Add to `~/.zshrc` or `~/.bash_profile`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

Reload shell:

```bash
source ~/.zshrc  # or source ~/.bash_profile
```

Verify installations:

```bash
node --version           # v20.x.x
pnpm --version          # 9.15.4
java -version           # 17.x.x
echo $ANDROID_HOME      # Should show path
adb version             # Android Debug Bridge version
```

---

## Google Play Console Setup

### 1. Create Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with Google account
3. Click **Create account**
4. Choose **Organization** or **Individual**
5. Pay $25 one-time registration fee
6. Complete account details:
   - Developer name: nself
   - Email address
   - Phone number
   - Website: https://nself.org
7. Accept Developer Distribution Agreement
8. Wait for account approval (usually instant, can take up to 48 hours)

### 2. Create Application

1. In Play Console, click **Create app**
2. Configure app details:
   - **App name**: nChat
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
3. Declarations:
   - ✅ I acknowledge that this app complies with Google Play policies
   - ✅ I acknowledge that this app complies with US export laws
4. Click **Create app**

### 3. Set Up Store Listing

Navigate to **Store presence** > **Main store listing**

#### App Details

**App name**: `nChat`

**Short description** (max 80 characters):

```
Team communication platform - messaging, calls, and collaboration
```

**Full description** (max 4000 characters):

```
nChat is a powerful, white-label team communication platform that brings together the best features of Slack, Discord, and Telegram into one unified experience.

🔐 ENTERPRISE-GRADE SECURITY
• End-to-end encryption for sensitive conversations
• SOC 2 Type II compliance
• GDPR and HIPAA compliant options
• Single Sign-On (SSO) support
• Two-factor authentication (2FA)

💬 ADVANCED COMMUNICATION
• Real-time messaging with threaded conversations
• Public and private channels
• Direct messages and group chats
• HD voice and video calls
• Screen sharing capabilities
• Voice messages and file sharing (up to 100MB)
• Message reactions and emoji support

🎨 FULLY CUSTOMIZABLE
• White-label branding options
• Custom themes and color schemes
• Configurable features per workspace
• Flexible role-based permissions
• Custom notification settings

🤖 AI-POWERED FEATURES
• Smart message summarization
• Intelligent semantic search
• Auto-moderation and spam detection
• Sentiment analysis
• Smart reply suggestions

📱 NATIVE MOBILE EXPERIENCE
• Push notifications (Firebase Cloud Messaging)
• Offline support - read and draft messages
• Biometric authentication (fingerprint/face)
• Rich media sharing
• Camera and gallery integration
• File attachment support
• Share to nChat from other apps

🔔 STAY CONNECTED
• Customizable notification preferences
• Do Not Disturb modes with scheduling
• @mentions and keyword alerts
• Unread message tracking
• Badge counts
• Notification channels for granular control

🔗 INTEGRATIONS
• Import from Slack
• GitHub notifications
• Jira issue tracking
• Google Drive file sharing
• Custom webhooks
• REST API access
• Zapier integration

⚡ PERFORMANCE
• Lightning-fast real-time messaging
• Optimized for mobile networks
• Low battery consumption
• Efficient data usage
• Background sync
• Offline message queue

👥 COLLABORATION FEATURES
• User presence indicators
• Typing indicators
• Read receipts
• Message pinning
• File preview
• Link unfurling
• Code snippet formatting

🌍 ACCESSIBILITY
• Multiple language support
• Screen reader compatibility
• High contrast themes
• Adjustable font sizes
• Keyboard navigation
• WCAG 2.1 compliant

Whether you're a startup, small business, or large enterprise, nChat provides all the tools you need for effective team communication and collaboration.

PERMISSIONS EXPLAINED:
• Camera: Take photos to share with your team
• Storage: Access files and images to share
• Microphone: Voice messages and calls
• Notifications: Stay updated with new messages
• Network: Real-time messaging and sync
• Contacts: Find teammates (optional)

SUPPORT:
Need help? Contact us at support@nchat.nself.org
Visit our help center: https://nchat.nself.org/help

PRIVACY:
We take your privacy seriously. Read our privacy policy at https://nchat.nself.org/privacy

Download nChat today and transform your team communication!
```

#### App Icon

- **Size**: 512 x 512 pixels
- **Format**: PNG (32-bit with alpha)
- **File size**: Max 1MB
- **Content**: App icon only (no text, no borders)

```bash
# Generate from project
cp /Users/admin/Sites/nself-chat/public/icon-512.png ./app-icon.png
```

#### Feature Graphic

- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPEG
- **File size**: Max 1MB
- **Content**: Promotional banner

Create in design tool (Figma, Sketch, Photoshop):

- Background: Brand gradient or solid color
- Include app name: "nChat"
- Tagline: "Team Communication Reimagined"
- Optionally: Key features or screenshot

#### Screenshots

**Phone Screenshots** (Required):

- **Quantity**: Minimum 2, maximum 8
- **Size**:
  - Minimum dimension: 320px
  - Maximum dimension: 3840px
  - Aspect ratio: Between 16:9 and 2:1
- **Recommended**: 1080 x 2400 pixels (matches common Android phones)

**Tablet Screenshots** (Recommended):

- **Quantity**: Up to 8
- **Size**: 1800 x 2400 pixels or higher

**Generate Screenshots**:

```bash
# Using Android Emulator
cd /Users/admin/Sites/nself-chat

# Build app
pnpm build
cd platforms/capacitor
pnpm install
npx cap sync android

# Open in Android Studio
pnpm run open:android

# In Android Studio:
# 1. Run app on Pixel 6 Pro emulator (1080 x 2400)
# 2. Navigate to different screens
# 3. Take screenshots: Cmd+S or Tools > Screenshot
# 4. Screenshots saved to Desktop

# Recommended screenshots:
# 1. Channel list view
# 2. Message conversation
# 3. Voice/video call screen
# 4. File sharing interface
# 5. Settings/customization
# 6. Search results
# 7. Profile/account screen
# 8. Notification settings
```

**Screenshot Tips**:

- Use realistic sample data (not lorem ipsum)
- Show app with content (messages, channels)
- Consistent theme/branding
- Hide device frame (just app content)
- Add subtle text overlays highlighting features (optional)

#### Video (Optional but Recommended)

- **Length**: 30 seconds to 2 minutes
- **Format**: MPEG, AVI, or WMV
- **Resolution**: At least 1920 x 1080
- **File size**: Max 100MB

Create promo video showing:

- App launch and onboarding
- Sending messages
- Making a call
- Sharing files
- Key features in action

### 4. Content Rating

1. Navigate to **Policy** > **App content** > **Content rating**
2. Click **Start questionnaire**
3. Enter email address: `content-rating@nchat.nself.org`
4. Select category: **Communication**
5. Answer questions:
   - Does app contain violence? **No**
   - Does app contain sexual content? **No**
   - Does app contain profanity? **No** (user-generated content is moderated)
   - Does app contain controlled substances? **No**
   - Does app have social features? **Yes**
   - Does app allow user communication? **Yes**
   - Does users share location? **No** (or Yes if location sharing enabled)
   - Does app have in-app purchases? **No** (or Yes if premium features)
6. Submit questionnaire
7. Receive ratings (usually Everyone or Teen)

### 5. Target Audience

1. Navigate to **Policy** > **App content** > **Target audience**
2. Select age groups:
   - ✅ Ages 13-17
   - ✅ Ages 18+
3. Click **Next**
4. Does app appeal to children? **No**
5. Save

### 6. Privacy Policy

1. Navigate to **Policy** > **App content** > **Privacy policy**
2. Enter URL: `https://nchat.nself.org/privacy`
3. Ensure URL is accessible and contains:
   - Data collection practices
   - How data is used
   - Third-party sharing
   - User rights
   - Contact information

### 7. Data Safety

Required since July 2022:

1. Navigate to **Policy** > **App content** > **Data safety**
2. Click **Start**
3. Answer questions about data collection:

**Data Collected:**

- **Personal Info**:
  - ✅ Name
  - ✅ Email address
  - ✅ User IDs
- **Messages**:
  - ✅ Messages (chat messages)
  - ✅ Photos and videos
  - ✅ Audio files
- **App Activity**:
  - ✅ App interactions
  - ✅ In-app search history
- **Device or Other IDs**:
  - ✅ Device or other IDs

**Data Usage:**

- App functionality: ✅
- Analytics: ✅
- Personalization: ✅
- Account management: ✅

**Data Sharing:**

- Do you share data with third parties? **Yes** (Firebase, analytics)
- Select appropriate categories

**Security:**

- ✅ Data is encrypted in transit (HTTPS/TLS)
- ✅ Users can request data deletion
- ✅ Committed to Google Play Families Policy (if targeting children)

4. Preview data safety section
5. Submit

### 8. App Access

1. Navigate to **Policy** > **App content** > **App access**
2. If app requires login:
   - ✅ All or some features require login
   - Provide demo credentials:
     ```
     Username/Email: reviewer@nchat.demo
     Password: PlayStore2024!
     ```
3. Save

### 9. Ads Declaration

1. Navigate to **Policy** > **App content** > **Ads**
2. Does your app contain ads? **No** (select Yes if monetizing)
3. Save

---

## Signing Configuration

### 1. Generate Upload Keystore

Android requires all APKs/AABs to be digitally signed.

```bash
# Navigate to Android directory
cd /Users/admin/Sites/nself-chat/platforms/capacitor/android

# Create keystore directory
mkdir -p keystore

# Generate keystore (valid for 10,000 days ~27 years)
keytool -genkey -v \
  -keystore keystore/nchat-upload.jks \
  -alias nchat \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# Keystore password: [Create strong password]
# Key password: [Same or different password]
# First and Last Name: nself
# Organizational Unit: Engineering
# Organization: nself
# City: [Your city]
# State: [Your state]
# Country Code: US
```

**CRITICAL**: Backup this keystore file securely!

- Store in password manager
- Keep encrypted backup in cloud storage
- Never commit to git repository
- Losing this file means you cannot update your app

```bash
# Backup keystore
cp keystore/nchat-upload.jks ~/Backups/nchat-upload-$(date +%Y%m%d).jks

# Or encrypt and store
gpg -c keystore/nchat-upload.jks
# Move encrypted file to secure cloud storage
```

### 2. Create Keystore Properties File

```bash
# Create keystore.properties
cat > keystore.properties <<EOF
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=nchat
storeFile=keystore/nchat-upload.jks
EOF

# Secure the file
chmod 600 keystore.properties

# Add to .gitignore
echo "keystore.properties" >> .gitignore
echo "keystore/" >> .gitignore
```

### 3. Configure Gradle for Signing

Edit `android/app/build.gradle`:

```gradle
android {
    ...

    // Load keystore properties
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }

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

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Get Key Fingerprints

Required for various integrations:

```bash
# SHA-1 fingerprint (for Firebase)
keytool -list -v \
  -keystore keystore/nchat-upload.jks \
  -alias nchat | grep SHA1

# SHA-256 fingerprint (for App Links)
keytool -list -v \
  -keystore keystore/nchat-upload.jks \
  -alias nchat | grep SHA256

# Save these values - needed for:
# - Firebase configuration
# - Google Sign-In
# - App Links verification
```

---

## Building for Release

### 1. Prepare Build Environment

```bash
# Navigate to project root
cd /Users/admin/Sites/nself-chat

# Install dependencies
pnpm install

# Build web assets
pnpm build

# Export static site
pnpm next export -o platforms/capacitor/out

# Navigate to Capacitor
cd platforms/capacitor

# Install Capacitor dependencies
pnpm install

# Sync to Android
npx cap sync android
```

### 2. Update Version Information

Edit `platforms/capacitor/android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "io.nself.chat"
        minSdkVersion 24        // Android 7.0
        targetSdkVersion 34     // Android 14
        versionCode 1           // Increment for each release
        versionName "0.8.0"     // Semantic version
    }
}
```

**Or use command line**:

```bash
cd platforms/capacitor/android

# Update version name
sed -i '' 's/versionName ".*"/versionName "0.8.0"/' app/build.gradle

# Update version code
CURRENT_CODE=$(grep versionCode app/build.gradle | awk '{print $2}')
NEW_CODE=$((CURRENT_CODE + 1))
sed -i '' "s/versionCode .*/versionCode $NEW_CODE/" app/build.gradle
```

### 3. Configure ProGuard

ProGuard obfuscates code and reduces APK size.

Edit `android/app/proguard-rules.pro`:

```proguard
# Add project specific ProGuard rules here

# Capacitor
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
```

### 4. Build Release AAB (Recommended)

Android App Bundle (AAB) is the recommended format for Play Store.

```bash
cd platforms/capacitor/android

# Clean previous builds
./gradlew clean

# Build release bundle
./gradlew bundleRelease

# Output location:
# app/build/outputs/bundle/release/app-release.aab
```

### 5. Build Release APK (Alternative)

Use APK for direct distribution (not Play Store):

```bash
cd platforms/capacitor/android

# Build release APK
./gradlew assembleRelease

# Output location:
# app/build/outputs/apk/release/app-release.apk
```

### 6. Verify Build

```bash
# Check AAB details
bundletool build-apks \
  --bundle=app/build/outputs/bundle/release/app-release.aab \
  --output=app-release.apks \
  --mode=universal

# Extract APK from bundle
unzip app-release.apks -d apks/

# Inspect APK
aapt dump badging apks/universal.apk | grep package
# Should show: package: name='io.nself.chat' versionCode='1' versionName='0.8.0'

# Check signing
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
# Should show: jar verified.
```

### 7. Test Release Build

**Install on Device:**

```bash
# Via Android Studio
# Build > Generate Signed Bundle / APK
# Select APK > Next > Choose existing keystore
# Build > Install on device

# Via command line
adb install app/build/outputs/apk/release/app-release.apk

# Launch app
adb shell am start -n io.nself.chat/.MainActivity
```

**Test Checklist:**

- [ ] App launches successfully
- [ ] Login/signup works
- [ ] Push notifications work
- [ ] Messages send/receive
- [ ] Voice/video calls work
- [ ] File upload/download works
- [ ] Offline mode works
- [ ] No crashes or ANRs
- [ ] Performance acceptable
- [ ] Battery usage reasonable

---

## Internal Testing

Internal testing allows quick distribution to up to 100 testers without review.

### 1. Create Internal Test Release

1. In Play Console, navigate to **Testing** > **Internal testing**
2. Click **Create new release**
3. Upload AAB:
   - Click **Upload**
   - Select `app-release.aab`
   - Wait for upload and processing (2-5 minutes)

### 2. Add Release Notes

```
Version 0.8.0 (Build 1)

NEW FEATURES:
• Real-time team messaging with threads
• HD voice and video calls
• AI-powered search
• Offline message support
• Biometric authentication

IMPROVEMENTS:
• Faster message loading
• Better notification reliability
• Improved battery efficiency

FIXES:
• Fixed crash when uploading large files
• Resolved video call connection issues

KNOWN ISSUES:
• Voice messages may have slight delay
• Dark theme refinements in progress

Please report bugs to: internal-testing@nchat.nself.org
```

3. Click **Save**
4. Click **Review release**
5. Verify details
6. Click **Start rollout to Internal testing**

### 3. Add Internal Testers

1. Click **Testers** tab under Internal testing
2. Click **Create email list**
3. Name: "Internal Team"
4. Add tester emails (max 100):
   ```
   alice@nself.org
   bob@nself.org
   charlie@nself.org
   ```
5. Save
6. Copy share link (appears after saving)

### 4. Testers Join Test

1. Testers receive invitation email
2. Click invitation link
3. Accept invitation
4. Download app from Play Store
5. App shows "Internal test" badge

### 5. View Feedback

Monitor internal testing:

- **Crashes**: Play Console > Quality > Android vitals
- **Feedback**: Testing > Internal testing > Feedback
- **Metrics**: Installs, crashes, ANR rate

---

## Closed Beta Testing

Closed beta allows up to 2000 testers to test before public release.

### 1. Create Closed Beta Release

1. Navigate to **Testing** > **Closed testing**
2. Click **Create new release**
3. Upload AAB (same process as internal)
4. Add release notes (similar to internal, but more polished)
5. Click **Save** > **Review release**
6. Click **Start rollout to Closed testing**

### 2. Add Beta Testers

**Method 1: Email List**

1. Click **Testers** tab
2. Create email list
3. Add up to 2000 emails
4. Save

**Method 2: Google Group**

1. Create Google Group: https://groups.google.com
2. Add group email to Play Console
3. Invite testers to join group

**Method 3: Link Sharing**

1. Enable "Public link" in Testers settings
2. Share link with beta testers
3. Anyone with link can join (subject to capacity)

### 3. Pre-Launch Report

Google automatically tests your app:

1. Navigate to **Release** > **Production** > **Pre-launch report**
2. View automatic testing results:
   - Crashes on various devices
   - Screenshots from automated tests
   - Performance metrics
   - Accessibility issues
3. Fix any critical issues before production

---

## Open Beta Testing

Open beta makes your app available to unlimited testers via Play Store.

### 1. Create Open Beta

1. Navigate to **Testing** > **Open testing**
2. Click **Create new release**
3. Upload AAB
4. Add release notes:

```
nChat Open Beta - Version 0.8.0

We're excited to invite you to test nChat!

NEW IN THIS VERSION:
• Real-time team messaging
• Voice and video calls
• Smart AI search
• Offline support
• Biometric security

This is a beta version - you may encounter bugs. Please help us improve by reporting issues!

Report bugs: beta@nchat.nself.org
Feedback: https://nchat.nself.org/feedback

Thank you for being part of our beta community!
```

5. Save and start rollout

### 2. Configure Open Beta Settings

1. **Countries**: Select countries for beta availability
2. **Feedback channel**: Provide email or URL for feedback
3. **Testing period**: Optionally set end date

### 3. Promote Beta to Production

After successful beta testing:

1. Navigate to **Testing** > **Open testing**
2. Click **Promote release**
3. Select **Production**
4. Review and confirm

---

## Production Release

### 1. Create Production Release

1. Navigate to **Release** > **Production**
2. Click **Create new release**
3. Upload AAB
4. Add release notes (user-facing):

```
Welcome to nChat 0.8.0!

NEW FEATURES:
✨ Real-time team messaging with threads
📞 HD voice and video calls
🔍 AI-powered smart search
📴 Offline message support
🔐 Biometric authentication

IMPROVEMENTS:
• 50% faster message loading
• Enhanced push notifications
• Better battery efficiency
• Improved accessibility

BUG FIXES:
• Fixed large file upload issues
• Resolved video call connectivity
• Corrected notification badges

Thank you for using nChat! Questions? Visit nchat.nself.org/support
```

### 2. Configure Rollout

**Release Options:**

1. **Full rollout** (100%)
   - Immediate availability to all users
   - Recommended for minor updates

2. **Staged rollout** (Recommended)
   - Gradual increase: 20% → 50% → 100%
   - Monitor crash rates at each stage
   - Halt rollout if issues detected

3. **Halted rollout**
   - Release prepared but not started
   - Start manually when ready

**Select staged rollout:**

1. Select "Staged rollout"
2. Set initial percentage: 20%
3. Click **Save**
4. Monitor for 24-48 hours
5. Increase to 50% if stable
6. Increase to 100% after another 24-48 hours

### 3. Review and Publish

1. Click **Review release**
2. Verify all information:
   - ✅ Version code incremented
   - ✅ Version name correct
   - ✅ Release notes complete
   - ✅ Store listing updated
   - ✅ Rollout percentage set
3. Click **Start rollout to Production**

### 4. Review Process

**Timeline:**

- **Under review**: Usually 1-7 days (often 24-48 hours)
- **Publishing**: Minutes to 24 hours after approval
- **Live**: Available on Play Store

**Status:**

- **Pending publication**: In review queue
- **Under review**: Being reviewed
- **Approved**: Passed review
- **Published**: Live on Play Store
- **Rejected**: See rejection reason and fix

### 5. Monitor Release

After publishing:

1. **Crash rate**: Monitor in Android vitals
   - Target: <0.5% crash-free users
   - Halt rollout if >2% crash rate

2. **ANR rate**: Application Not Responding
   - Target: <0.1% ANR rate
   - Check vitals dashboard

3. **Ratings**: Monitor user ratings and reviews
   - Respond to negative reviews
   - Thank users for positive feedback

4. **Install metrics**: Track installs and uninstalls
   - Compare to previous versions
   - Investigate unusual patterns

---

## Automated Deployment

### 1. Using Gradle Play Publisher

Install plugin to automate Play Store uploads:

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.github.triplet.gradle:play-publisher:3.8.6'
    }
}
```

Add to `android/app/build.gradle`:

```gradle
plugins {
    id 'com.android.application'
    id 'com.github.triplet.play'
}

play {
    serviceAccountCredentials = file("../play-store-credentials.json")
    track = "internal"  // or 'beta', 'production'
    releaseStatus = "completed"
}
```

**Deploy command:**

```bash
./gradlew publishReleaseBundle
```

### 2. GitHub Actions Automation

The project includes Android build workflow in `.github/workflows/build-capacitor-android.yml`.

#### Required Secrets

Add in GitHub repository settings:

```
KEYSTORE_FILE          # Base64-encoded keystore
KEYSTORE_PASSWORD      # Keystore password
KEY_ALIAS              # Key alias (nchat)
KEY_PASSWORD           # Key password
PLAY_STORE_JSON_KEY    # Service account JSON
```

#### Generate Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name: "GitHub Actions Deployment"
6. Grant permissions in Play Console:
   - Go to Play Console
   - **Settings** > **API access**
   - Link Cloud project
   - Grant access to service account
   - Permissions: Release manager
7. Download JSON key
8. Base64 encode and add to GitHub secrets:
   ```bash
   base64 -i play-store-key.json | pbcopy
   ```

#### Trigger Deployment

```bash
# Manual trigger
gh workflow run build-capacitor-android.yml \
  -f build_type=release \
  -f output_format=aab

# Automatic on push to main
git push origin main
```

### 3. Fastlane for Android

Install Fastlane:

```bash
brew install fastlane
```

Initialize:

```bash
cd platforms/capacitor/android
fastlane init

# Select option: 2. Automate beta distribution to Google Play
# Package Name: io.nself.chat
```

Edit `fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Deploy to Internal Testing"
  lane :internal do
    gradle(
      task: "bundle",
      build_type: "Release"
    )

    upload_to_play_store(
      track: 'internal',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      skip_upload_metadata: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end

  desc "Deploy to Closed Beta"
  lane :beta do
    gradle(task: "bundle", build_type: "Release")

    upload_to_play_store(
      track: 'beta',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      rollout: '0.2'  # 20% rollout
    )
  end

  desc "Deploy to Production"
  lane :production do
    gradle(task: "bundle", build_type: "Release")

    upload_to_play_store(
      track: 'production',
      aab: 'app/build/outputs/bundle/release/app-release.aab',
      rollout: '0.1',  # 10% staged rollout
      skip_upload_metadata: false,
      skip_upload_images: false,
      skip_upload_screenshots: false
    )
  end
end
```

Run lanes:

```bash
fastlane internal     # Deploy to internal testing
fastlane beta        # Deploy to closed beta
fastlane production  # Deploy to production
```

---

## Version Management

### Versioning Strategy

**Version Code**: Integer that must increase with each release

- Internal: 1, 2, 3...
- Beta: 10, 11, 12...
- Production: 100, 101, 102...

**Version Name**: User-facing semantic version

- Format: MAJOR.MINOR.PATCH
- Example: 0.8.0, 0.8.1, 0.9.0

### Automated Version Bumping

```bash
#!/bin/bash
# scripts/bump-android-version.sh

VERSION_NAME=$1
BUILD_GRADLE="platforms/capacitor/android/app/build.gradle"

if [ -z "$VERSION_NAME" ]; then
  echo "Usage: ./bump-android-version.sh <version>"
  exit 1
fi

# Get current version code and increment
CURRENT_CODE=$(grep versionCode $BUILD_GRADLE | awk '{print $2}')
NEW_CODE=$((CURRENT_CODE + 1))

# Update version name and code
sed -i '' "s/versionName \".*\"/versionName \"$VERSION_NAME\"/" $BUILD_GRADLE
sed -i '' "s/versionCode .*/versionCode $NEW_CODE/" $BUILD_GRADLE

echo "Updated to version $VERSION_NAME (code $NEW_CODE)"
```

Usage:

```bash
chmod +x scripts/bump-android-version.sh
./scripts/bump-android-version.sh 0.8.1
```

---

## Troubleshooting

### Build Errors

**Error: "SDK location not found"**

Solution:

```bash
# Create local.properties
echo "sdk.dir=$ANDROID_HOME" > platforms/capacitor/android/local.properties
```

**Error: "Gradle sync failed"**

Solution:

```bash
cd platforms/capacitor/android
./gradlew --stop
./gradlew clean
./gradlew build
```

**Error: "Duplicate class found"**

Solution: Check for dependency conflicts in `build.gradle`:

```gradle
// Add to app/build.gradle
configurations {
    all*.exclude group: 'com.google.guava', module: 'listenablefuture'
}
```

### Signing Errors

**Error: "keystore not found"**

Solution:

```bash
# Verify path in keystore.properties
cat keystore.properties

# Ensure keystore file exists
ls -la keystore/nchat-upload.jks
```

**Error: "incorrect keystore password"**

Solution:

```bash
# Test keystore manually
keytool -list -v -keystore keystore/nchat-upload.jks

# If forgotten, you must create new keystore
# Note: Cannot update existing app with new keystore!
```

### Upload Issues

**Error: "Version code X has already been used"**

Solution: Increment version code in `build.gradle`

**Error: "Upload certificate has fingerprint [...] but should have fingerprint [...]"**

Solution:

```bash
# First upload must use upload certificate
# Cannot change certificate after first upload
# Verify you're using correct keystore

# Check fingerprint
keytool -list -v -keystore keystore/nchat-upload.jks | grep SHA256
```

**Error: "The apk must be signed with the same certificates as the previous version"**

Solution: Use the same keystore for all versions. If lost, cannot update app.

### Play Console Issues

**App stuck "Under review"**

- Normal review time: 1-7 days
- No expedited review available
- Check for rejection emails
- Contact support if >7 days

**"Pre-launch report shows crashes"**

Solution:

1. Review crash stack traces
2. Fix crashes in code
3. Upload new version
4. Pre-launch report updates automatically

**Rejected for policy violation**

Common issues:

- Missing privacy policy
- Inadequate data safety disclosures
- Misleading screenshots or description
- Violation of developer policies

Solution:

1. Read rejection reason carefully
2. Fix issues
3. Reply in Policy Status section
4. Upload corrected version

---

## Additional Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Android Developers Documentation](https://developer.android.com/)
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [Gradle Play Publisher](https://github.com/Triple-T/gradle-play-publisher)
- [Fastlane for Android](https://docs.fastlane.tools/getting-started/android/setup/)

---

**Document Version**: 1.0.0
**Last Updated**: January 2026
**Maintained By**: nChat Team

For questions or issues, contact: devops@nchat.nself.org
