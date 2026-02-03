# ɳChat v0.9.1 - Quick Start for Production

**Last Updated**: February 3, 2026
**Status**: Ready for Staging Deployment

---

## 🚀 Quick Deployment Steps

### 1. Email Service Setup (15 minutes)

```bash
# Get SendGrid API Key
# 1. Sign up at https://sendgrid.com/ (free tier: 100 emails/day)
# 2. Create API key with "Mail Send" permissions
# 3. Verify sender email

# Configure Environment
export EMAIL_PROVIDER=sendgrid
export EMAIL_FROM_NAME="nChat"
export EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
export SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"

# Test
tsx scripts/test-email.ts
```

**Reference**: `EMAIL-SETUP.md`

---

### 2. OAuth Providers Setup (30-60 minutes)

Choose providers to enable:

#### Google OAuth (Most Popular)

```bash
# 1. Create OAuth app: https://console.cloud.google.com/
# 2. Get Client ID and Secret
# 3. Set redirect URI: https://yourdomain.com/api/auth/oauth/callback

export NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

#### GitHub OAuth (For Developers)

```bash
# 1. Create OAuth app: https://github.com/settings/developers
# 2. Get Client ID and Secret

export NEXT_PUBLIC_GITHUB_CLIENT_ID="Iv1.xxxxx"
export GITHUB_CLIENT_SECRET="xxxxx"
```

**Reference**: `OAUTH-SETUP-GUIDE.md`

---

### 3. Database Setup

```bash
# Start backend services
cd backend
nself start

# Verify services
nself status

# Expected services:
# ✅ PostgreSQL (port 5432)
# ✅ Hasura GraphQL (port 8080)
# ✅ Nhost Auth (port 4000)
# ✅ MinIO Storage (port 9000)
# ✅ MeiliSearch (port 7700)
```

---

### 4. Environment Configuration

Create `.env.production`:

```bash
# REQUIRED
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Backend (from nself)
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.yourdomain.com/v1/storage

# Email (CRITICAL)
EMAIL_PROVIDER=sendgrid
EMAIL_FROM_NAME=nChat
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
SENDGRID_API_KEY=${SENDGRID_API_KEY}

# OAuth (Choose which to enable)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

NEXT_PUBLIC_GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}

# Security (CRITICAL)
JWT_SECRET=${JWT_SECRET}  # Min 32 chars
HASURA_ADMIN_SECRET=${HASURA_ADMIN_SECRET}  # Min 32 chars

# Optional (for voice/video)
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
```

---

### 5. Build & Deploy

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

---

### 6. Post-Deployment Verification

#### Test Email System

```bash
# Send test password reset
curl -X POST https://yourdomain.com/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check SendGrid dashboard for delivery
# https://app.sendgrid.com/email_activity
```

#### Test OAuth Login

1. Navigate to `https://yourdomain.com/login`
2. Click "Continue with Google" (or other provider)
3. Authorize app
4. Verify redirect back to app
5. Check user created in database

#### Test Voice/Video (if LiveKit configured)

1. Start a call from any channel
2. Verify CallWindow opens
3. Test mute/unmute
4. Test video on/off
5. Test screen share

---

## 🔒 Security Checklist

### Before Production Launch

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (32+ chars)
- [ ] Generate strong Hasura admin secret (32+ chars)
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable CSRF protection
- [ ] Configure CSP headers
- [ ] Set secure cookie flags
- [ ] Enable database RLS policies
- [ ] Review and limit API permissions
- [ ] Set up monitoring/alerting
- [ ] Configure backup strategy
- [ ] Document incident response plan

---

## 📊 Monitoring Setup

### Sentry Error Tracking

```bash
# Already configured in codebase
export NEXT_PUBLIC_SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
export SENTRY_ORG="your-org"
export SENTRY_PROJECT="nchat"
export SENTRY_AUTH_TOKEN="xxx"
```

### Application Monitoring

- [ ] Set up health check endpoint monitoring
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up log aggregation (Datadog, LogDNA)
- [ ] Configure performance monitoring (New Relic, AppDynamics)
- [ ] Set up database monitoring
- [ ] Configure email delivery monitoring

---

## 🎯 Production Readiness Checklist

### Core Features ✅

- [x] Email service (SendGrid)
- [x] OAuth providers (Google, GitHub)
- [x] User authentication
- [x] Password reset
- [x] Email verification
- [x] User profiles
- [x] Channels (public/private)
- [x] Direct messages
- [x] File uploads
- [x] Message search

### Optional Features ⚠️

- [ ] Voice/video calls (requires LiveKit)
- [ ] Live streaming (requires Mux or custom)
- [ ] Screen sharing
- [ ] Push notifications
- [ ] Mobile apps

### Infrastructure ✅

- [x] Database (PostgreSQL)
- [x] GraphQL API (Hasura)
- [x] Authentication (Nhost Auth)
- [x] File storage (MinIO/S3)
- [x] Search (MeiliSearch)

### External Services

- [x] SendGrid (email)
- [ ] LiveKit (voice/video) - Optional
- [ ] Mux (streaming) - Optional
- [ ] Twilio (SMS) - Optional
- [ ] Firebase (push) - Optional

---

## 🆘 Troubleshooting

### Email Not Sending

```bash
# Check SendGrid API key
curl https://api.sendgrid.com/v3/api_keys \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Verify sender email in SendGrid dashboard
# Check email logs: pnpm backend:logs | grep email
```

### OAuth Not Working

```bash
# Verify redirect URI matches exactly
echo $NEXT_PUBLIC_APP_URL/api/auth/oauth/callback

# Check client ID is set
echo $NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Verify OAuth app is not disabled in provider console
```

### Database Connection Issues

```bash
# Check database status
cd backend && nself status

# Restart services
nself stop && nself start

# Check logs
nself logs postgres
nself logs hasura
```

---

## 📞 Support Resources

### Documentation

- Full Setup: `EMAIL-SETUP.md`
- OAuth: `OAUTH-SETUP-GUIDE.md`
- Completion Report: `V0.9.1-COMPLETION-REPORT.md`
- Project README: `README.md`

### External Resources

- SendGrid Docs: https://docs.sendgrid.com/
- LiveKit Docs: https://docs.livekit.io/
- Hasura Docs: https://hasura.io/docs/
- Next.js Docs: https://nextjs.org/docs

### Community

- GitHub Issues: https://github.com/nself/nchat/issues
- Discord: https://discord.gg/nself
- Email: support@nself.org

---

## 🚦 Deployment Status

### Production Ready ✅

- Email service
- OAuth authentication
- Password flows
- Core messaging
- File uploads
- Search

### Needs Configuration ⚠️

- OAuth providers (get API keys)
- Domain authentication
- SSL certificates
- CDN setup

### In Development ❌

- Voice/video calls
- Live streaming
- Push notifications
- Mobile apps

---

## 📈 Scaling Considerations

### For <1000 Users

- Single server deployment OK
- Basic PostgreSQL setup OK
- SendGrid free tier OK

### For 1,000-10,000 Users

- Add read replicas
- Enable CDN
- Upgrade SendGrid plan
- Add caching layer (Redis)

### For 10,000+ Users

- Horizontal scaling
- Database sharding
- Load balancing
- Enterprise SendGrid
- LiveKit self-hosted cluster

---

**Quick Start Guide Version**: 1.0
**Last Tested**: February 3, 2026
**Deployment Time**: ~2 hours (with all services)
