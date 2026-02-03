-- Reverse migration for tenant tables

-- Drop triggers
DROP TRIGGER IF EXISTS tenant_updated_at ON public.tenants;
DROP TRIGGER IF EXISTS tenant_settings_updated_at ON public.tenant_settings;
DROP TRIGGER IF EXISTS tenant_usage_updated_at ON public.tenant_usage;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_tenant_timestamp();
DROP FUNCTION IF EXISTS public.set_tenant_schema(VARCHAR);
DROP FUNCTION IF EXISTS public.set_tenant_context(UUID);
DROP FUNCTION IF EXISTS public.current_tenant_id();

-- Drop tables
DROP TABLE IF EXISTS public.tenant_audit_log;
DROP TABLE IF EXISTS public.tenant_domains;
DROP TABLE IF EXISTS public.tenant_usage;
DROP TABLE IF EXISTS public.tenant_settings;
DROP TABLE IF EXISTS public.tenants;
