# GDPR Compliance Guide

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Applicable To:** nself-chat application

---

## Introduction

This document provides guidance on General Data Protection Regulation (GDPR) compliance for the nself-chat application. It is intended for administrators, developers, and data protection officers who need to understand and implement GDPR requirements.

**IMPORTANT:** This is a technical implementation guide, NOT legal advice. Consult with legal counsel to ensure full GDPR compliance for your specific use case and jurisdiction.

**Scope:** This guide applies to:

- European Economic Area (EEA) residents
- UK residents (UK GDPR)
- Swiss residents (Swiss Federal Act on Data Protection)

---

## 1. GDPR Overview

The General Data Protection Regulation (GDPR) is a comprehensive data protection law that governs how organizations collect, process, and protect personal data of EU/EEA residents.

### Key Principles

1. **Lawfulness, Fairness, and Transparency:** Data must be processed lawfully, fairly, and transparently
2. **Purpose Limitation:** Data collected for specified, explicit, and legitimate purposes
3. **Data Minimization:** Only collect data that is adequate, relevant, and necessary
4. **Accuracy:** Personal data must be accurate and kept up to date
5. **Storage Limitation:** Data retained only as long as necessary
6. **Integrity and Confidentiality:** Data must be processed securely
7. **Accountability:** Organizations must demonstrate compliance

### Territorial Scope

GDPR applies if:

- Your organization is established in the EU/EEA, OR
- You offer goods/services to EU/EEA residents, OR
- You monitor the behavior of EU/EEA residents

**For nself-chat:** If you serve any users in the EU/EEA, you must comply with GDPR.

---

## 2. Data Mapping

Understanding what personal data you collect is the first step to GDPR compliance.

### 2.1 Personal Data Collected

| Data Category           | Examples                               | Purpose                          | Legal Basis         | Retention                         |
| ----------------------- | -------------------------------------- | -------------------------------- | ------------------- | --------------------------------- |
| **Identity Data**       | Name, username, email                  | Account creation, authentication | Contract            | Account lifetime + 30 days        |
| **Profile Data**        | Display name, bio, avatar, role        | User profile, personalization    | Contract            | Account lifetime                  |
| **Communication Data**  | Messages, files, reactions             | Chat functionality               | Contract            | Account lifetime or as configured |
| **Technical Data**      | IP address, browser, device info       | Security, analytics              | Legitimate interest | 30-90 days                        |
| **Usage Data**          | Page views, features used, errors      | Service improvement              | Legitimate interest | 90 days                           |
| **Preference Data**     | Theme, language, notification settings | Personalization                  | Consent             | Account lifetime                  |
| **Authentication Data** | Password hash, OAuth tokens            | Authentication                   | Contract            | Account lifetime                  |

### 2.2 Special Categories (Sensitive Data)

GDPR provides extra protection for:

- Racial or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Genetic data
- Biometric data
- Health data
- Sex life or sexual orientation

**For nself-chat:** We do NOT intentionally collect special category data. If users share such data in messages, they do so voluntarily. Inform users not to share sensitive data unless necessary.

### 2.3 Data Processing Activities

| Activity         | Data Processed                | Purpose              | Processor/Controller                   |
| ---------------- | ----------------------------- | -------------------- | -------------------------------------- |
| Account creation | Email, name, password         | User registration    | Controller                             |
| Authentication   | Email, password, OAuth tokens | Login                | Controller                             |
| Messaging        | Messages, files, metadata     | Communication        | Controller                             |
| Storage          | Files, images, attachments    | File sharing         | Controller + Processor (MinIO/S3)      |
| Analytics        | Usage data, errors            | Service improvement  | Controller + Processor (Sentry)        |
| Email            | Email address, name           | Transactional emails | Controller + Processor (email service) |

---

## 3. Legal Bases for Processing

GDPR requires a legal basis for every data processing activity.

### 3.1 Contract (Article 6(1)(b))

Processing necessary to perform a contract with the user.

**Applies to:**

- Account creation and management
- Authentication and authorization
- Message delivery and storage
- File uploads and sharing
- Core chat functionality

**Example:** "We process your email address and username to create and maintain your account as part of our Terms of Service."

### 3.2 Consent (Article 6(1)(a))

Freely given, specific, informed, and unambiguous consent.

**Applies to:**

- Marketing emails
- Optional analytics cookies
- Newsletter subscriptions
- Non-essential features

**Requirements:**

- ✅ Clear affirmative action (no pre-ticked boxes)
- ✅ Easy to withdraw
- ✅ Granular (separate consent for different purposes)
- ✅ Documented

**Example:** Cookie consent banner with "Accept" / "Reject" options.

### 3.3 Legitimate Interest (Article 6(1)(f))

Processing necessary for legitimate interests, unless overridden by user's rights.

**Applies to:**

- Fraud prevention and security
- Network and information security
- Analytics (if properly balanced)
- Service improvements

**Requirements:**

- ✅ Conduct Legitimate Interest Assessment (LIA)
- ✅ Balance your interests against user's rights
- ✅ Provide opt-out mechanism where appropriate

**Example:** "We use IP addresses to detect and prevent fraudulent account creation."

### 3.4 Legal Obligation (Article 6(1)(c))

Processing necessary to comply with legal obligations.

**Applies to:**

- Tax and accounting records (e.g., invoices for 7 years)
- Response to lawful court orders or subpoenas
- Regulatory compliance

**Example:** "We retain billing records for 7 years to comply with tax regulations."

### 3.5 Vital Interests (Article 6(1)(d))

Processing necessary to protect someone's life (rarely applicable).

### 3.6 Public Task (Article 6(1)(e))

Processing necessary for a task in the public interest (rarely applicable for SaaS).

---

## 4. Data Subject Rights

GDPR grants individuals ("data subjects") the following rights:

### 4.1 Right to Be Informed (Articles 13-14)

Users must be informed about data collection and processing.

**Implementation:**

- ✅ Privacy Policy published and easily accessible
- ✅ Privacy notice displayed during account creation
- ✅ Cookie banner explains cookie usage
- ✅ Transparency about third-party processors

**Location in nself-chat:**

- `/docs/legal/PRIVACY-POLICY.md`
- `/docs/legal/COOKIE-POLICY.md`
- Cookie consent banner (to be implemented)

### 4.2 Right of Access (Article 15)

Users can request a copy of their personal data.

**Implementation:**

- ✅ Provide data export functionality
- ✅ Respond to access requests within 1 month
- ✅ Provide data in a structured, commonly used format (JSON, CSV)

**Location in nself-chat:**

- Account Settings > Privacy & Data > Export My Data
- API endpoint: `/api/user/export` (to be implemented)

**Data to Include:**

- User profile information
- All messages sent
- Files uploaded
- Settings and preferences
- Account activity logs

### 4.3 Right to Rectification (Article 16)

Users can correct inaccurate or incomplete data.

**Implementation:**

- ✅ Allow users to edit profile information
- ✅ Allow users to delete/edit messages (within time limit)
- ✅ Respond to rectification requests within 1 month

**Location in nself-chat:**

- Account Settings > Profile (edit name, email, bio, avatar)
- Message edit/delete functionality (already implemented)

### 4.4 Right to Erasure (Article 17) - "Right to be Forgotten"

Users can request deletion of their data (with exceptions).

**Implementation:**

- ✅ Account deletion functionality
- ✅ Data deletion within 30 days of request
- ✅ Notify third-party processors of deletion request
- ✅ Exceptions: Legal obligations, public interest, legal claims

**Location in nself-chat:**

- Account Settings > Privacy & Data > Delete My Account
- API endpoint: `/api/user/delete` (to be implemented)

**Deletion Process:**

1. User requests account deletion
2. Confirmation email sent (prevent accidental deletion)
3. 30-day grace period (account suspended, data retained)
4. After 30 days, data permanently deleted:
   - User profile deleted
   - Messages anonymized or deleted (depending on workspace policy)
   - Files deleted from storage
   - Analytics data anonymized
5. Exceptions retained:
   - Billing records (7 years for tax compliance)
   - Fraud/abuse logs (legitimate interest)

### 4.5 Right to Restriction of Processing (Article 18)

Users can request limitation of processing in certain circumstances.

**Implementation:**

- ✅ Account suspension (data retained but not processed)
- ✅ Respond to restriction requests within 1 month

**Use Cases:**

- User contests accuracy of data (restrict while verifying)
- User objects to processing (restrict while assessing)
- User needs data for legal claims

**Location in nself-chat:**

- Support request to [privacy@yourcompany.com]
- Account Settings > Privacy & Data > Restrict My Data

### 4.6 Right to Data Portability (Article 20)

Users can receive their data in a machine-readable format and transfer it to another service.

**Implementation:**

- ✅ Data export in JSON format
- ✅ Include all data provided by user or generated by their use
- ✅ Respond to portability requests within 1 month

**Location in nself-chat:**

- Account Settings > Privacy & Data > Export My Data
- Format: JSON (primary), CSV (optional)

**Data Included:**

- User profile (JSON)
- Messages (JSON with timestamps, metadata)
- Files (downloadable archive)
- Settings and preferences (JSON)

### 4.7 Right to Object (Article 21)

Users can object to processing based on legitimate interests or direct marketing.

**Implementation:**

- ✅ Unsubscribe from marketing emails (one-click)
- ✅ Opt-out of analytics cookies
- ✅ Object to profiling or automated decision-making

**Location in nself-chat:**

- Email unsubscribe link (marketing emails)
- Cookie consent banner > Customize > Disable analytics
- Account Settings > Privacy & Data > Marketing Preferences

### 4.8 Rights Related to Automated Decision-Making (Article 22)

Users have the right not to be subject to solely automated decisions with legal or significant effects.

**Implementation:**

- ✅ nself-chat does NOT use automated decision-making for significant decisions
- ✅ If implemented in the future, obtain explicit consent and allow human review

**Note:** Automated moderation (e.g., spam detection) may apply, but users can appeal.

---

## 5. Responding to Data Subject Requests

### 5.1 Request Procedures

1. **Receive Request:**
   - Email: [privacy@yourcompany.com]
   - In-app: Account Settings > Privacy & Data > Submit Request
   - Support portal: [INSERT URL]

2. **Verify Identity:**
   - Confirm email address matches account
   - For sensitive requests, require additional verification (e.g., login, security question)
   - Do NOT disclose data to unverified third parties

3. **Assess Request:**
   - Determine which right is being exercised
   - Identify data in scope
   - Check for exemptions or limitations

4. **Respond:**
   - Within 1 month (extendable to 3 months for complex requests)
   - Provide requested data or action
   - If refusing, explain reasons and inform of right to complain

5. **Document:**
   - Log all requests and responses
   - Maintain audit trail for compliance

### 5.2 Response Templates

**Access Request:**

```
Subject: Your Data Access Request

Dear [Name],

Thank you for your data access request received on [Date].

We have prepared a copy of your personal data held by nself-chat. Please find attached:
- Your account information (JSON)
- Your messages (JSON)
- Your uploaded files (ZIP archive)
- Your activity logs (CSV)

This data is provided in accordance with Article 15 of the GDPR.

If you have any questions, please contact us at privacy@yourcompany.com.

Best regards,
[Your Company] Data Protection Team
```

**Deletion Request:**

```
Subject: Your Data Deletion Request

Dear [Name],

We have received your request to delete your account and personal data on [Date].

Your account has been suspended and will be permanently deleted within 30 days ([Deletion Date]).

The following data will be deleted:
- User profile and account information
- Messages and files
- Preferences and settings

The following data will be retained for legal compliance:
- Billing records (retained for 7 years per tax regulations)

You can cancel this deletion request within the 30-day grace period by contacting privacy@yourcompany.com.

Best regards,
[Your Company] Data Protection Team
```

### 5.3 Exemptions

You may refuse or limit requests if:

- The request is manifestly unfounded or excessive (charge a reasonable fee or refuse)
- Compliance would adversely affect others' rights and freedoms
- Legal obligations require data retention
- Data is needed for legal claims or defense
- Public interest or official authority requires processing

---

## 6. Data Processing Agreements (DPAs)

If you use third-party processors (e.g., cloud hosting, email services), you must have DPAs in place.

### 6.1 Required Processors for nself-chat

| Processor                        | Service                | DPA Required | DPA in Place            |
| -------------------------------- | ---------------------- | ------------ | ----------------------- |
| Cloud Provider (AWS/GCP/Azure)   | Infrastructure hosting | ✅ Yes       | ✅ Standard DPA         |
| Nhost                            | Authentication service | ✅ Yes       | ✅ Check Nhost terms    |
| Sentry                           | Error tracking         | ✅ Yes       | ✅ Sentry DPA available |
| Email Service (Mailgun/SendGrid) | Transactional emails   | ✅ Yes       | ✅ Standard DPA         |
| MinIO/S3                         | File storage           | ✅ Yes       | ✅ Covered by cloud DPA |

### 6.2 DPA Requirements

A compliant DPA must include:

- Subject matter and duration of processing
- Nature and purpose of processing
- Types of personal data
- Categories of data subjects
- Obligations and rights of controller
- Processor's security measures
- Sub-processor authorization
- Data breach notification procedures
- Assistance with data subject requests
- Deletion or return of data after contract termination
- Audit rights

### 6.3 Implementing DPAs

1. **Review Processor's DPA:** Most SaaS providers offer standard DPAs
2. **Sign DPA:** Execute the DPA before processing begins
3. **Sub-processors:** Ensure processor has authorization to use sub-processors
4. **Monitor Compliance:** Regularly review processor's compliance

**Action Items:**

- [ ] Sign DPA with cloud hosting provider
- [ ] Sign DPA with Nhost (authentication)
- [ ] Sign DPA with Sentry (monitoring)
- [ ] Sign DPA with email service provider
- [ ] Maintain register of processors

---

## 7. Security Measures (Article 32)

GDPR requires "appropriate technical and organizational measures" to protect data.

### 7.1 Technical Measures

| Measure                         | Implementation in nself-chat             | Status                     |
| ------------------------------- | ---------------------------------------- | -------------------------- |
| **Encryption in Transit**       | TLS 1.2+ (HTTPS)                         | ✅ Implemented             |
| **Encryption at Rest**          | Database encryption, encrypted storage   | ⚠️ Enable in production    |
| **Access Controls**             | RBAC, least privilege principle          | ✅ Implemented             |
| **Authentication**              | Password hashing (bcrypt), JWT tokens    | ✅ Implemented             |
| **Multi-Factor Authentication** | 2FA/MFA                                  | ⚠️ Planned                 |
| **Logging and Monitoring**      | Audit logs, error tracking (Sentry)      | ✅ Implemented             |
| **Secure Development**          | Code reviews, security testing           | ✅ Implemented             |
| **Vulnerability Management**    | Dependency scanning, penetration testing | ⚠️ Ongoing                 |
| **Data Pseudonymization**       | Anonymized analytics                     | ⚠️ Partial                 |
| **Backups**                     | Encrypted backups, tested recovery       | ⚠️ Configure in production |

### 7.2 Organizational Measures

| Measure                             | Implementation                        | Status                |
| ----------------------------------- | ------------------------------------- | --------------------- |
| **Data Protection Officer (DPO)**   | Appoint if required                   | ⚠️ Assess necessity   |
| **Staff Training**                  | GDPR awareness training               | ⚠️ Planned            |
| **Data Protection Policies**        | Privacy policy, data retention policy | ✅ Templates provided |
| **Incident Response Plan**          | Data breach response procedures       | ⚠️ To be created      |
| **Privacy by Design**               | Privacy considerations in development | ✅ Implemented        |
| **Privacy Impact Assessment (PIA)** | For high-risk processing              | ⚠️ Conduct if needed  |
| **Vendor Management**               | DPAs with all processors              | ⚠️ In progress        |
| **Data Retention Schedule**         | Documented retention periods          | ⚠️ To be formalized   |

---

## 8. Data Breach Notification (Articles 33-34)

### 8.1 What is a Data Breach?

A breach of security leading to:

- Accidental or unlawful destruction
- Loss, alteration, unauthorized disclosure
- Unauthorized access to personal data

### 8.2 Notification to Supervisory Authority (Article 33)

**Timeline:** Within 72 hours of becoming aware of the breach

**Required Information:**

1. Nature of the breach (categories and number of data subjects affected)
2. Name and contact details of Data Protection Officer or contact point
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach

**How to Notify:**

- Submit to your lead supervisory authority (where your main establishment is)
- Use authority's online reporting tool (if available)

**Exceptions:**

- Breach unlikely to result in risk to individuals' rights and freedoms

### 8.3 Notification to Data Subjects (Article 34)

**When Required:** If breach likely to result in high risk to individuals

**Timeline:** Without undue delay

**Required Information:**

1. Nature of the breach (in clear, plain language)
2. Contact details of DPO or contact point
3. Likely consequences
4. Measures taken or proposed

**Methods:**

- Individual email notification (preferred)
- Public communication (if individual notification is disproportionate)

**Exceptions:**

- Appropriate technical and organizational measures applied (e.g., encryption)
- Subsequent measures taken to ensure high risk no longer likely
- Individual notification would involve disproportionate effort (use public communication instead)

### 8.4 Breach Response Plan

**nself-chat Incident Response Procedure:**

1. **Detection and Containment (0-1 hour)**
   - Detect breach via monitoring, user report, or audit
   - Contain breach (isolate affected systems, revoke credentials)
   - Preserve evidence for investigation

2. **Assessment (1-24 hours)**
   - Determine scope (what data, how many users)
   - Assess risk to individuals (low, medium, high)
   - Classify breach type (unauthorized access, data loss, ransomware, etc.)

3. **Notification Decision (Within 72 hours)**
   - If risk to individuals → notify supervisory authority
   - If high risk to individuals → notify data subjects
   - Document decision and rationale

4. **Investigation and Remediation (Ongoing)**
   - Root cause analysis
   - Implement fixes to prevent recurrence
   - Update security measures

5. **Documentation (Within 72 hours)**
   - Log breach in data breach register
   - Document facts, effects, and remediation
   - Report to management and board (if material)

**Breach Register Template:**

| Date       | Type                | Data Affected   | Users Affected | Risk Level | Authority Notified | Users Notified | Remediation    |
| ---------- | ------------------- | --------------- | -------------- | ---------- | ------------------ | -------------- | -------------- |
| 2026-01-31 | Unauthorized access | Email addresses | 100            | Low        | No (low risk)      | No             | Password reset |

---

## 9. International Data Transfers (Chapter V)

GDPR restricts transfers of personal data outside the EU/EEA unless adequate safeguards are in place.

### 9.1 Transfer Mechanisms

**Option 1: Adequacy Decision (Article 45)**

- EU Commission has determined country provides adequate protection
- No additional safeguards needed
- Adequate countries: UK, Switzerland, Canada, Japan, etc. (check current list)

**Option 2: Standard Contractual Clauses (SCCs) (Article 46)**

- Use EU-approved Standard Contractual Clauses
- Most common mechanism for transfers to US, Asia, etc.
- Requires Transfer Impact Assessment (TIA)

**Option 3: Binding Corporate Rules (BCRs) (Article 47)**

- For multinational companies with internal data transfers
- Requires approval from supervisory authority

**Option 4: Consent (Article 49)**

- Explicit, informed consent for specific transfers
- Only for occasional transfers (not suitable for ongoing processing)

### 9.2 Transfer Impact Assessment (TIA)

If using SCCs to transfer data to countries without adequacy decisions (e.g., USA), you must conduct a TIA to assess:

1. Laws and practices in destination country
2. Whether they impinge on effectiveness of SCCs
3. Supplementary measures needed (e.g., encryption)

**For nself-chat:**

- Identify where data is stored (e.g., AWS us-east-1, GCP europe-west1)
- If storing EU data in non-adequate countries (e.g., USA), implement SCCs
- Conduct TIA to assess surveillance laws (e.g., FISA 702, EO 12333)
- Implement supplementary measures (encryption, access controls)

### 9.3 Recommended Approach for nself-chat

1. **Store EU data in EU:** Use EU-based servers for EU customers (GDPR compliance + performance)
2. **Use SCCs:** For any non-EU transfers (e.g., Sentry in USA)
3. **Encrypt Data:** Encryption at rest and in transit as supplementary measure
4. **Minimize Transfers:** Avoid unnecessary data transfers

**Action Items:**

- [ ] Identify all international data transfers
- [ ] Implement SCCs with non-EU processors
- [ ] Conduct TIA for US transfers
- [ ] Document transfer safeguards in Privacy Policy

---

## 10. Accountability and Governance

### 10.1 Accountability Principle (Article 5(2))

You must demonstrate GDPR compliance, not just achieve it.

**Evidence of Compliance:**

- ✅ Privacy Policy and Cookie Policy published
- ✅ Data processing records (Article 30)
- ✅ DPAs with processors
- ✅ Consent records
- ✅ Data subject request logs
- ✅ Data breach register
- ✅ Privacy Impact Assessments (if applicable)
- ✅ Staff training records
- ✅ Security measures documentation

### 10.2 Records of Processing Activities (Article 30)

**Required if:**

- You have 250+ employees, OR
- Processing is not occasional, OR
- Processing includes special category data or criminal convictions, OR
- Processing likely to result in high risk

**For nself-chat:** Likely required (regular processing of personal data)

**Template:**

| Processing Activity | Purpose             | Legal Basis         | Data Categories       | Data Subjects | Processors        | Retention                  | Security                    |
| ------------------- | ------------------- | ------------------- | --------------------- | ------------- | ----------------- | -------------------------- | --------------------------- |
| Account creation    | User registration   | Contract            | Email, name, password | Users         | Nhost Auth        | Account lifetime + 30 days | Encryption, RBAC            |
| Messaging           | Communication       | Contract            | Messages, files       | Users         | PostgreSQL, MinIO | Configurable               | Encryption, access controls |
| Analytics           | Service improvement | Legitimate interest | Usage data, IP        | Users         | Sentry            | 90 days                    | Anonymization               |

### 10.3 Data Protection Officer (DPO)

**Required if:**

- You are a public authority, OR
- Your core activities involve large-scale systematic monitoring, OR
- Your core activities involve large-scale processing of special category data

**For nself-chat:** Likely NOT required (unless large-scale deployment)

If required:

- [ ] Appoint DPO (can be internal or external)
- [ ] Ensure DPO independence and adequate resources
- [ ] Publish DPO contact details
- [ ] Report DPO to supervisory authority

### 10.4 Privacy Impact Assessment (PIA / DPIA)

**Required when processing is likely to result in high risk**, such as:

- Systematic and extensive profiling with significant effects
- Large-scale processing of special category data
- Systematic monitoring of publicly accessible areas (e.g., CCTV)
- Use of new technologies

**For nself-chat:** Conduct PIA if:

- Implementing AI-powered content moderation
- Introducing profiling or automated decision-making
- Deploying biometric authentication (e.g., face recognition)

**PIA Process:**

1. Describe processing activity
2. Assess necessity and proportionality
3. Identify risks to individuals
4. Identify mitigation measures
5. Document and review

---

## 11. Implementation Checklist

### 11.1 Immediate Actions (Critical)

- [x] Publish Privacy Policy (template provided: `/docs/legal/PRIVACY-POLICY.md`)
- [x] Publish Cookie Policy (template provided: `/docs/legal/COOKIE-POLICY.md`)
- [ ] Implement cookie consent banner with granular options
- [ ] Implement data export functionality (Right of Access)
- [ ] Implement account deletion (Right to Erasure)
- [ ] Sign DPAs with all processors (Nhost, Sentry, cloud provider, email service)
- [ ] Document data processing activities (Article 30 record)

### 11.2 Short-Term Actions (1-3 months)

- [ ] Implement data portability (export in JSON format)
- [ ] Create data breach response plan
- [ ] Conduct Legitimate Interest Assessments (LIA) for analytics
- [ ] Implement Transfer Impact Assessment (TIA) for international transfers
- [ ] Train staff on GDPR compliance
- [ ] Set up data subject request portal
- [ ] Review and update data retention policies

### 11.3 Ongoing Actions

- [ ] Regularly review and update Privacy Policy
- [ ] Monitor compliance with DPAs
- [ ] Log and respond to data subject requests within 1 month
- [ ] Conduct annual GDPR compliance audit
- [ ] Review security measures and update as needed
- [ ] Monitor for data breaches and respond promptly

---

## 12. Resources

### 12.1 Official Resources

- **GDPR Full Text:** [https://gdpr-info.eu/](https://gdpr-info.eu/)
- **EU Commission GDPR Portal:** [https://ec.europa.eu/info/law/law-topic/data-protection_en](https://ec.europa.eu/info/law/law-topic/data-protection_en)
- **ICO (UK):** [https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)
- **EDPB (European Data Protection Board):** [https://edpb.europa.eu/](https://edpb.europa.eu/)

### 12.2 Supervisory Authorities (Sample)

- **Germany (Federal):** BfDI - [https://www.bfdi.bund.de/](https://www.bfdi.bund.de/)
- **France:** CNIL - [https://www.cnil.fr/](https://www.cnil.fr/)
- **Ireland:** DPC - [https://www.dataprotection.ie/](https://www.dataprotection.ie/)
- **UK:** ICO - [https://ico.org.uk/](https://ico.org.uk/)

Find your supervisory authority: [https://edpb.europa.eu/about-edpb/about-edpb/members_en](https://edpb.europa.eu/about-edpb/about-edpb/members_en)

### 12.3 Tools and Templates

- **Standard Contractual Clauses (SCCs):** [https://ec.europa.eu/info/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en](https://ec.europa.eu/info/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en)
- **ICO Accountability Framework:** [https://ico.org.uk/for-organisations/accountability-framework/](https://ico.org.uk/for-organisations/accountability-framework/)
- **DPIA Template:** [https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/)

---

## 13. Contact

For GDPR compliance questions, contact:

**Data Protection Team:**

- Email: [privacy@yourcompany.com]
- DPO (if appointed): [dpo@yourcompany.com]

**Lead Supervisory Authority:**

- [INSERT YOUR LEAD SUPERVISORY AUTHORITY]
- [INSERT CONTACT INFORMATION]

---

**DISCLAIMER:** This guide is for informational purposes only and does NOT constitute legal advice. Consult with qualified legal counsel to ensure GDPR compliance for your specific circumstances.

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Next Review:** January 31, 2027
