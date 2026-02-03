# Analytics & Privacy Policy

**Version**: 0.8.0
**Last Updated**: January 31, 2026
**Effective Date**: January 31, 2026

## Overview

nChat uses analytics to improve your experience, fix bugs, and understand how features are used. We are committed to transparency and your privacy rights under GDPR, CCPA, and other privacy regulations.

## What We Collect

### Usage Analytics (Firebase Analytics)

When enabled, we collect:

- **Screen Views**: Which screens you visit and how long you spend on them
- **Feature Usage**: Which features you use (search, channels, messages, etc.)
- **User Interactions**: Buttons clicked, forms submitted, actions taken
- **Session Data**: Session duration, frequency, and patterns
- **Device Information**: Platform (iOS/Android/Web), OS version, app version
- **Locale Data**: Language preference and timezone

### Performance Monitoring (Firebase Performance + Sentry)

When enabled, we collect:

- **Load Times**: How long screens and features take to load
- **API Response Times**: Speed of backend API calls
- **Network Performance**: Request success/failure rates
- **App Stability**: Crash-free sessions percentage

### Error Tracking (Sentry)

When enabled, we collect:

- **Error Messages**: JavaScript errors and exceptions
- **Stack Traces**: Code execution path when errors occur
- **Context Data**: Screen, user action, and state when error happened
- **Device Context**: OS, browser, app version

### Crash Reporting (Sentry + Firebase Crashlytics)

When enabled, we collect:

- **Crash Logs**: Native crash data from iOS/Android
- **Crash Context**: Memory usage, CPU state, device state
- **Breadcrumbs**: User actions leading up to crash

## What We DON'T Collect

We explicitly DO NOT collect:

- **Message Content**: Your actual messages or conversations
- **File Attachments**: Your uploaded files or images
- **Passwords**: Authentication credentials or tokens
- **Personal Conversations**: Private or direct message content
- **Contact Lists**: Your address book or contacts
- **Microphone/Camera**: Audio or video without your explicit permission
- **Location Data**: GPS coordinates or precise location
- **Third-Party Data**: Data from other apps or services

## How We Use Your Data

We use analytics data to:

1. **Improve Performance**: Identify and fix slow features
2. **Fix Bugs**: Diagnose and resolve errors and crashes
3. **Understand Usage**: Learn which features are most valuable
4. **Optimize Experience**: Make the app faster and easier to use
5. **Prioritize Development**: Focus on features you actually use
6. **Ensure Stability**: Monitor app health and prevent crashes

## Data Storage and Retention

### Storage Locations

- **Firebase Analytics**: Google Cloud Platform (US region)
- **Sentry**: Sentry.io infrastructure (US region)
- **Local Device**: Preferences stored in device secure storage

### Retention Periods

| Data Type        | Retention Period         |
| ---------------- | ------------------------ |
| Analytics Events | 14 months                |
| Performance Data | 90 days                  |
| Error Logs       | 90 days                  |
| Crash Reports    | 90 days                  |
| User Properties  | Until deletion requested |
| Session Data     | 14 months                |

## Your Privacy Rights

### GDPR Rights (European Users)

You have the right to:

1. **Access**: Request a copy of your analytics data
2. **Rectification**: Correct inaccurate data
3. **Erasure**: Delete all your analytics data
4. **Restrict Processing**: Limit how we use your data
5. **Data Portability**: Export your data in JSON format
6. **Object**: Opt out of analytics entirely
7. **Withdraw Consent**: Change your mind at any time

### CCPA Rights (California Users)

You have the right to:

1. **Know**: What data we collect and how we use it
2. **Delete**: Request deletion of your analytics data
3. **Opt-Out**: Disable all analytics tracking
4. **Non-Discrimination**: Same service even if you opt out

### How to Exercise Your Rights

**Via App Settings:**

1. Open Settings
2. Go to Privacy & Security → Analytics Settings
3. Toggle individual preferences or use "Reject All"

**Via Email:**
Send requests to: privacy@nself.org

We will respond within 30 days.

## Consent Management

### Default State

**GDPR Compliance**: All analytics are OPT-IN by default. We will not collect any data until you explicitly consent.

**First Launch**: You will see a consent banner explaining what we collect and why.

### Granular Controls

You can control each type of tracking separately:

- ✓ Usage Analytics
- ✓ Performance Monitoring
- ✓ Error Tracking
- ✓ Crash Reporting

### Changing Your Mind

You can change your consent at any time:

1. Open Settings → Privacy & Security
2. Toggle Analytics Settings
3. Changes apply immediately

## Data Security

### Encryption

- **In Transit**: All data encrypted with TLS 1.3
- **At Rest**: Data encrypted in Firebase and Sentry infrastructure
- **Local Storage**: Device secure storage with platform encryption

### Access Controls

- Analytics data is only accessible to authorized nChat developers
- Access is logged and audited
- Multi-factor authentication required for all access

### Third-Party Processors

| Service              | Purpose         | Location | Privacy Policy                                      |
| -------------------- | --------------- | -------- | --------------------------------------------------- |
| Firebase Analytics   | Usage tracking  | USA      | [Link](https://firebase.google.com/support/privacy) |
| Firebase Crashlytics | Crash reporting | USA      | [Link](https://firebase.google.com/support/privacy) |
| Sentry               | Error tracking  | USA      | [Link](https://sentry.io/privacy/)                  |

All processors are GDPR-compliant and have signed Data Processing Agreements (DPAs).

## Data Anonymization

### IP Address Anonymization

When enabled (default: ON), we:

- Remove the last octet of IPv4 addresses
- Remove the last 80 bits of IPv6 addresses
- Example: `192.168.1.100` becomes `192.168.1.0`

### User ID Anonymization

When enabled (default: OFF), we:

- Hash your user ID with SHA-256
- Only store the hashed version
- Cannot be reversed to identify you

## Children's Privacy

nChat is not intended for children under 13 (or 16 in the EU). We do not knowingly collect data from children. If we discover we have collected data from a child, we will delete it immediately.

## Do Not Track

We respect browser "Do Not Track" (DNT) signals:

- If DNT is enabled, we will not initialize analytics
- Applies to web version only
- Mobile users can use in-app settings

## Data Breach Notification

In the unlikely event of a data breach:

- We will notify affected users within 72 hours
- We will notify relevant authorities as required by law
- We will provide details about what data was affected
- We will offer remediation steps

## Changes to This Policy

We may update this policy to reflect:

- Changes in analytics practices
- New features or services
- Legal or regulatory requirements

When we update:

- We will notify you in-app
- We will update the "Last Updated" date
- We will require re-consent if changes are material

## Contact Information

**Privacy Questions:**
Email: privacy@nself.org

**Data Protection Officer:**
Email: dpo@nself.org

**Mailing Address:**
nSelf, Inc.
Privacy Department
[Address TBD]

## Transparency Report

We publish an annual transparency report showing:

- Number of data access requests received
- Number of deletion requests processed
- Average response time
- Data breach incidents (if any)

Latest report: [Link TBD]

## Technical Details

### Tracking Technologies

We use:

- **Cookies**: Web version only, for session management
- **Local Storage**: Store consent preferences
- **SDK Integration**: Firebase and Sentry SDKs
- **Device IDs**: Anonymous device identifiers (can be reset)

### No Cross-Site Tracking

We do NOT:

- Track you across other websites or apps
- Share data with advertisers
- Build advertising profiles
- Sell your data to third parties

## Open Source

Our analytics implementation is open source:

- Source code: [GitHub TBD]
- You can audit our tracking code
- You can suggest privacy improvements
- We welcome security researchers

## Compliance Certifications

- ✓ GDPR Compliant
- ✓ CCPA Compliant
- ✓ SOC 2 Type II (pending)
- ✓ ISO 27001 (pending)

## Summary (TL;DR)

**What we track**: Usage patterns, performance, errors
**What we DON'T track**: Your messages, files, or personal content
**Default**: Opt-in (you choose)
**Your control**: Granular on/off switches
**Your rights**: Access, delete, export, opt-out
**Our promise**: Transparency, respect, security

---

**Last Review**: January 31, 2026
**Next Review**: July 31, 2026
