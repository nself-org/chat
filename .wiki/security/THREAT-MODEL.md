# nself-chat Platform Threat Model

**Version**: 1.0.0
**Date**: 2026-02-08
**Status**: Active
**Classification**: Internal

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Scope and Objectives](#scope-and-objectives)
3. [Asset Identification](#asset-identification)
4. [Threat Actors](#threat-actors)
5. [STRIDE Analysis](#stride-analysis)
6. [Attack Vectors](#attack-vectors)
7. [Threat Categories](#threat-categories)
8. [Mitigation Mapping](#mitigation-mapping)
9. [Gap Analysis](#gap-analysis)
10. [Remediation Backlog](#remediation-backlog)
11. [Review Schedule](#review-schedule)

---

## Executive Summary

This document provides a comprehensive threat model for the nself-chat platform, covering all attack surfaces across client, server, network, insider, and state-level scenarios. The platform is a white-label team communication application with end-to-end encryption capabilities, multi-platform support (Web, iOS, Android, Desktop), and extensive integration options.

### Key Findings

| Risk Level | Count | Status |
|------------|-------|--------|
| Critical | 3 | Mitigated |
| High | 7 | 5 Mitigated, 2 Partial |
| Medium | 12 | 9 Mitigated, 3 Partial |
| Low | 8 | All Mitigated |

### Security Posture Summary

- **End-to-End Encryption**: Signal Protocol implementation with Double Ratchet algorithm
- **Authentication**: Multi-factor authentication with TOTP and biometric support
- **Authorization**: Role-based access control (RBAC) with granular permissions
- **Input Validation**: Comprehensive sanitization with Zod schemas and DOMPurify
- **Network Security**: TLS 1.3, CSP, HSTS, and SSRF protection
- **Audit Logging**: Complete audit trail for security events

---

## Scope and Objectives

### In Scope

1. **Frontend Applications**
   - Next.js web application (PWA)
   - Capacitor mobile apps (iOS/Android)
   - Electron desktop application
   - Tauri desktop application (alternative)

2. **Backend Services**
   - Next.js API routes
   - Hasura GraphQL engine
   - Nhost authentication service
   - PostgreSQL database
   - MinIO object storage
   - Redis cache/sessions
   - MeiliSearch full-text search

3. **Communication Channels**
   - WebSocket real-time connections
   - GraphQL subscriptions
   - REST API endpoints
   - WebRTC for voice/video

4. **Third-Party Integrations**
   - OAuth providers (11 configured)
   - Payment processors (Stripe, Crypto)
   - AI services (OpenAI, Anthropic)
   - File storage (S3-compatible)

### Out of Scope

- Physical security of data centers
- Social engineering attacks on end users
- Attacks on third-party infrastructure
- Denial-of-service volumetric attacks

### Objectives

1. Identify all critical assets requiring protection
2. Enumerate potential threat actors and their capabilities
3. Analyze threats using STRIDE methodology
4. Map existing mitigations to threats
5. Identify security gaps and prioritize remediation
6. Create actionable remediation backlog

---

## Asset Identification

### Critical Assets (Tier 1)

| Asset | Description | Storage Location | Protection Level |
|-------|-------------|------------------|------------------|
| **User Credentials** | Passwords, OAuth tokens | PostgreSQL (hashed) | Critical |
| **Session Tokens** | JWT access/refresh tokens | Memory + Cookies | Critical |
| **E2EE Private Keys** | Signal Protocol identity keys | Encrypted IndexedDB | Critical |
| **Master Keys** | Password-derived encryption keys | Memory only | Critical |
| **Message Content** | Plaintext messages | Memory (client-side) | Critical |

### High-Value Assets (Tier 2)

| Asset | Description | Storage Location | Protection Level |
|-------|-------------|------------------|------------------|
| **Encrypted Messages** | E2EE message ciphertext | PostgreSQL | High |
| **File Attachments** | User-uploaded files | MinIO (encrypted) | High |
| **User Profiles** | PII, preferences | PostgreSQL | High |
| **2FA Secrets** | TOTP seeds, backup codes | PostgreSQL (encrypted) | High |
| **API Keys** | Integration credentials | Environment variables | High |
| **Audit Logs** | Security event records | PostgreSQL | High |

### Medium-Value Assets (Tier 3)

| Asset | Description | Storage Location | Protection Level |
|-------|-------------|------------------|------------------|
| **Message Metadata** | Timestamps, sender/recipient | PostgreSQL | Medium |
| **Channel Configuration** | Settings, permissions | PostgreSQL | Medium |
| **Search Indices** | MeiliSearch data | MeiliSearch | Medium |
| **Analytics Data** | Usage metrics | PostgreSQL | Medium |
| **Theme/Branding** | White-label config | PostgreSQL + Files | Medium |

### Low-Value Assets (Tier 4)

| Asset | Description | Storage Location | Protection Level |
|-------|-------------|------------------|------------------|
| **Public Keys** | E2EE public keys | PostgreSQL | Low |
| **Presence Data** | Online status | Redis | Low |
| **Read Receipts** | Message read status | PostgreSQL | Low |
| **Typing Indicators** | Real-time typing | Memory | Low |

---

## Threat Actors

### TA1: Script Kiddie

**Motivation**: Curiosity, vandalism, reputation
**Capability**: Low
**Resources**: Limited
**Persistence**: Low

**Attack Methods**:
- Automated vulnerability scanners
- Known exploit kits
- Credential stuffing
- Public exploit code

**Assets at Risk**: User accounts (weak passwords)

### TA2: Cybercriminal

**Motivation**: Financial gain
**Capability**: Medium to High
**Resources**: Moderate
**Persistence**: Medium

**Attack Methods**:
- Phishing campaigns
- Ransomware deployment
- Data exfiltration for sale
- Payment fraud
- Cryptomining injection

**Assets at Risk**: Payment data, user PII, credentials

### TA3: Insider Threat (Malicious)

**Motivation**: Financial gain, revenge, ideology
**Capability**: High (system access)
**Resources**: Internal access
**Persistence**: High

**Attack Methods**:
- Direct database access
- Log tampering
- Backdoor installation
- Data exfiltration
- Privilege abuse

**Assets at Risk**: All assets with access privileges

### TA4: Insider Threat (Negligent)

**Motivation**: None (accidental)
**Capability**: Variable
**Resources**: Internal access
**Persistence**: N/A

**Attack Methods**:
- Misconfiguration
- Credential exposure
- Social engineering victim
- Policy violations

**Assets at Risk**: Credentials, configuration, access tokens

### TA5: Competitor

**Motivation**: Business intelligence, disruption
**Capability**: Medium
**Resources**: Moderate to High
**Persistence**: Medium

**Attack Methods**:
- Corporate espionage
- Feature intelligence gathering
- Customer data theft
- DDoS disruption

**Assets at Risk**: Business logic, customer data, roadmaps

### TA6: Nation-State Actor

**Motivation**: Intelligence, surveillance, disruption
**Capability**: Very High
**Resources**: Unlimited
**Persistence**: Very High

**Attack Methods**:
- Zero-day exploits
- Advanced persistent threats (APT)
- Supply chain compromise
- Traffic analysis
- Compelled disclosure (legal)
- Physical access to infrastructure

**Assets at Risk**: All assets, particularly E2EE content

### TA7: Hacktivist

**Motivation**: Ideology, publicity
**Capability**: Medium
**Resources**: Moderate (collective)
**Persistence**: Event-driven

**Attack Methods**:
- DDoS attacks
- Defacement
- Data leaks
- Public shaming

**Assets at Risk**: Reputation, user data for leaks

---

## STRIDE Analysis

### S - Spoofing (Identity)

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| S1 | User impersonation via stolen credentials | Auth | Medium | High | High | Mitigated |
| S2 | Session hijacking via token theft | Auth | Low | High | Medium | Mitigated |
| S3 | OAuth token forgery | Auth | Low | High | Medium | Mitigated |
| S4 | Email spoofing for password reset | Auth | Medium | High | High | Partial |
| S5 | IP spoofing to bypass rate limits | API | Low | Medium | Low | Mitigated |
| S6 | Device impersonation (E2EE) | E2EE | Low | Critical | High | Mitigated |
| S7 | Bot account creation | Auth | Medium | Medium | Medium | Mitigated |

**Existing Mitigations**:
- S1: Bcrypt password hashing, rate limiting, 2FA available
- S2: HTTP-only secure cookies, short token expiry, CSRF protection
- S3: OAuth state parameter validation, token binding
- S4: SPF/DKIM/DMARC (partial - requires DNS config)
- S5: X-Forwarded-For validation, Cloudflare integration
- S6: Signal Protocol safety number verification
- S7: Email verification, CAPTCHA support

### T - Tampering

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| T1 | Message content modification | E2EE | Very Low | High | Low | Mitigated |
| T2 | Request parameter manipulation | API | Medium | Medium | Medium | Mitigated |
| T3 | Client-side data tampering | Frontend | High | Low | Medium | Mitigated |
| T4 | Database record modification | DB | Low | Critical | High | Mitigated |
| T5 | File upload replacement | Storage | Low | Medium | Medium | Mitigated |
| T6 | Audit log tampering | Audit | Low | High | Medium | Mitigated |
| T7 | Configuration tampering | Config | Low | High | Medium | Mitigated |

**Existing Mitigations**:
- T1: AES-256-GCM authenticated encryption
- T2: Server-side validation, Zod schemas
- T3: Server-authoritative state, input validation
- T4: Hasura permissions, parameterized queries
- T5: Signed URLs, checksum validation
- T6: Append-only audit, blockchain backup option
- T7: Environment variable isolation, secrets management

### R - Repudiation

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| R1 | Deny sending message | Messaging | Low | Medium | Low | Mitigated |
| R2 | Deny administrative action | Admin | Medium | High | Medium | Mitigated |
| R3 | Deny file upload | Files | Low | Low | Low | Mitigated |
| R4 | Deny payment transaction | Billing | Low | High | Medium | Mitigated |
| R5 | Deny access attempt | Auth | Medium | Medium | Medium | Mitigated |

**Existing Mitigations**:
- R1: Message history with timestamps, audit logs
- R2: Comprehensive admin audit logging
- R3: Upload audit trail with user attribution
- R4: Stripe transaction records, webhook logs
- R5: Failed login attempt logging, IP tracking

### I - Information Disclosure

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| I1 | E2EE key extraction | E2EE | Low | Critical | High | Mitigated |
| I2 | Message content leak (server) | E2EE | Very Low | Critical | Medium | Mitigated |
| I3 | User PII exposure | Profile | Medium | High | High | Partial |
| I4 | Credential exposure in logs | Logging | Low | Critical | High | Mitigated |
| I5 | API key exposure | Config | Low | Critical | High | Mitigated |
| I6 | Error message information leak | API | Medium | Medium | Medium | Mitigated |
| I7 | Metadata analysis | Traffic | High | Medium | High | Partial |
| I8 | Side-channel timing attack | Auth | Low | Medium | Low | Mitigated |
| I9 | File path traversal | Files | Low | High | Medium | Mitigated |

**Existing Mitigations**:
- I1: Encrypted IndexedDB, device lock, memory-only master key
- I2: End-to-end encryption, server never sees plaintext
- I3: RBAC, field-level permissions (privacy controls partial)
- I4: Secret scanner, PII redaction in logs
- I5: Environment variable isolation, .env exclusion
- I6: Generic error responses in production
- I7: TLS, but metadata minimization partial
- I8: Constant-time comparison functions
- I9: Path sanitization, filename validation

### D - Denial of Service

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| D1 | API rate limit exhaustion | API | Medium | Medium | Medium | Mitigated |
| D2 | WebSocket connection flood | Realtime | Medium | Medium | Medium | Mitigated |
| D3 | Large file upload abuse | Storage | Medium | Medium | Medium | Mitigated |
| D4 | GraphQL complexity attack | API | Medium | High | Medium | Mitigated |
| D5 | Search index exhaustion | Search | Low | Medium | Low | Mitigated |
| D6 | Message queue flooding | Messaging | Medium | Medium | Medium | Mitigated |
| D7 | Account enumeration | Auth | Medium | Low | Low | Mitigated |

**Existing Mitigations**:
- D1: Per-user and per-IP rate limiting
- D2: Connection limits, authentication required
- D3: File size limits, upload rate limiting
- D4: Query complexity limits, depth limits
- D5: Index size limits, result pagination
- D6: Message rate limiting per channel
- D7: Generic "check your email" responses

### E - Elevation of Privilege

| Threat ID | Description | Component | Likelihood | Impact | Risk | Status |
|-----------|-------------|-----------|------------|--------|------|--------|
| E1 | Role escalation | RBAC | Low | Critical | High | Mitigated |
| E2 | Channel permission bypass | Channels | Low | High | Medium | Mitigated |
| E3 | Admin panel unauthorized access | Admin | Low | Critical | High | Mitigated |
| E4 | GraphQL mutation abuse | API | Low | High | Medium | Mitigated |
| E5 | JWT claim manipulation | Auth | Very Low | Critical | Medium | Mitigated |
| E6 | IDOR on user resources | API | Medium | High | High | Mitigated |
| E7 | Cross-tenant data access | Multi-tenant | Low | Critical | High | Mitigated |

**Existing Mitigations**:
- E1: Server-enforced RBAC, permission inheritance
- E2: Channel-level permission checks
- E3: Role-based route guards, admin role required
- E4: Hasura permission rules, action handlers
- E5: JWT signature verification, short expiry
- E6: Owner/member checks on all resources
- E7: Tenant isolation at database level

---

## Attack Vectors

### AV1: Client-Side Attacks

#### XSS (Cross-Site Scripting)

**Attack Path**:
1. Attacker crafts malicious payload in message/profile
2. Payload renders in victim's browser
3. Script executes, stealing tokens/data

**Current Mitigations**:
- React automatic escaping
- DOMPurify for rich text
- Content Security Policy (CSP)
- HTTP-only cookies

**Residual Risk**: Low

#### CSRF (Cross-Site Request Forgery)

**Attack Path**:
1. Attacker hosts malicious page
2. Victim visits while authenticated
3. Forged request executes with victim's session

**Current Mitigations**:
- CSRF token validation (double-submit cookie)
- SameSite cookie attribute
- Origin header validation
- Referrer-Policy headers

**Residual Risk**: Very Low

#### Local Storage Attack

**Attack Path**:
1. Attacker gains XSS or physical access
2. Extracts localStorage/IndexedDB data
3. Decrypts E2EE keys if master key available

**Current Mitigations**:
- Encrypted storage for sensitive data
- Device lock (PIN/biometric)
- Memory-only master key
- Auto-lock on inactivity

**Residual Risk**: Low (with device lock)

### AV2: Server-Side Attacks

#### SQL Injection

**Attack Path**:
1. Attacker injects SQL in user input
2. Database executes malicious query
3. Data exfiltration or modification

**Current Mitigations**:
- Hasura parameterized queries
- Input validation with Zod
- Prepared statements
- No raw SQL execution

**Residual Risk**: Very Low

#### SSRF (Server-Side Request Forgery)

**Attack Path**:
1. Attacker provides malicious URL (link preview, webhook)
2. Server fetches internal resource
3. Cloud metadata or internal services exposed

**Current Mitigations**:
- URL validation and sanitization
- Private IP/localhost blocking
- DNS rebinding protection
- Cloud metadata IP blocking
- Request timeout limits

**Residual Risk**: Low

#### RCE (Remote Code Execution)

**Attack Path**:
1. Attacker exploits deserialization/injection
2. Arbitrary code executes on server
3. Full system compromise

**Current Mitigations**:
- No eval() or dynamic code execution
- File type validation for uploads
- Dependency scanning
- Container isolation

**Residual Risk**: Very Low

### AV3: Network Attacks

#### MITM (Man-in-the-Middle)

**Attack Path**:
1. Attacker intercepts network traffic
2. Decrypts or modifies in transit
3. Steals credentials or session tokens

**Current Mitigations**:
- TLS 1.3 enforcement
- HSTS with preload
- Certificate transparency
- E2EE for message content

**Residual Risk**: Very Low

#### Traffic Analysis

**Attack Path**:
1. Attacker observes encrypted traffic patterns
2. Correlates timing, size, frequency
3. Infers communication patterns

**Current Mitigations**:
- TLS encryption
- (Partial) Fixed-size message padding planned

**Residual Risk**: Medium

### AV4: Insider Threats

#### Rogue Administrator

**Attack Path**:
1. Admin abuses privileged access
2. Exports user data
3. Modifies permissions or logs

**Current Mitigations**:
- Comprehensive audit logging
- Separation of duties
- Admin action approval workflow (planned)
- Log tamper detection

**Residual Risk**: Medium

#### Data Exfiltration

**Attack Path**:
1. Insider with database access
2. Exports sensitive data
3. Sells or leaks externally

**Current Mitigations**:
- Role-based database access
- Query logging
- E2EE prevents message content access
- DLP controls (planned)

**Residual Risk**: Medium (for metadata)

### AV5: State/Legal Threats

#### Compelled Disclosure

**Attack Path**:
1. Legal order demands user data
2. Server operators must comply
3. Encrypted data provided to authorities

**Current Mitigations**:
- E2EE prevents plaintext disclosure
- Metadata minimization (partial)
- Transparency report (planned)
- Warrant canary (optional)

**Residual Risk**: Medium (metadata exposed)

#### Physical Seizure

**Attack Path**:
1. Authorities seize server hardware
2. Full database access obtained
3. Analysis of all stored data

**Current Mitigations**:
- Encryption at rest
- E2EE for messages
- Key material not on server
- Distributed infrastructure

**Residual Risk**: Low (for E2EE content)

---

## Threat Categories

### Category 1: Client-Side Threats

| ID | Threat | Attack Vector | Impact | Mitigations |
|----|--------|--------------|--------|-------------|
| C1.1 | XSS in messages | Message content injection | Session theft | DOMPurify, CSP, React escaping |
| C1.2 | XSS in profile | Bio/status injection | Credential theft | Input sanitization |
| C1.3 | Clickjacking | iframe embedding | Unintended actions | X-Frame-Options: DENY |
| C1.4 | Open redirect | Malicious link parameters | Phishing | URL validation, allowlist |
| C1.5 | Local data theft | Physical access | Key compromise | Device lock, encryption |
| C1.6 | Malicious browser extension | Extension injection | Full compromise | CSP, SRI |
| C1.7 | Cache poisoning | CDN manipulation | Malicious code delivery | SRI, cache validation |

### Category 2: Server-Side Threats

| ID | Threat | Attack Vector | Impact | Mitigations |
|----|--------|--------------|--------|-------------|
| S2.1 | SQL injection | User input | Data breach | Parameterized queries |
| S2.2 | NoSQL injection | GraphQL variables | Data breach | Schema validation |
| S2.3 | SSRF | URL parameters | Internal access | URL validation, IP blocking |
| S2.4 | File upload RCE | Malicious files | Server compromise | Type validation, scanning |
| S2.5 | Deserialization | Malformed data | RCE | Safe serialization |
| S2.6 | Path traversal | File paths | File access | Path sanitization |
| S2.7 | Command injection | Shell commands | RCE | No shell execution |

### Category 3: Network Threats

| ID | Threat | Attack Vector | Impact | Mitigations |
|----|--------|--------------|--------|-------------|
| N3.1 | MITM | Network interception | Data theft | TLS 1.3, HSTS |
| N3.2 | DNS spoofing | DNS hijacking | Phishing | DNSSEC, certificate pinning |
| N3.3 | Certificate attacks | Rogue CA | MITM | CT logs, pinning |
| N3.4 | Downgrade attacks | Protocol negotiation | Weak crypto | Strict TLS config |
| N3.5 | Traffic analysis | Passive monitoring | Pattern inference | Padding (planned) |
| N3.6 | WebSocket hijacking | Token theft | Session takeover | WSS, authentication |

### Category 4: Insider Threats

| ID | Threat | Attack Vector | Impact | Mitigations |
|----|--------|--------------|--------|-------------|
| I4.1 | Privilege abuse | Admin access | Data breach | Audit logging, RBAC |
| I4.2 | Data exfiltration | Database export | Privacy violation | Query monitoring |
| I4.3 | Log tampering | Log access | Cover tracks | Tamper-evident logs |
| I4.4 | Backdoor insertion | Code deployment | Persistent access | Code review, CI/CD |
| I4.5 | Credential sharing | Social | Unauthorized access | Individual credentials |
| I4.6 | Negligent exposure | Misconfiguration | Data leak | Security training |

### Category 5: State/Legal Threats

| ID | Threat | Attack Vector | Impact | Mitigations |
|----|--------|--------------|--------|-------------|
| L5.1 | Subpoena | Legal process | Data disclosure | E2EE, legal counsel |
| L5.2 | NSL | Secret legal order | Metadata disclosure | Warrant canary |
| L5.3 | CLOUD Act | Cross-border request | Data disclosure | Legal review |
| L5.4 | Server seizure | Physical access | Full database | Encryption at rest |
| L5.5 | Key disclosure | Legal compulsion | Decryption | Client-side keys |
| L5.6 | Regulatory fine | Compliance failure | Financial | Compliance program |

---

## Mitigation Mapping

### Authentication & Session Management

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| Bcrypt password hashing | S1, I4 | `src/services/auth/` |
| JWT with short expiry | S2, E5 | 15min access, 7day refresh |
| HTTP-only secure cookies | S2, C1 | Cookie configuration |
| CSRF tokens | CSRF attacks | `src/lib/security/csrf.ts` |
| Rate limiting | D1, S1 | `src/lib/security/rate-limiter.ts` |
| 2FA (TOTP) | S1 | `src/lib/security/two-factor.ts` |
| Biometric auth | S1 | `src/lib/security/biometric.ts` |
| Device lock | C1.5, I1 | `src/lib/security/pin.ts` |

### Input Validation & Sanitization

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| Zod schema validation | T2, S2 | `src/lib/security/input-validation.ts` |
| DOMPurify sanitization | C1.1, C1.2 | HTML content |
| URL validation | SSRF, C1.4 | `src/lib/security/ssrf-protection.ts` |
| File type validation | S2.4 | `src/middleware/security-headers.ts` |
| GraphQL query limits | D4 | Hasura configuration |
| Filename sanitization | S2.6 | Path traversal prevention |

### Encryption & Key Management

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| E2EE (Signal Protocol) | I2, L5.1, L5.5 | `src/lib/e2ee/` |
| TLS 1.3 | N3.1, N3.4 | Server configuration |
| HSTS | N3.1 | Security headers |
| AES-256-GCM | T1 | Message encryption |
| PBKDF2 key derivation | I1 | `src/lib/e2ee/crypto.ts` |
| Encrypted storage | C1.5 | IndexedDB encryption |

### Access Control

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| RBAC | E1, E2, E3 | `src/lib/rbac/` |
| Resource ownership checks | E6 | API handlers |
| Tenant isolation | E7 | Database schema |
| Hasura permissions | E4, T4 | GraphQL layer |
| Channel permissions | E2 | Channel service |

### Monitoring & Audit

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| Audit logging | R1-R5, I4.1 | `src/lib/audit/` |
| RBAC audit logging | I4.1 | `src/lib/rbac/audit-logger.ts` |
| Security event logging | All | `src/lib/security/` |
| Failed login tracking | S1 | Session store |
| Secret scanning | I4, I5 | `src/lib/security/secret-scanner.ts` |

### Security Headers

| Control | Threats Mitigated | Implementation |
|---------|-------------------|----------------|
| CSP | C1.1, C1.6 | `src/middleware/security-headers.ts` |
| X-Frame-Options | C1.3 | Security headers |
| X-Content-Type-Options | Type sniffing | Security headers |
| Referrer-Policy | Information leak | Security headers |
| Permissions-Policy | Browser features | Security headers |

---

## Gap Analysis

### Critical Gaps

| Gap ID | Description | Risk Level | Remediation Priority |
|--------|-------------|------------|---------------------|
| G1 | No admin action approval workflow | High | P1 |
| G2 | Limited DLP controls | Medium | P2 |
| G3 | Incomplete metadata minimization | Medium | P2 |

### High-Priority Gaps

| Gap ID | Description | Risk Level | Remediation Priority |
|--------|-------------|------------|---------------------|
| G4 | SPF/DKIM/DMARC not enforced | Medium | P1 |
| G5 | No message padding for traffic analysis | Medium | P2 |
| G6 | Certificate pinning not implemented | Low | P3 |
| G7 | No transparency report | Low | P3 |

### Medium-Priority Gaps

| Gap ID | Description | Risk Level | Remediation Priority |
|--------|-------------|------------|---------------------|
| G8 | Hardware security key support limited | Low | P3 |
| G9 | No warrant canary | Low | P3 |
| G10 | Client-side backup encryption manual | Low | P3 |

---

## Remediation Backlog

### P1 - Critical (0-30 days)

| ID | Gap | Task | Effort | Owner |
|----|-----|------|--------|-------|
| REM-001 | G1 | Implement admin action approval workflow | 40h | Security |
| REM-002 | G4 | Document SPF/DKIM/DMARC requirements | 8h | DevOps |
| REM-003 | - | Complete security audit | 80h | External |

### P2 - High (30-90 days)

| ID | Gap | Task | Effort | Owner |
|----|-----|------|--------|-------|
| REM-004 | G2 | Implement basic DLP controls | 60h | Security |
| REM-005 | G3 | Reduce metadata collection | 40h | Backend |
| REM-006 | G5 | Implement message padding | 24h | E2EE |
| REM-007 | - | Penetration testing | 40h | External |

### P3 - Medium (90-180 days)

| ID | Gap | Task | Effort | Owner |
|----|-----|------|--------|-------|
| REM-008 | G6 | Certificate pinning for mobile | 16h | Mobile |
| REM-009 | G7 | Publish transparency report | 16h | Legal |
| REM-010 | G8 | WebAuthn hardware key support | 24h | Auth |
| REM-011 | G9 | Implement warrant canary | 8h | Legal |
| REM-012 | G10 | Encrypted backup system | 40h | E2EE |

---

## Review Schedule

| Review Type | Frequency | Next Scheduled | Owner |
|-------------|-----------|----------------|-------|
| Threat model update | Quarterly | 2026-05-08 | Security Team |
| Penetration testing | Annually | 2026-Q2 | External Vendor |
| Dependency audit | Weekly (automated) | Continuous | CI/CD |
| Access review | Quarterly | 2026-05-08 | Admin |
| Incident review | After each incident | As needed | Security Team |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-08 | Security Team | Initial threat model |

**Classification**: Internal
**Distribution**: Security Team, Development Team, Leadership
**Review Cycle**: Quarterly

---

## References

- [E2EE Threat Model](./E2EE-THREAT-MODEL.md)
- [Security Policy](./SECURITY.md)
- [Security Audit Report](./SECURITY-AUDIT.md)
- [Data Flow Diagram](./DATA-FLOW.md)
- [Security Controls Inventory](./SECURITY-CONTROLS.md)
