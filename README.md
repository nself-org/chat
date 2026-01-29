# nself-chat (nchat)

[![CI](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml)
[![CD](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

**White-label team communication platform** - Build your own Slack, Discord, or Telegram clone in minutes.

Powered by [nself CLI](https://github.com/nself/nself) for backend infrastructure.

---

## What is nself-chat?

nself-chat is a **complete, production-ready** team communication platform that you can fully customize and deploy as your own product. It combines the best features of:

- **Slack** - Channels, threads, integrations
- **Discord** - Roles, permissions, rich embeds
- **Telegram** - Stickers, voice messages, bots
- **WhatsApp** - Direct messages, read receipts, presence

All with **zero code required** for customization via our setup wizard.

---

## Features at a Glance

| Category | Features |
|----------|----------|
| **Messaging** | Channels, DMs, threads, reactions, pins, bookmarks, voice messages, scheduled messages |
| **Authentication** | Email/password, magic links, Google, GitHub, Apple, Microsoft, Facebook, Twitter, phone/SMS, ID.me |
| **Files** | Drag & drop upload, image previews, media gallery, inline documents |
| **Real-time** | Typing indicators, read receipts, presence, live updates |
| **Rich Content** | Custom emoji, GIFs, stickers, polls, link previews, code blocks |
| **Search** | Full-text search across messages, files, and users |
| **Admin** | User management, analytics, audit logs, moderation tools |
| **Bots** | Bot SDK with example bots (polls, reminders, welcome) |
| **Customization** | White-label wizard, 8+ themes, full branding control |
| **Deployment** | Docker, Kubernetes, Vercel, Tauri desktop, Capacitor mobile |

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **pnpm 9+**
- **Docker** (for backend services)

### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/acamarata/nself-chat.git
cd nself-chat

# 2. Install dependencies
pnpm install

# 3. Start in development mode
pnpm dev
```

Visit **http://localhost:3000** - that's it! Development mode includes test users so you can explore immediately.

### Development Test Users

| Email | Role | Password |
|-------|------|----------|
| owner@nself.org | Owner | password123 |
| admin@nself.org | Admin | password123 |
| moderator@nself.org | Moderator | password123 |
| member@nself.org | Member | password123 |
| guest@nself.org | Guest | password123 |
| alice@nself.org | Member | password123 |
| bob@nself.org | Member | password123 |
| charlie@nself.org | Member | password123 |

---

## White-Labeling Your Chat App

### The Setup Wizard (9 Steps)

When you first visit the app, you'll be guided through a **9-step wizard**:

1. **Welcome** - Introduction to the setup process
2. **Owner Info** - Your name, email, and company details
3. **Branding** - App name, logo, tagline, favicon
4. **Theme** - Colors, dark/light mode, preset themes
5. **Features** - Toggle channels, DMs, threads, reactions, etc.
6. **Authentication** - Choose auth providers (email, Google, GitHub, etc.)
7. **Access Permissions** - Public, invite-only, or admin-only
8. **Landing Page** - Configure your public homepage
9. **Review** - Preview and confirm all settings

**Time to complete: 5-10 minutes**

### White-Label Customization Options

| What You Can Customize | Details |
|------------------------|---------|
| **App Name** | Your brand name displayed everywhere |
| **Logo & Favicon** | Upload or generate with our builder |
| **Colors** | Primary, secondary, accent colors |
| **Theme Presets** | 8+ ready-to-use themes (Slack, Discord, Teams, etc.) |
| **Typography** | Font families and sizes |
| **Features** | Enable/disable any feature |
| **Auth Methods** | Choose which login options to offer |
| **Landing Page** | Full marketing homepage templates |
| **Email Templates** | Customize transactional emails |
| **Custom Domain** | Connect your own domain |

### Theme Presets

| Preset | Description |
|--------|-------------|
| **nself** | Clean, modern default theme |
| **Slack** | Familiar Slack-like appearance |
| **Discord** | Dark, gaming-inspired theme |
| **Teams** | Professional Microsoft Teams style |
| **Sunset** | Warm orange/red tones |
| **Emerald** | Fresh green color scheme |
| **Rose** | Soft pink/red palette |
| **Purple** | Rich purple gradients |

---

## Production Deployment

### With nself CLI Backend

```bash
# Install nself CLI
npm install -g @nself/cli

# Initialize backend
cd .backend
nself init --demo
nself build
nself start

# Return to frontend
cd ..
cp .env.example .env.local

# Build for production
pnpm build

# Start production server
pnpm start
```

### With Docker

```bash
# Build image
docker build -t my-chat-app:latest .

# Run with environment
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_APP_NAME="My Chat" \
  -e NEXT_PUBLIC_GRAPHQL_URL="https://api.myapp.com/v1/graphql" \
  my-chat-app:latest
```

### With Docker Compose

```bash
docker compose up -d
```

### With Kubernetes

```bash
# Deploy to your cluster
kubectl apply -f k8s/production/
```

### Desktop Apps

```bash
# Tauri (lightweight, native)
pnpm tauri build

# Electron (cross-platform)
pnpm electron:build
```

### Mobile Apps

```bash
# Capacitor (iOS/Android)
pnpm cap:build:ios
pnpm cap:build:android
```

---

## Project Structure

```
nself-chat/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── chat/              # Main chat interface
│   │   ├── setup/             # Setup wizard
│   │   ├── settings/          # User settings
│   │   ├── admin/             # Admin dashboard
│   │   └── ...
│   ├── components/             # React components (75+ directories)
│   │   ├── chat/              # Chat UI
│   │   ├── channel/           # Channel components
│   │   ├── user/              # User components
│   │   ├── setup/             # Wizard steps
│   │   ├── admin/             # Admin components
│   │   ├── ui/                # Base UI (Radix)
│   │   └── ...
│   ├── lib/                    # Libraries & utilities
│   │   ├── auth/              # Auth providers
│   │   ├── bots/              # Bot SDK
│   │   ├── socket/            # Real-time
│   │   ├── features/          # Feature flags
│   │   └── ...
│   ├── hooks/                  # 60+ custom React hooks
│   ├── contexts/               # React contexts
│   ├── services/               # Service layer
│   ├── graphql/                # GraphQL operations
│   └── config/                 # Configuration
├── docs/                       # Documentation
├── .backend/                   # nself backend (gitignored)
├── tauri/                      # Tauri desktop app
├── electron/                   # Electron desktop app
├── capacitor/                  # Mobile app config
├── k8s/                        # Kubernetes manifests
└── .github/                    # CI/CD workflows
```

---

## Available Scripts

```bash
# Development
pnpm dev                  # Start dev server (localhost:3000)
pnpm dev:turbo            # Start with Turbopack

# Building
pnpm build                # Production build
pnpm build:analyze        # Build with bundle analysis

# Testing
pnpm test                 # Unit tests
pnpm test:e2e             # E2E tests
pnpm test:coverage        # Coverage report

# Code Quality
pnpm lint                 # ESLint
pnpm lint:fix             # Auto-fix issues
pnpm type-check           # TypeScript check
pnpm format               # Prettier

# Desktop Apps
pnpm tauri dev            # Tauri development
pnpm tauri build          # Tauri production
pnpm electron:dev         # Electron development
pnpm electron:build       # Electron production

# Mobile Apps
pnpm cap:ios              # Open iOS project
pnpm cap:android          # Open Android project
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

```env
# Backend URLs (configure for your deployment)
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Mode
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development

# Branding Defaults
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
```

---

## Authentication Providers

nself-chat supports **11 authentication methods**:

| Provider | Type | Setup Required |
|----------|------|----------------|
| Email/Password | Credential | None |
| Magic Link | Passwordless | SMTP |
| Google | OAuth | Client ID/Secret |
| GitHub | OAuth | Client ID/Secret |
| Apple | OAuth | Service ID/Key |
| Microsoft | OAuth | Client ID/Secret |
| Facebook | OAuth | App ID/Secret |
| Twitter/X | OAuth | API Key/Secret |
| Phone/SMS | OTP | Twilio/SNS |
| ID.me | Identity | Client ID/Secret |
| Telegram | Widget | Bot Token |

### ID.me Integration

Special support for verified identity groups:
- Military (active duty)
- Veterans
- First Responders (police, fire, EMT)
- Government employees
- Teachers & Students
- Nurses & Healthcare

---

## Bot SDK

Build custom bots using our SDK:

```typescript
import { Bot, BotContext, BotResponse } from '@/lib/bots';

export class MyBot implements Bot {
  readonly id = 'my-bot';
  readonly name = 'My Bot';
  readonly description = 'Does something cool';
  readonly avatar = '🤖';

  getCommands() {
    return [
      { name: 'hello', description: 'Say hello', usage: '/hello' },
    ];
  }

  async onCommand(command: string, args: string[], context: BotContext): Promise<BotResponse> {
    if (command === 'hello') {
      return {
        type: 'message',
        content: `Hello, ${context.user.displayName}!`,
      };
    }
    return { type: 'message', content: 'Unknown command' };
  }
}
```

### Example Bots Included

| Bot | Description | Commands |
|-----|-------------|----------|
| **Hello Bot** | Greeting & jokes | `/hello`, `/joke` |
| **Poll Bot** | Create polls | `/poll`, `/vote`, `/results` |
| **Reminder Bot** | Set reminders | `/remind`, `/reminders` |
| **Welcome Bot** | Welcome new members | `/setwelcome`, `/testwelcome` |

---

## Documentation

Full documentation is available in the [docs/](docs/) folder:

- [Getting Started](docs/Getting-Started.md)
- [Installation](docs/Installation.md)
- [Configuration](docs/Configuration.md)
- [Architecture](docs/Architecture.md)
- [Features](docs/Features/)
- [API Reference](docs/API/)
- [Components](docs/Components/)
- [Deployment](docs/Deployment/)
- [Plugins](docs/Plugins.md)

---

## nself-plugins (Future Extensibility)

Many features can be extracted as **nself-plugins** for modular deployment:

| Plugin | Description |
|--------|-------------|
| `@nself/plugin-voice` | Voice messages & calls |
| `@nself/plugin-video` | Video calls & meetings |
| `@nself/plugin-bots` | Bot SDK & marketplace |
| `@nself/plugin-idme` | ID.me identity verification |
| `@nself/plugin-polls` | Polls & voting |
| `@nself/plugin-stickers` | Sticker packs |
| `@nself/plugin-gifs` | GIF picker integration |
| `@nself/plugin-analytics` | Usage analytics |
| `@nself/plugin-audit` | Audit logging |
| `@nself/plugin-workflows` | Automation workflows |

See [docs/Plugins.md](docs/Plugins.md) for the full list and implementation guide.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- [Documentation](docs/)

---

Built with [nself](https://nself.org) | Powered by Next.js 15 & React 19
