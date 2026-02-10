# Secrets Management Guide

Complete guide to managing secrets and credentials in nself-chat across all environments.

## Table of Contents

1. [Overview](#overview)
2. [Global Vault](#global-vault)
3. [Required Secrets](#required-secrets)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Validation](#validation)
6. [Rotation Procedures](#rotation-procedures)
7. [Emergency Recovery](#emergency-recovery)
8. [Best Practices](#best-practices)
9. [Security Checklist](#security-checklist)

---

## Overview

nself-chat uses a multi-layered secrets management approach:

1. **Global Vault** - Shared credentials across all projects (`~/Sites/.claude/vault.env`)
2. **Environment Files** - Environment-specific secrets (`.env.local`, `.env.production`)
3. **CI/CD Secrets** - GitHub Actions secrets for automated deployments
4. **Runtime Secrets** - Injected at runtime in production (Vercel, Docker, K8s)

### Security Principles

- **Never commit secrets** to version control
- **Rotate regularly** - Every 90 days minimum
- **Principle of least privilege** - Only grant necessary permissions
- **Separate by environment** - Dev, staging, and production use different credentials
- **Audit access** - Track who has access to which secrets
- **Encrypt at rest** - Use encrypted storage for backups

---

## Global Vault

### Location

```bash
~/Sites/.claude/vault.env
```

### Purpose

The global vault stores credentials that are:
- Shared across multiple projects
- Personal developer credentials
- CI/CD tokens
- Third-party API keys

### Loading Credentials

```bash
# Load all credentials
source ~/Sites/.claude/vault.env

# Verify loaded
echo $GITHUB_TOKEN
echo $DOCKERHUB_USERNAME
```

### Vault Contents

| Category | Variables | Rotation Frequency |
|----------|-----------|-------------------|
| Docker Hub | `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | 90 days |
| GitHub | `GITHUB_TOKEN`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | 90 days |
| Vercel | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | 90 days |
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | 90 days |
| AWS | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | 90 days |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Never (per-project) |
| Sentry | `SENTRY_AUTH_TOKEN` | 180 days |

### Backup

```bash
# Encrypted backup (use GPG or age)
gpg --symmetric --cipher-algo AES256 ~/Sites/.claude/vault.env

# Store backup in secure location (1Password, Bitwarden, etc.)
# DO NOT store in cloud storage unencrypted
```

---

## Required Secrets

### Core Backend (Required for All Environments)

```bash
# GraphQL & Auth
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Database (Production)
DATABASE_URL=postgres://user:password@host:5432/dbname

# Hasura (Staging/Production)
HASURA_ADMIN_SECRET=minimum-32-characters-long-random-string
JWT_SECRET=minimum-32-characters-long-random-string

# Storage (Production)
STORAGE_ACCESS_KEY=minio-access-key
STORAGE_SECRET_KEY=minio-secret-key-minimum-32-chars
```

**Generate secure secrets:**

```bash
# Generate 32-character alphanumeric
openssl rand -base64 32

# Generate 64-character hex
openssl rand -hex 32

# Generate UUID
uuidgen | tr '[:upper:]' '[:lower:]'
```

### Authentication Providers (Optional)

#### Google OAuth

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

**Rotation:** 90 days or on team member departure

#### GitHub OAuth

```bash
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://github.com/settings/developers
2. Create OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`

**Rotation:** 90 days

#### Microsoft/Azure AD

```bash
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://portal.azure.com
2. Azure Active Directory → App registrations → New registration
3. Add redirect URI: `https://yourdomain.com/api/auth/callback/microsoft`

**Rotation:** 180 days

#### Discord

```bash
NEXT_PUBLIC_DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://discord.com/developers/applications
2. Create application
3. OAuth2 → Add redirect: `http://localhost:3000/api/auth/callback/discord`

**Rotation:** 90 days

#### Slack

```bash
NEXT_PUBLIC_SLACK_CLIENT_ID=123456789012.1234567890123
SLACK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://api.slack.com/apps
2. Create app → OAuth & Permissions
3. Add redirect URL

**Rotation:** 90 days

#### ID.me (Government Verification)

```bash
NEXT_PUBLIC_IDME_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IDME_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://developer.id.me/
2. Register application
3. Production requires verification

**Rotation:** 180 days

### Payment Providers

#### Stripe

```bash
# Test keys (development)
STRIPE_SECRET_KEY=sk_test_EXAMPLE_REPLACE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_EXAMPLE_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_EXAMPLE_REPLACE_ME

# Live keys (production)
STRIPE_SECRET_KEY=sk_live_EXAMPLE_REPLACE_ME
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_EXAMPLE_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_EXAMPLE_REPLACE_ME
```

**Get credentials:**
1. Visit: https://dashboard.stripe.com/apikeys
2. Create restricted keys for production (limit permissions)
3. Configure webhook endpoint: `https://yourdomain.com/api/billing/webhook`

**Rotation:** Never rotate unless compromised (breaks billing)

**Emergency Rotation:**
1. Create new restricted key
2. Update all services
3. Delete old key
4. Update webhook secret

#### Coinbase Commerce (Crypto Payments)

```bash
COINBASE_COMMERCE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
COINBASE_COMMERCE_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://commerce.coinbase.com/dashboard/settings
2. Generate API key
3. Configure webhook: `https://yourdomain.com/api/billing/crypto/webhook`

**Rotation:** 180 days

### Storage & CDN

#### MinIO/S3

```bash
# MinIO (Self-hosted)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin123
STORAGE_BUCKET=nchat-files

# AWS S3 (Production)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=nchat-production-files
AWS_S3_REGION=us-east-1
```

**Get AWS credentials:**
1. Visit: https://console.aws.amazon.com/iam/
2. Create IAM user with S3 access
3. Generate access keys
4. Restrict to specific bucket (principle of least privilege)

**Rotation:** 90 days

**IAM Policy (Least Privilege):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::nchat-production-files/*",
        "arn:aws:s3:::nchat-production-files"
      ]
    }
  ]
}
```

### Email Services

#### SendGrid

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
```

**Get credentials:**
1. Visit: https://app.sendgrid.com/settings/api_keys
2. Create API key with Mail Send permission only
3. Verify domain in SendGrid

**Rotation:** 90 days

#### Resend (Alternative)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get credentials:**
1. Visit: https://resend.com/api-keys
2. Create API key

**Rotation:** 90 days

#### SMTP (Generic)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**Gmail App Password:**
1. Enable 2FA on Google Account
2. Visit: https://myaccount.google.com/apppasswords
3. Generate app password

**Rotation:** 180 days

### Monitoring & Analytics

#### Sentry (Error Tracking)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxxx.ingest.sentry.io/xxxxxxx
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

**Get credentials:**
1. Visit: https://sentry.io/settings/
2. Create new project
3. Get DSN from project settings
4. Generate auth token for sourcemap uploads

**Rotation:** 180 days (auth token), DSN never rotates

#### Google Analytics

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Get credentials:**
1. Visit: https://analytics.google.com/
2. Create new property
3. Get Measurement ID from Data Streams

**Rotation:** Never (public identifier)

### LiveKit (Voice/Video)

```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Generate credentials:**

```bash
# API Key (16 chars hex)
openssl rand -hex 16

# API Secret (32 chars hex)
openssl rand -hex 32
```

**Rotation:** 180 days

### Search (MeiliSearch)

```bash
NEXT_PUBLIC_MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=minimum-32-characters-long-random-string
```

**Generate master key:**

```bash
openssl rand -base64 32
```

**Rotation:** 90 days

### Cache (Redis)

```bash
REDIS_URL=redis://username:password@host:6379
# or
REDIS_URL=rediss://username:password@host:6380  # SSL
```

**For Redis Cloud:**
1. Visit: https://redis.com/try-free/
2. Create database
3. Get connection string

**Rotation:** 90 days

### Code Signing Certificates

#### macOS

```bash
CSC_LINK=/path/to/certificate.p12
CSC_KEY_PASSWORD=your-certificate-password
APPLE_ID=your-apple-id@example.com
APPLE_PASSWORD=xxxx-xxxx-xxxx-xxxx  # App-specific password
APPLE_TEAM_ID=YOUR10CHAR  # 10-character Team ID
```

**Get certificates:**
1. Visit: https://developer.apple.com/account/resources/certificates
2. Create Developer ID Application certificate
3. Download and export as .p12
4. Generate app-specific password: https://appleid.apple.com/account/manage

**Rotation:** Annually (certificate expires)

#### Windows

```bash
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your-certificate-password
```

**Get certificate:**
1. Purchase from SSL.com, DigiCert, Sectigo
2. Generate CSR and submit
3. Download as .pfx

**Rotation:** Annually (certificate expires)

### Social Media Integration

```bash
# Twitter
TWITTER_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Instagram
INSTAGRAM_APP_ID=xxxxxxxxxxxxxxx
INSTAGRAM_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LinkedIn
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption key for tokens
SOCIAL_MEDIA_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Rotation:** 90 days

---

## Environment-Specific Configuration

### Development

**File:** `.env.local`

```bash
# Enable dev mode
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development

# Local services
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Development secrets (minimal)
MEILISEARCH_MASTER_KEY=nchat-search-dev-key-32-chars-long
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret1234567890123456789012

# Optional: Test OAuth (use test apps)
GOOGLE_CLIENT_ID=your-dev-client-id
GOOGLE_CLIENT_SECRET=your-dev-client-secret
```

**Security:**
- Use localhost URLs
- Enable dev auth for faster iteration
- Use test OAuth apps (separate from production)
- Minimal secrets required

### Staging

**File:** `.env.staging`

```bash
# Staging environment
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_USE_DEV_AUTH=false

# Staging services
NEXT_PUBLIC_GRAPHQL_URL=https://api.staging.yourdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.staging.yourdomain.com
NEXT_PUBLIC_STORAGE_URL=https://storage.staging.yourdomain.com

# Staging secrets (separate from production)
HASURA_ADMIN_SECRET=staging-admin-secret-32-chars-long
JWT_SECRET=staging-jwt-secret-32-chars-long
DATABASE_URL=postgres://user:pass@staging-db:5432/nchat_staging

# Test payment providers
STRIPE_SECRET_KEY=sk_test_EXAMPLE_REPLACE_ME
STRIPE_PUBLISHABLE_KEY=pk_test_EXAMPLE_REPLACE_ME

# Staging monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/staging
```

**Security:**
- Use separate credentials from production
- Can use Stripe test mode
- Enable full monitoring
- Validate all integrations

### Production

**File:** `.env.production` (or injected via platform)

```bash
# Production environment
NODE_ENV=production
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_USE_DEV_AUTH=false

# Production services (HTTPS required)
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourdomain.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.yourdomain.com
NEXT_PUBLIC_STORAGE_URL=https://storage.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Production secrets (REQUIRED)
HASURA_ADMIN_SECRET=production-admin-secret-minimum-32-chars
JWT_SECRET=production-jwt-secret-minimum-32-chars
DATABASE_URL=postgres://user:pass@prod-db:5432/nchat

# Storage
STORAGE_ACCESS_KEY=production-access-key
STORAGE_SECRET_KEY=production-secret-key-minimum-32-chars

# Search
MEILISEARCH_MASTER_KEY=production-search-key-minimum-32-chars

# Live payments
STRIPE_SECRET_KEY=sk_live_EXAMPLE_REPLACE_ME
STRIPE_PUBLISHABLE_KEY=pk_live_EXAMPLE_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_EXAMPLE_REPLACE_ME

# Production monitoring (REQUIRED)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/production
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Email (production)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Redis
REDIS_URL=rediss://user:pass@prod-redis:6380

# LiveKit
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=production-api-key
LIVEKIT_API_SECRET=production-api-secret
```

**Security Requirements:**
- ✅ All URLs must use HTTPS (no localhost)
- ✅ `NEXT_PUBLIC_USE_DEV_AUTH` must be `false`
- ✅ All secrets minimum 32 characters
- ✅ Separate credentials from staging/dev
- ✅ Enable monitoring (Sentry, Analytics)
- ✅ Use live payment credentials
- ✅ Validate with `pnpm validate:secrets --env production --strict`

---

## Validation

### Automated Validation

Run validation script before deployment:

```bash
# Validate current environment
pnpm validate:secrets

# Validate specific environment
pnpm validate:secrets --env production

# Strict mode (treat warnings as errors)
pnpm validate:secrets --env production --strict

# Verbose output with values (dev only)
pnpm validate:secrets --verbose

# Save report to file
pnpm validate:secrets --output secrets-report.json
```

### CI/CD Validation Gate

The validation script is integrated into CI/CD workflows:

```yaml
# .github/workflows/deploy-production.yml
- name: Validate Production Secrets
  run: pnpm validate:secrets --env production --strict
  env:
    HASURA_ADMIN_SECRET: ${{ secrets.HASURA_ADMIN_SECRET }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    # ... other secrets
```

**Deployment is blocked if:**
- Required secrets are missing
- Secrets don't meet format requirements
- Using test credentials in production
- Using localhost URLs in production
- Dev auth is enabled in production

### Manual Validation Checklist

Before production deployment:

- [ ] All required secrets are set
- [ ] Secrets are minimum length (32+ chars for sensitive data)
- [ ] No placeholder values (your-*, example, change-me)
- [ ] No localhost URLs in production
- [ ] Dev auth is disabled (`NEXT_PUBLIC_USE_DEV_AUTH=false`)
- [ ] Using live Stripe keys (not test)
- [ ] HTTPS for all external URLs
- [ ] Monitoring is enabled (Sentry, Analytics)
- [ ] Email is configured
- [ ] Database backups are enabled

---

## Rotation Procedures

### Regular Rotation Schedule

| Secret Type | Frequency | Priority |
|-------------|-----------|----------|
| Database passwords | 90 days | Critical |
| API keys | 90 days | High |
| OAuth secrets | 90 days | High |
| Signing certificates | Annually | Medium |
| Webhook secrets | 180 days | Medium |
| Monitoring tokens | 180 days | Low |

### Rotation Steps

#### 1. Database Password

```bash
# 1. Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Connect to database and update
psql $DATABASE_URL -c "ALTER USER nchat_user WITH PASSWORD '$NEW_PASSWORD';"

# 3. Update environment variables
# - Update .env.production
# - Update CI/CD secrets
# - Update Docker secrets
# - Update K8s secrets

# 4. Restart application
kubectl rollout restart deployment/nchat

# 5. Verify connectivity
pnpm validate:secrets --env production

# 6. Update vault backup
```

#### 2. API Keys (Generic)

```bash
# 1. Generate new key in provider dashboard
# 2. Add new key to environment (keep old key active)
# 3. Deploy application with new key
# 4. Verify functionality
# 5. Revoke old key in provider dashboard
# 6. Remove old key from environment
```

#### 3. OAuth Credentials

```bash
# 1. Create new OAuth app in provider dashboard
# 2. Get new client ID and secret
# 3. Add to environment variables (dual-run if possible)
# 4. Deploy
# 5. Verify OAuth flow works
# 6. Delete old OAuth app
# 7. Remove old credentials
```

#### 4. Signing Certificates

```bash
# 1. Generate new certificate (before expiration)
# 2. Add to keychain/certificate store
# 3. Update CSC_LINK to new certificate
# 4. Build and sign application
# 5. Test signed application
# 6. Revoke old certificate (after new one is verified)
```

### Emergency Rotation (Compromised Secret)

**Immediate actions:**

1. **Revoke compromised secret immediately**
   - API keys: Revoke in provider dashboard
   - Database: Change password and kill all sessions
   - OAuth: Delete application

2. **Generate new secret**
   ```bash
   openssl rand -base64 32  # Generate new value
   ```

3. **Update all locations**
   - Environment variables
   - CI/CD secrets
   - Docker secrets
   - Kubernetes secrets
   - Global vault

4. **Deploy ASAP**
   ```bash
   # Deploy with new secrets
   vercel deploy --prod
   # or
   kubectl rollout restart deployment/nchat
   ```

5. **Audit access**
   - Check logs for unauthorized access
   - Review who had access to compromised secret
   - Update access controls

6. **Document incident**
   - Create incident report
   - Update rotation schedule
   - Review security procedures

---

## Emergency Recovery

### Lost Secrets Scenarios

#### Scenario 1: Lost Database Password

**Recovery Steps:**

1. **Access database directly** (requires server access)
   ```bash
   # SSH into database server
   ssh prod-db-server

   # Reset password
   sudo -u postgres psql
   ALTER USER nchat_user WITH PASSWORD 'new-password';
   ```

2. **Update all services**
   - Update DATABASE_URL in all environments
   - Restart services

3. **Verify connectivity**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

#### Scenario 2: Lost Hasura Admin Secret

**Recovery Steps:**

1. **Update in environment**
   ```bash
   # Generate new secret
   NEW_SECRET=$(openssl rand -base64 32)

   # Update in Docker/K8s
   kubectl set env deployment/hasura HASURA_GRAPHQL_ADMIN_SECRET=$NEW_SECRET

   # Restart Hasura
   kubectl rollout restart deployment/hasura
   ```

2. **Update all clients**
   - Update frontend environment variables
   - Update backend services
   - Update CI/CD

#### Scenario 3: Lost OAuth Credentials

**Recovery Steps:**

1. **Regenerate in provider dashboard**
   - Login to OAuth provider
   - Regenerate client secret (keep same client ID if possible)

2. **Update environment**
   ```bash
   # Update secret
   export GOOGLE_CLIENT_SECRET=new-secret

   # Redeploy
   vercel deploy --prod
   ```

3. **Test OAuth flow**

#### Scenario 4: Complete Environment Loss

**Recovery from Vault Backup:**

```bash
# 1. Decrypt vault backup
gpg --decrypt vault.env.gpg > vault.env

# 2. Load credentials
source vault.env

# 3. Regenerate environment files
cat > .env.production << EOF
DATABASE_URL=$DATABASE_URL
HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET
JWT_SECRET=$JWT_SECRET
# ... other secrets
EOF

# 4. Deploy
vercel deploy --prod --env-file .env.production

# 5. Validate
pnpm validate:secrets --env production --strict
```

### Backup & Recovery Procedures

#### 1. Regular Backups

```bash
# Automated backup script (run weekly)
#!/bin/bash

BACKUP_DIR=~/backups/secrets
DATE=$(date +%Y-%m-%d)

# Backup vault
gpg --symmetric --cipher-algo AES256 \
  ~/Sites/.claude/vault.env \
  --output $BACKUP_DIR/vault-$DATE.env.gpg

# Backup project secrets (sanitized - no actual values)
cat .env.production | grep -v "^#" | cut -d= -f1 > $BACKUP_DIR/secrets-list-$DATE.txt

# Store in secure location (1Password, Bitwarden, etc.)
op item create --category=document \
  --title="nself-chat-vault-backup-$DATE" \
  --file=$BACKUP_DIR/vault-$DATE.env.gpg
```

#### 2. Recovery Drills

Run quarterly recovery drills:

```bash
# 1. Simulate lost secrets
unset HASURA_ADMIN_SECRET
unset JWT_SECRET
unset DATABASE_URL

# 2. Recover from backup
gpg --decrypt backup.env.gpg | source

# 3. Validate recovery
pnpm validate:secrets --env production --strict

# 4. Document drill results
```

#### 3. Emergency Contacts

Maintain list of people with access to secrets:

| Role | Name | Access Level | Contact |
|------|------|--------------|---------|
| Lead Dev | [Name] | Full (vault + all environments) | [Email/Phone] |
| DevOps | [Name] | Production + CI/CD | [Email/Phone] |
| Security | [Name] | Audit + rotation | [Email/Phone] |

---

## Best Practices

### 1. Never Commit Secrets to Git

**.gitignore:**

```gitignore
# Environment files
.env
.env*.local
.env.production
.env.staging

# Secrets
*.pem
*.key
*.p12
*.pfx
vault.env
credentials.json

# Backups
*.gpg
backup/
secrets/
```

**Pre-commit hook:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for common secret patterns
if git diff --cached --name-only | xargs grep -E "(password|secret|key|token).*=.*[a-zA-Z0-9]{20,}" 2>/dev/null; then
  echo "❌ Potential secret detected in commit!"
  echo "Remove secrets before committing."
  exit 1
fi

# Check for common filenames
if git diff --cached --name-only | grep -E "(\.env$|vault\.env|credentials|secret)" 2>/dev/null; then
  echo "⚠️  Warning: Committing environment file. Are you sure?"
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### 2. Use Environment Variables

❌ **DON'T:**

```typescript
// Hardcoded secrets
const apiKey = 'sk_live_EXAMPLE_REPLACE_ME'
const dbUrl = 'postgres://user:pass@host/db'
```

✅ **DO:**

```typescript
// Environment variables
const apiKey = process.env.STRIPE_SECRET_KEY
const dbUrl = process.env.DATABASE_URL

// With validation
import { z } from 'zod'

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(20),
  DATABASE_URL: z.string().url(),
})

const env = envSchema.parse(process.env)
```

### 3. Separate by Environment

```bash
# ❌ DON'T use same credentials everywhere
DATABASE_URL=postgres://prod-db/nchat  # Used in dev and prod

# ✅ DO use environment-specific credentials
# .env.local
DATABASE_URL=postgres://localhost/nchat_dev

# .env.production
DATABASE_URL=postgres://prod-db.internal/nchat_prod
```

### 4. Principle of Least Privilege

```bash
# ❌ DON'T use root/admin everywhere
AWS_ACCESS_KEY_ID=AKIA...  # Full admin access

# ✅ DO create restricted IAM users
AWS_ACCESS_KEY_ID=AKIA...  # S3-only, specific bucket
```

### 5. Rotate Regularly

```bash
# Add rotation date to secret name or comments
STRIPE_SECRET_KEY=sk_live_EXAMPLE_REPLACE_ME  # Rotated: 2026-01-15, Next: 2026-04-15
DATABASE_PASSWORD=xxx          # Rotated: 2026-02-01, Next: 2026-05-01
```

### 6. Validate Before Deployment

```bash
# Always validate before deploying
pnpm validate:secrets --env production --strict

# Block deployment on failure
if [ $? -ne 0 ]; then
  echo "❌ Secrets validation failed"
  exit 1
fi
```

### 7. Monitor for Leaks

```bash
# Use tools to scan for leaked secrets
trufflehog git https://github.com/yourorg/nself-chat --only-verified

# GitHub Secret Scanning
# Enable in: Settings → Security & analysis → Secret scanning
```

### 8. Use Secret Managers in Production

```bash
# ❌ DON'T store in .env files in production
.env.production  # Contains actual secrets

# ✅ DO use secret managers
# AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id nchat/prod/db

# HashiCorp Vault
vault kv get secret/nchat/production/database

# Kubernetes Secrets
kubectl create secret generic nchat-secrets \
  --from-literal=db-password=xxx
```

### 9. Audit Access

```bash
# Track who accessed secrets
# AWS CloudTrail for Secrets Manager
# Vault audit logs
# GitHub audit log for repository secrets

# Review quarterly
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=nchat-secrets
```

### 10. Document Everything

Keep this documentation up to date:
- Required secrets list
- Rotation schedule
- Access controls
- Recovery procedures
- Incident response plan

---

## Security Checklist

### Pre-Deployment

- [ ] Run `pnpm validate:secrets --env production --strict`
- [ ] No placeholder values (your-*, example, change-me)
- [ ] All URLs use HTTPS (no localhost)
- [ ] Dev auth disabled (`NEXT_PUBLIC_USE_DEV_AUTH=false`)
- [ ] Using live payment credentials (not test)
- [ ] Minimum 32 characters for sensitive secrets
- [ ] Separate credentials from dev/staging
- [ ] Monitoring enabled (Sentry, Analytics)
- [ ] Secrets not committed to git
- [ ] CI/CD secrets configured

### Post-Deployment

- [ ] Verify application functionality
- [ ] Test OAuth flows
- [ ] Test payment processing
- [ ] Check monitoring dashboards
- [ ] Verify email delivery
- [ ] Test file uploads
- [ ] Check database connectivity
- [ ] Review logs for errors

### Monthly

- [ ] Review access logs
- [ ] Check for expired certificates
- [ ] Scan for leaked secrets
- [ ] Update rotation schedule
- [ ] Review team access

### Quarterly

- [ ] Rotate API keys
- [ ] Rotate database passwords
- [ ] Review and update documentation
- [ ] Conduct recovery drill
- [ ] Audit secret usage
- [ ] Update backup procedures

### Annually

- [ ] Renew code signing certificates
- [ ] Review and update security policies
- [ ] Conduct security audit
- [ ] Update incident response plan
- [ ] Review access controls

---

## Troubleshooting

### Secret Not Found

```bash
# Check if environment variable is set
echo $SECRET_NAME

# Check if loaded from file
source .env.local
echo $SECRET_NAME

# Verify in validation report
pnpm validate:secrets --verbose
```

### Invalid Format

```bash
# Use validation script to identify issue
pnpm validate:secrets --env production

# Common issues:
# - Too short (minimum 32 chars for secrets)
# - Wrong format (check pattern requirements)
# - Contains spaces (quote in .env file)
```

### Localhost URL in Production

```bash
# ❌ This will fail validation:
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql

# ✅ Use production URL:
NEXT_PUBLIC_GRAPHQL_URL=https://api.yourdomain.com/v1/graphql
```

### OAuth Not Working

```bash
# Verify redirect URIs match
# Provider dashboard: http://localhost:3000/api/auth/callback/google
# Environment: NEXT_PUBLIC_APP_URL=http://localhost:3000

# Check client ID format
pnpm validate:secrets --verbose | grep GOOGLE_CLIENT_ID
```

---

## Support

For issues or questions:

1. Check validation output: `pnpm validate:secrets --verbose`
2. Review this documentation
3. Check [Common Issues](../COMMON-ISSUES.md)
4. Contact DevOps team
5. File security incident (if secret compromised)

---

**Last Updated:** 2026-02-09
**Version:** 1.0.0
