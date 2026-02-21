# ɳChat v0.9.1 - ɳPlugins Inventory

**Created**: 2026-02-03
**Status**: Phase 2 - Plugin Installation
**nself CLI Version**: v0.9.8

---

## Overview

This document inventories all ɳPlugins required for ɳChat functionality. Each plugin provides specific backend capabilities that the Next.js frontend integrates with.

---

## Plugin Architecture

ɳPlugins are installed via `nself plugin install <name>` and run as Docker services alongside the core nself stack (PostgreSQL, Hasura, Auth, Nginx).

**Installation Pattern**:

```bash
cd backend/
nself plugin install <plugin-name>
nself restart
```

**Configuration**: Each plugin has environment variables in `.env` (loaded from examples)

**Integration**: Frontend connects via API routes in `src/app/api/` that proxy to plugin services

---

## Required Plugins for ɳChat

### 1. Realtime Plugin (CRITICAL)

**Package**: `realtime`
**Version**: 1.0.0
**Category**: communication
**Status**: ❌ NOT INSTALLED

**Purpose**:

- WebSocket server for real-time messaging
- Presence tracking (online/away/dnd/offline)
- Typing indicators
- Live message delivery
- Room management

**Environment Variables**:

```bash
REALTIME_ENABLED=true
REALTIME_PORT=3101
REALTIME_ROUTE=realtime.${BASE_DOMAIN:-localhost}
REALTIME_MEMORY=256M
REALTIME_WEBSOCKET_MAX_CONNECTIONS=10000
REALTIME_PRESENCE_TIMEOUT=30000
REALTIME_TYPING_TIMEOUT=3000
REALTIME_REDIS_HOST=redis
REALTIME_REDIS_PORT=6379
REALTIME_REDIS_DB=1
```

**Frontend Integration**:

- `src/services/realtime/` (already created)
- `src/hooks/use-realtime.ts`
- `src/hooks/use-realtime-presence.ts`
- `src/hooks/use-realtime-typing.ts`

**Dependencies**: Redis (already in stack)

---

### 2. Notifications Plugin (CRITICAL)

**Package**: `notifications`
**Version**: 1.0.0
**Category**: communication
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Push notifications (FCM, APNS)
- Email notifications (SMTP, SendGrid)
- SMS notifications (Twilio)
- In-app notification center
- Notification preferences

**Environment Variables**:

```bash
NOTIFICATIONS_ENABLED=true
NOTIFICATIONS_PORT=3102
NOTIFICATIONS_ROUTE=notifications.${BASE_DOMAIN:-localhost}
NOTIFICATIONS_MEMORY=128M
NOTIFICATIONS_EMAIL_PROVIDER=mailpit
NOTIFICATIONS_SMTP_HOST=mailpit
NOTIFICATIONS_SMTP_PORT=1025
NOTIFICATIONS_FROM_EMAIL=noreply@nchat.local
NOTIFICATIONS_FROM_NAME=nself Chat
```

**Frontend Integration**:

- `src/services/notifications/` (already created)
- `src/app/api/notifications/`
- `src/components/notifications/`

**Dependencies**: Mailpit (dev), SMTP (prod)

---

### 3. Jobs Plugin (HIGH PRIORITY)

**Package**: `jobs`
**Version**: 1.0.0
**Category**: infrastructure
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Background job queue (BullMQ)
- Scheduled tasks (cron)
- Message cleanup
- Database backups
- Analytics generation
- Email digests

**Environment Variables**:

```bash
JOBS_ENABLED=true
JOBS_PORT=3105
JOBS_ROUTE=jobs.${BASE_DOMAIN:-localhost}
JOBS_MEMORY=256M
JOBS_REDIS_HOST=redis
JOBS_REDIS_PORT=6379
JOBS_REDIS_DB=2
JOBS_CONCURRENCY=5
JOBS_MAX_RETRIES=3
JOBS_RETRY_DELAY=5000
JOBS_CLEANUP_OLD_MESSAGES_ENABLED=true
JOBS_CLEANUP_OLD_MESSAGES_SCHEDULE="0 2 * * *"
JOBS_CLEANUP_OLD_MESSAGES_DAYS=90
JOBS_GENERATE_ANALYTICS_ENABLED=true
JOBS_GENERATE_ANALYTICS_SCHEDULE="0 0 * * *"
```

**Frontend Integration**:

- `src/services/jobs/` (already created)
- `src/hooks/use-job-queue.ts`
- `src/hooks/use-job-status.ts`

**Dashboard**: BullMQ Dashboard at `http://queues.localhost:4200`

**Dependencies**: Redis (already in stack)

---

### 4. File Processing Plugin (HIGH PRIORITY)

**Package**: `file-processing`
**Version**: 1.0.0
**Category**: infrastructure
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Image resizing and optimization
- Video thumbnail generation
- Document preview (PDF, Office)
- EXIF metadata stripping
- Virus scanning

**Environment Variables**:

```bash
FILE_PROCESSING_ENABLED=true
FILE_PROCESSING_PORT=3104
FILE_PROCESSING_ROUTE=files.${BASE_DOMAIN:-localhost}
FILE_PROCESSING_MEMORY=512M
FILE_PROCESSING_S3_ENDPOINT=http://minio:9000
FILE_PROCESSING_S3_BUCKET=${S3_BUCKET:-nchat-files}
FILE_PROCESSING_S3_ACCESS_KEY=minioadmin
FILE_PROCESSING_S3_SECRET_KEY=minioadmin
FILE_PROCESSING_IMAGE_MAX_WIDTH=2048
FILE_PROCESSING_IMAGE_MAX_HEIGHT=2048
FILE_PROCESSING_IMAGE_QUALITY=85
FILE_PROCESSING_THUMBNAIL_SIZE=200
FILE_PROCESSING_VIDEO_THUMBNAIL_ENABLED=true
FILE_PROCESSING_VIDEO_THUMBNAIL_TIME=1
```

**Frontend Integration**:

- `src/services/files/` (already created)
- `src/app/api/files/`
- `src/components/files/`

**Dependencies**: MinIO (already in stack)

---

### 5. ID.me Plugin (MEDIUM PRIORITY)

**Package**: `idme`
**Version**: 1.0.0
**Category**: authentication
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Identity verification
- Specialized login (military, students, teachers)
- OAuth 2.0 integration
- Group affiliation verification

**Environment Variables**:

```bash
IDME_ENABLED=true
IDME_CLIENT_ID=${IDME_CLIENT_ID}
IDME_CLIENT_SECRET=${IDME_CLIENT_SECRET}
IDME_REDIRECT_URI=https://${BASE_DOMAIN}/api/auth/oauth/callback
IDME_SCOPE=openid,profile,email
```

**Frontend Integration**:

- `src/app/api/auth/oauth/callback/route.ts` (already exists)
- `src/config/auth.config.ts` (ID.me provider config)

**Setup Requirements**:

- ID.me developer account
- OAuth application credentials

---

### 6. Stripe Plugin (LOW PRIORITY - Future)

**Package**: `stripe`
**Version**: 1.0.0
**Category**: billing
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Payment processing
- Subscription management
- Invoice generation
- Webhook handling
- Customer portal

**Environment Variables**:

```bash
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
```

**Frontend Integration**:

- `src/app/api/billing/` (to be created)
- Stripe Elements integration

**Setup Requirements**:

- Stripe account
- API keys

**Note**: Not required for MVP, but needed for monetization

---

### 7. GitHub Plugin (LOW PRIORITY - Integration)

**Package**: `github`
**Version**: 1.0.0
**Category**: devops
**Status**: ❌ NOT INSTALLED

**Purpose**:

- Repository integration
- Issue/PR notifications
- Commit notifications
- Code snippet embeds
- OAuth authentication

**Environment Variables**:

```bash
GITHUB_ENABLED=true
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GITHUB_WEBHOOK_SECRET=${GITHUB_WEBHOOK_SECRET}
```

**Frontend Integration**:

- `src/app/api/integrations/github/` (to be created)
- Webhook receiver

**Setup Requirements**:

- GitHub OAuth App
- GitHub App (for webhooks)

**Note**: Nice-to-have for developer teams

---

### 8. Shopify Plugin (LOW PRIORITY - E-commerce)

**Package**: `shopify`
**Version**: 1.0.0
**Category**: ecommerce
**Status**: ❌ NOT INSTALLED

**Purpose**:

- E-commerce store sync
- Order notifications
- Product embeds
- Customer support chat

**Environment Variables**:

```bash
SHOPIFY_ENABLED=true
SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
SHOPIFY_API_SECRET=${SHOPIFY_API_SECRET}
SHOPIFY_SCOPES=read_products,read_orders
```

**Frontend Integration**:

- `src/app/api/integrations/shopify/` (to be created)

**Setup Requirements**:

- Shopify Partner account
- App credentials

**Note**: Optional for e-commerce use cases

---

## Installation Priority

### Phase 1: Core Communication (MUST HAVE)

1. **Realtime** - Required for chat functionality
2. **Notifications** - Required for user engagement
3. **Jobs** - Required for background tasks
4. **File Processing** - Required for media sharing

### Phase 2: Authentication Enhancement (SHOULD HAVE)

5. **ID.me** - Enables specialized identity verification

### Phase 3: Monetization & Integrations (NICE TO HAVE)

6. **Stripe** - When billing is needed
7. **GitHub** - For developer community features
8. **Shopify** - For e-commerce use cases

---

## Installation Checklist

### Pre-Installation

- [x] nself CLI v0.9.8 installed
- [x] Backend folder exists (`backend/`)
- [x] Docker and Docker Compose available
- [ ] Backend services running

### Core Plugins (Phase 1)

- [ ] Realtime plugin installed
- [ ] Realtime plugin configured
- [ ] Realtime plugin tested
- [ ] Notifications plugin installed
- [ ] Notifications plugin configured
- [ ] Notifications plugin tested
- [ ] Jobs plugin installed
- [ ] Jobs plugin configured
- [ ] Jobs plugin tested
- [ ] File Processing plugin installed
- [ ] File Processing plugin configured
- [ ] File Processing plugin tested

### Auth Plugins (Phase 2)

- [ ] ID.me plugin installed
- [ ] ID.me plugin configured
- [ ] ID.me plugin tested

### Integration Plugins (Phase 3)

- [ ] Stripe plugin installed
- [ ] GitHub plugin installed
- [ ] Shopify plugin installed

---

## Testing Strategy

Each plugin must pass:

1. **Health Check**: Plugin service responds to health endpoint
2. **API Test**: Frontend API route successfully proxies to plugin
3. **Integration Test**: End-to-end test with real data
4. **Error Handling**: Graceful degradation if plugin unavailable

---

## Documentation Updates Required

After plugin installation:

- [ ] Update `.claude/PROGRESS.md` with completion evidence
- [ ] Update `backend/README.md` with plugin list
- [ ] Update `docs/PLUGIN-INVENTORY.md` with status
- [ ] Create plugin-specific docs in `docs/plugins/`
- [ ] Update `src/app/api/` with integration examples
- [ ] Update `README.md` with plugin features

---

## Next Steps

1. Start backend services: `cd backend && nself start`
2. Install core plugins: `nself plugin install realtime notifications jobs file-processing`
3. Copy `.backend/.env.plugins.example` to `backend/.env.plugins`
4. Configure plugin environment variables
5. Restart services: `nself restart`
6. Test each plugin health endpoint
7. Wire frontend integration code
8. Run integration tests
9. Document completion in PROGRESS.md

---

## Plugin Registry

**Primary**: https://plugins.nself.org
**Fallback**: https://github.com/nself-org/plugins

**Cache TTL**: 300 seconds (5 minutes)
**Installation Dir**: `~/.nself/plugins`

---

## Troubleshooting

### Plugin Not Found

```bash
nself plugin refresh  # Force refresh registry cache
nself plugin list     # Verify plugin availability
```

### Plugin Won't Start

```bash
nself logs <plugin-name>  # Check plugin logs
nself doctor              # Run diagnostics
```

### Plugin Health Check Fails

- Verify environment variables in `backend/.env.plugins`
- Check port conflicts
- Ensure dependent services (Redis, MinIO) are running

---

## Success Criteria

✅ All 8 plugins inventoried and documented
✅ Installation priority established
✅ Environment variables documented
✅ Frontend integration points identified
✅ Testing strategy defined
✅ Documentation plan created

**Next**: Begin Phase 1 plugin installations (Tasks 12-19)
