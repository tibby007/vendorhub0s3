-- Fix missing trial end dates for existing trial users
-- This script identifies users with trial status but missing trial_end dates and fixes them

-- First, let's see what we're working with
SELECT 
  p.contact_email,
  p.billing_status,
  p.trial_end as partner_trial_end,
  s.subscription_end,
  s.trial_end as subscriber_trial_end,
  s.trial_active,
  s.subscribed
FROM public.partners p
LEFT JOIN public.subscribers s ON p.contact_email = s.email
WHERE p.billing_status = 'trialing' 
  AND (p.trial_end IS NULL OR s.trial_end IS NULL);

-- Fix partners table - set trial_end to 3 days from account creation or now if creation date unavailable
UPDATE public.partners 
SET 
  trial_end = COALESCE(created_at + INTERVAL '3 days', NOW() + INTERVAL '3 days'),
  current_period_end = COALESCE(created_at + INTERVAL '3 days', NOW() + INTERVAL '3 days'),
  updated_at = NOW()
WHERE billing_status = 'trialing' 
  AND trial_end IS NULL;

-- Fix subscribers table - set trial_end and subscription_end for trial users
UPDATE public.subscribers s
SET 
  trial_end = COALESCE(
    (SELECT p.trial_end FROM public.partners p WHERE p.contact_email = s.email),
    s.subscription_end,
    NOW() + INTERVAL '3 days'
  ),
  subscription_end = COALESCE(
    s.subscription_end,
    (SELECT p.trial_end FROM public.partners p WHERE p.contact_email = s.email),
    NOW() + INTERVAL '3 days'
  ),
  trial_active = TRUE,
  updated_at = NOW()
WHERE NOT s.subscribed 
  AND (s.trial_end IS NULL OR s.subscription_end IS NULL)
  AND EXISTS (
    SELECT 1 FROM public.partners p 
    WHERE p.contact_email = s.email 
    AND p.billing_status = 'trialing'
  );

-- For users who don't have partner records but have subscriber records, create partner records
INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  trial_end,
  current_period_end,
  vendor_limit,
  storage_limit,
  storage_used,
  created_at,
  updated_at
)
SELECT 
  COALESCE(u.name, SPLIT_PART(s.email, '@', 1)) as name,
  s.email,
  'basic',
  'trialing',
  COALESCE(s.subscription_end, NOW() + INTERVAL '3 days'),
  COALESCE(s.subscription_end, NOW() + INTERVAL '3 days'),
  3,
  5368709120, -- 5GB
  0,
  NOW(),
  NOW()
FROM public.subscribers s
LEFT JOIN public.users u ON s.user_id = u.id
WHERE NOT s.subscribed
  AND s.subscription_end > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM public.partners p 
    WHERE p.contact_email = s.email
  );

-- Update users table to link to partner records if not already linked
UPDATE public.users u
SET partner_id = p.id
FROM public.partners p
WHERE u.email = p.contact_email
  AND u.partner_id IS NULL;

-- Show the results after fixing
SELECT 
  'AFTER FIX:' as status,
  p.contact_email,
  p.billing_status,
  p.trial_end as partner_trial_end,
  s.subscription_end,
  s.trial_end as subscriber_trial_end,
  s.trial_active,
  s.subscribed,
  CASE 
    WHEN p.trial_end > NOW() THEN 'Trial Active'
    WHEN p.trial_end <= NOW() THEN 'Trial Expired'
    ELSE 'No Trial Date'
  END as trial_status
FROM public.partners p
LEFT JOIN public.subscribers s ON p.contact_email = s.email
WHERE p.billing_status = 'trialing'
ORDER BY p.contact_email;

SELECT 'TRIAL END DATE FIX COMPLETE - All trial users should now have proper trial_end dates!' as status;