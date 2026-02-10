-- ═══════════════════════════════════════════════════════════════════════════════
-- Tenant Branding & White-Label Schema
-- Phase 15: Complete White-Label Platform Implementation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────────
-- Tenant Base Table
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,

  -- Template selection
  template_id VARCHAR(50) DEFAULT 'default',
  template_version VARCHAR(20),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
  is_white_labeled BOOLEAN DEFAULT false,

  -- Subscription
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_tenant_owner FOREIGN KEY (owner_id) REFERENCES nchat_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_tenants_slug ON nchat_tenants(slug);
CREATE INDEX idx_tenants_owner ON nchat_tenants(owner_id);
CREATE INDEX idx_tenants_status ON nchat_tenants(status);

-- ───────────────────────────────────────────────────────────────────────────────
-- Tenant Branding Configuration
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL,

  -- App Identity
  app_name VARCHAR(100),
  tagline TEXT,
  company_name VARCHAR(255),
  website_url TEXT,

  -- Logo Assets
  logo_url TEXT,
  logo_dark_url TEXT,
  logo_scale DECIMAL(3,2) DEFAULT 1.00 CHECK (logo_scale >= 0.5 AND logo_scale <= 2.0),
  logo_svg TEXT, -- Inline SVG for generated logos

  -- Favicon
  favicon_url TEXT,
  favicon_svg TEXT,

  -- Email Assets
  email_header_url TEXT,
  email_footer_html TEXT,

  -- Fonts
  primary_font VARCHAR(100) DEFAULT 'Inter',
  heading_font VARCHAR(100) DEFAULT 'Inter',
  mono_font VARCHAR(100) DEFAULT 'JetBrains Mono',
  font_urls JSONB, -- { "primary": "url", "heading": "url", "mono": "url" }

  -- Custom Domain
  custom_domain VARCHAR(255),
  domain_verified BOOLEAN DEFAULT false,
  domain_verified_at TIMESTAMP WITH TIME ZONE,
  ssl_enabled BOOLEAN DEFAULT false,

  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_image_url TEXT,

  -- Social Links
  social_links JSONB, -- { "twitter": "url", "linkedin": "url", etc. }

  -- Legal
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  support_email VARCHAR(255),
  contact_email VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_branding_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_branding_tenant ON nchat_tenant_branding(tenant_id);
CREATE INDEX idx_branding_domain ON nchat_tenant_branding(custom_domain);

-- ───────────────────────────────────────────────────────────────────────────────
-- Theme Configuration (16 Color Properties per Mode)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_tenant_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL,

  -- Theme Mode
  default_mode VARCHAR(20) DEFAULT 'system' CHECK (default_mode IN ('light', 'dark', 'system')),

  -- Light Mode Colors (16 properties)
  light_primary_color VARCHAR(7) DEFAULT '#3B82F6',
  light_secondary_color VARCHAR(7) DEFAULT '#6B7280',
  light_accent_color VARCHAR(7) DEFAULT '#8B5CF6',
  light_background_color VARCHAR(7) DEFAULT '#FFFFFF',
  light_surface_color VARCHAR(7) DEFAULT '#F9FAFB',
  light_card_color VARCHAR(7) DEFAULT '#FFFFFF',
  light_popover_color VARCHAR(7) DEFAULT '#FFFFFF',
  light_text_color VARCHAR(7) DEFAULT '#18181B',
  light_text_muted_color VARCHAR(7) DEFAULT '#71717A',
  light_text_inverse_color VARCHAR(7) DEFAULT '#FFFFFF',
  light_border_color VARCHAR(7) DEFAULT '#E4E4E7',
  light_border_muted_color VARCHAR(7) DEFAULT '#F4F4F5',
  light_button_primary_bg VARCHAR(7) DEFAULT '#3B82F6',
  light_button_primary_text VARCHAR(7) DEFAULT '#FFFFFF',
  light_button_secondary_bg VARCHAR(7) DEFAULT '#F4F4F5',
  light_button_secondary_text VARCHAR(7) DEFAULT '#18181B',
  light_button_ghost_hover VARCHAR(7) DEFAULT '#F4F4F5',
  light_success_color VARCHAR(7) DEFAULT '#22C55E',
  light_warning_color VARCHAR(7) DEFAULT '#F59E0B',
  light_error_color VARCHAR(7) DEFAULT '#EF4444',
  light_info_color VARCHAR(7) DEFAULT '#3B82F6',
  light_link_color VARCHAR(7) DEFAULT '#3B82F6',
  light_focus_ring_color VARCHAR(7) DEFAULT '#3B82F6',
  light_selection_bg VARCHAR(9) DEFAULT '#3B82F620',
  light_highlight_bg VARCHAR(7) DEFAULT '#FEF08A',

  -- Dark Mode Colors (16 properties)
  dark_primary_color VARCHAR(7) DEFAULT '#60A5FA',
  dark_secondary_color VARCHAR(7) DEFAULT '#9CA3AF',
  dark_accent_color VARCHAR(7) DEFAULT '#A78BFA',
  dark_background_color VARCHAR(7) DEFAULT '#09090B',
  dark_surface_color VARCHAR(7) DEFAULT '#18181B',
  dark_card_color VARCHAR(7) DEFAULT '#18181B',
  dark_popover_color VARCHAR(7) DEFAULT '#18181B',
  dark_text_color VARCHAR(7) DEFAULT '#FAFAFA',
  dark_text_muted_color VARCHAR(7) DEFAULT '#A1A1AA',
  dark_text_inverse_color VARCHAR(7) DEFAULT '#18181B',
  dark_border_color VARCHAR(7) DEFAULT '#27272A',
  dark_border_muted_color VARCHAR(7) DEFAULT '#18181B',
  dark_button_primary_bg VARCHAR(7) DEFAULT '#60A5FA',
  dark_button_primary_text VARCHAR(7) DEFAULT '#18181B',
  dark_button_secondary_bg VARCHAR(7) DEFAULT '#27272A',
  dark_button_secondary_text VARCHAR(7) DEFAULT '#FAFAFA',
  dark_button_ghost_hover VARCHAR(7) DEFAULT '#27272A',
  dark_success_color VARCHAR(7) DEFAULT '#4ADE80',
  dark_warning_color VARCHAR(7) DEFAULT '#FBBF24',
  dark_error_color VARCHAR(7) DEFAULT '#F87171',
  dark_info_color VARCHAR(7) DEFAULT '#60A5FA',
  dark_link_color VARCHAR(7) DEFAULT '#60A5FA',
  dark_focus_ring_color VARCHAR(7) DEFAULT '#60A5FA',
  dark_selection_bg VARCHAR(9) DEFAULT '#60A5FA20',
  dark_highlight_bg VARCHAR(7) DEFAULT '#713F12',

  -- Platform-specific colors (optional)
  light_message_bubble_own VARCHAR(7),
  light_message_bubble_other VARCHAR(7),
  dark_message_bubble_own VARCHAR(7),
  dark_message_bubble_other VARCHAR(7),

  -- Custom CSS
  custom_css TEXT,
  custom_css_enabled BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_theme_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_themes_tenant ON nchat_tenant_themes(tenant_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Template Feature Configuration
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL,

  -- Core Features
  public_channels BOOLEAN DEFAULT true,
  private_channels BOOLEAN DEFAULT true,
  direct_messages BOOLEAN DEFAULT true,
  group_messages BOOLEAN DEFAULT true,

  -- Messaging Features
  threads BOOLEAN DEFAULT true,
  thread_style VARCHAR(20) DEFAULT 'panel' CHECK (thread_style IN ('panel', 'inline', 'popup')),
  reactions BOOLEAN DEFAULT true,
  reaction_style VARCHAR(20) DEFAULT 'inline' CHECK (reaction_style IN ('inline', 'floating', 'hover')),
  message_editing BOOLEAN DEFAULT true,
  message_deletion BOOLEAN DEFAULT true,
  message_pinning BOOLEAN DEFAULT true,
  message_bookmarking BOOLEAN DEFAULT true,
  message_starring BOOLEAN DEFAULT true,
  message_forwarding BOOLEAN DEFAULT true,
  message_scheduling BOOLEAN DEFAULT false,

  -- Rich Content
  file_uploads BOOLEAN DEFAULT true,
  voice_messages BOOLEAN DEFAULT true,
  code_blocks BOOLEAN DEFAULT true,
  markdown BOOLEAN DEFAULT true,
  link_previews BOOLEAN DEFAULT true,
  emoji_picker VARCHAR(20) DEFAULT 'both' CHECK (emoji_picker IN ('native', 'custom', 'both')),
  gif_picker BOOLEAN DEFAULT true,
  sticker_picker BOOLEAN DEFAULT false,

  -- Real-time Features
  typing_indicators BOOLEAN DEFAULT true,
  typing_style VARCHAR(20) DEFAULT 'dots' CHECK (typing_style IN ('dots', 'text', 'avatar')),
  user_presence BOOLEAN DEFAULT true,
  read_receipts BOOLEAN DEFAULT true,
  read_receipt_style VARCHAR(20) DEFAULT 'checkmarks' CHECK (read_receipt_style IN ('checkmarks', 'avatars', 'text')),

  -- Communication
  voice_calls BOOLEAN DEFAULT false,
  video_calls BOOLEAN DEFAULT false,
  screen_sharing BOOLEAN DEFAULT false,
  live_streaming BOOLEAN DEFAULT false,

  -- Collaboration
  polls BOOLEAN DEFAULT true,
  reminders BOOLEAN DEFAULT true,
  tasks BOOLEAN DEFAULT false,
  calendar BOOLEAN DEFAULT false,

  -- Search & Discovery
  search BOOLEAN DEFAULT true,
  semantic_search BOOLEAN DEFAULT false,
  channel_discovery BOOLEAN DEFAULT true,

  -- Security & Privacy
  e2ee BOOLEAN DEFAULT false,
  disappearing_messages BOOLEAN DEFAULT false,
  view_once_media BOOLEAN DEFAULT false,
  screenshot_protection BOOLEAN DEFAULT false,

  -- Integrations
  webhooks BOOLEAN DEFAULT false,
  bots BOOLEAN DEFAULT false,
  slack_integration BOOLEAN DEFAULT false,
  github_integration BOOLEAN DEFAULT false,
  jira_integration BOOLEAN DEFAULT false,

  -- Moderation
  auto_moderation BOOLEAN DEFAULT false,
  profanity_filter BOOLEAN DEFAULT false,
  spam_detection BOOLEAN DEFAULT false,

  -- Layout Configuration
  sidebar_position VARCHAR(10) DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right')),
  sidebar_width INTEGER DEFAULT 280,
  sidebar_collapsible BOOLEAN DEFAULT true,
  header_height INTEGER DEFAULT 64,
  show_header_border BOOLEAN DEFAULT true,

  -- Message Layout
  message_density VARCHAR(20) DEFAULT 'comfortable' CHECK (message_density IN ('compact', 'comfortable', 'spacious')),
  message_grouping BOOLEAN DEFAULT true,
  message_grouping_timeout INTEGER DEFAULT 5, -- minutes

  -- Avatar Configuration
  avatar_style VARCHAR(20) DEFAULT 'circle' CHECK (avatar_style IN ('circle', 'rounded', 'square')),
  avatar_size VARCHAR(10) DEFAULT 'md' CHECK (avatar_size IN ('xs', 'sm', 'md', 'lg', 'xl')),
  show_avatar_in_group VARCHAR(20) DEFAULT 'first' CHECK (show_avatar_in_group IN ('first', 'last', 'all', 'hover', 'none')),

  -- Channel Layout
  show_channel_icons BOOLEAN DEFAULT true,
  show_channel_description BOOLEAN DEFAULT true,
  show_member_count BOOLEAN DEFAULT true,
  channel_list_density VARCHAR(20) DEFAULT 'comfortable' CHECK (channel_list_density IN ('compact', 'comfortable')),

  -- User Layout
  show_user_status BOOLEAN DEFAULT true,
  show_presence_dots BOOLEAN DEFAULT true,
  presence_dot_position VARCHAR(20) DEFAULT 'bottom-right' CHECK (presence_dot_position IN ('bottom-right', 'bottom-left', 'top-right')),

  -- Animation
  enable_animations BOOLEAN DEFAULT true,
  reduced_motion BOOLEAN DEFAULT false,
  transition_duration VARCHAR(20) DEFAULT 'normal' CHECK (transition_duration IN ('fast', 'normal', 'slow')),
  message_appear VARCHAR(20) DEFAULT 'fade' CHECK (message_appear IN ('fade', 'slide', 'none')),
  sidebar_transition VARCHAR(20) DEFAULT 'slide' CHECK (sidebar_transition IN ('slide', 'overlay', 'push')),
  modal_transition VARCHAR(20) DEFAULT 'fade' CHECK (modal_transition IN ('fade', 'scale', 'slide')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_features_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_features_tenant ON nchat_tenant_features(tenant_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Template Terminology (WhatsApp, Slack, Discord, etc.)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_tenant_terminology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL,

  -- Core Concepts
  workspace VARCHAR(50) DEFAULT 'Workspace',
  workspace_plural VARCHAR(50) DEFAULT 'Workspaces',
  channel VARCHAR(50) DEFAULT 'Channel',
  channel_plural VARCHAR(50) DEFAULT 'Channels',
  direct_message VARCHAR(50) DEFAULT 'Direct Message',
  direct_message_plural VARCHAR(50) DEFAULT 'Direct Messages',
  direct_message_short VARCHAR(10) DEFAULT 'DM',
  thread VARCHAR(50) DEFAULT 'Thread',
  thread_plural VARCHAR(50) DEFAULT 'Threads',
  member VARCHAR(50) DEFAULT 'Member',
  member_plural VARCHAR(50) DEFAULT 'Members',
  message VARCHAR(50) DEFAULT 'Message',
  message_plural VARCHAR(50) DEFAULT 'Messages',
  reaction VARCHAR(50) DEFAULT 'Reaction',
  reaction_plural VARCHAR(50) DEFAULT 'Reactions',

  -- Actions
  send_message VARCHAR(50) DEFAULT 'Send',
  edit_message VARCHAR(50) DEFAULT 'Edit',
  delete_message VARCHAR(50) DEFAULT 'Delete',
  reply_to_thread VARCHAR(50) DEFAULT 'Reply in thread',
  create_channel VARCHAR(50) DEFAULT 'Create channel',
  join_channel VARCHAR(50) DEFAULT 'Join channel',
  leave_channel VARCHAR(50) DEFAULT 'Leave channel',

  -- Placeholders
  message_input_placeholder TEXT DEFAULT 'Type a message...',
  search_placeholder TEXT DEFAULT 'Search',
  new_channel_placeholder TEXT DEFAULT 'New channel name',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_terminology_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_terminology_tenant ON nchat_tenant_terminology(tenant_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Template Presets (WhatsApp, Slack, Discord, Telegram, Default)
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_template_presets (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(20),
  author VARCHAR(100),

  -- Preview
  preview_image_url TEXT,
  screenshot_urls JSONB,

  -- Configuration (stored as JSONB for flexibility)
  theme_config JSONB NOT NULL,
  feature_config JSONB NOT NULL,
  layout_config JSONB NOT NULL,
  terminology_config JSONB NOT NULL,
  animation_config JSONB NOT NULL,

  -- Custom CSS
  custom_css TEXT,

  -- Metadata
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_presets_active ON nchat_template_presets(is_active);
CREATE INDEX idx_presets_official ON nchat_template_presets(is_official);

-- ───────────────────────────────────────────────────────────────────────────────
-- Branding Asset Upload History
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_branding_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Asset Info
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('logo', 'logo_dark', 'favicon', 'email_header', 'og_image', 'custom')),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Dimensions
  width INTEGER,
  height INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_asset_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_asset_uploader FOREIGN KEY (uploaded_by) REFERENCES nchat_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_assets_tenant ON nchat_branding_assets(tenant_id);
CREATE INDEX idx_assets_type ON nchat_branding_assets(asset_type);
CREATE INDEX idx_assets_active ON nchat_branding_assets(is_active);

-- ───────────────────────────────────────────────────────────────────────────────
-- Custom Domain Configuration & Verification
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Domain Info
  domain VARCHAR(255) UNIQUE NOT NULL,
  subdomain VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,

  -- Verification
  verification_token VARCHAR(255),
  verification_method VARCHAR(50) CHECK (verification_method IN ('dns_txt', 'dns_cname', 'file', 'email')),
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  verified_at TIMESTAMP WITH TIME ZONE,

  -- SSL/TLS
  ssl_status VARCHAR(50) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'provisioning', 'active', 'failed', 'renewing')),
  ssl_certificate TEXT,
  ssl_expires_at TIMESTAMP WITH TIME ZONE,

  -- DNS Configuration
  dns_configured BOOLEAN DEFAULT false,
  dns_records JSONB, -- [ { "type": "A", "name": "@", "value": "1.2.3.4" }, ... ]

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_domain_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_domains_tenant ON nchat_custom_domains(tenant_id);
CREATE INDEX idx_domains_domain ON nchat_custom_domains(domain);
CREATE INDEX idx_domains_status ON nchat_custom_domains(verification_status);

-- ───────────────────────────────────────────────────────────────────────────────
-- Theme Export/Import History
-- ───────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nchat_theme_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Export Info
  export_name VARCHAR(255),
  export_data JSONB NOT NULL,
  export_version VARCHAR(20),

  -- Metadata
  exported_by UUID,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_export_tenant FOREIGN KEY (tenant_id) REFERENCES nchat_tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_export_user FOREIGN KEY (exported_by) REFERENCES nchat_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_exports_tenant ON nchat_theme_exports(tenant_id);

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions & Triggers
-- ───────────────────────────────────────────────────────────────────────────────

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON nchat_tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branding_updated_at BEFORE UPDATE ON nchat_tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON nchat_tenant_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON nchat_tenant_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_terminology_updated_at BEFORE UPDATE ON nchat_tenant_terminology
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON nchat_template_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON nchat_custom_domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────────────────────────
-- RLS Policies (Row Level Security)
-- ───────────────────────────────────────────────────────────────────────────────

ALTER TABLE nchat_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_tenant_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_tenant_terminology ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_branding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_theme_exports ENABLE ROW LEVEL SECURITY;

-- Tenants: Owners can manage their own tenants
CREATE POLICY tenant_owner_policy ON nchat_tenants
  FOR ALL USING (owner_id = auth.uid());

-- Branding: Tenant owners can manage branding
CREATE POLICY branding_owner_policy ON nchat_tenant_branding
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Themes: Tenant owners can manage themes
CREATE POLICY theme_owner_policy ON nchat_tenant_themes
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Features: Tenant owners can manage features
CREATE POLICY features_owner_policy ON nchat_tenant_features
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Terminology: Tenant owners can manage terminology
CREATE POLICY terminology_owner_policy ON nchat_tenant_terminology
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Assets: Tenant owners can manage assets
CREATE POLICY assets_owner_policy ON nchat_branding_assets
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Domains: Tenant owners can manage domains
CREATE POLICY domains_owner_policy ON nchat_custom_domains
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Exports: Tenant owners can manage exports
CREATE POLICY exports_owner_policy ON nchat_theme_exports
  FOR ALL USING (tenant_id IN (
    SELECT id FROM nchat_tenants WHERE owner_id = auth.uid()
  ));

-- Template Presets: Public read, admin write
CREATE POLICY presets_read_policy ON nchat_template_presets
  FOR SELECT USING (is_active = true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- End of Tenant Branding Schema
-- ═══════════════════════════════════════════════════════════════════════════════
