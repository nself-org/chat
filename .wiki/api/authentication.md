# Authentication API

Complete guide to authenticating users with nChat.

## Authentication Methods

nChat supports multiple authentication methods:

1. **Email/Password** - Traditional username/password authentication
2. **Magic Links** - Passwordless email authentication
3. **OAuth 2.0** - Social login (Google, GitHub, Discord, etc.)
4. **Two-Factor Authentication (2FA)** - TOTP-based 2FA
5. **API Keys** - Server-to-server authentication

## Email/Password Authentication

### Sign Up

Create a new user account.

**Endpoint**: `POST /api/auth/signup`

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "displayName": "John Doe",
  "username": "johndoe" // optional
}
```

**Response**:

```json
{
  "data": {
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "username": "johndoe",
      "role": "member",
      "status": "active",
      "createdAt": "2024-01-01T12:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "expiresAt": "2024-01-02T12:00:00Z"
  },
  "success": true
}
```

**cURL Example**:

```bash
curl -X POST https://api.nchat.example.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "displayName": "John Doe"
  }'
```

**SDK Example**:

```typescript
const { user, token } = await client.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  displayName: 'John Doe',
})

client.setToken(token)
```

### Sign In

Authenticate an existing user.

**Endpoint**: `POST /api/auth/signin`

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:

```json
{
  "data": {
    "user": {
      /* user object */
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "expiresAt": "2024-01-02T12:00:00Z"
  },
  "success": true
}
```

**SDK Example**:

```typescript
const { user, token } = await client.auth.signIn({
  email: 'user@example.com',
  password: 'SecurePassword123!',
})

client.setToken(token)
```

### Sign Out

**Endpoint**: `POST /api/auth/signout`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true
}
```

**SDK Example**:

```typescript
await client.auth.signOut()
```

## Token Refresh

Access tokens expire after 24 hours. Use the refresh token to get a new access token.

**Endpoint**: `POST /api/auth/refresh`

**Request**:

```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response**:

```json
{
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresAt": "2024-01-03T12:00:00Z"
  },
  "success": true
}
```

**SDK Example**:

```typescript
const { token, refreshToken } = await client.auth.refreshToken(refreshToken)
client.setToken(token)
```

## Password Management

### Change Password

**Endpoint**: `POST /api/auth/change-password`

**Headers**:

```
Authorization: Bearer <token>
```

**Request**:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Request Password Reset

**Endpoint**: `POST /api/auth/password-reset`

**Request**:

```json
{
  "email": "user@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**SDK Example**:

```typescript
await client.auth.requestPasswordReset('user@example.com')
```

### Reset Password

**Endpoint**: `POST /api/auth/password-reset/confirm`

**Request**:

```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword789!"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**SDK Example**:

```typescript
await client.auth.resetPassword('reset-token', 'NewPassword789!')
```

## Email Verification

### Send Verification Email

**Endpoint**: `POST /api/auth/verify-email/send`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

### Verify Email

**Endpoint**: `POST /api/auth/verify-email`

**Request**:

```json
{
  "token": "verification-token-from-email"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**SDK Example**:

```typescript
await client.auth.verifyEmail('verification-token')
```

## Two-Factor Authentication (2FA)

### Enable 2FA

**Endpoint**: `POST /api/auth/2fa/setup`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
  },
  "success": true
}
```

**SDK Example**:

```typescript
const { secret, qrCode } = await client.auth.enable2FA()
// Display QR code to user
```

### Verify 2FA Setup

**Endpoint**: `POST /api/auth/2fa/verify-setup`

**Headers**:

```
Authorization: Bearer <token>
```

**Request**:

```json
{
  "token": "123456" // 6-digit TOTP code from authenticator app
}
```

**Response**:

```json
{
  "data": {
    "backupCodes": [
      "ABCD-1234-EFGH",
      "IJKL-5678-MNOP"
      // ... 8 more codes
    ]
  },
  "success": true,
  "message": "2FA enabled successfully"
}
```

**SDK Example**:

```typescript
const { backupCodes } = await client.auth.verify2FA('123456')
// Store backup codes securely
```

### Verify 2FA During Sign In

After signing in with email/password, if 2FA is enabled:

**Endpoint**: `POST /api/auth/2fa/verify`

**Request**:

```json
{
  "email": "user@example.com",
  "token": "123456" // or backup code
}
```

**Response**:

```json
{
  "data": {
    "user": {
      /* user object */
    },
    "token": "access-token",
    "refreshToken": "refresh-token"
  },
  "success": true
}
```

### Disable 2FA

**Endpoint**: `POST /api/auth/2fa/disable`

**Headers**:

```
Authorization: Bearer <token>
```

**Request**:

```json
{
  "password": "current-password"
}
```

**Response**:

```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

**SDK Example**:

```typescript
await client.auth.disable2FA('current-password')
```

## OAuth 2.0

### Supported Providers

- Google
- GitHub
- Discord
- Slack
- Facebook
- Twitter

### Initiate OAuth Flow

**Endpoint**: `GET /api/auth/oauth/{provider}`

**Example**:

```
https://api.nchat.example.com/api/auth/oauth/google?redirect_uri=https://yourapp.com/callback
```

This redirects to the OAuth provider's authorization page.

### Handle OAuth Callback

After user authorizes, they're redirected back with a code:

**Endpoint**: `POST /api/auth/oauth/callback`

**Request**:

```json
{
  "provider": "google",
  "code": "authorization-code",
  "redirectUri": "https://yourapp.com/callback"
}
```

**Response**:

```json
{
  "data": {
    "user": {
      /* user object */
    },
    "token": "access-token",
    "refreshToken": "refresh-token",
    "isNewUser": false
  },
  "success": true
}
```

## API Keys

API keys are for server-to-server authentication.

### Create API Key

**Endpoint**: `POST /api/auth/api-keys`

**Headers**:

```
Authorization: Bearer <token>
```

**Request**:

```json
{
  "name": "Production Server",
  "scopes": ["read:messages", "write:messages", "read:channels"],
  "expiresAt": "2025-01-01T00:00:00Z" // optional
}
```

**Response**:

```json
{
  "data": {
    "id": "key-123",
    "name": "Production Server",
    "key": "nchat_sk_live_abc123...",
    "scopes": ["read:messages", "write:messages", "read:channels"],
    "createdAt": "2024-01-01T12:00:00Z",
    "expiresAt": "2025-01-01T00:00:00Z"
  },
  "success": true
}
```

**Important**: The API key is only shown once. Store it securely.

### Using API Keys

Include in requests via header:

```bash
curl https://api.nchat.example.com/api/channels \
  -H "X-API-Key: nchat_sk_live_abc123..."
```

### List API Keys

**Endpoint**: `GET /api/auth/api-keys`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "data": [
    {
      "id": "key-123",
      "name": "Production Server",
      "key": "nchat_sk_live_abc...***",
      "scopes": ["read:messages", "write:messages"],
      "createdAt": "2024-01-01T12:00:00Z",
      "lastUsedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true
}
```

### Revoke API Key

**Endpoint**: `DELETE /api/auth/api-keys/{keyId}`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

## Scopes and Permissions

Available scopes for API keys:

| Scope             | Description                |
| ----------------- | -------------------------- |
| `read:messages`   | Read messages              |
| `write:messages`  | Send and edit messages     |
| `delete:messages` | Delete messages            |
| `read:channels`   | List and view channels     |
| `write:channels`  | Create and edit channels   |
| `read:users`      | View user profiles         |
| `write:users`     | Update user profiles       |
| `admin:*`         | Full administrative access |

## Error Responses

### Invalid Credentials

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "success": false
}
```

### Email Already Exists

```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "An account with this email already exists"
  },
  "success": false
}
```

### Token Expired

```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired. Please refresh."
  },
  "success": false
}
```

### 2FA Required

```json
{
  "error": {
    "code": "2FA_REQUIRED",
    "message": "Two-factor authentication required"
  },
  "success": false
}
```

## Best Practices

1. **Store tokens securely** - Never expose tokens in client-side code
2. **Use HTTPS** - Always use secure connections
3. **Implement token refresh** - Refresh tokens before they expire
4. **Enable 2FA** - Require 2FA for admin accounts
5. **Rotate API keys** - Regularly rotate API keys
6. **Use appropriate scopes** - Request only necessary permissions
7. **Handle errors gracefully** - Implement proper error handling

## Next Steps

- [Users API](./users.md)
- [Channels API](./channels.md)
- [Messages API](./messages.md)
