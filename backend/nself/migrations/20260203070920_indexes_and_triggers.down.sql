-- ============================================================================
-- NCHAT INDEXES AND TRIGGERS - ROLLBACK
-- Migration: 20260203070920_indexes_and_triggers
-- Description: Drop all indexes and triggers
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS set_updated_at ON nchat_users CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_profiles CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_presence CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_user_settings CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_categories CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_channels CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_channel_members CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_messages CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_threads CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_thread_members CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_attachments CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_media CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_workspaces CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_workspace_members CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_workspace_invites CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_roles CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_plans CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_subscriptions CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_invoices CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_integrations CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_webhooks CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_incoming_webhooks CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_bots CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_app_configuration CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_sessions CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON nchat_push_subscriptions CASCADE;

DROP TRIGGER IF EXISTS update_search_tsv ON nchat_search_index CASCADE;
DROP TRIGGER IF EXISTS update_channel_message_count ON nchat_messages CASCADE;
DROP TRIGGER IF EXISTS update_thread_message_count ON nchat_messages CASCADE;
DROP TRIGGER IF EXISTS update_channel_member_count ON nchat_channel_members CASCADE;
DROP TRIGGER IF EXISTS update_workspace_member_count ON nchat_workspace_members CASCADE;
DROP TRIGGER IF EXISTS update_workspace_channel_count ON nchat_channels CASCADE;
DROP TRIGGER IF EXISTS update_message_reaction_count ON nchat_reactions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_search_tsv() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_channel_message_count() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_thread_message_count() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_channel_member_count() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_workspace_member_count() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_workspace_channel_count() CASCADE;
DROP FUNCTION IF EXISTS trigger_update_message_reaction_count() CASCADE;

-- Note: Indexes are dropped automatically when tables are dropped
