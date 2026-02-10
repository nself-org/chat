# Media Server Setup Guide

Complete guide for setting up the media server infrastructure for nself-chat v0.4.0.

## Overview

The media server provides scalable audio/video communication using:

- **MediaSoup SFU** - Selective Forwarding Unit for efficient media routing
- **coturn** - TURN/STUN server for NAT traversal
- **FFmpeg** - Recording and transcoding
- **Redis** - Coordination and state management
- **Socket.IO** - Real-time signaling

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Media Server │────▶│  MediaSoup  │
│  (WebRTC)   │◀────│  (Socket.IO) │◀────│   Workers   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ TURN/STUN   │     │    Redis     │     │   FFmpeg    │
│  (coturn)   │     │ (State/Sync) │     │ (Recording) │
└─────────────┘     └──────────────┘     └─────────────┘
```

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- pnpm 9.15+ (optional, for dependency management)
- Open ports: 3100, 3478, 40000-49999

### 2. Automated Setup

```bash
cd .backend
chmod +x scripts/setup-media-server.sh
./scripts/setup-media-server.sh
```

The script will:

1. Detect your public IP address
2. Generate secure secrets
3. Create configuration files
4. Setup directories
5. Build Docker images
6. Start services

### 3. Verify Installation

```bash
chmod +x scripts/test-media-server.sh
./scripts/test-media-server.sh
```

### 4. Access Services

- **Media Server API**: http://localhost:3100
- **Health Check**: http://localhost:3100/api/health
- **TURN Server**: turn:localhost:3478
- **Redis**: localhost:6379

## Manual Setup

### 1. Create Environment File

```bash
cd .backend
cp .env.media.example .env.media
```

Edit `.env.media`:

```bash
# Public IP (replace with your server's public IP)
MEDIA_SERVER_PUBLIC_IP=your.public.ip.address
TURN_EXTERNAL_IP=your.public.ip.address

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your-secure-jwt-secret-here
TURN_CREDENTIAL=your-turn-credential-here

# MediaSoup Workers (match CPU cores)
MEDIASOUP_NUM_WORKERS=4

# Recording
RECORDING_ENABLED=true

# CORS (your frontend URL)
CORS_ORIGIN=https://your-frontend.com
```

### 2. Build and Start

```bash
# Build images
docker-compose -f docker-compose.media.yml build

# Start services
docker-compose -f docker-compose.media.yml up -d

# Check logs
docker-compose -f docker-compose.media.yml logs -f
```

### 3. Configure TURN Server

Edit `.backend/coturn/turnserver.conf` if needed:

```conf
# Update realm
realm=your-domain.com

# Add static users
user=username:password

# Set external IP
external-ip=YOUR_PUBLIC_IP
```

Restart coturn:

```bash
docker-compose -f docker-compose.media.yml restart coturn
```

## Frontend Integration

### 1. Install Client SDK

```bash
cd /path/to/frontend
pnpm add mediasoup-client socket.io-client
```

### 2. Configure Environment

```bash
# .env.local
NEXT_PUBLIC_MEDIA_SERVER_URL=http://localhost:3100
NEXT_PUBLIC_MEDIA_SERVER_WS=ws://localhost:3100
```

### 3. Create Media Client

```typescript
// src/lib/media/media-client.ts
import { io, Socket } from 'socket.io-client'
import { Device } from 'mediasoup-client'

export class MediaClient {
  private socket: Socket
  private device: Device

  constructor(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_MEDIA_SERVER_WS!, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    this.device = new Device()
  }

  async joinRoom(roomId: string, userId: string, displayName: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', { roomId, userId, displayName }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      })
    })
  }

  // ... more methods
}
```

### 4. Use in Components

```typescript
// src/components/call/VideoCall.tsx
import { useEffect, useState } from 'react';
import { MediaClient } from '@/lib/media/media-client';

export function VideoCall({ roomId, token }: Props) {
  const [client, setClient] = useState<MediaClient | null>(null);

  useEffect(() => {
    const mediaClient = new MediaClient(token);

    mediaClient.joinRoom(roomId, userId, displayName)
      .then(() => {
        setClient(mediaClient);
      })
      .catch(console.error);

    return () => {
      mediaClient.disconnect();
    };
  }, [roomId]);

  return (
    <div>
      {/* Video elements */}
    </div>
  );
}
```

## Configuration

### MediaSoup Settings

```typescript
// Adjust in .backend/custom-services/media-server/src/config.ts

mediasoup: {
  numWorkers: 4,  // Match CPU cores
  rtcMinPort: 40000,
  rtcMaxPort: 49999,

  // Audio codecs
  audioCodecs: ['opus'],

  // Video codecs
  videoCodecs: ['VP8', 'VP9', 'H264'],
}
```

### Recording Settings

```bash
# .env.media
RECORDING_ENABLED=true
RECORDING_DIR=/recordings
RECORDING_MAX_SIZE_MB=1000

# Video settings
RECORDING_VIDEO_CODEC=libx264
RECORDING_AUDIO_CODEC=aac
RECORDING_RESOLUTION=1280x720
RECORDING_FRAME_RATE=30
```

### Load Balancing

```bash
# .env.media
INSTANCE_ID=media-server-1
MAX_ROOMS_PER_INSTANCE=100
MAX_PARTICIPANTS_PER_ROOM=50
```

## Production Deployment

### 1. Enable TLS for TURN

Generate SSL certificates:

```bash
openssl req -x509 -newkey rsa:4096 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes
```

Update `turnserver.conf`:

```conf
# Enable TLS
cert=/etc/coturn/cert.pem
pkey=/etc/coturn/key.pem

# Remove these lines
# no-tls
# no-dtls
```

### 2. Configure Firewall

```bash
# Allow media server
sudo ufw allow 3100/tcp

# Allow TURN/STUN
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp

# Allow RTC ports
sudo ufw allow 40000:49999/tcp
sudo ufw allow 40000:49999/udp

# Allow relay ports
sudo ufw allow 49152:65535/udp
```

### 3. Use Environment-Specific Config

```bash
# Production
MEDIA_SERVER_PUBLIC_IP=production.ip
MEDIASOUP_NUM_WORKERS=8
LOG_LEVEL=warn
CORS_ORIGIN=https://your-domain.com

# Staging
MEDIA_SERVER_PUBLIC_IP=staging.ip
MEDIASOUP_NUM_WORKERS=4
LOG_LEVEL=info
```

### 4. Setup Monitoring

Enable Prometheus and Grafana:

```bash
docker-compose -f docker-compose.media.yml --profile monitoring up -d
```

Access dashboards:

- **Prometheus**: http://localhost:9091
- **Grafana**: http://localhost:3001 (admin/admin)

### 5. Scale with Multiple Instances

```bash
# Start multiple media servers
docker-compose -f docker-compose.media.yml up -d --scale media-server=3

# Use load balancer (nginx, haproxy, etc.)
upstream media_servers {
    least_conn;
    server media-server-1:3100;
    server media-server-2:3100;
    server media-server-3:3100;
}
```

## Monitoring

### Check Service Health

```bash
# Health endpoint
curl http://localhost:3100/api/health

# Server stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3100/api/stats

# Docker logs
docker-compose -f docker-compose.media.yml logs -f media-server
```

### Metrics

The media server exposes metrics at `/metrics`:

```bash
curl http://localhost:3100/metrics
```

Key metrics:

- `media_rooms_total` - Total active rooms
- `media_participants_total` - Total active participants
- `media_recordings_active` - Active recordings
- `media_workers_busy` - Busy worker count
- `media_memory_usage` - Memory usage

### View Container Stats

```bash
docker stats nself-media-server
docker stats nself-coturn
docker stats nself-redis-media
```

## Troubleshooting

### Issue: Cannot Connect to Media Server

**Solution:**

1. Check if service is running:

   ```bash
   docker ps | grep media-server
   ```

2. Check logs:

   ```bash
   docker logs nself-media-server
   ```

3. Verify port is open:
   ```bash
   netstat -tuln | grep 3100
   ```

### Issue: TURN Server Not Working

**Solution:**

1. Test TURN connectivity:

   ```bash
   # Install coturn-utils
   sudo apt-get install coturn-utils

   # Test TURN
   turnutils_uclient -v \
     -u username -w password \
     localhost
   ```

2. Check external IP is set correctly:

   ```bash
   docker logs nself-coturn | grep "External IP"
   ```

3. Verify firewall allows TURN ports

### Issue: Poor Video Quality

**Solution:**

1. Adjust bandwidth settings in `config.ts`:

   ```typescript
   maxIncomingBitrate: 2000000,  // 2 Mbps
   initialAvailableOutgoingBitrate: 1500000,  // 1.5 Mbps
   ```

2. Enable simulcast for adaptive quality:
   ```typescript
   // Client-side
   const producer = await transport.produce({
     track: videoTrack,
     encodings: [
       { maxBitrate: 100000 }, // Low
       { maxBitrate: 500000 }, // Medium
       { maxBitrate: 1500000 }, // High
     ],
     codecOptions: {
       videoGoogleStartBitrate: 1000,
     },
   })
   ```

### Issue: Recording Fails

**Solution:**

1. Check FFmpeg is installed:

   ```bash
   docker exec nself-media-server which ffmpeg
   ```

2. Check recording directory permissions:

   ```bash
   docker exec nself-media-server ls -la /recordings
   ```

3. Check disk space:
   ```bash
   df -h
   ```

### Issue: Redis Connection Failed

**Solution:**

1. Ensure Redis is running:

   ```bash
   docker ps | grep redis
   ```

2. Test connection:

   ```bash
   docker exec nself-redis-media redis-cli ping
   ```

3. Check network:
   ```bash
   docker network inspect nself-network
   ```

## API Reference

### REST Endpoints

#### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T12:00:00Z",
  "instanceId": "media-server-1"
}
```

#### GET /api/stats

Get server statistics (requires authentication).

**Headers:**

- `Authorization: Bearer <token>`

**Response:**

```json
{
  "workers": { "total": 4 },
  "rooms": { "total": 5 },
  "participants": { "total": 12 },
  "recordings": { "active": 2 },
  "uptime": 3600,
  "memory": { "heapUsed": 128000000 }
}
```

#### GET /api/ice-servers

Get ICE server configuration (requires authentication).

**Response:**

```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    {
      "urls": "turn:localhost:3478",
      "username": "nself",
      "credential": "secret"
    }
  ]
}
```

#### POST /api/rooms/:roomId

Create or get room.

**Response:**

```json
{
  "roomId": "room-123",
  "routerId": "router-456",
  "participantCount": 3
}
```

#### POST /api/rooms/:roomId/recordings

Start recording.

**Response:**

```json
{
  "id": "recording-123",
  "roomId": "room-123",
  "status": "active",
  "startedAt": "2024-01-30T12:00:00Z"
}
```

### Socket.IO Events

#### Client → Server

- `join-room` - Join a room
- `create-transport` - Create WebRTC transport
- `connect-transport` - Connect transport
- `produce` - Start producing media
- `consume` - Start consuming media
- `pause-producer` - Pause producer
- `resume-producer` - Resume producer
- `leave-room` - Leave room

#### Server → Client

- `participant-joined` - New participant joined
- `participant-left` - Participant left
- `new-producer` - New producer available
- `producer-paused` - Producer paused
- `producer-resumed` - Producer resumed
- `producer-closed` - Producer closed

## Performance Tuning

### System Limits

Increase file descriptor limits for high-concurrency:

```bash
# /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

### Docker Resources

Allocate more resources to media server:

```yaml
# docker-compose.media.yml
media-server:
  deploy:
    resources:
      limits:
        cpus: '4.0'
        memory: 4G
      reservations:
        cpus: '2.0'
        memory: 2G
```

### Network Optimization

Use host network mode for better performance:

```yaml
media-server:
  network_mode: host
```

**Note:** This removes Docker network isolation.

## Security Best Practices

1. **Use Strong Secrets**

   ```bash
   openssl rand -base64 32
   ```

2. **Enable TLS/DTLS**
   - Configure SSL certificates for TURN
   - Use HTTPS for media server API

3. **Restrict CORS**

   ```bash
   CORS_ORIGIN=https://your-domain.com
   ```

4. **Implement Rate Limiting**

   ```bash
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=60000
   ```

5. **Use Firewall Rules**
   - Only allow necessary ports
   - Restrict access to monitoring endpoints

6. **Regular Updates**
   ```bash
   docker-compose -f docker-compose.media.yml pull
   docker-compose -f docker-compose.media.yml up -d
   ```

## Next Steps

1. ✅ Media server infrastructure setup
2. 📝 Implement frontend WebRTC client
3. 📝 Add call management UI
4. 📝 Implement screen sharing
5. 📝 Add recording playback
6. 📝 Setup monitoring dashboards

## Additional Resources

- [MediaSoup Documentation](https://mediasoup.org/)
- [coturn Documentation](https://github.com/coturn/coturn)
- [WebRTC Best Practices](https://webrtc.org/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

## Support

For issues or questions:

- Check logs: `docker-compose -f docker-compose.media.yml logs -f`
- Run tests: `./scripts/test-media-server.sh`
- Review configuration: `.env.media` and `turnserver.conf`
