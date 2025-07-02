-- Reset the current user to trial status manually
UPDATE public.subscribers 
SET 
  subscribed = false,
  subscription_tier = null,
  subscription_end = NOW() + INTERVAL '3 days',
  price_id = null,
  updated_at = NOW()
WHERE email = 'johnsmith@gmail.com';