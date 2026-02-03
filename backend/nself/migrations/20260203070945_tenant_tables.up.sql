-- Tenant Management Tables
-- Supports multi-tenant architecture with schema-level isolation

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  custom_domain VARCHAR(255) UNIQUE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),

  -- Owner
  owner_id UUID,
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(100) NOT NULL,

  -- Branding
  branding JSONB NOT NULL DEFAULT '{
    "logoUrl": null,
    "faviconUrl": null,
    "primaryColor": "#6366f1",
    "secondaryColor": "#4f46e5",
    "appName": null,
    "tagline": null,
    "customCss": null
  }'::jsonb,

  -- Billing
  billing_plan VARCHAR(20) NOT NULL DEFAULT 'free'
    CHECK (billing_plan IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  billing_interval VARCHAR(10) NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'yearly')),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  last_payment_date TIMESTAMPTZ,
  last_payment_amount INTEGER,
  last_payment_status VARCHAR(20),

  -- Limits (enforced at application level)
  limits JSONB NOT NULL DEFAULT '{
    "maxUsers": 5,
    "maxChannels": 10,
    "maxStorageGB": 1,
    "maxFileSizeMB": 10,
    "maxApiCallsPerMonth": 10000,
    "maxBotsPerWorkspace": 1,
    "maxWebhooksPerWorkspace": 3
  }'::jsonb,

  -- Features (toggles)
  features JSONB NOT NULL DEFAULT '{
    "customEmojis": false,
    "threads": true,
    "reactions": true,
    "fileSharing": true,
    "voiceCalls": false,
    "videoCalls": false,
    "screenSharing": false,
    "guestAccess": false,
    "sso": false,
    "apiAccess": false,
    "customBranding": false,
    "analytics": false,
    "auditLogs": false,
    "dataExport": false,
    "prioritySupport": false
  }'::jsonb,

  -- Schema
  schema_name VARCHAR(100) NOT NULL UNIQUE,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_billing_plan ON public.tenants(billing_plan);
CREATE INDEX idx_tenants_owner_email ON public.tenants(owner_email);

-- ============================================================================
-- TENANT SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- General
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',

  -- Security
  require_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
  require_two_factor BOOLEAN NOT NULL DEFAULT FALSE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
  password_policy JSONB NOT NULL DEFAULT '{
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": false
  }'::jsonb,
  allowed_domains TEXT[] DEFAULT NULL,
  blocked_domains TEXT[] DEFAULT NULL,

  -- Notifications
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,

  -- Retention
  message_retention_days INTEGER NOT NULL DEFAULT 0,
  file_retention_days INTEGER NOT NULL DEFAULT 0,
  audit_log_retention_days INTEGER NOT NULL DEFAULT 90,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TENANT USAGE TABLE (Monthly aggregates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL, -- YYYY-MM format

  -- User metrics
  users_active INTEGER NOT NULL DEFAULT 0,
  users_total INTEGER NOT NULL DEFAULT 0,

  -- Message metrics
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_total INTEGER NOT NULL DEFAULT 0,

  -- Storage metrics
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  files_count INTEGER NOT NULL DEFAULT 0,

  -- Call metrics
  calls_total_minutes INTEGER NOT NULL DEFAULT 0,
  calls_total_count INTEGER NOT NULL DEFAULT 0,

  -- API metrics
  api_calls_total INTEGER NOT NULL DEFAULT 0,
  api_calls_by_endpoint JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, period)
);

CREATE INDEX idx_tenant_usage_tenant_period ON public.tenant_usage(tenant_id, period);

-- ============================================================================
-- TENANT DOMAINS TABLE (Custom domain verification)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL UNIQUE,

  -- Verification
  verification_token VARCHAR(100) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- SSL
  ssl_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ssl_certificate_expires_at TIMESTAMPTZ,

  -- Status
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_domains_tenant ON public.tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON public.tenant_domains(domain);

-- ============================================================================
-- TENANT AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_email VARCHAR(255),

  -- Action
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,

  -- Changes
  old_values JSONB,
  new_values JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Request info
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_audit_log_tenant ON public.tenant_audit_log(tenant_id);
CREATE INDEX idx_tenant_audit_log_created ON public.tenant_audit_log(created_at);
CREATE INDEX idx_tenant_audit_log_action ON public.tenant_audit_log(action);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get current tenant from session
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('app.tenant_id', true)::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Function to set tenant context
CREATE OR REPLACE FUNCTION public.set_tenant_context(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE PLPGSQL;

-- Function to set search path to tenant schema
CREATE OR REPLACE FUNCTION public.set_tenant_schema(p_tenant_slug VARCHAR)
RETURNS VOID AS $$
DECLARE
  v_schema_name VARCHAR;
BEGIN
  SELECT schema_name INTO v_schema_name
  FROM public.tenants
  WHERE slug = p_tenant_slug;

  IF v_schema_name IS NULL THEN
    RAISE EXCEPTION 'Tenant not found: %', p_tenant_slug;
  END IF;

  EXECUTE format('SET search_path TO %I, public', v_schema_name);
END;
$$ LANGUAGE PLPGSQL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_tenant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER tenant_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_tenant_timestamp();

CREATE TRIGGER tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_tenant_timestamp();

CREATE TRIGGER tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_tenant_timestamp();

-- ============================================================================
-- INSERT DEFAULT TENANT (for single-tenant mode)
-- ============================================================================

INSERT INTO public.tenants (
  id,
  name,
  slug,
  owner_email,
  owner_name,
  schema_name,
  billing_plan,
  limits,
  features
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Workspace',
  'default',
  'admin@localhost',
  'Admin',
  'nchat',
  'enterprise',
  '{
    "maxUsers": -1,
    "maxChannels": -1,
    "maxStorageGB": -1,
    "maxFileSizeMB": -1,
    "maxApiCallsPerMonth": -1,
    "maxBotsPerWorkspace": -1,
    "maxWebhooksPerWorkspace": -1
  }'::jsonb,
  '{
    "customEmojis": true,
    "threads": true,
    "reactions": true,
    "fileSharing": true,
    "voiceCalls": true,
    "videoCalls": true,
    "screenSharing": true,
    "guestAccess": true,
    "sso": true,
    "apiAccess": true,
    "customBranding": true,
    "analytics": true,
    "auditLogs": true,
    "dataExport": true,
    "prioritySupport": true
  }'::jsonb
) ON CONFLICT (slug) DO NOTHING;
