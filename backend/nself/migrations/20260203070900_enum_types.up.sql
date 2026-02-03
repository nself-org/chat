-- ============================================================================
-- NCHAT ENUM TYPES
-- Migration: 20260203070900_enum_types
-- Description: Create all enum types for nchat schema
-- ============================================================================

-- User status enum
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Presence status enum
DO $$ BEGIN
  CREATE TYPE presence_status AS ENUM ('online', 'away', 'dnd', 'offline', 'invisible');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Channel type enum
DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('public', 'private', 'direct', 'group', 'announcement');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Message type enum
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('text', 'system', 'bot', 'file', 'voice', 'video', 'embed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Member role enum
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner', 'admin', 'moderator', 'member', 'guest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Notification type enum
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('message', 'mention', 'reaction', 'thread_reply', 'channel_invite', 'system');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Attachment type enum
DO $$ BEGIN
  CREATE TYPE attachment_type AS ENUM ('image', 'video', 'audio', 'document', 'archive', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Audit action enum
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create', 'read', 'update', 'delete',
    'login', 'logout', 'invite', 'join', 'leave',
    'kick', 'ban', 'unban', 'mute', 'unmute',
    'pin', 'unpin', 'archive', 'unarchive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add comments for documentation
COMMENT ON TYPE user_status IS 'User account status';
COMMENT ON TYPE presence_status IS 'Real-time user presence status';
COMMENT ON TYPE channel_type IS 'Channel classification type';
COMMENT ON TYPE message_type IS 'Message content type';
COMMENT ON TYPE member_role IS 'Channel/workspace member role';
COMMENT ON TYPE notification_type IS 'Notification category';
COMMENT ON TYPE attachment_type IS 'File attachment classification';
COMMENT ON TYPE subscription_status IS 'Billing subscription status';
COMMENT ON TYPE audit_action IS 'Audit log action type';
