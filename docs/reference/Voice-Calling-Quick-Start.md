# Voice Calling Quick Start Guide

## Installation (5 minutes)

```bash
# 1. Install dependencies
pnpm add mediasoup-client simple-peer webrtc-adapter

# 2. Run database migration
cd .backend
nself db migrate up

# 3. Add environment variables
echo "NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302" >> .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:3001" >> .env.local
```

## Basic Usage

### Start a 1-on-1 Call

```typescript
import { useVoiceCall } from '@/hooks/use-voice-call'

function CallButton({ targetUserId, targetUserName }) {
  const { startCall } = useVoiceCall({
    userId: currentUser.id,
    userName: currentUser.name,
  })

  const handleCall = async () => {
    const callId = await startCall(targetUserId, targetUserName)
    console.log('Call initiated:', callId)
  }

  return <button onClick={handleCall}>Call {targetUserName}</button>
}
```

### Accept an Incoming Call

```typescript
function IncomingCallNotification() {
  const { hasIncomingCall, incomingCalls, acceptCall, declineCall } = useVoiceCall({
    userId: currentUser.id,
    userName: currentUser.name,
  })

  if (!hasIncomingCall) return null

  const call = incomingCalls[0]

  return (
    <div>
      <p>{call.callerName} is calling...</p>
      <button onClick={() => acceptCall(call.id)}>Accept</button>
      <button onClick={() => declineCall(call.id)}>Decline</button>
    </div>
  )
}
```

### Call Controls

```typescript
function ActiveCallControls() {
  const {
    isInCall,
    isMuted,
    callDuration,
    audioLevel,
    toggleMute,
    endCall,
  } = useVoiceCall({
    userId: currentUser.id,
    userName: currentUser.name,
  })

  if (!isInCall) return null

  return (
    <div>
      <p>Duration: {callDuration}s</p>
      <p>Audio Level: {audioLevel}%</p>
      <button onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
      <button onClick={endCall}>End Call</button>
    </div>
  )
}
```

## Group Calls

```typescript
import { createGroupCallManager } from '@/lib/calls/group-call-manager'

// In a channel
async function startGroupCall(channelId: string) {
  // Get local audio stream
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

  // Create group call manager
  const manager = createGroupCallManager({
    callId: `call-${channelId}-${Date.now()}`,
    userId: currentUser.id,
    maxParticipants: 50,
  }, {
    onParticipantJoined: (p) => console.log('Joined:', p.name),
    onParticipantLeft: (id) => console.log('Left:', id),
  })

  // Initialize
  await manager.initialize(stream)

  return manager
}
```

## API Routes

### Initiate Call

```typescript
const response = await fetch('/api/calls/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetUserId: 'user-456',
    type: 'voice',
    channelId: 'channel-789', // optional
  }),
})

const { callId } = await response.json()
```

### Join Call

```typescript
const response = await fetch(`/api/calls/${callId}/join`, {
  method: 'POST',
})

const { participants, iceServers } = await response.json()
```

### Leave Call

```typescript
await fetch(`/api/calls/${callId}/leave`, {
  method: 'POST',
})
```

## GraphQL Examples

### Create Call

```typescript
import { useMutation } from '@apollo/client'
import { CREATE_CALL } from '@/graphql/mutations/calls'

const [createCall] = useMutation(CREATE_CALL)

const handleCreateCall = async () => {
  const { data } = await createCall({
    variables: {
      type: '1-on-1',
      initiatorId: currentUser.id,
      channelId: null,
    },
  })

  return data.insert_nchat_calls_one.id
}
```

### Subscribe to Call Events

```typescript
import { useSubscription } from '@apollo/client'
import { CALL_EVENTS_SUBSCRIPTION } from '@/graphql/subscriptions/calls'

function CallEventsMonitor({ callId }) {
  const { data } = useSubscription(CALL_EVENTS_SUBSCRIPTION, {
    variables: { callId },
  })

  useEffect(() => {
    if (data?.nchat_call_events) {
      const event = data.nchat_call_events[0]
      console.log('Call event:', event.event_type)
    }
  }, [data])

  return null
}
```

## Call State Flow

```
idle → initiating → ringing → connecting → connected → ended
```

```typescript
import { createCallStateMachine } from '@/lib/calls/call-state-machine'

const machine = createCallStateMachine('call-123', {
  onStateChange: (data) => {
    console.log('State changed:', data.state)
    updateUI(data)
  },
})

// Transitions
machine.initiate()    // Start call
machine.ring()        // Ringing
machine.accept()      // Accepted
machine.connect()     // Connected
machine.end()         // Ended
```

## Audio Processing

```typescript
import { createAudioProcessor } from '@/lib/calls/audio-processor'

const processor = createAudioProcessor({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  vadEnabled: true, // Voice Activity Detection
}, {
  onAudioLevel: (info) => {
    console.log('Level:', info.level, 'Speaking:', info.isSpeaking)
  },
})

// Initialize with stream
await processor.initialize(localStream)

// Monitor audio
const level = processor.getAudioLevel()
const speaking = processor.isSpeakingNow()

// Cleanup
processor.cleanup()
```

## Device Selection

```typescript
// List devices
const devices = await navigator.mediaDevices.enumerateDevices()
const microphones = devices.filter(d => d.kind === 'audioinput')
const speakers = devices.filter(d => d.kind === 'audiooutput')

// Select microphone
const { selectMicrophone } = useVoiceCall(...)
await selectMicrophone(microphoneDeviceId)

// Select speaker
const { selectSpeaker } = useVoiceCall(...)
await selectSpeaker(speakerDeviceId)
```

## Call Recording

```typescript
// Start recording
await fetch(`/api/calls/${callId}/recording`, {
  method: 'POST',
  body: JSON.stringify({ action: 'start' }),
})

// Stop recording
await fetch(`/api/calls/${callId}/recording`, {
  method: 'POST',
  body: JSON.stringify({ action: 'stop' }),
})

// Query recordings
const { data } = await client.query({
  query: GET_CALL_RECORDINGS,
  variables: { callId },
})
```

## Error Handling

```typescript
const { error } = useVoiceCall({
  userId: currentUser.id,
  userName: currentUser.name,
  onError: (error) => {
    console.error('Call error:', error)
    toast.error(`Call failed: ${error.message}`)
  },
})

// Check for permission errors
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
} catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Microphone permission denied')
  } else if (error.name === 'NotFoundError') {
    alert('No microphone found')
  }
}
```

## Quality Monitoring

```typescript
// Get call quality
import { useCallQuality } from '@/hooks/use-call-quality'

const { quality, metrics } = useCallQuality(callId)

console.log('Quality:', quality) // 'excellent' | 'good' | 'fair' | 'poor'
console.log('Packet Loss:', metrics.packetLoss)
console.log('Jitter:', metrics.jitter)
console.log('RTT:', metrics.rtt)
```

## Testing

```typescript
// Test audio input
import { testAudioInput } from '@/lib/calls/audio-processor'

const result = await testAudioInput(deviceId)
if (result.success) {
  console.log('Audio level:', result.level)
} else {
  console.error('Test failed:', result.error)
}

// Test connection quality
import { checkConnectionQuality } from '@/lib/calls/quality-monitor'

const quality = await checkConnectionQuality()
console.log('RTT:', quality.rtt, 'ms')
console.log('Packet Loss:', quality.packetLoss, '%')
```

## Common Issues

### No Audio
```typescript
// Check permissions
const permission = await navigator.permissions.query({ name: 'microphone' })
console.log('Microphone permission:', permission.state)

// Check devices
const devices = await navigator.mediaDevices.enumerateDevices()
console.log('Audio inputs:', devices.filter(d => d.kind === 'audioinput'))
```

### Echo
```typescript
// Enable echo cancellation
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
  },
})
```

### High Latency
```typescript
// Check RTT
const { avgRtt } = callQuality
if (avgRtt > 200) {
  console.warn('High latency detected:', avgRtt, 'ms')
  // Consider switching to closer server
}
```

## Production Checklist

- [ ] Configure TURN server
- [ ] Set up SFU server for group calls
- [ ] Add rate limiting to API routes
- [ ] Enable call recording storage
- [ ] Set up monitoring and alerts
- [ ] Test with different networks
- [ ] Load test with 50 participants
- [ ] Configure CDN for media relay
- [ ] Set up backup ICE servers
- [ ] Add analytics tracking

## Next Steps

1. Read full implementation guide: `docs/Voice-Calling-Implementation.md`
2. Set up TURN server: `docs/Voice-Calling-TURN-Setup.md`
3. Configure SFU: `docs/Voice-Calling-SFU-Setup.md`
4. Deploy to production: `docs/Voice-Calling-Deployment.md`

## Support

- Documentation: `/docs/Voice-Calling-*.md`
- GitHub Issues: https://github.com/nself/nself-chat/issues
- Discord: https://discord.gg/nself
