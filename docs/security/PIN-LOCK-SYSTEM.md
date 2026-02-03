# PIN Lock System Documentation

**Version:** v0.3.0
**Implementation Date:** 2026-01-30

---

## Overview

The PIN Lock system provides session security for nself-chat with client-side PIN verification, biometric authentication support, and automatic session locking based on user preferences.

### Key Features

- **4-6 Digit PIN Protection** - Client-side PIN with PBKDF2 hashing
- **Auto-lock Timeouts** - 5/15/30/60 minute inactivity timeouts
- **Lock on Background/Close** - Configurable lock triggers
- **Biometric Unlock** - WebAuthn-based fingerprint/face unlock
- **Failed Attempt Lockout** - 5 attempts = 30 minute lockout
- **Emergency Unlock** - Password-based PIN reset

---

## Architecture

### Security Model

```
Client-Side PIN Verification (LocalStorage)
├── PIN Hash (PBKDF2, 100k iterations)
├── Salt (Random, 128 bits)
└── Lock Settings

Server-Side Audit Trail (PostgreSQL)
├── PIN Attempts Log
├── Session Lock State
└── Biometric Credentials
```

**Why Client-Side?**

- Faster unlock (no network round-trip)
- Privacy (PIN never transmitted)
- Offline support
- Server still tracks attempts for security monitoring

---

## Database Schema

### Tables Created by Migration 012

#### `user_pin_settings`

```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- pin_hash (TEXT) -- PBKDF2 hash
- pin_salt (TEXT) -- Random salt
- lock_on_close (BOOLEAN)
- lock_on_background (BOOLEAN)
- lock_timeout_minutes (INTEGER: 0|5|15|30|60)
- biometric_enabled (BOOLEAN)
- biometric_credential_id (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- last_changed_at (TIMESTAMPTZ)
```

#### `user_pin_attempts`

```sql
- id (UUID, PK)
- user_id (UUID, FK)
- success (BOOLEAN)
- attempt_time (TIMESTAMPTZ)
- ip_address (INET)
- user_agent (TEXT)
- device/browser/os (TEXT)
- failure_reason (TEXT)
- location_* (TEXT) -- city, country, country_code
```

#### `user_sessions` (extended)

```sql
-- Added columns:
- locked_until (TIMESTAMPTZ)
- lock_reason (TEXT)
- failed_pin_attempts (INTEGER)
```

#### `user_biometric_credentials`

```sql
- id (UUID, PK)
- user_id (UUID, FK)
- credential_id (TEXT, WebAuthn credential)
- public_key (TEXT)
- counter (INTEGER)
- device_name (TEXT)
- credential_type (TEXT: fingerprint|face|other)
- created_at/last_used_at (TIMESTAMPTZ)
```

### Database Functions

- `check_pin_lockout(user_id)` - Returns lockout status
- `clear_expired_pin_lockouts()` - Cleanup function
- `record_pin_attempt(...)` - Logs attempt with device info
- `get_recent_failed_pin_attempts(user_id, minutes)` - Security monitoring

---

## File Structure

```
src/
├── lib/security/
│   ├── pin.ts                 # PIN hashing, verification, storage
│   ├── session.ts             # Session timeout, lock management
│   └── biometric.ts           # WebAuthn biometric support
├── components/security/
│   ├── PinSetup.tsx           # PIN setup wizard
│   ├── PinLock.tsx            # Lock screen overlay
│   ├── PinManage.tsx          # Settings management
│   └── PinLockWrapper.tsx     # Root wrapper component
├── hooks/
│   ├── use-pin-lock.ts        # PIN lock state hook
│   └── use-session-timeout.ts # Timeout monitoring hook
└── app/settings/security/pin-lock/
    └── page.tsx               # Settings page

.backend/migrations/
└── 012_pin_lock_security.sql  # Database migration
```

---

## Usage Guide

### 1. Enable PIN Lock in Root Layout

```tsx
// src/app/layout.tsx
import { PinLockWrapper } from '@/components/security/PinLockWrapper'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          <PinLockWrapper>{children}</PinLockWrapper>
        </Providers>
      </body>
    </html>
  )
}
```

### 2. Add PIN Lock Settings Page

```tsx
// src/app/settings/security/pin-lock/page.tsx
import { PinManage } from '@/components/security/PinManage'

export default function PinLockPage() {
  const { user } = useAuth()

  return <PinManage userId={user.id} userName={user.email} />
}
```

### 3. Use PIN Lock Hook

```tsx
import { usePinLock } from '@/hooks/use-pin-lock'

function MyComponent() {
  const { isLocked, hasPinSetup, lock, unlock, verifyAndUnlock, lockoutInfo } = usePinLock()

  // Manual lock
  const handleLock = () => lock('manual')

  // Verify PIN
  const handleUnlock = async (pin: string) => {
    const result = await verifyAndUnlock(pin)
    if (result.success) {
      console.log('Unlocked!')
    } else {
      console.error(result.error)
    }
  }

  return (
    <div>
      {isLocked ? 'Locked' : 'Unlocked'}
      {lockoutInfo.isLocked && <p>Locked for {lockoutInfo.remainingMinutes} minutes</p>}
    </div>
  )
}
```

### 4. Setup Biometric Authentication

```tsx
import { registerBiometric, verifyBiometric } from '@/lib/security/biometric'

// Register
const result = await registerBiometric(userId, userName)
if (result.success) {
  console.log('Biometric registered:', result.credential)
}

// Verify
const verification = await verifyBiometric()
if (verification.success) {
  console.log('Biometric verified!')
}
```

---

## Configuration Options

### Lock Timeout Options

```typescript
type LockTimeout = 0 | 5 | 15 | 30 | 60 // minutes

0  = Never auto-lock
5  = Lock after 5 minutes of inactivity
15 = Lock after 15 minutes (default)
30 = Lock after 30 minutes
60 = Lock after 1 hour
```

### Lock Triggers

```typescript
interface LockTriggers {
  lockOnClose: boolean // Lock when app closes
  lockOnBackground: boolean // Lock when app goes to background
  lockTimeout: LockTimeout // Inactivity timeout
}
```

### Failed Attempt Policy

```typescript
const LOCKOUT_POLICY = {
  maxAttempts: 5, // Failed attempts before lockout
  lookbackMinutes: 15, // Check attempts in last 15 min
  lockoutDuration: 30, // Lockout for 30 minutes
}
```

---

## Security Features

### 1. Client-Side PIN Security

- **PBKDF2-SHA256** with 100,000 iterations
- **128-bit random salt** per user
- **256-bit hash output**
- PIN never transmitted to server
- Constant-time comparison

### 2. Failed Attempt Protection

- Track last 15 minutes of attempts
- Lock after 5 failed attempts
- 30 minute lockout period
- Local and server-side tracking

### 3. Biometric Security

- WebAuthn standard (FIDO2)
- Platform authenticator only
- User verification required
- Per-device credentials
- Counter-based replay protection

### 4. Session Security

- Activity tracking
- Visibility monitoring
- Timeout enforcement
- Manual lock support
- Emergency unlock with password

---

## API Reference

### PIN Module (`src/lib/security/pin.ts`)

#### Validation

```typescript
isValidPinFormat(pin: string): boolean
getPinStrength(pin: string): { strength, message }
```

#### Cryptography

```typescript
generateSalt(): string
hashPin(pin: string, salt?: string): Promise<{ hash, salt }>
verifyPin(pin: string, hash: string, salt: string): Promise<boolean>
```

#### Storage

```typescript
storePinSettings(settings: PinSettings): void
loadPinSettings(): PinSettings | null
clearPinSettings(): void
hasPinConfigured(): boolean
```

#### Setup/Management

```typescript
setupPin(pin, confirmPin, options): Promise<PinSetupResult>
changePin(current, newPin, confirm): Promise<PinSetupResult>
updatePinSettings(updates): boolean
disablePin(currentPin): Promise<boolean>
```

#### Attempt Tracking

```typescript
recordLocalPinAttempt(success: boolean, reason?: string): void
getRecentFailedAttempts(minutes?: number): StoredAttempt[]
checkLocalLockout(): { isLocked, remainingMinutes, failedAttempts }
clearAttemptHistory(): void
```

### Session Module (`src/lib/security/session.ts`)

#### Activity Tracking

```typescript
updateLastActivity(): void
getLastActivityTime(): number
getTimeSinceLastActivity(): number
getMinutesSinceLastActivity(): number
getFormattedTimeSinceActivity(): string
```

#### Lock State

```typescript
getLockState(): LockState
lockSession(reason?: string): void
unlockSession(): void
isSessionLocked(): boolean
clearLockState(): void
```

#### Timeout Management

```typescript
checkSessionTimeout(): { hasTimedOut, minutesSinceActivity, timeoutMinutes }
checkAndLockIfNeeded(): boolean
setupAutoLockChecker(onLocked: () => void): () => void
```

#### App Lifecycle

```typescript
handleAppVisible(): { shouldLock, reason }
handleAppHidden(): void
handleAppClose(): void
setupVisibilityListener(onVisible, onHidden): () => void
setupBeforeUnloadListener(): () => void
setupActivityListeners(): () => void
```

### Biometric Module (`src/lib/security/biometric.ts`)

#### Availability

```typescript
isWebAuthnSupported(): boolean
isBiometricAvailable(): Promise<boolean>
getBiometricType(): Promise<string>
```

#### Registration

```typescript
registerBiometric(userId, userName, deviceName?): Promise<BiometricSetupResult>
```

#### Verification

```typescript
verifyBiometric(): Promise<BiometricVerifyResult>
```

#### Credential Management

```typescript
getStoredCredentials(): BiometricCredential[]
removeCredential(credentialId: string): boolean
clearAllCredentials(): void
hasRegisteredCredentials(): boolean
```

---

## Testing

### Manual Testing Checklist

- [ ] Setup PIN with 4-6 digits
- [ ] Verify PIN strength validation
- [ ] Test PIN unlock (correct PIN)
- [ ] Test PIN unlock (incorrect PIN)
- [ ] Test failed attempt lockout (5 attempts)
- [ ] Test timeout locking (5/15/30/60 min)
- [ ] Test lock on app close
- [ ] Test lock on app background
- [ ] Test biometric registration
- [ ] Test biometric unlock
- [ ] Test change PIN
- [ ] Test disable PIN
- [ ] Test emergency unlock (forgot PIN)
- [ ] Test multiple devices/browsers

### Unit Tests

```bash
# Test PIN hashing
npm test src/lib/security/pin.test.ts

# Test session management
npm test src/lib/security/session.test.ts

# Test biometric
npm test src/lib/security/biometric.test.ts
```

### E2E Tests

```bash
# Test PIN lock flow
npm run test:e2e -- pin-lock.spec.ts
```

---

## Migration Guide

### Running the Migration

```bash
# Development
cd .backend
nself exec postgres -- psql -U postgres -d nself_chat -f migrations/012_pin_lock_security.sql

# Production
# Use your database migration tool (Hasura, Flyway, etc.)
```

### Rollback

```sql
-- Rollback script
DROP TABLE IF EXISTS user_biometric_credentials CASCADE;
DROP TABLE IF EXISTS user_pin_attempts CASCADE;
DROP TABLE IF EXISTS user_pin_settings CASCADE;

ALTER TABLE user_sessions
  DROP COLUMN IF EXISTS locked_until,
  DROP COLUMN IF EXISTS lock_reason,
  DROP COLUMN IF EXISTS failed_pin_attempts;

DROP FUNCTION IF EXISTS check_pin_lockout(UUID);
DROP FUNCTION IF EXISTS clear_expired_pin_lockouts();
DROP FUNCTION IF EXISTS record_pin_attempt(UUID, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_recent_failed_pin_attempts(UUID, INTEGER);
```

---

## Troubleshooting

### Issue: PIN not persisting

**Solution:** Check localStorage quota and browser settings. PIN settings are stored in `localStorage`.

```javascript
// Check storage
console.log(localStorage.getItem('nself_chat_pin_settings'))
```

### Issue: Biometric not available

**Solution:** Verify WebAuthn support and HTTPS requirement.

```javascript
// Check support
console.log('WebAuthn:', window.PublicKeyCredential)
console.log('Secure context:', window.isSecureContext)
```

### Issue: Lockout not expiring

**Solution:** Clear expired lockouts or reset attempt history.

```javascript
// Clear lockout
import { clearAttemptHistory } from '@/lib/security/pin'
clearAttemptHistory()
```

### Issue: Session not auto-locking

**Solution:** Verify PIN is configured and timeout is set.

```javascript
// Debug session
import { getSessionDebugInfo } from '@/lib/security/session'
console.log(getSessionDebugInfo())
```

---

## Performance Considerations

### Client-Side Hashing

- PBKDF2 with 100k iterations takes ~50-100ms
- Acceptable for unlock UX
- Runs in background (non-blocking)

### Storage Impact

- PIN settings: ~500 bytes per user
- Biometric credentials: ~1KB per credential
- Attempt history: ~200 bytes per attempt (max 20 stored)

### Network Impact

- No network calls for PIN verification
- Optional server-side attempt logging
- Biometric uses local device APIs

---

## Future Enhancements

### Planned Features

- [ ] PIN recovery via email
- [ ] Multiple PINs (device-specific)
- [ ] Pattern lock option
- [ ] Custom lockout duration
- [ ] Whitelist trusted networks
- [ ] Session persistence across devices
- [ ] Admin force-unlock
- [ ] Audit log export

### Browser Support

| Browser       | PIN Lock | Biometric |
| ------------- | -------- | --------- |
| Chrome 90+    | ✅       | ✅        |
| Firefox 90+   | ✅       | ✅        |
| Safari 14+    | ✅       | ✅        |
| Edge 90+      | ✅       | ✅        |
| Mobile Safari | ✅       | ✅        |
| Mobile Chrome | ✅       | ✅        |

---

## Security Best Practices

### For Users

1. Use a strong PIN (not 1234 or 0000)
2. Enable biometric for convenience
3. Set appropriate timeout (15-30 min recommended)
4. Enable lock on background for sensitive data
5. Don't share your PIN
6. Change PIN periodically

### For Developers

1. Never log PINs or hashes
2. Use HTTPS in production
3. Monitor failed attempts
4. Implement rate limiting
5. Rotate salts on PIN change
6. Clear sensitive data on sign out
7. Test across devices/browsers

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/nself/nself-chat/issues
- Documentation: https://docs.nself.org
- Email: support@nself.org

---

## Changelog

### v0.3.0 (2026-01-30)

- Initial PIN lock implementation
- Client-side PBKDF2 hashing
- WebAuthn biometric support
- Failed attempt lockout
- Session timeout management
- Emergency unlock flow
