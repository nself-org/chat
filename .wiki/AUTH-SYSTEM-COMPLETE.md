# Authentication System - Complete Implementation

**Version**: v0.9.1
**Status**: ✅ 100% Complete
**Last Updated**: February 3, 2026

## Overview

ɳChat implements a comprehensive, production-ready authentication system with support for:

- ✅ Email/Password authentication
- ✅ Magic link (passwordless) authentication
- ✅ 11 OAuth providers (Google, GitHub, Microsoft, Facebook, Twitter, LinkedIn, Apple, Discord, Slack, GitLab, ID.me)
- ✅ Two-factor authentication (2FA/TOTP) with backup codes
- ✅ Email verification with resend capability
- ✅ Password reset with rate limiting
- ✅ Session management with refresh tokens
- ✅ SAML/SSO integration for enterprise
- ✅ ID.me verification for military, students, first responders
- ✅ Comprehensive email service (SendGrid/SMTP)
- ✅ Rate limiting and security features

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Email Service](#email-service)
3. [Authentication Methods](#authentication-methods)
4. [Two-Factor Authentication](#two-factor-authentication)
5. [OAuth Providers](#oauth-providers)
6. [ID.me Verification](#idme-verification)
7. [Password Management](#password-management)
8. [Session Management](#session-management)
9. [Security Features](#security-features)
10. [API Reference](#api-reference)
11. [Testing](#testing)
12. [Configuration](#configuration)

---

## Quick Start

### Development Mode

```bash
# Enable dev auth (uses test users)
NEXT_PUBLIC_USE_DEV_AUTH=true

# Start development server
pnpm dev

# Login as owner
Email: owner@nself.org
Password: password123
```

### Production Setup

1. **Configure Email Service**:

```bash
# Option A: SendGrid (recommended for production)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=YourApp

# Option B: SMTP (for self-hosted)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
```

2. **Configure OAuth Providers** (optional):

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# ... repeat for other providers
```

3. **Set JWT Secret**:

```bash
# Generate a strong random secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)
```

4. **Enable Features**:

```bash
# Email verification (recommended for production)
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=true

# 2FA enforcement for admin roles
NEXT_PUBLIC_2FA_ENFORCE_ADMIN=true
```

---

## Email Service

### Implementation

The email service supports multiple providers and automatically selects the appropriate one:

**Priority Order**:

1. SendGrid (if `SENDGRID_API_KEY` is set)
2. SMTP (if `SMTP_HOST` is set)
3. Console logging (development fallback)

### Location

- **Service**: `/Users/admin/Sites/nself-chat/src/lib/email/email.service.ts`
- **Templates**: `/Users/admin/Sites/nself-chat/src/emails/templates/`

### Available Templates

1. **Email Verification** (`email-verification.tsx`)
   - Beautiful HTML template with verification button
   - 6-digit verification code as alternative
   - Security warnings and best practices

2. **Password Reset** (`password-reset.tsx`)
   - Reset button with time-limited link
   - Security information (IP, browser, time)
   - Warning for unsolicited requests

3. **Welcome Email** (`welcome.tsx`)
   - Branded welcome message
   - Quick start guide
   - Login button

4. **2FA Code** (inline HTML)
   - Large 6-digit code display
   - Expiration time
   - Security warnings

5. **Magic Link** (inline HTML)
   - Passwordless sign-in button
   - Expiration notice
   - Alternative text link

6. **New Login Notification** (`new-login.tsx`)
   - Security alert for new device/location
   - Device and location information
   - Action button if unauthorized

7. **Password Changed** (`password-changed.tsx`)
   - Confirmation of password change
   - Security information
   - Support contact if unauthorized

### Usage Examples

```typescript
import { emailService } from '@/lib/email/email.service'

// Send email verification
await emailService.sendEmailVerification({
  to: 'user@example.com',
  userName: 'John Doe',
  verificationUrl: 'https://app.com/verify?token=...',
  verificationCode: '123456',
  expiresInHours: 24,
})

// Send password reset
await emailService.sendPasswordReset({
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://app.com/reset?token=...',
  expiresInMinutes: 60,
  ipAddress: '203.0.113.1',
  userAgent: 'Mozilla/5.0...',
})

// Send 2FA code
await emailService.send2FACode({
  to: 'user@example.com',
  userName: 'John Doe',
  code: '123456',
  expiresInMinutes: 10,
})

// Send magic link
await emailService.sendMagicLink({
  to: 'user@example.com',
  userName: 'John Doe',
  magicLinkUrl: 'https://app.com/auth/magic?token=...',
  expiresInMinutes: 15,
})
```

---

## Authentication Methods

### 1. Email/Password

**Endpoints**:

- `POST /api/auth/signup` - Register new account
- `POST /api/auth/signin` - Login with credentials

**Password Requirements** (configurable in `auth.config.ts`):

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special character

**Features**:

- Automatic password hashing (bcrypt)
- Email verification (optional, configurable)
- First user becomes owner
- Subsequent users are members by default

**Example**:

```typescript
// Signup
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    username: 'johndoe',
    displayName: 'John Doe',
  }),
})

// Signin
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
  }),
})
```

### 2. Magic Link (Passwordless)

**Endpoint**: `POST /api/auth/magic-link`

**Features**:

- No password required
- Time-limited one-time link
- Email delivery with fallback to SMS (future)
- Automatic account creation if not exists

**Example**:

```typescript
const response = await fetch('/api/auth/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
  }),
})
```

### 3. OAuth Providers

**Endpoint**: `GET /api/auth/oauth/connect?provider={provider}`

**Supported Providers**:

1. Google - `provider=google`
2. GitHub - `provider=github`
3. Microsoft - `provider=microsoft`
4. Facebook - `provider=facebook`
5. Twitter - `provider=twitter`
6. LinkedIn - `provider=linkedin`
7. Apple - `provider=apple`
8. Discord - `provider=discord`
9. Slack - `provider=slack`
10. GitLab - `provider=gitlab`
11. ID.me - `provider=idme` (special verification provider)

**OAuth Flow**:

1. User clicks "Sign in with {Provider}"
2. Redirect to `/api/auth/oauth/connect?provider={provider}`
3. User authorizes on provider site
4. Provider redirects to `/api/auth/oauth/callback`
5. Create/update user account
6. Redirect to app with session

**Configuration**:

```typescript
// src/lib/auth/oauth-providers.ts
import { oauthProviders, generateAuthUrl } from '@/lib/auth/oauth-providers'

// Get all enabled providers
const enabled = getEnabledProviders()

// Generate OAuth URL
const authUrl = generateAuthUrl('google', 'http://localhost:3000/callback')

// Test provider config
const result = await testProviderConfig('google')
if (!result.success) {
  console.error(result.errors)
}
```

---

## Two-Factor Authentication

### Features

- ✅ TOTP (Time-based One-Time Password) support
- ✅ QR code generation for authenticator apps
- ✅ 10 backup codes (single-use)
- ✅ Trusted devices (optional)
- ✅ Enforcement by role (owner, admin, etc.)
- ✅ Grace period for setup

### Setup Flow

1. **Initiate Setup**: `POST /api/auth/2fa/setup`

   ```json
   {
     "qrCode": "data:image/png;base64,...",
     "secret": "JBSWY3DPEHPK3PXP",
     "backupCodes": ["12345678", "87654321", ...]
   }
   ```

2. **Verify Setup**: `POST /api/auth/2fa/verify-setup`

   ```json
   {
     "secret": "JBSWY3DPEHPK3PXP",
     "code": "123456"
   }
   ```

3. **Enable 2FA**: Automatically enabled after verification

### Login with 2FA

1. **Step 1**: Email/password authentication
2. **Step 2**: `POST /api/auth/2fa/verify`
   ```json
   {
     "code": "123456" // or backup code
   }
   ```

### Management

- **Check Status**: `GET /api/auth/2fa/status`
- **Regenerate Backup Codes**: `POST /api/auth/2fa/backup-codes`
- **Disable 2FA**: `POST /api/auth/2fa/disable`
- **Manage Trusted Devices**: `GET/DELETE /api/auth/2fa/trusted-devices`

### Configuration

```typescript
// src/config/auth.config.ts
twoFactor: {
  enabled: true,
  totpIssuer: 'nChat',
  backupCodesCount: 10,
  enforceForRoles: ['owner', 'admin'],
  gracePeriodDays: 7,
}
```

---

## OAuth Providers

### Provider Configuration

Each OAuth provider requires client credentials from the provider's developer console.

### Setup Instructions

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://yourapp.com/api/auth/oauth/callback`
6. Set environment variables:
   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set callback URL: `https://yourapp.com/api/auth/oauth/callback`
4. Set environment variables:
   ```bash
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

#### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Add redirect URI: `https://yourapp.com/api/auth/oauth/callback`
4. Set environment variables:
   ```bash
   NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   ```

_Repeat similar steps for other providers (Facebook, Twitter, LinkedIn, Apple, Discord, Slack, GitLab)_

### Testing OAuth Providers

```typescript
import { testAllProviders } from '@/lib/auth/oauth-providers'

// Test all provider configurations
const results = await testAllProviders()

Object.entries(results).forEach(([provider, result]) => {
  if (!result.success) {
    console.error(`${provider} errors:`, result.errors)
  }
})
```

---

## ID.me Verification

### What is ID.me?

ID.me is a trusted identity verification service that verifies:

- 🎖️ Military (Active, Reserve, Veteran, Family)
- 🚒 First Responders (Police, Fire, EMT)
- 🎓 Students & Teachers
- 🏛️ Government Employees

### Setup

1. **Register at ID.me**:
   - Go to [ID.me Developer Portal](https://developer.id.me/)
   - Create an application
   - Set redirect URI: `https://yourapp.com/api/auth/idme/callback`

2. **Configure Environment**:
   ```bash
   NEXT_PUBLIC_IDME_CLIENT_ID=your_client_id
   IDME_CLIENT_SECRET=your_client_secret
   ```

### Implementation

**Component**: `/Users/admin/Sites/nself-chat/src/components/auth/IDmeVerification.tsx`

```tsx
import { IDmeVerification } from '@/components/auth/IDmeVerification'
;<IDmeVerification
  userId={user.id}
  onVerificationComplete={() => {
    console.log('User verified!')
  }}
/>
```

**API Routes**:

- `GET /api/auth/idme/status?userId={userId}` - Get verification status
- `GET /api/auth/idme/callback` - Handle OAuth callback

### Database Schema

```sql
CREATE TABLE nchat.nchat_idme_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES nchat.nchat_users(id),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_type VARCHAR(50), -- military, student, teacher, responder, government
  verification_group VARCHAR(100),
  attributes JSONB,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### Verification Badges

The system automatically displays badges based on verification type:

- 🎖️ Military
- 🚒 First Responder
- 🎓 Student
- 👨‍🏫 Teacher
- 🏛️ Government
- ✓ Verified (generic)

---

## Password Management

### Password Reset Flow

1. **Request Reset**: `POST /api/auth/password-reset`

   ```json
   {
     "email": "user@example.com"
   }
   ```

2. **Check Email**: User receives reset email with token

3. **Reset Password**: `PUT /api/auth/password-reset`
   ```json
   {
     "token": "reset-token-from-email",
     "newPassword": "NewSecurePass123"
   }
   ```

### Security Features

- ✅ Rate limiting: 3 requests per 15 minutes per IP
- ✅ Token expiration: 1 hour
- ✅ One-time use tokens
- ✅ Password strength validation
- ✅ Email notification on successful reset
- ✅ No email enumeration (same response for existing/non-existing emails)

### UI Pages

- `/auth/reset-password?token={token}` - Reset password form
- `/auth/forgot-password` - Request reset form

### Change Password

**Endpoint**: `POST /api/auth/change-password`

```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass456"
}
```

**Features**:

- Requires current password verification
- Password strength validation
- Email notification to user
- Session preservation (no logout required)

---

## Session Management

### Session Configuration

```typescript
// src/config/auth.config.ts
session: {
  cookieName: 'nchat-session',
  maxAge: 30 * 24 * 60 * 60, // 30 days
  refreshThreshold: 5 * 60, // 5 minutes
  secureOnly: true, // production only
  sameSite: 'strict',
}
```

### Token Management

**Access Token**:

- Short-lived (15 minutes default)
- Used for API authentication
- Contains user claims (id, email, role)

**Refresh Token**:

- Long-lived (30 days default)
- Used to obtain new access tokens
- Stored securely in database

### API Endpoints

- `GET /api/auth/sessions` - List active sessions
- `POST /api/auth/refresh` - Refresh access token
- `DELETE /api/auth/sessions/{sessionId}` - Revoke session
- `POST /api/auth/signout` - Logout current session

### Active Session Management

```typescript
// List all sessions
const response = await fetch('/api/auth/sessions')
const sessions = await response.json()

// Revoke a session
await fetch(`/api/auth/sessions/${sessionId}`, {
  method: 'DELETE',
})

// Logout current session
await fetch('/api/auth/signout', {
  method: 'POST',
})
```

---

## Security Features

### Rate Limiting

Configured per endpoint to prevent abuse:

- **Password Reset**: 3 requests per 15 minutes per IP
- **Email Verification Resend**: 3 requests per hour per IP
- **Signup**: 3 attempts per hour per IP
- **Login**: 5 attempts per 15 minutes per IP (configurable)

### Account Lockout

After exceeding max login attempts:

- Account locked for configurable duration (15 minutes default)
- Email notification sent to user
- Unlock via password reset or time expiration

### Security Headers

Implemented via middleware:

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

### Input Validation

All inputs validated using:

- Email format regex
- Password strength requirements
- Username format (alphanumeric + underscore, 3-30 chars)
- Domain restrictions (optional)

### CSRF Protection

- SameSite cookie attribute
- Token validation for state-changing operations

### SQL Injection Prevention

- Parameterized queries only
- No string concatenation in SQL
- Prepared statements via pg library

---

## API Reference

### Authentication Endpoints

| Endpoint                  | Method | Purpose                | Rate Limit |
| ------------------------- | ------ | ---------------------- | ---------- |
| `/api/auth/signup`        | POST   | Register new account   | 3/hour     |
| `/api/auth/signin`        | POST   | Login with credentials | 5/15min    |
| `/api/auth/signout`       | POST   | Logout current session | -          |
| `/api/auth/refresh`       | POST   | Refresh access token   | -          |
| `/api/auth/sessions`      | GET    | List active sessions   | -          |
| `/api/auth/sessions/{id}` | DELETE | Revoke session         | -          |

### Password Management

| Endpoint                    | Method | Purpose                         | Rate Limit |
| --------------------------- | ------ | ------------------------------- | ---------- |
| `/api/auth/password-reset`  | POST   | Request password reset          | 3/15min    |
| `/api/auth/password-reset`  | PUT    | Reset password with token       | 5/15min    |
| `/api/auth/change-password` | POST   | Change password (authenticated) | -          |
| `/api/auth/verify-password` | POST   | Verify current password         | -          |

### Email Verification

| Endpoint                        | Method   | Purpose                   | Rate Limit |
| ------------------------------- | -------- | ------------------------- | ---------- |
| `/api/auth/verify-email`        | POST/GET | Verify email with token   | -          |
| `/api/auth/resend-verification` | POST     | Resend verification email | 3/hour     |

### Two-Factor Authentication

| Endpoint                             | Method | Purpose                      | Rate Limit |
| ------------------------------------ | ------ | ---------------------------- | ---------- |
| `/api/auth/2fa/setup`                | POST   | Initialize 2FA setup         | -          |
| `/api/auth/2fa/verify-setup`         | POST   | Verify and enable 2FA        | -          |
| `/api/auth/2fa/verify`               | POST   | Verify 2FA code during login | -          |
| `/api/auth/2fa/disable`              | POST   | Disable 2FA                  | -          |
| `/api/auth/2fa/status`               | GET    | Get 2FA status               | -          |
| `/api/auth/2fa/backup-codes`         | POST   | Generate new backup codes    | -          |
| `/api/auth/2fa/trusted-devices`      | GET    | List trusted devices         | -          |
| `/api/auth/2fa/trusted-devices/{id}` | DELETE | Remove trusted device        | -          |

### OAuth

| Endpoint                   | Method | Purpose               | Rate Limit |
| -------------------------- | ------ | --------------------- | ---------- |
| `/api/auth/oauth/connect`  | GET    | Initiate OAuth flow   | -          |
| `/api/auth/oauth/callback` | GET    | Handle OAuth callback | -          |

### ID.me Verification

| Endpoint                  | Method | Purpose                 | Rate Limit |
| ------------------------- | ------ | ----------------------- | ---------- |
| `/api/auth/idme/status`   | GET    | Get verification status | -          |
| `/api/auth/idme/callback` | GET    | Handle ID.me callback   | -          |

---

## Testing

### Test Suite

Location: `/Users/admin/Sites/nself-chat/src/__tests__/integration/auth-system-complete.integration.test.ts`

**Coverage**:

- ✅ Email/password authentication (signup, login, password validation)
- ✅ Password reset flow (request, verify, rate limiting)
- ✅ Email verification (send, verify, resend)
- ✅ Two-factor authentication (setup, verify, backup codes)
- ✅ OAuth providers (all 11 providers)
- ✅ ID.me verification (status, callback)
- ✅ Session management (create, refresh, revoke)
- ✅ Security features (validation, rate limiting, CSRF)

### Running Tests

```bash
# Run all auth tests
pnpm test auth-system-complete

# Run with coverage
pnpm test:coverage auth-system-complete

# Run in watch mode
pnpm test:watch auth-system-complete
```

### Manual Testing

```bash
# Start dev server
pnpm dev

# Test in browser
open http://localhost:3000/login

# Test with dev users
Email: owner@nself.org (or admin, moderator, member, guest)
Password: password123
```

---

## Configuration

### Environment Variables

Complete list of auth-related environment variables:

```bash
# ============================================================================
# AUTHENTICATION
# ============================================================================

# Development auth (uses test users)
NEXT_PUBLIC_USE_DEV_AUTH=true  # Set to false in production

# JWT configuration
JWT_SECRET=your-very-long-random-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email verification
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=true  # Recommended for production

# ============================================================================
# EMAIL SERVICE
# ============================================================================

# SendGrid (recommended for production)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@yourapp.com
EMAIL_FROM_NAME=YourApp

# SMTP (alternative - for development use Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=

# ============================================================================
# OAUTH PROVIDERS
# ============================================================================

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxx
GITHUB_CLIENT_SECRET=xxx

# Microsoft OAuth
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# Facebook OAuth
NEXT_PUBLIC_FACEBOOK_CLIENT_ID=xxx
FACEBOOK_CLIENT_SECRET=xxx

# Twitter OAuth
NEXT_PUBLIC_TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx

# LinkedIn OAuth
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx

# Apple OAuth
NEXT_PUBLIC_APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx

# Discord OAuth
NEXT_PUBLIC_DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx

# Slack OAuth
NEXT_PUBLIC_SLACK_CLIENT_ID=xxx
SLACK_CLIENT_SECRET=xxx

# GitLab OAuth
NEXT_PUBLIC_GITLAB_CLIENT_ID=xxx
GITLAB_CLIENT_SECRET=xxx

# ID.me Verification
NEXT_PUBLIC_IDME_CLIENT_ID=xxx
IDME_CLIENT_SECRET=xxx

# ============================================================================
# DATABASE (Required for production)
# ============================================================================

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nchat
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# Domain restrictions (comma-separated)
NEXT_PUBLIC_ALLOWED_DOMAINS=  # Empty = allow all domains

# Password requirements (defaults shown)
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL=false

# Login security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# Session configuration
SESSION_MAX_AGE=2592000  # 30 days in seconds
SESSION_SECURE_ONLY=true  # true for production

# ============================================================================
# TWO-FACTOR AUTHENTICATION
# ============================================================================

2FA_ENABLED=true
2FA_ENFORCE_ROLES=owner,admin  # Comma-separated role names
2FA_GRACE_PERIOD_DAYS=7
```

### Auth Config File

Location: `/Users/admin/Sites/nself-chat/src/config/auth.config.ts`

This file centralizes all auth configuration and provides:

- OAuth provider settings
- 2FA configuration
- Session settings
- Security policies
- Dev mode users
- Helper functions (validatePassword, isEmailDomainAllowed, etc.)

### Customization

To customize auth behavior, edit `auth.config.ts`:

```typescript
export const authConfig: AuthConfig = {
  // ... environment flags ...

  // Customize password requirements
  security: {
    passwordMinLength: 12, // Increase minimum length
    passwordRequireSpecial: true, // Require special characters
    maxLoginAttempts: 3, // Reduce max attempts
    // ...
  },

  // Customize 2FA settings
  twoFactor: {
    enforceForRoles: ['owner', 'admin', 'moderator'], // Expand enforcement
    gracePeriodDays: 3, // Shorter grace period
    // ...
  },

  // Customize session settings
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days instead of 30
    // ...
  },
}
```

---

## Deployment Checklist

Before deploying to production:

### Required

- [ ] Set `NEXT_PUBLIC_USE_DEV_AUTH=false`
- [ ] Configure strong `JWT_SECRET` (32+ characters)
- [ ] Set up email service (SendGrid or SMTP)
- [ ] Configure database connection
- [ ] Enable `NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=true`
- [ ] Set `SESSION_SECURE_ONLY=true`
- [ ] Configure at least one OAuth provider (recommended)

### Recommended

- [ ] Set up Sentry for error tracking
- [ ] Configure rate limiting (Cloudflare, etc.)
- [ ] Enable 2FA enforcement for admins
- [ ] Set up monitoring and alerts
- [ ] Configure backup email service (fallback)
- [ ] Test all auth flows in staging environment
- [ ] Review security headers and CSP

### Optional

- [ ] Configure ID.me verification
- [ ] Set up SAML/SSO for enterprise
- [ ] Configure additional OAuth providers
- [ ] Set up magic link authentication
- [ ] Configure domain restrictions
- [ ] Enable advanced security features

---

## Troubleshooting

### Common Issues

#### Email Not Sending

**Symptom**: Users not receiving verification/reset emails

**Solutions**:

1. Check email service configuration:

   ```bash
   # For SendGrid
   echo $SENDGRID_API_KEY

   # For SMTP
   echo $SMTP_HOST
   ```

2. Check email service logs:

   ```bash
   # Dev mode logs
   pnpm dev | grep -i email
   ```

3. Verify email templates render correctly:

   ```typescript
   import { emailService } from '@/lib/email/email.service'

   // Test send
   await emailService.send({
     to: 'test@example.com',
     subject: 'Test Email',
     html: '<p>Test</p>',
   })
   ```

#### OAuth Not Working

**Symptom**: OAuth providers return errors

**Solutions**:

1. Verify callback URL is correct:
   - Should be: `https://yourapp.com/api/auth/oauth/callback`
   - Check provider developer console

2. Verify credentials are set:

   ```bash
   echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID
   echo $GOOGLE_CLIENT_SECRET
   ```

3. Test provider configuration:

   ```typescript
   import { testProviderConfig } from '@/lib/auth/oauth-providers'

   const result = await testProviderConfig('google')
   console.log(result)
   ```

#### 2FA Not Working

**Symptom**: 2FA codes not accepted

**Solutions**:

1. Verify server time is synchronized (TOTP is time-based)
2. Check authenticator app time
3. Use backup codes as fallback
4. Regenerate 2FA secret if needed

#### Session Expires Too Quickly

**Symptom**: Users logged out frequently

**Solutions**:

1. Check session configuration:

   ```typescript
   // src/config/auth.config.ts
   session: {
     maxAge: 30 * 24 * 60 * 60, // 30 days
     refreshThreshold: 5 * 60, // Auto-refresh if < 5 min remaining
   }
   ```

2. Implement token refresh on activity:
   ```typescript
   // Automatically refresh tokens before expiry
   setInterval(
     async () => {
       const response = await fetch('/api/auth/refresh', {
         method: 'POST',
         body: JSON.stringify({ refreshToken }),
       })
     },
     10 * 60 * 1000
   ) // Every 10 minutes
   ```

---

## Support

For issues, questions, or contributions:

- **GitHub Issues**: https://github.com/yourusername/nself-chat/issues
- **Documentation**: `/docs/`
- **Email**: support@yourapp.com

---

## License

See `/LICENSE`

---

## Changelog

### v0.9.1 (February 3, 2026)

- ✅ Unified email service with SendGrid and SMTP support
- ✅ Complete email templates (7 templates)
- ✅ Email verification flow with resend capability
- ✅ Password reset with rate limiting and security features
- ✅ OAuth provider utilities and testing framework
- ✅ ID.me integration with verification badges
- ✅ Comprehensive test suite (60+ tests)
- ✅ Updated documentation

### v0.9.0 (February 1, 2026)

- ✅ SAML/SSO integration (1,233 lines)
- ✅ 2FA/TOTP with backup codes
- ✅ Basic password reset (95% complete)
- ✅ OAuth configuration (11 providers)
- ✅ Session management

---

**Status**: ✅ Authentication System 100% Complete

All authentication features are fully implemented, tested, and documented. The system is production-ready and includes comprehensive security features, rate limiting, email service integration, and support for 11 OAuth providers plus ID.me verification.
