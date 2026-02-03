# Play Store Submission Guide - nChat Android

**Last Updated:** February 1, 2026
**App Version:** 0.8.0
**Target:** Android 7.0+ (API 24+)

---

## Quick Reference

**Timeline:**

- Preparation: 2-4 hours
- Upload: 15-30 minutes
- Review: 1-7 days (typical)
- Release: Immediate or staged

**Checklist:**

- [ ] App built and signed
- [ ] Screenshots captured (all required types)
- [ ] Store listing completed
- [ ] Content rating received
- [ ] Pricing set
- [ ] App uploaded to internal testing
- [ ] App promoted to production

---

## Prerequisites

### 1. Google Play Console Setup

**Required:**

- Google Play Developer account ($25 one-time fee)
- Package name: `io.nself.chat`
- App name: nChat
- Default language: English (United States)

**Create App:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in details:
   - App name: nChat
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
4. Accept declarations
5. Click **Create app**

### 2. Build Requirements

```bash
# Build signed bundle
cd platforms/capacitor/android
./gradlew bundleRelease

# Output location
android/app/build/outputs/bundle/release/app-release.aab

# Verify bundle
bundletool build-apks \
  --bundle=app-release.aab \
  --output=app.apks
```

---

## App Information

### Store Listing

**App name:** nChat
**Short description** (80 characters):

```
Modern team communication with messaging, voice notes, and offline mode
```

**Full description** (4000 characters):

```
nChat - Modern Team Communication

Stay connected with powerful, intuitive messaging designed for modern teams.

🚀 KEY FEATURES

Real-Time Messaging
• Instant message delivery with read receipts
• Emoji reactions and threaded conversations
• Rich text formatting with markdown
• @mentions with smart notifications
• Message search and filtering

Organized Channels
• Public and private channels for teams
• Direct messages for one-on-one chats
• Channel organization and favorites
• Custom themes per channel
• Channel descriptions and pins

Rich Media Sharing
• Share photos and videos instantly
• Voice messages with waveform visualization
• File attachments (documents, PDFs, etc.)
• Camera integration with editing
• Gallery access

Offline Mode
• Read cached messages without internet
• Queue messages for automatic sending
• Automatic sync when online
• Store 1000+ messages per channel
• Background synchronization

Smart Notifications
• Push notifications via Firebase
• Customizable per channel
• Notification channels for priorities
• Inline reply from notifications
• Quiet hours and do-not-disturb

Security & Privacy
• End-to-end encryption for messages
• Biometric lock (fingerprint/face)
• Two-factor authentication
• Private and encrypted channels
• Secure file storage

Integrations
• Import from Slack
• GitHub notifications
• Google Drive integration
• Dropbox file sharing
• Custom webhooks

Cross-Platform
• Sync across Android, iOS, web, desktop
• Seamless experience everywhere
• Real-time synchronization
• Unified inbox

✨ PERFECT FOR

✓ Remote and hybrid teams
✓ Project collaboration
✓ Community management
✓ Customer support teams
✓ Educational groups
✓ Gaming communities
✓ Non-profit organizations

⚡ WHY CHOOSE NCHAT?

Fast - Optimized for speed and performance (60 FPS scrolling)
Secure - End-to-end encryption and privacy-first design
Beautiful - Modern Material Design 3 with dynamic theming
Free - Core features free forever, no trial limitations
Open - Import/export your data, no vendor lock-in

📱 ANDROID FEATURES

• Material You dynamic theming (Android 12+)
• Notification channels for granular control
• Picture-in-picture for video calls
• App shortcuts for quick access
• Home screen widgets
• Share target for easy sharing
• Dark theme with auto-switching

💎 PRICING

Free Plan:
• Unlimited messages
• Up to 100 team members
• 10 GB storage
• Basic integrations
• Community support

Pro Plan ($4.99/month):
• Unlimited team members
• 100 GB storage
• Advanced integrations
• Priority support
• Custom branding

Enterprise Plan:
• Unlimited everything
• Custom domain
• SSO integration
• Dedicated support
• SLA guarantee

🛠️ SUPPORT

Need help? We're here for you!
• Help Center: https://support.nchat.io
• Email: support@nself.org
• Twitter: @nchatapp
• Discord: discord.gg/nchat

🔒 PRIVACY

We respect your privacy. Your data is yours.
Privacy Policy: https://nchat.io/privacy
Terms of Service: https://nchat.io/terms

📢 WHAT'S NEW IN v0.8.0

• Native Android app with Material Design 3
• Offline mode with background sync
• Voice messages with waveform
• Biometric security (fingerprint/face)
• Enhanced notifications with inline reply
• Performance improvements (60 FPS)
• Reduced battery usage
• Bug fixes and stability improvements

Download nChat and transform how your team communicates!
```

---

## Graphics Assets

### App Icon

**Requirements:**

- Format: PNG (32-bit)
- Size: 512 × 512 pixels
- Max file size: 1 MB

**Design Guidelines:**

- No transparency
- No rounded corners (Google adds)
- Visible at small sizes
- Matches brand identity

### Feature Graphic

**Requirements:**

- Size: 1024 × 500 pixels
- Format: PNG or JPEG
- Max file size: 1 MB

**Design Tips:**

- Showcases app visually
- Include app name/logo
- No text requiring translation
- Looks good on all devices

### Screenshots

**Phone Screenshots** (REQUIRED):

- Size: 16:9 aspect ratio
- Minimum: 320 × 569 pixels
- Maximum: 3840 × 2160 pixels
- Count: Minimum 2, maximum 8
- Recommended: 1080 × 1920 pixels (portrait)

**7-inch Tablet Screenshots** (OPTIONAL):

- Same requirements as phone
- Recommended: 1200 × 1920 pixels

**10-inch Tablet Screenshots** (OPTIONAL):

- Same requirements as phone
- Recommended: 1600 × 2560 pixels

**Suggested Screenshots (5-8):**

1. **Main Chat View**
   - Active conversation
   - Show message bubbles, reactions
   - Caption: "Real-time messaging"

2. **Channel List**
   - Channels and DMs
   - Unread indicators
   - Caption: "Stay organized"

3. **Voice Message**
   - Recording or playing voice message
   - Waveform visualization
   - Caption: "Voice messages"

4. **Media Sharing**
   - Image/file preview
   - Gallery integration
   - Caption: "Share anything"

5. **Search**
   - Search interface with results
   - Filters applied
   - Caption: "Find anything instantly"

6. **Offline Mode**
   - Offline indicator
   - Queued messages
   - Caption: "Works offline"

7. **Notifications**
   - Rich notification with actions
   - Inline reply shown
   - Caption: "Smart notifications"

8. **Settings**
   - Theme options
   - Dark mode toggle
   - Caption: "Personalize your experience"

**Generating Screenshots:**

```bash
# Using emulator
# 1. Open Android Studio
# 2. Run app on Pixel 6 emulator (1080x2400)
# 3. Navigate to each screen
# 4. Screenshot button in emulator toolbar
# 5. Save screenshots

# Automated with Fastlane Screengrab
fastlane screengrab
```

---

## Content Rating

### IARC Questionnaire

**Step 1: Start Questionnaire**

1. Go to **App content** → **Content rating**
2. Start questionnaire
3. Select email address for correspondence

**Step 2: Category**

- Select: **Apps & Games**

**Step 3: Violence**

- Does your app depict violence? **No**
- Does your app depict realistic violence? **No**
- Does your app depict violence towards realistic or cartoon characters? **No**

**Step 4: Sexual Content**

- Does your app contain sexual content? **No**
- Does your app contain nudity? **No**
- Does your app contain sexual references? **No**

**Step 5: Language**

- Does your app contain profanity? **No**
- Does your app contain crude humor? **No**

**Step 6: Controlled Substances**

- Does your app depict or reference alcohol, tobacco or drug use? **No**

**Step 7: User-Generated Content**

- Does your app allow users to interact? **Yes**
- Can users share their location? **Yes**
- Can users make unrestricted content visible publicly? **Yes**

**Step 8: Gambling**

- Does your app contain simulated gambling? **No**

**Step 9: Privacy & Data**

- Does your app collect or share user information? **Yes**
  - Types: Email, name, messages, photos
  - Uses: App functionality, analytics

**Expected Rating:**

- ESRB: Everyone
- PEGI: 3
- USK: 0
- IARC: 3+

---

## Privacy Policy

### Required URL

**Privacy Policy URL:** https://nchat.io/privacy

**Must include:**

- Data collected
- How data is used
- Third parties with access
- User rights
- Contact information

**Template sections:**

1. Information We Collect
2. How We Use Information
3. Information Sharing
4. Data Security
5. Your Rights
6. Children's Privacy
7. Changes to Policy
8. Contact Us

---

## Data Safety

### Data Types Collected

**Personal info:**

- [x] Name
- [x] Email address
- [ ] User IDs (internal only)
- [ ] Address (no)
- [ ] Phone number (optional)

**Messages:**

- [x] Emails or personal communication
- [x] Other user content (messages, files)

**Photos and videos:**

- [x] Photos (shared by user)
- [x] Videos (shared by user)

**Audio:**

- [x] Voice or sound recordings (voice messages)

**Files and docs:**

- [x] Files and documents (shared files)

**App activity:**

- [x] App interactions (usage analytics)
- [ ] In-app search history (local only)

**Device or other IDs:**

- [x] Device or other IDs (for analytics)

### Data Usage

**Account management:**

- Email, name for account creation

**App functionality:**

- Messages, files, media for chat features

**Analytics:**

- Usage data for app improvement
- Not used for tracking

**Developer communications:**

- Email for support, updates

### Data Security

**In transit:**

- [x] Data is encrypted in transit (HTTPS/TLS)

**At rest:**

- [x] Data is encrypted at rest (database encryption)

**Can request data deletion:**

- [x] Yes (account deletion)

---

## Upload Process

### Step 1: Create Release

1. Go to **Production** → **Create new release**
2. Choose release name: `0.8.0 (800)`

### Step 2: Upload App Bundle

```bash
# Build bundle
cd platforms/capacitor/android
./gradlew bundleRelease

# Upload via Play Console UI
# Or use Play Console API
```

**Upload:**

1. Click **Upload** in release section
2. Select `app-release.aab` file
3. Wait for upload and processing
4. Google Play verifies bundle

### Step 3: Release Notes

**What's new in this release:**

```
v0.8.0 - Major Update 🎉

NEW FEATURES:
• Native Android app built with latest Material Design 3
• Offline mode - read and send messages without internet
• Voice messages with waveform visualization
• Biometric security with fingerprint and face unlock
• Background sync for seamless experience
• Rich notifications with inline reply
• Home screen widgets for quick access

IMPROVEMENTS:
• 60 FPS scrolling performance
• Reduced app size by 30%
• Lower battery usage
• Faster startup time
• Enhanced dark theme
• Better tablet support

BUG FIXES:
• Fixed notification sounds
• Resolved crash on image upload
• Fixed sync issues on slow networks
• Improved memory management

Download or update now to enjoy the new features!
```

### Step 4: Save and Review

1. Click **Save**
2. Review all information
3. Review countries/regions (select all or specific)
4. Review pricing (Free)

### Step 5: Send for Review

1. Click **Review release**
2. Verify all details
3. Click **Start rollout to Production**

---

## Testing Tracks

### Internal Testing

**Purpose:** Quick testing with up to 100 testers

**Setup:**

1. Go to **Testing** → **Internal testing**
2. Create new release
3. Upload AAB
4. Add release notes
5. Add testers (email list)
6. Save and send

**Benefits:**

- Instant availability
- No review required
- Quick feedback

### Closed Testing

**Purpose:** Larger testing group

**Setup:**

1. Go to **Testing** → **Closed testing**
2. Create testing track (e.g., "beta")
3. Add testers (up to 100,000)
4. Upload build
5. Publish

**Benefits:**

- Public or private
- Opt-in links
- Staged rollout

### Open Testing

**Purpose:** Public beta

**Setup:**

1. Go to **Testing** → **Open testing**
2. Upload build
3. Available to anyone

**Benefits:**

- Public discovery
- Large user base
- Pre-launch feedback

### Recommended Flow

```
1. Internal testing (1-2 days)
   ↓
2. Closed testing beta track (1 week)
   ↓
3. Production with staged rollout
```

---

## Staged Rollout

### Configuration

1. On production release page
2. Select **Staged rollout**
3. Choose percentage:
   - 1% (cautious start)
   - 5% (recommended)
   - 10%
   - 20%
   - 50%
   - 100% (full rollout)

### Monitoring

**Monitor for 24-48 hours:**

- Crash rate
- ANR (App Not Responding) rate
- User reviews
- Ratings

**Thresholds:**

- Crash rate: <1%
- ANR rate: <0.5%
- Rating: >4.0 stars

### Increase Rollout

**If metrics good:**

1. Return to release
2. Increase percentage
3. Repeat every 24-48 hours
4. Reach 100%

**If issues found:**

1. Halt rollout
2. Fix critical issues
3. Upload new version
4. Resume rollout

---

## Post-Launch

### Monitor Metrics

**Vitals Dashboard:**

1. Go to **Quality** → **Android vitals**
2. Monitor:
   - Crash rate (<1%)
   - ANR rate (<0.5%)
   - Battery drain
   - Wake locks
   - Slow rendering frames

**User Feedback:**

1. Go to **User feedback** → **Ratings and reviews**
2. Respond to reviews (especially negative)
3. Response time: <48 hours

### Update Cycle

**Minor updates:** Every 2-4 weeks
**Major updates:** Every 2-3 months

**Hotfix process:**

1. Fix critical bug
2. Increment build number (e.g., 800 → 801)
3. Upload to internal testing
4. Test thoroughly
5. Promote to production
6. 100% rollout (urgent fixes)

---

## Checklist

### Pre-Submission

- [ ] App built and signed
- [ ] Tested on multiple devices
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] App icon ready (512×512)
- [ ] Feature graphic ready (1024×500)
- [ ] Screenshots captured (all sizes)
- [ ] Store listing written
- [ ] Privacy policy published
- [ ] Content rating completed
- [ ] Data safety section filled
- [ ] Internal testing completed

### Submission

- [ ] Logged into Play Console
- [ ] Selected correct app
- [ ] Created new production release
- [ ] Uploaded signed AAB
- [ ] Added release notes
- [ ] Reviewed countries/regions
- [ ] Confirmed pricing (free)
- [ ] Started rollout

### Post-Submission

- [ ] Monitor crash reports
- [ ] Monitor ANR reports
- [ ] Monitor reviews
- [ ] Respond to feedback
- [ ] Track rollout percentage
- [ ] Plan next update

---

## Review Timeline

**Typical Timeline:**

- Upload: 5-10 minutes
- Processing: 10-30 minutes
- Review: 1-7 days (average 2-3 days)
- Publishing: Immediate after approval

**Expedited Review:**

- Not available (no expedite option)
- Critical fixes: Update immediately after approval

---

## Rejection Reasons

**Common Issues:**

1. **Missing Content Rating**
   - Solution: Complete IARC questionnaire

2. **Privacy Policy Missing**
   - Solution: Add privacy policy URL

3. **Crashes on Launch**
   - Solution: Test thoroughly before submission

4. **Misleading Content**
   - Solution: Accurate screenshots and description

5. **Spam or Low Quality**
   - Solution: Ensure app provides value

---

## Useful Links

- **Play Console:** https://play.google.com/console
- **Developer Policy:** https://play.google.com/about/developer-content-policy/
- **Material Design:** https://m3.material.io/
- **Common Rejection Reasons:** https://support.google.com/googleplay/android-developer/answer/9876937

---

## Support

**Questions about submission?**

- Email: playstore@nself.org
- Slack: #android-play-store
- Docs: https://docs.nchat.io/deployment/android

---

**Good luck with your submission!** 🚀
