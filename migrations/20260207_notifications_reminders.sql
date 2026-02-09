-- Notifications and Reminders Tables Migration
-- Created: 2026-02-07
-- Purpose: Add notifications, notification preferences, push subscriptions, batch jobs, and reminders tables

-- ============================================================================
-- Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_id UUID,

  -- Notification content
  type VARCHAR(32) NOT NULL, -- 'mention', 'direct_message', 'thread_reply', 'reaction', 'channel_invite', 'channel_update', 'system', 'announcement', 'keyword'
  priority VARCHAR(10) NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  title VARCHAR(200) NOT NULL,
  body VARCHAR(1000) NOT NULL,

  -- Related entities
  channel_id UUID,
  message_id UUID,
  thread_id UUID,

  -- Action and metadata
  action_url TEXT,
  metadata JSONB DEFAULT '{}',

  -- State
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nchat_notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.nchat_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.nchat_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.nchat_notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON public.nchat_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.nchat_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.nchat_notifications(user_id, created_at DESC);

-- ============================================================================
-- Notification Preferences Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Channel and category
  channel VARCHAR(16) NOT NULL, -- 'email', 'push', 'sms'
  category VARCHAR(16) NOT NULL, -- 'transactional', 'marketing', 'system', 'alert'

  -- Settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  frequency VARCHAR(16) NOT NULL DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily', 'weekly', 'disabled'
  quiet_hours JSONB, -- { start: 'HH:MM', end: 'HH:MM', timezone: 'America/New_York' }

  -- Additional settings
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT notification_preferences_user_channel_category_key UNIQUE(user_id, channel, category)
);

-- Indexes for nchat_notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.nchat_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_channel ON public.nchat_notification_preferences(channel);

-- ============================================================================
-- Push Subscriptions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Push subscription data
  endpoint TEXT NOT NULL,
  expiration_time TIMESTAMPTZ,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device info
  device_id VARCHAR(128),
  platform VARCHAR(16) NOT NULL DEFAULT 'web', -- 'web', 'pwa', 'ios', 'android'
  user_agent TEXT,

  -- State
  active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint on endpoint
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE(endpoint)
);

-- Indexes for nchat_push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.nchat_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON public.nchat_push_subscriptions(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON public.nchat_push_subscriptions(endpoint);

-- ============================================================================
-- Batch Jobs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job info
  type VARCHAR(64) NOT NULL, -- 'notification_batch', 'email_digest', etc.
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'completed_with_errors', 'failed'

  -- Progress tracking
  total INTEGER NOT NULL DEFAULT 0,
  successful INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,

  -- Results
  errors JSONB,
  results JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for nchat_batch_jobs
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON public.nchat_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_type ON public.nchat_batch_jobs(type);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created ON public.nchat_batch_jobs(created_at DESC);

-- ============================================================================
-- Reminders Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Related entities
  message_id UUID,
  channel_id UUID,

  -- Reminder content
  content VARCHAR(500) NOT NULL,
  note TEXT,

  -- Scheduling
  remind_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',

  -- Status
  status VARCHAR(16) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'dismissed', 'snoozed'
  type VARCHAR(16) NOT NULL DEFAULT 'custom', -- 'message', 'custom', 'followup'

  -- Recurrence
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule JSONB, -- { frequency: 'daily'|'weekly'|'monthly'|'yearly', interval: 1, daysOfWeek: [], dayOfMonth: 1, endDate: null, count: null }

  -- Snooze tracking
  snooze_count INTEGER NOT NULL DEFAULT 0,
  snoozed_until TIMESTAMPTZ,

  -- Completion
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nchat_reminders
CREATE INDEX IF NOT EXISTS idx_reminders_user ON public.nchat_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_status ON public.nchat_reminders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON public.nchat_reminders(remind_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_channel ON public.nchat_reminders(channel_id);
CREATE INDEX IF NOT EXISTS idx_reminders_message ON public.nchat_reminders(message_id);

-- ============================================================================
-- Digest Settings Table (for email digests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nchat_digest_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- Digest configuration
  enabled BOOLEAN NOT NULL DEFAULT false,
  frequency VARCHAR(16) NOT NULL DEFAULT 'daily', -- 'daily', 'weekly'
  time VARCHAR(5) NOT NULL DEFAULT '09:00', -- HH:MM format
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',

  -- Content options
  include_read BOOLEAN NOT NULL DEFAULT false,
  max_notifications INTEGER NOT NULL DEFAULT 50,

  -- Last sent tracking
  last_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for nchat_digest_settings
CREATE INDEX IF NOT EXISTS idx_digest_settings_user ON public.nchat_digest_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_settings_enabled ON public.nchat_digest_settings(enabled, frequency) WHERE enabled = true;

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Reuse the update_updated_at_column function from billing migration if it exists
-- Otherwise create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END $$;

CREATE TRIGGER update_nchat_notifications_updated_at
    BEFORE UPDATE ON public.nchat_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nchat_notification_preferences_updated_at
    BEFORE UPDATE ON public.nchat_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nchat_push_subscriptions_updated_at
    BEFORE UPDATE ON public.nchat_push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nchat_batch_jobs_updated_at
    BEFORE UPDATE ON public.nchat_batch_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nchat_reminders_updated_at
    BEFORE UPDATE ON public.nchat_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nchat_digest_settings_updated_at
    BEFORE UPDATE ON public.nchat_digest_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.nchat_notifications IS 'In-app and external notifications for users';
COMMENT ON TABLE public.nchat_notification_preferences IS 'User notification preference settings by channel and category';
COMMENT ON TABLE public.nchat_push_subscriptions IS 'Web push notification subscriptions';
COMMENT ON TABLE public.nchat_batch_jobs IS 'Batch job tracking for notifications and other bulk operations';
COMMENT ON TABLE public.nchat_reminders IS 'User reminders for messages and custom events';
COMMENT ON TABLE public.nchat_digest_settings IS 'User settings for notification digest emails';
