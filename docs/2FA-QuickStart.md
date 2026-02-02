# 2FA Quick Start Guide

Fast reference for implementing and using Two-Factor Authentication in nchat.

## 🚀 Quick Setup (Developer)

### 1. Add to Settings Page

```tsx
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings'

export default function SecuritySettingsPage() {
  return <TwoFactorSettings />
}
```

Done! Users can now enable/disable 2FA from settings.

### 2. Add to Login Flow

```tsx
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify'
import { useState } from 'react'

function LoginPage() {
  const [needs2FA, setNeeds2FA] = useState(false)
  const [userId, setUserId] = useState('')

  const handleLogin = async (email, password) => {
    // 1. Authenticate with password
    const user = await authenticateUser(email, password)

    // 2. Check if 2FA is enabled
    const status = await fetch(`/api/auth/2fa/status?userId=${user.id}`)
    const { isEnabled } = await status.json()

    if (isEnabled) {
      // 3. Check if device is trusted
      const deviceId = getCurrentDeviceFingerprint()
      const trust = await fetch(
        `/api/auth/2fa/trusted-devices?userId=${user.id}&deviceId=${deviceId}&action=check`
      )
      const { isTrusted } = await trust.json()

      if (!isTrusted) {
        // Show 2FA verification
        setUserId(user.id)
        setNeeds2FA(true)
        return
      }
    }

    // Complete login
    completeLogin(user)
  }

  return (
    <>
      {/* Your login form */}
      <LoginForm onSubmit={handleLogin} />

      {/* 2FA Verification Modal */}
      <TwoFactorVerify
        open={needs2FA}
        userId={userId}
        onVerified={(rememberDevice) => {
          setNeeds2FA(false)
          completeLogin()
        }}
        onCancel={() => {
          setNeeds2FA(false)
          // Return to login
        }}
      />
    </>
  )
}
```

### 3. Use the Hook (Advanced)

```tsx
import { use2FA } from '@/hooks/use-2fa'

function MyComponent() {
  const {
    status,           // 2FA status object
    loading,          // Loading state
    isEnabled,        // Quick check if enabled
    startSetup,       // Initialize setup
    verifyAndEnable,  // Verify and enable
    disable,          // Disable 2FA
    regenerateBackupCodes,
    removeTrustedDevice,
  } = use2FA()

  // Auto-loads status on mount
  if (loading) return <Loader />

  return (
    <div>
      {isEnabled ? (
        <button onClick={() => disable('password')}>Disable 2FA</button>
      ) : (
        <button onClick={startSetup}>Enable 2FA</button>
      )}
    </div>
  )
}
```

## 📱 User Flow

### Enabling 2FA

1. User clicks "Enable 2FA" in settings
2. Setup wizard opens (5 steps):
   - **Intro**: Learn about 2FA
   - **Scan**: Scan QR code with authenticator app
   - **Verify**: Enter 6-digit code to confirm
   - **Backup**: Save 10 recovery codes
   - **Complete**: Setup successful!

### Logging In with 2FA

1. Enter email and password
2. If 2FA enabled and device not trusted:
   - Enter 6-digit code from app
   - OR use backup code
   - Optional: "Remember this device for 30 days"
3. Successfully logged in

### Managing 2FA

**In Settings > Security:**
- View 2FA status
- See backup codes remaining
- Regenerate backup codes
- View trusted devices
- Remove trusted devices
- Disable 2FA

## 🔑 API Endpoints

### Check Status
```bash
GET /api/auth/2fa/status?userId={uuid}
```

### Start Setup
```bash
POST /api/auth/2fa/setup
Body: { userId, email }
```

### Verify & Enable
```bash
POST /api/auth/2fa/verify-setup
Body: { userId, secret, code, backupCodes }
```

### Verify Login
```bash
POST /api/auth/2fa/verify
Body: { userId, code, rememberDevice }
```

### Disable
```bash
POST /api/auth/2fa/disable
Body: { userId, password }
```

### Regenerate Codes
```bash
POST /api/auth/2fa/backup-codes
Body: { userId, password }
```

### List Devices
```bash
GET /api/auth/2fa/trusted-devices?userId={uuid}
```

### Remove Device
```bash
DELETE /api/auth/2fa/trusted-devices?id={uuid}
```

## 🔐 Security Features

✅ **TOTP-based** - Industry standard (RFC 6238)
✅ **Bcrypt-hashed backup codes** - Never stored in plain text
✅ **Device fingerprinting** - SHA-256 hashed
✅ **Time-based tokens** - 30-second validity
✅ **Password verification** - For critical operations
✅ **Audit logging** - Track all attempts

## 📚 Library Functions

### TOTP

```typescript
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  getRemainingSeconds
} from '@/lib/2fa/totp'

// Generate secret
const { secret, base32, otpauthUrl } = generateTOTPSecret({
  name: 'user@example.com',
  issuer: 'nchat'
})

// Generate QR code
const qrDataUrl = await generateQRCode(otpauthUrl)

// Verify code
const isValid = verifyTOTP('123456', secret)

// Countdown timer
const seconds = getRemainingSeconds() // 0-30
```

### Backup Codes

```typescript
import {
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  formatBackupCodesForDownload
} from '@/lib/2fa/backup-codes'

// Generate codes
const codes = generateBackupCodes(10) // ["XXXX-XXXX", ...]

// Hash for storage
const hash = await hashBackupCode('XXXX-XXXX')

// Verify
const isValid = await verifyBackupCode('XXXX-XXXX', hash)

// Format for download
const text = formatBackupCodesForDownload(codes, 'user@example.com')
```

### Device Fingerprinting

```typescript
import {
  getCurrentDeviceFingerprint,
  createDeviceRecord,
  getDeviceTrustExpiry
} from '@/lib/2fa/device-fingerprint'

// Get current device fingerprint
const deviceId = getCurrentDeviceFingerprint()

// Create full device record
const record = createDeviceRecord()
// { deviceId, deviceName, deviceType, deviceInfo }

// Get trust expiry (30 days)
const expiryDate = getDeviceTrustExpiry(30)
```

## 🎯 Common Tasks

### Add 2FA to Existing Login

```typescript
// In your login handler:
const user = await signIn(email, password)

// Check 2FA
const res = await fetch(`/api/auth/2fa/status?userId=${user.id}`)
const { data } = await res.json()

if (data.isEnabled) {
  // Show 2FA prompt
  setShow2FAModal(true)
} else {
  // Complete login
  router.push('/chat')
}
```

### Check Device Trust

```typescript
import { getCurrentDeviceFingerprint } from '@/lib/2fa/device-fingerprint'

const deviceId = getCurrentDeviceFingerprint()
const res = await fetch(
  `/api/auth/2fa/trusted-devices?userId=${userId}&deviceId=${deviceId}&action=check`
)
const { data } = await res.json()

if (data.isTrusted) {
  // Skip 2FA
}
```

### Generate and Store Backup Codes

```typescript
import { generateBackupCodes, hashBackupCode } from '@/lib/2fa/backup-codes'

const codes = generateBackupCodes(10)

const hashedCodes = await Promise.all(
  codes.map(async (code) => ({
    user_id: userId,
    code_hash: await hashBackupCode(code),
  }))
)

// Store in database
await insertBackupCodes(hashedCodes)

// Show codes to user (one time only!)
return codes
```

## 🐛 Troubleshooting

### "Invalid code" errors
- Check device time is accurate (TOTP is time-based)
- Code expires every 30 seconds
- Verify correct secret was scanned

### Device not remembered
- Check cookies/localStorage enabled
- Private browsing clears device trust
- Each browser is a separate device

### QR code won't scan
- Ensure good lighting and camera focus
- Try manual entry instead
- QR code should be 300x300px minimum

## 📱 Supported Apps

- Google Authenticator (iOS, Android)
- Authy (iOS, Android, Desktop)
- Microsoft Authenticator (iOS, Android)
- 1Password (All platforms)
- Bitwarden (All platforms)
- Any TOTP-compatible app

## 📖 Full Documentation

- **Complete Guide**: `/docs/2FA-Implementation.md`
- **Library Docs**: `/src/lib/2fa/README.md`
- **Completion Summary**: `/docs/2FA-COMPLETE.md`

## 🎉 That's It!

You now have production-ready 2FA in your app. All components, libraries, and API routes are ready to use.

**Questions?** Check the full documentation above.
