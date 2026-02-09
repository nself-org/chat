-- SSO Configuration Tables Migration
-- Created: 2026-02-07
-- Purpose: Add SAML/OIDC SSO configuration tables for enterprise single sign-on

-- ============================================================================
-- SSO Connections Table (nchat_sso_connections)
-- ============================================================================
-- Stores SSO provider configurations for SAML and OIDC connections.
-- Each connection represents a link to an external Identity Provider (IdP).

CREATE TABLE IF NOT EXISTS public.nchat_sso_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,  -- For multi-tenant deployments (nullable for single-tenant)

  -- Connection metadata
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(32) NOT NULL,  -- 'okta', 'azure-ad', 'google-workspace', 'onelogin', 'auth0', 'ping-identity', 'jumpcloud', 'generic-saml', 'oidc'
  enabled BOOLEAN NOT NULL DEFAULT false,

  -- Protocol type
  protocol VARCHAR(10) NOT NULL DEFAULT 'saml',  -- 'saml' or 'oidc'

  -- Identity Provider configuration (JSONB for flexibility)
  -- For SAML: idpEntityId, idpSsoUrl, idpSloUrl, idpCertificate
  -- For OIDC: issuer, clientId, clientSecret (encrypted), authorizationUrl, tokenUrl, userInfoUrl
  config JSONB NOT NULL DEFAULT '{}',

  -- Domain restrictions (email domains allowed to use this connection)
  domains JSONB NOT NULL DEFAULT '[]',

  -- SAML-specific: IdP Entity ID (for quick lookups)
  entity_id VARCHAR(512),

  -- SAML-specific: SSO Login URL
  sso_url VARCHAR(2048),

  -- SAML-specific: X.509 Certificate (PEM format, stored securely)
  certificate TEXT,

  -- SAML-specific: Metadata URL for auto-configuration
  metadata_url VARCHAR(2048),

  -- Additional metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_provider CHECK (provider IN (
    'okta', 'azure-ad', 'google-workspace', 'onelogin',
    'auth0', 'ping-identity', 'jumpcloud', 'generic-saml', 'oidc'
  )),
  CONSTRAINT valid_protocol CHECK (protocol IN ('saml', 'oidc'))
);

-- Indexes for sso_connections
CREATE INDEX IF NOT EXISTS idx_sso_connections_tenant ON public.nchat_sso_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sso_connections_enabled ON public.nchat_sso_connections(enabled);
CREATE INDEX IF NOT EXISTS idx_sso_connections_provider ON public.nchat_sso_connections(provider);
CREATE INDEX IF NOT EXISTS idx_sso_connections_protocol ON public.nchat_sso_connections(protocol);
CREATE INDEX IF NOT EXISTS idx_sso_connections_entity_id ON public.nchat_sso_connections(entity_id);

-- GIN index for domain lookups (searching within JSONB array)
CREATE INDEX IF NOT EXISTS idx_sso_connections_domains ON public.nchat_sso_connections USING GIN (domains);

-- ============================================================================
-- SSO Sessions Table
-- ============================================================================
-- Tracks active SSO sessions for logout and session management

CREATE TABLE IF NOT EXISTS public.nchat_sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.nchat_sso_connections(id) ON DELETE CASCADE,

  -- SAML session info
  name_id VARCHAR(512),  -- SAML NameID
  session_index VARCHAR(256),  -- SAML SessionIndex for SLO

  -- Session state
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  authenticated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  logged_out_at TIMESTAMPTZ,

  -- Index for user sessions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sso_sessions
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON public.nchat_sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_connection ON public.nchat_sso_sessions(connection_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_active ON public.nchat_sso_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON public.nchat_sso_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_name_id ON public.nchat_sso_sessions(name_id);

-- ============================================================================
-- SSO Audit Log Table
-- ============================================================================
-- Tracks SSO login attempts, successes, and failures for security auditing

CREATE TABLE IF NOT EXISTS public.nchat_sso_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.nchat_sso_connections(id) ON DELETE SET NULL,
  user_id UUID,  -- Null for failed login attempts

  -- Event info
  event_type VARCHAR(32) NOT NULL,  -- 'login_initiated', 'login_success', 'login_failed', 'logout', 'provisioned'

  -- Request details
  email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- Result
  success BOOLEAN NOT NULL,
  error_code VARCHAR(64),
  error_message TEXT,

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for sso_audit_log
CREATE INDEX IF NOT EXISTS idx_sso_audit_connection ON public.nchat_sso_audit_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_user ON public.nchat_sso_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_audit_event ON public.nchat_sso_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_sso_audit_success ON public.nchat_sso_audit_log(success);
CREATE INDEX IF NOT EXISTS idx_sso_audit_created ON public.nchat_sso_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_sso_audit_email ON public.nchat_sso_audit_log(email);

-- ============================================================================
-- SSO Domain Mappings Table
-- ============================================================================
-- Maps email domains to SSO connections for automatic provider detection

CREATE TABLE IF NOT EXISTS public.nchat_sso_domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,  -- e.g., 'company.com'
  connection_id UUID NOT NULL REFERENCES public.nchat_sso_connections(id) ON DELETE CASCADE,

  -- Priority for multiple connections on same domain
  priority INTEGER NOT NULL DEFAULT 0,

  -- Whether this mapping is active
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique domain per active connection
  UNIQUE(domain, connection_id)
);

-- Indexes for sso_domain_mappings
CREATE INDEX IF NOT EXISTS idx_sso_domains_domain ON public.nchat_sso_domain_mappings(domain);
CREATE INDEX IF NOT EXISTS idx_sso_domains_connection ON public.nchat_sso_domain_mappings(connection_id);
CREATE INDEX IF NOT EXISTS idx_sso_domains_active ON public.nchat_sso_domain_mappings(is_active) WHERE is_active = true;

-- ============================================================================
-- SSO Provider Metadata Cache Table
-- ============================================================================
-- Caches IdP metadata for providers that support metadata URLs

CREATE TABLE IF NOT EXISTS public.nchat_sso_metadata_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.nchat_sso_connections(id) ON DELETE CASCADE,

  -- Cached metadata
  metadata_xml TEXT,
  entity_id VARCHAR(512),
  sso_url VARCHAR(2048),
  slo_url VARCHAR(2048),
  certificate TEXT,

  -- Cache info
  source_url VARCHAR(2048) NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Fetch result
  is_valid BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(connection_id)
);

-- Indexes for sso_metadata_cache
CREATE INDEX IF NOT EXISTS idx_sso_metadata_connection ON public.nchat_sso_metadata_cache(connection_id);
CREATE INDEX IF NOT EXISTS idx_sso_metadata_expires ON public.nchat_sso_metadata_cache(expires_at);

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Auto-update updated_at timestamp for sso_connections
CREATE TRIGGER update_sso_connections_updated_at
    BEFORE UPDATE ON public.nchat_sso_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp for sso_domain_mappings
CREATE TRIGGER update_sso_domain_mappings_updated_at
    BEFORE UPDATE ON public.nchat_sso_domain_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at timestamp for sso_metadata_cache
CREATE TRIGGER update_sso_metadata_cache_updated_at
    BEFORE UPDATE ON public.nchat_sso_metadata_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all SSO tables
ALTER TABLE public.nchat_sso_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nchat_sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nchat_sso_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nchat_sso_domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nchat_sso_metadata_cache ENABLE ROW LEVEL SECURITY;

-- SSO Connections: Admin-only access
CREATE POLICY sso_connections_admin_all ON public.nchat_sso_connections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.nchat_users u
            JOIN public.nchat_roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('owner', 'admin')
        )
    );

-- SSO Connections: Read for enabled connections (for login page)
CREATE POLICY sso_connections_public_read ON public.nchat_sso_connections
    FOR SELECT
    USING (enabled = true);

-- SSO Sessions: Users can view their own sessions
CREATE POLICY sso_sessions_own_read ON public.nchat_sso_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- SSO Sessions: Admins can view all sessions
CREATE POLICY sso_sessions_admin_all ON public.nchat_sso_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.nchat_users u
            JOIN public.nchat_roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('owner', 'admin')
        )
    );

-- SSO Audit Log: Admin-only access
CREATE POLICY sso_audit_admin_all ON public.nchat_sso_audit_log
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.nchat_users u
            JOIN public.nchat_roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('owner', 'admin')
        )
    );

-- SSO Domain Mappings: Admin-only access
CREATE POLICY sso_domains_admin_all ON public.nchat_sso_domain_mappings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.nchat_users u
            JOIN public.nchat_roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('owner', 'admin')
        )
    );

-- SSO Metadata Cache: Admin-only access
CREATE POLICY sso_metadata_admin_all ON public.nchat_sso_metadata_cache
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.nchat_users u
            JOIN public.nchat_roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.nchat_sso_connections IS 'SSO/SAML connection configurations for enterprise single sign-on';
COMMENT ON TABLE public.nchat_sso_sessions IS 'Active SSO sessions for tracking and single logout';
COMMENT ON TABLE public.nchat_sso_audit_log IS 'Security audit log for SSO authentication events';
COMMENT ON TABLE public.nchat_sso_domain_mappings IS 'Email domain to SSO connection mappings';
COMMENT ON TABLE public.nchat_sso_metadata_cache IS 'Cached IdP metadata from metadata URLs';

COMMENT ON COLUMN public.nchat_sso_connections.provider IS 'SSO provider type (okta, azure-ad, google-workspace, etc.)';
COMMENT ON COLUMN public.nchat_sso_connections.protocol IS 'Authentication protocol (saml or oidc)';
COMMENT ON COLUMN public.nchat_sso_connections.config IS 'Full provider configuration as JSONB';
COMMENT ON COLUMN public.nchat_sso_connections.domains IS 'Array of email domains allowed for this connection';
COMMENT ON COLUMN public.nchat_sso_connections.entity_id IS 'SAML IdP Entity ID for quick lookups';
COMMENT ON COLUMN public.nchat_sso_connections.certificate IS 'X.509 certificate for signature validation';
COMMENT ON COLUMN public.nchat_sso_connections.metadata_url IS 'URL to fetch IdP metadata for auto-configuration';
