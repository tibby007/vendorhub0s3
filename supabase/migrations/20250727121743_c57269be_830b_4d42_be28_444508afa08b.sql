-- Fix RLS policies on subscribers table to allow service role access
-- This will resolve the 406 error in check-subscription edge function

-- Drop existing policies first
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create new policies that allow service role access
-- Users can view their own subscription info OR service role can access all
CREATE POLICY "select_own_subscription_or_service" ON public.subscribers
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR 
  (auth.role() = 'service_role')
);

-- Users can update their own subscription OR service role can update all
CREATE POLICY "update_subscription_service_allowed" ON public.subscribers
FOR UPDATE
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR 
  (auth.role() = 'service_role')
)
WITH CHECK (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR 
  (auth.role() = 'service_role')
);

-- Allow service role to insert subscription records
CREATE POLICY "insert_subscription_service_allowed" ON public.subscribers
FOR INSERT
WITH CHECK (
  (user_id = auth.uid()) OR 
  (auth.role() = 'service_role')
);