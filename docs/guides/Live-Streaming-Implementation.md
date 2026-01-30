# Live Streaming Implementation Guide

## Overview

Comprehensive live streaming system for nself-chat v0.4.0 featuring:
- WebRTC broadcast ingest
- HLS adaptive streaming distribution
- Low latency (<5 seconds)
- Interactive features (chat, reactions, Q&A)
- Stream recording and replay
- Scheduled streams
- Analytics and quality metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Live Streaming Flow                      │
└─────────────────────────────────────────────────────────────┘

Broadcaster                Media Server            Viewers
    │                           │                      │
    ├─ WebRTC Stream ──────────>│                      │
    │  (Camera + Mic)            │                      │
    │                            │                      │
    │                      ┌─────▼──────┐              │
    │                      │  Transcoder │              │
    │                      │   (FFmpeg)  │              │
    │                      └─────┬──────┘              │
    │                            │                      │
    │                      ┌─────▼──────┐              │
    │                      │ HLS Packager│              │
    │                      │  (Multiple  │              │
    │                      │ Qualities)  │              │
    │                      └─────┬──────┘              │
    │                            │                      │
    │                      ┌─────▼──────┐              │
    │                      │ HLS Manifest│              │
    │                      │  + Segments │              │
    │                      └─────┬──────┘              │
    │                            │                      │
    │                            ├─ HLS Stream ────────>│
    │                            │  (Adaptive)          │
    │                            │                      │
    ├─ Chat/Reactions ──────────┼────────────────────>│
    │  (Socket.io)               │  (Socket.io)        │
    │                            │                      │
    ├─ Quality Metrics ─────────>│                      │
    │  (Every 5s)                │                      │
    │                            │                      │
    │<─ Viewer Count ───────────┼──────────────────────┤
    │  (Real-time)               │                      │
```

## Database Schema

### Tables

1. **nchat_streams** - Main stream table
   - Stream details (title, description, thumbnail)
   - Scheduling (scheduled_at, started_at, ended_at)
   - Status (scheduled, preparing, live, ended, cancelled)
   - Configuration (quality, bitrate, FPS)
   - Statistics (peak viewers, total views, messages, reactions)

2. **nchat_stream_viewers** - Viewer tracking
   - Session management
   - Watch time tracking
   - Quality selection
   - Engagement metrics

3. **nchat_stream_quality_metrics** - Real-time metrics
   - Viewer count
   - Bitrate, FPS, resolution
   - Network stats (latency, packet loss)
   - Health score

4. **nchat_stream_chat_messages** - Live chat
   - Message content
   - Pinning support
   - Moderation (deletion)

5. **nchat_stream_reactions** - Emoji reactions
   - Emoji with position
   - Real-time delivery

### Migration

```sql
-- Run migration
cd .backend
nself db migrate up 016_live_streaming.sql
```

## Core Libraries

### 1. Stream Types (`src/lib/streaming/stream-types.ts`)
- TypeScript interfaces for all streaming entities
- Enums for status, quality levels, chat modes
- Error classes

### 2. HLS Player (`src/lib/streaming/hls-player.ts`)
- HLS.js wrapper for video playback
- Adaptive bitrate streaming
- Quality level selection
- Low-latency mode support
- Statistics monitoring

### 3. Stream Client (`src/lib/streaming/stream-client.ts`)
- WebRTC broadcaster client
- Camera/microphone access
- Device switching
- Quality adjustment
- Metrics reporting

### 4. Stream Manager (`src/lib/streaming/stream-manager.ts`)
- High-level API for stream CRUD
- Stream lifecycle (create, start, end)
- Query operations (live, scheduled, past)
- Viewer management

### 5. Stream Analytics (`src/lib/streaming/stream-analytics.ts`)
- Event tracking (joins, leaves, chat, reactions)
- Buffering monitoring
- Quality metrics collection
- Engagement calculations

### 6. Adaptive Bitrate (`src/lib/streaming/adaptive-bitrate.ts`)
- Bandwidth estimation (EWMA, sliding window)
- Level selection algorithms
- Buffer-based ABR
- Quality switching logic

## React Hooks

### 1. `useLiveStream` (Broadcaster)

```typescript
import { useLiveStream } from '@/hooks/use-live-stream'

function BroadcasterComponent() {
  const {
    stream,
    isStarting,
    isBroadcasting,
    localStream,
    viewerCount,
    duration,
    createStream,
    startBroadcast,
    stopBroadcast,
    endStream,
    toggleVideo,
    toggleAudio,
  } = useLiveStream({
    onStreamStarted: (stream) => console.log('Live!', stream),
    onStreamEnded: (stream) => console.log('Ended', stream),
  })

  const handleGoLive = async () => {
    // Create stream
    const newStream = await createStream({
      channelId: 'channel-id',
      title: 'My Live Stream',
      description: 'Streaming now!',
    })

    // Start broadcasting at 720p
    await startBroadcast('720p')
  }

  return (
    <div>
      {localStream && (
        <video
          ref={(el) => {
            if (el) el.srcObject = localStream
          }}
          autoPlay
          muted
        />
      )}
      <div>Viewers: {viewerCount}</div>
      <div>Duration: {formatDuration(duration)}</div>
      <button onClick={handleGoLive}>Go Live</button>
      <button onClick={endStream}>End Stream</button>
    </div>
  )
}
```

### 2. `useStreamViewer` (Viewer)

```typescript
import { useStreamViewer } from '@/hooks/use-stream-viewer'

function ViewerComponent({ streamId }: { streamId: string }) {
  const {
    stream,
    isLoading,
    isPlaying,
    currentQuality,
    viewerCount,
    videoRef,
    play,
    pause,
    setQuality,
  } = useStreamViewer({
    streamId,
    autoStart: true,
    lowLatencyMode: true,
  })

  return (
    <div>
      <video ref={videoRef} controls />
      <div>Viewers: {viewerCount}</div>
      <div>Quality: {currentQuality}</div>
      <button onClick={() => setQuality('1080p')}>1080p</button>
      <button onClick={() => setQuality('720p')}>720p</button>
      <button onClick={() => setQuality('auto')}>Auto</button>
    </div>
  )
}
```

### 3. `useStreamChat`

```typescript
import { useStreamChat } from '@/hooks/use-stream-chat'

function StreamChatComponent({ streamId }: { streamId: string }) {
  const {
    messages,
    isSending,
    sendMessage,
    pinMessage,
  } = useStreamChat({ streamId })

  const [input, setInput] = useState('')

  const handleSend = async () => {
    await sendMessage(input)
    setInput('')
  }

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.isPinned ? 'pinned' : ''}>
            <strong>{msg.user?.displayName}:</strong> {msg.content}
            {!msg.isPinned && (
              <button onClick={() => pinMessage(msg.id)}>Pin</button>
            )}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Send a message..."
        maxLength={500}
      />
      <button onClick={handleSend} disabled={isSending}>
        Send
      </button>
    </div>
  )
}
```

### 4. `useStreamReactions`

```typescript
import { useStreamReactions } from '@/hooks/use-stream-reactions'

function StreamReactionsComponent({ streamId }: { streamId: string }) {
  const { recentReactions, sendReaction } = useStreamReactions({
    streamId,
    onNewReaction: (reaction) => console.log('New reaction!', reaction),
  })

  const emojis = ['👍', '❤️', '😂', '🔥', '🎉']

  return (
    <div>
      {/* Emoji picker */}
      <div className="emoji-picker">
        {emojis.map((emoji) => (
          <button key={emoji} onClick={() => sendReaction(emoji)}>
            {emoji}
          </button>
        ))}
      </div>

      {/* Animated reactions */}
      <div className="reactions-overlay">
        {recentReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="reaction-bubble animate-float-up"
            style={{
              left: `${reaction.positionX ?? 50}%`,
              bottom: 0,
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Routes

### Create Stream
```
POST /api/streams/create
Body: { channelId, title, description, scheduledAt?, ... }
```

### Start Stream
```
POST /api/streams/:id/start
```

### End Stream
```
POST /api/streams/:id/end
```

### Get Stream
```
GET /api/streams/:id
```

### Get Live Streams
```
GET /api/streams/live?channelId=...
```

### Get HLS Manifest
```
GET /api/streams/:id/hls
Response: { manifestUrl: "https://..." }
```

### Viewer Count
```
GET /api/streams/:id/viewers
Response: { count: 42 }
```

### Chat Operations
```
GET    /api/streams/:id/chat           # Get messages
POST   /api/streams/:id/chat           # Send message
DELETE /api/streams/:id/chat/:msgId    # Delete message
POST   /api/streams/:id/chat/:msgId/pin # Pin message
```

### Reactions
```
POST /api/streams/:id/reactions
Body: { emoji, positionX?, positionY? }
```

## UI Components

### StreamBroadcaster
Full broadcaster UI with:
- Preview/Live video display
- Go Live button
- Camera/microphone selection
- Quality settings
- Viewer count
- Duration counter
- Chat integration
- End stream button

### StreamViewer
Viewer interface with:
- HLS video player
- Quality selector
- Volume controls
- Live indicator
- Viewer count
- Latency display
- Chat panel
- Reaction buttons

### StreamScheduler
Schedule streams for future:
- Date/time picker
- Channel selection
- Stream details
- Notification settings

### StreamSettings
Configure stream:
- Title and description
- Thumbnail upload
- Quality presets (1080p, 720p, 480p, 360p)
- Bitrate limits
- Enable/disable chat
- Enable/disable reactions
- Chat mode (open, followers, subscribers)

## Media Server Setup

### Option 1: Ant Media Server (Recommended)

```bash
# Install Ant Media Server
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.X.X/ant-media-server-2.X.X.zip
unzip ant-media-server-2.X.X.zip
cd ant-media-server
./start.sh

# Configure
# - WebRTC to RTMP Bridge
# - HLS packaging with adaptive bitrate
# - Enable low-latency mode
```

### Option 2: OBS + NGINX-RTMP

```nginx
# nginx.conf
rtmp {
  server {
    listen 1935;
    application live {
      live on;
      record off;

      # HLS
      hls on;
      hls_path /tmp/hls;
      hls_fragment 2s;
      hls_playlist_length 10s;

      # Transcoding
      exec ffmpeg -i rtmp://localhost/live/$name
        -c:v libx264 -preset veryfast
        -b:v 3000k -maxrate 3000k -bufsize 6000k -s 1920x1080 -r 30 -g 60 -f flv rtmp://localhost/hls/$name_1080p
        -c:v libx264 -preset veryfast
        -b:v 1500k -maxrate 1500k -bufsize 3000k -s 1280x720 -r 30 -g 60 -f flv rtmp://localhost/hls/$name_720p
        -c:v libx264 -preset veryfast
        -b:v 800k -maxrate 800k -bufsize 1600k -s 854x480 -r 24 -g 48 -f flv rtmp://localhost/hls/$name_480p
        -c:v libx264 -preset veryfast
        -b:v 400k -maxrate 400k -bufsize 800k -s 640x360 -r 24 -g 48 -f flv rtmp://localhost/hls/$name_360p;
    }
  }
}

http {
  server {
    listen 8080;

    location /hls {
      types {
        application/vnd.apple.mpegurl m3u8;
        video/mp2t ts;
      }
      root /tmp;
      add_header Cache-Control no-cache;
      add_header Access-Control-Allow-Origin *;
    }
  }
}
```

### Option 3: LiveKit (Cloud/Self-Hosted)

```bash
# Install LiveKit
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  -v $PWD/livekit.yaml:/livekit.yaml \
  livekit/livekit-server --config /livekit.yaml
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STREAM_INGEST_URL=rtmp://localhost:1935/live
NEXT_PUBLIC_HLS_BASE_URL=https://your-cdn.com/hls
STREAM_RECORDING_ENABLED=true
STREAM_RECORDING_PATH=/var/recordings
```

## Socket.io Events

### Broadcaster → Server
- `stream:start` - Stream went live
- `stream:end` - Stream ended
- `stream:quality-update` - Quality metrics

### Viewer ↔ Server
- `stream:viewer-joined` - Viewer joined
- `stream:viewer-left` - Viewer left
- `stream:viewer-count` - Viewer count update

### Chat Events
- `stream:chat-message` - New chat message
- `stream:chat-deleted` - Message deleted
- `stream:chat-pinned` - Message pinned

### Reaction Events
- `stream:reaction` - Emoji reaction sent

## Testing

### Test Stream Creation
```bash
curl -X POST http://localhost:3000/api/streams/create \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel-uuid",
    "title": "Test Stream",
    "description": "Testing live streaming"
  }'
```

### Test with OBS
1. Open OBS Studio
2. Settings → Stream
3. Service: Custom
4. Server: `rtmp://localhost:1935/live`
5. Stream Key: [your-stream-key]
6. Start Streaming

### Test HLS Playback
```html
<video id="video" controls></video>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
  const video = document.getElementById('video')
  const hls = new Hls()
  hls.loadSource('https://your-server/hls/stream.m3u8')
  hls.attachMedia(video)
</script>
```

## Performance Optimization

### 1. HLS Configuration
- **Fragment Size**: 2-3 seconds for low latency
- **Playlist Length**: 6-10 seconds
- **Max Buffer**: 30 seconds
- **Target Latency**: 3-5 seconds

### 2. Transcoding
- Use hardware acceleration (NVENC, Quick Sync, VA-API)
- Preset: veryfast for real-time
- GOP size: 2x framerate for faster seeking

### 3. CDN Integration
- Distribute HLS segments via CDN
- Edge caching for manifest and segments
- Geographic distribution

### 4. Database Optimization
- Index on `status` and `channel_id` for live stream queries
- Partition `stream_quality_metrics` by month
- Archive old streams to cold storage

## Monitoring & Analytics

### Key Metrics
- Peak concurrent viewers
- Average watch time
- Buffering ratio
- Chat engagement rate
- Reaction rate
- Quality switching frequency

### Dashboards
- Real-time viewer count
- Stream health (bitrate, FPS, dropped frames)
- Geographic distribution
- Device/browser breakdown
- Network quality distribution

## Future Enhancements

1. **Multi-bitrate Recording** - Record at multiple qualities
2. **VOD Processing** - Automatic highlights, chapters
3. **Stream Rewind** - DVR functionality
4. **Clips Creation** - User-generated clips
5. **Simulcast** - Stream to multiple platforms (YouTube, Twitch)
6. **Interactive Polls** - Live audience polls
7. **Guest Speakers** - Multi-broadcaster streams
8. **Monetization** - Paid streams, donations, subscriptions
9. **Moderation Tools** - Auto-mod, slow mode, emote-only
10. **Analytics Export** - CSV/PDF reports

## Troubleshooting

### Stream Not Starting
- Check WebRTC permissions
- Verify stream key
- Check media server logs
- Test network connectivity

### High Latency
- Enable low-latency mode in HLS player
- Reduce buffer size
- Check network bandwidth
- Use LL-HLS if supported

### Buffering Issues
- Lower quality level
- Check upload bandwidth (broadcaster)
- Check download bandwidth (viewer)
- Verify CDN performance

### Chat Not Working
- Check Socket.io connection
- Verify authentication
- Check RLS policies in database
- Monitor message rate limits

## Support

For issues or questions:
1. Check logs: `.backend/logs/`
2. Review Hasura console for GraphQL errors
3. Check Socket.io connection in browser dev tools
4. Review database RLS policies

## License

See main project LICENSE file.
