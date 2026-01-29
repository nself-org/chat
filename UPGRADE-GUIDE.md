# ɳChat Upgrade Guide

**Current Version**: 0.3.0
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

| From Version | To Version | Direct Upgrade | Notes |
|-------------|------------|----------------|-------|
| 0.1.x | 0.2.0 | ✅ Yes | Database migration required |
| 0.2.x | 0.3.0 | ✅ Yes | Configuration migration |
| 0.1.x | 0.3.0 | ⚠️ Via 0.2.0 | Upgrade to 0.2.0 first |

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

## Breaking Changes

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

*Always backup before upgrading! When in doubt, test in staging first.*
