# SSO/SAML Setup Guide

Enterprise Single Sign-On (SSO) configuration for nself-chat using SAML 2.0 protocol.

## Table of Contents

1. [Overview](#overview)
2. [Supported Providers](#supported-providers)
3. [Prerequisites](#prerequisites)
4. [Configuration Steps](#configuration-steps)
5. [Provider-Specific Guides](#provider-specific-guides)
6. [Troubleshooting](#troubleshooting)

## Overview

nself-chat supports SAML 2.0 Single Sign-On for enterprise authentication. This allows users to authenticate using your organization's existing identity provider (IdP).

### Features

- **SAML 2.0 Protocol**: Industry-standard authentication
- **Multiple Providers**: Support for Okta, Azure AD, Google Workspace, OneLogin, and more
- **Just-in-Time (JIT) Provisioning**: Automatically create users on first login
- **Attribute Mapping**: Map IdP attributes to user fields
- **Role Mapping**: Automatically assign roles based on IdP groups
- **Domain Restrictions**: Limit SSO to specific email domains

## Supported Providers

nself-chat includes pre-configured templates for:

- **Okta**
- **Microsoft Azure AD**
- **Google Workspace**
- **OneLogin**
- **Auth0**
- **Ping Identity**
- **JumpCloud**
- **Generic SAML 2.0** (for custom providers)

## Prerequisites

Before configuring SSO, you'll need:

1. **Admin Access**: Owner or Admin role in nself-chat
2. **IdP Access**: Admin access to your identity provider
3. **Certificate**: X.509 certificate from your IdP (PEM format)
4. **Metadata URLs**: IdP entity ID and SSO URL

## Configuration Steps

### 1. Access SSO Configuration

Navigate to **Admin Dashboard → Security → SSO Configuration**

### 2. Create New Connection

Click **"Add Connection"** and select your provider from the dropdown.

### 3. Basic Settings

```yaml
Connection Name: Your Organization SSO
Provider: [Select from dropdown]
Enabled: [Toggle on when ready]
Allowed Domains: example.com, acme.com
```

### 4. Identity Provider Settings

Configure your IdP details:

```yaml
IdP Entity ID: https://idp.example.com/saml/metadata
IdP SSO URL: https://idp.example.com/saml/sso
IdP Certificate: [Paste X.509 certificate in PEM format]
```

### 5. Service Provider URLs

nself-chat provides these URLs for your IdP configuration:

```yaml
SP Entity ID: https://your-domain.com/auth/saml
Assertion Consumer Service (ACS) URL: https://your-domain.com/api/auth/saml/callback
```

### 6. Attribute Mapping

Pre-configured based on provider, but customizable:

```yaml
Email: email
First Name: firstName
Last Name: lastName
Display Name: displayName
Groups: groups
```

### 7. Role Mapping (Optional)

Map IdP groups to nself-chat roles:

```yaml
Admin Group → Administrator
Moderator Group → Moderator
Default Role → Member
```

### 8. Advanced Settings

```yaml
JIT Provisioning: Enabled
Update User on Login: Enabled
Default Role: member
```

### 9. Download SP Metadata

Click **"Download Metadata"** to get the XML file for your IdP.

### 10. Test Connection

Click **"Test Connection"** to verify the configuration.

## Provider-Specific Guides

### Okta

1. **Create SAML Application**
   - Admin Console → Applications → Create App Integration
   - Choose "SAML 2.0"
   - App name: "nself-chat"

2. **Configure SAML Settings**
   - Single sign-on URL: Your ACS URL
   - Audience URI: Your SP Entity ID
   - Name ID format: EmailAddress
   - Application username: Email

3. **Attribute Statements**

   ```
   email → user.email
   firstName → user.firstName
   lastName → user.lastName
   groups → user.groups
   ```

4. **Group Attribute Statements**

   ```
   groups → Matches regex: .*
   ```

5. **Download Certificate**
   - Sign-On tab → SAML Signing Certificates
   - Download X.509 Certificate

6. **Get IdP Metadata**
   - Sign-On tab → View Setup Instructions
   - Copy "Identity Provider metadata" URL

### Azure AD (Microsoft Entra ID)

1. **Create Enterprise Application**
   - Azure Portal → Enterprise Applications → New Application
   - Create your own application
   - Name: "nself-chat"

2. **Configure Single Sign-On**
   - Single sign-on → SAML
   - Basic SAML Configuration:
     - Identifier (Entity ID): Your SP Entity ID
     - Reply URL (ACS): Your ACS URL

3. **Attributes & Claims**

   ```
   email → user.mail
   firstName → user.givenname
   lastName → user.surname
   displayName → user.displayname
   groups → user.groups
   ```

4. **Download Certificate**
   - SAML Signing Certificate → Download Certificate (Base64)

5. **Azure AD Identifier**
   - Copy "Azure AD Identifier" for IdP Entity ID
   - Copy "Login URL" for IdP SSO URL

### Google Workspace

1. **Create SAML App**
   - Admin console → Apps → Web and mobile apps
   - Add app → Add custom SAML app
   - App name: "nself-chat"

2. **Google IdP Information**
   - Download Metadata or note:
     - SSO URL
     - Entity ID
     - Certificate

3. **Service Provider Details**
   - ACS URL: Your ACS URL
   - Entity ID: Your SP Entity ID
   - Name ID format: EMAIL
   - Name ID: Basic Information > Primary email

4. **Attribute Mapping**

   ```
   email → Primary email
   firstName → First name
   lastName → Last name
   ```

5. **Group Membership (Optional)**
   - Directory → Groups → Add user's groups

## Security Best Practices

### 1. Certificate Management

- **Rotation**: Rotate certificates annually
- **Secure Storage**: Never commit certificates to version control
- **Monitoring**: Set expiration alerts

### 2. Access Control

- **Domain Restrictions**: Only allow verified company domains
- **JIT Provisioning**: Review new user settings
- **Role Mappings**: Audit group-to-role mappings regularly

### 3. Audit Logging

- **Enable Audit Logs**: Track all SSO authentications
- **Monitor Failed Logins**: Set up alerts for failures
- **Regular Reviews**: Review SSO activity monthly

### 4. High Availability

- **Multiple Connections**: Configure backup IdP if available
- **Fallback**: Keep email/password enabled for emergencies
- **Testing**: Test SSO in staging environment first

## Troubleshooting

### Common Issues

#### 1. "Invalid SAML Response"

**Cause**: Certificate mismatch or expired
**Solution**:

- Verify certificate format (PEM)
- Check certificate expiration
- Ensure no extra whitespace in certificate

#### 2. "Email attribute not found"

**Cause**: Incorrect attribute mapping
**Solution**:

- Check IdP attribute names
- Use browser dev tools to inspect SAML response
- Update attribute mapping in nself-chat

#### 3. "Domain not allowed"

**Cause**: User's email domain not in allowed list
**Solution**:

- Add domain to "Allowed Domains" list
- Or remove domain restrictions

#### 4. "JIT Provisioning Failed"

**Cause**: Missing required attributes
**Solution**:

- Ensure email attribute is configured
- Check IdP sends required attributes
- Review audit logs for details

### Debug Mode

Enable verbose logging:

```typescript
// In production environment variables
SAML_DEBUG = true
SAML_LOG_LEVEL = debug
```

### Testing Tools

1. **SAML Tracer** (Browser Extension)
   - Capture SAML requests/responses
   - Inspect attribute values

2. **SAML Decoder** (Online Tool)
   - Decode SAML assertions
   - Verify signature validity

3. **Test Connection Button**
   - Built-in connection testing
   - Validates configuration

## Compliance & Certifications

nself-chat SSO implementation supports:

- **SOC 2 Type II**: Audit logging and access controls
- **GDPR**: Data privacy and user consent
- **HIPAA**: Secure authentication for healthcare
- **FedRAMP**: Federal security requirements (with approved IdP)

## Migration Guide

### From Email/Password to SSO

1. **Preparation**
   - Notify users of migration
   - Match email addresses between systems
   - Set up SSO connection (keep disabled)

2. **Testing**
   - Enable SSO for test users
   - Verify JIT provisioning
   - Test role mappings

3. **Gradual Rollout**
   - Enable SSO for specific domains
   - Monitor for issues
   - Provide fallback instructions

4. **Complete Migration**
   - Enable SSO for all domains
   - Optionally disable email/password
   - Update documentation

### From Another SSO Provider

1. **Parallel Configuration**
   - Add new SSO connection
   - Keep old connection enabled
   - Update allowed domains

2. **User Migration**
   - Users automatically migrate on next login
   - No manual intervention needed

3. **Deprecation**
   - Monitor old connection usage
   - Disable when usage drops to zero
   - Delete after 30-day grace period

## Support

For SSO configuration assistance:

- **Documentation**: https://docs.nself-chat.com/sso
- **Community**: https://community.nself-chat.com
- **Enterprise Support**: support@nself.com

## API Reference

For programmatic SSO management:

```graphql
# Create SSO Connection
mutation CreateSSOConnection {
  createSSOConnection(input: {
    name: "Acme SSO"
    provider: OKTA
    config: { ... }
  }) {
    id
    name
    enabled
  }
}

# Test Connection
query TestSSOConnection($id: ID!) {
  testSSOConnection(id: $id) {
    success
    error
    details
  }
}
```

---

**Last Updated**: January 2026
**Version**: 1.0.0
