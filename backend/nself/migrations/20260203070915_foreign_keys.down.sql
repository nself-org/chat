-- ============================================================================
-- NCHAT FOREIGN KEYS - ROLLBACK
-- Migration: 20260203070915_foreign_keys
-- Description: Drop all foreign key constraints
-- ============================================================================

-- Note: Most foreign keys will be dropped automatically when tables are dropped.
-- This migration is for explicit rollback scenarios.

-- Sessions
ALTER TABLE nchat_sessions DROP CONSTRAINT IF EXISTS fk_sessions_user;

-- Bots
ALTER TABLE nchat_bots DROP CONSTRAINT IF EXISTS fk_bots_workspace;
ALTER TABLE nchat_bots DROP CONSTRAINT IF EXISTS fk_bots_owner;

-- Incoming webhooks
ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_workspace;
ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_channel;
ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_created_by;

-- Webhooks
ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_workspace;
ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_channel;
ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_created_by;

-- Integrations
ALTER TABLE nchat_integrations DROP CONSTRAINT IF EXISTS fk_integrations_workspace;
ALTER TABLE nchat_integrations DROP CONSTRAINT IF EXISTS fk_integrations_created_by;

-- Audit logs
ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_workspace;
ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_user;
ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_channel;
ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_target_user;

-- Search index
ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_workspace;
ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_channel;
ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_user;

-- Pinned messages
ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_channel;
ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_message;
ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_pinned_by;

-- Bookmarks
ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_user;
ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_message;
ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_channel;

-- Invoices
ALTER TABLE nchat_invoices DROP CONSTRAINT IF EXISTS fk_invoices_workspace;
ALTER TABLE nchat_invoices DROP CONSTRAINT IF EXISTS fk_invoices_subscription;

-- Subscriptions
ALTER TABLE nchat_subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_workspace;
ALTER TABLE nchat_subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_plan;

-- User roles
ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_user;
ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_role;
ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_workspace;
ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_granted_by;

-- Roles
ALTER TABLE nchat_roles DROP CONSTRAINT IF EXISTS fk_roles_workspace;

-- Workspace invites
ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_workspace;
ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_created_by;
ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_revoked_by;

-- Workspace members
ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_workspace;
ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_user;
ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_banned_by;
ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_invited_by;

-- Workspaces
ALTER TABLE nchat_workspaces DROP CONSTRAINT IF EXISTS fk_workspaces_owner;

-- Push subscriptions
ALTER TABLE nchat_push_subscriptions DROP CONSTRAINT IF EXISTS fk_push_subscriptions_user;

-- Notifications
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_user;
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_channel;
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_message;
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_thread;
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_actor;

-- Media
ALTER TABLE nchat_media DROP CONSTRAINT IF EXISTS fk_media_workspace;
ALTER TABLE nchat_media DROP CONSTRAINT IF EXISTS fk_media_user;

-- Attachments
ALTER TABLE nchat_attachments DROP CONSTRAINT IF EXISTS fk_attachments_message;
ALTER TABLE nchat_attachments DROP CONSTRAINT IF EXISTS fk_attachments_user;

-- Custom emojis
ALTER TABLE nchat_custom_emojis DROP CONSTRAINT IF EXISTS fk_custom_emojis_workspace;
ALTER TABLE nchat_custom_emojis DROP CONSTRAINT IF EXISTS fk_custom_emojis_created_by;

-- Reactions
ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_message;
ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_user;
ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_emoji;

-- Thread members
ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_thread;
ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_user;
ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_last_read;

-- Threads
ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_channel;
ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_root_message;
ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_created_by;

-- Messages
ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_channel;
ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_user;
ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_thread;
ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_parent;

-- Channel members
ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_channel;
ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_user;
ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_invited_by;

-- Channels
ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_workspace;
ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_category;
ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_created_by;

-- Categories
ALTER TABLE nchat_categories DROP CONSTRAINT IF EXISTS fk_categories_workspace;
ALTER TABLE nchat_categories DROP CONSTRAINT IF EXISTS fk_categories_created_by;

-- User settings
ALTER TABLE nchat_user_settings DROP CONSTRAINT IF EXISTS fk_user_settings_user;

-- Presence
ALTER TABLE nchat_presence DROP CONSTRAINT IF EXISTS fk_presence_user;
ALTER TABLE nchat_presence DROP CONSTRAINT IF EXISTS fk_presence_channel;

-- Profiles
ALTER TABLE nchat_profiles DROP CONSTRAINT IF EXISTS fk_profiles_user;
