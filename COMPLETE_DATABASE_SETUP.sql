-- COMPLETE DATABASE SETUP FOR VENDORHUB
-- Run this entire script in Supabase SQL Editor to create all tables

-- 1. Create partners table FIRST (other tables reference it)
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

-- 2. Create users table (references partners table)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'Partner Admin',
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscribers table 
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('Basic', 'Pro', 'Premium')),
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  trial_active BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'inactive',
  price_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create security_audit_log table (referenced by log-security-event function)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES auth.users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON public.partners(contact_email);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON public.users(partner_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);

-- 6. Enable RLS on all tables
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for subscribers
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
CREATE POLICY "select_own_subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription" ON public.subscribers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "insert_subscription" ON public.subscribers
  FOR INSERT WITH CHECK (true);

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

-- 8. Create RLS policies for partners
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

-- 9. Create RLS policies for users
DROP POLICY IF EXISTS "Users can access own record" ON public.users;
CREATE POLICY "Users can access own record" ON public.users
  FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "Super admins can access all users" ON public.users;
CREATE POLICY "Super admins can access all users" ON public.users
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

-- 10. Create RLS policies for security_audit_log
DROP POLICY IF EXISTS "Super admins can access audit log" ON public.security_audit_log;
CREATE POLICY "Super admins can access audit log" ON public.security_audit_log
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

-- 11. Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 12. Create trial status function for subscribers
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

-- 13. Create triggers
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriber_trial_status ON public.subscribers;
CREATE TRIGGER update_subscriber_trial_status 
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_trial_status();

-- 14. Grant permissions
GRANT ALL ON public.subscribers TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.security_audit_log TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 15. Insert the support@emergestack.dev owner records
INSERT INTO public.users (
  id,
  email,
  name,
  role
) VALUES (
  '8d1924d3-bc64-4c27-9004-7de35d1217c5',
  'support@emergestack.dev',
  'Support Admin',
  'Super Admin'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

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
  name = EXCLUDED.name,
  plan_type = EXCLUDED.plan_type,
  billing_status = EXCLUDED.billing_status,
  trial_end = EXCLUDED.trial_end,
  current_period_end = EXCLUDED.current_period_end,
  vendor_limit = EXCLUDED.vendor_limit,
  storage_limit = EXCLUDED.storage_limit,
  updated_at = NOW()
RETURNING id;

-- Get the partner_id for the update
UPDATE public.users 
SET partner_id = (SELECT id FROM public.partners WHERE contact_email = 'support@emergestack.dev')
WHERE id = '8d1924d3-bc64-4c27-9004-7de35d1217c5';

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
  user_id = EXCLUDED.user_id,
  subscribed = EXCLUDED.subscribed,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_end = EXCLUDED.subscription_end,
  trial_active = EXCLUDED.trial_active,
  updated_at = NOW();

-- 16. Show completion message
SELECT 'DATABASE SETUP COMPLETE! All tables created with proper RLS policies and triggers.' as status;