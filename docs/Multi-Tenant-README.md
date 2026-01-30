# Multi-Tenant Architecture - nself-chat v0.5.0

## Overview

nself-chat now supports full multi-tenant SaaS deployment with:

- **Subdomain Routing**: `tenant1.nchat.app`, `tenant2.nchat.app`
- **Custom Domains**: `chat.acme.com` (optional)
- **Schema-Level Isolation**: Each tenant gets isolated PostgreSQL schema
- **Stripe Billing**: Integrated subscription management
- **Resource Limits**: Per-plan usage enforcement
- **Usage Tracking**: Real-time monitoring and analytics

## Quick Start

### 1. Enable Multi-Tenancy

```bash
# .env.local
ENABLE_MULTI_TENANCY=true
NEXT_PUBLIC_BASE_DOMAIN=nchat.app
```

### 2. Run Migration

```bash
cd .backend
nself db migrate up 030_multi_tenant_system.sql
```

### 3. Configure Stripe

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Create First Tenant

```bash
curl -X POST http://localhost:3000/api/tenants/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme",
    "ownerEmail": "admin@acme.com",
    "ownerName": "John Doe",
    "ownerPassword": "securepass123",
    "plan": "free",
    "trial": true
  }'
```

### 5. Access Tenant

Visit: `http://acme.localhost:3000` (development)

Or: `https://acme.nchat.app` (production)

## Architecture

### Database Structure

```
public (global)
├── tenants              → Tenant metadata
├── tenant_usage         → Usage statistics
├── tenant_settings      → Configuration
├── tenant_invitations   → Invite system
├── tenant_audit_logs    → Audit trail
└── stripe_webhooks      → Billing events

tenant_acme (isolated)
├── nchat_users          → Acme's users
├── nchat_channels       → Acme's channels
├── nchat_messages       → Acme's messages
└── ...                  → All chat tables

tenant_demo (isolated)
├── nchat_users
├── nchat_channels
└── ...
```

### Request Flow

```
1. User → acme.nchat.app
2. Middleware → Extract subdomain "acme"
3. Database → Fetch tenant metadata
4. Context → Set X-Tenant-Id, X-Tenant-Schema
5. Queries → All scoped to tenant_acme schema
6. Response → Tenant-branded UI
```

## Key Components

### 1. Tenant Service (`src/lib/tenants/tenant-service.ts`)

Core service for tenant CRUD operations:

```typescript
import { getTenantService } from '@/lib/tenants/tenant-service'

const service = getTenantService()

// Create tenant
const tenant = await service.createTenant({
  name: 'Acme Corp',
  slug: 'acme',
  ownerEmail: 'admin@acme.com',
  // ...
})

// Get tenant
const tenant = await service.getTenantBySlug('acme')

// Update tenant
await service.updateTenant(tenant.id, {
  name: 'Acme Corporation'
})

// Delete tenant
await service.deleteTenant(tenant.id)
```

### 2. Billing Service (`src/lib/billing/stripe-service.ts`)

Stripe integration for subscriptions:

```typescript
import { getStripeBillingService } from '@/lib/billing/stripe-service'

const billing = getStripeBillingService()

// Create checkout session
const session = await billing.createCheckoutSession(
  tenant,
  'pro',
  'monthly',
  successUrl,
  cancelUrl
)

// Manage subscription
await billing.updateSubscription(tenant, 'enterprise', 'yearly')
await billing.cancelSubscription(tenant)
```

### 3. Tenant Middleware (`src/lib/tenants/tenant-middleware.ts`)

Resolves tenant from domain:

```typescript
// Automatic tenant resolution in middleware
export async function middleware(request: NextRequest) {
  const config = getDefaultTenantConfig()
  const response = await tenantMiddleware(request, config)
  return response
}
```

### 4. Tenant Context (`src/contexts/tenant-context.tsx`)

React context for tenant data:

```typescript
import { useTenant, useTenantFeature } from '@/contexts/tenant-context'

function MyComponent() {
  const { tenant, isLoading } = useTenant()
  const hasVideoCalls = useTenantFeature('videoCalls')

  return (
    <div>
      <h1>{tenant?.name}</h1>
      {hasVideoCalls && <VideoCallButton />}
    </div>
  )
}
```

## Subscription Plans

### Free Plan

- 10 users
- 5 channels
- 1 GB storage
- 1,000 API calls/month
- Basic features only

### Pro Plan ($15/month or $150/year)

- 100 users
- 50 channels
- 100 GB storage
- 50,000 API calls/month
- All features + analytics

### Enterprise Plan ($99/month or $990/year)

- Unlimited users
- Unlimited channels
- Unlimited storage
- Unlimited API calls
- All features + SSO + priority support

### Custom Plan (Contact Sales)

- Custom limits
- Custom features
- Dedicated support
- SLA guarantees

## API Routes

### Tenant Management

- `POST /api/tenants/create` - Create new tenant
- `GET /api/tenants/[id]` - Get tenant
- `PUT /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant
- `GET /api/tenants/by-slug?slug=acme` - Get by subdomain
- `GET /api/tenants/by-domain?domain=chat.acme.com` - Get by custom domain

### Billing

- `POST /api/billing/checkout` - Create Stripe checkout
- `POST /api/billing/portal` - Access billing portal
- `POST /api/billing/webhook` - Stripe webhook endpoint

## Environment Variables

See `.env.multi-tenant.example` for complete configuration.

**Critical Variables**:

```bash
# Multi-tenancy
ENABLE_MULTI_TENANCY=true
NEXT_PUBLIC_BASE_DOMAIN=nchat.app

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...
```

## Deployment

### Production Checklist

- [ ] Wildcard DNS configured (`*.nchat.app`)
- [ ] Wildcard SSL certificate installed
- [ ] Stripe webhook endpoint configured
- [ ] Database migration run
- [ ] Redis cache configured
- [ ] Environment variables set
- [ ] Rate limiting enabled
- [ ] Backups automated

### Docker Deployment

```bash
docker build -t nchat-multi:latest .
docker run -d \
  --name nchat \
  -p 3000:3000 \
  --env-file .env.production \
  nchat-multi:latest
```

### Vercel Deployment

```bash
vercel --prod
vercel env add ENABLE_MULTI_TENANCY production
vercel env add STRIPE_SECRET_KEY production
```

## Security

### Row-Level Security (RLS)

All tenant data protected by PostgreSQL RLS:

```sql
-- Only super admins can see all tenants
CREATE POLICY tenants_super_admin_all ON public.tenants
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'super_admin'
    )
  );

-- Tenant owners can see their own tenant
CREATE POLICY tenants_owner_select ON public.tenants
  FOR SELECT
  USING (owner_id = auth.uid());
```

### Tenant Isolation

- Each tenant schema completely isolated
- Middleware enforces schema scoping
- No shared tables between tenants
- Cross-tenant queries impossible

### Rate Limiting

Per-tenant rate limits based on plan:

- Free: 60 requests/minute
- Pro: 120 requests/minute
- Enterprise: 300 requests/minute

## Monitoring

### Usage Tracking

```sql
-- Current month usage
SELECT * FROM public.tenant_usage
WHERE tenant_id = '{id}' AND period = '2026-01';
```

### Audit Logs

```sql
-- Tenant actions
SELECT * FROM public.tenant_audit_logs
WHERE tenant_id = '{id}'
ORDER BY created_at DESC;
```

### Health Checks

```bash
# Application health
curl https://nchat.app/api/health

# Tenant health
curl https://acme.nchat.app/api/health
```

## Troubleshooting

### Common Issues

1. **Tenant Not Found**
   - Check DNS propagation
   - Verify tenant exists in database
   - Check middleware logs

2. **Stripe Webhook Failing**
   - Verify webhook secret
   - Check Stripe Dashboard events
   - Review webhook logs table

3. **Cross-Tenant Data Leak**
   - CRITICAL: Suspend all tenants
   - Review RLS policies
   - Audit recent queries

## Migration Path

### From Single-Tenant to Multi-Tenant

```sql
-- 1. Create default tenant for existing data
INSERT INTO public.tenants (
  name, slug, status, owner_email, owner_name,
  schema_name, billing_plan
) VALUES (
  'Default Organization',
  'default',
  'active',
  'owner@example.com',
  'Owner',
  'nchat',  -- Point to existing nchat schema
  'enterprise'
);

-- 2. Enable multi-tenancy
-- .env.local
ENABLE_MULTI_TENANCY=true
DISABLE_MULTI_TENANCY=false
DEFAULT_TENANT_SLUG=default
```

## Support

- **Documentation**: `/docs/Multi-Tenant-Deployment.md`
- **GitHub Issues**: https://github.com/yourusername/nself-chat/issues
- **Email**: support@nchat.app

---

**Version**: 0.5.0
**Last Updated**: January 30, 2026
**Status**: Production Ready
