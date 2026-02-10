# nself CLI Deployment Guide for nchat

**Complete guide to deploying nchat backend using nself CLI to staging and production.**

---

## Table of Contents

- [Overview](#overview)
- [Deployment Architecture](#deployment-architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Deployment Strategies](#deployment-strategies)
- [Cloud Providers](#cloud-providers)
- [Database Migrations](#database-migrations)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

nself CLI provides zero-downtime deployment to remote servers via SSH. This guide covers:

- Setting up staging and production environments
- Deploying nchat backend to remote servers
- Database migration management across environments
- Monitoring and rollback procedures

### Deployment Flow

```
Local Development
       ↓
  nself build (generate configs)
       ↓
  nself deploy staging (SSH deployment)
       ↓
  Test on staging
       ↓
  nself deploy production (production deployment)
       ↓
  Monitor with Grafana/Prometheus
```

---

## Deployment Architecture

### What Gets Deployed

```
Remote Server
├── /opt/nself/nchat/               # Deployment path
│   ├── docker-compose.yml          # Service definitions
│   ├── .env                        # Environment config
│   ├── .env.secrets                # Sensitive credentials
│   ├── nginx/                      # Nginx configs + SSL
│   ├── postgres/                   # Database init scripts
│   ├── services/                   # Custom services (if any)
│   ├── monitoring/                 # Monitoring configs
│   └── ssl/                        # SSL certificates
│
└── Docker Services (running)
    ├── postgres                    # PostgreSQL database
    ├── hasura                      # GraphQL engine
    ├── auth                        # Authentication
    ├── nginx                       # Reverse proxy
    ├── redis (optional)            # Cache
    ├── minio (optional)            # Storage
    ├── prometheus (optional)       # Metrics
    ├── grafana (optional)          # Dashboards
    └── ...
```

### Excluded from Deployment

- Frontend applications (deploy separately to Vercel/Netlify/CDN)
- Local development files (.git, node_modules, etc.)
- Build artifacts
- Temporary files

---

## Prerequisites

### Local Machine

- nself CLI installed
- SSH key pair generated
- Git repository (for rollbacks)

### Remote Server

Minimum requirements:

| Resource | Staging                               | Production |
| -------- | ------------------------------------- | ---------- |
| CPU      | 2 cores                               | 4+ cores   |
| RAM      | 4GB                                   | 8GB+       |
| Storage  | 20GB                                  | 50GB+      |
| OS       | Ubuntu 20.04+, Debian 11+, or RHEL 8+ | Same       |

**Required Software** (installed automatically by nself):

- Docker Engine 20.10+
- Docker Compose v2
- Git

**Network Requirements**:

- SSH access (port 22 or custom)
- Inbound ports: 80 (HTTP), 443 (HTTPS)
- Outbound access for Docker image pulls

---

## Environment Setup

### 1. Generate SSH Key (if needed)

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "deploy@nchat" -f ~/.ssh/nchat-deploy

# Or RSA key
ssh-keygen -t rsa -b 4096 -C "deploy@nchat" -f ~/.ssh/nchat-deploy
```

### 2. Add SSH Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/nchat-deploy.pub user@your-server.com

# Or manually
cat ~/.ssh/nchat-deploy.pub
# Paste into server's ~/.ssh/authorized_keys
```

### 3. Create Environment Configurations

```bash
cd .backend

# Create staging environment
nself env create staging staging

# Create production environment
nself env create prod production
```

This creates:

```
.backend/.environments/
├── staging/
│   ├── .env
│   ├── .env.secrets
│   └── server.json
└── prod/
    ├── .env
    ├── .env.secrets
    └── server.json
```

### 4. Configure Server Connection

Edit `.backend/.environments/staging/server.json`:

```json
{
  "host": "staging.nchat.example.com",
  "port": 22,
  "user": "deploy",
  "key": "~/.ssh/nchat-deploy",
  "deploy_path": "/opt/nself/nchat"
}
```

Edit `.backend/.environments/prod/server.json`:

```json
{
  "host": "nchat.example.com",
  "port": 22,
  "user": "deploy",
  "key": "~/.ssh/nchat-deploy",
  "deploy_path": "/opt/nself/nchat"
}
```

### 5. Configure Environment Variables

**Staging** (`.environments/staging/.env`):

```bash
# Project Configuration
PROJECT_NAME=nchat-staging
ENV=staging
BASE_DOMAIN=staging.nchat.example.com

# Database
POSTGRES_DB=nchat_staging
POSTGRES_USER=postgres
# POSTGRES_PASSWORD in .env.secrets

# Hasura
# HASURA_GRAPHQL_ADMIN_SECRET in .env.secrets
HASURA_GRAPHQL_ENABLE_CONSOLE=true  # Enable for staging

# Auth
AUTH_CLIENT_URL=https://staging.nchat.example.com

# Optional Services
REDIS_ENABLED=true
MINIO_ENABLED=true
MEILISEARCH_ENABLED=true
NSELF_ADMIN_ENABLED=true

# Monitoring (recommended for staging)
MONITORING_ENABLED=true
```

**Production** (`.environments/prod/.env`):

```bash
# Project Configuration
PROJECT_NAME=nchat
ENV=production
BASE_DOMAIN=nchat.example.com

# Database
POSTGRES_DB=nchat_production
POSTGRES_USER=postgres
# POSTGRES_PASSWORD in .env.secrets

# Hasura
# HASURA_GRAPHQL_ADMIN_SECRET in .env.secrets
HASURA_GRAPHQL_ENABLE_CONSOLE=false  # DISABLE in production
HASURA_GRAPHQL_DEV_MODE=false

# Auth
AUTH_CLIENT_URL=https://nchat.example.com
AUTH_EMAIL_VERIFICATION_REQUIRED=true
AUTH_MFA_ENABLED=true

# Optional Services
REDIS_ENABLED=true
MINIO_ENABLED=true
MEILISEARCH_ENABLED=true
NSELF_ADMIN_ENABLED=false  # Disable admin UI in production

# Monitoring (REQUIRED for production)
MONITORING_ENABLED=true
```

### 6. Configure Secrets

Edit `.environments/staging/.env.secrets`:

```bash
# Database
POSTGRES_PASSWORD=<strong-random-password>

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=<strong-random-secret>
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"<min-32-char-secret>"}

# Auth
AUTH_JWT_SECRET=<strong-random-secret>

# MinIO
MINIO_ROOT_PASSWORD=<strong-random-password>

# Redis
REDIS_PASSWORD=<strong-random-password>

# Admin (if enabled)
ADMIN_PASSWORD=<strong-random-password>
```

**Important**: Never commit `.env.secrets` to Git!

---

## Staging Deployment

### Pre-Flight Checklist

```bash
# 1. Verify SSH access
ssh -i ~/.ssh/nchat-deploy deploy@staging.nchat.example.com

# 2. Check deployment configuration
nself deploy staging --dry-run

# 3. Verify local build works
nself build
```

### Deploy to Staging

```bash
# Switch to staging environment
nself env switch staging

# Deploy
nself deploy staging

# Or with explicit environment
nself deploy staging --check-access
```

### Deployment Steps (Automatic)

1. **Local Build** - Generates docker-compose.yml and configs
2. **SSH Connection** - Connects to staging server
3. **Create Directories** - Sets up deployment path
4. **Sync Files** - Transfers configs, scripts, SSL certs
5. **Install Dependencies** - Ensures Docker is installed
6. **Pull Images** - Downloads Docker images
7. **Start Services** - Runs `docker compose up -d --force-recreate`
8. **Health Checks** - Verifies services are healthy

### Post-Deployment Verification

```bash
# Check deployment status
nself deploy status staging

# View deployment logs
nself deploy logs staging

# Health check
nself deploy health staging

# Check service URLs
nself urls --env staging
```

Access staging services:

- GraphQL API: https://api.staging.nchat.example.com
- Auth Service: https://auth.staging.nchat.example.com
- Admin Dashboard: https://admin.staging.nchat.example.com
- Grafana: https://grafana.staging.nchat.example.com

### Run Database Migrations

```bash
# SSH into staging server
ssh -i ~/.ssh/nchat-deploy deploy@staging.nchat.example.com

# Navigate to deployment
cd /opt/nself/nchat

# Run migrations
docker exec nchat-staging_hasura_1 hasura migrate apply

# Or use nself CLI (if configured for remote)
nself db migrate up --env staging
```

---

## Production Deployment

### Pre-Flight Checklist

```bash
# 1. Test on staging first
# Ensure staging works perfectly

# 2. Backup production database
ssh deploy@nchat.example.com "cd /opt/nself/nchat && docker exec nchat_postgres_1 pg_dump -U postgres nchat_production > /backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"

# 3. Review deployment plan
nself deploy prod --dry-run

# 4. Verify access
nself deploy check-access prod
```

### Deploy to Production

```bash
# Switch to production environment
nself env switch prod

# Deploy with rolling update (zero-downtime)
nself deploy prod --rolling

# Or force deployment (with confirmation)
nself deploy prod --force
```

### Zero-Downtime Strategies

**Option 1: Rolling Deployment** (Recommended)

```bash
nself deploy prod --rolling
```

Restarts services one at a time.

**Option 2: Blue-Green Deployment**

```bash
# Deploy to inactive environment
nself deploy blue-green

# Switch traffic
nself deploy blue-green switch

# Rollback if issues
nself deploy blue-green rollback
```

**Option 3: Canary Deployment**

```bash
# Deploy to 20% of traffic
nself deploy canary --percentage 20

# Increase to 50%
nself deploy canary --percentage 50

# Full rollout
nself deploy canary promote

# Or rollback
nself deploy canary rollback
```

### Post-Deployment Verification

```bash
# 1. Check all services are healthy
nself deploy status prod

# 2. Run smoke tests
curl https://api.nchat.example.com/healthz

# 3. Check Hasura console (if enabled for deploy verification)
# Temporarily enable, then disable after verification

# 4. Monitor logs
nself deploy logs prod --tail 100

# 5. Check Grafana dashboards
open https://grafana.nchat.example.com
```

### Database Migrations in Production

```bash
# ALWAYS test migrations on staging first!

# SSH to production
ssh -i ~/.ssh/nchat-deploy deploy@nchat.example.com

# Navigate to deployment
cd /opt/nself/nchat

# Backup before migration (automated)
docker exec nchat_postgres_1 pg_dump -U postgres nchat_production > /backups/pre-migration-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
docker exec nchat_hasura_1 hasura migrate apply

# Verify migration status
docker exec nchat_hasura_1 hasura migrate status
```

---

## Deployment Strategies

### Environment Promotion

Promote changes from staging to production:

```bash
# 1. Deploy to staging
nself deploy staging

# 2. Test thoroughly on staging

# 3. Promote to production (with same configs)
nself deploy prod
```

### Configuration Sync

Sync configuration between environments:

```bash
# Compare configs
nself config diff staging prod

# Sync database schema (with anonymization)
nself sync db staging prod --anonymize

# Sync files
nself sync files staging prod
```

### Preview Deployments

Create temporary preview environments:

```bash
# Create preview environment
nself deploy preview --name pr-123

# Test changes

# Destroy preview when done
nself deploy preview destroy pr-123
```

---

## Cloud Providers

nself CLI supports 26+ cloud providers. Quick setup:

### DigitalOcean

```bash
# Initialize provider
nself infra provider init digitalocean

# Provision server
nself infra provider server create digitalocean \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --name nchat-prod

# Deploy
nself deploy prod
```

### AWS

```bash
# Initialize provider
nself infra provider init aws

# Provision EC2 instance
nself infra provider server create aws \
  --instance-type t3.medium \
  --region us-east-1 \
  --name nchat-prod

# Deploy
nself deploy prod
```

### Other Providers

Supported providers include:

- DigitalOcean, AWS, GCP, Azure
- Linode, Vultr, Hetzner, OVH
- Scaleway, UpCloud, and 16+ more

See: `nself infra provider list`

---

## Database Migrations

### Migration Workflow

```bash
# Local development
nself db migrate create add_message_reactions
# Edit migration files
nself db migrate up

# Test on staging
nself env switch staging
nself deploy staging
# Run migrations on staging
ssh staging "cd /opt/nself/nchat && docker exec ... hasura migrate apply"

# Deploy to production
nself env switch prod
nself deploy prod
# Run migrations on production
ssh prod "cd /opt/nself/nchat && docker exec ... hasura migrate apply"
```

### Safe Migration Practices

1. **Always test on staging first**
2. **Backup before migrations**
3. **Use reversible migrations** (include both up and down)
4. **Avoid breaking changes** in production
5. **Monitor during migration**

### Rollback Migration

```bash
# SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# Rollback last migration
docker exec nchat_hasura_1 hasura migrate rollback --steps 1

# Restore from backup if needed
docker exec -i nchat_postgres_1 psql -U postgres nchat_production < /backups/pre-migration-XXXXXXXX.sql
```

---

## Monitoring & Logging

### Enable Monitoring

In `.environments/prod/.env`:

```bash
MONITORING_ENABLED=true
```

This deploys the full observability stack:

- Prometheus (metrics collection)
- Grafana (dashboards)
- Loki (log aggregation)
- Promtail (log shipping)
- Tempo (distributed tracing)
- Alertmanager (alerting)

### Access Monitoring

```bash
# Open Grafana
open https://grafana.nchat.example.com

# Default credentials
# Username: admin
# Password: admin (change immediately!)
```

### Pre-Built Dashboards

Grafana includes dashboards for:

- PostgreSQL performance
- Hasura metrics
- Nginx request rates
- Container resource usage
- System metrics (CPU, memory, disk)

### View Logs

```bash
# All services
nself deploy logs prod

# Specific service
nself deploy logs prod hasura

# Follow logs
nself deploy logs prod --follow

# Or SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat
docker compose logs -f hasura
```

### Set Up Alerts

Configure Alertmanager in `monitoring/alertmanager/alertmanager.yml`:

```yaml
route:
  receiver: 'email'

receivers:
  - name: 'email'
    email_configs:
      - to: 'alerts@nchat.example.com'
        from: 'alertmanager@nchat.example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alerts@nchat.example.com'
        auth_password: 'password'
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous deployment
nself deploy rollback prod

# This reverts to the last git commit
```

### Manual Rollback

```bash
# 1. SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# 2. Stop services
docker compose down

# 3. Restore database backup
docker compose up -d postgres
docker exec -i nchat_postgres_1 psql -U postgres nchat_production < /backups/pre-deploy-XXXXXXXX.sql

# 4. Restart services
docker compose up -d

# 5. Verify
docker compose ps
```

### Rollback Migration

```bash
# SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# Rollback specific number of migrations
docker exec nchat_hasura_1 hasura migrate rollback --steps 2
```

---

## Troubleshooting

### Deployment Fails

```bash
# 1. Check SSH connectivity
nself deploy check-access prod

# 2. View detailed logs
nself deploy logs prod

# 3. Manually inspect
ssh deploy@nchat.example.com
cd /opt/nself/nchat
docker compose ps
docker compose logs
```

### Services Not Starting

```bash
# SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# Check service status
docker compose ps

# Check logs
docker compose logs hasura
docker compose logs postgres

# Restart specific service
docker compose restart hasura
```

### Database Connection Issues

```bash
# SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# Test PostgreSQL
docker exec nchat_postgres_1 psql -U postgres -d nchat_production -c "SELECT 1;"

# Check Hasura connection
docker compose logs hasura | grep -i database
```

### SSL Certificate Issues

```bash
# SSH to server
ssh deploy@nchat.example.com
cd /opt/nself/nchat

# Check certificates
ls -la ssl/certificates/

# If using Let's Encrypt, renew
nself ssl renew

# Restart nginx
docker compose restart nginx
```

### Port Conflicts

```bash
# SSH to server
ssh deploy@nchat.example.com

# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service
sudo systemctl stop apache2  # Example
```

### Out of Disk Space

```bash
# SSH to server
ssh deploy@nchat.example.com

# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean up old backups
rm /backups/*-old.sql
```

---

## Production Checklist

Before going live:

- [ ] Domain DNS configured (A records pointing to server)
- [ ] SSL certificates obtained (Let's Encrypt or custom)
- [ ] Database backed up
- [ ] All secrets rotated from staging
- [ ] Monitoring enabled and alerts configured
- [ ] Hasura console DISABLED (`HASURA_GRAPHQL_ENABLE_CONSOLE=false`)
- [ ] Auth MFA enabled (`AUTH_MFA_ENABLED=true`)
- [ ] Email verification required (`AUTH_EMAIL_VERIFICATION_REQUIRED=true`)
- [ ] Rate limiting configured
- [ ] Firewall rules configured (only 80, 443, SSH)
- [ ] Regular backup cron job configured
- [ ] Tested rollback procedure
- [ ] Load testing completed
- [ ] Security audit performed

---

## Deployment Commands Reference

```bash
# ENVIRONMENT SETUP
nself env create staging staging
nself env create prod production
nself env switch staging

# DEPLOYMENT
nself deploy staging              # Deploy to staging
nself deploy prod --rolling       # Zero-downtime production deploy
nself deploy prod --dry-run       # Preview deployment

# ADVANCED STRATEGIES
nself deploy canary --percentage 20
nself deploy blue-green switch
nself deploy preview --name pr-123

# STATUS & LOGS
nself deploy status prod
nself deploy logs prod
nself deploy health prod

# ROLLBACK
nself deploy rollback prod

# PROVIDER MANAGEMENT
nself infra provider list
nself infra provider server create digitalocean
```

---

## Next Steps

1. Set up continuous deployment with GitHub Actions
2. Configure automated database backups
3. Set up monitoring alerts for critical metrics
4. Implement disaster recovery plan
5. Document runbook for common operations

---

## Additional Resources

- **nself Deployment Docs**: ~/Sites/nself/docs/deployment/
- **Hasura Production Checklist**: https://hasura.io/docs/latest/deployment/production-checklist/
- **Nhost Production Guide**: https://docs.nhost.io/guides/production

---

_Version: 1.0.0 | Date: January 31, 2026 | nself CLI v0.9.6_
