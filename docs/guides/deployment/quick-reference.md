# Mobile Deployment Quick Reference

Fast reference for deploying mobile apps. For detailed guides, see [mobile-deployment.md](./mobile-deployment.md).

## 🚀 Quick Deploy

### iOS TestFlight

```bash
export APPLE_TEAM_ID="ABC123XYZ"
export APPLE_ID="developer@example.com"
export APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"

./scripts/deploy-mobile-ios.sh --testflight
```

### Android Internal Testing

```bash
export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-password"
export ANDROID_KEY_ALIAS="upload-key"
export ANDROID_KEY_PASSWORD="your-password"

./scripts/deploy-mobile-android.sh --internal
```

---

## 📋 Environment Variables

### iOS

| Variable                | Where to Find                                    |
| ----------------------- | ------------------------------------------------ |
| `APPLE_TEAM_ID`         | https://developer.apple.com/account/#/membership |
| `APPLE_ID`              | Your Apple ID email                              |
| `APP_SPECIFIC_PASSWORD` | https://appleid.apple.com/account/manage         |

### Android

| Variable                    | How to Set                                                |
| --------------------------- | --------------------------------------------------------- |
| `ANDROID_KEYSTORE_PATH`     | Path to your release.keystore file                        |
| `ANDROID_KEYSTORE_PASSWORD` | Password you set when creating keystore                   |
| `ANDROID_KEY_ALIAS`         | Alias you set when creating keystore (e.g., "upload-key") |
| `ANDROID_KEY_PASSWORD`      | Key password you set when creating keystore               |

---

## 🔑 First-Time Setup

### iOS

1. **Generate app-specific password**:
   - Go to https://appleid.apple.com/account/manage
   - Security → App-Specific Passwords
   - Generate new password
   - Save it (shown only once)

### Android

1. **Create keystore** (one-time):

   ```bash
   keytool -genkey -v \
     -keystore release.keystore \
     -alias upload-key \
     -keyalg RSA \
     -keysize 2048 \
     -validity 10000

   # CRITICAL: Backup this file!
   ```

2. **Secure the keystore**:
   ```bash
   chmod 600 release.keystore
   # Store in encrypted location
   # Never commit to git
   ```

---

## 📱 Deployment Tracks

### iOS

| Track               | Command        | Review Time            | Audience             |
| ------------------- | -------------- | ---------------------- | -------------------- |
| TestFlight Internal | `--testflight` | 10-30 min (processing) | Up to 100 testers    |
| TestFlight External | `--testflight` | 1-2 days (review)      | Up to 10,000 testers |
| Production          | `--production` | 1-2 days (review)      | Public               |

### Android

| Track                 | Command        | Review Time            | Audience              |
| --------------------- | -------------- | ---------------------- | --------------------- |
| Internal Testing      | `--internal`   | Immediate              | Up to 100 testers     |
| Closed Testing (Beta) | `--beta`       | 1-2 hours (pre-launch) | Up to 100,000 testers |
| Production            | `--production` | 1-7 days (review)      | Public                |

---

**Last Updated**: January 31, 2026
**Version**: 1.0.0
