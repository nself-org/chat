# E2EE Quick Reference Guide

**Version**: v0.4.0
**Last Updated**: January 30, 2026

A quick reference for developers working with End-to-End Encryption in nChat.

---

## Quick Start

### 1. Enable E2EE in Config

```typescript
// src/config/app-config.ts
{
  features: {
    endToEndEncryption: true
  },
  encryption: {
    enabled: true,
    enforceForDirectMessages: true
  }
}
```

### 2. Initialize E2EE (User)

```typescript
import { useE2EEContext } from '@/contexts/e2ee-context';

function MyComponent() {
  const { initialize, getRecoveryCode } = useE2EEContext();

  const setupE2EE = async (password: string) => {
    await initialize(password);
    const code = getRecoveryCode();
    alert(`Save this: ${code}`);
  };

  return <button onClick={() => setupE2EE('mypassword')}>Setup E2EE</button>;
}
```

### 3. Send Encrypted Message

```typescript
import { encryptMessageForSending } from '@/lib/e2ee/message-encryption';
import { useApolloClient } from '@apollo/client';

const apolloClient = useApolloClient();

const payload = await encryptMessageForSending(
  'Hello, World!',
  {
    recipientUserId: 'user-123',
    recipientDeviceId: 'device-456',
    isDirectMessage: true,
  },
  apolloClient
);
```

### 4. Decrypt Message

```typescript
import { extractMessageContent } from '@/lib/e2ee/message-encryption';

const plaintext = await extractMessageContent(message, apolloClient);
```

---

## Common Operations

### Check E2EE Status

```typescript
const { status, isInitialized, isEnabled } = useE2EEContext();

console.log('Initialized:', isInitialized);
console.log('Device ID:', status.deviceId);
```

### Generate Safety Number

```typescript
const { generateSafetyNumber, formatSafetyNumber } = useE2EEContext();

const safetyNumber = await generateSafetyNumber(peerUserId, peerIdentityKey);
const formatted = formatSafetyNumber(safetyNumber);
// Output: "12345 67890 12345 67890 ..." (60 digits)
```

### Rotate Keys

```typescript
const { rotateSignedPreKey, replenishOneTimePreKeys } = useE2EEContext();

// Rotate signed prekey (weekly)
await rotateSignedPreKey();

// Replenish one-time prekeys (when low)
await replenishOneTimePreKeys(50);
```

### Recover E2EE

```typescript
const { recover } = useE2EEContext();

await recover('alpha-bravo-charlie-delta-...');
```

---

## Database Queries

### Fetch PreKey Bundle

```graphql
query GetPreKeyBundle($userId: uuid!, $deviceId: String!) {
  nchat_prekey_bundles(
    where: {
      user_id: { _eq: $userId }
      device_id: { _eq: $deviceId }
    }
    limit: 1
  ) {
    identity_key_public
    signed_prekey_public
    one_time_prekey_public
  }
}
```

### Check Session

```graphql
query GetSession($deviceId: String!, $peerUserId: uuid!, $peerDeviceId: String!) {
  nchat_signal_sessions(
    where: {
      device_id: { _eq: $deviceId }
      peer_user_id: { _eq: $peerUserId }
      peer_device_id: { _eq: $peerDeviceId }
      is_active: { _eq: true }
    }
  ) {
    session_state_encrypted
    is_initiator
  }
}
```

### Save Message

```graphql
mutation SendMessage($channelId: uuid!, $content: String!, $isEncrypted: Boolean!, $encryptedPayload: [Int!]) {
  insert_nchat_messages_one(
    object: {
      channel_id: $channelId
      content: $content
      is_encrypted: $isEncrypted
      encrypted_payload: $encryptedPayload
    }
  ) {
    id
  }
}
```

---

## React Components

### E2EE Setup UI

```typescript
import { E2EESetup } from '@/components/e2ee/E2EESetup';

<E2EESetup
  onComplete={() => console.log('Setup complete')}
  onCancel={() => console.log('Setup cancelled')}
/>
```

### E2EE Status Indicator

```typescript
import { E2EEStatus } from '@/components/e2ee/E2EEStatus';

<E2EEStatus
  isEncrypted={true}
  isVerified={false}
/>
```

### Safety Number Display

```typescript
import { SafetyNumberDisplay } from '@/components/e2ee/SafetyNumberDisplay';

<SafetyNumberDisplay
  peerUserId="user-123"
  peerName="Alice"
  peerIdentityKey={identityKey}
/>
```

---

## Error Handling

### Common Errors

```typescript
try {
  await initialize(password);
} catch (error) {
  if (error.message === 'Invalid password') {
    alert('Wrong password');
  } else if (error.message === 'E2EE not initialized') {
    alert('Please set up E2EE first');
  } else if (error.message === 'No prekey bundle available') {
    alert('Recipient has not enabled E2EE');
  }
}
```

### Error Recovery

```typescript
// If decryption fails, try re-establishing session
const { hasSession } = useE2EEContext();

if (!(await hasSession(peerUserId, peerDeviceId))) {
  // Send a new PreKey message to establish session
  await sendNewMessage();
}
```

---

## Configuration Options

```typescript
interface EncryptionConfig {
  enabled: boolean;                        // Enable/disable E2EE globally
  enforceForPrivateChannels: boolean;      // Force private channels to be encrypted
  enforceForDirectMessages: boolean;       // Force DMs to be encrypted
  allowUnencryptedPublicChannels: boolean; // Allow public channels unencrypted
  enableSafetyNumbers: boolean;            // Show safety number UI
  requireDeviceVerification: boolean;      // Require device verification
  automaticKeyRotation: boolean;           // Auto-rotate signed prekeys
  keyRotationDays: number;                 // Days between rotations (default: 7)
}
```

---

## Performance Tips

### 1. Cache Sessions

```typescript
// Sessions are automatically cached in memory
// No need to fetch from database every time
```

### 2. Batch Key Generation

```typescript
// Generate 100 one-time prekeys at once
await manager.replenishOneTimePreKeys(100);
```

### 3. Lazy Initialization

```typescript
// Only initialize E2EE when user needs it
// Don't initialize on app startup
```

---

## Security Best Practices

### DO ✅

- Store recovery code offline (paper, password manager)
- Verify safety numbers out-of-band (phone call, in person)
- Use strong password (12+ characters)
- Rotate keys regularly (automatic by default)
- Clear recovery code after saving (automatic)

### DON'T ❌

- Share recovery code via chat or email
- Skip safety number verification
- Use weak password (< 8 characters)
- Store master key in plaintext
- Disable key rotation without reason

---

## Debugging

### Enable Debug Mode

```bash
# .env.local
NEXT_PUBLIC_E2EE_DEBUG=true
```

### Check E2EE State

```typescript
// In browser console
const manager = getE2EEManager(apolloClient);
console.log(manager.getStatus());
```

### View Encrypted Message

```sql
-- In database
SELECT
  content,
  is_encrypted,
  array_length(encrypted_payload, 1) as payload_size
FROM nchat_messages
WHERE is_encrypted = true
ORDER BY created_at DESC
LIMIT 10;
```

### Check Key Inventory

```sql
-- One-time prekeys available
SELECT
  device_id,
  COUNT(*) as available_keys
FROM nchat_one_time_prekeys
WHERE is_consumed = false
GROUP BY device_id;
```

---

## API Endpoints

### Initialize E2EE

```bash
POST /api/e2ee/initialize
Content-Type: application/json

{
  "password": "mysecretpassword"
}

Response:
{
  "success": true,
  "deviceId": "abc123",
  "recoveryCode": "alpha-bravo-charlie-..."
}
```

### Recover E2EE

```bash
POST /api/e2ee/recover
Content-Type: application/json

{
  "recoveryCode": "alpha-bravo-charlie-..."
}

Response:
{
  "success": true,
  "deviceId": "abc123"
}
```

### Generate Safety Number

```bash
GET /api/e2ee/safety-number?peerUserId=user-123
Authorization: Bearer <token>

Response:
{
  "safetyNumber": "12345678901234567890...",
  "formatted": "12345 67890 12345 67890 ..."
}
```

---

## TypeScript Types

```typescript
// E2EE Status
interface E2EEStatus {
  initialized: boolean;
  masterKeyInitialized: boolean;
  deviceKeysGenerated: boolean;
  deviceId?: string;
}

// Encrypted Message Payload
interface EncryptedMessagePayload {
  isEncrypted: boolean;
  encryptedContent?: Uint8Array;
  messageType?: 'PreKey' | 'Normal';
  senderDeviceId?: string;
  plainContent?: string;
}

// Message Encryption Options
interface MessageEncryptionOptions {
  recipientUserId: string;
  recipientDeviceId?: string;
  channelId?: string;
  isDirectMessage: boolean;
}

// Safety Number Display Props
interface SafetyNumberDisplayProps {
  peerUserId: string;
  peerName: string;
  peerIdentityKey: Uint8Array;
  onVerify?: () => void;
}
```

---

## Constants

```typescript
// Crypto
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Key Management
const DEFAULT_ONE_TIME_PREKEYS = 100;
const MIN_ONE_TIME_PREKEYS = 20;
const SIGNED_PREKEY_ROTATION_DAYS = 7;

// Safety Number
const SAFETY_NUMBER_LENGTH = 60;
const SAFETY_NUMBER_VERSION = 1;
```

---

## Useful Links

- **Full Documentation**: `/docs/features/E2EE-Complete.md`
- **Integration Summary**: `/docs/E2EE-Integration-Summary.md`
- **Signal Protocol**: https://signal.org/docs/
- **libsignal GitHub**: https://github.com/signalapp/libsignal

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "E2EE not initialized" | Run `initialize(password)` |
| "Failed to decrypt" | Re-establish session |
| "No prekey bundle" | Ask recipient to enable E2EE |
| "Master key not found" | Use recovery code |
| "Out of prekeys" | Auto-replenished (wait) |

---

**For detailed information, see**: `/docs/features/E2EE-Complete.md`
