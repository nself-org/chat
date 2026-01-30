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
  const {
    isSupported,
    isConfigured,
    initialize,
    reportIncomingCall,
    startOutgoingCall,
    endCall,
  } = useCallKit()

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

## Platform Support

| Plugin | iOS | Android | Web |
|--------|-----|---------|-----|
| CallKit | ✅ Native | ✅ Native | ⚠️ Fallback |
| Biometrics | ✅ Face ID/Touch ID | ✅ Fingerprint | ❌ |
| Camera | ✅ | ✅ | ✅ |
| File Picker | ✅ | ✅ | ✅ |
| Haptics | ✅ | ✅ | ⚠️ Limited |
| Push | ✅ APNs | ✅ FCM | ✅ Web Push |
| Share | ✅ | ✅ | ⚠️ Limited |
| Offline Sync | ✅ | ✅ | ✅ |

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
