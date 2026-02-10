# Two-Factor Authentication (2FA) Implementation

Complete production-ready 2FA implementation with TOTP support for nchat.

## Overview

This implementation provides a complete Two-Factor Authentication system using Time-based One-Time Passwords (TOTP). It supports authenticator apps like Google Authenticator, Authy, Microsoft Authenticator, and any other TOTP-compatible app.

## Features

### ✅ Core Features

- **TOTP-based authentication** using `speakeasy` library
- **QR code generation** for easy setup
- **Manual entry support** for devices that can't scan QR codes
- **Backup codes** (10 recovery codes) with bcrypt hashing
- **Remember device** functionality (30-day trust period)
- **Device fingerprinting** for trusted device management
- **Password verification** before critical operations

### ✅ User Experience

- **Multi-step setup wizard** with progress indication
- **Real-time code countdown** (30-second refresh)
- **Backup code management** (download, copy, print)
- **Trusted devices list** with expiry tracking
- **Activity logging** for security auditing

### ✅ Security Features

- **Bcrypt-hashed backup codes** (never stored in plain text)
- **Device fingerprinting** using browser/system info
- **Time-based tokens** with drift tolerance (±30 seconds)
- **One-time backup codes** (invalidated after use)
- **Password verification** for disable/regenerate operations
- **Audit trail** of 2FA attempts

## File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── TwoFactorSetup.tsx       # Complete setup wizard
│   │   ├── TwoFactorVerify.tsx      # Login verification modal
│   │   └── index.ts                 # Exports
│   └── settings/
│       └── TwoFactorSettings.tsx    # 2FA management UI
├── lib/
│   └── 2fa/
│       ├── totp.ts                  # TOTP utilities
│       ├── backup-codes.ts          # Backup code management
│       └── device-fingerprint.ts    # Device identification
├── hooks/
│   └── use-2fa.ts                   # React hook for 2FA
└── app/
    └── api/
        └── auth/
            └── 2fa/
                ├── setup/route.ts           # Initialize setup
                ├── verify-setup/route.ts    # Verify & enable
                ├── verify/route.ts          # Login verification
                ├── status/route.ts          # Get 2FA status
                ├── disable/route.ts         # Disable 2FA
                ├── backup-codes/route.ts    # Regenerate codes
                └── trusted-devices/route.ts # Manage devices
```

## Database Schema

### Tables

#### `nchat_user_2fa_settings`

```sql
- id: uuid (PK)
- user_id: uuid (FK, unique)
- secret: text (encrypted TOTP secret)
- is_enabled: boolean
- enabled_at: timestamp
- last_used_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

#### `nchat_user_backup_codes`

```sql
- id: uuid (PK)
- user_id: uuid (FK)
- code_hash: text (bcrypt hash)
- used_at: timestamp (null if unused)
- created_at: timestamp
```

#### `nchat_user_trusted_devices`

```sql
- id: uuid (PK)
- user_id: uuid (FK)
- device_id: text (SHA-256 fingerprint)
- device_name: text
- device_info: jsonb
- trusted_until: timestamp
- last_used_at: timestamp
- created_at: timestamp
```

#### `nchat_2fa_verification_attempts`

```sql
- id: uuid (PK)
- user_id: uuid (FK)
- ip_address: text
- user_agent: text
- success: boolean
- attempt_type: text (totp | backup_code)
- created_at: timestamp
```

## Setup Flow

### 1. Initialize Setup

```typescript
const response = await fetch('/api/auth/2fa/setup', {
  method: 'POST',
  body: JSON.stringify({ userId, email })
})

// Returns:
{
  secret: "base32-encoded-secret",
  qrCodeDataUrl: "data:image/png;base64,...",
  otpauthUrl: "otpauth://totp/...",
  backupCodes: ["XXXX-XXXX", ...],
  manualEntryCode: "XXXX XXXX XXXX XXXX"
}
```

### 2. User Scans QR Code

- Open authenticator app
- Scan QR code OR manually enter secret
- App generates 6-digit codes every 30 seconds

### 3. Verify Code

```typescript
const response = await fetch('/api/auth/2fa/verify-setup', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    secret,
    code: "123456",
    backupCodes: ["XXXX-XXXX", ...]
  })
})

// Enables 2FA and stores hashed backup codes
```

### 4. Save Backup Codes

- User downloads or copies backup codes
- Each code can only be used once
- Codes are bcrypt-hashed in database

## Login Flow

### 1. Check 2FA Status

```typescript
const response = await fetch(`/api/auth/2fa/status?userId=${userId}`)

if (response.data.isEnabled) {
  // Show 2FA verification
}
```

### 2. Check Device Trust

```typescript
const deviceId = getCurrentDeviceFingerprint()
const response = await fetch(
  `/api/auth/2fa/trusted-devices?userId=${userId}&deviceId=${deviceId}&action=check`
)

if (response.data.isTrusted) {
  // Skip 2FA verification
} else {
  // Require 2FA code
}
```

### 3. Verify Code

```typescript
const response = await fetch('/api/auth/2fa/verify', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    code: '123456', // or backup code
    rememberDevice: true, // optional
  }),
})
```

## Component Usage

### Setup Component

```tsx
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup'

function MyComponent() {
  const [showSetup, setShowSetup] = useState(false)
  const { user } = useAuth()

  return (
    <>
      <button onClick={() => setShowSetup(true)}>Enable 2FA</button>

      <TwoFactorSetup
        open={showSetup}
        onComplete={() => {
          setShowSetup(false)
          // Reload 2FA status
        }}
        onCancel={() => setShowSetup(false)}
        userId={user.id}
        email={user.email}
      />
    </>
  )
}
```

### Verify Component

```tsx
import { TwoFactorVerify } from '@/components/auth/TwoFactorVerify'

function LoginPage() {
  const [show2FA, setShow2FA] = useState(false)
  const [userId, setUserId] = useState('')

  const handleLogin = async (email, password) => {
    // ... authenticate user
    // If 2FA is enabled:
    setUserId(user.id)
    setShow2FA(true)
  }

  return (
    <>
      {/* Login form */}

      <TwoFactorVerify
        open={show2FA}
        onVerified={(rememberDevice) => {
          // Complete login
          router.push('/chat')
        }}
        onCancel={() => setShow2FA(false)}
        userId={userId}
      />
    </>
  )
}
```

### Settings Component

```tsx
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings'

function SecuritySettings() {
  return (
    <div>
      <h1>Security Settings</h1>
      <TwoFactorSettings />
    </div>
  )
}
```

### Using the Hook

```tsx
import { use2FA } from '@/hooks/use-2fa'

function MyComponent() {
  const {
    status,
    loading,
    isEnabled,
    initializeSetup,
    verifyAndEnable,
    disable,
    regenerateBackupCodes,
    listTrustedDevices,
  } = use2FA()

  if (loading) return <Loader />

  return (
    <div>
      <p>2FA Status: {isEnabled ? 'Enabled' : 'Disabled'}</p>
      {status && (
        <>
          <p>Backup Codes: {status.backupCodes.unused} remaining</p>
          <p>Trusted Devices: {status.trustedDevices.length}</p>
        </>
      )}
    </div>
  )
}
```

## API Reference

### POST `/api/auth/2fa/setup`

Initialize 2FA setup - generates secret and QR code

**Request:**

```json
{
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "secret": "base32-secret",
    "qrCodeDataUrl": "data:image/png;base64,...",
    "otpauthUrl": "otpauth://totp/...",
    "backupCodes": ["XXXX-XXXX", ...],
    "manualEntryCode": "XXXX XXXX XXXX"
  }
}
```

### POST `/api/auth/2fa/verify-setup`

Verify code and enable 2FA

**Request:**

```json
{
  "userId": "uuid",
  "secret": "base32-secret",
  "code": "123456",
  "backupCodes": ["XXXX-XXXX", ...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

### POST `/api/auth/2fa/verify`

Verify 2FA code during login

**Request:**

```json
{
  "userId": "uuid",
  "code": "123456",
  "rememberDevice": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Verification successful",
  "usedBackupCode": false
}
```

### GET `/api/auth/2fa/status?userId=uuid`

Get 2FA status for user

**Response:**

```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "enabledAt": "2026-02-01T10:00:00Z",
    "lastUsedAt": "2026-02-01T12:00:00Z",
    "backupCodes": {
      "total": 10,
      "unused": 8,
      "used": 2
    },
    "trustedDevices": [...]
  }
}
```

### POST `/api/auth/2fa/disable`

Disable 2FA (requires password)

**Request:**

```json
{
  "userId": "uuid",
  "password": "user-password"
}
```

### POST `/api/auth/2fa/backup-codes`

Regenerate backup codes (requires password)

**Request:**

```json
{
  "userId": "uuid",
  "password": "user-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "codes": ["XXXX-XXXX", ...]
  }
}
```

### GET `/api/auth/2fa/trusted-devices?userId=uuid`

List trusted devices

**Response:**

```json
{
  "success": true,
  "data": {
    "devices": [...],
    "total": 3
  }
}
```

### DELETE `/api/auth/2fa/trusted-devices?id=uuid`

Remove trusted device

## Supported Authenticator Apps

- ✅ Google Authenticator (iOS, Android)
- ✅ Authy (iOS, Android, Desktop)
- ✅ Microsoft Authenticator (iOS, Android)
- ✅ 1Password (password manager with TOTP)
- ✅ Bitwarden (password manager with TOTP)
- ✅ LastPass Authenticator
- ✅ Any TOTP-compatible app

## Security Considerations

### Strengths

1. **Industry-standard TOTP** - Uses RFC 6238 time-based algorithm
2. **Secure secret generation** - 32-byte entropy (256 bits)
3. **Bcrypt-hashed backups** - Backup codes never stored in plain text
4. **Device fingerprinting** - Multiple signals for device identification
5. **Time drift tolerance** - ±30 second window for clock differences
6. **Audit logging** - All attempts logged with IP and user agent

### Best Practices

1. **Always require password** for disable/regenerate operations
2. **Enforce backup code limits** - Warn when < 3 codes remain
3. **Expire trusted devices** - 30-day maximum trust period
4. **Monitor failed attempts** - Alert on repeated failures
5. **Secure QR transmission** - Only show during setup, never logged
6. **Rate limiting** - Prevent brute force attacks

### Known Limitations

1. **Device fingerprinting** is not foolproof (can be spoofed)
2. **QR code** must be transmitted securely (HTTPS only)
3. **Backup codes** - Users may lose them
4. **Time sync** - User devices must have accurate clocks

## Testing

### Test User Accounts (Dev Mode)

When `NEXT_PUBLIC_USE_DEV_AUTH=true`, you can test with:

```typescript
// owner@nself.org - Has 2FA enabled
// admin@nself.org - No 2FA
// member@nself.org - No 2FA
```

### Manual Testing Checklist

#### Setup Flow

- [ ] Open setup wizard
- [ ] Generate QR code and secret
- [ ] Scan QR code with authenticator app
- [ ] Verify 6-digit code
- [ ] Save backup codes (download/copy)
- [ ] Confirm setup completion

#### Login Flow

- [ ] Sign in with 2FA-enabled account
- [ ] See 2FA verification prompt
- [ ] Enter correct code (success)
- [ ] Enter incorrect code (failure)
- [ ] Use backup code (success, code invalidated)
- [ ] Remember device (skip 2FA on next login)

#### Management

- [ ] View 2FA status
- [ ] View backup codes remaining
- [ ] Regenerate backup codes
- [ ] View trusted devices list
- [ ] Remove trusted device
- [ ] Disable 2FA

### Integration Testing

```typescript
describe('2FA Flow', () => {
  it('should complete setup', async () => {
    // Initialize setup
    const setup = await fetch('/api/auth/2fa/setup', {...})
    expect(setup.data.secret).toBeDefined()

    // Generate valid code
    const code = generateTOTPToken(setup.data.secret)

    // Verify and enable
    const verify = await fetch('/api/auth/2fa/verify-setup', {
      body: { code, secret: setup.data.secret, ... }
    })
    expect(verify.success).toBe(true)
  })

  it('should verify login with TOTP', async () => {
    const code = generateTOTPToken(userSecret)
    const verify = await fetch('/api/auth/2fa/verify', {
      body: { code, userId, rememberDevice: false }
    })
    expect(verify.success).toBe(true)
  })

  it('should verify login with backup code', async () => {
    const verify = await fetch('/api/auth/2fa/verify', {
      body: { code: 'XXXX-XXXX', userId, rememberDevice: false }
    })
    expect(verify.success).toBe(true)
    expect(verify.usedBackupCode).toBe(true)
  })
})
```

## Troubleshooting

### "Invalid verification code" errors

- **Clock sync issue**: Ensure device time is accurate
- **Wrong secret**: Verify QR code was scanned correctly
- **Code expired**: TOTP codes change every 30 seconds

### Backup codes not working

- **Already used**: Each code is single-use
- **Wrong format**: Codes are 8 characters (XXXX-XXXX)
- **Case sensitive**: Codes are uppercase

### Device not remembered

- **Cookies disabled**: Trust requires cookies/localStorage
- **Private browsing**: Trust data not persisted
- **Different browser**: Each browser is a different device

### QR code not scanning

- **Camera permissions**: Check app has camera access
- **Display quality**: Ensure QR code is sharp and clear
- **Use manual entry**: Fall back to typing secret key

## Migration Guide

### From No 2FA to 2FA

1. **Database migration**: Create 2FA tables
2. **Add UI components**: Setup wizard, verify modal
3. **Update login flow**: Check 2FA status, prompt for code
4. **Configure settings**: Add 2FA section to security settings

### From Different 2FA System

1. **Export user data**: Get list of users with 2FA enabled
2. **Disable old 2FA**: For each user
3. **Send re-setup emails**: Prompt users to re-enable
4. **Grace period**: Allow both systems temporarily

## Performance Considerations

- **QR generation**: ~50ms (cached on setup)
- **TOTP verification**: <1ms (no network calls)
- **Backup code verification**: ~100ms (bcrypt compare)
- **Device fingerprint**: ~10ms (client-side only)

## Future Enhancements

- [ ] WebAuthn/FIDO2 support (hardware keys)
- [ ] SMS-based 2FA (lower security, higher convenience)
- [ ] Email-based 2FA codes
- [ ] Biometric authentication
- [ ] Risk-based authentication (adaptive 2FA)
- [ ] Account recovery flow without backup codes
- [ ] Admin force-enable 2FA for all users
- [ ] 2FA grace period for new users

## License

This implementation is part of the nchat project. See main project LICENSE.

## Credits

Built using:

- `speakeasy` - TOTP implementation
- `qrcode` - QR code generation
- `bcryptjs` - Password/backup code hashing
- Radix UI - Component primitives
- Next.js 15 - App framework
