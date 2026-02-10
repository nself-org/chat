-- ============================================================================
-- nChat Analytics Database Schema (v0.5.0)
-- ============================================================================
-- Comprehensive analytics tables with TimescaleDB support for time-series data
-- ============================================================================

-- Enable TimescaleDB extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- 1. Analytics Events Table (Primary Time-Series Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event Information
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL,

  -- User Information
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,
  anonymous_id VARCHAR(100),
  session_id VARCHAR(100) NOT NULL,

  -- Context
  platform VARCHAR(20), -- web, desktop, mobile
  app_version VARCHAR(20),
  user_agent TEXT,

  -- Event Properties (JSONB for flexibility)
  properties JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to TimescaleDB hypertable (partitioned by time)
SELECT create_hypertable(
  'nchat_analytics_events',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON nchat_analytics_events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category
  ON nchat_analytics_events (event_category, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name
  ON nchat_analytics_events (event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON nchat_analytics_events (session_id, timestamp DESC);

-- GIN index for JSONB properties (fast property searches)
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties
  ON nchat_analytics_events USING GIN (properties);

-- ============================================================================
-- 2. User Activity Tracking (Aggregated Hourly)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL REFERENCES nchat_users(id) ON DELETE CASCADE,

  -- Activity Metrics (per hour)
  messages_sent INTEGER DEFAULT 0,
  reactions_given INTEGER DEFAULT 0,
  reactions_received INTEGER DEFAULT 0,
  files_uploaded INTEGER DEFAULT 0,
  threads_participated INTEGER DEFAULT 0,
  mentions_given INTEGER DEFAULT 0,
  mentions_received INTEGER DEFAULT 0,

  -- Engagement Score (weighted calculation)
  engagement_score FLOAT DEFAULT 0,

  -- Session Info
  session_duration_seconds INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, timestamp)
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_user_activity',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_user_time
  ON nchat_analytics_user_activity (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_engagement
  ON nchat_analytics_user_activity (engagement_score DESC, timestamp DESC);

-- ============================================================================
-- 3. Channel Activity Tracking (Aggregated Hourly)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_channel_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  channel_id UUID NOT NULL REFERENCES nchat_channels(id) ON DELETE CASCADE,

  -- Activity Metrics (per hour)
  messages_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  files_shared INTEGER DEFAULT 0,
  threads_created INTEGER DEFAULT 0,

  -- Performance Metrics
  average_response_time_seconds FLOAT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(channel_id, timestamp)
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_channel_activity',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_activity_channel_time
  ON nchat_analytics_channel_activity (channel_id, timestamp DESC);

-- ============================================================================
-- 4. Message Performance Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_message_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES nchat_messages(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Engagement Metrics
  views INTEGER DEFAULT 0,
  reactions_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,

  -- Time to First Response (milliseconds)
  time_to_first_response_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_metrics_message
  ON nchat_analytics_message_metrics (message_id);
CREATE INDEX IF NOT EXISTS idx_message_metrics_timestamp
  ON nchat_analytics_message_metrics (timestamp DESC);

-- ============================================================================
-- 5. Search Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Search Query
  query TEXT NOT NULL,
  query_normalized TEXT NOT NULL, -- lowercased, trimmed

  -- User Information
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,

  -- Results
  result_count INTEGER NOT NULL DEFAULT 0,
  clicked_result_id UUID, -- Which result was clicked
  clicked_result_position INTEGER, -- Position in results (for CTR)

  -- Performance
  search_duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_search_logs',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_logs_query
  ON nchat_analytics_search_logs (query_normalized, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_user
  ON nchat_analytics_search_logs (user_id, timestamp DESC);

-- ============================================================================
-- 6. Performance Metrics (API Response Times)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Request Information
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL, -- GET, POST, etc.
  status_code INTEGER NOT NULL,

  -- Performance Metrics
  response_time_ms INTEGER NOT NULL,
  db_query_time_ms INTEGER DEFAULT 0,
  external_api_time_ms INTEGER DEFAULT 0,

  -- User Context
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_performance',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_endpoint
  ON nchat_analytics_performance (endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_status
  ON nchat_analytics_performance (status_code, timestamp DESC);

-- ============================================================================
-- 7. WebSocket Connection Metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_websocket_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Connection Info
  connection_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,

  -- Metrics
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  connection_duration_seconds INTEGER,

  -- Connection Quality
  latency_ms INTEGER,
  packet_loss_rate FLOAT DEFAULT 0,

  -- Events
  event_type VARCHAR(50) NOT NULL, -- connected, disconnected, error
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_websocket_metrics',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '1 day'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_websocket_metrics_user
  ON nchat_analytics_websocket_metrics (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_websocket_metrics_event
  ON nchat_analytics_websocket_metrics (event_type, timestamp DESC);

-- ============================================================================
-- 8. Feature Usage Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Feature Information
  feature_name VARCHAR(100) NOT NULL,
  feature_category VARCHAR(50) NOT NULL,

  -- Usage Metrics
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,
  usage_count INTEGER DEFAULT 1,

  -- Context
  platform VARCHAR(20),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_feature_usage',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature
  ON nchat_analytics_feature_usage (feature_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user
  ON nchat_analytics_feature_usage (user_id, timestamp DESC);

-- ============================================================================
-- 9. Error Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS nchat_analytics_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Error Information
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Context
  user_id UUID REFERENCES nchat_users(id) ON DELETE SET NULL,
  url VARCHAR(500),
  user_agent TEXT,
  platform VARCHAR(20),
  app_version VARCHAR(20),

  -- Additional Context (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Severity
  severity VARCHAR(20) DEFAULT 'error', -- error, warning, critical

  -- Status
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES nchat_users(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable(
  'nchat_analytics_errors',
  'timestamp',
  if_not_exists => TRUE,
  chunk_time_interval => INTERVAL '7 days'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_errors_type
  ON nchat_analytics_errors (error_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_errors_severity
  ON nchat_analytics_errors (severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_errors_resolved
  ON nchat_analytics_errors (resolved, timestamp DESC);

-- ============================================================================
-- 10. Continuous Aggregates (Materialized Views for Fast Queries)
-- ============================================================================

-- Daily User Activity Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_analytics_daily_user_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  user_id,
  SUM(messages_sent) AS total_messages,
  SUM(reactions_given) AS total_reactions,
  SUM(files_uploaded) AS total_files,
  AVG(engagement_score) AS avg_engagement_score,
  SUM(session_duration_seconds) AS total_session_duration
FROM nchat_analytics_user_activity
GROUP BY day, user_id
WITH NO DATA;

-- Refresh policy (update every hour for past 7 days)
SELECT add_continuous_aggregate_policy('nchat_analytics_daily_user_summary',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Daily Channel Activity Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_analytics_daily_channel_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', timestamp) AS day,
  channel_id,
  SUM(messages_count) AS total_messages,
  AVG(active_users_count) AS avg_active_users,
  SUM(reactions_count) AS total_reactions,
  AVG(average_response_time_seconds) AS avg_response_time
FROM nchat_analytics_channel_activity
GROUP BY day, channel_id
WITH NO DATA;

-- Refresh policy
SELECT add_continuous_aggregate_policy('nchat_analytics_daily_channel_summary',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Hourly Performance Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_analytics_hourly_performance_summary
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', timestamp) AS hour,
  endpoint,
  COUNT(*) AS request_count,
  AVG(response_time_ms) AS avg_response_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) AS p50_response_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95_response_time,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) AS p99_response_time,
  COUNT(*) FILTER (WHERE status_code >= 500) AS error_count,
  COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) AS client_error_count
FROM nchat_analytics_performance
GROUP BY hour, endpoint
WITH NO DATA;

-- Refresh policy
SELECT add_continuous_aggregate_policy('nchat_analytics_hourly_performance_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '10 minutes',
  schedule_interval => INTERVAL '10 minutes',
  if_not_exists => TRUE
);

-- ============================================================================
-- 11. Data Retention Policies (Automatic Cleanup)
-- ============================================================================

-- Retain raw events for 90 days, then drop
SELECT add_retention_policy('nchat_analytics_events', INTERVAL '90 days', if_not_exists => TRUE);

-- Retain user activity for 365 days
SELECT add_retention_policy('nchat_analytics_user_activity', INTERVAL '365 days', if_not_exists => TRUE);

-- Retain channel activity for 365 days
SELECT add_retention_policy('nchat_analytics_channel_activity', INTERVAL '365 days', if_not_exists => TRUE);

-- Retain search logs for 90 days
SELECT add_retention_policy('nchat_analytics_search_logs', INTERVAL '90 days', if_not_exists => TRUE);

-- Retain performance metrics for 30 days
SELECT add_retention_policy('nchat_analytics_performance', INTERVAL '30 days', if_not_exists => TRUE);

-- Retain WebSocket metrics for 30 days
SELECT add_retention_policy('nchat_analytics_websocket_metrics', INTERVAL '30 days', if_not_exists => TRUE);

-- Retain feature usage for 180 days
SELECT add_retention_policy('nchat_analytics_feature_usage', INTERVAL '180 days', if_not_exists => TRUE);

-- Retain errors for 180 days (or until resolved)
SELECT add_retention_policy('nchat_analytics_errors', INTERVAL '180 days', if_not_exists => TRUE);

-- ============================================================================
-- 12. Helper Functions
-- ============================================================================

-- Calculate Daily Active Users (DAU)
CREATE OR REPLACE FUNCTION nchat_analytics_get_dau(start_date DATE, end_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  date DATE,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    timestamp::DATE AS date,
    COUNT(DISTINCT user_id) AS active_users
  FROM nchat_analytics_events
  WHERE timestamp >= start_date
    AND timestamp < end_date + INTERVAL '1 day'
    AND user_id IS NOT NULL
  GROUP BY timestamp::DATE
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- Calculate Monthly Active Users (MAU)
CREATE OR REPLACE FUNCTION nchat_analytics_get_mau(start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days')
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM nchat_analytics_events
    WHERE timestamp >= start_date
      AND timestamp < CURRENT_DATE + INTERVAL '1 day'
      AND user_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Get User Engagement Score
CREATE OR REPLACE FUNCTION nchat_analytics_calculate_engagement_score(
  p_messages INT,
  p_reactions INT,
  p_files INT,
  p_threads INT
)
RETURNS FLOAT AS $$
BEGIN
  -- Weighted engagement score
  RETURN (
    (p_messages * 1.0) +
    (p_reactions * 0.5) +
    (p_files * 2.0) +
    (p_threads * 1.5)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get Peak Activity Hours
CREATE OR REPLACE FUNCTION nchat_analytics_get_peak_hours(days_back INT DEFAULT 30)
RETURNS TABLE (
  hour INT,
  message_count BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM timestamp)::INT AS hour,
    COUNT(*) AS message_count,
    COUNT(DISTINCT user_id) AS active_users
  FROM nchat_analytics_events
  WHERE timestamp >= NOW() - (days_back || ' days')::INTERVAL
    AND event_category = 'messaging'
  GROUP BY hour
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. Permissions (Grant to Hasura)
-- ============================================================================

-- Grant SELECT permissions to Hasura (read-only for analytics)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hasura_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hasura_user;

-- Grant INSERT for event tracking
GRANT INSERT ON nchat_analytics_events TO hasura_user;
GRANT INSERT ON nchat_analytics_user_activity TO hasura_user;
GRANT INSERT ON nchat_analytics_channel_activity TO hasura_user;
GRANT INSERT ON nchat_analytics_message_metrics TO hasura_user;
GRANT INSERT ON nchat_analytics_search_logs TO hasura_user;
GRANT INSERT ON nchat_analytics_performance TO hasura_user;
GRANT INSERT ON nchat_analytics_websocket_metrics TO hasura_user;
GRANT INSERT ON nchat_analytics_feature_usage TO hasura_user;
GRANT INSERT ON nchat_analytics_errors TO hasura_user;

-- ============================================================================
-- End of Analytics Schema
-- ============================================================================
