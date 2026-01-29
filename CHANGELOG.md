# Changelog

All notable changes to ɳChat (nself-chat) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-29

### 🎉 Production-Ready Release

**ɳChat v1.0.0** is the first production-ready release of the white-label team communication platform. This release represents a complete, feature-rich, fully-tested application with 100+ features, 860+ tests, and comprehensive documentation.

### ✨ Major Features

#### Voice & Video Communication
- **Voice Calls**: One-on-one and group voice calls with WebRTC
- **Video Calls**: HD video calling with camera/mic controls
- **Screen Sharing**: Share your screen with audio support
- **Call Controls**: Mute, video toggle, end call, participant management
- **Background Effects**: Background blur and virtual backgrounds
- **Call Statistics**: Real-time network quality and bandwidth monitoring
- **Call Recording**: Record calls with proper permissions (opt-in)
- **Group Calls**: Support for up to 50 participants
- **TURN Server Support**: Configurable TURN servers for NAT traversal

#### Bot SDK & Automation
- **Bot Framework**: Complete SDK for building custom bots
- **Slash Commands**: Create custom `/commands` with arguments
- **Webhooks**: Incoming and outgoing webhook support
- **Event System**: Subscribe to message, user, and channel events
- **Rich Responses**: Embeds, buttons, select menus, and more
- **Bot Permissions**: Granular permission control for bot actions
- **Rate Limiting**: Built-in protection against bot abuse
- **Sandboxed Runtime**: Secure execution environment for bot code
- **Example Bots**: Hello Bot, Poll Bot, Reminder Bot, Welcome Bot

#### Payments & Crypto
- **Stripe Integration**: Subscriptions and one-time payments
- **Payment History**: Complete transaction records
- **Invoicing**: Automatic invoice generation
- **Crypto Wallets**: MetaMask and WalletConnect integration
- **NFT Display**: View and showcase NFTs in profiles
- **Token Transfers**: Send and receive crypto tokens
- **Transaction History**: Blockchain transaction tracking

#### Internationalization (i18n)
- **6 Languages**: English, Spanish, French, German, Arabic, Chinese
- **RTL Support**: Full right-to-left layout for Arabic
- **Auto-Detection**: Automatic locale detection from browser
- **Timezone Conversion**: Smart date/time display per user timezone
- **Number Formatting**: Locale-aware number and currency formatting
- **Message Translation**: Inline translation of messages
- **Language Switcher**: Easy UI for language selection

#### Offline Mode
- **Service Worker**: Cache-first strategy with background sync
- **Offline Queue**: Send messages while offline, sync when online
- **IndexedDB Storage**: Local storage for messages and channels
- **Conflict Resolution**: Smart handling of offline changes
- **Network Detection**: Automatic online/offline status
- **Background Sync**: Queue operations for when connection returns
- **Retry Logic**: Automatic retry of failed operations

#### Enhanced Security
- **End-to-End Encryption**: Optional E2E encryption for DMs (AES-256-GCM)
- **Two-Factor Authentication**: TOTP-based 2FA support
- **Session Management**: Device tracking and remote logout
- **IP-Based Access Control**: Whitelist/blacklist IP addresses
- **Audit Logging**: Comprehensive logging of all admin actions
- **Content Moderation**: Auto-filter with customizable rules
- **User Blocking**: Block users and report abuse
- **GDPR Compliance**: Data export, deletion, and consent management
- **Rate Limiting**: Prevent abuse and spam
- **XSS Protection**: Comprehensive input sanitization

#### Admin Dashboard
- **Analytics Dashboard**: Active users, message stats, storage metrics
- **User Management**: Create, suspend, delete, bulk operations
- **Role Assignment**: Manage user roles and permissions
- **Audit Log Viewer**: Filter and search admin actions
- **System Settings**: Configure app-wide settings
- **Email Templates**: Customize transactional email templates
- **Webhook Management**: Configure and test webhooks
- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Integrated error reporting

#### Accessibility (WCAG 2.1 AA)
- **Screen Reader Support**: Comprehensive ARIA labels and roles
- **Keyboard Navigation**: Full keyboard support throughout app
- **Focus Management**: Proper focus handling and skip links
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Reduced Motion**: Support for prefers-reduced-motion
- **High Contrast Mode**: Enhanced visibility option
- **Resizable Text**: Support for 200% text scaling
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Shortcuts**: Extensive keyboard shortcuts (Cmd+K, etc.)

### 🧪 Testing & Quality

#### Comprehensive Test Suite
- **860+ Total Tests**: 100% pass rate
- **479 E2E Tests**: Playwright tests covering all user flows
- **381 Integration Tests**: Jest integration tests
- **Unit Tests**: Complete coverage of hooks and utilities
- **Component Tests**: React Testing Library component tests
- **Multi-Browser**: Chrome, Firefox, Safari, Mobile, Tablet
- **Accessibility Testing**: Automated a11y checks
- **Lighthouse CI**: Performance monitoring in CI/CD

#### Code Quality
- **TypeScript**: 100% TypeScript with strict mode
- **Zero Errors**: 0 TypeScript errors, 0 ESLint errors
- **100% Pass Rate**: All tests passing
- **Code Coverage**: High test coverage across all modules
- **Performance**: Lighthouse scores 90+ across all metrics

### 🚀 Platform Support

#### Multi-Platform Builds
- **Web**: Production Next.js 15 + React 19 build
- **Desktop (Tauri)**: Lightweight native desktop app (Rust + WebView)
- **Desktop (Electron)**: Cross-platform Electron app (Chromium + Node.js)
- **Mobile (Capacitor)**: Native iOS and Android apps
- **Mobile (React Native)**: Full native React Native apps
- **PWA**: Installable progressive web app with service worker
- **Docker**: Optimized multi-stage Docker builds (~200MB)
- **Kubernetes**: Production-ready K8s manifests and Helm charts

#### Build Scripts
- `pnpm build:web` - Web production build
- `pnpm build:tauri` - Desktop (Tauri) builds for all platforms
- `pnpm build:electron` - Desktop (Electron) builds for all platforms
- `pnpm build:docker` - Docker image build
- `pnpm cap:build` - Mobile (Capacitor) builds

### 📚 Documentation

#### Complete Documentation Set
- **README.md**: Comprehensive project overview with quick start
- **DEPLOYMENT.md**: Full deployment guide for all platforms
- **UPGRADE-GUIDE.md**: Version upgrade instructions and migration
- **30+ Documentation Pages**: Architecture, features, API reference
- **Setup Wizard Docs**: Step-by-step wizard documentation
- **Bot SDK Docs**: Complete bot development guide
- **Contributing Guide**: How to contribute to the project
- **Code Standards**: TypeScript, React, and testing conventions

### 🎨 User Interface

#### Enhanced UI/UX
- **Modern Design**: Clean, professional interface
- **Dark Mode**: Beautiful dark theme with proper contrast
- **27 Theme Presets**: From Slack-like to Discord-style and beyond
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions with Framer Motion
- **Loading States**: Skeleton loaders and progress indicators
- **Error States**: Friendly error messages and recovery options
- **Empty States**: Helpful empty state illustrations

#### Components
- **75+ Components**: Comprehensive component library
- **Radix UI**: Accessible primitives from Radix
- **TipTap Editor**: Rich text editor with formatting
- **Command Palette**: Cmd+K quick actions
- **Modal System**: Reusable modal infrastructure
- **Toast Notifications**: Non-blocking notifications with Sonner

### ⚡ Performance

#### Optimizations
- **Bundle Size**: 103 KB baseline (optimized, gzipped)
- **Lighthouse Scores**: 90+ across all metrics
- **Time to Interactive**: <3 seconds
- **First Contentful Paint**: <1 second
- **Lazy Loading**: Dynamic imports for heavy components
- **Virtual Scrolling**: Efficient message list rendering with @tanstack/react-virtual
- **Image Optimization**: AVIF and WebP with Next.js Image
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Remove unused code
- **Service Worker Caching**: Aggressive caching strategy

### 🔧 Developer Experience

#### Tooling
- **TypeScript 5.7**: Latest TypeScript with strict mode
- **ESLint 9**: Modern ESLint with flat config
- **Prettier**: Code formatting with Tailwind plugin
- **Husky**: Git hooks for pre-commit checks
- **pnpm**: Fast, disk-efficient package manager
- **Turbo**: Optional Turbopack for faster dev builds
- **Hot Reload**: Fast refresh in development

#### Scripts
- 70+ npm scripts for all common tasks
- Type checking, linting, formatting, testing
- Multi-platform builds
- Database migrations and seeding
- Backend service management

### 🔐 Security Enhancements

#### Security Features
- **HTTPS**: SSL/TLS enforcement in production
- **CSP Headers**: Content Security Policy
- **CORS**: Proper CORS configuration
- **Rate Limiting**: API and action rate limiting
- **Input Validation**: Comprehensive input validation with Zod
- **SQL Injection Protection**: Parameterized queries via Hasura
- **XSS Prevention**: DOMPurify for HTML sanitization
- **CSRF Protection**: CSRF token validation
- **Secure Cookies**: HttpOnly, Secure, SameSite cookies

### 🌐 Deployment

#### Deployment Options
- **Vercel**: One-click deployment with GitHub integration
- **Docker**: Production-ready Dockerfile and docker-compose
- **Kubernetes**: K8s manifests with HPA, PDB, NetworkPolicy
- **Helm**: Helm chart with customizable values
- **Traditional Server**: PM2 + Nginx deployment guide
- **CI/CD**: GitHub Actions workflows for all platforms

#### Infrastructure
- **Health Checks**: `/api/health` endpoint for monitoring
- **Graceful Shutdown**: Proper cleanup on SIGTERM
- **Environment Validation**: Pre-flight checks for production
- **Database Migrations**: Automated migration system
- **Backup Scripts**: Database and file backup utilities

### 📦 Dependencies

#### Major Updates
- Next.js 15.1.6 (from 14.x)
- React 19.0.0 (from 18.x)
- TypeScript 5.7.3 (from 5.0.x)
- Tailwind CSS 3.4.17
- Apollo Client 3.12.8
- Zustand 5.0.3
- React Hook Form 7.54.2
- TipTap 2.11.2
- Socket.io Client 4.8.1

### 🐛 Bug Fixes

#### Stability Improvements
- Fixed memory leaks in WebSocket connections
- Resolved race conditions in message sending
- Fixed file upload progress tracking
- Corrected timezone display issues
- Fixed keyboard navigation in modals
- Resolved focus trapping issues
- Fixed avatar loading flickers
- Corrected message grouping logic
- Fixed thread panel scrolling
- Resolved search highlighting bugs

### 🔄 Migration Notes

#### Upgrading from 0.3.x
This is a **major release** with many new features, but most changes are **additive and opt-in**.

**Breaking Changes:**
- Node.js 20+ now required (was 18+)
- TypeScript 5.7+ required (was 5.0+)

**Database Changes:**
- New tables added for calls, bots, payments, translations, offline queue
- Existing tables unchanged
- Run migrations: `cd .backend && nself db migrate up`

**Environment Variables:**
- All new features have corresponding env vars (optional)
- See `.env.example` for complete reference
- New features are disabled by default, opt-in via config

**Configuration:**
- AppConfig schema extended with new feature flags
- Existing config remains compatible
- New features accessible via Settings → Features

**No data loss** - all existing data is preserved and compatible.

See [UPGRADE-GUIDE.md](./docs/UPGRADE-GUIDE.md) for detailed upgrade instructions.

### 📊 Statistics

- **100+ Features** across 13 categories
- **860+ Tests** (479 E2E + 381 integration)
- **75+ Components** in component library
- **60+ Custom Hooks** for React logic
- **30+ Documentation Pages**
- **27 Theme Presets** with light/dark modes
- **11 Auth Providers** supported
- **6 Languages** with i18n support
- **5 Deployment Targets** (Web, Desktop, Mobile, Docker, K8s)
- **103 KB** optimized bundle size
- **0 TypeScript Errors**
- **0 ESLint Errors**
- **100% Test Pass Rate**

### 🙏 Acknowledgments

Built with:
- [ɳSelf CLI](https://github.com/acamarata/nself) for backend infrastructure
- [Next.js 15](https://nextjs.org/) and [React 19](https://react.dev/)
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Apollo Client](https://www.apollographql.com/) for GraphQL
- [Socket.io](https://socket.io/) for real-time communication

---

## [0.3.0] - 2026-01-29

### Added
- 860+ comprehensive tests (479 E2E + 381 integration)
- WCAG 2.1 AA accessibility compliance
- Lighthouse CI automated monitoring
- Error state components throughout the app
- Modal integrations (Create Channel, DM, Search)
- Thread panel functionality
- Performance optimizations

### Changed
- Updated documentation with test coverage details
- Enhanced README with accessibility badges
- Improved type safety across the codebase

### Fixed
- Zero TypeScript errors achieved
- All tests passing (100% pass rate)
- Modal focus trapping issues
- Keyboard navigation improvements

---

## [0.2.0] - 2026-01-28

### Added
- Real-time messaging with WebSocket (Socket.io)
- 78+ features across 11 major categories
- Voice and video calls (WebRTC)
- Bot SDK with webhooks
- Payment processing (Stripe integration)
- Crypto wallet support (MetaMask, WalletConnect)
- Full internationalization (6 languages)
- Offline mode with background sync
- Comprehensive RBAC (Role-Based Access Control)
- Message reactions and threading
- File uploads with drag & drop
- Link previews and URL unfurling
- User presence and typing indicators
- Search functionality (messages, users, files)
- Admin dashboard with analytics
- Audit logging
- Content moderation tools

### Changed
- Environment variable structure (renamed `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_GRAPHQL_URL`)
- Database schema with new tables for reactions, threads, calls, etc.
- Configuration format in `app_configuration` table

### Breaking Changes
- Requires Node.js 20+ (was 18+)
- Requires pnpm 9+ (was 8+)
- Environment variables renamed (see UPGRADE-GUIDE.md)
- Database migration required

---

## [0.1.1] - 2026-01-29

### Added
- Enhanced setup wizard (12 steps instead of 9)
- Comprehensive documentation (30+ pages)
- Sprint planning system in AI context directory
- Contributing guidelines
- Architecture decision records (ADRs)

### Changed
- README updated with detailed feature list
- Setup wizard documentation enhanced
- White-label guide expanded

---

## [0.1.0] - 2026-01-27

### Added
- Initial project structure with Next.js 15 and React 19
- Basic setup wizard UI (9 steps)
- AppConfig data model and persistence
- Development authentication with 8 test users
- Theme system with 25+ presets
- GraphQL client configuration
- Database schema with RBAC
- Radix UI component library integration
- CI/CD workflows (19 workflow files)
- Multi-platform build scaffolding (Tauri, Electron, Capacitor, React Native)
- Docker configuration
- Landing page components
- Basic chat UI components

### Features
- Complete setup wizard
- Dual authentication (dev/prod)
- White-label branding
- Theme customization
- Channel-based organization
- User profiles and roles

---

## Release Versioning

- **1.0.0**: Production-ready release with comprehensive features and testing
- **0.3.0**: Testing and quality assurance release
- **0.2.0**: Feature-complete beta release
- **0.1.x**: Alpha releases with core infrastructure

---

## Future Roadmap

See [docs/Roadmap.md](./docs/Roadmap.md) for planned features and phases.

### Planned Features
- Mobile push notifications (iOS/Android)
- Email-to-chat integration
- Advanced search with filters
- Custom bot marketplace
- Plugin system for extensions
- Advanced analytics dashboard
- SSO/SAML enterprise authentication
- Compliance exports (GDPR, HIPAA)
- Custom workflows and automation
- API rate limiting dashboard

---

**Note**: All dates in this changelog reflect the actual development timeline. For more details on any release, see the corresponding Git tag or GitHub release notes.

**Links**:
- [GitHub Repository](https://github.com/acamarata/nself-chat)
- [Documentation](./docs/Home.md)
- [ɳSelf Website](https://nself.org)
