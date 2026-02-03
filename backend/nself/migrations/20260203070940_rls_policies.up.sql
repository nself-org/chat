-- Row Level Security (RLS) Policies for nChat
-- Implements multi-tenant security at the database level
-- All policies use Hasura session variables for user context

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user ID from Hasura session
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('hasura.user.id', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE SQL STABLE;

-- Get current user role from Hasura session
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('hasura.user.role', true),
    'anonymous'
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.user_role() IN ('admin', 'owner');
$$ LANGUAGE SQL STABLE;

-- Check if user has access to a channel
CREATE OR REPLACE FUNCTION auth.has_channel_access(p_channel_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM nchat_channel_members
    WHERE channel_id = p_channel_id
    AND user_id = auth.user_id()
  ) OR EXISTS (
    SELECT 1 FROM nchat_channels
    WHERE id = p_channel_id
    AND type = 'public'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is channel member with specific permission
CREATE OR REPLACE FUNCTION auth.has_channel_permission(p_channel_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_member nchat_channel_members;
BEGIN
  SELECT * INTO v_member
  FROM nchat_channel_members
  WHERE channel_id = p_channel_id AND user_id = auth.user_id();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check role-based permissions
  IF v_member.role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Check explicit permission overrides
  CASE p_permission
    WHEN 'read' THEN RETURN COALESCE(v_member.can_read, TRUE);
    WHEN 'write' THEN RETURN COALESCE(v_member.can_write, TRUE);
    WHEN 'manage' THEN RETURN COALESCE(v_member.can_manage, FALSE);
    WHEN 'invite' THEN RETURN COALESCE(v_member.can_invite, v_member.role = 'moderator');
    WHEN 'pin' THEN RETURN COALESCE(v_member.can_pin, v_member.role = 'moderator');
    WHEN 'delete_messages' THEN RETURN COALESCE(v_member.can_delete_messages, v_member.role = 'moderator');
    WHEN 'mention_everyone' THEN RETURN COALESCE(v_member.can_mention_everyone, v_member.role = 'moderator');
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE PLPGSQL STABLE SECURITY DEFINER;

-- Check if user is workspace member
CREATE OR REPLACE FUNCTION auth.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM nchat_workspace_members
    WHERE workspace_id = p_workspace_id
    AND user_id = auth.user_id()
    AND NOT is_banned
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE nchat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_custom_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_incoming_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_app_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Users: All authenticated users can read non-deleted users
CREATE POLICY users_select ON nchat_users
  FOR SELECT USING (
    deleted_at IS NULL
    AND auth.user_role() != 'anonymous'
  );

-- Users: Users can update their own record
CREATE POLICY users_update ON nchat_users
  FOR UPDATE USING (id = auth.user_id());

-- Users: Admins can insert/delete
CREATE POLICY users_admin ON nchat_users
  FOR ALL USING (auth.is_admin());

-- ============================================================================
-- PROFILE POLICIES
-- ============================================================================

-- Profiles: All authenticated users can read profiles
CREATE POLICY profiles_select ON nchat_profiles
  FOR SELECT USING (auth.user_role() != 'anonymous');

-- Profiles: Users can update their own profile
CREATE POLICY profiles_update ON nchat_profiles
  FOR UPDATE USING (user_id = auth.user_id());

-- Profiles: Users can insert their own profile
CREATE POLICY profiles_insert ON nchat_profiles
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- ============================================================================
-- PRESENCE POLICIES
-- ============================================================================

-- Presence: All authenticated users can read presence
CREATE POLICY presence_select ON nchat_presence
  FOR SELECT USING (auth.user_role() != 'anonymous');

-- Presence: Users can update their own presence
CREATE POLICY presence_update ON nchat_presence
  FOR UPDATE USING (user_id = auth.user_id());

-- Presence: Users can insert their own presence
CREATE POLICY presence_insert ON nchat_presence
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- ============================================================================
-- USER SETTINGS POLICIES
-- ============================================================================

-- Settings: Users can only access their own settings
CREATE POLICY settings_own ON nchat_user_settings
  FOR ALL USING (user_id = auth.user_id());

-- ============================================================================
-- CHANNEL POLICIES
-- ============================================================================

-- Channels: Users can read public channels or channels they're members of
CREATE POLICY channels_select ON nchat_channels
  FOR SELECT USING (
    type = 'public'
    OR auth.has_channel_access(id)
    OR auth.is_admin()
  );

-- Channels: Members with manage permission can update
CREATE POLICY channels_update ON nchat_channels
  FOR UPDATE USING (auth.has_channel_permission(id, 'manage'));

-- Channels: Authenticated users can create channels
CREATE POLICY channels_insert ON nchat_channels
  FOR INSERT WITH CHECK (auth.user_role() != 'anonymous');

-- Channels: Only admins can delete
CREATE POLICY channels_delete ON nchat_channels
  FOR DELETE USING (auth.is_admin());

-- ============================================================================
-- CHANNEL MEMBER POLICIES
-- ============================================================================

-- Channel Members: Can read if member of channel or channel is public
CREATE POLICY channel_members_select ON nchat_channel_members
  FOR SELECT USING (
    auth.has_channel_access(channel_id)
    OR user_id = auth.user_id()
  );

-- Channel Members: Users with invite permission can add members
CREATE POLICY channel_members_insert ON nchat_channel_members
  FOR INSERT WITH CHECK (
    auth.has_channel_permission(channel_id, 'invite')
    OR user_id = auth.user_id() -- Can join public channels
  );

-- Channel Members: Users can update their own membership or admins can update any
CREATE POLICY channel_members_update ON nchat_channel_members
  FOR UPDATE USING (
    user_id = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'manage')
  );

-- Channel Members: Users can leave or admins can remove
CREATE POLICY channel_members_delete ON nchat_channel_members
  FOR DELETE USING (
    user_id = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'manage')
  );

-- ============================================================================
-- MESSAGE POLICIES
-- ============================================================================

-- Messages: Can read messages in channels user has access to
CREATE POLICY messages_select ON nchat_messages
  FOR SELECT USING (
    auth.has_channel_access(channel_id)
    AND NOT is_deleted
  );

-- Messages: Can send messages if has write permission
CREATE POLICY messages_insert ON nchat_messages
  FOR INSERT WITH CHECK (
    auth.has_channel_permission(channel_id, 'write')
    AND user_id = auth.user_id()
  );

-- Messages: Can update own messages
CREATE POLICY messages_update ON nchat_messages
  FOR UPDATE USING (
    user_id = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'manage')
  );

-- Messages: Can soft-delete own messages or with delete permission
CREATE POLICY messages_delete ON nchat_messages
  FOR DELETE USING (
    user_id = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'delete_messages')
  );

-- ============================================================================
-- THREAD POLICIES
-- ============================================================================

-- Threads: Same as channel access
CREATE POLICY threads_select ON nchat_threads
  FOR SELECT USING (auth.has_channel_access(channel_id));

CREATE POLICY threads_insert ON nchat_threads
  FOR INSERT WITH CHECK (auth.has_channel_permission(channel_id, 'write'));

CREATE POLICY threads_update ON nchat_threads
  FOR UPDATE USING (
    created_by = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'manage')
  );

-- ============================================================================
-- THREAD MEMBER POLICIES
-- ============================================================================

CREATE POLICY thread_members_select ON nchat_thread_members
  FOR SELECT USING (
    user_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM nchat_threads t
      WHERE t.id = thread_id AND auth.has_channel_access(t.channel_id)
    )
  );

CREATE POLICY thread_members_insert ON nchat_thread_members
  FOR INSERT WITH CHECK (user_id = auth.user_id());

CREATE POLICY thread_members_update ON nchat_thread_members
  FOR UPDATE USING (user_id = auth.user_id());

CREATE POLICY thread_members_delete ON nchat_thread_members
  FOR DELETE USING (user_id = auth.user_id());

-- ============================================================================
-- REACTION POLICIES
-- ============================================================================

CREATE POLICY reactions_select ON nchat_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_messages m
      WHERE m.id = message_id AND auth.has_channel_access(m.channel_id)
    )
  );

CREATE POLICY reactions_insert ON nchat_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.user_id()
    AND EXISTS (
      SELECT 1 FROM nchat_messages m
      WHERE m.id = message_id AND auth.has_channel_access(m.channel_id)
    )
  );

CREATE POLICY reactions_delete ON nchat_reactions
  FOR DELETE USING (user_id = auth.user_id());

-- ============================================================================
-- NOTIFICATION POLICIES
-- ============================================================================

-- Notifications: Users can only see their own
CREATE POLICY notifications_own ON nchat_notifications
  FOR ALL USING (user_id = auth.user_id());

-- Push Subscriptions: Users can only manage their own
CREATE POLICY push_subscriptions_own ON nchat_push_subscriptions
  FOR ALL USING (user_id = auth.user_id());

-- ============================================================================
-- WORKSPACE POLICIES
-- ============================================================================

-- Workspaces: Can read public or member workspaces
CREATE POLICY workspaces_select ON nchat_workspaces
  FOR SELECT USING (
    is_public
    OR auth.is_workspace_member(id)
    OR auth.is_admin()
  );

CREATE POLICY workspaces_insert ON nchat_workspaces
  FOR INSERT WITH CHECK (auth.user_role() != 'anonymous');

CREATE POLICY workspaces_update ON nchat_workspaces
  FOR UPDATE USING (
    owner_id = auth.user_id()
    OR auth.is_admin()
  );

-- Workspace Members
CREATE POLICY workspace_members_select ON nchat_workspace_members
  FOR SELECT USING (
    auth.is_workspace_member(workspace_id)
    OR user_id = auth.user_id()
  );

CREATE POLICY workspace_members_insert ON nchat_workspace_members
  FOR INSERT WITH CHECK (
    user_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspace_members_update ON nchat_workspace_members
  FOR UPDATE USING (
    user_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Workspace Invites
CREATE POLICY workspace_invites_select ON nchat_workspace_invites
  FOR SELECT USING (
    auth.is_workspace_member(workspace_id)
    OR target_email = (SELECT email FROM nchat_users WHERE id = auth.user_id())
  );

CREATE POLICY workspace_invites_insert ON nchat_workspace_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ROLE & PERMISSION POLICIES
-- ============================================================================

-- Roles: Workspace members can read roles
CREATE POLICY roles_select ON nchat_roles
  FOR SELECT USING (
    workspace_id IS NULL
    OR auth.is_workspace_member(workspace_id)
  );

CREATE POLICY roles_admin ON nchat_roles
  FOR ALL USING (auth.is_admin());

-- User Roles: Users can see their own, admins can see all
CREATE POLICY user_roles_select ON nchat_user_roles
  FOR SELECT USING (
    user_id = auth.user_id()
    OR auth.is_workspace_member(workspace_id)
  );

CREATE POLICY user_roles_admin ON nchat_user_roles
  FOR ALL USING (auth.is_admin());

-- Permissions: Everyone can read permission definitions
CREATE POLICY permissions_select ON nchat_permissions
  FOR SELECT USING (true);

-- ============================================================================
-- BILLING POLICIES
-- ============================================================================

-- Plans: Everyone can read active plans
CREATE POLICY plans_select ON nchat_plans
  FOR SELECT USING (is_active);

CREATE POLICY plans_admin ON nchat_plans
  FOR ALL USING (auth.is_admin());

-- Subscriptions: Workspace admins can manage
CREATE POLICY subscriptions_select ON nchat_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Invoices: Workspace admins can view
CREATE POLICY invoices_select ON nchat_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- BOOKMARK & ATTACHMENT POLICIES
-- ============================================================================

-- Bookmarks: Users can only manage their own
CREATE POLICY bookmarks_own ON nchat_bookmarks
  FOR ALL USING (user_id = auth.user_id());

-- Pinned Messages: Based on channel access
CREATE POLICY pinned_messages_select ON nchat_pinned_messages
  FOR SELECT USING (auth.has_channel_access(channel_id));

CREATE POLICY pinned_messages_insert ON nchat_pinned_messages
  FOR INSERT WITH CHECK (auth.has_channel_permission(channel_id, 'pin'));

CREATE POLICY pinned_messages_delete ON nchat_pinned_messages
  FOR DELETE USING (
    pinned_by = auth.user_id()
    OR auth.has_channel_permission(channel_id, 'manage')
  );

-- Attachments: Based on message channel access
CREATE POLICY attachments_select ON nchat_attachments
  FOR SELECT USING (
    user_id = auth.user_id()
    OR EXISTS (
      SELECT 1 FROM nchat_messages m
      WHERE m.id = message_id AND auth.has_channel_access(m.channel_id)
    )
  );

CREATE POLICY attachments_insert ON nchat_attachments
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- Media: Based on workspace membership
CREATE POLICY media_select ON nchat_media
  FOR SELECT USING (
    user_id = auth.user_id()
    OR workspace_id IS NULL
    OR auth.is_workspace_member(workspace_id)
  );

CREATE POLICY media_insert ON nchat_media
  FOR INSERT WITH CHECK (user_id = auth.user_id());

-- ============================================================================
-- SEARCH INDEX POLICIES
-- ============================================================================

CREATE POLICY search_index_select ON nchat_search_index
  FOR SELECT USING (
    (channel_id IS NULL OR auth.has_channel_access(channel_id))
    AND (workspace_id IS NULL OR auth.is_workspace_member(workspace_id))
  );

-- ============================================================================
-- AUDIT LOG POLICIES
-- ============================================================================

-- Audit logs: Only admins can read, no one can modify
CREATE POLICY audit_logs_select ON nchat_audit_logs
  FOR SELECT USING (auth.is_admin());

-- ============================================================================
-- INTEGRATION & WEBHOOK POLICIES
-- ============================================================================

-- Integrations: Workspace admins can manage
CREATE POLICY integrations_select ON nchat_integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY integrations_admin ON nchat_integrations
  FOR ALL USING (auth.is_admin());

-- Webhooks: Same as integrations
CREATE POLICY webhooks_select ON nchat_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY incoming_webhooks_select ON nchat_incoming_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nchat_workspace_members wm
      WHERE wm.workspace_id = workspace_id
      AND wm.user_id = auth.user_id()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- BOT POLICIES
-- ============================================================================

-- Bots: Owner can manage, others can read public bots
CREATE POLICY bots_select ON nchat_bots
  FOR SELECT USING (
    is_public
    OR owner_id = auth.user_id()
    OR (workspace_id IS NOT NULL AND auth.is_workspace_member(workspace_id))
  );

CREATE POLICY bots_insert ON nchat_bots
  FOR INSERT WITH CHECK (owner_id = auth.user_id());

CREATE POLICY bots_update ON nchat_bots
  FOR UPDATE USING (owner_id = auth.user_id());

CREATE POLICY bots_delete ON nchat_bots
  FOR DELETE USING (owner_id = auth.user_id() OR auth.is_admin());

-- ============================================================================
-- APP CONFIGURATION POLICIES
-- ============================================================================

-- App config: Everyone can read, only admins can modify
CREATE POLICY app_config_select ON nchat_app_configuration
  FOR SELECT USING (true);

CREATE POLICY app_config_admin ON nchat_app_configuration
  FOR ALL USING (auth.is_admin());

-- ============================================================================
-- SESSION POLICIES
-- ============================================================================

-- Sessions: Users can only see their own
CREATE POLICY sessions_own ON nchat_sessions
  FOR ALL USING (user_id = auth.user_id());

-- ============================================================================
-- CUSTOM EMOJI POLICIES
-- ============================================================================

CREATE POLICY custom_emojis_select ON nchat_custom_emojis
  FOR SELECT USING (
    workspace_id IS NULL
    OR auth.is_workspace_member(workspace_id)
  );

CREATE POLICY custom_emojis_insert ON nchat_custom_emojis
  FOR INSERT WITH CHECK (
    created_by = auth.user_id()
    AND (workspace_id IS NULL OR auth.is_workspace_member(workspace_id))
  );

CREATE POLICY custom_emojis_delete ON nchat_custom_emojis
  FOR DELETE USING (
    created_by = auth.user_id()
    OR auth.is_admin()
  );

-- ============================================================================
-- GRANT USAGE TO HASURA ROLE
-- ============================================================================

GRANT USAGE ON SCHEMA auth TO hasura;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO hasura;
