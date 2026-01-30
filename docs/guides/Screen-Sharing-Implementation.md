# Screen Sharing Implementation Guide

**Version**: 0.4.0
**Status**: Complete
**Date**: January 30, 2026

---

## Overview

Comprehensive screen sharing system for nself-chat with annotation tools, cursor highlighting, quality controls, and recording support.

## Features Implemented

### 1. Core Screen Capture
- **Location**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-capture.ts`
- getDisplayMedia API wrapper
- Support for screen, window, and tab capture
- System audio capture (Chrome/Edge)
- Quality presets: Auto, 720p, 1080p, 4K
- Frame rate control: 15fps, 30fps, 60fps
- Dynamic quality adjustment
- Multiple simultaneous shares support

### 2. Annotation System
- **Location**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-annotator.ts`
- Drawing tools:
  - Pen (freehand drawing)
  - Arrow
  - Line
  - Rectangle (filled/outline)
  - Circle (filled/outline)
  - Text annotations
  - Eraser
- Color picker (10 default colors)
- Stroke width control (2-16px)
- Font size control (12-48px)
- Undo/Redo support
- Collaborative annotations (multi-user)
- Touch support for tablets

### 3. Cursor Highlighting
- **Location**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/cursor-highlighter.ts`
- Real-time cursor position tracking
- Animated highlight rings
- Click effects
- Multi-user cursor support
- User name labels
- Auto-fade old cursors
- Color-coded per user

### 4. Screen Recording
- **Location**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-recorder.ts`
- MediaRecorder API integration
- WebM and MP4 format support
- Quality presets (low, medium, high)
- Webcam overlay support
  - Sizes: small, medium, large
  - Positions: 4 corners
  - Rounded corners with border
- Audio mixing (screen + webcam)
- Pause/Resume functionality
- Download recordings
- File size tracking

### 5. React Hooks

#### use-screen-share.ts
- **Location**: `/Users/admin/Sites/nself-chat/src/hooks/use-screen-share.ts`
- Start/stop screen sharing
- Quality controls
- Frame rate adjustment
- System audio detection
- Integration with call store
- Backward compatible with legacy MediaManager

#### use-annotations.ts
- **Location**: `/Users/admin/Sites/nself-chat/src/hooks/use-annotations.ts`
- Tool selection
- Color management
- Stroke/font size control
- Undo/Redo
- Clear annotations
- Remote annotation support
- Enable/Disable toggle

#### use-screen-recording.ts
- **Location**: `/Users/admin/Sites/nself-chat/src/hooks/use-screen-recording.ts`
- Start/Stop/Pause/Resume
- Recording management
- Download recordings
- File size formatting
- Duration formatting
- MIME type detection

### 6. UI Components

#### ScreenShareControls.tsx
- **Location**: `/Users/admin/Sites/nself-chat/src/components/calls/ScreenShareControls.tsx`
- Start/Stop sharing
- Quality dropdown (Auto, 720p, 1080p, 4K)
- Frame rate selection (15, 30, 60 fps)
- System audio toggle
- Cursor visibility toggle
- Active share info badges
- Compact button variant

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  ScreenShareControls, ScreenShareOverlay, Settings      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                    React Hooks                           │
│  use-screen-share, use-annotations, use-screen-recording│
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Core Libraries                          │
│  ScreenCaptureManager    │  ScreenAnnotator             │
│  CursorHighlighter       │  ScreenRecorder              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                   Browser APIs                           │
│  getDisplayMedia  │  Canvas 2D  │  MediaRecorder       │
└─────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Basic Screen Share

```typescript
import { useScreenShare } from '@/hooks/use-screen-share'

function MyComponent() {
  const {
    isScreenSharing,
    screenStream,
    startScreenShare,
    stopScreenShare,
    supportsSystemAudio,
  } = useScreenShare({
    userId: 'user-123',
    userName: 'John Doe',
    useAdvancedCapture: true,
  })

  const handleStart = async () => {
    await startScreenShare({
      quality: '1080p',
      frameRate: 30,
      captureSystemAudio: true,
      captureCursor: true,
    })
  }

  return (
    <div>
      {isScreenSharing ? (
        <button onClick={stopScreenShare}>Stop Sharing</button>
      ) : (
        <button onClick={handleStart}>Share Screen</button>
      )}
      {screenStream && (
        <video
          ref={(video) => {
            if (video) video.srcObject = screenStream
          }}
          autoPlay
        />
      )}
    </div>
  )
}
```

### Annotations

```typescript
import { useAnnotations } from '@/hooks/use-annotations'
import { useRef, useEffect } from 'react'

function AnnotationOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
  } = useAnnotations({
    canvas: canvasRef.current,
    userId: 'user-123',
    userName: 'John Doe',
    onAnnotationAdded: (annotation) => {
      // Broadcast to other users
      broadcastAnnotation(annotation)
    },
  })

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="toolbar">
        <button onClick={() => setTool('pen')}>Pen</button>
        <button onClick={() => setTool('arrow')}>Arrow</button>
        <button onClick={() => setTool('rectangle')}>Rectangle</button>
        <button onClick={() => setTool('text')}>Text</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button onClick={clear}>Clear</button>
      </div>
    </div>
  )
}
```

### Screen Recording

```typescript
import { useScreenRecording } from '@/hooks/use-screen-recording'
import { useScreenShare } from '@/hooks/use-screen-share'

function RecordingControls() {
  const { screenStream } = useScreenShare()
  const {
    isRecording,
    isPaused,
    duration,
    size,
    recordings,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    downloadRecording,
    formatDuration,
    formatFileSize,
  } = useScreenRecording()

  const handleStart = async () => {
    if (screenStream) {
      await startRecording(screenStream, {
        format: 'webm',
        quality: 'high',
        includeWebcam: true,
        webcamSize: 'small',
        webcamPosition: 'bottom-right',
      })
    }
  }

  const handleStop = async () => {
    const recording = await stopRecording()
    if (recording) {
      console.log('Recording saved:', recording.url)
    }
  }

  return (
    <div>
      <div className="controls">
        {!isRecording ? (
          <button onClick={handleStart}>Start Recording</button>
        ) : (
          <>
            <button onClick={handleStop}>Stop</button>
            {isPaused ? (
              <button onClick={resumeRecording}>Resume</button>
            ) : (
              <button onClick={pauseRecording}>Pause</button>
            )}
          </>
        )}
      </div>

      {isRecording && (
        <div className="status">
          Duration: {formatDuration(duration)} | Size: {formatFileSize(size)}
        </div>
      )}

      <div className="recordings">
        <h3>Recordings</h3>
        {recordings.map((recording) => (
          <div key={recording.id}>
            <span>{formatDuration(recording.duration)}</span>
            <span>{formatFileSize(recording.size)}</span>
            <button onClick={() => downloadRecording(recording)}>Download</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### UI Components

```typescript
import { ScreenShareControls } from '@/components/calls/ScreenShareControls'
import { useScreenShare } from '@/hooks/use-screen-share'

function CallInterface() {
  const {
    isScreenSharing,
    supportsSystemAudio,
    activeShares,
    startScreenShare,
    stopScreenShare,
    updateQuality,
    updateFrameRate,
  } = useScreenShare()

  const currentShare = activeShares[0]

  return (
    <div>
      <ScreenShareControls
        isSharing={isScreenSharing}
        supportsSystemAudio={supportsSystemAudio}
        hasAudio={currentShare?.hasAudio}
        quality="1080p"
        frameRate={30}
        shareType={currentShare?.type}
        onStartShare={startScreenShare}
        onStopShare={stopScreenShare}
        onQualityChange={updateQuality}
        onFrameRateChange={updateFrameRate}
      />

      {isScreenSharing && currentShare && (
        <video
          ref={(video) => {
            if (video) video.srcObject = currentShare.stream
          }}
          autoPlay
          className="screen-share-video"
        />
      )}
    </div>
  )
}
```

---

## Browser Support

### Screen Capture (getDisplayMedia)
- ✅ Chrome 72+
- ✅ Edge 79+
- ✅ Firefox 66+
- ✅ Safari 13+
- ✅ Opera 60+

### System Audio Capture
- ✅ Chrome 74+ (Windows, macOS, Linux)
- ✅ Edge 79+ (Windows, macOS)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

### MediaRecorder
- ✅ Chrome 47+
- ✅ Edge 79+
- ✅ Firefox 25+
- ✅ Safari 14.1+
- ✅ Opera 36+

### Preferred Formats
- Chrome/Edge: VP9 (WebM)
- Firefox: VP8 (WebM)
- Safari: H.264 (MP4)

---

## Quality Settings

### Resolution & Bitrate

| Quality | Resolution | Frame Rate | Bitrate     | Use Case          |
|---------|-----------|------------|-------------|-------------------|
| Auto    | 1920x1080 | 30fps      | 2.5 Mbps    | Default           |
| 720p    | 1280x720  | 30fps      | 1.5 Mbps    | Low bandwidth     |
| 1080p   | 1920x1080 | 30fps      | 2.5 Mbps    | Standard quality  |
| 4K      | 3840x2160 | 60fps      | 8 Mbps      | High quality      |

### Adaptive Quality

The system can automatically adjust quality based on network conditions:

```typescript
import { getOptimalQuality } from '@/lib/webrtc/screen-capture'

// Get downlink speed from Network Information API
const downlink = navigator.connection?.downlink ?? 10 // Mbps

const quality = getOptimalQuality(downlink)
// Returns: '4k' (≥20 Mbps), '1080p' (≥10 Mbps), '720p' (≥5 Mbps), or 'auto'
```

---

## Integration with Call System

### Adding Screen Share to Video Call

```typescript
import { useVoiceCall } from '@/hooks/use-voice-call'
import { useScreenShare } from '@/hooks/use-screen-share'

function VideoCall() {
  const voiceCall = useVoiceCall({
    userId: 'user-123',
    userName: 'John Doe',
  })

  const screenShare = useScreenShare({
    userId: 'user-123',
    userName: 'John Doe',
  })

  const handleStartScreenShare = async () => {
    const stream = await screenShare.startScreenShare({
      quality: '1080p',
      captureSystemAudio: true,
    })

    if (stream && voiceCall.isInCall) {
      // Add screen share tracks to peer connection
      // (handled automatically if peerConnection prop is passed)
    }
  }

  return (
    <div>
      {/* Call controls */}
      {voiceCall.isInCall && (
        <ScreenShareControls
          isSharing={screenShare.isScreenSharing}
          supportsSystemAudio={screenShare.supportsSystemAudio}
          onStartShare={handleStartScreenShare}
          onStopShare={screenShare.stopScreenShare}
        />
      )}
    </div>
  )
}
```

---

## WebRTC Integration

### Sending Screen Share to Peer

```typescript
import { useScreenShare } from '@/hooks/use-screen-share'
import type { PeerConnectionManager } from '@/lib/webrtc/peer-connection'

function ScreenShareSender({ peerConnection }: { peerConnection: PeerConnectionManager }) {
  const { startScreenShare, stopScreenShare } = useScreenShare({
    peerConnection, // Pass peer connection for auto-integration
    onScreenShareStarted: (stream) => {
      // Tracks automatically added to peer connection
      console.log('Screen share started')
    },
  })

  return (
    <button onClick={() => startScreenShare()}>
      Share Screen
    </button>
  )
}
```

### Receiving Screen Share

```typescript
// Peer connection automatically fires onTrack event
peerConnection.on('track', (event) => {
  const stream = event.streams[0]
  const track = event.track

  if (track.kind === 'video') {
    // Check if this is a screen share track
    const settings = track.getSettings()
    if (settings.displaySurface) {
      // This is a screen share
      videoElement.srcObject = stream
    }
  }
})
```

---

## Performance Considerations

### Memory Usage

- Each screen share stream: ~5-20 MB/s (depending on quality)
- Canvas annotations: ~1-5 MB
- Recording buffer: Varies (managed by MediaRecorder)

### Optimization Tips

1. **Use appropriate quality**: Don't use 4K for simple presentations
2. **Limit frame rate**: 30fps is sufficient for most use cases
3. **Stop when not needed**: Always stop sharing when done
4. **Clean up resources**: Use cleanup methods to free memory
5. **Monitor network**: Use adaptive quality based on connection

### Resource Cleanup

```typescript
useEffect(() => {
  return () => {
    // Clean up on unmount
    stopScreenShare()
    stopRecording()
    clearAnnotations()
  }
}, [])
```

---

## Security Considerations

### Browser Permissions

- User must explicitly grant permission
- Permission is per-origin
- User can stop sharing anytime (browser UI)

### Privacy

- Browser shows indicator when screen is being shared
- User can select specific window/tab to share
- No access to other applications outside shared surface

### Best Practices

1. **Always notify users** when screen sharing starts
2. **Show clear indicators** when sharing is active
3. **Provide easy stop controls** in your UI
4. **Don't persist recordings** without user consent
5. **Encrypt recordings** if storing on server

---

## Troubleshooting

### Common Issues

#### 1. Permission Denied
```
Error: NotAllowedError: Permission denied
```
**Solution**: User must grant permission. Ensure HTTPS in production.

#### 2. No Audio Captured
```
System audio not working
```
**Solution**: Check browser support. Only Chrome/Edge support system audio.

#### 3. Poor Quality
```
Video is pixelated or laggy
```
**Solution**: Reduce quality or frame rate. Check network bandwidth.

#### 4. Recording Fails
```
Error: MediaRecorder not supported
```
**Solution**: Check browser support. Try different MIME type.

---

## Testing

### Manual Testing Checklist

- [ ] Start screen share (entire screen)
- [ ] Start screen share (window)
- [ ] Start screen share (tab)
- [ ] System audio capture (Chrome/Edge only)
- [ ] Quality change (720p → 1080p → 4K)
- [ ] Frame rate change (15fps → 30fps → 60fps)
- [ ] Annotation tools (pen, arrow, shapes, text)
- [ ] Undo/Redo annotations
- [ ] Clear all annotations
- [ ] Remote annotations (multi-user)
- [ ] Cursor highlighting
- [ ] Click effects
- [ ] Recording start/stop
- [ ] Recording pause/resume
- [ ] Webcam overlay
- [ ] Download recording
- [ ] Multiple simultaneous shares
- [ ] Stop sharing (browser UI)
- [ ] Stop sharing (app UI)

### Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

---

## Future Enhancements

### Planned Features

1. **Live Streaming**: Stream to RTMP servers
2. **Cloud Recording**: Upload recordings to S3/storage
3. **Blur Background**: Blur sensitive content in screen shares
4. **Picture-in-Picture**: Detachable screen share window
5. **Screen Share Layouts**: Grid, spotlight, sidebar views
6. **Collaborative Whiteboard**: Enhanced annotation tools
7. **Screen Share Analytics**: Track share duration, quality metrics
8. **Mobile Screen Share**: iOS/Android support (limited)

---

## API Reference

See individual file documentation for complete API reference:

- **ScreenCaptureManager**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-capture.ts`
- **ScreenAnnotator**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-annotator.ts`
- **CursorHighlighter**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/cursor-highlighter.ts`
- **ScreenRecorder**: `/Users/admin/Sites/nself-chat/src/lib/webrtc/screen-recorder.ts`

---

## License

Same as nself-chat project license.

---

## Support

For issues or questions:
- GitHub Issues: [nself-chat repository]
- Documentation: `/Users/admin/Sites/nself-chat/docs/`
- Examples: See usage examples above

---

**Last Updated**: January 30, 2026
**Contributors**: AI Sonnet 4.5
