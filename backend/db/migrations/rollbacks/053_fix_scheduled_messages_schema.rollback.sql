-- Rollback for 053_fix_scheduled_messages_schema.sql
-- Generated: 2026-02-09
-- Complexity: MEDIUM

-- ============================================================================
-- WARNING: Test this rollback script thoroughly before use!
-- This rollback removes columns and trigger added by the migration.
-- Data in status column will be converted back to boolean flags.
-- ============================================================================

BEGIN;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sync_scheduled_at ON nchat.nchat_scheduled_message CASCADE;
DROP FUNCTION IF EXISTS nchat.sync_scheduled_at CASCADE;

-- Convert status back to boolean flags (best effort)
UPDATE nchat.nchat_scheduled_message
SET
  is_sent = CASE WHEN status = 'sent' THEN TRUE ELSE is_sent END,
  is_cancelled = CASE WHEN status = 'cancelled' THEN TRUE ELSE is_cancelled END
WHERE status IN ('sent', 'cancelled');

-- Drop constraint
ALTER TABLE nchat.nchat_scheduled_message
DROP CONSTRAINT IF EXISTS valid_scheduled_status CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS nchat.idx_scheduled_message_scheduled_at CASCADE;

-- Drop added columns
ALTER TABLE nchat.nchat_scheduled_message
DROP COLUMN IF EXISTS scheduled_at CASCADE;

ALTER TABLE nchat.nchat_scheduled_message
DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE nchat.nchat_scheduled_message
DROP COLUMN IF EXISTS max_retries CASCADE;

ALTER TABLE nchat.nchat_scheduled_message
DROP COLUMN IF EXISTS sent_at CASCADE;

COMMIT;

-- Rollback complete
-- Next steps:
-- 1. Verify application functionality
-- 2. Check that scheduled messages still work
-- 3. Monitor error rates
-- 4. Update application code to use old column names
