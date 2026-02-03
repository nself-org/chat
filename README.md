# ɳChat

**Production-Ready Multi-Tenant Team Communication Platform**

Technical name: `nself-chat` | Package: `@nself/chat` | Short name: `nchat` | **Version**: `0.9.1`

[![CI](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/ci.yml)
[![CD](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml/badge.svg)](https://github.com/acamarata/nself-chat/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-0.9.1-brightgreen.svg)](https://github.com/acamarata/nself-chat/releases)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Tests-860%2B-success.svg)](https://github.com/acamarata/nself-chat)
[![Accessibility](https://img.shields.io/badge/A11y-WCAG%20AA-blue.svg)](https://www.w3.org/WAI/WCAG2AA-Conformance)
[![Multi-Tenant](https://img.shields.io/badge/Multi--Tenant-SaaS%20Ready-ff69b4.svg)](https://github.com/acamarata/nself-chat)

> **v0.9.1 Documentation Release**: Production-Ready Multi-Tenant SaaS Architecture with comprehensive plugin system, enhanced backend integration, polished documentation, and GitHub Wiki-ready structure. Powered by [ɳSelf CLI](https://github.com/acamarata/nself) for backend infrastructure.

---

Build your own **Slack**, **Discord**, or **Microsoft Teams** clone with **ɳChat** - a complete, production-ready, multi-tenant team communication platform. Launch as a **white-label SaaS** with **zero code required** via our comprehensive 12-step setup wizard.

**3 Commands. 5 Minutes. That's It.** Clone, install, run - the wizard handles everything else: backend setup, multi-tenancy, billing, branding, and deployment.

Powered by [ɳSelf](https://nself.org) for backend infrastructure (PostgreSQL, Hasura GraphQL, Auth, Storage).

---

## 🌟 What's New in v0.9.1

### 📚 **Documentation Excellence**

Complete GitHub Wiki-ready documentation with 333+ pages:

- **Comprehensive Guides**: Installation, configuration, deployment across all platforms
- **API Reference**: Complete GraphQL schema, REST endpoints, multi-language examples
- **Developer Docs**: Architecture, database schema, plugin development
- **User Guides**: Feature walkthroughs, troubleshooting, FAQs
- **Visual Content**: Architecture diagrams, screenshots, video tutorials (coming soon)

### 🔌 **Plugin System**

Extensible plugin architecture for custom functionality:

- **nself-plugins**: Modular plugin system with hot-reload support
- **Plugin Marketplace**: Discover and install community plugins
- **Developer SDK**: Build custom plugins with TypeScript support
- **Built-in Plugins**: Realtime, jobs, search, storage, analytics

### 🏢 **Multi-Tenant SaaS Architecture**

Transform your single deployment into a complete **SaaS platform**:

- **Schema-level tenant isolation** for maximum data security
- **Subdomain routing** (tenant1.nchat.app, tenant2.nchat.app)
- **Custom domain support** (chat.acme.com)
- **Row-Level Security** policies for data protection
- **Per-tenant resource limits** based on subscription plan

### 💰 **Stripe Billing Integration**

Complete subscription management out of the box:

- **4 subscription plans**: Free, Pro ($15/mo), Enterprise ($99/mo), Custom
- **Usage tracking** and limit enforcement
- **Automated billing** via Stripe webhooks
- **Customer portal** for self-service subscription management
- **Trial periods** (14 days) for new tenants

### 🤖 **AI-Powered Advanced Moderation**

Intelligent content moderation powered by TensorFlow.js:

- **Toxicity detection** with 7 categories (identity attack, insult, threat, etc.)
- **Profanity filtering** with 1,700+ word dictionary
- **Spam detection** using pattern recognition
- **Auto-moderation actions** (warn, mute, delete, ban)
- **Content quarantine** for manual review
- **Audit logging** for compliance

### 📊 **Analytics & Telemetry**

Comprehensive insights dashboard:

- **Real-time metrics**: Active users, messages/sec, API calls
- **User analytics**: Engagement, retention, activity heatmaps
- **Channel analytics**: Most active channels, message distribution
- **Performance monitoring**: Response times, error rates, uptime
- **Custom events** with OpenTelemetry integration
- **Data export** in CSV/JSON formats

### 🔗 **Advanced Integrations**

Connect to the tools your team already uses:

- **Slack**: Bi-directional message sync and user import
- **GitHub**: Issue linking, commit notifications, PR updates
- **Jira**: Issue tracking, status updates, smart linking
- **Google Drive**: File linking and real-time collaboration
- **Webhooks**: Incoming/outgoing with retry logic and rate limiting
- **Zapier/Make.com**: 1000+ app integrations via webhooks

### 🛡️ **Compliance & Data Retention**

Enterprise-grade compliance features:

- **Data retention policies**: Auto-delete after 30/90/365 days or never
- **Legal hold** for litigation and investigations
- **GDPR compliance**: Right to erasure, data portability, consent management
- **Export capabilities**: JSON, CSV, or full archive with attachments
- **Audit logs**: Immutable trail of all data operations
- **Encryption at rest** for archived data

### ⚡ **Performance Optimizations**

Built to scale to 10,000+ concurrent users:

- **Connection pooling**: 100 connections per tenant
- **Redis caching**: Tenant metadata, user sessions, rate limits
- **Database indexes**: Optimized queries (<50ms response times)
- **Virtual scrolling**: Render 100k+ messages efficiently
- **Image optimization**: Next.js Image with lazy loading
- **Code splitting**: Route-based and component-based
- **Service Workers**: Offline support and background sync
- **WebSocket scaling**: Horizontal scaling with Redis adapter

---

## Project Status

| Category          | Status           | Details                                                      |
| ----------------- | ---------------- | ------------------------------------------------------------ |
| **Version**       | v0.9.1           | Production-Ready with Plugin System & Polished Docs          |
| **CI/CD**         | ✅ All Passing   | All CI checks green, Docker build working                    |
| **Code Quality**  | ✅ Excellent     | 860+ tests, TypeScript strict mode, 10% type error reduction |
| **Production**    | ✅ Ready         | Multi-platform support (web, iOS, Android, desktop)          |
| **Documentation** | ✅ Comprehensive | 333+ documentation pages, GitHub Wiki-ready                  |
| **Security**      | ✅ Enterprise    | E2EE with Signal Protocol, encrypted storage, SOC 2 ready    |
| **Performance**   | ✅ Optimized     | 10,000+ concurrent users, <50ms response times               |
| **Multi-Tenancy** | ✅ Production    | Schema isolation, Stripe billing, per-tenant limits          |

---

## Why ɳChat?

### Lightning Fast Setup

- **Under 5 minutes** from zero to running multi-tenant SaaS
- 3 commands to start development
- 8 test users ready to explore immediately
- Auto-login in development mode for rapid iteration

### Complete Feature Set

- **150+ Features**: Messaging, channels, threads, reactions, file uploads, and more
- **Multi-Tenant SaaS**: Schema isolation, subdomain routing, custom domains
- **Stripe Billing**: Complete subscription management with webhooks
- **End-to-End Encryption**: Signal Protocol implementation for private messaging
- **Voice & Video Calling**: WebRTC calls with up to 50 participants, screen sharing with annotations
- **Live Streaming**: HLS and WebRTC streaming capabilities for broadcasts
- **AI Moderation**: TensorFlow.js-powered toxicity detection and spam filtering
- **Analytics**: Real-time metrics, user engagement, performance monitoring
- **11 Auth Providers**: Email, magic links, Google, GitHub, Apple, ID.me, and more
- **Bot SDK**: Build custom bots with slash commands, events, and rich responses
- **Real-time**: WebSocket-powered typing indicators, read receipts, and presence
- **Advanced Messaging**: Scheduled messages, forwarding, translations, polls, reactions
- **Full-Text Search**: MeiliSearch-powered fast and accurate search
- **Integrations**: Slack, GitHub, Jira, Google Drive, webhooks, Zapier
- **Compliance**: GDPR-compliant with data retention policies and legal hold
- **Mobile-Optimized**: CallKit (iOS), Telecom Manager (Android), Picture-in-Picture support
- **Social Media**: Connect Twitter, Instagram, and LinkedIn accounts
- **Monitoring**: Sentry error tracking and performance monitoring

### White-Label Everything

- **12-Step Setup Wizard**: Complete guided experience with environment detection
- **27 Theme Presets**: From Slack-like to Discord-style and beyond
- **Full Branding Control**: Logo, colors, fonts, and custom CSS
- **Landing Page Templates**: 5 homepage styles to choose from
- **Env-Var Configuration**: Pre-configure and skip wizard steps entirely
- **Multi-Tenant Branding**: Each tenant can customize their own branding

### Multi-Platform Support

- **Web**: Next.js 15 with React 19
- **Desktop**: Tauri (lightweight native) and Electron (cross-platform)
- **Mobile**: Capacitor (iOS/Android) and React Native
- **Deployment**: Docker, Kubernetes, Helm, Vercel, Netlify

### Production-Ready SaaS

- **Multi-Tenant Architecture**: Schema-level isolation for maximum security
- **Stripe Integration**: Complete billing and subscription management
- **Resource Limits**: Per-tenant limits based on subscription plan
- **Usage Tracking**: Monitor and enforce resource consumption
- **Custom Domains**: Allow tenants to use their own domains
- **Trial Periods**: 14-day trials for new sign-ups
- **Automated Provisioning**: New tenants ready in seconds

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

1. **Welcome** - Introduction to ɳChat
2. **Environment Detection** - Automatically detects what's already configured
3. **Backend Setup** - One-click nself CLI installation and service startup
4. **Owner Info** - Your name, email, company details
5. **Branding** - App name, logo, tagline, favicon
6. **Theme** - Colors, dark/light mode, preset themes
7. **Landing Page** - Homepage style and sections
8. **Auth Methods** - Choose authentication providers
9. **Permissions** - Access control and verification
10. **Features** - Toggle available features and integrations
11. **Deployment** - Choose deployment targets and get commands
12. **Review & Launch** - Preview and confirm all settings

**Time to complete: 5-10 minutes** (faster if you skip optional steps or pre-configure via `.env.local`)

Development mode includes 8 test users so you can immediately experience all features.

### Development Test Users

| Email               | Role      | Password    | Purpose                      |
| ------------------- | --------- | ----------- | ---------------------------- |
| owner@nself.org     | Owner     | password123 | Full permissions, first user |
| admin@nself.org     | Admin     | password123 | User/channel management      |
| moderator@nself.org | Moderator | password123 | Content moderation           |
| member@nself.org    | Member    | password123 | Standard user experience     |
| guest@nself.org     | Guest     | password123 | Limited read-only access     |
| alice@nself.org     | Member    | password123 | Additional test user         |
| bob@nself.org       | Member    | password123 | Additional test user         |
| charlie@nself.org   | Member    | password123 | Additional test user         |

_Dev mode auto-logs in as `owner@nself.org` for faster iteration._

---

## Features at a Glance

### 150+ Features Across 20 Categories

| Category                    | Count | Features                                                                                                                                                                                                                                                                                           |
| --------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-Tenancy**           | 12    | Schema isolation, subdomain routing, custom domains, per-tenant limits, usage tracking, billing integration, trial periods, tenant dashboard, automated provisioning, resource quotas, tenant branding, tenant analytics                                                                           |
| **Billing & Subscriptions** | 8     | Stripe integration, 4 subscription plans, usage-based billing, webhook processing, customer portal, trial management, invoice generation, payment methods                                                                                                                                          |
| **Messaging**               | 17    | Channels, DMs, threads, reactions, pins, bookmarks, voice messages, scheduled messages, code blocks, markdown, link previews, mentions, quotes, forward, translations, polls, reminders                                                                                                            |
| **AI & Moderation**         | 9     | AI-powered toxicity detection, profanity filtering, spam detection, auto-moderation, content quarantine, manual review queue, audit logs, custom word lists, pattern recognition                                                                                                                   |
| **Analytics & Telemetry**   | 12    | Real-time metrics, user analytics, channel analytics, engagement tracking, retention analysis, activity heatmaps, performance monitoring, custom events, data export, OpenTelemetry integration, dashboards, reports                                                                               |
| **Integrations**            | 11    | Slack sync, GitHub issues, Jira tracking, Google Drive, webhooks (incoming/outgoing), Zapier, Make.com, API keys, OAuth apps, webhook retry logic, rate limiting                                                                                                                                   |
| **Compliance & Legal**      | 8     | Data retention policies, legal hold, GDPR compliance, right to erasure, data portability, consent management, audit trails, encrypted archives                                                                                                                                                     |
| **Channels**                | 9     | Public, private, direct messages, group DMs, categories, topics, archive, favorites, mute                                                                                                                                                                                                          |
| **Files & Media**           | 8     | Upload, images, documents, audio, video, preview, drag & drop, clipboard paste                                                                                                                                                                                                                     |
| **Security & Encryption**   | 7     | End-to-end encryption (Signal Protocol), encrypted file storage, encrypted backups, key management, perfect forward secrecy, secure verification, encrypted notifications                                                                                                                          |
| **Voice & Video Calls**     | 12    | WebRTC calling (1-on-1 and group up to 50), screen sharing with annotations, call recording, noise cancellation, virtual backgrounds, CallKit integration (iOS), Telecom Manager (Android), Picture-in-Picture mode, call quality indicators, bandwidth optimization, call transfers, call waiting |
| **Live Streaming**          | 6     | HLS streaming, WebRTC streaming, stream recording, stream chat, viewer analytics, multi-quality adaptive streaming                                                                                                                                                                                 |
| **Users & Presence**        | 7     | Online/away status, custom status, profiles, roles, blocking, avatars, display names                                                                                                                                                                                                               |
| **Real-time**               | 5     | Typing indicators, read receipts, presence updates, live messages, live notifications                                                                                                                                                                                                              |
| **Search**                  | 7     | Messages, files, users, global search, filters, highlighting, MeiliSearch full-text search                                                                                                                                                                                                         |
| **Notifications**           | 6     | Desktop, sound, email, mobile push, do not disturb, quiet hours                                                                                                                                                                                                                                    |
| **Emoji & Reactions**       | 4     | Emoji picker, custom emoji, GIF picker, stickers                                                                                                                                                                                                                                                   |
| **Polls & Voting**          | 4     | Create polls, anonymous voting, timed polls, poll results                                                                                                                                                                                                                                          |
| **Bots & Automation**       | 8     | Bot SDK, slash commands, webhooks, custom bots, bot marketplace, event handlers, bot authentication, bot permissions                                                                                                                                                                               |
| **Admin**                   | 6     | Dashboard, user management, analytics, audit logs, bulk operations, data export                                                                                                                                                                                                                    |

**Total: 150+ features** across 20 categories, making ɳChat one of the most feature-complete open-source communication platforms available.

---

## Documentation

**Full documentation is organized as a GitHub Wiki-compatible structure** in the [docs/](docs/) folder.

**📖 [Read the Documentation](docs/Home.md)** - Start here for comprehensive guides and references.

### Quick Links

| Category            | Key Docs                                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Getting Started** | [Quick Start](docs/getting-started/Getting-Started.md) · [Installation](docs/getting-started/Installation.md)                                                                        |
| **Features**        | [Features Overview](docs/features/Features.md) · [Messaging](docs/features/Features-Messaging.md) · [White-Label Guide](docs/features/White-Label-Guide.md)                          |
| **Multi-Tenancy**   | [Multi-Tenant Deployment](docs/deployment/Multi-Tenant-Deployment.md) · [Multi-Tenant README](docs/deployment/Multi-Tenant-README.md)                                                |
| **Configuration**   | [Configuration](docs/configuration/Configuration.md) · [Authentication](docs/configuration/Authentication.md) · [Environment Variables](docs/configuration/Environment-Variables.md) |
| **API**             | [API Overview](docs/api/API.md) · [API Documentation](docs/api/API-DOCUMENTATION.md)                                                                                                 |
| **Deployment**      | [Deployment Guide](docs/deployment/DEPLOYMENT.md) · [Docker](docs/deployment/Deployment-Docker.md) · [Kubernetes](docs/deployment/Deployment-Kubernetes.md)                          |
| **Guides**          | [User Guide](docs/guides/USER-GUIDE.md) · [Sentry Setup](docs/guides/README-SENTRY.md) · [Testing](docs/guides/testing-guide.md)                                                     |
| **Reference**       | [Architecture](docs/reference/Architecture.md) · [Database Schema](docs/reference/Database-Schema.md) · [Project Structure](docs/reference/Project-Structure.md)                     |
| **About**           | [Changelog](docs/about/Changelog.md) · [Contributing](docs/about/Contributing.md) · [Roadmap](docs/about/Roadmap.md)                                                                 |

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [docs/about/Contributing.md](docs/about/Contributing.md) for detailed guidelines.

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

- **GitHub Issues**: [Bug reports & feature requests](https://github.com/acamarata/nself-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/acamarata/nself-chat/discussions)
- **Documentation**: [Full documentation](docs/)
- **ɳSelf**: [Backend infrastructure](https://nself.org)
- **Discord**: [Join our community](https://discord.gg/nself) (coming soon)

---

## Acknowledgments

Built with love using:

- [Next.js](https://nextjs.org/) - The React Framework
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Apollo Client](https://www.apollographql.com/) - State management library for JavaScript
- [Socket.io](https://socket.io/) - Real-time bidirectional event-based communication
- [TipTap](https://tiptap.dev/) - Headless, extensible rich text editor
- [Sentry](https://sentry.io/) - Error tracking and performance monitoring
- [Stripe](https://stripe.com/) - Payment processing
- [TensorFlow.js](https://www.tensorflow.org/js) - Machine learning for JavaScript
- [ɳSelf](https://nself.org) - Backend infrastructure

---

Built with [ɳSelf](https://nself.org) | Powered by Next.js 15 & React 19 | Version 0.9.1

**Star us on GitHub** ⭐ if you find ɳChat useful!
