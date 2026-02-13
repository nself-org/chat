-- Seed: Demo Messages
-- Description: Create welcome messages in demo channels

BEGIN;

-- Create welcome messages
INSERT INTO nchat_messages (id, channel_id, user_id, content, content_plain, type)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '2299117e-0b78-4133-8f2f-4879e682f3b5',
   'Welcome to nself-chat! 👋 This is the #general channel.', 'Welcome to nself-chat! This is the #general channel.', 'text'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'a2c78c45-b4e1-46b1-afc5-db5688a0326c',
   'Hey everyone! Feel free to share anything here. 🎉', 'Hey everyone! Feel free to share anything here.', 'text'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', '2299117e-0b78-4133-8f2f-4879e682f3b5',
   '📢 This is the announcements channel. Stay tuned for updates!', 'This is the announcements channel. Stay tuned for updates!', 'text')
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  'Demo Messages Seeded' as status,
  COUNT(*) as total_messages
FROM nchat_messages;

COMMIT;
