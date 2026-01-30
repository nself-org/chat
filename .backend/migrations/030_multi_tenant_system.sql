-- Multi-Tenant System Migration
-- Version: 0.5.0
-- Description: Adds multi-tenant support with schema-level isolation
-- Approach: Schema-level isolation (each tenant gets their own PostgreSQL schema)

-- ========================================
-- Enable Required Extensions
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ========================================
-- Tenants Table (Global - in public schema)
-- ========================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- Subdomain identifier
    custom_domain VARCHAR(255) UNIQUE, -- Optional custom domain
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, trial, cancelled, pending

    -- Owner Information
    owner_id UUID, -- Will reference auth.users
    owner_email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,

    -- Branding (JSONB)
    branding JSONB DEFAULT '{
        "appName": "nChat",
        "primaryColor": "#6366f1",
        "secondaryColor": "#8b5cf6"
    }'::jsonb,

    -- Database Isolation
    schema_name VARCHAR(100) NOT NULL UNIQUE, -- PostgreSQL schema for this tenant

    -- Billing Information
    billing_plan VARCHAR(20) NOT NULL DEFAULT 'free', -- free, pro, enterprise, custom
    billing_interval VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    -- Payment History
    last_payment_date TIMESTAMPTZ,
    last_payment_amount INTEGER, -- In cents
    last_payment_status VARCHAR(20), -- succeeded, failed, pending

    -- Resource Limits (JSONB)
    limits JSONB DEFAULT '{
        "maxUsers": 10,
        "maxChannels": 5,
        "maxStorageGB": 1,
        "maxApiCallsPerMonth": 1000,
        "maxFileUploadSizeMB": 10,
        "maxCallParticipants": 4,
        "maxStreamDurationMinutes": 60,
        "rateLimitPerMinute": 60,
        "rateLimitPerHour": 1000
    }'::jsonb,

    -- Feature Flags (JSONB)
    features JSONB DEFAULT '{
        "publicChannels": true,
        "privateChannels": true,
        "directMessages": true,
        "threads": true,
        "reactions": true,
        "fileUploads": true,
        "voiceMessages": false,
        "videoCalls": false,
        "screenSharing": false,
        "liveStreaming": false,
        "endToEndEncryption": false,
        "slackIntegration": false,
        "githubIntegration": false,
        "webhooks": false,
        "ssoEnabled": false,
        "auditLogs": false,
        "advancedAnalytics": false,
        "customBranding": false,
        "whiteLabel": false,
        "apiAccess": false,
        "prioritySupport": false
    }'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'trial', 'cancelled', 'pending')),
    CONSTRAINT valid_billing_plan CHECK (billing_plan IN ('free', 'pro', 'enterprise', 'custom')),
    CONSTRAINT valid_billing_interval CHECK (billing_interval IN ('monthly', 'yearly'))
);

-- Indexes for tenants table
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_billing_plan ON public.tenants(billing_plan);
CREATE INDEX idx_tenants_owner_email ON public.tenants(owner_email);
CREATE INDEX idx_tenants_stripe_customer_id ON public.tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ========================================
-- Tenant Usage Statistics
-- ========================================

CREATE TABLE IF NOT EXISTS public.tenant_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM format

    -- User Statistics
    users_active INTEGER DEFAULT 0,
    users_total INTEGER DEFAULT 0,

    -- Message Statistics
    messages_sent INTEGER DEFAULT 0,
    messages_total INTEGER DEFAULT 0,

    -- Storage Statistics
    storage_bytes BIGINT DEFAULT 0,
    files_count INTEGER DEFAULT 0,

    -- Call Statistics
    calls_total_minutes INTEGER DEFAULT 0,
    calls_total_count INTEGER DEFAULT 0,

    -- API Statistics
    api_calls_total INTEGER DEFAULT 0,
    api_calls_by_endpoint JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, period)
);

CREATE INDEX idx_tenant_usage_tenant_id ON public.tenant_usage(tenant_id);
CREATE INDEX idx_tenant_usage_period ON public.tenant_usage(period);

-- ========================================
-- Tenant Settings
-- ========================================

CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,

    -- General Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',

    -- Security Settings
    require_email_verification BOOLEAN DEFAULT TRUE,
    require_two_factor BOOLEAN DEFAULT FALSE,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
    password_policy JSONB DEFAULT '{
        "minLength": 8,
        "requireUppercase": true,
        "requireLowercase": true,
        "requireNumbers": true,
        "requireSpecialChars": false
    }'::jsonb,

    -- Notification Settings
    email_notifications BOOLEAN DEFAULT TRUE,
    slack_notifications BOOLEAN DEFAULT FALSE,
    webhook_notifications BOOLEAN DEFAULT FALSE,

    -- Data Retention
    message_retention_days INTEGER DEFAULT 0, -- 0 = forever
    file_retention_days INTEGER DEFAULT 0,
    audit_log_retention_days INTEGER DEFAULT 90,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);

-- ========================================
-- Tenant Invitations
-- ========================================

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    invited_by UUID, -- User ID who sent invitation
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE INDEX idx_tenant_invitations_tenant_id ON public.tenant_invitations(tenant_id);
CREATE INDEX idx_tenant_invitations_email ON public.tenant_invitations(email);
CREATE INDEX idx_tenant_invitations_token ON public.tenant_invitations(token);
CREATE INDEX idx_tenant_invitations_expires_at ON public.tenant_invitations(expires_at);

-- ========================================
-- Tenant Audit Logs
-- ========================================

CREATE TABLE IF NOT EXISTS public.tenant_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID, -- Can be NULL for system actions
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_audit_logs_tenant_id ON public.tenant_audit_logs(tenant_id);
CREATE INDEX idx_tenant_audit_logs_user_id ON public.tenant_audit_logs(user_id);
CREATE INDEX idx_tenant_audit_logs_action ON public.tenant_audit_logs(action);
CREATE INDEX idx_tenant_audit_logs_created_at ON public.tenant_audit_logs(created_at DESC);

-- ========================================
-- Stripe Webhooks Log
-- ========================================

CREATE TABLE IF NOT EXISTS public.stripe_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_stripe_webhooks_event_id ON public.stripe_webhooks(stripe_event_id);
CREATE INDEX idx_stripe_webhooks_tenant_id ON public.stripe_webhooks(tenant_id);
CREATE INDEX idx_stripe_webhooks_processed ON public.stripe_webhooks(processed);
CREATE INDEX idx_stripe_webhooks_created_at ON public.stripe_webhooks(created_at DESC);

-- ========================================
-- Triggers
-- ========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_usage_updated_at
    BEFORE UPDATE ON public.tenant_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
    BEFORE UPDATE ON public.tenant_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- Row-Level Security (RLS) Policies
-- ========================================

-- Enable RLS on tenants table
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can see all tenants
CREATE POLICY tenants_super_admin_all ON public.tenants
    FOR ALL
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

-- Tenant owners can update their own tenant
CREATE POLICY tenants_owner_update ON public.tenants
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Enable RLS on tenant_settings
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_settings_tenant_access ON public.tenant_settings
    FOR ALL
    USING (
        tenant_id IN (
            SELECT id FROM public.tenants WHERE owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'super_admin'
        )
    );

-- ========================================
-- Helper Functions
-- ========================================

-- Function to get tenant by subdomain
CREATE OR REPLACE FUNCTION public.get_tenant_by_subdomain(subdomain TEXT)
RETURNS public.tenants AS $$
    SELECT * FROM public.tenants WHERE slug = subdomain LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to get tenant by custom domain
CREATE OR REPLACE FUNCTION public.get_tenant_by_domain(domain TEXT)
RETURNS public.tenants AS $$
    SELECT * FROM public.tenants WHERE custom_domain = domain LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to check if tenant has exceeded limits
CREATE OR REPLACE FUNCTION public.check_tenant_limits(tenant_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    tenant_record public.tenants;
    usage_record public.tenant_usage;
    current_period TEXT;
    exceeded TEXT[];
BEGIN
    SELECT * INTO tenant_record FROM public.tenants WHERE id = tenant_uuid;

    IF NOT FOUND THEN
        RETURN '{"error": "Tenant not found"}'::jsonb;
    END IF;

    current_period := TO_CHAR(NOW(), 'YYYY-MM');
    SELECT * INTO usage_record FROM public.tenant_usage
    WHERE tenant_id = tenant_uuid AND period = current_period;

    exceeded := ARRAY[]::TEXT[];

    -- Check users limit
    IF (tenant_record.limits->>'maxUsers')::INTEGER != -1
       AND usage_record.users_total > (tenant_record.limits->>'maxUsers')::INTEGER THEN
        exceeded := array_append(exceeded, 'maxUsers');
    END IF;

    -- Check storage limit
    IF (tenant_record.limits->>'maxStorageGB')::INTEGER != -1
       AND usage_record.storage_bytes > (tenant_record.limits->>'maxStorageGB')::BIGINT * 1024 * 1024 * 1024 THEN
        exceeded := array_append(exceeded, 'maxStorageGB');
    END IF;

    -- Check API calls limit
    IF (tenant_record.limits->>'maxApiCallsPerMonth')::INTEGER != -1
       AND usage_record.api_calls_total > (tenant_record.limits->>'maxApiCallsPerMonth')::INTEGER THEN
        exceeded := array_append(exceeded, 'maxApiCallsPerMonth');
    END IF;

    RETURN jsonb_build_object(
        'exceeded', array_length(exceeded, 1) > 0,
        'limits', exceeded
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Initial Data (Demo Tenant)
-- ========================================

-- Insert demo tenant (for development)
INSERT INTO public.tenants (
    name, slug, status, owner_email, owner_name,
    schema_name, billing_plan, trial_ends_at
) VALUES (
    'Demo Organization',
    'demo',
    'trial',
    'owner@demo.com',
    'Demo Owner',
    'tenant_demo',
    'pro',
    NOW() + INTERVAL '14 days'
) ON CONFLICT (slug) DO NOTHING;

-- Create schema for demo tenant
CREATE SCHEMA IF NOT EXISTS tenant_demo;

-- ========================================
-- Comments for Documentation
-- ========================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations. Each tenant gets isolated PostgreSQL schema.';
COMMENT ON TABLE public.tenant_usage IS 'Usage statistics per tenant per month for billing and limits enforcement.';
COMMENT ON TABLE public.tenant_settings IS 'Tenant-specific configuration and preferences.';
COMMENT ON TABLE public.tenant_invitations IS 'Pending invitations to join tenant organizations.';
COMMENT ON TABLE public.tenant_audit_logs IS 'Audit trail for tenant administrative actions.';
COMMENT ON TABLE public.stripe_webhooks IS 'Stripe webhook events for billing automation.';

COMMENT ON COLUMN public.tenants.slug IS 'Unique subdomain identifier (e.g., acme -> acme.nchat.app)';
COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name for tenant data isolation';
COMMENT ON COLUMN public.tenants.limits IS 'JSON object containing resource limits per plan';
COMMENT ON COLUMN public.tenants.features IS 'JSON object containing feature flags per plan';
