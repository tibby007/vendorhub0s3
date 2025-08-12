-- Create admin organization first
INSERT INTO organizations (name, subscription_tier) 
VALUES ('Admin Organization', 'enterprise');

-- Get the organization ID (you'll need to replace this with actual UUID from above)
-- Then create admin user - replace USER_UUID with your actual Supabase auth UUID
-- You can find this in Supabase Dashboard -> Authentication -> Users

-- INSERT INTO users (id, organization_id, email, role, first_name, last_name, is_active)
-- VALUES (
--   'YOUR_AUTH_UUID_HERE',
--   'ORG_UUID_FROM_ABOVE',
--   'ctibbs2@outlook.com',
--   'broker',
--   'Cheryl',
--   'Tibbs',
--   true
-- );
EOF < /dev/null