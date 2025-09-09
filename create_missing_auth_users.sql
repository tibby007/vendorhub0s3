-- Create missing auth users that are causing login failures
-- This will create the auth users directly in the auth.users table

-- Create support@emergestack.dev user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'support@emergestack.dev',
  crypt('TempPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "EmergeStack Admin", "role": "superadmin", "email_verified": true}'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'support@emergestack.dev'
);

-- Create keenan@getmybusinesscredit.com user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  raw_app_meta_data,
  raw_user_meta_data
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'keenan@getmybusinesscredit.com',
  crypt('TempPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Keenan Business Credit", "role": "Partner Admin", "email_verified": true}'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'keenan@getmybusinesscredit.com'
);

-- Now create the corresponding public.users records
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  partner_id
) 
SELECT 
  au.id,
  au.email,
  'EmergeStack Admin',
  'super_admin',
  p.id
FROM auth.users au
CROSS JOIN public.partners p
WHERE au.email = 'support@emergestack.dev'
  AND p.contact_email = 'support@emergestack.dev'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

INSERT INTO public.users (
  id,
  email,
  name,
  role,
  partner_id
) 
SELECT 
  au.id,
  au.email,
  'Keenan Business Credit',
  'partner_admin',
  p.id
FROM auth.users au
CROSS JOIN public.partners p
WHERE au.email = 'keenan@getmybusinesscredit.com'
  AND p.contact_email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

-- Verify the creation
SELECT 'Auth users created:' as info;
SELECT 
  id, 
  email, 
  created_at, 
  email_confirmed_at IS NOT NULL as email_confirmed,
  encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

SELECT 'Public users created:' as info;
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.partner_id
FROM public.users u
WHERE u.email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY u.email;