# nself-chat Security Controls Inventory

**Version**: 1.0.0
**Date**: 2026-02-08
**Status**: Active

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Controls](#authentication-controls)
3. [Authorization Controls](#authorization-controls)
4. [Encryption Controls](#encryption-controls)
5. [Input Validation Controls](#input-validation-controls)
6. [Network Security Controls](#network-security-controls)
7. [Monitoring and Audit Controls](#monitoring-and-audit-controls)
8. [Session Management Controls](#session-management-controls)
9. [File Security Controls](#file-security-controls)
10. [API Security Controls](#api-security-controls)
11. [Infrastructure Controls](#infrastructure-controls)
12. [Compliance Controls](#compliance-controls)
13. [Control Effectiveness Matrix](#control-effectiveness-matrix)

---

## Overview

This document provides a comprehensive inventory of all security controls implemented in the nself-chat platform, organized by category with implementation details and effectiveness assessments.

### Control Categories

| Category | Count | Effectiveness |
|----------|-------|---------------|
| Authentication | 14 | High |
| Authorization | 11 | High |
| Encryption | 12 | High |
| Input Validation | 10 | High |
| Network Security | 9 | High |
| Monitoring/Audit | 8 | Medium-High |
| Session Management | 7 | High |
| File Security | 8 | Medium-High |
| API Security | 9 | High |
| Infrastructure | 7 | Medium |
| Compliance | 6 | Medium-High |

**Total Controls**: 101

---

## Authentication Controls

### AC-01: Password Hashing

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-01 |
| **Name** | Password Hashing |
| **Implementation** | bcrypt with cost factor 12 |
| **Location** | `src/services/auth/` |
| **NIST Control** | IA-5 |
| **Threats Mitigated** | S1, I4 |
| **Status** | Implemented |

```typescript
// Implementation reference
import bcrypt from 'bcrypt'
const hash = await bcrypt.hash(password, 12)
```

### AC-02: Multi-Factor Authentication (TOTP)

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-02 |
| **Name** | TOTP-based 2FA |
| **Implementation** | RFC 6238 compliant |
| **Location** | `src/lib/security/two-factor.ts` |
| **NIST Control** | IA-2(1) |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

### AC-03: Biometric Authentication

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-03 |
| **Name** | WebAuthn Biometrics |
| **Implementation** | FIDO2/WebAuthn |
| **Location** | `src/lib/security/biometric.ts` |
| **NIST Control** | IA-2(12) |
| **Threats Mitigated** | S1, C1.5 |
| **Status** | Implemented |

### AC-04: Device Lock (PIN)

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-04 |
| **Name** | PIN Lock System |
| **Implementation** | Salted hash with lockout |
| **Location** | `src/lib/security/pin.ts` |
| **NIST Control** | AC-11 |
| **Threats Mitigated** | C1.5, I1 |
| **Status** | Implemented |

### AC-05: OAuth 2.0 Integration

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-05 |
| **Name** | OAuth 2.0 Providers |
| **Implementation** | 11 configured providers |
| **Location** | `src/lib/auth/oauth-providers.ts` |
| **NIST Control** | IA-8 |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

**Configured Providers**:
- Google
- GitHub
- Microsoft
- Apple
- Discord
- Slack
- Twitter
- Facebook
- LinkedIn
- Twitch
- ID.me

### AC-06: Password Strength Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-06 |
| **Name** | Password Strength Requirements |
| **Implementation** | Zod schema with regex |
| **Location** | `src/lib/security/input-validation.ts` |
| **NIST Control** | IA-5(1) |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

**Requirements**:
- Minimum 8 characters
- Uppercase letter required
- Lowercase letter required
- Number required
- Special character required

### AC-07: Account Lockout

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-07 |
| **Name** | Failed Login Lockout |
| **Implementation** | Progressive delays |
| **Location** | `src/lib/security/rate-limiter.ts` |
| **NIST Control** | AC-7 |
| **Threats Mitigated** | S1, D1 |
| **Status** | Implemented |

**Configuration**:
- 5 attempts per 15 minutes
- Progressive delay after failures
- Account lockout after repeated failures

### AC-08: Backup Codes

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-08 |
| **Name** | 2FA Backup Codes |
| **Implementation** | Single-use recovery codes |
| **Location** | `src/lib/2fa/backup-codes.ts` |
| **NIST Control** | IA-5(13) |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

### AC-09: Magic Link Authentication

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-09 |
| **Name** | Passwordless Auth |
| **Implementation** | Time-limited email tokens |
| **Location** | `src/app/api/auth/magic-link/route.ts` |
| **NIST Control** | IA-5 |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

### AC-10: Email Verification

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-10 |
| **Name** | Email Verification |
| **Implementation** | Signed verification tokens |
| **Location** | `src/app/api/auth/verify-email/route.ts` |
| **NIST Control** | IA-5 |
| **Threats Mitigated** | S7 |
| **Status** | Implemented |

### AC-11: Password Reset Flow

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-11 |
| **Name** | Secure Password Reset |
| **Implementation** | Time-limited tokens |
| **Location** | `src/app/api/auth/password-reset/route.ts` |
| **NIST Control** | IA-5 |
| **Threats Mitigated** | S4 |
| **Status** | Implemented |

### AC-12: SSO/SAML Support

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-12 |
| **Name** | Enterprise SSO |
| **Implementation** | SAML 2.0 |
| **Location** | `src/services/auth/sso.service.ts` |
| **NIST Control** | IA-8 |
| **Threats Mitigated** | S1 |
| **Status** | Implemented |

### AC-13: Session Invalidation

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-13 |
| **Name** | Session Revocation |
| **Implementation** | Token blacklisting |
| **Location** | `src/lib/security/session.ts` |
| **NIST Control** | AC-12 |
| **Threats Mitigated** | S2 |
| **Status** | Implemented |

### AC-14: Device Registration

| Attribute | Value |
|-----------|-------|
| **Control ID** | AC-14 |
| **Name** | Trusted Device Management |
| **Implementation** | Device fingerprinting |
| **Location** | `src/lib/2fa/device-fingerprint.ts` |
| **NIST Control** | IA-3 |
| **Threats Mitigated** | S1, S6 |
| **Status** | Implemented |

---

## Authorization Controls

### AZ-01: Role-Based Access Control

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-01 |
| **Name** | RBAC System |
| **Implementation** | 5-tier role hierarchy |
| **Location** | `src/lib/rbac/` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E1, E3 |
| **Status** | Implemented |

**Role Hierarchy**:
1. Owner - Full permissions
2. Admin - User/channel management
3. Moderator - Content moderation
4. Member - Standard access
5. Guest - Read-only

### AZ-02: Permission-Based Access

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-02 |
| **Name** | Granular Permissions |
| **Implementation** | ~50 distinct permissions |
| **Location** | `src/lib/rbac/permissions.ts` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E1, E2 |
| **Status** | Implemented |

### AZ-03: Channel-Level Permissions

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-03 |
| **Name** | Channel Permission Overrides |
| **Implementation** | Per-channel role overrides |
| **Location** | `src/services/channels/` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E2 |
| **Status** | Implemented |

### AZ-04: Resource Ownership Checks

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-04 |
| **Name** | IDOR Prevention |
| **Implementation** | Server-side ownership validation |
| **Location** | All API routes |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E6 |
| **Status** | Implemented |

### AZ-05: Hasura Permission Rules

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-05 |
| **Name** | GraphQL Authorization |
| **Implementation** | Row-level security |
| **Location** | Hasura metadata |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E4, T4 |
| **Status** | Implemented |

### AZ-06: Tenant Isolation

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-06 |
| **Name** | Multi-Tenant Separation |
| **Implementation** | Database-level isolation |
| **Location** | Database schema |
| **NIST Control** | AC-4 |
| **Threats Mitigated** | E7 |
| **Status** | Implemented |

### AZ-07: Admin Route Protection

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-07 |
| **Name** | Admin Panel Access |
| **Implementation** | Role-based middleware |
| **Location** | `src/app/admin/` |
| **NIST Control** | AC-6(5) |
| **Threats Mitigated** | E3 |
| **Status** | Implemented |

### AZ-08: API Key Scoping

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-08 |
| **Name** | Bot/API Key Permissions |
| **Implementation** | Scoped access tokens |
| **Location** | `src/lib/api/bot-auth.ts` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E1 |
| **Status** | Implemented |

### AZ-09: Permission Inheritance

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-09 |
| **Name** | Hierarchical Permissions |
| **Implementation** | Role hierarchy with inheritance |
| **Location** | `src/lib/rbac/permission-builder.ts` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E1 |
| **Status** | Implemented |

### AZ-10: Least Privilege Enforcement

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-10 |
| **Name** | Minimal Access Default |
| **Implementation** | Deny-by-default policy |
| **Location** | All authorization checks |
| **NIST Control** | AC-6 |
| **Threats Mitigated** | E1, E2 |
| **Status** | Implemented |

### AZ-11: Time-Based Access

| Attribute | Value |
|-----------|-------|
| **Control ID** | AZ-11 |
| **Name** | Temporary Permissions |
| **Implementation** | Expiring role assignments |
| **Location** | `src/lib/rbac/` |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | E1 |
| **Status** | Implemented |

---

## Encryption Controls

### EN-01: End-to-End Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-01 |
| **Name** | Signal Protocol E2EE |
| **Implementation** | X3DH + Double Ratchet |
| **Location** | `src/lib/e2ee/` |
| **NIST Control** | SC-8, SC-13 |
| **Threats Mitigated** | I2, L5.1, L5.5 |
| **Status** | Implemented |

### EN-02: Message Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-02 |
| **Name** | AES-256-GCM Encryption |
| **Implementation** | Authenticated encryption |
| **Location** | `src/lib/e2ee/crypto.ts` |
| **NIST Control** | SC-13 |
| **Threats Mitigated** | T1, I2 |
| **Status** | Implemented |

### EN-03: Key Derivation

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-03 |
| **Name** | PBKDF2 Key Derivation |
| **Implementation** | 100,000 iterations |
| **Location** | `src/lib/e2ee/crypto.ts` |
| **NIST Control** | SC-13 |
| **Threats Mitigated** | I1 |
| **Status** | Implemented |

### EN-04: TLS Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-04 |
| **Name** | Transport Layer Security |
| **Implementation** | TLS 1.3 |
| **Location** | Server configuration |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | N3.1, N3.4 |
| **Status** | Implemented |

### EN-05: Database Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-05 |
| **Name** | Encryption at Rest |
| **Implementation** | PostgreSQL encryption |
| **Location** | Database configuration |
| **NIST Control** | SC-28 |
| **Threats Mitigated** | L5.4 |
| **Status** | Implemented |

### EN-06: File Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-06 |
| **Name** | Storage Encryption |
| **Implementation** | MinIO server-side encryption |
| **Location** | MinIO configuration |
| **NIST Control** | SC-28 |
| **Threats Mitigated** | L5.4 |
| **Status** | Implemented |

### EN-07: Client-Side Key Storage

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-07 |
| **Name** | Encrypted IndexedDB |
| **Implementation** | AES-256 encrypted storage |
| **Location** | `src/lib/e2ee/encrypted-storage.ts` |
| **NIST Control** | SC-28 |
| **Threats Mitigated** | C1.5, I1 |
| **Status** | Implemented |

### EN-08: Safety Number Verification

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-08 |
| **Name** | Identity Verification |
| **Implementation** | Fingerprint comparison |
| **Location** | `src/lib/e2ee/` |
| **NIST Control** | IA-9 |
| **Threats Mitigated** | S6 |
| **Status** | Implemented |

### EN-09: Forward Secrecy

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-09 |
| **Name** | Perfect Forward Secrecy |
| **Implementation** | Double Ratchet algorithm |
| **Location** | `src/lib/encryption/ratchet.ts` |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | I1, I2 |
| **Status** | Implemented |

### EN-10: Prekey Bundle

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-10 |
| **Name** | One-Time Prekeys |
| **Implementation** | X3DH prekey bundles |
| **Location** | `src/lib/encryption/prekey.ts` |
| **NIST Control** | SC-13 |
| **Threats Mitigated** | I2 |
| **Status** | Implemented |

### EN-11: Session Key Management

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-11 |
| **Name** | E2EE Session Management |
| **Implementation** | Per-device sessions |
| **Location** | `src/lib/e2ee/session-manager.ts` |
| **NIST Control** | SC-12 |
| **Threats Mitigated** | I1, I2 |
| **Status** | Implemented |

### EN-12: Remote Wipe

| Attribute | Value |
|-----------|-------|
| **Control ID** | EN-12 |
| **Name** | Device Key Wipe |
| **Implementation** | Remote key deletion |
| **Location** | `src/lib/e2ee/device-lock.ts` |
| **NIST Control** | MP-6 |
| **Threats Mitigated** | C1.5, I1 |
| **Status** | Implemented |

---

## Input Validation Controls

### IV-01: Zod Schema Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-01 |
| **Name** | Schema-Based Validation |
| **Implementation** | Zod schemas for all inputs |
| **Location** | `src/lib/security/input-validation.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | T2, S2 |
| **Status** | Implemented |

### IV-02: HTML Sanitization

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-02 |
| **Name** | XSS Prevention |
| **Implementation** | DOMPurify sanitization |
| **Location** | `src/lib/security/input-validation.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | C1.1, C1.2 |
| **Status** | Implemented |

### IV-03: URL Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-03 |
| **Name** | SSRF Prevention |
| **Implementation** | URL parsing and validation |
| **Location** | `src/lib/security/ssrf-protection.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.3 |
| **Status** | Implemented |

### IV-04: Private IP Blocking

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-04 |
| **Name** | Internal Network Protection |
| **Implementation** | IP range validation |
| **Location** | `src/lib/security/ssrf-protection.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.3 |
| **Status** | Implemented |

### IV-05: DNS Rebinding Protection

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-05 |
| **Name** | DNS Cache Pinning |
| **Implementation** | DNS resolution caching |
| **Location** | `src/lib/security/ssrf-protection.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.3, N3.2 |
| **Status** | Implemented |

### IV-06: Filename Sanitization

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-06 |
| **Name** | Path Traversal Prevention |
| **Implementation** | Filename character filtering |
| **Location** | `src/lib/security/input-validation.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.6 |
| **Status** | Implemented |

### IV-07: SQL Identifier Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-07 |
| **Name** | SQL Injection Prevention |
| **Implementation** | Identifier whitelist |
| **Location** | `src/lib/security/input-validation.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.1 |
| **Status** | Implemented |

### IV-08: GraphQL Query Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-08 |
| **Name** | Query Complexity Limits |
| **Implementation** | Hasura depth/complexity limits |
| **Location** | Hasura configuration |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | D4 |
| **Status** | Implemented |

### IV-09: File Type Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-09 |
| **Name** | MIME Type Whitelist |
| **Implementation** | Extension and MIME validation |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.4 |
| **Status** | Implemented |

### IV-10: Text Encoding Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | IV-10 |
| **Name** | UTF-8 Normalization |
| **Implementation** | Input encoding validation |
| **Location** | Input processing |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | C1.1 |
| **Status** | Implemented |

---

## Network Security Controls

### NS-01: Content Security Policy

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-01 |
| **Name** | CSP Headers |
| **Implementation** | Strict CSP with nonces |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-18 |
| **Threats Mitigated** | C1.1, C1.6 |
| **Status** | Implemented |

### NS-02: HSTS

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-02 |
| **Name** | HTTP Strict Transport Security |
| **Implementation** | 1-year max-age with preload |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | N3.1, N3.4 |
| **Status** | Implemented |

### NS-03: X-Frame-Options

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-03 |
| **Name** | Clickjacking Prevention |
| **Implementation** | SAMEORIGIN directive |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-18 |
| **Threats Mitigated** | C1.3 |
| **Status** | Implemented |

### NS-04: CORS Configuration

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-04 |
| **Name** | Cross-Origin Resource Sharing |
| **Implementation** | Explicit origin whitelist |
| **Location** | API middleware |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | C1 |
| **Status** | Implemented |

### NS-05: Referrer Policy

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-05 |
| **Name** | Referrer Leak Prevention |
| **Implementation** | strict-origin-when-cross-origin |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-7 |
| **Threats Mitigated** | I6 |
| **Status** | Implemented |

### NS-06: WebSocket Security

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-06 |
| **Name** | WSS Authentication |
| **Implementation** | Token-based WS auth |
| **Location** | `src/services/realtime/` |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | N3.6 |
| **Status** | Implemented |

### NS-07: Rate Limiting

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-07 |
| **Name** | Request Rate Limits |
| **Implementation** | Per-user and per-IP limits |
| **Location** | `src/lib/security/rate-limiter.ts` |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D1, D2 |
| **Status** | Implemented |

### NS-08: IP Blocking

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-08 |
| **Name** | IP Blacklist/Whitelist |
| **Implementation** | Configurable IP lists |
| **Location** | `src/lib/security/ip-blocker.ts` |
| **NIST Control** | SC-7 |
| **Threats Mitigated** | D1 |
| **Status** | Implemented |

### NS-09: Permissions Policy

| Attribute | Value |
|-----------|-------|
| **Control ID** | NS-09 |
| **Name** | Browser Feature Control |
| **Implementation** | Restrictive feature policy |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-18 |
| **Threats Mitigated** | C1 |
| **Status** | Implemented |

---

## Monitoring and Audit Controls

### MA-01: Audit Logging

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-01 |
| **Name** | Security Event Logging |
| **Implementation** | Comprehensive audit trail |
| **Location** | `src/lib/audit/audit-logger.ts` |
| **NIST Control** | AU-2 |
| **Threats Mitigated** | R1-R5 |
| **Status** | Implemented |

### MA-02: RBAC Audit Logging

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-02 |
| **Name** | Permission Change Logging |
| **Implementation** | Role/permission audit trail |
| **Location** | `src/lib/rbac/audit-logger.ts` |
| **NIST Control** | AU-2 |
| **Threats Mitigated** | I4.1, R2 |
| **Status** | Implemented |

### MA-03: Failed Login Tracking

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-03 |
| **Name** | Authentication Event Logging |
| **Implementation** | Login attempt recording |
| **Location** | `src/lib/security/session-store.ts` |
| **NIST Control** | AU-2 |
| **Threats Mitigated** | S1, R5 |
| **Status** | Implemented |

### MA-04: Secret Scanning

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-04 |
| **Name** | Credential Detection |
| **Implementation** | Pattern-based scanning |
| **Location** | `src/lib/security/secret-scanner.ts` |
| **NIST Control** | AU-13 |
| **Threats Mitigated** | I4, I5 |
| **Status** | Implemented |

### MA-05: Sensitive Field Masking

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-05 |
| **Name** | PII Redaction in Logs |
| **Implementation** | Automatic field masking |
| **Location** | `src/lib/audit/audit-logger.ts` |
| **NIST Control** | AU-3 |
| **Threats Mitigated** | I4 |
| **Status** | Implemented |

### MA-06: Error Tracking

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-06 |
| **Name** | Sentry Integration |
| **Implementation** | Error and performance monitoring |
| **Location** | `src/lib/sentry-utils.ts` |
| **NIST Control** | AU-6 |
| **Threats Mitigated** | Multiple |
| **Status** | Implemented |

### MA-07: CSP Violation Reporting

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-07 |
| **Name** | CSP Report Endpoint |
| **Implementation** | Violation logging |
| **Location** | `src/app/api/csp-report/route.ts` |
| **NIST Control** | AU-2 |
| **Threats Mitigated** | C1 |
| **Status** | Implemented |

### MA-08: Security Alerts

| Attribute | Value |
|-----------|-------|
| **Control ID** | MA-08 |
| **Name** | Real-Time Security Alerts |
| **Implementation** | Configurable alerting |
| **Location** | `src/lib/security/` |
| **NIST Control** | SI-4 |
| **Threats Mitigated** | Multiple |
| **Status** | Implemented |

---

## Session Management Controls

### SM-01: JWT Token Management

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-01 |
| **Name** | Short-Lived Access Tokens |
| **Implementation** | 15-minute JWT expiry |
| **Location** | Auth configuration |
| **NIST Control** | AC-12 |
| **Threats Mitigated** | S2 |
| **Status** | Implemented |

### SM-02: Refresh Token Rotation

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-02 |
| **Name** | Token Rotation |
| **Implementation** | 7-day refresh with rotation |
| **Location** | Auth configuration |
| **NIST Control** | AC-12 |
| **Threats Mitigated** | S2 |
| **Status** | Implemented |

### SM-03: Secure Cookie Flags

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-03 |
| **Name** | Cookie Security |
| **Implementation** | HttpOnly, Secure, SameSite |
| **Location** | Cookie configuration |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | S2, C1 |
| **Status** | Implemented |

### SM-04: CSRF Protection

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-04 |
| **Name** | CSRF Token Validation |
| **Implementation** | Double-submit cookie |
| **Location** | `src/lib/security/csrf.ts` |
| **NIST Control** | SC-23 |
| **Threats Mitigated** | CSRF |
| **Status** | Implemented |

### SM-05: Session Timeout

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-05 |
| **Name** | Inactivity Timeout |
| **Implementation** | Configurable timeout |
| **Location** | `src/lib/security/session.ts` |
| **NIST Control** | AC-11 |
| **Threats Mitigated** | S2, C1.5 |
| **Status** | Implemented |

### SM-06: Concurrent Session Control

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-06 |
| **Name** | Multi-Session Management |
| **Implementation** | Session listing and revocation |
| **Location** | `src/lib/security/session-store.ts` |
| **NIST Control** | AC-10 |
| **Threats Mitigated** | S2 |
| **Status** | Implemented |

### SM-07: Auto-Lock on Background

| Attribute | Value |
|-----------|-------|
| **Control ID** | SM-07 |
| **Name** | App Lock on Minimize |
| **Implementation** | Visibility-based locking |
| **Location** | `src/lib/security/session.ts` |
| **NIST Control** | AC-11 |
| **Threats Mitigated** | C1.5 |
| **Status** | Implemented |

---

## File Security Controls

### FS-01: File Type Whitelist

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-01 |
| **Name** | Allowed File Types |
| **Implementation** | Extension and MIME whitelist |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SI-3 |
| **Threats Mitigated** | S2.4 |
| **Status** | Implemented |

### FS-02: File Size Limits

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-02 |
| **Name** | Maximum File Size |
| **Implementation** | 100MB default limit |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D3 |
| **Status** | Implemented |

### FS-03: Virus Scanning

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-03 |
| **Name** | Malware Detection |
| **Implementation** | ClamAV integration |
| **Location** | `src/services/files/virus-scanner.service.ts` |
| **NIST Control** | SI-3 |
| **Threats Mitigated** | S2.4 |
| **Status** | Implemented |

### FS-04: EXIF Stripping

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-04 |
| **Name** | Metadata Removal |
| **Implementation** | Sharp.js EXIF removal |
| **Location** | `src/services/files/processing.service.ts` |
| **NIST Control** | SC-28 |
| **Threats Mitigated** | I |
| **Status** | Implemented |

### FS-05: Signed URLs

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-05 |
| **Name** | Time-Limited Access |
| **Implementation** | Presigned S3 URLs |
| **Location** | MinIO configuration |
| **NIST Control** | AC-3 |
| **Threats Mitigated** | I |
| **Status** | Implemented |

### FS-06: Upload Rate Limiting

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-06 |
| **Name** | Upload Frequency Limits |
| **Implementation** | 50 uploads/hour |
| **Location** | `src/lib/security/rate-limiter.ts` |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D3 |
| **Status** | Implemented |

### FS-07: Content-Type Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-07 |
| **Name** | MIME/Extension Match |
| **Implementation** | Cross-validation |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | S2.4 |
| **Status** | Implemented |

### FS-08: Executable Blocking

| Attribute | Value |
|-----------|-------|
| **Control ID** | FS-08 |
| **Name** | Dangerous File Rejection |
| **Implementation** | Extension blocklist |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SI-3 |
| **Threats Mitigated** | S2.4 |
| **Status** | Implemented |

---

## API Security Controls

### API-01: Authentication Required

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-01 |
| **Name** | API Authentication |
| **Implementation** | JWT/API key required |
| **Location** | API middleware |
| **NIST Control** | IA-2 |
| **Threats Mitigated** | E |
| **Status** | Implemented |

### API-02: Input Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-02 |
| **Name** | Request Validation |
| **Implementation** | Zod schema validation |
| **Location** | All API routes |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | T2, S2 |
| **Status** | Implemented |

### API-03: Error Handling

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-03 |
| **Name** | Safe Error Responses |
| **Implementation** | Generic error messages |
| **Location** | API error handler |
| **NIST Control** | SI-11 |
| **Threats Mitigated** | I6 |
| **Status** | Implemented |

### API-04: Pagination

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-04 |
| **Name** | Result Set Limits |
| **Implementation** | Default and max limits |
| **Location** | All list endpoints |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D |
| **Status** | Implemented |

### API-05: Request Size Limits

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-05 |
| **Name** | Body Size Limits |
| **Implementation** | 10MB default limit |
| **Location** | Server configuration |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D |
| **Status** | Implemented |

### API-06: API Versioning

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-06 |
| **Name** | Version Management |
| **Implementation** | URL-based versioning |
| **Location** | API routes |
| **NIST Control** | CM-3 |
| **Threats Mitigated** | - |
| **Status** | Implemented |

### API-07: Timeout Configuration

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-07 |
| **Name** | Request Timeouts |
| **Implementation** | 30-second default |
| **Location** | Server configuration |
| **NIST Control** | SC-5 |
| **Threats Mitigated** | D |
| **Status** | Implemented |

### API-08: Webhook Validation

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-08 |
| **Name** | Webhook Signature Verification |
| **Implementation** | HMAC signature checking |
| **Location** | `src/lib/integrations/webhook-handler.ts` |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | T |
| **Status** | Implemented |

### API-09: GraphQL Security

| Attribute | Value |
|-----------|-------|
| **Control ID** | API-09 |
| **Name** | GraphQL Hardening |
| **Implementation** | Depth/complexity limits |
| **Location** | Hasura configuration |
| **NIST Control** | SI-10 |
| **Threats Mitigated** | D4 |
| **Status** | Implemented |

---

## Infrastructure Controls

### IF-01: Container Security

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-01 |
| **Name** | Docker Hardening |
| **Implementation** | Non-root user, readonly |
| **Location** | Dockerfile |
| **NIST Control** | CM-6 |
| **Threats Mitigated** | S2 |
| **Status** | Implemented |

### IF-02: Secret Management

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-02 |
| **Name** | Environment Variables |
| **Implementation** | Vault/env isolation |
| **Location** | Deployment configuration |
| **NIST Control** | SC-28 |
| **Threats Mitigated** | I5 |
| **Status** | Implemented |

### IF-03: Dependency Scanning

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-03 |
| **Name** | Vulnerability Scanning |
| **Implementation** | npm audit, Snyk |
| **Location** | CI/CD pipeline |
| **NIST Control** | RA-5 |
| **Threats Mitigated** | Multiple |
| **Status** | Implemented |

### IF-04: Security Headers

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-04 |
| **Name** | HTTP Security Headers |
| **Implementation** | Comprehensive header set |
| **Location** | `src/middleware/security-headers.ts` |
| **NIST Control** | SC-8 |
| **Threats Mitigated** | C1, N3 |
| **Status** | Implemented |

### IF-05: Production Security Check

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-05 |
| **Name** | Environment Validation |
| **Implementation** | Startup security assertions |
| **Location** | `src/lib/security/index.ts` |
| **NIST Control** | CM-6 |
| **Threats Mitigated** | Multiple |
| **Status** | Implemented |

### IF-06: Backup Encryption

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-06 |
| **Name** | Encrypted Backups |
| **Implementation** | AES-256 encrypted backups |
| **Location** | Backup configuration |
| **NIST Control** | CP-9 |
| **Threats Mitigated** | L5.4 |
| **Status** | Implemented |

### IF-07: Health Monitoring

| Attribute | Value |
|-----------|-------|
| **Control ID** | IF-07 |
| **Name** | Service Health Checks |
| **Implementation** | Kubernetes probes |
| **Location** | K8s manifests |
| **NIST Control** | SI-4 |
| **Threats Mitigated** | D |
| **Status** | Implemented |

---

## Compliance Controls

### CP-01: GDPR Data Export

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-01 |
| **Name** | Data Portability |
| **Implementation** | User data export |
| **Location** | `src/lib/compliance/data-export.ts` |
| **NIST Control** | - |
| **Regulation** | GDPR Art. 20 |
| **Status** | Implemented |

### CP-02: Right to Erasure

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-02 |
| **Name** | Data Deletion |
| **Implementation** | Account deletion with purge |
| **Location** | `src/lib/compliance/data-deletion.ts` |
| **NIST Control** | - |
| **Regulation** | GDPR Art. 17 |
| **Status** | Implemented |

### CP-03: Consent Management

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-03 |
| **Name** | Privacy Consent |
| **Implementation** | Consent tracking |
| **Location** | `src/lib/compliance/consent-manager.ts` |
| **NIST Control** | - |
| **Regulation** | GDPR Art. 7 |
| **Status** | Implemented |

### CP-04: Data Retention

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-04 |
| **Name** | Retention Policy |
| **Implementation** | Configurable retention |
| **Location** | `src/lib/compliance/retention-policy.ts` |
| **NIST Control** | SI-12 |
| **Regulation** | Multiple |
| **Status** | Implemented |

### CP-05: Privacy Analytics

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-05 |
| **Name** | Privacy-Aware Analytics |
| **Implementation** | PII filtering |
| **Location** | `src/lib/analytics/privacy-filter.ts` |
| **NIST Control** | - |
| **Regulation** | Multiple |
| **Status** | Implemented |

### CP-06: Compliance Reporting

| Attribute | Value |
|-----------|-------|
| **Control ID** | CP-06 |
| **Name** | Compliance Reports |
| **Implementation** | Automated reporting |
| **Location** | `src/lib/compliance/compliance-report.ts` |
| **NIST Control** | AU-6 |
| **Regulation** | Multiple |
| **Status** | Implemented |

---

## Control Effectiveness Matrix

| Category | Implemented | Planned | Effectiveness |
|----------|-------------|---------|---------------|
| Authentication | 14/14 | 0 | 100% |
| Authorization | 11/11 | 0 | 100% |
| Encryption | 12/12 | 0 | 100% |
| Input Validation | 10/10 | 0 | 100% |
| Network Security | 9/9 | 0 | 100% |
| Monitoring/Audit | 8/8 | 0 | 100% |
| Session Management | 7/7 | 0 | 100% |
| File Security | 8/8 | 0 | 100% |
| API Security | 9/9 | 0 | 100% |
| Infrastructure | 7/7 | 0 | 100% |
| Compliance | 6/6 | 0 | 100% |
| **TOTAL** | **101/101** | **0** | **100%** |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-08 | Security Team | Initial security controls inventory |

**Classification**: Internal
**Review Cycle**: Quarterly
**Related Documents**: [THREAT-MODEL.md](./THREAT-MODEL.md), [DATA-FLOW.md](./DATA-FLOW.md)
