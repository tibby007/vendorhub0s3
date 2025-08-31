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

-- 2. Create partner record for keenan@getmybusinesscredit.com (3-day trial)
INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  trial_end,
  current_period_end,
  vendor_limit,
  storage_limit,
  storage_used
) VALUES (
  'Keenan Business Credit',
  'keenan@getmybusinesscredit.com',
  'basic',
  'trialing',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days',
  1,
  5368709120,
  0
) ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  trial_end = EXCLUDED.trial_end,
  current_period_end = EXCLUDED.current_period_end,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit;

-- 3. Create users records for both - linking auth.users to partners
-- For support@emergestack.dev
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
  COALESCE(au.raw_user_meta_data->>'name', 'EmergeStack Admin'),
  'Super Admin',
  p.id
FROM auth.users au
JOIN public.partners p ON p.contact_email = au.email
WHERE au.email = 'support@emergestack.dev'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

-- For keenan@getmybusinesscredit.com  
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
  COALESCE(au.raw_user_meta_data->>'name', 'Keenan'),
  'Partner Admin',
  p.id
FROM auth.users au
JOIN public.partners p ON p.contact_email = au.email
WHERE au.email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

-- 4. Create subscribers records
-- For support@emergestack.dev (premium, no trial)
INSERT INTO public.subscribers (
  user_id,
  email,
  subscribed,
  subscription_tier,
  subscription_end,
  trial_active
)
SELECT 
  au.id,
  au.email,
  true,
  'Premium',
  NOW() + INTERVAL '10 years',
  false
FROM auth.users au
WHERE au.email = 'support@emergestack.dev'
ON CONFLICT (email) DO UPDATE SET
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  trial_active = EXCLUDED.trial_active;

-- For keenan@getmybusinesscredit.com (trial)
INSERT INTO public.subscribers (
  user_id,
  email,
  subscribed,
  subscription_tier,
  subscription_end,
  trial_end,
  trial_active
)
SELECT 
  au.id,
  au.email,
  false,
  'Basic',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days',
  true
FROM auth.users au
WHERE au.email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (email) DO UPDATE SET
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  trial_end = EXCLUDED.trial_end,
  trial_active = EXCLUDED.trial_active;

-- 5. Verify the setup
SELECT 'EXISTING USERS SETUP COMPLETE' as status;

-- Check results
SELECT 
  'PARTNERS' as table_name,
  name,
  contact_email,
  plan_type,
  billing_status,
  trial_end
FROM public.partners 
WHERE contact_email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')

UNION ALL

SELECT 
  'USERS' as table_name,
  u.name,
  u.email,
  u.role,
  CASE WHEN u.partner_id IS NOT NULL THEN 'LINKED' ELSE 'NOT LINKED' END,
  NULL
FROM public.users u
WHERE u.email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')

UNION ALL

SELECT 
  'SUBSCRIBERS' as table_name,
  CASE WHEN s.trial_active THEN 'TRIAL USER' ELSE 'PAID USER' END,
  s.email,
  s.subscription_tier,
  CASE WHEN s.subscribed THEN 'SUBSCRIBED' ELSE 'NOT SUBSCRIBED' END,
  s.subscription_end::text
FROM public.subscribers s
WHERE s.email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')

ORDER BY table_name, contact_email;