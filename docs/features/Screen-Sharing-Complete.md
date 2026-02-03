# Screen Sharing Implementation - Complete Guide

**Version:** v0.4.0
**Status:** ✅ Integrated and Ready
**Last Updated:** January 30, 2026

---

## Overview

The screen sharing implementation provides a comprehensive solution for sharing screens, windows, or tabs during calls, with advanced features including:

- **Multi-source capture** - Screen, window, or tab sharing
- **System audio capture** - Share audio from applications (Chrome/Edge)
- **Quality controls** - Adaptive quality from 720p to 4K
- **Annotation tools** - Draw, highlight, and annotate shared content
- **Cursor tracking** - Multi-user cursor highlighting with click effects
- **Screen recording** - Record screen shares with webcam overlay
- **Real-time collaboration** - Synchronized annotations across participants

---

## Architecture

### Core Components

```
src/lib/webrtc/
├── screen-capture.ts        # Screen capture manager (getDisplayMedia API)
├── screen-annotator.ts      # Drawing and annotation tools
├── cursor-highlighter.ts    # Cursor tracking and highlighting
└── screen-recorder.ts       # Screen recording with webcam overlay

src/hooks/
├── use-screen-share.ts      # Screen sharing hook
└── use-screen-recording.ts  # Recording management hook

src/components/call/
├── screen-share-panel.tsx   # Main screen sharing UI
├── annotation-toolbar.tsx   # Drawing tools toolbar
├── call-modal.tsx           # Integrated call interface
└── call-controls.tsx        # Call control buttons
```

---

## Features

### 1. Screen Capture

**Implementation:** `src/lib/webrtc/screen-capture.ts`

#### Supported Capture Types

- **Screen** - Full screen capture
- **Window** - Specific application window
- **Tab** - Browser tab only

#### Quality Presets

| Quality | Resolution | Frame Rate | Bitrate  |
| ------- | ---------- | ---------- | -------- |
| 720p    | 1280x720   | 30 fps     | 1.5 Mbps |
| 1080p   | 1920x1080  | 30 fps     | 2.5 Mbps |
| 4K      | 3840x2160  | 60 fps     | 8 Mbps   |
| Auto    | Adaptive   | 30 fps     | 2.5 Mbps |

#### Features

- ✅ System audio capture (Chrome/Edge only)
- ✅ Cursor capture (always/motion/never)
- ✅ Dynamic quality adjustment
- ✅ Frame rate control (1-60 fps)
- ✅ Surface switching detection
- ✅ Automatic cleanup on track end

#### Usage Example

```typescript
import { createScreenCaptureManager } from '@/lib/webrtc/screen-capture'

const captureManager = createScreenCaptureManager({
  onStreamStarted: (stream) => {
    console.log('Screen share started:', stream)
  },
  onStreamEnded: (streamId) => {
    console.log('Screen share ended:', streamId)
  },
  onError: (error) => {
    console.error('Screen capture error:', error)
  },
})

// Start capturing
const share = await captureManager.startCapture(userId, userName, {
  quality: '1080p',
  captureSystemAudio: true,
  captureCursor: true,
  frameRate: 30,
})

// Update quality dynamically
await captureManager.updateQuality(share.id, '4k')

// Stop capturing
captureManager.stopCapture(share.id)
```

---

### 2. Annotation Tools

**Implementation:** `src/lib/webrtc/screen-annotator.ts`

#### Available Tools

| Tool      | Description         | Keyboard Shortcut |
| --------- | ------------------- | ----------------- |
| Pen       | Freehand drawing    | P                 |
| Arrow     | Draw arrows         | A                 |
| Line      | Draw straight lines | L                 |
| Rectangle | Draw rectangles     | R                 |
| Circle    | Draw circles        | C                 |
| Text      | Add text labels     | T                 |
| Eraser    | Remove annotations  | E                 |

#### Annotation Properties

- **Color** - 10 preset colors + custom
- **Stroke Width** - 2px to 16px
- **Font Size** - 12px to 48px (text tool)
- **Fill Mode** - Solid or outline shapes

#### Features

- ✅ Touch and mouse support
- ✅ Undo/redo functionality
- ✅ Clear all annotations
- ✅ Multi-user collaboration
- ✅ Annotation persistence
- ✅ Export annotations

#### Usage Example

```typescript
import { createScreenAnnotator } from '@/lib/webrtc/screen-annotator'

const annotator = createScreenAnnotator({
  canvas: canvasElement,
  userId: 'user-123',
  userName: 'John Doe',
  onAnnotationAdded: (annotation) => {
    // Broadcast annotation to other users
    broadcastAnnotation(annotation)
  },
})

// Change tool
annotator.setTool('arrow')

// Change color
annotator.setColor('#FF0000')

// Change stroke width
annotator.setStrokeWidth(4)

// Undo/redo
annotator.undo()
annotator.redo()

// Clear all
annotator.clear()

// Add remote annotation
annotator.addRemoteAnnotation(remoteAnnotation)
```

---

### 3. Cursor Highlighting

**Implementation:** `src/lib/webrtc/cursor-highlighter.ts`

#### Features

- ✅ Multi-user cursor tracking
- ✅ Unique color per user
- ✅ Animated cursor highlights
- ✅ Click effect animations
- ✅ User name labels
- ✅ Auto-fade for inactive cursors

#### Configuration

```typescript
import { createCursorHighlighter } from '@/lib/webrtc/cursor-highlighter'

const highlighter = createCursorHighlighter({
  canvas: canvasElement,
  highlightColor: '#FF4500',
  highlightSize: 30,
  showClickEffect: true,
  clickEffectDuration: 500,
  showUserName: true,
  fadeOldCursors: true,
  fadeTimeout: 3000,
})

// Update cursor position
highlighter.updateCursor({
  x: 100,
  y: 200,
  userId: 'user-123',
  userName: 'John Doe',
  timestamp: Date.now(),
})

// Add click effect
highlighter.addClick({
  x: 100,
  y: 200,
  userId: 'user-123',
  timestamp: Date.now(),
})
```

---

### 4. Screen Recording

**Implementation:** `src/lib/webrtc/screen-recorder.ts`

#### Features

- ✅ WebM and MP4 formats
- ✅ Webcam overlay (small/medium/large)
- ✅ Configurable position (4 corners)
- ✅ Pause/resume recording
- ✅ Quality presets (low/medium/high)
- ✅ Audio mixing (screen + webcam)
- ✅ Duration tracking
- ✅ File size monitoring

#### Quality Presets

| Quality | Video Bitrate | Audio Bitrate |
| ------- | ------------- | ------------- |
| Low     | 1 Mbps        | 64 kbps       |
| Medium  | 2.5 Mbps      | 128 kbps      |
| High    | 8 Mbps        | 192 kbps      |

#### Usage Example

```typescript
import { createScreenRecorder } from '@/lib/webrtc/screen-recorder'

const recorder = createScreenRecorder({
  onStart: () => console.log('Recording started'),
  onStop: (recording) => {
    console.log('Recording stopped:', recording)
    // Download recording
    downloadRecording(recording)
  },
  onDataAvailable: (data, size) => {
    console.log('Data chunk:', size, 'bytes')
  },
})

// Start recording with webcam overlay
await recorder.startRecording(screenStream, {
  format: 'webm',
  quality: 'high',
  includeWebcam: true,
  webcamSize: 'small',
  webcamPosition: 'bottom-right',
})

// Pause/resume
recorder.pauseRecording()
recorder.resumeRecording()

// Stop and save
const recording = await recorder.stopRecording()
```

---

## React Hooks

### useScreenShare

Manages screen sharing lifecycle.

```typescript
import { useScreenShare } from '@/hooks/use-screen-share'

function MyComponent() {
  const {
    isScreenSharing,
    screenStream,
    error,
    startScreenShare,
    stopScreenShare,
    updateQuality,
    isSupported,
    supportsSystemAudio,
  } = useScreenShare({
    userId: 'user-123',
    userName: 'John Doe',
    useAdvancedCapture: true,
  })

  return (
    <div>
      {isSupported && (
        <button onClick={() => startScreenShare({ quality: '1080p' })}>
          Share Screen
        </button>
      )}
      {isScreenSharing && (
        <button onClick={stopScreenShare}>Stop Sharing</button>
      )}
    </div>
  )
}
```

### useScreenRecording

Manages screen recording.

```typescript
import { useScreenRecording } from '@/hooks/use-screen-recording'

function MyComponent() {
  const {
    isRecording,
    isPaused,
    duration,
    recordings,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
    isSupported,
  } = useScreenRecording()

  return (
    <div>
      {isSupported && screenStream && (
        <>
          <button onClick={() => startRecording(screenStream)}>
            Start Recording
          </button>
          {isRecording && (
            <>
              <span>{formatDuration(duration)}</span>
              <button onClick={pauseRecording}>Pause</button>
              <button onClick={stopRecording}>Stop</button>
            </>
          )}
        </>
      )}
    </div>
  )
}
```

---

## UI Components

### ScreenSharePanel

Main screen sharing interface with integrated controls.

```typescript
import { ScreenSharePanel } from '@/components/call/screen-share-panel'

<ScreenSharePanel
  userId="user-123"
  userName="John Doe"
  onStreamStarted={(stream) => console.log('Stream started')}
  onStreamEnded={() => console.log('Stream ended')}
  showAnnotations
  showRecording
/>
```

### AnnotationToolbar

Standalone annotation toolbar.

```typescript
import { AnnotationToolbar } from '@/components/call/annotation-toolbar'

<AnnotationToolbar
  selectedTool={tool}
  selectedColor={color}
  strokeWidth={width}
  onToolChange={setTool}
  onColorChange={setColor}
  onStrokeWidthChange={setWidth}
  onUndo={handleUndo}
  onRedo={handleRedo}
  onClear={handleClear}
  canUndo={canUndo}
  canRedo={canRedo}
  orientation="vertical"
/>
```

---

## Browser Compatibility

### getDisplayMedia API Support

| Browser     | Screen | Window | Tab | System Audio | Status              |
| ----------- | ------ | ------ | --- | ------------ | ------------------- |
| Chrome 72+  | ✅     | ✅     | ✅  | ✅           | Full Support        |
| Edge 79+    | ✅     | ✅     | ✅  | ✅           | Full Support        |
| Firefox 66+ | ✅     | ✅     | ✅  | ❌           | No System Audio     |
| Safari 13+  | ✅     | ✅     | ⚠️  | ❌           | Limited Tab Support |
| Opera 60+   | ✅     | ✅     | ✅  | ✅           | Full Support        |

### MediaRecorder API Support

| Browser      | WebM | MP4 | Quality Control | Status          |
| ------------ | ---- | --- | --------------- | --------------- |
| Chrome 47+   | ✅   | ❌  | ✅              | Full Support    |
| Edge 79+     | ✅   | ❌  | ✅              | Full Support    |
| Firefox 29+  | ✅   | ❌  | ✅              | Full Support    |
| Safari 14.1+ | ⚠️   | ✅  | ⚠️              | Limited Support |
| Opera 36+    | ✅   | ❌  | ✅              | Full Support    |

---

## Permissions

### Browser Permissions Required

1. **Screen Sharing**
   - Permission: `display-capture`
   - Prompt: "Share your screen"
   - User action required: Yes

2. **System Audio**
   - Permission: `display-capture` (with audio)
   - Prompt: "Share system audio"
   - Chrome/Edge only

3. **Webcam (for recording overlay)**
   - Permission: `camera`, `microphone`
   - Prompt: "Use camera and microphone"
   - User action required: Yes

### Permission Handling

```typescript
// Check if screen sharing is supported
if (ScreenCaptureManager.isSupported()) {
  // Check if system audio is supported
  if (supportsSystemAudio()) {
    // Request screen share with system audio
    await startScreenShare({
      captureSystemAudio: true,
    })
  }
}

// Handle permission errors
try {
  await startScreenShare()
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied permission
  } else if (error.name === 'NotFoundError') {
    // No screen/window selected
  }
}
```

---

## Performance Optimization

### Quality Adaptation

```typescript
// Automatic quality based on network conditions
import { getOptimalQuality } from '@/lib/webrtc/screen-capture'

// Get network info (if available)
const connection = navigator.connection
const downlink = connection?.downlink ?? 10 // Mbps

// Get optimal quality
const quality = getOptimalQuality(downlink)

// Apply quality
await startScreenShare({ quality })
```

### Frame Rate Throttling

```typescript
// Lower frame rate for better performance
await startScreenShare({
  quality: '1080p',
  frameRate: 15, // Lower FPS = less CPU usage
})

// Dynamic adjustment
await updateFrameRate(shareId, 30)
```

### Resource Management

```typescript
// Stop all shares on component unmount
useEffect(() => {
  return () => {
    captureManager.cleanup()
    recorder.destroy()
    annotator.cleanup()
    highlighter.cleanup()
  }
}, [])
```

---

## Testing

### Manual Testing Checklist

- [ ] Start screen share (screen/window/tab)
- [ ] System audio capture (Chrome/Edge)
- [ ] Quality adjustment (720p/1080p/4K)
- [ ] Frame rate adjustment
- [ ] Annotation tools (all 7 tools)
- [ ] Color and stroke width selection
- [ ] Undo/redo annotations
- [ ] Clear all annotations
- [ ] Cursor tracking and clicks
- [ ] Multi-user cursors
- [ ] Start/stop recording
- [ ] Pause/resume recording
- [ ] Webcam overlay (all positions)
- [ ] Recording download
- [ ] Stop share (via button)
- [ ] Stop share (via browser UI)
- [ ] Permission denied handling
- [ ] No screen selected handling

### Browser Testing

Test in all supported browsers:

- Chrome 72+
- Edge 79+
- Firefox 66+
- Safari 13+
- Opera 60+

---

## Troubleshooting

### Common Issues

#### 1. Screen share not starting

```typescript
// Check browser support
if (!ScreenCaptureManager.isSupported()) {
  console.error('Screen sharing not supported')
  return
}

// Check permissions
try {
  await startScreenShare()
} catch (error) {
  console.error('Permission denied:', error)
}
```

#### 2. System audio not capturing

```typescript
// Check browser support
if (!supportsSystemAudio()) {
  console.warn('System audio not supported in this browser')
  // Fallback: microphone only
}
```

#### 3. Recording fails to start

```typescript
// Check MediaRecorder support
if (!ScreenRecorder.isSupported()) {
  console.error('Recording not supported')
  return
}

// Check supported MIME types
const mimeTypes = ScreenRecorder.getSupportedMimeTypes()
console.log('Supported formats:', mimeTypes)
```

#### 4. Annotations not syncing

```typescript
// Ensure annotations are broadcast to all users
annotator.onAnnotationAdded = (annotation) => {
  // Send via WebSocket/SignalR
  signaling.broadcastAnnotation(annotation)
}

// Receive remote annotations
signaling.onAnnotationReceived = (annotation) => {
  annotator.addRemoteAnnotation(annotation)
}
```

---

## Security Considerations

### Best Practices

1. **Validate permissions** - Always check if user has granted permissions
2. **Secure transmission** - Use HTTPS/WSS for screen share streams
3. **User consent** - Require explicit user action for screen share
4. **Privacy indicators** - Show recording indicator when active
5. **Auto-stop** - Stop sharing when call ends

### Privacy Features

```typescript
// Show recording indicator
if (isRecording) {
  return (
    <div className="recording-indicator">
      <span className="pulse" />
      Recording
    </div>
  )
}

// Auto-stop on call end
useEffect(() => {
  if (!activeCall && isScreenSharing) {
    stopScreenShare()
  }
}, [activeCall])
```

---

## Future Enhancements

### Planned Features

- [ ] Collaborative whiteboard mode
- [ ] Laser pointer tool
- [ ] Spotlight effect (highlight area)
- [ ] Recording pause/resume with markers
- [ ] Auto-save recordings to cloud
- [ ] Real-time transcription
- [ ] AI-powered annotation suggestions
- [ ] Multi-screen simultaneous capture
- [ ] Advanced recording editor
- [ ] GIF export from recordings

---

## API Reference

### ScreenCaptureManager

```typescript
class ScreenCaptureManager {
  static isSupported(): boolean
  startCapture(userId, userName, options): Promise<ScreenShare>
  stopCapture(shareId): void
  stopAllCaptures(): void
  updateQuality(shareId, quality): Promise<void>
  updateFrameRate(shareId, frameRate): Promise<void>
  getVideoSettings(shareId): MediaTrackSettings | null
  isActive(shareId): boolean
  getActiveCount(): number
  cleanup(): void
}
```

### ScreenAnnotator

```typescript
class ScreenAnnotator {
  setTool(tool: AnnotationTool): void
  setColor(color: AnnotationColor): void
  setStrokeWidth(width: number): void
  setFontSize(size: number): void
  setFilled(filled: boolean): void
  undo(): void
  redo(): void
  clear(): void
  addRemoteAnnotation(annotation: Annotation): void
  getAnnotations(): Annotation[]
  cleanup(): void
}
```

### CursorHighlighter

```typescript
class CursorHighlighter {
  updateCursor(position: CursorPosition): void
  addClick(click: CursorClick): void
  removeCursor(userId: string): void
  clearAllCursors(): void
  setHighlightColor(color: string): void
  setHighlightSize(size: number): void
  setShowUserName(show: boolean): void
  setShowClickEffect(show: boolean): void
  cleanup(): void
}
```

### ScreenRecorder

```typescript
class ScreenRecorder {
  static isSupported(): boolean
  static getSupportedMimeTypes(): string[]
  static getOptimalMimeType(format): string
  startRecording(stream, options): Promise<void>
  stopRecording(): Promise<Recording>
  pauseRecording(): void
  resumeRecording(): void
  getState(): RecordingState
  destroy(): void
}
```

---

## Credits

Built with:

- **getDisplayMedia API** - Screen capture
- **MediaRecorder API** - Recording
- **Canvas API** - Annotations and cursor tracking
- **Web Audio API** - Audio mixing

---

## Support

For issues and questions:

- GitHub Issues: https://github.com/yourusername/nself-chat/issues
- Documentation: https://docs.nself.org/features/screen-sharing
- Email: support@nself.org

---

**End of Documentation**
