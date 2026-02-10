# E2EE Quick Reference

**Quick reference for developers integrating Signal Protocol E2EE**

---

## Installation

Already installed in `package.json`:

```bash
pnpm install
```

Dependencies:

- `@signalapp/libsignal-client` - Official Signal Protocol library
- `@noble/curves` - Elliptic curve cryptography
- `@noble/hashes` - Cryptographic hash functions

---

## Database Migration

Run migration to create E2EE tables:

```bash
cd .backend
nself exec postgres -- psql -U postgres -d nself_db -f /app/migrations/014_e2ee_system.sql
```

Tables created:

- `nchat_user_master_keys` - Master key info
- `nchat_identity_keys` - Device identity keys
- `nchat_signed_prekeys` - Signed prekeys (rotated weekly)
- `nchat_one_time_prekeys` - One-time prekeys (100 per device)
- `nchat_signal_sessions` - Session state
- `nchat_safety_numbers` - Safety numbers for verification
- `nchat_sender_keys` - Group message encryption
- `nchat_e2ee_audit_log` - Audit log

---

## Quick Start

### 1. Initialize E2EE

```typescript
import { useE2EE } from '@/hooks/use-e2ee';

function SetupE2EE() {
  const { initialize, getRecoveryCode } = useE2EE();

  const handleSetup = async (password: string) => {
    await initialize(password);
    const recoveryCode = getRecoveryCode();
    console.log('Save this recovery code:', recoveryCode);
  };

  return <button onClick={() => handleSetup('my-password')}>Enable E2EE</button>;
}
```

### 2. Encrypt Message

```typescript
import { useE2EE } from '@/hooks/use-e2ee'

const { encryptMessage } = useE2EE()

const encrypted = await encryptMessage('Hello, World!', 'recipient-user-id', 'recipient-device-id')

// Store encrypted in database
await insertMessage({
  content: '[Encrypted]',
  is_encrypted: true,
  encrypted_payload: Array.from(encrypted),
  sender_device_id: myDeviceId,
})
```

### 3. Decrypt Message

```typescript
const { decryptMessage } = useE2EE()

const plaintext = await decryptMessage(
  new Uint8Array(message.encrypted_payload),
  message.message_type,
  message.sender_user_id,
  message.sender_device_id
)
```

### 4. Show Safety Number

```tsx
import { SafetyNumberDisplay } from '@/components/e2ee/SafetyNumberDisplay'
;<SafetyNumberDisplay
  localUserId={currentUser.id}
  peerUserId={peer.id}
  peerDeviceId={peer.deviceId}
  peerName={peer.name}
  onVerified={() => console.log('Verified!')}
/>
```

---

## Common Patterns

### Check if E2EE is Enabled

```typescript
const { isInitialized } = useE2EE()

if (isInitialized) {
  // E2EE is enabled
}
```

### Check if Session Exists

```typescript
const { hasSession } = useE2EE()

const sessionExists = await hasSession(peerUserId, peerDeviceId)
```

### Show Encryption Status

```tsx
import { E2EEStatus } from '@/components/e2ee/E2EEStatus'
;<E2EEStatus isEncrypted={message.is_encrypted} isVerified={contact.is_verified} variant="badge" />
```

### Handle Decryption Errors

```typescript
try {
  const plaintext = await decryptMessage(...);
} catch (error) {
  console.error('Decryption failed:', error);
  // Show "[Encrypted message - decryption failed]"
}
```

---

## API Endpoints

### Initialize E2EE

```
POST /api/e2ee/initialize
Body: { password: string, deviceId?: string }
Response: { status, recoveryCode }
```

### Recover E2EE

```
POST /api/e2ee/recover
Body: { recoveryCode: string, deviceId?: string }
Response: { status }
```

### Generate Safety Number

```
POST /api/e2ee/safety-number
Body: { action: "generate", localUserId, peerUserId, peerDeviceId }
Response: { safetyNumber, formattedSafetyNumber, qrCodeData }
```

### Replenish Prekeys

```
POST /api/e2ee/keys/replenish
Body: { count: 50 }
Response: { success, count }
```

---

## GraphQL Queries

### Get Prekey Bundle

```graphql
query GetPreKeyBundle($userId: uuid!, $deviceId: String!) {
  nchat_prekey_bundles(
    where: { user_id: { _eq: $userId }, device_id: { _eq: $deviceId } }
    limit: 1
  ) {
    identity_key_public
    registration_id
    signed_prekey_id
    signed_prekey_public
    signed_prekey_signature
    one_time_prekey_id
    one_time_prekey_public
  }
}
```

### Get Signal Sessions

```graphql
query GetSignalSessions($deviceId: String!) {
  nchat_signal_sessions(where: { device_id: { _eq: $deviceId }, is_active: { _eq: true } }) {
    peer_user_id
    peer_device_id
    created_at
    last_message_sent_at
  }
}
```

### Save Message with E2EE

```graphql
mutation InsertEncryptedMessage(
  $channel_id: uuid!
  $content: String!
  $is_encrypted: Boolean!
  $encrypted_payload: bytea
  $sender_device_id: String
) {
  insert_nchat_messages_one(
    object: {
      channel_id: $channel_id
      content: $content
      is_encrypted: $is_encrypted
      encrypted_payload: $encrypted_payload
      sender_device_id: $sender_device_id
      encryption_version: 1
    }
  ) {
    id
    created_at
  }
}
```

---

## Message Integration Helper

```typescript
import {
  encryptMessageForSending,
  prepareMessageForStorage,
  extractMessageContent,
} from '@/lib/e2ee/message-encryption'

// Sending
const payload = await encryptMessageForSending(
  plaintext,
  { recipientUserId, isDirectMessage: true },
  apolloClient
)

const messageData = prepareMessageForStorage(payload)

// Receiving
const plaintext = await extractMessageContent(message, apolloClient)
```

---

## Security Checklist

- [ ] Initialize E2EE on first login
- [ ] Show recovery code to user (once)
- [ ] Encrypt DMs and private channels
- [ ] Display E2EE status in UI
- [ ] Allow users to verify safety numbers
- [ ] Auto-replenish one-time prekeys
- [ ] Rotate signed prekeys weekly
- [ ] Handle decryption errors gracefully
- [ ] Never log sensitive data
- [ ] Clear master key on logout

---

## Troubleshooting

| Error                | Solution                               |
| -------------------- | -------------------------------------- |
| E2EE not initialized | Call `initialize(password)`            |
| No prekey bundle     | Recipient must setup E2EE first        |
| Decryption failed    | Check session exists, verify device ID |
| Invalid password     | Use recovery code to recover           |
| Low prekey count     | Call `replenishOneTimePreKeys(50)`     |

---

## Testing

### Test E2EE Setup

```typescript
import { getE2EEManager } from '@/lib/e2ee'

const e2eeManager = getE2EEManager(apolloClient)

// Initialize
await e2eeManager.initialize('test-password')

// Get status
const status = e2eeManager.getStatus()
console.log(status) // { initialized: true, ... }

// Get recovery code
const recoveryCode = e2eeManager.getRecoveryCode()
console.log('Recovery code:', recoveryCode)
```

### Test Message Encryption

```typescript
// Encrypt
const result = await e2eeManager.encryptMessage(
  'Hello, World!',
  'recipient-user-id',
  'recipient-device-id'
)

console.log('Encrypted:', result.encryptedPayload)

// Decrypt
const plaintext = await e2eeManager.decryptMessage(
  result.encryptedPayload,
  result.type,
  'sender-user-id',
  'sender-device-id'
)

console.log('Decrypted:', plaintext) // "Hello, World!"
```

---

## Performance Tips

1. **Batch Decryption**: Decrypt multiple messages in parallel
2. **Cache Sessions**: Keep session objects in memory
3. **Lazy Load**: Only decrypt visible messages
4. **Use Materialized View**: Query `nchat_prekey_bundles` for fast lookups

---

## Code Examples

### Complete Message Send Flow

```typescript
import { useApolloClient } from '@apollo/client'
import { useE2EE } from '@/hooks/use-e2ee'
import { encryptMessageForSending, prepareMessageForStorage } from '@/lib/e2ee/message-encryption'

function useSendMessage(channelId: string, recipientUserId: string) {
  const apolloClient = useApolloClient()
  const { isInitialized } = useE2EE()

  const sendMessage = async (plaintext: string) => {
    // 1. Encrypt message
    const payload = await encryptMessageForSending(
      plaintext,
      { recipientUserId, isDirectMessage: true },
      apolloClient
    )

    // 2. Prepare for storage
    const messageData = prepareMessageForStorage(payload)

    // 3. Insert into database
    await apolloClient.mutate({
      mutation: INSERT_MESSAGE,
      variables: {
        channel_id: channelId,
        ...messageData,
      },
    })
  }

  return { sendMessage, isE2EEEnabled: isInitialized }
}
```

### Complete Message Display

```typescript
import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { extractMessageContent } from '@/lib/e2ee/message-encryption';

function MessageItem({ message }: { message: Message }) {
  const apolloClient = useApolloClient();
  const [content, setContent] = useState(message.content);

  useEffect(() => {
    const decrypt = async () => {
      if (message.is_encrypted) {
        const plaintext = await extractMessageContent(message, apolloClient);
        setContent(plaintext);
      }
    };

    decrypt();
  }, [message]);

  return (
    <div>
      <E2EEStatus isEncrypted={message.is_encrypted} variant="icon" />
      <p>{content}</p>
    </div>
  );
}
```

---

## Important Notes

⚠️ **Master Key**: Derived from password, never stored in plaintext
⚠️ **Recovery Code**: Only way to recover if password is lost
⚠️ **Session State**: Encrypted before storage in database
⚠️ **Private Keys**: All encrypted with master key
⚠️ **Server**: Cannot decrypt any messages (zero-knowledge)

---

**Last Updated**: 2026-01-30
**Version**: 0.4.0
