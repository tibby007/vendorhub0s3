-- Fix jimayers@aol.com user who exists in auth but has no trial setup
-- This migration will create the missing users and partners records

-- First, create the user record if it doesn't exist
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d',
  'jimayers@aol.com',
  'Jim Ayers',
  'Partner Admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create partner record with trial setup
INSERT INTO public.partners (
  id,
  name,
  contact_email,
  contact_phone,
  plan_type,
  billing_status,
  trial_end,
  current_period_end,
  vendor_limit,
  storage_limit,
  storage_used,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Jim Ayers Company',
  'jimayers@aol.com',
  NULL,
  'basic',
  'trialing',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days',
  3,
  5368709120, -- 5GB
  0,
  NOW(),
  NOW()
) ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  trial_end = EXCLUDED.trial_end,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW()
RETURNING id;

-- Update the user with the partner_id
UPDATE public.users 
SET partner_id = (SELECT id FROM public.partners WHERE contact_email = 'jimayers@aol.com')
WHERE id = '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d';

-- Create subscriber record for trial
INSERT INTO public.subscribers (
  email,
  user_id,
  stripe_customer_id,
  subscribed,
  subscription_tier,
  subscription_end,
  price_id,
  created_at,
  updated_at
) VALUES (
  'jimayers@aol.com',
  '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d',
  NULL,
  false, -- Trial users are NOT subscribed
  'basic',
  NOW() + INTERVAL '3 days',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  updated_at = NOW(); 