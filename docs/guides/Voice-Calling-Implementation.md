# Voice Calling System Implementation - nself-chat v0.4.0

## Overview

Comprehensive WebRTC voice calling system with support for:
- **1-on-1 calls**: Peer-to-peer with automatic fallback to TURN
- **Group calls**: SFU architecture supporting up to 50 participants
- **High-quality audio**: Opus codec at 48kHz with noise suppression and echo cancellation
- **Call recording**: With participant consent
- **TURN/STUN**: NAT traversal for reliable connectivity

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│  ├─ VoiceCallModal      (Main call interface)              │
│  ├─ CallControls        (Mute, speaker, hang up)           │
│  ├─ CallParticipants    (Participant list)                 │
│  ├─ IncomingCallAlert   (Incoming call notification)       │
│  └─ CallHistory         (Call log)                         │
├─────────────────────────────────────────────────────────────┤
│  React Hooks                                                 │
│  ├─ useVoiceCall        (Main call logic)                  │
│  ├─ useCallAudio        (Audio device management)          │
│  ├─ useCallControls     (Mute, speaker controls)           │
│  └─ useCallRecording    (Recording management)             │
├─────────────────────────────────────────────────────────────┤
│  Core Libraries                                              │
│  ├─ audio-processor     (Noise suppression, AGC)           │
│  ├─ call-state-machine  (Call lifecycle)                   │
│  ├─ group-call-manager  (SFU for group calls)             │
│  ├─ peer-connection     (WebRTC wrapper)                   │
│  ├─ media-manager       (getUserMedia, devices)            │
│  └─ signaling          (Socket.io signaling)              │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                 │
│  └─ call-store          (Global call state)                │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                        │
│  ├─ POST /api/calls/initiate                               │
│  ├─ POST /api/calls/:id/join                               │
│  ├─ POST /api/calls/:id/leave                              │
│  ├─ GET  /api/calls/:id/participants                       │
│  └─ POST /api/calls/:id/recording                          │
├─────────────────────────────────────────────────────────────┤
│  GraphQL (Hasura)                                            │
│  ├─ Queries: calls, call_participants, call_history        │
│  ├─ Mutations: create_call, join_call, end_call           │
│  └─ Subscriptions: call_events                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Signaling Server                          │
│                  (Socket.io WebSocket)                       │
│  ├─ Call initiation/acceptance                             │
│  ├─ WebRTC offer/answer exchange                           │
│  ├─ ICE candidate relay                                    │
│  └─ Call state events                                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Media Server (Optional)                   │
│                   mediasoup SFU for group calls              │
│  ├─ Audio routing (up to 50 participants)                 │
│  ├─ Bandwidth optimization                                 │
│  └─ Recording aggregation                                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  Tables:                                                     │
│  ├─ nchat_calls            (Call records)                  │
│  ├─ nchat_call_participants (Participant data)            │
│  ├─ nchat_call_events      (Event log)                    │
│  ├─ nchat_call_recordings  (Recording metadata)           │
│  ├─ nchat_ice_servers      (TURN/STUN configs)            │
│  └─ nchat_call_quality_reports (WebRTC stats)             │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Install dependencies
pnpm add mediasoup-client simple-peer webrtc-adapter

# Run database migration
cd .backend
nself db migrate up
```

## Database Schema

### Core Tables

**nchat_calls**
- Main call records
- Fields: id, type ('1-on-1'|'group'), status, channel_id, initiator_id, timestamps, duration, quality metrics, recording info

**nchat_call_participants**
- Participant information for each call
- Fields: call_id, user_id, status, joined_at, left_at, duration, is_muted, connection quality

**nchat_call_events**
- Event log for debugging and analytics
- Fields: call_id, user_id, event_type, timestamp, data

**nchat_call_recordings**
- Metadata for call recordings
- Fields: call_id, file_url, duration, status, permissions

**nchat_ice_servers**
- TURN/STUN server configurations
- Fields: urls[], username, credential, server_type, region, priority

**nchat_call_quality_reports**
- WebRTC quality metrics
- Fields: call_id, participant_id, packet_loss, jitter, rtt, bitrate, rtc_stats (JSONB)

## Implementation Components

### 1. Core Libraries

#### Audio Processor (`src/lib/calls/audio-processor.ts`)
```typescript
import { createAudioProcessor } from '@/lib/calls/audio-processor'

const processor = createAudioProcessor({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  vadEnabled: true,
  vadThreshold: 30,
}, {
  onAudioLevel: (info) => console.log('Audio level:', info.level),
  onVoiceActivity: (speaking) => console.log('Speaking:', speaking),
})

// Initialize with stream
await processor.initialize(stream)

// Get audio level
const level = processor.getAudioLevel()

// Cleanup
processor.cleanup()
```

Features:
- ✅ Automatic Gain Control (AGC)
- ✅ Noise suppression
- ✅ Echo cancellation
- ✅ Voice Activity Detection (VAD)
- ✅ Audio level monitoring
- ✅ Real-time processing

#### Call State Machine (`src/lib/calls/call-state-machine.ts`)
```typescript
import { createCallStateMachine } from '@/lib/calls/call-state-machine'

const machine = createCallStateMachine('call-123', {
  onStateChange: (data) => console.log('State:', data.state),
  onTransition: (transition) => console.log('Transition:', transition),
})

// Trigger state transitions
machine.initiate()    // idle -> initiating
machine.ring()        // initiating -> ringing
machine.accept()      // ringing -> connecting
machine.connect()     // connecting -> connected
machine.end()         // connected -> ended

// Query state
machine.isConnected()
machine.getDurationSeconds()
machine.getTimeline()
```

States: `idle` → `initiating` → `ringing` → `connecting` → `connected` → `ended`

#### Group Call Manager (`src/lib/calls/group-call-manager.ts`)
```typescript
import { createGroupCallManager } from '@/lib/calls/group-call-manager'

const manager = createGroupCallManager({
  callId: 'call-123',
  userId: 'user-456',
  maxParticipants: 50,
  audioCodec: 'opus',
  enableDtx: true,
}, {
  onParticipantJoined: (p) => console.log('Joined:', p.name),
  onParticipantLeft: (id) => console.log('Left:', id),
  onStatsUpdate: (stats) => console.log('Stats:', stats),
})

// Initialize with local stream
await manager.initialize(localStream)

// Add participant
manager.addParticipant({
  id: 'user-789',
  name: 'Alice',
  isMuted: false,
  isSpeaking: false,
  audioLevel: 0,
  joinedAt: Date.now(),
})

// Control audio
manager.setMuted(true)

// Cleanup
manager.cleanup()
```

### 2. React Hooks

#### useVoiceCall (Already Implemented)
Located at: `src/hooks/use-voice-call.ts`

Usage:
```typescript
import { useVoiceCall } from '@/hooks/use-voice-call'

const VoiceCallComponent = () => {
  const {
    isInCall,
    isCallConnected,
    isMuted,
    callDuration,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    audioLevel,
  } = useVoiceCall({
    userId: 'user-123',
    userName: 'John Doe',
    onCallStarted: (callId) => console.log('Call started:', callId),
    onCallEnded: (callId, reason) => console.log('Call ended:', reason),
  })

  return (
    <div>
      {isInCall && (
        <div>
          <p>Duration: {callDuration}s</p>
          <button onClick={toggleMute}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={endCall}>End Call</button>
        </div>
      )}
    </div>
  )
}
```

#### useCallAudio (To be created: `src/hooks/use-call-audio.ts`)
```typescript
export function useCallAudio() {
  const [devices, setDevices] = useState({ inputs: [], outputs: [] })
  const [selectedInput, setSelectedInput] = useState<string | null>(null)
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Device enumeration
  // Audio level monitoring
  // Device switching

  return {
    microphones: devices.inputs,
    speakers: devices.outputs,
    selectedMicrophone: selectedInput,
    selectedSpeaker: selectedOutput,
    audioLevel,
    selectMicrophone: (deviceId: string) => {},
    selectSpeaker: (deviceId: string) => {},
    testMicrophone: () => {},
  }
}
```

#### useCallControls (To be created: `src/hooks/use-call-controls.ts`)
```typescript
export function useCallControls(callId: string) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  return {
    isMuted,
    isSpeakerOn,
    toggleMute: () => {},
    toggleSpeaker: () => {},
    hangUp: () => {},
  }
}
```

#### useCallRecording (To be created: `src/hooks/use-call-recording.ts`)
```typescript
export function useCallRecording(callId: string) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  return {
    isRecording,
    recordingDuration,
    startRecording: () => {},
    stopRecording: () => {},
    hasConsent: () => {},
  }
}
```

### 3. API Routes

#### POST /api/calls/initiate
Create a new call

Request:
```json
{
  "targetUserId": "user-456",
  "type": "voice",
  "channelId": "channel-789" // optional
}
```

Response:
```json
{
  "callId": "call-123",
  "status": "initiating"
}
```

#### POST /api/calls/:id/join
Join an existing call

Response:
```json
{
  "callId": "call-123",
  "participants": [...],
  "iceServers": [...]
}
```

#### POST /api/calls/:id/leave
Leave a call

Response:
```json
{
  "success": true,
  "duration": 120
}
```

#### GET /api/calls/:id/participants
Get call participants

Response:
```json
{
  "participants": [
    {
      "userId": "user-123",
      "name": "John Doe",
      "joinedAt": "2026-01-30T...",
      "isMuted": false
    }
  ]
}
```

#### POST /api/calls/:id/recording
Start/stop recording

Request:
```json
{
  "action": "start" | "stop"
}
```

Response:
```json
{
  "recordingId": "rec-456",
  "status": "recording"
}
```

### 4. GraphQL Operations

#### Queries

```graphql
# Get active calls
query GetActiveCalls {
  nchat_calls(where: { status: { _in: ["ringing", "connecting", "connected"] } }) {
    id
    type
    status
    created_at
    initiator {
      id
      display_name
      avatar_url
    }
    participants {
      user {
        id
        display_name
      }
      status
      joined_at
    }
  }
}

# Get call history
query GetCallHistory($userId: uuid!) {
  nchat_calls(
    where: {
      _or: [
        { initiator_id: { _eq: $userId } }
        { participants: { user_id: { _eq: $userId } } }
      ]
    }
    order_by: { created_at: desc }
    limit: 50
  ) {
    id
    type
    status
    created_at
    ended_at
    duration
    participants {
      user {
        display_name
      }
    }
  }
}
```

#### Mutations

```graphql
# Create call
mutation CreateCall($type: String!, $initiatorId: uuid!, $channelId: uuid) {
  insert_nchat_calls_one(object: {
    type: $type
    initiator_id: $initiatorId
    channel_id: $channelId
    status: "initiating"
  }) {
    id
    status
  }
}

# Join call
mutation JoinCall($callId: uuid!, $userId: uuid!) {
  insert_nchat_call_participants_one(object: {
    call_id: $callId
    user_id: $userId
    status: "connecting"
  }) {
    id
  }
}

# End call
mutation EndCall($callId: uuid!) {
  update_nchat_calls_by_pk(
    pk_columns: { id: $callId }
    _set: { status: "ended", ended_at: "now()" }
  ) {
    id
    duration
  }
}
```

#### Subscriptions

```graphql
# Subscribe to call events
subscription CallEvents($callId: uuid!) {
  nchat_call_events(
    where: { call_id: { _eq: $callId } }
    order_by: { timestamp: desc }
  ) {
    id
    event_type
    timestamp
    user {
      display_name
    }
    data
  }
}

# Subscribe to participant changes
subscription ParticipantChanges($callId: uuid!) {
  nchat_call_participants(
    where: { call_id: { _eq: $callId } }
  ) {
    id
    user {
      id
      display_name
      avatar_url
    }
    status
    is_muted
    joined_at
  }
}
```

### 5. UI Components

#### VoiceCallModal.tsx
Main call interface showing:
- Participant avatars
- Call duration
- Audio level indicators
- Call controls
- Connection quality

#### CallControls.tsx
Control buttons:
- Mute/unmute
- Speaker on/off
- End call
- Settings (device selection)

#### CallParticipants.tsx
List of participants with:
- Avatar
- Name
- Mute status
- Speaking indicator
- Audio level

#### IncomingCallAlert.tsx
Notification for incoming calls:
- Caller info
- Accept/Decline buttons
- Ringtone audio

#### CallHistory.tsx
Call log showing:
- Missed/completed calls
- Duration
- Participants
- Date/time

## Call Flow

### 1-on-1 Call Flow

```
Alice                    Server                   Bob
  │                        │                       │
  │ 1. Initiate Call       │                       │
  ├───────────────────────>│                       │
  │                        │ 2. Ring Event         │
  │                        ├──────────────────────>│
  │                        │                       │
  │                        │ 3. Accept             │
  │                        │<──────────────────────┤
  │                        │                       │
  │ 4. Offer               │                       │
  ├───────────────────────>│                       │
  │                        │ 5. Offer              │
  │                        ├──────────────────────>│
  │                        │                       │
  │                        │ 6. Answer             │
  │                        │<──────────────────────┤
  │ 7. Answer              │                       │
  │<───────────────────────┤                       │
  │                        │                       │
  │ 8. ICE Candidates      │ 9. ICE Candidates     │
  │<──────────────────────>│<─────────────────────>│
  │                        │                       │
  │      10. P2P Audio Stream Established          │
  │<══════════════════════════════════════════════>│
  │                        │                       │
  │ 11. End Call           │                       │
  ├───────────────────────>│ 12. End Event         │
  │                        ├──────────────────────>│
  │                        │                       │
```

### Group Call Flow

```
Participant              SFU Server           Other Participants
     │                       │                        │
     │ 1. Join Call          │                        │
     ├──────────────────────>│                        │
     │                       │                        │
     │ 2. Create Transport   │                        │
     │<──────────────────────┤                        │
     │                       │                        │
     │ 3. Produce Audio      │                        │
     ├──────────────────────>│                        │
     │                       │ 4. Notify Others       │
     │                       ├───────────────────────>│
     │                       │                        │
     │                       │ 5. Others Consume      │
     │                       │<───────────────────────┤
     │                       │                        │
     │ 6. Consume Others     │                        │
     │<──────────────────────┤                        │
     │                       │                        │
     │        Audio Routed via SFU (up to 50)        │
     │<══════════════════════════════════════════════>│
     │                       │                        │
```

## Configuration

### Environment Variables

```bash
# .env.local

# WebRTC ICE Servers
NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_URL=turn:turn.example.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_CREDENTIAL=credential

# SFU Server (for group calls)
NEXT_PUBLIC_SFU_URL=https://sfu.example.com

# Socket.io Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Call Settings
NEXT_PUBLIC_MAX_CALL_DURATION=7200  # 2 hours in seconds
NEXT_PUBLIC_CALL_TIMEOUT=60         # Ring timeout in seconds
NEXT_PUBLIC_MAX_GROUP_PARTICIPANTS=50
```

### Add TURN Server

```sql
INSERT INTO nchat_ice_servers (urls, username, credential, server_type, region, priority)
VALUES (
  ARRAY['turn:turn.example.com:3478'],
  'your_username',
  'your_credential',
  'turn',
  'us-east',
  100
);
```

## Testing

### Test Audio Input
```typescript
import { testAudioInput } from '@/lib/calls/audio-processor'

const result = await testAudioInput('device-id')
console.log('Test result:', result)
// { success: true, level: 45 }
```

### Test 1-on-1 Call
1. Open app in two browser tabs
2. Login as different users
3. Start call from one tab
4. Accept call in other tab
5. Verify audio stream
6. Test mute/unmute
7. End call

### Test Group Call
1. Open app in multiple tabs (3-5)
2. Start group call in channel
3. Join from other tabs
4. Verify all participants hear each other
5. Test participant leaving/joining
6. Monitor quality metrics

## Performance Optimization

### Audio Codec Settings
```typescript
{
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
    // Opus-specific
    opusStereo: false,
    opusDtx: true,      // Discontinuous Transmission
    opusFec: true,      // Forward Error Correction
    opusMaxPlaybackRate: 48000,
  }
}
```

### Bandwidth Management
- **1-on-1**: ~20-40 kbps per participant
- **Group (5)**: ~100-200 kbps total
- **Group (20)**: ~400-800 kbps total
- **Group (50)**: ~1-2 Mbps total

### Quality Monitoring
```typescript
// Check connection quality
const quality = await checkConnectionQuality()
// { rtt: 50, packetLoss: 0.5, jitter: 10 }

// Adjust bitrate based on quality
if (quality.packetLoss > 5) {
  // Reduce bitrate
}
```

## Troubleshooting

### Common Issues

**No audio heard**
- Check microphone permissions
- Verify device selection
- Check if muted
- Test with `testAudioInput()`

**High latency**
- Check RTT in quality reports
- Verify TURN server location
- Consider using closer server

**Call fails to connect**
- Verify ICE servers configured
- Check TURN credentials
- Test with different network

**Echo in call**
- Enable echo cancellation
- Check speaker/microphone distance
- Reduce speaker volume

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('debug-calls', 'true')

// View WebRTC stats
machine.toJSON()
processor.getConfig()
manager.getParticipants()
```

## Security Considerations

1. **Encryption**: All audio streams use DTLS-SRTP
2. **Authentication**: Verify user permissions before allowing calls
3. **Recording Consent**: Get explicit consent before recording
4. **Rate Limiting**: Limit call initiation to prevent abuse
5. **TURN Security**: Use authenticated TURN servers with short-lived credentials

## Next Steps

1. ✅ Database migration
2. ✅ Core libraries
3. ⏳ Additional hooks
4. ⏳ API routes
5. ⏳ UI components
6. ⏳ GraphQL operations
7. ⏳ Integration testing
8. ⏳ Documentation

## Resources

- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [mediasoup Documentation](https://mediasoup.org/documentation/v3/)
- [Opus Codec](https://opus-codec.org/)
- [TURN Server Setup](https://github.com/coturn/coturn)

## Support

For issues or questions:
- GitHub Issues: https://github.com/nself/nself-chat/issues
- Documentation: https://docs.nself.chat
- Discord: https://discord.gg/nself
