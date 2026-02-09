-- User Settings Migration
-- Created: 2026-02-07
-- Purpose: Add nchat_user_settings table for storing per-user settings with versioning and sync support

-- ============================================================================
-- User Settings Table
-- ============================================================================
-- Stores all user settings in a single JSONB column
-- Supports versioning for multi-device sync with conflict resolution
-- Primary key is user_id (one settings record per user)

CREATE TABLE IF NOT EXISTS public.nchat_user_settings (
  user_id UUID PRIMARY KEY,

  -- Settings data (JSONB allows flexible schema changes)
  settings JSONB NOT NULL DEFAULT '{}',

  -- Version tracking for multi-device sync
  -- Clients compare versions to detect conflicts
  version INTEGER NOT NULL DEFAULT 1,

  -- Timestamps for audit trail and last-write-wins conflict resolution
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key to users table
  CONSTRAINT user_settings_user_fk FOREIGN KEY (user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE
);

-- Index for faster lookups (though we primarily use the primary key)
CREATE INDEX IF NOT EXISTS idx_user_settings_created ON public.nchat_user_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated ON public.nchat_user_settings(updated_at);

-- Enable RLS for multi-tenancy (users can only see their own settings)
ALTER TABLE public.nchat_user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/write their own settings
CREATE POLICY user_settings_select_policy ON public.nchat_user_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY user_settings_update_policy ON public.nchat_user_settings
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY user_settings_insert_policy ON public.nchat_user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_delete_policy ON public.nchat_user_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- Blocked Users Table (for privacy settings)
-- ============================================================================
-- Tracks users that a user has blocked

CREATE TABLE IF NOT EXISTS public.nchat_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_user_id UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT blocked_users_blocker_fk FOREIGN KEY (blocker_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE,
  CONSTRAINT blocked_users_blocked_fk FOREIGN KEY (blocked_user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE,
  CONSTRAINT blocked_users_self_block CHECK (blocker_id != blocked_user_id),
  CONSTRAINT blocked_users_pkey UNIQUE(blocker_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.nchat_blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.nchat_blocked_users(blocked_user_id);

-- ============================================================================
-- Muted Channels Table (for notification settings)
-- ============================================================================
-- Tracks channels that a user has muted

CREATE TABLE IF NOT EXISTS public.nchat_muted_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL,

  -- Mute expiration (null = indefinite mute)
  muted_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT muted_channels_user_fk FOREIGN KEY (user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE,
  CONSTRAINT muted_channels_channel_fk FOREIGN KEY (channel_id) REFERENCES public.nchat_channels(id) ON DELETE CASCADE,
  CONSTRAINT muted_channels_pkey UNIQUE(user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_channels_user ON public.nchat_muted_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_channels_channel ON public.nchat_muted_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_muted_channels_muted_until ON public.nchat_muted_channels(muted_until);

-- ============================================================================
-- Muted Users Table (for privacy/notification settings)
-- ============================================================================
-- Tracks users that a user has muted

CREATE TABLE IF NOT EXISTS public.nchat_muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_id UUID NOT NULL,
  muted_user_id UUID NOT NULL,

  -- Mute expiration (null = indefinite mute)
  muted_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT muted_users_muter_fk FOREIGN KEY (muter_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE,
  CONSTRAINT muted_users_muted_fk FOREIGN KEY (muted_user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE,
  CONSTRAINT muted_users_self_mute CHECK (muter_id != muted_user_id),
  CONSTRAINT muted_users_pkey UNIQUE(muter_id, muted_user_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_users_muter ON public.nchat_muted_users(muter_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_muted ON public.nchat_muted_users(muted_user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_muted_until ON public.nchat_muted_users(muted_until);

-- ============================================================================
-- User Sessions Table (for security/privacy settings)
-- ============================================================================
-- Tracks active sessions for security and multi-device management

CREATE TABLE IF NOT EXISTS public.nchat_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Device and environment info
  device_name VARCHAR(255),
  device_type VARCHAR(32), -- 'desktop', 'mobile', 'tablet', 'unknown'
  browser VARCHAR(255),
  os VARCHAR(255),

  -- Network info
  ip_address INET,
  location VARCHAR(255),

  -- Session state
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_current BOOLEAN NOT NULL DEFAULT false,

  -- Session tokens
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Activity tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.nchat_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.nchat_user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_current ON public.nchat_user_sessions(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.nchat_user_sessions(last_active_at DESC);

-- ============================================================================
-- Login History Table (for security auditing)
-- ============================================================================
-- Tracks login attempts for security audit trail

CREATE TABLE IF NOT EXISTS public.nchat_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Device and environment info
  device_name VARCHAR(255),
  device_type VARCHAR(32),
  browser VARCHAR(255),
  os VARCHAR(255),

  -- Network info
  ip_address INET,
  location VARCHAR(255),

  -- Login result
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),

  -- Authentication method
  auth_method VARCHAR(32), -- 'password', 'oauth', 'magic_link', 'totp', 'webauthn'

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT login_history_user_fk FOREIGN KEY (user_id) REFERENCES public.nchat_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.nchat_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON public.nchat_login_history(success);
CREATE INDEX IF NOT EXISTS idx_login_history_created ON public.nchat_login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON public.nchat_login_history(user_id, created_at DESC);

-- Grant permissions to auth role (for Hasura)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_user_settings TO "auth";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_blocked_users TO "auth";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_muted_channels TO "auth";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_muted_users TO "auth";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_user_sessions TO "auth";
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nchat_login_history TO "auth";

-- Commit migration
-- This migration creates the foundation for user-specific settings management
-- and related security/privacy features.
