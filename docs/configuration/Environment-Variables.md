# Environment Variables Reference

> Complete reference for all environment variables in nself-chat

Source file: `/Users/admin/Sites/nself-chat/.env.example`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment](#environment)
3. [Backend Services](#backend-services)
4. [Platform Template](#platform-template)
5. [White-Label Branding](#white-label-branding)
6. [Theme Configuration](#theme-configuration)
7. [Feature Flags - Core Messaging](#feature-flags---core-messaging)
8. [Feature Flags - Rich Content](#feature-flags---rich-content)
9. [Feature Flags - Advanced](#feature-flags---advanced)
10. [Feature Flags - Integrations](#feature-flags---integrations)
11. [Feature Flags - Moderation](#feature-flags---moderation)
12. [UI Configuration](#ui-configuration)
13. [Limits](#limits)
14. [Authentication Providers](#authentication-providers)
15. [Authentication Settings](#authentication-settings)
16. [Notifications](#notifications)
17. [SEO & Social](#seo--social)
18. [Legal](#legal)
19. [nself CLI Integration](#nself-cli-integration)
20. [Server-Side Only](#server-side-only)
21. [Development Only](#development-only)

---

## Quick Start

```bash
# Copy example to local config
cp .env.example .env.local

# Edit with your values
nano .env.local

# Start development
pnpm dev
```

---

## Environment

### Core Environment Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_ENV` | string | `development` | Environment mode: `development`, `staging`, `production` |
| `NEXT_PUBLIC_USE_DEV_AUTH` | boolean | `true` | Enable development authentication (test users, auto-login) |
| `NEXT_PUBLIC_APP_URL` | string | `http://localhost:3000` | Base URL for the application |

```bash
# Example
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Backend Services

### Nhost / Backend URLs

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_NHOST_SUBDOMAIN` | string | `localhost` | Nhost project subdomain |
| `NEXT_PUBLIC_NHOST_REGION` | string | `local` | Nhost region |
| `NEXT_PUBLIC_GRAPHQL_URL` | string | `http://api.localhost/v1/graphql` | GraphQL endpoint (Hasura) |
| `NEXT_PUBLIC_WS_URL` | string | `ws://api.localhost/v1/graphql` | WebSocket endpoint |
| `NEXT_PUBLIC_AUTH_URL` | string | `http://auth.localhost/v1/auth` | Authentication service |
| `NEXT_PUBLIC_STORAGE_URL` | string | `http://storage.localhost/v1/storage` | File storage (MinIO) |
| `NEXT_PUBLIC_FUNCTIONS_URL` | string | `http://functions.localhost/v1/functions` | Serverless functions |
| `NEXT_PUBLIC_SOCKET_URL` | string | `ws://realtime.localhost` | Socket.io server |
| `NEXT_PUBLIC_SEARCH_URL` | string | `http://search.localhost` | Search service (MeiliSearch) |

```bash
# Local development (via nself CLI)
NEXT_PUBLIC_NHOST_SUBDOMAIN=localhost
NEXT_PUBLIC_NHOST_REGION=local
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_WS_URL=ws://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage
NEXT_PUBLIC_FUNCTIONS_URL=http://functions.localhost/v1/functions
NEXT_PUBLIC_SOCKET_URL=ws://realtime.localhost
NEXT_PUBLIC_SEARCH_URL=http://search.localhost
```

---

## Platform Template

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_PLATFORM_TEMPLATE` | string | `default` | UI template: `default`, `slack`, `discord`, `telegram`, `whatsapp` |

```bash
# Use Discord-style UI
NEXT_PUBLIC_PLATFORM_TEMPLATE=discord
```

---

## White-Label Branding

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | string | `nchat` | Application name |
| `NEXT_PUBLIC_APP_TAGLINE` | string | `Modern Team Communication` | Application tagline |
| `NEXT_PUBLIC_APP_LOGO` | string | `/logo.svg` | Logo image URL |
| `NEXT_PUBLIC_APP_FAVICON` | string | `/favicon.ico` | Favicon URL |
| `NEXT_PUBLIC_COMPANY_NAME` | string | `nself` | Company name (footer) |
| `NEXT_PUBLIC_COMPANY_URL` | string | `https://nself.org` | Company website |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | string | `support@nself.org` | Support email |

```bash
# Custom branding
NEXT_PUBLIC_APP_NAME=MyChat
NEXT_PUBLIC_APP_TAGLINE=Team Communication Made Easy
NEXT_PUBLIC_APP_LOGO=/custom-logo.svg
NEXT_PUBLIC_COMPANY_NAME=My Company
```

---

## Theme Configuration

### Color Mode

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_THEME_MODE` | string | `dark` | Default color mode: `light`, `dark`, `system` |

### Colors

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_THEME_PRIMARY` | hex | `#00D4FF` | Primary brand color |
| `NEXT_PUBLIC_THEME_SECONDARY` | hex | `#6366F1` | Secondary color |
| `NEXT_PUBLIC_THEME_ACCENT` | hex | `#10B981` | Accent color |
| `NEXT_PUBLIC_THEME_BACKGROUND` | hex | (commented) | Background override |
| `NEXT_PUBLIC_THEME_SURFACE` | hex | (commented) | Surface override |
| `NEXT_PUBLIC_THEME_TEXT` | hex | (commented) | Text color override |
| `NEXT_PUBLIC_THEME_MUTED` | hex | (commented) | Muted text override |
| `NEXT_PUBLIC_THEME_BORDER` | hex | (commented) | Border color override |

### UI Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_THEME_RADIUS` | string | `md` | Border radius: `none`, `sm`, `md`, `lg`, `xl`, `full` |
| `NEXT_PUBLIC_THEME_FONT` | string | `inter` | Font family: `inter`, `system`, `sf-pro`, `segoe`, `roboto`, `open-sans` |

```bash
# Custom theme
NEXT_PUBLIC_THEME_MODE=dark
NEXT_PUBLIC_THEME_PRIMARY=#6366F1
NEXT_PUBLIC_THEME_SECONDARY=#8B5CF6
NEXT_PUBLIC_THEME_ACCENT=#22C55E
NEXT_PUBLIC_THEME_RADIUS=lg
NEXT_PUBLIC_THEME_FONT=inter
```

---

## Feature Flags - Core Messaging

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_PUBLIC_CHANNELS` | boolean | `true` | Public channels |
| `NEXT_PUBLIC_FEATURE_PRIVATE_CHANNELS` | boolean | `true` | Private (invite-only) channels |
| `NEXT_PUBLIC_FEATURE_DIRECT_MESSAGES` | boolean | `true` | 1-on-1 direct messages |
| `NEXT_PUBLIC_FEATURE_GROUP_DMS` | boolean | `true` | Group DMs (2-8 people) |
| `NEXT_PUBLIC_FEATURE_THREADS` | boolean | `true` | Threaded replies |
| `NEXT_PUBLIC_FEATURE_REACTIONS` | boolean | `true` | Message reactions (emoji) |
| `NEXT_PUBLIC_FEATURE_MENTIONS` | boolean | `true` | User @mentions |
| `NEXT_PUBLIC_FEATURE_CHANNEL_MENTIONS` | boolean | `true` | Channel #mentions |

```bash
# Disable threads and reactions
NEXT_PUBLIC_FEATURE_THREADS=false
NEXT_PUBLIC_FEATURE_REACTIONS=false
```

---

## Feature Flags - Rich Content

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_FILE_UPLOADS` | boolean | `true` | File uploads |
| `NEXT_PUBLIC_FEATURE_VOICE_MESSAGES` | boolean | `false` | Voice recordings |
| `NEXT_PUBLIC_FEATURE_VIDEO_CALLS` | boolean | `false` | Video calling (WebRTC) |
| `NEXT_PUBLIC_FEATURE_SCREEN_SHARE` | boolean | `false` | Screen sharing |
| `NEXT_PUBLIC_FEATURE_CODE_BLOCKS` | boolean | `true` | Syntax-highlighted code |
| `NEXT_PUBLIC_FEATURE_MARKDOWN` | boolean | `true` | Markdown formatting |
| `NEXT_PUBLIC_FEATURE_LINK_PREVIEWS` | boolean | `true` | URL unfurling |
| `NEXT_PUBLIC_FEATURE_CUSTOM_EMOJIS` | boolean | `true` | Custom workspace emojis |
| `NEXT_PUBLIC_FEATURE_GIF_PICKER` | boolean | `true` | GIF picker integration |

```bash
# Enable voice messages
NEXT_PUBLIC_FEATURE_VOICE_MESSAGES=true
```

---

## Feature Flags - Advanced

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_MESSAGE_SEARCH` | boolean | `true` | Message search |
| `NEXT_PUBLIC_FEATURE_USER_PRESENCE` | boolean | `true` | Online/away/offline status |
| `NEXT_PUBLIC_FEATURE_TYPING_INDICATORS` | boolean | `true` | "User is typing..." |
| `NEXT_PUBLIC_FEATURE_READ_RECEIPTS` | boolean | `true` | Read state tracking |
| `NEXT_PUBLIC_FEATURE_MESSAGE_SCHEDULING` | boolean | `false` | Schedule messages |
| `NEXT_PUBLIC_FEATURE_MESSAGE_PINS` | boolean | `true` | Pin important messages |
| `NEXT_PUBLIC_FEATURE_BOOKMARKS` | boolean | `true` | Save messages |
| `NEXT_PUBLIC_FEATURE_CHANNEL_CATEGORIES` | boolean | `true` | Organize channels |
| `NEXT_PUBLIC_FEATURE_GUEST_ACCESS` | boolean | `false` | External guest users |
| `NEXT_PUBLIC_FEATURE_INVITES` | boolean | `true` | User invitations |

---

## Feature Flags - Integrations

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_SLACK_INTEGRATION` | boolean | `false` | Slack import/sync |
| `NEXT_PUBLIC_FEATURE_GITHUB_INTEGRATION` | boolean | `false` | GitHub notifications |
| `NEXT_PUBLIC_FEATURE_JIRA_INTEGRATION` | boolean | `false` | Jira integration |
| `NEXT_PUBLIC_FEATURE_GOOGLE_DRIVE` | boolean | `false` | Google Drive sharing |
| `NEXT_PUBLIC_FEATURE_WEBHOOKS` | boolean | `true` | Incoming webhooks |
| `NEXT_PUBLIC_FEATURE_BOTS` | boolean | `true` | Bot accounts |
| `NEXT_PUBLIC_FEATURE_SLASH_COMMANDS` | boolean | `true` | Slash commands |

---

## Feature Flags - Moderation

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_FEATURE_AUTO_MODERATION` | boolean | `false` | Auto content moderation |
| `NEXT_PUBLIC_FEATURE_PROFANITY_FILTER` | boolean | `false` | Profanity filtering |
| `NEXT_PUBLIC_FEATURE_SPAM_DETECTION` | boolean | `false` | Spam detection |
| `NEXT_PUBLIC_FEATURE_MESSAGE_REPORTING` | boolean | `true` | User content reporting |
| `NEXT_PUBLIC_FEATURE_AUDIT_LOGS` | boolean | `true` | Admin audit logs |

---

## UI Configuration

### Sidebar

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SIDEBAR_POSITION` | string | `left` | Position: `left`, `right` |
| `NEXT_PUBLIC_SIDEBAR_DEFAULT_STATE` | string | `expanded` | State: `expanded`, `collapsed` |
| `NEXT_PUBLIC_SIDEBAR_WIDTH` | number | `260` | Width in pixels (200-400) |

### Messages

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_MESSAGE_DENSITY` | string | `comfortable` | Density: `compact`, `comfortable`, `spacious` |
| `NEXT_PUBLIC_MESSAGE_GROUPING` | boolean | `true` | Group consecutive messages |

### Avatars

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_AVATAR_STYLE` | string | `circle` | Style: `circle`, `rounded`, `square` |
| `NEXT_PUBLIC_AVATAR_SIZE` | string | `md` | Size: `sm`, `md`, `lg` |
| `NEXT_PUBLIC_SHOW_PRESENCE_DOTS` | boolean | `true` | Presence dots on avatars |

### Display

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SHOW_CHANNEL_ICONS` | boolean | `true` | Channel icons |
| `NEXT_PUBLIC_SHOW_MEMBER_COUNT` | boolean | `true` | Member count in header |
| `NEXT_PUBLIC_TIMESTAMP_FORMAT` | string | `relative` | Format: `relative`, `absolute`, `both` |
| `NEXT_PUBLIC_DATE_FORMAT` | string | `MMM d, yyyy` | Date format (date-fns) |
| `NEXT_PUBLIC_TIME_FORMAT` | string | `h:mm a` | Time format (date-fns) |

```bash
# Compact Discord-like UI
NEXT_PUBLIC_MESSAGE_DENSITY=compact
NEXT_PUBLIC_SIDEBAR_WIDTH=240
NEXT_PUBLIC_AVATAR_SIZE=sm
```

---

## Limits

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_MAX_MESSAGE_LENGTH` | number | `4000` | Max message characters |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | number | `104857600` | Max file size (bytes) - 100MB |
| `NEXT_PUBLIC_MAX_ATTACHMENTS_PER_MESSAGE` | number | `10` | Max attachments per message |
| `NEXT_PUBLIC_MESSAGE_EDIT_WINDOW` | number | `300000` | Edit window (ms) - 5 minutes |
| `NEXT_PUBLIC_MAX_CHANNELS_PER_USER` | number | `500` | Max channels per user |
| `NEXT_PUBLIC_MAX_DMS_PER_USER` | number | `1000` | Max DM conversations |
| `NEXT_PUBLIC_MAX_GROUP_DM_MEMBERS` | number | `8` | Max group DM members |
| `NEXT_PUBLIC_MAX_PINS_PER_CHANNEL` | number | `50` | Max pins per channel |
| `NEXT_PUBLIC_MAX_BOOKMARKS_PER_USER` | number | `100` | Max bookmarks per user |
| `NEXT_PUBLIC_MESSAGE_PAGE_SIZE` | number | `50` | Messages per page |

```bash
# Increase limits for enterprise
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=8000
NEXT_PUBLIC_MAX_FILE_SIZE=524288000  # 500MB
NEXT_PUBLIC_MAX_ATTACHMENTS_PER_MESSAGE=20
```

---

## Authentication Providers

### Basic Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_AUTH_EMAIL_PASSWORD` | boolean | `true` | Email/password auth |
| `NEXT_PUBLIC_AUTH_MAGIC_LINKS` | boolean | `false` | Passwordless email links |

### Social OAuth

| Variable | Type | Default | Server Secrets |
|----------|------|---------|----------------|
| `NEXT_PUBLIC_AUTH_GOOGLE` | boolean | `false` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_GITHUB` | boolean | `false` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_DISCORD` | boolean | `false` | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_SLACK` | boolean | `false` | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_MICROSOFT` | boolean | `false` | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_APPLE` | boolean | `false` | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` |

### Enterprise Authentication

| Variable | Type | Default | Server Secrets |
|----------|------|---------|----------------|
| `NEXT_PUBLIC_AUTH_IDME` | boolean | `false` | `IDME_CLIENT_ID`, `IDME_CLIENT_SECRET` |
| `NEXT_PUBLIC_AUTH_SAML` | boolean | `false` | `SAML_ENTRY_POINT`, `SAML_ISSUER`, `SAML_CERT` |

```bash
# Enable Google and GitHub OAuth
NEXT_PUBLIC_AUTH_GOOGLE=true
NEXT_PUBLIC_AUTH_GITHUB=true
# Server-side secrets (not prefixed with NEXT_PUBLIC_)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Authentication Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_AUTH_ACCESS_MODE` | string | `allow-all` | Access mode (see below) |
| `NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION` | boolean | `false` | Require email verification |
| `NEXT_PUBLIC_AUTH_ALLOWED_DOMAINS` | string | (empty) | Comma-separated domains |
| `NEXT_PUBLIC_AUTH_REQUIRE_APPROVAL` | boolean | `false` | Require admin approval |
| `NEXT_PUBLIC_AUTH_DEFAULT_ROLE` | string | `member` | Default role: `member`, `guest` |
| `NEXT_PUBLIC_AUTH_DEFAULT_CHANNELS` | string | `general,announcements` | Default channels to join |

### Access Modes

| Mode | Description |
|------|-------------|
| `allow-all` | Open registration |
| `verified-only` | Email verification required |
| `domain-restricted` | Specific email domains only |
| `admin-only` | Manual approval required |

```bash
# Corporate setup with domain restriction
NEXT_PUBLIC_AUTH_ACCESS_MODE=domain-restricted
NEXT_PUBLIC_AUTH_ALLOWED_DOMAINS=company.com,subsidiary.com
NEXT_PUBLIC_AUTH_REQUIRE_EMAIL_VERIFICATION=true
```

---

## Notifications

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_NOTIFICATIONS_DESKTOP` | boolean | `true` | Desktop notifications |
| `NEXT_PUBLIC_NOTIFICATIONS_SOUND` | boolean | `true` | Sound notifications |
| `NEXT_PUBLIC_NOTIFICATIONS_EMAIL` | boolean | `false` | Email notifications |
| `NEXT_PUBLIC_NOTIFICATIONS_PUSH` | boolean | `false` | Mobile push notifications |

---

## SEO & Social

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_META_TITLE` | string | (app name) | Meta title |
| `NEXT_PUBLIC_META_DESCRIPTION` | string | `Modern team communication platform` | Meta description |
| `NEXT_PUBLIC_OG_IMAGE` | string | (empty) | Open Graph image |
| `NEXT_PUBLIC_TWITTER_HANDLE` | string | (empty) | Twitter handle |
| `NEXT_PUBLIC_GA_ID` | string | (empty) | Google Analytics ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | string | (empty) | Plausible domain |

```bash
# SEO configuration
NEXT_PUBLIC_META_DESCRIPTION=Team communication for modern teams
NEXT_PUBLIC_OG_IMAGE=/og-image.png
NEXT_PUBLIC_TWITTER_HANDLE=mychatapp
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Legal

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_PRIVACY_URL` | string | `/privacy` | Privacy policy URL |
| `NEXT_PUBLIC_TERMS_URL` | string | `/terms` | Terms of service URL |
| `NEXT_PUBLIC_COOKIE_POLICY_URL` | string | (empty) | Cookie policy URL |

---

## nself CLI Integration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NSELF_CLI_VERSION` | string | `0.4.8` | nself CLI version |
| `NSELF_PLUGINS_ENABLED` | string | (empty) | Enabled plugins |

---

## Server-Side Only

**Important:** These variables must NOT be prefixed with `NEXT_PUBLIC_` as they contain secrets.

### Database & Services

| Variable | Description |
|----------|-------------|
| `HASURA_ADMIN_SECRET` | Hasura admin secret |
| `JWT_SECRET` | JWT signing secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |

### External Services

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry error tracking |
| `SENDGRID_API_KEY` | SendGrid email API |

### AWS/S3 (alternative to MinIO)

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_S3_REGION` | S3 region |

```bash
# Server-side secrets
HASURA_ADMIN_SECRET=your-admin-secret
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgres://user:pass@localhost:5432/nchat
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Development Only

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_DEVTOOLS` | boolean | `true` | React Query devtools |
| `NEXT_PUBLIC_DEBUG` | boolean | `false` | Debug logging |
| `NEXT_PUBLIC_MOCK_API` | boolean | `false` | Mock API responses |

```bash
# Enable all dev features
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
NEXT_PUBLIC_DEBUG=true
```

---

## Complete Example (.env.local)

```bash
# =============================================
# nself-chat Local Development Configuration
# =============================================

# Environment
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend Services (via nself CLI)
NEXT_PUBLIC_NHOST_SUBDOMAIN=localhost
NEXT_PUBLIC_NHOST_REGION=local
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_WS_URL=ws://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Branding
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_APP_TAGLINE=Modern Team Communication

# Theme
NEXT_PUBLIC_THEME_MODE=dark
NEXT_PUBLIC_THEME_PRIMARY=#00D4FF

# Core Features
NEXT_PUBLIC_FEATURE_PUBLIC_CHANNELS=true
NEXT_PUBLIC_FEATURE_PRIVATE_CHANNELS=true
NEXT_PUBLIC_FEATURE_DIRECT_MESSAGES=true
NEXT_PUBLIC_FEATURE_THREADS=true
NEXT_PUBLIC_FEATURE_REACTIONS=true
NEXT_PUBLIC_FEATURE_FILE_UPLOADS=true

# Authentication
NEXT_PUBLIC_AUTH_EMAIL_PASSWORD=true
NEXT_PUBLIC_AUTH_ACCESS_MODE=allow-all

# Development
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
```

---

*This document covers all environment variables available in nself-chat. See `.env.example` for the complete template.*
