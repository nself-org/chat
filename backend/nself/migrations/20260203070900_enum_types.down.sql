-- ============================================================================
-- NCHAT ENUM TYPES - ROLLBACK
-- Migration: 20260203070900_enum_types
-- Description: Drop all enum types for nchat schema
-- ============================================================================

-- Drop in reverse dependency order
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS attachment_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS member_role CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;
DROP TYPE IF EXISTS channel_type CASCADE;
DROP TYPE IF EXISTS presence_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
