# nself-chat End-to-End Encryption Threat Model

**Version**: 1.0.0
**Date**: 2026-02-03
**Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Trust Boundaries](#trust-boundaries)
4. [Threat Actors](#threat-actors)
5. [Assets](#assets)
6. [Threats and Mitigations](#threats-and-mitigations)
7. [Attack Scenarios](#attack-scenarios)
8. [Security Guarantees](#security-guarantees)
9. [Limitations](#limitations)
10. [Incident Response](#incident-response)

---

## Executive Summary

nself-chat implements **Signal Protocol** end-to-end encryption (E2EE) to provide confidential, authenticated communication between users. This threat model documents the security boundaries, potential threats, and mitigation strategies employed to protect user communications.

### Key Security Features

- **Signal Protocol** implementation using `@signalapp/libsignal-client`
- **X3DH** (Extended Triple Diffie-Hellman) key exchange
- **Double Ratchet** algorithm for forward secrecy and break-in recovery
- **Hardware-backed key storage** using IndexedDB with encryption
- **Device lock policies** with PIN/biometric authentication
- **Remote wipe capabilities** for compromised devices
- **Safety number verification** for identity verification

---

## System Overview

### Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Devices                            │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │  Browser  │  │   Mobile  │  │  Desktop  │              │
│  │   (PWA)   │  │   (Cap.)  │  │ (Electron)│              │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘              │
└────────┼──────────────┼──────────────┼───────────────────────┘
         │              │              │
         │         E2EE Messages        │
         │    (Encrypted End-to-End)   │
         │              │              │
┌────────┼──────────────┼──────────────┼───────────────────────┐
│        │        Server Layer         │                       │
│  ┌─────▼──────────────▼──────────────▼─────┐                │
│  │     Hasura GraphQL + PostgreSQL         │                │
│  │  (Stores encrypted payloads only)       │                │
│  └──────────────────────────────────────────┘                │
│  ┌──────────────────────────────────────────┐                │
│  │     Nhost Auth (User Management)         │                │
│  └──────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘
```

### Cryptographic Components

| Component              | Algorithm/Protocol   | Purpose                         |
| ---------------------- | -------------------- | ------------------------------- |
| **Identity Keys**      | Curve25519           | Long-term device identity       |
| **Signed Prekeys**     | Curve25519 + Ed25519 | Medium-term keys with signature |
| **One-time Prekeys**   | Curve25519           | Perfect forward secrecy         |
| **Message Encryption** | AES-256-GCM          | Symmetric message encryption    |
| **Key Derivation**     | PBKDF2-SHA256        | Master key from password        |
| **Hash Functions**     | SHA-256, SHA-512     | Fingerprints and integrity      |
| **Random Generation**  | Web Crypto API       | Secure randomness               |

---

## Trust Boundaries

### Trusted Components

1. **User's Device** - Fully trusted
   - Browser environment (WebCrypto API)
   - Local storage (encrypted)
   - Device hardware (for biometrics)

2. **Signal Protocol Libraries** - Trusted
   - `@signalapp/libsignal-client` (official Signal library)
   - `@noble/hashes`, `@noble/curves` (audited crypto libraries)

3. **User-Controlled Keys** - Trusted
   - Master key derived from password
   - Device identity keys
   - Session keys

### Untrusted Components

1. **Server Infrastructure** - Untrusted for confidentiality
   - Can see metadata (who talks to whom, when)
   - Cannot see message content (encrypted)
   - Can perform DoS attacks
   - Can manipulate delivery timing

2. **Network Layer** - Untrusted
   - Can observe traffic patterns
   - Can perform man-in-the-middle attacks (mitigated by E2EE)
   - Can block or delay messages

3. **Third-Party Services** - Untrusted
   - Analytics providers (can track metadata)
   - CDN providers (can serve malicious code)
   - DNS providers (can redirect traffic)

### Trust Boundaries

```
┌─────────────────────────────────────────┐
│         TRUSTED ZONE                    │
│  ┌────────────────────────────────┐    │
│  │  User Device                   │    │
│  │  - Private Keys                │    │
│  │  - Master Key                  │    │
│  │  - Decrypted Messages          │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              ▲
              │ E2EE Channel
              │
┌─────────────┼───────────────────────────┐
│      UNTRUSTED ZONE                     │
│  ┌──────────▼──────────────────────┐   │
│  │  Server                          │   │
│  │  - Encrypted Messages            │   │
│  │  - Public Keys                   │   │
│  │  - Metadata                      │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## Threat Actors

### 1. Passive Attacker (Eavesdropper)

**Capabilities:**

- Observe network traffic
- Monitor server data
- Analyze metadata

**Mitigations:**

- End-to-end encryption (message content protected)
- TLS/HTTPS (network layer encryption)
- Metadata minimization

### 2. Active Network Attacker

**Capabilities:**

- Man-in-the-middle attacks
- Traffic injection
- Message tampering

**Mitigations:**

- Authenticated encryption (AES-GCM)
- Safety number verification
- Certificate pinning (optional)

### 3. Malicious Server

**Capabilities:**

- Serve malicious code updates
- Correlate metadata
- Selective message delivery
- DoS attacks

**Mitigations:**

- Subresource Integrity (SRI)
- Content Security Policy (CSP)
- Safety number verification
- Client-side validation

### 4. Compromised Device Attacker

**Capabilities:**

- Access to local storage
- Keyloggers
- Screen capture
- Memory dumping

**Mitigations:**

- Device lock (PIN/biometric)
- Encrypted storage
- Secure memory wiping
- Remote wipe capability

### 5. State-Level Attacker

**Capabilities:**

- All of the above
- Zero-day exploits
- Endpoint compromise
- Traffic analysis

**Mitigations:**

- Defense in depth
- Regular security updates
- Threat monitoring
- Incident response plan

---

## Assets

### Critical Assets

1. **Master Key**
   - **Description**: User's password-derived encryption key
   - **Storage**: Memory only (never persisted)
   - **Protection**: PBKDF2 derivation (100k iterations)

2. **Private Identity Key**
   - **Description**: Long-term device identity key
   - **Storage**: Encrypted in database with master key
   - **Protection**: AES-256-GCM encryption

3. **Session Keys**
   - **Description**: Ephemeral keys for message encryption
   - **Storage**: Encrypted IndexedDB
   - **Protection**: Derived via Double Ratchet

4. **Message Plaintext**
   - **Description**: Decrypted message content
   - **Storage**: Memory only (browser DOM)
   - **Protection**: Never persisted unencrypted

### High-Value Assets

5. **Signed Prekeys**
   - **Description**: Medium-term keys for key exchange
   - **Storage**: Encrypted in database
   - **Rotation**: Weekly

6. **One-Time Prekeys**
   - **Description**: Single-use keys for perfect forward secrecy
   - **Storage**: Encrypted in database
   - **Consumption**: Used once and discarded

7. **Recovery Code**
   - **Description**: Master key recovery mechanism
   - **Storage**: Session storage (temporary)
   - **Protection**: User must write down

### Medium-Value Assets

8. **Safety Numbers**
   - **Description**: Identity verification codes
   - **Storage**: Generated on-demand
   - **Protection**: Public information

9. **Metadata**
   - **Description**: Message timestamps, sender/recipient
   - **Storage**: Database (unencrypted)
   - **Protection**: Minimized collection

---

## Threats and Mitigations

### T1: Message Interception (STRIDE: Information Disclosure)

**Threat**: Attacker intercepts messages in transit

**Attack Vector**: Network sniffing, MITM attack

**Impact**: Loss of confidentiality

**Likelihood**: Medium

**Mitigations**:

1. Signal Protocol E2EE (implemented) ✅
2. TLS/HTTPS transport encryption (implemented) ✅
3. Certificate pinning (optional) 🔄

**Residual Risk**: Low

---

### T2: Key Compromise (STRIDE: Information Disclosure, Tampering)

**Threat**: Attacker gains access to private keys

**Attack Vector**: Device theft, malware, memory dump

**Impact**: Past/future message decryption

**Likelihood**: Low

**Mitigations**:

1. Forward secrecy via Double Ratchet (implemented) ✅
2. Device lock with PIN/biometric (implemented) ✅
3. Encrypted key storage (implemented) ✅
4. Remote wipe capability (implemented) ✅
5. Break-in recovery (Signal Protocol feature) ✅

**Residual Risk**: Low

---

### T3: Server Compromise (STRIDE: Tampering, Denial of Service)

**Threat**: Attacker compromises server infrastructure

**Attack Vector**: Server breach, insider threat

**Impact**: Metadata disclosure, DoS

**Likelihood**: Low

**Mitigations**:

1. E2EE (server cannot decrypt) ✅
2. Safety number verification ✅
3. Client-side key management ✅
4. Metadata minimization 🔄

**Residual Risk**: Medium (metadata still exposed)

---

### T4: Malicious Code Injection (STRIDE: Tampering, Elevation of Privilege)

**Threat**: Attacker serves malicious JavaScript

**Attack Vector**: Compromised CDN, XSS, supply chain attack

**Impact**: Full compromise of client security

**Likelihood**: Low

**Mitigations**:

1. Content Security Policy (implemented) ✅
2. Subresource Integrity (implemented) ✅
3. Code signing (planned) 🔄
4. Reproducible builds (planned) 🔄

**Residual Risk**: Medium

---

### T5: Identity Spoofing (STRIDE: Spoofing)

**Threat**: Attacker impersonates another user

**Attack Vector**: Key substitution, server manipulation

**Impact**: Loss of authenticity

**Likelihood**: Low

**Mitigations**:

1. Safety number verification (implemented) ✅
2. Signal Protocol identity keys ✅
3. Trust-on-first-use (TOFU) model ✅
4. Out-of-band verification (manual) ✅

**Residual Risk**: Low (with verification)

---

### T6: Replay Attacks (STRIDE: Tampering)

**Threat**: Attacker replays old messages

**Attack Vector**: Message capture and re-injection

**Impact**: Confusion, unauthorized actions

**Likelihood**: Low

**Mitigations**:

1. Double Ratchet nonces (implemented) ✅
2. Message counters (Signal Protocol) ✅
3. Timestamp validation 🔄

**Residual Risk**: Very Low

---

### T7: Denial of Service (STRIDE: Denial of Service)

**Threat**: Attacker prevents message delivery

**Attack Vector**: Server flood, network disruption

**Impact**: Loss of availability

**Likelihood**: Medium

**Mitigations**:

1. Rate limiting (implemented) ✅
2. Message queuing (implemented) ✅
3. Offline support 🔄

**Residual Risk**: Medium

---

### T8: Metadata Analysis (STRIDE: Information Disclosure)

**Threat**: Attacker analyzes communication patterns

**Attack Vector**: Traffic analysis, timing attacks

**Impact**: Social graph disclosure

**Likelihood**: High

**Mitigations**:

1. Metadata minimization 🔄
2. Sealed sender (planned) 🔄
3. Padding (planned) 🔄

**Residual Risk**: High

---

### T9: Endpoint Compromise (STRIDE: All)

**Threat**: Attacker compromises user device

**Attack Vector**: Malware, physical access, zero-day

**Impact**: Full compromise

**Likelihood**: Low

**Mitigations**:

1. Device lock (implemented) ✅
2. Remote wipe (implemented) ✅
3. Encrypted storage (implemented) ✅
4. Regular updates ✅

**Residual Risk**: Medium

---

## Attack Scenarios

### Scenario 1: Nation-State Surveillance

**Attacker**: State-level actor with server access

**Capabilities**:

- Full server access
- Traffic monitoring
- Endpoint targeting

**Attack Path**:

1. Compromise server infrastructure
2. Collect encrypted messages and metadata
3. Target high-value endpoints with zero-days
4. Decrypt targeted conversations

**Defense**:

- E2EE prevents mass decryption
- Safety number verification detects MITM
- Device lock limits endpoint compromise
- Regular updates patch vulnerabilities

**Outcome**: Metadata exposed, targeted content at risk

---

### Scenario 2: Corporate Espionage

**Attacker**: Insider with database access

**Capabilities**:

- Read database contents
- Manipulate message delivery

**Attack Path**:

1. Access database via compromised credentials
2. Export encrypted messages
3. Analyze metadata for target identification
4. Attempt offline attacks on keys

**Defense**:

- E2EE renders encrypted payloads useless
- Keys stored encrypted with user passwords
- Audit logging detects suspicious access
- RBAC limits database permissions

**Outcome**: Metadata compromised, content protected

---

### Scenario 3: Device Theft

**Attacker**: Thief with physical access

**Capabilities**:

- Full device access
- Storage extraction
- Memory analysis

**Attack Path**:

1. Steal unlocked device
2. Extract local storage and IndexedDB
3. Attempt to decrypt keys
4. Access messages in memory

**Defense**:

- Device auto-lock after inactivity
- Encrypted storage requires master key
- Remote wipe capability
- Keys never persisted in plaintext

**Outcome**: If device locked, minimal risk; if unlocked, current session compromised

---

### Scenario 4: Malicious Server Update

**Attacker**: Compromised CDN or server

**Capabilities**:

- Serve modified JavaScript
- Inject backdoor code

**Attack Path**:

1. Compromise deployment pipeline
2. Inject malicious code into build
3. Serve to users on next update
4. Exfiltrate keys via backdoor

**Defense**:

- Subresource Integrity (SRI) prevents modification
- Content Security Policy blocks exfiltration
- Code review process
- Reproducible builds (planned)

**Outcome**: SRI and CSP block attack; manual verification possible

---

## Security Guarantees

### What E2EE Protects

✅ **Message Confidentiality**: Server cannot read message content
✅ **Message Authenticity**: Recipient can verify sender identity
✅ **Forward Secrecy**: Past messages secure even if keys compromised
✅ **Break-in Recovery**: Future messages secure after key compromise
✅ **Deniability**: Plausible deniability for senders (Signal Protocol feature)

### What E2EE Does NOT Protect

❌ **Metadata**: Server sees who talks to whom, when
❌ **Endpoint Security**: Compromised device reveals all
❌ **Traffic Analysis**: Network observers see patterns
❌ **User Behavior**: Server logs activity
❌ **Group Size**: Number of participants visible

---

## Limitations

### Known Limitations

1. **Web-Based Deployment**
   - **Limitation**: Server can serve malicious updates
   - **Mitigation**: SRI, CSP, code signing (planned)
   - **Residual Risk**: Medium

2. **Metadata Collection**
   - **Limitation**: Server stores metadata (timestamps, participants)
   - **Mitigation**: Metadata minimization, sealed sender (planned)
   - **Residual Risk**: High

3. **Group Messaging**
   - **Limitation**: Sender keys more complex than 1:1
   - **Mitigation**: Signal's sender keys protocol
   - **Residual Risk**: Low

4. **Key Verification**
   - **Limitation**: Users must manually verify safety numbers
   - **Mitigation**: QR codes, out-of-band verification
   - **Residual Risk**: Medium (social engineering)

5. **Browser Environment**
   - **Limitation**: Less secure than native apps
   - **Mitigation**: Modern browser security features
   - **Residual Risk**: Medium

### Out of Scope

- **Backup Encryption**: User-managed backups not encrypted
- **Screenshot Protection**: Browser cannot prevent screenshots
- **Forensic Resistance**: Browser history/cache may leak metadata
- **Anonymous Messaging**: User identity linked to account

---

## Incident Response

### Compromise Detection

1. **Safety Number Mismatch**
   - **Action**: Warn user, require verification
   - **Timeline**: Immediate

2. **Unexpected Key Change**
   - **Action**: Alert user, show safety number
   - **Timeline**: Immediate

3. **Failed Decryption**
   - **Action**: Log error, prompt re-sync
   - **Timeline**: Immediate

4. **Unauthorized Device**
   - **Action**: Send notification, offer remote wipe
   - **Timeline**: <5 minutes

### Incident Response Plan

#### Phase 1: Detection (0-1 hour)

- Monitor security alerts
- Analyze suspicious activity
- Confirm incident severity

#### Phase 2: Containment (1-4 hours)

- Remote wipe compromised devices
- Revoke compromised keys
- Notify affected users
- Disable compromised accounts

#### Phase 3: Eradication (4-24 hours)

- Patch vulnerabilities
- Deploy security updates
- Reset compromised infrastructure
- Audit logs for IOCs

#### Phase 4: Recovery (1-7 days)

- Restore service
- Re-key affected sessions
- Verify safety numbers
- Monitor for recurrence

#### Phase 5: Lessons Learned (7-30 days)

- Post-mortem analysis
- Update threat model
- Improve defenses
- Update documentation

---

## Security Audits

### Recommended Audits

1. **Cryptographic Implementation Review** (Annual)
   - Verify Signal Protocol implementation
   - Review key management
   - Test random number generation

2. **Penetration Testing** (Quarterly)
   - Endpoint security
   - Server security
   - Network security

3. **Code Audit** (Continuous)
   - Dependency scanning
   - SAST/DAST tools
   - Manual code review

4. **Third-Party Audit** (As needed)
   - Independent security firms
   - Public disclosure
   - CVE tracking

---

## Compliance

### Relevant Standards

- **NIST SP 800-57**: Key Management (Implemented)
- **NIST SP 800-63B**: Digital Identity Guidelines (Implemented)
- **OWASP ASVS**: Application Security Verification (Level 2)
- **Signal Protocol Specification**: Fully compliant

### Privacy Regulations

- **GDPR**: Right to erasure (remote wipe)
- **CCPA**: Data deletion
- **HIPAA**: End-to-end encryption (healthcare use cases)

---

## Conclusion

nself-chat implements **production-grade Signal Protocol E2EE** with comprehensive security controls:

✅ **Confidentiality**: Messages encrypted end-to-end
✅ **Authenticity**: Cryptographic signatures and safety numbers
✅ **Forward Secrecy**: Double Ratchet algorithm
✅ **Device Security**: PIN/biometric lock, remote wipe
✅ **Key Management**: Encrypted storage, secure generation

**Residual Risks**:

- Metadata collection (inherent to server architecture)
- Web-based deployment (SRI/CSP mitigations)
- Endpoint compromise (defense-in-depth)

**Recommended Actions**:

1. Enable safety number verification for sensitive conversations
2. Use device lock on all devices
3. Regularly update to latest security patches
4. Verify server code updates (when available)
5. Report security issues to security@nself.org

---

**Document Version**: 1.0.0
**Last Updated**: 2026-02-03
**Next Review**: 2026-05-03
**Owner**: Security Team
**Classification**: Public
