-- ============================================================================
-- NCHAT INDEXES AND TRIGGERS
-- Migration: 20260203070920_indexes_and_triggers
-- Description: Create performance indexes and utility triggers
-- ============================================================================

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_nchat_users_email ON nchat_users(email);
CREATE INDEX IF NOT EXISTS idx_nchat_users_username ON nchat_users(username);
CREATE INDEX IF NOT EXISTS idx_nchat_users_status ON nchat_users(status);
CREATE INDEX IF NOT EXISTS idx_nchat_users_created_at ON nchat_users(created_at);
CREATE INDEX IF NOT EXISTS idx_nchat_users_last_seen_at ON nchat_users(last_seen_at);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_nchat_profiles_user_id ON nchat_profiles(user_id);

-- Presence indexes
CREATE INDEX IF NOT EXISTS idx_nchat_presence_user_id ON nchat_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_presence_status ON nchat_presence(status);
CREATE INDEX IF NOT EXISTS idx_nchat_presence_last_heartbeat ON nchat_presence(last_heartbeat_at);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_nchat_user_settings_user_id ON nchat_user_settings(user_id);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_nchat_categories_workspace_id ON nchat_categories(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_categories_position ON nchat_categories(position);

-- Channels indexes
CREATE INDEX IF NOT EXISTS idx_nchat_channels_workspace_id ON nchat_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_channels_category_id ON nchat_channels(category_id);
CREATE INDEX IF NOT EXISTS idx_nchat_channels_slug ON nchat_channels(slug);
CREATE INDEX IF NOT EXISTS idx_nchat_channels_type ON nchat_channels(type);
CREATE INDEX IF NOT EXISTS idx_nchat_channels_archived ON nchat_channels(is_archived);
CREATE INDEX IF NOT EXISTS idx_nchat_channels_last_message ON nchat_channels(last_message_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_channels_workspace_slug ON nchat_channels(workspace_id, slug);

-- Channel members indexes
CREATE INDEX IF NOT EXISTS idx_nchat_channel_members_channel_id ON nchat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_nchat_channel_members_user_id ON nchat_channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_channel_members_role ON nchat_channel_members(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_channel_members_unique ON nchat_channel_members(channel_id, user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_nchat_messages_channel_id ON nchat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_user_id ON nchat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_thread_id ON nchat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_parent_id ON nchat_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_created_at ON nchat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_deleted ON nchat_messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_pinned ON nchat_messages(is_pinned);
CREATE INDEX IF NOT EXISTS idx_nchat_messages_channel_created ON nchat_messages(channel_id, created_at);

-- Threads indexes
CREATE INDEX IF NOT EXISTS idx_nchat_threads_channel_id ON nchat_threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_nchat_threads_root_message ON nchat_threads(root_message_id);
CREATE INDEX IF NOT EXISTS idx_nchat_threads_last_message ON nchat_threads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_nchat_threads_archived ON nchat_threads(is_archived);

-- Thread members indexes
CREATE INDEX IF NOT EXISTS idx_nchat_thread_members_thread_id ON nchat_thread_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_nchat_thread_members_user_id ON nchat_thread_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_thread_members_unique ON nchat_thread_members(thread_id, user_id);

-- Reactions indexes
CREATE INDEX IF NOT EXISTS idx_nchat_reactions_message_id ON nchat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_nchat_reactions_user_id ON nchat_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_reactions_emoji ON nchat_reactions(emoji);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_reactions_unique ON nchat_reactions(message_id, user_id, emoji);

-- Custom emojis indexes
CREATE INDEX IF NOT EXISTS idx_nchat_custom_emojis_workspace_id ON nchat_custom_emojis(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_custom_emojis_unique ON nchat_custom_emojis(workspace_id, name);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_nchat_attachments_message_id ON nchat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_nchat_attachments_user_id ON nchat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_attachments_type ON nchat_attachments(type);
CREATE INDEX IF NOT EXISTS idx_nchat_attachments_created_at ON nchat_attachments(created_at);

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_nchat_media_workspace_id ON nchat_media(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_media_user_id ON nchat_media(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_media_type ON nchat_media(type);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_user_id ON nchat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_type ON nchat_notifications(type);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_read ON nchat_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_seen ON nchat_notifications(is_seen);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_created_at ON nchat_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_user_read ON nchat_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_nchat_notifications_user_created ON nchat_notifications(user_id, created_at);

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_nchat_push_subscriptions_user_id ON nchat_push_subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_push_subscriptions_endpoint ON nchat_push_subscriptions(endpoint);

-- Workspaces indexes
CREATE INDEX IF NOT EXISTS idx_nchat_workspaces_slug ON nchat_workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_nchat_workspaces_owner_id ON nchat_workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_nchat_workspaces_public ON nchat_workspaces(is_public);
CREATE INDEX IF NOT EXISTS idx_nchat_workspaces_discoverable ON nchat_workspaces(is_discoverable);

-- Workspace members indexes
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_members_workspace_id ON nchat_workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_members_user_id ON nchat_workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_members_role ON nchat_workspace_members(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_workspace_members_unique ON nchat_workspace_members(workspace_id, user_id);

-- Workspace invites indexes
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_invites_workspace_id ON nchat_workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_invites_code ON nchat_workspace_invites(code);
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_invites_email ON nchat_workspace_invites(target_email);
CREATE INDEX IF NOT EXISTS idx_nchat_workspace_invites_expires ON nchat_workspace_invites(expires_at);

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_nchat_roles_workspace_id ON nchat_roles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_roles_position ON nchat_roles(position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_roles_unique ON nchat_roles(workspace_id, name);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_nchat_user_roles_user_id ON nchat_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_user_roles_role_id ON nchat_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_nchat_user_roles_workspace_id ON nchat_user_roles(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_user_roles_unique ON nchat_user_roles(user_id, role_id, workspace_id);

-- Permissions indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_permissions_name ON nchat_permissions(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_permissions_bit ON nchat_permissions(bit_position);

-- Plans indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_plans_slug ON nchat_plans(slug);
CREATE INDEX IF NOT EXISTS idx_nchat_plans_active ON nchat_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_nchat_plans_public ON nchat_plans(is_public);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_nchat_subscriptions_workspace_id ON nchat_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_subscriptions_plan_id ON nchat_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_nchat_subscriptions_status ON nchat_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_nchat_subscriptions_stripe ON nchat_subscriptions(stripe_subscription_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_nchat_invoices_workspace_id ON nchat_invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_invoices_subscription_id ON nchat_invoices(subscription_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_invoices_stripe ON nchat_invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_nchat_invoices_status ON nchat_invoices(status);

-- Bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_nchat_bookmarks_user_id ON nchat_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_bookmarks_message_id ON nchat_bookmarks(message_id);
CREATE INDEX IF NOT EXISTS idx_nchat_bookmarks_folder ON nchat_bookmarks(folder);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_bookmarks_unique ON nchat_bookmarks(user_id, message_id);

-- Pinned messages indexes
CREATE INDEX IF NOT EXISTS idx_nchat_pinned_messages_channel_id ON nchat_pinned_messages(channel_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_pinned_messages_unique ON nchat_pinned_messages(channel_id, message_id);

-- Search index indexes
CREATE INDEX IF NOT EXISTS idx_nchat_search_entity_type ON nchat_search_index(entity_type);
CREATE INDEX IF NOT EXISTS idx_nchat_search_entity_id ON nchat_search_index(entity_id);
CREATE INDEX IF NOT EXISTS idx_nchat_search_workspace_id ON nchat_search_index(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_search_unique ON nchat_search_index(entity_type, entity_id);
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_nchat_search_content_tsv ON nchat_search_index USING GIN(content_tsv);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_workspace_id ON nchat_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_user_id ON nchat_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_action ON nchat_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_entity_type ON nchat_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_entity_id ON nchat_audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_created_at ON nchat_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_nchat_audit_logs_workspace_created ON nchat_audit_logs(workspace_id, created_at);

-- Integrations indexes
CREATE INDEX IF NOT EXISTS idx_nchat_integrations_workspace_id ON nchat_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_integrations_type ON nchat_integrations(type);
CREATE INDEX IF NOT EXISTS idx_nchat_integrations_enabled ON nchat_integrations(is_enabled);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_nchat_webhooks_workspace_id ON nchat_webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_webhooks_channel_id ON nchat_webhooks(channel_id);
CREATE INDEX IF NOT EXISTS idx_nchat_webhooks_enabled ON nchat_webhooks(is_enabled);

-- Incoming webhooks indexes
CREATE INDEX IF NOT EXISTS idx_nchat_incoming_webhooks_workspace_id ON nchat_incoming_webhooks(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_incoming_webhooks_token ON nchat_incoming_webhooks(token);

-- Bots indexes
CREATE INDEX IF NOT EXISTS idx_nchat_bots_workspace_id ON nchat_bots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_nchat_bots_owner_id ON nchat_bots(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_bots_username ON nchat_bots(username);
CREATE INDEX IF NOT EXISTS idx_nchat_bots_enabled ON nchat_bots(is_enabled);
CREATE INDEX IF NOT EXISTS idx_nchat_bots_public ON nchat_bots(is_public);

-- App configuration indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_nchat_app_configuration_key ON nchat_app_configuration(key);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_nchat_sessions_user_id ON nchat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nchat_sessions_active ON nchat_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_nchat_sessions_expires ON nchat_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_nchat_sessions_user_active ON nchat_sessions(user_id, is_active);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public' 
    AND table_name LIKE 'nchat_%'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- Function to update search index
CREATE OR REPLACE FUNCTION trigger_update_search_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_tsv = to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector trigger
DROP TRIGGER IF EXISTS update_search_tsv ON nchat_search_index;
CREATE TRIGGER update_search_tsv
BEFORE INSERT OR UPDATE ON nchat_search_index
FOR EACH ROW
EXECUTE FUNCTION trigger_update_search_tsv();

-- Function to update channel message count
CREATE OR REPLACE FUNCTION trigger_update_channel_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NULL THEN
    UPDATE nchat_channels 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at,
        last_message_id = NEW.id
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' AND OLD.thread_id IS NULL THEN
    UPDATE nchat_channels 
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.channel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_channel_message_count ON nchat_messages;
CREATE TRIGGER update_channel_message_count
AFTER INSERT OR DELETE ON nchat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_channel_message_count();

-- Function to update thread message count
CREATE OR REPLACE FUNCTION trigger_update_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id IS NOT NULL THEN
    UPDATE nchat_threads 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at,
        last_message_id = NEW.id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' AND OLD.thread_id IS NOT NULL THEN
    UPDATE nchat_threads 
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_thread_message_count ON nchat_messages;
CREATE TRIGGER update_thread_message_count
AFTER INSERT OR DELETE ON nchat_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_thread_message_count();

-- Function to update channel member count
CREATE OR REPLACE FUNCTION trigger_update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nchat_channels 
    SET member_count = member_count + 1
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nchat_channels 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.channel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_channel_member_count ON nchat_channel_members;
CREATE TRIGGER update_channel_member_count
AFTER INSERT OR DELETE ON nchat_channel_members
FOR EACH ROW
EXECUTE FUNCTION trigger_update_channel_member_count();

-- Function to update workspace member count
CREATE OR REPLACE FUNCTION trigger_update_workspace_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nchat_workspaces 
    SET member_count = member_count + 1
    WHERE id = NEW.workspace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nchat_workspaces 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.workspace_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workspace_member_count ON nchat_workspace_members;
CREATE TRIGGER update_workspace_member_count
AFTER INSERT OR DELETE ON nchat_workspace_members
FOR EACH ROW
EXECUTE FUNCTION trigger_update_workspace_member_count();

-- Function to update workspace channel count
CREATE OR REPLACE FUNCTION trigger_update_workspace_channel_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nchat_workspaces 
    SET channel_count = channel_count + 1
    WHERE id = NEW.workspace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nchat_workspaces 
    SET channel_count = GREATEST(channel_count - 1, 0)
    WHERE id = OLD.workspace_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workspace_channel_count ON nchat_channels;
CREATE TRIGGER update_workspace_channel_count
AFTER INSERT OR DELETE ON nchat_channels
FOR EACH ROW
EXECUTE FUNCTION trigger_update_workspace_channel_count();

-- Function to update message reaction count
CREATE OR REPLACE FUNCTION trigger_update_message_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nchat_messages 
    SET reaction_count = reaction_count + 1
    WHERE id = NEW.message_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nchat_messages 
    SET reaction_count = GREATEST(reaction_count - 1, 0)
    WHERE id = OLD.message_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_message_reaction_count ON nchat_reactions;
CREATE TRIGGER update_message_reaction_count
AFTER INSERT OR DELETE ON nchat_reactions
FOR EACH ROW
EXECUTE FUNCTION trigger_update_message_reaction_count();
