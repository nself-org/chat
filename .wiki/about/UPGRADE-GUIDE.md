# ɳChat Upgrade Guide

**Current Version**: 1.0.0
**Last Updated**: 2026-01-29

This guide helps you upgrade ɳChat between versions safely.

---

## Table of Contents

- [Before You Upgrade](#before-you-upgrade)
- [Upgrade Paths](#upgrade-paths)
- [Version-Specific Instructions](#version-specific-instructions)
- [Post-Upgrade Checklist](#post-upgrade-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Breaking Changes](#breaking-changes)
- [New Features in v1.0.0](#new-features-in-v100)

---

## Before You Upgrade

### Backup Checklist

Always backup before upgrading:

```bash
# 1. Backup database
pg_dump -U nchat_user nchat_production > backup_$(date +%Y%m%d).sql

# 2. Backup uploads/files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /path/to/uploads

# 3. Backup configuration
cp .env.production .env.production.backup
cp .env.local .env.local.backup

# 4. Export app configuration
curl http://localhost:3000/api/config > config_backup_$(date +%Y%m%d).json

# 5. Tag current version in git
git tag -a v0.2.0-backup -m "Backup before upgrade to 0.3.0"
```

### Test in Staging First

Never upgrade production directly:

1. Set up staging environment
2. Test upgrade on staging
3. Verify all features work
4. Monitor for 24-48 hours
5. Then upgrade production

### Check Dependencies

```bash
# Check Node.js version
node -v  # Should be 20+

# Check pnpm version
pnpm -v  # Should be 9+

# Check backend services
cd .backend && nself status
```

---

## Upgrade Paths

### Supported Upgrades

| From Version | To Version | Direct Upgrade       | Notes                                   |
| ------------ | ---------- | -------------------- | --------------------------------------- |
| 0.1.x        | 0.2.0      | ✅ Yes               | Database migration required             |
| 0.2.x        | 0.3.0      | ✅ Yes               | Configuration migration                 |
| 0.3.x        | 1.0.0      | ✅ Yes               | Minor config updates, feature additions |
| 0.1.x        | 1.0.0      | ⚠️ Via 0.2.0 → 0.3.0 | Multi-step upgrade required             |
| 0.2.x        | 1.0.0      | ⚠️ Via 0.3.0         | Upgrade to 0.3.0 first                  |

### Upgrade Procedure

```bash
# 1. Backup (see above)

# 2. Pull latest code
git fetch origin
git checkout v0.3.0  # or main for latest

# 3. Update dependencies
pnpm install

# 4. Run migrations
cd .backend
nself db migrate up

# 5. Update configuration (if needed)
# See version-specific instructions below

# 6. Build new version
cd ..
pnpm build

# 7. Run tests
pnpm test

# 8. Restart application
pm2 restart nchat  # or your process manager

# 9. Verify upgrade
curl http://localhost:3000/api/health
```

---

## Version-Specific Instructions

### Upgrading to 1.0.0 (from 0.3.x)

**Release Date**: 2026-01-29
**Type**: Major Release (Production-Ready)

#### New Features (100+ additions)

See [New Features in v1.0.0](#new-features-in-v100) section below for complete list.

Major additions:

- Voice & Video calls (WebRTC)
- Bot SDK with marketplace
- Payments (Stripe) & Crypto wallets
- Internationalization (6 languages)
- Offline mode with background sync
- Enhanced security (E2E encryption, 2FA)
- Comprehensive admin dashboard
- 860+ tests with 100% pass rate

#### Breaking Changes

**Minimal breaking changes** - mostly additive:

1. **New Environment Variables** (Optional)

   ```bash
   # Stripe (optional)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_SECRET_KEY=sk_...

   # WebRTC (optional)
   NEXT_PUBLIC_TURN_SERVER_URL=turn:...
   TURN_SERVER_USERNAME=...
   TURN_SERVER_CREDENTIAL=...

   # Crypto (optional)
   NEXT_PUBLIC_ENABLE_CRYPTO_WALLET=true
   ```

2. **Database Schema** (Auto-migrated)
   - New tables for calls, payments, wallets, translations
   - Existing tables unchanged
   - Migrations run automatically

3. **Feature Flags** (New)
   ```typescript
   // In app config
   features: {
     ...existing,
     voiceCalls: true,      // New
     videoCalls: true,      // New
     payments: false,       // New (opt-in)
     cryptoWallet: false,   // New (opt-in)
     botSdk: true,          // New
     i18n: true,            // New
     offlineMode: true,     // New
   }
   ```

#### Configuration Changes

All new features are **opt-in** via setup wizard or environment variables. No mandatory changes.

**Recommended additions** to `.env.local`:

```bash
# Enable new features (all optional)
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_VIDEO_CALLS=true
NEXT_PUBLIC_ENABLE_BOT_SDK=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
NEXT_PUBLIC_ENABLE_I18N=true

# Payments (optional)
NEXT_PUBLIC_ENABLE_PAYMENTS=false
NEXT_PUBLIC_ENABLE_CRYPTO=false
```

#### Database Migrations

```bash
cd .backend

# Backup first!
pg_dump -U nchat_user nchat_production > backup_pre_v1.0.0.sql

# Run migrations
nself db migrate up

# Verify
nself db migrate status
# Should show all migrations applied
```

New tables created:

- `nchat_calls` - Call records
- `nchat_call_participants` - Call participants
- `nchat_bots` - Bot registry
- `nchat_bot_commands` - Bot slash commands
- `nchat_webhooks` - Webhook configurations
- `nchat_payments` - Payment transactions
- `nchat_wallets` - Crypto wallet addresses
- `nchat_translations` - Message translations
- `nchat_offline_queue` - Offline message queue

#### Steps

```bash
# 1. Backup everything
./scripts/backup.sh

# 2. Pull v1.0.0
git fetch origin
git checkout v1.0.0

# 3. Install dependencies
pnpm install

# 4. Run database migrations
cd .backend
nself db migrate up
cd ..

# 5. Update environment (optional features)
# Edit .env.local to enable new features

# 6. Build
pnpm build

# 7. Run tests
pnpm test

# 8. Verify bundle size
pnpm build:analyze
# Should see ~103 KB baseline

# 9. Restart
pm2 restart nchat

# 10. Verify health
curl http://localhost:3000/api/health
```

#### Verification

```bash
# Check version
curl http://localhost:3000/api/health | jq '.version'
# Should return: "1.0.0"

# Run all checks
pnpm check-all
# Should pass: type-check, format, lint, tests

# Check accessibility
pnpm lighthouse
# Should achieve WCAG AA scores

# Test new features
# - Try voice/video calls
# - Test bot commands
# - Check offline mode
# - Verify internationalization
```

#### Post-Upgrade Configuration

After upgrading, visit **Settings → Features** in the admin dashboard to:

1. Enable/disable new features
2. Configure payment providers
3. Set up webhook endpoints
4. Create custom bots
5. Configure language preferences
6. Set up TURN servers for calls

---

### Upgrading to 0.3.0 (from 0.2.x)

**Release Date**: 2026-01-29
**Type**: Feature Release (Production-Ready)

#### New Features

- 860+ comprehensive tests (integration + E2E)
- WCAG 2.1 AA accessibility compliance
- Lighthouse CI automated monitoring
- Performance optimizations
- Error state components
- Modal integrations (Create Channel, DM, Search)
- Thread panel functionality

#### Breaking Changes

None - fully backward compatible with 0.2.x

#### Configuration Changes

No configuration changes required.

#### Database Migrations

No database migrations required.

#### Steps

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pnpm install

# 3. Build
pnpm build

# 4. Restart
pm2 restart nchat

# Done! No other changes needed.
```

#### Verification

```bash
# Check version
curl http://localhost:3000/api/health | jq '.version'
# Should return: "0.3.0"

# Run type check
pnpm type-check
# Should show: 0 errors

# Run tests
pnpm test
# Should pass all tests
```

---

### Upgrading to 0.2.0 (from 0.1.x)

**Release Date**: 2026-01-28
**Type**: Major Feature Release

#### New Features

- 78+ features across 11 major areas
- Real-time messaging with WebSocket
- Voice/video calls (WebRTC)
- Bot SDK with webhooks
- Payment processing (Stripe)
- Crypto wallets (MetaMask, WalletConnect)
- Full internationalization (6 languages)
- Offline mode with background sync
- Comprehensive RBAC

#### Breaking Changes

1. **Environment Variables**
   - Renamed: `NEXT_PUBLIC_API_URL` → `NEXT_PUBLIC_GRAPHQL_URL`
   - Added: `NEXT_PUBLIC_WS_URL` (for WebSocket connections)
   - Added: `NEXT_PUBLIC_STORAGE_URL`

2. **Database Schema**
   - New tables: `nchat_message_reactions`, `nchat_message_threads`, etc.
   - Schema changes require migration

3. **Configuration Format**
   - `app_configuration` table structure changed
   - Config migration script required

#### Configuration Migration

```bash
# 1. Export old configuration
curl http://localhost:3000/api/config > old_config.json

# 2. Run migration script
node scripts/migrate-config-0.1-to-0.2.js old_config.json

# 3. Import new configuration
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d @new_config.json
```

#### Database Migrations

```bash
cd .backend

# Run all migrations up to 0.2.0
nself db migrate up

# Verify migrations
nself db migrate status
```

#### Steps

```bash
# 1. Backup (see "Before You Upgrade")

# 2. Update environment variables
cp .env.local .env.local.backup
cat > .env.local << EOF
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_WS_URL=ws://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage
NEXT_PUBLIC_USE_DEV_AUTH=true
EOF

# 3. Pull latest code
git checkout v0.2.0

# 4. Install dependencies
pnpm install

# 5. Run database migrations
cd .backend
nself db migrate up
cd ..

# 6. Migrate configuration
node scripts/migrate-config-0.1-to-0.2.js config_backup.json

# 7. Build
pnpm build

# 8. Run tests
pnpm test

# 9. Restart
pm2 restart nchat

# 10. Verify
curl http://localhost:3000/api/health
```

---

### Upgrading to 0.1.1 (from 0.1.0)

**Release Date**: 2026-01-29
**Type**: Documentation & Planning Update

#### Changes

- Enhanced setup wizard (12 steps instead of 9)
- Comprehensive documentation
- Sprint planning system
- No code changes

#### Steps

```bash
git pull origin main
# No other steps required - documentation only
```

---

## Post-Upgrade Checklist

After upgrading, verify these items:

### Application Health

- [ ] Application starts successfully
- [ ] No errors in logs
- [ ] `/api/health` endpoint returns `200 OK`
- [ ] Version number is correct

### Authentication

- [ ] Users can log in
- [ ] Session persistence works
- [ ] Token refresh works
- [ ] OAuth providers work (if configured)

### Core Features

- [ ] Send/receive messages
- [ ] Create channels
- [ ] File uploads work
- [ ] Search functionality
- [ ] Real-time updates (typing indicators, presence)
- [ ] Reactions work
- [ ] Threads work

### Database

- [ ] Migrations applied successfully
- [ ] No orphaned data
- [ ] Constraints are valid
- [ ] Indexes exist

### Performance

- [ ] Page load time <3s
- [ ] WebSocket connections stable
- [ ] Database queries performant
- [ ] No memory leaks

### Monitoring

```bash
# Check error logs
tail -f /var/log/nchat/error.log

# Monitor PM2
pm2 monit

# Check database connections
psql -U nchat_user -d nchat_production -c "SELECT count(*) FROM pg_stat_activity;"

# Verify WebSocket connections
# Check browser DevTools → Network → WS
```

---

## Rollback Procedures

If upgrade fails, rollback to previous version:

### Quick Rollback

```bash
# 1. Stop application
pm2 stop nchat

# 2. Checkout previous version
git checkout v0.2.0  # or your previous version tag

# 3. Restore dependencies
pnpm install

# 4. Restore database
psql -U nchat_user -d nchat_production < backup_20260129.sql

# 5. Restore configuration
cp .env.production.backup .env.production

# 6. Rebuild
pnpm build

# 7. Restart
pm2 restart nchat
```

### Database Rollback

```bash
cd .backend

# Check current migration version
nself db migrate status

# Rollback to specific version
nself db migrate down --to v0.2.0

# Verify
nself db migrate status
```

### Vercel Rollback

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Docker Rollback

```bash
# Tag previous version as latest
docker tag nchat:0.2.0 nchat:latest

# Restart containers
docker-compose down
docker-compose up -d
```

### Kubernetes Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/nchat-app -n nchat

# Check status
kubectl rollout status deployment/nchat-app -n nchat
```

---

## New Features in v1.0.0

This section details all major features added in the v1.0.0 release.

### Voice & Video Communication

**WebRTC-based calling system:**

- One-on-one voice calls with call controls
- One-on-one video calls with camera/mic toggles
- Group voice calls (up to 50 participants)
- Group video calls with grid and spotlight views
- Screen sharing with audio support
- Call recording (with permissions)
- Background blur and virtual backgrounds
- Network quality indicators
- Real-time call statistics
- Bandwidth optimization

**How to enable:**

```bash
# .env.local
NEXT_PUBLIC_ENABLE_VOICE_CALLS=true
NEXT_PUBLIC_ENABLE_VIDEO_CALLS=true
NEXT_PUBLIC_TURN_SERVER_URL=turn:your-turn-server.com
```

### Bot SDK & Automation

**Comprehensive bot framework:**

- Create custom bots with slash commands
- Webhook integrations (incoming/outgoing)
- Event subscriptions (messages, joins, reactions, etc.)
- Rich message formatting (embeds, buttons, select menus)
- Bot permissions and rate limiting
- Sandboxed runtime environment
- Example bots included (Hello, Poll, Reminder, Welcome)

**Example bot:**

```typescript
import { bot, command, embed } from '@/lib/bot-sdk'

const weatherBot = bot('weather')
  .command('weather', 'Get weather forecast', async (ctx) => {
    return embed({
      title: 'Weather in ' + ctx.args.location,
      description: '72°F - Sunny',
      color: '#3b82f6',
    })
  })
  .build()
```

### Payments & Crypto

**Integrated payment processing:**

- Stripe integration for subscriptions and one-time payments
- Payment history and invoicing
- Crypto wallet support (MetaMask, WalletConnect)
- NFT display and trading
- Token transfers
- Transaction history

**Setup:**

```bash
# .env.local
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...

# Crypto (optional)
NEXT_PUBLIC_ENABLE_CRYPTO=true
```

### Internationalization (i18n)

**6 language support:**

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Arabic (ar) - with RTL support
- Chinese (zh)

**Features:**

- Automatic locale detection
- Timezone conversion
- Number and date formatting per locale
- Message translation (inline)
- Language switcher UI

**Usage:**

```typescript
import { useTranslation } from '@/hooks/use-translation'

const { t, locale, setLocale } = useTranslation()
console.log(t('messages.welcome')) // Translated string
```

### Offline Mode

**Full offline support:**

- Service worker with cache-first strategy
- Background sync for pending messages
- Offline queue management
- Conflict resolution
- IndexedDB storage
- Network status detection
- Automatic retry logic

**Features:**

- Send messages while offline (queued)
- Read cached messages
- Sync when back online
- Conflict resolution UI

### Enhanced Security

**Enterprise-grade security:**

- End-to-end encryption for DMs (optional)
- Two-factor authentication (TOTP)
- Session management with device tracking
- IP-based access control
- Comprehensive audit logging
- Content moderation with auto-filter
- User blocking and reporting
- GDPR compliance tools
- Data export and deletion

**Enable E2E encryption:**

```typescript
// In channel settings
{
  encryption: {
    enabled: true,
    algorithm: 'AES-256-GCM',
  }
}
```

### Admin Dashboard Enhancements

**Comprehensive admin tools:**

- Analytics dashboard with charts (active users, messages, storage)
- User management (create, suspend, delete, bulk operations)
- Role assignment interface
- Audit log viewer with filtering
- System settings editor
- Email template customization
- Webhook management UI
- Performance monitoring
- Error tracking integration

**Access:** Navigate to `/admin` (owner/admin roles only)

### Accessibility (WCAG 2.1 AA)

**Full accessibility compliance:**

- Screen reader support with comprehensive ARIA labels
- Keyboard navigation throughout the app
- Focus management and skip links
- Color contrast compliance (4.5:1 minimum)
- Reduced motion support
- High contrast mode
- Resizable text
- Semantic HTML structure

**Keyboard shortcuts:**

- `Cmd+K` - Command palette
- `Cmd+/` - Shortcuts help
- `Esc` - Close modals
- `↑/↓` - Navigate messages
- `Enter` - Send message
- `Ctrl+Enter` - New line

### Testing & Quality

**860+ comprehensive tests:**

- 479 E2E tests (Playwright) covering all user flows
- 381 integration tests
- Unit tests for all hooks and utilities
- Component tests with React Testing Library
- Multi-browser support (Chrome, Firefox, Safari, Mobile, Tablet)
- Accessibility automated testing
- Lighthouse CI for performance monitoring

**Run tests:**

```bash
pnpm test           # Unit + integration
pnpm test:e2e       # E2E tests
pnpm test:coverage  # Coverage report
pnpm lighthouse     # Performance audit
```

### Platform Support

**Multi-platform deployment:**

- Web (Next.js 15 + React 19)
- Desktop (Tauri - lightweight native)
- Desktop (Electron - cross-platform)
- Mobile (Capacitor for iOS/Android)
- Mobile (React Native)
- PWA (installable web app)
- Docker containers
- Kubernetes with Helm charts

**Build commands:**

```bash
pnpm build:web       # Web production
pnpm build:tauri     # Desktop (Tauri)
pnpm build:electron  # Desktop (Electron)
pnpm cap:build       # Mobile (Capacitor)
pnpm build:docker    # Docker image
```

### Performance Optimizations

**Production-ready performance:**

- Bundle size: 103 KB (optimized, gzipped)
- Lighthouse scores: 90+ across all metrics
- Time to Interactive: <3 seconds
- First Contentful Paint: <1 second
- Lazy loading for heavy components
- Virtual scrolling for message lists
- Image optimization (AVIF, WebP)
- Code splitting and tree shaking
- Service worker caching

---

## Breaking Changes

### 1.0.0

**Minimal breaking changes** - mostly additive. New features are opt-in.

1. **TypeScript 5.7+ required** (was 5.0+)
2. **Node.js 20+ required** (was 18+)
3. **New peer dependencies** for optional features (Stripe, WebRTC)

All existing features remain backward compatible.

### 0.3.0

No breaking changes from 0.2.x.

### 0.2.0

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` removed, use `NEXT_PUBLIC_GRAPHQL_URL`
- `NEXT_PUBLIC_WS_URL` now required for WebSocket

**API Changes:**

- GraphQL schema updated with new subscription types
- REST endpoint `/api/messages` removed, use GraphQL

**Configuration:**

- `app_configuration` table schema changed
- Use migration script: `scripts/migrate-config-0.1-to-0.2.js`

**Dependencies:**

- Node.js 20+ now required (was 18+)
- pnpm 9+ now required (was 8+)

---

## Migration Scripts

### Config Migration (0.1.x → 0.2.0)

```javascript
// scripts/migrate-config-0.1-to-0.2.js
const fs = require('fs')

const oldConfig = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))

const newConfig = {
  ...oldConfig,
  features: {
    ...oldConfig.features,
    // New features in 0.2.0
    voiceMessages: true,
    videoMessages: true,
    messageScheduling: true,
    payments: false,
    wallets: false,
  },
  integrations: {
    slack: false,
    github: false,
    jira: false,
    googleDrive: false,
    webhooks: [],
  },
}

fs.writeFileSync('new_config.json', JSON.stringify(newConfig, null, 2))
console.log('Migration complete! New config saved to new_config.json')
```

Run:

```bash
node scripts/migrate-config-0.1-to-0.2.js old_config.json
```

---

## Troubleshooting Upgrades

### Build Fails After Upgrade

```bash
# Clear all caches
rm -rf .next node_modules pnpm-lock.yaml

# Fresh install
pnpm install

# Rebuild
pnpm build
```

### Database Migration Fails

```bash
# Check migration status
cd .backend
nself db migrate status

# Manually fix failed migration
nself db shell
# Then run SQL fixes manually

# Mark migration as complete
nself db migrate resolve --version <version> --mark-as-complete
```

### Configuration Lost After Upgrade

```bash
# Restore from backup
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d @config_backup_20260129.json

# Or restore from localStorage
# In browser console:
localStorage.setItem('app-config', JSON.stringify(configBackup))
```

### Services Won't Start

```bash
# Check backend services
cd .backend
nself doctor

# Restart all services
nself restart

# Check individual service logs
nself logs hasura
nself logs postgres
nself logs auth
```

---

## Version Support Policy

- **Latest version**: Full support with updates and bug fixes
- **Previous minor version**: Security updates only (6 months)
- **Older versions**: No support, upgrade recommended

**Example** (when 0.4.0 releases):

- 0.4.x: Full support
- 0.3.x: Security updates for 6 months
- 0.2.x and earlier: No support

---

## Getting Help

If you encounter issues during upgrade:

1. **Check this guide** for version-specific instructions
2. **Review CHANGELOG.md** for all changes
3. **Search GitHub Issues** for similar problems
4. **Ask in GitHub Discussions** for community help
5. **Email support@nself.org** for critical issues

---

_Always backup before upgrading! When in doubt, test in staging first._
