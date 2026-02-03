# Signal-Grade E2EE Implementation Plan for nChat

**Version**: 1.0.0
**Date**: February 3, 2026
**Status**: Implementation Plan
**Related Tasks**: TODO.md Tasks 78-85 (Phase 9 - Security & E2EE)

---

## Executive Summary

This document provides a comprehensive implementation plan for achieving Signal-grade End-to-End Encryption (E2EE) in nChat, including device lock policies, safety number verification, and multi-device support. The implementation leverages the official Signal Protocol via `@signalapp/libsignal-client` and integrates with React Native/Capacitor for cross-platform support.

**Current Status**: nChat v0.9.0 has a foundational E2EE implementation. This plan addresses remaining gaps to achieve TODO.md compliance for tasks 78-85.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Required API Endpoints](#2-required-api-endpoints)
3. [Database Schema](#3-database-schema)
4. [Client Implementation](#4-client-implementation)
5. [Device Lock Policies](#5-device-lock-policies)
6. [Security Considerations](#6-security-considerations)
7. [Library Recommendations](#7-library-recommendations)
8. [Test Plan](#8-test-plan)
9. [Implementation Phases](#9-implementation-phases)
10. [Gap Analysis](#10-gap-analysis)

---

## 1. Architecture Overview

### 1.1 Key Hierarchy Diagram

```
                    ┌─────────────────────────────────────┐
                    │         User Password/PIN           │
                    │    (Never stored, never transmitted) │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │        Master Key (256-bit)         │
                    │  PBKDF2-SHA256 (100,000 iterations) │
                    │        Salt: 32 random bytes         │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   Recovery Key    │   │   Device Keys     │   │   Session Keys    │
│ 12-word mnemonic  │   │  (per device)     │   │ (per conversation)│
│   derives backup  │   │                   │   │                   │
│   encryption key  │   │                   │   │                   │
└───────────────────┘   └─────────┬─────────┘   └───────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────────────┐
│ Identity Key  │   │  Signed PreKey    │   │  One-Time PreKeys     │
│    Pair       │   │    (weekly)       │   │    (100 per device)   │
│  (long-term)  │   │                   │   │                       │
│  Curve25519   │   │    Ed25519 sig    │   │   Consumed on X3DH    │
└───────────────┘   └───────────────────┘   └───────────────────────┘
```

### 1.2 Protocol Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        X3DH Key Exchange (First Message)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Alice (Initiator)                              Bob (Recipient)              │
│  ═══════════════════                           ═══════════════════           │
│                                                                              │
│  1. Generate ephemeral key pair (EK_A)                                       │
│                                                                              │
│  2. Fetch Bob's PreKey Bundle:         ←────── Server stores:               │
│     • Identity Key (IK_B)                       • IK_B (public)              │
│     • Signed PreKey (SPK_B)                     • SPK_B (public + sig)       │
│     • One-Time PreKey (OPK_B)                   • OPK_B (public, consumed)   │
│                                                                              │
│  3. Perform DH calculations:                                                 │
│     DH1 = DH(IK_A, SPK_B)    ─────── Authentication                         │
│     DH2 = DH(EK_A, IK_B)     ─────── Forward secrecy                        │
│     DH3 = DH(EK_A, SPK_B)    ─────── Forward secrecy                        │
│     DH4 = DH(EK_A, OPK_B)    ─────── One-time forward secrecy               │
│                                                                              │
│  4. Derive shared secret:                                                    │
│     SK = KDF(DH1 || DH2 || DH3 || DH4)                                      │
│                                                                              │
│  5. Initialize Double Ratchet with SK                                        │
│                                                                              │
│  6. Send PreKey message:              ─────►  Receive & process:            │
│     • IK_A (public)                           • Verify signature on SPK_B    │
│     • EK_A (public)                           • Perform same DH calculations │
│     • OPK_B key ID (consumed)                 • Derive same SK              │
│     • Encrypted message                       • Initialize Double Ratchet    │
│                                               • Decrypt message              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      Double Ratchet (Subsequent Messages)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        ROOT KEY RATCHET                              │    │
│  │   Root Key ──► KDF(Root Key, DH Output) ──► New Root Key            │    │
│  │                                          ╲                           │    │
│  │                                           ╲──► Chain Key             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       CHAIN KEY RATCHET                              │    │
│  │   Chain Key ──► KDF(Chain Key) ──► New Chain Key                    │    │
│  │               ╲                                                      │    │
│  │                ╲──► Message Key (unique per message)                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      MESSAGE ENCRYPTION                              │    │
│  │   Plaintext ──► AES-256-GCM(Message Key) ──► Ciphertext            │    │
│  │   + Associated Data (header, counter)                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SECURITY PROPERTIES:                                                        │
│  ✓ Forward Secrecy: Past messages secure if current keys compromised        │
│  ✓ Future Secrecy: Future messages secure after compromise (healing)        │
│  ✓ Deniability: No cryptographic proof of sender identity                   │
│  ✓ Authentication: Only intended recipient can decrypt                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Component Interactions

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser/Mobile)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │   UI Layer      │     │   E2EE Context  │     │  Secure Storage │        │
│  │  (React/Native) │ ◄──►│   (Zustand)     │ ◄──►│  (IndexedDB/    │        │
│  │                 │     │                 │     │   SecureStore)  │        │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────┘        │
│           │                       │                                          │
│           ▼                       ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                        E2EE Manager                               │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │        │
│  │  │Key Manager  │  │Session Mgr  │  │Message Enc  │              │        │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │        │
│  └────────────────────────────┬────────────────────────────────────┘        │
│                               │                                              │
│                               ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │              @signalapp/libsignal-client                         │        │
│  │         (Rust implementation with TypeScript bindings)           │        │
│  └────────────────────────────┬────────────────────────────────────┘        │
│                               │                                              │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                │
                                ▼ (HTTPS/GraphQL)
┌──────────────────────────────────────────────────────────────────────────────┐
│                                 SERVER                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐        │
│  │  API Routes     │ ◄──►│  Hasura/GraphQL │ ◄──►│  PostgreSQL     │        │
│  │  (Next.js)      │     │                 │     │  (RLS enforced) │        │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘        │
│                                                                               │
│  Server CANNOT:                        Server CAN:                           │
│  ✗ Decrypt messages                   ✓ Store encrypted payloads            │
│  ✗ Access private keys                ✓ Store public keys                   │
│  ✗ Read plaintext content             ✓ Route encrypted messages            │
│  ✗ Forge safety numbers               ✓ Log metadata (audit trail)          │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Required API Endpoints

### 2.1 POST /api/e2ee/initialize

**Purpose**: Initialize E2EE for a user, generating master key and device keys.

**Current Status**: ✅ Implemented (disabled route at `src/app/api/e2ee/initialize/route.ts.disabled`)

**Required Changes**:

- Enable the route (rename from `.disabled`)
- Add device lock policy initialization
- Add PIN/biometric enrollment hooks
- Add rate limiting

**Request**:

```typescript
interface InitializeRequest {
  password: string // User's E2EE password
  deviceId?: string // Optional device ID (generated if not provided)
  deviceName?: string // Human-readable device name
  deviceLockPolicy?: {
    type: 'pin' | 'biometric' | 'pin_biometric' | 'none'
    pinLength?: 4 | 6 | 8
    biometricFallbackAllowed?: boolean
    timeoutMinutes?: number // Minutes until re-auth required
    wipeAfterFailedAttempts?: number // Default: 10
  }
}
```

**Response**:

```typescript
interface InitializeResponse {
  success: boolean
  status: {
    initialized: boolean
    masterKeyInitialized: boolean
    deviceKeysGenerated: boolean
    deviceId: string
    registrationId: number
  }
  recoveryCode: string | null // Only returned on first setup
  deviceLockConfigured: boolean
  message: string
}
```

**Implementation**:

```typescript
// src/app/api/e2ee/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getE2EEManager } from '@/lib/e2ee'
import { getApolloClient } from '@/lib/apollo-client'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 attempts per 15 minutes
  const rateLimitResult = await rateLimit(request, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { password, deviceId, deviceName, deviceLockPolicy } = body

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const apolloClient = getApolloClient()
    const e2eeManager = getE2EEManager(apolloClient)

    // Initialize E2EE
    await e2eeManager.initialize(password, deviceId)

    // Configure device lock policy if provided
    if (deviceLockPolicy && deviceLockPolicy.type !== 'none') {
      await e2eeManager.configureDeviceLock(deviceLockPolicy)
    }

    const status = e2eeManager.getStatus()
    const recoveryCode = e2eeManager.getRecoveryCode()

    return NextResponse.json({
      success: true,
      status,
      recoveryCode,
      deviceLockConfigured: !!deviceLockPolicy,
      message: 'E2EE initialized successfully',
    })
  } catch (error: any) {
    console.error('E2EE initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize E2EE', message: error.message },
      { status: 500 }
    )
  }
}
```

---

### 2.2 POST /api/e2ee/keys/replenish

**Purpose**: Replenish one-time prekeys when running low.

**Current Status**: ✅ Implemented (disabled route)

**Required Changes**:

- Enable the route
- Add automatic trigger when prekeys < 20
- Add monitoring/alerting

**Request**:

```typescript
interface ReplenishRequest {
  count?: number // Number of prekeys to generate (default: 50)
  deviceId?: string // Optional, uses current device if not provided
}
```

**Response**:

```typescript
interface ReplenishResponse {
  success: boolean
  newPreKeyCount: number
  totalPreKeyCount: number
  message: string
}
```

---

### 2.3 POST /api/e2ee/recover

**Purpose**: Recover E2EE access using recovery code.

**Current Status**: ✅ Implemented (disabled route)

**Required Changes**:

- Enable the route
- Add security verification (email confirmation)
- Add device re-enrollment flow
- Rate limiting (3 attempts per hour)

**Request**:

```typescript
interface RecoverRequest {
  recoveryCode: string // 12-word recovery code
  newPassword: string // New E2EE password
  deviceId?: string // New device ID
  deviceName?: string // Device name
}
```

**Response**:

```typescript
interface RecoverResponse {
  success: boolean
  status: E2EEStatus
  newRecoveryCode: string | null // New recovery code if regenerated
  message: string
}
```

---

### 2.4 GET /api/e2ee/safety-number/:userId

**Purpose**: Get or generate safety number for a specific user.

**Current Status**: ⚠️ Partially implemented (disabled route, missing userId parameter)

**Required Changes**:

- Enable the route
- Add route parameter for userId
- Add QR code generation
- Add verification status

**Request**:

```typescript
// GET /api/e2ee/safety-number/[userId]
// Query params:
interface SafetyNumberQuery {
  deviceId?: string // Specific device (defaults to primary)
  format?: 'numeric' | 'qr' | 'both'
}
```

**Response**:

```typescript
interface SafetyNumberResponse {
  success: boolean
  safetyNumber: string // 60-digit number
  formattedSafetyNumber: string // "12345 67890 12345 ..."
  qrCodeData: string // QR-encodable string
  qrCodeSvg?: string // SVG for QR code display
  isVerified: boolean
  verifiedAt: string | null
  peerUserId: string
  peerDeviceId: string
}
```

---

### 2.5 POST /api/e2ee/device-lock/verify

**Purpose**: Verify device lock (PIN/biometric) before accessing encrypted content.

**Current Status**: ❌ Not implemented

**Request**:

```typescript
interface DeviceLockVerifyRequest {
  type: 'pin' | 'biometric'
  pin?: string // Hashed PIN
  biometricToken?: string // Platform biometric token
  deviceId: string
}
```

**Response**:

```typescript
interface DeviceLockVerifyResponse {
  success: boolean
  sessionToken: string // Short-lived token for E2EE operations
  expiresAt: string // Token expiration
  remainingAttempts?: number
  message: string
}
```

---

### 2.6 POST /api/e2ee/device-lock/configure

**Purpose**: Configure or update device lock policy.

**Current Status**: ❌ Not implemented

**Request**:

```typescript
interface DeviceLockConfigureRequest {
  policy: {
    type: 'pin' | 'biometric' | 'pin_biometric' | 'none'
    pinLength?: 4 | 6 | 8
    biometricFallbackAllowed?: boolean
    requirePinInterval?: 'never' | 'daily' | 'weekly'
    timeoutMinutes?: number
    wipeAfterFailedAttempts?: number
  }
  currentPin?: string // Required if changing from PIN
  newPin?: string // Required if setting up PIN
}
```

**Response**:

```typescript
interface DeviceLockConfigureResponse {
  success: boolean
  policy: DeviceLockPolicy
  message: string
}
```

---

### 2.7 POST /api/e2ee/device-lock/wipe

**Purpose**: Wipe E2EE data after too many failed attempts or user request.

**Current Status**: ❌ Not implemented

**Request**:

```typescript
interface DeviceLockWipeRequest {
  reason: 'failed_attempts' | 'user_request' | 'remote_wipe'
  deviceId: string
  preserveRecoveryOption?: boolean // Keep server-side backup
}
```

**Response**:

```typescript
interface DeviceLockWipeResponse {
  success: boolean
  wipedData: string[] // List of data categories wiped
  recoveryPossible: boolean
  message: string
}
```

---

## 3. Database Schema

### 3.1 Existing Tables (Verified in E2EE-Complete.md)

The following tables are already implemented:

```sql
-- User master keys (password-derived)
CREATE TABLE nchat_user_master_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  salt BYTEA NOT NULL,
  key_hash BYTEA NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 100000,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'PBKDF2-SHA256',
  master_key_backup_encrypted BYTEA,
  recovery_code_hash BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Device identity keys
CREATE TABLE nchat_identity_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  identity_key_public BYTEA NOT NULL,
  identity_key_private_encrypted BYTEA NOT NULL,
  registration_id INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Signed prekeys (rotated weekly)
CREATE TABLE nchat_signed_prekeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  key_id INTEGER NOT NULL,
  public_key BYTEA NOT NULL,
  private_key_encrypted BYTEA NOT NULL,
  signature BYTEA NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id, key_id)
);

-- One-time prekeys
CREATE TABLE nchat_one_time_prekeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  key_id INTEGER NOT NULL,
  public_key BYTEA NOT NULL,
  private_key_encrypted BYTEA NOT NULL,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES nchat_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id, key_id)
);

-- Signal sessions
CREATE TABLE nchat_signal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  peer_user_id UUID NOT NULL REFERENCES nchat_users(id),
  peer_device_id VARCHAR(64) NOT NULL,
  session_state_encrypted BYTEA NOT NULL,
  root_key_hash BYTEA,
  chain_key_hash BYTEA,
  send_counter INTEGER NOT NULL DEFAULT 0,
  receive_counter INTEGER NOT NULL DEFAULT 0,
  is_initiator BOOLEAN NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_message_sent_at TIMESTAMPTZ,
  last_message_received_at TIMESTAMPTZ,
  last_ratchet_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id, peer_user_id, peer_device_id)
);

-- Safety numbers
CREATE TABLE nchat_safety_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  peer_user_id UUID NOT NULL REFERENCES nchat_users(id),
  safety_number VARCHAR(60) NOT NULL,
  user_identity_fingerprint VARCHAR(64) NOT NULL,
  peer_identity_fingerprint VARCHAR(64) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES nchat_users(id),
  verification_method VARCHAR(20), -- 'manual', 'qr_code', 'video'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, peer_user_id)
);

-- E2EE audit log
CREATE TABLE nchat_e2ee_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64),
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prekey bundles view (materialized for performance)
CREATE MATERIALIZED VIEW nchat_prekey_bundles AS
SELECT
  ik.user_id,
  ik.device_id,
  ik.identity_key_public,
  ik.registration_id,
  spk.key_id AS signed_prekey_id,
  spk.public_key AS signed_prekey_public,
  spk.signature AS signed_prekey_signature,
  opk.key_id AS one_time_prekey_id,
  opk.public_key AS one_time_prekey_public
FROM nchat_identity_keys ik
JOIN nchat_signed_prekeys spk ON ik.user_id = spk.user_id
  AND ik.device_id = spk.device_id AND spk.is_active = TRUE
LEFT JOIN LATERAL (
  SELECT key_id, public_key
  FROM nchat_one_time_prekeys
  WHERE user_id = ik.user_id
    AND device_id = ik.device_id
    AND is_consumed = FALSE
  ORDER BY key_id
  LIMIT 1
) opk ON TRUE
WHERE ik.is_active = TRUE;
```

### 3.2 New Tables Required for Device Lock

```sql
-- Device lock policies
CREATE TABLE nchat_device_lock_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  policy_type VARCHAR(20) NOT NULL, -- 'pin', 'biometric', 'pin_biometric', 'none'
  pin_hash BYTEA,                   -- Hashed PIN (if applicable)
  pin_salt BYTEA,                   -- Salt for PIN hash
  pin_length INTEGER,               -- 4, 6, or 8
  require_pin_interval VARCHAR(20), -- 'never', 'daily', 'weekly'
  last_pin_verified_at TIMESTAMPTZ,
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  biometric_fallback_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  timeout_minutes INTEGER NOT NULL DEFAULT 5,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  wipe_after_failed_attempts INTEGER NOT NULL DEFAULT 10,
  last_failed_at TIMESTAMPTZ,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Device lock sessions (short-lived tokens after verification)
CREATE TABLE nchat_device_lock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  session_token_hash BYTEA NOT NULL,
  verification_method VARCHAR(20) NOT NULL, -- 'pin', 'biometric'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, device_id, session_token_hash)
);

-- Device lock audit log
CREATE TABLE nchat_device_lock_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'verify_success', 'verify_failed', 'lockout', 'wipe', 'policy_change'
  verification_method VARCHAR(20),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for device lock tables
CREATE INDEX idx_device_lock_policies_user_device ON nchat_device_lock_policies(user_id, device_id);
CREATE INDEX idx_device_lock_sessions_expires ON nchat_device_lock_sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_device_lock_audit_user ON nchat_device_lock_audit(user_id, created_at DESC);

-- RLS policies
ALTER TABLE nchat_device_lock_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_device_lock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_device_lock_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_lock_policies_user ON nchat_device_lock_policies
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY device_lock_sessions_user ON nchat_device_lock_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY device_lock_audit_user ON nchat_device_lock_audit
  FOR SELECT USING (user_id = auth.uid());
```

### 3.3 Multi-Device Support Schema

```sql
-- User devices registry
CREATE TABLE nchat_user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  device_id VARCHAR(64) NOT NULL,
  device_name VARCHAR(100),
  device_type VARCHAR(20) NOT NULL, -- 'web', 'desktop', 'ios', 'android'
  os_name VARCHAR(50),
  os_version VARCHAR(20),
  app_version VARCHAR(20),
  push_token TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Device linking requests (for adding new devices)
CREATE TABLE nchat_device_linking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  requesting_device_id VARCHAR(64) NOT NULL,
  approving_device_id VARCHAR(64),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  verification_code VARCHAR(10) NOT NULL,
  verification_code_hash BYTEA NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_devices_user ON nchat_user_devices(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_device_linking_pending ON nchat_device_linking_requests(user_id, status) WHERE status = 'pending';
```

---

## 4. Client Implementation

### 4.1 Key Generation

The current implementation uses `@signalapp/libsignal-client` correctly. Key areas to verify/enhance:

```typescript
// src/lib/e2ee/signal-client.ts (Enhanced)

import * as SignalClient from '@signalapp/libsignal-client'
import { crypto } from './crypto'

// ============================================================================
// KEY GENERATION (Current implementation is correct)
// ============================================================================

/**
 * Generate a new identity key pair using Curve25519
 * This is the long-term device identity
 */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  const keyPair = SignalClient.IdentityKeyPair.generate()
  return {
    publicKey: keyPair.publicKey.serialize(),
    privateKey: keyPair.privateKey.serialize(),
  }
}

/**
 * Generate a signed prekey (medium-term, rotated weekly)
 * Signed with the identity key for authentication
 */
export async function generateSignedPreKey(
  identityKeyPair: IdentityKeyPair,
  signedPreKeyId: number
): Promise<SignedPreKeyPair> {
  const identityPrivateKey = SignalClient.PrivateKey.deserialize(
    Buffer.from(identityKeyPair.privateKey)
  )

  const keyPair = SignalClient.PrivateKey.generate()
  const publicKey = keyPair.getPublicKey()
  const signature = identityPrivateKey.sign(publicKey.serialize())

  return {
    keyId: signedPreKeyId,
    keyPair: {
      publicKey: publicKey.serialize(),
      privateKey: keyPair.serialize(),
    },
    signature,
  }
}

/**
 * Generate multiple one-time prekeys
 * These provide additional forward secrecy and are consumed once
 */
export async function generateOneTimePreKeys(
  startId: number,
  count: number
): Promise<PreKeyPair[]> {
  const preKeys: PreKeyPair[] = []

  for (let i = 0; i < count; i++) {
    const keyId = startId + i
    const privateKey = SignalClient.PrivateKey.generate()
    const publicKey = privateKey.getPublicKey()

    preKeys.push({
      keyId,
      publicKey: publicKey.serialize(),
      privateKey: privateKey.serialize(),
    })
  }

  return preKeys
}
```

### 4.2 Session Establishment

```typescript
// src/lib/e2ee/session-manager.ts (Enhanced)

/**
 * Create a new session with a peer using X3DH key agreement
 */
export async function createSession(peerUserId: string, peerDeviceId: string): Promise<void> {
  // 1. Fetch peer's prekey bundle from server
  const { data } = await apolloClient.query({
    query: GET_PREKEY_BUNDLE,
    variables: { userId: peerUserId, deviceId: peerDeviceId },
    fetchPolicy: 'network-only',
  })

  if (!data.nchat_prekey_bundles.length) {
    throw new Error('No prekey bundle available for peer')
  }

  const bundle = data.nchat_prekey_bundles[0]

  // 2. Build PreKeyBundle object
  const prekeyBundle = buildPreKeyBundle(bundle)

  // 3. Get local identity keys
  const deviceKeys = await keyManager.loadDeviceKeys(deviceId)
  if (!deviceKeys) {
    throw new Error('Local device keys not found')
  }

  // 4. Create protocol address for peer
  const remoteAddress = SignalClient.ProtocolAddress.new(peerUserId, parseInt(peerDeviceId, 10))

  // 5. Process prekey bundle (performs X3DH)
  await SignalClient.processPreKeyBundle(
    prekeyBundle,
    remoteAddress,
    sessionStore,
    identityKeyStore
  )

  // 6. Mark one-time prekey as consumed
  if (bundle.one_time_prekey_id) {
    await consumeOneTimePreKey(peerUserId, peerDeviceId, bundle.one_time_prekey_id)
  }

  // 7. Log session creation for audit
  await logE2EEEvent('session_created', {
    peerUserId,
    peerDeviceId,
    isInitiator: true,
  })
}
```

### 4.3 Message Encryption/Decryption

```typescript
// src/lib/e2ee/message-encryption.ts (Enhanced)

/**
 * Encrypt a message for sending
 */
export async function encryptMessageForSending(
  plaintext: string,
  options: EncryptionOptions,
  apolloClient: ApolloClient<any>
): Promise<EncryptedMessagePayload> {
  const e2eeManager = getE2EEManager(apolloClient)

  if (!e2eeManager.isInitialized()) {
    throw new Error('E2EE not initialized')
  }

  // Get all recipient devices (for multi-device support)
  const recipientDevices = await getRecipientDevices(options.recipientUserId, apolloClient)

  // Encrypt for each device
  const encryptedPayloads: DeviceEncryptedPayload[] = []

  for (const device of recipientDevices) {
    const result = await e2eeManager.encryptMessage(
      plaintext,
      options.recipientUserId,
      device.deviceId
    )

    encryptedPayloads.push({
      deviceId: device.deviceId,
      encryptedPayload: result.encryptedPayload,
      messageType: result.type,
    })
  }

  return {
    senderDeviceId: e2eeManager.getDeviceId()!,
    encryptedPayloads,
    encryptionVersion: 1,
    timestamp: Date.now(),
  }
}

/**
 * Decrypt a received message
 */
export async function decryptReceivedMessage(
  message: EncryptedMessage,
  apolloClient: ApolloClient<any>
): Promise<string> {
  const e2eeManager = getE2EEManager(apolloClient)

  if (!e2eeManager.isInitialized()) {
    throw new Error('E2EE not initialized')
  }

  // Find the payload for our device
  const myDeviceId = e2eeManager.getDeviceId()
  const payload = message.encryptedPayloads.find((p) => p.deviceId === myDeviceId)

  if (!payload) {
    throw new Error('No encrypted payload for this device')
  }

  return await e2eeManager.decryptMessage(
    payload.encryptedPayload,
    payload.messageType,
    message.senderUserId,
    message.senderDeviceId
  )
}
```

### 4.4 Key Storage (IndexedDB/SecureStore)

```typescript
// src/lib/e2ee/storage/secure-key-storage.ts

import { SecureStorage } from '@/lib/crypto/secure-storage'
import { Platform } from '@/lib/platform'

/**
 * Platform-aware secure key storage
 * - Web: IndexedDB with encryption
 * - iOS: Keychain via Capacitor SecureStorage
 * - Android: Keystore via Capacitor SecureStorage
 * - Desktop: OS keychain via Electron safeStorage
 */
export class SecureKeyStorage {
  private storage: SecureStorage
  private platform: Platform

  constructor() {
    this.platform = Platform.detect()
    this.storage = new SecureStorage({
      prefix: 'nchat_e2ee_',
      defaultEncrypt: true,
    })
  }

  async initialize(masterKey: Uint8Array): Promise<void> {
    if (this.platform.isNative()) {
      // Use native secure storage
      await this.initializeNativeStorage(masterKey)
    } else {
      // Use IndexedDB with Web Crypto
      await this.storage.initialize()
    }
  }

  async storeMasterKey(key: Uint8Array, salt: Uint8Array): Promise<void> {
    if (this.platform.isNative()) {
      await NativeSecureStorage.set('master_key', {
        key: Array.from(key),
        salt: Array.from(salt),
      })
    } else {
      // Never store master key in browser storage
      // Only keep in memory during session
      throw new Error('Master key should not be stored in browser')
    }
  }

  async storeDeviceKeys(deviceKeys: DeviceKeys): Promise<void> {
    const key = `device_keys_${deviceKeys.deviceId}`

    // Encrypt private keys before storage
    const encryptedKeys = await this.encryptDeviceKeys(deviceKeys)

    await this.storage.set(key, encryptedKeys)
  }

  async loadDeviceKeys(deviceId: string): Promise<DeviceKeys | null> {
    const key = `device_keys_${deviceId}`
    const encryptedKeys = await this.storage.get<EncryptedDeviceKeys>(key)

    if (!encryptedKeys) return null

    return await this.decryptDeviceKeys(encryptedKeys)
  }

  async storeSession(
    peerUserId: string,
    peerDeviceId: string,
    sessionState: Uint8Array
  ): Promise<void> {
    const key = `session_${peerUserId}_${peerDeviceId}`
    await this.storage.set(key, Array.from(sessionState))
  }

  async loadSession(peerUserId: string, peerDeviceId: string): Promise<Uint8Array | null> {
    const key = `session_${peerUserId}_${peerDeviceId}`
    const data = await this.storage.get<number[]>(key)
    return data ? new Uint8Array(data) : null
  }

  async clearAll(): Promise<void> {
    await this.storage.clearAll()
    if (this.platform.isNative()) {
      await NativeSecureStorage.clear()
    }
  }

  private async initializeNativeStorage(masterKey: Uint8Array): Promise<void> {
    // Platform-specific initialization
    if (this.platform.isIOS() || this.platform.isAndroid()) {
      // Capacitor SecureStorage plugin
      const { SecureStoragePlugin } = await import('@capacitor-community/secure-storage-plugin')
      await SecureStoragePlugin.set({
        key: 'e2ee_initialized',
        value: 'true',
      })
    } else if (this.platform.isElectron()) {
      // Electron safeStorage
      const { safeStorage } = require('electron')
      // Verify safeStorage is available
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Secure storage not available on this platform')
      }
    }
  }

  private async encryptDeviceKeys(keys: DeviceKeys): Promise<EncryptedDeviceKeys> {
    // Encrypt private keys with master key
    // Implementation uses AES-256-GCM
    return {
      deviceId: keys.deviceId,
      registrationId: keys.registrationId,
      identityKeyPublic: Array.from(keys.identityKeyPair.publicKey),
      identityKeyPrivateEncrypted: await this.encrypt(keys.identityKeyPair.privateKey),
      signedPreKeyPublic: Array.from(keys.signedPreKey.keyPair.publicKey),
      signedPreKeyPrivateEncrypted: await this.encrypt(keys.signedPreKey.keyPair.privateKey),
      signedPreKeySignature: Array.from(keys.signedPreKey.signature),
      signedPreKeyId: keys.signedPreKey.keyId,
      oneTimePreKeys: await Promise.all(
        keys.oneTimePreKeys.map(async (pk) => ({
          keyId: pk.keyId,
          publicKey: Array.from(pk.publicKey),
          privateKeyEncrypted: await this.encrypt(pk.privateKey),
        }))
      ),
    }
  }
}

export const secureKeyStorage = new SecureKeyStorage()
```

---

## 5. Device Lock Policies

### 5.1 Policy Types

| Policy Type     | Description                | Security Level | UX Impact     |
| --------------- | -------------------------- | -------------- | ------------- |
| `none`          | No device lock             | Low            | Best UX       |
| `pin`           | PIN required on every open | High           | Most friction |
| `biometric`     | Biometric only             | Medium-High    | Good UX       |
| `pin_biometric` | PIN once daily + biometric | High           | Good UX       |

### 5.2 Implementation

```typescript
// src/lib/e2ee/device-lock/device-lock-manager.ts

export interface DeviceLockPolicy {
  type: 'pin' | 'biometric' | 'pin_biometric' | 'none'
  pinLength?: 4 | 6 | 8
  biometricFallbackAllowed: boolean
  requirePinInterval: 'never' | 'daily' | 'weekly'
  timeoutMinutes: number
  wipeAfterFailedAttempts: number
}

export class DeviceLockManager {
  private policy: DeviceLockPolicy | null = null
  private failedAttempts: number = 0
  private lastVerifiedAt: Date | null = null
  private lastPinVerifiedAt: Date | null = null
  private sessionToken: string | null = null
  private sessionExpiresAt: Date | null = null

  /**
   * Configure device lock policy
   */
  async configure(policy: DeviceLockPolicy, pin?: string): Promise<void> {
    // Validate policy
    this.validatePolicy(policy)

    // If PIN policy, hash and store PIN
    if (policy.type === 'pin' || policy.type === 'pin_biometric') {
      if (!pin) {
        throw new Error('PIN required for this policy type')
      }
      await this.hashAndStorePIN(pin, policy.pinLength || 6)
    }

    // If biometric, verify biometric capability
    if (policy.type === 'biometric' || policy.type === 'pin_biometric') {
      const biometricAvailable = await this.checkBiometricAvailability()
      if (!biometricAvailable && !policy.biometricFallbackAllowed) {
        throw new Error('Biometric not available on this device')
      }
    }

    // Store policy
    this.policy = policy
    await this.persistPolicy(policy)

    // Log configuration
    await this.logEvent('policy_configured', { type: policy.type })
  }

  /**
   * Verify device lock (PIN or biometric)
   */
  async verify(type: 'pin' | 'biometric', credential?: string): Promise<DeviceLockSession> {
    if (!this.policy) {
      throw new Error('No device lock policy configured')
    }

    // Check if locked out
    if (this.isLockedOut()) {
      throw new Error('Device is locked due to too many failed attempts')
    }

    // Check if session still valid
    if (this.hasValidSession()) {
      return this.getCurrentSession()!
    }

    // Determine if PIN is required
    const pinRequired = this.isPINRequired()

    if (type === 'pin') {
      if (!credential) {
        throw new Error('PIN is required')
      }
      await this.verifyPIN(credential)
    } else if (type === 'biometric') {
      if (pinRequired) {
        throw new Error('PIN verification required before biometric')
      }
      await this.verifyBiometric()
    }

    // Create session
    const session = await this.createSession(type)

    // Reset failed attempts
    this.failedAttempts = 0
    this.lastVerifiedAt = new Date()
    if (type === 'pin') {
      this.lastPinVerifiedAt = new Date()
    }

    // Log success
    await this.logEvent('verify_success', { method: type })

    return session
  }

  /**
   * Check if PIN verification is required based on policy
   */
  private isPINRequired(): boolean {
    if (!this.policy) return false
    if (this.policy.type === 'pin') return true
    if (this.policy.type !== 'pin_biometric') return false

    const interval = this.policy.requirePinInterval
    if (interval === 'never') return false
    if (!this.lastPinVerifiedAt) return true

    const now = new Date()
    const hoursSincePin = (now.getTime() - this.lastPinVerifiedAt.getTime()) / (1000 * 60 * 60)

    switch (interval) {
      case 'daily':
        return hoursSincePin >= 24
      case 'weekly':
        return hoursSincePin >= 168
      default:
        return false
    }
  }

  /**
   * Verify PIN against stored hash
   */
  private async verifyPIN(pin: string): Promise<void> {
    const storedHash = await this.getStoredPINHash()
    if (!storedHash) {
      throw new Error('No PIN configured')
    }

    const isValid = await this.verifyPINHash(pin, storedHash)
    if (!isValid) {
      this.failedAttempts++
      await this.logEvent('verify_failed', { method: 'pin', attempts: this.failedAttempts })

      if (this.failedAttempts >= this.policy!.wipeAfterFailedAttempts) {
        await this.wipeOnFailure()
        throw new Error('Too many failed attempts. Data has been wiped.')
      }

      throw new Error(
        `Invalid PIN. ${this.policy!.wipeAfterFailedAttempts - this.failedAttempts} attempts remaining.`
      )
    }
  }

  /**
   * Verify biometric authentication
   */
  private async verifyBiometric(): Promise<void> {
    const platform = Platform.detect()

    if (platform.isIOS() || platform.isAndroid()) {
      // Use Capacitor biometric plugin
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth')

      const result = await BiometricAuth.authenticate({
        reason: 'Verify identity to access encrypted messages',
        cancelTitle: 'Cancel',
        allowDeviceCredential: this.policy?.biometricFallbackAllowed ?? true,
      })

      if (!result.success) {
        this.failedAttempts++
        throw new Error('Biometric verification failed')
      }
    } else if (platform.isWeb()) {
      // Use WebAuthn if available
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric not supported on this browser')
      }

      // WebAuthn implementation
      await this.performWebAuthn()
    }
  }

  /**
   * Wipe E2EE data after too many failed attempts
   */
  private async wipeOnFailure(): Promise<void> {
    await this.logEvent('wipe', { reason: 'failed_attempts' })

    // Clear all E2EE data
    const e2eeManager = getE2EEManager()
    e2eeManager.destroy()

    // Clear secure storage
    await secureKeyStorage.clearAll()

    // Clear device lock data
    this.policy = null
    this.failedAttempts = 0
    this.sessionToken = null

    // Notify user
    await this.notifyWipe()
  }

  /**
   * Create a short-lived session after successful verification
   */
  private async createSession(method: 'pin' | 'biometric'): Promise<DeviceLockSession> {
    const token = crypto.generateDeviceId() // Random 32 bytes
    const expiresAt = new Date(Date.now() + this.policy!.timeoutMinutes * 60 * 1000)

    this.sessionToken = token
    this.sessionExpiresAt = expiresAt

    // Store session in database
    await this.persistSession(token, method, expiresAt)

    return {
      token,
      expiresAt,
      method,
    }
  }

  /**
   * Check if device is currently locked out
   */
  private isLockedOut(): boolean {
    return this.failedAttempts >= (this.policy?.wipeAfterFailedAttempts ?? 10)
  }

  /**
   * Check if there's a valid session
   */
  private hasValidSession(): boolean {
    if (!this.sessionToken || !this.sessionExpiresAt) return false
    return new Date() < this.sessionExpiresAt
  }

  /**
   * Get current session if valid
   */
  private getCurrentSession(): DeviceLockSession | null {
    if (!this.hasValidSession()) return null
    return {
      token: this.sessionToken!,
      expiresAt: this.sessionExpiresAt!,
      method: 'cached',
    }
  }
}

export const deviceLockManager = new DeviceLockManager()
```

### 5.3 PIN Required After Timeout Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Device Lock Flow                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐                                                         │
│  │  App Opens /   │                                                         │
│  │  Resumes       │                                                         │
│  └───────┬────────┘                                                         │
│          │                                                                   │
│          ▼                                                                   │
│  ┌────────────────┐      No       ┌────────────────┐                       │
│  │ Device Lock    │ ────────────► │ Allow Access   │                       │
│  │ Configured?    │               └────────────────┘                       │
│  └───────┬────────┘                                                         │
│          │ Yes                                                               │
│          ▼                                                                   │
│  ┌────────────────┐      Yes      ┌────────────────┐                       │
│  │ Valid Session? │ ────────────► │ Allow Access   │                       │
│  └───────┬────────┘               └────────────────┘                       │
│          │ No                                                                │
│          ▼                                                                   │
│  ┌────────────────┐      No       ┌────────────────┐                       │
│  │ PIN Required   │ ────────────► │ Biometric Only │                       │
│  │ (interval)?    │               │ Verification   │                       │
│  └───────┬────────┘               └───────┬────────┘                       │
│          │ Yes                            │                                  │
│          ▼                                ▼                                  │
│  ┌────────────────┐              ┌────────────────┐                        │
│  │ Show PIN       │              │ Verify         │                        │
│  │ Entry Screen   │              │ Biometric      │                        │
│  └───────┬────────┘              └───────┬────────┘                        │
│          │                               │                                   │
│          ▼                               ▼                                   │
│  ┌────────────────┐              ┌────────────────┐                        │
│  │ Verify PIN     │ ───Failed──► │ Increment      │                        │
│  │                │              │ Failed Count   │                        │
│  └───────┬────────┘              └───────┬────────┘                        │
│          │ Success                       │                                   │
│          ▼                               ▼                                   │
│  ┌────────────────┐              ┌────────────────┐   ┌────────────────┐  │
│  │ Create Session │              │ Count >=       │──►│ WIPE ALL DATA  │  │
│  │ Token          │              │ Max Attempts?  │   └────────────────┘  │
│  └───────┬────────┘              └───────┬────────┘                        │
│          │                               │ No                                │
│          ▼                               ▼                                   │
│  ┌────────────────┐              ┌────────────────┐                        │
│  │ Allow Access   │              │ Show Error +   │                        │
│  │ to E2EE Data   │              │ Retry          │                        │
│  └────────────────┘              └────────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Considerations

### 6.1 Key Backup Options

| Option                           | Security    | Usability | Implementation                         |
| -------------------------------- | ----------- | --------- | -------------------------------------- |
| **Recovery Code** (current)      | High        | Medium    | 12-word mnemonic                       |
| **Server-Side Encrypted Backup** | Medium-High | High      | Master key encrypted with recovery key |
| **Social Recovery**              | Medium      | High      | Split key among trusted contacts       |
| **Hardware Key**                 | Very High   | Low       | YubiKey / Security Key                 |

**Recommendation**: Keep recovery code as primary, add optional server-side encrypted backup.

```typescript
// Server-side encrypted backup implementation
interface KeyBackup {
  encryptedMasterKey: Uint8Array // Encrypted with recovery-derived key
  salt: Uint8Array
  iterations: number
  algorithm: string
  version: number
  createdAt: Date
}

async function createKeyBackup(masterKey: Uint8Array, recoveryCode: string): Promise<KeyBackup> {
  const salt = crypto.generateSalt()
  const recoveryKey = await crypto.deriveRecoveryKey(recoveryCode, salt)
  const { ciphertext, iv } = await crypto.encryptAESGCM(masterKey, recoveryKey)

  return {
    encryptedMasterKey: crypto.encodeEncryptedData(ciphertext, iv),
    salt,
    iterations: PBKDF2_ITERATIONS,
    algorithm: 'AES-256-GCM',
    version: 1,
    createdAt: new Date(),
  }
}
```

### 6.2 Multi-Device Support

Signal Protocol supports multi-device by treating each device as a separate identity with its own key pair. Messages are encrypted separately for each device.

```typescript
// Multi-device message flow
async function sendToAllDevices(
  recipientUserId: string,
  plaintext: string
): Promise<MultiDeviceMessage> {
  // Get all active devices for recipient
  const devices = await getRecipientDevices(recipientUserId)

  // Encrypt message for each device
  const payloads: DevicePayload[] = []

  for (const device of devices) {
    // Ensure session exists
    await ensureSession(recipientUserId, device.deviceId)

    // Encrypt for this device
    const encrypted = await encryptForDevice(plaintext, recipientUserId, device.deviceId)

    payloads.push({
      deviceId: device.deviceId,
      payload: encrypted,
    })
  }

  return {
    recipientUserId,
    payloads,
  }
}
```

### 6.3 Forward Secrecy Guarantees

| Property                     | Guarantee                                        | Mechanism                     |
| ---------------------------- | ------------------------------------------------ | ----------------------------- |
| **Message Forward Secrecy**  | Past messages secure if chain key compromised    | Symmetric ratchet (KDF chain) |
| **Session Forward Secrecy**  | Past sessions secure if identity key compromised | X3DH with ephemeral keys      |
| **Future Secrecy (Healing)** | Future messages secure after compromise          | DH ratchet on each response   |

### 6.4 Threat Model

**Protected Against**:

- Server compromise (encrypted messages, encrypted private keys)
- Network eavesdropping (TLS + E2EE)
- Database breach (all sensitive data encrypted)
- Message interception (only recipient can decrypt)
- Key logging attacks (keys derived client-side)

**NOT Protected Against** (user responsibility):

- Device compromise (root/jailbreak)
- Weak passwords/PINs
- Lost recovery codes
- Social engineering
- Screenshot/screen recording
- Physical device access without lock

### 6.5 Audit Logging

```typescript
// Non-sensitive metadata logging
interface E2EEAuditEvent {
  eventType:
    | 'e2ee_initialized'
    | 'keys_generated'
    | 'session_created'
    | 'session_refreshed'
    | 'message_encrypted'
    | 'message_decrypted'
    | 'prekeys_replenished'
    | 'signed_prekey_rotated'
    | 'safety_number_verified'
    | 'device_lock_verified'
    | 'device_lock_failed'
    | 'data_wiped'
  deviceId: string
  peerUserId?: string // For session events
  metadata: {
    messageCount?: number // Never content
    prekeyCount?: number
    verificationMethod?: string
    failedAttempts?: number
  }
  ipAddress: string
  userAgent: string
  timestamp: Date
}
```

---

## 7. Library Recommendations

### 7.1 Primary: @signalapp/libsignal-client (Current)

**Status**: Already in use (`^0.69.0`)

**Pros**:

- Official Signal implementation
- Rust-based (performance, security)
- TypeScript bindings
- Actively maintained
- Production-proven

**Cons**:

- Native bindings require platform-specific builds
- Larger bundle size than pure JS

**Recommendation**: Continue using for all platforms.

### 7.2 Alternative for Web-Only: @privacyresearch/libsignal-protocol-typescript

**Link**: [GitHub](https://github.com/privacyresearchgroup/libsignal-protocol-typescript)

**Use Case**: Pure TypeScript/JavaScript environments where native bindings are problematic.

### 7.3 Cryptographic Primitives

Already in use (keep these):

- `@noble/hashes` - SHA, PBKDF2, HKDF
- `@noble/curves` - Curve25519, Ed25519

### 7.4 Platform-Specific Libraries

| Platform | Library                                      | Purpose            |
| -------- | -------------------------------------------- | ------------------ |
| Web      | Native Web Crypto API                        | AES-GCM, PBKDF2    |
| iOS      | `@capacitor-community/secure-storage-plugin` | Keychain storage   |
| Android  | `@capacitor-community/secure-storage-plugin` | Keystore storage   |
| iOS      | `@aparajita/capacitor-biometric-auth`        | Face ID / Touch ID |
| Android  | `@aparajita/capacitor-biometric-auth`        | Fingerprint / Face |
| Electron | `electron.safeStorage`                       | OS keychain        |

### 7.5 React Native / Capacitor Integration

```typescript
// src/lib/platform/native-crypto.ts

import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from '@capacitor-community/secure-storage-plugin'
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'

export class NativeCrypto {
  /**
   * Store a key securely using platform keychain
   */
  static async storeKey(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await SecureStoragePlugin.set({ key, value })
    } else {
      // Web fallback - use IndexedDB with encryption
      await webSecureStorage.set(key, value)
    }
  }

  /**
   * Retrieve a key from platform keychain
   */
  static async getKey(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await SecureStoragePlugin.get({ key })
        return result.value
      } catch {
        return null
      }
    } else {
      return webSecureStorage.get(key)
    }
  }

  /**
   * Check biometric availability
   */
  static async checkBiometric(): Promise<BiometricCapability> {
    if (Capacitor.isNativePlatform()) {
      const result = await BiometricAuth.checkBiometry()
      return {
        available: result.isAvailable,
        biometryType: result.biometryType,
        reason: result.reason,
      }
    }

    // Web: Check WebAuthn
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      return {
        available,
        biometryType: 'webauthn',
      }
    }

    return { available: false }
  }

  /**
   * Perform biometric authentication
   */
  static async authenticate(reason: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const result = await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
      })
      return result.success
    }

    // Web: Use WebAuthn
    return this.webAuthnAuthenticate(reason)
  }
}
```

---

## 8. Test Plan

### 8.1 Unit Tests for Crypto Operations

```typescript
// src/lib/e2ee/__tests__/crypto.test.ts

describe('Cryptographic Operations', () => {
  describe('Key Derivation', () => {
    it('derives consistent master key from password', async () => {
      const password = 'test-password-123'
      const salt = crypto.generateSalt()

      const key1 = await crypto.deriveMasterKey(password, salt)
      const key2 = await crypto.deriveMasterKey(password, salt)

      expect(key1).toEqual(key2)
      expect(key1.length).toBe(32)
    })

    it('produces different keys with different salts', async () => {
      const password = 'test-password-123'
      const salt1 = crypto.generateSalt()
      const salt2 = crypto.generateSalt()

      const key1 = await crypto.deriveMasterKey(password, salt1)
      const key2 = await crypto.deriveMasterKey(password, salt2)

      expect(key1).not.toEqual(key2)
    })

    it('uses correct number of PBKDF2 iterations', async () => {
      // Verify timing is consistent with 100k iterations
      const password = 'test-password-123'
      const salt = crypto.generateSalt()

      const start = performance.now()
      await crypto.deriveMasterKey(password, salt)
      const duration = performance.now() - start

      // Should take at least 50ms with 100k iterations
      expect(duration).toBeGreaterThan(50)
    })
  })

  describe('Symmetric Encryption', () => {
    it('encrypts and decrypts correctly', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key)
      const decrypted = await crypto.decryptAESGCM(ciphertext, key, iv)

      expect(decrypted).toEqual(plaintext)
    })

    it('produces different ciphertext with same plaintext', async () => {
      const key = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext: ct1 } = await crypto.encryptAESGCM(plaintext, key)
      const { ciphertext: ct2 } = await crypto.encryptAESGCM(plaintext, key)

      expect(ct1).not.toEqual(ct2)
    })

    it('fails to decrypt with wrong key', async () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)
      const plaintext = new Uint8Array([1, 2, 3, 4, 5])

      const { ciphertext, iv } = await crypto.encryptAESGCM(plaintext, key1)

      await expect(crypto.decryptAESGCM(ciphertext, key2, iv)).rejects.toThrow()
    })
  })

  describe('Safety Number Generation', () => {
    it('generates 60-digit safety number', () => {
      const localKey = crypto.generateRandomBytes(32)
      const remoteKey = crypto.generateRandomBytes(32)

      const safetyNumber = crypto.generateSafetyNumber(localKey, 'user-1', remoteKey, 'user-2')

      expect(safetyNumber.replace(/\s/g, '')).toHaveLength(60)
      expect(safetyNumber.replace(/\s/g, '')).toMatch(/^\d+$/)
    })

    it('produces same number regardless of order', () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)

      const sn1 = crypto.generateSafetyNumber(key1, 'user-a', key2, 'user-b')
      const sn2 = crypto.generateSafetyNumber(key2, 'user-b', key1, 'user-a')

      expect(sn1).toEqual(sn2)
    })

    it('produces different numbers for different keys', () => {
      const key1 = crypto.generateRandomBytes(32)
      const key2 = crypto.generateRandomBytes(32)
      const key3 = crypto.generateRandomBytes(32)

      const sn1 = crypto.generateSafetyNumber(key1, 'user-a', key2, 'user-b')
      const sn2 = crypto.generateSafetyNumber(key1, 'user-a', key3, 'user-b')

      expect(sn1).not.toEqual(sn2)
    })
  })
})
```

### 8.2 Integration Tests for Key Exchange

```typescript
// src/lib/e2ee/__tests__/key-exchange.test.ts

describe('X3DH Key Exchange', () => {
  let alice: TestUser
  let bob: TestUser

  beforeEach(async () => {
    alice = await createTestUser('alice')
    bob = await createTestUser('bob')
  })

  it('establishes session between two users', async () => {
    // Bob uploads prekey bundle
    await bob.e2eeManager.uploadDeviceKeys(bob.deviceKeys)

    // Alice initiates session
    await alice.sessionManager.createSession(bob.userId, bob.deviceId)

    // Verify session exists
    const hasSession = await alice.sessionManager.hasSession(bob.userId, bob.deviceId)
    expect(hasSession).toBe(true)
  })

  it('consumes one-time prekey on first message', async () => {
    const initialOPKCount = await bob.getOneTimePreKeyCount()

    await alice.sessionManager.createSession(bob.userId, bob.deviceId)

    const finalOPKCount = await bob.getOneTimePreKeyCount()
    expect(finalOPKCount).toBe(initialOPKCount - 1)
  })

  it('derives same shared secret on both sides', async () => {
    await alice.sessionManager.createSession(bob.userId, bob.deviceId)

    // Alice encrypts message
    const plaintext = 'Hello Bob!'
    const encrypted = await alice.sessionManager.encryptMessage(plaintext, bob.userId, bob.deviceId)

    // Bob decrypts (this establishes session on his side)
    const decrypted = await bob.sessionManager.decryptMessage(
      encrypted,
      alice.userId,
      alice.deviceId
    )

    expect(decrypted).toBe(plaintext)
  })

  it('works without one-time prekey', async () => {
    // Exhaust Bob's one-time prekeys
    await bob.exhaustOneTimePreKeys()

    // Alice should still be able to establish session
    await alice.sessionManager.createSession(bob.userId, bob.deviceId)

    const plaintext = 'Hello Bob!'
    const encrypted = await alice.sessionManager.encryptMessage(plaintext, bob.userId, bob.deviceId)
    const decrypted = await bob.sessionManager.decryptMessage(
      encrypted,
      alice.userId,
      alice.deviceId
    )

    expect(decrypted).toBe(plaintext)
  })
})
```

### 8.3 E2E Tests for Message Encryption

```typescript
// e2e/e2ee/message-encryption.spec.ts

import { test, expect } from '@playwright/test'

test.describe('E2EE Message Flow', () => {
  test('sends and receives encrypted message', async ({ page, context }) => {
    // Create two browser contexts for Alice and Bob
    const alicePage = await context.newPage()
    const bobPage = await context.newPage()

    // Sign in as Alice
    await alicePage.goto('/auth/signin')
    await alicePage.fill('[name="email"]', 'alice@test.com')
    await alicePage.fill('[name="password"]', 'password123')
    await alicePage.click('button[type="submit"]')

    // Initialize E2EE for Alice
    await alicePage.goto('/settings/security')
    await alicePage.click('text=Enable End-to-End Encryption')
    await alicePage.fill('[name="e2eePassword"]', 'e2ee-password-alice')
    await alicePage.click('text=Initialize')

    // Save recovery code
    const aliceRecoveryCode = await alicePage.textContent('[data-testid="recovery-code"]')
    expect(aliceRecoveryCode).toBeTruthy()
    await alicePage.click('text=I saved my recovery code')

    // Sign in as Bob and initialize E2EE
    await bobPage.goto('/auth/signin')
    await bobPage.fill('[name="email"]', 'bob@test.com')
    await bobPage.fill('[name="password"]', 'password123')
    await bobPage.click('button[type="submit"]')

    await bobPage.goto('/settings/security')
    await bobPage.click('text=Enable End-to-End Encryption')
    await bobPage.fill('[name="e2eePassword"]', 'e2ee-password-bob')
    await bobPage.click('text=Initialize')
    await bobPage.click('text=I saved my recovery code')

    // Alice sends message to Bob
    await alicePage.goto('/chat/dm/bob')
    await alicePage.fill('[data-testid="message-input"]', 'Hello Bob! This is encrypted.')
    await alicePage.click('[data-testid="send-button"]')

    // Verify encryption indicator
    await expect(alicePage.locator('[data-testid="encryption-indicator"]')).toBeVisible()

    // Bob receives and decrypts message
    await bobPage.goto('/chat/dm/alice')
    await expect(bobPage.locator('text=Hello Bob! This is encrypted.')).toBeVisible()
    await expect(bobPage.locator('[data-testid="encryption-indicator"]')).toBeVisible()

    // Bob replies
    await bobPage.fill('[data-testid="message-input"]', 'Hi Alice! Got your encrypted message.')
    await bobPage.click('[data-testid="send-button"]')

    // Alice sees reply
    await expect(alicePage.locator('text=Hi Alice! Got your encrypted message.')).toBeVisible()
  })

  test('verifies safety numbers', async ({ page, context }) => {
    // Setup Alice and Bob with E2EE (abbreviated)
    // ...

    // Open safety number verification on Alice's side
    await alicePage.goto('/chat/dm/bob')
    await alicePage.click('[data-testid="chat-menu"]')
    await alicePage.click('text=Verify Safety Number')

    const aliceSafetyNumber = await alicePage.textContent('[data-testid="safety-number"]')

    // Open on Bob's side
    await bobPage.goto('/chat/dm/alice')
    await bobPage.click('[data-testid="chat-menu"]')
    await bobPage.click('text=Verify Safety Number')

    const bobSafetyNumber = await bobPage.textContent('[data-testid="safety-number"]')

    // Verify they match
    expect(aliceSafetyNumber).toEqual(bobSafetyNumber)

    // Mark as verified
    await alicePage.click('text=Mark as Verified')
    await expect(alicePage.locator('[data-testid="verified-badge"]')).toBeVisible()
  })

  test('device lock protects encrypted data', async ({ page }) => {
    // Setup E2EE with device lock
    await page.goto('/settings/security')
    await page.click('text=Configure Device Lock')
    await page.click('text=PIN')
    await page.fill('[name="pin"]', '123456')
    await page.fill('[name="confirmPin"]', '123456')
    await page.click('text=Enable Device Lock')

    // Close and reopen app
    await page.goto('/')

    // Should show lock screen
    await expect(page.locator('[data-testid="pin-entry"]')).toBeVisible()

    // Enter wrong PIN
    await page.fill('[data-testid="pin-input"]', '000000')
    await page.click('text=Unlock')
    await expect(page.locator('text=Invalid PIN')).toBeVisible()

    // Enter correct PIN
    await page.fill('[data-testid="pin-input"]', '123456')
    await page.click('text=Unlock')

    // Should be unlocked
    await expect(page.locator('[data-testid="pin-entry"]')).not.toBeVisible()
  })
})
```

### 8.4 Test Coverage Requirements

| Component              | Minimum Coverage | Priority |
| ---------------------- | ---------------- | -------- |
| crypto.ts              | 100%             | Critical |
| signal-client.ts       | 100%             | Critical |
| key-manager.ts         | 100%             | Critical |
| session-manager.ts     | 95%              | High     |
| device-lock-manager.ts | 100%             | Critical |
| message-encryption.ts  | 95%              | High     |
| API routes             | 90%              | High     |
| React components       | 80%              | Medium   |

---

## 9. Implementation Phases

### Phase 1: Enable Existing Implementation (1 week)

**Tasks**:

1. Enable disabled API routes
2. Add comprehensive error handling
3. Add rate limiting
4. Write missing unit tests
5. Verify database schema

**Deliverables**:

- `/api/e2ee/initialize` enabled and tested
- `/api/e2ee/keys/replenish` enabled and tested
- `/api/e2ee/recover` enabled and tested
- `/api/e2ee/safety-number` enabled and tested
- 100% unit test coverage for crypto operations

### Phase 2: Device Lock Implementation (2 weeks)

**Tasks**:

1. Create database schema for device lock
2. Implement DeviceLockManager
3. Implement PIN verification flow
4. Implement biometric verification (Capacitor)
5. Implement wipe-on-failure logic
6. Create device lock UI components

**Deliverables**:

- `/api/e2ee/device-lock/verify` endpoint
- `/api/e2ee/device-lock/configure` endpoint
- `/api/e2ee/device-lock/wipe` endpoint
- Device lock React components
- 100% test coverage for device lock

### Phase 3: Multi-Device Support (1 week)

**Tasks**:

1. Implement device registry
2. Implement multi-device message encryption
3. Implement device linking flow
4. Add device management UI

**Deliverables**:

- Device registry in database
- Multi-device encryption working
- Device linking via QR code
- Device management settings page

### Phase 4: Safety Number Verification (1 week)

**Tasks**:

1. Implement QR code generation/scanning
2. Implement manual verification flow
3. Add verification status to chat UI
4. Add safety number change notifications

**Deliverables**:

- QR code verification working
- Manual comparison verification working
- Verification badges in UI
- Change notifications

### Phase 5: Security Hardening & Documentation (1 week)

**Tasks**:

1. Security audit of implementation
2. Document threat model
3. Document privacy guarantees
4. Performance optimization
5. Finalize documentation

**Deliverables**:

- Security audit report
- Threat model documentation
- Privacy guarantees documentation
- Performance benchmarks
- Complete documentation

---

## 10. Gap Analysis

### 10.1 Current Implementation vs TODO.md Requirements

| Task | Requirement                   | Current Status         | Gap                        |
| ---- | ----------------------------- | ---------------------- | -------------------------- |
| 78   | E2EE routes implemented       | Disabled routes exist  | Enable + test              |
| 79   | Secure key storage            | Basic implementation   | Add hardware security      |
| 80   | Forward secrecy + deniability | Implemented via Signal | Verify + document          |
| 81   | Safety number verification    | Basic implementation   | Add QR + UI                |
| 82   | Device lock policies          | Not implemented        | Full implementation needed |
| 83   | Encrypted local storage       | Basic implementation   | Enhance security           |
| 84   | Wipe/lockout policies         | Not implemented        | Full implementation needed |
| 85   | Threat model documentation    | Partial                | Complete documentation     |

### 10.2 Files to Modify/Create

**Enable (rename from `.disabled`)**:

- `src/app/api/e2ee/initialize/route.ts`
- `src/app/api/e2ee/keys/replenish/route.ts`
- `src/app/api/e2ee/recover/route.ts`
- `src/app/api/e2ee/safety-number/route.ts`

**Create**:

- `src/app/api/e2ee/device-lock/verify/route.ts`
- `src/app/api/e2ee/device-lock/configure/route.ts`
- `src/app/api/e2ee/device-lock/wipe/route.ts`
- `src/lib/e2ee/device-lock/device-lock-manager.ts`
- `src/lib/e2ee/storage/secure-key-storage.ts`
- `src/components/e2ee/DeviceLockScreen.tsx`
- `src/components/e2ee/PinEntry.tsx`
- `src/hooks/use-device-lock.ts`
- `.backend/migrations/XXX_device_lock.sql`

**Modify**:

- `src/lib/e2ee/index.ts` - Add device lock integration
- `src/lib/e2ee/key-manager.ts` - Enhance with secure storage
- `src/components/e2ee/SafetyNumberDisplay.tsx` - Add QR scanning
- `src/config/app-config.ts` - Add device lock settings

---

## References

- [Signal Protocol Specification](https://signal.org/docs/)
- [The Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
- [The X3DH Key Agreement Protocol](https://signal.org/docs/specifications/x3dh/)
- [@signalapp/libsignal-client GitHub](https://github.com/signalapp/libsignal)
- [@privacyresearch/libsignal-protocol-typescript](https://github.com/privacyresearchgroup/libsignal-protocol-typescript)
- [libsignal-protocol-javascript (deprecated)](https://github.com/signalapp/libsignal-protocol-javascript)

---

**Document Version**: 1.0.0
**Last Updated**: February 3, 2026
**Author**: AI Development Assistant
**Review Status**: Pending Security Review
