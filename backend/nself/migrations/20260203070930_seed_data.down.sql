-- ============================================================================
-- NCHAT SEED DATA - ROLLBACK
-- Migration: 20260203070930_seed_data
-- Description: Remove default seed data
-- ============================================================================

DELETE FROM nchat_app_configuration WHERE key = 'primary';
DELETE FROM nchat_plans WHERE slug IN ('free', 'pro', 'business', 'enterprise');
DELETE FROM nchat_permissions;
