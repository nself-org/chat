# Email Service Integration Guide - SendGrid

## Overview

Complete SendGrid email service integration for production-ready transactional emails.

## Prerequisites

### 1. SendGrid Account Setup

1. Sign up at https://sendgrid.com/ (Free tier: 100 emails/day)
2. Create an API key:
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the key (it won't be shown again)

### 2. Verify Sender Identity

1. Go to Settings > Sender Authentication
2. Either:
   - **Single Sender Verification** (Quick, for testing)
     - Add sender email (e.g., noreply@yourdomain.com)
     - Verify email link sent to inbox
   - **Domain Authentication** (Recommended for production)
     - Add your domain
     - Add DNS records (CNAME, TXT)
     - Wait for verification (usually 5-10 minutes)

## Installation

### Step 1: Install Dependencies

```bash
cd /Users/admin/Sites/nself-chat
pnpm add @sendgrid/mail nodemailer @react-email/components @react-email/render
pnpm add -D @types/nodemailer
```

### Step 2: Environment Variables

Add to `.env.local`:

```bash
# Email Service Configuration
EMAIL_PROVIDER=sendgrid
EMAIL_FROM_NAME=nChat
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Reply-To address
EMAIL_REPLY_TO_NAME=Support
EMAIL_REPLY_TO_ADDRESS=support@yourdomain.com
```

For production (`.env.production`):

```bash
EMAIL_PROVIDER=sendgrid
EMAIL_FROM_NAME=${SENDGRID_FROM_NAME}
EMAIL_FROM_ADDRESS=${SENDGRID_FROM_EMAIL}
SENDGRID_API_KEY=${SENDGRID_API_KEY}
```

### Step 3: Test Email Configuration

Create test script: `scripts/test-email.ts`

```typescript
#!/usr/bin/env tsx
import { getEmailSender } from '../src/lib/email/sender'
import { sendPasswordReset } from '../src/lib/email/templates'

async function testEmail() {
  console.log('Testing SendGrid configuration...')

  const sender = getEmailSender()
  const verified = await sender.verify()

  if (!verified) {
    console.error('❌ Email configuration invalid')
    process.exit(1)
  }

  console.log('✅ Email configuration verified')

  // Test password reset email
  console.log('\nSending test password reset email...')

  const emailId = await sendPasswordReset(
    { email: 'test@example.com', name: 'Test User' },
    {
      userName: 'Test User',
      resetUrl: 'http://localhost:3000/auth/reset?token=test123',
      expiresInMinutes: 60,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Script',
    }
  )

  console.log(`✅ Email queued with ID: ${emailId}`)
  console.log('\nCheck your SendGrid dashboard for delivery status')
  console.log('https://app.sendgrid.com/email_activity')
}

testEmail().catch(console.error)
```

Run test:

```bash
chmod +x scripts/test-email.ts
tsx scripts/test-email.ts
```

## Integration Points

### 1. Password Reset (PRIORITY)

File: `/Users/admin/Sites/nself-chat/src/app/api/auth/password-reset/route.ts`

Replace TODO on line 141-143:

```typescript
// OLD:
// TODO: Send password reset email
// In production, integrate with email service (SendGrid, Postmark, etc.)
console.log(`[AUTH] Password reset token generated for ${user.email}`)

// NEW:
import { sendPasswordReset } from '@/lib/email/templates'

// Inside handleRequestReset function after generating token:
const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset?token=${resetToken}`
await sendPasswordReset(
  { email: user.email, name: user.email.split('@')[0] },
  {
    userName: user.email.split('@')[0],
    resetUrl,
    expiresInMinutes: 60,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  }
)
console.log(`[AUTH] Password reset email sent to ${user.email}`)
```

### 2. Email Verification

File: `/Users/admin/Sites/nself-chat/src/app/api/auth/magic-link/route.ts`

Add email verification integration (check for TODOs)

### 3. Welcome Email

File: `/Users/admin/Sites/nself-chat/src/app/api/auth/signup/route.ts`

After user creation, send welcome email:

```typescript
import { sendWelcomeEmail } from '@/lib/email/templates'

// After successful signup
await sendWelcomeEmail(
  { email: user.email, name: user.displayName || user.email },
  {
    userName: user.displayName || user.email,
    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/signin`,
  }
)
```

### 4. Password Changed Notification

File: `/Users/admin/Sites/nself-chat/src/app/api/auth/password-reset/route.ts`

Add to handleResetPassword after password update (line 240-241):

```typescript
import { sendPasswordChanged } from '@/lib/email/templates'

// After password is changed
await sendPasswordChanged(
  { email: decoded.email },
  {
    userName: decoded.email.split('@')[0],
    supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    timestamp: new Date(),
  }
)
```

### 5. Notification Digests

File: `/Users/admin/Sites/nself-chat/src/app/api/notifications/digest/route.ts`

Already integrated (line 141) - just verify it works with SendGrid.

## Testing Checklist

### Development Testing

- [ ] Install dependencies (`pnpm install`)
- [ ] Add SendGrid API key to `.env.local`
- [ ] Run test script (`tsx scripts/test-email.ts`)
- [ ] Verify email appears in SendGrid Activity Feed
- [ ] Test password reset flow end-to-end
- [ ] Test welcome email on new signup
- [ ] Test password changed notification

### SendGrid Dashboard Checks

- [ ] Activity Feed shows emails as "Delivered"
- [ ] No bounces or blocks
- [ ] Open/click tracking working (if enabled)
- [ ] Sender reputation is healthy

### Production Checklist

- [ ] Domain authentication completed (not just single sender)
- [ ] SPF, DKIM, DMARC records configured
- [ ] Unsubscribe link added to marketing emails
- [ ] Rate limiting configured (prevent abuse)
- [ ] Error monitoring set up (Sentry integration)
- [ ] Backup email provider configured (fallback)

## Monitoring & Maintenance

### SendGrid Webhooks (Optional but Recommended)

Create webhook endpoint: `/api/email/webhooks/sendgrid`

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const events = await request.json()

  for (const event of events) {
    console.log(`Email ${event.email} - ${event.event}`)

    // Store in database for tracking
    // Update email delivery status
    // Handle bounces/spam reports
  }

  return NextResponse.json({ received: true })
}
```

Configure in SendGrid:

1. Go to Settings > Mail Settings > Event Webhook
2. Add webhook URL: `https://yourdomain.com/api/email/webhooks/sendgrid`
3. Select events: Delivered, Opened, Clicked, Bounced, Spam Report

### Email Queue Monitoring

Add to admin dashboard or monitoring service:

```typescript
import { getEmailQueueStatus } from '@/lib/email/templates'

const status = getEmailQueueStatus()
console.log(`Queue: ${status.pending} pending, ${status.failed} failed`)

// Alert if queue is backing up
if (status.pending > 100) {
  // Send alert to ops team
}
```

## Common Issues

### 1. "403 Forbidden" Error

**Cause**: API key doesn't have correct permissions
**Fix**: Recreate API key with "Mail Send" full access

### 2. "401 Unauthorized" Error

**Cause**: Invalid API key
**Fix**: Verify API key is correct, check for extra spaces

### 3. Emails Not Delivering

**Cause**: Sender not verified
**Fix**: Complete sender verification in SendGrid dashboard

### 4. Emails Going to Spam

**Cause**: Domain not authenticated
**Fix**: Set up domain authentication (SPF, DKIM, DMARC)

### 5. Rate Limit Exceeded

**Cause**: Free tier limit (100/day) exceeded
**Fix**: Upgrade plan or implement digest emails

## Alternative Providers (Future)

If SendGrid doesn't meet needs, the system supports:

1. **Resend** (Modern, developer-friendly)

   ```bash
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxx
   ```

2. **SMTP** (Any provider - Gmail, AWS SES, Mailgun)

   ```bash
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=app-password
   ```

3. **Mailgun** (High deliverability)
   Add implementation to `sender.ts`

## Next Steps

1. ✅ Install dependencies
2. ✅ Get SendGrid API key
3. ✅ Configure environment variables
4. ✅ Test with script
5. ✅ Update password reset route
6. ✅ Update signup route (welcome email)
7. ✅ Test all email flows
8. ✅ Set up domain authentication (production)
9. ✅ Configure webhooks (optional)
10. ✅ Monitor delivery rates

## Support Resources

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Status: https://status.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
- Activity Feed: https://app.sendgrid.com/email_activity
- API Reference: https://docs.sendgrid.com/api-reference/mail-send/mail-send

---

**Status**: Ready for implementation
**Priority**: HIGH (required for production auth flows)
**Estimated Time**: 2-3 hours (including testing)
