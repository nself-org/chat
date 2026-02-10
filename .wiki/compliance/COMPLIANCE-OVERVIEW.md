# Compliance & Data Retention System

**Version:** 0.5.0
**Last Updated:** January 30, 2026

## Overview

The nChat platform includes comprehensive compliance features to meet GDPR, CCPA, HIPAA, and SOC 2 requirements. This document provides an overview of the compliance system architecture, features, and implementation details.

## Table of Contents

1. [Compliance Standards](#compliance-standards)
2. [Architecture](#architecture)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Configuration](#configuration)
7. [Best Practices](#best-practices)

## Compliance Standards

### GDPR (General Data Protection Regulation)

**Status:** Implemented ✓
**Scope:** EU residents' personal data
**Key Features:**

- Right to Access (Article 15)
- Right to Rectification (Article 16)
- Right to Erasure / "Right to be Forgotten" (Article 17)
- Right to Restriction of Processing (Article 18)
- Right to Data Portability (Article 20)
- Right to Object (Article 21)
- Consent Management
- Privacy by Design
- Data Processing Records (Article 30)
- Breach Notification (72 hours)

**Implementation:**

- Data export API (`/api/compliance/export`)
- Data deletion API (`/api/compliance/deletion`)
- Consent management API (`/api/compliance/consent`)
- Cookie consent banner component
- GDPR compliance assessment helper
- Audit logging for all data access

### CCPA (California Consumer Privacy Act)

**Status:** Implemented ✓
**Scope:** California residents' personal information
**Key Features:**

- Right to Know
- Right to Delete
- Right to Opt-Out
- Right to Non-Discrimination
- Notice at Collection

**Implementation:**

- Similar to GDPR implementation
- CCPA-specific compliance helpers
- "Do Not Sell My Personal Information" option

### HIPAA (Health Insurance Portability and Accountability Act)

**Status:** Conditionally Implemented ✓
**Scope:** Protected Health Information (PHI)
**Applicability:** Only if platform handles healthcare data

**Key Features:**

- Privacy Rule compliance
- Security Rule (Administrative, Physical, Technical Safeguards)
- Breach Notification Rule
- Business Associate Agreements (BAA)
- Audit Controls
- Access Controls
- Encryption at Rest and in Transit

**Implementation:**

- HIPAA compliance assessment
- PHI identifier detection
- Business Associate Agreement templates
- Enhanced audit logging
- Breach assessment tools

### SOC 2 (Service Organization Control 2)

**Status:** Framework Implemented ✓
**Scope:** Trust Services Criteria

**Trust Services Criteria:**

1. **Security (CC)** - Protection against unauthorized access
2. **Availability (A)** - System availability for operation
3. **Processing Integrity (PI)** - Complete, valid, accurate, timely processing
4. **Confidentiality (C)** - Protection of confidential information
5. **Privacy (P)** - Proper collection, use, and disposal of personal information

**Implementation:**

- 30+ control objectives mapped
- Evidence collection framework
- Vendor risk management
- Incident response procedures
- SOC 2 readiness assessment

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • Cookie Consent Banner                                     │
│  • Data Export Request UI                                    │
│  • Data Deletion Request UI                                  │
│  • Privacy Settings Dashboard                                │
│  • Compliance Admin Dashboard                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  • /api/compliance/export     - Data export requests         │
│  • /api/compliance/deletion   - Data deletion requests       │
│  • /api/compliance/consent    - Consent management           │
│  • /api/compliance/reports    - Compliance reports           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  • Data Export Service                                       │
│  • Data Deletion Service                                     │
│  • Retention Policy Engine                                   │
│  • Legal Hold Manager                                        │
│  • Consent Manager                                           │
│  • GDPR/HIPAA/SOC2 Helpers                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL Database                                       │
│    ├─ Retention Policies                                    │
│    ├─ Legal Holds                                           │
│    ├─ Export/Deletion Requests                              │
│    ├─ User Consents                                         │
│    ├─ Privacy Settings                                      │
│    ├─ Compliance Audit Log                                  │
│    └─ Data Classification                                   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### 1. Data Retention & Lifecycle Management

**Automated Data Retention:**

- Configurable retention policies per data category
- Retention periods: 30/60/90/180/365 days, 1/2/3/5/7 years, forever
- Channel-specific overrides
- Exclude pinned/starred messages
- Scheduled auto-delete jobs
- Dry-run mode for testing

**Data Categories:**

- Messages
- Files
- Reactions
- Threads
- User Profiles
- Activity Logs
- Audit Logs
- Analytics
- System Logs
- Backups

**Configuration:**

```typescript
{
  retentionEnabled: true,
  defaultRetention: '1_year',
  autoDeleteEnabled: true,
  autoDeleteSchedule: '0 2 * * *' // 2 AM daily
}
```

### 2. Legal Hold Management

**Purpose:** Prevent data deletion during litigation or investigation

**Features:**

- Create/manage legal holds
- Associate custodians (users)
- Associate channels
- Preserve messages, files, and audit logs
- Custodian notifications
- Hold release management

**Use Cases:**

- eDiscovery
- Litigation support
- Internal investigations
- Regulatory audits

### 3. Data Export (GDPR Article 20)

**Features:**

- User-initiated data export
- Export categories: Profile, Messages, Files, Reactions, Activity, Settings, Consents
- Export formats: JSON, CSV, ZIP
- Date range filtering
- Metadata inclusion
- Rate limiting (1 export per day)
- Auto-expiration (7 days)
- Download limits (5 downloads)

**Process:**

1. User requests export
2. Request queued for processing
3. Background job compiles data
4. User notified when ready
5. Secure download link generated
6. Link expires after 7 days or 5 downloads

### 4. Data Deletion (GDPR Article 17)

**Features:**

- Full account deletion
- Partial deletion (messages only, files only, etc.)
- Identity verification required
- 14-day cooling-off period
- Legal hold blocking
- Deletion confirmation
- Audit trail

**Deletion Scopes:**

- Full Account - Complete deletion including account
- Messages Only - Keep account, delete messages
- Files Only - Delete uploaded files
- Activity Only - Delete activity logs
- Partial - Custom selection

**Process:**

1. User requests deletion
2. Identity verification (email)
3. Legal hold check
4. 14-day cooling-off period
5. Processing (can be cancelled during cooling-off)
6. Permanent deletion
7. Confirmation sent

### 5. Consent Management

**Consent Types:**

- Essential (required)
- Analytics
- Marketing
- Personalization
- Third-party sharing
- Cookie consents (essential, functional, analytics, advertising)

**Features:**

- Granular consent controls
- Consent versioning
- Consent audit trail
- Withdrawal mechanism
- Cookie consent banner
- Consent preferences UI

### 6. Privacy Settings

**User Controls:**

- Profile visibility (public, members, contacts, private)
- Online status visibility
- Last seen timestamp
- Read receipts
- Typing indicators
- Direct message permissions
- Searchability
- Analytics sharing
- Marketing preferences

### 7. Compliance Reports

**Available Reports:**

- GDPR Compliance Assessment
- HIPAA Compliance Assessment
- SOC 2 Compliance Assessment
- Compliance Overview Dashboard
- Retention Summary
- Deletion Audit
- Export Audit
- Consent Status
- Access Audit
- Legal Hold Summary
- Data Inventory
- Breach Report

**Report Formats:**

- JSON (API response)
- PDF (downloadable)
- CSV (data export)
- HTML (web view)

### 8. Audit Logging

**Logged Events:**

- All data access
- Data exports
- Data deletions
- Consent changes
- Privacy settings updates
- Legal hold operations
- Retention policy changes
- Admin actions

**Audit Log Fields:**

- Timestamp
- Actor (user ID, email)
- Action type
- Target (resource type, ID)
- Details (JSON)
- IP address
- User agent
- Success/failure

### 9. Data Classification

**Classification Levels:**

- Public
- Internal
- Confidential
- Restricted
- Top Secret

**Features:**

- Manual classification
- Auto-classification rules
- PII detection
- Sensitive data reports
- Access restrictions based on classification

### 10. Privacy Policy Management

**Features:**

- Version control
- Effective dates
- User acknowledgment tracking
- Update notifications
- Historical versions

## API Reference

### Data Export API

**Create Export Request:**

```http
POST /api/compliance/export
Content-Type: application/json

{
  "categories": ["messages", "files", "profile"],
  "format": "zip",
  "includeMetadata": true,
  "dateRangeStart": "2025-01-01",
  "dateRangeEnd": "2026-01-30"
}
```

**List Export Requests:**

```http
GET /api/compliance/export
```

**Cancel Export:**

```http
DELETE /api/compliance/export?id=<requestId>
```

### Data Deletion API

**Create Deletion Request:**

```http
POST /api/compliance/deletion
Content-Type: application/json

{
  "scope": "full_account",
  "reason": "No longer need the service"
}
```

**Update Deletion Request:**

```http
PATCH /api/compliance/deletion?id=<requestId>
Content-Type: application/json

{
  "action": "verify|approve|reject|cancel",
  "reason": "optional"
}
```

### Consent API

**Get Consents:**

```http
GET /api/compliance/consent
```

**Update Consent:**

```http
POST /api/compliance/consent
Content-Type: application/json

{
  "consentType": "analytics",
  "status": "granted|denied",
  "version": "1.0"
}
```

**Update Cookie Preferences:**

```http
PUT /api/compliance/consent/cookies
Content-Type: application/json

{
  "functional": true,
  "analytics": false,
  "advertising": false
}
```

### Compliance Reports API

**Generate Report:**

```http
GET /api/compliance/reports?type=gdpr|hipaa|soc2|overview
```

## Database Schema

See [`026_compliance_system.sql`](../../.backend/migrations/026_compliance_system.sql) for complete schema.

**Key Tables:**

- `nchat_retention_policies` - Data retention configurations
- `nchat_auto_delete_config` - Auto-delete settings
- `nchat_retention_jobs` - Job history
- `nchat_legal_holds` - Legal hold records
- `nchat_data_export_requests` - Export requests
- `nchat_data_deletion_requests` - Deletion requests
- `nchat_user_consents` - Consent records
- `nchat_cookie_preferences` - Cookie preferences
- `nchat_privacy_settings` - Privacy settings
- `nchat_compliance_audit_log` - Audit trail
- `nchat_compliance_reports` - Generated reports
- `nchat_data_classification` - Data classification
- `nchat_privacy_policy_versions` - Policy versions
- `nchat_data_processing_agreements` - DPAs
- `nchat_compliance_badges` - Certifications

## Configuration

### AppConfig

Add to `src/config/app-config.ts`:

```typescript
compliance: {
  // Standards
  gdprEnabled: boolean,
  ccpaEnabled: boolean,
  hipaaEnabled: boolean,
  soc2Enabled: boolean,

  // Retention
  retentionEnabled: boolean,
  defaultRetention: '1_year',
  autoDeleteEnabled: boolean,

  // Privacy
  cookieConsentRequired: boolean,
  privacyPolicyVersion: string,
  showConsentBanner: boolean,

  // Rights
  allowDataExport: boolean,
  allowDataDeletion: boolean,
  deletionCoolingOffDays: 14,

  // DPO
  dpoName?: string,
  dpoEmail?: string
}
```

### Environment Variables

```bash
# Enable compliance features
NEXT_PUBLIC_GDPR_ENABLED=true
NEXT_PUBLIC_CCPA_ENABLED=true
NEXT_PUBLIC_HIPAA_ENABLED=false
NEXT_PUBLIC_SOC2_ENABLED=true

# Cookie consent
NEXT_PUBLIC_COOKIE_CONSENT_REQUIRED=true

# Data retention
DATA_RETENTION_ENABLED=true
AUTO_DELETE_SCHEDULE="0 2 * * *"

# DPO contact
DPO_EMAIL=dpo@example.com
```

## Best Practices

### For Administrators

1. **Regular Compliance Audits**
   - Run monthly compliance reports
   - Review and address critical gaps
   - Update policies and procedures

2. **Data Retention**
   - Set appropriate retention periods
   - Review retention policies quarterly
   - Monitor auto-delete jobs
   - Test backup/recovery procedures

3. **Legal Holds**
   - Document hold reasons thoroughly
   - Notify custodians promptly
   - Review active holds monthly
   - Release holds when appropriate

4. **Consent Management**
   - Keep consent records up-to-date
   - Version privacy policies
   - Notify users of changes
   - Provide easy opt-out mechanisms

5. **Audit Logging**
   - Retain audit logs for 7+ years
   - Monitor for suspicious activity
   - Regular log reviews
   - Automated alerting for critical events

### For Developers

1. **Data Minimization**
   - Collect only necessary data
   - Use appropriate data types
   - Implement field-level encryption
   - Anonymize data when possible

2. **Privacy by Design**
   - Default to most restrictive settings
   - Require opt-in for non-essential features
   - Make privacy settings easily accessible
   - Clear and simple consent flows

3. **Security**
   - Encrypt data at rest and in transit
   - Implement proper access controls
   - Regular security audits
   - Timely security updates

4. **Transparency**
   - Clear privacy policies
   - Detailed cookie notices
   - Comprehensive data processing records
   - Visible audit trails

5. **Testing**
   - Test data export functionality
   - Test data deletion processes
   - Verify retention policies
   - Test consent workflows

### For End Users

1. **Review Privacy Settings**
   - Check settings regularly
   - Understand what data is collected
   - Adjust permissions as needed
   - Use privacy-enhancing features

2. **Manage Consents**
   - Review granted consents
   - Withdraw unnecessary consents
   - Understand cookie usage
   - Update preferences periodically

3. **Exercise Your Rights**
   - Request data export for backups
   - Delete data when leaving service
   - Report privacy concerns
   - Contact DPO with questions

## Support

For compliance-related questions:

- Email: dpo@example.com
- Documentation: https://docs.example.com/compliance
- Privacy Policy: https://example.com/privacy
- Terms of Service: https://example.com/terms

---

**Next Steps:**

- [GDPR Implementation Guide](./GDPR-GUIDE.md)
- [HIPAA Implementation Guide](./HIPAA-GUIDE.md)
- [SOC 2 Implementation Guide](./SOC2-GUIDE.md)
- [API Documentation](../api/COMPLIANCE-API.md)
