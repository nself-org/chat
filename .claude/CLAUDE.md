# nself-chat (nchat) - White-Label Team Communication Platform

**Full Name**: nself-chat (package and repository name)
**Short Name**: nchat (used in UI and code)
**Description**: Slack-like team chat with Telegram features, white-label customizable
**Demo Project**: This is a demo project showcasing the nself CLI stack

## Quick Reference

| Item | Value |
|------|-------|
| Framework | Next.js 15 + React 19 |
| Backend | nself CLI v0.4.2 (Hasura + PostgreSQL + Nhost Auth) |
| State | Zustand + Apollo Client |
| UI | Radix UI + Tailwind CSS |
| Real-time | Socket.io + GraphQL subscriptions |
| Port | 3000 (dev) |
| Dev Auth | 8 test users with auto-login |

---

## nself CLI v0.4.2 - Backend Infrastructure

The `.backend/` folder uses nself CLI to provide the complete backend stack.

### nself CLI Commands (v0.4.2)

```bash
# Core Commands
nself init              # Initialize new project (interactive wizard)
nself init --demo       # Full demo with all services enabled
nself build             # Generate docker-compose.yml, nginx configs
nself start             # Start all services
nself stop              # Stop all services
nself restart           # Restart all services
nself status            # Show service status
nself logs [service]    # View logs
nself urls              # List all service URLs
nself exec <service>    # Shell into container

# v0.4.2 Service Commands (NEW)
nself email             # Email provider configuration (16+ providers)
nself email setup       # Interactive email wizard
nself email check       # SMTP pre-flight connection test
nself email test        # Send test email

nself search            # Search engine management (6 engines)
nself search enable <engine>  # postgres|meilisearch|typesense|elasticsearch|opensearch|sonic
nself search test       # Test search connectivity

nself functions         # Serverless functions
nself functions create <name> --template api --ts  # Create TypeScript function
nself functions deploy local   # Deploy to local
nself functions deploy production  # Deploy to production

nself mlflow            # ML experiment tracking
nself mlflow experiments list   # List experiments
nself mlflow runs [experiment]  # List runs

nself metrics           # Monitoring configuration
nself metrics enable [profile]  # minimal|standard|full|auto

nself monitor           # Dashboard access
nself monitor services  # CLI service status
nself monitor resources # CLI resource usage
nself monitor grafana   # Open Grafana

# Other Commands
nself doctor            # Diagnose issues
nself clean             # Remove generated files
nself update            # Update CLI
```

### Service Architecture

**Required Services (4)** - Always enabled:
1. PostgreSQL - Database with 60+ extensions
2. Hasura - GraphQL Engine
3. Auth - Nhost Authentication
4. Nginx - Reverse proxy + SSL

**Optional Services (7)** - Enable as needed:
```bash
NSELF_ADMIN_ENABLED=true    # Admin UI (port 3021)
MINIO_ENABLED=true          # S3-compatible storage
REDIS_ENABLED=true          # Cache/sessions
FUNCTIONS_ENABLED=true      # Serverless functions
MAILPIT_ENABLED=true        # Email testing (dev)
MEILISEARCH_ENABLED=true    # Full-text search
MLFLOW_ENABLED=true         # ML tracking
```

**Monitoring Bundle (10)** - All or nothing:
```bash
MONITORING_ENABLED=true     # Prometheus, Grafana, Loki, etc.
```

### Important Port Notes

| Service | Internal Port | Notes |
|---------|---------------|-------|
| nself-admin | 3021 | NOT 3100 (Loki uses 3100) |
| Hasura | 8080 | GraphQL endpoint |
| Auth | 4000 | Authentication |
| PostgreSQL | 5432 | Database |
| MinIO | 9000/9001 | S3 storage |
| MeiliSearch | 7700 | Search |
| Grafana | 3000 | Dashboards |
| Prometheus | 9090 | Metrics |
| Loki | 3100 | Logs |

## Architecture Philosophy

**CRITICAL**: nself-chat is a **demo project** that runs on the nself CLI backend stack.

- The `.backend/` folder is **gitignored** - users must run `nself init`, `nself build`, `nself start`
- All backend services (PostgreSQL, Hasura, Auth, MinIO) come from nself CLI
- The README guides users through setting up their own backend
- When WE test locally, we use the existing `.backend/` folder

## Project Structure

```
/nself-chat/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes (config, auth)
│   │   ├── auth/              # Auth pages (signin, signup)
│   │   ├── chat/              # Main chat interface
│   │   ├── setup/             # 9-step setup wizard
│   │   ├── settings/          # User settings
│   │   ├── admin/             # Admin dashboard
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── setup/steps/       # 9 wizard step components
│   │   ├── chat/              # Chat UI components
│   │   ├── layout/            # Navigation, sidebar
│   │   ├── ui/                # Radix UI wrappers
│   │   └── admin/             # Admin components
│   ├── contexts/
│   │   ├── auth-context.tsx   # Auth state (dev + prod)
│   │   ├── app-config-context.tsx  # App configuration
│   │   └── theme-context.tsx  # Theme state
│   ├── services/auth/         # Auth implementations
│   │   ├── faux-auth.service.ts    # Dev mode (test users)
│   │   └── nhost-auth.service.ts   # Production
│   ├── graphql/               # GraphQL queries/mutations
│   ├── config/
│   │   ├── app-config.ts      # AppConfig interface (180+ lines)
│   │   └── auth.config.ts     # Auth configuration
│   ├── lib/
│   │   ├── theme-presets.ts   # 8+ theme presets
│   │   └── environment.ts     # Dev detection
│   └── hooks/                 # Custom React hooks
├── .backend/                  # nself CLI project (GITIGNORED)
│   ├── migrations/            # Database migrations
│   ├── docker-compose.yml     # Generated by nself
│   └── .env                   # Backend env vars
├── FEATURES.md                # Feature reference
├── ROADMAP.md                 # Development phases
└── package.json
```

## Development Mode

### Test Users (Dev Mode)
When `NEXT_PUBLIC_USE_DEV_AUTH=true`:

| Email | Role | Purpose |
|-------|------|---------|
| owner@nself.org | owner | First user, full permissions |
| admin@nself.org | admin | User/channel management |
| moderator@nself.org | moderator | Content moderation |
| member@nself.org | member | Standard user |
| guest@nself.org | guest | Limited read-only |
| alice/bob/charlie@nself.org | member | Additional test users |

Password for all: `password123`

### Auto-Login
Dev mode automatically logs in as `owner@nself.org` for faster iteration.

### Switching Users
Use `switchUser(email)` from AuthContext to test different roles.

## Key Configuration

### AppConfig Interface (`src/config/app-config.ts`)
The heart of white-label customization:

```typescript
interface AppConfig {
  setup: { completed: boolean, completedSteps: string[], currentStep: number }
  owner: { name, email, company, role }
  branding: { appName, logo, favicon, tagline, companyName }
  landing: { mode: 'landing' | 'redirect' | 'chat', ... }
  auth: {
    methods: { email, google, github, apple, idme },
    permissions: 'allow-all' | 'verified-only' | 'admin-only'
  }
  features: { channels, directMessages, threads, reactions, fileUploads, ... }
  theme: { mode, preset, colors }
  integrations: { slack, github, jira, googleDrive }
}
```

### Environment Variables (`.env.local`)
```bash
# Backend URLs (via nself CLI)
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Dev Mode
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development

# White-label defaults
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
```

## Setup Wizard (9 Steps)

Located in `src/components/setup/steps/`:

1. **welcome-step** - Introduction
2. **owner-info-step** - Owner details
3. **auth-methods-step** - Auth providers (email, social, ID.me)
4. **access-permissions-step** - Access control mode
5. **features-step** - Feature toggles
6. **landing-page-step** - Landing page configuration
7. **branding-step** - App branding (name, logo, colors)
8. **theme-step** - Theme customization (8+ presets)
9. **review-step** - Review and confirm

## Database Schema

Located in `.backend/migrations/`:

| Table | Purpose |
|-------|---------|
| nchat_users | User accounts |
| nchat_channels | Chat channels |
| nchat_messages | Messages |
| nchat_roles | Role definitions |
| nchat_role_permissions | RBAC permissions |
| app_configuration | AppConfig storage |

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| /api/config | GET | Fetch AppConfig from database |
| /api/config | POST | Save AppConfig to database |
| /api/auth/signup | POST | User registration |
| /api/auth/signin | POST | User login |

## Provider Stack

Root layout wraps with:
```
NhostProvider → AppConfigProvider → ThemeProvider → ApolloProvider → AuthProvider
```

## Inspiration & Goals

### Design Inspiration
- **Slack**: Channel-based organization, threads, integrations
- **Telegram**: Message reactions, voice messages, stickers
- **Discord**: Server/channel hierarchy, roles, rich embeds

### Unique Features (Planned)
- **ID.me authentication** - Government-grade identity verification
- **White-label everything** - Every aspect customizable
- **Self-hosted** - Run on your own nself infrastructure
- **Progressive setup** - Guided 9-step wizard

## Development Commands

```bash
# Start frontend (requires backend running)
npm run dev

# Start backend (first time)
cd .backend && nself init && nself build && nself start

# Start backend (subsequent)
cd .backend && nself start

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## Implementation Status

### Implemented
- [x] Project structure with Next.js 15
- [x] Complete setup wizard UI (9 steps)
- [x] AppConfig data model and persistence
- [x] Authentication (dev mode with test users)
- [x] Theme system with 8+ presets
- [x] GraphQL client setup
- [x] Database schema with RBAC
- [x] Radix UI component library

### Partially Implemented
- [ ] Production authentication (Nhost integration)
- [ ] Real-time messaging (Socket.io setup incomplete)
- [ ] Chat UI (components exist, integration needed)
- [ ] Notifications

### Not Implemented
- [ ] Voice messages
- [ ] Video conferencing
- [ ] Social embeds/URL unfurling
- [ ] Integrations (Slack, GitHub, etc.)
- [ ] Advanced moderation
- [ ] Analytics dashboard

## Related Projects

| Project | Location | Purpose |
|---------|----------|---------|
| nself CLI | ~/Sites/nself | Backend infrastructure (v0.4.2) |
| nself-admin | ~/Sites/nself-admin | Admin UI wrapper |
| nself-web | ~/Sites/nself-web | Production web infrastructure |
| nself-web/chat | ~/Sites/nself-web/chat | Production deployment of nchat |

---

## nself v0.4.2 Feature Summary

**Email** (`nself email`):
- 16+ providers: SendGrid, Mailgun, Postmark, AWS SES, Microsoft 365, etc.
- MailPit default for development (zero config)
- SMTP pre-flight check validates: DNS, TCP, SMTP banner, TLS

**Search** (`nself search`):
- 6 engines: PostgreSQL FTS (default), MeiliSearch, Typesense, Elasticsearch, OpenSearch, Sonic
- PostgreSQL FTS requires no extra services

**Functions** (`nself functions`):
- TypeScript support with `--ts` flag
- 4 templates: basic, webhook, api, scheduled
- Deploy to local or production

**MLflow** (`nself mlflow`):
- Experiment tracking for ML projects
- List/create/delete experiments
- View runs by experiment

**Monitoring** (`nself metrics` + `nself monitor`):
- 3 profiles: minimal (4 services), standard (7), full (10)
- Auto profile detects environment
- CLI views for services and resources

### Cross-Platform Compatibility

nself v0.4.2 works on:
- macOS (Bash 3.2, BSD tools)
- Linux (all distributions)
- WSL (Windows Subsystem for Linux)

All commands use `printf` (not `echo -e`) and `safe_sed_inline()` for portability.

## Key Decisions

1. **Config-First**: All behavior controlled via AppConfig for white-label flexibility
2. **Dual Auth**: FauxAuthService (dev) + NhostAuthService (prod)
3. **LocalStorage First**: Config loads locally, syncs to database async
4. **Progressive Setup**: New users guided through wizard before chat access
5. **GraphQL-First**: All data access through Hasura (no REST)

## Common Issues

### "Backend not running"
```bash
cd .backend && nself start
```

### "Auth not working"
Check `NEXT_PUBLIC_USE_DEV_AUTH=true` in `.env.local`

### "GraphQL errors"
Ensure Hasura is running: `docker ps | grep hasura`

### "Theme not applying"
Clear localStorage: `localStorage.removeItem('nchat-config')`

## Testing Different Roles

```typescript
// In browser console or component
import { useAuth } from '@/contexts/auth-context'
const { switchUser } = useAuth()
await switchUser('admin@nself.org') // Switch to admin
await switchUser('guest@nself.org') // Switch to guest
```

## Future Enhancements

Per ROADMAP.md (12 phases):
- Phase 0: Foundation (current)
- Phase 1: First-run setup wizard
- Phase 2: Authentication
- Phase 3: Core chat UI
- Phase 4: Real-time features
- Phase 5-12: Advanced features through launch
