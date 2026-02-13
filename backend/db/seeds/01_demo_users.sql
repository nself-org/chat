-- Seed: Demo Users
-- Description: Create demo user accounts for testing and showcasing

BEGIN;

-- Insert demo users into auth.users
INSERT INTO auth.users (id, email, password_hash, display_name, email_verified, default_role, locale, metadata)
VALUES
  ('2299117e-0b78-4133-8f2f-4879e682f3b5', 'owner@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo Owner', true, 'user', 'en', '{"role": "owner", "demo_account": true}'::jsonb),
  ('a2c78c45-b4e1-46b1-afc5-db5688a0326c', 'admin@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo Admin', true, 'user', 'en', '{"role": "admin", "demo_account": true}'::jsonb),
  ('6bc63e34-6df2-42f1-8f53-dc58c0411dcf', 'mod@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo Moderator', true, 'user', 'en', '{"role": "moderator", "demo_account": true}'::jsonb),
  ('b6c1df08-6520-4b07-b961-213f056e62b9', 'support@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo Support', true, 'user', 'en', '{"role": "moderator", "demo_account": true}'::jsonb),
  ('2b07f26f-f6f8-4a0b-ac79-45392cc5067f', 'helper@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo Helper', true, 'user', 'en', '{"role": "member", "demo_account": true}'::jsonb),
  ('e758aded-8607-4c71-8d7e-a6dcb1c18c7f', 'user@nself.org', '$2b$10$ZokSzPaHwCG6P5WY8b3WzuvN1bzKaUBSMLZE/KoySoDtUDIq3kpQG', 'Demo User', true, 'user', 'en', '{"role": "member", "demo_account": true}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- Create nchat_users entries
INSERT INTO nchat_users (id, email, display_name, username, email_verified)
SELECT id, email, display_name, split_part(email, '@', 1), email_verified
FROM auth.users
WHERE metadata->>'demo_account' = 'true'
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT
  'Demo Users Seeded' as status,
  COUNT(*) as total_users
FROM auth.users
WHERE metadata->>'demo_account' = 'true';

COMMIT;
