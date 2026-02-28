# WebRTC UI Components Documentation

Complete guide to voice/video call and live streaming components in ɳChat v0.9.1.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Supporting Components](#supporting-components)
4. [Hooks](#hooks)
5. [LiveKit Integration](#livekit-integration)
6. [Usage Examples](#usage-examples)
7. [Configuration](#configuration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

ɳChat v0.9.1 includes production-ready WebRTC components built with **LiveKit** for:

- **Voice/Video Calls**: 1-on-1 and group calls (up to 100 participants)
- **Screen Sharing**: Share your screen with call participants
- **Live Streaming**: HLS/DASH streaming with chat and reactions

### Technology Stack

- **LiveKit**: WebRTC infrastructure (https://livekit.io)
- **LiveKit Client SDK**: `livekit-client` for browser WebRTC
- **LiveKit Server SDK**: `livekit-server-sdk` for token generation
- **LiveKit React Components**: `@livekit/components-react` for React integration
- **HLS.js**: For live streaming playback

---

## Core Components

### 1. CallWindow

Full-screen call window with video grid layout.

**Location**: `src/components/voice-video/CallWindow.tsx`

**Features**:

- Dynamic grid sizing (1, 2, 4, 9, 16, 25 layouts)
- Local video preview (self-view)
- Remote participant videos
- Call controls integration
- Participant list sidebar
- Call duration timer
- Connection quality indicator
- Picture-in-picture support
- Fullscreen toggle
- Settings menu

**Props**:

```typescript
interface CallWindowProps {
  callId: string
  callType: 'voice' | 'video'
  duration: number
  localUser: { id: string; name: string; avatarUrl?: string }
  participants: CallParticipant[]
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor'
  isReconnecting?: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
  onOpenSettings?: () => void
  onSwitchCamera?: () => void
}
```

**Usage**:

```tsx
import { CallWindow } from '@/components/voice-video/CallWindow'
;<CallWindow
  callId={call.id}
  callType="video"
  duration={300}
  localUser={{ id: userId, name: userName }}
  participants={participants}
  localStream={localStream}
  remoteStreams={remoteStreams}
  isMuted={false}
  isVideoEnabled={true}
  isScreenSharing={false}
  onToggleMute={handleMute}
  onToggleVideo={handleVideo}
  onToggleScreenShare={handleScreenShare}
  onEndCall={handleEndCall}
/>
```

---

### 2. StreamPlayer

HLS video player for live streaming.

**Location**: `src/components/voice-video/StreamPlayer.tsx`

**Features**:

- HLS video playback
- Stream controls (play/pause, volume, seek)
- Viewer count display (real-time)
- Chat panel integration
- Stream reactions (hearts, likes, emojis)
- Quality selector (auto, 1080p, 720p, 480p, 360p)
- Fullscreen mode
- Picture-in-picture
- Share button
- Follow/subscribe button

**Props**:

```typescript
interface StreamPlayerProps {
  metadata: StreamMetadata
  streamUrl?: string
  messages?: StreamMessage[]
  reactions?: StreamReaction[]
  onSendMessage?: (message: string) => void
  onReaction?: (type: 'heart' | 'thumbsup' | 'smile' | 'fire' | 'clap') => void
  onFollow?: () => void
  onShare?: () => void
  className?: string
}
```

**Usage**:

```tsx
import { StreamPlayer } from '@/components/voice-video/StreamPlayer'
;<StreamPlayer
  metadata={{
    streamId: 'stream-123',
    title: 'Live Coding Session',
    streamer: { id: 'user-1', name: 'John Doe' },
    viewerCount: 42,
    isLive: true,
    startedAt: new Date(),
  }}
  streamUrl="https://stream-url.com/playlist.m3u8"
  messages={messages}
  reactions={reactions}
  onSendMessage={handleSendMessage}
  onReaction={handleReaction}
  onFollow={handleFollow}
  onShare={handleShare}
/>
```

---

### 3. CallControls

Reusable control bar for voice/video calls.

**Location**: `src/components/voice-video/CallControls.tsx`

**Features**:

- Mute/unmute button with visual feedback
- Video on/off button
- Screen share button
- Recording button
- Participant count badge
- Settings button
- End call button (prominent red)
- More options menu
- Tooltips for all buttons
- **Keyboard shortcuts**: M (mute), V (video), Shift+S (screen share), C (chat), P (participants)

**Props**:

```typescript
interface CallControlsProps {
  isMuted: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  callType: 'voice' | 'video'
  participantCount: number
  isRecording?: boolean
  showParticipants?: boolean
  showChat?: boolean
  isFullscreen?: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
  onToggleRecording?: () => void
  onToggleParticipants?: () => void
  onToggleChat?: () => void
  onOpenSettings?: () => void
  onSwitchCamera?: () => void
  onToggleFullscreen?: () => void
  onRaiseHand?: () => void
  className?: string
}
```

---

### 4. ParticipantGrid

Dynamic grid layout for call participants.

**Location**: `src/components/voice-video/ParticipantGrid.tsx`

**Features**:

- Dynamic grid sizing based on participant count
- Participant video tiles
- Audio level indicators (speaking animation)
- Name labels
- Pin/unpin participants
- Spotlight mode (focus on one participant)
- Screen share layout (share + thumbnails)
- Empty states (no participants)
- Loading states (connecting)
- Muted/video-off indicators

**Layouts**:

- 1 participant: 1x1
- 2 participants: 2x1
- 3-4 participants: 2x2
- 5-6 participants: 3x2
- 7-9 participants: 3x3
- 10-16 participants: 4x4
- 17+ participants: Paginated view

---

## Supporting Components

### 5. VideoTile

Individual participant video tile.

**Location**: `src/components/voice-video/VideoTile.tsx`

**Features**:

- Video stream display
- Audio level indicator (speaking animation)
- Name label
- Muted/video-off indicators
- Pin/unpin button
- Connection quality indicator
- Fallback avatar when video is off
- Hover actions menu
- Host controls (mute participant, remove from call)

---

### 6. ScreenShareView

Optimized layout for screen sharing.

**Location**: `src/components/voice-video/ScreenShareView.tsx`

**Features**:

- Large screen share area
- Small participant thumbnails (sidebar or bottom)
- Auto-adjust layout based on screen aspect ratio
- Screen share controls overlay
- Quality indicator
- Presenter name badge
- Stop sharing button (for presenter)
- Fullscreen support

---

### 7. CallNotification

Incoming call notification modal.

**Location**: `src/components/voice-video/CallNotification.tsx`

**Features**:

- Caller information display
- Accept with video/audio options
- Decline button
- Ringtone support (customizable)
- Auto-dismiss after timeout (default: 30 seconds)
- Call type indicator (voice/video)
- Multiple call queue handling
- Pulsing ring animation

**Usage**:

```tsx
import { CallNotification } from '@/components/voice-video/CallNotification'
;<CallNotification
  call={{
    id: 'call-123',
    callerId: 'user-456',
    callerName: 'John Doe',
    callerAvatarUrl: '/avatar.jpg',
    type: 'video',
    receivedAt: new Date(),
  }}
  timeout={30}
  ringtoneUrl="/sounds/ringtone.mp3"
  ringtoneVolume={0.5}
  onAccept={(callId, withVideo) => handleAccept(callId, withVideo)}
  onDecline={(callId) => handleDecline(callId)}
/>
```

---

## Hooks

### use-call.ts

Main hook for call management.

**Location**: `src/hooks/use-call.ts`

**Features**:

- Connect to LiveKit room
- Manage participants
- Handle call state (connecting, connected, ended)
- Provide call controls
- Real-time updates via WebSocket

**Usage**:

```typescript
import { useCall } from '@/hooks/use-call'

const {
  isInCall,
  callState,
  participants,
  isMuted,
  isVideoEnabled,
  localStream,
  remoteStreams,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  endCall,
} = useCall()
```

### use-stream.ts

Hook for stream playback.

**Location**: `src/hooks/use-stream.ts`

**Features**:

- Connect to HLS stream
- Manage viewer count
- Handle stream state
- Real-time chat integration

---

## LiveKit Integration

### LiveKit Client

**Location**: `src/lib/webrtc/livekit-client.ts`

**Features**:

- Singleton client instance
- Room connection management
- Track publishing (audio/video/screen)
- Device control (mute, camera, screen share)
- Camera switching (front/back on mobile)
- Event listeners (participants, tracks, quality)
- Auto-reconnection

**Usage**:

```typescript
import { getLiveKitClient, getLiveKitToken } from '@/lib/webrtc/livekit-client'

const client = getLiveKitClient()

// Get token from backend
const token = await getLiveKitToken('room-name', 'participant-name')

// Connect to room
await client.connect(
  {
    url: 'ws://localhost:7880',
    token,
    roomName: 'room-name',
    identity: 'user-id',
    name: 'User Name',
  },
  {
    onConnectionStateChange: (state) => console.log('State:', state),
    onParticipantConnected: (id) => console.log('Participant joined:', id),
    onError: (error) => console.error('Error:', error),
  }
)

// Publish tracks
await client.publishTracks(true, true) // audio + video

// Toggle controls
await client.toggleMicrophone()
await client.toggleCamera()
await client.startScreenShare()

// Disconnect
await client.disconnect()
```

### LiveKit Token API

**Location**: `src/app/api/livekit/token/route.ts`

Generates JWT tokens for LiveKit room access.

**Endpoint**: `POST /api/livekit/token`

**Request**:

```json
{
  "roomName": "call-123",
  "participantName": "John Doe",
  "participantMetadata": "{\"userId\":\"user-123\"}"
}
```

**Response**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "url": "ws://localhost:7880"
}
```

---

## Usage Examples

### Complete Call Flow

```tsx
// 1. Call page component
import { useParams } from 'next/navigation'
import { CallWindow } from '@/components/voice-video/CallWindow'
import { getLiveKitClient, getLiveKitToken } from '@/lib/webrtc/livekit-client'

export default function CallPage() {
  const { id: callId } = useParams()
  const [participants, setParticipants] = useState([])
  const client = getLiveKitClient()

  useEffect(() => {
    async function initCall() {
      // Get token
      const token = await getLiveKitToken(callId, user.name)

      // Connect
      await client.connect(
        {
          url: process.env.NEXT_PUBLIC_LIVEKIT_URL,
          token,
          roomName: callId,
          identity: user.id,
          name: user.name,
        },
        {
          onParticipantConnected: (id) => {
            // Update participants
          },
        }
      )

      // Publish tracks
      await client.publishTracks(true, true)
    }

    initCall()

    return () => client.disconnect()
  }, [callId])

  return (
    <CallWindow
      callId={callId}
      callType="video"
      participants={participants}
      onEndCall={() => client.disconnect()}
      {...otherProps}
    />
  )
}
```

### Screen Sharing

```typescript
// Start screen share
const handleScreenShare = async () => {
  const client = getLiveKitClient()
  try {
    if (isScreenSharing) {
      await client.stopScreenShare()
    } else {
      await client.startScreenShare()
    }
    setIsScreenSharing(!isScreenSharing)
  } catch (error) {
    console.error('Screen share error:', error)
    toast.error('Failed to share screen')
  }
}
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# LiveKit server URL
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880

# LiveKit API credentials (server-side only)
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### LiveKit Server Setup

1. Install LiveKit server:

```bash
# macOS
brew install livekit

# Docker
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  livekit/livekit-server --dev
```

2. Generate API keys:

```bash
livekit-cli create-token \
  --api-key your-api-key \
  --api-secret your-api-secret \
  --room my-room \
  --identity user-123 \
  --valid-for 24h
```

---

## Troubleshooting

### Common Issues

**1. "Failed to connect to call"**

- Check LiveKit server is running: `livekit-server --dev`
- Verify `NEXT_PUBLIC_LIVEKIT_URL` in `.env.local`
- Check firewall/network restrictions

**2. "No video stream"**

- Browser permissions: Allow camera/microphone access
- Check device availability: `navigator.mediaDevices.enumerateDevices()`
- Verify video is enabled: `isVideoEnabled={true}`

**3. "Screen share not working"**

- Browser support: Chrome/Edge support screen sharing
- User cancelled: Handle `DOMException` errors
- Check permissions in browser settings

**4. "Poor call quality"**

- Check network connection quality
- Reduce video quality: Use lower presets
- Enable adaptive streaming: `adaptiveStream: true`
- Check CPU usage: Lower resolution if needed

**5. "Token expired"**

- Default TTL is 6 hours
- Refresh token before expiry
- Handle `ConnectionStateChanged` event

### Debug Mode

Enable debug logging:

```typescript
import { logger } from '@/lib/logger'

// Set log level
logger.setLevel('debug')

// In LiveKit client
const client = getLiveKitClient()
client.getRoom()?.on('*', (event) => {
  logger.debug('[LiveKit Event]', event)
})
```

### Network Requirements

- **Ports**: 7880 (WebSocket), 7881 (HTTP), 7882/UDP (WebRTC)
- **Bandwidth**:
  - Voice: 32-64 kbps
  - Video 360p: 500 kbps
  - Video 720p: 1.5 Mbps
  - Video 1080p: 3 Mbps
  - Screen share: 1-2 Mbps
- **Latency**: < 150ms for best quality

---

## Additional Resources

- **LiveKit Docs**: https://docs.livekit.io
- **LiveKit React Components**: https://docs.livekit.io/reference/components/react
- **WebRTC Best Practices**: https://webrtc.org/getting-started/testing
- **HLS.js Docs**: https://github.com/video-dev/hls.js

---

## Support

For issues or questions:

- GitHub Issues: https://github.com/nself-org/nself-chat/issues
- Discord: https://discord.gg/nself
- Email: support@nself.org
