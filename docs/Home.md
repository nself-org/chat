# nself-chat

<div align="center">

**White-Label Team Communication Platform**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](about/VERSION)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop%20%7C%20Mobile-lightgrey.svg)]()
[![Status](https://img.shields.io/badge/status-stable-brightgreen.svg)]()

*Build your own Slack in minutes.*

**[Quick Start](getting-started/Getting-Started)** | **[Installation](getting-started/Installation)** | **[Demo](https://demo.nself-chat.org)** | **[GitHub](https://github.com/acamarata/nself-chat)**

</div>

---

## 5-Minute Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/acamarata/nself-chat.git
cd nself-chat

# 2. Install dependencies
pnpm install

# 3. Start development mode (with test users)
pnpm dev

# 4. Open in browser
open http://localhost:3000
```

**Done!** You now have:
- Complete team chat application
- 8 test users for development
- Setup wizard for customization
- 25+ theme presets

**[View Full Quick Start Guide](getting-started/Getting-Started)**

---

## Quick Navigation

| I want to... | Go to... |
|-------------|----------|
| Get started in 5 minutes | **[Quick Start](getting-started/Getting-Started)** |
| Install and configure | **[Installation](getting-started/Installation)** |
| Understand the architecture | **[Architecture](reference/Architecture)** |
| Configure branding | **[White-Label Guide](features/White-Label-Guide)** |
| Set up authentication | **[Authentication](configuration/Authentication)** |
| Deploy to production | **[Deployment](deployment/DEPLOYMENT)** |
| Fix a problem | **[Troubleshooting](troubleshooting/FAQ)** |
| See what's new | **[Changelog](about/Changelog)** |

---

## What is nself-chat?

nself-chat is a **production-ready, white-label** team communication platform that combines the best features of Slack, Discord, and Telegram. It's built with Next.js 15 and powered by the nself CLI backend infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│                     nself-chat Platform                          │
├─────────────────────────────────────────────────────────────────┤
│   Frontend (Next.js 15 + React 19)                              │
│   ↓ GraphQL subscriptions and queries                           │
├─────────────────────────────────────────────────────────────────┤
│                      nself Backend                               │
│   PostgreSQL · Hasura GraphQL · Auth · Storage                  │
├─────────────────────────────────────────────────────────────────┤
│   Multi-Platform Support                                         │
│   Web · Desktop (Tauri/Electron) · Mobile (Capacitor/RN)       │
└─────────────────────────────────────────────────────────────────┘
```

**[Learn More](reference/Architecture)**

---

## Key Features

### Complete Setup Wizard
9-step guided configuration for branding, themes, auth, and features.

```bash
# First-time setup
http://localhost:3000/setup
```

**[Setup Wizard Guide](guides/USER-GUIDE#setup-wizard)**

---

### White-Label Everything
Fully customizable branding, themes, and feature toggles.

- **Branding**: Custom app name, logo, favicon, tagline
- **Themes**: 25+ presets with light/dark modes
- **Features**: Toggle channels, DMs, threads, reactions
- **Auth**: Email/password, magic links, social providers

**[White-Label Guide](features/White-Label-Guide)**

---

### Dual Authentication
Development mode with test users + production mode with Nhost.

| Mode | Test Users | Purpose |
|------|-----------|---------|
| Development | 8 users | Fast iteration |
| Production | Nhost Auth | Real authentication |

**[Authentication Guide](configuration/Authentication)**

---

### Multi-Platform
One codebase, multiple platforms.

**Platforms:**
- **Web**: Next.js 15 (default)
- **Desktop**: Tauri (Rust) or Electron
- **Mobile**: Capacitor (iOS/Android) or React Native

**[Platform Documentation](../platforms/README.md)**

---

## Documentation Structure

### 📚 Getting Started
- **[Quick Start](getting-started/Getting-Started)** - Get running in 5 minutes
- **[Installation](getting-started/Installation)** - Detailed installation

### ✨ Features
- **[Features Overview](features/Features)** - All features
- **[Messaging](features/Features-Messaging)** - Chat features
- **[White-Label](features/White-Label-Guide)** - Customization
- **[Bots](features/Bots)** - Bot SDK
- **[Plugins](features/Plugins)** - Plugin system

### ⚙️ Configuration
- **[Configuration Guide](configuration/Configuration)** - Complete overview
- **[Authentication](configuration/Authentication)** - Auth setup
- **[Environment Variables](configuration/Environment-Variables)** - All variables

### 📡 API
- **[API Overview](api/API)** - GraphQL API
- **[API Documentation](api/API-DOCUMENTATION)** - Complete reference

### 🚀 Deployment
- **[Deployment Guide](deployment/DEPLOYMENT)** - Production deployment
- **[Docker](deployment/Deployment-Docker)** - Docker deployment
- **[Kubernetes](deployment/Deployment-Kubernetes)** - K8s deployment

### 📖 Guides
- **[User Guide](guides/USER-GUIDE)** - End-user guide
- **[Sentry Setup](guides/README)** - Error tracking
- **[Testing Guide](guides/testing-guide)** - Testing

### 📚 Reference
- **[Architecture](reference/Architecture)** - System design
- **[Database Schema](reference/Database-Schema)** - Database structure
- **[Project Structure](reference/Project-Structure)** - File organization
- **[TypeScript Types](reference/Types)** - Type definitions
- **[SPORT](reference/SPORT)** - Complete reference

### 🔧 Troubleshooting
- **[FAQ](troubleshooting/FAQ)** - Frequently asked questions
- **[Runbook](troubleshooting/RUNBOOK)** - Operations guide

### ℹ️ About
- **[Changelog](about/Changelog)** - Version history
- **[Contributing](about/Contributing)** - How to contribute
- **[Roadmap](about/Roadmap)** - Future plans
- **[Upgrade Guide](about/UPGRADE-GUIDE)** - Version upgrades

### 🔐 Security
- **[Security Overview](security/SECURITY)** - Security features
- **[Security Audit](security/SECURITY-AUDIT)** - Audit results
- **[Performance](security/PERFORMANCE-OPTIMIZATION)** - Optimization

---

## What's New in v1.0.0

### Production-Ready Release

The v1.0.0 release brings:

- ✅ **Complete Setup Wizard** - 9-step guided configuration
- ✅ **Dual Authentication** - Dev mode + production mode
- ✅ **Theme System** - 25+ presets with light/dark modes
- ✅ **Multi-Platform** - Web, desktop, mobile
- ✅ **Sentry Integration** - Error tracking and monitoring
- ✅ **Docker Deployment** - Production-ready containers
- ✅ **Kubernetes Support** - K8s manifests and Helm charts

**[View Changelog](about/Changelog)**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **State** | Zustand, Apollo Client |
| **Real-time** | Socket.io, GraphQL Subscriptions |
| **Backend** | nself CLI (Hasura, PostgreSQL, Nhost) |
| **Editor** | TipTap (rich text) |
| **Forms** | React Hook Form, Zod |
| **Testing** | Jest, Playwright |
| **Monitoring** | Sentry |

---

## Development Mode

### Test Users

When `NEXT_PUBLIC_USE_DEV_AUTH=true`:

| Email | Role | Purpose |
|-------|------|---------|
| owner@nself.org | owner | Full permissions |
| admin@nself.org | admin | User/channel management |
| moderator@nself.org | moderator | Content moderation |
| member@nself.org | member | Standard user |
| guest@nself.org | guest | Limited read-only |

**Password for all**: `password123`

**[Development Guide](configuration/Configuration#development-mode)**

---

## Minimal Path to Production

```bash
# 1. Local development (2 commands)
pnpm install && pnpm dev

# 2. Complete setup wizard
http://localhost:3000/setup

# 3. Build for production
pnpm build

# 4. Deploy
docker compose up -d
# OR
kubectl apply -f deploy/k8s/
```

**[Complete Deployment Guide](deployment/DEPLOYMENT)**

---

## Project Stats

| Metric | Value |
|--------|-------|
| Components | 75+ directories |
| Custom Hooks | 60+ hooks |
| Feature Flags | 60+ toggles |
| Auth Methods | 11 providers |
| Theme Presets | 25+ themes |
| CI Workflows | 19 workflows |
| Platforms | 5 (Web, Desktop, Mobile) |

---

## Links

- **[GitHub Repository](https://github.com/acamarata/nself-chat)**
- **[Report Issues](https://github.com/acamarata/nself-chat/issues)**
- **[Demo Application](https://demo.nself-chat.org)**
- **[nself CLI](https://github.com/acamarata/nself)**

---

## Contributing

We welcome contributions! Whether it's bug reports, feature requests, documentation improvements, or code contributions.

- **[Contributing Guide](about/Contributing)** - How to contribute
- **[Code Standards](../.ai/CODE-STANDARDS.md)** - Coding conventions

---

<div align="center">

**Version 1.0.0** · **January 2026** · **[Full Documentation](README)**

*nself-chat - White-label team communication platform*

</div>
