# Deployment Comparison

**Version**: 0.9.2
**Last Updated**: February 10, 2026
**Status**: Production Ready

## Overview

This guide compares standalone and shared-backend deployment models to help you choose the right approach for your use case.

## Quick Decision Matrix

| Your Situation | Recommended Approach |
|----------------|---------------------|
| Single application | **Standalone** |
| Multiple apps (2+) | **Shared-Backend** |
| Independent teams | **Standalone** |
| Unified organization | **Shared-Backend** |
| Budget-conscious | **Shared-Backend** |
| Maximum isolation | **Standalone** |
| SSO required | **Shared-Backend** |
| Simple setup | **Standalone** |
| Centralized data | **Shared-Backend** |
| Testing/development | **Standalone** |

## Feature Comparison

| Feature | Standalone | Shared-Backend |
|---------|-----------|----------------|
| **Setup Complexity** | ⭐⭐ Low | ⭐⭐⭐⭐ Medium-High |
| **Maintenance** | Per-app | Centralized |
| **Cost (3 apps)** | $192/month | $148/month (23% savings) |
| **Data Isolation** | Complete | Schema-based |
| **User Management** | Separate | Unified |
| **Single Sign-On** | No | Yes |
| **Scaling** | Per-app | Centralized |
| **Backup Complexity** | Per-app | Centralized |
| **Monitoring** | Per-app | Centralized |
| **Resource Usage** | Higher | Lower |
| **Team Independence** | Full | Coordinated |
| **Deployment Speed** | Fast | Moderate |
| **Failure Isolation** | Complete | Partial |
| **Cross-App Features** | Difficult | Easy |

## Detailed Comparison

### Architecture

**Standalone:**
```
app1.example.com
├── Frontend (Next.js)
├── Backend (nSelf)
│   ├── PostgreSQL
│   ├── Hasura
│   ├── Auth
│   └── Storage
└── Monitoring

app2.example.com (separate stack)
app3.example.com (separate stack)
```

**Shared-Backend:**
```
Shared Infrastructure:
├── api.example.com (Hasura)
├── auth.example.com (Nhost Auth)
├── storage.example.com (MinIO)
└── db.example.com (PostgreSQL)

Applications:
├── chat.example.com → Frontend only
├── notes.example.com → Frontend only
└── tasks.example.com → Frontend only
```

### Cost Analysis

#### Single App

| Resource | Standalone | Shared | Winner |
|----------|-----------|--------|--------|
| Frontend | $20/mo | $20/mo | Tie |
| Backend | $24/mo | $24/mo | Tie |
| Database | $15/mo | $15/mo | Tie |
| Storage | $5/mo | $5/mo | Tie |
| **Total** | **$64/mo** | **$64/mo** | **Tie** |

**For single apps, both approaches cost the same.**

#### Three Apps

| Resource | Standalone | Shared | Savings |
|----------|-----------|--------|---------|
| Frontend (3x) | $60/mo | $60/mo | $0 |
| Backend | $72/mo | $48/mo | $24/mo |
| Database | $45/mo | $30/mo | $15/mo |
| Storage | $15/mo | $10/mo | $5/mo |
| **Total** | **$192/mo** | **$148/mo** | **$44/mo (23%)** |

#### Ten Apps

| Resource | Standalone | Shared | Savings |
|----------|-----------|--------|---------|
| Frontend (10x) | $200/mo | $200/mo | $0 |
| Backend | $240/mo | $96/mo | $144/mo |
| Database | $150/mo | $60/mo | $90/mo |
| Storage | $50/mo | $20/mo | $30/mo |
| **Total** | **$640/mo** | **$376/mo** | **$264/mo (41%)** |

**Cost savings increase with more apps.**

### Setup Time

| Task | Standalone | Shared-Backend |
|------|-----------|----------------|
| Initial Setup | 2-4 hours | 6-8 hours |
| Adding 2nd App | 2-4 hours | 30-60 minutes |
| Adding 3rd App | 2-4 hours | 30-60 minutes |
| **Total (3 apps)** | **6-12 hours** | **7-10 hours** |

**Shared-backend has higher initial investment but faster additions.**

### Maintenance

**Standalone:**
- Update each backend independently
- Monitor 3 separate systems
- Backup 3 databases
- Maintain 3 sets of credentials
- Debug issues in isolation

**Shared-Backend:**
- Update once, affects all apps
- Single monitoring dashboard
- One database backup
- Centralized credential management
- Complex cross-app debugging

### Scaling

**Standalone:**
```bash
# Scale each app independently
docker-compose -f app1/docker-compose.yml scale hasura=3
docker-compose -f app2/docker-compose.yml scale hasura=2
docker-compose -f app3/docker-compose.yml scale hasura=1
```

**Shared-Backend:**
```bash
# Scale once for all apps
docker-compose scale hasura=5
# OR use Kubernetes HPA
kubectl scale deployment hasura --replicas=5
```

### Security

**Standalone:**
- ✅ Complete data isolation
- ✅ Independent credentials
- ✅ No cross-app vulnerabilities
- ✅ Per-app security policies
- ❌ More attack surfaces (3x backends)
- ❌ Inconsistent security updates

**Shared-Backend:**
- ✅ Centralized security updates
- ✅ Unified security policies
- ✅ Single audit trail
- ⚠️ Schema-based isolation (not physical)
- ⚠️ Shared credentials risk
- ⚠️ Single point of failure

### Performance

**Standalone:**
- Dedicated resources per app
- No resource contention
- Simpler to optimize per app
- Higher total resource usage

**Shared-Backend:**
- Shared resources
- Potential resource contention
- More complex optimization
- Lower total resource usage
- Better cache utilization

### Availability

**Standalone:**
```
App1 down: ❌ App1, ✅ App2, ✅ App3
Database issue: Only affects one app
```

**Shared-Backend:**
```
Backend down: ❌ All apps
Database issue: ❌ All apps (unless replicated)
```

**Mitigation for Shared-Backend:**
- High availability setup
- Database replication
- Health checks and auto-recovery
- Blue-green deployments

## Use Case Scenarios

### Scenario 1: Early Startup

**Situation:**
- 1 app (chat platform)
- 2-person team
- Limited budget ($100/month)
- MVP stage

**Recommendation:** **Standalone**

**Why:**
- Simpler setup (launch faster)
- Full control
- Easy to debug
- Can migrate to shared later

**Setup:**
```bash
# Quick start
git clone nself-chat
cd .backend && nself start
pnpm dev
```

### Scenario 2: Growing Company

**Situation:**
- 3 apps (chat, notes, tasks)
- 10-person team
- Budget: $500/month
- Need SSO

**Recommendation:** **Shared-Backend**

**Why:**
- 23% cost savings
- Unified user management
- SSO across apps
- Centralized monitoring

**Cost:**
- Standalone: $192/mo
- Shared: $148/mo
- Savings: $44/mo ($528/year)

### Scenario 3: Enterprise

**Situation:**
- 10+ apps
- 100+ person organization
- Multiple teams
- Compliance requirements

**Recommendation:** **Shared-Backend with Tenant Isolation**

**Why:**
- Massive cost savings (41%)
- Centralized compliance
- Unified audit logs
- Easier to manage

**Additional Requirements:**
- Row-level security (RLS)
- Per-team namespacing
- Dedicated monitoring
- Regular security audits

### Scenario 4: Agency/White-Label

**Situation:**
- Multiple clients
- Each needs independent app
- Full isolation required
- Per-client billing

**Recommendation:** **Standalone per Client**

**Why:**
- Complete isolation
- Independent billing
- Per-client customization
- No shared failure points

**Considerations:**
- Use automation for setup
- Centralized monitoring
- Template-based deployments

### Scenario 5: Development/Staging

**Situation:**
- Need dev, staging, prod environments
- Multiple developers
- Frequent deployments

**Recommendation:** **Standalone Environments**

**Why:**
- Safe to break dev environment
- Independent testing
- No production impact
- Easy to reset

**Setup:**
```bash
# Development
NEXT_PUBLIC_ENV=development pnpm dev

# Staging (shared backend)
NEXT_PUBLIC_ENV=staging pnpm start

# Production (standalone)
NEXT_PUBLIC_ENV=production pnpm start
```

## Migration Paths

### Standalone → Shared-Backend

**When to Migrate:**
- Adding 2nd or 3rd app
- Need SSO
- Cost becomes concern
- Want unified management

**Steps:**

1. **Setup Shared Backend**
   ```bash
   # Deploy shared infrastructure
   cd shared-backend
   nself init --demo
   nself start
   ```

2. **Backup Existing Data**
   ```bash
   pg_dump app1_db > app1_backup.sql
   pg_dump app2_db > app2_backup.sql
   ```

3. **Create Schemas**
   ```sql
   CREATE SCHEMA app1;
   CREATE SCHEMA app2;
   ```

4. **Migrate Data**
   ```bash
   # Restore with schema prefix
   psql shared_db -c "SET search_path TO app1"
   psql shared_db < app1_backup.sql
   ```

5. **Update App Configs**
   ```bash
   # Point to shared backend
   NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/v1/graphql
   NEXT_PUBLIC_AUTH_URL=https://auth.example.com/v1/auth
   ```

6. **Test Thoroughly**
   - Verify data isolation
   - Test authentication
   - Check permissions

7. **Cutover**
   - Update DNS
   - Monitor closely
   - Keep old backends for rollback

**Timeline:** 2-3 days for 3 apps

### Shared-Backend → Standalone

**When to Migrate:**
- Security concerns
- Performance issues
- Regulatory requirements
- Team independence

**Steps:**

1. **Export Schema Data**
   ```bash
   pg_dump -n app1 shared_db > app1_data.sql
   ```

2. **Setup New Backend**
   ```bash
   cd app1-standalone/.backend
   nself init
   nself start
   ```

3. **Import Data**
   ```bash
   psql app1_db < app1_data.sql
   ```

4. **Update App Config**
   ```bash
   # Point to standalone backend
   NEXT_PUBLIC_GRAPHQL_URL=https://app1.example.com/v1/graphql
   ```

5. **Test and Cutover**

**Timeline:** 1-2 days per app

## Hybrid Approach

**Some apps standalone, others shared:**

```
Production (Standalone):
- chat.example.com → Dedicated backend

Internal Tools (Shared):
- admin.example.com
- analytics.example.com
- docs.example.com
    ↓
Shared backend at internal-api.example.com
```

**Benefits:**
- Critical apps get dedicated resources
- Internal tools share infrastructure
- Balanced cost vs performance

## Decision Flowchart

```
Do you have multiple apps?
├─ No → Use Standalone
└─ Yes → Continue

Do you need complete data isolation?
├─ Yes → Use Standalone
└─ No → Continue

Do you need SSO across apps?
├─ Yes → Use Shared-Backend
└─ No → Continue

Is cost optimization important?
├─ Yes → Use Shared-Backend
└─ No → Continue

Do you have >2 apps?
├─ Yes → Use Shared-Backend
└─ No → Use Standalone
```

## Recommendations by Team Size

| Team Size | Apps | Recommendation |
|-----------|------|----------------|
| 1-5 people | 1 app | **Standalone** |
| 1-5 people | 2-3 apps | **Shared-Backend** |
| 6-20 people | 1 app | **Standalone** |
| 6-20 people | 2+ apps | **Shared-Backend** |
| 20-100 people | Any | **Shared-Backend** |
| 100+ people | Many | **Shared-Backend with RLS** |
| Enterprise | Many | **Shared-Backend + Standalone (Hybrid)** |

## Summary

### Choose Standalone If:
- ✅ Single application
- ✅ Independent teams
- ✅ Maximum isolation required
- ✅ Simple setup preferred
- ✅ Each app has unique requirements

### Choose Shared-Backend If:
- ✅ Multiple applications (2+)
- ✅ Need SSO across apps
- ✅ Cost optimization important
- ✅ Unified user management
- ✅ Centralized monitoring
- ✅ Shared data requirements

### Start Standalone, Migrate Later
- ✅ Fastest time to market
- ✅ Can always migrate when scaling
- ✅ Lower initial complexity
- ✅ Learn before optimizing

## Resources

- [Standalone Deployment Guide](./Standalone-Deployment.md)
- [Shared-Backend Deployment Guide](./Shared-Backend-Deployment.md)
- [Subdomain Routing Guide](./Subdomain-Routing.md)
- [Environment Variables Guide](./Environment-Variables.md)

---

**Still Unsure?**

1. Start with **Standalone** for MVP
2. Add 2nd app with **Standalone**
3. When adding 3rd app, consider migrating to **Shared-Backend**
4. The migration path is well-documented

**Need Help Deciding?**
- GitHub Discussions: https://github.com/yourusername/nself-chat/discussions
- Community Discord: https://discord.gg/nself
