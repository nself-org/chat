# nChat Self-Hosted: Legal Considerations for Operators

This page covers legal obligations for self-hosted nChat deployments. It is not legal advice. Consult qualified counsel for your specific situation.

---

## Call Recording Consent

**This is the highest legal risk area for nChat operators.**

Call recording without all-party consent is a criminal wiretapping violation in 10 US states (CA, FL, IL, MA, MD, MT, NH, NV, PA, WA) and in several EU countries (Belgium, Germany, Spain). The federal US baseline (ECPA) is one-party consent; state law can be stricter.

### Operator obligations

1. **Do not disable the consent banner.** nChat displays a recording notice to all participants before recording starts. All participants must acknowledge it before recording begins. This banner is your legal protection.

2. **No covert recording.** Never configure LiveKit egress recording to start before the consent banner fires. This includes server-side recording rules, scheduled recordings, and automated transcription pipelines.

3. **All-party consent states.** If any participant in a call may be located in CA, FL, IL, MA, MD, MT, NH, NV, PA, or WA, all-party consent is legally required. The consent banner covers this when all participants click "Continue" — but if participants are located in these states, you are responsible for ensuring the banner reaches them and they acknowledge it.

4. **DSAR compliance.** EU residents have the right to access, export, or delete their recordings. Use `nself dsar export <user_id>` to generate the export. Respond within the timeframe required by your jurisdiction (GDPR: 30 days).

5. **Retention.** Set `REC_RETENTION_DAYS` to match your compliance obligations. Default is 90 days. Operators in regulated industries (healthcare, finance, legal) must set this per their applicable law.

6. **Litigation hold.** If you receive a legal hold notice, set `held = true` on relevant recordings in your database. The nightly retention cron skips records with `held = true`.

### Full jurisdiction matrix

[Recording Consent Policy](https://nself.org/legal/recording-consent) — includes all 10 US two-party-consent states + EU jurisdictions + operator obligation checklist.

---

## Encryption Disclosure

nChat chat messages are end-to-end encrypted (post-quantum Kyber). nChat voice/video calls are TLS-encrypted in transit but NOT end-to-end encrypted at v1.0.9 — call streams pass through your LiveKit Server. SFrame-based AV E2EE is planned for v1.1.0.

Do not represent call streams as end-to-end encrypted to your users until v1.1.0. See [Encryption Scope](https://docs.nself.org/docs/chat/encryption-scope) for the full disclosure.

---

## GDPR / Data Processing

If you host nChat for EU residents, you are the **data controller** for all data stored on your instance. Key obligations:

- **Privacy notice:** Display a clear privacy notice to users describing what data is collected and how it is processed.
- **Lawful basis:** Identify a lawful basis (typically contract or legitimate interest) for each processing activity.
- **DSAR:** Respond to data subject access requests within 30 days. `nself dsar export` covers the machine-readable export.
- **Data retention:** Set retention policies for messages, recordings, and user data. The default recording retention is 90 days.
- **Sub-processors:** If you integrate AI transcription (voice plugin), you are adding a sub-processor. Disclose this in your privacy notice and execute a data processing agreement with the AI provider.

See [GDPR Compliance](GDPR-COMPLIANCE.md) for the full nChat GDPR implementation notes.

---

## US State Privacy Laws

- **CCPA (California):** Operators targeting California residents must provide a "Do Not Sell My Personal Information" link and honor opt-out requests. See [CCPA Compliance](CCPA-COMPLIANCE.md).
- **COPPA:** nChat is not suitable for users under 13 without a COPPA compliance program. If your instance is accessible to minors, implement age-gating.
- **HIPAA:** nSelf v1.0.9 is NOT BAA-ready. Do not use nChat to transmit or store ePHI.

---

## Acceptable Use

Remind your users of the nSelf Acceptable Use Policy key prohibitions, particularly:

- No covert recording
- No CSAM
- No spam or phishing
- No illegal content

Reference: [Acceptable Use Policy](https://nself.org/legal/acceptable-use)
