# Changelog - Version 0.5.0

**Release Date**: January 30, 2026
**Status**: Major Release - Multi-Tenant Architecture

---

## 🎉 Major Features

### Multi-Tenant SaaS Architecture

nself-chat v0.5.0 introduces a production-ready multi-tenant system, transforming the platform into a fully-featured SaaS application.

**Key Capabilities**:
- ✅ **Subdomain Routing**: Automatic tenant resolution from subdomains (`tenant.nchat.app`)
- ✅ **Custom Domains**: Optional custom domain support (`chat.acme.com`)
- ✅ **Schema-Level Isolation**: Each tenant gets isolated PostgreSQL schema
- ✅ **Stripe Billing**: Full subscription management (Free, Pro, Enterprise, Custom plans)
- ✅ **Resource Limits**: Per-plan usage enforcement (users, storage, API calls)
- ✅ **Usage Tracking**: Real-time monitoring and analytics per tenant
- ✅ **Tenant Management**: Complete CRUD operations via API
- ✅ **Row-Level Security**: PostgreSQL RLS policies for data protection

---

## 🏗️ Architecture Changes

### Database Schema

**New Global Tables** (in `public` schema):
- `tenants` - Tenant organizations metadata
- `tenant_usage` - Usage statistics per tenant per month
- `tenant_settings` - Tenant-specific configuration
- `tenant_invitations` - Invite system for tenant onboarding
- `tenant_audit_logs` - Audit trail for administrative actions
- `stripe_webhooks` - Stripe webhook event log

**Tenant Isolation**:
- Each tenant gets dedicated schema: `tenant_{slug}`
- Complete isolation of all chat data (users, channels, messages, etc.)
- Automatic schema provisioning on tenant creation

### Middleware Enhancement

**Tenant Resolution**:
```typescript
// Before: Single-tenant
export function middleware(request: NextRequest) {
  // Authentication only
}

// After: Multi-tenant + Authentication
export async function middleware(request: NextRequest) {
  // 1. Resolve tenant from subdomain/domain
  // 2. Set tenant context headers
  // 3. Authenticate user
  // 4. Enforce tenant-scoped access
}
```

---

## 📦 New Components

### Tenant Management

**Core Service** (`src/lib/tenants/tenant-service.ts`):
```typescript
class TenantService {
  createTenant(request: CreateTenantRequest): Promise<Tenant>
  getTenantBySlug(slug: string): Promise<Tenant | null>
  updateTenant(id: string, request: UpdateTenantRequest): Promise<Tenant>
  deleteTenant(id: string): Promise<void>
  checkLimits(tenant: Tenant): Promise<{ exceeded: boolean, limits: string[] }>
}
```

**Middleware** (`src/lib/tenants/tenant-middleware.ts`):
- Subdomain parsing and validation
- Custom domain resolution
- Tenant caching for performance
- Automatic tenant context injection

**Context & Hooks** (`src/contexts/tenant-context.tsx`):
```typescript
// React hooks for tenant operations
useTenant()           // Get current tenant
useTenantFeature()    // Check feature availability
useTenantLimits()     // Check resource limits
useTenantBilling()    // Get billing information
```

### Billing Integration

**Stripe Service** (`src/lib/billing/stripe-service.ts`):
```typescript
class StripeBillingService {
  createCustomer(tenant: Tenant): Promise<string>
  createSubscription(tenant, plan, interval): Promise<Subscription>
  updateSubscription(tenant, newPlan, newInterval): Promise<Subscription>
  cancelSubscription(tenant, immediately): Promise<Subscription>
  createCheckoutSession(...): Promise<CheckoutSession>
  createPortalSession(tenant, returnUrl): Promise<PortalSession>
  processWebhookEvent(event): Promise<void>
}
```

**Webhook Processing**:
- Automatic subscription lifecycle management
- Payment status tracking
- Trial expiration handling
- Usage-based billing support

### API Routes

**Tenant Management**:
- `POST /api/tenants/create` - Create new tenant
- `GET /api/tenants/[id]` - Get tenant details
- `PUT /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant (soft delete)
- `GET /api/tenants/by-slug?slug=acme` - Internal tenant resolution
- `GET /api/tenants/by-domain?domain=chat.acme.com` - Custom domain resolution

**Billing**:
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Access customer billing portal
- `POST /api/billing/webhook` - Stripe webhook endpoint

---

## 💰 Subscription Plans

### Free Plan ($0/month)
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
- All features + analytics + integrations

### Enterprise Plan ($99/month or $990/year)
- Unlimited users, channels, storage
- Unlimited API calls
- All features + SSO + audit logs + priority support

### Custom Plan (Contact Sales)
- Custom resource limits
- Custom feature set
- Dedicated support
- SLA guarantees

---

## 🔐 Security Enhancements

### Row-Level Security (RLS)

**Tenant Isolation Policies**:
```sql
-- Super admins can see all tenants
CREATE POLICY tenants_super_admin_all ON public.tenants
  USING (is_super_admin(auth.uid()));

-- Tenant owners can see their own tenant
CREATE POLICY tenants_owner_select ON public.tenants
  FOR SELECT USING (owner_id = auth.uid());
```

### Data Protection

- **Schema-level isolation**: No shared tables between tenants
- **Middleware enforcement**: Automatic tenant scoping on every request
- **Encrypted storage**: Tenant-specific encryption keys
- **Audit logging**: All administrative actions tracked

### Rate Limiting

Per-tenant rate limits based on subscription plan:
- Free: 60 requests/minute, 1,000 requests/hour
- Pro: 120 requests/minute, 5,000 requests/hour
- Enterprise: 300 requests/minute, 15,000 requests/hour
- Custom: 600 requests/minute, 30,000 requests/hour

---

## 🚀 Deployment

### New Environment Variables

**Required**:
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

**Optional**:
```bash
# Custom domains
ENABLE_CUSTOM_DOMAINS=true
ALLOWED_CUSTOM_DOMAINS=chat.acme.com,team.example.com

# Single-tenant mode
DISABLE_MULTI_TENANCY=false
DEFAULT_TENANT_SLUG=demo
```

### Infrastructure Requirements

**DNS Configuration**:
- Wildcard DNS record: `*.nchat.app → server IP`
- Wildcard SSL certificate for `*.nchat.app`

**Database**:
- PostgreSQL ≥14 with schema support
- Recommended: Connection pooling (PgBouncer)

**Caching**:
- Redis ≥6.0 for tenant metadata caching
- Recommended: Separate Redis instance per environment

---

## 📊 Monitoring & Analytics

### Usage Tracking

**Metrics Collected**:
- Active users per tenant
- Messages sent per tenant
- Storage used per tenant
- API calls per tenant per endpoint
- Call duration and participant counts

**Database Functions**:
```sql
-- Check if tenant has exceeded limits
SELECT public.check_tenant_limits('{tenant_id}');

-- Get current month usage
SELECT * FROM public.tenant_usage
WHERE tenant_id = '{id}' AND period = '2026-01';
```

### Audit Logging

All tenant administrative actions logged:
- Tenant creation/deletion
- Subscription changes
- Feature flag updates
- Custom domain assignments
- User management actions

---

## 📝 Documentation

**New Documentation**:
- `/docs/Multi-Tenant-Deployment.md` - Complete deployment guide (12,000+ words)
- `/docs/Multi-Tenant-README.md` - Quick start guide
- `.env.multi-tenant.example` - Environment configuration template

**Migration Guides**:
- Single-tenant to multi-tenant migration
- Self-hosted to SaaS conversion
- Development to production checklist

---

## 🔄 Migration Guide

### From v0.4.0 to v0.5.0

**1. Database Migration**:
```bash
cd .backend
nself db migrate up 030_multi_tenant_system.sql
```

**2. Create Default Tenant** (for existing installations):
```sql
INSERT INTO public.tenants (
  name, slug, status, owner_email, owner_name,
  schema_name, billing_plan
) VALUES (
  'Default Organization',
  'default',
  'active',
  'owner@example.com',
  'Owner',
  'nchat',  -- Points to existing nchat schema
  'enterprise'
);
```

**3. Update Environment**:
```bash
# Add to .env.local
ENABLE_MULTI_TENANCY=true
DEFAULT_TENANT_SLUG=default
```

**4. Install Dependencies**:
```bash
pnpm install  # Adds Stripe SDK
```

**5. Test**:
```bash
# Access via default subdomain
http://default.localhost:3000
```

---

## 🐛 Breaking Changes

### Environment Variables

**Renamed**:
- None

**Added** (required for multi-tenant mode):
- `ENABLE_MULTI_TENANCY`
- `NEXT_PUBLIC_BASE_DOMAIN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Deprecated**:
- None

### API Changes

**New Headers** (automatically added by middleware):
- `X-Tenant-Id` - Current tenant UUID
- `X-Tenant-Slug` - Current tenant slug
- `X-Tenant-Schema` - Current tenant schema name
- `X-Tenant-Context` - Complete tenant context JSON

### Database Changes

**New Required Tables**:
- All `public.tenants*` tables (see migration 030)

**Schema Changes**:
- No changes to existing `nchat.*` tables
- Existing data can be migrated to tenant schema

---

## 🎯 Performance

### Optimizations

- **Tenant Caching**: Redis cache for tenant metadata (TTL: 1 hour)
- **Schema Caching**: PostgreSQL prepared statements per schema
- **Connection Pooling**: Per-tenant connection pools
- **CDN Support**: Static assets served via CDN with tenant context

### Benchmarks

**Tenant Resolution**:
- Cached: <1ms
- Uncached: 5-10ms

**Schema Switching**:
- PostgreSQL SET search_path: <1ms

**Total Overhead**:
- Multi-tenant vs single-tenant: +2-5ms per request

---

## 🔮 Future Roadmap

### Planned for v0.6.0

- **Tenant Admin Portal**: UI for managing tenant settings
- **Super Admin Dashboard**: Global tenant management interface
- **Tenant Analytics**: Advanced usage analytics and insights
- **White-Label Customization**: Per-tenant branding and theming
- **API Access**: Tenant-scoped REST and GraphQL APIs
- **Webhook System**: Tenant-configurable webhooks

### Under Consideration

- **Multi-region Support**: Geographic tenant distribution
- **Tenant Groups**: Hierarchical tenant organization
- **Usage-based Billing**: Metered billing for API calls and storage
- **Tenant Import/Export**: Backup and migration tools

---

## 🤝 Contributing

Multi-tenant features are now part of the core platform. Contributions welcome:

- **Bug Reports**: https://github.com/yourusername/nself-chat/issues
- **Feature Requests**: Use "multi-tenant" label
- **Pull Requests**: See CONTRIBUTING.md

---

## 📄 License

Same as nself-chat: MIT License

---

## 🙏 Acknowledgments

Special thanks to:
- Stripe for excellent billing infrastructure
- PostgreSQL for robust schema isolation
- nself CLI team for backend foundation

---

**Full Documentation**: See `/docs/Multi-Tenant-Deployment.md`

**Questions?** support@nchat.app
