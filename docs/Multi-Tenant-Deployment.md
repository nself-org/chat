# Multi-Tenant Deployment Guide

**Version**: 0.5.0
**Date**: January 30, 2026
**Status**: Production Ready

This guide explains how to deploy nself-chat as a multi-tenant SaaS platform with subdomain routing, custom domains, and Stripe billing.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [DNS & Domain Setup](#dns--domain-setup)
6. [Stripe Configuration](#stripe-configuration)
7. [Deployment](#deployment)
8. [Tenant Management](#tenant-management)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Multi-Tenant Isolation Strategy

nself-chat uses **schema-level isolation** for tenant data:

- Each tenant gets a dedicated PostgreSQL schema (e.g., `tenant_acme`)
- Global tenant metadata stored in `public.tenants` table
- Row-Level Security (RLS) enforces tenant boundaries
- Middleware resolves tenant from subdomain or custom domain

**Benefits**:
- ✅ Strong data isolation
- ✅ Independent backups per tenant
- ✅ Efficient resource usage
- ✅ Simplified migrations
- ✅ Cost-effective scaling

**Alternatives Considered**:
- ❌ Separate database per tenant (too expensive at scale)
- ❌ Shared schema with tenant_id (weaker isolation, risk of data leaks)

### Request Flow

```
1. User visits → acme.nchat.app
2. Middleware extracts subdomain → "acme"
3. Query database → SELECT * FROM tenants WHERE slug = 'acme'
4. Set tenant context → X-Tenant-Id, X-Tenant-Schema headers
5. All queries scoped to → tenant_acme schema
6. Response returned with tenant branding
```

---

## Prerequisites

### Required Tools

- **Node.js**: ≥20.0.0
- **PostgreSQL**: ≥14.0 (with schema support)
- **Redis**: ≥6.0 (for caching and rate limiting)
- **Docker**: ≥20.0 (optional, for local development)
- **pnpm**: 9.15.4

### Required Services

- **Stripe Account**: For billing and subscriptions
- **DNS Provider**: With wildcard subdomain support (e.g., Cloudflare, Route 53)
- **SSL Certificate**: Wildcard cert for `*.nchat.app`

---

## Database Setup

### 1. Run Multi-Tenant Migration

```bash
# Navigate to backend directory
cd .backend

# Run migration
nself db migrate up 030_multi_tenant_system.sql
```

This creates:
- `public.tenants` - Tenant metadata
- `public.tenant_usage` - Usage statistics
- `public.tenant_settings` - Tenant configuration
- `public.tenant_invitations` - Invite system
- `public.tenant_audit_logs` - Audit trail
- `public.stripe_webhooks` - Webhook event log

### 2. Verify Migration

```sql
-- Check tables exist
\dt public.tenants*

-- Check demo tenant
SELECT * FROM public.tenants WHERE slug = 'demo';

-- Check schema creation
\dn tenant_*
```

### 3. Create First Production Tenant (Optional)

```sql
-- Manual tenant creation (for testing)
INSERT INTO public.tenants (
  name, slug, status, owner_email, owner_name,
  schema_name, billing_plan
) VALUES (
  'Acme Corporation',
  'acme',
  'active',
  'admin@acme.com',
  'John Doe',
  'tenant_acme',
  'pro'
);

-- Create schema
CREATE SCHEMA tenant_acme;

-- Copy table structure from nchat schema
-- (This is automated by TenantService.createTenant())
```

---

## Environment Configuration

### Backend (.backend/.env)

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/nchat_multi

# Redis (for tenant caching)
REDIS_URL=redis://localhost:6379/0

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret
HASURA_GRAPHQL_ENABLE_CONSOLE=false

# Auth
JWT_SECRET=your-jwt-secret
```

### Frontend (.env.local)

```bash
# Multi-Tenancy
ENABLE_MULTI_TENANCY=true
NEXT_PUBLIC_APP_URL=https://nchat.app
NEXT_PUBLIC_BASE_DOMAIN=nchat.app

# Custom Domains
ENABLE_CUSTOM_DOMAINS=true

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Backend
NEXT_PUBLIC_GRAPHQL_URL=https://api.nchat.app/v1/graphql
NEXT_PUBLIC_AUTH_URL=https://auth.nchat.app/v1/auth

# Database (for server-side)
DATABASE_URL=postgresql://user:pass@localhost:5432/nchat_multi
```

### Single-Tenant Mode (Optional)

To disable multi-tenancy (single organization):

```bash
DISABLE_MULTI_TENANCY=true
DEFAULT_TENANT_SLUG=demo
```

---

## DNS & Domain Setup

### Wildcard Subdomain (Required)

Configure your DNS provider to support wildcard subdomains:

**DNS Records**:

```
# A Records
nchat.app               → 1.2.3.4
*.nchat.app             → 1.2.3.4

# CNAME (alternative)
*.nchat.app             → nchat.app
```

**Cloudflare Example**:

```
Type: A
Name: @
Content: 1.2.3.4
Proxy: ✓ Proxied

Type: A
Name: *
Content: 1.2.3.4
Proxy: ✓ Proxied
```

### SSL Certificate (Required)

**Option 1: Cloudflare (Recommended)**
- Free wildcard SSL
- Automatic renewal
- DDoS protection

**Option 2: Let's Encrypt**

```bash
# Install certbot
sudo apt install certbot

# Generate wildcard cert (requires DNS challenge)
sudo certbot certonly --manual --preferred-challenges dns \
  -d nchat.app -d *.nchat.app

# Certificate location
/etc/letsencrypt/live/nchat.app/fullchain.pem
/etc/letsencrypt/live/nchat.app/privkey.pem
```

### Custom Domains (Optional)

To support custom domains (e.g., `chat.acme.com`):

1. **Tenant provides DNS records**:
   ```
   CNAME: chat.acme.com → nchat.app
   ```

2. **Add domain to tenant**:
   ```bash
   curl -X PUT https://api.nchat.app/tenants/{id} \
     -H "Authorization: Bearer {token}" \
     -d '{"customDomain": "chat.acme.com"}'
   ```

3. **Configure SSL** (if not using Cloudflare):
   ```bash
   # Add domain to SSL cert
   sudo certbot certonly --manual --preferred-challenges dns \
     -d chat.acme.com
   ```

4. **Update whitelist**:
   ```bash
   # .env.local
   ALLOWED_CUSTOM_DOMAINS=chat.acme.com,team.example.com
   ```

---

## Stripe Configuration

### 1. Create Stripe Account

1. Sign up at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Copy Secret Key and Publishable Key

### 2. Create Products & Prices

**Free Plan** (no charge):
- No Stripe product needed
- Handled in application logic

**Pro Plan**:

```bash
# Create product
stripe products create \
  --name "nChat Pro" \
  --description "For growing teams"

# Create monthly price
stripe prices create \
  --product {product_id} \
  --unit-amount 1500 \
  --currency usd \
  --recurring[interval]=month

# Create yearly price (discounted)
stripe prices create \
  --product {product_id} \
  --unit-amount 15000 \
  --currency usd \
  --recurring[interval]=year
```

**Enterprise Plan**:

```bash
# Create product
stripe products create \
  --name "nChat Enterprise" \
  --description "For large organizations"

# Create monthly price
stripe prices create \
  --product {product_id} \
  --unit-amount 9900 \
  --currency usd \
  --recurring[interval]=month

# Create yearly price
stripe prices create \
  --product {product_id} \
  --unit-amount 99000 \
  --currency usd \
  --recurring[interval]=year
```

### 3. Update Plan Configuration

Edit `src/lib/tenants/types.ts`:

```typescript
export const DEFAULT_PLANS: Record<BillingPlan, SubscriptionPlan> = {
  pro: {
    // ...
    stripePriceIdMonthly: 'price_xxx', // From Stripe
    stripePriceIdYearly: 'price_yyy',  // From Stripe
  },
  enterprise: {
    // ...
    stripePriceIdMonthly: 'price_zzz',
    stripePriceIdYearly: 'price_www',
  },
}
```

### 4. Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://nchat.app/api/billing/webhook`
4. Events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

5. Copy webhook signing secret:
   ```bash
   # .env.local
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

---

## Deployment

### Option 1: Docker (Recommended)

```bash
# Build image
docker build -t nchat-multi:latest .

# Run container
docker run -d \
  --name nchat-multi \
  -p 3000:3000 \
  --env-file .env.production \
  nchat-multi:latest

# Or use docker-compose
docker-compose -f docker-compose.multi-tenant.yml up -d
```

### Option 2: Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add ENABLE_MULTI_TENANCY production
vercel env add STRIPE_SECRET_KEY production
# ... (add all required env vars)
```

**Vercel Configuration**:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "env": {
    "ENABLE_MULTI_TENANCY": "true",
    "NEXT_PUBLIC_BASE_DOMAIN": "nchat.app"
  }
}
```

### Option 3: Kubernetes

See `deploy/k8s/multi-tenant/` for Kubernetes manifests.

```bash
# Apply manifests
kubectl apply -f deploy/k8s/multi-tenant/

# Check deployment
kubectl get pods -n nchat
kubectl get ingress -n nchat
```

---

## Tenant Management

### Create Tenant (API)

```bash
curl -X POST https://nchat.app/api/tenants/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme",
    "ownerEmail": "admin@acme.com",
    "ownerName": "John Doe",
    "ownerPassword": "securepass123",
    "plan": "pro",
    "trial": true
  }'
```

### Update Tenant

```bash
curl -X PUT https://acme.nchat.app/api/tenants/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "customDomain": "chat.acme.com",
    "branding": {
      "appName": "Acme Chat",
      "primaryColor": "#FF5733"
    }
  }'
```

### Delete Tenant

```bash
# Soft delete (cancel subscription)
curl -X DELETE https://acme.nchat.app/api/tenants/{id} \
  -H "Authorization: Bearer {token}"

# Hard delete (remove all data)
# This is done via database function for safety
psql -d nchat_multi -c "SELECT hard_delete_tenant('{tenant_id}')"
```

### Super Admin Operations

```sql
-- List all tenants
SELECT id, name, slug, status, billing_plan, created_at
FROM public.tenants
ORDER BY created_at DESC;

-- Get tenant usage
SELECT * FROM public.tenant_usage
WHERE tenant_id = '{tenant_id}';

-- Check limits
SELECT public.check_tenant_limits('{tenant_id}');

-- Suspend tenant
UPDATE public.tenants
SET status = 'suspended', suspended_at = NOW()
WHERE id = '{tenant_id}';

-- Reactivate tenant
UPDATE public.tenants
SET status = 'active', suspended_at = NULL
WHERE id = '{tenant_id}';
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Application health
curl https://nchat.app/api/health

# Tenant health
curl https://acme.nchat.app/api/health

# Database health
psql -d nchat_multi -c "SELECT COUNT(*) FROM public.tenants WHERE status = 'active'"
```

### Usage Monitoring

```sql
-- Current month usage by tenant
SELECT
  t.name,
  t.slug,
  t.billing_plan,
  u.users_total,
  u.messages_total,
  u.storage_bytes / 1024 / 1024 / 1024 as storage_gb,
  u.api_calls_total
FROM public.tenants t
LEFT JOIN public.tenant_usage u ON t.id = u.tenant_id
WHERE u.period = TO_CHAR(NOW(), 'YYYY-MM')
ORDER BY u.storage_bytes DESC;
```

### Cleanup Jobs

```sql
-- Delete expired invitations (run daily)
DELETE FROM public.tenant_invitations
WHERE expires_at < NOW() AND accepted_at IS NULL;

-- Archive cancelled tenants (run monthly)
UPDATE public.tenants
SET status = 'archived'
WHERE status = 'cancelled'
  AND cancelled_at < NOW() - INTERVAL '90 days';

-- Clean up old webhook logs (run weekly)
DELETE FROM public.stripe_webhooks
WHERE created_at < NOW() - INTERVAL '30 days'
  AND processed = true;
```

### Backups

```bash
# Backup all tenant schemas
pg_dump -h localhost -U postgres -d nchat_multi \
  --schema-only \
  --schema=public \
  --schema=tenant_* \
  > backup-$(date +%Y%m%d).sql

# Backup specific tenant
pg_dump -h localhost -U postgres -d nchat_multi \
  --schema=tenant_acme \
  > tenant-acme-$(date +%Y%m%d).sql

# Restore tenant
psql -h localhost -U postgres -d nchat_multi \
  < tenant-acme-20260130.sql
```

---

## Troubleshooting

### Issue: Tenant Not Found

**Symptoms**: 404 error when accessing subdomain

**Solutions**:
1. Check DNS propagation: `nslookup acme.nchat.app`
2. Verify tenant exists: `SELECT * FROM public.tenants WHERE slug = 'acme'`
3. Check middleware logs for tenant resolution
4. Verify SSL certificate includes wildcard

### Issue: Stripe Webhook Failing

**Symptoms**: Subscription not updating after payment

**Solutions**:
1. Check webhook signature verification
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Check Stripe Dashboard → Webhooks → Events
4. Review logs: `SELECT * FROM public.stripe_webhooks WHERE processed = false`

### Issue: Limits Not Enforcing

**Symptoms**: Tenant exceeds usage limits without restriction

**Solutions**:
1. Check limit enforcement middleware
2. Verify usage tracking: `SELECT * FROM public.tenant_usage`
3. Run limits check: `SELECT public.check_tenant_limits('{tenant_id}')`
4. Review plan configuration in `DEFAULT_PLANS`

### Issue: Schema Isolation Failure

**Symptoms**: Tenant seeing data from another tenant

**Critical Security Issue - Immediate Action Required**:
1. Suspend all tenants immediately
2. Review RLS policies: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
3. Check search_path configuration
4. Audit recent queries for cross-tenant access
5. Review middleware tenant context setting

---

## Performance Optimization

### Database Indexing

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_tenants_status_plan
  ON public.tenants(status, billing_plan);

CREATE INDEX CONCURRENTLY idx_tenant_usage_period_tenant
  ON public.tenant_usage(period, tenant_id);
```

### Caching Strategy

```typescript
// Redis caching for tenant metadata
const cacheTenant = async (slug: string) => {
  const cached = await redis.get(`tenant:${slug}`)
  if (cached) return JSON.parse(cached)

  const tenant = await getTenantBySlug(slug)
  await redis.setex(`tenant:${slug}`, 3600, JSON.stringify(tenant))
  return tenant
}
```

### Rate Limiting

```typescript
// Per-tenant rate limiting
const rateLimiter = new RateLimiter({
  keyGenerator: (req) => getTenantId(req),
  max: (req) => {
    const tenant = getTenantFromRequest(req)
    return tenant.limits.rateLimitPerMinute
  },
  windowMs: 60 * 1000,
})
```

---

## Security Checklist

- [ ] Wildcard SSL certificate installed
- [ ] RLS policies enabled on all tenant tables
- [ ] Stripe webhook signature verification active
- [ ] Rate limiting configured per tenant
- [ ] Audit logging enabled
- [ ] Database backups automated
- [ ] Cross-tenant query prevention tested
- [ ] Admin routes protected with super_admin role
- [ ] Environment variables secured (not committed to git)
- [ ] Custom domain whitelist configured

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/nself-chat/issues
- Documentation: https://docs.nchat.app
- Email: support@nchat.app

---

**Last Updated**: January 30, 2026
**Version**: 0.5.0
