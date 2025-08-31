-- FINAL PRODUCTION FIX
-- Align database schema with frontend code expectations

-- 1. Drop and recreate vendors table with correct column names that match the code
DROP TABLE IF EXISTS public.vendors CASCADE;

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  contact_address TEXT,
  business_type VARCHAR(100),
  tax_id VARCHAR(50),
  website_url VARCHAR(255),
  
  -- Status and invitation management
  status VARCHAR(50) DEFAULT 'active',
  invitation_status VARCHAR(50) DEFAULT 'pending',
  invitation_token VARCHAR(255) UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  prequalification_enabled BOOLEAN DEFAULT true,
  max_deal_amount DECIMAL(12,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create submissions table with correct structure
DROP TABLE IF EXISTS public.submissions CASCADE;

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  business_name VARCHAR(255),
  
  -- Equipment information
  equipment_type VARCHAR(100) NOT NULL,
  equipment_description TEXT,
  equipment_cost DECIMAL(12,2) NOT NULL,
  
  -- Financial information
  financing_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2),
  credit_score INTEGER,
  time_in_business INTEGER,
  annual_revenue DECIMAL(12,2),
  
  -- Status and processing
  status VARCHAR(50) DEFAULT 'submitted',
  prequalification_result VARCHAR(10), -- green, yellow, red
  notes TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create proper RLS policies for vendors
DROP POLICY IF EXISTS "Partners can manage their vendors" ON public.vendors;
CREATE POLICY "Partners can manage their vendors" ON public.vendors
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 5. Create proper RLS policies for submissions
DROP POLICY IF EXISTS "Partners can manage their submissions" ON public.submissions;
CREATE POLICY "Partners can manage their submissions" ON public.submissions
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_partner_id ON public.vendors(partner_id);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

CREATE INDEX IF NOT EXISTS idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_vendor_id ON public.submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

-- 7. Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vendors_updated_at ON public.vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant proper permissions
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Ensure users table has proper RLS
DROP POLICY IF EXISTS "Users can access own record and partner users" ON public.users;
CREATE POLICY "Users can access own record and partner users" ON public.users
  FOR ALL USING (
    id = auth.uid() OR
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 10. Ensure partners table has proper access
GRANT SELECT, UPDATE ON public.partners TO authenticated;

SELECT 'FINAL PRODUCTION FIX COMPLETE! Tables now match frontend code expectations.' as status;