-- Remove RLS Policies for nChat
-- Reverse migration for RLS policies

-- Drop all policies
DROP POLICY IF EXISTS users_select ON nchat_users;
DROP POLICY IF EXISTS users_update ON nchat_users;
DROP POLICY IF EXISTS users_admin ON nchat_users;

DROP POLICY IF EXISTS profiles_select ON nchat_profiles;
DROP POLICY IF EXISTS profiles_update ON nchat_profiles;
DROP POLICY IF EXISTS profiles_insert ON nchat_profiles;

DROP POLICY IF EXISTS presence_select ON nchat_presence;
DROP POLICY IF EXISTS presence_update ON nchat_presence;
DROP POLICY IF EXISTS presence_insert ON nchat_presence;

DROP POLICY IF EXISTS settings_own ON nchat_user_settings;

DROP POLICY IF EXISTS channels_select ON nchat_channels;
DROP POLICY IF EXISTS channels_update ON nchat_channels;
DROP POLICY IF EXISTS channels_insert ON nchat_channels;
DROP POLICY IF EXISTS channels_delete ON nchat_channels;

DROP POLICY IF EXISTS channel_members_select ON nchat_channel_members;
DROP POLICY IF EXISTS channel_members_insert ON nchat_channel_members;
DROP POLICY IF EXISTS channel_members_update ON nchat_channel_members;
DROP POLICY IF EXISTS channel_members_delete ON nchat_channel_members;

DROP POLICY IF EXISTS messages_select ON nchat_messages;
DROP POLICY IF EXISTS messages_insert ON nchat_messages;
DROP POLICY IF EXISTS messages_update ON nchat_messages;
DROP POLICY IF EXISTS messages_delete ON nchat_messages;

DROP POLICY IF EXISTS threads_select ON nchat_threads;
DROP POLICY IF EXISTS threads_insert ON nchat_threads;
DROP POLICY IF EXISTS threads_update ON nchat_threads;

DROP POLICY IF EXISTS thread_members_select ON nchat_thread_members;
DROP POLICY IF EXISTS thread_members_insert ON nchat_thread_members;
DROP POLICY IF EXISTS thread_members_update ON nchat_thread_members;
DROP POLICY IF EXISTS thread_members_delete ON nchat_thread_members;

DROP POLICY IF EXISTS reactions_select ON nchat_reactions;
DROP POLICY IF EXISTS reactions_insert ON nchat_reactions;
DROP POLICY IF EXISTS reactions_delete ON nchat_reactions;

DROP POLICY IF EXISTS notifications_own ON nchat_notifications;
DROP POLICY IF EXISTS push_subscriptions_own ON nchat_push_subscriptions;

DROP POLICY IF EXISTS workspaces_select ON nchat_workspaces;
DROP POLICY IF EXISTS workspaces_insert ON nchat_workspaces;
DROP POLICY IF EXISTS workspaces_update ON nchat_workspaces;

DROP POLICY IF EXISTS workspace_members_select ON nchat_workspace_members;
DROP POLICY IF EXISTS workspace_members_insert ON nchat_workspace_members;
DROP POLICY IF EXISTS workspace_members_update ON nchat_workspace_members;

DROP POLICY IF EXISTS workspace_invites_select ON nchat_workspace_invites;
DROP POLICY IF EXISTS workspace_invites_insert ON nchat_workspace_invites;

DROP POLICY IF EXISTS roles_select ON nchat_roles;
DROP POLICY IF EXISTS roles_admin ON nchat_roles;

DROP POLICY IF EXISTS user_roles_select ON nchat_user_roles;
DROP POLICY IF EXISTS user_roles_admin ON nchat_user_roles;

DROP POLICY IF EXISTS permissions_select ON nchat_permissions;

DROP POLICY IF EXISTS plans_select ON nchat_plans;
DROP POLICY IF EXISTS plans_admin ON nchat_plans;

DROP POLICY IF EXISTS subscriptions_select ON nchat_subscriptions;
DROP POLICY IF EXISTS invoices_select ON nchat_invoices;

DROP POLICY IF EXISTS bookmarks_own ON nchat_bookmarks;

DROP POLICY IF EXISTS pinned_messages_select ON nchat_pinned_messages;
DROP POLICY IF EXISTS pinned_messages_insert ON nchat_pinned_messages;
DROP POLICY IF EXISTS pinned_messages_delete ON nchat_pinned_messages;

DROP POLICY IF EXISTS attachments_select ON nchat_attachments;
DROP POLICY IF EXISTS attachments_insert ON nchat_attachments;

DROP POLICY IF EXISTS media_select ON nchat_media;
DROP POLICY IF EXISTS media_insert ON nchat_media;

DROP POLICY IF EXISTS search_index_select ON nchat_search_index;

DROP POLICY IF EXISTS audit_logs_select ON nchat_audit_logs;

DROP POLICY IF EXISTS integrations_select ON nchat_integrations;
DROP POLICY IF EXISTS integrations_admin ON nchat_integrations;

DROP POLICY IF EXISTS webhooks_select ON nchat_webhooks;
DROP POLICY IF EXISTS incoming_webhooks_select ON nchat_incoming_webhooks;

DROP POLICY IF EXISTS bots_select ON nchat_bots;
DROP POLICY IF EXISTS bots_insert ON nchat_bots;
DROP POLICY IF EXISTS bots_update ON nchat_bots;
DROP POLICY IF EXISTS bots_delete ON nchat_bots;

DROP POLICY IF EXISTS app_config_select ON nchat_app_configuration;
DROP POLICY IF EXISTS app_config_admin ON nchat_app_configuration;

DROP POLICY IF EXISTS sessions_own ON nchat_sessions;

DROP POLICY IF EXISTS custom_emojis_select ON nchat_custom_emojis;
DROP POLICY IF EXISTS custom_emojis_insert ON nchat_custom_emojis;
DROP POLICY IF EXISTS custom_emojis_delete ON nchat_custom_emojis;

-- Disable RLS on all tables
ALTER TABLE nchat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_channel_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_thread_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_custom_emojis DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_media DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspace_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_pinned_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_search_index DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_incoming_webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_bots DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_app_configuration DISABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_sessions DISABLE ROW LEVEL SECURITY;

-- Drop helper functions
DROP FUNCTION IF EXISTS auth.user_id();
DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.is_admin();
DROP FUNCTION IF EXISTS auth.has_channel_access(UUID);
DROP FUNCTION IF EXISTS auth.has_channel_permission(UUID, TEXT);
DROP FUNCTION IF EXISTS auth.is_workspace_member(UUID);
