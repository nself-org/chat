# App Store Submission Guide - nChat iOS

**Last Updated:** February 1, 2026
**App Version:** 0.8.0
**Target:** iOS 14.0+

---

## Quick Reference

**Timeline:**

- Preparation: 2-4 hours
- Upload: 15-30 minutes
- Review: 1-3 days (typical)
- Release: Immediate or scheduled

**Checklist:**

- [ ] App built and tested
- [ ] Screenshots captured (all sizes)
- [ ] App description written
- [ ] Keywords researched
- [ ] Privacy policy published
- [ ] Support URL live
- [ ] Test account created
- [ ] App submitted for review

---

## Prerequisites

### 1. App Store Connect Setup

**Required Information:**

- Apple Developer account ($99/year)
- App ID: `io.nself.chat`
- App name: nChat
- Primary language: English (U.S.)
- Bundle ID: `io.nself.chat`
- SKU: `nchat-ios-v080`

### 2. Build Requirements

- ✅ Build uploaded via TestFlight
- ✅ All icons and assets included
- ✅ Tested on real devices
- ✅ No critical bugs
- ✅ Performance benchmarks met

---

## App Information

### Basic Information

**App Name:** nChat
**Subtitle:** Team Communication Made Simple
**Primary Language:** English (U.S.)
**Category:** Social Networking (Primary), Productivity (Secondary)
**Content Rights:** Contains third-party content (user-generated)

### Version Information

**Version Number:** 0.8.0
**Build Number:** 800
**Copyright:** © 2026 nself. All rights reserved.

---

## Screenshots

### Required Sizes

**iPhone:**

1. **6.7" Display** (iPhone 14 Pro Max, 15 Pro Max)
   - Size: 1290 × 2796 pixels
   - Required: 3-10 screenshots
   - Priority: ⭐⭐⭐ (Most important)

2. **6.5" Display** (iPhone 11 Pro Max, XS Max)
   - Size: 1242 × 2688 pixels
   - Required: 3-10 screenshots
   - Priority: ⭐⭐

3. **5.5" Display** (iPhone 8 Plus, 7 Plus)
   - Size: 1242 × 2208 pixels
   - Required: 3-10 screenshots
   - Priority: ⭐

**iPad:**

1. **12.9" iPad Pro** (3rd gen and later)
   - Size: 2048 × 2732 pixels
   - Optional but recommended
   - Priority: ⭐ (if targeting iPad)

### Screenshot Content

**Suggested Screenshots (5 total):**

1. **Main Chat View**
   - Show: Active conversation with messages
   - Highlight: Clean UI, emoji reactions
   - Caption: "Stay connected with real-time messaging"

2. **Channel List**
   - Show: List of channels and DMs
   - Highlight: Organization, unread indicators
   - Caption: "Organize conversations into channels"

3. **Rich Media**
   - Show: Messages with images, files, voice notes
   - Highlight: Media preview, file sharing
   - Caption: "Share photos, files, and voice messages"

4. **Search & Discovery**
   - Show: Search results, filters
   - Highlight: Powerful search, easy navigation
   - Caption: "Find anything with powerful search"

5. **Settings & Customization**
   - Show: Theme options, notifications settings
   - Highlight: Personalization options
   - Caption: "Customize your experience"

### Generating Screenshots

```bash
# Option 1: Automated with Fastlane
fastlane snapshot

# Option 2: Manual with Simulator
# 1. Open app in Xcode simulator
# 2. Navigate to each screen
# 3. Cmd+S to save screenshot
# 4. Screenshots save to ~/Desktop

# Option 3: Using physical device
# 1. Connect iPhone/iPad
# 2. Take screenshots with buttons
# 3. Transfer via AirDrop or Photos.app
```

---

## App Description

### Description Template

```
nChat - Modern Team Communication

Stay connected with your team through powerful, intuitive messaging designed for modern collaboration.

KEY FEATURES:

• Real-Time Messaging
  - Instant message delivery
  - Emoji reactions and threads
  - Message formatting with markdown
  - @mentions and notifications

• Organized Channels
  - Public and private channels
  - Direct messages
  - Channel favorites
  - Custom channel themes

• Rich Media Sharing
  - Share photos and videos
  - Voice messages with waveform
  - File attachments
  - Camera integration

• Powerful Search
  - Find messages instantly
  - Filter by channel, user, or date
  - Search within attachments
  - Save frequent searches

• Works Offline
  - Read cached messages
  - Queue messages for sending
  - Automatic sync when online
  - 1000+ messages cached per channel

• Background Notifications
  - Push notifications
  - Badge count on app icon
  - Rich notifications with actions
  - Reply from notifications

• Security & Privacy
  - End-to-end encryption
  - Biometric lock (Face ID/Touch ID)
  - Two-factor authentication
  - Private channels

• Integrations
  - Slack import
  - GitHub notifications
  - Google Drive
  - Dropbox

• Cross-Platform
  - Sync across iOS, Android, web, and desktop
  - Seamless experience everywhere
  - Real-time synchronization

PERFECT FOR:

✓ Remote teams
✓ Project collaboration
✓ Community management
✓ Customer support
✓ Educational groups
✓ Social communities

WHY CHOOSE NCHAT?

⚡ Lightning Fast - Optimized for speed and performance
🔒 Secure - End-to-end encryption and privacy-first
🎨 Beautiful - Modern, intuitive design
🆓 Free - Core features free forever
📱 Cross-Platform - Use anywhere, any device

Download nChat and transform how your team communicates!

PRICING:

Free Plan:
- Unlimited messages
- Up to 100 team members
- 10 GB storage
- Basic integrations

Pro Plan ($4.99/month):
- Unlimited team members
- 100 GB storage
- Advanced integrations
- Priority support

Enterprise Plan (Contact sales):
- Unlimited everything
- Custom branding
- Dedicated support
- Advanced security

SUPPORT:

Need help? Visit https://support.nchat.io
Email: support@nself.org
Twitter: @nchatapp

PRIVACY:

We respect your privacy. Read our policy:
https://nchat.io/privacy
```

**Character limit:** 4000 characters

### Keywords

**Maximum:** 100 characters (including commas)

**Suggested Keywords:**

```
chat, messaging, team, communication, slack, discord, telegram, group chat, collaboration, workspace, channels, dm, voice messages, file sharing
```

**Tips:**

- No spaces after commas
- Use lowercase
- Research competitor keywords
- Include misspellings if common
- Update after launch based on search terms

---

## Promotional Text

**Limit:** 170 characters

**Example:**

```
NEW in v0.8.0: Native iOS app with offline mode, background sync, voice messages, and biometric security! Download now.
```

**Tips:**

- Update with each version
- Highlight latest features
- Visible without update
- Creates urgency

---

## App Privacy

### Privacy Practices

**Data Collection:**

1. **Contact Info**
   - Email address
   - Name
   - Phone number (optional)
   - **Usage:** Account creation, user identification
   - **Linked to user:** Yes
   - **Tracking:** No

2. **User Content**
   - Messages
   - Photos and videos
   - Audio data (voice messages)
   - Files and documents
   - **Usage:** App functionality
   - **Linked to user:** Yes
   - **Tracking:** No

3. **Identifiers**
   - User ID
   - Device ID
   - **Usage:** App functionality, analytics
   - **Linked to user:** Yes
   - **Tracking:** No

4. **Usage Data**
   - Product interaction
   - Crash data
   - Performance data
   - **Usage:** Analytics, app improvement
   - **Linked to user:** No
   - **Tracking:** No

5. **Diagnostics**
   - Crash data
   - Performance data
   - Other diagnostic data
   - **Usage:** Bug fixing, optimization
   - **Linked to user:** No
   - **Tracking:** No

**Privacy Policy URL:** https://nchat.io/privacy

---

## App Review Information

### Demo Account

**Create a test account for reviewers:**

```
Email: reviewer@nchat.io
Password: ReviewTest2026!
Server: https://demo.nchat.io
```

**Pre-populate with:**

- 3-5 channels with sample messages
- Sample files and images
- Example voice messages
- Test notifications

### Contact Information

**First Name:** [Your First Name]
**Last Name:** [Your Last Name]
**Phone:** +1-XXX-XXX-XXXX
**Email:** appstore@nself.org

### Notes for Reviewer

```
Thank you for reviewing nChat!

TESTING INSTRUCTIONS:

1. Login with provided credentials
2. Browse channels (#general, #random, #team)
3. Send a test message
4. Upload a photo from camera/gallery
5. Record a voice message
6. Test offline mode (airplane mode)
7. Test push notifications (send yourself a message)
8. Test biometric authentication (Settings → Security)

KEY FEATURES TO TEST:
- Real-time messaging
- File uploads (photos, documents)
- Voice messages
- Offline mode with sync
- Push notifications
- Biometric lock
- Search functionality

KNOWN ISSUES:
- None

SPECIAL NOTES:
- Background fetch requires time to activate
- Push notifications require server setup
- Offline mode requires initial login

Thank you!
```

---

## Export Compliance

### Encryption Information

**Does your app use encryption?**
✅ Yes

**Does your app qualify for any of the exemptions provided in Category 5, Part 2?**
✅ Yes

**Which exemption?**

- (e) Use of encryption limited to authentication, digital signature, decryption of data or files, or standard encryption

**Explanation:**

```
nChat uses standard HTTPS/TLS encryption for network communications and standard iOS encryption APIs for local data storage. It does not implement any proprietary or non-standard encryption algorithms.

The app uses:
1. HTTPS/TLS for all network communication
2. iOS Data Protection API for local storage
3. iOS Keychain for credential storage
4. Standard WebRTC encryption for video calls

All encryption is standard and exempt under Category 5, Part 2.
```

---

## Rating

### Age Rating Questionnaire

**Unrestricted Web Access:**

- [ ] No

**Simulated Gambling:**

- [ ] No

**Frequent/Intense:**

- Cartoon or Fantasy Violence: [ ] No
- Realistic Violence: [ ] No
- Prolonged Graphic or Sadistic Violence: [ ] No
- Horror/Fear Themes: [ ] No
- Sexual Content or Nudity: [ ] No
- Profanity or Crude Humor: [ ] No
- Mature/Suggestive Themes: [ ] No
- Alcohol, Tobacco, or Drug Use: [ ] No

**Infrequent/Mild:**

- All of above: [ ] No

**Medical/Treatment Information:**

- [ ] No

**Expected Rating:** 4+

**Note:** Since nChat allows user-generated content, it may contain content that would increase the rating. The 4+ rating applies to the app itself, not user content.

---

## Submission Checklist

### Pre-Submission

- [ ] App built and tested on real devices
- [ ] All features working correctly
- [ ] No critical bugs
- [ ] Performance requirements met:
  - [ ] Launch time <2s
  - [ ] Memory <100 MB idle
  - [ ] Battery <5% per hour
  - [ ] 60 FPS scrolling
- [ ] All screenshots captured
- [ ] Description written and reviewed
- [ ] Keywords researched
- [ ] Privacy policy published and linked
- [ ] Support URL live and tested
- [ ] Demo account created and tested

### Submission

- [ ] Logged into App Store Connect
- [ ] Selected correct app
- [ ] Added new version (0.8.0)
- [ ] Uploaded build via TestFlight
- [ ] Selected build for release
- [ ] Added screenshots (all required sizes)
- [ ] Entered description
- [ ] Entered keywords
- [ ] Set promotional text
- [ ] Completed privacy questionnaire
- [ ] Added app review information
- [ ] Added demo account credentials
- [ ] Answered export compliance questions
- [ ] Completed age rating questionnaire
- [ ] Reviewed all information
- [ ] Submitted for review

### Post-Submission

- [ ] Monitor review status daily
- [ ] Respond to any reviewer questions <24h
- [ ] Notify team of submission
- [ ] Prepare release announcement
- [ ] Monitor crash reports
- [ ] Plan next update

---

## Review Process

### Status Progression

1. **Waiting for Review** (1-3 days typical)
   - Queue time varies
   - Peak times: Monday mornings, post-holidays
   - Expedite requests available for critical issues

2. **In Review** (Few hours to 1 day)
   - Actual review by Apple
   - Testing app functionality
   - Checking metadata accuracy
   - Verifying compliance

3. **Pending Developer Release** (Approved!)
   - App approved but not released
   - Option to:
     - Release immediately
     - Schedule release date
     - Release manually

4. **Ready for Sale** (Live!)
   - App available on App Store
   - Usually visible within 24 hours globally
   - Search indexing takes 1-2 days

### Possible Rejections

**Common Rejection Reasons:**

1. **Guideline 2.1 - Performance: App Completeness**
   - App crashes on launch
   - Features don't work as described
   - **Solution:** Thoroughly test before submission

2. **Guideline 4.3 - Spam**
   - Too similar to existing apps
   - Duplicate of another submission
   - **Solution:** Highlight unique features

3. **Guideline 5.1.1 - Privacy: Data Collection**
   - Missing privacy policy
   - Privacy labels incorrect
   - **Solution:** Accurate privacy disclosures

4. **Guideline 2.3 - Metadata**
   - Screenshots don't match app
   - Description is inaccurate
   - **Solution:** Update metadata to match app

### Responding to Rejection

```
Example Response:

Subject: Re: nChat - Version 0.8.0 - Metadata Issue

Dear App Review Team,

Thank you for your feedback on nChat version 0.8.0.

We have addressed the concern regarding [specific issue]:
- [Specific change made]
- [Testing performed]
- [Additional information]

We have resubmitted the app for review. Please let us know if you need any additional information.

Screenshots and test account details remain the same.

Thank you for your time and consideration.

Best regards,
[Your Name]
nChat Team
```

---

## Expedited Review

**When to request:**

- Critical bug fix
- Security vulnerability
- Time-sensitive feature

**How to request:**

1. Submit app normally
2. Wait 24 hours
3. Visit App Store Connect
4. Click "Request Expedited Review"
5. Explain urgency

**Example:**

```
Reason for Expedite Request:

This update fixes a critical security vulnerability (CVE-XXXX-YYYY) that could allow unauthorized access to user accounts.

We discovered the issue on [date] and immediately developed a patch. The vulnerability is not yet publicly disclosed, but we are requesting expedited review to protect our users.

Details:
- CVE ID: CVE-XXXX-YYYY
- Severity: High
- Affected versions: 0.7.0 and earlier
- Fix included in: 0.8.0

Thank you for your consideration.
```

---

## After Approval

### Release Strategy

**Option 1: Immediate Release**

- Release as soon as approved
- Maximum speed to users
- Less control over timing

**Option 2: Scheduled Release**

- Set specific date/time
- Coordinate with marketing
- Global time zone considerations

**Option 3: Manual Release**

- Release when ready
- Full control
- Can delay if needed

### Post-Release

1. **Monitor Crash Reports**

   ```
   App Store Connect → Analytics → Crashes
   Sentry dashboard for detailed reports
   ```

2. **Monitor Ratings/Reviews**

   ```
   App Store Connect → Ratings and Reviews
   Respond to reviews within 48h
   Address common issues in updates
   ```

3. **Track Analytics**

   ```
   App Store Connect → Analytics → Metrics
   Firebase Analytics for detailed user behavior
   ```

4. **Prepare Next Update**
   - Fix bugs found in production
   - Add requested features
   - Optimize based on metrics

---

## Useful Links

- **App Store Connect:** https://appstoreconnect.apple.com
- **App Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/
- **Common Rejection Reasons:** https://developer.apple.com/app-store/review/rejections/
- **App Store Review Times:** https://appreviewtimes.com

---

## Support

**Questions about submission?**

- Email: appstore@nself.org
- Slack: #ios-app-store
- Docs: https://docs.nchat.io/deployment/ios

---

**Good luck with your submission!** 🚀
