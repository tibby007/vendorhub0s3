-- Restore missing auth users and all related records
-- This migration will recreate the auth users if they don't exist

-- First, let's check if the auth users exist and create them if they don't
-- Note: This uses admin functions to directly insert into auth.users

-- Create auth user for support@emergestack.dev if it doesn't exist
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
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
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'support@emergestack.dev'
);

-- Create auth user for keenan@getmybusinesscredit.com if it doesn't exist
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud
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
  'authenticated'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'keenan@getmybusinesscredit.com'
);

-- Now create the partner records
INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  vendor_limit,
  storage_limit,
  storage_used
) VALUES (
  'EmergeStack Admin',
  'support@emergestack.dev',
  'premium',
  'active',
  999,
  999999999999,
  0
) ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit;

INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  vendor_limit,
  storage_limit,
  storage_used
) VALUES (
  'Keenan Business Credit',
  'keenan@getmybusinesscredit.com',
  'premium',
  'active',
  999,
  999999999999,
  0
) ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit;

-- Create user records linking auth.users to partners
INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  au.id,
  au.email,
  'super_admin',
  p.id
FROM auth.users au
CROSS JOIN public.partners p
WHERE au.email = 'support@emergestack.dev'
  AND p.contact_email = 'support@emergestack.dev'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  au.id,
  au.email,
  'partner_admin',
  p.id
FROM auth.users au
CROSS JOIN public.partners p
WHERE au.email = 'keenan@getmybusinesscredit.com'
  AND p.contact_email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

-- Create subscriber records
INSERT INTO public.subscribers (
  user_id,
  email,
  subscription_tier,
  status,
  subscribed
)
SELECT 
  au.id,
  au.email,
  'Premium',
  'active',
  true
FROM auth.users au
WHERE au.email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (email) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  status = EXCLUDED.status,
  subscribed = EXCLUDED.subscribed;

INSERT INTO public.subscribers (
  user_id,
  email,
  subscription_tier,
  status,
  subscribed
)
SELECT 
  au.id,
  au.email,
  'Premium',
  'active',
  true
FROM auth.users au
WHERE au.email = 'support@emergestack.dev'
ON CONFLICT (email) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  status = EXCLUDED.status,
  subscribed = EXCLUDED.subscribed;