# Environment Variables Guide

**Version**: 0.9.2
**Last Updated**: February 10, 2026
**Status**: Production Ready

## Overview

This guide documents all environment variables for nself-chat in both standalone and shared-backend deployments.

## Quick Reference

### Frontend (.env.local)

```bash
# Required
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
NEXT_PUBLIC_ENV=production

# Optional
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage
NEXT_PUBLIC_APP_NAME=nself-chat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
NEXT_PUBLIC_USE_DEV_AUTH=false
NEXT_PUBLIC_COOKIE_DOMAIN=.example.com
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
```

### Backend (.backend/.env)

```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=nself_chat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=your_admin_secret
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"your_jwt_secret"}
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com

# Auth
AUTH_SERVER_URL=http://auth:4000
AUTH_CLIENT_URL=https://chat.example.com
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback
```

## Frontend Environment Variables

### Required Variables

#### NEXT_PUBLIC_GRAPHQL_URL
**Purpose:** GraphQL API endpoint URL

**Format:** `https://domain/v1/graphql`

**Examples:**
```bash
# Standalone
NEXT_PUBLIC_GRAPHQL_URL=https://chat.example.com/v1/graphql

# Shared-backend
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql

# Local development
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/v1/graphql
```

**Used By:**
- Apollo Client configuration
- GraphQL queries/mutations
- Real-time subscriptions

---

#### NEXT_PUBLIC_AUTH_URL
**Purpose:** Authentication service URL

**Format:** `https://domain/v1/auth`

**Examples:**
```bash
# Standalone
NEXT_PUBLIC_AUTH_URL=https://chat.example.com/auth

# Shared-backend
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth

# Local development
NEXT_PUBLIC_AUTH_URL=http://localhost:4000/v1/auth
```

**Used By:**
- Nhost authentication
- Login/signup flows
- Token refresh
- OAuth callbacks

---

#### NEXT_PUBLIC_ENV
**Purpose:** Application environment

**Format:** `development | staging | production`

**Examples:**
```bash
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_ENV=staging
NEXT_PUBLIC_ENV=development
```

**Effects:**
- Enables/disables dev tools
- Determines auth mode
- Affects error reporting
- Changes logging verbosity

**Used By:**
- Environment detection
- Feature flags
- Auth provider selection
- Monitoring configuration

---

### Optional Variables

#### NEXT_PUBLIC_STORAGE_URL
**Purpose:** File storage service URL

**Format:** `https://domain/v1/storage`

**Default:** `${NEXT_PUBLIC_GRAPHQL_URL}/storage`

**Examples:**
```bash
# Standalone
NEXT_PUBLIC_STORAGE_URL=https://chat.example.com/storage

# Shared-backend
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com/v1/storage

# Local development
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000
```

**Used By:**
- File uploads
- Image rendering
- Avatar storage
- Attachment handling

---

#### NEXT_PUBLIC_APP_NAME
**Purpose:** Application display name

**Format:** String

**Default:** `nself-chat`

**Examples:**
```bash
NEXT_PUBLIC_APP_NAME="Team Chat"
NEXT_PUBLIC_APP_NAME="Company Messenger"
NEXT_PUBLIC_APP_NAME="nself-chat"
```

**Used By:**
- Page titles
- Meta tags
- Branding
- Email templates

---

#### NEXT_PUBLIC_PRIMARY_COLOR
**Purpose:** Primary theme color

**Format:** Hex color code

**Default:** `#6366f1` (Indigo)

**Examples:**
```bash
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1  # Indigo
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6  # Blue
NEXT_PUBLIC_PRIMARY_COLOR=#10b981  # Green
NEXT_PUBLIC_PRIMARY_COLOR=#ef4444  # Red
```

**Used By:**
- Theme system
- CSS variables
- Logo generation
- Brand colors

---

#### NEXT_PUBLIC_USE_DEV_AUTH
**Purpose:** Enable development authentication mode

**Format:** `true | false`

**Default:** `false`

**Examples:**
```bash
# Development mode (test users)
NEXT_PUBLIC_USE_DEV_AUTH=true

# Production mode (real auth)
NEXT_PUBLIC_USE_DEV_AUTH=false
```

**Effects:**
- `true`: Uses FauxAuthService with 8 test users
- `false`: Uses real Nhost authentication

**⚠️ WARNING:** Never use `true` in production!

---

#### NEXT_PUBLIC_COOKIE_DOMAIN
**Purpose:** Cookie domain for SSO

**Format:** `.domain.com` (with leading dot)

**Default:** Current domain

**Examples:**
```bash
# Shared across subdomains (SSO enabled)
NEXT_PUBLIC_COOKIE_DOMAIN=.example.com

# Specific subdomain only (no SSO)
NEXT_PUBLIC_COOKIE_DOMAIN=chat.example.com
```

**Used By:**
- Authentication cookies
- Session management
- SSO across apps

---

#### NEXT_PUBLIC_SENTRY_DSN
**Purpose:** Sentry error tracking DSN

**Format:** `https://[key]@[org].ingest.sentry.io/[project]`

**Default:** None (monitoring disabled)

**Examples:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
```

**Used By:**
- Error tracking
- Performance monitoring
- Session replay

---

#### NEXT_PUBLIC_RELEASE_VERSION
**Purpose:** Application version for Sentry

**Format:** SemVer string

**Default:** None

**Examples:**
```bash
NEXT_PUBLIC_RELEASE_VERSION=0.9.2
NEXT_PUBLIC_RELEASE_VERSION=1.0.0
```

**Used By:**
- Sentry release tracking
- Error grouping
- Version comparisons

---

#### NEXT_PUBLIC_APP_ROLE
**Purpose:** Hasura role for app-specific permissions

**Format:** String

**Default:** `user`

**Examples:**
```bash
# For nself-chat
NEXT_PUBLIC_APP_ROLE=nchat_user

# For notes app
NEXT_PUBLIC_APP_ROLE=notes_user

# For tasks app
NEXT_PUBLIC_APP_ROLE=tasks_user
```

**Used By:**
- Hasura permissions
- GraphQL queries
- Data isolation (shared-backend)

---

## Backend Environment Variables

### Database Variables

#### POSTGRES_HOST
**Purpose:** PostgreSQL server hostname

**Format:** Hostname or IP

**Default:** `postgres`

**Examples:**
```bash
# Docker service name
POSTGRES_HOST=postgres

# Managed database
POSTGRES_HOST=db.example.com

# IP address
POSTGRES_HOST=10.0.1.5
```

---

#### POSTGRES_PORT
**Purpose:** PostgreSQL server port

**Format:** Integer

**Default:** `5432`

**Examples:**
```bash
POSTGRES_PORT=5432
POSTGRES_PORT=5433
```

---

#### POSTGRES_DB
**Purpose:** Database name

**Format:** String

**Default:** `nself_chat`

**Examples:**
```bash
# Standalone
POSTGRES_DB=nself_chat

# Shared-backend
POSTGRES_DB=shared_backend
```

---

#### POSTGRES_USER
**Purpose:** Database username

**Format:** String

**Default:** `postgres`

**Examples:**
```bash
POSTGRES_USER=postgres
POSTGRES_USER=nself_admin
```

---

#### POSTGRES_PASSWORD
**Purpose:** Database password

**Format:** String

**Default:** None (must be set!)

**Examples:**
```bash
POSTGRES_PASSWORD=your_secure_password_here
```

**⚠️ SECURITY:**
- Use strong passwords (20+ characters)
- Include uppercase, lowercase, numbers, symbols
- Never commit to version control
- Rotate regularly (quarterly)

**Generation:**
```bash
# Generate secure password
openssl rand -base64 32
```

---

### Hasura Variables

#### HASURA_GRAPHQL_ADMIN_SECRET
**Purpose:** Admin secret for Hasura console

**Format:** String (32+ characters recommended)

**Default:** None (must be set!)

**Examples:**
```bash
HASURA_GRAPHQL_ADMIN_SECRET=your_admin_secret_here
```

**⚠️ SECURITY:**
- Keep secret (full database access)
- Never expose in frontend
- Rotate regularly
- Use in CI/CD only

**Generation:**
```bash
openssl rand -hex 32
```

---

#### HASURA_GRAPHQL_JWT_SECRET
**Purpose:** JWT verification configuration

**Format:** JSON string

**Default:** None (must be set!)

**Examples:**
```bash
# HS256 (shared secret)
HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256","key":"your_jwt_secret_at_least_32_characters_long"}'

# RS256 (public key)
HASURA_GRAPHQL_JWT_SECRET='{"type":"RS256","key":"-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"}'
```

**Key Requirements:**
- HS256: Minimum 32 characters
- Must match Nhost Auth configuration
- Format as valid JSON

**Generation:**
```bash
# Generate HS256 secret
openssl rand -base64 48
```

---

#### HASURA_GRAPHQL_CORS_DOMAIN
**Purpose:** Allowed CORS origins

**Format:** Comma-separated URLs

**Default:** `*` (allow all - not recommended)

**Examples:**
```bash
# Single app (standalone)
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com

# Multiple apps (shared-backend)
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com,https://notes.example.com,https://tasks.example.com

# Development
HASURA_GRAPHQL_CORS_DOMAIN=http://localhost:3000,https://chat.example.com
```

---

#### HASURA_GRAPHQL_ENABLE_CONSOLE
**Purpose:** Enable Hasura console

**Format:** `true | false`

**Default:** `false`

**Examples:**
```bash
# Development
HASURA_GRAPHQL_ENABLE_CONSOLE=true

# Production
HASURA_GRAPHQL_ENABLE_CONSOLE=false
```

**⚠️ SECURITY:** Always `false` in production!

---

#### HASURA_GRAPHQL_UNAUTHORIZED_ROLE
**Purpose:** Default role for unauthenticated users

**Format:** String

**Default:** None

**Examples:**
```bash
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=anonymous
HASURA_GRAPHQL_UNAUTHORIZED_ROLE=guest
```

---

### Auth Variables

#### AUTH_SERVER_URL
**Purpose:** Internal auth service URL

**Format:** `http://service:port`

**Default:** `http://auth:4000`

**Examples:**
```bash
# Docker service
AUTH_SERVER_URL=http://auth:4000

# External service
AUTH_SERVER_URL=https://auth.example.com
```

**Note:** Used by backend services, not frontend.

---

#### AUTH_CLIENT_URL
**Purpose:** Public-facing auth URL

**Format:** `https://domain`

**Default:** None (must be set!)

**Examples:**
```bash
# Standalone
AUTH_CLIENT_URL=https://chat.example.com

# Shared-backend
AUTH_CLIENT_URL=https://auth.example.com
```

---

#### AUTH_REDIRECT_URL
**Purpose:** OAuth callback URLs

**Format:** Comma-separated URLs

**Default:** None (must be set!)

**Examples:**
```bash
# Single app
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback

# Multiple apps (shared-backend)
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback,https://notes.example.com/auth/callback,https://tasks.example.com/auth/callback
```

---

#### AUTH_JWT_SECRET
**Purpose:** JWT signing secret

**Format:** String (32+ characters)

**Default:** None (must be set!)

**Examples:**
```bash
AUTH_JWT_SECRET=your_jwt_secret_at_least_32_characters_long
```

**⚠️ Must match `HASURA_GRAPHQL_JWT_SECRET` key!**

**Generation:**
```bash
openssl rand -base64 48
```

---

### Storage Variables

#### MINIO_ROOT_USER
**Purpose:** MinIO admin username

**Format:** String

**Default:** `minioadmin`

**Examples:**
```bash
MINIO_ROOT_USER=admin
MINIO_ROOT_USER=minio_admin
```

---

#### MINIO_ROOT_PASSWORD
**Purpose:** MinIO admin password

**Format:** String (8+ characters)

**Default:** `minioadmin` (change immediately!)

**Examples:**
```bash
MINIO_ROOT_PASSWORD=your_secure_minio_password
```

**⚠️ SECURITY:** Change default password!

---

### Redis Variables

#### REDIS_HOST
**Purpose:** Redis server hostname

**Format:** Hostname or IP

**Default:** `redis`

**Examples:**
```bash
REDIS_HOST=redis
REDIS_HOST=redis.example.com
```

---

#### REDIS_PORT
**Purpose:** Redis server port

**Format:** Integer

**Default:** `6379`

**Examples:**
```bash
REDIS_PORT=6379
```

---

#### REDIS_PASSWORD
**Purpose:** Redis authentication password

**Format:** String

**Default:** None (no auth)

**Examples:**
```bash
REDIS_PASSWORD=your_redis_password
```

---

### Monitoring Variables

#### SENTRY_ORG
**Purpose:** Sentry organization slug

**Format:** String

**Default:** None

**Examples:**
```bash
SENTRY_ORG=your-organization
```

---

#### SENTRY_PROJECT
**Purpose:** Sentry project slug

**Format:** String

**Default:** None

**Examples:**
```bash
SENTRY_PROJECT=nself-chat
```

---

#### SENTRY_AUTH_TOKEN
**Purpose:** Sentry API token for releases

**Format:** String

**Default:** None

**Examples:**
```bash
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

**Permissions Required:**
- `project:releases`
- `project:write`

---

## Environment-Specific Configurations

### Local Development

**Frontend** (`.env.local`):
```bash
# Backend URLs (local)
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://localhost:4000/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://localhost:9000

# Environment
NEXT_PUBLIC_ENV=development
NODE_ENV=development

# Dev mode (test users)
NEXT_PUBLIC_USE_DEV_AUTH=true

# Application
NEXT_PUBLIC_APP_NAME=nself-chat (Dev)
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1

# Optional: Disable monitoring in dev
# NEXT_PUBLIC_SENTRY_DSN=
```

**Backend** (`.backend/.env`):
```bash
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nself_chat_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dev_password

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=dev_admin_secret
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"dev_jwt_secret_at_least_32_chars"}
HASURA_GRAPHQL_ENABLE_CONSOLE=true
HASURA_GRAPHQL_CORS_DOMAIN=http://localhost:3000

# Auth
AUTH_SERVER_URL=http://localhost:4000
AUTH_CLIENT_URL=http://localhost:3000
AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
AUTH_JWT_SECRET=dev_jwt_secret_at_least_32_chars
```

### Staging

**Frontend** (`.env.staging`):
```bash
# Backend URLs (staging)
NEXT_PUBLIC_GRAPHQL_URL=https://staging-api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://staging-auth.example.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://staging-storage.example.com

# Environment
NEXT_PUBLIC_ENV=staging
NODE_ENV=production

# Real auth (no dev mode)
NEXT_PUBLIC_USE_DEV_AUTH=false

# Application
NEXT_PUBLIC_APP_NAME=nself-chat (Staging)
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
NEXT_PUBLIC_RELEASE_VERSION=0.9.2-staging
```

**Backend** (`.backend/.env.staging`):
```bash
# Database (managed)
POSTGRES_HOST=staging-db.example.com
POSTGRES_PORT=5432
POSTGRES_DB=nself_chat_staging
POSTGRES_USER=staging_user
POSTGRES_PASSWORD=[secure_password]

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=[secure_secret]
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"[secure_jwt_secret]"}
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_CORS_DOMAIN=https://staging-chat.example.com

# Auth
AUTH_SERVER_URL=http://auth:4000
AUTH_CLIENT_URL=https://staging-auth.example.com
AUTH_REDIRECT_URL=https://staging-chat.example.com/auth/callback
AUTH_JWT_SECRET=[secure_jwt_secret]
```

### Production

**Frontend** (`.env.production`):
```bash
# Backend URLs (production)
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.example.com

# Environment
NEXT_PUBLIC_ENV=production
NODE_ENV=production

# Real auth only
NEXT_PUBLIC_USE_DEV_AUTH=false

# Application
NEXT_PUBLIC_APP_NAME=nself-chat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1

# Cookie domain (for SSO)
NEXT_PUBLIC_COOKIE_DOMAIN=.example.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
NEXT_PUBLIC_RELEASE_VERSION=0.9.2
SENTRY_ORG=your-org
SENTRY_PROJECT=nself-chat
SENTRY_AUTH_TOKEN=[sentry_token]
```

**Backend** (`.backend/.env.production`):
```bash
# Database (managed, replicated)
POSTGRES_HOST=prod-db.example.com
POSTGRES_PORT=5432
POSTGRES_DB=nself_chat_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=[very_secure_password]

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=[very_secure_secret]
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"[very_secure_jwt_secret]"}
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com,https://notes.example.com,https://tasks.example.com

# Auth (multiple apps)
AUTH_SERVER_URL=http://auth:4000
AUTH_CLIENT_URL=https://auth.example.com
AUTH_REDIRECT_URL=https://chat.example.com/auth/callback,https://notes.example.com/auth/callback,https://tasks.example.com/auth/callback
AUTH_JWT_SECRET=[very_secure_jwt_secret]

# Storage
MINIO_ROOT_USER=prod_admin
MINIO_ROOT_PASSWORD=[secure_minio_password]

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=[secure_redis_password]
```

## Security Best Practices

### 1. Never Commit Secrets

**Create `.gitignore` entries:**
```gitignore
.env
.env.local
.env.*.local
.env.production
.backend/.env
```

### 2. Use Strong Passwords

**Requirements:**
- Minimum 32 characters for secrets
- Include uppercase, lowercase, numbers, symbols
- Use password generator

**Generate secure passwords:**
```bash
# 32-character alphanumeric
openssl rand -base64 32

# 64-character hex
openssl rand -hex 64

# Strong password with symbols
LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*' </dev/urandom | head -c 32
```

### 3. Rotate Secrets Regularly

**Rotation Schedule:**
- Database passwords: Quarterly
- Admin secrets: Quarterly
- JWT secrets: Annually
- API tokens: As needed

**Rotation Process:**
1. Generate new secret
2. Update in environment
3. Restart services
4. Revoke old secret
5. Document change

### 4. Use Secret Management

**Options:**
- **Vercel**: Project Settings → Environment Variables
- **Docker Secrets**: `docker secret create`
- **Kubernetes Secrets**: `kubectl create secret`
- **HashiCorp Vault**: Full secret management
- **AWS Secrets Manager**: AWS-hosted secrets

**Example (Kubernetes):**
```bash
# Create secret
kubectl create secret generic app-secrets \
  --from-literal=postgres-password=your_password \
  --from-literal=hasura-admin-secret=your_secret

# Reference in deployment
env:
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: postgres-password
```

### 5. Validate Environment Variables

**Startup validation** (`src/lib/validate-env.ts`):

```typescript
const requiredEnvVars = [
  'NEXT_PUBLIC_GRAPHQL_URL',
  'NEXT_PUBLIC_AUTH_URL',
  'NEXT_PUBLIC_ENV',
]

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}`
    )
  }
}
```

## Troubleshooting

### Issue: Variables not loading

**Solution:**
```bash
# Check file exists
ls -la .env.local

# Check file contents
cat .env.local

# Restart dev server
pnpm dev

# Check in app
console.log(process.env.NEXT_PUBLIC_GRAPHQL_URL)
```

### Issue: CORS errors

**Check:**
```bash
# Verify CORS domain matches
echo $HASURA_GRAPHQL_CORS_DOMAIN

# Test CORS
curl -I -X OPTIONS https://api.example.com/v1/graphql \
  -H "Origin: https://chat.example.com"
```

### Issue: Auth not working

**Verify:**
```bash
# Check URLs match
echo $NEXT_PUBLIC_AUTH_URL
echo $AUTH_CLIENT_URL

# Verify JWT secrets match
echo $HASURA_GRAPHQL_JWT_SECRET
echo $AUTH_JWT_SECRET
```

## Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Hasura Environment Variables](https://hasura.io/docs/latest/deployment/graphql-engine-flags/)
- [Nhost Environment Variables](https://docs.nhost.io/platform/environment-variables)

---

**Related Guides:**
- [Standalone Deployment](./Standalone-Deployment.md)
- [Shared-Backend Deployment](./Shared-Backend-Deployment.md)
- [Subdomain Routing](./Subdomain-Routing.md)
