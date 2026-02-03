# Authentication System Quick Start Guide

**Purpose**: Get the authentication system to 100% completion
**Estimated Time**: 12-18 hours
**Current Status**: 85% complete

---

## Phase 1: Email Service Integration (1-2 hours)

### Step 1: Choose Email Provider

**Option A: SendGrid (Recommended)**

```bash
pnpm add @sendgrid/mail
```

**Option B: Postmark**

```bash
pnpm add postmark
```

**Option C: Resend (Modern, Simple)**

```bash
pnpm add resend
```

### Step 2: Create Email Service

Create `/src/lib/email/email-service.ts`:

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await sgMail.send({
    to: options.to,
    from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  })
}

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const magicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-link?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Your Magic Link',
    html: `
      <h1>Sign In to nChat</h1>
      <p>Click the link below to sign in:</p>
      <a href="${magicUrl}">${magicUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  })
}

export async function sendEmailVerification(email: string, token: string): Promise<void> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  })
}
```

### Step 3: Update API Routes

Update `/src/app/api/auth/password-reset/route.ts`:

```typescript
// Line 142 - Replace TODO comment with:
import { sendPasswordResetEmail } from '@/lib/email/email-service'

// Line 145 - Add actual email sending:
await sendPasswordResetEmail(user.email, resetToken)
```

Update `/src/app/api/auth/magic-link/route.ts`:

```typescript
// Line 188 - Replace TODO comment with:
import { sendMagicLinkEmail } from '@/lib/email/email-service'

// Line 196 - Add actual email sending:
await sendMagicLinkEmail(email, magicToken)
```

### Step 4: Environment Variables

Add to `.env.local`:

```bash
SENDGRID_API_KEY=your-api-key-here
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Test

```bash
# Start dev server
pnpm dev

# Test password reset
curl -X POST http://localhost:3000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check your email inbox
```

---

## Phase 2: OAuth Testing & Completion (2-3 hours)

### Step 1: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
6. Copy Client ID and Client Secret

### Step 2: GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/callback`
4. Copy Client ID and Client Secret

### Step 3: Update Environment

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

NEXT_PUBLIC_GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 4: Configure Nhost

If using self-hosted Nhost (via nself CLI), add to `.backend/.env`:

```bash
# OAuth Providers
AUTH_PROVIDER_GOOGLE_ENABLED=true
AUTH_PROVIDER_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
AUTH_PROVIDER_GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

AUTH_PROVIDER_GITHUB_ENABLED=true
AUTH_PROVIDER_GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
AUTH_PROVIDER_GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
```

Restart nself services:

```bash
cd .backend
nself stop
nself start
```

### Step 5: Test OAuth Flows

Create test page `/src/app/test-oauth/page.tsx`:

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'

export default function TestOAuthPage() {
  const { signInWithOAuth } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test OAuth</h1>

      <button
        onClick={() => signInWithOAuth({ provider: 'google' })}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Sign in with Google
      </button>

      <button
        onClick={() => signInWithOAuth({ provider: 'github' })}
        className="bg-gray-800 text-white px-4 py-2 rounded"
      >
        Sign in with GitHub
      </button>
    </div>
  )
}
```

Visit `http://localhost:3000/test-oauth` and test each provider.

---

## Phase 3: ID.me Integration (2-3 hours)

### Step 1: Create ID.me API Route

Create `/src/app/api/auth/idme/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { IDmeProvider } from '@/services/auth/providers/idme.provider'

const idmeProvider = new IDmeProvider()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?error=missing_code`)
  }

  try {
    // Exchange code for tokens
    const result = await idmeProvider.handleCallback({
      code,
      state: state || '',
    })

    if (!result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?error=${result.error?.code}`
      )
    }

    // Set session cookie and redirect
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/chat`)

    response.cookies.set('nchat-session', result.accessToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('ID.me callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/error?error=callback_failed`
    )
  }
}
```

### Step 2: Register with ID.me

1. Go to [ID.me Developer Portal](https://developers.id.me/)
2. Create account and verify
3. Create new application
4. Set redirect URI: `http://localhost:3000/api/auth/idme/callback`
5. Request access to verification groups (military, first-responder, etc.)
6. Copy Client ID and Client Secret

### Step 3: Environment Variables

Add to `.env.local`:

```bash
IDME_CLIENT_ID=your-idme-client-id
IDME_CLIENT_SECRET=your-idme-client-secret
IDME_SANDBOX=true  # Use sandbox for testing
```

### Step 4: Update Auth Config

Ensure ID.me is enabled in your app config (via setup wizard or directly):

```typescript
{
  authProviders: {
    idme: {
      enabled: true,
      allowMilitary: true,
      allowPolice: true,
      allowFirstResponders: true,
      allowGovernment: true,
      requireVerification: true,
    }
  }
}
```

### Step 5: Test

1. Start dev server
2. Navigate to `/test-oauth` (or add ID.me button)
3. Click "Sign in with ID.me"
4. Complete verification flow
5. Verify user is created with correct verification group

---

## Phase 4: Security Hardening (3-4 hours)

### Step 1: Implement Audit Logging

Create `/src/lib/audit/auth-logger.ts`:

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
})

export interface AuthAuditEvent {
  type: AuthEventType
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  success: boolean
  errorCode?: string
  metadata?: Record<string, unknown>
}

export type AuthEventType =
  | 'SIGNIN'
  | 'SIGNUP'
  | 'SIGNOUT'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'PASSWORD_CHANGED'
  | 'EMAIL_VERIFIED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_VERIFIED'
  | '2FA_FAILED'
  | 'OAUTH_SIGNIN'
  | 'SSO_SIGNIN'
  | 'MAGIC_LINK_SENT'
  | 'MAGIC_LINK_VERIFIED'
  | 'SUSPICIOUS_ACTIVITY'

export async function logAuthEvent(event: AuthAuditEvent): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO nchat_auth_audit_log (
        event_type, user_id, email, ip_address, user_agent,
        success, error_code, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        event.type,
        event.userId,
        event.email,
        event.ipAddress,
        event.userAgent,
        event.success,
        event.errorCode,
        JSON.stringify(event.metadata || {}),
      ]
    )
  } catch (error) {
    console.error('Failed to log auth event:', error)
    // Don't throw - logging failure shouldn't break auth
  }
}
```

### Step 2: Add Audit Logging to API Routes

Example for `/src/app/api/auth/signin/route.ts`:

```typescript
import { logAuthEvent } from '@/lib/audit/auth-logger'

// After successful signin:
await logAuthEvent({
  type: 'SIGNIN',
  userId: user.id,
  email: user.email,
  ipAddress: getClientIP(request),
  userAgent: request.headers.get('user-agent') || '',
  success: true,
})

// After failed signin:
await logAuthEvent({
  type: 'SIGNIN',
  email: email,
  ipAddress: getClientIP(request),
  userAgent: request.headers.get('user-agent') || '',
  success: false,
  errorCode: 'INVALID_CREDENTIALS',
})
```

### Step 3: Session Blacklisting

Create migration `.backend/migrations/017_session_blacklist.sql`:

```sql
-- Session blacklist table
CREATE TABLE IF NOT EXISTS nchat.nchat_session_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES nchat.nchat_users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  reason TEXT,
  blacklisted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(refresh_token_hash)
);

CREATE INDEX idx_session_blacklist_user ON nchat.nchat_session_blacklist(user_id);
CREATE INDEX idx_session_blacklist_expires ON nchat.nchat_session_blacklist(expires_at);

-- Clean up expired entries
CREATE OR REPLACE FUNCTION nchat.cleanup_expired_blacklist()
RETURNS void AS $$
BEGIN
  DELETE FROM nchat.nchat_session_blacklist WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Suspicious Activity Detection

Create `/src/lib/security/suspicious-activity.ts`:

```typescript
import { Pool } from 'pg'

interface LoginAttempt {
  userId: string
  ipAddress: string
  country?: string
  timestamp: Date
}

export async function detectSuspiciousActivity(
  current: LoginAttempt,
  previous: LoginAttempt[]
): Promise<{ suspicious: boolean; reason?: string }> {
  // Check for impossible travel
  if (previous.length > 0) {
    const lastLogin = previous[0]
    const timeDiff = current.timestamp.getTime() - lastLogin.timestamp.getTime()

    // If login from different country within 1 hour
    if (
      lastLogin.country &&
      current.country &&
      lastLogin.country !== current.country &&
      timeDiff < 60 * 60 * 1000
    ) {
      return {
        suspicious: true,
        reason: 'impossible_travel',
      }
    }
  }

  // Check for too many failed attempts
  const recentFailures = await getRecentFailedAttempts(current.userId)
  if (recentFailures > 5) {
    return {
      suspicious: true,
      reason: 'multiple_failed_attempts',
    }
  }

  return { suspicious: false }
}

async function getRecentFailedAttempts(userId: string): Promise<number> {
  // Query nchat_auth_audit_log for recent failed signin attempts
  const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  })

  const result = await pool.query(
    `SELECT COUNT(*) as count
     FROM nchat_auth_audit_log
     WHERE user_id = $1
       AND event_type = 'SIGNIN'
       AND success = false
       AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  )

  return parseInt(result.rows[0]?.count || '0')
}
```

---

## Phase 5: Testing (4-6 hours)

### Step 1: Set Up Jest Tests

Tests are already configured. Add tests for critical paths:

Create `/src/services/auth/__tests__/nhost-auth.service.test.ts`:

```typescript
import { NhostAuthService } from '../nhost-auth.service'

describe('NhostAuthService', () => {
  let service: NhostAuthService

  beforeEach(() => {
    service = new NhostAuthService()
  })

  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const result = await service.signIn('test@example.com', 'password123')
      expect(result.user).toBeDefined()
      expect(result.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      await expect(service.signIn('test@example.com', 'wrongpassword')).rejects.toThrow()
    })
  })

  describe('2FA', () => {
    it('should generate TOTP secret', async () => {
      const result = await service.generateTOTPSecret()
      expect(result.secret).toBeDefined()
      expect(result.qrCodeDataUrl).toBeDefined()
    })
  })
})
```

Run tests:

```bash
pnpm test
```

### Step 2: Integration Testing

Create `/src/app/api/auth/__tests__/signin.integration.test.ts`:

```typescript
describe('POST /api/auth/signin', () => {
  it('should sign in successfully', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.user).toBeDefined()
    expect(data.accessToken).toBeDefined()
  })

  it('should rate limit after 5 attempts', async () => {
    // Make 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong',
        }),
      })
    }

    // 6th attempt should be rate limited
    const response = await fetch('http://localhost:3000/api/auth/signin', {
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

### Step 3: E2E Testing with Playwright

Tests are in `/e2e/`. Run:

```bash
pnpm test:e2e
```

---

## Phase 6: Documentation (2-3 hours)

### Create Setup Guides

1. **OAuth Setup Guide** (`/docs/auth/OAUTH-SETUP.md`)
   - Google OAuth configuration
   - GitHub OAuth configuration
   - Microsoft OAuth configuration
   - Troubleshooting common issues

2. **ID.me Setup Guide** (`/docs/auth/IDME-SETUP.md`)
   - Registration process
   - Verification group setup
   - Testing in sandbox
   - Production deployment

3. **Email Service Guide** (`/docs/auth/EMAIL-SERVICE.md`)
   - SendGrid setup
   - Postmark setup
   - Custom SMTP setup
   - Email template customization

4. **Production Deployment Guide** (`/docs/auth/PRODUCTION-DEPLOYMENT.md`)
   - Environment variables checklist
   - Database migrations
   - SSL/TLS configuration
   - Monitoring setup

---

## Verification Checklist

After completing all phases, verify:

- [ ] Email password reset works end-to-end
- [ ] Magic link login works end-to-end
- [ ] Email verification works
- [ ] Google OAuth works
- [ ] GitHub OAuth works
- [ ] 2FA setup and verification works
- [ ] SAML/SSO works with test IdP
- [ ] ID.me verification works (if applicable)
- [ ] Audit logs are being created
- [ ] Rate limiting works correctly
- [ ] Session management works (refresh, logout)
- [ ] All tests pass
- [ ] Documentation is complete

---

## Estimated Timeline

| Phase     | Task                      | Time       | Priority |
| --------- | ------------------------- | ---------- | -------- |
| 1         | Email Service Integration | 1-2h       | HIGH     |
| 2         | OAuth Testing             | 2-3h       | HIGH     |
| 3         | ID.me Integration         | 2-3h       | MEDIUM   |
| 4         | Security Hardening        | 3-4h       | HIGH     |
| 5         | Testing                   | 4-6h       | MEDIUM   |
| 6         | Documentation             | 2-3h       | LOW      |
| **TOTAL** |                           | **14-21h** |          |

---

## Quick Commands Reference

```bash
# Development
pnpm dev                    # Start dev server
pnpm backend:start          # Start nself backend

# Testing
pnpm test                   # Unit tests
pnpm test:watch            # Watch mode
pnpm test:e2e              # E2E tests

# Backend
cd .backend
nself status               # Check services
nself logs auth            # View auth logs
nself migrate up           # Run migrations

# Email Testing
# Use Mailpit (included in nself monitoring bundle)
# View emails at http://localhost:8025

# Production Build
pnpm build                 # Build for production
pnpm start                 # Start production server
```

---

## Getting Help

**Issues?**

- Check `/docs/AUTH-COMPLETION-REPORT.md` for detailed status
- Review `/docs/AUTH-IMPLEMENTATION-PLAN.md` for architecture
- Check `.claude/COMMON-ISSUES.md` for known problems
- Review Sentry errors in production

**Need Assistance?**

- Authentication code is well-documented inline
- SAML implementation has extensive comments
- NhostAuthService has method-level documentation
- Auth config has inline security checks explained

---

Good luck! The system is 85% complete - you're almost there!
