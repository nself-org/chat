# Backend Services Evaluation & nself Plugin Candidates

**Date**: January 30, 2026
**Project**: nself-chat
**nself Version**: v0.8.0

---

## 📊 Current Backend Status

### Custom Services (CS_1 through CS_7)

| Service | Port | Status | Implementation | Priority |
|---------|------|--------|----------------|----------|
| **CS_1: Actions** | 3100 | 🟡 Scaffold | Empty files | High |
| **CS_2: Realtime** | 3101 | 🟡 Scaffold | Empty files | Critical |
| **CS_3: Notifications** | 3102 | 🟡 Scaffold | Empty files | High |
| **CS_4: Integrations** | 3103 | 🟡 Scaffold | Empty files | High |
| **CS_5: Files** | 3104 | 🟡 Scaffold | Empty files | Critical |
| **CS_6: Worker** | 3105 | 🟡 Scaffold | Empty files | Medium |
| **CS_7: AI** | 3106 | 🟡 Scaffold | Empty files | Low |

**Summary**: All 7 services are **configured** in `.backend/.env.dev` with proper Docker setup, but have **zero implementation** (all files are 0 bytes).

---

## 🎯 nself Plugin Candidates

Based on analysis of the frontend features and common SaaS needs, here are candidates for nself plugins:

---

## 🔴 Category 1: CRITICAL (Should be Core nself Plugins)

These are fundamental to most modern apps and should be battle-tested, reusable plugins.

### 1. Real-Time Communication Plugin ⭐⭐⭐⭐⭐

**Use Case**: Socket.io server for live features
**Current**: CS_2 configured but not implemented
**What it needs**:
- Socket.io server with Redis adapter (multi-instance)
- Presence tracking (who's online)
- Typing indicators
- Live updates / real-time sync
- Call signaling (WebRTC)
- Room management

**Plugin Interface**:
```bash
nself plugin install realtime
# Auto-configures CS_N with Socket.io + Redis
# Generates:
#   .backend/services/realtime/
#   Frontend SDK: @nself/realtime-client
#   TypeScript types for events
```

**Frontend Integration**:
```typescript
import { useRealtime } from '@nself/realtime-client'

const {
  sendTyping,
  onTyping,
  updatePresence,
  onPresenceChange,
  joinRoom,
  leaveRoom
} = useRealtime()
```

**Features Used in nchat**:
- Typing indicators (src/components/presence/)
- Online status (src/components/presence/)
- Live message updates
- Voice/video call signaling (src/components/call/)
- Channel join/leave events

---

### 2. File Upload & Processing Plugin ⭐⭐⭐⭐⭐

**Use Case**: Complete file upload pipeline
**Current**: CS_5 configured but not implemented
**What it needs**:
- Multipart upload handler
- MinIO/S3 integration
- Image thumbnails (AVIF/WebP)
- Video thumbnails
- File type validation
- Virus scanning (ClamAV)
- Size limits
- Direct upload to storage (presigned URLs)

**Plugin Interface**:
```bash
nself plugin install file-upload --features thumbnails,virus-scan
# Configures:
#   - Upload endpoint: /upload
#   - Thumbnail generation
#   - Optional virus scanning
#   - GraphQL mutations
```

**Frontend Integration**:
```typescript
import { useFileUpload } from '@nself/file-upload-client'

const { upload, uploadProgress, cancel } = useFileUpload({
  maxSize: '100MB',
  accept: 'image/*,video/*,application/pdf'
})

const result = await upload(file)
// Returns: { id, url, thumbnailUrl, mimeType, size }
```

**Features Used in nchat**:
- File attachments (src/components/upload/, src/components/files/)
- Image uploads
- Avatar uploads
- Document uploads
- Media gallery

---

### 3. Notification System Plugin ⭐⭐⭐⭐⭐

**Use Case**: Multi-channel notifications
**Current**: CS_3 configured but not implemented
**What it needs**:
- Push notifications (web push, mobile)
- Email notifications (templating)
- SMS notifications (Twilio)
- In-app notifications
- Notification preferences
- Delivery tracking
- Template system
- Batching/digests

**Plugin Interface**:
```bash
nself plugin install notifications --channels push,email,sms
# Configures:
#   - Notification service
#   - Template engine
#   - Delivery queue (BullMQ)
#   - Preferences API
```

**Frontend Integration**:
```typescript
import { useNotifications } from '@nself/notifications-client'

const {
  notifications,
  markAsRead,
  preferences,
  updatePreferences
} = useNotifications()
```

**Features Used in nchat**:
- Desktop notifications (platforms/electron/)
- Push notifications (platforms/capacitor/, platforms/react-native/)
- Email notifications (src/components/notifications/)
- In-app notification center (src/components/notifications/)

---

### 4. OAuth & Social Login Plugin ⭐⭐⭐⭐⭐

**Use Case**: Turnkey social authentication
**Current**: CS_4 (integrations) partially covers this
**What it needs**:
- OAuth 2.0 flow handlers
- Pre-built providers (Google, GitHub, Microsoft, Apple, etc.)
- Token exchange
- Profile normalization
- Nhost Auth integration
- PKCE support
- State validation

**Plugin Interface**:
```bash
nself plugin install oauth --providers google,github,microsoft,apple
# Prompts for credentials
# Generates callback routes
# Integrates with Nhost Auth
```

**Frontend Integration**:
```typescript
import { OAuthButton } from '@nself/oauth-client'

<OAuthButton provider="google" onSuccess={handleLogin} />
<OAuthButton provider="github" onSuccess={handleLogin} />
```

**Features Used in nchat**:
- Google login (src/components/auth/)
- GitHub login
- Microsoft login
- Apple login
- ID.me (military verification)
- SAML (enterprise)

---

### 5. Search Plugin ⭐⭐⭐⭐

**Use Case**: Full-text search with MeiliSearch
**Current**: MeiliSearch configured but not integrated
**What it needs**:
- Auto-indexing from PostgreSQL
- Search API endpoints
- Fuzzy search
- Typo tolerance
- Faceted search
- Highlighting
- Search suggestions
- Index management

**Plugin Interface**:
```bash
nself plugin install search --engine meilisearch --index nchat_messages,nchat_users,nchat_channels
# Auto-configures:
#   - MeiliSearch indexes
#   - PostgreSQL triggers for real-time indexing
#   - Search API
#   - Frontend SDK
```

**Frontend Integration**:
```typescript
import { useSearch } from '@nself/search-client'

const { results, search, loading } = useSearch('nchat_messages')

search('hello world')
// Returns: { hits, query, processingTime }
```

**Features Used in nchat**:
- Message search (src/components/search/)
- User search
- Channel search
- File search
- Global search (command palette)

---

### 6. Background Jobs Plugin ⭐⭐⭐⭐

**Use Case**: Async task processing
**Current**: CS_6 configured with BullMQ
**What it needs**:
- Job queue (BullMQ)
- Job scheduling (cron)
- Retry logic
- Job monitoring dashboard
- Job templates
- Worker management
- Rate limiting
- Priority queues

**Plugin Interface**:
```bash
nself plugin install jobs
nself job create send-welcome-email --schedule "0 0 * * *"
# Generates:
#   .backend/jobs/send-welcome-email.ts
#   Registers with BullMQ
#   Adds to dashboard
```

**Features Used in nchat**:
- Email digests
- Message cleanup (disappearing messages)
- Analytics aggregation
- Report generation
- Backup jobs

---

## 🟡 Category 2: HIGH VALUE (Common SaaS Features)

### 7. Payments & Billing Plugin ⭐⭐⭐⭐

**Use Case**: Stripe/subscription integration
**What it needs**:
- Stripe subscription management
- Webhook handlers
- Usage-based billing
- Invoice generation
- Payment methods
- Dunning management
- Metered billing
- Tax calculation (Stripe Tax)

**Plugin Interface**:
```bash
nself plugin install stripe
# Configures:
#   - Subscription management
#   - Webhook endpoints
#   - Customer portal
#   - Usage tracking
```

**Features Used in nchat**:
- Paid plans (src/components/payments/)
- Usage limits
- Billing portal

---

### 8. Analytics Plugin ⭐⭐⭐⭐

**Use Case**: Product analytics
**What it needs**:
- Event tracking
- User analytics
- Funnel analysis
- Retention metrics
- A/B testing
- Session replay
- Custom dashboards

**Plugin Interface**:
```bash
nself plugin install analytics --providers segment,mixpanel,posthog
```

**Features Used in nchat**:
- User activity tracking (src/components/analytics/)
- Admin dashboards (src/app/admin/analytics/)
- Usage metrics

---

### 9. Webhooks Plugin ⭐⭐⭐⭐

**Use Case**: Outbound webhook system
**What it needs**:
- Webhook registration
- Event triggers
- Delivery queue
- Retry logic
- Signature verification
- Rate limiting
- Logging

**Plugin Interface**:
```bash
nself plugin install webhooks
```

**Features Used in nchat**:
- Integration webhooks (src/components/webhooks/, src/lib/webhooks/)
- Slack integration
- Discord integration

---

### 10. Moderation Plugin ⭐⭐⭐

**Use Case**: Content moderation
**What it needs**:
- Profanity filter
- Spam detection
- Auto-moderation rules
- Report queue
- Moderator dashboard
- Action logs

**Plugin Interface**:
```bash
nself plugin install moderation --features profanity,spam,ai-moderation
```

**Features Used in nchat**:
- Content moderation (src/components/moderation/)
- Report system
- Auto-mod rules

---

### 11. Compliance & Audit Plugin ⭐⭐⭐

**Use Case**: GDPR/compliance features
**What it needs**:
- Audit logging
- Data export (GDPR)
- Data deletion
- Consent management
- Privacy policy versioning
- Data retention policies

**Plugin Interface**:
```bash
nself plugin install compliance --standards gdpr,ccpa,hipaa
```

**Features Used in nchat**:
- Audit logs (src/components/audit/, src/components/compliance/)
- Data export (src/components/import-export/)
- User deletion

---

### 12. Internationalization (i18n) Plugin ⭐⭐⭐

**Use Case**: Multi-language support
**What it needs**:
- Translation management
- Language detection
- RTL support
- Pluralization
- Date/time formatting
- Currency formatting

**Plugin Interface**:
```bash
nself plugin install i18n --languages en,es,fr,de,ja,zh
```

**Features Used in nchat**:
- Multi-language UI (src/components/i18n/)
- Translation system

---

## 🟢 Category 3: SPECIALIZED (Advanced Features)

### 13. Bot Framework Plugin ⭐⭐⭐

**Use Case**: Chatbot/automation platform
**What it needs**:
- Bot SDK
- Command parser
- Event handlers
- Bot permissions
- Bot marketplace
- Webhook integration

**Plugin Interface**:
```bash
nself plugin install bots
nself bot create welcome-bot --triggers user_joined
```

**Features Used in nchat**:
- Bot system (src/components/bot/, src/components/bots/, src/bots/)
- Slash commands (src/components/slash-commands/, src/components/commands/)

---

### 14. AI Assistant Plugin ⭐⭐⭐

**Use Case**: AI-powered features
**Current**: CS_7 configured for AI
**What it needs**:
- LLM provider integration
- Smart replies
- Message summarization
- Sentiment analysis
- Auto-categorization
- Translation

**Plugin Interface**:
```bash
nself plugin install ai --provider llm-provider --features smart-replies,summarization,translation
```

**Features Used in nchat**:
- AI assistant (src/app/ai/, CS_7 service)
- Smart replies
- Message translation

---

### 15. Voice & Video Calls Plugin ⭐⭐⭐

**Use Case**: WebRTC calling
**What it needs**:
- WebRTC signaling server
- TURN/STUN servers
- Call recording
- Screen sharing
- Call quality monitoring
- SFU (Selective Forwarding Unit)

**Plugin Interface**:
```bash
nself plugin install webrtc --features audio,video,screenshare,recording
```

**Features Used in nchat**:
- Voice calls (src/components/call/, src/components/voice/)
- Video calls
- Screen sharing
- Call stats (src/hooks/use-call-stats.ts)

---

### 16. Crypto/Web3 Plugin ⭐⭐

**Use Case**: Blockchain features
**What it needs**:
- Wallet connection
- Token gating
- NFT verification
- Crypto payments
- Transaction tracking

**Plugin Interface**:
```bash
nself plugin install web3 --chains ethereum,polygon,base
```

**Features Used in nchat**:
- Wallet integration (src/components/wallet/, src/stores/wallet-store.ts)
- Token gating
- NFT gallery
- Crypto tipping

---

### 17. Meetings & Calendar Plugin ⭐⭐

**Use Case**: Scheduling & calendar
**What it needs**:
- Calendar sync (Google/Outlook)
- Meeting scheduling
- Availability checking
- Reminder system
- Video conferencing integration

**Plugin Interface**:
```bash
nself plugin install meetings --calendars google,outlook,apple
```

**Features Used in nchat**:
- Meetings (src/app/meetings/, src/components/meetings/)
- Reminders (src/components/reminders/)
- Scheduled messages (src/components/scheduled/)

---

### 18. Location Services Plugin ⭐⭐

**Use Case**: Geo features
**What it needs**:
- Location sharing
- Geofencing
- Maps integration
- Nearby users
- Location history

**Plugin Interface**:
```bash
nself plugin install location --provider mapbox
```

**Features Used in nchat**:
- Location sharing (src/components/location/)

---

### 19. GIF & Media Plugin ⭐⭐

**Use Case**: Rich media features
**What it needs**:
- GIF search (Giphy/Tenor)
- Sticker packs
- Emoji search
- Media picker

**Plugin Interface**:
```bash
nself plugin install media --providers giphy,tenor
```

**Features Used in nchat**:
- GIF picker (src/components/gif/)
- Sticker system (src/components/stickers/)
- Emoji picker (src/components/emoji/)

---

### 20. Onboarding Plugin ⭐⭐

**Use Case**: User onboarding flow
**What it needs**:
- Step-by-step tours
- Tooltips
- Progress tracking
- Skip/resume functionality

**Plugin Interface**:
```bash
nself plugin install onboarding
```

**Features Used in nchat**:
- User onboarding (src/app/onboarding/, src/components/onboarding/)

---

## 🔵 Category 4: INTEGRATION PLUGINS

### 21. Slack Integration Plugin ⭐⭐⭐⭐

**What it needs**:
- OAuth flow
- Message sync
- Channel sync
- User mapping
- Slash command forwarding

**Plugin Interface**:
```bash
nself plugin install slack
```

---

### 22. GitHub Integration Plugin ⭐⭐⭐

**What it needs**:
- OAuth
- Repository webhooks
- Issue/PR notifications
- Code snippets
- CI/CD status

**Plugin Interface**:
```bash
nself plugin install github
```

---

### 23. Google Workspace Plugin ⭐⭐⭐

**What it needs**:
- Google Drive integration
- Gmail sync
- Calendar sync
- Contacts sync

**Plugin Interface**:
```bash
nself plugin install google-workspace
```

---

### 24. Jira Integration Plugin ⭐⭐

**Plugin Interface**:
```bash
nself plugin install jira
```

---

### 25. Email Service Plugin ⭐⭐⭐⭐

**What it needs**:
- SMTP/SendGrid/Resend integration
- Email templates
- Transactional emails
- Email analytics

**Plugin Interface**:
```bash
nself plugin install email --provider resend
```

---

## 📋 Plugin Priority Matrix

### Must-Have (Core Infrastructure)
1. **Realtime** - Critical for modern apps
2. **File Upload** - Critical for UGC
3. **Notifications** - Critical for engagement
4. **OAuth** - Critical for auth
5. **Search** - High value
6. **Background Jobs** - High value

### High Value (Common SaaS)
7. **Payments** (Stripe)
8. **Analytics**
9. **Webhooks**
10. **Moderation**
11. **Compliance/Audit**
12. **i18n**

### Specialized (Advanced)
13. **Bot Framework**
14. **AI Assistant**
15. **WebRTC Calls**
16. **Web3/Crypto**
17. **Meetings**
18. **Location**
19. **Media (GIF/Stickers)**
20. **Onboarding**

### Integrations
21. **Slack**
22. **GitHub**
23. **Google Workspace**
24. **Jira**
25. **Email**

---

## 💡 Plugin Architecture Recommendations

### Standard Plugin Interface

Every nself plugin should provide:

1. **Installation**:
   ```bash
   nself plugin install <name> [--options]
   # Prompts for config
   # Updates .backend/.env.dev
   # Scaffolds service code
   # Generates frontend SDK
   ```

2. **Configuration**:
   ```env
   # In .backend/.env.dev
   PLUGIN_REALTIME_ENABLED=true
   PLUGIN_REALTIME_REDIS_PREFIX=realtime:
   PLUGIN_REALTIME_FEATURES=presence,typing,signaling
   ```

3. **Service Code**:
   ```
   .backend/services/realtime/
     ├── src/
     │   ├── server.ts         # Main server
     │   ├── presence.ts       # Feature modules
     │   ├── typing.ts
     │   └── signaling.ts
     ├── package.json
     ├── Dockerfile
     └── README.md
   ```

4. **Frontend SDK**:
   ```bash
   npm install @nself/realtime-client
   ```

   ```typescript
   import { useRealtime } from '@nself/realtime-client'
   ```

5. **GraphQL Integration**:
   Plugins can extend Hasura schema:
   ```graphql
   # Auto-generated by plugin
   extend type Mutation {
     sendTypingIndicator(channelId: uuid!): Boolean!
   }

   extend type Subscription {
     onTyping(channelId: uuid!): TypingEvent!
   }
   ```

6. **Documentation**:
   ```bash
   nself plugin docs <name>
   # Opens plugin-specific docs
   ```

---

## 🎯 Immediate Recommendations for nself Team

### Phase 1: Core Plugins (3-6 months)
Build these 6 plugins first as they're needed by 80% of apps:
1. Realtime (Socket.io)
2. File Upload (S3/MinIO)
3. Notifications (Push/Email/SMS)
4. OAuth (Social login)
5. Search (MeiliSearch)
6. Jobs (BullMQ)

### Phase 2: SaaS Essentials (3-6 months)
7. Payments (Stripe)
8. Analytics
9. Webhooks
10. Moderation

### Phase 3: Advanced Features (6-12 months)
11. Bot Framework
12. WebRTC Calls
13. AI Assistant
14. Compliance

### Phase 4: Integrations (ongoing)
15. Slack, GitHub, Google, etc.

---

## 📊 nchat Plugin Usage Map

If all recommended plugins existed, nchat would use:

| Plugin | Usage | Impact |
|--------|-------|--------|
| Realtime | ✅ Heavy | Presence, typing, live updates, calls |
| File Upload | ✅ Heavy | Attachments, avatars, media |
| Notifications | ✅ Heavy | Push, email, in-app |
| OAuth | ✅ Medium | 6 providers configured |
| Search | ✅ Medium | Message/user/channel search |
| Jobs | ✅ Medium | Digests, cleanup, analytics |
| Payments | ⚠️ Light | Paid plans (if monetized) |
| Analytics | ✅ Medium | Admin dashboards |
| Webhooks | ✅ Medium | Slack/Discord integration |
| Moderation | ✅ Heavy | Auto-mod, reports |
| Compliance | ✅ Medium | GDPR, audit logs |
| i18n | ✅ Light | Multi-language |
| Bots | ✅ Medium | Slash commands, automation |
| AI | ⚠️ Light | Smart replies |
| WebRTC | ✅ Heavy | Voice/video calls |
| Web3 | ⚠️ Light | Wallet features |
| Meetings | ⚠️ Light | Scheduling |
| Media | ✅ Medium | GIF, stickers |
| Slack | ⚠️ Light | Integration |
| GitHub | ⚠️ Light | Integration |
| Email | ✅ Medium | Transactional emails |

**15 out of 21 plugins would be used** in nchat!

---

## 🚀 Next Steps

1. **For nchat Project**:
   - Implement CS_2 (realtime) manually for now
   - Implement CS_5 (files) manually
   - Wait for nself plugins or contribute to nself

2. **For nself Team**:
   - Review this document
   - Prioritize plugin development
   - Create plugin SDK/framework
   - Build marketplace

---

**This analysis shows that 70% of "backend work" could be solved by battle-tested plugins!**
