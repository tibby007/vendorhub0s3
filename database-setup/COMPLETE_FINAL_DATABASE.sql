-- COMPLETE FINAL DATABASE SETUP - Creates ALL tables from scratch
-- Run this entire script to create the complete VendorHub database

-- Step 1: Drop ALL existing tables in correct order (foreign keys first)
DROP TABLE IF EXISTS public.deal_messages CASCADE;
DROP TABLE IF EXISTS public.deal_documents CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.security_audit_log CASCADE;
DROP TABLE IF EXISTS public.subscribers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS deal_number_seq CASCADE;

-- Step 2: Create base tables in dependency order

-- 2a. Create partners table FIRST (referenced by others)
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

-- 2b. Create users table (references partners, referenced by others)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'Partner Admin',
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2c. Create subscribers table
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

-- 2d. Create security_audit_log table
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

-- Step 3: Create vendor-specific tables

-- 3a. Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  business_type VARCHAR(100),
  business_address TEXT,
  tax_id VARCHAR(50),
  website_url VARCHAR(255),
  
  -- Invitation management
  invited_by UUID NOT NULL REFERENCES public.users(id),
  invitation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  invitation_token VARCHAR(255) UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Deal flow settings
  prequalification_enabled BOOLEAN DEFAULT true,
  max_deal_amount DECIMAL(12,2),
  preferred_equipment_types TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3b. Create deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  
  deal_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  
  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_business_name VARCHAR(255),
  customer_ssn_encrypted TEXT,
  customer_address TEXT,
  
  -- Equipment information
  equipment_type VARCHAR(100) NOT NULL,
  equipment_description TEXT NOT NULL,
  equipment_cost DECIMAL(12,2) NOT NULL,
  equipment_vendor VARCHAR(255),
  equipment_model VARCHAR(255),
  equipment_year INTEGER,
  
  -- Financial information
  down_payment DECIMAL(12,2),
  financing_amount DECIMAL(12,2) NOT NULL,
  requested_terms INTEGER,
  credit_score INTEGER,
  annual_revenue DECIMAL(12,2),
  time_in_business INTEGER,
  
  -- Pre-qualification
  prequalification_result VARCHAR(10),
  prequalification_score INTEGER,
  prequalification_notes TEXT,
  
  -- Processing
  assigned_to UUID REFERENCES public.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  funding_date TIMESTAMP WITH TIME ZONE,
  
  -- Document status
  documents_complete BOOLEAN DEFAULT false,
  documents_reviewed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3c. Create deal_documents table
CREATE TABLE public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  
  is_required BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3d. Create deal_messages table
CREATE TABLE public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create all indexes
CREATE INDEX idx_partners_contact_email ON public.partners(contact_email);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_partner_id ON public.users(partner_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_vendors_partner_id ON public.vendors(partner_id);
CREATE INDEX idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX idx_vendors_invitation_status ON public.vendors(invitation_status);
CREATE INDEX idx_deals_vendor_id ON public.deals(vendor_id);
CREATE INDEX idx_deals_partner_id ON public.deals(partner_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_deal_number ON public.deals(deal_number);
CREATE INDEX idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX idx_deal_messages_deal_id ON public.deal_messages(deal_id);

-- Step 5: Enable RLS on all tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Create all RLS policies

-- Partners policies
CREATE POLICY "Users can access own partner record" ON public.partners
  FOR ALL USING (
    contact_email IN (SELECT email FROM auth.users WHERE auth.users.id = auth.uid()) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Users policies
CREATE POLICY "Users can access own record" ON public.users
  FOR ALL USING (
    id = auth.uid() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Subscribers policies
CREATE POLICY "select_own_subscription" ON public.subscribers
  FOR SELECT USING (
    user_id = auth.uid() OR email = auth.email() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

CREATE POLICY "update_own_subscription" ON public.subscribers FOR UPDATE USING (true);
CREATE POLICY "insert_subscription" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Vendors policies
CREATE POLICY "Partners can manage their vendors" ON public.vendors
  FOR ALL USING (
    partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email()) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Deals policies
CREATE POLICY "Vendors can manage own deals" ON public.deals
  FOR ALL USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid()) OR
    partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email()) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Documents policies
CREATE POLICY "Deal participants can manage documents" ON public.deal_documents
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Messages policies
CREATE POLICY "Deal participants can view messages" ON public.deal_messages
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

CREATE POLICY "Authenticated users can send messages to their deals" ON public.deal_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    )
  );

-- Security audit log policy
CREATE POLICY "Super admins can access audit log" ON public.security_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- Step 7: Create functions

-- Updated at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trial status function
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

-- Deal number generation
CREATE SEQUENCE deal_number_seq START WITH 1000;

CREATE OR REPLACE FUNCTION generate_deal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_number IS NULL OR NEW.deal_number = '' THEN
    NEW.deal_number = 'VH' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('deal_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Prequalification scoring
CREATE OR REPLACE FUNCTION calculate_prequalification_score(
  credit_score INTEGER,
  time_in_business INTEGER,
  down_payment_percent DECIMAL,
  equipment_cost DECIMAL
)
RETURNS JSON AS $$
DECLARE
  score INTEGER := 0;
  result VARCHAR(10);
  notes TEXT := '';
BEGIN
  -- Credit Score Points
  IF credit_score >= 750 THEN
    score := score + 2;
    notes := notes || 'Excellent credit score. ';
  ELSIF credit_score >= 650 THEN
    score := score + 1;
    notes := notes || 'Good credit score. ';
  ELSIF credit_score >= 550 THEN
    score := score + 0;
    notes := notes || 'Fair credit score. ';
  ELSE
    score := score - 1;
    notes := notes || 'Credit score needs improvement. ';
  END IF;

  -- Time in Business Points
  IF time_in_business >= 24 THEN
    score := score + 1;
    notes := notes || 'Established business. ';
  ELSIF time_in_business >= 12 THEN
    score := score + 0;
    notes := notes || 'Moderate business history. ';
  ELSE
    score := score - 1;
    notes := notes || 'Limited business history. ';
  END IF;

  -- Down Payment Points
  IF down_payment_percent >= 0.20 THEN
    score := score + 1;
    notes := notes || 'Strong down payment. ';
  ELSIF down_payment_percent >= 0.10 THEN
    score := score + 0;
    notes := notes || 'Moderate down payment. ';
  ELSE
    score := score - 1;
    notes := notes || 'Low down payment. ';
  END IF;

  -- Equipment Cost Points
  IF equipment_cost BETWEEN 25000 AND 500000 THEN
    score := score + 1;
    notes := notes || 'Optimal equipment cost range. ';
  ELSIF equipment_cost BETWEEN 10000 AND 25000 OR equipment_cost BETWEEN 500000 AND 1000000 THEN
    score := score + 0;
    notes := notes || 'Acceptable equipment cost. ';
  ELSE
    score := score - 1;
    notes := notes || 'Equipment cost outside preferred range. ';
  END IF;

  -- Determine result
  IF score >= 3 THEN
    result := 'green';
  ELSIF score >= 0 THEN
    result := 'yellow';
  ELSE
    result := 'red';
  END IF;

  RETURN json_build_object(
    'score', score,
    'result', result,
    'notes', notes
  );
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriber_trial_status 
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_trial_status();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_deal_number_trigger BEFORE INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION generate_deal_number();

-- Step 9: Grant permissions
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.subscribers TO authenticated;
GRANT ALL ON public.security_audit_log TO authenticated;
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.deal_documents TO authenticated;
GRANT ALL ON public.deal_messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 10: Insert owner records
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

SELECT 'COMPLETE DATABASE SETUP SUCCESSFUL! All tables created for VendorHub Deal Flow.' as status;