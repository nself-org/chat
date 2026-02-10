# ɳPlugin Registry

**Version**: ɳChat v0.9.1
**Date**: 2026-02-03
**Total Plugins**: 13

---

## Plugin Categories

- **Communication** (3): Real-time, notifications, advanced-search
- **Infrastructure** (5): Jobs, file-processing, analytics, media-pipeline, workflows
- **Authentication** (1): idme
- **Billing** (1): stripe
- **DevOps** (2): github, shopify
- **AI** (1): ai-orchestration

---

## Core Plugins (Required for Full Functionality)

### 1. Realtime Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: communication
**Port**: 3101

**Features**:

- WebSocket server for instant messaging
- Presence tracking (online/away/dnd/offline)
- Typing indicators
- Live message delivery
- Room management

**Dependencies**: Redis
**Installation**: `nself plugin install realtime`
**Documentation**: `/docs/plugins/REALTIME-PLUGIN.md`

---

### 2. Notifications Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: communication
**Port**: 3102

**Features**:

- Push notifications (FCM, APNS)
- Email notifications (SMTP, SendGrid)
- SMS notifications (Twilio)
- In-app notification center
- User preferences

**Dependencies**: Mailpit (dev), SMTP (prod)
**Installation**: `nself plugin install notifications`
**Documentation**: `/docs/plugins/NOTIFICATIONS-PLUGIN.md`

---

### 3. Jobs Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3105

**Features**:

- BullMQ job queue
- Scheduled tasks (cron)
- Background processing
- Job retry logic
- Dashboard (http://queues.localhost:4200)

**Dependencies**: Redis
**Installation**: `nself plugin install jobs`
**Documentation**: `/docs/plugins/JOBS-PLUGIN.md`

---

### 4. File Processing Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3104

**Features**:

- Image resizing and optimization
- Video thumbnail generation
- Document preview
- EXIF metadata stripping
- Virus scanning

**Dependencies**: MinIO
**Installation**: `nself plugin install file-processing`
**Documentation**: `/docs/plugins/FILE-PROCESSING-PLUGIN.md`

---

## New Plugins (v0.9.1)

### 5. Analytics & Insights Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3106
**Priority**: P0 - Critical

**Features**:

- Real-time metrics (active users, messages, channels)
- User analytics (retention, engagement, lifecycle)
- Channel analytics (growth, activity, trends)
- Content analytics (popular topics, emoji usage)
- Custom dashboards and reports
- AI-powered insights

**Dependencies**: ClickHouse, Redis, PostgreSQL
**Installation**: `nself plugin install analytics`
**Documentation**: `/docs/plugins/ANALYTICS-PLUGIN.md`

**Use Cases**:

- Admin dashboard metrics
- Business intelligence reports
- User engagement tracking
- Platform health monitoring

---

### 6. Advanced Search Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: communication
**Port**: 3107
**Priority**: P0 - Critical

**Features**:

- Semantic search with AI
- Vector similarity search
- Full-text search with fuzzy matching
- Faceted filtering
- Auto-complete suggestions
- Multi-language support (50+ languages)

**Dependencies**: MeiliSearch, Qdrant, Redis
**Installation**: `nself plugin install advanced-search`
**Documentation**: `/docs/plugins/ADVANCED-SEARCH-PLUGIN.md`

**Use Cases**:

- Natural language search
- Find similar messages
- Filter by user/channel/date
- Search history and saved searches

---

### 7. Media Processing Pipeline Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3108
**Priority**: P0 - Critical

**Features**:

- Image processing (resize, optimize, convert)
- Video transcoding (H.264, H.265, VP9)
- HLS/DASH adaptive streaming
- Audio transcoding and normalization
- Document OCR and text extraction
- AI features (NSFW detection, object detection)

**Dependencies**: MinIO, FFmpeg, Redis
**Installation**: `nself plugin install media-pipeline`
**Documentation**: `/docs/plugins/MEDIA-PIPELINE-PLUGIN.md`

**Use Cases**:

- Professional media management
- Video streaming
- Automatic image optimization
- Content moderation

---

### 8. AI Orchestration Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: ai
**Port**: 3109
**Priority**: P1 - High

**Features**:

- Multi-provider support (OpenAI, Anthropic, Google, Ollama)
- Cost management and tracking
- Rate limiting (per-user, per-org)
- Response caching
- Quality assurance (toxicity filter, PII detection)

**Dependencies**: Redis
**Installation**: `nself plugin install ai-orchestration`
**Documentation**: `/docs/plugins/AI-ORCHESTRATION-PLUGIN.md`

**Use Cases**:

- Unified AI API
- Cost control and budgeting
- Content moderation
- Text summarization and embeddings

---

### 9. Workflow Automation Plugin

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Category**: infrastructure
**Port**: 3110
**Priority**: P1 - High

**Features**:

- Visual workflow builder
- Event triggers (messages, channels, users, webhooks)
- Actions (send message, HTTP request, database query)
- Conditions (if/else, loops, pattern matching)
- Pre-built templates
- 1000+ integrations

**Dependencies**: Redis, PostgreSQL
**Installation**: `nself plugin install workflows`
**Documentation**: `/docs/plugins/WORKFLOWS-PLUGIN.md`

**Use Cases**:

- Automated welcome messages
- Scheduled reminders
- Cross-channel posting
- Third-party integrations

---

## Integration Plugins (Optional)

### 10. ID.me Plugin

**Status**: ✅ Documented
**Version**: 1.0.0
**Category**: authentication
**Priority**: P2 - Medium

**Features**:

- Identity verification
- Specialized login (military, first responders, students, teachers)
- OAuth 2.0 integration
- Group affiliation verification

**Dependencies**: None
**Installation**: `nself plugin install idme`
**Documentation**: `/docs/plugins/IDME-PLUGIN.md`

**Setup Required**:

- ID.me developer account
- OAuth application credentials

---

### 11. Stripe Plugin

**Status**: ✅ Documented
**Version**: 1.0.0
**Category**: billing
**Priority**: P2 - Low

**Features**:

- Payment processing
- Subscription management
- Invoice generation
- Webhook handling
- Customer portal

**Dependencies**: None
**Installation**: `nself plugin install stripe`
**Documentation**: `/docs/plugins/STRIPE-PLUGIN.md`

**Setup Required**:

- Stripe account
- API keys
- Webhook configuration

---

### 12. GitHub Plugin

**Status**: ✅ Documented
**Version**: 1.0.0
**Category**: devops
**Priority**: P2 - Low

**Features**:

- Repository integration
- Issue/PR notifications
- Commit notifications
- Code snippet embeds
- OAuth authentication

**Dependencies**: None
**Installation**: `nself plugin install github`
**Documentation**: `/docs/plugins/GITHUB-PLUGIN.md`

**Setup Required**:

- GitHub OAuth App
- GitHub App (for webhooks)

---

### 13. Shopify Plugin

**Status**: ✅ Documented
**Version**: 1.0.0
**Category**: ecommerce
**Priority**: P2 - Low

**Features**:

- E-commerce store sync
- Order notifications
- Product embeds
- Customer support chat

**Dependencies**: None
**Installation**: `nself plugin install shopify`
**Documentation**: `/docs/plugins/SHOPIFY-PLUGIN.md`

**Setup Required**:

- Shopify Partner account
- App credentials

---

## Installation Priority

### Phase 1: Core Communication (MUST HAVE)

1. ✅ Realtime
2. ✅ Notifications
3. ✅ Jobs
4. ✅ File Processing

### Phase 2: Enhanced Capabilities (SHOULD HAVE)

5. ✅ Analytics
6. ✅ Advanced Search
7. ✅ Media Pipeline
8. ✅ AI Orchestration
9. ✅ Workflows

### Phase 3: Authentication & Integrations (NICE TO HAVE)

10. ⏳ ID.me
11. ⏳ Stripe
12. ⏳ GitHub
13. ⏳ Shopify

---

## Port Allocation

| Plugin           | Port | Domain                  |
| ---------------- | ---- | ----------------------- |
| Realtime         | 3101 | realtime.localhost      |
| Notifications    | 3102 | notifications.localhost |
| File Processing  | 3104 | files.localhost         |
| Jobs             | 3105 | jobs.localhost          |
| Analytics        | 3106 | analytics.localhost     |
| Advanced Search  | 3107 | search.localhost        |
| Media Pipeline   | 3108 | media.localhost         |
| AI Orchestration | 3109 | ai.localhost            |
| Workflows        | 3110 | workflows.localhost     |

**Reserved**: 3103 (future use)

---

## Resource Requirements

### Total Resources (All Plugins Installed)

- **CPU**: 8+ cores recommended
- **Memory**: 12GB+ recommended
- **Storage**: 150GB+ recommended
- **Network**: 100Mbps+ recommended

### Development Environment (Minimum)

- **CPU**: 4 cores
- **Memory**: 8GB
- **Storage**: 50GB
- **Network**: 10Mbps

### Production Environment (Recommended)

- **CPU**: 16+ cores
- **Memory**: 32GB+
- **Storage**: 500GB+ SSD
- **Network**: 1Gbps+

---

## Plugin Dependencies

```
Core Services (Required):
├── PostgreSQL
├── Redis
├── MinIO
└── Nginx

Plugin-Specific:
├── ClickHouse (Analytics)
├── MeiliSearch (Advanced Search)
├── Qdrant (Advanced Search - Vector)
└── FFmpeg (Media Pipeline)
```

---

## Management Commands

### List All Plugins

```bash
nself plugin list
```

### List Installed Plugins

```bash
nself plugin list --installed
```

### Install Plugin

```bash
nself plugin install <plugin-name>
```

### Remove Plugin

```bash
nself plugin remove <plugin-name>
```

### Update Plugin

```bash
nself plugin update <plugin-name>
```

### Check Plugin Status

```bash
nself plugin status
nself plugin status <plugin-name>
```

### View Plugin Logs

```bash
nself logs <plugin-name>
nself logs <plugin-name> --tail 100
nself logs <plugin-name> --follow
```

---

## Registry Metadata

**Primary Registry**: https://plugins.nself.org
**Fallback Registry**: https://github.com/acamarata/nself-plugins
**Cache TTL**: 300 seconds (5 minutes)
**Installation Directory**: `~/.nself/plugins`

---

## Support & Resources

- **Plugin Documentation**: `/docs/plugins/`
- **Installation Guide**: `/docs/plugins/NEW-PLUGINS-INSTALLATION-GUIDE.md`
- **Integration Guide**: `/docs/plugins/INTEGRATION-GUIDE.md`
- **Issues**: https://github.com/acamarata/nself-plugins/issues
- **Discord**: https://discord.gg/nself
- **Email**: support@nself.org

---

## Version History

### v0.9.1 (2026-02-03)

- Added Analytics & Insights plugin
- Added Advanced Search plugin
- Added Media Processing Pipeline plugin
- Added AI Orchestration plugin
- Added Workflow Automation plugin

### v0.9.0 (2026-02-01)

- Initial plugin system release
- Added Realtime plugin
- Added Notifications plugin
- Added Jobs plugin
- Added File Processing plugin
- Added ID.me plugin (documented)
- Added Stripe plugin (documented)
- Added GitHub plugin (documented)
- Added Shopify plugin (documented)

---

**Last Updated**: 2026-02-03
**Registry Version**: 2.0
**Total Plugins**: 13 (9 production ready, 4 documented)
