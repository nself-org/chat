# CCPA Compliance Guide

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Applicable To:** nself-chat application

---

## Introduction

This document provides guidance on California Consumer Privacy Act (CCPA) compliance for the nself-chat application. It is intended for administrators, developers, and privacy officers who need to understand and implement CCPA requirements.

**IMPORTANT:** This is a technical implementation guide, NOT legal advice. Consult with legal counsel to ensure full CCPA compliance for your specific use case and jurisdiction.

**Scope:** This guide applies to:

- California residents (consumers)
- Businesses that serve California residents and meet CCPA thresholds

---

## 1. CCPA Overview

The California Consumer Privacy Act (CCPA) is a comprehensive privacy law that grants California residents specific rights over their personal information.

### 1.1 Who Must Comply?

You must comply with CCPA if you:

1. Are a for-profit business, AND
2. Do business in California, AND
3. Meet ONE of the following thresholds:
   - Have annual gross revenues exceeding $25 million, OR
   - Buy, sell, or share personal information of 100,000+ California consumers or households annually, OR
   - Derive 50% or more of annual revenue from selling consumers' personal information

**For nself-chat:** If you meet these thresholds and serve California users, you must comply with CCPA.

### 1.2 Key Definitions

- **Consumer:** California resident (natural person)
- **Personal Information (PI):** Information that identifies, relates to, or could reasonably be linked to a California consumer or household
- **Sell/Sale:** Selling, renting, releasing, disclosing, disseminating, making available, transferring, or communicating PI for monetary or other valuable consideration
- **Business:** For-profit entity that meets CCPA thresholds
- **Service Provider:** Entity that processes PI on behalf of a business (similar to GDPR "processor")
- **Third Party:** Entity that receives PI from a business but is NOT a service provider

### 1.3 CPRA (California Privacy Rights Act)

CPRA amended CCPA effective January 1, 2023. Key changes:

- Added "Right to Correct" and "Right to Limit Use of Sensitive Personal Information"
- Created California Privacy Protection Agency (CPPA) for enforcement
- Expanded definition of "sensitive personal information"
- Stricter rules for automated decision-making

**This guide covers CCPA as amended by CPRA.**

---

## 2. Consumer Rights Under CCPA

### 2.1 Right to Know (CCPA § 1798.100, 1798.110, 1798.115)

Consumers can request disclosure of:

- Categories of PI collected
- Specific pieces of PI collected
- Categories of sources from which PI was collected
- Business/commercial purpose for collecting PI
- Categories of third parties with whom PI is shared
- Categories of PI sold or shared (if any)

**Timeline:** Respond within 45 days (extendable by 45 days with notice)

**Verification:** Verify identity before disclosing PI

**Implementation in nself-chat:**

- Privacy Policy discloses categories and purposes (see `/docs/legal/PRIVACY-POLICY.md`)
- Data export functionality provides specific pieces of PI
- API endpoint: `/api/user/ccpa/know` (to be implemented)

### 2.2 Right to Delete (CCPA § 1798.105)

Consumers can request deletion of their PI (with exceptions).

**Timeline:** Respond within 45 days

**Exceptions (you may refuse deletion if necessary for):**

- Complete transaction or provide requested service
- Detect security incidents, fraud, or illegal activity
- Debug or repair errors
- Exercise free speech or ensure another consumer's right to free speech
- Comply with legal obligations (e.g., California Electronic Communications Privacy Act)
- Internal uses reasonably aligned with consumer expectations
- Otherwise permitted by law

**Implementation in nself-chat:**

- Account Settings > Privacy & Data > Delete My Account
- API endpoint: `/api/user/ccpa/delete`
- 30-day grace period before permanent deletion
- Exceptions: Billing records (7 years), fraud logs

### 2.3 Right to Correct (CPRA)

Consumers can request correction of inaccurate PI.

**Timeline:** Respond within 45 days

**Implementation in nself-chat:**

- Account Settings > Profile (self-service correction)
- Support request for data not user-editable
- API endpoint: `/api/user/ccpa/correct`

### 2.4 Right to Opt-Out of Sale/Sharing (CCPA § 1798.120)

Consumers can opt out of the sale or sharing of their PI.

**Implementation in nself-chat:**

- **Good News:** nself-chat does NOT sell or share PI for monetary or valuable consideration
- Privacy Policy clearly states "We do NOT sell your personal information"
- No "Do Not Sell My Personal Information" link required if no selling occurs
- If selling/sharing in the future, implement opt-out and link

### 2.5 Right to Limit Use of Sensitive PI (CPRA)

Consumers can limit use of sensitive PI to:

- Performing services reasonably expected
- Ensuring security and integrity
- Short-term, transient use
- Certain other specified purposes

**Sensitive PI includes:**

- Social Security number, driver's license, passport number
- Account login credentials
- Precise geolocation
- Racial or ethnic origin, religious or philosophical beliefs, union membership
- Contents of mail, email, text messages (if not directed to business)
- Genetic data, biometric data for identification
- Health data, sex life, sexual orientation

**Implementation in nself-chat:**

- nself-chat does NOT intentionally collect most sensitive PI
- Passwords are hashed (not considered "collected" in plaintext)
- If collecting sensitive PI in the future, implement opt-out

### 2.6 Right to Non-Discrimination (CCPA § 1798.125)

Businesses cannot discriminate against consumers who exercise their CCPA rights.

**Prohibited Actions:**

- ❌ Deny goods or services
- ❌ Charge different prices or rates
- ❌ Provide different level or quality of service
- ❌ Suggest consumer will receive different price or service

**Permitted (with notice):**

- ✅ Offer financial incentives for collection, sale, or deletion of PI (if not discriminatory)
- ✅ Charge different price or rate if difference is reasonably related to value of PI

**Implementation in nself-chat:**

- No discrimination based on CCPA rights exercise
- No financial incentive programs currently
- If implementing loyalty programs, provide separate notice

---

## 3. Business Obligations

### 3.1 Privacy Policy Requirements (CCPA § 1798.130)

Your Privacy Policy must disclose:

**At or Before Collection:**

- Categories of PI to be collected
- Purposes for which PI will be used
- If selling PI, right to opt-out

**In Privacy Policy:**

- Categories of PI collected in past 12 months
- Categories of sources from which PI was collected
- Business/commercial purposes for collecting PI
- Categories of third parties with whom PI is shared
- Specific pieces of PI collected (if Right to Know request)
- Categories of PI sold or shared (if any)
- Consumer rights (Know, Delete, Correct, Opt-Out, Limit, Non-Discrimination)
- How to exercise rights
- Response timelines

**Implementation in nself-chat:**

- ✅ Privacy Policy template provided: `/docs/legal/PRIVACY-POLICY.md`
- ✅ Includes all required disclosures
- ✅ Update every 12 months or when material changes occur

### 3.2 Notice at Collection

When collecting PI, provide notice of:

- Categories of PI being collected
- Purposes for use

**Implementation in nself-chat:**

- Privacy notice during account registration
- Link to full Privacy Policy: "By signing up, you agree to our Privacy Policy and Terms of Service"
- Just-in-time notices for specific features (e.g., "We use your location to show nearby users")

### 3.3 Conspicuous "Do Not Sell or Share" Link

**Required if:** You sell or share PI

**Implementation in nself-chat:**

- ❌ Not required (we do NOT sell or share PI)
- ✅ Privacy Policy states: "We do NOT sell your personal information"
- If selling/sharing in the future:
  - Add link to homepage footer: "Do Not Sell or Share My Personal Information"
  - Link to opt-out page or preference center

### 3.4 Authorized Agent Requests

Consumers can designate an authorized agent to make requests on their behalf.

**Requirements:**

- Verify authorized agent (written permission from consumer)
- Verify consumer's identity
- May require consumer to confirm authorization directly

**Implementation in nself-chat:**

- Support requests from authorized agents
- Require:
  - Proof of authorization (signed letter, power of attorney)
  - Consumer verification (email confirmation, account login)

### 3.5 Contracts with Service Providers

Service providers must contractually agree to:

- Process PI only for limited business purpose
- Not sell PI
- Not retain, use, or disclose PI for any purpose other than performing services
- Certify understanding of restrictions

**Implementation in nself-chat:**

- Review contracts with:
  - Cloud hosting provider (AWS/GCP/Azure)
  - Nhost (authentication)
  - Sentry (monitoring)
  - Email service provider
- Ensure CCPA service provider language is included
- Many providers offer standard CCPA addendums

---

## 4. Personal Information Categories

### 4.1 Categories Collected by nself-chat

| Category                                           | Examples                                                                                                | Collected?          | Purpose                                      | Disclosed to Third Parties? | Sold? |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------- | --------------------------- | ----- |
| **A. Identifiers**                                 | Name, email, username, IP address                                                                       | ✅ Yes              | Account creation, authentication, security   | Yes (service providers)     | ❌ No |
| **B. Personal Info (Cal. Civ. Code § 1798.80(e))** | Name, email, phone (if provided)                                                                        | ✅ Yes              | Account management, communication            | Yes (service providers)     | ❌ No |
| **C. Protected Classifications**                   | Age (if collected for compliance)                                                                       | ⚠️ Minimal          | Age verification (13+)                       | No                          | ❌ No |
| **D. Commercial Information**                      | Purchase records, billing history                                                                       | ✅ Yes (paid plans) | Billing, payment processing                  | Yes (payment processor)     | ❌ No |
| **E. Biometric Information**                       | None                                                                                                    | ❌ No               | N/A                                          | N/A                         | ❌ No |
| **F. Internet/Network Activity**                   | Browser, device, IP, pages viewed, errors                                                               | ✅ Yes              | Security, analytics, debugging               | Yes (Sentry)                | ❌ No |
| **G. Geolocation Data**                            | Approximate location (from IP)                                                                          | ⚠️ Approximate      | Analytics, fraud prevention                  | Yes (service providers)     | ❌ No |
| **H. Sensory Data**                                | Audio (voice messages, if enabled)                                                                      | ⚠️ Optional         | Voice messaging feature                      | Yes (storage provider)      | ❌ No |
| **I. Professional/Employment Info**                | Company name, job title (if provided)                                                                   | ⚠️ Optional         | User profile                                 | No                          | ❌ No |
| **J. Non-Public Education Info**                   | None                                                                                                    | ❌ No               | N/A                                          | N/A                         | ❌ No |
| **K. Inferences**                                  | User preferences, behavior patterns                                                                     | ⚠️ Derived          | Personalization                              | No                          | ❌ No |
| **L. Sensitive Personal Information**              | Account login credentials (hashed), precise geolocation (if enabled), message contents (user-generated) | ⚠️ Limited          | Authentication, messaging, location features | Yes (service providers)     | ❌ No |

### 4.2 Categories of Sources

- **Directly from consumers:** Account registration, profile updates, messages, file uploads
- **Automatically collected:** Usage data, device information, IP addresses, cookies
- **Third-party authentication:** OAuth providers (Google, GitHub, etc.) - name, email, profile picture

### 4.3 Business/Commercial Purposes

- **Service Delivery:** Provide chat, messaging, file sharing, notifications
- **Authentication:** Verify identity, manage sessions
- **Security:** Fraud prevention, abuse detection, security monitoring
- **Customer Support:** Respond to inquiries, troubleshoot issues
- **Analytics:** Understand usage patterns, improve features
- **Legal Compliance:** Comply with laws, respond to legal requests
- **Debugging:** Identify and repair errors (via Sentry)

### 4.4 Third Parties Receiving PI

- **Service Providers (CCPA compliant):**
  - Cloud hosting (AWS/GCP/Azure)
  - Authentication (Nhost)
  - Error tracking (Sentry)
  - Email service (Mailgun/SendGrid)
  - Payment processor (Stripe/PayPal)
  - Storage (MinIO/S3)

- **Third Parties (for legal compliance):**
  - Law enforcement (when legally required)
  - Regulatory authorities (when required)

---

## 5. Responding to Consumer Requests

### 5.1 Request Methods

Provide at least two methods for submitting requests:

- ✅ Toll-free phone number (if you have one)
- ✅ Website form or portal
- ✅ Email address
- ✅ In-app functionality (preferred for digital services)

**Implementation in nself-chat:**

- Email: [privacy@yourcompany.com]
- In-app: Account Settings > Privacy & Data > Submit CCPA Request
- Support portal: [INSERT URL]
- Phone: [INSERT TOLL-FREE NUMBER] (optional for online businesses)

### 5.2 Verification Process

**Standard Verification (for non-account-based requests):**

1. Request consumer to provide information that matches information you already have
2. Match at least 2 or 3 data points (depending on sensitivity)
3. If unable to verify, deny request and explain

**Account-Based Verification (for nself-chat users):**

1. Require login to authenticated account
2. For sensitive requests (deletion, specific PI), require additional verification:
   - Email confirmation link
   - Security question
   - Two-factor authentication (if enabled)

**Authorized Agent Verification:**

1. Require written authorization from consumer
2. Verify consumer's identity directly
3. Verify authorized agent's identity

**Password-Protected Account Exception:**

- If consumer has password-protected account, verify through login
- No additional verification required unless PI is sensitive

### 5.3 Response Requirements

**Timeline:**

- Respond within **45 days** of receipt
- Extend by additional 45 days if needed (notify consumer of extension and reason)

**Format:**

- Provide information in portable, easily usable format
- For "Right to Know" requests: JSON, CSV, or other structured format
- For "Right to Delete": Confirmation of deletion

**Free:**

- First two requests per 12-month period are free
- For excessive or repetitive requests, you may:
  - Charge reasonable fee (based on administrative costs)
  - Refuse request (if manifestly unfounded or excessive)

**Documentation:**

- Log all requests and responses
- Maintain records for at least 24 months

### 5.4 Response Templates

**Right to Know (Categories):**

```
Subject: Your CCPA Right to Know Request

Dear [Name],

We have received your request under the California Consumer Privacy Act (CCPA) to know what personal information we have collected about you.

In the past 12 months, we collected the following categories of personal information:
- Identifiers (name, email, username, IP address)
- Internet activity (usage data, browser, device)
- Commercial information (billing records, for paid plans)
- Inferences (preferences, settings)

We collected this information from:
- Directly from you (account registration, profile)
- Automatically (usage data, cookies)

We use this information for:
- Providing our service (chat, messaging, file sharing)
- Authentication and security
- Analytics and service improvement

We share this information with service providers (cloud hosting, authentication, error tracking) for business purposes. We do NOT sell your personal information.

For a detailed privacy policy, visit: [Privacy Policy URL]

If you have questions, contact us at privacy@yourcompany.com.

Best regards,
[Your Company] Privacy Team
```

**Right to Know (Specific Pieces):**

```
Subject: Your CCPA Right to Know Request (Specific Data)

Dear [Name],

We have received your request for specific pieces of personal information we have collected about you.

Please find attached:
- Your account information (JSON)
- Your messages (JSON)
- Your uploaded files (ZIP archive)
- Your activity logs (CSV)

This data covers the past 12 months, as permitted under CCPA.

Best regards,
[Your Company] Privacy Team
```

**Right to Delete:**

```
Subject: Your CCPA Right to Delete Request

Dear [Name],

We have received your request to delete your personal information under the CCPA.

Your account has been scheduled for deletion. The following data will be permanently deleted within 30 days:
- User profile and account information
- Messages and files
- Preferences and settings

The following data will be retained for legal compliance:
- Billing records (retained for 7 years per tax law)
- Fraud/abuse logs (retained for security purposes)

You can cancel this request within 30 days by contacting privacy@yourcompany.com.

You have the right to not be discriminated against for exercising your CCPA rights.

Best regards,
[Your Company] Privacy Team
```

**Request Denial (Unable to Verify):**

```
Subject: Unable to Process Your CCPA Request

Dear [Name],

We received your request under the CCPA but were unable to verify your identity based on the information provided.

To protect your privacy, we cannot disclose or delete personal information without verifying your identity.

Please provide the following to verify your identity:
- [List required information, e.g., "Email address associated with your account"]
- [Additional verification method, e.g., "Answer security question"]

Alternatively, if you have an account with us, please submit your request through our in-app privacy portal after logging in.

If you have questions, contact us at privacy@yourcompany.com.

Best regards,
[Your Company] Privacy Team
```

---

## 6. CCPA vs. GDPR Comparison

| Aspect                      | CCPA                                           | GDPR                                |
| --------------------------- | ---------------------------------------------- | ----------------------------------- |
| **Scope**                   | California residents                           | EU/EEA residents                    |
| **Who Must Comply**         | Businesses meeting revenue/data thresholds     | Any organization processing EU data |
| **Consent**                 | Opt-out model (for sale of PI)                 | Opt-in model (for most processing)  |
| **Right to Access**         | Right to Know (categories and specific pieces) | Right of Access                     |
| **Right to Delete**         | Right to Delete (with exceptions)              | Right to Erasure (with exceptions)  |
| **Right to Correct**        | Right to Correct (CPRA)                        | Right to Rectification              |
| **Right to Portability**    | Right to Know includes portability             | Right to Data Portability           |
| **Opt-Out**                 | Opt-out of sale/sharing                        | Opt-in for most processing          |
| **Penalties**               | Up to $7,500 per intentional violation         | Up to €20M or 4% global revenue     |
| **Private Right of Action** | Yes (for data breaches)                        | No (regulatory enforcement only)    |

**Implementation Tip:** If you comply with GDPR, you're mostly CCPA-compliant. Additional CCPA-specific requirements:

- "Do Not Sell" link (if selling PI)
- CCPA-specific language in Privacy Policy
- Response timelines (45 days vs. GDPR's 1 month)

---

## 7. Implementation Checklist

### 7.1 Immediate Actions (Critical)

- [x] Update Privacy Policy to include CCPA disclosures (template provided)
- [ ] Implement consumer request portal (Right to Know, Delete, Correct)
- [ ] Verify identity before responding to requests
- [ ] Train staff on CCPA compliance and request handling
- [ ] Review contracts with service providers for CCPA compliance
- [ ] Document no sale of personal information (if applicable)

### 7.2 Short-Term Actions (1-3 months)

- [ ] Implement data export functionality (JSON/CSV format)
- [ ] Create consumer request tracking system
- [ ] Document data retention policies
- [ ] Set up automated reminders for 45-day response deadline
- [ ] Review and update notice at collection
- [ ] Conduct privacy impact assessment

### 7.3 Ongoing Actions

- [ ] Respond to consumer requests within 45 days
- [ ] Update Privacy Policy at least annually
- [ ] Maintain request logs for 24+ months
- [ ] Train new staff on CCPA compliance
- [ ] Monitor for CCPA regulation updates
- [ ] Conduct annual CCPA compliance audit

---

## 8. Penalties and Enforcement

### 8.1 Regulatory Enforcement

**California Privacy Protection Agency (CPPA):**

- Can assess civil penalties up to **$2,500 per violation**
- Up to **$7,500 per intentional violation** or violations involving minors

**Attorney General:**

- Can bring enforcement actions
- 30-day cure period before penalties (for certain violations)

### 8.2 Private Right of Action

Consumers can sue for data breaches involving:

- Unauthorized access to or exfiltration, theft, or disclosure of **non-encrypted or non-redacted personal information**

**Statutory Damages:**

- $100 to $750 per consumer per incident, OR
- Actual damages, whichever is greater

**Class Actions:**

- Consumers can bring class action lawsuits for data breaches

### 8.3 Mitigation Strategies

1. **Implement Strong Security:**
   - Encrypt data at rest and in transit
   - Use secure authentication (bcrypt, JWT)
   - Regular security audits and penetration testing
   - Incident response plan

2. **Respond Promptly:**
   - Respond to requests within 45 days
   - Document all requests and responses
   - Provide clear, transparent communication

3. **Document Compliance:**
   - Maintain privacy policy and notices
   - Log consumer requests
   - Document service provider contracts
   - Conduct regular compliance audits

4. **Train Staff:**
   - CCPA awareness training
   - Request handling procedures
   - Data breach response protocols

---

## 9. Additional California Laws

### 9.1 California Online Privacy Protection Act (CalOPPA)

**Requirements:**

- Post conspicuous privacy policy
- Disclose how you respond to Do Not Track (DNT) signals
- Disclose if third parties collect PI for behavioral advertising

**Implementation in nself-chat:**

- ✅ Privacy Policy posted and linked in footer
- ✅ DNT disclosure: "We do not currently respond to DNT signals"
- ✅ Third-party disclosure: "We use Sentry for error tracking; they do not use data for advertising"

### 9.2 California Shine the Light Law (Cal. Civ. Code § 1798.83)

**Requirements:**

- California residents can request information about PI shared with third parties for direct marketing

**Implementation in nself-chat:**

- ❌ Not applicable (we do NOT share PI with third parties for their direct marketing)
- ✅ Privacy Policy states: "We do not share your personal information with third parties for their direct marketing purposes"

### 9.3 COPPA (Children's Online Privacy Protection Act)

**Requirements:**

- Obtain verifiable parental consent before collecting PI from children under 13

**Implementation in nself-chat:**

- ✅ Terms of Service require users to be 13+ years old
- ✅ Privacy Policy states: "The Service is not intended for children under 13"
- ✅ If collect child data, delete promptly and notify parents

---

## 10. Resources

### 10.1 Official Resources

- **CCPA Full Text:** [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- **CPRA (Amendment):** [https://cppa.ca.gov/](https://cppa.ca.gov/)
- **California Privacy Protection Agency:** [https://cppa.ca.gov/](https://cppa.ca.gov/)
- **AG's CCPA Regulations:** [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)

### 10.2 Guidance Documents

- **AG's CCPA FAQs:** [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)
- **IAPP CCPA Resources:** [https://iapp.org/resources/topics/california-consumer-privacy-act/](https://iapp.org/resources/topics/california-consumer-privacy-act/)
- **CPPA Rulemaking:** [https://cppa.ca.gov/regulations/](https://cppa.ca.gov/regulations/)

### 10.3 Tools and Templates

- **Privacy Policy Generator:** [https://www.iubenda.com/](https://www.iubenda.com/)
- **Request Portal Templates:** Available from privacy management platforms (OneTrust, TrustArc, etc.)
- **CCPA Compliance Checklist:** [https://oag.ca.gov/privacy/ccpa](https://oag.ca.gov/privacy/ccpa)

---

## 11. Contact

For CCPA compliance questions, contact:

**Privacy Team:**

- Email: [privacy@yourcompany.com]
- Phone: [INSERT TOLL-FREE NUMBER]
- Mail: [INSERT PHYSICAL ADDRESS]

**California Attorney General:**

- Website: [https://oag.ca.gov/contact](https://oag.ca.gov/contact)
- Phone: (916) 210-6276

**California Privacy Protection Agency:**

- Website: [https://cppa.ca.gov/contact](https://cppa.ca.gov/contact)

---

**DISCLAIMER:** This guide is for informational purposes only and does NOT constitute legal advice. Consult with qualified legal counsel to ensure CCPA compliance for your specific circumstances.

**Document Version:** 1.0
**Last Updated:** January 31, 2026
**Next Review:** January 31, 2027
