-- Manual database setup script - run this if migrations fail
-- This creates all necessary tables and functions for VendorHub

-- 1. Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  contact_phone VARCHAR(50),
  plan_type VARCHAR(50) NOT NULL DEFAULT 'basic',
  billing_status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  vendor_limit INTEGER NOT NULL DEFAULT 1,
  storage_limit BIGINT NOT NULL DEFAULT 5368709120, -- 5GB in bytes
  storage_used BIGINT NOT NULL DEFAULT 0,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update subscribers table with missing fields
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE;

ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'inactive';

ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON public.partners(contact_email);

-- 4. Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for partners
DROP POLICY IF EXISTS "Users can access own partner record" ON public.partners;
CREATE POLICY "Users can access own partner record" ON public.partners
  FOR ALL USING (
    contact_email IN (
      SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can access all partners" ON public.partners;
CREATE POLICY "Super admins can access all partners" ON public.partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'support@emergestack.dev' OR
        auth.users.raw_user_meta_data->>'role' = 'Super Admin'
      )
    )
  );

-- 6. Create RLS policies for subscribers
DROP POLICY IF EXISTS "Super admins can access all subscribers" ON public.subscribers;
CREATE POLICY "Super admins can access all subscribers" ON public.subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'support@emergestack.dev' OR
        auth.users.raw_user_meta_data->>'role' = 'Super Admin'
      )
    )
  );

-- 7. Create updated_at function and trigger for partners
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create trial status function for subscribers
CREATE OR REPLACE FUNCTION update_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial_end is set and in the future, mark trial as active
  IF NEW.trial_end IS NOT NULL AND NEW.trial_end > NOW() THEN
    NEW.trial_active = TRUE;
  ELSIF NEW.trial_end IS NOT NULL AND NEW.trial_end <= NOW() THEN
    NEW.trial_active = FALSE;
  END IF;
  
  -- Also update based on subscription_end if trial_end not set
  IF NEW.trial_end IS NULL AND NEW.subscription_end IS NOT NULL THEN
    IF NEW.subscription_end > NOW() AND NOT NEW.subscribed THEN
      NEW.trial_active = TRUE;
    ELSE
      NEW.trial_active = FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriber_trial_status ON public.subscribers;
CREATE TRIGGER update_subscriber_trial_status 
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_trial_status();

-- 9. Grant permissions
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.subscribers TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. Create the support@emergestack.dev records if they don't exist
INSERT INTO public.partners (
  name,
  contact_email,
  plan_type,
  billing_status,
  trial_end,
  current_period_end,
  vendor_limit,
  storage_limit
) VALUES (
  'EmergeStack Support',
  'support@emergestack.dev',
  'pro',
  'active',
  NOW() + INTERVAL '365 days',
  NOW() + INTERVAL '365 days',
  7,
  26843545600
) ON CONFLICT (contact_email) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  trial_end = EXCLUDED.trial_end,
  current_period_end = EXCLUDED.current_period_end,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit,
  updated_at = NOW();

INSERT INTO public.subscribers (
  email,
  user_id,
  subscribed,
  subscription_tier,
  subscription_end,
  trial_active
) VALUES (
  'support@emergestack.dev',
  '8d1924d3-bc64-4c27-9004-7de35d1217c5',
  true,
  'Pro',
  NOW() + INTERVAL '365 days',
  false
) ON CONFLICT (email) DO UPDATE SET
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  trial_active = EXCLUDED.trial_active,
  updated_at = NOW();