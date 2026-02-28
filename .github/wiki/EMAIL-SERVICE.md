# Email Service Documentation

Complete guide to the email service in ɳChat v0.9.1.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Email Templates](#email-templates)
5. [Usage Examples](#usage-examples)
6. [Development with Mailpit](#development-with-mailpit)
7. [Production with SendGrid](#production-with-sendgrid)
8. [Troubleshooting](#troubleshooting)

---

## Overview

ɳChat includes a unified email service that supports multiple providers:

- **Console** (Development): Logs emails to console for testing
- **SMTP** (Development): Mailpit for local email testing
- **SendGrid** (Production): Transactional email delivery

### Features

- Automatic provider selection based on environment
- React Email templates for beautiful emails
- Welcome emails, password resets, email verification, 2FA codes
- Login notifications and security alerts
- Sensitive data filtering
- Error handling and retry logic

---

## Architecture

### Email Service Class

**Location**: `src/lib/email/email.service.ts`

The `EmailService` class provides a unified interface for all email operations:

```typescript
class EmailService {
  // Send generic email
  async send(options: EmailOptions): Promise<boolean>

  // Authentication emails
  async sendEmailVerification(options: EmailVerificationOptions): Promise<boolean>
  async sendPasswordReset(options: PasswordResetOptions): Promise<boolean>
  async send2FACode(options: TwoFactorCodeOptions): Promise<boolean>
  async sendMagicLink(options: MagicLinkOptions): Promise<boolean>

  // Notification emails
  async sendWelcomeEmail(options: WelcomeEmailOptions): Promise<boolean>
  async sendNewLoginNotification(options: NewLoginOptions): Promise<boolean>
  async sendPasswordChangedNotification(options: PasswordChangedOptions): Promise<boolean>
}
```

### Provider Selection

The service automatically selects the provider:

```typescript
constructor() {
  const hasSendGrid = !!process.env.SENDGRID_API_KEY
  const hasSmtp = !!process.env.SMTP_HOST
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (hasSendGrid) {
    this.provider = 'sendgrid'  // Production
  } else if (hasSmtp) {
    this.provider = 'smtp'      // Development with Mailpit
  } else if (isDevelopment) {
    this.provider = 'console'   // Fallback for dev
  }
}
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Email provider: sendgrid | smtp | console
EMAIL_PROVIDER=console

# SendGrid (Production)
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Email sender details
EMAIL_FROM=noreply@nchat.app
EMAIL_FROM_NAME=ɳChat

# SMTP Configuration (Development with Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=

# SMTP Configuration (Production)
# Example: Gmail, SendGrid SMTP, AWS SES
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=true
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
```

### Development Setup (Mailpit)

Mailpit is a local email testing tool that captures all emails:

1. Install Mailpit:

```bash
# macOS
brew install mailpit

# Or run with Docker
docker run -d \
  --name mailpit \
  -p 1025:1025 \
  -p 8025:8025 \
  axllent/mailpit
```

2. Start Mailpit:

```bash
mailpit
```

3. View emails:

- Web UI: http://localhost:8025
- SMTP server: localhost:1025

4. Configure ɳChat:

```bash
# .env.local
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Production Setup (SendGrid)

1. Create SendGrid account: https://sendgrid.com

2. Generate API key:
   - Go to Settings → API Keys
   - Create API Key with "Mail Send" permissions
   - Copy the API key

3. Configure ɳChat:

```bash
# .env.local
SENDGRID_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
```

4. Verify sender domain:
   - Go to Settings → Sender Authentication
   - Verify your domain or single sender email

---

## Email Templates

All templates are built with **React Email** for responsive, beautiful emails.

### Available Templates

#### 1. Email Verification

**Template**: `src/emails/templates/email-verification.tsx`

**Usage**:

```typescript
import { emailService } from '@/lib/email/email.service'

await emailService.sendEmailVerification({
  to: 'user@example.com',
  userName: 'John Doe',
  verificationUrl: 'https://nchat.app/verify-email?token=abc123',
  verificationCode: '123456', // Optional
  expiresInHours: 24,
})
```

#### 2. Password Reset

**Template**: `src/emails/templates/password-reset.tsx`

**Usage**:

```typescript
await emailService.sendPasswordReset({
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://nchat.app/reset-password?token=abc123',
  expiresInMinutes: 60,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
})
```

#### 3. Two-Factor Authentication Code

**Template**: Inline HTML (in `email.service.ts`)

**Usage**:

```typescript
await emailService.send2FACode({
  to: 'user@example.com',
  userName: 'John Doe',
  code: '123456',
  expiresInMinutes: 10,
})
```

#### 4. Magic Link

**Template**: Inline HTML (in `email.service.ts`)

**Usage**:

```typescript
await emailService.sendMagicLink({
  to: 'user@example.com',
  userName: 'John Doe',
  magicLinkUrl: 'https://nchat.app/magic-login?token=abc123',
  expiresInMinutes: 15,
})
```

#### 5. Welcome Email

**Template**: `src/emails/templates/welcome.tsx`

**Usage**:

```typescript
await emailService.sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  loginUrl: 'https://nchat.app/login',
})
```

#### 6. New Login Notification

**Template**: `src/emails/templates/new-login.tsx`

**Usage**:

```typescript
await emailService.sendNewLoginNotification({
  to: 'user@example.com',
  userName: 'John Doe',
  ipAddress: '192.168.1.1',
  location: 'San Francisco, CA',
  userAgent: 'Mozilla/5.0...',
})
```

#### 7. Password Changed

**Template**: `src/emails/templates/password-changed.tsx`

**Usage**:

```typescript
await emailService.sendPasswordChangedNotification({
  to: 'user@example.com',
  userName: 'John Doe',
  ipAddress: '192.168.1.1',
})
```

---

## Usage Examples

### In Auth Routes

Email service is integrated in all authentication routes:

#### Sign Up

**Location**: `src/app/api/auth/signup/route.ts`

```typescript
import { emailService } from '@/lib/email/email.service'

// Send welcome email after successful signup
await emailService.sendWelcomeEmail({
  to: email,
  userName: displayName,
  loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
})

// Send verification email if required
await emailService.sendEmailVerification({
  to: email,
  userName: displayName,
  verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`,
  expiresInHours: 24,
})
```

#### Password Reset

**Location**: `src/app/api/auth/password-reset/route.ts`

```typescript
// Send password reset email
await emailService.sendPasswordReset({
  to: email,
  userName: user.displayName,
  resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`,
  expiresInMinutes: 60,
  ipAddress: req.headers['x-forwarded-for'] || req.ip,
  userAgent: req.headers['user-agent'],
})
```

#### 2FA Setup

**Location**: `src/app/api/auth/2fa/verify-setup/route.ts`

```typescript
// Send 2FA code during setup
await emailService.send2FACode({
  to: user.email,
  userName: user.displayName,
  code: verificationCode,
  expiresInMinutes: 10,
})
```

### Custom Email Sending

```typescript
import { emailService } from '@/lib/email/email.service'

// Send custom email
const success = await emailService.send({
  to: 'user@example.com',
  subject: 'Custom Email Subject',
  html: '<h1>Hello World</h1><p>This is a custom email.</p>',
  text: 'Hello World\n\nThis is a custom email.',
})

if (success) {
  console.log('Email sent successfully')
} else {
  console.error('Failed to send email')
}
```

### Multiple Recipients

```typescript
// Send to multiple recipients
await emailService.send({
  to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  subject: 'Announcement',
  html: '<p>Important announcement for all users.</p>',
})
```

---

## Development with Mailpit

### Benefits

- **No API keys required**: Works locally without external services
- **Email testing**: View all sent emails in web UI
- **Fast development**: Instant email delivery
- **Email debugging**: Inspect HTML, headers, attachments
- **Link testing**: Click links directly from emails

### Accessing Mailpit

1. Start Mailpit: `mailpit`
2. Open web UI: http://localhost:8025
3. Send emails from ɳChat
4. View emails in real-time

### Features

- **Inbox**: View all captured emails
- **Search**: Search by subject, recipient, date
- **Raw view**: View raw email source
- **HTML view**: Render HTML emails
- **Plain text view**: View plain text version
- **Headers**: Inspect email headers
- **Download**: Download email as .eml file

---

## Production with SendGrid

### Setup Checklist

- [ ] Create SendGrid account
- [ ] Generate API key with "Mail Send" permissions
- [ ] Add API key to `.env.local`
- [ ] Verify sender domain or email
- [ ] Test email sending
- [ ] Monitor email delivery in SendGrid dashboard

### Best Practices

1. **Domain Verification**: Verify your domain for better deliverability
2. **SPF/DKIM**: Set up SPF and DKIM records
3. **Suppression Lists**: Manage bounces and unsubscribes
4. **Rate Limiting**: Respect SendGrid's rate limits
5. **Monitoring**: Monitor delivery rates in dashboard
6. **Templates**: Use SendGrid templates for consistent branding

### SendGrid Dashboard

- **Activity**: View sent emails and delivery status
- **Stats**: Email delivery metrics
- **Suppressions**: Manage bounces, blocks, spam reports
- **Settings**: Configure sender authentication, webhooks

### Cost

- **Free tier**: 100 emails/day
- **Essentials**: $19.95/month for 40,000 emails
- **Pro**: $89.95/month for 100,000 emails

---

## Troubleshooting

### Common Issues

**1. "Email not sent"**

- Check provider is configured correctly
- Verify environment variables are set
- Check email service logs: `logger.info('[Email]')`
- Test with console provider first

**2. "SendGrid authentication failed"**

- Verify `SENDGRID_API_KEY` is correct
- Check API key permissions (needs "Mail Send")
- Ensure API key hasn't expired

**3. "Emails going to spam"**

- Verify sender domain in SendGrid
- Set up SPF and DKIM records
- Avoid spam trigger words in subject
- Include unsubscribe link

**4. "SMTP connection failed"**

- Check Mailpit is running: `ps aux | grep mailpit`
- Verify SMTP_HOST and SMTP_PORT
- Check firewall rules

**5. "Template rendering error"**

- Ensure React Email is installed: `@react-email/render`
- Check template file exists
- Verify template props match interface

### Debug Mode

Enable email debug logging:

```typescript
import { logger } from '@/lib/logger'

// In email.service.ts
logger.info('[Email] Sending email', {
  to: options.to,
  subject: options.subject,
  provider: this.provider,
})
```

### Testing Email Delivery

```typescript
// Test email sending
import { emailService } from '@/lib/email/email.service'

// Test console provider
process.env.NODE_ENV = 'development'
await emailService.send({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>This is a test email.</p>',
})

// Check console for email content
// Should see: [Email] Console mode - Email would be sent
```

---

## Additional Resources

- **SendGrid Docs**: https://docs.sendgrid.com
- **Mailpit GitHub**: https://github.com/axllent/mailpit
- **React Email**: https://react.email
- **Email Best Practices**: https://sendgrid.com/blog/email-best-practices

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/nself-org/nself-chat/issues
- Discord: https://discord.gg/nself
- Email: support@nself.org
