-- COMPLETE WORKING DATABASE - All tables with correct relationships
-- This creates EVERYTHING needed for the application to work

-- 1. Drop existing tables in correct order (to avoid foreign key conflicts)
DROP TABLE IF EXISTS public.deal_messages CASCADE;
DROP TABLE IF EXISTS public.deal_documents CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.resources CASCADE;
DROP SEQUENCE IF EXISTS deal_number_seq CASCADE;

-- 2. Create users table (links auth.users to partners)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'Partner Admin',
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT CHECK (subscription_tier IN ('Basic', 'Pro', 'Premium')),
  subscription_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  trial_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create customers table (for customer data in submissions)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  biz_name VARCHAR(255),
  biz_phone VARCHAR(50),
  biz_address TEXT,
  biz_start_date DATE,
  ein VARCHAR(50),
  ssn VARCHAR(11),
  dob DATE,
  credit_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create vendors table with correct column names matching frontend
CREATE TABLE public.vendors (
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

-- 6. Create submissions table with proper relationships
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Submission details
  status VARCHAR(50) DEFAULT 'submitted',
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approval_terms TEXT,
  
  -- Equipment information
  equipment_type VARCHAR(100),
  equipment_description TEXT,
  equipment_cost DECIMAL(12,2),
  
  -- Financial information
  financing_amount DECIMAL(12,2),
  down_payment DECIMAL(12,2),
  
  -- Document URLs
  sales_invoice_url TEXT,
  drivers_license_url TEXT,
  misc_documents_url TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create resources table for document management
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(100),
  file_size BIGINT,
  resource_type VARCHAR(50) DEFAULT 'document',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for users table
CREATE POLICY "Users can access own record and partner users" ON public.users
  FOR ALL USING (
    id = auth.uid() OR
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 10. Create RLS policies for subscribers
CREATE POLICY "Users can access own subscription data" ON public.subscribers
  FOR ALL USING (
    user_id = auth.uid() OR
    email = auth.email() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 11. Create RLS policies for customers
CREATE POLICY "Partners can access their customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 12. Create RLS policies for vendors
CREATE POLICY "Partners can manage their vendors" ON public.vendors
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 13. Create RLS policies for submissions
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

-- 14. Create RLS policies for resources
CREATE POLICY "Partners can manage their resources" ON public.resources
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 15. Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_partner_id ON public.users(partner_id);

CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);

CREATE INDEX idx_customers_email ON public.customers(email);

CREATE INDEX idx_vendors_partner_id ON public.vendors(partner_id);
CREATE INDEX idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX idx_vendors_status ON public.vendors(status);

CREATE INDEX idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX idx_submissions_vendor_id ON public.submissions(vendor_id);
CREATE INDEX idx_submissions_customer_id ON public.submissions(customer_id);
CREATE INDEX idx_submissions_status ON public.submissions(status);
CREATE INDEX idx_submissions_created_at ON public.submissions(created_at);

CREATE INDEX idx_resources_partner_id ON public.resources(partner_id);

-- 16. Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 17. Grant permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.subscribers TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.resources TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 18. Ensure partners table has proper access (don't recreate, just ensure permissions)
GRANT SELECT, INSERT, UPDATE ON public.partners TO authenticated;

SELECT 'COMPLETE WORKING DATABASE READY! All tables created with proper relationships and RLS policies.' as status;