# nself-chat Documentation

Welcome to the **nself-chat** documentation - your complete guide to building and deploying a white-label team communication platform.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](Getting-Started) | Install and run in 5 minutes |
| [White-Label Guide](White-Label-Guide) | Customize branding and features |
| [Features](Features) | Complete feature reference |
| [Configuration](Configuration) | Environment and settings |
| [Authentication](Authentication) | Auth providers setup |
| [API Reference](API-Reference) | GraphQL and REST APIs |
| [Components](Components) | UI component library |
| [Hooks](Hooks) | React hooks reference |
| [Bots](Bots) | Bot SDK and examples |
| [Plugins](Plugins) | Modular plugin system |
| [Deployment](Deployment) | Docker, K8s, Vercel |
| [Architecture](Architecture) | System design |

---

## What is nself-chat?

nself-chat is a **production-ready, white-label** team communication platform combining the best of:

- **Slack** - Channels, threads, integrations
- **Discord** - Roles, permissions, rich embeds
- **Telegram** - Stickers, voice messages, bots
- **WhatsApp** - Direct messages, read receipts

### Key Highlights

| Metric | Value |
|--------|-------|
| Source Files | 1,782 TypeScript files |
| Components | 75+ directories |
| Custom Hooks | 60+ hooks |
| Feature Flags | 60+ toggles |
| Auth Methods | 11 providers |
| Theme Presets | 8+ themes |

---

## Feature Summary

### Core Features (78 total)

| Category | Count | Features |
|----------|-------|----------|
| **Messaging** | 14 | Edit, delete, reactions, threads, pins, bookmarks, forward, schedule, voice, code blocks, markdown, link previews, mentions, quotes |
| **Channels** | 9 | Public, private, direct, group DM, categories, topics, archive, favorites, mute |
| **Files** | 8 | Upload, images, documents, audio, video, preview, drag & drop, clipboard |
| **Users** | 7 | Presence, custom status, profiles, roles, blocking, avatars, display names |
| **Real-time** | 5 | Typing, read receipts, presence, messages, notifications |
| **Search** | 6 | Messages, files, users, global, filters, highlighting |
| **Notifications** | 6 | Desktop, sound, email, mobile, DND, schedule |
| **Advanced** | 12 | Custom emoji, GIFs, stickers, polls, webhooks, bots, slash commands, integrations, reminders, workflows, video calls, screen share |
| **Admin** | 6 | Dashboard, user management, analytics, audit logs, bulk operations, export |
| **Moderation** | 6 | Tools, reporting, auto-filter, warnings, bans, slow mode |

---

## Quick Start

```bash
# Clone
git clone https://github.com/acamarata/nself-chat.git
cd nself-chat

# Install
pnpm install

# Run
pnpm dev
```

Visit http://localhost:3000

See [Getting Started](Getting-Started) for full instructions.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **State** | Zustand, Apollo Client |
| **Real-time** | Socket.io, GraphQL Subscriptions |
| **Backend** | nself CLI (Hasura, PostgreSQL, Nhost) |
| **Storage** | MinIO (S3-compatible) |
| **Desktop** | Tauri, Electron |
| **Mobile** | Capacitor, React Native |

---

## Documentation Structure

```
docs/
├── Home.md                    # This page
├── Getting-Started.md         # Quick start guide
├── Installation.md            # Detailed installation
├── Configuration.md           # All config options
├── White-Label-Guide.md       # White-labeling guide
├── Architecture.md            # System architecture
│
├── Features.md                # Features overview
├── Features-Messaging.md      # Messaging features
├── Features-Channels.md       # Channel features
├── Features-Files.md          # File features
├── Features-Users.md          # User features
├── Features-Realtime.md       # Real-time features
├── Features-Search.md         # Search features
├── Features-Notifications.md  # Notification features
├── Features-Emoji.md          # Emoji & reactions
├── Features-Polls.md          # Polls & voting
├── Features-Voice.md          # Voice messages
├── Features-Bots.md           # Bots overview
│
├── Authentication.md          # Auth overview
├── Auth-Email.md              # Email/password
├── Auth-Magic-Link.md         # Magic links
├── Auth-OAuth.md              # OAuth providers
├── Auth-Phone.md              # Phone/SMS
├── Auth-IDme.md               # ID.me verification
├── Auth-Access-Control.md     # Access modes
│
├── Themes.md                  # Theme system
├── Branding.md                # Branding options
├── Feature-Flags.md           # Feature toggles
├── Landing-Pages.md           # Landing page config
│
├── Admin-Dashboard.md         # Admin overview
├── Admin-Users.md             # User management
├── Admin-Channels.md          # Channel management
├── Admin-Analytics.md         # Analytics
├── Admin-Audit.md             # Audit logs
├── Admin-Moderation.md        # Moderation tools
├── Admin-Compliance.md        # Compliance settings
│
├── Bots.md                    # Bot SDK
├── Bots-Examples.md           # Example bots
├── Webhooks.md                # Webhook system
├── Slash-Commands.md          # Slash commands
├── Workflows.md               # Automation
├── Integrations.md            # Third-party integrations
│
├── API-Reference.md           # API overview
├── API-Queries.md             # GraphQL queries
├── API-Mutations.md           # GraphQL mutations
├── API-Subscriptions.md       # GraphQL subscriptions
├── API-REST.md                # REST endpoints
│
├── Components.md              # Components overview
├── Components-UI.md           # UI components
├── Components-Chat.md         # Chat components
├── Components-Admin.md        # Admin components
│
├── Hooks.md                   # Hooks overview
├── Hooks-Data.md              # Data hooks
├── Hooks-Socket.md            # Socket hooks
├── Hooks-UI.md                # UI hooks
│
├── Deployment.md              # Deployment overview
├── Deployment-Docker.md       # Docker
├── Deployment-Kubernetes.md   # Kubernetes
├── Deployment-Vercel.md       # Vercel
├── Deployment-Desktop.md      # Desktop apps
├── Deployment-Mobile.md       # Mobile apps
│
├── Plugins.md                 # Plugin system
├── Plugins-List.md            # Available plugins
├── Plugins-Creating.md        # Creating plugins
│
├── Project-Structure.md       # Code organization
├── Database-Schema.md         # Database tables
├── State-Management.md        # State patterns
├── Environment-Variables.md   # All env vars
├── Types.md                   # TypeScript types
├── Contributing.md            # Contribution guide
├── Changelog.md               # Version history
└── _Sidebar.md                # Wiki sidebar
```

---

## Support

- [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- [Contributing Guide](Contributing)

---

**nself-chat** - Build your own Slack in minutes.
