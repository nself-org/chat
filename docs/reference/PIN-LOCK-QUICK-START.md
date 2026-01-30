# PIN Lock Quick Start Guide

**Version:** v0.3.0

---

## 5-Minute Setup

### 1. Run Database Migration

```bash
cd .backend
nself exec postgres -- psql -U postgres -d nself_chat -f migrations/012_pin_lock_security.sql
```

### 2. Add PIN Lock to Your App

```tsx
// src/app/layout.tsx
import { PinLockWrapper } from '@/components/security/PinLockWrapper'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PinLockWrapper>
          {children}
        </PinLockWrapper>
      </body>
    </html>
  )
}
```

### 3. Add Settings Page

Settings page already created at:
```
/settings/security/pin-lock
```

### 4. Test It

```bash
npm run dev
# Navigate to: http://localhost:3000/settings/security/pin-lock
```

---

## Common Use Cases

### Check if PIN is Configured

```tsx
import { hasPinConfigured } from '@/lib/security/pin'

const hasPIN = hasPinConfigured()
```

### Use PIN Lock Hook

```tsx
import { usePinLock } from '@/hooks/use-pin-lock'

function MyComponent() {
  const { isLocked, lock, unlock } = usePinLock()

  return (
    <div>
      <p>Status: {isLocked ? 'Locked' : 'Unlocked'}</p>
      <button onClick={() => lock()}>Lock Now</button>
    </div>
  )
}
```

### Setup PIN Programmatically

```tsx
import { setupPin } from '@/lib/security/pin'

const result = await setupPin('123456', '123456', {
  lockTimeoutMinutes: 15,
  lockOnClose: true,
})

if (result.success) {
  console.log('PIN configured!')
}
```

### Verify PIN

```tsx
import { verifyPin, loadPinSettings } from '@/lib/security/pin'

const settings = loadPinSettings()
if (settings) {
  const isValid = await verifyPin('123456', settings.pinHash, settings.pinSalt)
}
```

### Use Biometric

```tsx
import { registerBiometric, verifyBiometric } from '@/lib/security/biometric'

// Register
const result = await registerBiometric(userId, userName)

// Verify
const verification = await verifyBiometric()
```

---

## Component Reference

### PinSetup

```tsx
import { PinSetup } from '@/components/security/PinSetup'

<PinSetup
  userId={user.id}
  userName={user.email}
  onComplete={(settings) => console.log('Setup complete', settings)}
  onCancel={() => console.log('Cancelled')}
/>
```

### PinLock

```tsx
import { PinLock } from '@/components/security/PinLock'

<PinLock
  onUnlock={() => console.log('Unlocked')}
  onForgotPin={() => console.log('Forgot PIN')}
/>
```

### PinManage

```tsx
import { PinManage } from '@/components/security/PinManage'

<PinManage
  userId={user.id}
  userName={user.email}
/>
```

---

## Troubleshooting

### PIN not persisting?

Check localStorage:
```js
localStorage.getItem('nself_chat_pin_settings')
```

### Biometric not working?

Check WebAuthn support:
```js
import { isBiometricAvailable } from '@/lib/security/biometric'
const available = await isBiometricAvailable()
```

### Session not locking?

Check timeout settings:
```js
import { getSessionDebugInfo } from '@/lib/security/session'
console.log(getSessionDebugInfo())
```

### Clear everything

```js
import { clearPinSettings, clearAttemptHistory } from '@/lib/security/pin'
import { clearLockState } from '@/lib/security/session'
import { clearAllCredentials } from '@/lib/security/biometric'

clearPinSettings()
clearAttemptHistory()
clearLockState()
clearAllCredentials()
```

---

## Configuration Options

### Lock Timeout

```typescript
0  // Never
5  // 5 minutes
15 // 15 minutes (default)
30 // 30 minutes
60 // 1 hour
```

### Lock Triggers

```typescript
{
  lockOnClose: boolean      // Lock when app closes
  lockOnBackground: boolean // Lock when app backgrounds
  lockTimeoutMinutes: 0|5|15|30|60
  biometricEnabled: boolean
}
```

---

## Testing

### Unit Tests

```bash
npm test src/lib/security/__tests__/pin.test.ts
```

### Manual Testing Checklist

- [ ] Setup PIN (4-6 digits)
- [ ] Unlock with PIN
- [ ] Failed attempt lockout (5 attempts)
- [ ] Timeout locking (15 min)
- [ ] Biometric registration
- [ ] Biometric unlock
- [ ] Change PIN
- [ ] Disable PIN

---

## API Quick Reference

### PIN Module

```typescript
import {
  setupPin,
  changePin,
  disablePin,
  verifyPin,
  hasPinConfigured,
  checkLocalLockout,
} from '@/lib/security/pin'
```

### Session Module

```typescript
import {
  lockSession,
  unlockSession,
  isSessionLocked,
  checkSessionTimeout,
} from '@/lib/security/session'
```

### Biometric Module

```typescript
import {
  registerBiometric,
  verifyBiometric,
  isBiometricAvailable,
} from '@/lib/security/biometric'
```

---

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Enable biometric for convenience
3. ✅ Set reasonable timeout (15-30 min)
4. ✅ Monitor failed attempts
5. ✅ Test across browsers
6. ✅ Clear sensitive data on sign out

---

## Support

- Full docs: `docs/PIN-LOCK-SYSTEM.md`
- Code: `src/lib/security/`, `src/components/security/`
- Tests: `src/lib/security/__tests__/`

**Ready to go!** 🚀
