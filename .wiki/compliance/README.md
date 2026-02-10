# Compliance & Regulatory Documentation

Documentation for compliance, regulatory requirements, and data protection features in nself-chat.

## Contents

### Main Documentation

- **[Compliance Overview](COMPLIANCE-OVERVIEW.md)** - Comprehensive compliance features and certifications

## Overview

nself-chat is designed with compliance-first architecture to support organizations with regulatory requirements across various industries and jurisdictions.

### Supported Compliance Standards

**Data Protection:**

- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PIPEDA (Canada)
- Data Protection Act 2018 (UK)

**Security & Privacy:**

- SOC 2 Type II (in progress)
- ISO 27001 readiness
- HIPAA considerations (healthcare)
- FERPA considerations (education)

**Industry-Specific:**

- Financial services (PCI DSS considerations)
- Healthcare (HIPAA/HITECH)
- Education (FERPA, COPPA)
- Government (FedRAMP readiness)

## Key Compliance Features

### Data Protection (GDPR/CCPA)

**User Rights:**

- Right to access personal data
- Right to data portability (export)
- Right to erasure ("right to be forgotten")
- Right to rectification (data correction)
- Right to restriction of processing

**Privacy Controls:**

- Granular consent management
- Privacy-by-design architecture
- Data minimization
- Purpose limitation
- Storage limitation

**Documentation:**

- See [COMPLIANCE-OVERVIEW.md](COMPLIANCE-OVERVIEW.md) for implementation details

### Data Retention

**Configurable Retention Policies:**

- Message retention periods (7 days to indefinite)
- File retention periods
- Log retention periods
- Backup retention schedules

**Legal Hold:**

- Preserve data for litigation/investigation
- Override retention policies when required
- Audit trail of legal holds

**Automated Deletion:**

- Scheduled data purges
- User-initiated deletion
- Compliance-driven deletion

### Audit & Logging

**Comprehensive Audit Trails:**

- User activity logs
- Administrative actions
- Data access logs
- Configuration changes
- Security events

**Log Retention:**

- Configurable retention periods
- Tamper-proof logging
- Encrypted log storage
- Export capabilities

### Security & Encryption

**Data Protection:**

- End-to-end encryption (E2EE) for messages
- Encryption at rest (database, files)
- Encryption in transit (TLS 1.3)
- Zero-knowledge architecture options

**Access Control:**

- Role-based access control (RBAC)
- Multi-factor authentication (2FA)
- Session management
- IP allowlisting/denylisting

### Data Processing Agreements

**DPA Support:**

- Standard Contractual Clauses (SCCs)
- Data Processing Addendum templates
- Sub-processor management
- International data transfers

## Quick Start: Enabling Compliance Features

### GDPR Mode

Enable GDPR compliance features:

```typescript
// In app configuration
compliance: {
  gdprMode: true,
  dataRetentionDays: 365,
  enableRightToErasure: true,
  enableDataPortability: true,
  requireConsent: true,
}
```

### Data Retention Policy

Configure retention policies:

```typescript
dataRetention: {
  messages: {
    enabled: true,
    retentionDays: 90,
    applyToChannels: true,
    applyToDMs: true,
  },
  files: {
    enabled: true,
    retentionDays: 180,
  },
  auditLogs: {
    enabled: true,
    retentionDays: 730, // 2 years
  },
}
```

### Legal Hold

Place channels or users on legal hold:

```typescript
import { createLegalHold } from '@/lib/compliance'

await createLegalHold({
  type: 'channel',
  targetId: channelId,
  reason: 'Litigation hold - Case #12345',
  expiresAt: '2026-12-31',
})
```

## Compliance Checklist

### GDPR Compliance Checklist

- [ ] Privacy policy published and accessible
- [ ] Terms of service includes GDPR provisions
- [ ] Cookie consent banner (if applicable)
- [ ] Data processing agreement with users
- [ ] User consent management implemented
- [ ] Data export functionality tested
- [ ] Data deletion functionality tested
- [ ] Audit logging enabled
- [ ] Data retention policies configured
- [ ] DPO contact information published
- [ ] Breach notification procedures documented
- [ ] Third-party processor agreements in place

### SOC 2 Type II Readiness

- [ ] Access control policies documented
- [ ] Change management procedures
- [ ] Incident response plan
- [ ] Business continuity plan
- [ ] Vendor management program
- [ ] Risk assessment completed
- [ ] Security awareness training
- [ ] Audit logging and monitoring
- [ ] Encryption at rest and in transit
- [ ] Regular vulnerability scanning
- [ ] Penetration testing (annual)
- [ ] Independent security audit

### Data Privacy Impact Assessment (DPIA)

When to conduct DPIA:

- Processing sensitive personal data at scale
- Systematic monitoring of public areas
- Automated decision-making with legal effects
- Processing of special categories of data

Template available in [COMPLIANCE-OVERVIEW.md](COMPLIANCE-OVERVIEW.md)

## Compliance by Industry

### Healthcare (HIPAA)

**Considerations:**

- Business Associate Agreement (BAA) required
- PHI encryption and access controls
- Audit logging of PHI access
- Breach notification procedures
- Minimum necessary principle

**Status:** Architecture supports HIPAA requirements; BAA available for enterprise customers

### Education (FERPA/COPPA)

**Considerations:**

- Parental consent for users under 13 (COPPA)
- Educational records protection (FERPA)
- Student data privacy
- Limited data collection from minors

**Status:** COPPA-compliant with parental consent features; FERPA-ready

### Finance (PCI DSS)

**Considerations:**

- No storage of cardholder data (use Stripe)
- Secure transmission of payment data
- Access control and monitoring
- Regular security testing

**Status:** PCI DSS compliant via Stripe payment processing

### Government (FedRAMP)

**Considerations:**

- Cloud security requirements
- Continuous monitoring
- Incident response
- Configuration management

**Status:** FedRAMP-ready architecture; certification in progress

## Data Subject Rights

### Right to Access (GDPR Art. 15)

Users can request copies of their data:

```bash
# Export user data
POST /api/compliance/export
{
  "userId": "user-id",
  "format": "json" | "csv" | "pdf"
}
```

### Right to Erasure (GDPR Art. 17)

Users can request deletion:

```bash
# Delete user data
POST /api/compliance/delete
{
  "userId": "user-id",
  "reason": "user_request"
}
```

### Right to Portability (GDPR Art. 20)

Export data in machine-readable format:

```bash
# Export in standard format
POST /api/compliance/export
{
  "userId": "user-id",
  "format": "json",
  "include": ["messages", "files", "profile"]
}
```

## Compliance Reporting

### Available Reports

- **User Activity Report**: Track user actions and data access
- **Data Retention Report**: Show data subject to retention policies
- **Legal Hold Report**: List active legal holds
- **Audit Log Export**: Export audit logs for review
- **Data Processing Report**: Show data processing activities
- **Breach Report**: Document and report data breaches

### Generating Reports

See [COMPLIANCE-OVERVIEW.md - Reporting](COMPLIANCE-OVERVIEW.md#compliance-reporting) for detailed instructions.

## International Data Transfers

### Data Residency

**Options:**

- Single-region deployment (data stays in one region)
- Multi-region with data sovereignty controls
- Edge caching with origin protection

**Configuration:**

```typescript
dataResidency: {
  primaryRegion: 'eu-west-1',
  allowedRegions: ['eu-west-1', 'eu-central-1'],
  enforceResidency: true,
}
```

### Standard Contractual Clauses (SCCs)

For EU-US data transfers, nself-chat supports SCCs as approved by the European Commission.

Templates available for enterprise customers.

## Compliance Resources

### Documentation

- [COMPLIANCE-OVERVIEW.md](COMPLIANCE-OVERVIEW.md) - Complete compliance features
- [v0.5.0 Compliance Summary](../releases/v0.5.0-COMPLIANCE-SUMMARY.md) - Latest compliance updates
- [Security Documentation](../security/README.md) - Security features and best practices

### External Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Guide](https://oag.ca.gov/privacy/ccpa)
- [SOC 2 Framework](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome.html)
- [HIPAA Compliance](https://www.hhs.gov/hipaa/index.html)
- [FedRAMP](https://www.fedramp.gov/)

### Training & Certification

- GDPR training materials (coming soon)
- SOC 2 audit preparation guide (coming soon)
- Security awareness training (coming soon)

## Support

### Compliance Inquiries

- **Email**: compliance@nself.org
- **Enterprise Support**: enterprise@nself.org
- **DPO Contact**: dpo@nself.org

### Security Issues

- **Email**: security@nself.org
- **PGP Key**: Available on request
- **Responsible Disclosure**: See [Security Policy](../security/README.md)

### Legal & Contracts

- **Email**: legal@nself.org
- **DPA Requests**: dpa@nself.org
- **BAA Requests**: baa@nself.org

## Version Information

**Compliance Framework Version:** 1.0.0
**Documentation Version:** 0.5.0
**Last Updated:** January 31, 2026
**Last Audit:** Pending

## Related Documentation

- [Security Documentation](../security/README.md) - Security features
- [Privacy Policy](https://nself.org/privacy) - Privacy policy
- [Terms of Service](https://nself.org/terms) - Terms of service
- [Data Processing Agreement](https://nself.org/dpa) - DPA template

---

[← Back to Documentation Home](../Home.md)
