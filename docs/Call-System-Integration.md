# Call System Integration Guide

This guide explains how to integrate voice and video calling features into nself-chat.

## Overview

The call system consists of:

1. **WebRTC Infrastructure** (`src/lib/webrtc/`)
   - `signaling.ts` - Socket.io-based signaling for call negotiation
   - `peer-connection.ts` - RTCPeerConnection management
   - `media-manager.ts` - Media device and stream management

2. **GraphQL Operations** (`src/graphql/calls.ts`)
   - Mutations: `INITIATE_CALL`, `END_CALL`, `UPDATE_PARTICIPANT_*`
   - Queries: `GET_CALL`, `GET_CALL_HISTORY`, `GET_ACTIVE_CALLS`
   - Subscriptions: `SUBSCRIBE_TO_INCOMING_CALLS`, `SUBSCRIBE_TO_CALL`

3. **State Management** (`src/stores/call-store.ts`)
   - Zustand store with call state, participants, media streams
   - Selectors for derived state

4. **Hooks** (`src/hooks/`)
   - `useCall` - Main hook orchestrating full call lifecycle
   - `useVoiceCall` - Voice-specific features
   - `useVideoCall` - Video-specific features with screen sharing
   - `useScreenShare` - Screen sharing functionality
   - `useCallStats` - Connection quality monitoring

5. **UI Components** (`src/components/call/`)
   - `CallButton` - Initiate call button
   - `CallModal` - Full-screen active call interface
   - `CallControls` - Mute, video toggle, screen share, hang up
   - `CallParticipants` - Grid view of participants
   - `CallStats` - Connection quality display
   - `IncomingCall` - Incoming call notification
   - `IncomingCallModal` - Modal for incoming calls
   - `CallActions` - Helper components for various UI locations
   - `CallWrapper` - Top-level wrapper managing all call UI

## Quick Start

### 1. Add CallWrapper to Your App Layout

The `CallWrapper` component should be mounted at the app level to handle all call UI:

```tsx
// src/app/layout.tsx or src/app/chat/layout.tsx
import { CallWrapper } from '@/components/call'

export default function Layout({ children }) {
  return (
    <div>
      {children}
      <CallWrapper />
    </div>
  )
}
```

### 2. Add Call Buttons to Channel Header

For Direct Messages:

```tsx
import { DMCallActions } from '@/components/call'

function ChannelHeader({ channel, otherUser }) {
  return (
    <header>
      <h1>{channel.name}</h1>
      <DMCallActions
        userId={otherUser.id}
        userName={otherUser.displayName}
      />
    </header>
  )
}
```

### 3. Add Call Buttons to User Profile

```tsx
import { UserProfileCallActions } from '@/components/call'

function UserProfile({ user }) {
  return (
    <div>
      <h2>{user.displayName}</h2>
      <UserProfileCallActions
        userId={user.id}
        userName={user.displayName}
        userAvatar={user.avatarUrl}
      />
    </div>
  )
}
```

### 4. Use the Main Call Hook

For custom implementations:

```tsx
import { useCall } from '@/hooks/use-call'

function MyComponent() {
  const {
    isInCall,
    callState,
    initiateVoiceCall,
    initiateVideoCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall()

  return (
    <div>
      {!isInCall && (
        <>
          <button onClick={() => initiateVoiceCall('user-id', 'John Doe')}>
            Voice Call
          </button>
          <button onClick={() => initiateVideoCall('user-id', 'John Doe')}>
            Video Call
          </button>
        </>
      )}

      {isInCall && (
        <>
          <p>Call Status: {callState}</p>
          <button onClick={toggleMute}>Toggle Mute</button>
          <button onClick={toggleVideo}>Toggle Video</button>
          <button onClick={endCall}>End Call</button>
        </>
      )}
    </div>
  )
}
```

## Database Schema

Ensure these tables exist in your PostgreSQL database:

```sql
-- Calls table
CREATE TABLE nchat_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('voice', 'video')),
  status TEXT NOT NULL CHECK (status IN ('idle', 'initiating', 'ringing', 'connecting', 'connected', 'reconnecting', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration INTEGER,
  caller_id UUID NOT NULL REFERENCES nchat_users(id),
  channel_id UUID REFERENCES nchat_channels(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call participants table
CREATE TABLE nchat_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES nchat_users(id),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_enabled BOOLEAN DEFAULT FALSE,
  is_screen_sharing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT call_participants_call_user_unique UNIQUE (call_id, user_id)
);

-- Indexes
CREATE INDEX idx_calls_status ON nchat_calls(status);
CREATE INDEX idx_calls_caller ON nchat_calls(caller_id);
CREATE INDEX idx_call_participants_call ON nchat_call_participants(call_id);
CREATE INDEX idx_call_participants_user ON nchat_call_participants(user_id);
```

## Socket.io Setup

The call system uses Socket.io for signaling. Ensure your backend has these event handlers:

```javascript
// Backend socket.io events
io.on('connection', (socket) => {
  // Call events
  socket.on('call:initiate', handleCallInitiate)
  socket.on('call:accept', handleCallAccept)
  socket.on('call:decline', handleCallDecline)
  socket.on('call:end', handleCallEnd)

  // WebRTC signaling
  socket.on('call:offer', handleOffer)
  socket.on('call:answer', handleAnswer)
  socket.on('call:ice-candidate', handleIceCandidate)

  // Media state
  socket.on('call:mute:changed', handleMuteChanged)
  socket.on('call:video:changed', handleVideoChanged)
  socket.on('call:screen-share:started', handleScreenShareStarted)
  socket.on('call:screen-share:stopped', handleScreenShareStopped)
})
```

## Component API Reference

### CallButton

```tsx
<CallButton
  callType="voice" | "video"
  variant="default" | "ghost" | "outline"
  size="sm" | "md" | "lg" | "icon"
  onInitiateCall={() => {}}
  loading={false}
  showLabel={false}
/>
```

### CallModal

```tsx
<CallModal
  open={true}
  onOpenChange={(open) => {}}
  callType="voice" | "video"
  callState="connected"
  callDuration={120}
  participants={[...]}
  localStream={mediaStream}
  isMuted={false}
  isVideoEnabled={true}
  isScreenSharing={false}
  onToggleMute={() => {}}
  onToggleVideo={() => {}}
  onToggleScreenShare={() => {}}
  onEndCall={() => {}}
  callStats={{ /* optional stats */ }}
/>
```

### CallControls

```tsx
<CallControls
  isMuted={false}
  isVideoEnabled={true}
  isScreenSharing={false}
  onToggleMute={() => {}}
  onToggleVideo={() => {}}
  onToggleScreenShare={() => {}}
  onEndCall={() => {}}
  onOpenSettings={() => {}}
  showVideoControls={true}
  showScreenShareControls={true}
/>
```

### IncomingCall

```tsx
<IncomingCall
  callId="call-123"
  callerName="John Doe"
  callerAvatarUrl="..."
  callType="video"
  channelName="general"
  onAccept={(callId) => {}}
  onDecline={(callId) => {}}
  isRinging={true}
/>
```

## Hook API Reference

### useCall

```tsx
const {
  // State
  isInCall,
  callState,
  callType,
  callDuration,
  participants,
  incomingCalls,
  hasIncomingCall,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  localStream,
  remoteStreams,

  // Actions
  initiateVoiceCall,
  initiateVideoCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  toggleVideo,
  toggleScreenShare,

  error,
} = useCall({ autoAcceptCalls: false, enableNotifications: true })
```

### useVoiceCall

```tsx
const {
  isInCall,
  isCallConnected,
  isMuted,
  isRinging,
  callDuration,
  hasIncomingCall,
  startCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  selectSpeaker,
  selectMicrophone,
  audioLevel,
  error,
} = useVoiceCall({
  userId: 'user-123',
  userName: 'John Doe',
  onCallStarted: (callId) => {},
  onCallEnded: (callId, reason) => {},
  onError: (error) => {},
})
```

### useVideoCall

```tsx
const {
  isInCall,
  isCallConnected,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  localStream,
  remoteStreams,
  startCall,
  acceptCall,
  declineCall,
  endCall,
  toggleMute,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
  enterPictureInPicture,
  exitPictureInPicture,
  setVideoQuality,
  error,
} = useVideoCall({
  userId: 'user-123',
  userName: 'John Doe',
  defaultVideoQuality: 'medium',
  onCallStarted: (callId) => {},
  onCallEnded: (callId, reason) => {},
  onError: (error) => {},
})
```

## Features

### Implemented

- ✅ 1-on-1 voice calls
- ✅ 1-on-1 video calls
- ✅ Screen sharing
- ✅ Mute/unmute microphone
- ✅ Enable/disable camera
- ✅ Call controls (hang up, mute, video toggle)
- ✅ Incoming call notifications
- ✅ Call duration display
- ✅ Connection quality monitoring
- ✅ Multiple incoming calls queue
- ✅ Minimized call view
- ✅ Picture-in-picture mode
- ✅ Device selection (mic, camera, speaker)
- ✅ Audio level detection
- ✅ Call history

### Not Yet Implemented

- ❌ Group voice channels (Discord-style)
- ❌ Group video calls (3+ participants)
- ❌ Call recording
- ❌ Voice messages
- ❌ Background blur for video
- ❌ Virtual backgrounds
- ❌ Noise cancellation controls
- ❌ Echo cancellation settings

## Troubleshooting

### Calls Not Connecting

1. Verify Socket.io is running and accessible
2. Check browser permissions for microphone/camera
3. Ensure STUN/TURN servers are configured correctly
4. Check database tables exist and have correct permissions

### No Audio/Video

1. Check browser permissions
2. Verify device selection in settings
3. Check if tracks are being added to peer connection
4. Verify media constraints are correct

### Poor Call Quality

1. Check connection quality in CallStats
2. Try reducing video quality
3. Verify network conditions
4. Check if TURN server is being used (for restrictive networks)

## Environment Variables

```bash
# WebRTC Configuration
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=password

# Socket.io
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Next Steps

1. Configure STUN/TURN servers for production
2. Set up call recording infrastructure (optional)
3. Implement group calls (optional)
4. Add analytics for call quality metrics
5. Set up automated testing for WebRTC flows
