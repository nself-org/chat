# WebRTC & Email Service Integration Guide - v0.9.1

Complete guide for WebRTC voice/video calling with LiveKit and email notifications integration.

## Overview

This guide covers the implementation of:

- **WebRTC UI Components**: CallWindow, StreamPlayer, CallControls, ParticipantGrid
- **Email Service**: SendGrid/SMTP integration with React Email templates
- **LiveKit Integration**: Voice and video call infrastructure

---

## WebRTC UI Components

### 1. CallWindow Component

**Location**: `src/components/voice-video/CallWindow.tsx`

Full-featured video call interface supporting 1-100 participants.

**Features**:

- ✅ Responsive grid layout (1x1, 2x1, 2x2, 3x3, etc.)
- ✅ Local video preview (mirrored)
- ✅ Remote participant videos
- ✅ Audio/video mute controls
- ✅ Screen sharing
- ✅ Call duration timer
- ✅ Connection quality indicators
- ✅ Speaking indicators (border highlight)
- ✅ Participant list sidebar
- ✅ Minimize/maximize
- ✅ Auto-hide controls

**Usage**:

```tsx
import { CallWindow } from '@/components/voice-video/CallWindow'

function MyCallPage() {
  const handleEndCall = () => {
    // Clean up and navigate away
  }

  return (
    <CallWindow
      callId="call-123"
      channelName="General Discussion"
      participants={participants}
      currentUserId="user-123"
      onEndCall={handleEndCall}
      onToggleMute={() => {}}
      onToggleVideo={() => {}}
      onToggleScreenShare={() => {}}
    />
  )
}
```

### 2. StreamPlayer Component

**Location**: `src/components/voice-video/StreamPlayer.tsx`

Live streaming player with chat and reactions.

**Features**:

- ✅ HLS/DASH playback
- ✅ Quality selector (Auto, 1080p, 720p, 480p, 360p)
- ✅ Live viewer count
- ✅ Reaction emojis (hearts, likes, smiles)
- ✅ Chat integration
- ✅ Fullscreen mode
- ✅ Auto-hide controls

**Usage**:

```tsx
import { StreamPlayer } from '@/components/voice-video/StreamPlayer'

function LiveStreamPage() {
  return (
    <StreamPlayer
      metadata={{
        streamId: 'stream-123',
        title: 'Product Launch Event',
        streamer: { id: 'user-1', name: 'John Doe' },
        viewerCount: 1234,
        startedAt: new Date(),
        isLive: true,
      }}
      streamUrl="https://stream-url.com/index.m3u8"
      messages={chatMessages}
      reactions={reactions}
      onSendMessage={(msg) => console.log(msg)}
      onReaction={(type) => console.log(type)}
    />
  )
}
```

### 3. CallControls Component

**Location**: `src/components/call/call-controls.tsx`

Bottom control bar for calls with all call actions.

**Features**:

- ✅ Mute/unmute audio
- ✅ Enable/disable video
- ✅ Screen sharing toggle
- ✅ Recording (host only)
- ✅ Participant list
- ✅ Settings menu
- ✅ End call button
- ✅ Keyboard shortcuts

**Usage**:

```tsx
import { CallControls } from '@/components/call/call-controls'

function MyCallUI() {
  return (
    <CallControls
      isMuted={isMuted}
      isVideoEnabled={isVideoEnabled}
      isScreenSharing={isScreenSharing}
      showVideoControls
      showScreenShareControls
      callDuration={callDuration}
      onToggleMute={() => {}}
      onToggleVideo={() => {}}
      onToggleScreenShare={() => {}}
      onEndCall={() => {}}
      onOpenSettings={() => {}}
    />
  )
}
```

### 4. ParticipantGrid Component

**Location**: `src/components/voice-video/ParticipantGrid.tsx`

Dynamic grid layout with adaptive sizing and spotlight mode.

**Features**:

- ✅ Auto-adaptive grid (1-100+ participants)
- ✅ Spotlight mode (single participant)
- ✅ Sidebar mode (screen share + thumbnails)
- ✅ Speaking indicators
- ✅ Pin participant
- ✅ Connection quality badges
- ✅ Host controls (mute, remove)
- ✅ Pagination for 100+ participants

**Layouts**:

- `auto`: Automatically choose best layout
- `grid`: Equal-sized tiles (1x1, 2x1, 2x2, 3x3, 4x4, etc.)
- `spotlight`: One main participant
- `sidebar`: Main participant + vertical sidebar

**Usage**:

```tsx
import { ParticipantGrid } from '@/components/voice-video/ParticipantGrid'

function CallView() {
  return (
    <ParticipantGrid
      participants={remoteParticipants}
      localParticipant={localUser}
      layout="auto"
      pinnedParticipantId={pinnedId}
      isHost={isHost}
      onPinParticipant={(id) => setPinnedId(id)}
      onRemoveParticipant={(id) => removeFromCall(id)}
      onMuteParticipant={(id) => muteParticipant(id)}
    />
  )
}
```

**Participant Interface**:

```typescript
interface CallParticipant {
  id: string
  name: string
  avatarUrl?: string
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  isSpeaking: boolean
  connectionQuality?: number // 0-100
  stream?: MediaStream
  isHost?: boolean
}
```

---

## Email Service Integration

### Email Service Architecture

**Location**: `src/lib/email/email.service.ts`

Multi-provider email service with automatic fallback.

**Providers**:

1. **SendGrid** (Production) - `SENDGRID_API_KEY`
2. **SMTP** (Development) - Mailpit on `localhost:1025`
3. **Console** (Fallback) - Logs to console

**Provider Selection**:

```typescript
// Automatic provider selection
if (SENDGRID_API_KEY) → SendGrid
else if (SMTP_HOST) → SMTP
else if (development) → Console
else → Console with warning
```

### Email Templates

All templates use React Email for beautiful, responsive emails.

**Location**: `src/emails/templates/`

**Available Templates**:

1. `email-verification.tsx` - Verify email address
2. `password-reset.tsx` - Reset password link
3. `welcome.tsx` - Welcome new users
4. `new-login.tsx` - New device/location login alert
5. `password-changed.tsx` - Password change confirmation
6. `mention-notification.tsx` - User mentioned in channel
7. `dm-notification.tsx` - New direct message
8. `digest.tsx` - Daily/weekly activity summary

### Email Service Methods

```typescript
import { emailService } from '@/lib/email/email.service'

// Email verification
await emailService.sendEmailVerification({
  to: 'user@example.com',
  userName: 'John Doe',
  verificationUrl: 'https://app.com/verify?token=abc123',
  verificationCode: '123456',
  appName: 'nchat',
  expiresInHours: 24,
})

// Password reset
await emailService.sendPasswordReset({
  to: 'user@example.com',
  userName: 'John Doe',
  resetUrl: 'https://app.com/reset?token=xyz789',
  appName: 'nchat',
  expiresInMinutes: 60,
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome 120',
})

// 2FA code
await emailService.send2FACode({
  to: 'user@example.com',
  userName: 'John Doe',
  code: '123456',
  appName: 'nchat',
  expiresInMinutes: 10,
})

// Welcome email
await emailService.sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  appName: 'nchat',
  loginUrl: 'https://app.com/login',
})

// Magic link
await emailService.sendMagicLink({
  to: 'user@example.com',
  userName: 'John Doe',
  magicLinkUrl: 'https://app.com/magic?token=abc',
  appName: 'nchat',
  expiresInMinutes: 15,
})

// New login notification
await emailService.sendNewLoginNotification({
  to: 'user@example.com',
  userName: 'John Doe',
  ipAddress: '192.168.1.1',
  location: 'San Francisco, CA',
  appName: 'nchat',
})

// Password changed
await emailService.sendPasswordChangedNotification({
  to: 'user@example.com',
  userName: 'John Doe',
  ipAddress: '192.168.1.1',
  appName: 'nchat',
})
```

### Auth Routes Integration

Email service is already integrated in these routes:

1. **`/api/auth/signup`** - Sends welcome + verification emails
2. **`/api/auth/password-reset`** - Sends reset link
3. **`/api/auth/verify-email`** - Sends verification email
4. **`/api/auth/resend-verification`** - Resends verification
5. **`/api/auth/change-password`** - Sends password changed notification

---

## LiveKit Setup

### 1. Generate API Credentials

```bash
# Generate LiveKit API key and secret
LIVEKIT_API_KEY=$(openssl rand -hex 16)
LIVEKIT_API_SECRET=$(openssl rand -hex 32)

echo "LIVEKIT_API_KEY=$LIVEKIT_API_KEY"
echo "LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET"
```

### 2. Configure Environment

Add to `.env.local`:

```bash
# LiveKit Server
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880

# API Credentials
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
```

### 3. Start LiveKit Server

**Using Docker Compose**:

```bash
# Start LiveKit
docker-compose -f docker-compose.livekit.yml up -d

# Check status
docker-compose -f docker-compose.livekit.yml ps

# View logs
docker-compose -f docker-compose.livekit.yml logs -f livekit

# Stop
docker-compose -f docker-compose.livekit.yml down
```

**Verify Installation**:

```bash
# Check LiveKit API
curl http://localhost:7880/

# Should return LiveKit server info
```

### 4. Configuration Files

**`docker-compose.livekit.yml`**:

- LiveKit server container
- Port mappings (7880, 7881, 7882, 50000-60000)
- Volume mount for config
- Health checks

**`livekit.yaml`**:

- Server configuration
- Room settings (max participants, timeouts)
- WebRTC port ranges
- Audio/video codecs
- TURN server settings
- Logging configuration

### 5. Production Configuration

For production, update `livekit.yaml`:

```yaml
# Use external IP
rtc:
  use_external_ip: true
  external_ip: 'your-server-public-ip'

# Disable dev mode
dev_mode: false

# Set log level
logging:
  level: warn

# Configure proper TURN server
turn:
  enabled: true
  domain: 'turn.yourdomain.com'
  external_tls: true
```

---

## Email Configuration

### Development Setup (Mailpit)

Mailpit is included in the nself backend stack for local email testing.

**Access**:

- SMTP: `localhost:1025`
- Web UI: http://localhost:8025

**Configuration** (`.env.local`):

```bash
# Email provider (SMTP for dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=

# Sender info
EMAIL_FROM=noreply@nchat.app
EMAIL_FROM_NAME=nChat
```

**Testing**:

1. Start backend: `cd .backend && nself start`
2. Access Mailpit: http://localhost:8025
3. Trigger email (signup, password reset, etc.)
4. Check Mailpit UI for sent emails

### Production Setup (SendGrid)

**1. Get SendGrid API Key**:

- Sign up at https://sendgrid.com
- Create API key with "Mail Send" permission
- Verify sender email/domain

**2. Configure Environment** (`.env.local`):

```bash
# SendGrid
SENDGRID_API_KEY=SG.your_api_key_here

# Sender info
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
```

**3. Verify Setup**:

```bash
# Test email sending via API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "username": "testuser"
  }'
```

### Email Templates Customization

**Branding**:
Edit email templates in `src/emails/templates/`:

```tsx
// Common branding
const branding = {
  appName: 'Your App',
  logoUrl: 'https://yourdomain.com/logo.png',
  supportEmail: 'support@yourdomain.com',
  primaryColor: '#6366f1',
}
```

**Template Structure**:

```tsx
import EmailLayout from '../components/EmailLayout'
import EmailHeading from '../components/EmailHeading'
import EmailButton from '../components/EmailButton'

export default function MyEmail({ userName, actionUrl }) {
  return (
    <EmailLayout preview="Email preview text">
      <EmailHeading>Hello {userName}!</EmailHeading>
      <Text>Your email content here...</Text>
      <EmailButton href={actionUrl}>Take Action</EmailButton>
    </EmailLayout>
  )
}
```

---

## Integration Examples

### Example 1: Video Call Flow

```typescript
import { useState } from 'react'
import { CallWindow } from '@/components/voice-video/CallWindow'
import { ParticipantGrid } from '@/components/voice-video/ParticipantGrid'
import { useCallStore } from '@/stores/call-store'

function VideoCallPage() {
  const { currentCall, participants, localParticipant } = useCallStore()
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  if (!currentCall) return <div>No active call</div>

  return (
    <div className="h-screen">
      <ParticipantGrid
        participants={participants}
        localParticipant={localParticipant}
        layout="auto"
        pinnedParticipantId={pinnedId}
        isHost={currentCall.hostId === localParticipant.id}
        onPinParticipant={setPinnedId}
      />
    </div>
  )
}
```

### Example 2: Email Notification on Call Invite

```typescript
// src/app/api/calls/invite/route.ts
import { emailService } from '@/lib/email/email.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, callId, inviterName } = await request.json()

  // Get user email
  const user = await getUserById(userId)

  // Send invitation email
  await emailService.send({
    to: user.email,
    subject: `${inviterName} invited you to a call`,
    html: `
      <h1>Call Invitation</h1>
      <p>${inviterName} invited you to join a call.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/call/${callId}">
        Join Call
      </a>
    `,
  })

  return NextResponse.json({ success: true })
}
```

### Example 3: Stream with Chat

```typescript
import { StreamPlayer } from '@/components/voice-video/StreamPlayer'
import { useWebSocket } from '@/hooks/use-websocket'

function LiveStreamPage({ streamId }: { streamId: string }) {
  const { messages, sendMessage, reactions, sendReaction } = useWebSocket(streamId)

  return (
    <StreamPlayer
      metadata={{
        streamId,
        title: 'Live Event',
        streamer: { id: 'user-1', name: 'Host Name' },
        viewerCount: reactions.length,
        startedAt: new Date(),
        isLive: true,
      }}
      streamUrl={`https://stream.example.com/${streamId}/index.m3u8`}
      messages={messages}
      reactions={reactions}
      onSendMessage={sendMessage}
      onReaction={sendReaction}
    />
  )
}
```

---

## Troubleshooting

### WebRTC Issues

**Issue**: No video/audio

- Check browser permissions (camera/microphone)
- Verify LiveKit server is running
- Check WebRTC ports are open (50000-60000)
- Test with `chrome://webrtc-internals/`

**Issue**: Poor call quality

- Check network bandwidth
- Reduce max resolution in `livekit.yaml`
- Enable TURN server for NAT traversal
- Check `connectionQuality` metric

**Issue**: Connection failed

- Verify `NEXT_PUBLIC_LIVEKIT_URL` is correct
- Check LiveKit API credentials
- Ensure network can reach LiveKit server
- Check firewall rules

### Email Issues

**Issue**: Emails not sending

- Check email provider configuration
- Verify API keys are valid
- Check logs: `src/lib/email/email.service.ts`
- Test with Mailpit in development

**Issue**: Emails going to spam

- Configure SPF, DKIM, DMARC records
- Use verified sender domain
- Avoid spam trigger words
- Maintain low bounce rate

**Issue**: SendGrid errors

- Check API key permissions
- Verify sender is verified
- Check SendGrid dashboard for blocks
- Review rate limits

---

## Performance Optimization

### WebRTC Optimizations

1. **Adaptive Bitrate**:

```yaml
# livekit.yaml
limits:
  track_bitrate: 2500000 # 2.5 Mbps
```

2. **Participant Pagination**:

```typescript
// ParticipantGrid automatically paginates at 16 participants
const PARTICIPANTS_PER_PAGE = 16
```

3. **Video Resolution**:

```typescript
// Request lower resolution for thumbnails
const constraints = {
  video: { width: 320, height: 240 },
}
```

### Email Optimizations

1. **Queue System**: Use background jobs for bulk emails
2. **Rate Limiting**: Respect provider limits
3. **Batching**: Group notifications into digest emails
4. **Caching**: Cache rendered templates

---

## Security Best Practices

### WebRTC Security

1. **Token-Based Auth**: Generate LiveKit tokens server-side
2. **Room Access Control**: Verify permissions before joining
3. **Recording Consent**: Notify participants of recording
4. **E2EE**: Enable end-to-end encryption for sensitive calls

### Email Security

1. **Rate Limiting**: Prevent email spam
2. **Verification**: Verify email addresses
3. **Unsubscribe**: Include unsubscribe links
4. **Content**: Sanitize user-generated content in emails

---

## API Reference

### LiveKit Token Generation

```typescript
// src/lib/livekit/token-generator.ts
import { AccessToken } from 'livekit-server-sdk'

export function generateToken(roomName: string, participantName: string, userId: string): string {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity: userId,
    name: participantName,
  })

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  })

  return token.toJwt()
}
```

---

## Next Steps

1. **Test WebRTC Components**:

   ```bash
   pnpm dev
   # Navigate to /demo/video-call
   ```

2. **Test Email Service**:

   ```bash
   # Start Mailpit
   cd .backend && nself start

   # Open Mailpit UI
   open http://localhost:8025

   # Trigger test email
   curl -X POST http://localhost:3000/api/auth/signup -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. **Deploy LiveKit** (Production):
   - Use managed service: https://cloud.livekit.io
   - Or self-host with Kubernetes
   - Configure SSL/TLS
   - Set up monitoring

4. **Configure SendGrid** (Production):
   - Verify domain
   - Configure DNS records (SPF, DKIM, DMARC)
   - Set up webhooks
   - Monitor deliverability

---

## Support

- **Documentation**: `/docs`
- **Examples**: `/examples`
- **LiveKit Docs**: https://docs.livekit.io
- **SendGrid Docs**: https://docs.sendgrid.com
- **React Email**: https://react.email

---

## License

Same as nself-chat project.
