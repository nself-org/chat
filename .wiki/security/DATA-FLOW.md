# nself-chat Data Flow Diagrams

**Version**: 1.0.0
**Date**: 2026-02-08
**Status**: Active

---

## Table of Contents

1. [Overview](#overview)
2. [System Context](#system-context)
3. [Trust Boundaries](#trust-boundaries)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Data Classifications](#data-classifications)
6. [Data Stores](#data-stores)
7. [External Entities](#external-entities)

---

## Overview

This document provides data flow diagrams (DFDs) for the nself-chat platform, identifying trust boundaries, data stores, and external entities for security analysis.

---

## System Context

```
                                    ┌──────────────────────────────────────────────────────────────┐
                                    │                    EXTERNAL ENTITIES                          │
                                    │                                                               │
                                    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
                                    │  │  OAuth  │  │ Payment │  │   AI    │  │   CDN/Storage   │ │
                                    │  │Providers│  │Providers│  │Services │  │   Providers     │ │
                                    │  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
                                    └───────┼────────────┼────────────┼────────────────┼──────────┘
                                            │            │            │                │
                                            │            │            │                │
┌───────────────────────────────────────────┼────────────┼────────────┼────────────────┼───────────┐
│                                           ▼            ▼            ▼                ▼           │
│                            ┌─────────────────────────────────────────────────────────────────┐   │
│                            │                     NSELF-CHAT PLATFORM                          │   │
│  ┌───────────────────┐     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │                   │     │  │   Next.js   │  │   Hasura    │  │      Backend Services   │  │   │
│  │   Web Browser     │◄───►│  │  Frontend   │◄─┤  GraphQL    │◄─┤  (Auth, Storage, etc.)  │  │   │
│  │   (PWA)           │     │  │  + API      │  │   Engine    │  │                         │  │   │
│  │                   │     │  └─────────────┘  └──────┬──────┘  └────────────┬────────────┘  │   │
│  └───────────────────┘     │                          │                      │               │   │
│                            │                          ▼                      │               │   │
│  ┌───────────────────┐     │              ┌───────────────────┐              │               │   │
│  │   Mobile Apps     │◄───►│              │    PostgreSQL     │◄─────────────┘               │   │
│  │  (iOS/Android)    │     │              │     Database      │                              │   │
│  └───────────────────┘     │              └───────────────────┘                              │   │
│                            │                                                                  │   │
│  ┌───────────────────┐     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │   Desktop Apps    │◄───►│  │   Redis     │  │ MeiliSearch │  │       MinIO            │  │   │
│  │ (Electron/Tauri)  │     │  │   Cache     │  │   Search    │  │   Object Storage       │  │   │
│  └───────────────────┘     │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│                            │                                                                  │   │
│                            └─────────────────────────────────────────────────────────────────┘   │
│                                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                                    ▼              ▼              ▼
                            ┌───────────┐  ┌───────────┐  ┌───────────┐
                            │ Monitoring│  │  Logging  │  │  Backup   │
                            │  (Sentry) │  │ (Grafana) │  │  Systems  │
                            └───────────┘  └───────────┘  └───────────┘
```

---

## Trust Boundaries

### TB1: Public Internet Boundary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UNTRUSTED ZONE                                  │
│                           (Public Internet)                                  │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   Attacker  │  │   Bot Net   │  │   Scrapers  │  │   Legitimate Users  ││
│  │             │  │             │  │             │  │                     ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘│
│         │                │                │                     │           │
└─────────┼────────────────┼────────────────┼─────────────────────┼───────────┘
          │                │                │                     │
          │                │                │                     │
══════════╪════════════════╪════════════════╪═════════════════════╪═══════════
          │   TRUST BOUNDARY 1 (TB1)        │                     │
          │   - TLS termination             │                     │
          │   - Rate limiting               │                     │
          │   - WAF (optional)              │                     │
══════════╪════════════════╪════════════════╪═════════════════════╪═══════════
          │                │                │                     │
          ▼                ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DMZ / EDGE ZONE                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Load Balancer / Reverse Proxy                   │ │
│  │                                   (Nginx)                               │ │
│  │  - TLS termination                                                      │ │
│  │  - Request routing                                                      │ │
│  │  - Rate limiting                                                        │ │
│  │  - Security headers injection                                           │ │
│  └─────────────────────────────────────┬──────────────────────────────────┘ │
│                                        │                                     │
└────────────────────────────────────────┼─────────────────────────────────────┘
                                         │
```

### TB2: Application Boundary

```
══════════════════════════════════════════╪═══════════════════════════════════
                                          │
          TRUST BOUNDARY 2 (TB2)          │
          - Authentication required       │
          - CSRF validation               │
          - Input validation              │
                                          │
══════════════════════════════════════════╪═══════════════════════════════════
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION ZONE                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Next.js Application                              ││
│  │                                                                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  ││
│  │  │   Frontend      │  │   API Routes    │  │   Middleware            │  ││
│  │  │   (React)       │  │   (Server)      │  │   (Auth, CSRF, etc.)    │  ││
│  │  │                 │  │                 │  │                         │  ││
│  │  │ - CSP enforced  │  │ - Input valid.  │  │ - JWT verification      │  ││
│  │  │ - XSS sanitized │  │ - Auth checks   │  │ - Rate limiting         │  ││
│  │  │ - CSRF tokens   │  │ - RBAC enforce  │  │ - Security headers      │  ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────┬────────────────────────────────────┘
                                          │
```

### TB3: Data Layer Boundary

```
══════════════════════════════════════════╪═══════════════════════════════════
                                          │
          TRUST BOUNDARY 3 (TB3)          │
          - Hasura permissions            │
          - Row-level security            │
          - Parameterized queries         │
                                          │
══════════════════════════════════════════╪═══════════════════════════════════
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA ZONE                                       │
│                                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────────────────────┐ │
│  │     Hasura GraphQL     │  │              PostgreSQL                     │ │
│  │                        │  │                                             │ │
│  │ - Permission rules     │  │  - Encrypted at rest                       │ │
│  │ - Row-level security   │  │  - TLS connections                         │ │
│  │ - Query validation     │  │  - Parameterized queries                   │ │
│  │ - Rate limiting        │  │  - Audit logging                           │ │
│  └────────────────────────┘  └────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────────────────────┐ │
│  │       Redis            │  │              MinIO Storage                  │ │
│  │                        │  │                                             │ │
│  │ - Session storage      │  │  - Signed URLs                             │ │
│  │ - Cache (ephemeral)    │  │  - Access policies                         │ │
│  │ - Rate limit counters  │  │  - Encryption at rest                      │ │
│  └────────────────────────┘  └────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### TB4: Client Device Boundary

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT DEVICE ZONE                                  │
│                           (User's Device)                                     │
│                                                                               │
│  ═══════════════════════════════════════════════════════════════════════════ │
│              TRUST BOUNDARY 4 (TB4) - Device Security                         │
│              - Device lock (PIN/biometric)                                    │
│              - Encrypted storage                                              │
│              - Memory protection                                              │
│  ═══════════════════════════════════════════════════════════════════════════ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        E2EE Protected Zone                               │ │
│  │                                                                          │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐ │ │
│  │  │  Master Key      │  │  Private Keys    │  │  Decrypted Messages    │ │ │
│  │  │  (Memory Only)   │  │  (Encrypted DB)  │  │  (Memory Only)         │ │ │
│  │  │                  │  │                  │  │                        │ │ │
│  │  │  NEVER persisted │  │  AES-256-GCM     │  │  Rendered in DOM       │ │ │
│  │  │  to storage      │  │  encrypted       │  │  Never stored          │ │ │
│  │  └──────────────────┘  └──────────────────┘  └────────────────────────┘ │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Encrypted Storage                                 │ │
│  │                                                                          │ │
│  │  IndexedDB with encrypted keys:                                          │ │
│  │  - Identity keys (encrypted)                                             │ │
│  │  - Session keys (encrypted)                                              │ │
│  │  - Prekeys (encrypted)                                                   │ │
│  │  - Cached encrypted messages                                             │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### DFD Level 0: System Context

```
                                        ┌───────────────┐
                                        │  End Users    │
                                        │  (Browsers,   │
                                        │   Mobile,     │
                                        │   Desktop)    │
                                        └───────┬───────┘
                                                │
                                                │ HTTPS/WSS
                                                │ (Encrypted)
                                                │
                                                ▼
┌───────────────┐      ┌───────────────────────────────────────┐      ┌───────────────┐
│               │      │                                       │      │               │
│    OAuth      │◄────►│           nself-chat                  │◄────►│   Payment     │
│   Providers   │      │           Platform                    │      │   Providers   │
│               │ OAuth│                                       │ Stripe│               │
│   (Google,    │ 2.0  │   - Messaging                         │ API  │   (Stripe,    │
│    GitHub,    │      │   - Voice/Video                       │      │    Crypto)    │
│    etc.)      │      │   - File Sharing                      │      │               │
│               │      │   - Authentication                    │      │               │
└───────────────┘      │   - Authorization                     │      └───────────────┘
                       │                                       │
                       └───────────────────┬───────────────────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
                       ▼                   ▼                   ▼
               ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
               │     AI        │   │   Storage     │   │   Email       │
               │   Services    │   │  (S3/MinIO)   │   │   Provider    │
               │               │   │               │   │               │
               │  (OpenAI,     │   │  Files,       │   │  (Resend,     │
               │   Anthropic)  │   │  Media        │   │   SendGrid)   │
               └───────────────┘   └───────────────┘   └───────────────┘
```

### DFD Level 1: Core Application

```
                                    ┌────────────────┐
                                    │    User        │
                                    └───────┬────────┘
                                            │
            ┌───────────────────────────────┼───────────────────────────────┐
            │                               │                               │
            ▼                               ▼                               ▼
    ┌───────────────┐              ┌───────────────┐              ┌───────────────┐
    │   [1.0]       │              │   [2.0]       │              │   [3.0]       │
    │ Authentication│              │  Messaging    │              │  Media        │
    │   Process     │              │   Process     │              │   Process     │
    │               │              │               │              │               │
    │ - Login       │              │ - Send/Recv   │              │ - Upload      │
    │ - Register    │              │ - E2EE        │              │ - Download    │
    │ - 2FA         │              │ - Threads     │              │ - Stream      │
    │ - OAuth       │              │ - Reactions   │              │ - Transcode   │
    └───────┬───────┘              └───────┬───────┘              └───────┬───────┘
            │                               │                               │
            │                               │                               │
            ▼                               ▼                               ▼
    ┌───────────────────────────────────────────────────────────────────────────┐
    │                               [DB]                                         │
    │                           PostgreSQL                                       │
    │                                                                            │
    │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
    │  │ Users   │  │Messages │  │Channels │  │ Files   │  │ Audit Logs      │ │
    │  │         │  │(E2EE)   │  │         │  │ Meta    │  │                 │ │
    │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
    │                                                                            │
    └────────────────────────────────────────────────────────────────────────────┘

Legend:
    [X.0] = Process
    [DB]  = Data Store
    ───►  = Data Flow
```

### DFD Level 2: Authentication Flow

```
                            ┌────────────────┐
                            │     User       │
                            └───────┬────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │ Credentials             │ OAuth Token             │
          ▼                         ▼                         ▼
  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
  │   [1.1]       │        │   [1.2]       │        │   [1.3]       │
  │   Login       │        │   OAuth       │        │   2FA         │
  │   Handler     │        │   Handler     │        │   Handler     │
  │               │        │               │        │               │
  │ - Validate    │        │ - Redirect    │        │ - TOTP verify │
  │ - Rate limit  │        │ - Callback    │        │ - Backup code │
  │ - Bcrypt      │        │ - Token       │        │ - Biometric   │
  └───────┬───────┘        └───────┬───────┘        └───────┬───────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                                   ▼
                          ┌───────────────┐
                          │   [1.4]       │
                          │   Session     │
                          │   Manager     │
                          │               │
                          │ - JWT issue   │
                          │ - Refresh     │
                          │ - Revoke      │
                          └───────┬───────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
  │  [Users DB]   │      │ [Sessions     │      │ [Audit Log]   │
  │               │      │  Store]       │      │               │
  │ - Credentials │      │ - Redis       │      │ - Login events│
  │ - 2FA secrets │      │ - JWT tokens  │      │ - Failed auth │
  │ - Preferences │      │ - Sessions    │      │ - IP tracking │
  └───────────────┘      └───────────────┘      └───────────────┘

Data Flow Security:
  - All connections use TLS
  - Passwords: bcrypt hashed (never stored plaintext)
  - 2FA secrets: AES-256 encrypted at rest
  - JWTs: Short-lived (15min), signed with RS256
  - Refresh tokens: HTTP-only, secure cookies
```

### DFD Level 2: E2EE Message Flow

```
                ┌────────────────┐                    ┌────────────────┐
                │   Sender       │                    │   Recipient    │
                │   Device       │                    │   Device       │
                └───────┬────────┘                    └───────▲────────┘
                        │                                     │
                        │ Plaintext                           │ Plaintext
                        │ Message                             │ Message
                        │                                     │
                        ▼                                     │
                ┌───────────────┐                     ┌───────────────┐
                │   [2.1]       │                     │   [2.4]       │
                │   Encrypt     │                     │   Decrypt     │
                │   (Client)    │                     │   (Client)    │
                │               │                     │               │
                │ - X3DH/Ratchet│                     │ - X3DH/Ratchet│
                │ - AES-GCM     │                     │ - AES-GCM     │
                │ - Message key │                     │ - Message key │
                └───────┬───────┘                     └───────▲───────┘
                        │                                     │
                        │ Ciphertext                          │ Ciphertext
                        │ + Envelope                          │ + Envelope
                        │                                     │
                        ▼                                     │
                ┌───────────────┐                     ┌───────────────┐
                │   [2.2]       │                     │   [2.3]       │
                │   Send        │────────────────────►│   Receive     │
                │   (Server)    │    Encrypted        │   (Server)    │
                │               │    Message          │               │
                │ - Store       │    (Opaque)         │ - Deliver     │
                │ - Route       │                     │ - Queue       │
                │ - Log meta    │                     │ - Notify      │
                └───────┬───────┘                     └───────┬───────┘
                        │                                     │
                        │                                     │
                        ▼                                     ▼
                ┌─────────────────────────────────────────────────┐
                │                [Messages DB]                     │
                │                                                  │
                │   ┌─────────────┐  ┌──────────────────────────┐ │
                │   │  Encrypted  │  │  Metadata (NOT encrypted)│ │
                │   │  Content    │  │  - Sender ID             │ │
                │   │  (Opaque)   │  │  - Recipient ID          │ │
                │   │             │  │  - Timestamp             │ │
                │   │  Server     │  │  - Channel ID            │ │
                │   │  cannot     │  │  - Message ID            │ │
                │   │  decrypt    │  │                          │ │
                │   └─────────────┘  └──────────────────────────┘ │
                │                                                  │
                └──────────────────────────────────────────────────┘

Trust Boundaries:
  ════════════════════════════════════════════════════════════════
  │ CLIENT TRUST ZONE │                        │ CLIENT TRUST ZONE │
  │                   │ ◄── Untrusted Server ──► │                   │
  │  - Plaintext      │    (Cannot access       │  - Plaintext      │
  │  - Private keys   │     content)            │  - Private keys   │
  │  - Session keys   │                         │  - Session keys   │
  ════════════════════════════════════════════════════════════════
```

### DFD Level 2: File Upload Flow

```
                            ┌────────────────┐
                            │     User       │
                            └───────┬────────┘
                                    │
                                    │ File
                                    │
                                    ▼
                           ┌───────────────┐
                           │   [3.1]       │
                           │   Validate    │
                           │               │
                           │ - Type check  │
                           │ - Size check  │
                           │ - Malware scan│
                           │ - Sanitize    │
                           └───────┬───────┘
                                   │
                                   │ Validated
                                   │ File
                                   ▼
                           ┌───────────────┐
                           │   [3.2]       │
                           │   Process     │
                           │               │
                           │ - Thumbnail   │
                           │ - Transcode   │
                           │ - Optimize    │
                           │ - Strip EXIF  │
                           └───────┬───────┘
                                   │
                                   │ Processed
                                   │ File
                                   ▼
                           ┌───────────────┐
                           │   [3.3]       │
                           │   Encrypt     │
                           │   (Optional)  │
                           │               │
                           │ - E2EE key    │
                           │ - AES-256     │
                           └───────┬───────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
  ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
  │  [MinIO]      │       │  [Files DB]   │       │  [Audit Log]  │
  │               │       │               │       │               │
  │ - Blob store  │       │ - Metadata    │       │ - Upload event│
  │ - Encryption  │       │ - User ID     │       │ - File ID     │
  │ - Signed URLs │       │ - Permissions │       │ - Timestamp   │
  └───────────────┘       └───────────────┘       └───────────────┘

Security Controls:
  - File type whitelist (images, docs, media)
  - Maximum file size enforced
  - EXIF metadata stripped (privacy)
  - Signed URLs with expiry
  - Virus scanning (ClamAV)
  - Content-Type validation
```

---

## Data Classifications

### Classification Levels

| Level | Name | Description | Examples |
|-------|------|-------------|----------|
| L1 | **Restricted** | Most sensitive, E2EE protected | Plaintext messages, private keys |
| L2 | **Confidential** | User PII, requires authentication | Passwords, 2FA secrets, profiles |
| L3 | **Internal** | Business data, limited access | Audit logs, analytics, config |
| L4 | **Public** | No sensitivity | Public channels, app branding |

### Data Classification Matrix

| Data Type | Classification | Encryption | Access Control | Retention |
|-----------|---------------|------------|----------------|-----------|
| E2EE Private Keys | L1 | AES-256 (client) | Device owner only | User-controlled |
| Message Plaintext | L1 | Memory only | E2EE protected | Never stored |
| User Passwords | L2 | Bcrypt hash | System only | Account lifetime |
| 2FA Secrets | L2 | AES-256 | User + system | Account lifetime |
| Session Tokens | L2 | Memory/Cookie | User session | 7 days |
| User Profiles | L2 | TLS in transit | RBAC | Account lifetime |
| Encrypted Messages | L3 | E2EE ciphertext | Sender/recipient | Configurable |
| Audit Logs | L3 | Encryption at rest | Admin only | 90 days |
| Analytics | L3 | Encryption at rest | Admin only | 1 year |
| Channel Config | L3 | Encryption at rest | RBAC | Permanent |
| Public Keys | L4 | None | Public | Account lifetime |
| App Branding | L4 | None | Public | Permanent |

---

## Data Stores

### DS1: PostgreSQL (Primary Database)

| Table | Data Classification | Encryption | Backup |
|-------|---------------------|------------|--------|
| nchat_users | L2 | At rest | Daily |
| nchat_messages | L3 (E2EE ciphertext) | At rest + E2EE | Daily |
| nchat_channels | L3 | At rest | Daily |
| nchat_files | L3 | At rest | Daily |
| nchat_audit_logs | L3 | At rest | Daily |
| nchat_sessions | L2 | At rest | None |
| app_configuration | L3 | At rest | Daily |

### DS2: Redis (Cache/Sessions)

| Key Pattern | Data Classification | TTL | Purpose |
|-------------|---------------------|-----|---------|
| session:* | L2 | 7 days | User sessions |
| rate:* | L4 | 1 minute | Rate limiting |
| presence:* | L4 | 5 minutes | User presence |
| cache:* | L3-L4 | Variable | Application cache |

### DS3: MinIO (Object Storage)

| Bucket | Data Classification | Access | Encryption |
|--------|---------------------|--------|------------|
| uploads | L3 | Signed URLs | Server-side |
| avatars | L4 | Public (with CDN) | Server-side |
| attachments | L3 | Signed URLs | Server-side + E2EE |
| exports | L2 | User-specific | Server-side |

### DS4: Client Storage (IndexedDB)

| Store | Data Classification | Encryption | Sync |
|-------|---------------------|------------|------|
| identity_keys | L1 | AES-256 (master key) | Never |
| session_keys | L1 | AES-256 (master key) | Never |
| prekeys | L1 | AES-256 (master key) | Partial |
| messages_cache | L1 (ciphertext) | E2EE | On demand |
| settings | L3 | None | On demand |

---

## External Entities

### EE1: OAuth Providers

| Provider | Data Received | Data Sent | Security |
|----------|---------------|-----------|----------|
| Google | User ID, email, name | OAuth code | OAuth 2.0, TLS |
| GitHub | User ID, email | OAuth code | OAuth 2.0, TLS |
| Microsoft | User ID, email | OAuth code | OAuth 2.0, TLS |
| Apple | User ID | OAuth code | Sign in with Apple |
| ID.me | User ID, verification | OAuth code | OAuth 2.0, verified identity |

### EE2: Payment Providers

| Provider | Data Received | Data Sent | Security |
|----------|---------------|-----------|----------|
| Stripe | Payment status | Customer ID, Plan | PCI DSS, TLS |
| Crypto (ETH) | Transaction hash | Wallet address | Blockchain |

### EE3: AI Services

| Provider | Data Received | Data Sent | Security |
|----------|---------------|-----------|----------|
| OpenAI | AI response | User prompt | TLS, API key |
| Anthropic | AI response | User prompt | TLS, API key |

**Note**: AI services receive user-provided prompts which may contain sensitive content. E2EE messages are NOT sent to AI services without explicit user action.

### EE4: Infrastructure Providers

| Provider | Purpose | Data Access | Security |
|----------|---------|-------------|----------|
| Vercel/Netlify | Hosting | Application code | TLS, SOC 2 |
| AWS/GCP | Infrastructure | All (encrypted) | SOC 2, ISO 27001 |
| Cloudflare | CDN/WAF | Traffic metadata | SOC 2 |
| Sentry | Error tracking | Errors, sanitized | TLS, data scrubbing |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-08 | Security Team | Initial data flow documentation |

**Classification**: Internal
**Related Documents**: [THREAT-MODEL.md](./THREAT-MODEL.md), [SECURITY-CONTROLS.md](./SECURITY-CONTROLS.md)
