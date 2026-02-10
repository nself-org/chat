# Live Streaming Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
pnpm install
# hls.js is already added
```

### 2. Run Database Migration

```bash
cd .backend
nself db migrate up
# This will run migration 016_live_streaming.sql
```

### 3. Configure Environment Variables

Add to `.env.local`:

```bash
# Stream Ingest (RTMP/WebRTC endpoint)
NEXT_PUBLIC_STREAM_INGEST_URL=rtmp://localhost:1935/live

# HLS Base URL (where .m3u8 manifests are served)
NEXT_PUBLIC_HLS_BASE_URL=http://localhost:8080/hls

# Recording
STREAM_RECORDING_ENABLED=true
STREAM_RECORDING_PATH=/var/recordings
```

### 4. Setup Media Server

#### Option A: Quick Test with NGINX-RTMP

```bash
# Install NGINX with RTMP module
brew install nginx-full --with-rtmp-module  # macOS
# OR
apt-get install nginx libnginx-mod-rtmp    # Ubuntu

# Configure (see nginx.conf in docs)
sudo nginx -c /path/to/nginx.conf
```

#### Option B: Ant Media Server (Production)

```bash
# Download and install
wget https://github.com/ant-media/Ant-Media-Server/releases/download/ams-v2.7.0/ant-media-server-2.7.0.zip
unzip ant-media-server-2.7.0.zip
cd ant-media-server
./start.sh

# Access: http://localhost:5080
```

## Usage

### Broadcasting (Create a Stream)

```typescript
import { StreamBroadcaster } from '@/components/streaming/StreamBroadcaster'

export default function BroadcastPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Go Live</h1>
      <StreamBroadcaster
        channelId="your-channel-id"
        onStreamEnded={() => {
          console.log('Stream ended')
          // Redirect or show analytics
        }}
      />
    </div>
  )
}
```

### Viewing (Watch a Stream)

```typescript
import { StreamViewer } from '@/components/streaming/StreamViewer'

export default function WatchPage({ params }: { params: { streamId: string } }) {
  return (
    <div className="container mx-auto py-8">
      <StreamViewer
        streamId={params.streamId}
        onStreamEnded={() => {
          console.log('Stream ended')
          // Show "Stream ended" message
        }}
      />
    </div>
  )
}
```

### Programmatic Control

```typescript
import { useLiveStream } from '@/hooks/use-live-stream'

function CustomBroadcaster() {
  const {
    stream,
    isBroadcasting,
    viewerCount,
    createStream,
    startBroadcast,
    endStream,
  } = useLiveStream()

  const handleGoLive = async () => {
    // 1. Create stream
    const newStream = await createStream({
      channelId: 'channel-id',
      title: 'My Awesome Stream',
      description: 'Join me live!',
      maxResolution: '720p',
      enableChat: true,
      enableReactions: true,
    })

    // 2. Start broadcasting
    await startBroadcast('720p')
  }

  return (
    <div>
      {!isBroadcasting ? (
        <button onClick={handleGoLive}>Go Live</button>
      ) : (
        <>
          <p>Live with {viewerCount} viewers</p>
          <button onClick={endStream}>End Stream</button>
        </>
      )}
    </div>
  )
}
```

## Testing

### 1. Test with OBS Studio

1. **Download OBS**: https://obsproject.com/
2. **Configure**:
   - Settings → Stream
   - Service: Custom
   - Server: `rtmp://localhost:1935/live`
   - Stream Key: Copy from your stream (after creating)
3. **Start Streaming**

### 2. Test Playback

```html
<!-- Test HLS playback directly -->
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  </head>
  <body>
    <video id="video" controls style="width: 100%; max-width: 800px;"></video>
    <script>
      const video = document.getElementById('video')
      const hls = new Hls({
        lowLatencyMode: true,
      })
      hls.loadSource('http://localhost:8080/hls/STREAM_KEY.m3u8')
      hls.attachMedia(video)
      video.play()
    </script>
  </body>
</html>
```

### 3. Test via API

```bash
# Create a stream
curl -X POST http://localhost:3000/api/streams/create \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel-uuid",
    "title": "Test Stream",
    "description": "Testing"
  }'

# Response will include stream_key and ingest_url
```

## Features

### ✅ Implemented

- [x] WebRTC broadcast client
- [x] HLS player with adaptive bitrate
- [x] Stream creation and management
- [x] Viewer tracking
- [x] Live chat
- [x] Emoji reactions with animations
- [x] Quality metrics collection
- [x] Stream analytics
- [x] Scheduled streams (database ready)
- [x] Multi-quality transcoding (server-side)
- [x] Recording support (server-side)

### 🚧 To Complete

- [ ] API routes implementation
  - [x] POST /api/streams/create ✓
  - [ ] POST /api/streams/:id/start
  - [ ] POST /api/streams/:id/end
  - [ ] GET /api/streams/:id/hls
  - [ ] GET /api/streams/:id/viewers
  - [ ] POST /api/streams/:id/chat
  - [ ] POST /api/streams/:id/reactions

- [ ] Socket.io integration
  - [ ] Real-time chat delivery
  - [ ] Reaction broadcasting
  - [ ] Viewer count updates
  - [ ] Stream start/end notifications

- [ ] UI Components
  - [x] StreamBroadcaster ✓
  - [x] StreamViewer ✓
  - [ ] StreamScheduler
  - [ ] StreamSettings
  - [ ] StreamAnalytics
  - [ ] StreamList (browse live streams)

- [ ] Media Server Integration
  - [ ] WebRTC SDP signaling
  - [ ] HLS manifest serving
  - [ ] Recording management

## Directory Structure

```
src/
├── lib/streaming/
│   ├── stream-types.ts          # TypeScript types
│   ├── hls-player.ts            # HLS player manager
│   ├── stream-client.ts         # WebRTC broadcaster
│   ├── stream-manager.ts        # Stream CRUD API
│   ├── stream-analytics.ts      # Analytics collector
│   ├── adaptive-bitrate.ts      # ABR logic
│   └── index.ts                 # Exports
│
├── hooks/
│   ├── use-live-stream.ts       # Broadcaster hook
│   ├── use-stream-viewer.ts     # Viewer hook
│   ├── use-stream-chat.ts       # Chat hook
│   └── use-stream-reactions.ts  # Reactions hook
│
├── components/streaming/
│   ├── StreamBroadcaster.tsx    # Broadcaster UI
│   ├── StreamViewer.tsx         # Viewer UI
│   ├── StreamScheduler.tsx      # Schedule streams
│   └── StreamSettings.tsx       # Stream configuration
│
└── app/api/streams/
    ├── create/route.ts          # Create stream
    ├── [id]/route.ts            # Get/update stream
    ├── [id]/start/route.ts      # Start stream
    ├── [id]/end/route.ts        # End stream
    ├── [id]/hls/route.ts        # Get HLS manifest
    ├── [id]/viewers/route.ts    # Get viewer count
    ├── [id]/chat/route.ts       # Chat messages
    └── [id]/reactions/route.ts  # Reactions
```

## Common Issues

### Issue: "Stream not found"

**Solution**: Verify streamId and ensure stream status is 'live'

### Issue: "HLS manifest not loading"

**Solution**: Check NEXT_PUBLIC_HLS_BASE_URL and media server status

### Issue: "WebRTC connection failed"

**Solution**:

- Check browser permissions (camera/microphone)
- Verify STUN/TURN server configuration
- Check firewall settings

### Issue: "High latency"

**Solution**:

- Enable lowLatencyMode in HLS player
- Reduce HLS fragment size (2s)
- Check network bandwidth
- Use LL-HLS if supported

### Issue: "Chat messages not appearing"

**Solution**:

- Check Socket.io connection
- Verify authentication
- Check browser console for errors

## Next Steps

1. **Complete API Routes**: Implement remaining stream API endpoints
2. **Socket.io Integration**: Connect real-time events
3. **Media Server**: Setup production-ready media server (Ant Media Server)
4. **CDN**: Configure CDN for HLS distribution
5. **Mobile Apps**: Test on Capacitor/React Native
6. **Load Testing**: Test with multiple concurrent streams
7. **Monitoring**: Setup Grafana dashboards for stream health

## Resources

- **HLS.js Docs**: https://github.com/video-dev/hls.js/
- **WebRTC Guide**: https://webrtc.org/
- **Ant Media Server**: https://antmedia.io/
- **NGINX-RTMP**: https://github.com/arut/nginx-rtmp-module
- **FFmpeg**: https://ffmpeg.org/

## Support

Questions? Issues?

- Check main documentation: `docs/Live-Streaming-Implementation.md`
- Review code comments in source files
- Check browser console for errors
- Review backend logs: `.backend/logs/`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-30
**Status**: Beta - Core features implemented, API routes in progress
