-- Migration: Add voice/video calls and WebRTC support
-- Version: 0007
-- Date: 2026-02-03
-- Description: Add tables for calls, call participants, recordings, and enhanced streams

-- =============================================================================
-- CALLS TABLES
-- =============================================================================

-- Call types enum
CREATE TYPE nchat_call_type AS ENUM ('audio', 'video', 'screen_share');

-- Call status enum
CREATE TYPE nchat_call_status AS ENUM (
  'initiating',
  'ringing',
  'active',
  'ended',
  'missed',
  'declined',
  'failed',
  'cancelled'
);

-- Main calls table
CREATE TABLE IF NOT EXISTS nchat_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Call identification
  livekit_room_name VARCHAR(255) UNIQUE NOT NULL,
  call_type nchat_call_type NOT NULL DEFAULT 'audio',
  status nchat_call_status NOT NULL DEFAULT 'initiating',

  -- Relationships
  channel_id UUID REFERENCES nchat_channels(id) ON DELETE SET NULL,
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Call details
  is_group_call BOOLEAN NOT NULL DEFAULT false,
  max_participants INTEGER DEFAULT 100,

  -- Timestamps
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  end_reason VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call participants table
CREATE TABLE IF NOT EXISTS nchat_call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  call_id UUID NOT NULL REFERENCES nchat_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- LiveKit integration
  livekit_participant_id VARCHAR(255),
  livekit_identity VARCHAR(255),

  -- Participant status
  status VARCHAR(50) NOT NULL DEFAULT 'invited', -- invited, ringing, joined, left, kicked

  -- Tracks
  is_audio_enabled BOOLEAN NOT NULL DEFAULT true,
  is_video_enabled BOOLEAN NOT NULL DEFAULT false,
  is_screen_sharing BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,

  -- Exit details
  leave_reason VARCHAR(50), -- user_left, kicked, network_error, timeout

  -- Duration tracking
  total_duration_seconds INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(call_id, user_id)
);

-- =============================================================================
-- CALL RECORDINGS TABLE
-- =============================================================================

-- Recording status enum
CREATE TYPE nchat_recording_status AS ENUM (
  'starting',
  'recording',
  'processing',
  'ready',
  'failed',
  'expired',
  'deleted'
);

-- Call recordings table
CREATE TABLE IF NOT EXISTS nchat_call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  call_id UUID NOT NULL REFERENCES nchat_calls(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES nchat_channels(id) ON DELETE SET NULL,
  recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- LiveKit integration
  livekit_egress_id VARCHAR(255) UNIQUE,

  -- Recording details
  status nchat_recording_status NOT NULL DEFAULT 'starting',

  -- File details
  file_url TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,

  -- Video settings
  resolution VARCHAR(20), -- 720p, 1080p, 4k
  layout_type VARCHAR(50) DEFAULT 'grid', -- grid, speaker, single, custom
  audio_only BOOLEAN NOT NULL DEFAULT false,

  -- Thumbnail
  thumbnail_url TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Retention policy
  expires_at TIMESTAMPTZ, -- Auto-delete after this date
  retention_days INTEGER DEFAULT 30,

  -- Access control
  is_public BOOLEAN NOT NULL DEFAULT false,
  access_password VARCHAR(255), -- Optional password protection

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- ENHANCE STREAMS TABLES
-- =============================================================================

-- Update streams table if not exists (checking existing structure)
CREATE TABLE IF NOT EXISTS nchat_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,
  broadcaster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- LiveKit integration
  livekit_room_name VARCHAR(255) UNIQUE,
  livekit_egress_id VARCHAR(255), -- For HLS streaming

  -- Stream details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'preparing', -- preparing, scheduled, live, ending, ended, failed

  -- RTMP/Ingest
  stream_key VARCHAR(255) UNIQUE,
  ingest_url TEXT,

  -- HLS/Playback
  hls_manifest_url TEXT,
  dash_manifest_url TEXT,

  -- Stream settings
  max_resolution VARCHAR(20) DEFAULT '1080p',
  bitrate_kbps INTEGER,
  fps INTEGER,
  is_recorded BOOLEAN NOT NULL DEFAULT true,

  -- Features
  enable_chat BOOLEAN NOT NULL DEFAULT true,
  enable_reactions BOOLEAN NOT NULL DEFAULT true,
  enable_qa BOOLEAN NOT NULL DEFAULT false,

  -- Chat settings
  chat_mode VARCHAR(50) NOT NULL DEFAULT 'open', -- open, followers_only, subscribers_only, slow_mode
  slow_mode_seconds INTEGER,

  -- Categorization
  tags TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',

  -- Analytics (updated in real-time)
  current_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Duration
  duration_seconds INTEGER,

  -- Recording
  recording_url TEXT,
  recording_expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stream viewers table (for analytics)
CREATE TABLE IF NOT EXISTS nchat_stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  stream_id UUID NOT NULL REFERENCES nchat_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous viewers

  -- Viewer details
  viewer_session_id VARCHAR(255) NOT NULL, -- Unique per view session
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,

  -- Watch time
  watch_duration_seconds INTEGER DEFAULT 0,

  -- Engagement
  sent_chat_messages INTEGER DEFAULT 0,
  sent_reactions INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(stream_id, viewer_session_id)
);

-- Stream reactions table
CREATE TABLE IF NOT EXISTS nchat_stream_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  stream_id UUID NOT NULL REFERENCES nchat_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Reaction details
  reaction_type VARCHAR(50) NOT NULL, -- heart, like, fire, clap, laugh, wow, sad, angry

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stream chat messages table
CREATE TABLE IF NOT EXISTS nchat_stream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  stream_id UUID NOT NULL REFERENCES nchat_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,

  -- Moderation
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- WEBRTC CONNECTION TRACKING (for debugging/analytics)
-- =============================================================================

CREATE TABLE IF NOT EXISTS nchat_webrtc_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  call_id UUID REFERENCES nchat_calls(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES nchat_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Connection details
  peer_connection_id VARCHAR(255),
  connection_state VARCHAR(50), -- new, connecting, connected, disconnected, failed, closed

  -- ICE details
  ice_connection_state VARCHAR(50),
  ice_gathering_state VARCHAR(50),
  ice_candidates_received INTEGER DEFAULT 0,

  -- Network quality
  avg_bitrate_kbps INTEGER,
  packet_loss_percentage DECIMAL(5,2),
  latency_ms INTEGER,

  -- TURN usage
  used_turn BOOLEAN NOT NULL DEFAULT false,
  turn_server VARCHAR(255),

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Metadata (store detailed stats)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Calls indexes
CREATE INDEX idx_calls_status ON nchat_calls(status);
CREATE INDEX idx_calls_channel ON nchat_calls(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_calls_initiator ON nchat_calls(initiator_id);
CREATE INDEX idx_calls_created ON nchat_calls(created_at DESC);
CREATE INDEX idx_calls_active ON nchat_calls(status) WHERE status = 'active';

-- Call participants indexes
CREATE INDEX idx_call_participants_call ON nchat_call_participants(call_id);
CREATE INDEX idx_call_participants_user ON nchat_call_participants(user_id);
CREATE INDEX idx_call_participants_status ON nchat_call_participants(status);

-- Recordings indexes
CREATE INDEX idx_recordings_call ON nchat_call_recordings(call_id);
CREATE INDEX idx_recordings_channel ON nchat_call_recordings(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX idx_recordings_status ON nchat_call_recordings(status);
CREATE INDEX idx_recordings_expires ON nchat_call_recordings(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_recordings_deleted ON nchat_call_recordings(deleted_at) WHERE deleted_at IS NULL;

-- Streams indexes
CREATE INDEX idx_streams_channel ON nchat_streams(channel_id);
CREATE INDEX idx_streams_broadcaster ON nchat_streams(broadcaster_id);
CREATE INDEX idx_streams_status ON nchat_streams(status);
CREATE INDEX idx_streams_live ON nchat_streams(status) WHERE status = 'live';
CREATE INDEX idx_streams_scheduled ON nchat_streams(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_streams_created ON nchat_streams(created_at DESC);

-- Stream viewers indexes
CREATE INDEX idx_stream_viewers_stream ON nchat_stream_viewers(stream_id);
CREATE INDEX idx_stream_viewers_user ON nchat_stream_viewers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_stream_viewers_joined ON nchat_stream_viewers(joined_at DESC);

-- Stream reactions indexes
CREATE INDEX idx_stream_reactions_stream ON nchat_stream_reactions(stream_id);
CREATE INDEX idx_stream_reactions_user ON nchat_stream_reactions(user_id);
CREATE INDEX idx_stream_reactions_created ON nchat_stream_reactions(created_at DESC);

-- Stream chat indexes
CREATE INDEX idx_stream_chat_stream ON nchat_stream_chat_messages(stream_id);
CREATE INDEX idx_stream_chat_user ON nchat_stream_chat_messages(user_id);
CREATE INDEX idx_stream_chat_created ON nchat_stream_chat_messages(created_at DESC);
CREATE INDEX idx_stream_chat_pinned ON nchat_stream_chat_messages(is_pinned) WHERE is_pinned = true;

-- WebRTC connections indexes
CREATE INDEX idx_webrtc_call ON nchat_webrtc_connections(call_id) WHERE call_id IS NOT NULL;
CREATE INDEX idx_webrtc_stream ON nchat_webrtc_connections(stream_id) WHERE stream_id IS NOT NULL;
CREATE INDEX idx_webrtc_user ON nchat_webrtc_connections(user_id);
CREATE INDEX idx_webrtc_state ON nchat_webrtc_connections(connection_state);

-- =============================================================================
-- RLS POLICIES (Row Level Security)
-- =============================================================================

-- Enable RLS
ALTER TABLE nchat_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_stream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_stream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nchat_webrtc_connections ENABLE ROW LEVEL SECURITY;

-- Calls policies
CREATE POLICY "Users can view calls they participate in"
  ON nchat_calls FOR SELECT
  USING (
    auth.uid() = initiator_id OR
    EXISTS (
      SELECT 1 FROM nchat_call_participants
      WHERE call_id = nchat_calls.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create calls"
  ON nchat_calls FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Initiator can update their calls"
  ON nchat_calls FOR UPDATE
  USING (auth.uid() = initiator_id);

-- Call participants policies
CREATE POLICY "Users can view call participants for their calls"
  ON nchat_call_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM nchat_calls
      WHERE id = call_id AND initiator_id = auth.uid()
    )
  );

CREATE POLICY "Users can join calls"
  ON nchat_call_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation"
  ON nchat_call_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Recordings policies
CREATE POLICY "Users can view recordings for their calls"
  ON nchat_call_recordings FOR SELECT
  USING (
    is_public = true OR
    recorded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM nchat_call_participants
      WHERE call_id = nchat_call_recordings.call_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recordings for their calls"
  ON nchat_call_recordings FOR INSERT
  WITH CHECK (auth.uid() = recorded_by);

CREATE POLICY "Recording owner can update"
  ON nchat_call_recordings FOR UPDATE
  USING (auth.uid() = recorded_by);

CREATE POLICY "Recording owner can delete"
  ON nchat_call_recordings FOR DELETE
  USING (auth.uid() = recorded_by);

-- Streams policies
CREATE POLICY "Users can view public streams"
  ON nchat_streams FOR SELECT
  USING (true); -- All users can see streams

CREATE POLICY "Broadcaster can create streams"
  ON nchat_streams FOR INSERT
  WITH CHECK (auth.uid() = broadcaster_id);

CREATE POLICY "Broadcaster can update their streams"
  ON nchat_streams FOR UPDATE
  USING (auth.uid() = broadcaster_id);

-- Stream viewers policies
CREATE POLICY "Users can view stream viewer stats"
  ON nchat_stream_viewers FOR SELECT
  USING (true);

CREATE POLICY "System can insert viewer records"
  ON nchat_stream_viewers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own viewer record"
  ON nchat_stream_viewers FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Stream reactions policies
CREATE POLICY "Users can view stream reactions"
  ON nchat_stream_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create reactions"
  ON nchat_stream_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON nchat_stream_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Stream chat policies
CREATE POLICY "Users can view stream chat"
  ON nchat_stream_chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can send chat messages"
  ON nchat_stream_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON nchat_stream_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- WebRTC connections policies
CREATE POLICY "Users can view their own connections"
  ON nchat_webrtc_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
  ON nchat_webrtc_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON nchat_webrtc_connections FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON nchat_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_participants_updated_at BEFORE UPDATE ON nchat_call_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recordings_updated_at BEFORE UPDATE ON nchat_call_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON nchat_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webrtc_updated_at BEFORE UPDATE ON nchat_webrtc_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired recordings
CREATE OR REPLACE FUNCTION cleanup_expired_recordings()
RETURNS void AS $$
BEGIN
  UPDATE nchat_call_recordings
  SET
    status = 'expired',
    deleted_at = NOW()
  WHERE
    expires_at < NOW() AND
    status NOT IN ('expired', 'deleted');
END;
$$ LANGUAGE plpgsql;

-- Function to update stream analytics
CREATE OR REPLACE FUNCTION update_stream_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current viewers count
  UPDATE nchat_streams
  SET
    current_viewers = (
      SELECT COUNT(*)
      FROM nchat_stream_viewers
      WHERE stream_id = NEW.stream_id AND left_at IS NULL
    ),
    peak_viewers = GREATEST(
      peak_viewers,
      (
        SELECT COUNT(*)
        FROM nchat_stream_viewers
        WHERE stream_id = NEW.stream_id AND left_at IS NULL
      )
    )
  WHERE id = NEW.stream_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stream analytics when viewer joins/leaves
CREATE TRIGGER update_stream_analytics_on_viewer
  AFTER INSERT OR UPDATE ON nchat_stream_viewers
  FOR EACH ROW
  EXECUTE FUNCTION update_stream_analytics();

-- =============================================================================
-- GRANTS (Hasura access)
-- =============================================================================

-- Grant access to Hasura role
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_calls TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_call_participants TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_call_recordings TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_streams TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_stream_viewers TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_stream_reactions TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_stream_chat_messages TO hasura;
GRANT SELECT, INSERT, UPDATE, DELETE ON nchat_webrtc_connections TO hasura;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cleanup_expired_recordings() TO hasura;
GRANT EXECUTE ON FUNCTION update_stream_analytics() TO hasura;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
