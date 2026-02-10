# nself-chat Backend Setup Guide

Complete guide for setting up the nself-chat backend infrastructure powered by nSelf CLI.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Environment Configuration](#environment-configuration)
4. [Service URLs](#service-urls)
5. [Database Management](#database-management)
6. [Utility Scripts](#utility-scripts)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Docker | 20.10+ | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.0+ | Included with Docker Desktop |
| nself CLI | 0.9.8+ | [nself.org/docs/installation](https://nself.org/docs/installation) |
| Node.js | 20.0+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.15.4+ | `npm install -g pnpm` |

### System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 20GB free space minimum
- **CPU**: 2 cores minimum (4 cores recommended)
- **OS**: macOS, Linux, or Windows with WSL2

### Verify Installation

```bash
# Check Docker
docker --version
docker compose version

# Check nself CLI
nself version

# Check Node.js and pnpm
node --version
pnpm --version
```

---

## Quick Start

### Step 1: Initialize Backend

```bash
# Navigate to backend directory
cd backend

# Initialize backend (first time only)
./scripts/init.sh
```

This will:
1. Validate prerequisites
2. Create `.env` from `.env.example`
3. Build `docker-compose.yml`
4. Start all services
5. Wait for health checks

### Step 2: Verify Services

```bash
# Check service status
nself status

# View service URLs
nself urls

# View logs
nself logs -f
```

### Step 3: Run Migrations

```bash
# Run database migrations
nself db migrate up

# Verify migration status
nself db migrate status
```

### Step 4: Seed Development Data

```bash
# Load development data
./scripts/seed.sh dev
```

### Step 5: Start Frontend

```bash
# In a new terminal
cd ../frontend/apps/web

# Install dependencies (first time only)
pnpm install

# Start development server
pnpm dev
```

### Step 6: Access Application

Open your browser:

- **Frontend**: http://localhost:3000
- **GraphQL Console**: https://api.local.nself.org/console
- **Admin UI**: https://admin.local.nself.org

---

## Environment Configuration

### Configuration Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env` | Local overrides | ❌ No (gitignored) |
| `.env.example` | Reference documentation | ✅ Yes |
| `.env.dev` | Development defaults | ✅ Yes |
| `.env.staging` | Staging config | ✅ Yes |
| `.env.prod` | Production config | ✅ Yes |
| `.env.secrets` | Secrets (prod) | ❌ No (gitignored) |

### File Loading Order

Later files override earlier:

1. `.env.dev` - Team defaults (shared)
2. `.env.staging` - Staging config (shared)
3. `.env.prod` - Production config (shared)
4. `.env.secrets` - Secrets (not shared)
5. `.env` - Local overrides (not shared)

### Development Configuration

#### Create .env File

If not created automatically, copy from example:

```bash
cp .env.example .env
```

#### Critical Settings

```bash
# Project Configuration
PROJECT_NAME=nself-chat
BASE_DOMAIN=local.nself.org
ENV=dev

# Database
POSTGRES_PASSWORD=postgres-dev-password

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=hasura-admin-secret-dev

# JWT (minimum 32 characters)
HASURA_JWT_KEY=development-secret-key-minimum-32-characters-long

# Optional Services
NSELF_ADMIN_ENABLED=true     # Admin UI
MAILPIT_ENABLED=true         # Email testing
MEILISEARCH_ENABLED=false    # Full-text search
MINIO_ENABLED=false          # S3 storage
REDIS_ENABLED=false          # Cache
```

### Frontend Environment

#### Root .env.local

Create `/nself-chat/.env.local`:

```bash
# Environment
NODE_ENV=development

# Backend URLs (match nSelf CLI)
NEXT_PUBLIC_GRAPHQL_URL=https://api.local.nself.org/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.local.nself.org/v1/auth
NEXT_PUBLIC_STORAGE_URL=https://storage.local.nself.org/v1/storage

# Optional: Enable development mode with test users
NEXT_PUBLIC_USE_DEV_AUTH=true

# App Configuration
NEXT_PUBLIC_APP_NAME=nchat
NEXT_PUBLIC_PRIMARY_COLOR=#6366f1
```

#### Important: URL Format

**✅ Correct Format**:
```bash
NEXT_PUBLIC_GRAPHQL_URL=https://api.local.nself.org/v1/graphql
```

**❌ Incorrect Format**:
```bash
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql  # Wrong domain
```

The backend uses `local.nself.org` with SSL, not `localhost`.

---

## Service URLs

### Development (local.nself.org)

| Service | URL | Description |
|---------|-----|-------------|
| **GraphQL API** | https://api.local.nself.org/v1/graphql | GraphQL endpoint |
| **GraphQL Console** | https://api.local.nself.org/console | Hasura console |
| **Auth** | https://auth.local.nself.org | Authentication API |
| **Storage** | https://storage.local.nself.org | File storage (if MINIO_ENABLED) |
| **Search** | https://search.local.nself.org | Search API (if MEILISEARCH_ENABLED) |
| **Mail UI** | https://mail.local.nself.org | Email testing (if MAILPIT_ENABLED) |
| **Admin** | https://admin.local.nself.org | Admin dashboard (if NSELF_ADMIN_ENABLED) |

### SSL Certificates

Self-signed certificates are automatically created and trusted:

- **Location**: `backend/ssl/`
- **Certificate**: `local.nself.org.crt`
- **Private Key**: `local.nself.org.key`
- **Trusted via**: `/etc/hosts` configuration

If you see SSL warnings in your browser, ensure the certificate is trusted.

---

## Database Management

### Connection Info

```bash
Host: localhost
Port: 5432
Database: nself (or value of POSTGRES_DB)
User: postgres (or value of POSTGRES_USER)
Password: (value of POSTGRES_PASSWORD)
```

### Common Commands

```bash
# Run migrations
nself db migrate up

# Check migration status
nself db migrate status

# Rollback last migration
nself db migrate down

# Open database shell
nself db shell

# Generate TypeScript types
nself db types typescript
```

### Database Shell

```bash
# Open PostgreSQL shell
nself db shell

# Or use Docker directly
docker exec -it $(docker ps -qf "name=postgres") psql -U postgres -d nself
```

### Common Queries

```sql
-- List all tables
\dt

-- Describe table structure
\d nchat_users

-- Count users
SELECT COUNT(*) FROM nchat_users;

-- List channels
SELECT id, name, type FROM nchat_channels;

-- Exit shell
\q
```

---

## Utility Scripts

All scripts are located in `backend/scripts/` and are executable.

### init.sh - Initialize Backend

**Purpose**: First-time setup

**Usage**:
```bash
cd backend
./scripts/init.sh
```

**What it does**:
1. Validates prerequisites (Docker, nself CLI)
2. Creates `.env` from `.env.example`
3. Runs `nself build`
4. Starts all services
5. Waits for health checks
6. Displays service URLs

**When to use**: First time setting up, or after `git clone`

---

### seed.sh - Load Development Data

**Purpose**: Load test data into database

**Usage**:
```bash
cd backend
./scripts/seed.sh [environment]

# Examples
./scripts/seed.sh           # Default (dev)
./scripts/seed.sh dev       # Development data
./scripts/seed.sh test      # Test data
./scripts/seed.sh demo      # Demo data
```

**What it does**:
1. Checks if database is running
2. Loads seed SQL file from `db/seeds/`
3. Verifies data was loaded

**Test Users** (created by dev seed):
- `owner@nself.org` (Owner)
- `admin@nself.org` (Admin)
- `member@nself.org` (Member)

**Password for all**: `password123`

**When to use**: After migrations, or when you need fresh test data

---

### backup.sh - Create Database Backup

**Purpose**: Create compressed database backup

**Usage**:
```bash
cd backend
./scripts/backup.sh [name]

# Examples
./scripts/backup.sh                    # Timestamp backup
./scripts/backup.sh pre-deployment     # Named backup
```

**What it does**:
1. Creates compressed PostgreSQL dump
2. Saves to `backend/_backups/`
3. Creates metadata file
4. Lists recent backups
5. Offers to clean up old backups (keeps last 10)

**Backup files**: `backup-YYYY-MM-DD-HHMMSS.sql.gz`

**When to use**:
- Before deployments
- Before migrations
- Before major changes
- Daily via cron job

---

### restore.sh - Restore from Backup

**Purpose**: Restore database from backup

**Usage**:
```bash
cd backend
./scripts/restore.sh <backup-file>

# Example
./scripts/restore.sh backup-2026-02-10-083000.sql.gz
```

**What it does**:
1. Creates pre-restore backup (safety)
2. Stops all services
3. Drops and recreates database
4. Restores from backup file
5. Restarts all services
6. Verifies restoration

**⚠️ WARNING**: This overwrites all existing data!

**When to use**:
- Recovering from errors
- Rolling back changes
- Moving data between environments

---

### reset.sh - Reset Database

**Purpose**: Reset database to clean state

**Usage**:
```bash
cd backend
./scripts/reset.sh
```

**What it does**:
1. Stops all services
2. Removes all database volumes
3. Removes logs
4. Restarts services with clean state
5. Requires re-running migrations

**⚠️ WARNING**: This deletes ALL data!

**When to use**:
- Fixing corrupted database
- Starting fresh
- Testing migrations from scratch

---

## Troubleshooting

### Backend Won't Start

**Problem**: `nself start` fails

**Solution**:
```bash
# Check Docker is running
docker ps

# Check logs
nself logs

# Run diagnostics
nself doctor

# Force restart
nself stop
nself start
```

---

### "docker-compose.yml not found"

**Problem**: Missing docker-compose.yml

**Solution**:
```bash
# Generate it with nself
cd backend
nself build
```

---

### Database Connection Errors

**Problem**: Frontend can't connect to database

**Solution**:
```bash
# 1. Check PostgreSQL is running
docker ps | grep postgres

# 2. Check PostgreSQL logs
nself logs postgres

# 3. Verify connection string in .env
cat .env | grep POSTGRES_

# 4. Restart PostgreSQL
docker restart $(docker ps -qf "name=postgres")
```

---

### GraphQL Errors

**Problem**: Frontend gets GraphQL errors

**Solution**:
```bash
# 1. Check Hasura is running
docker ps | grep hasura

# 2. Check Hasura logs
nself logs hasura

# 3. Verify admin secret
cat .env | grep HASURA_GRAPHQL_ADMIN_SECRET

# 4. Test GraphQL endpoint
curl https://api.local.nself.org/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'
```

---

### Frontend Can't Connect to Backend

**Problem**: CORS errors or 404s

**Solution**:

1. **Check URLs match**:
   ```bash
   # Backend URLs
   nself urls

   # Frontend URLs (in .env.local)
   cat ../.env.local | grep NEXT_PUBLIC_
   ```

2. **Ensure URLs use correct format**:
   ```bash
   # ✅ Correct
   NEXT_PUBLIC_GRAPHQL_URL=https://api.local.nself.org/v1/graphql

   # ❌ Wrong
   NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
   ```

3. **Restart frontend**:
   ```bash
   cd ../frontend/apps/web
   # Kill dev server (Ctrl+C)
   pnpm dev
   ```

---

### SSL Certificate Warnings

**Problem**: Browser shows SSL warning for local.nself.org

**Solution**:

1. **Check certificate exists**:
   ```bash
   ls -la backend/ssl/
   ```

2. **Trust the certificate** (macOS):
   ```bash
   sudo security add-trusted-cert -d -r trustRoot \
     -k /Library/Keychains/System.keychain \
     backend/ssl/local.nself.org.crt
   ```

3. **Verify /etc/hosts**:
   ```bash
   cat /etc/hosts | grep nself
   ```

   Should include:
   ```
   127.0.0.1 local.nself.org
   127.0.0.1 api.local.nself.org
   127.0.0.1 auth.local.nself.org
   # ... etc
   ```

---

### Services Won't Stop

**Problem**: `nself stop` hangs or fails

**Solution**:
```bash
# Force stop with Docker Compose
cd backend
docker compose down

# Or force remove containers
docker compose down -v --remove-orphans
```

---

### Port Already in Use

**Problem**: Port 5432/8080/4000 already in use

**Solution**:
```bash
# Find what's using the port
lsof -i :5432
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or change port in .env
POSTGRES_PORT=5433  # Use different port
```

---

### Out of Disk Space

**Problem**: Docker volumes fill disk

**Solution**:
```bash
# Remove unused Docker data
docker system prune -a --volumes

# Remove old backups
rm backend/_backups/backup-*.sql.gz

# Remove old logs
rm backend/logs/*.log
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `.env.prod` with production values
- [ ] Change all secrets to strong, unique values
- [ ] Set `HASURA_GRAPHQL_ENABLE_CONSOLE=false`
- [ ] Set `HASURA_GRAPHQL_DEV_MODE=false`
- [ ] Configure CORS domain to production URL
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure database backups (automated)
- [ ] Set up monitoring and alerting
- [ ] Test all endpoints
- [ ] Run security audit

### Generate Production Secrets

```bash
# Generate strong secrets
openssl rand -base64 32

# Example production secrets
POSTGRES_PASSWORD=$(openssl rand -base64 32)
HASURA_GRAPHQL_ADMIN_SECRET=$(openssl rand -base64 32)
HASURA_JWT_KEY=$(openssl rand -base64 32)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)
```

### Production Environment

```bash
# backend/.env.prod
PROJECT_NAME=nself-chat
BASE_DOMAIN=chat.example.com
ENV=prod

# Security (use strong secrets!)
POSTGRES_PASSWORD=<STRONG_PASSWORD>
HASURA_GRAPHQL_ADMIN_SECRET=<STRONG_SECRET>
HASURA_JWT_KEY=<STRONG_JWT_KEY_32_CHARS_MIN>

# Production Settings
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_DEV_MODE=false
HASURA_GRAPHQL_CORS_DOMAIN=https://chat.example.com

# Enable monitoring
MONITORING_ENABLED=true
```

### Deploy to Production

```bash
# 1. Create pre-deployment backup
./scripts/backup.sh pre-deployment

# 2. Pull latest code
git pull origin main

# 3. Build with production config
ENV=prod nself build

# 4. Start services
nself start

# 5. Run migrations
nself db migrate up

# 6. Verify services
nself status
nself urls

# 7. Run health checks
nself doctor
```

### Post-Deployment

```bash
# 1. Monitor logs
nself logs -f

# 2. Check for errors
nself logs | grep ERROR

# 3. Test endpoints
curl https://api.chat.example.com/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# 4. Monitor performance
# Check Grafana dashboards (if monitoring enabled)
```

---

## Additional Resources

### Documentation

- [nself CLI Documentation](https://nself.org/docs)
- [Hasura Documentation](https://hasura.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

### Project Documentation

- [`README.md`](./README.md) - Backend overview
- [`../docs/`](../docs/) - Project documentation
- [`../.claude/CLAUDE.md`](../.claude/CLAUDE.md) - AI assistant context

### Support

- **Issues**: https://github.com/your-org/nself-chat/issues
- **Discussions**: https://github.com/your-org/nself-chat/discussions
- **Discord**: https://discord.gg/your-server

---

## Summary

### Key Commands

```bash
# Start backend
cd backend
nself start

# Check status
nself status

# View URLs
nself urls

# View logs
nself logs -f

# Run migrations
nself db migrate up

# Load seed data
./scripts/seed.sh

# Create backup
./scripts/backup.sh

# Stop backend
nself stop
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)               │
│                  https://local.nself.org                │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌────▼────┐   ┌─────▼─────┐
    │  Hasura   │   │  Auth   │   │  Storage  │
    │ (GraphQL) │   │ (Nhost) │   │  (MinIO)  │
    └─────┬─────┘   └─────────┘   └───────────┘
          │
    ┌─────▼─────┐
    │ PostgreSQL│
    │ (Database)│
    └───────────┘
```

### URL Mapping

| Service | Subdomain | Port | Container |
|---------|-----------|------|-----------|
| GraphQL | api.local.nself.org | 8080 | hasura |
| Auth | auth.local.nself.org | 4000 | auth |
| Storage | storage.local.nself.org | 9000 | minio |
| Search | search.local.nself.org | 7700 | meilisearch |
| Mail | mail.local.nself.org | 8025 | mailpit |
| Admin | admin.local.nself.org | 3021 | nself-admin |

---

**Last Updated**: 2026-02-10
**Version**: 1.0
**Maintained By**: nself-chat Development Team
