-- Fix support@emergestack.dev user who exists in auth but has no application records
-- This migration will create the missing users and partners records

-- First, update the auth.users metadata to set correct role
UPDATE auth.users 
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "Partner Admin", "name": "Support Admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "Partner Admin", "name": "Support Admin"}'::jsonb
  END
WHERE id = '8d1924d3-bc64-4c27-9004-7de35d1217c5';

-- Then, create the user record if it doesn't exist
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '8d1924d3-bc64-4c27-9004-7de35d1217c5',
  'support@emergestack.dev',
  'Support Admin', 
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
  'EmergeStack Support',
  'support@emergestack.dev',
  NULL,
  'pro',
  'active', -- Give active subscription instead of trial
  NOW() + INTERVAL '365 days', -- Extended trial
  NOW() + INTERVAL '365 days',
  7, -- Pro plan vendor limit
  26843545600, -- 25GB storage for pro
  0,
  NOW(),
  NOW()
) ON CONFLICT (contact_email) DO UPDATE SET
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  trial_end = EXCLUDED.trial_end,
  current_period_end = EXCLUDED.current_period_end,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit,
  updated_at = NOW()
RETURNING id;

-- Update the user with the partner_id
UPDATE public.users 
SET partner_id = (SELECT id FROM public.partners WHERE contact_email = 'support@emergestack.dev')
WHERE id = '8d1924d3-bc64-4c27-9004-7de35d1217c5';

-- Create subscriber record for active subscription
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
  'support@emergestack.dev',
  '8d1924d3-bc64-4c27-9004-7de35d1217c5',
  NULL, -- No Stripe needed for owner account
  true, -- Active subscription
  'pro',
  NOW() + INTERVAL '365 days',
  NULL,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  updated_at = NOW();