# nself-chat Documentation

**Version**: 0.3.0 (January 30, 2026)
**Status**: Production-Ready
**License**: MIT

<div align="center">

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](about/Changelog)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop%20%7C%20Mobile-lightgrey.svg)]()
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)]()

**White-Label Team Communication Platform**

[Quick Start](#quick-start) • [Installation](#installation) • [Features](#features) • [Deployment](#deployment) • [API](#api) • [Contributing](about/Contributing)

</div>

---

## Table of Contents

### Getting Started
- [Quick Start Guide](QUICK-START) - Get running in 5 minutes
- [Installation Guide](INSTALLATION) - Detailed installation instructions
- [Configuration Guide](configuration/Configuration) - Complete configuration reference
- [First Steps](getting-started/Getting-Started) - After installation

### Core Documentation
- [Architecture](reference/Architecture) - System design and architecture
- [Architecture Diagrams](ARCHITECTURE-DIAGRAMS) - Visual system documentation
- [Features Overview](features/Features) - All features at a glance
- [API Reference](api/API-DOCUMENTATION) - Complete API documentation
- [API Code Examples](api/API-EXAMPLES) - Multi-language examples
- [Database Schema](reference/Database-Schema) - Database structure

### Feature Documentation (v0.3.0)

#### Advanced Messaging
- [Advanced Messaging Features](advanced-messaging-implementation-summary) - Edit, delete, forward, pin, star
- [Quick Reference](advanced-messaging-quick-reference) - Common operations

#### GIFs & Stickers
- [GIF & Sticker Implementation](GIF-Sticker-Implementation) - Tenor integration & custom stickers

#### Polls & Interactive Messages
- [Polls Implementation](Polls-Implementation) - Create and manage polls
- [Polls Quick Start](Polls-Quick-Start) - Get started with polls

#### Security Features
- [Two-Factor Authentication (2FA)](2FA-Implementation-Summary) - TOTP 2FA setup
- [2FA Quick Reference](2FA-Quick-Reference) - Common 2FA operations
- [PIN Lock System](PIN-LOCK-SYSTEM) - PIN lock and biometric auth
- [PIN Lock Implementation](PIN-LOCK-IMPLEMENTATION-SUMMARY) - Technical details
- [PIN Lock Quick Start](PIN-LOCK-QUICK-START) - Setup guide

#### Search & Discovery
- [Enhanced Search](Search-Implementation) - MeiliSearch integration
- [Search Quick Start](Search-Quick-Start) - Search operators and filters

#### Integrations
- [Social Media Integration](Social-Media-Integration) - Twitter, Instagram, LinkedIn
- [Social Media Quick Reference](Social-Media-Quick-Reference) - Common operations

### Configuration & Setup
- [Configuration Reference](configuration/Configuration) - All configuration options
- [Authentication Setup](configuration/Authentication) - Configure auth providers
- [Environment Variables](configuration/Environment-Variables) - All environment variables
- [White-Label Customization](features/White-Label-Guide) - Branding and theming

### Deployment
- [Deployment Overview](deployment/DEPLOYMENT) - Production deployment guide
- [Docker Deployment](deployment/Deployment-Docker) - Deploy with Docker
- [Kubernetes Deployment](deployment/Deployment-Kubernetes) - Deploy to K8s
- [Helm Charts](deployment/Deployment-Helm) - Helm deployment
- [Production Checklist](deployment/Production-Deployment-Checklist) - Pre-deployment checklist
- [Production Validation](deployment/Production-Validation) - Post-deployment validation

### Development
- [Contributing Guide](../CONTRIBUTING) - How to contribute
- [Testing Guide](guides/testing-guide) - Testing strategies
- [Project Structure](reference/Project-Structure) - Codebase organization
- [Utilities & Hooks](guides/README) - Development utilities guide

### Troubleshooting & Support
- [Troubleshooting Guide](troubleshooting/TROUBLESHOOTING) - Common issues and solutions
- [FAQ](troubleshooting/FAQ) - Frequently asked questions
- [Runbook](troubleshooting/RUNBOOK) - Operations guide

### Reference
- [API Documentation](api/API-DOCUMENTATION) - GraphQL API reference
- [TypeScript Types](reference/Types) - Type definitions
- [SPORT Reference](reference/SPORT) - Complete reference documentation
- [Bots](features/Bots) - Bot development guide
- [Plugins](features/Plugins) - Plugin system

### About
- [Changelog](about/Changelog) - Version history
- [Roadmap](about/Roadmap) - Future plans
- [Upgrade Guide](about/UPGRADE-GUIDE) - Upgrading between versions
- [Security Overview](security/SECURITY) - Security features
- [Security Audit](security/SECURITY-AUDIT) - Security audit results
- [Performance Optimization](security/PERFORMANCE-OPTIMIZATION) - Performance guide
- [Documentation Audit](DOCUMENTATION-AUDIT) - Documentation quality assessment

---

## Quick Start

Get nself-chat running in under 5 minutes:

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

**Next Steps:**
1. Complete the [9-step setup wizard](http://localhost:3000/setup)
2. Explore the [feature documentation](#feature-documentation-v030)
3. Check out the [configuration guide](CONFIGURATION)

**[Full Quick Start Guide →](QUICK-START)**

---

## What's New in v0.3.0

🎉 **Major Feature Release** - 8 new feature sets, 85+ individual features

### Highlights

#### 1. Advanced Messaging Features ✅
- Edit messages with edit history
- Delete messages (soft delete)
- Forward messages to multiple channels
- Pin important messages
- Star/save messages for later
- Message read receipts
- Real-time typing indicators

**[Learn More →](advanced-messaging-implementation-summary)**

#### 2. GIFs and Stickers 🎨
- GIF search integration (Tenor API)
- GIF picker in message composer
- Sticker packs management
- Custom sticker upload (admin/owner)
- 2 default sticker packs included

**[Learn More →](GIF-Sticker-Implementation)**

#### 3. Polls and Interactive Messages 📊
- Create polls with multiple options
- Single-choice and multiple-choice
- Anonymous voting option
- Poll expiration/deadline
- Live poll results

**[Learn More →](Polls-Implementation)**

#### 4. Two-Factor Authentication (2FA) 🔒
- TOTP 2FA setup with QR code
- Support for authenticator apps
- 10 backup codes per user
- 2FA enforcement option
- Remember device (30 days)
- Recovery process

**[Learn More →](2FA-Implementation-Summary)**

#### 5. PIN Lock & Session Security 🔐
- PIN lock setup (4-6 digits)
- Lock on app close/background
- Auto-lock after timeout
- Biometric unlock (WebAuthn)
- Emergency unlock with password
- Failed attempt lockout

**[Learn More →](PIN-LOCK-SYSTEM)**

#### 6. Enhanced Search 🔍
- Search messages, files, users, channels
- Advanced filters (date, channel, user, type)
- Search within threads
- Search operators (from:, in:, has:, before:, after:)
- Search history and saved searches
- Keyboard shortcuts (Cmd+K)

**[Learn More →](Search-Implementation)**

#### 7. Bot API Foundation 🤖
- Bot user type
- Bot token generation
- Bot API endpoints (5 endpoints)
- Webhook delivery
- Bot permissions system (16 permissions)
- Bot management UI

**[Learn More →](features/Bots)**

#### 8. Social Media Integration 🌐
- Link social accounts (Twitter, Instagram, LinkedIn)
- Monitor accounts for new posts
- Auto-post to announcement channels
- Rich embeds for social posts
- Enable/disable per account
- Post filtering (hashtags, keywords)

**[Learn More →](Social-Media-Integration)**

### Stats
- **Feature Parity**: Increased from 18% to ~40% (+122%)
- **Files Created**: 120+
- **Lines of Code**: ~15,000
- **Database Tables**: 28 new tables
- **API Endpoints**: 25+
- **Dependencies Added**: 4 (meilisearch, otplib, qrcode, speakeasy)

**[Full Changelog →](about/Changelog)**

---

## Feature Parity Matrix

### Comparison with Major Chat Platforms

| Feature Category | nself-chat v0.3.0 | Slack | Discord | Telegram | WhatsApp | Signal |
|-----------------|-------------------|-------|---------|----------|----------|--------|
| **Messaging** | | | | | | |
| Basic messaging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit messages | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete messages | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forward messages | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Pin messages | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reactions | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Threads | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Media** | | | | | | |
| GIFs | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Stickers | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| File sharing | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Interactive** | | | | | | |
| Polls | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Security** | | | | | | |
| 2FA | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| PIN Lock | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Biometric auth | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| E2E encryption | ⏳ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Search** | | | | | | |
| Advanced search | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Search operators | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Automation** | | | | | | |
| Bots/webhooks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Slash commands | ⏳ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Integrations** | | | | | | |
| Social media | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Third-party apps | ⏳ | ✅ | ✅ | ✅ | ❌ | ❌ |

**Legend:**
- ✅ Fully implemented
- ⏳ Planned for future release
- ❌ Not available

**Unique Advantages:**
- Social media integration (auto-posting from Twitter, Instagram, LinkedIn)
- Complete white-label customization
- Self-hosted option with full data ownership
- Open source with MIT license

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     nself-chat Platform (v0.3.0)                 │
├─────────────────────────────────────────────────────────────────┤
│   Frontend (Next.js 15 + React 19)                              │
│   • 9-step setup wizard                                          │
│   • 25+ theme presets (light/dark)                              │
│   • Real-time messaging UI                                       │
│   • Advanced search (MeiliSearch)                                │
│   • Bot management dashboard                                     │
│   • Social media integration UI                                  │
├─────────────────────────────────────────────────────────────────┤
│   State Management                                               │
│   • Zustand (client state)                                       │
│   • Apollo Client (GraphQL + subscriptions)                      │
│   • LocalStorage + Database sync                                 │
├─────────────────────────────────────────────────────────────────┤
│   Backend (nself CLI v0.4.2)                                     │
│   • PostgreSQL (database)                                        │
│   • Hasura GraphQL Engine                                        │
│   • Nhost Auth (production) / FauxAuth (dev)                    │
│   • MinIO (file storage)                                         │
│   • MeiliSearch (search engine)                                  │
│   • Redis (jobs & caching)                                       │
├─────────────────────────────────────────────────────────────────┤
│   Multi-Platform Support                                         │
│   • Web (Next.js)                                                │
│   • Desktop (Tauri, Electron)                                    │
│   • Mobile (Capacitor, React Native)                             │
│   • PWA (installable)                                            │
└─────────────────────────────────────────────────────────────────┘
```

**[Detailed Architecture →](reference/Architecture)**

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.10, React 19.0.0, TypeScript 5.7.3
- **UI**: Tailwind CSS 3.4.17, Radix UI, Framer Motion 11.18.0
- **State**: Zustand 5.0.3, Apollo Client 3.12.8
- **Forms**: React Hook Form 7.54.2, Zod 3.24.1
- **Editor**: TipTap 2.11.2 (rich text)
- **Real-time**: Socket.io 4.8.1, GraphQL subscriptions

### Backend (via nself CLI)
- **Database**: PostgreSQL with 60+ extensions
- **GraphQL**: Hasura GraphQL Engine
- **Auth**: Nhost Authentication
- **Storage**: MinIO (S3-compatible)
- **Search**: MeiliSearch 0.44.0
- **Cache**: Redis

### Development
- **Testing**: Jest 29.7.0, Playwright 1.50.1
- **Linting**: ESLint 9.18.0, Prettier 3.4.2
- **CI/CD**: 19 GitHub Actions workflows
- **Monitoring**: Sentry 8.47.0

**[Complete Tech Stack →](reference/Architecture#tech-stack)**

---

## Key Features

### 🎨 White-Label Everything
- Complete branding customization (name, logo, colors)
- 25+ theme presets with light/dark modes
- Custom CSS injection support
- Landing page templates (5 options)
- Feature toggles for selective functionality

### 🔐 Dual Authentication
- **Development Mode**: 8 test users for fast iteration
- **Production Mode**: Nhost Auth with 11 provider options
  - Email/password
  - Magic links
  - Google, Facebook, Twitter, GitHub, Discord, Slack
  - ID.me (military, police, first responders, government)

### 💬 Advanced Messaging
- Edit/delete messages with history
- Forward to multiple channels
- Pin important messages
- Star/bookmark messages
- Read receipts & typing indicators
- Threaded conversations
- Rich text editing (markdown, code blocks)

### 🔍 Powerful Search
- MeiliSearch integration (sub-50ms queries)
- Search operators: `from:`, `in:`, `has:`, `before:`, `after:`, `is:`
- Filter by date, channel, user, file type
- Search within threads
- Saved searches and history
- Keyboard shortcuts (Cmd+K)

### 🔒 Enterprise Security
- Two-factor authentication (TOTP)
- PIN lock with biometric support
- Session management with device tracking
- Row-level security (RLS) on all tables
- Audit logging for admin actions
- Content moderation and filtering

### 🤖 Bot Ecosystem
- Complete bot API (5 REST endpoints)
- Webhook integrations (incoming/outgoing)
- 16 granular permissions across 6 categories
- HMAC-SHA256 webhook signing
- Rate limiting (100 req/min per bot)
- Interactive API documentation

### 🌐 Social Integration (Unique!)
- Auto-post from Twitter, Instagram, LinkedIn
- Rich embeds with platform branding
- Post filtering (hashtags, keywords, engagement)
- OAuth 2.0 authentication
- AES-256-GCM token encryption
- Automated polling every 5 minutes

### 📊 Polls & Interactive Content
- Single-choice and multiple-choice polls
- Anonymous voting option
- Poll expiration/deadline
- Live results with real-time updates
- "Add option" for non-anonymous polls
- Winning option highlighting

### 🎨 GIFs & Stickers
- Tenor API integration with autocomplete search
- 2 default sticker packs (Reactions, Emoji)
- Custom sticker upload (admin/owner only)
- Feature flags for enabling/disabling
- Message type support for GIF/sticker

---

## Project Stats

| Metric | Value |
|--------|-------|
| **Version** | 0.3.0 |
| **Release Date** | January 30, 2026 |
| **Total Features** | 85+ (v0.3.0) |
| **Feature Parity** | ~40% (vs major platforms) |
| **Components** | 75+ directories |
| **Custom Hooks** | 60+ hooks |
| **Database Tables** | 28 new tables (v0.3.0) |
| **API Endpoints** | 25+ endpoints |
| **Theme Presets** | 25+ themes |
| **Auth Providers** | 11 providers |
| **CI Workflows** | 19 workflows |
| **Test Coverage** | 860+ tests (planned) |
| **Documentation Pages** | 58+ pages |
| **Lines of Code** | ~15,000 (v0.3.0) |

---

## Documentation Organization

### By Audience

#### For End Users
- [Quick Start](QUICK-START)
- [User Guide](guides/USER-GUIDE)
- [Settings Guide](guides/Settings-Quick-Start)
- [FAQ](troubleshooting/FAQ)

#### For Administrators
- [Installation](INSTALLATION)
- [Configuration](CONFIGURATION)
- [Deployment Guide](deployment/DEPLOYMENT)
- [Production Checklist](deployment/Production-Deployment-Checklist)
- [Runbook](troubleshooting/RUNBOOK)
- [Security Overview](security/SECURITY)

#### For Developers
- [Architecture](reference/Architecture)
- [API Reference](API-REFERENCE)
- [Contributing Guide](about/Contributing)
- [Code Standards](../.ai/CODE-STANDARDS)
- [Testing Guide](guides/testing-guide)
- [Bot Development](features/Bots)
- [Plugin Development](features/Plugins)

#### For DevOps
- [Docker Deployment](deployment/Deployment-Docker)
- [Kubernetes Deployment](deployment/Deployment-Kubernetes)
- [Helm Charts](deployment/Deployment-Helm)
- [Production Validation](deployment/Production-Validation)
- [Runbook](troubleshooting/RUNBOOK)

---

## Support & Community

### Getting Help
- **Documentation**: You're reading it!
- **Issues**: [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/acamarata/nself-chat/discussions)
- **Email**: support@nself.org

### Contributing
We welcome contributions! See our [Contributing Guide](about/Contributing) for:
- Code of conduct
- Development setup
- Pull request process
- Code standards
- Testing requirements

### Roadmap
- **v0.3.1** (1 week): Bug fixes and polish
- **v0.4.0** (2 months): E2E encryption, voice/video calls
- **v0.5.0** (2 months): Web3 integration
- **v0.6.0** (2 months): Mobile polish

**[Full Roadmap →](about/Roadmap)**

---

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [nself CLI](https://github.com/acamarata/nself) - Backend infrastructure
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [MeiliSearch](https://www.meilisearch.com/) - Search engine
- [Hasura](https://hasura.io/) - GraphQL engine

---

<div align="center">

**Version 0.3.0** • **January 2026** • **[GitHub](https://github.com/acamarata/nself-chat)**

*nself-chat - White-label team communication platform*

</div>
