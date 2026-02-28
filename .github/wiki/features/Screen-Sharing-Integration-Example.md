# Screen Sharing Integration Example

This guide shows how to integrate screen sharing into your call UI.

## Quick Start

### 1. Basic Screen Share Button

```typescript
'use client'

import { useScreenShare } from '@/hooks/use-screen-share'
import { Button } from '@/components/ui/button'
import { Monitor, MonitorOff } from 'lucide-react'

export function ScreenShareButton() {
  const {
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    isSupported,
  } = useScreenShare({
    userId: 'current-user',
    userName: 'John Doe',
  })

  if (!isSupported) {
    return null // Browser doesn't support screen sharing
  }

  return (
    <Button
      onClick={isScreenSharing ? stopScreenShare : () => startScreenShare({ quality: '1080p' })}
      variant={isScreenSharing ? 'destructive' : 'default'}
    >
      {isScreenSharing ? (
        <>
          <MonitorOff className="mr-2 h-4 w-4" />
          Stop Sharing
        </>
      ) : (
        <>
          <Monitor className="mr-2 h-4 w-4" />
          Share Screen
        </>
      )}
    </Button>
  )
}
```

### 2. Integrate into Call Modal

Update your call component to use the `ScreenSharePanel`:

```typescript
'use client'

import { CallModal } from '@/components/call/call-modal'
import { useCallStore } from '@/stores/call-store'
import { useAuth } from '@/contexts/auth-context'

export function ActiveCallView() {
  const { user } = useAuth()
  const activeCall = useCallStore((state) => state.activeCall)
  const toggleMute = useCallStore((state) => state.toggleLocalMute)
  const toggleVideo = useCallStore((state) => state.toggleLocalVideo)
  const endCall = useCallStore((state) => state.endCall)

  // Screen sharing state from call store
  const isScreenSharing = useCallStore((state) => state.activeCall?.isLocalScreenSharing ?? false)
  const setScreenSharing = useCallStore((state) => state.setLocalScreenSharing)

  if (!activeCall) return null

  return (
    <CallModal
      open={true}
      callType={activeCall.type}
      callState={activeCall.state}
      callDuration={0} // Calculate from timestamps
      participants={[]} // Map from activeCall.participants
      isMuted={activeCall.isLocalMuted}
      isVideoEnabled={activeCall.isLocalVideoEnabled}
      isScreenSharing={isScreenSharing}
      onToggleMute={toggleMute}
      onToggleVideo={() => {}}
      onToggleScreenShare={() => setScreenSharing(!isScreenSharing)}
      onEndCall={() => endCall()}
      currentUserId={user?.id}
      currentUserName={user?.displayName}
    />
  )
}
```

### 3. Full Example with Recording

```typescript
'use client'

import { useState } from 'react'
import { ScreenSharePanel } from '@/components/call/screen-share-panel'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export function ScreenShareDemo() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(true)}>
        Open Screen Share
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <div className="flex flex-col h-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Screen Share</h2>
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>

            <ScreenSharePanel
              userId={user?.id ?? 'guest'}
              userName={user?.displayName ?? 'Guest'}
              onStreamStarted={(stream) => {
                console.log('Screen share started:', stream)
              }}
              onStreamEnded={() => {
                console.log('Screen share ended')
              }}
              showAnnotations
              showRecording
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### 4. Custom Annotation Toolbar

```typescript
'use client'

import { useState } from 'react'
import { AnnotationToolbar } from '@/components/call/annotation-toolbar'
import type { AnnotationTool, AnnotationColor } from '@/lib/webrtc/screen-annotator'

export function CustomAnnotations() {
  const [tool, setTool] = useState<AnnotationTool>('pen')
  const [color, setColor] = useState<AnnotationColor>('#FF0000')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  return (
    <div className="fixed top-4 left-4">
      <AnnotationToolbar
        selectedTool={tool}
        selectedColor={color}
        strokeWidth={strokeWidth}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={() => {
          // Handle undo
          console.log('Undo')
        }}
        onRedo={() => {
          // Handle redo
          console.log('Redo')
        }}
        onClear={() => {
          // Handle clear
          console.log('Clear')
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        orientation="vertical"
      />
    </div>
  )
}
```

## Advanced Usage

### Quality Adaptation Based on Network

```typescript
import { getOptimalQuality } from '@/lib/webrtc/screen-capture'

const connection = navigator.connection
const downlink = connection?.downlink ?? 10

const quality = getOptimalQuality(downlink)
// Returns '720p', '1080p', or '4k' based on network speed

await startScreenShare({ quality })
```

### Recording with Webcam Overlay

```typescript
import { useScreenRecording } from '@/hooks/use-screen-recording'

const { startRecording, stopRecording, isRecording } = useScreenRecording({
  onStop: (recording) => {
    // Auto-download
    const link = document.createElement('a')
    link.href = recording.url
    link.download = `recording-${recording.id}.webm`
    link.click()
  },
})

// Start with webcam in bottom-right corner
await startRecording(screenStream, {
  format: 'webm',
  quality: 'high',
  includeWebcam: true,
  webcamSize: 'small',
  webcamPosition: 'bottom-right',
})
```

### Multi-User Annotations

```typescript
import { createScreenAnnotator } from '@/lib/webrtc/screen-annotator'

const annotator = createScreenAnnotator({
  canvas: canvasElement,
  userId: currentUser.id,
  userName: currentUser.name,
  onAnnotationAdded: (annotation) => {
    // Broadcast to other users via WebSocket
    websocket.send({
      type: 'annotation:add',
      data: annotation,
    })
  },
})

// Listen for remote annotations
websocket.on('annotation:add', (annotation) => {
  annotator.addRemoteAnnotation(annotation)
})
```

### Cursor Tracking

```typescript
import { createCursorTracker } from '@/lib/webrtc/cursor-highlighter'

const cleanup = createCursorTracker(
  videoElement,
  currentUser.id,
  currentUser.name,
  (position) => {
    // Broadcast cursor position
    websocket.send({
      type: 'cursor:move',
      data: position,
    })
  },
  (click) => {
    // Broadcast click
    websocket.send({
      type: 'cursor:click',
      data: click,
    })
  }
)

// Cleanup on unmount
return cleanup
```

## Troubleshooting

### Permission Errors

```typescript
try {
  await startScreenShare()
} catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Screen sharing permission denied')
  } else if (error.name === 'NotFoundError') {
    alert('No screen selected')
  } else {
    console.error('Screen share error:', error)
  }
}
```

### Browser Not Supported

```typescript
import { ScreenCaptureManager } from '@/lib/webrtc/screen-capture'

if (!ScreenCaptureManager.isSupported()) {
  return (
    <div className="alert">
      Screen sharing is not supported in this browser.
      Please use Chrome, Edge, or Firefox.
    </div>
  )
}
```

## Testing Checklist

- [ ] Screen share starts successfully
- [ ] Quality selection works
- [ ] Annotations appear correctly
- [ ] Recording starts and stops
- [ ] Webcam overlay displays
- [ ] Cursor tracking works
- [ ] Stop button works
- [ ] Browser stop button works
- [ ] Permissions handled correctly
- [ ] Error states displayed properly

## Next Steps

1. Test in all supported browsers
2. Add analytics tracking
3. Implement cloud storage for recordings
4. Add AI-powered features (transcription, summaries)
5. Enable real-time collaboration features

---

For complete documentation, see [Screen-Sharing-Complete.md](./Screen-Sharing-Complete.md)
