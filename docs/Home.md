# 🚀 nself-chat Documentation

<div align="center">

![Version](https://img.shields.io/badge/version-0.9.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop%20%7C%20Mobile-lightgrey.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)

**White-Label Team Communication Platform**

_Build your own Slack in minutes with Next.js 15 + nself CLI_

[🎯 Quick Start](#-5-minute-quick-start) • [📚 Guides](#-documentation-sections) • [🚀 Deploy](#-deployment) • [💬 Community](https://github.com/acamarata/nself-chat/discussions)

</div>

---

## 👋 Welcome!

**nself-chat** is a production-ready, white-label team communication platform that combines the best features of Slack, Discord, and Telegram. Built with Next.js 15, powered by nself CLI backend infrastructure, and ready to deploy anywhere.

### ✨ What Makes It Special?

- 🎨 **Complete White-Label** - Brand it as your own in minutes
- 🔐 **Enterprise Security** - E2EE, 2FA, PIN lock, audit logging
- 📱 **Multi-Platform** - Web, Desktop (Tauri/Electron), Mobile (Capacitor/RN)
- ⚡ **Real-Time Everything** - Messages, typing indicators, presence
- 🔍 **Powerful Search** - Sub-50ms search with MeiliSearch
- 🤖 **Bot & Plugin System** - Extend with custom bots and plugins
- 🎯 **Zero Backend Setup** - nself CLI handles all infrastructure

---

## 🚀 5-Minute Quick Start

Get up and running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/acamarata/nself-chat.git
cd nself-chat

# 2. Install dependencies
pnpm install

# 3. Start development mode (includes test users)
pnpm dev

# 4. Open in browser
open http://localhost:3000
```

**🎉 Done!** You now have:

- ✅ Complete team chat application running
- ✅ 8 test users ready to use (owner, admin, moderator, member, guest, alice, bob, charlie)
- ✅ 9-step setup wizard for customization
- ✅ 25+ theme presets with light/dark modes

**Password for all test users:** `password123`

➡️ **Next:** Complete the [Setup Wizard](guides/USER-GUIDE#setup-wizard) • Read [Getting Started](getting-started/Getting-Started) • Explore [Features](features/Features)

---

## 📚 Documentation Sections

### 🎯 Getting Started

Perfect for first-time users and quick setup.

- **[🚀 Quick Start](getting-started/QUICK-START)** - Get running in 5 minutes
- **[📦 Installation Guide](getting-started/Installation)** - Detailed installation instructions
- **[🎓 Getting Started Tutorial](getting-started/Getting-Started)** - Complete walkthrough

### ✨ Features

Discover what nself-chat can do.

- **[📋 Features Overview](features/Features)** - Complete feature list
- **[💬 Messaging Features](features/Features-Messaging)** - Chat, threads, reactions
- **[📞 Voice & Video Calling](features/VOICE-CALLING-COMPLETE)** - WebRTC calls
- **[📺 Live Streaming](features/Live-Streaming-Complete)** - Stream to channels
- **[🖥️ Screen Sharing](features/Screen-Sharing-Complete)** - Share your screen
- **[🔐 End-to-End Encryption](features/E2EE-Complete)** - Secure messaging
- **[📱 Mobile Calls](features/Mobile-Calls-Complete)** - Optimized for mobile
- **[🎨 GIFs & Stickers](features/GIF-Sticker-Implementation)** - Fun messaging
- **[📊 Polls](features/Polls-Implementation)** - Interactive polls
- **[🔍 Search](reference/Search-Quick-Start)** - Powerful search operators
- **[🤖 Bots](features/Bots)** - Bot development SDK
- **[🔌 Plugins](features/Plugins)** - Plugin system
- **[🎨 White-Label](features/White-Label-Guide)** - Complete customization

### 📖 Guides

Step-by-step implementation and usage guides.

#### For End Users

- **[👤 User Guide](guides/USER-GUIDE)** - Complete user documentation
- **[⚙️ Settings Quick Start](guides/Settings-Quick-Start)** - Configure your account

#### For Developers

- **[💬 Advanced Messaging](guides/advanced-messaging-implementation-summary)** - Edit, delete, forward, pin
- **[🔐 E2EE Implementation](guides/E2EE-Implementation)** - Add encryption
- **[🔍 Search Implementation](guides/Search-Implementation)** - MeiliSearch integration
- **[📞 Call Management](guides/Call-Management-Guide)** - Voice/video calls
- **[📺 Live Streaming Setup](guides/Live-Streaming-Implementation)** - Stream implementation
- **[🖥️ Screen Sharing Setup](guides/Screen-Sharing-Implementation)** - Screen share setup
- **[📱 Mobile Optimizations](guides/Mobile-Call-Optimizations)** - Mobile-specific tuning
- **[🧪 Testing Guide](guides/testing-guide)** - Testing strategies
- **[🌍 Internationalization](guides/internationalization)** - i18n setup

#### For Administrators

- **[🔒 Enterprise Features](guides/enterprise/README)** - SSO, RBAC, audit logging
- **[🔐 SSO Setup](guides/enterprise/SSO-Setup)** - Single sign-on
- **[👥 RBAC Guide](guides/enterprise/RBAC-Guide)** - Role-based access control
- **[📝 Audit Logging](guides/enterprise/Audit-Logging)** - Compliance and auditing

### ⚙️ Configuration

Configure nself-chat for your needs.

- **[📝 Configuration Guide](configuration/Configuration)** - Complete reference
- **[🔐 Authentication Setup](configuration/Authentication)** - 11 auth providers
- **[🔧 Environment Variables](configuration/Environment-Variables)** - All variables

### 📡 API Reference

GraphQL API documentation and examples.

- **[📝 API Overview](api/API)** - Getting started with the API
- **[📖 API Documentation](api/API-DOCUMENTATION)** - Complete reference
- **[💻 API Examples](api/API-EXAMPLES)** - Multi-language examples
- **[🤖 Bot API](api/BOT_API_IMPLEMENTATION)** - Bot development API
- **[🔐 Authentication API](api/authentication)** - Auth endpoints
- **[📊 GraphQL Schema](api/graphql-schema)** - Full schema reference

### 🚀 Deployment

Deploy nself-chat to production.

- **[📝 Deployment Overview](deployment/DEPLOYMENT)** - Production deployment guide
- **[🐳 Docker Deployment](deployment/Deployment-Docker)** - Deploy with Docker
- **[☸️ Kubernetes](deployment/Deployment-Kubernetes)** - Deploy to K8s
- **[⎈ Helm Charts](deployment/Deployment-Helm)** - Helm deployment
- **[✅ Production Checklist](deployment/Production-Deployment-Checklist)** - Pre-deploy checklist
- **[🔍 Production Validation](deployment/Production-Validation)** - Post-deploy validation
- **[🌐 Multi-Tenant](Multi-Tenant-Deployment)** - Multi-tenant architecture

### 📚 Reference

Technical reference and architecture.

- **[🏗️ Architecture](reference/Architecture)** - System design
- **[📐 Architecture Diagrams](reference/ARCHITECTURE-DIAGRAMS)** - Visual documentation
- **[🗄️ Database Schema](reference/Database-Schema)** - Database structure
- **[📁 Project Structure](reference/Project-Structure)** - Codebase organization
- **[📘 TypeScript Types](reference/Types)** - Type definitions
- **[📖 SPORT Reference](reference/SPORT)** - Complete API reference

#### Quick Reference Cards

- **[🔐 2FA Quick Reference](reference/2FA-Quick-Reference)**
- **[💬 Advanced Messaging Quick Reference](reference/advanced-messaging-quick-reference)**
- **[📞 Call Management Quick Reference](reference/Call-Management-Quick-Reference)**
- **[🔒 E2EE Quick Reference](reference/E2EE-Quick-Reference)**
- **[📺 Live Streaming Quick Start](reference/Live-Streaming-Quick-Start)**
- **[📱 Mobile Calls Quick Reference](reference/Mobile-Calls-Quick-Reference)**
- **[🔐 PIN Lock Quick Start](reference/PIN-LOCK-QUICK-START)**
- **[📊 Polls Quick Start](reference/Polls-Quick-Start)**
- **[🖥️ Screen Sharing Quick Reference](reference/Screen-Sharing-Quick-Reference)**
- **[🔍 Search Quick Start](reference/Search-Quick-Start)**
- **[🌐 Social Media Quick Reference](reference/Social-Media-Quick-Reference)**
- **[🎙️ Voice Calling Quick Start](reference/Voice-Calling-Quick-Start)**

### 🔐 Security

Security features and best practices.

- **[🔐 Security Overview](security/SECURITY)** - Security architecture
- **[🛡️ Security Audit](security/SECURITY-AUDIT)** - Audit results
- **[⚡ Performance Optimization](security/PERFORMANCE-OPTIMIZATION)** - Performance guide
- **[🔒 2FA Implementation](security/2FA-Implementation-Summary)** - Two-factor auth
- **[🔐 PIN Lock System](security/PIN-LOCK-SYSTEM)** - PIN lock + biometrics
- **[🔐 E2EE Implementation](security/E2EE-Implementation-Summary)** - End-to-end encryption
- **[🛡️ E2EE Security Audit](security/E2EE-Security-Audit)** - Encryption audit
- **[📋 Best Practices](security/security-best-practices)** - Security checklist

### 🆘 Troubleshooting

Common issues and solutions.

- **[❓ FAQ](troubleshooting/FAQ)** - Frequently asked questions
- **[🔧 Troubleshooting Guide](troubleshooting/TROUBLESHOOTING)** - Common issues
- **[📖 Operations Runbook](troubleshooting/RUNBOOK)** - Ops guide

### ℹ️ About

Project information and planning.

- **[📋 Changelog](about/Changelog)** - Version history
- **[🎉 Release Notes v0.3.0](about/RELEASE-NOTES-v0.3.0)** - Latest release
- **[🗺️ Roadmap](about/Roadmap)** - Future plans
- **[⬆️ Upgrade Guide](about/UPGRADE-GUIDE)** - Version upgrades
- **[🤝 Contributing](about/Contributing)** - How to contribute

---

## 🎯 Quick Navigation by Role

### 👤 I'm an End User

Start here to learn how to use nself-chat:

1. **[Quick Start](getting-started/QUICK-START)** - Get started in 5 minutes
2. **[User Guide](guides/USER-GUIDE)** - Learn all features
3. **[Settings](guides/Settings-Quick-Start)** - Customize your experience
4. **[FAQ](troubleshooting/FAQ)** - Common questions

### 👨‍💼 I'm an Administrator

Deploy and manage nself-chat:

1. **[Installation Guide](getting-started/Installation)** - Detailed setup
2. **[Configuration](configuration/Configuration)** - Configure everything
3. **[Deployment](deployment/DEPLOYMENT)** - Production deployment
4. **[Production Checklist](deployment/Production-Deployment-Checklist)** - Pre-deploy steps
5. **[Runbook](troubleshooting/RUNBOOK)** - Operations guide
6. **[Enterprise Features](guides/enterprise/README)** - SSO, RBAC, auditing

### 👨‍💻 I'm a Developer

Build and extend nself-chat:

1. **[Getting Started](getting-started/Getting-Started)** - Development setup
2. **[Architecture](reference/Architecture)** - System design
3. **[API Documentation](api/API-DOCUMENTATION)** - GraphQL API
4. **[Bot Development](features/Bots)** - Build bots
5. **[Plugin Development](features/Plugins)** - Build plugins
6. **[Contributing Guide](about/Contributing)** - Contribute code
7. **[Testing Guide](guides/testing-guide)** - Test your code

### 🚀 I'm DevOps

Deploy and operate nself-chat:

1. **[Docker Deployment](deployment/Deployment-Docker)** - Docker setup
2. **[Kubernetes Deployment](deployment/Deployment-Kubernetes)** - K8s setup
3. **[Helm Charts](deployment/Deployment-Helm)** - Helm deployment
4. **[Production Validation](deployment/Production-Validation)** - Validate deploy
5. **[Runbook](troubleshooting/RUNBOOK)** - Operations guide
6. **[Multi-Tenant Setup](Multi-Tenant-Deployment)** - Multi-tenant architecture

---

## 🌟 What's New in v0.9.1

**Documentation Excellence & Plugin System** - Comprehensive documentation polish and extensible plugin architecture!

### 🎯 Highlights

#### 💬 Advanced Messaging

Edit, delete, forward, pin, star messages • Read receipts • Typing indicators
**[Learn More →](guides/advanced-messaging-implementation-summary)**

#### 🎨 GIFs & Stickers

Tenor GIF integration • Custom sticker packs • 2 default packs included
**[Learn More →](features/GIF-Sticker-Implementation)**

#### 📊 Interactive Polls

Multi-choice polls • Anonymous voting • Live results • Poll expiration
**[Learn More →](features/Polls-Implementation)**

#### 🔐 Enhanced Security

2FA with TOTP • PIN lock + biometrics • Device management • Session security
**[Learn More →](security/2FA-Implementation-Summary)** • **[PIN Lock →](security/PIN-LOCK-SYSTEM)**

#### 🔍 Powerful Search

MeiliSearch integration • Advanced filters • Search operators • Saved searches
**[Learn More →](guides/Search-Implementation)**

#### 🤖 Bot Platform

Bot SDK • Webhook delivery • 16 permissions • Management UI
**[Learn More →](features/Bots)**

#### 🌐 Social Integration

Twitter, Instagram, LinkedIn • Auto-post to channels • Rich embeds
**[Learn More →](features/Social-Media-Integration)**

➡️ **[View Complete Changelog →](about/Changelog)**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     nself-chat Platform                          │
├─────────────────────────────────────────────────────────────────┤
│   Frontend (Next.js 15 + React 19)                              │
│   • 9-step setup wizard                                          │
│   • 25+ theme presets (light/dark)                              │
│   • Real-time messaging UI                                       │
│   • Advanced search (MeiliSearch)                                │
│   • Bot & plugin management                                      │
├─────────────────────────────────────────────────────────────────┤
│   State Management                                               │
│   • Zustand (client state)                                       │
│   • Apollo Client (GraphQL + subscriptions)                      │
│   • LocalStorage + Database sync                                 │
├─────────────────────────────────────────────────────────────────┤
│   Backend (nself CLI v0.4.2)                                     │
│   • PostgreSQL (database)                                        │
│   • Hasura GraphQL Engine                                        │
│   • Nhost Auth (prod) / FauxAuth (dev)                          │
│   • MinIO (S3-compatible storage)                                │
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

**[Detailed Architecture Guide →](reference/Architecture)** • **[Architecture Diagrams →](reference/ARCHITECTURE-DIAGRAMS)**

---

## 💻 Tech Stack

### Frontend

- **Framework:** Next.js 15.5.10, React 19.0.0, TypeScript 5.7.3
- **UI:** Tailwind CSS 3.4.17, Radix UI, Framer Motion 11.18.0
- **State:** Zustand 5.0.3, Apollo Client 3.12.8
- **Forms:** React Hook Form 7.54.2, Zod 3.24.1
- **Editor:** TipTap 2.11.2 (rich text)
- **Real-time:** Socket.io 4.8.1, GraphQL subscriptions

### Backend (via nself CLI)

- **Database:** PostgreSQL with 60+ extensions
- **GraphQL:** Hasura GraphQL Engine
- **Auth:** Nhost Authentication (11 providers)
- **Storage:** MinIO (S3-compatible)
- **Search:** MeiliSearch 0.44.0
- **Cache:** Redis

### Development

- **Testing:** Jest 29.7.0, Playwright 1.50.1
- **Linting:** ESLint 9.18.0, Prettier 3.4.2
- **CI/CD:** 19 GitHub Actions workflows
- **Monitoring:** Sentry 8.47.0

---

## 📊 Project Stats

| Metric                  | Value            |
| ----------------------- | ---------------- |
| **Version**             | 0.9.1            |
| **Release Date**        | February 3, 2026 |
| **Total Features**      | 150+             |
| **Components**          | 75+ directories  |
| **Custom Hooks**        | 60+ hooks        |
| **Database Tables**     | 50+ tables       |
| **API Endpoints**       | 40+ endpoints    |
| **Theme Presets**       | 25+ themes       |
| **Auth Providers**      | 11 providers     |
| **CI Workflows**        | 19 workflows     |
| **Documentation Pages** | 333+ pages       |
| **Lines of Code**       | 60,000+          |

---

## 🤝 Community & Support

### Getting Help

- 📖 **Documentation** - You're reading it!
- 💬 **Discussions** - [GitHub Discussions](https://github.com/acamarata/nself-chat/discussions)
- 🐛 **Issues** - [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- 📧 **Email** - support@nself.org

### Contributing

We welcome contributions! See our **[Contributing Guide](about/Contributing)** for:

- Code of conduct
- Development setup
- Pull request process
- Code standards
- Testing requirements

### Links

- **[GitHub Repository](https://github.com/acamarata/nself-chat)**
- **[nself CLI](https://github.com/acamarata/nself)** - Backend infrastructure
- **[Demo Application](https://demo.nself-chat.org)** - Live demo

---

## 📝 License

**MIT License** - See [LICENSE](https://github.com/acamarata/nself-chat/blob/main/LICENSE) for details.

---

## 🙏 Acknowledgments

Built with love using:

- [Next.js](https://nextjs.org/) - React framework
- [nself CLI](https://github.com/acamarata/nself) - Backend infrastructure
- [Radix UI](https://www.radix-ui.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [MeiliSearch](https://www.meilisearch.com/) - Search engine
- [Hasura](https://hasura.io/) - GraphQL engine

---

<div align="center">

**[⬆ Back to Top](#-nself-chat-documentation)**

---

**Version 0.9.1** • **February 2026**

_nself-chat - White-label team communication platform_

**[Edit this page on GitHub](https://github.com/acamarata/nself-chat/edit/main/docs/Home.md)**

</div>
