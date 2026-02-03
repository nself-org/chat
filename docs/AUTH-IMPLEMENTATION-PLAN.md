# Authentication Implementation Plan

**Document Version**: 1.0.0
**Last Updated**: February 3, 2026
**Relates to**: TODO.md Tasks 86-91 (Auth & Identity)
**Target Version**: v1.0.0

---

## Executive Summary

This document provides a comprehensive implementation plan for nChat's authentication system. The goal is to build a robust, secure, and flexible authentication layer that supports multiple providers, two-factor authentication, enterprise SSO, and maintains backward compatibility with existing development authentication.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Authentication Providers](#3-authentication-providers)
4. [API Endpoints Specification](#4-api-endpoints-specification)
5. [Two-Factor Authentication](#5-two-factor-authentication)
6. [Enterprise SSO](#6-enterprise-sso)
7. [Development Auth Safeguards](#7-development-auth-safeguards)
8. [nself Auth Service Integration](#8-nself-auth-service-integration)
9. [Implementation Phases](#9-implementation-phases)
10. [Security Considerations](#10-security-considerations)
11. [Testing Strategy](#11-testing-strategy)
12. [Migration Guide](#12-migration-guide)

---

## 1. Current State Analysis

### 1.1 What's Currently Implemented

#### Services Layer (`src/services/auth/`)

| File                       | Status      | Description                                                                                     |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `auth.interface.ts`        | **Working** | Defines `AuthUser`, `AuthResponse`, and `AuthService` interfaces                                |
| `auth-plugin.interface.ts` | **Working** | Comprehensive plugin system with `AuthProvider`, `BaseAuthProvider`, and `AuthProviderRegistry` |
| `faux-auth.service.ts`     | **Working** | Development authentication with 8 predefined test users                                         |
| `nhost-auth.service.ts`    | **Partial** | Nhost SDK integration (basic sign in/up/out works)                                              |
| `real-auth.service.ts`     | **Partial** | Direct HTTP auth service (token refresh works)                                                  |
| `database-auth.service.ts` | **Partial** | Direct PostgreSQL auth with bcrypt verification                                                 |

#### Auth Providers (`src/services/auth/providers/`)

| Provider                     | Status       | Notes                                        |
| ---------------------------- | ------------ | -------------------------------------------- |
| `email-password.provider.ts` | **Scaffold** | Basic structure, needs Nhost integration     |
| `magic-link.provider.ts`     | **Scaffold** | Basic structure, needs backend               |
| `google.provider.ts`         | **Working**  | Full OAuth flow implemented                  |
| `github.provider.ts`         | **Scaffold** | Similar to Google, needs testing             |
| `apple.provider.ts`          | **Scaffold** | Needs Apple Developer setup                  |
| `microsoft.provider.ts`      | **Scaffold** | Basic structure                              |
| `facebook.provider.ts`       | **Scaffold** | Basic structure                              |
| `twitter.provider.ts`        | **Scaffold** | Basic structure                              |
| `phone-sms.provider.ts`      | **Scaffold** | Basic structure                              |
| `whatsapp.provider.ts`       | **Scaffold** | Basic structure                              |
| `telegram.provider.ts`       | **Scaffold** | Basic structure                              |
| `idme.provider.ts`           | **Working**  | Full implementation with verification groups |

#### API Routes (`src/app/api/auth/`)

| Endpoint                       | Status       | Notes                                               |
| ------------------------------ | ------------ | --------------------------------------------------- |
| `signin/route.ts`              | **Working**  | Full implementation with bcrypt, JWT, rate limiting |
| `signup/route.ts`              | **Partial**  | Dev mode mock, production needs completion          |
| `change-password/route.ts`     | **Partial**  | Dev mode mock, production stub                      |
| `verify-password/route.ts`     | **Scaffold** | Not implemented                                     |
| `oauth/callback/route.ts`      | **Partial**  | Basic redirect handling                             |
| `oauth/connect/route.ts`       | **Scaffold** | Account linking stub                                |
| `sessions/route.ts`            | **Working**  | Full CRUD with GraphQL                              |
| `sessions/activity/route.ts`   | **Scaffold** | Activity tracking                                   |
| `2fa/setup/route.ts`           | **Working**  | TOTP secret generation, QR codes                    |
| `2fa/verify/route.ts`          | **Working**  | TOTP and backup code verification                   |
| `2fa/verify-setup/route.ts`    | **Scaffold** | Setup verification                                  |
| `2fa/status/route.ts`          | **Scaffold** | 2FA status check                                    |
| `2fa/backup-codes/route.ts`    | **Scaffold** | Backup code management                              |
| `2fa/disable/route.ts`         | **Scaffold** | Disable 2FA                                         |
| `2fa/trusted-devices/route.ts` | **Scaffold** | Device trust management                             |

#### 2FA Utilities (`src/lib/2fa/`)

| File                    | Status      | Description                                   |
| ----------------------- | ----------- | --------------------------------------------- |
| `totp.ts`               | **Working** | TOTP generation/verification with speakeasy   |
| `backup-codes.ts`       | **Working** | Generation, hashing, verification with bcrypt |
| `device-fingerprint.ts` | **Working** | Device trust management                       |

#### Database Schema (`.backend/migrations/`)

| Migration                 | Status      | Description                          |
| ------------------------- | ----------- | ------------------------------------ |
| `014_real_auth_users.sql` | **Working** | Auth users with bcrypt passwords     |
| `015_2fa_system.sql`      | **Working** | Complete 2FA tables and RLS policies |

### 1.2 Gaps and Missing Pieces

1. **Password Reset Flow** - No forgot-password or reset-password endpoints
2. **Email Verification** - No verify-email endpoint
3. **OAuth Token Exchange** - Callback doesn't complete token exchange
4. **Account Linking** - OAuth account linking not implemented
5. **Enterprise SSO** - SAML/OIDC not implemented
6. **Session Refresh** - Token refresh needs production testing
7. **Rate Limiting** - Applied to signin, needs broader coverage
8. **Audit Logging** - Auth events not logged to audit table

---

## 2. Architecture Overview

### 2.1 Authentication Flow Diagram

```
                                    +------------------+
                                    |   Client (Web)   |
                                    +--------+---------+
                                             |
                    +------------------------+------------------------+
                    |                        |                        |
            Email/Password              OAuth/Social              Enterprise SSO
                    |                        |                        |
                    v                        v                        v
            +-------+--------+      +--------+--------+      +--------+--------+
            | /api/auth/     |      | Provider Auth   |      | SAML/OIDC      |
            | signin         |      | (Google, etc.)  |      | IdP            |
            +-------+--------+      +--------+--------+      +--------+--------+
                    |                        |                        |
                    +------------------------+------------------------+
                                             |
                                             v
                              +-----------------------------+
                              |      Auth Middleware        |
                              |  - Validate credentials     |
                              |  - Check 2FA requirement    |
                              |  - Rate limiting            |
                              +-------------+---------------+
                                            |
                            +---------------+---------------+
                            |                               |
                     2FA Required?                    No 2FA Required
                            |                               |
                            v                               |
                    +--------------+                        |
                    | 2FA Verify   |                        |
                    | - TOTP       |                        |
                    | - Backup     |                        |
                    +--------------+                        |
                            |                               |
                            +---------------+---------------+
                                            |
                                            v
                              +-----------------------------+
                              |    Session Manager          |
                              |  - Create session           |
                              |  - Issue JWT tokens         |
                              |  - Set cookies              |
                              +-------------+---------------+
                                            |
                                            v
                              +-----------------------------+
                              |    Database (Hasura)        |
                              |  - auth.users               |
                              |  - nchat_user_sessions      |
                              |  - nchat_user_2fa_settings  |
                              +-----------------------------+
```

### 2.2 Service Architecture

```typescript
// Recommended service structure
src/services/auth/
├── index.ts                    // Main export, service factory
├── auth.interface.ts           // Core interfaces
├── auth-plugin.interface.ts    // Plugin system
├── auth-factory.ts             // Service factory based on env
├── services/
│   ├── faux-auth.service.ts    // Development auth
│   ├── nhost-auth.service.ts   // Nhost SDK wrapper
│   └── database-auth.service.ts // Direct DB auth
├── providers/
│   ├── index.ts                // Provider registry
│   ├── email-password.provider.ts
│   ├── magic-link.provider.ts
│   ├── google.provider.ts
│   ├── github.provider.ts
│   ├── apple.provider.ts
│   ├── microsoft.provider.ts
│   ├── discord.provider.ts
│   ├── idme.provider.ts
│   └── saml.provider.ts        // NEW: Enterprise SSO
├── middleware/
│   ├── rate-limiter.ts
│   ├── auth-guard.ts
│   └── 2fa-guard.ts
└── utils/
    ├── jwt.ts
    ├── password.ts
    └── session.ts
```

---

## 3. Authentication Providers

### 3.1 Email/Password Authentication

**Implementation using Nhost Auth:**

```typescript
// src/services/auth/providers/email-password.provider.ts

export class EmailPasswordProvider extends BaseAuthProvider {
  async signIn(credentials: EmailPasswordCredentials): Promise<AuthResult> {
    const { email, password } = credentials

    // Use Nhost SDK
    const { session, error } = await nhost.auth.signIn({
      email,
      password,
    })

    if (error) {
      return this.createErrorResult(this.createError('AUTH_FAILED', error.message))
    }

    // Check if 2FA is required
    const requires2FA = await this.check2FARequired(session.user.id)
    if (requires2FA) {
      return {
        success: true,
        requires2FA: true,
        userId: session.user.id,
        tempToken: this.generateTempToken(session.user.id),
      }
    }

    return this.createSuccessResult(
      this.mapNhostUser(session.user),
      session.accessToken,
      session.refreshToken
    )
  }

  async signUp(
    credentials: EmailPasswordCredentials,
    metadata?: Record<string, unknown>
  ): Promise<AuthResult> {
    const { email, password } = credentials

    const { session, error } = await nhost.auth.signUp({
      email,
      password,
      options: {
        displayName: metadata?.displayName as string,
        metadata: {
          username: metadata?.username,
        },
      },
    })

    if (error) {
      return this.createErrorResult(this.createError('SIGNUP_FAILED', error.message))
    }

    // Send verification email if required
    if (this.config.requireEmailVerification) {
      await nhost.auth.sendVerificationEmail({ email })
    }

    return this.createSuccessResult(
      this.mapNhostUser(session.user),
      session.accessToken,
      session.refreshToken
    )
  }
}
```

### 3.2 OAuth Providers

**Supported Providers:**

| Provider  | Client ID Env Var     | Scopes                 | Notes              |
| --------- | --------------------- | ---------------------- | ------------------ |
| Google    | `GOOGLE_CLIENT_ID`    | openid, email, profile | Most common        |
| GitHub    | `GITHUB_CLIENT_ID`    | user:email, read:user  | Developer-focused  |
| Microsoft | `MICROSOFT_CLIENT_ID` | openid, email, profile | Enterprise         |
| Apple     | `APPLE_CLIENT_ID`     | name, email            | iOS users          |
| Discord   | `DISCORD_CLIENT_ID`   | identify, email        | Gaming communities |
| Facebook  | `FACEBOOK_CLIENT_ID`  | email, public_profile  | Deprecated support |
| Twitter/X | `TWITTER_CLIENT_ID`   | tweet.read, users.read | OAuth 2.0          |

**OAuth Flow Implementation:**

```typescript
// Generic OAuth callback handler
// src/app/api/auth/oauth/[provider]/callback/route.ts

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return redirectWithError(error)
  }

  // Validate state to prevent CSRF
  const storedState = await getStoredState(state)
  if (!storedState || storedState.provider !== provider) {
    return redirectWithError('invalid_state')
  }

  try {
    // Exchange code for tokens via Nhost
    const { session, error: authError } = await nhost.auth.signIn({
      provider: provider as Provider,
      options: {
        redirectTo: storedState.redirectTo,
      },
    })

    if (authError) {
      return redirectWithError(authError.message)
    }

    // Create/update nchat user
    await upsertNchatUser(session.user)

    // Check 2FA requirement
    const requires2FA = await check2FARequired(session.user.id)
    if (requires2FA) {
      return redirectTo2FA(session.user.id)
    }

    // Set session cookies and redirect
    return redirectWithSession(session)
  } catch (error) {
    return redirectWithError('callback_failed')
  }
}
```

### 3.3 ID.me Integration

ID.me provides government-grade identity verification for military, first responders, and government employees.

**Verified Groups:**

- `military` - Active duty military
- `veteran` - Military veterans
- `military-family` - Military family members
- `first-responder` - Police, fire, EMT
- `nurse` - Licensed nurses
- `hospital` - Hospital workers
- `government` - Government employees
- `teacher` - K-12 teachers
- `student` - College students

**Implementation (Already exists at `src/services/auth/providers/idme.provider.ts`):**

The ID.me provider is fully implemented with:

- OAuth 2.0 flow with ID.me
- Verification status checking
- Group membership validation
- Automatic role assignment based on verification

**Configuration:**

```typescript
// AppConfig.authProviders.idme
{
  enabled: boolean
  allowMilitary: boolean
  allowPolice: boolean
  allowFirstResponders: boolean
  allowGovernment: boolean
  requireVerification: boolean
}
```

---

## 4. API Endpoints Specification

### 4.1 Required Endpoints

#### POST /api/auth/signup

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "username": "johndoe",
  "displayName": "John Doe"
}
```

**Response (Success):**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "displayName": "John Doe",
    "role": "member",
    "emailVerified": false
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "requiresEmailVerification": true
}
```

**Implementation:**

```typescript
// src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { nhost } from '@/lib/nhost'
import { withErrorHandler, withRateLimit, compose } from '@/lib/api/middleware'
import { validatePassword, validateEmail } from '@/lib/auth/validators'

const RATE_LIMIT = { limit: 3, window: 60 * 60 } // 3 per hour

async function handleSignUp(request: NextRequest): Promise<NextResponse> {
  const { email, password, username, displayName } = await request.json()

  // Validate inputs
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return badRequestResponse(emailValidation.error)
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return badRequestResponse(passwordValidation.error)
  }

  // Check if email already exists
  const existingUser = await checkExistingUser(email)
  if (existingUser) {
    return conflictResponse('Email already registered')
  }

  // Sign up via Nhost
  const { session, error } = await nhost.auth.signUp({
    email,
    password,
    options: {
      displayName,
      metadata: { username },
    },
  })

  if (error) {
    return badRequestResponse(error.message)
  }

  // Determine role (first user becomes owner)
  const isFirstUser = await checkIfFirstUser()
  const role = isFirstUser ? 'owner' : 'member'

  // Create nchat user record
  await createNchatUser({
    authUserId: session.user.id,
    username,
    displayName,
    email,
    role,
  })

  return successResponse({
    user: {
      id: session.user.id,
      email,
      username,
      displayName,
      role,
      emailVerified: false,
    },
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    requiresEmailVerification: true,
  })
}

export const POST = compose(withErrorHandler, withRateLimit(RATE_LIMIT))(handleSignUp)
```

#### POST /api/auth/signin

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "rememberMe": true
}
```

**Response (Success - No 2FA):**

```json
{
  "success": true,
  "user": { ... },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

**Response (Success - 2FA Required):**

```json
{
  "success": true,
  "requires2FA": true,
  "tempToken": "temp-jwt...",
  "available2FAMethods": ["totp", "backup_code"]
}
```

**Status:** Already implemented at `src/app/api/auth/signin/route.ts`

#### POST /api/auth/signout

**Request:**

```json
{
  "refreshToken": "jwt...",
  "revokeAllSessions": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

**Implementation:**

```typescript
// src/app/api/auth/signout/route.ts

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { refreshToken, revokeAllSessions } = await request.json()

  // Get user from token
  const userId = await getUserIdFromToken(refreshToken)
  if (!userId) {
    return unauthorizedResponse('Invalid token')
  }

  // Revoke session(s)
  if (revokeAllSessions) {
    await revokeAllUserSessions(userId)
  } else {
    await revokeSession(refreshToken)
  }

  // Sign out from Nhost
  await nhost.auth.signOut()

  // Clear cookies
  const response = successResponse({ success: true })
  response.cookies.delete('nchat-session')
  response.cookies.delete('nchat-refresh')

  return response
}
```

#### POST /api/auth/forgot-password

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "If an account exists, a reset link has been sent"
}
```

**Implementation:**

```typescript
// src/app/api/auth/forgot-password/route.ts

const RATE_LIMIT = { limit: 3, window: 15 * 60 } // 3 per 15 minutes

async function handleForgotPassword(request: NextRequest): Promise<NextResponse> {
  const { email } = await request.json()

  // Always return success to prevent email enumeration
  const response = {
    success: true,
    message: 'If an account exists, a reset link has been sent',
  }

  // Check if user exists (don't expose result)
  const user = await getUserByEmail(email)
  if (!user) {
    return successResponse(response)
  }

  // Generate reset token
  const resetToken = await generatePasswordResetToken(user.id)

  // Send reset email
  await sendPasswordResetEmail({
    to: email,
    resetToken,
    expiresIn: '1 hour',
  })

  // Log for audit
  await logAuthEvent({
    type: 'PASSWORD_RESET_REQUESTED',
    userId: user.id,
    email,
    ipAddress: getClientIP(request),
  })

  return successResponse(response)
}

export const POST = compose(withErrorHandler, withRateLimit(RATE_LIMIT))(handleForgotPassword)
```

#### POST /api/auth/reset-password

**Request:**

```json
{
  "token": "reset-token...",
  "newPassword": "NewSecureP@ss456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Implementation:**

```typescript
// src/app/api/auth/reset-password/route.ts

async function handleResetPassword(request: NextRequest): Promise<NextResponse> {
  const { token, newPassword } = await request.json()

  // Validate token
  const tokenData = await validatePasswordResetToken(token)
  if (!tokenData.valid) {
    return badRequestResponse('Invalid or expired reset token')
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    return badRequestResponse(passwordValidation.error)
  }

  // Check password not same as current
  const isSamePassword = await checkSamePassword(tokenData.userId, newPassword)
  if (isSamePassword) {
    return badRequestResponse('New password must be different from current password')
  }

  // Update password via Nhost
  await nhost.auth.changePassword({ newPassword })

  // Invalidate all sessions
  await revokeAllUserSessions(tokenData.userId)

  // Mark token as used
  await invalidatePasswordResetToken(token)

  // Log for audit
  await logAuthEvent({
    type: 'PASSWORD_RESET_COMPLETED',
    userId: tokenData.userId,
  })

  return successResponse({
    success: true,
    message: 'Password reset successfully. Please sign in with your new password.',
  })
}
```

#### POST /api/auth/verify-email

**Request:**

```json
{
  "token": "verification-token..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Implementation:**

```typescript
// src/app/api/auth/verify-email/route.ts

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { token } = await request.json()

  // Verify token via Nhost
  const { error } = await nhost.auth.verifyEmail({ token })

  if (error) {
    return badRequestResponse('Invalid or expired verification token')
  }

  return successResponse({
    success: true,
    message: 'Email verified successfully',
  })
}

// Also support GET for email links
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return redirectWithError('Missing verification token')
  }

  const { error } = await nhost.auth.verifyEmail({ token })

  if (error) {
    return redirect('/auth/verify-email?error=invalid_token')
  }

  return redirect('/auth/verify-email?success=true')
}
```

#### GET /api/auth/providers

**Response:**

```json
{
  "providers": [
    {
      "id": "email-password",
      "name": "Email & Password",
      "type": "email",
      "enabled": true
    },
    {
      "id": "google",
      "name": "Google",
      "type": "social",
      "enabled": true,
      "authUrl": "/api/auth/oauth/google"
    },
    {
      "id": "github",
      "name": "GitHub",
      "type": "social",
      "enabled": true,
      "authUrl": "/api/auth/oauth/github"
    },
    {
      "id": "idme",
      "name": "ID.me",
      "type": "verification",
      "enabled": true,
      "authUrl": "/api/auth/oauth/idme",
      "verificationGroups": ["military", "first-responder", "government"]
    }
  ]
}
```

**Implementation:**

```typescript
// src/app/api/auth/providers/route.ts

export async function GET(): Promise<NextResponse> {
  // Get enabled providers from AppConfig
  const config = await getAppConfig()
  const enabledProviders = getEnabledProviders(config.authProviders)

  const providers = enabledProviders.map((providerId) => {
    const provider = authProviders[providerId]
    return {
      id: providerId,
      name: providerNames[providerId],
      type: provider.metadata.type,
      enabled: true,
      authUrl:
        provider.metadata.type === 'social' || provider.metadata.type === 'verification'
          ? `/api/auth/oauth/${providerId}`
          : undefined,
      ...(providerId === 'idme' && {
        verificationGroups: config.authProviders.idme.allowedGroups,
      }),
    }
  })

  return successResponse({ providers })
}
```

#### POST /api/auth/oauth/:provider

**Request:**

```json
{
  "redirectTo": "/chat",
  "linkToAccount": false
}
```

**Response:**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

---

## 5. Two-Factor Authentication

### 5.1 Overview

The 2FA system supports:

- **TOTP** (Time-based One-Time Password) - Google Authenticator compatible
- **Backup Codes** - 10 single-use recovery codes
- **Trusted Devices** - Remember device for 30 days
- **SMS Fallback** (Optional) - Requires Twilio integration

### 5.2 Database Schema

Already implemented at `.backend/migrations/015_2fa_system.sql`:

```sql
-- nchat_user_2fa_settings - TOTP secrets
-- nchat_user_backup_codes - Recovery codes (hashed)
-- nchat_user_trusted_devices - Device fingerprints
-- nchat_2fa_verification_attempts - Rate limiting
```

### 5.3 API Endpoints

#### POST /api/auth/2fa/enable

**Step 1: Generate Setup Data**

```typescript
// src/app/api/auth/2fa/setup/route.ts (Already implemented)

export async function POST(request: NextRequest) {
  const { userId, email } = await request.json()

  // Generate TOTP secret
  const { base32, otpauthUrl } = generateTOTPSecret({
    name: email,
    issuer: 'nchat',
  })

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(otpauthUrl)

  // Generate backup codes
  const backupCodes = generateBackupCodes(10)

  // Store temporarily (not enabled yet)
  await storePending2FASetup(userId, base32, backupCodes)

  return NextResponse.json({
    success: true,
    data: {
      secret: base32,
      qrCodeDataUrl,
      otpauthUrl,
      backupCodes,
      manualEntryCode: formatSecretForDisplay(base32),
    },
  })
}
```

**Step 2: Verify and Enable**

```typescript
// src/app/api/auth/2fa/verify-setup/route.ts

export async function POST(request: NextRequest) {
  const { userId, code } = await request.json()

  // Get pending setup
  const pendingSetup = await getPending2FASetup(userId)
  if (!pendingSetup) {
    return badRequestResponse('No pending 2FA setup found')
  }

  // Verify the TOTP code
  const isValid = verifyTOTP(code, pendingSetup.secret)
  if (!isValid) {
    return badRequestResponse('Invalid verification code')
  }

  // Enable 2FA
  await enable2FA(userId, pendingSetup.secret)

  // Store hashed backup codes
  await storeBackupCodes(userId, pendingSetup.backupCodes)

  // Clear pending setup
  await clearPending2FASetup(userId)

  return successResponse({
    success: true,
    message: '2FA enabled successfully',
  })
}
```

#### POST /api/auth/2fa/verify

Already implemented at `src/app/api/auth/2fa/verify/route.ts`

#### POST /api/auth/2fa/disable

```typescript
// src/app/api/auth/2fa/disable/route.ts

export async function POST(request: NextRequest) {
  const { userId, password, code } = await request.json()

  // Verify password
  const passwordValid = await verifyUserPassword(userId, password)
  if (!passwordValid) {
    return unauthorizedResponse('Invalid password')
  }

  // Verify 2FA code (current code required to disable)
  const settings = await get2FASettings(userId)
  const codeValid = verifyTOTP(code, settings.secret)
  if (!codeValid) {
    return badRequestResponse('Invalid 2FA code')
  }

  // Disable 2FA
  await disable2FA(userId)

  // Delete backup codes
  await deleteBackupCodes(userId)

  // Delete trusted devices
  await deleteTrustedDevices(userId)

  // Log for audit
  await logAuthEvent({
    type: '2FA_DISABLED',
    userId,
  })

  return successResponse({
    success: true,
    message: '2FA disabled successfully',
  })
}
```

#### POST /api/auth/2fa/backup-codes

```typescript
// src/app/api/auth/2fa/backup-codes/route.ts

export async function POST(request: NextRequest) {
  const { userId, password } = await request.json()

  // Verify password
  const passwordValid = await verifyUserPassword(userId, password)
  if (!passwordValid) {
    return unauthorizedResponse('Invalid password')
  }

  // Generate new backup codes
  const newCodes = await generateAndHashBackupCodes(10)

  // Replace existing codes
  await replaceBackupCodes(userId, newCodes)

  return successResponse({
    success: true,
    backupCodes: newCodes.map((c) => c.code),
    message: 'New backup codes generated. Old codes are now invalid.',
  })
}

// GET - Get remaining code count
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')

  const remaining = await countRemainingBackupCodes(userId)

  return successResponse({
    remaining,
    shouldRegenerate: remaining <= 3,
  })
}
```

### 5.4 SMS Fallback (Optional)

```typescript
// src/lib/2fa/sms.ts

import twilio from 'twilio'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendSMS2FACode(phoneNumber: string): Promise<string> {
  const code = generateNumericCode(6)

  // Store code with expiry (5 minutes)
  await storePhoneVerificationCode(phoneNumber, code, 5 * 60)

  // Send SMS
  await client.messages.create({
    body: `Your nchat verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  })

  return code
}

export async function verifySMS2FACode(phoneNumber: string, code: string): Promise<boolean> {
  const storedCode = await getPhoneVerificationCode(phoneNumber)

  if (!storedCode || storedCode !== code) {
    return false
  }

  // Clear used code
  await clearPhoneVerificationCode(phoneNumber)

  return true
}
```

---

## 6. Enterprise SSO

### 6.1 Supported Providers

| Provider         | Protocol        | Configuration          |
| ---------------- | --------------- | ---------------------- |
| Okta             | SAML 2.0 / OIDC | Metadata URL or manual |
| Azure AD         | SAML 2.0 / OIDC | Tenant ID + App ID     |
| Google Workspace | OIDC            | Domain verification    |
| OneLogin         | SAML 2.0        | Connector ID           |
| Auth0            | OIDC            | Domain + Client ID     |
| Ping Identity    | SAML 2.0        | Entity ID              |
| JumpCloud        | SAML 2.0        | Organization ID        |
| Generic SAML     | SAML 2.0        | Manual configuration   |

### 6.2 SAML 2.0 Implementation

```typescript
// src/services/auth/providers/saml.provider.ts

import { SAML } from '@node-saml/node-saml'

export interface SAMLConfig extends AuthProviderConfig {
  entryPoint: string // IdP SSO URL
  issuer: string // SP Entity ID
  cert: string // IdP Certificate
  callbackUrl: string // ACS URL
  signatureAlgorithm?: 'sha256' | 'sha512'
  wantAssertionsSigned?: boolean
  attributeMapping?: {
    email: string
    firstName?: string
    lastName?: string
    groups?: string
  }
}

export class SAMLProvider extends BaseAuthProvider {
  private saml: SAML

  readonly metadata: AuthProviderMetadata = {
    id: 'saml',
    name: 'Enterprise SSO',
    type: 'enterprise',
    icon: 'building-2',
    description: 'Sign in with your organization account',
    requiresBackend: true,
    supportedFeatures: {
      signIn: true,
      signUp: true, // JIT provisioning
      signOut: true, // SLO support
      tokenRefresh: false,
      passwordReset: false,
      emailVerification: false,
      phoneVerification: false,
      mfa: false, // IdP handles MFA
      linkAccount: true,
    },
  }

  async initialize(config: SAMLConfig): Promise<void> {
    await super.initialize(config)

    this.saml = new SAML({
      entryPoint: config.entryPoint,
      issuer: config.issuer,
      cert: config.cert,
      callbackUrl: config.callbackUrl,
      signatureAlgorithm: config.signatureAlgorithm || 'sha256',
      wantAssertionsSigned: config.wantAssertionsSigned ?? true,
    })
  }

  async getAuthorizationUrl(): Promise<{ url: string; state: OAuthState }> {
    const state = this.generateState()

    const url = await this.saml.getAuthorizeUrlAsync(state.state, { additionalParams: {} })

    return { url, state }
  }

  async handleCallback(samlResponse: string): Promise<AuthResult> {
    try {
      const { profile } = await this.saml.validatePostResponseAsync(samlResponse)

      // Extract user attributes based on mapping
      const mapping = (this.config as SAMLConfig).attributeMapping
      const user = this.mapSAMLProfile(profile, mapping)

      // JIT Provisioning - create/update user
      const nchatUser = await this.jitProvision(user)

      // Generate session tokens
      const session = await this.createSession(nchatUser)

      return this.createSuccessResult(nchatUser, session.accessToken, session.refreshToken)
    } catch (error) {
      return this.createErrorResult(this.createError('SAML_ERROR', error.message))
    }
  }

  private async jitProvision(samlUser: SAMLUser): Promise<AuthUser> {
    // Check if user exists
    const existing = await getUserByEmail(samlUser.email)

    if (existing) {
      // Update existing user
      await updateUser(existing.id, {
        displayName: samlUser.displayName,
        metadata: {
          ...existing.metadata,
          samlGroups: samlUser.groups,
          lastSAMLLogin: new Date().toISOString(),
        },
      })
      return existing
    }

    // Create new user (JIT provisioning)
    const defaultRole = this.config.defaultRole || 'member'

    return await createNchatUser({
      email: samlUser.email,
      username: samlUser.email.split('@')[0],
      displayName: samlUser.displayName,
      role: defaultRole,
      metadata: {
        provider: 'saml',
        samlGroups: samlUser.groups,
        provisionedAt: new Date().toISOString(),
      },
    })
  }

  // Generate SP metadata for IdP configuration
  async getServiceProviderMetadata(): Promise<string> {
    return this.saml.generateServiceProviderMetadata(
      null, // No decryption cert
      null // No signing cert (use IdP's)
    )
  }
}
```

### 6.3 OIDC Implementation

```typescript
// src/services/auth/providers/oidc.provider.ts

import { Issuer, Client, generators } from 'openid-client'

export interface OIDCConfig extends AuthProviderConfig {
  issuerUrl: string // IdP discovery URL
  clientId: string
  clientSecret: string
  scopes?: string[]
  attributeMapping?: {
    email?: string
    name?: string
    groups?: string
  }
}

export class OIDCProvider extends BaseAuthProvider {
  private client: Client
  private issuer: Issuer

  readonly metadata: AuthProviderMetadata = {
    id: 'oidc',
    name: 'OpenID Connect',
    type: 'enterprise',
    icon: 'key',
    description: 'Sign in with OpenID Connect',
    requiresBackend: true,
    supportedFeatures: {
      signIn: true,
      signUp: true,
      signOut: true,
      tokenRefresh: true,
      passwordReset: false,
      emailVerification: false,
      phoneVerification: false,
      mfa: false,
      linkAccount: true,
    },
  }

  async initialize(config: OIDCConfig): Promise<void> {
    await super.initialize(config)

    // Discover OIDC configuration
    this.issuer = await Issuer.discover(config.issuerUrl)

    this.client = new this.issuer.Client({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uris: [this.getCallbackUrl()],
      response_types: ['code'],
    })
  }

  async getAuthorizationUrl(): Promise<{ url: string; state: OAuthState }> {
    const state = generators.state()
    const nonce = generators.nonce()
    const codeVerifier = generators.codeVerifier()
    const codeChallenge = generators.codeChallenge(codeVerifier)

    const url = this.client.authorizationUrl({
      scope: (this.config as OIDCConfig).scopes?.join(' ') || 'openid email profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    return {
      url,
      state: {
        state,
        nonce,
        codeVerifier,
        redirectUri: this.getCallbackUrl(),
        timestamp: Date.now(),
      },
    }
  }

  async handleCallback(params: URLSearchParams): Promise<AuthResult> {
    const storedState = await this.getStoredState(params.get('state'))

    try {
      const tokenSet = await this.client.callback(
        this.getCallbackUrl(),
        Object.fromEntries(params),
        {
          state: storedState.state,
          nonce: storedState.nonce,
          code_verifier: storedState.codeVerifier,
        }
      )

      const userinfo = await this.client.userinfo(tokenSet.access_token)

      // JIT Provisioning
      const user = await this.jitProvision(userinfo)

      return this.createSuccessResult(user, tokenSet.access_token, tokenSet.refresh_token)
    } catch (error) {
      return this.createErrorResult(this.createError('OIDC_ERROR', error.message))
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const tokenSet = await this.client.refresh(refreshToken)

      return {
        success: true,
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        expiresAt: tokenSet.expires_at,
      }
    } catch (error) {
      return this.createErrorResult(this.createError('REFRESH_FAILED', error.message))
    }
  }
}
```

### 6.4 SSO Configuration API

```typescript
// src/app/api/admin/sso/route.ts

// GET - List SSO configurations
export async function GET() {
  const configs = await getSSO Configurations()
  return successResponse({ configs })
}

// POST - Create SSO configuration
export async function POST(request: NextRequest) {
  const config = await request.json()

  // Validate configuration
  const validation = validateSSOConfig(config)
  if (!validation.valid) {
    return badRequestResponse(validation.errors)
  }

  // Test connection
  const testResult = await testSSOConnection(config)
  if (!testResult.success) {
    return badRequestResponse(`Connection test failed: ${testResult.error}`)
  }

  // Save configuration
  const savedConfig = await saveSSOConfiguration(config)

  return successResponse({
    success: true,
    config: savedConfig,
    spMetadataUrl: `/api/auth/sso/${savedConfig.id}/metadata`,
  })
}

// GET - SP Metadata for IdP configuration
// /api/auth/sso/[configId]/metadata
export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  const config = await getSSOConfiguration(params.configId)

  if (!config) {
    return notFoundResponse('SSO configuration not found')
  }

  const provider = new SAMLProvider()
  await provider.initialize(config)

  const metadata = await provider.getServiceProviderMetadata()

  return new NextResponse(metadata, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
```

### 6.5 JIT (Just-In-Time) Provisioning

```typescript
// src/lib/auth/jit-provisioning.ts

export interface JITProvisioningConfig {
  enabled: boolean
  defaultRole: 'member' | 'moderator' | 'admin'
  roleMapping?: {
    // Map IdP groups to nchat roles
    [idpGroup: string]: UserRole
  }
  allowedDomains?: string[]
  autoJoinChannels?: string[]
  sendWelcomeMessage?: boolean
}

export async function jitProvisionUser(
  idpUser: IdPUser,
  config: JITProvisioningConfig
): Promise<AuthUser> {
  // Check domain restrictions
  if (config.allowedDomains?.length) {
    const domain = idpUser.email.split('@')[1]
    if (!config.allowedDomains.includes(domain)) {
      throw new Error(`Domain ${domain} is not allowed`)
    }
  }

  // Determine role from IdP groups
  let role = config.defaultRole
  if (config.roleMapping && idpUser.groups) {
    for (const group of idpUser.groups) {
      if (config.roleMapping[group]) {
        role = config.roleMapping[group]
        break
      }
    }
  }

  // Create user
  const user = await createNchatUser({
    email: idpUser.email,
    username: generateUsername(idpUser.email),
    displayName: idpUser.displayName || idpUser.email.split('@')[0],
    role,
    metadata: {
      provider: idpUser.provider,
      idpGroups: idpUser.groups,
      provisionedAt: new Date().toISOString(),
    },
  })

  // Auto-join channels
  if (config.autoJoinChannels?.length) {
    await joinChannels(user.id, config.autoJoinChannels)
  }

  // Send welcome message
  if (config.sendWelcomeMessage) {
    await sendDirectMessage({
      from: 'system',
      to: user.id,
      message: `Welcome to nchat, ${user.displayName}! Your account was automatically created through your organization's SSO.`,
    })
  }

  return user
}
```

---

## 7. Development Auth Safeguards

### 7.1 Environment-Based Switching

```typescript
// src/config/auth.config.ts

export const authConfig = {
  // Only enable dev auth if explicitly set AND in development
  useDevAuth:
    process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true' && process.env.NODE_ENV === 'development',

  // Production safeguards
  isProduction: process.env.NODE_ENV === 'production',

  // Backend URLs
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000',
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/v1/graphql',

  // Dev mode settings (only used when useDevAuth is true)
  devAuth: {
    autoLogin: true,
    defaultUser: {
      /* ... */
    },
    availableUsers: [
      /* ... */
    ],
  },

  // Session settings
  session: {
    cookieName: 'nchat-session',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}
```

### 7.2 Build-Time Validation

```typescript
// src/lib/auth/validate-config.ts

export function validateAuthConfig(): void {
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // Ensure dev auth is disabled
    if (process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true') {
      throw new Error('FATAL: NEXT_PUBLIC_USE_DEV_AUTH cannot be true in production')
    }

    // Ensure required secrets are set
    const requiredSecrets = ['JWT_SECRET', 'DATABASE_PASSWORD', 'NHOST_ADMIN_SECRET']

    for (const secret of requiredSecrets) {
      if (!process.env[secret]) {
        throw new Error(`FATAL: ${secret} must be set in production`)
      }

      // Validate minimum length
      if (process.env[secret].length < 32) {
        throw new Error(`FATAL: ${secret} must be at least 32 characters`)
      }
    }
  }
}
```

### 7.3 Runtime Guards

```typescript
// src/services/auth/auth-factory.ts

import { authConfig } from '@/config/auth.config'
import { FauxAuthService } from './faux-auth.service'
import { NhostAuthService } from './nhost-auth.service'

export function createAuthService(): AuthService {
  // Double-check production safeguard
  if (process.env.NODE_ENV === 'production' && authConfig.useDevAuth) {
    console.error('SECURITY: Dev auth attempted in production, using real auth')
    return new NhostAuthService()
  }

  if (authConfig.useDevAuth) {
    console.log('AUTH: Using FauxAuthService (development mode)')
    return new FauxAuthService()
  }

  console.log('AUTH: Using NhostAuthService (production mode)')
  return new NhostAuthService()
}

// Singleton instance
export const authService = createAuthService()
```

### 7.4 Security Headers for Dev Auth

```typescript
// src/middleware.ts

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set(
    'X-Auth-Mode',
    process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true' ? 'development' : 'production'
  )

  // Block dev auth endpoints in production
  if (process.env.NODE_ENV === 'production') {
    if (request.nextUrl.pathname.startsWith('/api/auth/dev/')) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  return response
}
```

---

## 8. nself Auth Service Integration

### 8.1 Nhost Configuration

```typescript
// src/lib/nhost.ts

import { NhostClient } from '@nhost/nextjs'

export const nhost = new NhostClient({
  // Self-hosted nhost URLs (via nself CLI)
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL || 'http://auth.localhost',
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://hasura.localhost/v1/graphql',
  storageUrl: process.env.NEXT_PUBLIC_STORAGE_URL || 'http://storage.localhost',

  // Security settings
  refreshIntervalTime: 600, // Refresh tokens every 10 minutes
  autoRefreshToken: true,
  autoSignIn: false,

  // Development settings
  devTools: process.env.NODE_ENV === 'development',
})
```

### 8.2 JWT Configuration

JWT tokens are issued by Nhost Auth and consumed by Hasura for authorization.

**JWT Claims Structure:**

```json
{
  "sub": "user-uuid",
  "iat": 1706976000,
  "exp": 1707062400,
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["user", "member", "admin"],
    "x-hasura-default-role": "member",
    "x-hasura-user-id": "user-uuid"
  }
}
```

**Hasura JWT Configuration (`.backend/config.yml`):**

```yaml
hasura:
  jwt:
    type: 'HS256'
    key: '${HASURA_GRAPHQL_JWT_SECRET}'
    claims_namespace: 'https://hasura.io/jwt/claims'
```

### 8.3 Session Management

```typescript
// src/lib/auth/session-manager.ts

export interface Session {
  id: string
  userId: string
  accessToken: string
  refreshToken: string
  device: string
  browser: string
  os: string
  ipAddress: string
  location?: {
    city: string
    country: string
  }
  isCurrent: boolean
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
}

export class SessionManager {
  private readonly cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  }

  async createSession(params: CreateSessionParams): Promise<Session> {
    const { userId, accessToken, refreshToken, rememberMe, deviceInfo, ipAddress } = params

    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      accessToken,
      refreshToken,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress,
      location: await this.getLocation(ipAddress),
      isCurrent: true,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    // Store in database
    await this.saveSession(session)

    return session
  }

  async refreshSession(refreshToken: string): Promise<Session | null> {
    // Verify refresh token
    const session = await this.getSessionByRefreshToken(refreshToken)
    if (!session || session.expiresAt < new Date()) {
      return null
    }

    // Get new tokens from Nhost
    const { session: nhostSession, error } = await nhost.auth.refreshSession()
    if (error || !nhostSession) {
      return null
    }

    // Update session
    session.accessToken = nhostSession.accessToken
    session.refreshToken = nhostSession.refreshToken
    session.lastActiveAt = new Date()

    await this.updateSession(session)

    return session
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.deleteSession(sessionId)
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    return await this.deleteUserSessions(userId, exceptSessionId)
  }

  validateSession(session: Session): { valid: boolean; reason?: string } {
    if (session.expiresAt < new Date()) {
      return { valid: false, reason: 'Session expired' }
    }

    // Check if session was revoked (not in DB)
    // This is handled by the caller

    return { valid: true }
  }

  detectSuspiciousActivity(
    newSession: Session,
    previousSessions: Session[]
  ): SuspiciousActivityResult | null {
    // Check for new device
    const knownDevices = new Set(previousSessions.map((s) => s.device))
    const newDevice = !knownDevices.has(newSession.device)

    // Check for new location
    const knownCountries = new Set(previousSessions.map((s) => s.location?.country))
    const newCountry =
      newSession.location?.country && !knownCountries.has(newSession.location.country)

    // Check for impossible travel (multiple countries in short time)
    const recentSession = previousSessions[0]
    const impossibleTravel =
      recentSession &&
      recentSession.location?.country !== newSession.location?.country &&
      newSession.createdAt.getTime() - recentSession.lastActiveAt.getTime() < 60 * 60 * 1000 // 1 hour

    if (impossibleTravel) {
      return {
        type: 'impossible_travel',
        severity: 'high',
        message: `Login from ${newSession.location?.country} shortly after activity from ${recentSession.location?.country}`,
      }
    }

    if (newDevice && newCountry) {
      return {
        type: 'new_device_location',
        severity: 'medium',
        message: `New device from ${newSession.location?.country}`,
      }
    }

    if (newDevice) {
      return {
        type: 'new_device',
        severity: 'low',
        message: `New device: ${newSession.device}`,
      }
    }

    return null
  }
}

export const sessionManager = new SessionManager()
```

### 8.4 Provider Configuration in Nhost

OAuth providers are configured in Nhost Auth. The following environment variables must be set:

```bash
# Google
NHOST_AUTH_GOOGLE_ENABLED=true
NHOST_AUTH_GOOGLE_CLIENT_ID=your-client-id
NHOST_AUTH_GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub
NHOST_AUTH_GITHUB_ENABLED=true
NHOST_AUTH_GITHUB_CLIENT_ID=your-client-id
NHOST_AUTH_GITHUB_CLIENT_SECRET=your-client-secret

# Microsoft / Azure AD
NHOST_AUTH_AZUREAD_ENABLED=true
NHOST_AUTH_AZUREAD_TENANT=your-tenant-id
NHOST_AUTH_AZUREAD_CLIENT_ID=your-client-id
NHOST_AUTH_AZUREAD_CLIENT_SECRET=your-client-secret

# Apple
NHOST_AUTH_APPLE_ENABLED=true
NHOST_AUTH_APPLE_CLIENT_ID=your-service-id
NHOST_AUTH_APPLE_TEAM_ID=your-team-id
NHOST_AUTH_APPLE_KEY_ID=your-key-id
NHOST_AUTH_APPLE_PRIVATE_KEY=your-private-key

# Discord
NHOST_AUTH_DISCORD_ENABLED=true
NHOST_AUTH_DISCORD_CLIENT_ID=your-client-id
NHOST_AUTH_DISCORD_CLIENT_SECRET=your-client-secret
```

---

## 9. Implementation Phases

### Phase 1: Core Authentication (Week 1-2)

**Goal:** Complete email/password authentication with production-ready security

**Tasks:**

1. [ ] Complete `/api/auth/signup` endpoint
2. [ ] Add `/api/auth/signout` endpoint
3. [ ] Add `/api/auth/forgot-password` endpoint
4. [ ] Add `/api/auth/reset-password` endpoint
5. [ ] Add `/api/auth/verify-email` endpoint
6. [ ] Implement email sending service (SendGrid/Mailgun)
7. [ ] Add password strength validation
8. [ ] Implement account lockout after failed attempts
9. [ ] Add auth event logging

**Deliverables:**

- Full email/password auth flow
- Password reset functionality
- Email verification
- Rate limiting on all endpoints

### Phase 2: OAuth Providers (Week 3)

**Goal:** Enable social login with major providers

**Tasks:**

1. [ ] Complete Google OAuth integration
2. [ ] Complete GitHub OAuth integration
3. [ ] Add Microsoft/Azure AD OAuth
4. [ ] Add Apple Sign In
5. [ ] Add Discord OAuth
6. [ ] Implement OAuth callback handler
7. [ ] Add account linking (connect OAuth to existing account)
8. [ ] Handle OAuth errors gracefully

**Deliverables:**

- 5+ OAuth providers working
- Account linking functionality
- Unified OAuth callback handling

### Phase 3: Two-Factor Authentication (Week 4)

**Goal:** Robust 2FA implementation

**Tasks:**

1. [ ] Complete 2FA setup flow
2. [ ] Complete 2FA verification flow
3. [ ] Implement backup codes (done)
4. [ ] Implement trusted devices
5. [ ] Add 2FA disable flow
6. [ ] Add SMS fallback (optional)
7. [ ] Add 2FA enforcement (admin setting)
8. [ ] UI components for 2FA setup

**Deliverables:**

- Full 2FA with TOTP
- Backup code recovery
- Trusted device management
- Optional SMS fallback

### Phase 4: Enterprise SSO (Week 5-6)

**Goal:** Enterprise-grade SSO support

**Tasks:**

1. [ ] Implement SAML 2.0 provider
2. [ ] Implement OIDC provider
3. [ ] Add SSO configuration admin UI
4. [ ] Implement JIT provisioning
5. [ ] Add role mapping from IdP groups
6. [ ] Support major IdPs (Okta, Azure AD, etc.)
7. [ ] Generate SP metadata
8. [ ] Test with multiple IdPs

**Deliverables:**

- SAML 2.0 support
- OIDC support
- Admin SSO configuration
- JIT provisioning

### Phase 5: Session Management & Security (Week 7)

**Goal:** Complete session management and security hardening

**Tasks:**

1. [ ] Implement session listing UI
2. [ ] Add session revocation
3. [ ] Implement "sign out everywhere"
4. [ ] Add suspicious activity detection
5. [ ] Implement IP/geo blocking
6. [ ] Add security event notifications
7. [ ] Implement audit logging
8. [ ] Security penetration testing

**Deliverables:**

- Full session management
- Security monitoring
- Audit trail
- Security documentation

### Phase 6: Testing & Documentation (Week 8)

**Goal:** Production-ready with full test coverage

**Tasks:**

1. [ ] Unit tests for all auth services
2. [ ] Integration tests for API endpoints
3. [ ] E2E tests for auth flows
4. [ ] Load testing
5. [ ] Security testing
6. [ ] API documentation
7. [ ] Admin documentation
8. [ ] User documentation

**Deliverables:**

- 80%+ test coverage
- Complete API docs
- Admin guides
- User guides

---

## 10. Security Considerations

### 10.1 Password Security

- **Hashing:** bcrypt with cost factor 10-12
- **Minimum Length:** 8 characters (configurable)
- **Complexity:** Configurable requirements (upper, lower, number, symbol)
- **History:** Prevent reusing last 5 passwords
- **Expiry:** Configurable password expiration

### 10.2 Token Security

- **JWT Secret:** Minimum 256 bits (32 characters)
- **Access Token:** Short-lived (15-60 minutes)
- **Refresh Token:** Long-lived (7-30 days), stored in httpOnly cookie
- **Token Rotation:** New refresh token on each refresh

### 10.3 Session Security

- **CSRF Protection:** SameSite cookies, CSRF tokens for state-changing operations
- **Session Fixation:** Regenerate session ID after authentication
- **Concurrent Sessions:** Configurable limit (default: unlimited)
- **Idle Timeout:** Configurable (default: 30 minutes)

### 10.4 Rate Limiting

| Endpoint                  | Limit | Window     |
| ------------------------- | ----- | ---------- |
| /api/auth/signin          | 5     | 15 minutes |
| /api/auth/signup          | 3     | 1 hour     |
| /api/auth/forgot-password | 3     | 15 minutes |
| /api/auth/2fa/verify      | 5     | 5 minutes  |
| /api/auth/oauth/\*        | 10    | 1 minute   |

### 10.5 Audit Logging

All authentication events should be logged:

```typescript
interface AuthAuditEvent {
  id: string
  type: AuthEventType
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  success: boolean
  errorCode?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

type AuthEventType =
  | 'SIGNUP'
  | 'SIGNIN'
  | 'SIGNOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_VERIFIED'
  | '2FA_FAILED'
  | 'BACKUP_CODE_USED'
  | 'DEVICE_TRUSTED'
  | 'SESSION_REVOKED'
  | 'OAUTH_SIGNIN'
  | 'SSO_SIGNIN'
  | 'ACCOUNT_LOCKED'
  | 'SUSPICIOUS_ACTIVITY'
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// src/services/auth/__tests__/email-password.provider.test.ts

describe('EmailPasswordProvider', () => {
  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const result = await provider.signIn({
        email: 'test@example.com',
        password: 'ValidP@ss123',
      })

      expect(result.success).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.accessToken).toBeDefined()
    })

    it('should fail with invalid password', async () => {
      const result = await provider.signIn({
        email: 'test@example.com',
        password: 'wrong',
      })

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('AUTH_FAILED')
    })

    it('should require 2FA when enabled', async () => {
      // Enable 2FA for test user
      await enable2FA(testUser.id, testSecret)

      const result = await provider.signIn({
        email: testUser.email,
        password: 'ValidP@ss123',
      })

      expect(result.success).toBe(true)
      expect(result.requires2FA).toBe(true)
      expect(result.tempToken).toBeDefined()
    })
  })

  describe('signUp', () => {
    it('should create new user', async () => {
      const result = await provider.signUp(
        {
          email: 'new@example.com',
          password: 'ValidP@ss123',
        },
        {
          username: 'newuser',
          displayName: 'New User',
        }
      )

      expect(result.success).toBe(true)
      expect(result.user.email).toBe('new@example.com')
    })

    it('should fail with weak password', async () => {
      const result = await provider.signUp({
        email: 'new@example.com',
        password: '123',
      })

      expect(result.success).toBe(false)
      expect(result.error.code).toBe('WEAK_PASSWORD')
    })
  })
})
```

### 11.2 Integration Tests

```typescript
// src/app/api/auth/__tests__/signin.integration.test.ts

describe('POST /api/auth/signin', () => {
  it('should return tokens on successful login', async () => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'ValidP@ss123',
      }),
    })

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.accessToken).toBeDefined()
    expect(data.user).toBeDefined()
  })

  it('should rate limit after 5 attempts', async () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await fetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong',
        }),
      })
    }

    // 6th attempt should be rate limited
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong',
      }),
    })

    expect(response.status).toBe(429)
  })
})
```

### 11.3 E2E Tests

```typescript
// e2e/auth/signin.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Sign In Flow', () => {
  test('should complete full sign in flow', async ({ page }) => {
    await page.goto('/auth/signin')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'ValidP@ss123')
    await page.click('button[type="submit"]')

    // Should redirect to chat
    await expect(page).toHaveURL('/chat')

    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should require 2FA when enabled', async ({ page }) => {
    await page.goto('/auth/signin')

    await page.fill('[name="email"]', '2fa-user@example.com')
    await page.fill('[name="password"]', 'ValidP@ss123')
    await page.click('button[type="submit"]')

    // Should show 2FA form
    await expect(page.locator('[data-testid="2fa-form"]')).toBeVisible()

    // Enter TOTP code
    await page.fill('[name="totp"]', '123456')
    await page.click('button[type="submit"]')

    // Should redirect to chat
    await expect(page).toHaveURL('/chat')
  })

  test('should handle OAuth flow', async ({ page }) => {
    await page.goto('/auth/signin')

    await page.click('[data-testid="google-signin"]')

    // Wait for Google OAuth (mocked in test)
    await expect(page).toHaveURL('/chat')
  })
})
```

---

## 12. Migration Guide

### 12.1 From Development Auth to Production

1. **Update Environment Variables:**

   ```bash
   # Remove or set to false
   NEXT_PUBLIC_USE_DEV_AUTH=false

   # Add production credentials
   NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com
   JWT_SECRET=your-secure-256-bit-secret
   DATABASE_PASSWORD=your-secure-password
   ```

2. **Run Database Migrations:**

   ```bash
   cd .backend
   nself migrate up
   ```

3. **Create Initial Admin User:**

   ```sql
   -- First user becomes owner
   INSERT INTO auth.users (email, encrypted_password, email_verified)
   VALUES ('admin@yourdomain.com', '$2a$10$...', true);
   ```

4. **Configure OAuth Providers:**
   - Set up apps in provider developer consoles
   - Add client IDs/secrets to environment
   - Configure redirect URIs

5. **Enable SSL/TLS:**
   - Ensure all auth endpoints use HTTPS
   - Configure secure cookies

### 12.2 Adding New OAuth Providers

1. Create provider class extending `BaseAuthProvider`
2. Implement required methods
3. Register in `providers/index.ts`
4. Add to AppConfig interface
5. Add UI button component
6. Configure in Nhost (if using)

### 12.3 Enabling Enterprise SSO

1. **Configure SAML/OIDC Provider:**
   - Get metadata from IdP
   - Configure SP in admin panel
   - Share SP metadata with IdP

2. **Set Up Role Mapping:**

   ```typescript
   {
     roleMapping: {
       'admin-group': 'admin',
       'moderator-group': 'moderator',
       'users': 'member',
     }
   }
   ```

3. **Enable JIT Provisioning:**
   - Configure default role
   - Set allowed domains
   - Configure auto-join channels

4. **Test with IdP:**
   - Initiate SSO flow
   - Verify user creation
   - Verify role assignment

---

## Appendix A: Environment Variables Reference

```bash
# Auth Mode
NEXT_PUBLIC_USE_DEV_AUTH=false

# Nhost Configuration
NEXT_PUBLIC_AUTH_URL=http://auth.localhost
NEXT_PUBLIC_GRAPHQL_URL=http://hasura.localhost/v1/graphql
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost
NHOST_ADMIN_SECRET=your-admin-secret

# JWT
JWT_SECRET=minimum-32-character-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nself
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-password

# OAuth - Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# OAuth - GitHub
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# OAuth - Apple
APPLE_CLIENT_ID=your-service-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key

# OAuth - Discord
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# ID.me
IDME_CLIENT_ID=your-client-id
IDME_CLIENT_SECRET=your-client-secret
IDME_SANDBOX=true

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email (SendGrid)
SENDGRID_API_KEY=your-api-key
EMAIL_FROM=noreply@yourdomain.com
```

---

## Appendix B: Database Schema Reference

### auth.users (Nhost)

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  given_name TEXT,
  family_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT,
  timezone TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### nchat.nchat_users

```sql
CREATE TABLE nchat.nchat_users (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'offline',
  role TEXT DEFAULT 'member',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### nchat.nchat_user_sessions

```sql
CREATE TABLE nchat.nchat_user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES nchat.nchat_users(id),
  device TEXT,
  browser TEXT,
  os TEXT,
  ip_address INET,
  location JSONB,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
```

### nchat.nchat_user_2fa_settings

```sql
CREATE TABLE nchat.nchat_user_2fa_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### nchat.nchat_user_backup_codes

```sql
CREATE TABLE nchat.nchat_user_backup_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### nchat.nchat_sso_configurations

```sql
CREATE TABLE nchat.nchat_sso_configurations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'saml' | 'oidc'
  config JSONB NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Appendix C: Related TODO.md Tasks

This implementation plan addresses the following tasks from TODO.md:

- **Task 86:** Implement password reset flow
- **Task 87:** Implement email verification
- **Task 88:** Complete OAuth provider integrations
- **Task 89:** Implement 2FA/MFA
- **Task 90:** Implement enterprise SSO (SAML/OIDC)
- **Task 91:** Session management and security

---

**Document End**

_This plan was created based on analysis of the existing nChat codebase and represents a comprehensive approach to implementing production-ready authentication._
