-- Rollback for 052_fix_message_edits_schema.sql
-- Generated: 2026-02-09
-- Complexity: LOW

-- ============================================================================
-- WARNING: Test this rollback script thoroughly before use!
-- This rollback removes the edited_at column and its index.
-- ============================================================================

BEGIN;

-- Drop index on edited_at
DROP INDEX IF EXISTS nchat.idx_message_edits_edited_at CASCADE;

-- Restore old index on created_at (if it existed)
CREATE INDEX IF NOT EXISTS idx_message_edits_created_at
ON nchat.nchat_message_edits(created_at DESC);

-- Drop the edited_at column
ALTER TABLE nchat.nchat_message_edits
DROP COLUMN IF EXISTS edited_at CASCADE;

-- Remove comment
COMMENT ON COLUMN nchat.nchat_message_edits.created_at IS 'Timestamp when the edit record was created';

COMMIT;

-- Rollback complete
-- Next steps:
-- 1. Verify application functionality
-- 2. Check data integrity
-- 3. Monitor error rates
