---
name: Advanced Account Management
about: Implement OAuth, 2FA, and account deletion features
title: '[TODO-ACCOUNT-001] Advanced Account Management Features'
labels: enhancement, security, medium-priority
assignees: ''
---

## Description

Implement advanced account security features including OAuth connections, two-factor authentication, and account deletion flow.

## Affected Components

### OAuth Integration
- [ ] `src/app/settings/account/page.tsx:139` - Connect OAuth account
- [ ] `src/app/settings/account/page.tsx:151` - Disconnect OAuth account

### Two-Factor Authentication
- [ ] `src/app/settings/account/page.tsx:163` - Enable/disable 2FA toggle
- [ ] `src/components/settings/TwoFactorSettings.tsx:68` - 2FA verification flow
- [ ] `src/components/settings/TwoFactorSettings.tsx:90` - 2FA disable flow

### Account Deletion
- [ ] `src/app/settings/account/page.tsx:178` - Full account deletion flow
- [ ] `src/components/settings/DeleteAccount.tsx:41` - Account deletion API

## Technical Requirements

### OAuth Connections

1. **Supported Providers:**
   - Google
   - GitHub
   - ID.me (military/government)
   - Future: Twitter, LinkedIn, Discord

2. **GraphQL Mutations:**
   ```graphql
   mutation ConnectOAuthAccount($provider: String!, $token: String!) { ... }
   mutation DisconnectOAuthAccount($accountId: uuid!) { ... }
   ```

3. **Features:**
   - Link multiple OAuth accounts to one nchat account
   - Show connected accounts in settings
   - Disconnect with confirmation dialog
   - Prevent disconnecting last auth method

### Two-Factor Authentication

1. **Implementation:**
   - Use TOTP (Time-based One-Time Password)
   - Generate QR code for authenticator apps
   - Provide backup codes (10 codes)
   - Require 2FA code on sensitive operations

2. **GraphQL Mutations:**
   ```graphql
   mutation EnableTwoFactor($secret: String!, $code: String!) { ... }
   mutation DisableTwoFactor($code: String!) { ... }
   mutation RegenerateBa ckupCodes($code: String!) { ... }
   ```

3. **Database Schema:**
   ```sql
   ALTER TABLE nchat_users ADD COLUMN two_factor_enabled boolean DEFAULT false;
   ALTER TABLE nchat_users ADD COLUMN two_factor_secret text;
   ALTER TABLE nchat_users ADD COLUMN two_factor_backup_codes jsonb;
   ```

### Account Deletion

1. **Deletion Flow:**
   - Show warning about permanent deletion
   - Require password or 2FA verification
   - Optional: export data before deletion
   - Delete all user data (GDPR compliance)
   - Send confirmation email

2. **Data to Delete:**
   - User profile and settings
   - Messages sent (or anonymize)
   - Channel memberships
   - DM conversations
   - File uploads
   - OAuth connections
   - Sessions

3. **GraphQL Mutation:**
   ```graphql
   mutation DeleteUserAccount($password: String!, $confirmation: String!) { ... }
   ```

## Security Considerations

- [ ] OAuth tokens encrypted at rest
- [ ] 2FA secrets stored securely (hashed)
- [ ] Backup codes one-time use only
- [ ] Account deletion requires verification
- [ ] Rate limiting on sensitive operations
- [ ] Audit log for account changes

## Testing Checklist

### OAuth
- [ ] Connect Google account
- [ ] Connect GitHub account
- [ ] Disconnect account
- [ ] Prevent disconnecting last auth method
- [ ] Multiple OAuth accounts of same provider

### 2FA
- [ ] Enable 2FA with QR code
- [ ] Verify with authenticator app
- [ ] Use backup code
- [ ] Regenerate backup codes
- [ ] Disable 2FA with verification
- [ ] Require 2FA for sensitive operations

### Account Deletion
- [ ] Delete account with password
- [ ] Delete account with 2FA
- [ ] Export data before deletion
- [ ] Verify all data deleted
- [ ] Confirmation email sent
- [ ] Cannot login after deletion

## Acceptance Criteria

- OAuth connections work for Google and GitHub
- 2FA can be enabled/disabled with proper verification
- Account deletion permanently removes all user data
- All sensitive operations require authentication
- Proper error messages for all failure cases
- Audit trail for account security changes

## Dependencies

- Nhost OAuth configuration
- TOTP library (e.g., `otplib`)
- QR code generator (e.g., `qrcode`)
- Data export functionality (if not exists)

## Priority: Medium
Important for security but can be phased in after v1.0.0 launch.
