# Security Policy

## Supported Versions

ɳChat is currently in active development. Security updates are provided for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| 0.2.x   | :x:                |
| 0.1.x   | :x:                |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in ɳChat, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report security issues to:
- **Email**: security@nself.org
- **Subject**: [SECURITY] Brief description of the issue

### What to Include

Please include the following information in your report:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and attack scenarios
3. **Reproduction**: Step-by-step instructions to reproduce
4. **Proof of Concept**: Code or screenshots demonstrating the issue
5. **Suggested Fix**: If you have ideas on how to fix it (optional)
6. **Your Contact**: Email and/or GitHub username for follow-up

### Example Report

```
Subject: [SECURITY] XSS vulnerability in message rendering

Description:
A cross-site scripting (XSS) vulnerability exists in the message
rendering component that allows attackers to execute arbitrary
JavaScript in other users' browsers.

Impact:
An attacker could steal session tokens, perform actions on behalf
of users, or redirect users to malicious sites.

Reproduction Steps:
1. Create a new message in any channel
2. Insert the following payload: <script>alert(document.cookie)</script>
3. Send the message
4. Observe that the JavaScript executes when other users view the message

Proof of Concept:
[Screenshot or video showing the vulnerability]

Suggested Fix:
Ensure all user-generated content is properly sanitized using
DOMPurify before rendering. The TipTap editor should be configured
to strip script tags.

Contact:
researcher@example.com
GitHub: @securityresearcher
```

### Response Timeline

We are committed to responding to security reports promptly:

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with assessment and timeline
- **Fix Development**: Varies by severity, typically 14-30 days
- **Public Disclosure**: After fix is deployed and users have had time to update

### Severity Levels

We classify vulnerabilities using the following severity levels:

#### Critical
- Remote code execution
- Authentication bypass
- SQL injection
- Privilege escalation to admin

**Response**: Immediate (0-24 hours)

#### High
- Stored XSS
- CSRF on sensitive operations
- Insecure direct object references (IDOR)
- Sensitive data exposure

**Response**: Within 72 hours

#### Medium
- Reflected XSS
- Open redirects
- Information disclosure (non-sensitive)
- Missing security headers

**Response**: Within 7 days

#### Low
- Self-XSS
- Verbose error messages
- Minor information leaks

**Response**: Within 14 days

### Scope

The following are considered **in scope** for security reports:

✅ **In Scope**:
- Authentication and authorization bypass
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- SQL injection
- Server-side request forgery (SSRF)
- Remote code execution (RCE)
- Privilege escalation
- Insecure direct object references (IDOR)
- Security misconfigurations
- Sensitive data exposure
- API security issues
- WebSocket security issues
- GraphQL injection

❌ **Out of Scope**:
- Denial of service (DoS/DDoS) attacks
- Social engineering attacks on users
- Physical attacks on infrastructure
- Spam or social abuse
- Issues in third-party services (report to those vendors)
- Theoretical vulnerabilities without proof of concept
- Vulnerabilities requiring physical access
- Vulnerabilities requiring social engineering

### Testing Guidelines

If you want to test for vulnerabilities:

#### Permitted
- ✅ Use your own test account
- ✅ Test on a local development instance
- ✅ Automated scanning with rate limits respected
- ✅ Manual testing of authentication/authorization
- ✅ Testing file upload vulnerabilities

#### Prohibited
- ❌ Testing on production systems without permission
- ❌ Accessing other users' data
- ❌ Denial of service attacks
- ❌ Spamming or creating mass accounts
- ❌ Physical or social engineering attacks
- ❌ Destructive testing (deletion of data)

### Rewards

Currently, ɳChat does not offer a bug bounty program. However:

- 🏆 Security researchers will be acknowledged in our Hall of Fame
- 📣 Public recognition in release notes (with your permission)
- 🎁 Swag for critical vulnerability discoveries
- 🤝 Potential collaboration opportunities on security enhancements

### Security Acknowledgments

We want to thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- This section will be updated as reports come in -->

*No vulnerabilities reported yet. Be the first!*

### Security Best Practices

#### For Users

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of letters, numbers, symbols
   - Use a password manager

2. **Enable Two-Factor Authentication**
   - Available for owner and admin accounts
   - Use authenticator apps (not SMS when possible)

3. **Keep Software Updated**
   - Check for updates regularly
   - Enable automatic updates when available

4. **Review Connected Apps**
   - Periodically review OAuth connections
   - Revoke access for unused applications

5. **Verify Email Addresses**
   - Only trust emails from @nself.org or your configured domain
   - Check for HTTPS before entering credentials

#### For Administrators

1. **Regular Security Audits**
   - Run security scans monthly
   - Review access logs weekly
   - Update dependencies regularly

2. **Access Control**
   - Follow principle of least privilege
   - Review user permissions quarterly
   - Use role-based access control (RBAC)

3. **Data Protection**
   - Enable encryption at rest
   - Use TLS/SSL for all connections
   - Regular database backups

4. **Monitoring**
   - Set up security alerts
   - Monitor for suspicious activity
   - Log all administrative actions

5. **Incident Response**
   - Have a security incident response plan
   - Test the plan annually
   - Document all security incidents

### Security Features

ɳChat includes the following security features:

#### Authentication
- JWT-based authentication with refresh tokens
- OAuth 2.0 support (Google, GitHub, etc.)
- Magic link passwordless authentication
- Two-factor authentication (2FA) with TOTP
- Session management with secure logout

#### Authorization
- Role-based access control (RBAC)
- Granular permission system
- Channel-level permissions
- API rate limiting

#### Data Protection
- Passwords hashed with bcrypt
- Sensitive data encrypted at rest
- TLS/SSL for all connections
- HTTPS-only cookies with secure flags
- CSRF protection on all forms

#### Frontend Security
- Content Security Policy (CSP) headers
- XSS protection via React escaping
- Input validation with Zod schemas
- DOMPurify for user-generated content
- Subresource Integrity (SRI) for CDN assets

#### Backend Security
- SQL injection prevention (Hasura)
- GraphQL query complexity limits
- WebSocket authentication
- File upload validation
- CORS configuration

#### Privacy
- Privacy-aware analytics
- GDPR compliance features
- Data export functionality
- Account deletion with data purge
- Configurable data retention

### Security Roadmap

Upcoming security enhancements:

- [ ] Security audit by external firm (Q1 2026)
- [ ] Penetration testing (Q1 2026)
- [ ] Hardware 2FA support (YubiKey, etc.)
- [ ] Advanced threat detection
- [ ] End-to-end encryption for DMs (E2EE)
- [ ] Security incident dashboard
- [ ] Automated vulnerability scanning
- [ ] Bug bounty program launch (Q2 2026)

### Contact

For non-security inquiries:
- **General Support**: support@nself.org
- **GitHub Issues**: https://github.com/acamarata/nself-chat/issues
- **Documentation**: https://docs.nself.org

For security-specific inquiries:
- **Email**: security@nself.org
- **PGP Key**: [Coming Soon]

---

*This security policy is effective as of 2026-01-29 and may be updated periodically.*
