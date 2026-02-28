# Bot API Foundation Implementation - nself-chat v0.3.0

**Implementation Date:** January 30, 2026
**Status:** ✅ Complete

## Overview

Complete bot API infrastructure has been implemented for nself-chat v0.3.0, providing a comprehensive system for creating, managing, and using API bots with authentication, permissions, webhooks, and full documentation.

---

## Features Implemented

### 1. Database Infrastructure ✅

**File:** `.backend/migrations/012_bot_infrastructure.sql`

Created comprehensive database schema:

- **nchat_bots** - Bot definitions and metadata
  - Supports custom, integration, and system bot types
  - Links to user accounts (bots are users with `is_bot = true`)
  - Tracks active/inactive status

- **nchat_bot_tokens** - API authentication tokens
  - Stores token hashes (SHA-256)
  - Scope-based permissions per token
  - Optional expiration dates
  - Tracks last usage

- **nchat_bot_webhooks** - Outgoing webhook configurations
  - Event subscriptions
  - HMAC secret storage
  - Delivery statistics

- **nchat_bot_webhook_logs** - Webhook delivery logs
  - Tracks success/failure
  - Stores status codes and responses
  - Records retry attempts (up to 5)

- **nchat_bot_permissions** - Granular permission system
  - 16 predefined permissions
  - Resource.action format (e.g., `messages.send`)
  - Tracks who granted permissions

- **nchat_bot_permission_definitions** - Permission metadata
  - Descriptions and categories
  - Dangerous permission flags

- **nchat_bot_api_logs** - API call audit logs
  - Endpoint tracking
  - Response times
  - IP addresses

**Row-Level Security (RLS):**

- Admins/owners can manage all bots
- Users can view their own bots
- Proper access control on all tables

---

### 2. Token Management Utilities ✅

**File:** `src/lib/bots/tokens.ts`

Comprehensive token utilities:

- `generateBotToken()` - Generate secure tokens with `nbot_` prefix
- `hashToken()` - SHA-256 hashing for storage
- `verifyToken()` - Constant-time comparison
- `extractTokenFromHeader()` - Parse Authorization headers
- `isValidTokenFormat()` - Format validation
- `maskToken()` - Safe logging
- `isTokenExpired()` - Expiration checks

**Webhook utilities:**

- `generateWebhookSecret()` - HMAC secret generation
- `signWebhookPayload()` - HMAC-SHA256 signing
- `verifyWebhookSignature()` - Signature verification

**Rate limiting:**

- `checkRateLimit()` - 100 requests/minute per bot
- In-memory cache (production should use Redis)

---

### 3. Permission System ✅

**File:** `src/lib/bots/permissions.ts`

**16 Permissions across 6 categories:**

**Messages:**

- `messages.send` - Send messages
- `messages.read` - Read history
- `messages.delete` - Delete own messages
- `messages.edit` - Edit own messages

**Channels:**

- `channels.create` - Create channels
- `channels.read` - Read channel info
- `channels.update` - Update settings (dangerous)
- `channels.delete` - Delete channels (dangerous)

**Reactions:**

- `reactions.add` - Add reactions
- `reactions.remove` - Remove reactions

**Users:**

- `users.read` - Read user info
- `users.update` - Update bot profile (dangerous)

**Files:**

- `files.upload` - Upload files
- `files.read` - Read file info

**Threads:**

- `threads.create` - Create threads
- `threads.read` - Read threads

**Functions:**

- `checkBotPermission()` - Database permission check
- `getBotPermissions()` - Get all permissions
- `grantBotPermission()` - Grant permission
- `revokeBotPermission()` - Revoke permission
- `tokenHasPermission()` - Token scope validation

---

### 4. Authentication Middleware ✅

**File:** `src/lib/api/bot-auth.ts`

**Features:**

- Token extraction and verification
- Rate limiting with headers
- Permission checking
- API call logging
- Error handling

**Middleware wrapper:**

```typescript
export const POST = withBotAuth(async (request, auth) => {
  // Handler code
}, BotPermission.MESSAGES_SEND)
```

**Auth result includes:**

- Bot ID
- User ID
- Bot name
- Scopes
- Token ID

---

### 5. Bot API Endpoints ✅

#### POST /api/bots/send-message

**File:** `src/app/api/bots/send-message/route.ts`

- Send messages to channels
- Supports attachments
- Metadata tracking
- Permission: `messages.send`

#### POST /api/bots/create-channel

**File:** `src/app/api/bots/create-channel/route.ts`

- Create public/private channels
- Name validation (lowercase, hyphens, underscores)
- Duplicate detection
- Permission: `channels.create`

#### GET /api/bots/channel-info

**File:** `src/app/api/bots/channel-info/route.ts`

- Get channel details
- Member and message counts
- Permission: `channels.read`

#### POST /api/bots/add-reaction

**File:** `src/app/api/bots/add-reaction/route.ts`

- Add emoji reactions
- Unicode and shortcode support
- Message existence validation
- Permission: `reactions.add`

#### GET /api/bots/user-info

**File:** `src/app/api/bots/user-info/route.ts`

- Get user profile
- Message count statistics
- Permission: `users.read`

**All endpoints include:**

- Authentication
- Rate limiting
- Permission checks
- API logging
- Error handling

---

### 6. Outgoing Webhooks System ✅

**File:** `src/lib/bots/webhooks.ts`

**Features:**

- Event-based delivery
- HMAC-SHA256 signatures
- Automatic retry (up to 5 attempts)
- Exponential backoff (2s, 4s, 8s, 16s, 60s max)
- Delivery logging
- Statistics tracking

**Supported Events:**

- `message.created`
- `message.updated`
- `message.deleted`
- `channel.created`
- `channel.updated`
- `channel.deleted`
- `user.joined`
- `user.left`
- `reaction.added`
- `reaction.removed`

**Functions:**

- `triggerWebhooks()` - Main delivery function
- `testWebhook()` - Test delivery
- Helper functions for each event type

**Webhook Headers:**

- `X-Webhook-Event` - Event type
- `X-Webhook-Signature` - HMAC signature
- `X-Webhook-Delivery` - Webhook ID
- `X-Webhook-Attempt` - Attempt number

---

### 7. GraphQL Operations ✅

**File:** `src/graphql/bots.ts` (extended)

**Added Queries:**

- `GET_BOT_TOKENS` - List tokens
- `GET_BOT_WEBHOOKS` - List webhooks
- `GET_WEBHOOK_LOGS` - Webhook delivery logs
- `GET_BOT_PERMISSIONS` - List permissions
- `GET_PERMISSION_DEFINITIONS` - Permission metadata
- `GET_BOT_API_LOGS` - API call logs

**Added Mutations:**

- `CREATE_BOT_TOKEN` - Generate token
- `REVOKE_BOT_TOKEN` - Deactivate token
- `DELETE_BOT_TOKEN` - Remove token
- `CREATE_BOT_WEBHOOK` - Add webhook
- `UPDATE_BOT_WEBHOOK` - Modify webhook
- `DELETE_BOT_WEBHOOK` - Remove webhook
- `GRANT_BOT_PERMISSION` - Grant permission
- `REVOKE_BOT_PERMISSION` - Revoke permission

---

### 8. React Hooks ✅

#### `src/hooks/use-bots.ts`

- `useBots()` - List all bots
- `useBot()` - Get single bot
- `useCreateBot()` - Create bot
- `useUpdateBot()` - Update bot
- `useDeleteBot()` - Delete bot

#### `src/hooks/use-bot-tokens.ts`

- `useBotTokens()` - List tokens
- `useGenerateBotToken()` - Generate token (returns plaintext)
- `useRevokeBotToken()` - Revoke token
- `useDeleteBotToken()` - Delete token
- `useBotPermissions()` - List permissions
- `usePermissionDefinitions()` - Get definitions
- `useGrantBotPermission()` - Grant permission
- `useRevokeBotPermission()` - Revoke permission
- `useBotWebhooks()` - List webhooks
- `useCreateBotWebhook()` - Create webhook
- `useUpdateBotWebhook()` - Update webhook
- `useDeleteBotWebhook()` - Delete webhook
- `useWebhookLogs()` - Get logs
- `useBotApiLogs()` - Get API logs

---

### 9. Admin UI Components ✅

**File:** `src/components/admin/BotManager.tsx`

**Features:**

- List all bots with statistics
- Create new bots
- Delete bots
- View bot details
- Visual status indicators
- Token/webhook/permission counts

**UI Elements:**

- Bot cards with avatars
- Status badges (active/inactive)
- Type badges (custom/integration/system)
- Management buttons
- Create dialog with form validation

---

### 10. API Documentation ✅

**File:** `src/app/api-docs/bots/page.tsx`

**Comprehensive documentation with:**

**5 Sections:**

1. **Overview** - Getting started, rate limits, permissions
2. **Authentication** - Token creation, usage, format
3. **Endpoints** - All 5 API endpoints with examples
4. **Webhooks** - Setup, events, verification, retry logic
5. **Examples** - cURL, JavaScript, Python code samples

**Features:**

- Interactive tabs
- Code blocks with copy button
- Request/response examples
- Permission badges
- Event listings
- Security best practices

---

## File Structure

```
nself-chat/
├── .backend/migrations/
│   └── 012_bot_infrastructure.sql        # Database schema
├── src/
│   ├── app/
│   │   ├── api/bots/
│   │   │   ├── send-message/route.ts    # Send message API
│   │   │   ├── create-channel/route.ts  # Create channel API
│   │   │   ├── channel-info/route.ts    # Get channel info
│   │   │   ├── add-reaction/route.ts    # Add reaction API
│   │   │   └── user-info/route.ts       # Get user info
│   │   └── api-docs/bots/
│   │       └── page.tsx                  # API documentation
│   ├── components/admin/
│   │   └── BotManager.tsx                # Bot management UI
│   ├── hooks/
│   │   ├── use-bots.ts                   # Bot CRUD hooks
│   │   └── use-bot-tokens.ts            # Token/webhook hooks
│   ├── lib/
│   │   ├── api/
│   │   │   └── bot-auth.ts              # Auth middleware
│   │   └── bots/
│   │       ├── tokens.ts                 # Token utilities
│   │       ├── permissions.ts            # Permission system
│   │       └── webhooks.ts               # Webhook delivery
│   └── graphql/
│       └── bots.ts                       # GraphQL operations (extended)
```

---

## Testing Checklist

### Database

- [x] Migration runs successfully
- [x] All tables created
- [x] Indexes created
- [x] RLS policies active
- [x] Foreign keys working
- [x] Triggers functioning

### Token Generation

- [x] Generate valid tokens
- [x] Hash tokens correctly
- [x] Verify tokens
- [x] Extract from headers
- [x] Format validation
- [x] Expiration checks

### API Endpoints

- [x] Send message endpoint
- [x] Create channel endpoint
- [x] Get channel info endpoint
- [x] Add reaction endpoint
- [x] Get user info endpoint

### Authentication

- [x] Token verification
- [x] Permission checking
- [x] Rate limiting
- [x] Error handling
- [x] API logging

### Webhooks

- [x] Event triggering
- [x] Payload signing
- [x] Retry logic
- [x] Delivery logging
- [x] Statistics tracking

### Permissions

- [x] Check permissions
- [x] Grant permissions
- [x] Revoke permissions
- [x] Scope validation

### UI Components

- [x] Bot manager loads
- [x] Create bot dialog
- [x] Delete bot confirmation
- [x] Statistics display

### Documentation

- [x] All sections complete
- [x] Code examples working
- [x] Copy functionality
- [x] Responsive design

---

## Usage Examples

### Creating a Bot

```bash
# 1. Go to Admin → Bot Management
# 2. Click "Create Bot"
# 3. Fill in details and create
```

### Generating an API Token

```bash
# 1. Select bot in Bot Manager
# 2. Go to Tokens tab
# 3. Click "Generate Token"
# 4. Select scopes: messages.send, channels.read
# 5. Copy token immediately (shown once)
```

### Sending a Message

```bash
curl -X POST http://localhost:3000/api/bots/send-message \
  -H "Authorization: Bearer nbot_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "uuid-here",
    "content": "Hello from bot!"
  }'
```

### Setting Up Webhooks

```bash
# 1. Select bot in Bot Manager
# 2. Go to Webhooks tab
# 3. Click "Add Webhook"
# 4. Enter URL: https://your-app.com/webhook
# 5. Select events: message.created, user.joined
# 6. Save and copy secret
```

### Verifying Webhook Signatures

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  return signature === 'sha256=' + expectedSignature
}
```

---

## Security Features

1. **Token Security**
   - SHA-256 hashing
   - Secure random generation
   - Constant-time comparison
   - Never stored in plaintext

2. **Webhook Security**
   - HMAC-SHA256 signatures
   - Per-webhook secrets
   - Signature verification required

3. **Rate Limiting**
   - 100 requests/minute per bot
   - Rate limit headers
   - 429 responses with retry-after

4. **Permission System**
   - Granular permissions
   - Scope-based access
   - Permission auditing

5. **RLS Policies**
   - Database-level security
   - User-based access control
   - Admin override capabilities

---

## Performance Considerations

1. **Rate Limiting**
   - Currently in-memory (fine for single instance)
   - **Production:** Use Redis for distributed rate limiting

2. **Webhook Delivery**
   - Parallel delivery for performance
   - Async fire-and-forget logging
   - 30-second timeout per attempt

3. **API Logging**
   - Fire-and-forget to avoid blocking
   - Index on bot_id and created_at
   - Consider data retention policies

4. **Token Caching**
   - Consider caching verified tokens
   - Invalidate on revocation
   - TTL based on expires_at

---

## Next Steps (Optional Enhancements)

1. **Token Rotation**
   - Add ability to rotate tokens
   - Maintain old token for grace period

2. **Webhook Testing**
   - Add test webhook button
   - Show delivery response

3. **Advanced Permissions**
   - Channel-specific permissions
   - Time-based permissions
   - IP whitelisting

4. **Bot Analytics**
   - Usage dashboard
   - Error rate tracking
   - Performance metrics

5. **Webhook Retries**
   - Manual retry button
   - Retry configuration per webhook

6. **Token Scopes UI**
   - Visual scope selector
   - Scope descriptions
   - Recommended scope sets

7. **API Versioning**
   - Add /v1/ prefix to endpoints
   - Version header support

8. **Batch Operations**
   - Bulk message sending
   - Batch channel creation

---

## Migration Instructions

### 1. Run Database Migration

```bash
cd .backend
psql -h localhost -U postgres -d nself_chat < migrations/012_bot_infrastructure.sql
```

### 2. Restart Backend Services

```bash
cd .backend
nself restart
```

### 3. Verify Migration

```sql
-- Check tables exist
\dt nchat_bot*

-- Check sample data
SELECT * FROM nchat_bot_permission_definitions;
```

### 4. Test API

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Create a test bot via UI
# Generate token
# Test send-message endpoint
```

---

## Support & Documentation

- **API Docs:** http://localhost:3000/api-docs/bots
- **Admin UI:** http://localhost:3000/admin/bots
- **Database Schema:** `.backend/migrations/012_bot_infrastructure.sql`
- **Rate Limits:** 100 requests/minute per bot
- **Support:** Create issue in repository

---

## Changelog

### v0.3.0 (2026-01-30)

- ✅ Initial bot API implementation
- ✅ Database schema with 7 tables
- ✅ Token generation and management
- ✅ Permission system (16 permissions)
- ✅ 5 API endpoints
- ✅ Webhook system with retry
- ✅ Admin UI components
- ✅ Complete API documentation
- ✅ React hooks for all operations
- ✅ GraphQL queries and mutations
- ✅ Rate limiting
- ✅ API logging

---

**Implementation Status:** ✅ **COMPLETE**
**Version:** nself-chat v0.3.0
**Date:** January 30, 2026
