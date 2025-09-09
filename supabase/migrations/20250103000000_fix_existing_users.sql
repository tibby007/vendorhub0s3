-- FIX EXISTING USERS - Create missing partners and users records
-- Run this after the database rebuild to set up existing auth users

-- 1. Create partner record for support@emergestack.dev (Super Admin - No trial needed)
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

-- 2. Create partner record for keenan@getmybusinesscredit.com (Premium - No subscription needed)
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

-- 3. Create user record for support@emergestack.dev
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

-- 4. Create user record for keenan@getmybusinesscredit.com
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

-- 5. Create subscriber record for keenan@getmybusinesscredit.com
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

-- 6. Create subscriber record for support@emergestack.dev
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