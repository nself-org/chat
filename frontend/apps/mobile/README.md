# @nself-chat/mobile

Mobile app for nself-chat (iOS + Android) built with React + Capacitor.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7
- **Mobile Runtime**: Capacitor 6.2
- **Build Tool**: Vite 6.0
- **State Management**: Zustand 5.0 (from @nself-chat/state)
- **API Client**: Apollo Client 3.14 (from @nself-chat/api)
- **UI Components**: Radix UI (from @nself-chat/ui)
- **Testing**: Jest 29 + Testing Library

## Architecture

### Shared Package Integration

This mobile app consumes shared packages from the monorepo:

```typescript
import { logger } from '@nself-chat/core' // Domain logic
import { ApolloProvider } from '@nself-chat/api' // GraphQL client
import { useAuthStore } from '@nself-chat/state' // State management
import { Button } from '@nself-chat/ui' // UI components
```

### Platform Adapters

Mobile-specific functionality is abstracted through adapters:

```
src/adapters/
├── storage/      # AsyncStorage → LocalStorage interface
├── auth/         # Biometric authentication
├── notifications/# Push notifications
├── camera/       # Photo capture
└── network/      # Connectivity monitoring
```

Each adapter provides a clean interface that bridges native Capacitor APIs with the shared app logic.

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- iOS: Xcode 15+ (macOS only)
- Android: Android Studio + JDK 17+

### Install Dependencies

```bash
# From monorepo root
pnpm install

# From mobile app directory
cd frontend/apps/mobile
pnpm install
```

### Development Server

```bash
# Run web dev server (for testing in browser)
pnpm dev

# Build the web app
pnpm build
```

### iOS Development

```bash
# Sync web build to iOS
pnpm sync:ios

# Open in Xcode
pnpm ios

# Or manually
npx cap open ios
```

### Android Development

```bash
# Sync web build to Android
pnpm sync:android

# Open in Android Studio
pnpm android

# Or manually
npx cap open android
```

## Platform Adapters API

### Storage Adapter

```typescript
import { mobileStorage, typedStorage } from '@/adapters/storage'

// String storage
await mobileStorage.setItem('key', 'value')
const value = await mobileStorage.getItem('key')

// Typed storage
await typedStorage.setJSON('user', { id: 1, name: 'Alice' })
const user = await typedStorage.getJSON<User>('user')

await typedStorage.setBoolean('dark_mode', true)
const darkMode = await typedStorage.getBoolean('dark_mode')
```

### Auth Adapter

```typescript
import { mobileAuth } from '@/adapters/auth'

// Check biometric availability
const { available, type } = await mobileAuth.checkBiometric()
// available: boolean, type: 'faceId' | 'touchId' | 'fingerprint'

// Authenticate
const success = await mobileAuth.authenticateBiometric({
  reason: 'Unlock app',
  title: 'Authentication Required',
})

// Handle OAuth redirects
mobileAuth.registerDeepLinkHandler((url) => {
  console.log('OAuth callback:', url)
})
```

### Notifications Adapter

```typescript
import { mobileNotifications } from '@/adapters/notifications'

// Request permission
const permission = await mobileNotifications.requestPermission()

if (permission === 'granted') {
  // Register for push
  await mobileNotifications.register()

  // Listen for notifications
  mobileNotifications.addNotificationReceivedListener((notif) => {
    console.log('Received:', notif.title)
  })

  // Handle notification taps
  mobileNotifications.addNotificationActionListener((action) => {
    console.log('User tapped:', action.notification)
  })

  // Set badge count (iOS)
  await mobileNotifications.setBadgeCount(5)
}
```

### Camera Adapter

```typescript
import { mobileCamera } from '@/adapters/camera'

// Take a photo
const photo = await mobileCamera.takePicture({
  quality: 90,
  allowEditing: true,
})

// Select from gallery
const selected = await mobileCamera.selectFromGallery()

if (photo) {
  console.log('Photo path:', photo.webPath)

  // Convert to base64
  const base64 = await cameraHelpers.photoToBase64(photo)

  // Convert to File object
  const file = await cameraHelpers.photoToFile(photo, 'photo.jpg')
}
```

### Network Adapter

```typescript
import { mobileNetwork } from '@/adapters/network'

// Get current status
const status = await mobileNetwork.getStatus()
console.log('Connected:', status.connected)
console.log('Wi-Fi:', status.wifi)
console.log('Cellular:', status.cellular)

// Listen for changes
const cleanup = mobileNetwork.addStatusChangeListener((status) => {
  if (status.offline) {
    showOfflineBanner()
  }
})

// Helper functions
const isMetered = networkHelpers.isMeteredConnection(status.connectionType)
const canDownload = networkHelpers.isSuitableForLargeDownloads(status)
```

## Mobile Hooks

### useBiometric

```typescript
import { useBiometric } from '@/hooks/use-biometric'

function LoginScreen() {
  const { available, type, authenticate, loading, typeName } = useBiometric()

  if (!available) return <PasswordLogin />

  return (
    <button onClick={authenticate} disabled={loading}>
      Unlock with {typeName}
    </button>
  )
}
```

### useCamera

```typescript
import { useCamera } from '@/hooks/use-camera'

function ProfilePicture() {
  const { takePicture, photo, loading } = useCamera()

  return (
    <>
      <button onClick={takePicture} disabled={loading}>
        Take Photo
      </button>
      {photo && <img src={photo.webPath} />}
    </>
  )
}
```

### usePushNotifications

```typescript
import { usePushNotifications } from '@/hooks/use-push-notifications'

function App() {
  const {
    permission,
    token,
    register,
    onNotificationReceived,
    onNotificationAction,
  } = usePushNotifications()

  useEffect(() => {
    if (permission === 'granted') {
      register()
    }
  }, [permission])

  onNotificationReceived((notif) => {
    console.log('Received:', notif)
  })

  onNotificationAction((action) => {
    // Navigate to channel
    navigate(`/chat/${action.notification.data.channelId}`)
  })

  return <div>Push token: {token}</div>
}
```

### useNetworkStatus

```typescript
import { useNetworkStatus } from '@/hooks/use-network-status'

function App() {
  const {
    connected,
    wifi,
    cellular,
    offline,
    connectionQuality,
    shouldAutoDownloadMedia,
  } = useNetworkStatus()

  if (offline) return <OfflineBanner />
  if (cellular) return <DataSavingMode />

  return <NormalMode />
}
```

## Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Test Structure

```
src/__tests__/
├── adapters.test.ts      # Adapter unit tests
└── integration.test.tsx  # Integration tests
```

### Writing Tests

```typescript
import { describe, it, expect } from '@jest/globals'
import { mobileStorage } from '../adapters/storage'

describe('Storage Adapter', () => {
  it('should store and retrieve data', async () => {
    await mobileStorage.setItem('key', 'value')
    const value = await mobileStorage.getItem('key')
    expect(value).toBe('value')
  })
})
```

## Project Structure

```
frontend/apps/mobile/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── index.tsx               # Entry point
│   ├── index.css               # Global styles
│   ├── adapters/               # Platform adapters
│   │   ├── storage/            # Storage adapter
│   │   ├── auth/               # Auth adapter
│   │   ├── notifications/      # Notifications adapter
│   │   ├── camera/             # Camera adapter
│   │   ├── network/            # Network adapter
│   │   └── index.ts
│   ├── hooks/                  # Mobile-specific hooks
│   │   ├── use-biometric.ts
│   │   ├── use-camera.ts
│   │   ├── use-push-notifications.ts
│   │   ├── use-network-status.ts
│   │   └── index.ts
│   ├── types/                  # Type definitions
│   │   ├── mobile.ts
│   │   └── index.ts
│   └── __tests__/              # Tests
│       ├── adapters.test.ts
│       └── integration.test.tsx
├── android/                    # Native Android project
├── ios/                        # Native iOS project
├── capacitor.config.json       # Capacitor config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite config
├── jest.config.cjs             # Jest config
└── README.md                   # This file
```

## Configuration

### capacitor.config.json

```json
{
  "appId": "com.nself.chat",
  "appName": "nself-chat",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": { "launchShowDuration": 2000 },
    "PushNotifications": { "presentationOptions": ["badge", "sound", "alert"] },
    "StatusBar": { "style": "dark" }
  }
}
```

### Environment Variables

```bash
# API endpoints
VITE_API_URL=https://api.nself.chat
VITE_GRAPHQL_URL=https://api.nself.chat/graphql
VITE_WS_URL=wss://api.nself.chat/graphql

# Feature flags
VITE_ENABLE_BIOMETRIC=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
```

## Building for Production

### iOS

```bash
# Build web app
pnpm build

# Sync to iOS
pnpm sync:ios

# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select target device/simulator
# 2. Product > Archive
# 3. Upload to App Store Connect
```

### Android

```bash
# Build web app
pnpm build

# Sync to Android
pnpm sync:android

# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build > Generate Signed Bundle/APK
# 2. Select Android App Bundle
# 3. Upload to Google Play Console
```

## Troubleshooting

### iOS Build Issues

```bash
# Clean iOS build
cd ios/App
rm -rf build DerivedData
pod install

# Reset Capacitor
pnpm cap sync ios --force
```

### Android Build Issues

```bash
# Clean Android build
cd android
./gradlew clean

# Reset Capacitor
pnpm cap sync android --force
```

### TypeScript Errors

```bash
# Type check
pnpm type-check

# Rebuild packages
cd ../../packages/core && pnpm build
cd ../../packages/api && pnpm build
cd ../../packages/state && pnpm build
cd ../../packages/ui && pnpm build
```

## Contributing

See [Contributing Guide](../../../CONTRIBUTING.md) for development workflow.

## License

MIT © nself-chat

