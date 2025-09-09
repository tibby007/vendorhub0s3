-- Add the correct users using a simpler approach
-- Since direct auth.users insertion is complex, let's focus on the public tables
-- and create the auth users through the application later

-- First, create the partner records
INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  vendor_limit,
  storage_limit,
  storage_used
) VALUES 
(
  'EmergeStack Admin',
  'support@emergestack.dev',
  'premium',
  'active',
  999,
  999999999999,
  0
),
(
  'Keenan Business Credit',
  'keenan@getmybusinesscredit.com',
  'premium',
  'active',
  999,
  999999999999,
  0
)
ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit;

-- Create placeholder user records that will be linked when auth users are created
-- We'll use dummy UUIDs that can be updated later
INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  gen_random_uuid(),
  'support@emergestack.dev',
  'super_admin',
  p.id
FROM public.partners p
WHERE p.contact_email = 'support@emergestack.dev'
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  partner_id = EXCLUDED.partner_id;

INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  gen_random_uuid(),
  'keenan@getmybusinesscredit.com',
  'partner_admin',
  p.id
FROM public.partners p
WHERE p.contact_email = 'keenan@getmybusinesscredit.com'
ON CONFLICT (email) DO UPDATE SET
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
  u.id,
  u.email,
  'Premium',
  'active',
  true
FROM public.users u
WHERE u.email IN ('keenan@getmybusinesscredit.com', 'support@emergestack.dev')
ON CONFLICT (email) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  status = EXCLUDED.status,
  subscribed = EXCLUDED.subscribed;