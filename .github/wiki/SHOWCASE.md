# ɳChat Feature Showcase

**Version**: 0.9.2
**Purpose**: Demonstrate the complete capabilities of ɳSelf CLI through a production-grade reference implementation
**Live Demos**: See this in action at:
- 🏠 **Local**: [chat.local.nself.org](https://chat.local.nself.org) (or localhost:3000)
- 🧪 **Staging**: [chat.staging.nself.org](https://chat.staging.nself.org)
- 🌐 **Production**: [chat.nself.org](https://chat.nself.org)

---

## 🎯 What This Showcases

### 1. **Complete Backend Infrastructure (ɳSelf CLI)**

**One Command, Everything Running:**
```bash
cd backend
nself start
```

**What Starts Automatically:**
- ✅ PostgreSQL with 222 tables
- ✅ Hasura GraphQL API
- ✅ Nhost Authentication
- ✅ MinIO S3 Storage
- ✅ Redis Cache
- ✅ MeiliSearch
- ✅ MailPit (dev email)
- ✅ Nginx with SSL
- ✅ Admin Dashboard
- ✅ WebSocket Server
- ✅ Storage Service

**Zero Configuration:**
- 🔒 Automatic SSL certificates (no browser warnings!)
- 🌐 Works with `*.local.nself.org` domains (resolves to 127.0.0.1)
- 📊 All services pre-configured and talking to each other
- 🔐 JWT auth configured
- 📝 GraphQL schema generated
- 🗄️ Database migrations ready

### 2. **Real-Time Features (GraphQL Subscriptions)**

**Live Demo Scenarios:**

**Scenario A: Typing Indicators**
1. Login as `user@nself.org` in Browser 1
2. Login as `helper@nself.org` in Browser 2
3. Start typing in Browser 1 → See "User is typing..." in Browser 2
4. Stop typing → Indicator disappears

**Scenario B: Instant Message Delivery**
1. Open same channel in 2 browsers (different users)
2. Send message in Browser 1 → Appears instantly in Browser 2
3. No refresh needed, no polling, true push

**Scenario C: Presence Tracking**
1. User comes online → Green dot appears
2. User goes offline → Gray dot
3. User idle for 5 minutes → Yellow dot

**Technical Implementation:**
- Uses Hasura GraphQL subscriptions over WebSocket
- Real-time database changes streamed to clients
- Efficient: Only sends changed data
- Scalable: Hasura handles connection management

### 3. **Authentication Showcase**

**11 OAuth Providers Configured:**
- 🔵 Google
- 🐙 GitHub
- 🪟 Microsoft
- 🍎 Apple
- 📘 Facebook
- 🐦 Twitter/X
- 💼 LinkedIn
- 🎮 Discord
- 🔒 ID.me (military verification)
- 📱 Twitch
- 🎨 Figma

**Email/Password:**
- ✅ Secure bcrypt hashing
- ✅ Email verification
- ✅ Password reset flows
- ✅ Rate limiting

**Magic Links:**
- ✅ Passwordless login
- ✅ Time-limited tokens
- ✅ One-click authentication

**Two-Factor Authentication:**
- ✅ TOTP (Google Authenticator, Authy)
- ✅ Backup codes
- ✅ Recovery options

**Demo Accounts (Local/Staging Only):**

Role hierarchy with **descending access levels** (1 = highest, 6 = no special role):

| # | Email | Password | Role | Showcase |
|---|-------|----------|------|----------|
| 1 | owner@nself.org | `password` | **Owner** | Top level - Cannot be removed, all access |
| 2 | admin@nself.org | `password` | **Admin** | High-level administration |
| 3 | mod@nself.org | `password` | **Moderator** | Content moderation |
| 4 | support@nself.org | `password` | **Support** | User support with limited admin |
| 5 | helper@nself.org | `password` | **Helper** | Community helper with limited mod |
| 6 | user@nself.org | `password` | *(no role)* | Regular user - No special permissions |

### 4. **Per-App RBAC (Monorepo Ready)**

**What This Means:**
- ✅ Same user can have different roles in different apps
- ✅ Login once, access multiple apps (SSO)
- ✅ Granular permissions per application

**Example Monorepo Setup:**
```
monorepo/
├── backend/           # One shared ɳSelf backend
├── nchat/            # This app
├── ntv/              # Media streaming app
└── nfamily/          # Family organizer app
```

**User Experience:**
1. User logs in to ɳChat → Admin role
2. User visits ɳTV → Member role (different!)
3. User visits ɳFamily → Owner role (different again!)
4. **No separate logins** - SSO across all apps

**Showcase Scenario:**
```bash
# Login as admin@nself.org
curl -X POST https://auth.local.nself.org/v1/signin/email-password \
  -d '{"email":"admin@nself.org","password":"password"}'

# Check role in nchat
query {
  app_user_roles(where: {user_id: {_eq: "..."}}) {
    app_id
    role
  }
}

# Returns: [
#   { app_id: "nchat", role: "admin" },
#   { app_id: "ntv", role: "member" }
# ]
```

### 5. **Feature Parity with Major Platforms**

**Messaging:** ✅ Whatsapp/Telegram Level
- ✅ Direct messages (1-on-1)
- ✅ Group channels
- ✅ Threads (nested conversations)
- ✅ Message reactions
- ✅ Pin important messages
- ✅ Message search
- ✅ Edit/delete messages
- ✅ Message history
- ✅ Unread indicators
- ✅ @mentions

**Collaboration:** ✅ Slack/Discord Level
- ✅ Public channels
- ✅ Private channels
- ✅ Channel descriptions
- ✅ Channel topics
- ✅ Channel permissions
- ✅ User roles (owner, admin, mod, member, guest)
- ✅ File uploads (S3 storage)
- ✅ Image previews
- ✅ Link previews
- ✅ Code snippets

**Moderation:** ✅ Discord/Telegram Level
- ✅ Delete messages
- ✅ Ban users
- ✅ Timeout users
- ✅ Warn users
- ✅ Audit logs
- ✅ Report system
- ✅ Auto-moderation (profanity filter)

**Advanced:** ✅ Enterprise Level
- ✅ End-to-end encryption (Double Ratchet)
- ✅ Voice & video calls (WebRTC)
- ✅ Screen sharing
- ✅ File sharing with S3
- ✅ Full-text search (MeiliSearch)
- ✅ Analytics dashboard
- ✅ Webhooks
- ✅ Bot framework
- ✅ Custom integrations

### 6. **Developer Experience (Dev → Staging → Prod)**

**Local Development:**
```bash
Domain: chat.local.nself.org
Backend: Runs on Docker (nself start)
Frontend: localhost:3000 (pnpm dev)
Database: PostgreSQL local
Storage: MinIO local
Email: MailPit (all emails captured locally)
```

**Staging (VPS):**
```bash
Domain: chat.staging.nself.org
Backend: Same nself setup, ENV=staging
Frontend: Next.js on VPS
Database: PostgreSQL on VPS
Storage: MinIO or S3
Email: Real SMTP (SendGrid, AWS SES, etc.)
Protection: HTTP basic auth (team password)
```

**Production (Vercel):**
```bash
Domain: chat.nself.org
Backend: nself on dedicated server
Frontend: Vercel edge network
Database: PostgreSQL production
Storage: AWS S3 or CloudFlare R2
Email: Production SMTP
SSL: Let's Encrypt via nself
CDN: Vercel + CloudFlare
```

**What Makes This Easy:**
- ✅ Same codebase for all environments
- ✅ Environment-specific `.env` files (`.env.dev`, `.env.staging`, `.env.prod`)
- ✅ One command deploys everything (`nself deploy staging`)
- ✅ Automatic SSL in all environments
- ✅ Zero-downtime deployments
- ✅ Rollback support

### 7. **White-Label Customization**

**Setup Wizard (12 Steps):**
1. Welcome
2. Owner information
3. Branding (name, logo, colors)
4. Theme selection (27 presets)
5. Landing page style
6. Auth methods (which OAuth providers)
7. Access permissions (open/invite/domain-restricted)
8. Features toggle (enable/disable features)
9. Integrations (Slack, GitHub, etc.)
10. Legal (terms, privacy policy)
11. SEO settings
12. Review and launch

**What Can Be Customized:**
- ✅ App name and tagline
- ✅ Logo and favicon
- ✅ Color scheme (27 presets + custom)
- ✅ Light/dark mode
- ✅ Custom CSS
- ✅ Domain (your-domain.com)
- ✅ Email templates
- ✅ Legal documents
- ✅ Social media links
- ✅ Landing page style

**Result:** Completely branded product in 10 minutes

### 8. **Multi-Platform Deployment**

**Platforms Supported:**
- ✅ Web (Next.js 15)
- ✅ iOS (Capacitor)
- ✅ Android (Capacitor)
- ✅ Windows Desktop (Electron)
- ✅ macOS Desktop (Electron)
- ✅ Linux Desktop (Electron)

**One Codebase, Six Platforms:**
```
frontend/
├── src/              # Shared code (99%)
├── platforms/
│   ├── mobile/      # iOS/Android builds
│   └── desktop/     # Electron builds
```

**Build Commands:**
```bash
# Web
pnpm build

# Mobile
cd platforms/mobile
pnpm build:ios
pnpm build:android

# Desktop
cd platforms/desktop
pnpm build:mac
pnpm build:win
pnpm build:linux
```

---

## 🧪 Testing Scenarios for Demos

### Quick Demo (5 minutes)

**1. Clone and Start (2 min)**
```bash
git clone https://github.com/nself-org/chat.git
cd nself-chat/backend
nself start
# In new terminal
cd frontend
pnpm install && pnpm dev
```

**2. Login as Demo User (1 min)**
- Visit http://localhost:3000
- Login as `user@nself.org` / `password`

**3. Show Real-Time (2 min)**
- Open second browser as `helper@nself.org`
- Start typing → See typing indicator
- Send message → Appears instantly

**Talking Points:**
- "One command started 11 backend services"
- "Automatic SSL with zero configuration"
- "Real-time features work out of the box"
- "Production-ready infrastructure"

### Full Demo (30 minutes)

**Part 1: Setup Speed (5 min)**
- Clone repository
- Run `nself start`
- Show Docker containers spinning up
- Show all service URLs working
- No configuration needed!

**Part 2: Authentication (5 min)**
- Show 6 demo users with different roles
- Login as owner → Full access
- Login as user → Limited access
- Show OAuth provider configuration
- Demonstrate magic links

**Part 3: Real-Time Features (5 min)**
- Two browsers side-by-side
- Typing indicators
- Instant message delivery
- Presence updates
- Reactions

**Part 4: Permissions (5 min)**
- Login as regular user → Try to delete message → Denied
- Login as moderator → Delete any message → Success
- Login as admin → Delete channel → Success
- Show per-app RBAC concept

**Part 5: Developer Experience (5 min)**
- Show code structure
- Explain environment flow (dev/staging/prod)
- Show how easy deployment is
- Demonstrate white-label customization

**Part 6: Production Features (5 min)**
- Show test coverage (98%+)
- Show build passing (0 errors)
- Show monitoring (Grafana)
- Show scalability options

---

## 📊 Key Metrics to Highlight

**Setup Time:**
- ⏱️ 5 minutes from clone to running app
- 🔧 3 commands total
- 📦 11 services started automatically

**Feature Completeness:**
- ✅ 98% test coverage
- ✅ 0 TypeScript errors
- ✅ 222 database tables
- ✅ Feature parity with Slack/Discord/Telegram

**Production Ready:**
- 🔒 End-to-end encryption
- 📊 Monitoring built-in
- 🚀 Scalable architecture
- 💾 Automated backups

**Developer Experience:**
- 🎨 White-label in 10 minutes
- 🌍 Deploy to 6 platforms
- 🔄 Zero-downtime deploys
- 📝 100% documented

---

## 🎤 Demo Scripts

### For Technical Audience

"Let me show you how fast you can get a production-grade chat app running with ɳSelf CLI."

*Clone and start backend*

"Notice: One command just started PostgreSQL, Hasura GraphQL, authentication, storage, search, and 6 other services. All pre-configured. Automatic SSL certificates. No YAML files to edit."

*Start frontend*

"Frontend connects to backend via GraphQL. Real-time subscriptions already working."

*Show real-time features*

"See the typing indicators? GraphQL subscriptions. Not polling. True push. Same technology Slack and Discord use."

*Show authentication*

"Six demo users with different permission levels. Owner, admin, moderator, regular member. Try to delete a message as a regular user? Denied. As a moderator? Works. That's row-level security enforced at the database level."

*Show deployment options*

"Same codebase deploys to web, iOS, Android, Windows, macOS, Linux. From local development to staging to production with environment-specific configs. One backend serves all platforms."

### For Business Audience

"This is a complete Slack/Discord competitor that you can white-label and deploy yourself in under 10 minutes."

*Show features*

"Everything you expect: Direct messages, channels, file sharing, search, voice/video calls. Plus end-to-end encryption, which even Slack doesn't have."

*Show customization*

"Want it to look like your brand? Change the logo, colors, domain. Setup wizard walks you through it. Ten minutes total."

*Show deployment options*

"Deploy on your infrastructure - your VPS, your AWS account, or even your laptop. Or use Vercel for the frontend. Your data stays where you want it."

*Show cost comparison*

"Slack charges $7-12 per user per month. This? The software is free. You only pay for hosting - maybe $50-100/month total for unlimited users."

---

## 🎁 What They Get

When someone clones nself-chat, they get:

**Immediate:**
- ✅ Working chat application
- ✅ 6 demo users to test with
- ✅ Real-time features
- ✅ All 11 backend services
- ✅ Automatic SSL

**Customizable:**
- ✅ White-label setup wizard
- ✅ 27 theme presets
- ✅ Enable/disable features
- ✅ Configure OAuth providers
- ✅ Modify everything

**Production:**
- ✅ End-to-end encryption
- ✅ Voice/video calls
- ✅ File storage (S3)
- ✅ Full-text search
- ✅ Monitoring
- ✅ Backups

**Deployment:**
- ✅ Web (Next.js)
- ✅ iOS (Capacitor)
- ✅ Android (Capacitor)
- ✅ Desktop (Electron)
- ✅ All from one codebase

**Support:**
- ✅ Complete documentation
- ✅ Code examples
- ✅ Test suite (98% coverage)
- ✅ GitHub community

---

## 🔗 Links

- **Documentation**: [Home.md](Home.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment**: [deployment/](deployment/)
- **GitHub**: https://github.com/nself-org/chat
- **ɳSelf CLI**: https://github.com/nself-org/cli

---

**Questions?** Open an issue or join our Discord!
