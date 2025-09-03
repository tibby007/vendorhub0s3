-- Debug and fix jimayers@aol.com state
-- This migration will check the current state and ensure everything is properly set up

-- First, let's check what we have
SELECT 'Current state for jimayers@aol.com:' as info;

-- Check users table
SELECT 'Users table:' as table_name, id, email, name, role, partner_id 
FROM public.users 
WHERE email = 'jimayers@aol.com';

-- Check partners table
SELECT 'Partners table:' as table_name, id, name, contact_email, billing_status, trial_end, plan_type
FROM public.partners 
WHERE contact_email = 'jimayers@aol.com';

-- Check subscribers table
SELECT 'Subscribers table:' as table_name, id, email, user_id, subscribed, subscription_tier, subscription_end
FROM public.subscribers 
WHERE email = 'jimayers@aol.com';

-- Now let's ensure everything is properly set up
-- Delete any existing records to start fresh
DELETE FROM public.subscribers WHERE email = 'jimayers@aol.com';
DELETE FROM public.partners WHERE contact_email = 'jimayers@aol.com';
DELETE FROM public.users WHERE id = '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d';

-- Create user record
INSERT INTO public.users (
  id, email, name, role, created_at, updated_at
) VALUES (
  '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d',
  'jimayers@aol.com',
  'Jim Ayers',
  'Partner Admin',
  NOW(),
  NOW()
);

-- Create partner record with proper trial setup
INSERT INTO public.partners (
  id, name, contact_email, contact_phone, plan_type, billing_status, 
  trial_end, current_period_end, vendor_limit, storage_limit, storage_used, 
  created_at, updated_at
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
  5368709120,
  0,
  NOW(),
  NOW()
);

-- Update user with partner_id
UPDATE public.users 
SET partner_id = (SELECT id FROM public.partners WHERE contact_email = 'jimayers@aol.com')
WHERE id = '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d';

-- Create subscriber record with proper trial setup
INSERT INTO public.subscribers (
  email, user_id, stripe_customer_id, subscribed, subscription_tier,
  subscription_end, price_id, created_at, updated_at
) VALUES (
  'jimayers@aol.com',
  '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d',
  NULL,
  false,
  'Basic',
  NOW() + INTERVAL '3 days',
  NULL,
  NOW(),
  NOW()
);

-- Verify the setup
SELECT 'After fix - Users table:' as table_name, id, email, name, role, partner_id 
FROM public.users 
WHERE email = 'jimayers@aol.com';

SELECT 'After fix - Partners table:' as table_name, id, name, contact_email, billing_status, trial_end, plan_type
FROM public.partners 
WHERE contact_email = 'jimayers@aol.com';

SELECT 'After fix - Subscribers table:' as table_name, id, email, user_id, subscribed, subscription_tier, subscription_end
FROM public.subscribers 
WHERE email = 'jimayers@aol.com'; 