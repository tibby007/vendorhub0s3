-- Add 'Enterprise' to subscribers_subscription_tier_check
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_subscription_tier_check;
ALTER TABLE public.subscribers ADD CONSTRAINT subscribers_subscription_tier_check CHECK (subscription_tier IN ('Basic', 'Pro', 'Premium', 'Enterprise'));