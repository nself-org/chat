# Architecture Overview

This document describes the system architecture of nchat, including components, data flow, and design decisions.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Data Flow](#data-flow)
- [Real-time Architecture](#real-time-architecture)
- [Security Architecture](#security-architecture)
- [Scalability](#scalability)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Web App   │  │  Desktop    │  │   Mobile    │  │   PWA       │ │
│  │  (Next.js)  │  │  (Tauri)    │  │ (Capacitor) │  │             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │      Nginx        │
                          │  (Reverse Proxy)  │
                          └─────────┬─────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼─────────┐    ┌─────────▼─────────┐    ┌─────────▼─────────┐
│      Hasura       │    │       Auth        │    │      MinIO        │
│  (GraphQL API)    │    │ (Authentication)  │    │    (Storage)      │
└─────────┬─────────┘    └─────────┬─────────┘    └───────────────────┘
          │                        │
          └────────────┬───────────┘
                       │
             ┌─────────▼─────────┐
             │    PostgreSQL     │
             │    (Database)     │
             └───────────────────┘
```

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 | React framework with App Router |
| UI Library | React 19 | Component library |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | Radix UI | Accessible UI primitives |
| State | Zustand | Global state management |
| Data | Apollo Client | GraphQL client |
| Real-time | Socket.io | WebSocket connections |

### Application Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (chat)/            # Chat route group
│   │   ├── chat/
│   │   ├── channels/
│   │   └── messages/
│   ├── (admin)/           # Admin route group
│   │   ├── admin/
│   │   └── settings/
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Base UI components
│   ├── chat/              # Chat-specific components
│   ├── layout/            # Layout components
│   └── admin/             # Admin components
├── contexts/
│   ├── auth-context.tsx
│   ├── app-config-context.tsx
│   └── theme-context.tsx
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── services/              # Service classes
└── graphql/               # GraphQL operations
```

### Provider Hierarchy

```typescript
// Root layout provider stack
<NhostProvider>
  <AppConfigProvider>
    <ThemeProvider>
      <ApolloProvider>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  </AppConfigProvider>
</NhostProvider>
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Shell                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                       Header                             ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌───────────────┬─────────────────────────────────────────┐│
│  │               │                                          ││
│  │   Sidebar     │              Main Content                ││
│  │               │                                          ││
│  │  - Channels   │  ┌─────────────────────────────────────┐││
│  │  - DMs        │  │         Message List                │││
│  │  - Search     │  │                                     │││
│  │  - Settings   │  └─────────────────────────────────────┘││
│  │               │  ┌─────────────────────────────────────┐││
│  │               │  │         Message Input               │││
│  │               │  └─────────────────────────────────────┘││
│  └───────────────┴─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### nself CLI Stack

The backend is powered by nself CLI v0.4.2, which orchestrates:

| Service | Purpose | Port |
|---------|---------|------|
| PostgreSQL | Primary database | 5432 |
| Hasura | GraphQL engine | 8080 |
| Auth (Nhost) | Authentication | 4000 |
| Nginx | Reverse proxy | 80/443 |
| MinIO | S3-compatible storage | 9000 |
| Redis | Cache/sessions | 6379 |
| MeiliSearch | Full-text search | 7700 |

### Service Communication

```
┌───────────────────────────────────────────────────────────┐
│                         Nginx                              │
│                    (Port 80/443)                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  /v1/graphql  →  Hasura (8080)                      │  │
│  │  /v1/auth     →  Auth (4000)                        │  │
│  │  /v1/storage  →  MinIO (9000)                       │  │
│  │  /v1/search   →  MeiliSearch (7700)                 │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌─────────────────────┐       ┌─────────────────────┐
│    nchat_users      │       │   nchat_channels    │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID)           │──┐    │ id (UUID)           │
│ email               │  │    │ name                │
│ display_name        │  │    │ description         │
│ avatar_url          │  │    │ is_private          │
│ role_id             │  │    │ created_by          │──┐
│ status              │  │    │ created_at          │  │
│ created_at          │  │    └─────────────────────┘  │
└─────────────────────┘  │              │              │
         │               │              │              │
         │               │    ┌─────────▼──────────────┼───┐
         │               │    │  nchat_channel_members │   │
         │               │    ├────────────────────────┤   │
         │               │    │ channel_id             │   │
         │               │    │ user_id ───────────────┼───┘
         │               │    │ role                   │
         │               │    │ joined_at              │
         │               │    └────────────────────────┘
         │               │
         │    ┌──────────┴────────────┐
         │    │    nchat_messages     │
         │    ├───────────────────────┤
         │    │ id (UUID)             │
         │    │ content               │
         │    │ channel_id            │
         └────┤ user_id               │
              │ thread_id             │──┐ (self-reference)
              │ created_at            │  │
              │ updated_at            │  │
              └───────────────────────┘  │
                         ▲               │
                         └───────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│    nchat_roles      │       │ nchat_role_perms    │
├─────────────────────┤       ├─────────────────────┤
│ id (UUID)           │───────│ role_id             │
│ name                │       │ permission          │
│ color               │       │ granted             │
│ priority            │       └─────────────────────┘
└─────────────────────┘
```

## Data Flow

### Message Flow

```
1. User types message
         │
         ▼
2. Client sends GraphQL mutation
         │
         ▼
3. Hasura validates JWT & permissions
         │
         ▼
4. Hasura inserts into PostgreSQL
         │
         ▼
5. PostgreSQL triggers notify
         │
         ▼
6. Hasura subscription pushes to clients
         │
         ▼
7. All connected clients receive message
```

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│  Nginx  │────▶│  Auth   │────▶│ Postgres│
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │                               │
     │                               ▼
     │                        ┌─────────────┐
     │                        │ JWT Token   │
     │                        │ Generation  │
     │◀──────────────────────┤             │
     │         JWT            └─────────────┘
     │
     ▼
┌─────────┐
│ Store   │
│ Token   │
└─────────┘
```

### File Upload Flow

```
1. Client selects file
         │
         ▼
2. Request presigned URL from MinIO
         │
         ▼
3. Direct upload to MinIO
         │
         ▼
4. Store file reference in message
         │
         ▼
5. Other clients fetch via presigned URL
```

## Real-time Architecture

### WebSocket Connections

```typescript
// Socket.io connection management
const socket = io(SOCKET_URL, {
  auth: { token: jwt },
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
})

// Event handling
socket.on('message:new', handleNewMessage)
socket.on('message:update', handleMessageUpdate)
socket.on('message:delete', handleMessageDelete)
socket.on('user:typing', handleUserTyping)
socket.on('user:presence', handlePresenceChange)
```

### GraphQL Subscriptions

```graphql
subscription OnNewMessage($channelId: uuid!) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId } }
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    content
    user {
      id
      display_name
      avatar_url
    }
    created_at
  }
}
```

### Presence System

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│ Socket  │────▶│  Redis  │
│         │     │ Server  │     │         │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     │  heartbeat    │   presence    │
     │  (30s)        │   TTL (60s)   │
     │               │               │
     └───────────────┴───────────────┘
```

## Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────┐
│                    Client                            │
│  ┌─────────────────────────────────────────────────┐│
│  │              JWT Token Storage                   ││
│  │  - Access Token (memory)                        ││
│  │  - Refresh Token (httpOnly cookie)              ││
│  └─────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    Nginx                             │
│  - Rate limiting                                     │
│  - SSL termination                                   │
│  - Request validation                                │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    Hasura                            │
│  - JWT verification                                  │
│  - Role-based permissions                            │
│  - Row-level security                                │
└─────────────────────────────────────────────────────┘
```

### Permission Model

```typescript
enum Permission {
  // Channel permissions
  CHANNEL_CREATE = 'channel:create',
  CHANNEL_DELETE = 'channel:delete',
  CHANNEL_MANAGE = 'channel:manage',

  // Message permissions
  MESSAGE_SEND = 'message:send',
  MESSAGE_EDIT_OWN = 'message:edit_own',
  MESSAGE_EDIT_ANY = 'message:edit_any',
  MESSAGE_DELETE_OWN = 'message:delete_own',
  MESSAGE_DELETE_ANY = 'message:delete_any',

  // User permissions
  USER_MANAGE = 'user:manage',
  USER_BAN = 'user:ban',
  USER_KICK = 'user:kick',

  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  SETTINGS_MANAGE = 'settings:manage'
}
```

### Role Hierarchy

```
Owner (100)
   │
   ▼
Admin (80)
   │
   ▼
Moderator (60)
   │
   ▼
Member (40)
   │
   ▼
Guest (20)
```

## Scalability

### Horizontal Scaling

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
   │  Next.js  │    │  Next.js  │    │  Next.js  │
   │ Instance 1│    │ Instance 2│    │ Instance 3│
   └───────────┘    └───────────┘    └───────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Hasura    │
                    │  (Pooled)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  (Primary)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │  (Replica)  │
                    └─────────────┘
```

### Caching Strategy

| Layer | Cache | TTL | Purpose |
|-------|-------|-----|---------|
| Browser | localStorage | Permanent | User preferences |
| CDN | Edge cache | 1 hour | Static assets |
| Redis | In-memory | 5 minutes | Session, presence |
| PostgreSQL | Query cache | Dynamic | Frequent queries |

### Performance Considerations

1. **Message pagination**: Cursor-based, 50 messages per page
2. **Image optimization**: WebP conversion, lazy loading
3. **Bundle splitting**: Route-based code splitting
4. **Database indexes**: On all frequently queried columns
5. **Connection pooling**: PgBouncer for database connections

## Design Decisions

### Why GraphQL over REST?

- Real-time subscriptions built-in
- Flexible querying for different clients
- Strong typing with code generation
- Reduced over-fetching

### Why Hasura?

- Instant GraphQL API from PostgreSQL
- Built-in authorization
- Real-time subscriptions
- No backend code required for CRUD

### Why Zustand over Redux?

- Simpler API, less boilerplate
- Better TypeScript support
- Smaller bundle size
- Works well with React 19

### Why Socket.io + Subscriptions?

- Socket.io: Custom events, presence, typing
- Subscriptions: Database-driven real-time updates
- Best of both worlds

## Related Documentation

- [API Reference](API/README)
- [Database Schema](API/GraphQL#schema)
- [Security Guide](Deployment/Self-Hosted#security)
- [Performance Tuning](Deployment/Self-Hosted#performance)
