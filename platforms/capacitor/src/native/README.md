# Native Capacitor Plugins

Native plugin implementations for iOS and Android mobile features.

## Available Plugins

### CallKit Plugin

**Purpose**: Native call integration for iOS (CallKit) and Android (Telecom Framework)

**Features**:

- System-level call UI
- Lock screen integration
- Call history integration
- VoIP push notifications
- Bluetooth/CarPlay support

**Files**:

- `call-kit.ts` - TypeScript wrapper and React hooks
- `call-kit-web.ts` - Web fallback implementation
- `../ios/Plugin/CallKitPlugin.swift` - iOS implementation
- `../ios/Plugin/CallKitPlugin.m` - Objective-C bridge
- `../android/.../CallKitPlugin.kt` - Android implementation

**Usage**:

```typescript
import { callKitManager } from './call-kit'

// Initialize
await callKitManager.initialize('nChat')

// Report incoming call
const uuid = await callKitManager.reportIncomingCall({
  uuid: 'call-123',
  handle: 'user@example.com',
  callerDisplayName: 'John Doe',
  hasVideo: true,
})

// Start outgoing call
await callKitManager.startOutgoingCall({
  uuid: 'call-456',
  handle: 'user@example.com',
  hasVideo: false,
})

// End call
await callKitManager.endCall('completed', uuid)
```

**React Hook**:

```typescript
import { useCallKit } from './call-kit'

function Component() {
  const { isSupported, isConfigured, initialize, reportIncomingCall, startOutgoingCall, endCall } =
    useCallKit()

  // Use the hook methods
}
```

### Other Plugins

This directory contains other native plugins:

- `biometrics.ts` - Biometric authentication
- `camera.ts` - Camera access
- `file-picker.ts` - File selection
- `haptics.ts` - Haptic feedback
- `push-notifications.ts` - Push notifications
- `share.ts` - Native share sheet
- `offline-sync.ts` - Background sync

---

## v0.9.0 Enhanced Features

### Widget Data Provider

**Purpose**: Data synchronization between the main app and widget extensions (iOS/Android)

**Files**:

- `widget-data.ts` - Widget data service and React hooks
- `widget-data-web.ts` - Web fallback implementation

**Usage**:

```typescript
import { widgetData, useWidgetData } from './widget-data'

// Update unread messages widget
await widgetData.updateUnreadMessagesWidget(channels, directMessages)

// Update recent chats widget
await widgetData.updateRecentChatsWidget(chats)

// React hook
const { data, isLoading, refresh } = useWidgetData('unread_messages')
```

### Watch Connectivity (iOS)

**Purpose**: Bidirectional communication between iOS app and Apple Watch

**Files**:

- `watch-connectivity.ts` - WatchConnectivity wrapper and hooks
- `watch-connectivity-web.ts` - Web fallback

**Usage**:

```typescript
import { watchConnectivity, useWatchConnectivity } from './watch-connectivity'

// Initialize
await watchConnectivity.initialize()

// Sync data to watch
await watchConnectivity.syncUnreadCounts(total, channels, dms)
await watchConnectivity.syncRecentConversations(conversations)

// Send message to watch
const reply = await watchConnectivity.sendMessage('new_message', payload)

// React hook
const { isAvailable, isReachable, sendMessage } = useWatchConnectivity()
```

### Android Widgets

**Purpose**: Native Android App Widget support

**Files**:

- `android-widgets.ts` - Android widget service and hooks
- `android-widgets-web.ts` - Web fallback

**Usage**:

```typescript
import { androidWidgets, useAndroidWidgets } from './android-widgets'

// Update unread counter widget
await androidWidgets.updateUnreadCounterWidget({
  totalUnread: 5,
  channelUnread: 3,
  dmUnread: 2,
  mentionCount: 1,
})

// Pin widget to home screen
await androidWidgets.pinWidget('unread_counter')

// React hook
const { isSupported, widgets, updateUnreadCounter } = useAndroidWidgets()
```

### Deep Linking

**Purpose**: Handle URL schemes, Universal Links (iOS), and App Links (Android)

**Files**:

- `deep-linking.ts` - Deep link handler and route matching

**Usage**:

```typescript
import { deepLinking, useDeepLink } from './deep-linking'

// Initialize
await deepLinking.initialize({
  urlScheme: 'nchat',
  universalLinkDomains: ['nchat.nself.org'],
})

// Register route handler
deepLinking.registerRouteHandler('channel', (params) => {
  navigateToChannel(params.params.channelId)
})

// Create deep link
const url = deepLinking.createDeepLink('channel', { channelId: '123' })

// React hook
const { deepLinkParams, createDeepLink } = useDeepLink((params) => {
  handleDeepLink(params)
})
```

### Enhanced Push Notifications

**Purpose**: Rich notifications with actions, channels, and silent push

**Files**:

- `push-notifications-v2.ts` - Enhanced push notification service

**Usage**:

```typescript
import { enhancedPushNotifications, usePushNotifications } from './push-notifications-v2'

// Initialize with channels
await enhancedPushNotifications.initialize({
  channels: DEFAULT_NOTIFICATION_CHANNELS,
  categories: DEFAULT_NOTIFICATION_CATEGORIES,
})

// Show rich notification
await enhancedPushNotifications.showLocalNotification({
  title: 'New Message',
  body: 'Hello!',
  imageUrl: 'https://...',
  actions: [
    { id: 'reply', title: 'Reply', input: true },
    { id: 'mark_read', title: 'Mark Read' },
  ],
})

// React hook
const { token, lastNotification, setBadgeCount } = usePushNotifications()
```

### Background Sync

**Purpose**: Background fetch and sync for offline-first functionality

**Files**:

- `background-sync.ts` - Background sync service
- `background-sync-web.ts` - Web fallback (Service Worker)

**Usage**:

```typescript
import { backgroundSync, useBackgroundSync } from './background-sync'

// Initialize
await backgroundSync.initialize({
  minimumInterval: 900, // 15 minutes
  requiresNetworkConnectivity: true,
})

// Add task to queue
const taskId = await backgroundSync.addTask(
  'send_message',
  {
    channelId: '123',
    content: 'Hello!',
  },
  { priority: 'high' }
)

// Register task handler
backgroundSync.registerTaskHandler('send_message', async (task) => {
  await api.sendMessage(task.data)
  return true
})

// React hook
const { status, queueSize, addTask, triggerSync } = useBackgroundSync()
```

### Enhanced Biometric Authentication

**Purpose**: Full biometric auth with secure storage

**Files**:

- `biometrics-v2.ts` - Enhanced biometric service
- `biometrics-v2-web.ts` - WebAuthn fallback

**Usage**:

```typescript
import { biometricAuth, useBiometricAuth } from './biometrics-v2'

// Initialize
await biometricAuth.initialize()

// Authenticate
const result = await biometricAuth.authenticate({
  reason: 'Sign in to nChat',
})

// Store credentials securely
await biometricAuth.storeCredentials(userId, token)

// Retrieve with biometric auth
const creds = await biometricAuth.getCredentials(userId)

// React hook
const { isAvailable, biometryTypeName, authenticate, enable } = useBiometricAuth()
```

---

## Platform Support

| Plugin             | iOS                 | Android        | Web             |
| ------------------ | ------------------- | -------------- | --------------- |
| CallKit            | ✅ Native           | ✅ Native      | ⚠️ Fallback     |
| Biometrics         | ✅ Face ID/Touch ID | ✅ Fingerprint | ✅ WebAuthn     |
| Camera             | ✅                  | ✅             | ✅              |
| File Picker        | ✅                  | ✅             | ✅              |
| Haptics            | ✅                  | ✅             | ⚠️ Limited      |
| Push               | ✅ APNs             | ✅ FCM         | ✅ Web Push     |
| Share              | ✅                  | ✅             | ⚠️ Limited      |
| Offline Sync       | ✅                  | ✅             | ✅              |
| Widget Data        | ✅ WidgetKit        | ✅ App Widgets | ⚠️ Storage only |
| Watch Connectivity | ✅ WatchOS          | ❌             | ❌              |
| Android Widgets    | ❌                  | ✅             | ❌              |
| Deep Linking       | ✅ Universal Links  | ✅ App Links   | ⚠️ Limited      |
| Background Sync    | ✅ BGTaskScheduler  | ✅ WorkManager | ⚠️ SW Sync      |

## Development

### Adding a New Plugin

1. **Create TypeScript interface**:

```typescript
// my-plugin.ts
import { registerPlugin } from '@capacitor/core'

export interface MyPlugin {
  myMethod(options: { param: string }): Promise<{ result: string }>
}

export const MyPlugin = registerPlugin<MyPlugin>('MyPlugin', {
  web: () => import('./my-plugin-web').then((m) => new m.MyPluginWeb()),
})
```

2. **Implement iOS version**:

```swift
// ../ios/Plugin/MyPlugin.swift
import Foundation
import Capacitor

@objc(MyPlugin)
public class MyPlugin: CAPPlugin {
  @objc func myMethod(_ call: CAPPluginCall) {
    let param = call.getString("param") ?? ""
    call.resolve(["result": "Success: \(param)"])
  }
}
```

3. **Create Objective-C bridge**:

```objc
// ../ios/Plugin/MyPlugin.m
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(MyPlugin, "MyPlugin",
  CAP_PLUGIN_METHOD(myMethod, CAPPluginReturnPromise);
)
```

4. **Implement Android version**:

```kotlin
// ../android/.../MyPlugin.kt
package io.nself.chat.plugins

import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "MyPlugin")
class MyPlugin : Plugin() {
  @PluginMethod
  fun myMethod(call: PluginCall) {
    val param = call.getString("param") ?: ""
    call.resolve(JSObject().apply {
      put("result", "Success: $param")
    })
  }
}
```

5. **Create web fallback**:

```typescript
// my-plugin-web.ts
import type { MyPlugin } from './my-plugin'

export class MyPluginWeb implements MyPlugin {
  async myMethod(options: { param: string }): Promise<{ result: string }> {
    console.log('MyPlugin.myMethod (web):', options)
    return { result: `Web: ${options.param}` }
  }
}
```

### Testing Plugins

**iOS**:

```bash
cd ../..
pnpm run build
cd platforms/capacitor
pnpm run sync:ios
pnpm run open:ios
# Run on physical device in Xcode
```

**Android**:

```bash
cd ../..
pnpm run build
cd platforms/capacitor
pnpm run sync:android
pnpm run open:android
# Run on device/emulator in Android Studio
```

**Web**:

```bash
cd ../..
pnpm run dev
# Test in browser
```

## Best Practices

### Error Handling

Always handle errors gracefully:

```typescript
try {
  await MyPlugin.myMethod({ param: 'test' })
} catch (error) {
  console.error('Plugin error:', error)
  // Show user-friendly error message
}
```

### Permission Checks

Request permissions before using features:

```typescript
// Check if supported
const { supported } = await MyPlugin.isSupported()
if (!supported) {
  // Use fallback
  return
}

// Request permissions
const { granted } = await MyPlugin.requestPermissions()
if (!granted) {
  // Show permission denied message
  return
}

// Use plugin
await MyPlugin.myMethod({ param: 'test' })
```

### Platform Detection

Check platform before using native features:

```typescript
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
  // Use native plugin
  await MyPlugin.myMethod({ param: 'test' })
} else {
  // Use web fallback
  webFallback()
}
```

### Event Listeners

Clean up event listeners:

```typescript
useEffect(() => {
  // Add listener
  const listener = await MyPlugin.addListener('myEvent', (data) => {
    console.log('Event:', data)
  })

  // Cleanup
  return () => {
    listener.remove()
  }
}, [])
```

## Troubleshooting

### iOS Build Issues

**Problem**: Plugin not found

**Solution**: Ensure plugin is registered in `AppDelegate.swift`:

```swift
import MyPlugin

// In didFinishLaunchingWithOptions
MyPlugin.register()
```

**Problem**: Permission denied

**Solution**: Add usage descriptions to `Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Required for voice calls</string>
```

### Android Build Issues

**Problem**: Plugin not registered

**Solution**: Register in `MainActivity.kt`:

```kotlin
import io.nself.chat.plugins.MyPlugin

class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    registerPlugin(MyPlugin::class.java)
  }
}
```

**Problem**: Permission denied

**Solution**: Add permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Web Issues

**Problem**: Plugin not working on web

**Solution**: Ensure web implementation is created and exported:

```typescript
// my-plugin-web.ts
export class MyPluginWeb implements MyPlugin {
  // Implementation
}
```

## Resources

- [Capacitor Plugin API](https://capacitorjs.com/docs/plugins)
- [iOS Plugin Development](https://capacitorjs.com/docs/plugins/ios)
- [Android Plugin Development](https://capacitorjs.com/docs/plugins/android)
- [Web Plugin Development](https://capacitorjs.com/docs/plugins/web)

## Support

For plugin-related issues:

1. Check plugin documentation above
2. Review example implementations in this directory
3. Check Capacitor documentation
4. Open GitHub issue with reproduction steps
