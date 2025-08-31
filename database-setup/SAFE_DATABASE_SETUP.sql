-- SAFE DATABASE SETUP - Handles existing tables
-- Run this if you're getting foreign key errors

-- Step 1: Drop existing tables with foreign key dependencies (in reverse order)
DROP TABLE IF EXISTS public.security_audit_log CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;

-- Step 2: Create partners table FIRST
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL UNIQUE,
  contact_phone VARCHAR(50),
  plan_type VARCHAR(50) NOT NULL DEFAULT 'basic',
  billing_status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  vendor_limit INTEGER NOT NULL DEFAULT 1,
  storage_limit BIGINT NOT NULL DEFAULT 5368709120,
  storage_used BIGINT NOT NULL DEFAULT 0,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create users table (now partners exists)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'Partner Admin',
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create subscribers table
CREATE TABLE public.subscribers (
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

-- Step 5: Create security_audit_log table
CREATE TABLE public.security_audit_log (
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

-- Step 6: Create indexes
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_partners_contact_email ON public.partners(contact_email);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_partner_id ON public.users(partner_id);

-- Step 7: Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for subscribers
CREATE POLICY "select_own_subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "update_own_subscription" ON public.subscribers
  FOR UPDATE USING (true);

CREATE POLICY "insert_subscription" ON public.subscribers
  FOR INSERT WITH CHECK (true);

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

-- Step 9: Create RLS policies for partners
CREATE POLICY "Users can access own partner record" ON public.partners
  FOR ALL USING (
    contact_email IN (
      SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
    )
  );

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

-- Step 10: Create RLS policies for users
CREATE POLICY "Users can access own record" ON public.users
  FOR ALL USING (id = auth.uid());

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

-- Step 11: Create RLS policies for security_audit_log
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

-- Step 12: Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_end IS NOT NULL AND NEW.trial_end > NOW() THEN
    NEW.trial_active = TRUE;
  ELSIF NEW.trial_end IS NOT NULL AND NEW.trial_end <= NOW() THEN
    NEW.trial_active = FALSE;
  END IF;
  
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

-- Step 13: Create triggers
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_trial_status 
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_trial_status();

-- Step 14: Grant permissions
GRANT ALL ON public.subscribers TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.security_audit_log TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 15: Insert owner records
INSERT INTO public.partners (
  name, contact_email, plan_type, billing_status, 
  trial_end, current_period_end, vendor_limit, storage_limit
) VALUES (
  'EmergeStack Support', 'support@emergestack.dev', 'pro', 'active',
  NOW() + INTERVAL '365 days', NOW() + INTERVAL '365 days', 7, 26843545600
);

INSERT INTO public.users (
  id, email, name, role, partner_id
) VALUES (
  '8d1924d3-bc64-4c27-9004-7de35d1217c5', 'support@emergestack.dev', 
  'Support Admin', 'Super Admin',
  (SELECT id FROM public.partners WHERE contact_email = 'support@emergestack.dev')
);

INSERT INTO public.subscribers (
  email, user_id, subscribed, subscription_tier, subscription_end, trial_active
) VALUES (
  'support@emergestack.dev', '8d1924d3-bc64-4c27-9004-7de35d1217c5',
  true, 'Pro', NOW() + INTERVAL '365 days', false
);

SELECT 'DATABASE SETUP COMPLETE!' as status;