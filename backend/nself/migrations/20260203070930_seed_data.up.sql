-- ============================================================================
-- NCHAT SEED DATA
-- Migration: 20260203070930_seed_data
-- Description: Insert default configuration and permissions
-- ============================================================================

-- ============================================================================
-- DEFAULT PERMISSIONS
-- ============================================================================

INSERT INTO nchat_permissions (name, description, category, bit_position, is_dangerous)
VALUES
  -- General permissions
  ('view_channels', 'View public channels', 'general', 0, false),
  ('manage_channels', 'Create, edit, delete channels', 'general', 1, true),
  ('manage_roles', 'Create, edit, delete roles', 'general', 2, true),
  ('manage_emojis', 'Manage custom emojis', 'general', 3, false),
  ('view_audit_log', 'View audit logs', 'general', 4, false),
  ('manage_webhooks', 'Manage webhooks', 'general', 5, true),
  ('manage_workspace', 'Manage workspace settings', 'general', 6, true),
  
  -- Membership permissions
  ('create_invites', 'Create invite links', 'membership', 10, false),
  ('kick_members', 'Remove members', 'membership', 11, true),
  ('ban_members', 'Ban and unban members', 'membership', 12, true),
  ('manage_nicknames', 'Change member nicknames', 'membership', 13, false),
  
  -- Message permissions
  ('send_messages', 'Send messages', 'messages', 20, false),
  ('embed_links', 'Embed links in messages', 'messages', 21, false),
  ('attach_files', 'Upload files', 'messages', 22, false),
  ('add_reactions', 'Add reactions', 'messages', 23, false),
  ('mention_everyone', 'Use @everyone and @here', 'messages', 24, false),
  ('manage_messages', 'Delete/pin messages', 'messages', 25, true),
  ('manage_threads', 'Manage threads', 'messages', 26, false),
  
  -- Voice permissions (future)
  ('connect_voice', 'Connect to voice channels', 'voice', 30, false),
  ('speak', 'Speak in voice channels', 'voice', 31, false),
  ('mute_members', 'Mute members in voice', 'voice', 32, false),
  ('deafen_members', 'Deafen members in voice', 'voice', 33, false),
  ('move_members', 'Move members between voice channels', 'voice', 34, false),
  
  -- Administrator
  ('administrator', 'Full administrator access', 'admin', 63, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO nchat_plans (id, name, slug, description, price_monthly_cents, price_yearly_cents, max_members, max_channels, max_storage_bytes, max_file_size_bytes, features, is_active, is_public, sort_order)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Free',
    'free',
    'Basic plan for small teams',
    0,
    0,
    10,
    20,
    1073741824, -- 1 GB
    10485760, -- 10 MB
    '{"directMessages": true, "publicChannels": true, "privateChannels": false, "threads": true, "reactions": true, "fileSharing": true, "voiceMessages": false, "customEmoji": false, "searchHistory": 30}',
    true,
    true,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Pro',
    'pro',
    'For growing teams that need more features',
    999,
    9990,
    50,
    100,
    10737418240, -- 10 GB
    104857600, -- 100 MB
    '{"directMessages": true, "publicChannels": true, "privateChannels": true, "threads": true, "reactions": true, "fileSharing": true, "voiceMessages": true, "customEmoji": true, "searchHistory": 365, "screenShare": true, "guestAccess": true}',
    true,
    true,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Business',
    'business',
    'For organizations that need advanced features',
    2499,
    24990,
    200,
    500,
    107374182400, -- 100 GB
    1073741824, -- 1 GB
    '{"directMessages": true, "publicChannels": true, "privateChannels": true, "threads": true, "reactions": true, "fileSharing": true, "voiceMessages": true, "customEmoji": true, "searchHistory": -1, "screenShare": true, "guestAccess": true, "sso": true, "auditLogs": true, "prioritySupport": true}',
    true,
    true,
    3
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Enterprise',
    'enterprise',
    'Custom solutions for large organizations',
    0,
    0,
    NULL, -- Unlimited
    NULL, -- Unlimited
    NULL, -- Unlimited
    10737418240, -- 10 GB
    '{"directMessages": true, "publicChannels": true, "privateChannels": true, "threads": true, "reactions": true, "fileSharing": true, "voiceMessages": true, "customEmoji": true, "searchHistory": -1, "screenShare": true, "guestAccess": true, "sso": true, "auditLogs": true, "prioritySupport": true, "dedicatedSupport": true, "customIntegrations": true, "onPremise": true, "sla": true}',
    true,
    false,
    4
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DEFAULT APP CONFIGURATION
-- ============================================================================

INSERT INTO nchat_app_configuration (id, key, setup, owner, branding, landing_theme, homepage, auth_providers, auth_permissions, features, integrations, moderation, theme, seo, legal, social)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'primary',
  '{"isCompleted": false, "currentStep": 1, "visitedSteps": [1]}',
  '{}',
  '{"appName": "nchat", "tagline": "Team communication made simple", "logoScale": 1}',
  'simple-landing',
  '{"mode": "landing", "landingPages": ["hero", "features", "pricing"]}',
  '{"emailPassword": true, "magicLinks": false, "google": false, "github": false}',
  '{"mode": "open", "requireEmailVerification": false, "allowedDomains": []}',
  '{"publicChannels": true, "privateChannels": true, "directMessages": true, "threads": true, "reactions": true, "fileSharing": true, "voiceMessages": false}',
  '{"slack": false, "github": false, "jira": false, "webhooks": true}',
  '{"autoModeration": false, "profanityFilter": false, "spamDetection": false}',
  '{"preset": "nself", "colorScheme": "system", "colors": {}}',
  '{"title": "nchat - Team Communication", "description": "Real-time team communication platform"}',
  '{}',
  '{}'
)
ON CONFLICT (key) DO NOTHING;
