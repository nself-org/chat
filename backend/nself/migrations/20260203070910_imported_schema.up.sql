-- Migration generated from DBML import
-- Generated: $(date)

CREATE TABLE IF NOT EXISTS nchat_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  status user_status NOT NULL DEFAULT 'active',
  email_verified BOOLEAN NOT NULL,
  phone VARCHAR(20),
  phone_verified BOOLEAN,
  locale VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  metadata JSONB DEFAULT '{}',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nchat_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  title VARCHAR(100),
  company VARCHAR(100),
  location VARCHAR(100),
  website VARCHAR(255),
  social_links JSONB DEFAULT '{}',
  pronouns VARCHAR(50),
  banner_url TEXT,
  theme_preference VARCHAR(50) DEFAULT 'system',
  custom_status VARCHAR(100),
  custom_status_emoji VARCHAR(10),
  custom_status_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status presence_status NOT NULL DEFAULT 'offline',
  custom_message VARCHAR(255),
  last_heartbeat_at TIMESTAMPTZ DEFAULT now(),
  current_channel_id UUID,
  device_info JSONB DEFAULT '{}',
  is_mobile BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  notifications_enabled BOOLEAN,
  notification_sound BOOLEAN,
  notification_desktop BOOLEAN,
  notification_mobile BOOLEAN,
  notification_email BOOLEAN,
  notification_email_frequency VARCHAR(20) DEFAULT 'instant',
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  show_online_status BOOLEAN,
  show_typing_indicator BOOLEAN,
  read_receipts BOOLEAN,
  allow_dm_from VARCHAR(20) DEFAULT 'everyone',
  compact_mode BOOLEAN,
  theme VARCHAR(50) DEFAULT 'system',
  font_size VARCHAR(20) DEFAULT 'medium',
  message_density VARCHAR(20) DEFAULT 'default',
  keyboard_shortcuts_enabled BOOLEAN,
  custom_shortcuts JSONB DEFAULT '{}',
  reduce_motion BOOLEAN,
  high_contrast BOOLEAN,
  screen_reader_mode BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  is_collapsed BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  category_id UUID,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  topic VARCHAR(500),
  type channel_type NOT NULL DEFAULT 'public',
  icon VARCHAR(50),
  color VARCHAR(7),
  position INTEGER,
  is_default BOOLEAN,
  is_archived BOOLEAN,
  is_readonly BOOLEAN,
  is_nsfw BOOLEAN,
  slowmode_seconds INTEGER,
  max_members INTEGER,
  member_count INTEGER,
  message_count INTEGER,
  last_message_at TIMESTAMPTZ,
  last_message_id UUID,
  retention_days INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nchat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  nickname VARCHAR(100),
  can_read BOOLEAN,
  can_write BOOLEAN,
  can_manage BOOLEAN,
  can_invite BOOLEAN,
  can_pin BOOLEAN,
  can_delete_messages BOOLEAN,
  can_mention_everyone BOOLEAN,
  is_muted BOOLEAN,
  muted_until TIMESTAMPTZ,
  is_pinned BOOLEAN,
  notification_level VARCHAR(20) DEFAULT 'all',
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER,
  mention_count INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID,
  thread_id UUID,
  parent_message_id UUID,
  content TEXT,
  content_html TEXT,
  content_plain TEXT,
  type message_type NOT NULL DEFAULT 'text',
  metadata JSONB DEFAULT '{}',
  mentions UUID DEFAULT '{}',
  mentioned_roles VARCHAR(50) DEFAULT '{}',
  mentioned_channels UUID DEFAULT '{}',
  embeds JSONB,
  is_edited BOOLEAN,
  is_pinned BOOLEAN,
  is_deleted BOOLEAN,
  is_system BOOLEAN,
  reaction_count INTEGER,
  reply_count INTEGER,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  root_message_id UUID NOT NULL UNIQUE,
  name VARCHAR(100),
  message_count INTEGER,
  participant_count INTEGER,
  is_locked BOOLEAN,
  is_archived BOOLEAN,
  auto_archive_duration INTEGER,
  last_message_at TIMESTAMPTZ,
  last_message_id UUID,
  archived_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER,
  is_subscribed BOOLEAN,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  emoji_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_custom_emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  name VARCHAR(50) NOT NULL,
  image_url TEXT NOT NULL,
  animated BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  user_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  type attachment_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  thumbnail_width INTEGER,
  thumbnail_height INTEGER,
  is_processed BOOLEAN,
  processing_error TEXT,
  blurhash VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  user_id UUID NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  type attachment_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  blurhash VARCHAR(100),
  reference_count INTEGER,
  last_accessed_at TIMESTAMPTZ,
  alt_text TEXT,
  description TEXT,
  tags VARCHAR(50) DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  channel_id UUID,
  message_id UUID,
  thread_id UUID,
  actor_id UUID,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  action_url TEXT,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ,
  is_seen BOOLEAN,
  seen_at TIMESTAMPTZ,
  push_sent BOOLEAN,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  device_type VARCHAR(20),
  is_active BOOLEAN,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  icon_url TEXT,
  banner_url TEXT,
  primary_color VARCHAR(7),
  is_public BOOLEAN,
  is_discoverable BOOLEAN,
  allow_invites BOOLEAN,
  require_approval BOOLEAN,
  default_channel_id UUID,
  features JSONB DEFAULT '{}',
  max_members INTEGER,
  max_channels INTEGER,
  max_storage_bytes BIGINT,
  member_count INTEGER,
  channel_count INTEGER,
  message_count INTEGER,
  storage_used_bytes BIGINT,
  owner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  nickname VARCHAR(100),
  is_owner BOOLEAN,
  is_banned BOOLEAN,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  banned_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  max_uses INTEGER,
  uses INTEGER,
  expires_at TIMESTAMPTZ,
  target_email VARCHAR(255),
  target_role member_role DEFAULT 'member',
  created_by UUID,
  is_revoked BOOLEAN,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  position INTEGER,
  is_default BOOLEAN,
  is_system BOOLEAN,
  is_mentionable BOOLEAN,
  is_hoisted BOOLEAN,
  permissions BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  workspace_id UUID NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS nchat_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  bit_position INTEGER NOT NULL UNIQUE,
  is_dangerous BOOLEAN
);

CREATE TABLE IF NOT EXISTS nchat_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  max_members INTEGER,
  max_channels INTEGER,
  max_storage_bytes BIGINT,
  max_file_size_bytes BIGINT,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN,
  is_public BOOLEAN,
  sort_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trialing',
  stripe_subscription_id VARCHAR(100),
  stripe_customer_id VARCHAR(100),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  subscription_id UUID,
  stripe_invoice_id VARCHAR(100) UNIQUE,
  amount_cents INTEGER NOT NULL,
  tax_cents INTEGER,
  total_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_id UUID,
  channel_id UUID,
  note TEXT,
  folder VARCHAR(100),
  tags VARCHAR(50) DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  message_id UUID NOT NULL,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  workspace_id UUID,
  channel_id UUID,
  user_id UUID,
  title TEXT,
  content TEXT NOT NULL,
  content_tsv tsvector,
  metadata JSONB DEFAULT '{}',
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  user_id UUID,
  action audit_action NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  channel_id UUID,
  target_user_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_address inet,
  user_agent TEXT,
  request_id VARCHAR(36),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSONB DEFAULT '{}',
  credentials_encrypted TEXT,
  is_enabled BOOLEAN,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  channel_id UUID,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(100),
  events VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,
  failure_count INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_incoming_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  avatar_url TEXT,
  username VARCHAR(100),
  is_enabled BOOLEAN,
  last_used_at TIMESTAMPTZ,
  message_count INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,
  owner_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  token_hash TEXT NOT NULL,
  permissions BIGINT,
  is_enabled BOOLEAN,
  is_verified BOOLEAN,
  is_public BOOLEAN,
  install_count INTEGER,
  message_count INTEGER,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) NOT NULL UNIQUE DEFAULT 'primary',
  setup JSONB DEFAULT '{"isCompleted": false, "currentStep": 1}',
  owner JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  landing_theme VARCHAR(50) DEFAULT 'simple-landing',
  homepage JSONB DEFAULT '{}',
  auth_providers JSONB DEFAULT '{}',
  auth_permissions JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  integrations JSONB DEFAULT '{}',
  moderation JSONB DEFAULT '{}',
  theme JSONB DEFAULT '{}',
  seo JSONB DEFAULT '{}',
  legal JSONB DEFAULT '{}',
  social JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nchat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  refresh_token_hash TEXT,
  user_agent TEXT,
  ip_address inet,
  device_type VARCHAR(20),
  device_name VARCHAR(100),
  os VARCHAR(50),
  browser VARCHAR(50),
  location VARCHAR(100),
  is_active BOOLEAN,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

