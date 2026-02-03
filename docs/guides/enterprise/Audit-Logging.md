# Enterprise Audit Logging Guide

Tamper-proof audit logging with cryptographic integrity verification and compliance-ready export formats.

## Table of Contents

1. [Overview](#overview)
2. [Audit Log Features](#audit-log-features)
3. [Tamper-Proof Architecture](#tamper-proof-architecture)
4. [Log Categories](#log-categories)
5. [Searching and Filtering](#searching-and-filtering)
6. [Export Formats](#export-formats)
7. [Compliance](#compliance)
8. [Best Practices](#best-practices)

## Overview

nself-chat provides enterprise-grade audit logging with cryptographic integrity guarantees. Every action is logged in an immutable, tamper-proof chain.

### Key Features

- **Tamper-Proof**: Cryptographic hash chains prevent modification
- **Comprehensive**: Logs all user, admin, and system actions
- **Searchable**: Advanced filtering and full-text search
- **Exportable**: Multiple compliance formats (JSON, CSV, Syslog, CEF)
- **Integrity Verification**: Verify log chain hasn't been tampered with
- **Retention Policies**: Automated retention and archival
- **Real-Time**: Immediate logging with batch processing

## Audit Log Features

### What Gets Logged

Every audit entry includes:

```typescript
{
  // Identification
  id: "uuid",
  blockNumber: 1234,
  timestamp: "2026-01-31T12:00:00Z",

  // Action Details
  action: "user_login",
  category: "security",
  severity: "info",
  description: "User logged in successfully",
  success: true,

  // Actor (who did it)
  actor: {
    id: "user-123",
    type: "user",
    ipAddress: "192.168.1.1"
  },

  // Resource (what was affected)
  resource: {
    type: "user",
    id: "user-123",
    name: "john@example.com"
  },

  // Cryptographic Proof
  entryHash: "sha256:abc123...",
  previousHash: "sha256:def456...",

  // Metadata
  metadata: {
    userAgent: "Mozilla/5.0...",
    location: "San Francisco, CA"
  }
}
```

### Hash Chain Architecture

```
Block 1: [Data] → Hash A →
Block 2: [Data + Hash A] → Hash B →
Block 3: [Data + Hash B] → Hash C →
...
```

Each block contains:

1. Current event data
2. Hash of previous block
3. Sequential block number
4. Calculated hash of entire block

**Result**: Any modification breaks the chain and is instantly detectable.

## Tamper-Proof Architecture

### Hash Generation

```typescript
hash =
  SHA - 256(blockNumber + previousHash + timestamp + action + actorId + resourceId + description)
```

### Verification Process

```typescript
// Verify entire chain
const verification = await verifyAuditIntegrity()

console.log({
  isValid: true,
  totalEntries: 10000,
  verifiedEntries: 10000,
  compromisedBlocks: [],
  chainMetadata: {
    chainId: 'uuid',
    genesisHash: 'sha256:...',
    currentHash: 'sha256:...',
  },
})
```

### Integrity Guarantees

1. **Immutability**: Once written, cannot be modified
2. **Ordering**: Strict chronological order maintained
3. **Completeness**: Missing blocks detected immediately
4. **Authenticity**: Cryptographic proof of authenticity

## Log Categories

### 1. User Actions

```typescript
Category: 'user'
Events: -user_created -
  user_updated -
  user_deleted -
  user_login -
  user_logout -
  user_password_changed -
  user_email_verified -
  user_profile_updated
```

### 2. Security Events

```typescript
Category: 'security'
Events: -login_success -
  login_failed -
  logout -
  password_reset -
  mfa_enabled -
  mfa_disabled -
  session_expired -
  suspicious_activity -
  sso_login -
  api_key_created
```

### 3. Admin Actions

```typescript
Category: 'admin'
Events: -role_created -
  role_updated -
  role_deleted -
  role_assigned -
  permission_granted -
  permission_revoked -
  user_banned -
  user_unbanned -
  settings_updated -
  integration_configured
```

### 4. Message Events

```typescript
Category: 'message'
Events: -message_sent -
  message_edited -
  message_deleted -
  message_pinned -
  message_reported -
  reaction_added
```

### 5. Channel Events

```typescript
Category: 'channel'
Events: -channel_created -
  channel_updated -
  channel_deleted -
  channel_archived -
  user_joined -
  user_left -
  user_invited -
  user_kicked
```

## Searching and Filtering

### Advanced Filters

Access **Admin Dashboard → Security → Audit Log**

#### Time Range

```typescript
filter = {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
}
```

#### Actor Filters

```typescript
filter = {
  actorIds: ['user-123', 'user-456'],
  actorTypes: ['user', 'system', 'api'],
}
```

#### Action Filters

```typescript
filter = {
  actions: ['user_login', 'user_logout'],
  categories: ['security', 'admin'],
  severities: ['critical', 'error', 'warning'],
}
```

#### Resource Filters

```typescript
filter = {
  resourceTypes: ['user', 'channel', 'message'],
  resourceIds: ['user-123'],
}
```

#### Full-Text Search

```typescript
filter = {
  searchText: 'john@example.com',
}
```

#### Combined Example

```typescript
const filter = {
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  categories: ['security', 'admin'],
  severities: ['error', 'critical'],
  success: false, // Only failed actions
  searchText: 'login',
  sortBy: 'timestamp',
  sortOrder: 'desc',
  limit: 50,
  offset: 0,
}

const results = await searchTamperProofLogs(filter)
```

## Export Formats

### 1. JSON (Standard)

```json
{
  "exportedAt": "2026-01-31T12:00:00Z",
  "chainMetadata": {
    "chainId": "uuid",
    "totalEntries": 1000
  },
  "entries": [
    {
      "id": "uuid",
      "timestamp": "2026-01-31T12:00:00Z",
      "action": "user_login",
      "actor": { "id": "user-123" },
      "entryHash": "sha256:..."
    }
  ]
}
```

### 2. CSV (Spreadsheet)

```csv
Block,Timestamp,Action,Actor,Category,Severity,Success,Hash
1234,2026-01-31 12:00:00,user_login,user-123,security,info,true,sha256:abc...
```

### 3. Syslog (RFC 5424)

```
<14>1 2026-01-31T12:00:00Z nchat audit - - - user_login: User logged in successfully
<14>1 2026-01-31T12:01:00Z nchat audit - - - channel_created: Channel created
```

### 4. CEF (Common Event Format)

```
CEF:0|nself|nchat|1.0|user_login|User logged in|2|act=user_login suser=user-123 outcome=success
```

### 5. LEEF (Log Event Extended Format)

```
LEEF:1.0|nself|nchat|1.0|user_login|devTime=Jan 31 2026 12:00:00|action=user_login usrName=user-123
```

### Export via UI

1. Navigate to **Audit Log**
2. Apply desired filters
3. Click **Export** → Select format
4. File downloads automatically

### Export via API

```typescript
// Export last 30 days as JSON
const data = await getTamperProofAuditService().exportLogs(
  {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  'json'
)

// Save to file
fs.writeFileSync('audit-log.json', data)
```

## Compliance

### SOC 2 Type II

**Requirements**:

- Logging of all administrative actions ✅
- Immutable audit trail ✅
- Regular integrity verification ✅
- Secure log storage ✅
- Access controls on logs ✅

**Configuration**:

```typescript
{
  retentionDays: 365,
  enableTamperProof: true,
  logAllAdminActions: true,
  requireMFA: true
}
```

### GDPR

**Requirements**:

- Log data access and modifications ✅
- Right to deletion (with exceptions) ✅
- Data export capability ✅
- Retention policies ✅

**Configuration**:

```typescript
{
  logPersonalDataAccess: true,
  retentionDays: 730, // 2 years
  allowLegalHold: true,
  exportFormats: ['json', 'csv']
}
```

### HIPAA

**Requirements**:

- Access logs for PHI ✅
- 6-year retention ✅
- Tamper detection ✅
- Audit log reviews ✅

**Configuration**:

```typescript
{
  retentionDays: 2190, // 6 years
  enableTamperProof: true,
  logAllDataAccess: true,
  monthlyReviews: true
}
```

### PCI DSS

**Requirements**:

- Log all access to cardholder data ✅
- Daily log reviews ✅
- 1-year online, 3-year total retention ✅
- Integrity verification ✅

**Configuration**:

```typescript
{
  retentionDays: 365,
  archiveRetentionDays: 1095,
  dailyIntegrityCheck: true,
  alertOnFailure: true
}
```

## Best Practices

### 1. Regular Verification

Schedule automated integrity checks:

```bash
# Daily verification (cron)
0 2 * * * /usr/bin/verify-audit-integrity
```

```typescript
// Automated verification
setInterval(
  async () => {
    const result = await verifyAuditIntegrity()
    if (!result.isValid) {
      alertSecurityTeam(result)
    }
  },
  24 * 60 * 60 * 1000
) // Daily
```

### 2. Retention Policies

Configure appropriate retention:

```typescript
// Development
retentionDays: 30

// Production
retentionDays: 365

// Compliance (HIPAA)
retentionDays: 2190 // 6 years

// Legal Hold
legalHold: true // Never delete
```

### 3. Monitoring and Alerts

Set up alerts for critical events:

```typescript
const criticalEvents = [
  'user_banned',
  'role_deleted',
  'settings_updated',
  'sso_connection_deleted',
  'audit_integrity_compromised',
]

criticalEvents.forEach((event) => {
  subscribeToAuditEvent(event, async (entry) => {
    await notifySecurityTeam(entry)
    await createIncident(entry)
  })
})
```

### 4. Access Control

Restrict audit log access:

```typescript
// Only admins and compliance officers
permissions: {
  'admin:audit_log': ['admin', 'compliance-officer'],
  'admin:audit_export': ['admin', 'compliance-officer'],
  'admin:audit_delete': ['owner'] // Never allow
}
```

### 5. Regular Reviews

Schedule periodic reviews:

- **Daily**: Security events (failed logins, suspicious activity)
- **Weekly**: Admin actions (role changes, user bans)
- **Monthly**: All categories (comprehensive review)
- **Quarterly**: Integrity verification
- **Annually**: Retention policy compliance

### 6. Backup Strategy

Audit logs should be backed up separately:

```bash
# Automated backup
0 3 * * * /usr/bin/backup-audit-logs --destination s3://audit-backup/

# Verify backup integrity
0 4 * * * /usr/bin/verify-backup-integrity
```

## Statistics and Analytics

### Generate Statistics

```typescript
const stats = await getTamperProofAuditService().getStatistics({
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
})

console.log({
  totalEvents: 10000,
  eventsByCategory: {
    security: 3500,
    admin: 1200,
    user: 4000,
    message: 1300,
  },
  failureRate: 0.02, // 2% failure rate
  topActors: [
    { actorId: 'user-123', count: 450 },
    { actorId: 'user-456', count: 320 },
  ],
})
```

### Common Queries

#### Failed Login Attempts

```typescript
const failedLogins = await searchTamperProofLogs({
  actions: ['login_failed'],
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  sortBy: 'timestamp',
  sortOrder: 'desc',
})
```

#### Admin Actions by User

```typescript
const adminActions = await searchTamperProofLogs({
  actorIds: ['admin-123'],
  categories: ['admin'],
  startDate: new Date('2026-01-01'),
})
```

#### Security Incidents

```typescript
const incidents = await searchTamperProofLogs({
  categories: ['security'],
  severities: ['critical', 'error'],
  success: false,
})
```

## Troubleshooting

### Integrity Verification Failed

**Symptom**: Verification reports compromised blocks

**Diagnosis**:

1. Review verification errors
2. Identify compromised block numbers
3. Check for system issues (corruption, hardware failure)

**Resolution**:

1. Alert security team immediately
2. Investigate root cause
3. Restore from backup if necessary
4. Review security posture

### Performance Issues

**Symptom**: Slow log queries

**Solutions**:

1. Add indexes on frequently queried fields
2. Implement pagination (use offset/limit)
3. Use time-based partitioning
4. Archive old logs

### Storage Growth

**Symptom**: Audit logs consuming excessive storage

**Solutions**:

1. Implement retention policies
2. Enable compression
3. Archive to cold storage
4. Review logging verbosity

---

**Last Updated**: January 2026
**Version**: 1.0.0
