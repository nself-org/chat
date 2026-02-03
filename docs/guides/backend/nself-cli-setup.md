# nself CLI Setup for nchat Backend

**Complete guide to using nself CLI as the backend infrastructure for nchat.**

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Initial Project Setup](#initial-project-setup)
- [Core Commands](#core-commands)
- [Database Management](#database-management)
- [Service Configuration](#service-configuration)
- [Environment Management](#environment-management)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)

---

## Overview

nself CLI v0.9.6 provides a complete self-hosted Backend-as-a-Service platform for nchat, including:

- **PostgreSQL Database** with 60+ extensions
- **Hasura GraphQL Engine** for instant GraphQL API
- **Nhost Authentication** for user management
- **Nginx Reverse Proxy** with SSL support
- **Optional Services**: Redis, MinIO (S3), Search, Functions, MLflow
- **Monitoring Stack**: Prometheus, Grafana, Loki (optional 10-service bundle)
- **Custom Services**: Add your own microservices from 40+ templates

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          nchat FRONTEND                              │
│                   (Next.js 15 + React 19)                            │
├─────────────────────────────────────────────────────────────────────┤
│   ↓ GraphQL queries and mutations                                   │
├─────────────────────────────────────────────────────────────────────┤
│                       nself CLI BACKEND                              │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │              REQUIRED (4 services)                        │      │
│   │   PostgreSQL  ·  Hasura GraphQL  ·  Auth  ·  Nginx       │      │
│   └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │              OPTIONAL (for nchat features)                │      │
│   │   Redis  ·  MinIO  ·  Functions  ·  Admin Dashboard      │      │
│   └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │              MONITORING (optional bundle)                 │      │
│   │   Prometheus · Grafana · Loki · Tempo · Alertmanager     │      │
│   └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Installation

### Prerequisites

- **macOS** 10.15+, **Linux**, or **Windows WSL2**
- **Docker Desktop** 20.10+ (with Docker Compose v2)
- **Bash** 4.0+ (macOS comes with 3.2, but nself handles this)
- **Git** 2.0+
- **Node.js** 20+ (for nchat frontend)

### Install nself CLI

**One-line installer** (coming soon):

```bash
curl -sSL https://install.nself.org | bash
```

**Git clone method** (current):

```bash
# Clone nself repository
git clone https://github.com/acamarata/nself.git ~/Sites/nself
cd ~/Sites/nself

# Make executable
chmod +x bin/nself

# Add to PATH
echo 'export PATH="$HOME/Sites/nself/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Verify Installation

```bash
# Check version
nself version

# Run diagnostics
nself doctor

# Expected output:
# ✅ Docker: 24.0.5
# ✅ Docker Compose: v2.20.2
# ✅ Bash: 5.1.16 (or 3.2 on macOS - still compatible)
# ✅ Git: 2.34.1
# ✅ System: Ready
```

---

## Initial Project Setup

### Quick Start (3 Commands)

```bash
# Navigate to nchat project
cd /Users/admin/Sites/nself-chat

# Create backend directory
mkdir .backend
cd .backend

# Initialize nself project
nself init

# Build configuration
nself build

# Start all services
nself start
```

### Setup Wizard

The `nself init` command provides an interactive wizard:

```
Welcome to nself!

Project name [nchat-backend]: nchat
Domain [local.nself.org]:
Environment [dev]:

Optional Services:
  [x] Redis - Cache and sessions (recommended for nchat)
  [ ] MinIO - S3-compatible storage (for file uploads)
  [ ] Mail - Email service (MailPit for dev)
  [ ] Search - MeiliSearch (for message search)
  [ ] Functions - Serverless runtime
  [ ] MLflow - ML experiment tracking
  [x] Admin - Web dashboard (recommended)

Enable monitoring bundle? [y/N]: n

Custom services (CS_1 through CS_10):
  Add custom service? [y/N]: n

✓ Project initialized successfully!

Next steps:
  nself build    # Generate configuration
  nself start    # Start all services
```

### Recommended Configuration for nchat

Edit `.backend/.env` with these settings:

```bash
# Project Configuration
PROJECT_NAME=nchat
ENV=dev
BASE_DOMAIN=local.nself.org

# PostgreSQL Database
POSTGRES_DB=nchat_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here

# Hasura GraphQL
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret-here
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"your-jwt-secret-min-32-chars-here"}

# Authentication
AUTH_CLIENT_URL=http://localhost:3000  # nchat frontend URL

# Optional Services (recommended for nchat)
REDIS_ENABLED=true                     # For real-time features
NSELF_ADMIN_ENABLED=true               # For backend management
MINIO_ENABLED=true                     # For file uploads (avatars, attachments)
MEILISEARCH_ENABLED=true               # For message search

# Monitoring (optional, useful for production)
MONITORING_ENABLED=false               # Enable in production
```

---

## Core Commands

### Lifecycle Management

```bash
# Start all services
nself start

# Stop all services
nself stop

# Restart all services
nself restart

# Check service status
nself status

# View logs
nself logs                # All services
nself logs postgres       # Specific service
nself logs -f             # Follow logs

# Execute commands in containers
nself exec postgres psql -U postgres
nself exec hasura hasura-cli console

# View service URLs
nself urls

# System diagnostics
nself doctor
nself doctor --fix        # Auto-fix issues
```

### Build and Configuration

```bash
# Rebuild after .env changes
nself build

# Force clean rebuild
nself build --force

# Rebuild specific component
nself build --only nginx
nself build --only compose
```

---

## Database Management

### Schema-First Workflow (Recommended)

```bash
# 1. Create starter schema from template
nself db schema scaffold basic    # Users, profiles, posts
# OR use nchat-specific schema
nself db schema scaffold saas     # Organizations, members, projects

# 2. Edit schema.dbml (or use dbdiagram.io)
# Design your nchat schema with:
# - users table
# - channels table
# - messages table
# - roles and permissions
# etc.

# 3. Apply everything in one command
nself db schema apply schema.dbml
# This does: import → migrate → seed
```

### Migrations

```bash
# Check migration status
nself db migrate status

# Run pending migrations
nself db migrate up

# Create new migration
nself db migrate create add_channels_table

# Rollback last migration
nself db migrate down

# Fresh migration (dev only, destructive!)
nself db migrate fresh
```

### Seeding & Mock Data

```bash
# Seed database (environment-aware)
nself db seed

# Seed only users
nself db seed users
# Local: Creates 20 test users
# Staging: Creates 100 QA users
# Production: Only explicit users from config

# Generate mock data (reproducible)
nself db mock auto --seed 12345
```

### Type Generation

```bash
# Generate TypeScript types from schema
nself db types typescript --output ../src/types/db

# Generate Go structs
nself db types go --output ../backend/models

# Generate Python dataclasses
nself db types python --output ../backend/models
```

### Database Utilities

```bash
# Interactive PostgreSQL shell
nself db shell

# Execute SQL query
nself db query "SELECT * FROM users LIMIT 10"

# Database inspection
nself db inspect              # Overview
nself db inspect size         # Table sizes
nself db inspect slow         # Slow query analysis

# Backup and restore
nself db backup               # Create backup
nself db backup --name pre-migration
nself db restore latest       # Restore from latest backup
```

---

## Service Configuration

### Required Services

Always running (4 containers):

| Service    | Port   | URL                          | Purpose        |
| ---------- | ------ | ---------------------------- | -------------- |
| PostgreSQL | 5432   | Internal                     | Database       |
| Hasura     | 8080   | https://api.local.nself.org  | GraphQL API    |
| Auth       | 4000   | https://auth.local.nself.org | Authentication |
| Nginx      | 80/443 | https://local.nself.org      | Reverse proxy  |

### Optional Services

Enable in `.env` with `SERVICE_ENABLED=true`:

| Service     | Variable              | Port      | URL                               | Purpose               |
| ----------- | --------------------- | --------- | --------------------------------- | --------------------- |
| Redis       | `REDIS_ENABLED`       | 6379      | Internal                          | Cache/sessions        |
| MinIO       | `MINIO_ENABLED`       | 9000/9001 | https://storage.local.nself.org   | S3-compatible storage |
| MeiliSearch | `MEILISEARCH_ENABLED` | 7700      | https://search.local.nself.org    | Full-text search      |
| Admin UI    | `NSELF_ADMIN_ENABLED` | 3021      | https://admin.local.nself.org     | Backend dashboard     |
| Functions   | `FUNCTIONS_ENABLED`   | 3010      | https://functions.local.nself.org | Serverless runtime    |
| MailPit     | `MAILPIT_ENABLED`     | 8025      | https://mail.local.nself.org      | Email testing (dev)   |

**Note:** Port 3021 is used for nself-admin (NOT 3100 which conflicts with Loki).

### Monitoring Bundle

Enable full observability stack (10 services):

```bash
# In .env
MONITORING_ENABLED=true
```

Includes:

- Prometheus (metrics)
- Grafana (dashboards) - https://grafana.local.nself.org
- Loki (log aggregation)
- Promtail (log shipping)
- Tempo (distributed tracing)
- Alertmanager (alerting)
- cAdvisor (container metrics)
- Node Exporter (system metrics)
- PostgreSQL Exporter
- Redis Exporter

---

## Environment Management

### Environment Types

```bash
# Local development
ENV=dev

# Staging/QA
ENV=staging

# Production
ENV=production
```

### Environment-Aware Behavior

| Command         | Local      | Staging                  | Production          |
| --------------- | ---------- | ------------------------ | ------------------- |
| `db mock`       | ✅ Works   | ✅ Works                 | ❌ Blocked          |
| `db reset`      | ✅ Works   | ⚠️ Requires confirmation | ❌ Blocked          |
| `db seed users` | Mock users | QA users                 | Only explicit users |

### Create Environments

```bash
# Create staging environment
nself env create staging staging

# Create production environment
nself env create prod production

# List environments
nself env list

# Switch environment
nself env switch staging
```

Environment configuration is stored in `.environments/`:

```
.backend/
├── .env                    # Local config
├── .environments/
│   ├── staging/
│   │   ├── .env           # Staging config
│   │   ├── .env.secrets   # Staging secrets
│   │   └── server.json    # SSH connection
│   └── prod/
│       ├── .env
│       ├── .env.secrets
│       └── server.json
```

---

## Development Workflow

### Day-to-Day Development

```bash
# Morning: Start backend
cd .backend
nself start

# Check everything is running
nself status

# Open Hasura console for GraphQL development
open https://api.local.nself.org/console

# View real-time logs (in separate terminal)
nself logs -f

# Evening: Stop backend (optional, can leave running)
nself stop
```

### Database Changes

```bash
# 1. Edit schema.dbml or create migration
nself db migrate create add_message_reactions

# 2. Edit the migration file
vim nself/migrations/XXXXXX_add_message_reactions.up.sql

# 3. Run migration
nself db migrate up

# 4. Verify in Hasura console
open https://api.local.nself.org/console

# 5. Generate TypeScript types
nself db types typescript --output ../src/types/db
```

### Adding a Custom Service

```bash
# 1. Edit .env
echo "CS_1=notifications:express-js:3001" >> .env

# 2. Rebuild
nself build

# 3. Service code is generated in services/notifications/

# 4. Customize the service
cd services/notifications
# Edit src/index.js

# 5. Restart to apply changes
nself restart
```

### Connect Frontend to Backend

In nchat's `.env.local`:

```bash
# Backend URLs (via nself CLI)
NEXT_PUBLIC_GRAPHQL_URL=http://api.local.nself.org/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.local.nself.org/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.local.nself.org/v1/storage

# Dev Mode
NEXT_PUBLIC_USE_DEV_AUTH=false  # Use real nself auth
```

GraphQL client setup (already in nchat):

```typescript
// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  headers: {
    'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET || '',
  },
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
```

---

## Troubleshooting

### Services Won't Start

```bash
# 1. Check Docker is running
docker ps

# 2. Run diagnostics
nself doctor

# 3. Check logs
nself logs --tail 50

# 4. Try clean start
nself stop
nself start --fresh
```

### Port Conflicts

```bash
# Check which service is using a port
lsof -i :5432  # PostgreSQL
lsof -i :8080  # Hasura
lsof -i :3000  # Next.js (your frontend)

# Change port in .env
POSTGRES_PORT=5433

# Rebuild and restart
nself build && nself start
```

### Database Connection Issues

```bash
# 1. Check PostgreSQL is healthy
nself status postgres

# 2. Test connection
nself exec postgres psql -U postgres -d nchat_db

# 3. Check Hasura can connect
nself logs hasura

# 4. Verify connection string
nself config show | grep DATABASE_URL
```

### SSL Certificate Issues (macOS)

```bash
# Trust local certificates
nself trust

# Or manually
cd .backend/ssl/certificates/localhost
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain fullchain.pem
```

### nself Command Not Found

```bash
# Check PATH
echo $PATH | grep nself

# Add to PATH (zsh)
echo 'export PATH="$HOME/Sites/nself/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Add to PATH (bash)
echo 'export PATH="$HOME/Sites/nself/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Hasura Console Not Loading

```bash
# 1. Check Hasura is running
nself status hasura

# 2. Check admin secret
nself config show | grep HASURA_GRAPHQL_ADMIN_SECRET

# 3. Restart Hasura
nself restart hasura

# 4. Open console with correct URL
open https://api.local.nself.org/console
```

### Performance Issues

```bash
# 1. Check resource usage
docker stats

# 2. Increase Docker resources
# Docker Desktop → Settings → Resources → Memory (8GB recommended)

# 3. Disable monitoring if not needed
# In .env:
MONITORING_ENABLED=false
nself build && nself restart
```

---

## Quick Reference Card

```bash
# ESSENTIAL COMMANDS
nself start              # Start all services
nself stop               # Stop all services
nself status             # Check service health
nself logs -f            # Follow logs
nself urls               # Show all service URLs

# DATABASE
nself db migrate up      # Run migrations
nself db seed            # Seed database
nself db types typescript # Generate types
nself db shell           # PostgreSQL shell

# DEVELOPMENT
nself build              # Rebuild config
nself restart hasura     # Restart specific service
nself exec postgres psql # Execute in container

# TROUBLESHOOTING
nself doctor             # Run diagnostics
nself doctor --fix       # Auto-fix issues
nself start --fresh      # Clean start
```

---

## Service URLs Reference

After `nself start`, access services at:

| Service         | Local URL                              | Credentials            |
| --------------- | -------------------------------------- | ---------------------- |
| Hasura Console  | https://api.local.nself.org/console    | Admin secret from .env |
| Hasura GraphQL  | https://api.local.nself.org/v1/graphql | API endpoint           |
| Auth Service    | https://auth.local.nself.org/v1/auth   | Auth endpoints         |
| Admin Dashboard | https://admin.local.nself.org          | admin / (from .env)    |
| Grafana         | https://grafana.local.nself.org        | admin / admin          |
| MinIO Console   | https://storage.local.nself.org        | minio / (from .env)    |
| MailPit         | https://mail.local.nself.org           | No auth (dev only)     |
| MeiliSearch     | https://search.local.nself.org         | Master key from .env   |

---

## Next Steps

1. **Read [nself-cli-deployment.md](./nself-cli-deployment.md)** for production deployment
2. **Check nself docs** at `~/Sites/nself/docs/` for advanced features
3. **Set up nchat schema** using the database workflow above
4. **Configure authentication** with Nhost Auth integration

---

## Additional Resources

- **nself GitHub**: https://github.com/acamarata/nself
- **nself Documentation**: ~/Sites/nself/docs/
- **Hasura Docs**: https://hasura.io/docs/
- **Nhost Auth Docs**: https://docs.nhost.io/

---

_Version: 1.0.0 | Date: January 31, 2026 | nself CLI v0.9.6_
