# Mobile Call Optimizations - nself-chat v0.4.0

Complete guide for mobile-optimized voice and video calling with native integrations.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [iOS CallKit Integration](#ios-callkit-integration)
4. [Android Telecom Integration](#android-telecom-integration)
5. [Picture-in-Picture Mode](#picture-in-picture-mode)
6. [Background Call Support](#background-call-support)
7. [Push Notifications](#push-notifications)
8. [Battery Optimization](#battery-optimization)
9. [Network Optimization](#network-optimization)
10. [Touch-Optimized UI](#touch-optimized-ui)
11. [Usage Guide](#usage-guide)
12. [Troubleshooting](#troubleshooting)

---

## Overview

nself-chat v0.4.0 provides a complete native mobile calling experience with:

- **iOS CallKit** - Native iOS call integration with system call screen
- **Android Telecom** - Native Android call integration with system dialer
- **Picture-in-Picture** - Continue calls while using other apps
- **Background Calls** - Maintain calls when app is backgrounded
- **VoIP Push** - Wake app for incoming calls
- **Battery Optimization** - Automatic quality adjustment based on battery level
- **Network Optimization** - Adapt to WiFi vs cellular connectivity

---

## Architecture

### Component Structure

```
src/
├── components/
│   └── calls/
│       └── mobile/
│           ├── MobileCallScreen.tsx       # Full-screen call UI
│           ├── MobileCallControls.tsx     # Touch-friendly controls
│           ├── MobileVideoGrid.tsx        # Optimized video layout
│           ├── MobilePiPOverlay.tsx       # PiP floating window
│           └── MobileIncomingCall.tsx     # Incoming call screen
├── hooks/
│   ├── use-mobile-pip.ts                  # PiP functionality
│   ├── use-mobile-orientation.ts          # Orientation handling
│   ├── use-battery-status.ts             # Battery monitoring
│   └── use-voip-push.ts                  # VoIP push integration
└── lib/
    └── voip-push.ts                       # Push notification handler

platforms/capacitor/
├── ios/
│   └── Plugin/
│       └── CallKitPlugin.swift            # iOS CallKit implementation
├── android/
│   └── src/main/java/
│       └── CallKitPlugin.kt               # Android Telecom implementation
└── src/native/
    └── call-kit.ts                        # TypeScript wrapper
```

---

## iOS CallKit Integration

### Overview

CallKit provides native iOS call integration, including:
- System-level call screen
- Lock screen call UI
- Call history integration
- CarPlay support
- VoIP push notifications

### Setup

#### 1. Enable CallKit Capability

In Xcode, go to your project settings:
- Select your target
- Go to "Signing & Capabilities"
- Add "Voice over IP" background mode
- Add "Audio, AirPlay, and Picture in Picture" background mode

#### 2. Configure Info.plist

```xml
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>audio</string>
</array>

<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for voice calls</string>

<key>NSCameraUsageDescription</key>
<string>We need access to your camera for video calls</string>
```

#### 3. Initialize CallKit

```typescript
import { callKitManager } from '@/platforms/capacitor/src/native/call-kit'

// Initialize on app start
await callKitManager.initialize('nChat')
```

### Usage

#### Report Incoming Call

```typescript
// When receiving an incoming call notification
const callUuid = await callKitManager.reportIncomingCall({
  uuid: callId,
  handle: callerId,
  handleType: 'generic',
  hasVideo: true,
  callerDisplayName: 'John Doe',
  callerImageUrl: 'https://example.com/avatar.jpg',
})
```

#### Start Outgoing Call

```typescript
const callUuid = await callKitManager.startOutgoingCall({
  uuid: callId,
  handle: targetUserId,
  hasVideo: true,
  contactIdentifier: 'john.doe@example.com',
})
```

#### Update Call State

```typescript
// When call connects
await callKitManager.reportCallConnected(callUuid)

// When call ends
await callKitManager.endCall('completed', callUuid)

// Update mute state
await callKitManager.setMuted(true, callUuid)

// Update hold state
await callKitManager.setOnHold(false, callUuid)
```

### CallKit Events

Listen for CallKit events in your app:

```typescript
import { CallKit } from '@/platforms/capacitor/src/native/call-kit'

// Call answered
CallKit.addListener('callAnswered', (data) => {
  console.log('Call answered:', data.uuid)
  // Start WebRTC connection
})

// Call ended
CallKit.addListener('callEnded', (data) => {
  console.log('Call ended:', data.uuid)
  // Clean up WebRTC connection
})

// Mute changed
CallKit.addListener('callMuteChanged', (data) => {
  console.log('Mute changed:', data.muted)
  // Update local audio track
})
```

---

## Android Telecom Integration

### Overview

Android Telecom Framework provides:
- System-level call UI
- Integration with system dialer
- Call history
- Bluetooth and car integration

### Setup

#### 1. Add Permissions

In `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CALL_PHONE" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.MANAGE_OWN_CALLS" />
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
<uses-permission android:name="android.permission.USE_SIP" />

<!-- For Android 12+ -->
<uses-permission android:name="android.permission.READ_PRECISE_PHONE_STATE" />
```

#### 2. Register Connection Service

```xml
<service
    android:name="io.nself.chat.plugins.CallConnectionService"
    android:permission="android.permission.BIND_TELECOM_CONNECTION_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.telecom.ConnectionService" />
    </intent-filter>
</service>
```

#### 3. Initialize Telecom

```typescript
import { callKitManager } from '@/platforms/capacitor/src/native/call-kit'

// Request permissions first
const { granted } = await CallKit.requestPermissions()

if (granted) {
  await callKitManager.initialize('nChat')
}
```

### Usage

Usage is identical to iOS CallKit - the platform-specific implementation is handled automatically.

---

## Picture-in-Picture Mode

### Overview

Picture-in-Picture (PiP) allows users to continue video calls in a small floating window while using other apps.

### Implementation

#### Web PiP API (Android Chrome/Edge)

```typescript
import { useMobilePiP } from '@/hooks/use-mobile-pip'

function CallScreen() {
  const { isPiPSupported, enablePiP, disablePiP, isPiPActive } = useMobilePiP()

  const handleMinimize = async () => {
    if (isPiPSupported) {
      await enablePiP()
    }
  }

  return (
    <div>
      {isPiPSupported && (
        <button onClick={handleMinimize}>
          Minimize to PiP
        </button>
      )}
    </div>
  )
}
```

#### Native PiP (iOS/Android)

The native implementations use:
- **iOS**: `AVPictureInPictureController`
- **Android**: `enterPictureInPictureMode()`

```typescript
// Automatically handled by the hook
const { enablePiP } = useMobilePiP()

// Will use native API if available, fallback to Web API
await enablePiP()
```

### PiP Overlay Component

For platforms without native PiP support, use the floating overlay:

```typescript
import { MobilePiPOverlay } from '@/components/calls/mobile/MobilePiPOverlay'

<MobilePiPOverlay
  isActive={isPiPActive}
  onExpand={() => setFullscreen(true)}
  onEndCall={() => endCall()}
/>
```

### Features

- **Draggable** - Move PiP window anywhere on screen
- **Snap to Edges** - Automatically snaps to screen edges
- **Touch Controls** - Mute, video toggle, end call
- **Tap to Expand** - Double-tap to return to full screen

---

## Background Call Support

### Overview

Keep calls active when the app is in the background or screen is locked.

### iOS Background Modes

Configured in Info.plist:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>voip</string>
    <string>audio</string>
</array>
```

### Android Foreground Service

Automatically started during active calls:

```kotlin
// In CallConnectionService
private fun showCallNotification() {
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Ongoing Call")
        .setContentText("Call in progress")
        .setSmallIcon(R.drawable.ic_call)
        .setOngoing(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .build()

    startForeground(NOTIFICATION_ID, notification)
}
```

### WebRTC Background Handling

```typescript
// Keep WebRTC connection alive
import { App } from '@capacitor/app'

App.addListener('appStateChange', ({ isActive }) => {
  if (!isActive && activeCall) {
    // App backgrounded - maintain WebRTC
    console.log('App backgrounded, maintaining call')
  } else if (isActive && activeCall) {
    // App foregrounded - resume UI
    console.log('App foregrounded, resuming call UI')
  }
})
```

### Network Change Handling

```typescript
import { Network } from '@capacitor/network'

Network.addListener('networkStatusChange', async (status) => {
  if (!status.connected && activeCall) {
    // Network lost - attempt reconnection
    await attemptReconnection()
  } else if (status.connected && reconnecting) {
    // Network restored
    await resumeCall()
  }
})
```

---

## Push Notifications

### Overview

VoIP push notifications wake the app for incoming calls even when terminated.

### iOS VoIP Push (APNs)

#### 1. Configure Push Certificate

1. Go to Apple Developer Portal
2. Create VoIP Services Certificate
3. Download and import to Keychain
4. Export as .p12 file

#### 2. Send VoIP Push

```typescript
// Server-side (Node.js)
import apn from 'apn'

const provider = new apn.Provider({
  token: {
    key: 'path/to/AuthKey.p8',
    keyId: 'YOUR_KEY_ID',
    teamId: 'YOUR_TEAM_ID',
  },
  production: false,
})

const notification = new apn.Notification({
  topic: 'com.yourapp.voip',
  payload: {
    type: 'incoming_call',
    callId: 'call-123',
    callerId: 'user-456',
    callerName: 'John Doe',
    callType: 'video',
  },
  pushType: 'voip',
  priority: 10,
})

await provider.send(notification, deviceToken)
```

### Android High-Priority Push (FCM)

#### 1. Configure Firebase

```typescript
// Add google-services.json to android/app/
```

#### 2. Send High-Priority Push

```typescript
// Server-side (Node.js)
import admin from 'firebase-admin'

await admin.messaging().send({
  token: deviceToken,
  notification: {
    title: 'Incoming Call',
    body: 'John Doe is calling',
  },
  data: {
    type: 'incoming_call',
    callId: 'call-123',
    callerId: 'user-456',
    callerName: 'John Doe',
    callType: 'video',
  },
  android: {
    priority: 'high',
    ttl: 3600000,
    notification: {
      channelId: 'voip_calls',
      priority: 'high',
      sound: 'default',
    },
  },
})
```

### Client-Side Handling

```typescript
import { voipPushManager } from '@/lib/voip-push'

// Initialize on app start
await voipPushManager.initialize()

// Push notifications are automatically handled
// and integrated with CallKit/Telecom
```

---

## Battery Optimization

### Automatic Quality Adjustment

```typescript
import { useBatteryStatus } from '@/hooks/use-battery-status'

function CallScreen() {
  const {
    batteryLevel,
    isCharging,
    isLowBattery,
    suggestedVideoQuality,
  } = useBatteryStatus()

  useEffect(() => {
    // Adjust video quality based on battery
    if (suggestedVideoQuality === 'audio-only') {
      // Disable video
      toggleVideo(false)
    } else {
      // Adjust video constraints
      updateVideoConstraints(suggestedVideoQuality)
    }
  }, [suggestedVideoQuality])

  return (
    <>
      {isLowBattery && (
        <div className="warning">
          Low battery ({batteryLevel}%). Switch to audio-only?
        </div>
      )}
    </>
  )
}
```

### Quality Levels

| Battery Level | Video Quality | Frame Rate | Resolution |
|--------------|---------------|------------|------------|
| > 30% (or charging) | High | 30 fps | 720p |
| 20-30% | Medium | 24 fps | 480p |
| 10-20% | Low | 20 fps | 360p |
| < 10% | Audio Only | N/A | N/A |

### Battery-Saving Features

1. **Automatic Video Disable** - Below 10% battery
2. **Reduced Frame Rate** - Lower FPS on low battery
3. **Lower Resolution** - Reduce video quality
4. **Background Blur Disable** - Turn off effects
5. **Screen Brightness Warning** - Suggest reducing brightness

---

## Network Optimization

### Connection Type Detection

```typescript
import { Network } from '@capacitor/network'

const status = await Network.getStatus()

if (status.connectionType === 'wifi') {
  // Use high quality
  setVideoQuality('high')
} else {
  // Use lower quality on cellular
  setVideoQuality('medium')

  // Warn user about data usage
  showDataWarning()
}
```

### Adaptive Bitrate

```typescript
// Adjust based on network conditions
peerConnection.getSenders().forEach((sender) => {
  const parameters = sender.getParameters()

  if (isWiFi) {
    parameters.encodings[0].maxBitrate = 2500000 // 2.5 Mbps
  } else {
    parameters.encodings[0].maxBitrate = 1000000 // 1 Mbps
  }

  sender.setParameters(parameters)
})
```

### Data Usage Tracking

```typescript
let dataUsed = 0

peerConnection.getStats().then((stats) => {
  stats.forEach((report) => {
    if (report.type === 'outbound-rtp') {
      dataUsed += report.bytesSent
    }
  })

  // Convert to MB
  const dataMB = dataUsed / (1024 * 1024)
  console.log(`Data used: ${dataMB.toFixed(2)} MB`)
})
```

---

## Touch-Optimized UI

### Touch Target Sizes

All interactive elements meet minimum touch target size:
- **Minimum Size**: 44x44 pixels (Apple HIG)
- **Preferred Size**: 48x48 pixels (Material Design)
- **Spacing**: 8px minimum between targets

### Gestures

#### Swipe Down to Minimize

```typescript
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.y > 100) {
      onMinimize()
    }
  }}
>
  {/* Call content */}
</motion.div>
```

#### Long Press for Options

```typescript
const handleTouchStart = () => {
  longPressTimer = setTimeout(() => {
    showOptions()
    navigator.vibrate(50) // Haptic feedback
  }, 500)
}
```

#### Double Tap to Toggle

```typescript
<motion.div
  onDoubleTap={() => {
    toggleFullscreen()
  }}
>
  {/* Video */}
</motion.div>
```

### Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics'

// Light feedback for button taps
await Haptics.impact({ style: ImpactStyle.Light })

// Medium feedback for important actions
await Haptics.impact({ style: ImpactStyle.Medium })

// Heavy feedback for errors
await Haptics.impact({ style: ImpactStyle.Heavy })
```

---

## Usage Guide

### Basic Setup

```typescript
import { MobileCallScreen } from '@/components/calls/mobile/MobileCallScreen'
import { MobilePiPOverlay } from '@/components/calls/mobile/MobilePiPOverlay'
import { callKitManager } from '@/platforms/capacitor/src/native/call-kit'
import { voipPushManager } from '@/lib/voip-push'

function App() {
  useEffect(() => {
    // Initialize CallKit
    callKitManager.initialize('nChat')

    // Initialize VoIP Push
    voipPushManager.initialize()
  }, [])

  return (
    <>
      <MobileCallScreen
        isVisible={isCallActive}
        onMinimize={() => setMinimized(true)}
      />

      <MobilePiPOverlay
        isActive={isMinimized}
        onExpand={() => setMinimized(false)}
      />
    </>
  )
}
```

### Handling Incoming Calls

```typescript
// When VoIP push received
voipPushManager.addListener('incoming_call', async (payload) => {
  // Report to CallKit
  const callUuid = await callKitManager.reportIncomingCall({
    uuid: payload.callId,
    handle: payload.callerId,
    callerDisplayName: payload.callerName,
    hasVideo: payload.callType === 'video',
  })

  // Update app state
  updateIncomingCall(payload)
})
```

### Making Outgoing Calls

```typescript
async function initiateCall(targetUser, callType) {
  const callId = generateCallId()

  // Start call in CallKit
  await callKitManager.startOutgoingCall({
    uuid: callId,
    handle: targetUser.id,
    hasVideo: callType === 'video',
  })

  // Initiate WebRTC connection
  await startWebRTCCall(callId, targetUser, callType)
}
```

---

## Troubleshooting

### CallKit Not Working on iOS

**Issue**: CallKit UI not appearing

**Solutions**:
1. Check background modes are enabled in Xcode
2. Verify CallKit initialization
3. Check for correct entitlements
4. Ensure app has microphone permissions

```typescript
// Check permissions
const status = await Permissions.query({ name: 'microphone' })
if (status.state !== 'granted') {
  await Permissions.request({ name: 'microphone' })
}
```

### Android Telecom Permission Denied

**Issue**: Cannot make calls on Android

**Solutions**:
1. Request permissions at runtime
2. Add all required permissions to manifest
3. For Android 12+, add `READ_PHONE_NUMBERS`

```typescript
const { granted } = await CallKit.requestPermissions()
if (!granted) {
  // Show settings screen
  openAppSettings()
}
```

### PiP Not Working

**Issue**: Picture-in-Picture mode fails

**Solutions**:
1. Check browser/OS support
2. Verify video element exists
3. Check PiP permissions

```typescript
const { isPiPSupported } = useMobilePiP()
if (!isPiPSupported) {
  console.warn('PiP not supported')
  // Use fallback overlay
}
```

### Background Calls Disconnecting

**Issue**: Calls end when app is backgrounded

**Solutions**:
1. Verify background modes configured
2. Check WebRTC connection keepalive
3. Implement reconnection logic

```typescript
// Reconnection logic
peerConnection.addEventListener('connectionstatechange', () => {
  if (peerConnection.connectionState === 'disconnected') {
    attemptReconnection()
  }
})
```

### High Battery Drain

**Issue**: Calls drain battery quickly

**Solutions**:
1. Enable battery optimization
2. Reduce video quality
3. Use audio-only mode
4. Disable background blur

```typescript
const { isLowBattery } = useBatteryStatus()
if (isLowBattery) {
  // Switch to audio only
  toggleVideo(false)
  // Reduce frame rate
  setFrameRate(15)
}
```

---

## Platform-Specific Notes

### iOS

- **Minimum Version**: iOS 13.0+
- **CallKit**: Available on all devices
- **PiP**: Requires iPadOS 9+ or iOS 14+ (iPhone)
- **Background Audio**: Unlimited while call active
- **VoIP Push**: Uses APNs with VoIP certificate

### Android

- **Minimum Version**: Android 6.0+ (API 23)
- **Telecom Framework**: API 23+
- **PiP**: Android 8.0+ (API 26)
- **Background**: Requires foreground service
- **Push**: Uses FCM high-priority messages

### Web

- **PiP**: Chrome 71+, Edge 79+
- **Background**: Service Workers for push
- **Limited**: No native call integration
- **Fallback**: Use notification API

---

## Performance Metrics

### Target Performance

- **Call Setup Time**: < 2 seconds
- **Video Start Time**: < 1 second
- **Audio Latency**: < 150ms
- **Frame Rate**: 24-30 fps (battery dependent)
- **Resolution**: 480p-720p (network dependent)
- **Battery Life**: > 2 hours continuous video call
- **Data Usage**: ~500 MB/hour video, ~50 MB/hour audio

---

## Next Steps

1. Test on physical devices (iOS and Android)
2. Test VoIP push notifications
3. Test PiP mode across platforms
4. Optimize battery usage
5. Test network switching (WiFi to cellular)
6. Test long-duration calls (> 1 hour)
7. Load test with multiple participants

---

## Resources

- [Apple CallKit Documentation](https://developer.apple.com/documentation/callkit)
- [Android Telecom Framework](https://developer.android.com/guide/topics/connectivity/telecom)
- [WebRTC Native Code](https://webrtc.org/)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Push Notifications Guide](https://capacitorjs.com/docs/guides/push-notifications-firebase)

---

*Last Updated: January 30, 2026*
