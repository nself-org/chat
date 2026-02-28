# nChat v0.8.0 - Upgrade Guide

**Version:** 0.8.0
**Release Date:** February 1, 2026
**Upgrade Time:** ~15 minutes (web app only)
**Downtime:** None (zero-downtime deployment)

---

## Table of Contents

1. [Pre-Upgrade](#pre-upgrade)
2. [Web Application Upgrade](#web-application-upgrade)
3. [Mobile App Deployment](#mobile-app-deployment)
4. [Desktop App Deployment](#desktop-app-deployment)
5. [Post-Upgrade Verification](#post-upgrade-verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Upgrade

### Prerequisites

Before upgrading, ensure you have:

- [ ] **Node.js 20.0.0+** installed
- [ ] **pnpm 9.15.4+** installed
- [ ] **Git** access to repository
- [ ] **Database backup** (recommended)
- [ ] **Admin access** to deployment environment
- [ ] **Staging environment** for testing (recommended)

### Compatibility Check

Verify your current version is compatible:

```bash
# Check current version
cat package.json | grep version

# v0.7.0 or later required
# If on v0.6.0 or earlier, upgrade to v0.7.0 first
```

**Compatible versions:**

- ✅ v0.7.0 → v0.8.0 (direct upgrade)
- ✅ v0.7.1 → v0.8.0 (direct upgrade)
- ⚠️ v0.6.x → v0.8.0 (upgrade to v0.7.0 first)
- ⚠️ <v0.6.0 → v0.8.0 (upgrade to v0.7.0 first)

### Backup Checklist

Create backups before upgrading:

```bash
# 1. Backup database
pg_dump -h localhost -U postgres nchat > backup-$(date +%Y%m%d).sql

# 2. Backup environment files
cp .env .env.backup
cp .env.local .env.local.backup

# 3. Tag current version in Git
git tag v0.7.0-backup
git push origin v0.7.0-backup

# 4. Backup user uploads (if using local storage)
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz public/uploads/
```

### Review Changes

Read the release documentation:

- [ ] [RELEASE-NOTES.md](./RELEASE-NOTES.md) - What's new
- [ ] [FEATURES.md](./FEATURES.md) - Complete feature list
- [ ] [BREAKING-CHANGES.md](./BREAKING-CHANGES.md) - No breaking changes!
- [ ] [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) - No migrations needed

---

## Web Application Upgrade

### Step 1: Pull Latest Code

```bash
# Navigate to project directory
cd /path/to/nself-chat

# Fetch latest changes
git fetch origin

# Checkout v0.8.0 release
git checkout v0.8.0

# Or checkout main branch
git checkout main
git pull origin main
```

### Step 2: Install Dependencies

```bash
# Install/update dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**Expected output:** All dependencies installed successfully, no errors.

### Step 3: Update Environment Variables (Optional)

Add new optional environment variables for mobile features:

```bash
# Edit .env.local
nano .env.local

# Add optional Firebase config (for mobile analytics)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Add optional Sentry config (for mobile crash reporting)
NEXT_PUBLIC_SENTRY_DSN_IOS=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN_ANDROID=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN_ELECTRON=https://...@sentry.io/...

# Add optional Capacitor config
CAPACITOR_APP_ID=io.nself.chat
CAPACITOR_APP_NAME=nChat
```

**Note:** All these variables are optional. Web app works without them.

### Step 4: Run Tests

Verify everything works before deploying:

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Run tests
pnpm test

# Run E2E tests (optional, requires backend running)
pnpm test:e2e
```

**All tests should pass.** If any fail, investigate before proceeding.

### Step 5: Build Application

```bash
# Build for production
pnpm build

# Verify build succeeded
ls -la .next/
```

**Expected output:** `.next/` directory with built assets.

### Step 6: Deploy (Zero Downtime)

#### Option A: Vercel (Recommended)

```bash
# Deploy to Vercel
pnpm deploy:vercel

# Or using Vercel CLI
vercel --prod
```

**Vercel automatically handles zero-downtime deployments.**

#### Option B: Docker

```bash
# Build Docker image
pnpm build:docker

# Or manually
docker build -t nself-chat:0.8.0 .

# Tag as latest
docker tag nself-chat:0.8.0 nself-chat:latest

# Deploy with zero downtime (rolling update)
docker-compose up -d --no-deps --build web
```

#### Option C: Kubernetes

```bash
# Update image version in deployment
kubectl set image deployment/nchat-web nchat=nself-chat:0.8.0

# Or apply updated manifest
kubectl apply -f deploy/k8s/web-deployment.yaml

# Verify rollout
kubectl rollout status deployment/nchat-web
```

#### Option D: Manual Server

```bash
# Build
pnpm build

# Stop old process (e.g., PM2)
pm2 stop nchat

# Start new process
pm2 start pnpm --name nchat -- start

# Or use reload for zero downtime
pm2 reload nchat
```

### Step 7: Verify Deployment

```bash
# Check application is running
curl https://your-domain.com/api/health

# Expected response: {"status":"ok","version":"0.8.0"}

# Check web interface
curl -I https://your-domain.com

# Expected: HTTP 200 OK
```

### Step 8: Monitor

Monitor the deployment for issues:

```bash
# Watch logs (Vercel)
vercel logs --follow

# Watch logs (Docker)
docker-compose logs -f web

# Watch logs (Kubernetes)
kubectl logs -f deployment/nchat-web

# Watch logs (PM2)
pm2 logs nchat
```

**Monitor for 10-15 minutes to ensure stability.**

---

## Mobile App Deployment

### iOS App Deployment

See detailed guide: [docs/deployment/ios-deployment.md](../../deployment/ios-deployment.md)

**Quick steps:**

```bash
# 1. Build iOS app
cd platforms/capacitor
pnpm run build:ios

# 2. Open in Xcode
pnpm run open:ios

# 3. Archive and upload to App Store Connect
# (Follow Xcode instructions)

# 4. Submit for review
# (Via App Store Connect)
```

**Deployment timeline:**

- Build: ~5 minutes
- Archive: ~10 minutes
- Upload: ~15 minutes
- Review: 1-3 days (Apple review)

### Android App Deployment

See detailed guide: [docs/deployment/android-deployment.md](../../deployment/android-deployment.md)

**Quick steps:**

```bash
# 1. Build Android app
cd platforms/capacitor
pnpm run build:android

# 2. Generate signed bundle
cd android
./gradlew bundleRelease

# 3. Upload to Play Console
# (Upload android/app/build/outputs/bundle/release/app-release.aab)

# 4. Submit for review
# (Via Play Console)
```

**Deployment timeline:**

- Build: ~5 minutes
- Sign: ~2 minutes
- Upload: ~10 minutes
- Review: 1-7 days (Google review)

---

## Desktop App Deployment

See detailed guide: [docs/deployment/desktop-deployment.md](../../deployment/desktop-deployment.md)

**Quick steps:**

```bash
# 1. Build desktop apps
pnpm build:electron

# 2. Builds are in platforms/dist-electron/
ls platforms/dist-electron/

# 3. Upload to GitHub Releases
# (Manual upload or using GitHub CLI)

gh release create v0.8.0 \
  platforms/dist-electron/*.dmg \
  platforms/dist-electron/*.exe \
  platforms/dist-electron/*.AppImage \
  platforms/dist-electron/*.deb \
  platforms/dist-electron/*.rpm

# 4. Users download and install
# Auto-update will notify users
```

**Deployment timeline:**

- Build: ~15 minutes (all platforms)
- Upload: ~10 minutes
- Available immediately

---

## Post-Upgrade Verification

### Automated Tests

Run automated verification:

```bash
# Health check
curl https://your-domain.com/api/health

# API check
curl https://your-domain.com/api/channels

# GraphQL check
curl -X POST https://your-domain.com/api/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

### Manual Verification

Test critical functionality:

- [ ] **Login** - Can you log in?
- [ ] **Channels** - Can you view channels?
- [ ] **Messages** - Can you send messages?
- [ ] **Files** - Can you upload files?
- [ ] **Search** - Does search work?
- [ ] **Settings** - Can you update settings?
- [ ] **Admin** - Can admin access dashboard?

### Performance Check

Verify performance hasn't degraded:

```bash
# Run Lighthouse (if configured)
pnpm lighthouse

# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Monitor resource usage
docker stats nchat  # For Docker
kubectl top pod     # For Kubernetes
```

### User Acceptance Testing

- [ ] **Notify team** about upgrade
- [ ] **Gather feedback** from early users
- [ ] **Monitor support tickets** for issues
- [ ] **Check analytics** for errors

---

## Rollback Procedure

If you need to rollback to v0.7.0:

### Option 1: Git Rollback

```bash
# Checkout previous version
git checkout v0.7.0

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Redeploy
pnpm deploy
```

### Option 2: Docker Rollback

```bash
# Rollback to previous image
docker tag nself-chat:0.7.0 nself-chat:latest
docker-compose up -d --no-deps web

# Or in Kubernetes
kubectl rollout undo deployment/nchat-web
```

### Option 3: Vercel Rollback

```bash
# Rollback to previous deployment
vercel rollback
```

**Note:** No database rollback needed (schema unchanged in v0.8.0).

---

## Troubleshooting

### Common Issues

#### Issue: Build Fails

**Symptom:** `pnpm build` fails with errors

**Solution:**

```bash
# Clear cache
rm -rf .next node_modules

# Reinstall dependencies
pnpm install

# Rebuild
pnpm build
```

#### Issue: Dependency Conflicts

**Symptom:** `pnpm install` shows peer dependency warnings

**Solution:**

```bash
# Use legacy peer deps
pnpm install --legacy-peer-deps

# Or update pnpm
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

#### Issue: Environment Variables Not Working

**Symptom:** Mobile features not working

**Solution:**

```bash
# Verify env vars are set
env | grep NEXT_PUBLIC

# Restart dev server
pnpm dev

# Rebuild for production
pnpm build
```

#### Issue: Mobile Build Fails

**Symptom:** iOS/Android build fails

**Solution:**

```bash
# iOS: Clean and rebuild
cd platforms/capacitor/ios/App
rm -rf Pods Podfile.lock
pod install

# Android: Clean and rebuild
cd platforms/capacitor/android
./gradlew clean build
```

### Getting Help

If you encounter issues:

1. **Check logs:** Review application logs for errors
2. **Search docs:** Check [docs/troubleshooting/](../../troubleshooting/)
3. **GitHub Issues:** Search existing issues
4. **Discord:** Ask in #support channel
5. **Email:** support@nself.org

---

## Upgrade Checklist

Use this checklist to track your upgrade:

### Pre-Upgrade

- [ ] Verify current version (v0.7.0+)
- [ ] Read release documentation
- [ ] Backup database
- [ ] Backup environment files
- [ ] Tag Git repository
- [ ] Test in staging (recommended)

### Upgrade

- [ ] Pull latest code (v0.8.0)
- [ ] Install dependencies
- [ ] Update environment variables (optional)
- [ ] Run tests
- [ ] Build application
- [ ] Deploy web app
- [ ] Verify deployment
- [ ] Monitor logs

### Mobile Deployment (Optional)

- [ ] Build iOS app
- [ ] Submit to App Store
- [ ] Build Android app
- [ ] Submit to Play Store
- [ ] Build desktop apps
- [ ] Upload to GitHub Releases

### Post-Upgrade

- [ ] Verify all features work
- [ ] Check performance
- [ ] Monitor analytics
- [ ] Notify team
- [ ] Gather feedback
- [ ] Update documentation

### Rollback Plan

- [ ] Document rollback procedure
- [ ] Test rollback in staging
- [ ] Keep v0.7.0 backup available

---

## Timeline Estimate

### Web App Only

- **Pre-upgrade:** 10 minutes
- **Upgrade:** 10 minutes
- **Verification:** 10 minutes
- **Total:** ~30 minutes

### Web + Mobile Apps

- **Web upgrade:** 30 minutes
- **iOS build + submit:** 30 minutes
- **Android build + submit:** 30 minutes
- **Desktop build + upload:** 25 minutes
- **Total:** ~2 hours

### Including Review

- **Web upgrade:** 30 minutes (immediate)
- **iOS review:** 1-3 days
- **Android review:** 1-7 days
- **Desktop:** Immediate

---

## Success Criteria

Upgrade is successful when:

- ✅ Web app is running v0.8.0
- ✅ All existing features work
- ✅ No errors in logs
- ✅ Performance is stable
- ✅ Users can access the application
- ✅ Mobile apps submitted (optional)
- ✅ Desktop apps available (optional)

---

## Next Steps

After successful upgrade:

1. **Monitor:** Watch logs and analytics for issues
2. **Communicate:** Notify users about new mobile apps
3. **Document:** Update internal documentation
4. **Optimize:** Configure Firebase and Sentry (optional)
5. **Plan:** Review v0.9.0 roadmap

---

## Support

Need help upgrading?

- **Documentation:** https://docs.nchat.io
- **GitHub:** https://github.com/nself/nself-chat
- **Discord:** https://discord.gg/nchat
- **Email:** support@nself.org

---

**Happy upgrading!** 🚀

---

## Appendix: Deployment Examples

### Example: Vercel Deployment

```bash
# Simple Vercel deployment
cd /path/to/nself-chat
git checkout v0.8.0
vercel --prod

# With environment variables
vercel --prod \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=... \
  -e NEXT_PUBLIC_SENTRY_DSN=...
```

### Example: Docker Deployment

```bash
# Build and deploy with Docker Compose
git checkout v0.8.0
docker-compose down
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f web
```

### Example: Kubernetes Deployment

```bash
# Update deployment
kubectl set image deployment/nchat-web \
  nchat=nself-chat:0.8.0

# Watch rollout
kubectl rollout status deployment/nchat-web

# Verify
kubectl get pods
kubectl logs -f deployment/nchat-web
```

---

**Questions?** Contact support@nself.org
