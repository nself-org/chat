# OAuth Providers Setup Guide

## Overview

Complete setup guide for all OAuth providers: Google, GitHub, Microsoft, and Apple.

## Status

✅ **Code Ready** - All OAuth routes and handlers implemented
⚠️ **Credentials Required** - Need to configure provider apps

## Supported Providers

1. **Google OAuth** - For Gmail users
2. **GitHub OAuth** - For developers
3. **Microsoft OAuth** - For Office 365 / Azure AD users
4. **Apple Sign In** - For iOS/macOS users

---

## 1. Google OAuth Setup

### Create OAuth App

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API" (APIs & Services > Library)
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External (for public) or Internal (for Google Workspace)
   - App name: "nChat"
   - Support email: your-email@domain.com
   - Scopes: openid, email, profile
   - Authorized domains: yourdomain.com

6. Create OAuth Client:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (dev), `https://yourdomain.com` (prod)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/oauth/callback` (dev)
     - `https://yourdomain.com/api/auth/oauth/callback` (prod)

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### Testing

```bash
# Start app
pnpm dev

# Navigate to login page
http://localhost:3000/login

# Click "Continue with Google"
# Should redirect to Google OAuth
# After auth, redirects back to /api/auth/oauth/callback
# Then redirects to /chat
```

---

## 2. GitHub OAuth Setup

### Create OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" > "New OAuth App"
3. Fill in:
   - Application name: nChat
   - Homepage URL: `http://localhost:3000` (dev) or `https://yourdomain.com` (prod)
   - Authorization callback URL: `http://localhost:3000/api/auth/oauth/callback`
   - Enable Device Flow: Optional

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testing

Same as Google - click "Continue with GitHub" on login page.

---

## 3. Microsoft OAuth Setup

### Create Azure AD App

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: nChat
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: Web - `http://localhost:3000/api/auth/oauth/callback`

5. After creation:
   - Copy "Application (client) ID"
   - Go to "Certificates & secrets" > "New client secret"
   - Copy the secret value (shown once!)
   - Go to "API permissions" > "Add a permission"
     - Microsoft Graph > Delegated permissions
     - Select: openid, profile, email, User.Read

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxx~xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Testing

Click "Continue with Microsoft" on login page.

---

## 4. Apple Sign In Setup

### Create Apple Service ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create App ID:
   - Click "Identifiers" > "+" > "App IDs"
   - Description: nChat
   - Bundle ID: com.yourdomain.nchat
   - Capabilities: Enable "Sign In with Apple"

4. Create Service ID:
   - Click "Identifiers" > "+" > "Services IDs"
   - Description: nChat Web
   - Identifier: com.yourdomain.nchat.service
   - Enable "Sign In with Apple"
   - Configure:
     - Primary App ID: com.yourdomain.nchat
     - Website URLs: https://yourdomain.com
     - Return URLs: https://yourdomain.com/api/auth/oauth/callback

5. Create Key:
   - Click "Keys" > "+"
   - Key Name: nChat Sign In Key
   - Enable "Sign In with Apple"
   - Configure: Select your App ID
   - Download .p8 file (keep safe!)
   - Note Key ID and Team ID

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_APPLE_CLIENT_ID=com.yourdomain.nchat.service
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...contents of .p8 file...
-----END PRIVATE KEY-----"
```

### Note

Apple Sign In requires HTTPS in production. Use ngrok for local testing:

```bash
ngrok http 3000
# Update Apple Return URLs with ngrok URL
```

---

## Testing All Providers

### Automated Test Script

Create `scripts/test-oauth.sh`:

```bash
#!/bin/bash

echo "OAuth Provider Test"
echo "==================="
echo ""

# Check Google
if [ -n "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" ]; then
  echo "✅ Google OAuth configured"
else
  echo "❌ Google OAuth not configured"
fi

# Check GitHub
if [ -n "$NEXT_PUBLIC_GITHUB_CLIENT_ID" ]; then
  echo "✅ GitHub OAuth configured"
else
  echo "❌ GitHub OAuth not configured"
fi

# Check Microsoft
if [ -n "$NEXT_PUBLIC_MICROSOFT_CLIENT_ID" ]; then
  echo "✅ Microsoft OAuth configured"
else
  echo "❌ Microsoft OAuth not configured"
fi

# Check Apple
if [ -n "$NEXT_PUBLIC_APPLE_CLIENT_ID" ]; then
  echo "✅ Apple Sign In configured"
else
  echo "❌ Apple Sign In not configured"
fi

echo ""
echo "Start dev server and test at:"
echo "http://localhost:3000/login"
```

### Manual Testing Checklist

- [ ] Google OAuth
  - [ ] Click "Continue with Google"
  - [ ] Redirects to Google login
  - [ ] Select account
  - [ ] Grants permissions
  - [ ] Redirects back to app
  - [ ] User logged in successfully
  - [ ] User record created in database

- [ ] GitHub OAuth
  - [ ] Click "Continue with GitHub"
  - [ ] Redirects to GitHub authorize
  - [ ] Authorize app
  - [ ] Redirects back to app
  - [ ] User logged in successfully

- [ ] Microsoft OAuth
  - [ ] Click "Continue with Microsoft"
  - [ ] Redirects to Microsoft login
  - [ ] Sign in with Microsoft account
  - [ ] Consent to permissions
  - [ ] Redirects back to app
  - [ ] User logged in successfully

- [ ] Apple Sign In
  - [ ] Click "Continue with Apple"
  - [ ] Redirects to Apple ID login
  - [ ] Sign in (or Face ID/Touch ID)
  - [ ] Choose to share or hide email
  - [ ] Redirects back to app
  - [ ] User logged in successfully

### Account Linking

Test users linking OAuth accounts:

1. Sign up with email/password
2. Go to Settings > Connected Accounts
3. Click "Connect Google" (or other provider)
4. Authorize
5. Account should be linked
6. User can now sign in with either email or OAuth

---

## Common Issues

### 1. "Redirect URI Mismatch"

**Cause**: OAuth app redirect URI doesn't match callback URL
**Fix**: Ensure redirect URI is exactly: `http://localhost:3000/api/auth/oauth/callback`

### 2. "Invalid Client"

**Cause**: Wrong client ID or secret
**Fix**: Double-check environment variables, ensure no extra spaces

### 3. "Unauthorized Client"

**Cause**: OAuth app not approved or disabled
**Fix**: Check OAuth app status in provider console

### 4. "Access Denied"

**Cause**: User denied permissions
**Fix**: Normal behavior, show appropriate message to user

### 5. Apple Sign In Not Working Locally

**Cause**: Apple requires HTTPS
**Fix**: Use ngrok or test only in production/staging

---

## Security Best Practices

1. **Client Secrets**
   - Never commit to version control
   - Use environment variables
   - Rotate regularly (every 90 days)

2. **Redirect URIs**
   - Whitelist only necessary URLs
   - Use HTTPS in production
   - Validate state parameter

3. **Scopes**
   - Request minimum necessary permissions
   - Document why each scope is needed
   - Remove unused scopes

4. **Token Storage**
   - Store tokens securely (encrypted)
   - Use httpOnly cookies
   - Implement token rotation

5. **Error Handling**
   - Don't leak sensitive error info
   - Log errors server-side only
   - Show generic messages to users

---

## Production Checklist

- [ ] All OAuth apps use production domain
- [ ] Redirect URIs updated to HTTPS
- [ ] Client secrets stored in secure vault
- [ ] OAuth consent screens configured
- [ ] Privacy policy URL added
- [ ] Terms of service URL added
- [ ] Logo/branding uploaded
- [ ] Verified domain ownership
- [ ] Tested all providers in production
- [ ] Monitoring/alerts configured
- [ ] Rate limiting implemented
- [ ] CSRF protection enabled

---

## Monitoring

### Track OAuth Events

```typescript
// Add to callback route
import { captureError } from '@/lib/sentry-utils'

try {
  // OAuth flow
} catch (error) {
  captureError(error, {
    tags: { feature: 'oauth', provider: 'google' },
    extra: { userId, timestamp: new Date() },
  })
}
```

### Metrics to Track

- OAuth success rate (by provider)
- OAuth error rate (by error type)
- Time to complete OAuth flow
- Account linking rate
- Provider preference distribution

---

## Resources

- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Docs](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Microsoft OAuth Docs](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Apple Sign In Docs](https://developer.apple.com/sign-in-with-apple/)

---

**Status**: Ready for configuration
**Priority**: HIGH (production auth requirement)
**Estimated Setup Time**: 1-2 hours (all providers)
