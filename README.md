# ɳChat

**Real-time team communication platform - part of the ɳSelf ecosystem**

Technical name: `nself-chat` | Package: `@nself/chat` | Short name: `nchat`

[![CI](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml)
[![CD](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)

> **Note**: ɳChat is a demo project showcasing the [ɳSelf CLI](https://github.com/acamarata/nself) backend infrastructure. While fully functional for development and testing, production use should follow the deployment guidelines below.

---

Build your own Slack, Discord, or Telegram clone with **ɳChat** - a complete, production-ready team communication platform powered by **ɳSelf**. Fully customizable with **zero code required** via our comprehensive setup wizard.

**3 Commands. That's It.** Clone, install, run - the wizard handles everything else: backend setup, configuration, branding, and deployment.

Powered by [ɳSelf](https://nself.org) for backend infrastructure (PostgreSQL, Hasura GraphQL, Auth, Storage).

---

## Why ɳChat?

### Lightning Fast Setup
- **Under 5 minutes** from zero to running chat application
- 3 commands to start development
- 8 test users ready to explore immediately
- Auto-login in development mode for rapid iteration

### Complete Feature Set
- **78+ Features**: Messaging, channels, threads, reactions, file uploads, and more
- **11 Auth Providers**: Email, magic links, Google, GitHub, Apple, ID.me, and more
- **Bot SDK**: Build custom bots with slash commands, events, and rich responses
- **Real-time**: WebSocket-powered typing indicators, read receipts, and presence

### White-Label Everything
- **12-Step Setup Wizard**: Complete guided experience with environment detection
- **27 Theme Presets**: From Slack-like to Discord-style and beyond
- **Full Branding Control**: Logo, colors, fonts, and custom CSS
- **Landing Page Templates**: 5 homepage styles to choose from
- **Env-Var Configuration**: Pre-configure and skip wizard steps entirely

### Multi-Platform Support
- **Web**: Next.js 15 with React 19
- **Desktop**: Tauri (lightweight native) and Electron (cross-platform)
- **Mobile**: Capacitor (iOS/Android) and React Native
- **Deployment**: Docker, Kubernetes, Helm, Vercel

---

## Quick Start

### Prerequisites

- **Node.js 20+**
- **pnpm 9+** (`npm install -g pnpm`)
- **Docker** (optional, for backend services)

### 3 Commands to Chat Bliss

```bash
# 1. Clone and enter project
git clone https://github.com/acamarata/nself-chat.git && cd nself-chat

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

**That's it!** Visit **http://localhost:3000** and the **Setup Wizard** guides you through everything:

1. **Environment Detection** - Automatically detects what's already configured
2. **Backend Setup** - One-click nself CLI installation and service startup
3. **Customization** - Brand, theme, features, and auth in a few clicks
4. **Deployment** - Get commands for Vercel, Docker, desktop apps, and mobile

Development mode includes test users so you can immediately experience all features.

### Development Test Users

| Email | Role | Password | Purpose |
|-------|------|----------|---------|
| owner@nself.org | Owner | password123 | Full permissions, first user |
| admin@nself.org | Admin | password123 | User/channel management |
| moderator@nself.org | Moderator | password123 | Content moderation |
| member@nself.org | Member | password123 | Standard user experience |
| guest@nself.org | Guest | password123 | Limited read-only access |
| alice@nself.org | Member | password123 | Additional test user |
| bob@nself.org | Member | password123 | Additional test user |
| charlie@nself.org | Member | password123 | Additional test user |

*Dev mode auto-logs in as `owner@nself.org` for faster iteration.*

---

## Features at a Glance

### 78+ Features Across 13 Categories

| Category | Count | Features |
|----------|-------|----------|
| **Messaging** | 14 | Channels, DMs, threads, reactions, pins, bookmarks, voice messages, scheduled messages, code blocks, markdown, link previews, mentions, quotes, forward |
| **Channels** | 9 | Public, private, direct messages, group DMs, categories, topics, archive, favorites, mute |
| **Files & Media** | 8 | Upload, images, documents, audio, video, preview, drag & drop, clipboard paste |
| **Users & Presence** | 7 | Online/away status, custom status, profiles, roles, blocking, avatars, display names |
| **Real-time** | 5 | Typing indicators, read receipts, presence updates, live messages, live notifications |
| **Search** | 6 | Messages, files, users, global search, filters, highlighting |
| **Notifications** | 6 | Desktop, sound, email, mobile push, do not disturb, quiet hours |
| **Emoji & Reactions** | 4 | Emoji picker, custom emoji, GIF picker, stickers |
| **Polls & Voting** | 3 | Create polls, anonymous voting, timed polls |
| **Bots & Automation** | 6 | Bot SDK, slash commands, webhooks, custom bots, bot marketplace, event handlers |
| **Admin** | 6 | Dashboard, user management, analytics, audit logs, bulk operations, data export |
| **Moderation** | 6 | Content moderation, reporting, auto-filter, warnings, bans, slow mode |
| **Integrations** | 4 | Slack import, GitHub, Jira, Google Drive |

---

## White-Label Guide

### 12-Step Setup Wizard (3 Phases)

When you first visit the app, you'll be guided through a comprehensive setup wizard organized into three phases:

#### Phase 1: Setup (Steps 1-3)
| Step | Name | What You Configure |
|------|------|-------------------|
| 1 | **Welcome** | Introduction to the setup process |
| 2 | **Environment Detection** | Auto-detect existing config, choose setup mode |
| 3 | **Backend Setup** | Install nself CLI, initialize and start services |

#### Phase 2: Customize (Steps 4-10)
| Step | Name | What You Configure |
|------|------|-------------------|
| 4 | **Owner Info** | Your name, email, company details |
| 5 | **Branding** | App name, logo, tagline, favicon |
| 6 | **Theme** | Colors, dark/light mode, preset themes |
| 7 | **Landing Page** | Homepage style and sections |
| 8 | **Auth Methods** | Choose authentication providers |
| 9 | **Permissions** | Access control and verification |
| 10 | **Features** | Toggle available features and integrations |

#### Phase 3: Deploy (Steps 11-12)
| Step | Name | What You Configure |
|------|------|-------------------|
| 11 | **Deployment** | Choose deployment targets and get commands |
| 12 | **Review & Launch** | Preview and confirm all settings |

**Time to complete: 5-10 minutes** (faster if you skip optional steps)

**Skip with Environment Variables**: Pre-configure via `.env.local` and the wizard auto-skips those steps!

### Customization Options

| What You Can Customize | Details |
|------------------------|---------|
| **App Name** | Your brand name displayed everywhere |
| **Logo & Favicon** | Upload custom or use logo builder |
| **Colors** | Primary, secondary, accent, background, surface, text, borders |
| **Theme Presets** | 27 ready-to-use themes |
| **Typography** | Font family, sizes, weights |
| **Border Radius** | From sharp to fully rounded |
| **Features** | Enable/disable any of 78+ features |
| **Auth Methods** | Choose from 11 providers |
| **Landing Page** | 5 homepage templates |
| **Email Templates** | Customize transactional emails |
| **Custom CSS** | Full CSS customization support |

### Theme Presets (27)

| Category | Presets |
|----------|---------|
| **Platform-Inspired** | nself (default), Slack, Discord |
| **Themed** | Ocean, Sunset, Midnight |
| **Tailwind Colors** | Slate, Gray, Zinc, Stone |
| **Warm Colors** | Red, Orange, Amber, Yellow |
| **Cool Colors** | Lime, Green, Emerald, Teal, Cyan, Sky, Blue |
| **Purple/Pink** | Indigo, Violet, Purple, Fuchsia, Pink, Rose |

Each preset includes both light and dark mode variants with carefully tuned colors for readability and accessibility.

### Landing Page Templates

| Template | Description |
|----------|-------------|
| **Login Only** | Direct to login, no landing page |
| **Simple Landing** | Basic hero section with CTA |
| **Full Homepage** | Complete marketing site with nav, pricing, about |
| **Corporate** | Professional layout for business teams |
| **Community** | Open community platform with docs and blog |

---

## Production Deployment

### With ɳSelf Backend (Recommended)

The complete backend stack powered by **ɳSelf** in minutes:

```bash
# 1. Install ɳSelf CLI
curl -sSL https://install.nself.org | bash

# 2. Initialize backend
mkdir .backend && cd .backend
nself init --demo
nself build && nself start
cd ..

# 3. Configure frontend
cp .env.example .env.local
# Edit .env.local - set NEXT_PUBLIC_USE_DEV_AUTH=false

# 4. Build and start production
pnpm build && pnpm start
```

Your **ɳSelf** backend services will be available at:
- GraphQL API: https://api.local.nself.org
- Auth Service: https://auth.local.nself.org
- Storage: https://storage.local.nself.org
- Email (dev): https://mail.local.nself.org

### With Docker

```bash
# Build the image
docker build -t nchat:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_NAME="My Chat" \
  -e NEXT_PUBLIC_GRAPHQL_URL="https://api.myapp.com/v1/graphql" \
  -e NEXT_PUBLIC_AUTH_URL="https://auth.myapp.com/v1/auth" \
  -e NEXT_PUBLIC_USE_DEV_AUTH=false \
  nchat:latest
```

### With Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### With Kubernetes

```bash
# Apply all manifests
kubectl apply -f deploy/k8s/

# Or use kustomize
kubectl apply -k deploy/k8s/

# Check status
kubectl get pods -n nchat
```

Available K8s resources:
- Namespace, ConfigMap, Secrets
- Deployment with health checks
- Service and Ingress
- HPA (Horizontal Pod Autoscaler)
- PDB (Pod Disruption Budget)
- NetworkPolicy

### With Helm

```bash
# Add values for your environment
helm install nchat deploy/helm/nself-chat \
  -f deploy/helm/nself-chat/values-production.yaml \
  --set ingress.host=chat.mycompany.com

# Upgrade existing deployment
helm upgrade nchat deploy/helm/nself-chat \
  -f deploy/helm/nself-chat/values-production.yaml
```

### Desktop Apps

#### Tauri (Recommended - Lightweight Native)

```bash
# Development
pnpm tauri:dev

# Build for all platforms
pnpm build:tauri

# Build for specific platform
pnpm tauri build --target universal-apple-darwin  # macOS
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target x86_64-unknown-linux-gnu # Linux
```

#### Electron (Cross-Platform)

```bash
# Development
pnpm electron:dev

# Build for all platforms
pnpm build:electron

# Platform-specific
pnpm electron:build --mac
pnpm electron:build --win
pnpm electron:build --linux
```

### Mobile Apps

#### Capacitor (iOS/Android)

```bash
# Sync web assets
pnpm cap:sync

# Open in Xcode
pnpm cap ios

# Open in Android Studio
pnpm cap android

# Build
pnpm cap:build
```

#### React Native

```bash
cd platforms/react-native

# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## Project Structure

```
nself-chat/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes (config, auth)
│   │   ├── auth/                 # Authentication pages
│   │   ├── chat/                 # Main chat interface
│   │   ├── setup/                # 9-step wizard
│   │   ├── settings/             # User settings
│   │   └── admin/                # Admin dashboard
│   ├── components/               # React components (75+ directories)
│   │   ├── chat/                 # Chat UI (message list, composer)
│   │   ├── channel/              # Channel list, header, settings
│   │   ├── user/                 # User card, profile, presence
│   │   ├── setup/steps/          # Wizard step components
│   │   ├── admin/                # Admin dashboard components
│   │   └── ui/                   # Base UI (Radix wrappers)
│   ├── lib/                      # Libraries & utilities
│   │   ├── bots/                 # Bot SDK and runtime
│   │   ├── socket/               # WebSocket real-time
│   │   └── features/             # Feature flag system
│   ├── hooks/                    # 60+ custom React hooks
│   ├── contexts/                 # React contexts (auth, config, theme)
│   ├── services/                 # Service layer (auth, api)
│   ├── graphql/                  # GraphQL queries/mutations
│   ├── config/                   # Configuration (AppConfig, auth)
│   └── bots/                     # Example bots (hello, poll, reminder, welcome)
├── platforms/                    # Desktop & mobile apps
│   ├── tauri/                    # Tauri desktop app
│   ├── electron/                 # Electron desktop app
│   ├── capacitor/                # Capacitor mobile config
│   └── react-native/             # React Native mobile app
├── deploy/                       # Deployment configurations
│   ├── k8s/                      # Kubernetes manifests
│   └── helm/nself-chat/          # Helm chart
├── docs/                         # Documentation (30+ pages)
├── .backend/                     # nself CLI backend (gitignored)
└── .github/                      # CI/CD workflows
```

---

## Available Scripts

### Development

```bash
pnpm dev                    # Start dev server (localhost:3000)
pnpm dev:turbo              # Start with Turbopack (faster)
```

### Building

```bash
pnpm build                  # Production build
pnpm build:analyze          # Build with bundle analysis
pnpm build:all              # Build web + desktop + mobile
pnpm build:docker           # Build Docker image
```

### Testing

```bash
pnpm test                   # Run unit tests
pnpm test:watch             # Watch mode
pnpm test:coverage          # Generate coverage report
pnpm test:e2e               # End-to-end tests (Playwright)
pnpm test:e2e:ui            # E2E with UI mode
```

### Code Quality

```bash
pnpm lint                   # ESLint
pnpm lint:fix               # Auto-fix lint issues
pnpm type-check             # TypeScript check
pnpm type-check:watch       # Watch mode
pnpm format                 # Prettier format
pnpm format:check           # Check formatting
```

### Backend (ɳSelf)

```bash
pnpm backend:start          # Start ɳSelf backend services
pnpm backend:stop           # Stop ɳSelf backend services
pnpm backend:status         # Check ɳSelf service status
pnpm backend:logs           # View ɳSelf backend logs
```

### Database

```bash
pnpm db:migrate             # Run migrations
pnpm db:seed                # Seed database
pnpm db:types               # Generate TypeScript types
pnpm db:studio              # Open database shell
```

### Desktop Apps

```bash
pnpm tauri:dev              # Tauri development
pnpm tauri:build            # Tauri production
pnpm electron:dev           # Electron development
pnpm electron:build         # Electron production
```

### Mobile Apps

```bash
pnpm cap:sync               # Sync Capacitor
pnpm cap ios                # Open iOS project
pnpm cap android            # Open Android project
```

### Release

```bash
pnpm release                # Create release
pnpm release:patch          # Patch version bump
pnpm release:minor          # Minor version bump
pnpm release:major          # Major version bump
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

### Key Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENV` | development | Environment: development, staging, production |
| `NEXT_PUBLIC_USE_DEV_AUTH` | true | Enable test users and auto-login |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 | Base URL for OAuth callbacks |
| `NEXT_PUBLIC_GRAPHQL_URL` | http://api.localhost/v1/graphql | Hasura GraphQL endpoint |
| `NEXT_PUBLIC_AUTH_URL` | http://auth.localhost/v1/auth | Nhost Auth endpoint |
| `NEXT_PUBLIC_STORAGE_URL` | http://storage.localhost/v1/storage | MinIO storage endpoint |
| `NEXT_PUBLIC_SOCKET_URL` | ws://realtime.localhost | WebSocket server |
| `NEXT_PUBLIC_APP_NAME` | nchat | Application name |
| `NEXT_PUBLIC_THEME_MODE` | dark | Default color mode: light, dark, system |
| `NEXT_PUBLIC_THEME_PRIMARY` | #00D4FF | Primary brand color |
| `NEXT_PUBLIC_PLATFORM_TEMPLATE` | default | UI template: default, slack, discord, telegram |

See `.env.example` for the complete reference with 100+ configurable options.

---

## Authentication Providers

nself-chat supports **11 authentication methods**:

| Provider | Type | Setup Required | Notes |
|----------|------|----------------|-------|
| **Email/Password** | Credential | None | Traditional authentication |
| **Magic Links** | Passwordless | SMTP | Email-based, no password needed |
| **Google** | OAuth | Client ID/Secret | Most common social login |
| **GitHub** | OAuth | Client ID/Secret | Popular for developer tools |
| **Apple** | OAuth | Service ID/Key | Required for iOS apps |
| **Microsoft** | OAuth | Client ID/Secret | Enterprise/Azure AD |
| **Discord** | OAuth | Client ID/Secret | Gaming communities |
| **Slack** | OAuth | Client ID/Secret | Workspace integration |
| **Facebook** | OAuth | App ID/Secret | Social network |
| **Twitter/X** | OAuth | API Key/Secret | Social network |
| **ID.me** | Identity | Client ID/Secret | Government-grade verification |

### ID.me Integration

Special support for verified identity groups:

| Group | Description |
|-------|-------------|
| **Military** | Active duty service members |
| **Veterans** | Former military personnel |
| **First Responders** | Police, fire, EMT |
| **Government** | Federal, state, local employees |
| **Teachers** | K-12 and higher education |
| **Students** | College and university students |
| **Nurses** | Licensed healthcare professionals |

Configure in the setup wizard or via environment:

```env
NEXT_PUBLIC_AUTH_IDME=true
IDME_CLIENT_ID=your_client_id
IDME_CLIENT_SECRET=your_client_secret
```

---

## Bot SDK

Build custom bots with our comprehensive SDK:

```typescript
import { bot, command, text, embed } from '@/lib/bots'

// Create a weather bot
const weatherBot = bot('weather-bot')
  .name('Weather Bot')
  .description('Get weather forecasts')
  .icon('🌤️')

  // Add a slash command
  .command('weather', 'Get current weather', async (ctx) => {
    const location = ctx.args._raw || 'New York'
    const weather = await fetchWeather(location)

    return embed({
      title: `Weather in ${location}`,
      description: `${weather.temp}°F - ${weather.condition}`,
      color: '#3b82f6',
      fields: [
        { name: 'Humidity', value: `${weather.humidity}%`, inline: true },
        { name: 'Wind', value: `${weather.wind} mph`, inline: true }
      ]
    })
  })

  // Respond to mentions
  .onMention((ctx) => {
    return text('Try /weather <city> to get the forecast!')
  })

  .build()
```

### Example Bots Included

| Bot | Description | Commands |
|-----|-------------|----------|
| **Hello Bot** | Greetings and jokes | `/hello`, `/hi`, `/greet @user`, `/joke` |
| **Poll Bot** | Create and manage polls | `/poll`, `/vote`, `/results`, `/closepoll` |
| **Reminder Bot** | Set reminders | `/remind in 30m`, `/remind at 3pm`, `/reminders` |
| **Welcome Bot** | Welcome new members | `/setwelcome`, `/welcomemessage`, `/testwelcome` |

### Bot Features

- **Slash Commands**: Custom `/commands` with arguments
- **Message Handling**: Respond to messages, keywords, patterns
- **Event Subscriptions**: User join/leave, reactions
- **Rich Responses**: Embeds, buttons, select menus
- **Permissions**: Granular permission control
- **Rate Limiting**: Built-in protection
- **Sandboxed Runtime**: Secure execution environment

---

## Documentation

Full documentation available in the [docs/](docs/) folder:

### Getting Started
- [Home](docs/Home.md) - Documentation overview
- [Getting Started](docs/Getting-Started.md) - Quick start guide
- [Installation](docs/Installation.md) - Detailed installation
- [Configuration](docs/Configuration.md) - Configuration reference

### Features
- [Features Overview](docs/Features.md) - All 78+ features
- [Features - Messaging](docs/Features-Messaging.md) - Messaging details
- [Authentication](docs/Authentication.md) - Auth providers setup

### Deployment
- [Docker](docs/Deployment-Docker.md) - Docker deployment
- [Kubernetes](docs/Deployment-Kubernetes.md) - K8s deployment
- [Helm](docs/Deployment-Helm.md) - Helm charts

### Extending
- [Bots](docs/Bots.md) - Bot SDK documentation
- [Plugins](docs/Plugins.md) - Plugin architecture
- [Plugins List](docs/Plugins-List.md) - Available plugins

### Development
- [Architecture](docs/Architecture.md) - System design
- [White-Label Guide](docs/White-Label-Guide.md) - Customization
- [Contributing](docs/Contributing.md) - How to contribute
- [Changelog](docs/Changelog.md) - Version history
- [Roadmap](docs/Roadmap.md) - Future plans

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15, React 19 |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4, CSS Variables |
| **Components** | Radix UI, Lucide Icons |
| **State** | Zustand 5, React Context |
| **Data Fetching** | Apollo Client, GraphQL, SWR |
| **Real-time** | Socket.io, GraphQL Subscriptions |
| **Forms** | React Hook Form, Zod |
| **Editor** | TipTap (rich text) |
| **Animation** | Framer Motion |
| **Charts** | Recharts |
| **Testing** | Jest, Playwright, Testing Library |
| **Backend** | ɳSelf (Hasura, PostgreSQL, Nhost Auth, MinIO) |
| **Desktop** | Tauri, Electron |
| **Mobile** | Capacitor, React Native |
| **Monitoring** | Sentry |

---

## ɳPlugins (Future Extensibility)

Many features can be extracted as **ɳPlugins** for modular deployment:

| Plugin | Description | Status |
|--------|-------------|--------|
| `@nself/plugin-voice` | Voice messages & calls | Planned |
| `@nself/plugin-video` | Video calls & meetings | Planned |
| `@nself/plugin-bots` | Bot SDK & marketplace | Available |
| `@nself/plugin-idme` | ID.me identity verification | Available |
| `@nself/plugin-polls` | Polls & voting | Available |
| `@nself/plugin-stickers` | Sticker packs | Planned |
| `@nself/plugin-gifs` | GIF picker integration | Available |
| `@nself/plugin-analytics` | Usage analytics | Planned |
| `@nself/plugin-audit` | Audit logging | Available |
| `@nself/plugin-workflows` | Automation workflows | Planned |

See [docs/Plugins.md](docs/Plugins.md) for the full list and implementation guide.

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [docs/Contributing.md](docs/Contributing.md) for detailed guidelines.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Part of ɳSelf

**ɳChat** is part of the **ɳSelf** platform - the open-source Firebase alternative:

- [ɳSelf Core](https://github.com/nselforg/nself) - BaaS platform
- [ɳAdmin](https://github.com/nselforg/nself-admin) - Admin dashboard
- [ɳChat](https://github.com/acamarata/nself-chat) - Real-time chat (this project)
- [ɳPlugins](https://github.com/nselforg/nself-plugins) - Plugin marketplace

Learn more at [nself.org](https://nself.org)

---

## Support

- [GitHub Issues](https://github.com/acamarata/nself-chat/issues) - Bug reports & feature requests
- [Documentation](docs/) - Full documentation
- [ɳSelf](https://nself.org) - Backend infrastructure

---

Built with [ɳSelf](https://nself.org) | Powered by Next.js 15 & React 19
