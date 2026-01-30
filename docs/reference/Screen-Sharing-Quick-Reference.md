# Screen Sharing Quick Reference

**Version**: 0.4.0 | **Date**: January 30, 2026

---

## Quick Start

### 1. Basic Screen Share (3 lines)

```typescript
import { useScreenShare } from '@/hooks/use-screen-share'

const { isScreenSharing, startScreenShare, stopScreenShare } = useScreenShare()
await startScreenShare({ quality: '1080p' })
```

### 2. With Annotations (5 lines)

```typescript
import { useAnnotations } from '@/hooks/use-annotations'

const annotations = useAnnotations({ canvas, userId, userName })
annotations.setTool('pen')
annotations.setColor('#FF0000')
```

### 3. With Recording (4 lines)

```typescript
import { useScreenRecording } from '@/hooks/use-screen-recording'

const recording = useScreenRecording()
await recording.startRecording(screenStream, { quality: 'high' })
const saved = await recording.stopRecording()
```

---

## File Structure

```
src/
├── lib/webrtc/
│   ├── screen-capture.ts       # Core capture manager
│   ├── screen-annotator.ts     # Annotation tools
│   ├── cursor-highlighter.ts   # Cursor tracking
│   └── screen-recorder.ts      # Recording system
├── hooks/
│   ├── use-screen-share.ts     # Screen share hook
│   ├── use-annotations.ts      # Annotations hook
│   └── use-screen-recording.ts # Recording hook
└── components/calls/
    └── ScreenShareControls.tsx # UI controls
```

---

## Core APIs

### ScreenCaptureManager

```typescript
import { createScreenCaptureManager } from '@/lib/webrtc/screen-capture'

const manager = createScreenCaptureManager({
  onStreamStarted: (stream) => {},
  onStreamEnded: (streamId) => {},
  onError: (error) => {},
})

// Start capture
const share = await manager.startCapture(userId, userName, {
  quality: '1080p',
  frameRate: 30,
  captureSystemAudio: true,
})

// Update quality
await manager.updateQuality(share.id, '4k')

// Stop capture
manager.stopCapture(share.id)
```

### ScreenAnnotator

```typescript
import { createScreenAnnotator } from '@/lib/webrtc/screen-annotator'

const annotator = createScreenAnnotator({
  canvas,
  userId,
  userName,
  onAnnotationAdded: (annotation) => {},
})

// Set tool
annotator.setTool('pen')
annotator.setColor('#FF0000')
annotator.setStrokeWidth(4)

// Actions
annotator.undo()
annotator.redo()
annotator.clear()
```

### ScreenRecorder

```typescript
import { createScreenRecorder } from '@/lib/webrtc/screen-recorder'

const recorder = createScreenRecorder({
  onStart: () => {},
  onStop: (recording) => {},
})

// Start recording
await recorder.startRecording(stream, {
  format: 'webm',
  quality: 'high',
  includeWebcam: true,
})

// Stop and save
const recording = await recorder.stopRecording()
downloadRecording(recording)
```

---

## React Hooks

### useScreenShare

```typescript
const {
  isScreenSharing,
  screenStream,
  activeShares,
  supportsSystemAudio,
  startScreenShare,
  stopScreenShare,
  updateQuality,
  updateFrameRate,
} = useScreenShare({
  userId: 'user-123',
  userName: 'John Doe',
  useAdvancedCapture: true,
})
```

### useAnnotations

```typescript
const {
  currentTool,
  currentColor,
  setTool,
  setColor,
  undo,
  redo,
  clear,
  canUndo,
  canRedo,
  availableColors,
} = useAnnotations({
  canvas,
  userId,
  userName,
  enabled: true,
})
```

### useScreenRecording

```typescript
const {
  isRecording,
  isPaused,
  duration,
  recordings,
  startRecording,
  stopRecording,
  pauseRecording,
  downloadRecording,
  formatDuration,
  formatFileSize,
} = useScreenRecording()
```

---

## UI Components

### ScreenShareControls

```typescript
import { ScreenShareControls } from '@/components/calls/ScreenShareControls'

<ScreenShareControls
  isSharing={isSharing}
  supportsSystemAudio={true}
  quality="1080p"
  frameRate={30}
  onStartShare={(options) => startScreenShare(options)}
  onStopShare={stopScreenShare}
  onQualityChange={(q) => updateQuality(q)}
/>
```

### ScreenShareButton (Compact)

```typescript
import { ScreenShareButton } from '@/components/calls/ScreenShareControls'

<ScreenShareButton
  isSharing={isSharing}
  onStartShare={startScreenShare}
  onStopShare={stopScreenShare}
/>
```

---

## Common Patterns

### Pattern 1: Screen Share in Call

```typescript
function VideoCall() {
  const call = useVoiceCall({ userId, userName })
  const share = useScreenShare({ userId, userName })

  return (
    <div>
      {call.isInCall && (
        <ScreenShareButton
          isSharing={share.isScreenSharing}
          onStartShare={() => share.startScreenShare()}
          onStopShare={() => share.stopScreenShare()}
        />
      )}
    </div>
  )
}
```

### Pattern 2: Annotation Toolbar

```typescript
function AnnotationToolbar() {
  const { setTool, setColor, undo, redo, clear, canUndo, canRedo } = useAnnotations({
    canvas,
    userId,
    userName,
  })

  return (
    <div className="toolbar">
      <button onClick={() => setTool('pen')}>✏️ Pen</button>
      <button onClick={() => setTool('arrow')}>➡️ Arrow</button>
      <button onClick={() => setTool('rectangle')}>⬜ Rectangle</button>
      <input type="color" onChange={(e) => setColor(e.target.value)} />
      <button onClick={undo} disabled={!canUndo}>↶ Undo</button>
      <button onClick={redo} disabled={!canRedo}>↷ Redo</button>
      <button onClick={clear}>🗑️ Clear</button>
    </div>
  )
}
```

### Pattern 3: Recording UI

```typescript
function RecordingControls() {
  const {
    isRecording,
    isPaused,
    duration,
    size,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
    formatFileSize,
  } = useScreenRecording()

  return (
    <div>
      {!isRecording ? (
        <button onClick={() => startRecording(screenStream)}>⏺️ Record</button>
      ) : (
        <>
          <button onClick={stopRecording}>⏹️ Stop</button>
          <button onClick={isPaused ? resumeRecording : pauseRecording}>
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <span>{formatDuration(duration)} | {formatFileSize(size)}</span>
        </>
      )}
    </div>
  )
}
```

---

## Configuration Options

### Screen Capture Options

```typescript
interface ScreenCaptureOptions {
  type?: 'screen' | 'window' | 'tab'
  quality?: 'auto' | '720p' | '1080p' | '4k'
  frameRate?: number // 15, 30, 60
  captureSystemAudio?: boolean
  captureCursor?: boolean
  preferCurrentTab?: boolean
  allowSurfaceSwitching?: boolean
}
```

### Recording Options

```typescript
interface RecordingOptions {
  format?: 'webm' | 'mp4'
  quality?: 'low' | 'medium' | 'high'
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  includeWebcam?: boolean
  webcamSize?: 'small' | 'medium' | 'large'
  webcamPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}
```

---

## Annotation Tools

| Tool | Description | Properties |
|------|-------------|------------|
| pen | Freehand drawing | color, strokeWidth |
| arrow | Draw arrows | color, strokeWidth |
| line | Straight lines | color, strokeWidth |
| rectangle | Rectangles | color, strokeWidth, filled |
| circle | Circles | color, strokeWidth, filled |
| text | Text labels | color, fontSize, fontFamily |
| eraser | Remove annotations | strokeWidth (eraser size) |

---

## Quality Settings

| Quality | Resolution | Frame Rate | Bitrate | Network |
|---------|-----------|------------|---------|---------|
| Auto | 1920x1080 | 30fps | 2.5 Mbps | 5+ Mbps |
| 720p | 1280x720 | 30fps | 1.5 Mbps | 3+ Mbps |
| 1080p | 1920x1080 | 30fps | 2.5 Mbps | 5+ Mbps |
| 4K | 3840x2160 | 60fps | 8 Mbps | 20+ Mbps |

---

## Browser Support

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Screen Share | ✅ 72+ | ✅ 79+ | ✅ 66+ | ✅ 13+ |
| System Audio | ✅ 74+ | ✅ 79+ | ❌ | ❌ |
| Recording | ✅ 47+ | ✅ 79+ | ✅ 25+ | ✅ 14.1+ |
| Canvas | ✅ | ✅ | ✅ | ✅ |

---

## Keyboard Shortcuts (Suggested)

```typescript
// In your component
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          undo()
          break
        case 'y':
          redo()
          break
        case 'd':
          setTool('pen')
          break
        case 'a':
          setTool('arrow')
          break
        case 'r':
          setTool('rectangle')
          break
        case 'e':
          setTool('eraser')
          break
      }
    }
  }

  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+D | Pen tool |
| Ctrl+A | Arrow tool |
| Ctrl+R | Rectangle tool |
| Ctrl+E | Eraser tool |

---

## Utility Functions

```typescript
// Check system audio support
import { supportsSystemAudio } from '@/lib/webrtc/screen-capture'
const hasAudio = supportsSystemAudio() // true on Chrome/Edge

// Get optimal quality
import { getOptimalQuality } from '@/lib/webrtc/screen-capture'
const quality = getOptimalQuality(10) // Based on 10 Mbps downlink

// Format sizes
import { formatFileSize, formatDuration } from '@/lib/webrtc/screen-recorder'
formatFileSize(1024000) // "1.00 MB"
formatDuration(125) // "2:05"

// Download recording
import { downloadRecording } from '@/lib/webrtc/screen-recorder'
downloadRecording(recording, 'my-presentation.webm')
```

---

## Error Handling

```typescript
try {
  await startScreenShare()
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // User denied permission
    alert('Please grant screen sharing permission')
  } else if (error.name === 'NotSupportedError') {
    // Browser doesn't support
    alert('Your browser does not support screen sharing')
  } else {
    // Other error
    console.error('Screen share error:', error)
  }
}
```

---

## Performance Tips

1. **Use appropriate quality**: Start with 'auto' or '1080p'
2. **Limit frame rate**: 30fps is sufficient for most presentations
3. **Stop when done**: Always call `stopScreenShare()`
4. **Clean up**: Use cleanup methods in useEffect
5. **Monitor bandwidth**: Adjust quality based on network conditions

---

## Security Notes

- ⚠️ **HTTPS required** in production
- ⚠️ **User permission** required for each share
- ⚠️ **Browser indicator** shows when sharing
- ⚠️ **Encrypt recordings** if storing on server
- ⚠️ **Notify users** when recording starts

---

## Links

- **Full Documentation**: `/Users/admin/Sites/nself-chat/docs/Screen-Sharing-Implementation.md`
- **Source Files**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/`
- **Examples**: See implementation guide

---

**Quick Tip**: For most use cases, use the React hooks with default settings. The core libraries are for advanced customization only.
