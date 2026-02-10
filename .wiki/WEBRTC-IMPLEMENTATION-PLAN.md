# WebRTC Voice/Video Calls & Live Streaming Implementation Plan

**Version**: 1.0.0
**Date**: 2026-02-03
**Status**: Planning
**Related Tasks**: TODO.md Tasks 71-77 (Phase 8)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Media Server Selection](#3-media-server-selection)
4. [Required Components](#4-required-components)
5. [API Endpoints](#5-api-endpoints)
6. [Database Schema](#6-database-schema)
7. [Client Implementation](#7-client-implementation)
8. [Recording & Storage](#8-recording--storage)
9. [Live Streaming](#9-live-streaming)
10. [Scaling Considerations](#10-scaling-considerations)
11. [nself Plugin Architecture](#11-nself-plugin-architecture)
12. [Implementation Phases](#12-implementation-phases)
13. [Security Considerations](#13-security-considerations)
14. [Testing Strategy](#14-testing-strategy)

---

## 1. Executive Summary

This document outlines the implementation strategy for voice/video calls and live streaming in nchat. The solution addresses:

- **1:1 Voice/Video Calls**: Peer-to-peer with fallback to media server
- **Group Calls**: SFU-based architecture for 2-100+ participants
- **Screen Sharing**: Desktop and application window sharing
- **Call Recording**: Server-side recording with S3-compatible storage
- **Live Streaming**: Broadcast to unlimited viewers via HLS/DASH

### Key Technology Decisions

| Component         | Recommendation           | Rationale                                    |
| ----------------- | ------------------------ | -------------------------------------------- |
| Media Server      | **LiveKit**              | Complete framework, excellent SDKs, AI-ready |
| Signaling         | Existing realtime plugin | Leverage Socket.io infrastructure            |
| TURN/STUN         | **Coturn** (self-hosted) | Cost-effective, full control                 |
| Live Streaming    | **LiveKit Egress** + HLS | Unified platform, low latency                |
| Recording Storage | **MinIO/S3**             | Existing nself infrastructure                |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              nchat Clients                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Web    │  │   iOS    │  │ Android  │  │ Desktop  │  │  Tauri   │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │             │             │
│       └─────────────┴─────────────┴──────┬──────┴─────────────┘             │
│                                          │                                   │
│                                   ┌──────▼──────┐                           │
│                                   │  LiveKit    │                           │
│                                   │  Client SDK │                           │
│                                   └──────┬──────┘                           │
└──────────────────────────────────────────┼──────────────────────────────────┘
                                           │
                              WebRTC (DTLS-SRTP)
                                           │
┌──────────────────────────────────────────┼──────────────────────────────────┐
│                              Backend Infrastructure                          │
│                                          │                                   │
│  ┌───────────────────────────────────────▼───────────────────────────────┐  │
│  │                         LiveKit Media Server                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │     SFU     │  │   Egress    │  │   Ingress   │  │   Room      │   │  │
│  │  │   Router    │  │  (Record)   │  │  (RTMP In)  │  │   Service   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                          │                                   │
│       ┌──────────────────────────────────┼──────────────────────────────┐   │
│       │                                  │                              │   │
│  ┌────▼────┐  ┌──────────┐  ┌───────────▼───────────┐  ┌─────────────┐ │   │
│  │ Coturn  │  │  Redis   │  │    nself Backend      │  │   MinIO     │ │   │
│  │TURN/STUN│  │ (State)  │  │  ┌─────────────────┐  │  │ (Storage)   │ │   │
│  └─────────┘  └──────────┘  │  │  Hasura GraphQL │  │  └─────────────┘ │   │
│                             │  ├─────────────────┤  │                   │   │
│                             │  │  Realtime WS    │  │                   │   │
│                             │  ├─────────────────┤  │                   │   │
│                             │  │  PostgreSQL     │  │                   │   │
│                             │  └─────────────────┘  │                   │   │
│                             └───────────────────────┘                   │   │
│                                                                         │   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Network Topology

#### Mesh vs SFU Decision Matrix

| Participants  | Topology               | Reason                              |
| ------------- | ---------------------- | ----------------------------------- |
| 2 (1:1 calls) | P2P with TURN fallback | Lowest latency, minimal server load |
| 3-4           | SFU                    | P2P bandwidth becomes prohibitive   |
| 5+            | SFU                    | Required for scalability            |
| 100+          | SFU with Cascading     | Multi-region support                |

**Recommendation**: Always use SFU via LiveKit for consistency and feature parity. P2P optimization is complex and provides marginal benefit for chat applications.

### 2.3 Signaling Flow

```
┌────────┐                    ┌──────────┐                    ┌────────┐
│Client A│                    │  Server  │                    │Client B│
└───┬────┘                    └────┬─────┘                    └───┬────┘
    │                              │                              │
    │  1. initiate_call           │                              │
    │─────────────────────────────>│                              │
    │                              │  2. call_incoming            │
    │                              │─────────────────────────────>│
    │                              │                              │
    │                              │  3. call_accepted            │
    │                              │<─────────────────────────────│
    │  4. call_accepted           │                              │
    │<─────────────────────────────│                              │
    │                              │                              │
    │  5. Get LiveKit token       │                              │
    │─────────────────────────────>│                              │
    │  6. LiveKit room token      │                              │
    │<─────────────────────────────│                              │
    │                              │  7. Get LiveKit token        │
    │                              │<─────────────────────────────│
    │                              │  8. LiveKit room token       │
    │                              │─────────────────────────────>│
    │                              │                              │
    ├──────────────────────────────┼──────────────────────────────┤
    │         WebRTC Media Flow (via LiveKit SFU)                 │
    ├──────────────────────────────┼──────────────────────────────┤
```

---

## 3. Media Server Selection

### 3.1 Comparison Matrix

| Feature              | LiveKit                                      | mediasoup       | Janus   | Jitsi      |
| -------------------- | -------------------------------------------- | --------------- | ------- | ---------- |
| **Language**         | Go (Pion)                                    | C++ / Node.js   | C       | Java       |
| **Setup Complexity** | Low                                          | High            | Medium  | Medium     |
| **SDKs**             | Excellent (JS, iOS, Android, Flutter, Unity) | Good (JS, Node) | Limited | Good       |
| **Recording**        | Built-in Egress                              | Custom          | Plugin  | Built-in   |
| **Live Streaming**   | Built-in HLS/RTMP                            | Custom          | Plugin  | Built-in   |
| **AI Integration**   | Agents Framework                             | Manual          | Manual  | Limited    |
| **Scalability**      | Excellent                                    | Excellent       | Good    | Good       |
| **Documentation**    | Excellent                                    | Good            | Good    | Good       |
| **Community**        | Very Active                                  | Active          | Active  | Active     |
| **License**          | Apache 2.0                                   | ISC             | GPL v3  | Apache 2.0 |
| **Self-Hosted**      | Yes                                          | Yes             | Yes     | Yes        |
| **Managed Cloud**    | Yes                                          | No              | No      | Yes (8x8)  |

### 3.2 Recommendation: LiveKit

**Primary Reasons**:

1. **Complete Framework**: Signaling, SFU, recording, streaming in one package
2. **Developer Experience**: Best-in-class SDKs and documentation
3. **AI Ready**: Agents framework for voice AI, transcription, translation
4. **Performance**: Go/Pion-based, highly optimized
5. **Future Proof**: Active development, Media over QUIC (MoQ) roadmap
6. **Flexible Deployment**: Self-hosted or managed cloud

**Trade-offs**:

- Slightly higher memory usage than pure mediasoup
- GPL dependency concerns resolved (Apache 2.0 licensed)

### 3.3 Alternative: mediasoup (If Custom Control Required)

Use mediasoup if:

- Maximum control over media routing is required
- Custom SFU behavior needed
- Team has deep WebRTC expertise
- Performance is critical (2x more efficient than LiveKit in some benchmarks)

---

## 4. Required Components

### 4.1 Infrastructure Services

| Service        | Purpose           | Deployment     | Port                       |
| -------------- | ----------------- | -------------- | -------------------------- |
| LiveKit Server | SFU Media Server  | Docker/K8s     | 7880 (HTTP), 7881 (RTC)    |
| Coturn         | TURN/STUN Server  | Docker/K8s     | 3478 (UDP/TCP), 5349 (TLS) |
| Redis          | LiveKit State     | Existing nself | 6379                       |
| MinIO          | Recording Storage | Existing nself | 9000                       |
| PostgreSQL     | Call Metadata     | Existing nself | 5432                       |

### 4.2 Docker Compose Addition

```yaml
# Add to backend/docker-compose.yml

services:
  livekit:
    image: livekit/livekit-server:v1.7
    container_name: nchat_livekit
    restart: unless-stopped
    ports:
      - '7880:7880' # HTTP/WS
      - '7881:7881' # RTC (UDP)
      - '7882:7882' # RTC (TCP)
    environment:
      - LIVEKIT_KEYS=${LIVEKIT_API_KEY}:${LIVEKIT_API_SECRET}
      - LIVEKIT_REDIS_ADDRESS=redis:6379
    volumes:
      - ./config/livekit.yaml:/etc/livekit.yaml
    command: --config /etc/livekit.yaml
    depends_on:
      - redis
    networks:
      - nself_network

  livekit-egress:
    image: livekit/egress:v1.8
    container_name: nchat_livekit_egress
    restart: unless-stopped
    environment:
      - EGRESS_CONFIG_FILE=/etc/egress.yaml
    volumes:
      - ./config/egress.yaml:/etc/egress.yaml
    cap_add:
      - SYS_ADMIN
    depends_on:
      - livekit
    networks:
      - nself_network

  coturn:
    image: coturn/coturn:4.6
    container_name: nchat_coturn
    restart: unless-stopped
    ports:
      - '3478:3478/udp'
      - '3478:3478/tcp'
      - '5349:5349/udp'
      - '5349:5349/tcp'
      - '49152-49200:49152-49200/udp' # Relay ports
    volumes:
      - ./config/turnserver.conf:/etc/coturn/turnserver.conf
    networks:
      - nself_network
```

### 4.3 LiveKit Configuration

```yaml
# backend/config/livekit.yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  tcp_port: 7881
  use_external_ip: true

redis:
  address: redis:6379

keys:
  # Generated via: openssl rand -hex 32
  ${LIVEKIT_API_KEY}: ${LIVEKIT_API_SECRET}

room:
  auto_create: false
  empty_timeout: 300 # 5 minutes
  max_participants: 100

turn:
  enabled: true
  domain: turn.${DOMAIN}
  tls_port: 5349
  udp_port: 3478
  external_tls: true

webhook:
  urls:
    - ${BACKEND_URL}/api/webhooks/livekit
  api_key: ${WEBHOOK_SECRET}

logging:
  level: info
  pion_level: error
```

### 4.4 Coturn Configuration

```conf
# backend/config/turnserver.conf
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=${EXTERNAL_IP}
relay-ip=0.0.0.0

min-port=49152
max-port=49200

fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=${TURN_SECRET}

realm=${DOMAIN}
server-name=${DOMAIN}

# TLS certificates
cert=/etc/ssl/certs/turn.crt
pkey=/etc/ssl/private/turn.key

# Deny private IP ranges for security
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255

# Logging
log-file=/var/log/turnserver.log
verbose
```

---

## 5. API Endpoints

### 5.1 Call Management APIs

```typescript
// src/app/api/calls/route.ts

// POST /api/calls/initiate
// Start a new call
interface InitiateCallRequest {
  targetUserId: string // For 1:1 calls
  targetUserIds?: string[] // For group calls
  channelId?: string // Optional channel context
  type: 'audio' | 'video'
  metadata?: Record<string, unknown>
}

interface InitiateCallResponse {
  callId: string
  roomName: string
  token: string // LiveKit JWT token
  iceServers: RTCIceServer[] // TURN/STUN config
  expiresAt: string
}

// POST /api/calls/:id/join
// Join an existing call
interface JoinCallRequest {
  callId: string
}

interface JoinCallResponse {
  roomName: string
  token: string
  participants: Participant[]
  iceServers: RTCIceServer[]
}

// POST /api/calls/:id/leave
// Leave a call (does not end it)
interface LeaveCallRequest {
  callId: string
  reason?: 'user_left' | 'network_error' | 'kicked'
}

// POST /api/calls/:id/end
// End a call for all participants
interface EndCallRequest {
  callId: string
  reason?: 'host_ended' | 'timeout' | 'everyone_left'
}

// POST /api/calls/:id/mute
// Toggle mute state
interface MuteRequest {
  callId: string
  trackType: 'audio' | 'video' | 'screen'
  muted: boolean
}

// POST /api/calls/:id/kick
// Remove a participant (moderator only)
interface KickParticipantRequest {
  callId: string
  participantId: string
  reason?: string
}

// GET /api/calls/:id
// Get call info
interface GetCallResponse {
  call: Call
  participants: Participant[]
  isRecording: boolean
  isStreaming: boolean
}

// GET /api/calls/history
// Get call history
interface CallHistoryQuery {
  limit?: number
  offset?: number
  channelId?: string
  participantId?: string
  startDate?: string
  endDate?: string
}
```

### 5.2 Recording APIs

```typescript
// POST /api/calls/:id/recording/start
interface StartRecordingRequest {
  callId: string
  options?: {
    audioOnly?: boolean
    layout?: 'grid' | 'speaker' | 'single'
    resolution?: '720p' | '1080p' | '4k'
    customLayout?: string // Custom layout template
  }
}

interface StartRecordingResponse {
  recordingId: string
  startedAt: string
}

// POST /api/calls/:id/recording/stop
interface StopRecordingResponse {
  recordingId: string
  duration: number
  fileSize: number
  url: string
  thumbnailUrl: string
}

// GET /api/recordings/:id
interface Recording {
  id: string
  callId: string
  channelId?: string
  duration: number
  fileSize: number
  status: 'processing' | 'ready' | 'failed'
  url: string
  thumbnailUrl: string
  createdAt: string
  expiresAt: string // Retention policy
}

// DELETE /api/recordings/:id
// Delete a recording (owner/admin only)
```

### 5.3 Live Streaming APIs

```typescript
// POST /api/streams/start
interface StartStreamRequest {
  channelId: string
  title: string
  description?: string
  visibility: 'public' | 'channel_members' | 'invite_only'
  options?: {
    enableChat: boolean
    enableReactions: boolean
    recordStream: boolean
    rtmpOutputs?: RTMPDestination[] // Simulcast to YouTube, Twitch
  }
}

interface StartStreamResponse {
  streamId: string
  roomName: string
  hostToken: string // LiveKit token for broadcaster
  rtmpIngestUrl?: string // For external encoder
  hlsUrl: string // HLS playback URL
  dashUrl?: string // DASH playback URL
  embedCode: string // HTML embed snippet
}

// POST /api/streams/:id/stop
interface StopStreamResponse {
  streamId: string
  duration: number
  peakViewers: number
  totalViews: number
  recordingUrl?: string
}

// GET /api/streams/:id
interface Stream {
  id: string
  channelId: string
  hostId: string
  title: string
  description?: string
  status: 'live' | 'ended' | 'scheduled'
  startedAt: string
  endedAt?: string
  viewerCount: number
  peakViewers: number
  hlsUrl: string
  chatEnabled: boolean
  reactionsEnabled: boolean
}

// GET /api/streams/:id/viewers
interface StreamViewers {
  total: number
  authenticated: number
  anonymous: number
  viewers: Viewer[]
}

// POST /api/streams/:id/chat
// Send message to stream chat
interface StreamChatMessage {
  content: string
  replyTo?: string
}

// POST /api/streams/:id/react
// Send reaction to stream
interface StreamReaction {
  type: 'like' | 'love' | 'fire' | 'clap' | 'wow'
}

// GET /api/streams/scheduled
// Get upcoming scheduled streams
```

### 5.4 Screen Sharing APIs

```typescript
// POST /api/calls/:id/screen/start
interface StartScreenShareRequest {
  callId: string
  shareType: 'screen' | 'window' | 'tab'
  withAudio: boolean
}

interface StartScreenShareResponse {
  trackId: string
  constraints: MediaTrackConstraints
}

// POST /api/calls/:id/screen/stop
interface StopScreenShareRequest {
  callId: string
  trackId: string
}
```

### 5.5 Webhook Endpoints

```typescript
// POST /api/webhooks/livekit
// Receives LiveKit server events

interface LiveKitWebhook {
  event:
    | 'room_started'
    | 'room_finished'
    | 'participant_joined'
    | 'participant_left'
    | 'track_published'
    | 'track_unpublished'
    | 'egress_started'
    | 'egress_updated'
    | 'egress_ended'
  room: {
    name: string
    sid: string
    numParticipants: number
  }
  participant?: {
    identity: string
    sid: string
    name: string
  }
  track?: {
    sid: string
    type: 'audio' | 'video'
    source: 'camera' | 'microphone' | 'screen_share'
  }
  egressInfo?: {
    egressId: string
    status: string
    file?: { filename: string; size: number }
  }
}
```

---

## 6. Database Schema

### 6.1 DBML Schema Definition

```dbml
// Add to backend/schema.dbml

// =============================================================================
// CALLS
// =============================================================================

Table nchat_calls {
  id uuid [pk, default: `gen_random_uuid()`]
  room_name varchar(255) [not null, unique]
  room_sid varchar(255) [note: 'LiveKit room SID']
  channel_id uuid [ref: > nchat_channels.id]
  initiator_id uuid [not null, ref: > nchat_users.id]
  type call_type [not null]
  status call_status [not null, default: 'initiated']
  scheduled_at timestamptz
  started_at timestamptz
  connected_at timestamptz
  ended_at timestamptz
  end_reason call_end_reason
  max_participants int [default: 100]
  metadata jsonb [default: '{}']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    channel_id
    initiator_id
    status
    started_at
    (channel_id, status)
  }
}

Enum call_type {
  audio
  video
}

Enum call_status {
  initiated
  ringing
  connecting
  connected
  reconnecting
  ended
}

Enum call_end_reason {
  completed
  declined
  busy
  timeout
  cancelled
  failed
  no_answer
  network_error
  host_ended
  kicked
}

// =============================================================================
// CALL PARTICIPANTS
// =============================================================================

Table nchat_call_participants {
  id uuid [pk, default: `gen_random_uuid()`]
  call_id uuid [not null, ref: > nchat_calls.id, delete: cascade]
  user_id uuid [not null, ref: > nchat_users.id]
  participant_sid varchar(255) [note: 'LiveKit participant SID']
  role participant_role [not null, default: 'participant']
  status participant_status [not null, default: 'invited']
  invited_at timestamptz [not null, default: `now()`]
  joined_at timestamptz
  left_at timestamptz
  leave_reason varchar(100)
  is_muted boolean [not null, default: false]
  is_video_enabled boolean [not null, default: false]
  is_screen_sharing boolean [not null, default: false]
  connection_quality connection_quality
  metadata jsonb [default: '{}']

  indexes {
    call_id
    user_id
    (call_id, user_id) [unique]
    status
  }
}

Enum participant_role {
  host
  co_host
  participant
  viewer
}

Enum participant_status {
  invited
  ringing
  connecting
  connected
  disconnected
  left
  kicked
}

Enum connection_quality {
  excellent
  good
  poor
  lost
}

// =============================================================================
// CALL RECORDINGS
// =============================================================================

Table nchat_call_recordings {
  id uuid [pk, default: `gen_random_uuid()`]
  call_id uuid [not null, ref: > nchat_calls.id, delete: cascade]
  egress_id varchar(255) [not null, note: 'LiveKit egress ID']
  status recording_status [not null, default: 'starting']
  type recording_type [not null, default: 'composite']
  layout recording_layout [default: 'grid']
  resolution varchar(10) [default: '1080p']
  file_path varchar(500)
  file_size bigint
  duration int [note: 'Duration in seconds']
  storage_bucket varchar(255)
  thumbnail_path varchar(500)
  started_at timestamptz
  ended_at timestamptz
  expires_at timestamptz [note: 'Retention policy']
  error_message text
  metadata jsonb [default: '{}']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    call_id
    egress_id [unique]
    status
    expires_at
  }
}

Enum recording_status {
  starting
  recording
  processing
  ready
  failed
  deleted
}

Enum recording_type {
  composite
  individual_tracks
  audio_only
}

Enum recording_layout {
  grid
  speaker
  single
  custom
}

// =============================================================================
// LIVE STREAMS
// =============================================================================

Table nchat_streams {
  id uuid [pk, default: `gen_random_uuid()`]
  channel_id uuid [not null, ref: > nchat_channels.id]
  host_id uuid [not null, ref: > nchat_users.id]
  room_name varchar(255) [not null, unique]
  room_sid varchar(255)
  title varchar(255) [not null]
  description text
  visibility stream_visibility [not null, default: 'channel_members']
  status stream_status [not null, default: 'scheduled']

  // Playback URLs
  hls_url varchar(500)
  dash_url varchar(500)
  rtmp_ingest_url varchar(500)

  // Options
  chat_enabled boolean [not null, default: true]
  reactions_enabled boolean [not null, default: true]
  record_stream boolean [not null, default: false]

  // Analytics
  viewer_count int [not null, default: 0]
  peak_viewers int [not null, default: 0]
  total_views int [not null, default: 0]
  total_reactions int [not null, default: 0]

  // Timestamps
  scheduled_at timestamptz
  started_at timestamptz
  ended_at timestamptz

  // Recording reference
  recording_id uuid [ref: > nchat_call_recordings.id]

  metadata jsonb [default: '{}']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    channel_id
    host_id
    status
    scheduled_at
    (channel_id, status)
  }
}

Enum stream_visibility {
  public
  channel_members
  invite_only
}

Enum stream_status {
  scheduled
  starting
  live
  ending
  ended
  cancelled
}

// =============================================================================
// STREAM VIEWERS
// =============================================================================

Table nchat_stream_viewers {
  id uuid [pk, default: `gen_random_uuid()`]
  stream_id uuid [not null, ref: > nchat_streams.id, delete: cascade]
  user_id uuid [ref: > nchat_users.id, note: 'Null for anonymous viewers']
  session_id varchar(255) [not null]
  joined_at timestamptz [not null, default: `now()`]
  left_at timestamptz
  watch_duration int [note: 'Total seconds watched']
  device_type varchar(50)
  connection_quality connection_quality

  indexes {
    stream_id
    user_id
    session_id
    (stream_id, session_id) [unique]
  }
}

// =============================================================================
// STREAM CHAT
// =============================================================================

Table nchat_stream_chat {
  id uuid [pk, default: `gen_random_uuid()`]
  stream_id uuid [not null, ref: > nchat_streams.id, delete: cascade]
  user_id uuid [not null, ref: > nchat_users.id]
  content text [not null]
  reply_to_id uuid [ref: > nchat_stream_chat.id]
  is_pinned boolean [not null, default: false]
  is_highlighted boolean [not null, default: false]
  is_deleted boolean [not null, default: false]
  deleted_by uuid [ref: > nchat_users.id]
  created_at timestamptz [not null, default: `now()`]

  indexes {
    stream_id
    user_id
    created_at
    (stream_id, created_at)
  }
}

// =============================================================================
// STREAM REACTIONS
// =============================================================================

Table nchat_stream_reactions {
  id uuid [pk, default: `gen_random_uuid()`]
  stream_id uuid [not null, ref: > nchat_streams.id, delete: cascade]
  user_id uuid [not null, ref: > nchat_users.id]
  type reaction_type [not null]
  created_at timestamptz [not null, default: `now()`]

  indexes {
    stream_id
    (stream_id, created_at)
  }
}

Enum reaction_type {
  like
  love
  fire
  clap
  wow
  laugh
  sad
}

// =============================================================================
// RTMP DESTINATIONS (Simulcast)
// =============================================================================

Table nchat_stream_destinations {
  id uuid [pk, default: `gen_random_uuid()`]
  stream_id uuid [not null, ref: > nchat_streams.id, delete: cascade]
  platform destination_platform [not null]
  rtmp_url varchar(500) [not null]
  stream_key_encrypted varchar(500) [not null, note: 'Encrypted stream key']
  enabled boolean [not null, default: true]
  status destination_status [not null, default: 'pending']
  error_message text
  created_at timestamptz [not null, default: `now()`]

  indexes {
    stream_id
    platform
    (stream_id, platform) [unique]
  }
}

Enum destination_platform {
  youtube
  twitch
  facebook
  custom
}

Enum destination_status {
  pending
  connecting
  connected
  disconnected
  error
}

// =============================================================================
// ICE SERVERS (TURN/STUN Configuration)
// =============================================================================

Table nchat_ice_servers {
  id uuid [pk, default: `gen_random_uuid()`]
  urls text[] [not null]
  username varchar(255)
  credential_encrypted varchar(500)
  region varchar(50)
  priority int [not null, default: 0]
  is_active boolean [not null, default: true]
  last_health_check timestamptz
  health_status varchar(20) [default: 'unknown']
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]

  indexes {
    is_active
    region
    priority
  }
}
```

### 6.2 Hasura Permissions (RLS)

```yaml
# Hasura metadata for call tables

# nchat_calls permissions
- table:
    schema: public
    name: nchat_calls
  select_permissions:
    - role: user
      permission:
        columns: '*'
        filter:
          _or:
            - initiator_id: { _eq: X-Hasura-User-Id }
            - call_participants:
                user_id: { _eq: X-Hasura-User-Id }
            - channel:
                channel_members:
                  user_id: { _eq: X-Hasura-User-Id }
  insert_permissions:
    - role: user
      permission:
        columns: [channel_id, type, scheduled_at, metadata]
        check:
          _or:
            - channel_id: { _is_null: true } # Direct call
            - channel:
                channel_members:
                  user_id: { _eq: X-Hasura-User-Id }
        set:
          initiator_id: X-Hasura-User-Id
          status: 'initiated'

# nchat_call_recordings - only participants can view
- table:
    schema: public
    name: nchat_call_recordings
  select_permissions:
    - role: user
      permission:
        columns: '*'
        filter:
          call:
            _or:
              - initiator_id: { _eq: X-Hasura-User-Id }
              - call_participants:
                  user_id: { _eq: X-Hasura-User-Id }

# nchat_streams - based on visibility
- table:
    schema: public
    name: nchat_streams
  select_permissions:
    - role: user
      permission:
        columns: '*'
        filter:
          _or:
            - visibility: { _eq: 'public' }
            - host_id: { _eq: X-Hasura-User-Id }
            - _and:
                - visibility: { _eq: 'channel_members' }
                - channel:
                    channel_members:
                      user_id: { _eq: X-Hasura-User-Id }
```

---

## 7. Client Implementation

### 7.1 WebRTC Service Architecture

```
src/
├── lib/
│   └── webrtc/
│       ├── index.ts                 # Main exports
│       ├── livekit-client.ts        # LiveKit wrapper
│       ├── media-devices.ts         # Device enumeration
│       ├── media-constraints.ts     # Media constraints factory
│       ├── connection-quality.ts    # Quality monitoring
│       └── __tests__/
│           └── *.test.ts
├── hooks/
│   └── webrtc/
│       ├── use-room.ts              # Room connection hook
│       ├── use-participants.ts      # Participant management
│       ├── use-local-participant.ts # Local user media
│       ├── use-tracks.ts            # Track management
│       ├── use-screen-share.ts      # Screen sharing
│       ├── use-recording.ts         # Recording controls
│       └── use-media-devices.ts     # Device selection
├── components/
│   └── call/
│       ├── CallProvider.tsx         # Call context provider
│       ├── CallOverlay.tsx          # In-call UI overlay
│       ├── CallControls.tsx         # Mute, camera, hang up
│       ├── ParticipantGrid.tsx      # Video grid layout
│       ├── ParticipantTile.tsx      # Single participant video
│       ├── ScreenShareView.tsx      # Screen share display
│       ├── CallTimer.tsx            # Duration display
│       ├── DeviceSelector.tsx       # Audio/video device picker
│       ├── IncomingCallDialog.tsx   # Incoming call UI
│       └── CallQualityIndicator.tsx # Connection quality
└── stores/
    └── call-store.ts                # Already exists, extend
```

### 7.2 LiveKit Client Wrapper

```typescript
// src/lib/webrtc/livekit-client.ts

import {
  Room,
  RoomEvent,
  Track,
  Participant,
  LocalParticipant,
  RemoteParticipant,
  ConnectionState,
  DisconnectReason,
  RoomOptions,
} from 'livekit-client'

export interface LiveKitConfig {
  url: string
  token: string
  iceServers?: RTCIceServer[]
}

export interface JoinRoomOptions {
  autoSubscribe?: boolean
  publishDefaults?: {
    audioPreset?: AudioPreset
    videoPreset?: VideoPreset
    screenSharePreset?: ScreenSharePreset
  }
}

export type AudioPreset = 'music' | 'speech' | 'speech_low_bandwidth'
export type VideoPreset = 'h1080' | 'h720' | 'h540' | 'h360'
export type ScreenSharePreset = 'h1080_15fps' | 'h720_15fps'

export class LiveKitClient {
  private room: Room | null = null
  private config: LiveKitConfig | null = null

  /**
   * Connect to a LiveKit room
   */
  async connect(config: LiveKitConfig, options?: JoinRoomOptions): Promise<Room> {
    this.config = config

    const roomOptions: RoomOptions = {
      adaptiveStream: true,
      dynacast: true,
      publishDefaults: {
        audioPreset: options?.publishDefaults?.audioPreset,
        videoEncoding: this.getVideoEncoding(options?.publishDefaults?.videoPreset),
        screenShareEncoding: this.getScreenShareEncoding(
          options?.publishDefaults?.screenSharePreset
        ),
      },
    }

    // Add custom ICE servers if provided
    if (config.iceServers) {
      roomOptions.rtcConfig = {
        iceServers: config.iceServers,
      }
    }

    this.room = new Room(roomOptions)

    // Set up event handlers
    this.setupEventHandlers()

    // Connect to room
    await this.room.connect(config.url, config.token, {
      autoSubscribe: options?.autoSubscribe ?? true,
    })

    return this.room
  }

  /**
   * Disconnect from room
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect()
      this.room = null
    }
  }

  /**
   * Enable/disable local camera
   */
  async setCameraEnabled(enabled: boolean): Promise<void> {
    await this.room?.localParticipant.setCameraEnabled(enabled)
  }

  /**
   * Enable/disable local microphone
   */
  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    await this.room?.localParticipant.setMicrophoneEnabled(enabled)
  }

  /**
   * Start screen share
   */
  async startScreenShare(options?: {
    audio?: boolean
    contentHint?: 'motion' | 'detail' | 'text'
  }): Promise<void> {
    await this.room?.localParticipant.setScreenShareEnabled(true, {
      audio: options?.audio ?? false,
      contentHint: options?.contentHint ?? 'detail',
    })
  }

  /**
   * Stop screen share
   */
  async stopScreenShare(): Promise<void> {
    await this.room?.localParticipant.setScreenShareEnabled(false)
  }

  /**
   * Switch audio/video device
   */
  async switchDevice(kind: MediaDeviceKind, deviceId: string): Promise<void> {
    switch (kind) {
      case 'audioinput':
        await this.room?.switchActiveDevice('audioinput', deviceId)
        break
      case 'videoinput':
        await this.room?.switchActiveDevice('videoinput', deviceId)
        break
      case 'audiooutput':
        await this.room?.switchActiveDevice('audiooutput', deviceId)
        break
    }
  }

  /**
   * Get current room
   */
  getRoom(): Room | null {
    return this.room
  }

  /**
   * Get local participant
   */
  getLocalParticipant(): LocalParticipant | undefined {
    return this.room?.localParticipant
  }

  /**
   * Get remote participants
   */
  getRemoteParticipants(): Map<string, RemoteParticipant> | undefined {
    return this.room?.remoteParticipants
  }

  // Private methods

  private setupEventHandlers(): void {
    if (!this.room) return

    this.room.on(RoomEvent.Connected, () => {
      console.log('[LiveKit] Connected to room')
    })

    this.room.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
      console.log('[LiveKit] Disconnected:', reason)
    })

    this.room.on(RoomEvent.Reconnecting, () => {
      console.log('[LiveKit] Reconnecting...')
    })

    this.room.on(RoomEvent.Reconnected, () => {
      console.log('[LiveKit] Reconnected')
    })

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('[LiveKit] Participant joined:', participant.identity)
    })

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('[LiveKit] Participant left:', participant.identity)
    })

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('[LiveKit] Track subscribed:', track.kind, participant.identity)
    })

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      console.log(
        '[LiveKit] Active speakers:',
        speakers.map((s) => s.identity)
      )
    })

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log('[LiveKit] Quality changed:', quality, participant.identity)
    })
  }

  private getVideoEncoding(preset?: VideoPreset) {
    const presets: Record<VideoPreset, { maxBitrate: number; maxFramerate: number }> = {
      h1080: { maxBitrate: 3_000_000, maxFramerate: 30 },
      h720: { maxBitrate: 1_700_000, maxFramerate: 30 },
      h540: { maxBitrate: 900_000, maxFramerate: 25 },
      h360: { maxBitrate: 500_000, maxFramerate: 20 },
    }
    return preset ? presets[preset] : presets.h720
  }

  private getScreenShareEncoding(preset?: ScreenSharePreset) {
    const presets: Record<ScreenSharePreset, { maxBitrate: number; maxFramerate: number }> = {
      h1080_15fps: { maxBitrate: 3_000_000, maxFramerate: 15 },
      h720_15fps: { maxBitrate: 1_500_000, maxFramerate: 15 },
    }
    return preset ? presets[preset] : presets['h1080_15fps']
  }
}

// Singleton instance
export const liveKitClient = new LiveKitClient()
```

### 7.3 useRoom Hook

```typescript
// src/hooks/webrtc/use-room.ts

import { useState, useEffect, useCallback } from 'react'
import {
  Room,
  RoomEvent,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
} from 'livekit-client'
import { liveKitClient, LiveKitConfig, JoinRoomOptions } from '@/lib/webrtc/livekit-client'
import { useCallStore } from '@/stores/call-store'
import { captureError } from '@/lib/sentry-utils'

export interface UseRoomOptions extends JoinRoomOptions {
  onParticipantJoined?: (participant: RemoteParticipant) => void
  onParticipantLeft?: (participant: RemoteParticipant) => void
  onDisconnected?: (reason?: string) => void
}

export interface UseRoomReturn {
  room: Room | null
  connectionState: ConnectionState
  localParticipant: LocalParticipant | undefined
  remoteParticipants: RemoteParticipant[]
  connect: (config: LiveKitConfig) => Promise<void>
  disconnect: () => Promise<void>
  isConnecting: boolean
  error: Error | null
}

export function useRoom(options?: UseRoomOptions): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  )
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { setCallState, setCallConnected, setCallReconnecting } = useCallStore()

  // Update participants list
  const updateParticipants = useCallback((room: Room) => {
    setRemoteParticipants(Array.from(room.remoteParticipants.values()))
  }, [])

  // Connect to room
  const connect = useCallback(
    async (config: LiveKitConfig) => {
      setIsConnecting(true)
      setError(null)

      try {
        const connectedRoom = await liveKitClient.connect(config, options)
        setRoom(connectedRoom)
        updateParticipants(connectedRoom)

        // Set up room event handlers
        connectedRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state)

          switch (state) {
            case ConnectionState.Connected:
              setCallConnected()
              break
            case ConnectionState.Reconnecting:
              setCallReconnecting()
              break
            case ConnectionState.Disconnected:
              setCallState('ended')
              break
          }
        })

        connectedRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          updateParticipants(connectedRoom)
          options?.onParticipantJoined?.(participant)
        })

        connectedRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          updateParticipants(connectedRoom)
          options?.onParticipantLeft?.(participant)
        })

        connectedRoom.on(RoomEvent.Disconnected, (reason) => {
          setRoom(null)
          setRemoteParticipants([])
          options?.onDisconnected?.(reason)
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to connect')
        setError(error)
        captureError(error, { tags: { feature: 'webrtc', action: 'connect' } })
      } finally {
        setIsConnecting(false)
      }
    },
    [options, updateParticipants, setCallConnected, setCallReconnecting, setCallState]
  )

  // Disconnect from room
  const disconnect = useCallback(async () => {
    await liveKitClient.disconnect()
    setRoom(null)
    setRemoteParticipants([])
    setConnectionState(ConnectionState.Disconnected)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    room,
    connectionState,
    localParticipant: room?.localParticipant,
    remoteParticipants,
    connect,
    disconnect,
    isConnecting,
    error,
  }
}
```

### 7.4 CallKit Integration (iOS)

The existing `/Users/admin/Sites/nself-chat/src/lib/voip-push.ts` provides the foundation. Extend it:

```typescript
// src/platforms/capacitor/src/native/call-kit.ts

import { registerPlugin } from '@capacitor/core'

export interface CallKitPlugin {
  setup(options: { appName: string; iconTemplate?: string; ringtoneSound?: string }): Promise<void>

  reportIncomingCall(options: {
    uuid: string
    handle: string
    handleType: 'generic' | 'email' | 'phone'
    hasVideo: boolean
    callerDisplayName?: string
    callerImageUrl?: string
  }): Promise<void>

  endCall(reason: CallEndReason, uuid?: string): Promise<void>

  setMutedState(muted: boolean, uuid: string): Promise<void>

  setHeldState(held: boolean, uuid: string): Promise<void>

  addListener(
    eventName: CallKitEvent,
    callback: (data: any) => void
  ): Promise<{ remove: () => Promise<void> }>
}

export type CallEndReason =
  | 'failed'
  | 'remoteEnded'
  | 'unanswered'
  | 'answeredElsewhere'
  | 'declinedElsewhere'

export type CallKitEvent = 'callStarted' | 'callAnswered' | 'callEnded' | 'callMuted' | 'callHeld'

const CallKit = registerPlugin<CallKitPlugin>('CallKit')

export class CallKitManager {
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    await CallKit.setup({
      appName: 'nchat',
      iconTemplate: 'CallKitIcon',
      ringtoneSound: 'ringtone.wav',
    })

    // Set up listeners
    await this.setupListeners()

    this.initialized = true
  }

  private async setupListeners(): Promise<void> {
    await CallKit.addListener('callAnswered', async (data) => {
      // User answered via CallKit
      // Trigger WebRTC connection
    })

    await CallKit.addListener('callEnded', async (data) => {
      // User ended via CallKit
      // Disconnect WebRTC
    })

    await CallKit.addListener('callMuted', async (data) => {
      // User toggled mute via CallKit
    })
  }

  async reportIncomingCall(options: {
    uuid: string
    handle: string
    handleType: 'generic' | 'email' | 'phone'
    hasVideo: boolean
    callerDisplayName?: string
    callerImageUrl?: string
  }): Promise<void> {
    await CallKit.reportIncomingCall(options)
  }

  async endCall(reason: CallEndReason, uuid?: string): Promise<void> {
    await CallKit.endCall(reason, uuid)
  }
}

export const callKitManager = new CallKitManager()
```

### 7.5 Connection Handling & Quality

```typescript
// src/lib/webrtc/connection-quality.ts

import { ConnectionQuality as LKConnectionQuality, Participant } from 'livekit-client'

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'lost' | 'unknown'

export interface ConnectionStats {
  quality: ConnectionQuality
  packetLoss: number
  jitter: number
  latency: number
  bitrate: {
    upload: number
    download: number
  }
}

export function mapConnectionQuality(lkQuality: LKConnectionQuality): ConnectionQuality {
  switch (lkQuality) {
    case LKConnectionQuality.Excellent:
      return 'excellent'
    case LKConnectionQuality.Good:
      return 'good'
    case LKConnectionQuality.Poor:
      return 'poor'
    case LKConnectionQuality.Lost:
      return 'lost'
    default:
      return 'unknown'
  }
}

export class ConnectionQualityMonitor {
  private statsInterval: NodeJS.Timeout | null = null
  private lastStats: Map<string, ConnectionStats> = new Map()
  private callbacks: Set<(stats: Map<string, ConnectionStats>) => void> = new Set()

  start(room: any, intervalMs = 2000): void {
    this.stop()

    this.statsInterval = setInterval(async () => {
      await this.collectStats(room)
    }, intervalMs)
  }

  stop(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
  }

  subscribe(callback: (stats: Map<string, ConnectionStats>) => void): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  private async collectStats(room: any): Promise<void> {
    // Collect stats from room participants
    const newStats = new Map<string, ConnectionStats>()

    // Add local participant stats
    const localStats = await this.getParticipantStats(room.localParticipant)
    newStats.set(room.localParticipant.identity, localStats)

    // Add remote participant stats
    for (const [identity, participant] of room.remoteParticipants) {
      const stats = await this.getParticipantStats(participant)
      newStats.set(identity, stats)
    }

    this.lastStats = newStats

    // Notify subscribers
    this.callbacks.forEach((cb) => cb(newStats))
  }

  private async getParticipantStats(participant: Participant): Promise<ConnectionStats> {
    return {
      quality: mapConnectionQuality(participant.connectionQuality),
      packetLoss: 0, // Would need WebRTC stats API
      jitter: 0,
      latency: 0,
      bitrate: {
        upload: 0,
        download: 0,
      },
    }
  }
}
```

---

## 8. Recording & Storage

### 8.1 Recording Architecture

```
                                    ┌──────────────────┐
                                    │   LiveKit Room   │
                                    │   (Active Call)  │
                                    └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │  LiveKit Egress  │
                                    │    Service       │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐     ┌─────────▼────────┐     ┌────────▼────────┐
           │  Room Composite │     │ Track Composite  │     │ Individual      │
           │  (Grid Layout)  │     │ (Custom Layout)  │     │ Track Export    │
           └────────┬────────┘     └─────────┬────────┘     └────────┬────────┘
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │  Transcoding     │
                                    │  (VP8→H.264)     │
                                    └────────┬─────────┘
                                             │
                                    ┌────────▼─────────┐
                                    │   MinIO/S3       │
                                    │   Storage        │
                                    └────────┬─────────┘
                                             │
                               ┌─────────────┼─────────────┐
                               │             │             │
                      ┌────────▼───┐  ┌──────▼─────┐  ┌────▼─────────┐
                      │   Video    │  │  Thumbnail │  │   Metadata   │
                      │   File     │  │   Images   │  │    JSON      │
                      └────────────┘  └────────────┘  └──────────────┘
```

### 8.2 Egress Configuration

```yaml
# backend/config/egress.yaml
log_level: info
api_key: ${LIVEKIT_API_KEY}
api_secret: ${LIVEKIT_API_SECRET}
ws_url: ws://livekit:7880

# S3-compatible storage (MinIO)
s3:
  access_key: ${MINIO_ACCESS_KEY}
  secret: ${MINIO_SECRET_KEY}
  region: us-east-1
  endpoint: http://minio:9000
  bucket: nchat-recordings
  force_path_style: true

# CPU/memory limits
cpu_cost:
  room_composite_cpus: 3
  track_composite_cpus: 2
  track_cpus: 1

enable_chrome_sandbox: true
```

### 8.3 Recording Service

```typescript
// src/services/recording-service.ts

import { EgressClient, RoomCompositeEgressRequest, EncodedFileOutput } from 'livekit-server-sdk'

export interface RecordingOptions {
  callId: string
  roomName: string
  layout?: 'grid' | 'speaker' | 'single'
  resolution?: '720p' | '1080p' | '4k'
  audioOnly?: boolean
  customLayoutUrl?: string
}

export interface RecordingResult {
  egressId: string
  status: 'starting' | 'recording' | 'complete' | 'failed'
  fileUrl?: string
  duration?: number
  error?: string
}

export class RecordingService {
  private client: EgressClient

  constructor() {
    this.client = new EgressClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    )
  }

  async startRecording(options: RecordingOptions): Promise<string> {
    const { callId, roomName, layout, resolution, audioOnly } = options

    const fileOutput: EncodedFileOutput = {
      fileType: audioOnly ? 'OGG' : 'MP4',
      filepath: `recordings/${callId}/{room_name}-{time}.${audioOnly ? 'ogg' : 'mp4'}`,
      s3: {
        accessKey: process.env.MINIO_ACCESS_KEY!,
        secret: process.env.MINIO_SECRET_KEY!,
        region: 'us-east-1',
        endpoint: process.env.MINIO_ENDPOINT!,
        bucket: 'nchat-recordings',
        forcePathStyle: true,
      },
    }

    const request: RoomCompositeEgressRequest = {
      roomName,
      layout: this.getLayout(layout),
      videoOnly: false,
      audioOnly: audioOnly ?? false,
      file: fileOutput,
    }

    // Add custom layout if provided
    if (options.customLayoutUrl) {
      request.customBaseUrl = options.customLayoutUrl
    }

    const info = await this.client.startRoomCompositeEgress(roomName, request)

    return info.egressId
  }

  async stopRecording(egressId: string): Promise<RecordingResult> {
    const info = await this.client.stopEgress(egressId)

    return {
      egressId: info.egressId,
      status: this.mapStatus(info.status),
      fileUrl: info.file?.location,
      duration: info.file?.duration,
    }
  }

  async getRecordingStatus(egressId: string): Promise<RecordingResult> {
    const infos = await this.client.listEgress({ egressId })
    const info = infos[0]

    if (!info) {
      throw new Error('Recording not found')
    }

    return {
      egressId: info.egressId,
      status: this.mapStatus(info.status),
      fileUrl: info.file?.location,
      duration: info.file?.duration,
      error: info.error,
    }
  }

  private getLayout(layout?: string): string {
    switch (layout) {
      case 'speaker':
        return 'speaker-dark'
      case 'single':
        return 'single-speaker'
      case 'grid':
      default:
        return 'grid-dark'
    }
  }

  private mapStatus(status: number): RecordingResult['status'] {
    // LiveKit egress status codes
    switch (status) {
      case 0:
        return 'starting'
      case 1:
        return 'recording'
      case 2:
        return 'complete'
      default:
        return 'failed'
    }
  }
}

export const recordingService = new RecordingService()
```

### 8.4 Retention Policies

```typescript
// src/services/recording-retention.ts

export interface RetentionPolicy {
  id: string
  name: string
  retentionDays: number
  applyTo: 'all' | 'channel' | 'user'
  targetId?: string
}

const DEFAULT_POLICIES: RetentionPolicy[] = [
  { id: 'free', name: 'Free Tier', retentionDays: 7, applyTo: 'all' },
  { id: 'pro', name: 'Pro Tier', retentionDays: 30, applyTo: 'all' },
  { id: 'enterprise', name: 'Enterprise', retentionDays: 365, applyTo: 'all' },
]

export class RecordingRetentionService {
  /**
   * Apply retention policy - delete expired recordings
   */
  async enforceRetention(): Promise<void> {
    // Query recordings past retention period
    // Delete from storage and database
  }

  /**
   * Get retention policy for a recording
   */
  async getPolicy(userId: string, channelId?: string): Promise<RetentionPolicy> {
    // Check user's subscription tier
    // Return appropriate policy
    return DEFAULT_POLICIES[0]
  }
}
```

---

## 9. Live Streaming

### 9.1 Streaming Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BROADCASTER                                    │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────────────────┐  │
│  │   Browser   │──────│  LiveKit    │──────│   LiveKit Server        │  │
│  │   (WebRTC)  │      │  Client SDK │      │   (Room: stream_123)    │  │
│  └─────────────┘      └─────────────┘      └───────────┬─────────────┘  │
│                                                        │                │
│  ┌─────────────┐                          ┌───────────▼─────────────┐  │
│  │   OBS/Wire  │──────────────────────────│   LiveKit Ingress       │  │
│  │   cast      │         RTMP/WHIP        │   (RTMP/WHIP Input)     │  │
│  └─────────────┘                          └───────────┬─────────────┘  │
└───────────────────────────────────────────────────────┼─────────────────┘
                                                        │
                                            ┌───────────▼─────────────┐
                                            │   LiveKit Egress        │
                                            │   (HLS/DASH Output)     │
                                            └───────────┬─────────────┘
                                                        │
                         ┌──────────────────────────────┼──────────────────────────────┐
                         │                              │                              │
                ┌────────▼────────┐           ┌────────▼────────┐           ┌─────────▼────────┐
                │   HLS Stream    │           │  DASH Stream    │           │  RTMP Simulcast  │
                │   (CDN Ready)   │           │  (CDN Ready)    │           │  (YouTube/Twitch)│
                └────────┬────────┘           └────────┬────────┘           └──────────────────┘
                         │                             │
                         └──────────────┬──────────────┘
                                        │
┌───────────────────────────────────────┼───────────────────────────────────────┐
│                                VIEWERS (Unlimited Scale)                       │
│                                       │                                        │
│  ┌────────────────┐  ┌────────────────┼────────────────┐  ┌────────────────┐  │
│  │ Video.js/HLS.js│  │ Video.js/HLS.js│ Video.js/HLS.js│  │ Video.js/HLS.js│  │
│  │    Web         │  │   iOS App      │  Android App   │  │    Desktop     │  │
│  └────────────────┘  └────────────────┘  └─────────────┘  └────────────────┘  │
│                                       │                                        │
│  ┌────────────────────────────────────▼────────────────────────────────────┐  │
│  │                         Stream Chat (WebSocket)                          │  │
│  │                         Reactions (WebSocket)                            │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 HLS Configuration

```yaml
# backend/config/egress.yaml (extended for streaming)

# HLS output settings
hls:
  segment_duration: 4
  playlist_type: 'live'
  segments_per_playlist: 5

# RTMP output for simulcast
rtmp:
  - url: rtmp://a.rtmp.youtube.com/live2
    stream_key: ${YOUTUBE_STREAM_KEY}
  - url: rtmp://live.twitch.tv/app
    stream_key: ${TWITCH_STREAM_KEY}
```

### 9.3 Streaming Service

```typescript
// src/services/streaming-service.ts

import {
  EgressClient,
  RoomCompositeEgressRequest,
  StreamOutput,
  SegmentedFileOutput,
} from 'livekit-server-sdk'
import { RoomServiceClient, ParticipantPermission } from 'livekit-server-sdk'

export interface StreamOptions {
  channelId: string
  title: string
  description?: string
  visibility: 'public' | 'channel_members' | 'invite_only'
  enableChat: boolean
  enableReactions: boolean
  recordStream: boolean
  rtmpDestinations?: Array<{
    platform: 'youtube' | 'twitch' | 'facebook' | 'custom'
    url: string
    streamKey: string
  }>
}

export interface StreamInfo {
  streamId: string
  roomName: string
  hlsUrl: string
  dashUrl?: string
  rtmpIngestUrl?: string
  status: 'starting' | 'live' | 'ended'
}

export class StreamingService {
  private egressClient: EgressClient
  private roomClient: RoomServiceClient

  constructor() {
    const url = process.env.LIVEKIT_URL!
    const apiKey = process.env.LIVEKIT_API_KEY!
    const apiSecret = process.env.LIVEKIT_API_SECRET!

    this.egressClient = new EgressClient(url, apiKey, apiSecret)
    this.roomClient = new RoomServiceClient(url, apiKey, apiSecret)
  }

  async startStream(hostId: string, options: StreamOptions): Promise<StreamInfo> {
    const streamId = crypto.randomUUID()
    const roomName = `stream_${streamId}`

    // Create room with appropriate settings
    await this.roomClient.createRoom({
      name: roomName,
      emptyTimeout: 3600, // 1 hour
      maxParticipants: 1, // Only host can publish
    })

    // Start HLS egress
    const hlsOutput: SegmentedFileOutput = {
      protocol: 'HLS',
      filenamePrefix: `streams/${streamId}/`,
      playlistName: 'playlist.m3u8',
      segmentDuration: 4,
      s3: {
        accessKey: process.env.MINIO_ACCESS_KEY!,
        secret: process.env.MINIO_SECRET_KEY!,
        region: 'us-east-1',
        endpoint: process.env.MINIO_ENDPOINT!,
        bucket: 'nchat-streams',
        forcePathStyle: true,
      },
    }

    // Build outputs array
    const outputs: any[] = [hlsOutput]

    // Add RTMP simulcast destinations
    if (options.rtmpDestinations?.length) {
      for (const dest of options.rtmpDestinations) {
        outputs.push({
          url: `${dest.url}/${dest.streamKey}`,
        } as StreamOutput)
      }
    }

    // Start egress
    await this.egressClient.startRoomCompositeEgress(roomName, {
      roomName,
      layout: 'speaker-dark',
      segments: hlsOutput,
      stream: options.rtmpDestinations?.length
        ? { urls: outputs.slice(1).map((o) => o.url) }
        : undefined,
    })

    return {
      streamId,
      roomName,
      hlsUrl: `${process.env.CDN_URL}/streams/${streamId}/playlist.m3u8`,
      status: 'starting',
    }
  }

  async stopStream(streamId: string): Promise<void> {
    const roomName = `stream_${streamId}`

    // Stop all egresses for this room
    const egresses = await this.egressClient.listEgress({ roomName })
    for (const egress of egresses) {
      await this.egressClient.stopEgress(egress.egressId)
    }

    // End the room
    await this.roomClient.deleteRoom(roomName)
  }

  async getStreamToken(streamId: string, userId: string, isHost: boolean): Promise<string> {
    const roomName = `stream_${streamId}`

    const permissions: ParticipantPermission = isHost
      ? { canPublish: true, canSubscribe: true, canPublishData: true }
      : { canPublish: false, canSubscribe: true, canPublishData: false }

    // Generate token with appropriate permissions
    const { AccessToken } = await import('livekit-server-sdk')
    const token = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
      identity: userId,
      ttl: '4h',
    })

    token.addGrant({
      room: roomName,
      roomJoin: true,
      ...permissions,
    })

    return token.toJwt()
  }
}

export const streamingService = new StreamingService()
```

### 9.4 Stream Chat Component

```typescript
// src/components/stream/StreamChat.tsx

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '@/contexts/realtime-context';
import { useAuth } from '@/contexts/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface StreamChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  isHighlighted?: boolean;
}

interface StreamChatProps {
  streamId: string;
  disabled?: boolean;
}

export function StreamChat({ streamId, disabled }: StreamChatProps) {
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { socket } = useRealtime();
  const { user } = useAuth();

  // Subscribe to chat messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: StreamChatMessage) => {
      setMessages(prev => [...prev, message].slice(-200)); // Keep last 200
    };

    socket.on(`stream:${streamId}:chat`, handleMessage);

    return () => {
      socket.off(`stream:${streamId}:chat`, handleMessage);
    };
  }, [socket, streamId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !user || disabled) return;

    try {
      await fetch(`/api/streams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [input, user, disabled, streamId]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 ${msg.isHighlighted ? 'bg-primary/10 p-2 rounded' : ''}`}
          >
            <span className="font-semibold text-primary">{msg.userName}: </span>
            <span>{msg.content}</span>
          </div>
        ))}
      </ScrollArea>

      <div className="p-2 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={disabled ? 'Chat disabled' : 'Send a message...'}
          disabled={disabled}
        />
        <Button onClick={sendMessage} disabled={disabled || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 9.5 Stream Reactions

```typescript
// src/components/stream/StreamReactions.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtime } from '@/contexts/realtime-context';
import { Button } from '@/components/ui/button';
import { Heart, Flame, Star, HandMetal, PartyPopper } from 'lucide-react';

interface FloatingReaction {
  id: string;
  type: string;
  x: number;
}

interface StreamReactionsProps {
  streamId: string;
  disabled?: boolean;
}

const REACTION_ICONS: Record<string, React.ReactNode> = {
  like: <Heart className="h-6 w-6 text-red-500 fill-red-500" />,
  fire: <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />,
  wow: <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />,
  clap: <HandMetal className="h-6 w-6 text-blue-500" />,
  party: <PartyPopper className="h-6 w-6 text-purple-500" />,
};

export function StreamReactions({ streamId, disabled }: StreamReactionsProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const { socket } = useRealtime();

  // Subscribe to reactions
  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data: { type: string }) => {
      const id = crypto.randomUUID();
      const x = 20 + Math.random() * 60; // Random position 20-80%

      setFloating(prev => [...prev, { id, type: data.type, x }]);

      // Remove after animation
      setTimeout(() => {
        setFloating(prev => prev.filter(r => r.id !== id));
      }, 2000);
    };

    socket.on(`stream:${streamId}:reaction`, handleReaction);

    return () => {
      socket.off(`stream:${streamId}:reaction`, handleReaction);
    };
  }, [socket, streamId]);

  const sendReaction = useCallback(async (type: string) => {
    if (disabled) return;

    try {
      await fetch(`/api/streams/${streamId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  }, [disabled, streamId]);

  return (
    <div className="relative">
      {/* Floating reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floating.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ y: '100%', x: `${reaction.x}%`, opacity: 1, scale: 1 }}
              animate={{ y: '-100%', opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute bottom-0"
            >
              {REACTION_ICONS[reaction.type]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction buttons */}
      <div className="flex gap-1 p-2">
        {Object.entries(REACTION_ICONS).map(([type, icon]) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => sendReaction(type)}
            disabled={disabled}
            className="hover:scale-110 transition-transform"
          >
            {icon}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. Scaling Considerations

### 10.1 Horizontal Scaling Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER                                    │
│                         (Geographic DNS / Anycast)                            │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   US-East     │          │   EU-West     │          │   APAC        │
│   Region      │          │   Region      │          │   Region      │
├───────────────┤          ├───────────────┤          ├───────────────┤
│               │          │               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │          │ ┌───────────┐ │
│ │ LiveKit   │ │◄────────►│ │ LiveKit   │ │◄────────►│ │ LiveKit   │ │
│ │ Server 1  │ │  Cascade │ │ Server 1  │ │  Cascade │ │ Server 1  │ │
│ └───────────┘ │          │ └───────────┘ │          │ └───────────┘ │
│ ┌───────────┐ │          │ ┌───────────┐ │          │ ┌───────────┐ │
│ │ LiveKit   │ │          │ │ LiveKit   │ │          │ │ LiveKit   │ │
│ │ Server 2  │ │          │ │ Server 2  │ │          │ │ Server 2  │ │
│ └───────────┘ │          │ └───────────┘ │          │ └───────────┘ │
│               │          │               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │          │ ┌───────────┐ │
│ │  Coturn   │ │          │ │  Coturn   │ │          │ │  Coturn   │ │
│ │  TURN     │ │          │ │  TURN     │ │          │ │  TURN     │ │
│ └───────────┘ │          │ └───────────┘ │          │ └───────────┘ │
│               │          │               │          │               │
│ ┌───────────┐ │          │ ┌───────────┐ │          │ ┌───────────┐ │
│ │  Redis    │◄┼──────────┼►│  Redis    │◄┼──────────┼►│  Redis    │ │
│ │  Cluster  │ │  Sync    │ │  Cluster  │ │  Sync    │ │  Cluster  │ │
│ └───────────┘ │          │ └───────────┘ │          │ └───────────┘ │
│               │          │               │          │               │
└───────────────┘          └───────────────┘          └───────────────┘
```

### 10.2 Capacity Planning

| Scenario                        | LiveKit Nodes | TURN Bandwidth | Redis   | Storage |
| ------------------------------- | ------------- | -------------- | ------- | ------- |
| Small (100 concurrent calls)    | 2             | 100 Mbps       | 1 node  | 100 GB  |
| Medium (1,000 concurrent calls) | 4-6           | 1 Gbps         | 3 nodes | 1 TB    |
| Large (10,000 concurrent calls) | 20-30         | 10 Gbps        | 6 nodes | 10 TB   |
| Enterprise (100,000+)           | 100+          | 100 Gbps       | Cluster | 100 TB+ |

### 10.3 Quality Adaptation (Simulcast)

```typescript
// LiveKit simulcast configuration
const publishDefaults = {
  simulcast: true,
  videoSimulcastLayers: [
    { width: 1280, height: 720, encoding: { maxBitrate: 1_500_000 } },
    { width: 640, height: 360, encoding: { maxBitrate: 500_000 } },
    { width: 320, height: 180, encoding: { maxBitrate: 150_000 } },
  ],
  screenShareSimulcastLayers: [
    { width: 1920, height: 1080, encoding: { maxBitrate: 3_000_000 } },
    { width: 1280, height: 720, encoding: { maxBitrate: 1_000_000 } },
  ],
}
```

### 10.4 Kubernetes Deployment

```yaml
# deploy/k8s/livekit-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: livekit-server
  namespace: nchat
spec:
  replicas: 3
  selector:
    matchLabels:
      app: livekit-server
  template:
    metadata:
      labels:
        app: livekit-server
    spec:
      containers:
        - name: livekit
          image: livekit/livekit-server:v1.7
          ports:
            - containerPort: 7880
              name: http
            - containerPort: 7881
              name: rtc-tcp
              protocol: TCP
            - containerPort: 7882
              name: rtc-udp
              protocol: UDP
          resources:
            requests:
              cpu: '2'
              memory: '4Gi'
            limits:
              cpu: '4'
              memory: '8Gi'
          env:
            - name: LIVEKIT_KEYS
              valueFrom:
                secretKeyRef:
                  name: livekit-secrets
                  key: api-keys
          volumeMounts:
            - name: config
              mountPath: /etc/livekit.yaml
              subPath: livekit.yaml
      volumes:
        - name: config
          configMap:
            name: livekit-config
---
apiVersion: v1
kind: Service
metadata:
  name: livekit-server
  namespace: nchat
spec:
  type: LoadBalancer
  ports:
    - port: 7880
      targetPort: 7880
      name: http
    - port: 7881
      targetPort: 7881
      protocol: TCP
      name: rtc-tcp
    - port: 7882
      targetPort: 7882
      protocol: UDP
      name: rtc-udp
  selector:
    app: livekit-server
```

---

## 11. nself Plugin Architecture

### 11.1 Plugin Recommendation

**Recommendation**: Create a new `webrtc` nself plugin that integrates with the existing `realtime` plugin.

### 11.2 Plugin Structure

```
nself-plugins/
├── packages/
│   └── webrtc/
│       ├── package.json
│       ├── README.md
│       ├── src/
│       │   ├── index.ts           # Main plugin entry
│       │   ├── config.ts          # Plugin configuration
│       │   ├── livekit/
│       │   │   ├── server.ts      # LiveKit server management
│       │   │   ├── tokens.ts      # Token generation
│       │   │   └── webhooks.ts    # Webhook handlers
│       │   ├── coturn/
│       │   │   ├── server.ts      # TURN server management
│       │   │   └── credentials.ts # Credential generation
│       │   ├── recordings/
│       │   │   ├── service.ts     # Recording management
│       │   │   └── retention.ts   # Retention policies
│       │   └── streaming/
│       │       ├── service.ts     # Streaming management
│       │       └── simulcast.ts   # RTMP destinations
│       ├── migrations/
│       │   └── 001_webrtc_tables.sql
│       ├── docker/
│       │   ├── livekit.yaml
│       │   ├── egress.yaml
│       │   └── turnserver.conf
│       └── tests/
│           └── *.test.ts
```

### 11.3 Plugin Configuration

```typescript
// nself-plugins/packages/webrtc/src/config.ts

export interface WebRTCPluginConfig {
  // LiveKit
  livekit: {
    enabled: boolean
    url: string
    apiKey: string
    apiSecret: string
    webhookSecret: string
  }

  // TURN/STUN
  turn: {
    enabled: boolean
    urls: string[]
    domain: string
    secret: string
    credentialTTL: number // seconds
  }

  // Recording
  recording: {
    enabled: boolean
    storage: 'minio' | 's3'
    bucket: string
    defaultRetentionDays: number
  }

  // Streaming
  streaming: {
    enabled: boolean
    maxConcurrentStreams: number
    hlsSegmentDuration: number
  }

  // Limits
  limits: {
    maxParticipantsPerCall: number
    maxCallDuration: number // minutes
    maxRecordingDuration: number // minutes
  }
}

export const defaultConfig: WebRTCPluginConfig = {
  livekit: {
    enabled: true,
    url: 'ws://localhost:7880',
    apiKey: '',
    apiSecret: '',
    webhookSecret: '',
  },
  turn: {
    enabled: true,
    urls: ['turn:turn.localhost:3478'],
    domain: 'localhost',
    secret: '',
    credentialTTL: 86400,
  },
  recording: {
    enabled: true,
    storage: 'minio',
    bucket: 'nchat-recordings',
    defaultRetentionDays: 30,
  },
  streaming: {
    enabled: true,
    maxConcurrentStreams: 10,
    hlsSegmentDuration: 4,
  },
  limits: {
    maxParticipantsPerCall: 100,
    maxCallDuration: 480, // 8 hours
    maxRecordingDuration: 480,
  },
}
```

### 11.4 Plugin Installation

```bash
# Install webrtc plugin
nself plugin install webrtc

# Initialize with configuration
nself plugin webrtc init \
  --livekit-api-key=<key> \
  --livekit-api-secret=<secret> \
  --turn-domain=turn.example.com

# Generate TURN credentials
nself plugin webrtc turn:credentials --user=<user-id>

# Verify installation
nself plugin webrtc status
```

### 11.5 Integration with Realtime Plugin

The `webrtc` plugin should integrate with the existing `realtime` plugin for signaling:

```typescript
// In realtime plugin, add WebRTC signaling events

export const WEBRTC_EVENTS = {
  // Call lifecycle
  CALL_INITIATE: 'call:initiate',
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPT: 'call:accept',
  CALL_DECLINE: 'call:decline',
  CALL_END: 'call:end',
  CALL_CANCELLED: 'call:cancelled',

  // Call state
  CALL_STATE_CHANGED: 'call:state_changed',
  CALL_PARTICIPANT_JOINED: 'call:participant_joined',
  CALL_PARTICIPANT_LEFT: 'call:participant_left',

  // Media state
  CALL_MUTE_CHANGED: 'call:mute_changed',
  CALL_VIDEO_CHANGED: 'call:video_changed',
  CALL_SCREEN_SHARE_STARTED: 'call:screen_share_started',
  CALL_SCREEN_SHARE_STOPPED: 'call:screen_share_stopped',

  // Recording
  RECORDING_STARTED: 'recording:started',
  RECORDING_STOPPED: 'recording:stopped',

  // Streaming
  STREAM_STARTED: 'stream:started',
  STREAM_ENDED: 'stream:ended',
  STREAM_CHAT: 'stream:chat',
  STREAM_REACTION: 'stream:reaction',
}
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Set up LiveKit server in Docker
- [ ] Configure Coturn TURN server
- [ ] Create database migrations
- [ ] Implement token generation service
- [ ] Set up webhook handling

### Phase 2: Core Calling (Week 3-4)

- [ ] Implement call initiation API
- [ ] Create LiveKit client wrapper
- [ ] Build call UI components
- [ ] Implement call store updates
- [ ] Add signaling events to realtime plugin

### Phase 3: Call Features (Week 5-6)

- [ ] Implement mute/unmute
- [ ] Add video toggle
- [ ] Implement screen sharing
- [ ] Add device selection
- [ ] Build connection quality monitoring

### Phase 4: Recording (Week 7-8)

- [ ] Implement recording service
- [ ] Configure egress for S3/MinIO
- [ ] Build recording UI
- [ ] Implement retention policies
- [ ] Add recording playback

### Phase 5: Live Streaming (Week 9-10)

- [ ] Implement streaming service
- [ ] Configure HLS output
- [ ] Build streaming UI (host)
- [ ] Build viewer experience
- [ ] Implement stream chat and reactions

### Phase 6: Mobile Integration (Week 11-12)

- [ ] Implement CallKit (iOS)
- [ ] Implement ConnectionService (Android)
- [ ] Add VoIP push notifications
- [ ] Test on physical devices
- [ ] Optimize for battery/performance

### Phase 7: Production Hardening (Week 13-14)

- [ ] Load testing (10k+ concurrent)
- [ ] Failover testing
- [ ] Security audit
- [ ] Documentation
- [ ] Final QA

---

## 13. Security Considerations

### 13.1 Authentication & Authorization

```typescript
// Token validation for all WebRTC APIs
export async function validateWebRTCAccess(
  userId: string,
  callId: string,
  requiredRole?: ParticipantRole
): Promise<boolean> {
  // 1. Verify user is authenticated
  // 2. Check call exists and is active
  // 3. Verify user is participant (or has permission)
  // 4. Check role-based permissions (host, co-host, etc.)
  return true
}
```

### 13.2 TURN Server Security

- **Ephemeral credentials**: Generate time-limited credentials per user
- **IP allowlisting**: Restrict relay to known IP ranges
- **Rate limiting**: Prevent abuse/DoS
- **TLS**: Always use TURNS (TLS-encrypted TURN)

### 13.3 E2EE Considerations

For Signal-grade E2EE with calls:

```typescript
// Note: E2EE breaks server-side recording
// Options:
// 1. Client-side recording only (upload after)
// 2. Insertable Streams API for E2EE with SFU
// 3. SFrame encryption (LiveKit supports this)

const room = new Room({
  e2ee: {
    keyProvider: new ExternalKeyProvider(),
    worker: new Worker('/e2ee-worker.js'),
  },
})
```

### 13.4 Input Validation

```typescript
// Validate all API inputs
import { z } from 'zod'

const initiateCallSchema = z.object({
  targetUserId: z.string().uuid(),
  type: z.enum(['audio', 'video']),
  channelId: z.string().uuid().optional(),
})

const startRecordingSchema = z.object({
  callId: z.string().uuid(),
  layout: z.enum(['grid', 'speaker', 'single']).optional(),
  resolution: z.enum(['720p', '1080p', '4k']).optional(),
})
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

```typescript
// src/lib/webrtc/__tests__/livekit-client.test.ts

import { liveKitClient } from '../livekit-client'
import { Room } from 'livekit-client'

// Mock LiveKit SDK
jest.mock('livekit-client')

describe('LiveKitClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('connect', () => {
    it('should connect to room with token', async () => {
      const mockRoom = { connected: true }
      ;(Room as jest.Mock).mockImplementation(() => mockRoom)

      const room = await liveKitClient.connect({
        url: 'ws://localhost:7880',
        token: 'test-token',
      })

      expect(room).toBeDefined()
    })

    it('should apply ICE servers when provided', async () => {
      // Test ICE server configuration
    })
  })

  describe('media controls', () => {
    it('should toggle camera', async () => {
      // Test camera enable/disable
    })

    it('should toggle microphone', async () => {
      // Test microphone enable/disable
    })

    it('should start/stop screen share', async () => {
      // Test screen sharing
    })
  })
})
```

### 14.2 Integration Tests

```typescript
// src/services/__tests__/recording-service.integration.test.ts

import { recordingService } from '../recording-service'

describe('RecordingService Integration', () => {
  // These tests require LiveKit running

  it('should start and stop recording', async () => {
    const egressId = await recordingService.startRecording({
      callId: 'test-call',
      roomName: 'test-room',
    })

    expect(egressId).toBeDefined()

    const result = await recordingService.stopRecording(egressId)
    expect(result.status).toBe('complete')
  })
})
```

### 14.3 E2E Tests

```typescript
// e2e/calls.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Voice/Video Calls', () => {
  test('should initiate and accept a call', async ({ page, context }) => {
    // User A initiates call
    const pageA = await context.newPage()
    await pageA.goto('/chat/user-b')
    await pageA.click('[data-testid="start-call"]')

    // User B receives call
    const pageB = await context.newPage()
    await pageB.goto('/chat/user-a')
    await expect(pageB.locator('[data-testid="incoming-call"]')).toBeVisible()

    // User B accepts
    await pageB.click('[data-testid="accept-call"]')

    // Both should be connected
    await expect(pageA.locator('[data-testid="call-connected"]')).toBeVisible()
    await expect(pageB.locator('[data-testid="call-connected"]')).toBeVisible()
  })

  test('should share screen during call', async ({ page }) => {
    // Setup call first...

    await page.click('[data-testid="share-screen"]')
    await expect(page.locator('[data-testid="screen-share-preview"]')).toBeVisible()
  })
})
```

### 14.4 Load Testing

```typescript
// load-tests/webrtc-load.ts

import { check } from 'k6'
import { WebSocket } from 'k6/experimental/websockets'

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up
    { duration: '1m', target: 1000 }, // Stay at 1000 concurrent calls
    { duration: '30s', target: 0 }, // Ramp down
  ],
}

export default function () {
  // Simulate call signaling
  const ws = new WebSocket('wss://api.nchat.local/realtime')

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        event: 'call:initiate',
        data: { targetUserId: 'load-test-user', type: 'audio' },
      })
    )
  }

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data)
    check(data, {
      'call initiated': (d) => d.event === 'call:incoming',
    })
  }
}
```

---

## Appendix A: References

### WebRTC Resources

- [WebRTC Signaling Best Practices](https://webrtc.ventures/2026/01/webrtc-tech-stack-guide-architecture-for-scalable-real-time-applications/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [WebRTC STUN/TURN Setup](https://webrtc.ventures/2025/01/how-to-set-up-self-hosted-stun-turn-servers-for-webrtc-applications/)

### LiveKit Documentation

- [LiveKit Overview](https://docs.livekit.io/)
- [LiveKit Server APIs](https://docs.livekit.io/reference/server/server-apis/)
- [LiveKit Client SDKs](https://docs.livekit.io/reference/)

### Media Server Comparisons

- [Janus vs mediasoup vs LiveKit](https://trembit.com/blog/choosing-the-right-sfu-janus-vs-mediasoup-vs-livekit-for-telemedicine-platforms/)
- [WebRTC Open Source Media Servers](https://bloggeek.me/webrtc-open-source-media-servers-github-2024/)

### Streaming

- [HLS vs DASH](https://www.mux.com/articles/hls-vs-dash-what-s-the-difference-between-the-video-streaming-protocols)
- [WebRTC to HLS/DASH](https://antmedia.io/webrtc-to-hls-dash/)
- [Mux vs Cloudflare Stream](https://www.mux.com/compare/cloudflare-stream)

### Recording

- [WebRTC Recording Challenges](https://bloggeek.me/webrtc-recording/)
- [Server-side vs Client-side Recording](https://bloggeek.me/recording-webrtc-sessions/)

---

## Appendix B: Glossary

| Term          | Definition                                                          |
| ------------- | ------------------------------------------------------------------- |
| **SFU**       | Selective Forwarding Unit - routes media without transcoding        |
| **MCU**       | Multipoint Control Unit - mixes/transcodes media centrally          |
| **TURN**      | Traversal Using Relays around NAT - relay server for connectivity   |
| **STUN**      | Session Traversal Utilities for NAT - discovers public IP           |
| **ICE**       | Interactive Connectivity Establishment - finds best connection path |
| **SDP**       | Session Description Protocol - describes media capabilities         |
| **Egress**    | Output from media server (recording, streaming)                     |
| **Ingress**   | Input to media server (RTMP, WHIP)                                  |
| **HLS**       | HTTP Live Streaming - Apple's adaptive streaming protocol           |
| **DASH**      | Dynamic Adaptive Streaming over HTTP - MPEG standard                |
| **Simulcast** | Publishing same content at multiple quality levels                  |
| **MoQ**       | Media over QUIC - emerging low-latency streaming protocol           |

---

_Document Version: 1.0.0_
_Last Updated: 2026-02-03_
_Author: nchat Development Team_
