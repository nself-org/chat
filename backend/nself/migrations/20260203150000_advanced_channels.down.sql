-- ===========================================================================
-- Rollback Advanced Channels Migration - Tasks 60-65
-- ===========================================================================

BEGIN;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_community_group_count ON community_groups;
DROP TRIGGER IF EXISTS trigger_broadcast_subscriber_count ON broadcast_subscribers;
DROP TRIGGER IF EXISTS trigger_channel_member_count ON channel_members;
DROP TRIGGER IF EXISTS trigger_category_position ON channel_categories;

-- Drop functions
DROP FUNCTION IF EXISTS update_community_group_count();
DROP FUNCTION IF EXISTS update_broadcast_subscriber_count();
DROP FUNCTION IF EXISTS update_channel_member_count();
DROP FUNCTION IF EXISTS update_category_positions();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS channel_invites CASCADE;
DROP TABLE IF EXISTS broadcast_deliveries CASCADE;
DROP TABLE IF EXISTS broadcast_messages CASCADE;
DROP TABLE IF EXISTS broadcast_subscribers CASCADE;
DROP TABLE IF EXISTS broadcast_lists CASCADE;
DROP TABLE IF EXISTS community_groups CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS channel_permission_overrides CASCADE;
DROP TABLE IF EXISTS channel_categories CASCADE;

-- Remove columns from channels
ALTER TABLE channels DROP COLUMN IF EXISTS position;
ALTER TABLE channels DROP COLUMN IF EXISTS is_nsfw;
ALTER TABLE channels DROP COLUMN IF EXISTS banner_url;
ALTER TABLE channels DROP COLUMN IF EXISTS slowmode_seconds;
ALTER TABLE channels DROP COLUMN IF EXISTS max_members;
ALTER TABLE channels DROP COLUMN IF EXISTS permission_sync_id;
ALTER TABLE channels DROP COLUMN IF EXISTS subtype;
ALTER TABLE channels DROP COLUMN IF EXISTS category_id;

-- Remove columns from workspaces
ALTER TABLE workspaces DROP COLUMN IF EXISTS boost_count;
ALTER TABLE workspaces DROP COLUMN IF EXISTS boost_tier;
ALTER TABLE workspaces DROP COLUMN IF EXISTS member_count;
ALTER TABLE workspaces DROP COLUMN IF EXISTS rules_channel_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS system_channel_id;
ALTER TABLE workspaces DROP COLUMN IF EXISTS explicit_content_filter;
ALTER TABLE workspaces DROP COLUMN IF EXISTS verification_level;
ALTER TABLE workspaces DROP COLUMN IF EXISTS is_discoverable;
ALTER TABLE workspaces DROP COLUMN IF EXISTS discovery_splash_url;
ALTER TABLE workspaces DROP COLUMN IF EXISTS splash_url;
ALTER TABLE workspaces DROP COLUMN IF EXISTS vanity_url;

-- Drop enums
DROP TYPE IF EXISTS broadcast_subscription_status;
DROP TYPE IF EXISTS channel_subtype;

COMMIT;
