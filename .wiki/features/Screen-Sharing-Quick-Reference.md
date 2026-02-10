# Screen Sharing Quick Reference

## 🚀 Quick Start

```typescript
import { useScreenShare } from '@/hooks/use-screen-share'

const { isScreenSharing, startScreenShare, stopScreenShare } = useScreenShare({
  userId: 'user-id',
  userName: 'User Name',
})

// Start
await startScreenShare({ quality: '1080p' })

// Stop
stopScreenShare()
```

## 📦 Components

| Component           | Purpose              | Path                                   |
| ------------------- | -------------------- | -------------------------------------- |
| `ScreenSharePanel`  | Full screen share UI | `@/components/call/screen-share-panel` |
| `AnnotationToolbar` | Drawing tools        | `@/components/call/annotation-toolbar` |
| `CallModal`         | Integrated call UI   | `@/components/call/call-modal`         |

## 🎣 Hooks

| Hook                 | Purpose                  |
| -------------------- | ------------------------ |
| `useScreenShare`     | Screen sharing lifecycle |
| `useScreenRecording` | Recording management     |

## 🛠️ Core Classes

| Class                  | Purpose                   |
| ---------------------- | ------------------------- |
| `ScreenCaptureManager` | Capture screen/window/tab |
| `ScreenAnnotator`      | Draw annotations          |
| `CursorHighlighter`    | Track cursors             |
| `ScreenRecorder`       | Record screen shares      |

## 🎨 Annotation Tools

- **Pen** - Freehand drawing
- **Arrow** - Point to areas
- **Line** - Straight lines
- **Rectangle** - Draw boxes
- **Circle** - Draw circles
- **Text** - Add labels
- **Eraser** - Remove annotations

## 📊 Quality Presets

| Quality | Resolution | FPS | Bitrate  |
| ------- | ---------- | --- | -------- |
| 720p    | 1280x720   | 30  | 1.5 Mbps |
| 1080p   | 1920x1080  | 30  | 2.5 Mbps |
| 4K      | 3840x2160  | 60  | 8 Mbps   |

## 🎬 Recording Options

```typescript
await startRecording(stream, {
  format: 'webm', // or 'mp4'
  quality: 'high', // 'low', 'medium', 'high'
  includeWebcam: true, // Add webcam overlay
  webcamSize: 'small', // 'small', 'medium', 'large'
  webcamPosition: 'bottom-right', // 4 corners
})
```

## 🌐 Browser Support

| Browser     | Support    | System Audio |
| ----------- | ---------- | ------------ |
| Chrome 72+  | ✅ Full    | ✅ Yes       |
| Edge 79+    | ✅ Full    | ✅ Yes       |
| Firefox 66+ | ✅ Full    | ❌ No        |
| Safari 13+  | ⚠️ Partial | ❌ No        |

## ⚡ Performance Tips

```typescript
// Adaptive quality based on network
const quality = getOptimalQuality(networkSpeed)

// Lower frame rate for better performance
await startScreenShare({ frameRate: 15 })

// Update quality dynamically
await updateQuality(shareId, '720p')
```

## 🔒 Security

```typescript
// Always check permissions
if (!ScreenCaptureManager.isSupported()) {
  // Show error
}

// Handle permission denial
try {
  await startScreenShare()
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied
  }
}
```

## 🐛 Common Errors

| Error               | Cause                   | Solution                  |
| ------------------- | ----------------------- | ------------------------- |
| `NotAllowedError`   | Permission denied       | Request permission again  |
| `NotFoundError`     | No screen selected      | User must select a screen |
| `NotSupportedError` | Browser doesn't support | Use Chrome/Edge/Firefox   |

## 📋 Event Handlers

```typescript
const captureManager = createScreenCaptureManager({
  onStreamStarted: (stream) => {
    // Stream started
  },
  onStreamEnded: (streamId) => {
    // Stream ended
  },
  onError: (error) => {
    // Handle error
  },
  onTrackEnded: (kind) => {
    // Track ended (video/audio)
  },
})
```

## 🎯 Usage Patterns

### Start with System Audio

```typescript
await startScreenShare({
  quality: '1080p',
  captureSystemAudio: true,
  captureCursor: true,
})
```

### Record with Webcam

```typescript
await startRecording(screenStream, {
  includeWebcam: true,
  webcamPosition: 'bottom-right',
})
```

### Add Annotations

```typescript
annotator.setTool('pen')
annotator.setColor('#FF0000')
annotator.setStrokeWidth(4)
```

### Track Cursors

```typescript
highlighter.updateCursor({
  x: 100,
  y: 200,
  userId: 'user-id',
  userName: 'User Name',
  timestamp: Date.now(),
})
```

## 📞 Integration with Calls

```typescript
<CallModal
  isScreenSharing={isScreenSharing}
  onToggleScreenShare={() => {
    if (isScreenSharing) {
      stopScreenShare()
    } else {
      startScreenShare()
    }
  }}
  currentUserId={user.id}
  currentUserName={user.name}
  {...otherProps}
/>
```

## 🧪 Testing

```bash
# Check TypeScript
npx tsc --noEmit

# Run tests
pnpm test src/lib/webrtc

# Manual test
pnpm dev
# Navigate to /call-test
```

## 📚 Resources

- [Complete Documentation](./Screen-Sharing-Complete.md)
- [Integration Examples](./Screen-Sharing-Integration-Example.md)
- [API Reference](./Screen-Sharing-Complete.md#api-reference)

## 🆘 Support

- Issues: https://github.com/yourusername/nself-chat/issues
- Docs: https://docs.nself.org
- Email: support@nself.org
