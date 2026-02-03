-- ===========================================================================
-- Advanced Channels Migration - Tasks 60-65
-- ===========================================================================
-- Adds support for:
-- - Channel categories with ordering
-- - Discord-style guilds (workspace enhancements)
-- - Telegram-style supergroups and gigagroups
-- - WhatsApp-style communities with sub-groups
-- - Broadcast lists with delivery tracking
-- - Advanced permission overrides (bitfield-based)
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

-- Extended channel types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_subtype') THEN
    CREATE TYPE channel_subtype AS ENUM (
      'standard',
      'supergroup',         -- Telegram: >200 members
      'gigagroup',          -- Telegram: admin-only posting
      'community_announcement',  -- WhatsApp: announcement channel
      'news'                -- Discord: news channel
    );
  END IF;
END $$;

-- Broadcast subscription status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broadcast_subscription_status') THEN
    CREATE TYPE broadcast_subscription_status AS ENUM (
      'active',
      'unsubscribed',
      'blocked'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- WORKSPACES (Guild Enhancements)
-- ---------------------------------------------------------------------------

-- Add guild/server features to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS vanity_url VARCHAR(50) UNIQUE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS splash_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS discovery_splash_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS verification_level SMALLINT DEFAULT 0 NOT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS explicit_content_filter SMALLINT DEFAULT 0 NOT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS system_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS rules_channel_id UUID REFERENCES channels(id) ON DELETE SET NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS boost_tier SMALLINT DEFAULT 0 NOT NULL;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS boost_count INTEGER DEFAULT 0 NOT NULL;

-- Create discoverable workspaces index
CREATE INDEX IF NOT EXISTS idx_workspaces_discoverable ON workspaces(is_discoverable) WHERE is_discoverable = TRUE;
CREATE INDEX IF NOT EXISTS idx_workspaces_vanity ON workspaces(vanity_url) WHERE vanity_url IS NOT NULL;

-- ---------------------------------------------------------------------------
-- CHANNEL CATEGORIES
-- ---------------------------------------------------------------------------

-- Enhanced channel categories table
CREATE TABLE IF NOT EXISTS channel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),

  -- Ordering
  position INTEGER DEFAULT 0 NOT NULL,

  -- Permission sync
  default_permissions BIGINT DEFAULT 0,
  sync_permissions BOOLEAN DEFAULT TRUE NOT NULL,

  -- UI state (per-user handled in client)
  is_system BOOLEAN DEFAULT FALSE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_workspace_category_name UNIQUE(workspace_id, name)
);

CREATE INDEX idx_categories_workspace ON channel_categories(workspace_id);
CREATE INDEX idx_categories_position ON channel_categories(workspace_id, position);

-- ---------------------------------------------------------------------------
-- CHANNELS ENHANCEMENTS
-- ---------------------------------------------------------------------------

-- Add new columns to existing channels table
ALTER TABLE channels ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES channel_categories(id) ON DELETE SET NULL;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS subtype channel_subtype;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS permission_sync_id UUID REFERENCES channel_categories(id);
ALTER TABLE channels ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 0;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS slowmode_seconds INTEGER DEFAULT 0;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_nsfw BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0 NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category_id);
CREATE INDEX IF NOT EXISTS idx_channels_position ON channels(category_id, position);
CREATE INDEX IF NOT EXISTS idx_channels_subtype ON channels(subtype) WHERE subtype IS NOT NULL;

-- ---------------------------------------------------------------------------
-- CHANNEL PERMISSION OVERRIDES
-- ---------------------------------------------------------------------------

-- Discord-style permission overrides with bitfield
CREATE TABLE IF NOT EXISTS channel_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  -- Target: either role or user
  target_type VARCHAR(10) NOT NULL CHECK(target_type IN ('role', 'user')),
  target_id UUID NOT NULL,

  -- Permission bitfields (NULL = inherit, explicit allow/deny)
  allow_permissions BIGINT DEFAULT 0 NOT NULL,
  deny_permissions BIGINT DEFAULT 0 NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,

  CONSTRAINT unique_channel_target UNIQUE(channel_id, target_type, target_id)
);

CREATE INDEX idx_permission_overrides_channel ON channel_permission_overrides(channel_id);
CREATE INDEX idx_permission_overrides_target ON channel_permission_overrides(target_type, target_id);
CREATE INDEX idx_permission_overrides_expires ON channel_permission_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- COMMUNITIES (WhatsApp-style)
-- ---------------------------------------------------------------------------

-- Community structure
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,

  -- Auto-created announcement channel
  announcement_channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE RESTRICT,

  -- Settings
  add_groups_permission VARCHAR(20) DEFAULT 'admin' NOT NULL CHECK(add_groups_permission IN ('admin', 'member')),
  members_can_invite BOOLEAN DEFAULT TRUE NOT NULL,
  approval_required BOOLEAN DEFAULT FALSE NOT NULL,
  events_enabled BOOLEAN DEFAULT TRUE NOT NULL,

  -- Limits
  max_groups INTEGER DEFAULT 100 NOT NULL,
  max_members INTEGER DEFAULT 2000 NOT NULL,

  -- Stats (denormalized)
  group_count INTEGER DEFAULT 0 NOT NULL,
  total_member_count INTEGER DEFAULT 0 NOT NULL,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT check_max_groups CHECK(max_groups > 0 AND max_groups <= 100),
  CONSTRAINT check_max_members CHECK(max_members > 0 AND max_members <= 5000)
);

CREATE INDEX idx_communities_workspace ON communities(workspace_id);
CREATE INDEX idx_communities_announcement ON communities(announcement_channel_id);

-- Community sub-groups
CREATE TABLE IF NOT EXISTS community_groups (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,

  position INTEGER DEFAULT 0 NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id),

  PRIMARY KEY (community_id, channel_id)
);

CREATE INDEX idx_community_groups_channel ON community_groups(channel_id);
CREATE INDEX idx_community_groups_position ON community_groups(community_id, position);

-- ---------------------------------------------------------------------------
-- BROADCAST LISTS
-- ---------------------------------------------------------------------------

-- Broadcast list (one-to-many messaging)
CREATE TABLE IF NOT EXISTS broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),

  owner_id UUID NOT NULL REFERENCES users(id),

  -- Settings
  subscription_mode VARCHAR(20) DEFAULT 'admin' NOT NULL CHECK(subscription_mode IN ('open', 'invite', 'admin')),
  allow_replies BOOLEAN DEFAULT FALSE NOT NULL,
  show_sender_name BOOLEAN DEFAULT TRUE NOT NULL,
  track_delivery BOOLEAN DEFAULT TRUE NOT NULL,
  track_reads BOOLEAN DEFAULT TRUE NOT NULL,

  -- Limits
  max_subscribers INTEGER DEFAULT 256 NOT NULL,

  -- Stats (denormalized)
  subscriber_count INTEGER DEFAULT 0 NOT NULL,
  total_messages_sent INTEGER DEFAULT 0 NOT NULL,
  last_broadcast_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT check_max_subscribers CHECK(max_subscribers > 0 AND max_subscribers <= 10000)
);

CREATE INDEX idx_broadcast_lists_workspace ON broadcast_lists(workspace_id);
CREATE INDEX idx_broadcast_lists_owner ON broadcast_lists(owner_id);

-- Broadcast subscribers
CREATE TABLE IF NOT EXISTS broadcast_subscribers (
  broadcast_list_id UUID NOT NULL REFERENCES broadcast_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  subscribed_by UUID REFERENCES users(id),

  -- Preferences
  notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,

  -- Status
  status broadcast_subscription_status DEFAULT 'active' NOT NULL,
  unsubscribed_at TIMESTAMPTZ,

  PRIMARY KEY (broadcast_list_id, user_id)
);

CREATE INDEX idx_broadcast_subscribers_user ON broadcast_subscribers(user_id);
CREATE INDEX idx_broadcast_subscribers_status ON broadcast_subscribers(broadcast_list_id, status);

-- Broadcast messages
CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_list_id UUID NOT NULL REFERENCES broadcast_lists(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',

  sent_by UUID NOT NULL REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Schedule
  scheduled_for TIMESTAMPTZ,
  is_scheduled BOOLEAN DEFAULT FALSE NOT NULL,

  -- Delivery stats (denormalized)
  total_recipients INTEGER DEFAULT 0 NOT NULL,
  delivered_count INTEGER DEFAULT 0 NOT NULL,
  read_count INTEGER DEFAULT 0 NOT NULL,
  failed_count INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX idx_broadcast_messages_list ON broadcast_messages(broadcast_list_id);
CREATE INDEX idx_broadcast_messages_scheduled ON broadcast_messages(scheduled_for) WHERE is_scheduled = TRUE;
CREATE INDEX idx_broadcast_messages_sent_at ON broadcast_messages(sent_at);

-- Broadcast delivery tracking
CREATE TABLE IF NOT EXISTS broadcast_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_message_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK(status IN ('pending', 'delivered', 'read', 'failed')),

  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  CONSTRAINT unique_broadcast_delivery UNIQUE(broadcast_message_id, user_id)
);

CREATE INDEX idx_broadcast_deliveries_message ON broadcast_deliveries(broadcast_message_id);
CREATE INDEX idx_broadcast_deliveries_user ON broadcast_deliveries(user_id);
CREATE INDEX idx_broadcast_deliveries_status ON broadcast_deliveries(broadcast_message_id, status);

-- ---------------------------------------------------------------------------
-- CHANNEL INVITES
-- ---------------------------------------------------------------------------

-- Enhanced channel invites
CREATE TABLE IF NOT EXISTS channel_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,

  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,

  -- Limits
  max_uses INTEGER DEFAULT 0,  -- 0 = unlimited
  uses INTEGER DEFAULT 0 NOT NULL,

  -- Flags
  is_temporary BOOLEAN DEFAULT FALSE NOT NULL,  -- Revoke on disconnect
  is_active BOOLEAN DEFAULT TRUE NOT NULL,

  CONSTRAINT check_max_uses CHECK(max_uses >= 0),
  CONSTRAINT check_uses CHECK(uses >= 0)
);

CREATE INDEX idx_invites_code ON channel_invites(code) WHERE is_active = TRUE;
CREATE INDEX idx_invites_workspace ON channel_invites(workspace_id);
CREATE INDEX idx_invites_channel ON channel_invites(channel_id);
CREATE INDEX idx_invites_expires ON channel_invites(expires_at) WHERE expires_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- Function to update category position
CREATE OR REPLACE FUNCTION update_category_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign position if not provided
  IF NEW.position IS NULL OR NEW.position = 0 THEN
    SELECT COALESCE(MAX(position), 0) + 1
    INTO NEW.position
    FROM channel_categories
    WHERE workspace_id = NEW.workspace_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_category_position
  BEFORE INSERT ON channel_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_positions();

-- Function to update channel member count
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE channels
    SET member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE channels
    SET member_count = GREATEST(member_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_channel_member_count
  AFTER INSERT OR DELETE ON channel_members
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_member_count();

-- Function to update broadcast subscriber count
CREATE OR REPLACE FUNCTION update_broadcast_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE broadcast_lists
    SET subscriber_count = subscriber_count + 1
    WHERE id = NEW.broadcast_list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE broadcast_lists
    SET subscriber_count = GREATEST(subscriber_count - 1, 0)
    WHERE id = OLD.broadcast_list_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    -- Handle status changes
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      UPDATE broadcast_lists
      SET subscriber_count = subscriber_count + 1
      WHERE id = NEW.broadcast_list_id;
    ELSIF NEW.status != 'active' AND OLD.status = 'active' THEN
      UPDATE broadcast_lists
      SET subscriber_count = GREATEST(subscriber_count - 1, 0)
      WHERE id = NEW.broadcast_list_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_broadcast_subscriber_count
  AFTER INSERT OR UPDATE OR DELETE ON broadcast_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_broadcast_subscriber_count();

-- Function to update community group count
CREATE OR REPLACE FUNCTION update_community_group_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET group_count = group_count + 1,
        updated_at = NOW()
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET group_count = GREATEST(group_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_community_group_count
  AFTER INSERT OR DELETE ON community_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_community_group_count();

-- ---------------------------------------------------------------------------
-- COMMENTS
-- ---------------------------------------------------------------------------

COMMENT ON TABLE channel_categories IS 'Channel organization categories (Discord-style sections)';
COMMENT ON TABLE channel_permission_overrides IS 'Per-channel permission overrides with bitfield support';
COMMENT ON TABLE communities IS 'WhatsApp-style communities with announcement channel and sub-groups';
COMMENT ON TABLE community_groups IS 'Mapping of channels to communities as sub-groups';
COMMENT ON TABLE broadcast_lists IS 'One-to-many broadcast messaging lists';
COMMENT ON TABLE broadcast_subscribers IS 'Users subscribed to broadcast lists';
COMMENT ON TABLE broadcast_messages IS 'Messages sent via broadcast lists';
COMMENT ON TABLE broadcast_deliveries IS 'Per-user delivery tracking for broadcast messages';
COMMENT ON TABLE channel_invites IS 'Invite codes for joining workspaces and channels';

COMMIT;
