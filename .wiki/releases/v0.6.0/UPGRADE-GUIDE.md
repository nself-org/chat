# Upgrade Guide: v0.5.0 → v0.6.0

This guide provides step-by-step instructions for upgrading from nself-chat v0.5.0 to v0.6.0.

---

## Overview

**v0.6.0** is a major feature release with **zero breaking changes**. All existing functionality remains unchanged, with 50,000+ lines of new code adding enterprise communication features.

**Upgrade Time:** ~15-30 minutes
**Downtime Required:** ~5 minutes (for database migrations)
**Rollback Complexity:** Low (backward compatible)

---

## Prerequisites

Before upgrading, ensure you have:

- [x] Node.js >= 20.0.0
- [x] pnpm >= 9.15.4
- [x] nself CLI >= 0.4.2
- [x] Database backup created
- [x] Production environment tested in staging
- [x] Team notified of maintenance window

---

## Upgrade Steps

### Step 1: Backup Your Data

**Critical:** Always backup before upgrading.

```bash
# Backup PostgreSQL database
pg_dump -U postgres -d nchat > backup-v0.5.0-$(date +%Y%m%d).sql

# Backup environment files
cp .env.local .env.local.backup
cp .backend/.env .backend/.env.backup
```

### Step 2: Pull Latest Changes

```bash
# Fetch and checkout v0.6.0
git fetch origin
git checkout v0.6.0

# Or pull if on main branch
git pull origin main
```

### Step 3: Update Dependencies

```bash
# Install new dependencies
pnpm install

# Verify installation
pnpm list --depth=0
```

**Expected New Dependencies:**

- `@daily-co/daily-js` - Video conferencing
- `giphy-js-sdk-core` - GIF integration
- `dompurify` - XSS sanitization
- `lowlight` - Code highlighting
- Various UI enhancements

### Step 4: Update Environment Variables

Add optional integration keys to `.env.local`:

```bash
# Copy new variables from example
cat .env.example | grep -A 20 "THIRD-PARTY API KEYS" >> .env.local

# Edit and add your keys (all optional)
nano .env.local
```

**New Optional Variables:**

```bash
# GIF Integration (optional - graceful degradation)
GIPHY_API_KEY=your_giphy_key
TENOR_API_KEY=your_tenor_key

# Video Calling (optional - graceful degradation)
DAILY_API_KEY=your_daily_key

# Slack Integration (optional)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# GitHub Integration (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JIRA Integration (optional)
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret

# Google Drive Integration (optional)
GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_drive_client_secret
```

**Important:** All keys are **optional**. Features degrade gracefully when not configured.

### Step 5: Run Database Migrations

```bash
# Navigate to backend directory
cd .backend

# Run migrations
nself db migrate

# Verify migration success
psql -U postgres -d nchat -c "\dt nchat_*"
```

**Expected New Tables:**

- `nchat_sticker_packs`
- `nchat_stickers`
- `nchat_link_previews`
- `nchat_slack_connections`
- `nchat_github_connections`
- `nchat_jira_connections`
- `nchat_drive_connections`
- `nchat_webhooks`
- `nchat_webhook_events`

### Step 6: Build Production

```bash
# Return to project root
cd ..

# Build for production
pnpm build

# Verify build succeeded
ls -lh .next/
```

**Expected Output:**

- ✅ Zero build errors
- ✅ Zero type errors
- ✅ Optimized bundle sizes

### Step 7: Test in Staging

Before deploying to production, test in staging:

```bash
# Start in production mode
NODE_ENV=production pnpm start

# Run smoke tests
pnpm test:e2e
```

**Test Checklist:**

- [ ] Login/logout works
- [ ] Can send messages
- [ ] Can create channels
- [ ] Voice messages record/playback
- [ ] Video calls connect
- [ ] Stickers appear in picker
- [ ] GIF search works
- [ ] File uploads succeed
- [ ] Presence indicators update

### Step 8: Deploy to Production

#### Option A: Docker Deployment

```bash
# Rebuild Docker image
docker build -t nchat:v0.6.0 .

# Stop existing container
docker stop nchat

# Start new container
docker run -d \
  --name nchat \
  --env-file .env.local \
  -p 3000:3000 \
  nchat:v0.6.0
```

#### Option B: PM2 Deployment

```bash
# Reload with PM2
pm2 reload ecosystem.config.js --update-env

# Check status
pm2 status
pm2 logs nchat
```

#### Option C: Kubernetes Deployment

```bash
# Update image tag
kubectl set image deployment/nchat nchat=nchat:v0.6.0

# Monitor rollout
kubectl rollout status deployment/nchat

# Verify pods
kubectl get pods -l app=nchat
```

#### Option D: Vercel Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or via Git push
git push origin main
```

### Step 9: Verify Deployment

```bash
# Health check
curl http://localhost:3000/api/health

# Version check
curl http://localhost:3000/api/version

# Monitor logs
tail -f logs/nchat.log
```

**Success Criteria:**

- ✅ Application starts without errors
- ✅ Database connections successful
- ✅ All services healthy
- ✅ No console errors
- ✅ Users can login
- ✅ Messages send/receive

### Step 10: Post-Upgrade Tasks

```bash
# Clear Apollo cache (recommended)
# Users will auto-clear on next visit

# Monitor error rates
# Check Sentry dashboard

# Update documentation
# Inform team of new features
```

---

## Configuration Guide

### Enabling Integrations

Each integration requires OAuth credentials. Follow these guides:

#### Slack Integration

1. Visit https://api.slack.com/apps
2. Create new app or select existing
3. Add OAuth scopes: `channels:read`, `chat:write`, `users:read`
4. Install to workspace
5. Copy Client ID and Secret to `.env.local`

#### GitHub Integration

1. Visit https://github.com/settings/developers
2. Create new OAuth App
3. Set callback URL: `https://yourdomain.com/api/integrations/github/callback`
4. Copy Client ID and Secret to `.env.local`

#### JIRA Integration

1. Visit https://developer.atlassian.com/console/myapps/
2. Create new OAuth 2.0 integration
3. Add scopes: `read:jira-work`, `write:jira-work`
4. Copy Client ID and Secret to `.env.local`

#### Google Drive Integration

1. Visit https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Copy Client ID and Secret to `.env.local`

---

## Troubleshooting

### Build Failures

**Issue:** Build fails with module not found

```bash
# Solution: Clear cache and reinstall
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
pnpm build
```

### Database Migration Errors

**Issue:** Migration fails with "table already exists"

```bash
# Solution: Check migration state
psql -U postgres -d nchat -c "SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 5;"

# Manually mark as applied if needed
psql -U postgres -d nchat -c "INSERT INTO migrations (name, applied_at) VALUES ('v0.6.0_integrations', NOW());"
```

### Environment Variable Issues

**Issue:** Application starts but features don't work

```bash
# Solution: Verify environment variables loaded
node -e "console.log(process.env)" | grep GIPHY

# Check .env.local is in correct location
ls -la .env.local

# Restart application
pm2 restart nchat
```

### Performance Issues

**Issue:** Slow page loads after upgrade

```bash
# Solution: Clear browser cache
# Clear Apollo cache on client

# Verify build optimization
pnpm build --analyze
```

---

## Rollback Procedure

If issues occur, rollback to v0.5.0:

```bash
# Step 1: Stop application
pm2 stop nchat

# Step 2: Restore database backup
psql -U postgres -d nchat < backup-v0.5.0-YYYYMMDD.sql

# Step 3: Checkout v0.5.0
git checkout v0.5.0

# Step 4: Reinstall dependencies
rm -rf node_modules
pnpm install

# Step 5: Rebuild
pnpm build

# Step 6: Restart
pm2 start nchat
```

---

## Performance Optimizations

### Recommended Settings

**Apollo Client Cache:**

```typescript
// Already configured in v0.6.0
cache: new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        messages: {
          merge: false,
          keyArgs: ['channelId'],
        },
      },
    },
  },
})
```

**Next.js Configuration:**

```javascript
// next.config.js already optimized
experimental: {
  optimizeCss: true,
  optimizePackageImports: ['@radix-ui/react-icons']
}
```

---

## Security Checklist

After upgrading, verify security:

- [ ] CSRF protection enabled (automatic)
- [ ] XSS prevention active (DOMPurify)
- [ ] SQL injection prevention (ESLint rules)
- [ ] Environment validation enforced
- [ ] Security headers configured
- [ ] OAuth state parameters validated
- [ ] Webhook signatures verified
- [ ] Rate limiting applied

---

## Getting Help

### Support Channels

- **Documentation:** https://docs.nself.org/releases/v0.6.0
- **GitHub Issues:** https://github.com/nself/nself-chat/issues
- **Discord:** https://discord.gg/nself
- **Email:** support@nself.org

### Reporting Issues

If you encounter issues:

1. Check troubleshooting section above
2. Search existing GitHub issues
3. Create new issue with:
   - Upgrade steps completed
   - Error messages/logs
   - Environment details
   - Expected vs actual behavior

---

## Next Steps

After successful upgrade:

1. **Explore New Features** - See [Feature Guide](FEATURE-GUIDE.md)
2. **Configure Integrations** - See [Integration Guide](../../guides/integrations/)
3. **Train Team** - Review new capabilities
4. **Monitor Performance** - Check Sentry dashboard
5. **Plan v0.7.0** - AI & Intelligence features coming soon

---

## Estimated Costs

### Third-Party Services (Optional)

| Service          | Free Tier                    | Paid Plans      |
| ---------------- | ---------------------------- | --------------- |
| Daily.co (Video) | 10,000 minutes/month         | $0.002/minute   |
| Giphy API        | 42 requests/hour             | Enterprise only |
| Tenor API        | Unlimited (with attribution) | Free            |
| Slack API        | Unlimited                    | Free            |
| GitHub API       | 5,000 requests/hour          | Free            |
| JIRA API         | Depends on Jira plan         | Varies          |
| Google Drive API | 20,000 requests/day          | Free            |

**Recommendation:** Start with free tiers, upgrade as needed.

---

## Version Information

**From:** v0.5.0
**To:** v0.6.0
**Release Date:** January 31, 2026
**Upgrade Complexity:** Low (zero breaking changes)
**Downtime:** ~5 minutes

---

**[← Back to Release Notes](RELEASE-NOTES.md)** | **[Feature Guide →](FEATURE-GUIDE.md)**
