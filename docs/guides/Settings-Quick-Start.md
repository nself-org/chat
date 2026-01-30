# Settings Pages - Quick Start Guide

## For Developers

Quick reference for working with the settings pages backend integration.

## Import the Hooks

```typescript
// Profile settings
import { useProfileSettings } from '@/hooks/use-user-settings'

// Account settings
import { useAccountSettings } from '@/hooks/use-user-settings'

// Notification settings
import { useNotificationSettings } from '@/hooks/use-user-settings'

// Privacy settings
import { usePrivacySettings } from '@/hooks/use-user-settings'
```

## Profile Settings

```typescript
const { updateProfile, uploadAvatar, removeAvatar, updating, uploadingAvatar, removingAvatar } = useProfileSettings()

// Update profile
await updateProfile({
  displayName: 'John Doe',
  bio: 'Developer',
  timezone: 'America/New_York',
  language: 'en',
})

// Upload avatar (automatically compressed)
await uploadAvatar(file)

// Remove avatar
await removeAvatar()
```

## Account Settings

```typescript
const {
  updateEmail,
  updatePassword,
  connectOAuth,
  disconnectOAuth,
  enableTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  deleteAccount,
} = useAccountSettings()

// Change email (requires password)
await updateEmail('new@email.com', 'currentPassword')

// Change password
await updatePassword('currentPassword', 'newPassword')

// Connect OAuth provider
await connectOAuth('google') // 'google' | 'github' | 'apple'

// Disconnect OAuth
await disconnectOAuth(accountId)

// Enable 2FA
const { secret, qrCodeData, backupCodes } = await enableTwoFactor()
// Show QR code to user, then:
await confirmTwoFactor(code, secret, backupCodes)

// Disable 2FA
await disableTwoFactor()

// Delete account
await deleteAccount()
```

## Notification Settings

```typescript
const { updateSettings, updating } = useNotificationSettings()

await updateSettings({
  desktopEnabled: true,
  desktopSound: true,
  desktopPreview: true,
  emailEnabled: true,
  emailFrequency: 'daily',
  emailDigest: true,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '08:00',
  dndWeekends: true,
  directMessages: true,
  mentions: true,
  channelMessages: false,
  threadReplies: true,
  reactions: false,
})
```

## Privacy/Location Settings

```typescript
const { updateSettings, clearLocationHistory, updating, clearingLocation } = usePrivacySettings()

await updateSettings({
  locationVisibility: 'contacts', // 'everyone' | 'contacts' | 'nobody'
  useApproximateLocation: true,
  defaultSharingDuration: 3600, // seconds
  showNearbyPlaces: true,
  saveLocationHistory: false,
  locationHistoryRetentionDays: 30,
})

// Clear location history
await clearLocationHistory()
```

## Image Utilities

```typescript
import { validateImageFile, compressImage, createImagePreview } from '@/lib/image-utils'

// Validate image
const validation = validateImageFile(file)
if (!validation.valid) {
  console.error(validation.error)
}

// Compress image
const compressed = await compressImage(file, {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  outputFormat: 'jpeg',
})

// Create preview
const previewUrl = await createImagePreview(file)
```

## Error Handling

All hooks include automatic error handling with toast notifications. Just wrap in try-catch if you need custom handling:

```typescript
try {
  await updateProfile(data)
  // Custom success handling
} catch (error) {
  // Custom error handling
  // Toast already shown by hook
}
```

## Loading States

All hooks return loading states:

```typescript
const { updating, uploadingAvatar, removingAvatar } = useProfileSettings()

<Button disabled={updating || uploadingAvatar || removingAvatar}>
  {updating ? 'Saving...' : 'Save'}
</Button>
```

## GraphQL Mutations (Direct Use)

If you need to use mutations directly:

```typescript
import { useMutation } from '@apollo/client'
import { UPDATE_USER_PROFILE } from '@/graphql/mutations/user-settings'

const [updateProfile] = useMutation(UPDATE_USER_PROFILE)

await updateProfile({
  variables: {
    userId: user.id,
    displayName: 'John Doe',
    bio: 'Developer',
  },
})
```

## API Routes

Available authentication endpoints:

```typescript
// Verify password
POST /api/auth/verify-password
Body: { password: string }

// Change password
POST /api/auth/change-password
Body: { userId: string, currentPassword: string, newPassword: string }

// OAuth connect
GET /api/auth/oauth/connect?provider=google

// OAuth callback
GET /api/auth/oauth/callback?code=...&state=...

// 2FA setup
POST /api/auth/2fa/setup
Body: { userId: string }

// 2FA verify
POST /api/auth/2fa/verify
Body: { code: string, secret: string }
```

## Database Migration

Run the migration to add required columns:

```bash
cd .backend
nself db migrate
```

Or manually run:

```bash
psql -U postgres -d your_database -f migrations/011_user_settings_columns.sql
```

## Environment Variables

Required for production:

```bash
# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GITHUB_CLIENT_ID=your_github_client_id
APPLE_CLIENT_ID=your_apple_client_id

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Storage
NEXT_PUBLIC_STORAGE_URL=https://storage.yourdomain.com
STORAGE_BUCKET=nchat-uploads
```

## Testing in Development

1. Start the backend:
   ```bash
   cd .backend
   nself start
   ```

2. Start the frontend:
   ```bash
   pnpm dev
   ```

3. Navigate to settings pages:
   - http://localhost:3000/settings/profile
   - http://localhost:3000/settings/account
   - http://localhost:3000/settings/notifications
   - http://localhost:3000/settings/privacy/location

## Common Issues

### Avatar upload fails
- Ensure storage service is running
- Check `NEXT_PUBLIC_STORAGE_URL` is set
- Verify file is a valid image format

### Email change doesn't work
- Check password is correct
- Ensure email is unique
- Verify database has `email_verified` column

### 2FA setup fails
- Ensure database has 2FA columns
- Check API routes are accessible
- Verify TOTP code is 6 digits

### Location history won't clear
- Run database migration
- Check `nchat_user_locations` table exists
- Verify user has permissions

## TypeScript Types

```typescript
// From src/graphql/mutations/user-settings.ts

interface UpdateProfileInput {
  displayName?: string
  bio?: string
  timezone?: string
  language?: string
}

interface NotificationSettings {
  desktopEnabled: boolean
  desktopSound: boolean
  desktopPreview: boolean
  emailEnabled: boolean
  emailFrequency: 'instant' | 'daily' | 'weekly' | 'never'
  emailDigest: boolean
  dndEnabled: boolean
  dndStart: string
  dndEnd: string
  dndWeekends: boolean
  directMessages: boolean
  mentions: boolean
  channelMessages: boolean
  threadReplies: boolean
  reactions: boolean
}

interface LocationPrivacySettings {
  locationVisibility: 'everyone' | 'contacts' | 'nobody'
  useApproximateLocation: boolean
  defaultSharingDuration: number
  showNearbyPlaces: boolean
  saveLocationHistory: boolean
  locationHistoryRetentionDays: number
}
```

## Best Practices

1. **Always validate input** before calling mutations
2. **Use loading states** to prevent double submissions
3. **Show user feedback** via toasts or inline messages
4. **Handle errors gracefully** with user-friendly messages
5. **Clear sensitive data** after operations (passwords, tokens)
6. **Use TypeScript types** for type safety
7. **Test in dev mode** before deploying to production
8. **Run migrations** before testing new features
9. **Compress images** before uploading (done automatically)
10. **Verify permissions** for destructive operations

## Need Help?

- Full documentation: `docs/Settings-Implementation.md`
- Implementation summary: `docs/Settings-Implementation-Summary.md`
- Check existing code in `src/app/settings/` for examples
- Review hooks in `src/hooks/use-user-settings.ts`
- Check mutations in `src/graphql/mutations/user-settings.ts`
