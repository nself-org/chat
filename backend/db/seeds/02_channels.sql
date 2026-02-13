-- Seed: Demo Channels
-- Description: Create demo channels for testing

BEGIN;

-- Create demo channels
INSERT INTO nchat_channels (id, slug, name, description, type, created_by)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'general', 'general', 'General discussion for all topics', 'public', '2299117e-0b78-4133-8f2f-4879e682f3b5'),
  ('22222222-2222-2222-2222-222222222222', 'random', 'random', 'Random chat and off-topic discussion', 'public', '2299117e-0b78-4133-8f2f-4879e682f3b5'),
  ('33333333-3333-3333-3333-333333333333', 'announcements', 'announcements', 'Important announcements and updates', 'public', '2299117e-0b78-4133-8f2f-4879e682f3b5')
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  'Demo Channels Seeded' as status,
  COUNT(*) as total_channels
FROM nchat_channels;

COMMIT;
