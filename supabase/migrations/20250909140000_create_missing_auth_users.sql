-- Create missing auth users that are causing login failures
-- Using pre-hashed password to avoid pgcrypto issues

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
  '$2a$10$dummy.encrypted.password.hash.for.manual.reset',
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
  '$2a$10$dummy.encrypted.password.hash.for.manual.reset',
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