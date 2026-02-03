# Mobile Deployment Checklist - nChat v0.8.0

**Last Updated:** February 1, 2026
**Platforms:** iOS, Android
**Version:** 0.8.0

---

## Overview

This checklist ensures a smooth, production-ready deployment of nChat mobile apps to the App Store and Play Store.

**Estimated Time:**

- iOS: 4-6 hours (first time), 2-3 hours (subsequent)
- Android: 3-5 hours (first time), 1-2 hours (subsequent)

---

## Pre-Deployment

### Account Setup

**iOS:**

- [ ] Apple Developer account active ($99/year)
- [ ] Team ID and account holder identified
- [ ] Payment method on file
- [ ] Tax forms completed

**Android:**

- [ ] Google Play Developer account active ($25 one-time)
- [ ] Payment method on file
- [ ] Tax identification completed
- [ ] Organization verified (if applicable)

### Development Environment

**General:**

- [ ] macOS 13+ (for iOS builds)
- [ ] Node.js 20+ installed
- [ ] pnpm 9.15.4+ installed
- [ ] Git repository access
- [ ] Code editor setup (VS Code, etc.)

**iOS Specific:**

- [ ] Xcode 15.0+ installed
- [ ] Xcode Command Line Tools installed
- [ ] CocoaPods 1.10+ installed
- [ ] Valid development certificate
- [ ] Valid distribution certificate

**Android Specific:**

- [ ] Android Studio Hedgehog+ installed
- [ ] Android SDK API 34 installed
- [ ] Java JDK 17 installed
- [ ] Gradle 8.0+ installed

---

## App Configuration

### Firebase Setup

- [ ] Firebase project created
- [ ] iOS app added to Firebase
  - [ ] Bundle ID: `io.nself.chat`
  - [ ] GoogleService-Info.plist downloaded
  - [ ] APNs key uploaded
- [ ] Android app added to Firebase
  - [ ] Package name: `io.nself.chat`
  - [ ] google-services.json downloaded
  - [ ] SHA-256 fingerprint added
- [ ] Analytics enabled
- [ ] Crashlytics enabled
- [ ] Cloud Messaging configured

### Sentry Configuration

- [ ] Sentry account created
- [ ] iOS project created
  - [ ] DSN obtained
  - [ ] Release tracking enabled
  - [ ] Source maps configured
- [ ] Android project created
  - [ ] DSN obtained
  - [ ] ProGuard mapping configured
  - [ ] Release tracking enabled

### Environment Variables

- [ ] `.env.local` configured:

  ```bash
  # Firebase
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
  NEXT_PUBLIC_FIREBASE_APP_ID=...

  # Sentry
  NEXT_PUBLIC_SENTRY_DSN_IOS=...
  NEXT_PUBLIC_SENTRY_DSN_ANDROID=...

  # App Config
  CAPACITOR_APP_ID=io.nself.chat
  CAPACITOR_APP_NAME=nChat
  ```

---

## iOS Deployment

### Apple Developer Portal

- [ ] App ID created (`io.nself.chat`)
- [ ] Capabilities enabled:
  - [ ] Push Notifications
  - [ ] Associated Domains
  - [ ] Background Modes
  - [ ] App Groups (if needed)
- [ ] APNs key created and downloaded
  - [ ] Key ID saved
  - [ ] Team ID saved
  - [ ] .p8 file stored securely
- [ ] Development provisioning profile
- [ ] Distribution provisioning profile (App Store)
- [ ] Ad-hoc provisioning profile (optional)

### App Store Connect

- [ ] App created in App Store Connect
  - [ ] App name: nChat
  - [ ] Bundle ID: `io.nself.chat`
  - [ ] SKU: `nchat-ios-v080`
  - [ ] Primary language: English (U.S.)
- [ ] App information completed:
  - [ ] Privacy policy URL
  - [ ] Support URL
  - [ ] Marketing URL
  - [ ] Category: Social Networking
  - [ ] Secondary category: Productivity
- [ ] Tax and banking information
- [ ] Contracts and agreements signed

### App Build

- [ ] Web app built:
  ```bash
  pnpm build && pnpm export
  ```
- [ ] Capacitor synced:
  ```bash
  cd platforms/capacitor
  npx cap sync ios
  ```
- [ ] CocoaPods installed:
  ```bash
  cd ios/App && pod install
  ```
- [ ] Xcode project opens without errors
- [ ] GoogleService-Info.plist added
- [ ] Info.plist configured:
  - [ ] All permissions with descriptions
  - [ ] URL schemes
  - [ ] Associated domains
  - [ ] Background modes
- [ ] Entitlements configured
- [ ] Build number incremented (800+)
- [ ] Version set to 0.8.0

### Testing

- [ ] Builds on simulator (iPhone 14 Pro)
- [ ] Builds on simulator (iPad Pro)
- [ ] Runs on physical device:
  - [ ] iPhone (smaller screen)
  - [ ] iPhone (larger screen)
  - [ ] iPad (if supporting)
- [ ] Core features tested:
  - [ ] Login/signup
  - [ ] Send message
  - [ ] Upload photo
  - [ ] Record voice message
  - [ ] Push notifications
  - [ ] Offline mode
  - [ ] Background sync
  - [ ] Biometric auth
  - [ ] Deep linking
  - [ ] Camera access
  - [ ] Photo library access
- [ ] Performance verified:
  - [ ] Launch time <2s
  - [ ] Memory <100 MB idle
  - [ ] 60 FPS scrolling
  - [ ] Battery <5% per hour
- [ ] No crashes or critical bugs
- [ ] All console warnings resolved

### Archive & Upload

- [ ] App archived in Xcode:
  - [ ] Product → Archive
  - [ ] Archive succeeded
  - [ ] Validate App (no errors)
- [ ] App uploaded to App Store Connect:
  - [ ] Distribute App → App Store Connect
  - [ ] Upload succeeded
  - [ ] Build appears in TestFlight
- [ ] Build processed successfully
- [ ] dSYM uploaded to Sentry (automatic)

### App Store Submission

- [ ] Screenshots captured:
  - [ ] 6.7" display (3-10 screenshots)
  - [ ] 6.5" display (3-10 screenshots)
  - [ ] 5.5" display (3-10 screenshots)
  - [ ] iPad 12.9" (optional, 3-10 screenshots)
- [ ] App description written (see template)
- [ ] Keywords researched and set
- [ ] Promotional text written
- [ ] Support URL live and tested
- [ ] Privacy policy URL live and tested
- [ ] Privacy practices completed
- [ ] Age rating completed (expected: 4+)
- [ ] App review information:
  - [ ] Demo account created
  - [ ] Contact information provided
  - [ ] Notes for reviewer written
- [ ] Export compliance answered
- [ ] Build selected for release
- [ ] Submitted for review

### TestFlight (Optional but Recommended)

- [ ] TestFlight build available
- [ ] Test information completed
- [ ] Internal testers added (up to 100)
- [ ] External testers added (optional)
- [ ] Beta testing completed
- [ ] Feedback collected and addressed

---

## Android Deployment

### Play Console Setup

- [ ] App created in Play Console
  - [ ] App name: nChat
  - [ ] Default language: English (United States)
  - [ ] Free or paid: Free
- [ ] Store presence configured:
  - [ ] App name
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] App icon (512×512 PNG)
  - [ ] Feature graphic (1024×500)
  - [ ] Screenshots (phone required)
  - [ ] Category: Social & Communication
- [ ] Content rating completed:
  - [ ] IARC questionnaire filled
  - [ ] Rating certificate received
- [ ] Privacy policy URL set
- [ ] Data safety section completed

### App Build

- [ ] Web app built:
  ```bash
  pnpm build && pnpm export
  ```
- [ ] Capacitor synced:
  ```bash
  cd platforms/capacitor
  npx cap sync android
  ```
- [ ] google-services.json added
- [ ] AndroidManifest.xml configured:
  - [ ] Permissions declared
  - [ ] Intent filters set
  - [ ] Metadata added
- [ ] ProGuard rules configured
- [ ] Build variants configured
- [ ] Version code incremented (800+)
- [ ] Version name set to 0.8.0

### Code Signing

- [ ] Release keystore created:
  ```bash
  keytool -genkey -v \
    -keystore nchat-release.keystore \
    -alias nchat \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
  ```
- [ ] keystore.properties created
- [ ] build.gradle configured for signing
- [ ] Keystore backed up securely
- [ ] Keystore password saved in password manager

### Testing

- [ ] Builds in debug mode
- [ ] Runs on emulator:
  - [ ] Pixel 6 (1080x2400)
  - [ ] Pixel Tablet (2560x1600)
- [ ] Runs on physical devices:
  - [ ] Phone (smaller screen)
  - [ ] Phone (larger screen)
  - [ ] Tablet (if supporting)
- [ ] Core features tested:
  - [ ] Login/signup
  - [ ] Send message
  - [ ] Upload photo
  - [ ] Record voice message
  - [ ] Push notifications (FCM)
  - [ ] Offline mode
  - [ ] Background sync (WorkManager)
  - [ ] Biometric auth (fingerprint/face)
  - [ ] Deep linking (App Links)
  - [ ] Camera access
  - [ ] Gallery access
- [ ] Performance verified:
  - [ ] Launch time <2s
  - [ ] Memory <150 MB idle
  - [ ] 60 FPS scrolling
  - [ ] Battery <6% per hour
- [ ] No crashes or ANRs
- [ ] All lint warnings resolved

### Build & Upload

- [ ] Release bundle built:
  ```bash
  cd platforms/capacitor/android
  ./gradlew bundleRelease
  ```
- [ ] Bundle signed successfully
- [ ] Bundle optimized (ProGuard)
- [ ] Upload to Play Console:
  - [ ] Production track OR
  - [ ] Internal testing (recommended first)
- [ ] Release notes written
- [ ] Countries/regions selected
- [ ] Pricing confirmed (Free)

### Internal Testing (Recommended)

- [ ] Internal testing track created
- [ ] AAB uploaded to internal testing
- [ ] Release notes added
- [ ] Testers added (email list up to 100)
- [ ] Build distributed to testers
- [ ] Testing period (1-2 days minimum)
- [ ] Feedback collected
- [ ] Critical issues fixed
- [ ] Ready for production

### Play Store Submission

- [ ] Production release created
- [ ] AAB uploaded
- [ ] Release notes completed
- [ ] Countries/regions confirmed
- [ ] Staged rollout configured:
  - [ ] Start with 5-10%
  - [ ] Monitor for 24-48 hours
  - [ ] Increase gradually
- [ ] Submitted for review

---

## Cross-Platform Verification

### Feature Parity

- [ ] All web features work on mobile
- [ ] iOS and Android feature parity
- [ ] No platform-specific bugs
- [ ] Consistent UI/UX across platforms

### Data Sync

- [ ] Messages sync across devices
- [ ] Settings sync correctly
- [ ] Read receipts work
- [ ] Notifications work on all devices
- [ ] Offline changes sync when online

### Performance Comparison

- [ ] Similar performance on both platforms
- [ ] Both meet target metrics
- [ ] No platform-specific slowdowns

---

## Post-Deployment

### Monitoring

**iOS:**

- [ ] App Store Connect analytics enabled
- [ ] Sentry iOS monitoring active
- [ ] Firebase Analytics tracking
- [ ] TestFlight feedback reviewed

**Android:**

- [ ] Play Console vitals dashboard
- [ ] Sentry Android monitoring active
- [ ] Firebase Analytics tracking
- [ ] Pre-launch reports reviewed

### Metrics to Monitor

**Both Platforms:**

- [ ] Crash rate (<1%)
- [ ] ANR rate (<0.5% Android)
- [ ] Ratings (target >4.0 stars)
- [ ] Reviews (respond within 48h)
- [ ] Daily active users (DAU)
- [ ] User retention (day 1, 7, 30)
- [ ] Session duration
- [ ] Feature usage

### User Feedback

- [ ] Monitor app store reviews
- [ ] Respond to negative reviews
- [ ] Thank positive reviews
- [ ] Collect feature requests
- [ ] Track common issues
- [ ] Plan next update

### Release Communication

- [ ] Announce on website
- [ ] Blog post published
- [ ] Social media posts:
  - [ ] Twitter
  - [ ] LinkedIn
  - [ ] Discord/Slack
- [ ] Email to users:
  - [ ] Existing web users
  - [ ] Beta testers
  - [ ] Waitlist subscribers
- [ ] Press release (if major launch)
- [ ] Update documentation

---

## Update Cycle Planning

### Hotfix Process

**When needed:**

- Critical bug affecting >10% users
- Security vulnerability
- Data loss issue
- Crash on launch

**Process:**

1. [ ] Fix issue in codebase
2. [ ] Increment build number only
3. [ ] Test fix thoroughly
4. [ ] Upload to TestFlight/Internal testing
5. [ ] Verify fix works
6. [ ] Submit to stores (expedited if possible)
7. [ ] 100% rollout (urgent)

### Minor Update (2-4 weeks)

**Includes:**

- Bug fixes
- Small improvements
- Performance tweaks

**Process:**

1. [ ] Fix bugs reported by users
2. [ ] Implement small features
3. [ ] Increment build number
4. [ ] Follow full testing process
5. [ ] Staged rollout

### Major Update (2-3 months)

**Includes:**

- New features
- UI changes
- Major improvements

**Process:**

1. [ ] Plan features
2. [ ] Implement changes
3. [ ] Increment version number (0.9.0)
4. [ ] Beta test extensively
5. [ ] Marketing campaign
6. [ ] Staged rollout

---

## Emergency Rollback

### iOS

**If critical issue found:**

1. [ ] Don't panic - users on old version OK
2. [ ] Pull new version from sale (optional)
3. [ ] Fix issue immediately
4. [ ] Submit new build (expedited review)
5. [ ] Communicate with users

**Note:** Can't rollback on iOS, only replace with fixed version

### Android

**If critical issue found:**

1. [ ] Halt staged rollout immediately
2. [ ] Fix issue in code
3. [ ] Build new version (increment build)
4. [ ] Test thoroughly
5. [ ] Upload and resume rollout

**Rollback option:**

- Can rollback to previous version if needed
- Only affects users on staged rollout
- Previous version becomes active

---

## Success Criteria

### Launch Success

- [ ] Both apps approved and live
- [ ] <1% crash rate on both platforms
- [ ] > 4.0 star rating (target)
- [ ] > 1000 downloads in first week
- [ ] <5% uninstall rate
- [ ] Positive user feedback

### 30-Day Success

- [ ] > 10,000 downloads (both platforms)
- [ ] > 4.2 star average rating
- [ ] <0.5% crash rate
- [ ] 50%+ day-7 retention
- [ ] 30%+ day-30 retention
- [ ] Active user engagement

---

## Troubleshooting Quick Reference

### iOS Issues

**Build fails:**

```bash
# Clean build
rm -rf ~/Library/Developer/Xcode/DerivedData
cd platforms/capacitor/ios/App
rm -rf Pods Podfile.lock
pod install --repo-update
```

**Signing issues:**

- Check provisioning profiles in Xcode
- Verify certificate expiration
- Re-download profiles from developer portal

**Upload fails:**

- Validate app in Xcode before uploading
- Check bundle ID matches exactly
- Verify all info.plist entries

### Android Issues

**Build fails:**

```bash
# Clean build
cd platforms/capacitor/android
./gradlew clean
./gradlew --stop
./gradlew build
```

**Signing issues:**

- Verify keystore password
- Check keystore.properties path
- Ensure build.gradle configured correctly

**Upload fails:**

- Verify package name matches exactly
- Check version code is higher than previous
- Ensure bundle is signed with release keystore

---

## Resources

### Official Documentation

- **iOS:** https://developer.apple.com/documentation
- **Android:** https://developer.android.com
- **Capacitor:** https://capacitorjs.com/docs
- **Firebase:** https://firebase.google.com/docs

### Support

- **Email:** mobile@nself.org
- **Slack:** #mobile-deployment
- **Docs:** https://docs.nchat.io/deployment
- **GitHub:** https://github.com/nself/nself-chat/issues

---

## Final Checklist

### Before Clicking "Submit"

- [ ] All tests pass
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] All assets uploaded
- [ ] All information accurate
- [ ] Privacy policy live
- [ ] Support infrastructure ready
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Rollback plan documented

### After Submission

- [ ] Confirmation received
- [ ] Monitor review status
- [ ] Respond to reviewer questions <24h
- [ ] Prepare launch announcement
- [ ] Monitor crash reports
- [ ] Track user feedback
- [ ] Plan next update

---

**Ready to deploy? Follow this checklist step by step. Good luck!** 🚀

---

**Questions?** Contact mobile@nself.org
