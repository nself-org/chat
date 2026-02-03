# nChat E2EE Threat Model and Security Guarantees

**Project**: nself-chat (nchat)
**Version**: v0.9.1
**Last Updated**: February 3, 2026
**Status**: Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Security Architecture](#security-architecture)
3. [Cryptographic Guarantees](#cryptographic-guarantees)
4. [Threat Scenarios](#threat-scenarios)
5. [Attack Surface Analysis](#attack-surface-analysis)
6. [Risk Mitigation](#risk-mitigation)
7. [Limitations and Assumptions](#limitations-and-assumptions)
8. [Security Verification](#security-verification)
9. [Incident Response](#incident-response)

---

## Executive Summary

nChat implements Signal Protocol-grade end-to-end encryption (E2EE) to protect user communications from unauthorized access. This document outlines the security guarantees provided, threat scenarios considered, and limitations of the system.

### Security Properties

| Property            | Status      | Mechanism                      |
| ------------------- | ----------- | ------------------------------ |
| **Confidentiality** | ✅ Strong   | AES-256-GCM + Signal Protocol  |
| **Forward Secrecy** | ✅ Strong   | X3DH + Double Ratchet          |
| **Future Secrecy**  | ✅ Strong   | DH ratchet healing             |
| **Deniability**     | ✅ Moderate | Symmetric encryption           |
| **Authentication**  | ✅ Strong   | Safety numbers + identity keys |
| **Integrity**       | ✅ Strong   | AEAD + MAC                     |

### Threat Model Classification

- **Honest-but-Curious Server**: ✅ Protected
- **Compromised Server**: ✅ Protected (messages)
- **Network Eavesdropper**: ✅ Protected
- **Malicious Client**: ⚠️ Partially Protected
- **Endpoint Compromise**: ❌ Not Protected

---

## Security Architecture

### 1. Encryption Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│  (Plaintext messages, user data)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Signal Protocol Layer                        │
│  • X3DH Key Exchange                                            │
│  • Double Ratchet Encryption                                    │
│  • Message Authentication (HMAC)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Device Lock Layer (Optional)                  │
│  • PIN/Biometric Authentication                                 │
│  • Session Management                                           │
│  • Wipe on Failed Attempts                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Transport Layer (TLS)                       │
│  • TLS 1.3                                                      │
│  • Certificate Pinning                                          │
│  • HSTS Enforced                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Key Hierarchy

```
User Password
    │
    ├─► PBKDF2 (100k iterations) ──► Master Key (256-bit)
    │                                     │
    │                                     ├─► Encrypts Identity Private Key
    │                                     ├─► Encrypts Signed PreKey Private Key
    │                                     └─► Encrypts One-Time PreKey Private Keys
    │
    └─► Recovery Code (12-word mnemonic)
            │
            └─► Encrypts Master Key Backup

Identity Key Pair (long-term)
    ├─► Signs Signed PreKeys
    └─► Used in X3DH

Signed PreKey Pair (rotated weekly)
    └─► Used in X3DH

One-Time PreKeys (consumed once)
    └─► Used in X3DH (perfect forward secrecy)

Session Keys (per conversation)
    ├─► Root Key (DH ratchet)
    ├─► Chain Keys (symmetric ratchet)
    └─► Message Keys (unique per message)
```

---

## Cryptographic Guarantees

### 1. Message Confidentiality

**Guarantee**: Messages are encrypted end-to-end. Only the intended recipient can decrypt them.

**Mechanism**:

- Signal Protocol with Double Ratchet algorithm
- AES-256-GCM for message encryption
- Unique message key per message (derived from chain key)

**Verification**:

```typescript
// Server CANNOT decrypt
const encryptedPayload = await encryptMessage(plaintext, recipientUserId)
// Server stores: encryptedPayload (binary blob)
// Server CANNOT derive: message key, chain key, or root key
```

### 2. Forward Secrecy

**Guarantee**: Compromise of current keys does NOT compromise past messages.

**Mechanism**:

- X3DH uses ephemeral keys
- One-time prekeys are consumed after use
- Chain keys are deleted after use
- Message keys are deleted immediately after decryption

**Verification**:

```typescript
// After message is decrypted, message key is deleted
await decryptMessage(encryptedPayload)
// Message key is now permanently deleted
// Even if device is compromised now, past messages remain secure
```

### 3. Future Secrecy (Healing)

**Guarantee**: Compromise of keys can be recovered from via DH ratchet.

**Mechanism**:

- Each message response triggers a DH ratchet step
- New DH key pair generated on each ratchet
- Forward secrecy is restored after one round trip

**Verification**:

```typescript
// Alice's keys compromised at T0
// At T1, Alice sends message to Bob (no compromise)
// At T2, Bob replies (DH ratchet occurs)
// At T3, new keys in place - compromise healed
```

### 4. Deniability

**Guarantee**: No cryptographic proof of who sent a message.

**Mechanism**:

- Symmetric encryption (both parties can compute message keys)
- No digital signatures on messages
- Safety number verification is separate

**Limitation**: Server metadata (timestamps, sender IP) may provide evidence.

### 5. Authentication

**Guarantee**: Users can verify they are communicating with the intended party.

**Mechanism**:

- Safety numbers (60-digit fingerprints)
- Out-of-band verification (QR codes, manual comparison)
- Key change notifications

**Verification**:

```typescript
// Generate safety number from identity keys
const safetyNumber = generateSafetyNumber(
  localIdentityKey,
  localUserId,
  remoteIdentityKey,
  remoteUserId
)
// Display to both users for comparison
// 12345 67890 12345 67890 12345 67890 12345 67890 12345 67890 12345 67890
```

### 6. Integrity

**Guarantee**: Messages cannot be tampered with without detection.

**Mechanism**:

- AES-256-GCM provides authenticated encryption
- HMAC on all protocol messages
- Any tampering causes decryption failure

**Verification**:

```typescript
// Attacker modifies ciphertext
const tamperedCiphertext = modifyBit(ciphertext)

// Decryption fails with authentication error
await expect(decryptMessage(tamperedCiphertext)).rejects.toThrow('Authentication failed')
```

---

## Threat Scenarios

### Scenario 1: Passive Network Eavesdropper

**Attacker Capability**: Can observe all network traffic

**Attack Goals**:

- Read message content
- Identify communicating parties
- Determine message metadata

**Defense**:

- ✅ **Message Content**: Protected by E2EE + TLS
- ⚠️ **Communicating Parties**: Metadata visible to server
- ⚠️ **Message Metadata**: Timing and size patterns visible

**Residual Risk**: LOW (metadata only)

### Scenario 2: Active Network Attacker

**Attacker Capability**: Can modify, drop, or inject network packets

**Attack Goals**:

- Modify message content
- Impersonate users
- Perform man-in-the-middle attack

**Defense**:

- ✅ **Message Modification**: Detected by AEAD authentication
- ✅ **Impersonation**: Prevented by identity keys
- ⚠️ **MITM**: Requires out-of-band safety number verification

**Residual Risk**: LOW (requires safety number verification)

### Scenario 3: Compromised Server

**Attacker Capability**: Full control of server infrastructure

**Attack Goals**:

- Read stored messages
- Impersonate users
- Perform targeted attacks

**Defense**:

- ✅ **Stored Messages**: Encrypted, server has no keys
- ⚠️ **Impersonation**: Server can attempt MITM (requires safety number verification)
- ⚠️ **Targeted Attacks**: Server can deny service, not decrypt

**Residual Risk**: MODERATE (service denial, metadata exposure)

### Scenario 4: Malicious Client

**Attacker Capability**: Modified client application

**Attack Goals**:

- Read other users' messages
- Forge messages
- Bypass E2EE

**Defense**:

- ✅ **Read Others' Messages**: Prevented by lack of private keys
- ✅ **Forge Messages**: Prevented by authentication
- ❌ **Bypass E2EE**: Attacker controls their own client

**Residual Risk**: HIGH for malicious user's conversations

### Scenario 5: Endpoint Compromise

**Attacker Capability**: Malware on user's device

**Attack Goals**:

- Extract encryption keys
- Read plaintext messages
- Keylogging

**Defense**:

- ⚠️ **Key Extraction**: Device lock delays access
- ⚠️ **Plaintext Messages**: Visible before encryption
- ❌ **Keylogging**: Out of scope

**Residual Risk**: CRITICAL (full compromise)

### Scenario 6: Physical Device Access

**Attacker Capability**: Physical access to unlocked device

**Attack Goals**:

- Read messages
- Impersonate user
- Extract keys

**Defense**:

- ✅ **Device Lock**: PIN/biometric required
- ✅ **Auto-wipe**: After failed attempts
- ✅ **Session Timeout**: Automatic lock after inactivity

**Residual Risk**: LOW (with device lock enabled)

### Scenario 7: Database Breach

**Attacker Capability**: Access to database dump

**Attack Goals**:

- Decrypt stored messages
- Extract user keys
- Identify relationships

**Defense**:

- ✅ **Message Decryption**: Impossible (no keys in database)
- ✅ **User Keys**: Private keys encrypted with master key
- ⚠️ **Relationships**: Metadata (user IDs, timestamps) visible

**Residual Risk**: LOW (metadata only)

### Scenario 8: Insider Threat

**Attacker Capability**: Privileged access to infrastructure

**Attack Goals**:

- Access user data
- Monitor communications
- Modify server behavior

**Defense**:

- ✅ **Access User Data**: E2EE prevents plaintext access
- ⚠️ **Monitor Communications**: Metadata visible
- ✅ **Modify Server**: Cannot break E2EE

**Residual Risk**: MODERATE (metadata, service denial)

---

## Attack Surface Analysis

### 1. Client-Side Attack Surface

| Component               | Risk Level | Mitigations                                           |
| ----------------------- | ---------- | ----------------------------------------------------- |
| Web Crypto API          | LOW        | Audited, standard implementation                      |
| Signal Protocol Library | LOW        | Official Signal library (@signalapp/libsignal-client) |
| Key Storage             | MEDIUM     | Encrypted with master key                             |
| Password Input          | MEDIUM     | No logging, cleared after use                         |
| Recovery Code           | HIGH       | Displayed once, user responsibility                   |
| Device Lock             | LOW        | Argon2 PIN hash, auto-wipe                            |

### 2. Server-Side Attack Surface

| Component         | Risk Level | Mitigations                       |
| ----------------- | ---------- | --------------------------------- |
| User Registration | MEDIUM     | Rate limiting, email verification |
| Key Distribution  | LOW        | Public keys only                  |
| Message Relay     | LOW        | Encrypted payloads only           |
| Database          | LOW        | Encrypted sensitive data, RLS     |
| API Endpoints     | MEDIUM     | Authentication, rate limiting     |
| Backup Storage    | HIGH       | Master key backup encrypted       |

### 3. Network Attack Surface

| Component              | Risk Level | Mitigations             |
| ---------------------- | ---------- | ----------------------- |
| TLS Configuration      | LOW        | TLS 1.3, modern ciphers |
| Certificate Validation | LOW        | Certificate pinning     |
| DNS                    | MEDIUM     | DNSSEC recommended      |
| CDN                    | MEDIUM     | SRI for static assets   |

---

## Risk Mitigation

### High-Priority Mitigations

1. **Safety Number Verification**
   - **Risk**: Man-in-the-middle attack
   - **Mitigation**: Out-of-band safety number verification
   - **Status**: ✅ Implemented

2. **Device Lock**
   - **Risk**: Physical device access
   - **Mitigation**: PIN/biometric + auto-wipe
   - **Status**: ✅ Implemented

3. **Key Rotation**
   - **Risk**: Long-term key compromise
   - **Mitigation**: Weekly signed prekey rotation
   - **Status**: ✅ Implemented

4. **Backup Security**
   - **Risk**: Recovery code theft
   - **Mitigation**: One-time display, encrypted backup
   - **Status**: ✅ Implemented

### Medium-Priority Mitigations

5. **Multi-Device Security**
   - **Risk**: Device linking attack
   - **Mitigation**: Verification code on primary device
   - **Status**: ✅ Implemented

6. **Session Security**
   - **Risk**: Session hijacking
   - **Mitigation**: Short-lived tokens, IP binding
   - **Status**: ⚠️ Partial

7. **Audit Logging**
   - **Risk**: Undetected attacks
   - **Mitigation**: Comprehensive audit logs
   - **Status**: ✅ Implemented

### Low-Priority Mitigations

8. **Perfect Forward Secrecy for Groups**
   - **Risk**: Group key compromise
   - **Mitigation**: Sender keys with rotation
   - **Status**: ⚠️ Partial

9. **Secure Deletion**
   - **Risk**: Deleted messages recovery
   - **Mitigation**: Secure wipe on deletion
   - **Status**: ❌ Not Implemented

---

## Limitations and Assumptions

### System Limitations

1. **Metadata Protection**: Limited
   - Server knows who communicated with whom
   - Server knows when messages were sent
   - Message sizes are visible
   - **Mitigation**: Use metadata-resistant protocols (future)

2. **Group Message Deniability**: Weaker
   - Group sender keys reduce deniability
   - **Mitigation**: Accept trade-off for efficiency

3. **Backup Security**: User-Dependent
   - Recovery code must be stored securely by user
   - **Mitigation**: Clear user education

4. **Screen Sharing/Screenshots**: Not Protected
   - Apps can capture screen content
   - **Mitigation**: OS-level screenshot blocking (limited)

### Security Assumptions

1. **Cryptographic Primitives**: Secure
   - Assumes AES-256, Curve25519, SHA-256 are secure
   - **Verification**: Industry-standard algorithms

2. **Signal Protocol**: Correct
   - Assumes Signal Protocol implementation is correct
   - **Verification**: Using official Signal library

3. **Platform Security**: Trustworthy
   - Assumes OS is not compromised
   - Assumes Web Crypto API is correctly implemented
   - **Mitigation**: Use hardware security when available

4. **User Behavior**: Reasonable
   - Users verify safety numbers with new contacts
   - Users protect recovery codes
   - Users enable device lock
   - **Mitigation**: Security education, secure defaults

---

## Security Verification

### Automated Testing

```bash
# Cryptographic test suite
pnpm test src/lib/e2ee/__tests__/crypto.test.ts

# E2EE integration tests
pnpm test src/lib/e2ee/__tests__/integration.test.ts

# Device lock tests
pnpm test src/lib/e2ee/device-lock/__tests__/
```

### Manual Verification

1. **Key Exchange Verification**

   ```bash
   # Create two users
   # Exchange messages
   # Verify safety numbers match
   # Verify server cannot decrypt
   ```

2. **Forward Secrecy Verification**

   ```bash
   # Send message
   # Extract session state
   # Delete session state
   # Verify message still decryptable
   # Send new message
   # Verify old session CANNOT decrypt new message
   ```

3. **Device Lock Verification**
   ```bash
   # Set PIN
   # Lock device
   # Enter wrong PIN 10 times
   # Verify data is wiped
   ```

### Security Audit

**Last Audit**: February 3, 2026
**Auditor**: Internal Security Team
**Scope**: Full E2EE implementation
**Findings**: 0 Critical, 2 Medium, 5 Low
**Status**: All findings addressed

**Recommended External Audit**: Annually by certified cryptography firm

---

## Incident Response

### E2EE Key Compromise

**Indicators**:

- Unexpected safety number changes
- Unable to decrypt messages
- Unauthorized device linked

**Response**:

1. Revoke compromised keys
2. Generate new identity keys
3. Re-establish sessions with all contacts
4. Notify affected users
5. Investigate compromise source

### Server Breach

**Indicators**:

- Unauthorized database access
- Suspicious server activity
- Data exfiltration detected

**Response**:

1. Isolate affected systems
2. Rotate server credentials
3. Audit database access logs
4. Notify users (no message content exposed)
5. Investigate breach vector

### Client Compromise

**Indicators**:

- Malware detected on user device
- Unusual message patterns
- Unauthorized access

**Response**:

1. Recommend device wipe
2. Generate new E2EE keys
3. Notify contacts of key change
4. Review recent messages
5. Enable device lock if not already enabled

---

## Security Contact

For security issues, please contact:

- **Email**: security@nself.org
- **PGP Key**: [Key Fingerprint]
- **Bug Bounty**: [Program URL]

**Response Time**: Within 24 hours for critical issues

---

## References

1. [Signal Protocol Specification](https://signal.org/docs/)
2. [The Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
3. [The X3DH Key Agreement Protocol](https://signal.org/docs/specifications/x3dh/)
4. [NIST Cryptographic Standards](https://csrc.nist.gov/)

---

**Document Version**: 1.0.0
**Last Updated**: February 3, 2026
**Classification**: Public
**Review Cycle**: Quarterly
