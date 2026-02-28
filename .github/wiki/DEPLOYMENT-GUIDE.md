# nself-chat Deployment Guide

**Version**: 1.0.0
**Last Updated**: February 9, 2026
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Deployment Scripts](#deployment-scripts)
3. [Local Development Deployment](#local-development-deployment)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Health Checks](#health-checks)
7. [Rollback Procedures](#rollback-procedures)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

nself-chat provides comprehensive, deterministic deployment scripts for three environments:

| Environment | Script | Purpose | Safety Level |
|-------------|--------|---------|--------------|
| **Local** | `deploy-local.sh` | Development environment | Low (fast iteration) |
| **Staging** | `deploy-staging.sh` | Pre-production testing | Medium (validation + rollback) |
| **Production** | `deploy-production.sh` | Live production | **High** (maximum safety) |

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    nself-chat Deployment                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Backend    │────▶│   Frontend   │────▶│   Health    │ │
│  │  (nself CLI) │     │  (Next.js)   │     │   Checks    │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                     │                     │        │
│         ▼                     ▼                     ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Docker / Kubernetes Deployment              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Scripts

### Script Locations

All deployment scripts are in `/scripts/`:

```bash
scripts/
├── deploy-local.sh          # Local development deployment
├── deploy-staging.sh        # Staging environment deployment
├── deploy-production.sh     # Production deployment
├── health-check.sh          # Comprehensive health checks
└── rollback.sh              # Rollback to previous version
```

### Common Options

All deployment scripts support these common options:

| Option | Description | Example |
|--------|-------------|---------|
| `--dry-run` | Preview without executing | `./deploy-local.sh --dry-run` |
| `--help` | Show usage information | `./deploy-staging.sh --help` |
| `--skip-health-check` | Skip post-deployment checks | **Not recommended** |
| `--verbose` | Detailed output | `./health-check.sh --verbose` |

---

## Local Development Deployment

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ and pnpm installed
- nself CLI v0.4.2+ installed
- `.backend/` directory initialized

### Quick Start

```bash
# Full local deployment (backend + frontend)
./scripts/deploy-local.sh

# Backend only
./scripts/deploy-local.sh --backend-only

# Frontend only
./scripts/deploy-local.sh --frontend-only
```

### What It Does

1. **Validates environment**
   - Checks required tools (docker, nself, node, pnpm)
   - Verifies Node.js version (≥20)
   - Checks backend directory exists

2. **Deploys backend services**
   - Runs `nself build` to generate docker-compose.yml
   - Starts services with `nself start`
   - Waits for services to initialize

3. **Deploys frontend**
   - Installs dependencies if needed
   - Starts Next.js dev server on port 3000
   - Sets development environment variables

4. **Runs health checks**
   - Verifies backend services running
   - Checks frontend accessibility
   - Validates critical services (Hasura, Auth, PostgreSQL)

### Service URLs

After successful deployment:

```
Backend Services:
  GraphQL:  http://localhost:8080/v1/graphql
  Hasura:   http://localhost:8080/console
  Auth:     http://localhost:4000
  Admin:    http://localhost:3021

Frontend:
  Dev Server:  http://localhost:3000

Development Credentials:
  Email:    owner@nself.org
  Password: password123
```

### Examples

```bash
# Preview deployment
./scripts/deploy-local.sh --dry-run

# Skip health checks (faster)
./scripts/deploy-local.sh --skip-health-check

# Custom frontend port
./scripts/deploy-local.sh --port 3001

# Backend only (for API development)
./scripts/deploy-local.sh --backend-only
```

### Troubleshooting Local Deployment

**Issue**: Backend services not starting

```bash
# Check Docker daemon
docker ps

# Check nself status
cd .backend && nself status

# Rebuild backend
cd .backend && nself build && nself start
```

**Issue**: Port 3000 already in use

```bash
# Find process using port
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use custom port
./scripts/deploy-local.sh --port 3001
```

**Issue**: Dependencies out of sync

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## Staging Deployment

### Prerequisites

- kubectl configured for staging cluster
- Docker registry authentication
- Build tools (Docker, Node.js, pnpm)
- Git repository in clean state

### Quick Start

```bash
# Full staging deployment
./scripts/deploy-staging.sh

# Skip tests (faster, not recommended)
./scripts/deploy-staging.sh --skip-tests

# Specific version
./scripts/deploy-staging.sh --tag v1.0.0

# Preview deployment
./scripts/deploy-staging.sh --dry-run
```

### What It Does

1. **Pre-deployment validation**
   - Validates environment (kubectl, docker, git)
   - Checks cluster connectivity
   - Verifies namespace exists
   - Checks for uncommitted changes

2. **Runs test suite**
   - Unit tests with Jest
   - TypeScript type checking
   - ESLint linting
   - Fails deployment if tests fail

3. **Builds Docker image**
   - Builds production Docker image
   - Tags with git commit SHA
   - Pushes to registry

4. **Saves current state**
   - Records current revision
   - Enables rollback if deployment fails

5. **Deploys application**
   - Updates Kubernetes deployment
   - Waits for rollout completion
   - Monitors pod status

6. **Health checks**
   - Verifies all pods ready
   - Checks health endpoints
   - Monitors error rates
   - Retries up to 5 times

7. **Auto-rollback on failure**
   - Automatically rolls back if health checks fail
   - Restores previous revision
   - Verifies rollback health

### Configuration

Environment variables:

```bash
# Required
export KUBECONFIG=/path/to/staging-kubeconfig
export DOCKER_REGISTRY=ghcr.io

# Optional
export IMAGE_TAG=custom-tag          # Override default (git SHA)
export NAMESPACE=custom-namespace    # Override default
```

### Examples

```bash
# Full staging deployment with all checks
./scripts/deploy-staging.sh

# Skip tests for hotfix (use with caution)
./scripts/deploy-staging.sh --skip-tests

# Use existing build
./scripts/deploy-staging.sh --skip-build --tag abc123

# Dry run to preview
./scripts/deploy-staging.sh --dry-run

# Disable auto-rollback (not recommended)
./scripts/deploy-staging.sh --no-rollback
```

### Monitoring Staging Deployment

```bash
# Watch deployment progress
kubectl rollout status deployment/nself-chat -n nself-chat-staging

# Check pod status
kubectl get pods -n nself-chat-staging -l app.kubernetes.io/name=nself-chat

# View logs
kubectl logs -f deployment/nself-chat -n nself-chat-staging

# Check events
kubectl get events -n nself-chat-staging --sort-by='.lastTimestamp'
```

---

## Production Deployment

### ⚠️ Critical Safety Features

Production deployment includes **maximum safety checks**:

- ✅ **Mandatory version tag** (no 'latest' allowed)
- ✅ **Multiple approval gates** (manual confirmation required)
- ✅ **Pre-deployment validation** (cluster, namespace, replicas)
- ✅ **Zero-downtime deployment** (rolling update)
- ✅ **Extensive health monitoring** (10 retries, 15s delay)
- ✅ **Automatic rollback** (on failure)
- ✅ **Full audit logging** (every action logged)
- ✅ **Smoke tests** (critical endpoints)
- ✅ **Post-deployment monitoring** (2 minutes stability check)

### Prerequisites

- kubectl configured for **production cluster**
- Production kubeconfig file
- Docker registry authentication
- **Tagged release** (semantic versioning: v1.0.0)
- **Database backup** completed
- Team approval for deployment

### Quick Start

```bash
# Production deployment (requires approval)
./scripts/deploy-production.sh --tag v1.0.0

# Preview deployment plan
./scripts/deploy-production.sh --tag v1.0.0 --dry-run

# Canary deployment (gradual rollout)
./scripts/deploy-production.sh --tag v1.0.0 --canary
```

### What It Does

1. **Validates version tag**
   - Tag is required (no 'latest')
   - Validates semantic versioning format
   - Checks image exists in registry

2. **Validates production environment**
   - Confirms production cluster connection
   - Verifies namespace and deployment exist
   - Checks minimum replica count (≥2)
   - Validates image in registry

3. **Pre-deployment checks**
   - Checks cluster resources
   - Verifies pod disruption budget
   - Confirms all pods healthy
   - Warns about active alerts

4. **Approval gate** ⚠️
   - Displays deployment plan
   - Requires approver name
   - Requires typing 'deploy-production' to confirm
   - Logs approver in audit log

5. **Saves current state**
   - Records current revision
   - Backs up deployment spec
   - Backs up configmaps/secrets
   - Enables rollback

6. **Deploys application**
   - Updates deployment image
   - Annotates with metadata (timestamp, approver, tag)
   - Waits for rollout (10 minute timeout)
   - Monitors pod status

7. **Comprehensive health checks**
   - Verifies all pods running and ready
   - Checks pod restart counts
   - Tests health endpoints
   - Monitors error rates in logs
   - Retries up to 10 times with 15s delay

8. **Smoke tests**
   - Tests critical endpoints
   - Verifies database connectivity
   - Checks external integrations

9. **Post-deployment monitoring**
   - Monitors for 2 minutes
   - Watches for pod count drops
   - Alerts on instability

10. **Auto-rollback on failure**
    - Rolls back if health checks fail
    - Restores previous revision
    - Verifies rollback health
    - Requires manual intervention if rollback fails

### Approval Process

When you run a production deployment, you'll see:

```
╔══════════════════════════════════════════════════════════╗
║              PRODUCTION DEPLOYMENT APPROVAL              ║
╚══════════════════════════════════════════════════════════╝

Environment:    production
Namespace:      nself-chat-production
Image:          ghcr.io/nself/nself-chat:v1.0.0
Strategy:       Rolling Update
Auto Rollback:  Enabled

Current Image:  ghcr.io/nself/nself-chat:v0.9.0
New Image:      ghcr.io/nself/nself-chat:v1.0.0

Enter your name to approve deployment: John Doe
Type 'deploy-production' to confirm: deploy-production

✓ Deployment approved by: John Doe
```

### Examples

```bash
# Standard production deployment
./scripts/deploy-production.sh --tag v1.0.0

# Canary deployment (10% traffic)
./scripts/deploy-production.sh --tag v1.0.0 --canary

# Canary with custom percentage
./scripts/deploy-production.sh --tag v1.0.0 --canary --canary-pct 25

# Preview deployment (no changes)
./scripts/deploy-production.sh --tag v1.0.0 --dry-run

# Skip approval (CI/CD only, NOT recommended for manual use)
./scripts/deploy-production.sh --tag v1.0.0 --skip-approval
```

### Audit Logging

Every production deployment creates an audit log:

```bash
# Audit log location
/tmp/deploy-YYYYMMDD-HHMMSS.log

# View audit log
cat /tmp/deploy-20260209-143022.log
```

Log contents include:
- Deployment ID and timestamp
- Approver name
- All validation checks
- Image tags (old and new)
- Health check results
- Rollback actions (if any)

### Production Deployment Checklist

Before deploying to production:

- [ ] All tests passing in staging
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Monitoring dashboards ready
- [ ] On-call engineer notified
- [ ] Deployment window scheduled
- [ ] Stakeholders informed

---

## Health Checks

### Running Health Checks

```bash
# Check local environment
./scripts/health-check.sh

# Check staging
./scripts/health-check.sh --env staging

# Check production
./scripts/health-check.sh --env production

# Quick check (essential services only)
./scripts/health-check.sh --quick

# Verbose output
./scripts/health-check.sh --verbose
```

### What It Checks

**Local Environment:**
- ✓ Backend services status (nself status)
- ✓ PostgreSQL database running
- ✓ Hasura GraphQL engine running
- ✓ Authentication service running
- ✓ Frontend dev server accessible
- ✓ Dependencies installed (node_modules)
- ✓ GraphQL API responding
- ✓ Database connectivity
- ✓ External dependencies (DNS, internet)

**Staging/Production (Kubernetes):**
- ✓ Cluster connectivity
- ✓ Namespace exists
- ✓ Deployment exists and healthy
- ✓ All replicas ready and available
- ✓ No crash loops (restart count < 5)
- ✓ Event log clean (< 10 warnings)
- ✓ GraphQL API responding
- ✓ External dependencies

### Health Check Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | All checks passed | ✅ Everything healthy |
| 1 | Warnings present | ⚠️ Review warnings |
| 2 | Critical failures | ❌ Immediate action required |

### Automated Health Checks

Run health checks automatically:

```bash
# Cron job for staging (every 5 minutes)
*/5 * * * * /path/to/scripts/health-check.sh --env staging --quick

# Cron job for production (every minute)
* * * * * /path/to/scripts/health-check.sh --env production --quick
```

---

## Rollback Procedures

### Automatic Rollback

Both staging and production scripts include automatic rollback:

- Triggers on health check failures
- Rolls back to previous revision
- Verifies rollback health
- Logs all actions

### Manual Rollback

If you need to manually rollback:

```bash
# Rollback to previous version
./scripts/rollback.sh

# Rollback to specific revision
./scripts/rollback.sh --revision 3

# Preview rollback
./scripts/rollback.sh --dry-run

# Rollback with Helm
./scripts/rollback.sh --helm
```

### Rollback Options

```bash
# Namespace-specific rollback
./scripts/rollback.sh --namespace nself-chat-production

# Rollback without waiting
./scripts/rollback.sh --no-wait

# Show deployment history first
kubectl rollout history deployment/nself-chat -n nself-chat-production
```

### Emergency Rollback

In case of critical production issues:

```bash
# Immediate rollback (no confirmation)
kubectl rollout undo deployment/nself-chat -n nself-chat-production

# Check status
kubectl rollout status deployment/nself-chat -n nself-chat-production

# Verify health
./scripts/health-check.sh --env production
```

---

## Troubleshooting

### Deployment Failures

**Issue**: Build fails

```bash
# Check Docker daemon
docker ps

# Clean build
docker system prune -af
./scripts/docker-build.sh --tag v1.0.0 --no-cache
```

**Issue**: Tests fail

```bash
# Run tests locally
pnpm test

# Type check
pnpm type-check

# Fix and retry
git commit -am "fix: resolve test failures"
./scripts/deploy-staging.sh
```

**Issue**: Image not found in registry

```bash
# Verify image exists
docker manifest inspect ghcr.io/nself/nself-chat:v1.0.0

# Build and push
./scripts/docker-build.sh --tag v1.0.0 --push
```

### Health Check Failures

**Issue**: Pods not ready

```bash
# Check pod status
kubectl get pods -n nself-chat-staging

# Describe problematic pod
kubectl describe pod <pod-name> -n nself-chat-staging

# Check logs
kubectl logs <pod-name> -n nself-chat-staging
```

**Issue**: High restart count

```bash
# Check pod logs
kubectl logs <pod-name> -n nself-chat-staging --previous

# Check resource limits
kubectl describe pod <pod-name> -n nself-chat-staging | grep -A 10 Limits

# Increase resources if OOMKilled
kubectl set resources deployment/nself-chat --limits=memory=2Gi -n nself-chat-staging
```

### Rollback Issues

**Issue**: Rollback fails

```bash
# Check deployment history
kubectl rollout history deployment/nself-chat -n nself-chat-production

# Restore from backup
kubectl apply -f /tmp/deployment-backup-deploy-YYYYMMDD-HHMMSS.yaml
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `kubectl: command not found` | kubectl not installed | Install kubectl |
| `Cannot connect to cluster` | KUBECONFIG not set | Set KUBECONFIG path |
| `Namespace not found` | Wrong namespace | Verify namespace name |
| `Image pull error` | Image not in registry | Build and push image |
| `Pods crash looping` | Application error | Check logs, fix code |
| `Health check timeout` | Service not responding | Check network, increase timeout |

---

## Best Practices

### Development

1. **Always test locally first**
   ```bash
   ./scripts/deploy-local.sh
   ./scripts/health-check.sh
   ```

2. **Keep backend running**
   ```bash
   # Don't stop/start backend frequently
   # Just restart frontend for code changes
   ./scripts/deploy-local.sh --frontend-only
   ```

3. **Use dev authentication**
   ```bash
   # In .env.local
   NEXT_PUBLIC_USE_DEV_AUTH=true
   ```

### Staging

1. **Deploy every PR**
   - Test in staging before merging
   - Run full test suite
   - Verify health checks pass

2. **Use realistic data**
   - Seed with production-like data
   - Test migrations on staging first

3. **Monitor closely**
   - Watch logs after deployment
   - Check error rates
   - Verify integrations work

### Production

1. **Always use tagged releases**
   ```bash
   # Good
   ./scripts/deploy-production.sh --tag v1.0.0

   # Bad
   ./scripts/deploy-production.sh --tag latest  # Will fail
   ```

2. **Deploy during low traffic**
   - Schedule deployments during off-peak hours
   - Notify team in advance
   - Have rollback plan ready

3. **Monitor for 30 minutes**
   - Watch error rates
   - Check performance metrics
   - Monitor user reports

4. **Never skip safety checks**
   ```bash
   # Don't do this in production
   ./scripts/deploy-production.sh --skip-validation --skip-health-check

   # These flags are for emergencies only
   ```

5. **Keep audit logs**
   - Archive audit logs for compliance
   - Review failed deployments
   - Document lessons learned

### General

1. **Version everything**
   - Use semantic versioning
   - Tag releases in git
   - Document changes in CHANGELOG.md

2. **Test rollback procedures**
   - Practice rollbacks in staging
   - Verify backups work
   - Time how long rollback takes

3. **Automate where possible**
   - Use CI/CD for staging
   - Require manual approval for production
   - Automate health checks

4. **Document everything**
   - Keep deployment logs
   - Document incidents
   - Update runbooks

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_STAGING }}" > /tmp/kubeconfig
          echo "KUBECONFIG=/tmp/kubeconfig" >> $GITHUB_ENV

      - name: Deploy to Staging
        run: ./scripts/deploy-staging.sh
        env:
          DOCKER_REGISTRY: ghcr.io
          IMAGE_TAG: ${{ github.sha }}
```

### Production Deployment (Manual)

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'Version tag (e.g., v1.0.0)'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Production
        run: ./scripts/deploy-production.sh --tag ${{ github.event.inputs.tag }}
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG_PRODUCTION }}
          DEPLOYMENT_APPROVER: ${{ github.actor }}
```

---

## Support

### Getting Help

1. **Check this guide** - Most common issues are documented
2. **Check logs** - Audit logs contain detailed information
3. **Run health checks** - Identify specific failures
4. **Check cluster events** - Kubernetes events show what happened
5. **Review monitoring** - Dashboards show performance metrics

### Emergency Contacts

For production emergencies:
- On-call engineer: Check PagerDuty
- DevOps team: #devops-alerts Slack channel
- Incident commander: Follow incident response plan

---

**Last Updated**: February 9, 2026
**Version**: 1.0.0
**Maintained by**: nself-chat DevOps Team
