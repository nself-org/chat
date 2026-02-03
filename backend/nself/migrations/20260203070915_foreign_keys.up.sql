-- ============================================================================
-- NCHAT FOREIGN KEYS
-- Migration: 20260203070915_foreign_keys
-- Description: Add all foreign key constraints
-- ============================================================================

-- NOTE: This migration adds foreign keys that weren't in the auto-generated
-- DBML import. Run after tables are created.

-- Profiles
ALTER TABLE nchat_profiles DROP CONSTRAINT IF EXISTS fk_profiles_user;
ALTER TABLE nchat_profiles ADD CONSTRAINT fk_profiles_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

-- Presence
ALTER TABLE nchat_presence DROP CONSTRAINT IF EXISTS fk_presence_user;
ALTER TABLE nchat_presence ADD CONSTRAINT fk_presence_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_presence DROP CONSTRAINT IF EXISTS fk_presence_channel;
ALTER TABLE nchat_presence ADD CONSTRAINT fk_presence_channel
  FOREIGN KEY (current_channel_id) REFERENCES nchat_channels(id) ON DELETE SET NULL;

-- User settings
ALTER TABLE nchat_user_settings DROP CONSTRAINT IF EXISTS fk_user_settings_user;
ALTER TABLE nchat_user_settings ADD CONSTRAINT fk_user_settings_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

-- Categories
ALTER TABLE nchat_categories DROP CONSTRAINT IF EXISTS fk_categories_workspace;
ALTER TABLE nchat_categories ADD CONSTRAINT fk_categories_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_categories DROP CONSTRAINT IF EXISTS fk_categories_created_by;
ALTER TABLE nchat_categories ADD CONSTRAINT fk_categories_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Channels
ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_workspace;
ALTER TABLE nchat_channels ADD CONSTRAINT fk_channels_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_category;
ALTER TABLE nchat_channels ADD CONSTRAINT fk_channels_category
  FOREIGN KEY (category_id) REFERENCES nchat_categories(id) ON DELETE SET NULL;

ALTER TABLE nchat_channels DROP CONSTRAINT IF EXISTS fk_channels_created_by;
ALTER TABLE nchat_channels ADD CONSTRAINT fk_channels_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Channel members
ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_channel;
ALTER TABLE nchat_channel_members ADD CONSTRAINT fk_channel_members_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_user;
ALTER TABLE nchat_channel_members ADD CONSTRAINT fk_channel_members_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_channel_members DROP CONSTRAINT IF EXISTS fk_channel_members_invited_by;
ALTER TABLE nchat_channel_members ADD CONSTRAINT fk_channel_members_invited_by
  FOREIGN KEY (invited_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Messages
ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_channel;
ALTER TABLE nchat_messages ADD CONSTRAINT fk_messages_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_user;
ALTER TABLE nchat_messages ADD CONSTRAINT fk_messages_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_thread;
ALTER TABLE nchat_messages ADD CONSTRAINT fk_messages_thread
  FOREIGN KEY (thread_id) REFERENCES nchat_threads(id) ON DELETE SET NULL;

ALTER TABLE nchat_messages DROP CONSTRAINT IF EXISTS fk_messages_parent;
ALTER TABLE nchat_messages ADD CONSTRAINT fk_messages_parent
  FOREIGN KEY (parent_message_id) REFERENCES nchat_messages(id) ON DELETE SET NULL;

-- Threads
ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_channel;
ALTER TABLE nchat_threads ADD CONSTRAINT fk_threads_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_root_message;
ALTER TABLE nchat_threads ADD CONSTRAINT fk_threads_root_message
  FOREIGN KEY (root_message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_threads DROP CONSTRAINT IF EXISTS fk_threads_created_by;
ALTER TABLE nchat_threads ADD CONSTRAINT fk_threads_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Thread members
ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_thread;
ALTER TABLE nchat_thread_members ADD CONSTRAINT fk_thread_members_thread
  FOREIGN KEY (thread_id) REFERENCES nchat_threads(id) ON DELETE CASCADE;

ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_user;
ALTER TABLE nchat_thread_members ADD CONSTRAINT fk_thread_members_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_thread_members DROP CONSTRAINT IF EXISTS fk_thread_members_last_read;
ALTER TABLE nchat_thread_members ADD CONSTRAINT fk_thread_members_last_read
  FOREIGN KEY (last_read_message_id) REFERENCES nchat_messages(id) ON DELETE SET NULL;

-- Reactions
ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_message;
ALTER TABLE nchat_reactions ADD CONSTRAINT fk_reactions_message
  FOREIGN KEY (message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_user;
ALTER TABLE nchat_reactions ADD CONSTRAINT fk_reactions_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_reactions DROP CONSTRAINT IF EXISTS fk_reactions_emoji;
ALTER TABLE nchat_reactions ADD CONSTRAINT fk_reactions_emoji
  FOREIGN KEY (emoji_id) REFERENCES nchat_custom_emojis(id) ON DELETE SET NULL;

-- Custom emojis
ALTER TABLE nchat_custom_emojis DROP CONSTRAINT IF EXISTS fk_custom_emojis_workspace;
ALTER TABLE nchat_custom_emojis ADD CONSTRAINT fk_custom_emojis_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_custom_emojis DROP CONSTRAINT IF EXISTS fk_custom_emojis_created_by;
ALTER TABLE nchat_custom_emojis ADD CONSTRAINT fk_custom_emojis_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Attachments
ALTER TABLE nchat_attachments DROP CONSTRAINT IF EXISTS fk_attachments_message;
ALTER TABLE nchat_attachments ADD CONSTRAINT fk_attachments_message
  FOREIGN KEY (message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_attachments DROP CONSTRAINT IF EXISTS fk_attachments_user;
ALTER TABLE nchat_attachments ADD CONSTRAINT fk_attachments_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Media
ALTER TABLE nchat_media DROP CONSTRAINT IF EXISTS fk_media_workspace;
ALTER TABLE nchat_media ADD CONSTRAINT fk_media_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_media DROP CONSTRAINT IF EXISTS fk_media_user;
ALTER TABLE nchat_media ADD CONSTRAINT fk_media_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Notifications
ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_user;
ALTER TABLE nchat_notifications ADD CONSTRAINT fk_notifications_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_channel;
ALTER TABLE nchat_notifications ADD CONSTRAINT fk_notifications_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_message;
ALTER TABLE nchat_notifications ADD CONSTRAINT fk_notifications_message
  FOREIGN KEY (message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_thread;
ALTER TABLE nchat_notifications ADD CONSTRAINT fk_notifications_thread
  FOREIGN KEY (thread_id) REFERENCES nchat_threads(id) ON DELETE CASCADE;

ALTER TABLE nchat_notifications DROP CONSTRAINT IF EXISTS fk_notifications_actor;
ALTER TABLE nchat_notifications ADD CONSTRAINT fk_notifications_actor
  FOREIGN KEY (actor_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Push subscriptions
ALTER TABLE nchat_push_subscriptions DROP CONSTRAINT IF EXISTS fk_push_subscriptions_user;
ALTER TABLE nchat_push_subscriptions ADD CONSTRAINT fk_push_subscriptions_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

-- Workspaces
ALTER TABLE nchat_workspaces DROP CONSTRAINT IF EXISTS fk_workspaces_owner;
ALTER TABLE nchat_workspaces ADD CONSTRAINT fk_workspaces_owner
  FOREIGN KEY (owner_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Workspace members
ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_workspace;
ALTER TABLE nchat_workspace_members ADD CONSTRAINT fk_workspace_members_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_user;
ALTER TABLE nchat_workspace_members ADD CONSTRAINT fk_workspace_members_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_banned_by;
ALTER TABLE nchat_workspace_members ADD CONSTRAINT fk_workspace_members_banned_by
  FOREIGN KEY (banned_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

ALTER TABLE nchat_workspace_members DROP CONSTRAINT IF EXISTS fk_workspace_members_invited_by;
ALTER TABLE nchat_workspace_members ADD CONSTRAINT fk_workspace_members_invited_by
  FOREIGN KEY (invited_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Workspace invites
ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_workspace;
ALTER TABLE nchat_workspace_invites ADD CONSTRAINT fk_workspace_invites_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_created_by;
ALTER TABLE nchat_workspace_invites ADD CONSTRAINT fk_workspace_invites_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

ALTER TABLE nchat_workspace_invites DROP CONSTRAINT IF EXISTS fk_workspace_invites_revoked_by;
ALTER TABLE nchat_workspace_invites ADD CONSTRAINT fk_workspace_invites_revoked_by
  FOREIGN KEY (revoked_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Roles
ALTER TABLE nchat_roles DROP CONSTRAINT IF EXISTS fk_roles_workspace;
ALTER TABLE nchat_roles ADD CONSTRAINT fk_roles_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

-- User roles
ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_user;
ALTER TABLE nchat_user_roles ADD CONSTRAINT fk_user_roles_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_role;
ALTER TABLE nchat_user_roles ADD CONSTRAINT fk_user_roles_role
  FOREIGN KEY (role_id) REFERENCES nchat_roles(id) ON DELETE CASCADE;

ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_workspace;
ALTER TABLE nchat_user_roles ADD CONSTRAINT fk_user_roles_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_granted_by;
ALTER TABLE nchat_user_roles ADD CONSTRAINT fk_user_roles_granted_by
  FOREIGN KEY (granted_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Subscriptions
ALTER TABLE nchat_subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_workspace;
ALTER TABLE nchat_subscriptions ADD CONSTRAINT fk_subscriptions_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_plan;
ALTER TABLE nchat_subscriptions ADD CONSTRAINT fk_subscriptions_plan
  FOREIGN KEY (plan_id) REFERENCES nchat_plans(id) ON DELETE RESTRICT;

-- Invoices
ALTER TABLE nchat_invoices DROP CONSTRAINT IF EXISTS fk_invoices_workspace;
ALTER TABLE nchat_invoices ADD CONSTRAINT fk_invoices_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_invoices DROP CONSTRAINT IF EXISTS fk_invoices_subscription;
ALTER TABLE nchat_invoices ADD CONSTRAINT fk_invoices_subscription
  FOREIGN KEY (subscription_id) REFERENCES nchat_subscriptions(id) ON DELETE SET NULL;

-- Bookmarks
ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_user;
ALTER TABLE nchat_bookmarks ADD CONSTRAINT fk_bookmarks_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_message;
ALTER TABLE nchat_bookmarks ADD CONSTRAINT fk_bookmarks_message
  FOREIGN KEY (message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_bookmarks DROP CONSTRAINT IF EXISTS fk_bookmarks_channel;
ALTER TABLE nchat_bookmarks ADD CONSTRAINT fk_bookmarks_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

-- Pinned messages
ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_channel;
ALTER TABLE nchat_pinned_messages ADD CONSTRAINT fk_pinned_messages_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_message;
ALTER TABLE nchat_pinned_messages ADD CONSTRAINT fk_pinned_messages_message
  FOREIGN KEY (message_id) REFERENCES nchat_messages(id) ON DELETE CASCADE;

ALTER TABLE nchat_pinned_messages DROP CONSTRAINT IF EXISTS fk_pinned_messages_pinned_by;
ALTER TABLE nchat_pinned_messages ADD CONSTRAINT fk_pinned_messages_pinned_by
  FOREIGN KEY (pinned_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Search index
ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_workspace;
ALTER TABLE nchat_search_index ADD CONSTRAINT fk_search_index_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_channel;
ALTER TABLE nchat_search_index ADD CONSTRAINT fk_search_index_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_search_index DROP CONSTRAINT IF EXISTS fk_search_index_user;
ALTER TABLE nchat_search_index ADD CONSTRAINT fk_search_index_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Audit logs
ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_workspace;
ALTER TABLE nchat_audit_logs ADD CONSTRAINT fk_audit_logs_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE SET NULL;

ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_user;
ALTER TABLE nchat_audit_logs ADD CONSTRAINT fk_audit_logs_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_channel;
ALTER TABLE nchat_audit_logs ADD CONSTRAINT fk_audit_logs_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE SET NULL;

ALTER TABLE nchat_audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_target_user;
ALTER TABLE nchat_audit_logs ADD CONSTRAINT fk_audit_logs_target_user
  FOREIGN KEY (target_user_id) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Integrations
ALTER TABLE nchat_integrations DROP CONSTRAINT IF EXISTS fk_integrations_workspace;
ALTER TABLE nchat_integrations ADD CONSTRAINT fk_integrations_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_integrations DROP CONSTRAINT IF EXISTS fk_integrations_created_by;
ALTER TABLE nchat_integrations ADD CONSTRAINT fk_integrations_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Webhooks
ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_workspace;
ALTER TABLE nchat_webhooks ADD CONSTRAINT fk_webhooks_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_channel;
ALTER TABLE nchat_webhooks ADD CONSTRAINT fk_webhooks_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_webhooks DROP CONSTRAINT IF EXISTS fk_webhooks_created_by;
ALTER TABLE nchat_webhooks ADD CONSTRAINT fk_webhooks_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Incoming webhooks
ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_workspace;
ALTER TABLE nchat_incoming_webhooks ADD CONSTRAINT fk_incoming_webhooks_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_channel;
ALTER TABLE nchat_incoming_webhooks ADD CONSTRAINT fk_incoming_webhooks_channel
  FOREIGN KEY (channel_id) REFERENCES nchat_channels(id) ON DELETE CASCADE;

ALTER TABLE nchat_incoming_webhooks DROP CONSTRAINT IF EXISTS fk_incoming_webhooks_created_by;
ALTER TABLE nchat_incoming_webhooks ADD CONSTRAINT fk_incoming_webhooks_created_by
  FOREIGN KEY (created_by) REFERENCES nchat_users(id) ON DELETE SET NULL;

-- Bots
ALTER TABLE nchat_bots DROP CONSTRAINT IF EXISTS fk_bots_workspace;
ALTER TABLE nchat_bots ADD CONSTRAINT fk_bots_workspace
  FOREIGN KEY (workspace_id) REFERENCES nchat_workspaces(id) ON DELETE CASCADE;

ALTER TABLE nchat_bots DROP CONSTRAINT IF EXISTS fk_bots_owner;
ALTER TABLE nchat_bots ADD CONSTRAINT fk_bots_owner
  FOREIGN KEY (owner_id) REFERENCES nchat_users(id) ON DELETE CASCADE;

-- Sessions
ALTER TABLE nchat_sessions DROP CONSTRAINT IF EXISTS fk_sessions_user;
ALTER TABLE nchat_sessions ADD CONSTRAINT fk_sessions_user
  FOREIGN KEY (user_id) REFERENCES nchat_users(id) ON DELETE CASCADE;
