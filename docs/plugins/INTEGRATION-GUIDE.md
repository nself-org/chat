# Frontend Plugin Integration Guide

**Version**: ɳChat v0.9.1
**Date**: 2026-02-03

---

## Overview

This guide explains how to integrate ɳPlugins with the Next.js frontend. Each plugin requires:

1. **Environment Variables** - Frontend configuration
2. **API Routes** - Proxy endpoints to plugin services
3. **Service Layer** - TypeScript services wrapping API calls
4. **React Hooks** - Custom hooks for components
5. **Components** - UI components using the hooks

---

## Architecture Pattern

```
Component
   ↓ (uses)
React Hook
   ↓ (calls)
Service Layer
   ↓ (hits)
API Route (/app/api/*)
   ↓ (proxies to)
Plugin Service (Docker container)
```

---

## 1. Realtime Plugin Integration

### Environment Variables

**File**: `/.env.local`

```bash
# Realtime Plugin
NEXT_PUBLIC_REALTIME_URL=http://realtime.localhost:3101
NEXT_PUBLIC_REALTIME_WS_URL=ws://realtime.localhost:3101
```

### API Routes

**File**: `/src/app/api/realtime/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://realtime.localhost:3101'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${REALTIME_URL}/health`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Realtime service unavailable' }, { status: 503 })
  }
}
```

**File**: `/src/app/api/realtime/presence/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL

export async function GET(request: NextRequest) {
  const channelId = request.nextUrl.searchParams.get('channelId')

  try {
    const response = await fetch(`${REALTIME_URL}/presence/${channelId}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presence' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { channelId, userId, status } = body

  try {
    const response = await fetch(`${REALTIME_URL}/presence/${channelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status }),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 })
  }
}
```

### Service Layer Integration

**File**: `/src/services/realtime/realtime-client.ts`

Update to use plugin:

```typescript
import { io, Socket } from 'socket.io-client'

const REALTIME_WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'ws://realtime.localhost:3101'

export class RealtimeClient {
  private socket: Socket | null = null

  connect(userId: string, token: string) {
    this.socket = io(REALTIME_WS_URL, {
      auth: { userId, token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('[Realtime] Connected to plugin')
    })

    this.socket.on('disconnect', () => {
      console.log('[Realtime] Disconnected from plugin')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinChannel(channelId: string) {
    this.socket?.emit('channel:join', { channelId })
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('channel:leave', { channelId })
  }

  sendTyping(channelId: string, isTyping: boolean) {
    this.socket?.emit('typing', { channelId, isTyping })
  }

  updatePresence(status: 'online' | 'away' | 'dnd' | 'offline') {
    this.socket?.emit('presence:update', { status })
  }
}

export const realtimeClient = new RealtimeClient()
```

### React Hooks

**File**: `/src/hooks/use-realtime.ts`

```typescript
import { useEffect, useRef } from 'react'
import { realtimeClient } from '@/services/realtime/realtime-client'
import { useAuth } from '@/contexts/auth-context'

export function useRealtime() {
  const { user, session } = useAuth()
  const isConnected = useRef(false)

  useEffect(() => {
    if (user && session?.accessToken && !isConnected.current) {
      realtimeClient.connect(user.id, session.accessToken)
      isConnected.current = true
    }

    return () => {
      if (isConnected.current) {
        realtimeClient.disconnect()
        isConnected.current = false
      }
    }
  }, [user, session])

  return {
    joinChannel: realtimeClient.joinChannel.bind(realtimeClient),
    leaveChannel: realtimeClient.leaveChannel.bind(realtimeClient),
    sendTyping: realtimeClient.sendTyping.bind(realtimeClient),
    updatePresence: realtimeClient.updatePresence.bind(realtimeClient),
  }
}
```

---

## 2. Notifications Plugin Integration

### Environment Variables

```bash
NEXT_PUBLIC_NOTIFICATIONS_URL=http://notifications.localhost:3102
```

### API Routes

**File**: `/src/app/api/notifications/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const NOTIFICATIONS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const response = await fetch(`${NOTIFICATIONS_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
```

### Service Integration

**File**: `/src/services/notifications/notification.service.ts`

Update to use plugin:

```typescript
export class NotificationService {
  private baseUrl =
    process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || 'http://notifications.localhost:3102'

  async sendNotification(notification: NotificationPayload) {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    })
    return response.json()
  }

  async subscribeToEmailDigest(userId: string, frequency: 'daily' | 'weekly') {
    const response = await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emailDigest: { enabled: true, frequency } }),
    })
    return response.json()
  }
}
```

---

## 3. Jobs Plugin Integration

### Environment Variables

```bash
NEXT_PUBLIC_JOBS_URL=http://jobs.localhost:3105
NEXT_PUBLIC_BULLMQ_DASHBOARD_URL=http://queues.localhost:4200
```

### API Routes

**File**: `/src/app/api/jobs/schedule/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const JOBS_URL = process.env.NEXT_PUBLIC_JOBS_URL

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, payload, runAt } = body

  try {
    const response = await fetch(`${JOBS_URL}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload, runAt }),
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to schedule job' }, { status: 500 })
  }
}
```

### Service Integration

**File**: `/src/services/jobs/queue.service.ts`

Update to use plugin:

```typescript
export class JobQueueService {
  private baseUrl = process.env.NEXT_PUBLIC_JOBS_URL || 'http://jobs.localhost:3105'

  async scheduleJob(job: JobPayload) {
    const response = await fetch('/api/jobs/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job),
    })
    return response.json()
  }

  async getJobStatus(jobId: string) {
    const response = await fetch(`/api/jobs/${jobId}`)
    return response.json()
  }

  async cancelJob(jobId: string) {
    const response = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
    return response.json()
  }
}
```

---

## 4. File Processing Plugin Integration

### Environment Variables

```bash
NEXT_PUBLIC_FILE_PROCESSING_URL=http://files.localhost:3104
```

### API Routes

**File**: `/src/app/api/files/process/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const FILE_PROCESSING_URL = process.env.NEXT_PUBLIC_FILE_PROCESSING_URL

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  try {
    const response = await fetch(`${FILE_PROCESSING_URL}/process`, {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 })
  }
}
```

### Service Integration

**File**: `/src/services/files/upload.service.ts`

Update to use plugin:

```typescript
export class FileUploadService {
  private baseUrl = process.env.NEXT_PUBLIC_FILE_PROCESSING_URL || 'http://files.localhost:3104'

  async uploadAndProcess(file: File, options?: ProcessingOptions) {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      formData.append('options', JSON.stringify(options))
    }

    const response = await fetch('/api/files/process', {
      method: 'POST',
      body: formData,
    })
    return response.json()
  }

  async generateThumbnail(fileId: string) {
    const response = await fetch(`/api/files/${fileId}/thumbnail`, {
      method: 'POST',
    })
    return response.json()
  }
}
```

---

## 5. ID.me Plugin Integration

### Environment Variables

```bash
NEXT_PUBLIC_IDME_ENABLED=true
IDME_CLIENT_ID=your_client_id
IDME_CLIENT_SECRET=your_client_secret
```

### API Routes

**File**: `/src/app/api/auth/oauth/idme/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

const IDME_CLIENT_ID = process.env.IDME_CLIENT_ID
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/callback`

export async function GET(request: NextRequest) {
  const state = crypto.randomUUID()

  const authUrl = new URL('https://api.id.me/oauth/authorize')
  authUrl.searchParams.set('client_id', IDME_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
```

### Config Integration

**File**: `/src/config/auth.config.ts`

Update to include ID.me:

```typescript
export const authProviders = [
  // ... existing providers
  {
    id: 'idme',
    name: 'ID.me',
    enabled: process.env.NEXT_PUBLIC_IDME_ENABLED === 'true',
    icon: 'Shield',
    href: '/api/auth/oauth/idme',
    description: 'Military, first responders, students, teachers',
  },
]
```

---

## Testing Integration

### Health Check Tests

**File**: `/src/lib/__tests__/plugin-health.test.ts`

```typescript
describe('Plugin Health Checks', () => {
  it('should check realtime plugin health', async () => {
    const response = await fetch('/api/realtime')
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.status).toBe('healthy')
  })

  it('should check notifications plugin health', async () => {
    const response = await fetch('/api/notifications/health')
    expect(response.ok).toBe(true)
  })

  it('should check jobs plugin health', async () => {
    const response = await fetch('/api/jobs/health')
    expect(response.ok).toBe(true)
  })

  it('should check file-processing plugin health', async () => {
    const response = await fetch('/api/files/health')
    expect(response.ok).toBe(true)
  })
})
```

---

## Environment Variable Summary

Add to `/.env.local`:

```bash
# Plugin URLs (Development)
NEXT_PUBLIC_REALTIME_URL=http://realtime.localhost:3101
NEXT_PUBLIC_REALTIME_WS_URL=ws://realtime.localhost:3101
NEXT_PUBLIC_NOTIFICATIONS_URL=http://notifications.localhost:3102
NEXT_PUBLIC_JOBS_URL=http://jobs.localhost:3105
NEXT_PUBLIC_FILE_PROCESSING_URL=http://files.localhost:3104
NEXT_PUBLIC_BULLMQ_DASHBOARD_URL=http://queues.localhost:4200

# Plugin Feature Flags
NEXT_PUBLIC_REALTIME_ENABLED=true
NEXT_PUBLIC_NOTIFICATIONS_ENABLED=true
NEXT_PUBLIC_JOBS_ENABLED=true
NEXT_PUBLIC_FILE_PROCESSING_ENABLED=true
NEXT_PUBLIC_IDME_ENABLED=false

# Plugin Secrets (from vault)
IDME_CLIENT_ID=${IDME_CLIENT_ID}
IDME_CLIENT_SECRET=${IDME_CLIENT_SECRET}
```

---

## Integration Checklist

### Realtime Plugin

- [ ] Environment variables added
- [ ] API routes created
- [ ] RealtimeClient updated
- [ ] Hooks wired up
- [ ] WebSocket connection tested
- [ ] Presence working
- [ ] Typing indicators working

### Notifications Plugin

- [ ] Environment variables added
- [ ] API routes created
- [ ] NotificationService updated
- [ ] Email notifications tested
- [ ] Push notifications configured
- [ ] Preferences working

### Jobs Plugin

- [ ] Environment variables added
- [ ] API routes created
- [ ] JobQueueService updated
- [ ] Scheduled jobs tested
- [ ] BullMQ dashboard accessible
- [ ] Background tasks running

### File Processing Plugin

- [ ] Environment variables added
- [ ] API routes created
- [ ] FileUploadService updated
- [ ] Image processing tested
- [ ] Video thumbnails working
- [ ] Storage integration working

### ID.me Plugin

- [ ] Environment variables added
- [ ] OAuth routes created
- [ ] Auth config updated
- [ ] Login button working
- [ ] Callback handling tested
- [ ] User profile synced

---

## Deployment Notes

### Production Environment Variables

Use environment-specific URLs:

```bash
# Production
NEXT_PUBLIC_REALTIME_URL=https://realtime.nchat.io
NEXT_PUBLIC_REALTIME_WS_URL=wss://realtime.nchat.io
NEXT_PUBLIC_NOTIFICATIONS_URL=https://notifications.nchat.io
NEXT_PUBLIC_JOBS_URL=https://jobs.nchat.io
NEXT_PUBLIC_FILE_PROCESSING_URL=https://files.nchat.io
```

### Security

1. **CORS**: Configure plugin CORS to allow frontend domain
2. **Authentication**: Pass JWT tokens to plugins
3. **Rate Limiting**: Apply rate limits to public endpoints
4. **HTTPS Only**: Production must use HTTPS
5. **Secrets**: Use environment-specific secrets

---

## Next Steps

1. ✅ Copy environment variables to `.env.local`
2. ✅ Create API routes for each plugin
3. ✅ Update service layer to use plugins
4. ✅ Test health endpoints
5. ✅ Run integration tests
6. ✅ Update components to use integrated services
7. ✅ Document completion in PROGRESS.md

---

## Success Criteria

✅ All plugin environment variables configured
✅ All API routes created and tested
✅ All service layers updated
✅ All health checks passing
✅ Integration tests passing
✅ Components using plugin services
✅ Documentation complete
