# Authentication

Complete guide to all 11 authentication methods in nself-chat.

---

## Overview

nself-chat supports 11 authentication providers:

| Provider | Type | Setup Complexity |
|----------|------|------------------|
| [Email/Password](Auth-Email) | Credential | None |
| [Magic Links](Auth-Magic-Link) | Passwordless | SMTP required |
| [Google](Auth-OAuth) | OAuth 2.0 | Low |
| [GitHub](Auth-OAuth) | OAuth 2.0 | Low |
| [Apple](Auth-OAuth) | OAuth 2.0 | Medium |
| [Microsoft](Auth-OAuth) | OAuth 2.0 | Low |
| [Facebook](Auth-OAuth) | OAuth 2.0 | Low |
| [Twitter/X](Auth-OAuth) | OAuth 2.0 | Low |
| [Phone/SMS](Auth-Phone) | OTP | Twilio/SNS required |
| [ID.me](Auth-IDme) | Identity Verification | Medium |
| [Telegram](Auth-OAuth) | Widget | Bot Token required |

---

## Quick Setup

### Enable Providers in Setup Wizard

The setup wizard (Step 6) lets you toggle providers:

```
[ ] Email/Password
[ ] Magic Links
[ ] Google
[ ] GitHub
[ ] Apple
[ ] Microsoft
[ ] Facebook
[ ] Twitter/X
[ ] Phone/SMS
[ ] ID.me
[ ] Telegram
```

### Enable via AppConfig

```typescript
const { updateConfig } = useAppConfig()

await updateConfig({
  auth: {
    methods: {
      email: true,
      google: true,
      github: true,
      apple: false,
      idme: true
    }
  }
})
```

---

## Email/Password

Standard email and password authentication.

### Configuration

```env
# No special configuration needed for basic email/password
NEXT_PUBLIC_USE_DEV_AUTH=false
```

### Password Requirements

```typescript
const passwordConfig = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false
}
```

### Email Verification

```typescript
const emailConfig = {
  requireVerification: true,
  verificationExpiry: 24 * 60 * 60, // 24 hours
  allowUnverifiedLogin: false
}
```

---

## Magic Links

Passwordless authentication via email links.

### Configuration

```env
# SMTP configuration required
AUTH_SMTP_HOST=smtp.sendgrid.net
AUTH_SMTP_PORT=587
AUTH_SMTP_USER=apikey
AUTH_SMTP_PASS=your-sendgrid-api-key
AUTH_SMTP_FROM=noreply@yourdomain.com
```

### Usage

```typescript
import { useMagicLink } from '@/hooks/use-auth'

function MagicLinkLogin() {
  const { sendMagicLink, isLoading } = useMagicLink()

  const handleSubmit = async (email: string) => {
    await sendMagicLink(email)
    // User receives email with login link
  }

  return <EmailForm onSubmit={handleSubmit} loading={isLoading} />
}
```

---

## OAuth Providers

### Google

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. Enable Google+ API
4. Create OAuth credentials
5. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`

### GitHub

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

**Setup Steps:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `https://yourdomain.com/api/auth/callback/github`

### Apple

```env
APPLE_CLIENT_ID=com.yourdomain.app
APPLE_CLIENT_SECRET=your-jwt-secret
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
```

**Setup Steps:**
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create App ID with Sign In with Apple
3. Create Services ID
4. Create private key
5. Generate client secret (JWT)

### Microsoft

```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=common  # or specific tenant
```

### Facebook

```env
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
```

### Twitter/X

```env
TWITTER_CLIENT_ID=your-api-key
TWITTER_CLIENT_SECRET=your-api-secret
```

---

## Phone/SMS Authentication

OTP-based authentication via SMS.

### Provider Options

| Provider | Configuration |
|----------|---------------|
| Twilio | Account SID, Auth Token, Phone Number |
| AWS SNS | Access Key, Secret, Region |
| Custom Webhook | Webhook URL |

### Twilio Configuration

```env
PHONE_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### AWS SNS Configuration

```env
PHONE_PROVIDER=aws-sns
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### OTP Configuration

```typescript
const otpConfig = {
  length: 6,
  expiry: 300, // 5 minutes
  maxAttempts: 3,
  rateLimit: {
    window: 3600,
    max: 5
  }
}
```

### Usage

```typescript
import { usePhoneAuth } from '@/hooks/use-auth'

function PhoneLogin() {
  const { sendOTP, verifyOTP, isLoading } = usePhoneAuth()
  const [step, setStep] = useState<'phone' | 'verify'>('phone')

  const handleSendOTP = async (phone: string) => {
    await sendOTP(phone)
    setStep('verify')
  }

  const handleVerify = async (code: string) => {
    await verifyOTP(code)
    // User is now logged in
  }

  return step === 'phone'
    ? <PhoneForm onSubmit={handleSendOTP} />
    : <OTPForm onSubmit={handleVerify} />
}
```

---

## ID.me Verification

Government-grade identity verification for verified groups.

### Supported Verification Groups

| Group | Description |
|-------|-------------|
| `military` | Active duty military |
| `veteran` | Military veterans |
| `military_family` | Military families |
| `first_responder` | Police, fire, EMT |
| `law_enforcement` | Police officers |
| `firefighter` | Firefighters |
| `emt` | Emergency medical technicians |
| `government` | Government employees |
| `federal_government` | Federal employees |
| `state_government` | State employees |
| `local_government` | Local employees |
| `teacher` | K-12 teachers |
| `student` | College students |
| `nurse` | Registered nurses |

### Configuration

```env
IDME_CLIENT_ID=your-client-id
IDME_CLIENT_SECRET=your-client-secret
IDME_ENVIRONMENT=production  # or sandbox
IDME_SCOPES=military,veteran,first_responder
```

### Usage

```typescript
import { useIDmeAuth } from '@/hooks/use-auth'

function IDmeLogin() {
  const { startVerification, getVerificationStatus } = useIDmeAuth()

  return (
    <Button onClick={() => startVerification(['military', 'veteran'])}>
      Verify with ID.me
    </Button>
  )
}
```

### Verification Badges

Verified users receive badges displayed on their profile:

```tsx
<UserBadge
  type="military"
  verified={true}
  verifiedAt={user.idmeVerifiedAt}
/>
```

### Access Control

Restrict features to verified groups:

```typescript
const accessConfig = {
  mode: 'idme-roles',
  allowedGroups: ['military', 'veteran', 'first_responder'],
  guestAccess: false
}
```

---

## Telegram Authentication

Authentication via Telegram Login Widget.

### Configuration

```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username
```

### Setup Steps

1. Create bot via [@BotFather](https://t.me/BotFather)
2. Get bot token
3. Set domain via BotFather: `/setdomain`
4. Add widget to login page

---

## Access Control Modes

### Mode Options

| Mode | Description |
|------|-------------|
| `allow-all` | Anyone can register |
| `verified-only` | Email verification required |
| `idme-roles` | ID.me verification required |
| `domain-restricted` | Specific email domains only |
| `admin-only` | Manual approval required |

### Configuration

```typescript
const accessConfig = {
  mode: 'verified-only',
  allowedDomains: ['company.com'], // for domain-restricted
  allowedIdmeGroups: ['military'], // for idme-roles
  requireApproval: false
}
```

---

## Auth Context Usage

```typescript
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    switchUser // dev mode only
  } = useAuth()

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <LoginPrompt />

  return <div>Welcome, {user.displayName}!</div>
}
```

---

## Session Management

### Session Configuration

```typescript
const sessionConfig = {
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // 24 hours
  secure: true,
  sameSite: 'lax'
}
```

### Token Refresh

Tokens are automatically refreshed when:
- Session approaches expiry
- User returns after idle period
- API returns 401

---

## Multi-Factor Authentication

### MFA Methods

| Method | Description |
|--------|-------------|
| TOTP | Authenticator app (Google, Authy) |
| SMS | Code via text message |
| Email | Code via email |
| Backup Codes | One-time recovery codes |

### Enabling MFA

```typescript
import { useMFA } from '@/hooks/use-mfa'

function MFASetup() {
  const { setupTOTP, verifyTOTP, generateBackupCodes } = useMFA()

  const handleSetup = async () => {
    const { qrCode, secret } = await setupTOTP()
    // Show QR code for scanning
  }

  return <MFASetupWizard onSetup={handleSetup} />
}
```

---

## Related Documentation

- [Email/Password](Auth-Email)
- [Magic Links](Auth-Magic-Link)
- [OAuth Providers](Auth-OAuth)
- [Phone/SMS](Auth-Phone)
- [ID.me Verification](Auth-IDme)
- [Access Control](Auth-Access-Control)
