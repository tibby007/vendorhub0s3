-- Add vendors table for the core Vendor Deal Flow functionality
-- This creates the complete vendor management infrastructure

-- 1. Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null until they accept invitation
  business_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  business_type VARCHAR(100),
  business_address TEXT,
  tax_id VARCHAR(50),
  website_url VARCHAR(255),
  
  -- Invitation management
  invited_by UUID NOT NULL REFERENCES public.users(id),
  invitation_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, accepted, active, inactive
  invitation_token VARCHAR(255) UNIQUE, -- For secure invitation acceptance
  invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Deal flow settings
  prequalification_enabled BOOLEAN DEFAULT true,
  max_deal_amount DECIMAL(12,2),
  preferred_equipment_types TEXT[], -- Array of equipment types
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create deals table for vendor deal submissions
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  
  -- Deal identification
  deal_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated deal number
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under_review, credit_pulled, approved, declined, funded
  
  -- Customer information (encrypted sensitive data)
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_business_name VARCHAR(255),
  customer_ssn_encrypted TEXT, -- Encrypted
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
  requested_terms INTEGER, -- months
  credit_score INTEGER,
  annual_revenue DECIMAL(12,2),
  time_in_business INTEGER, -- months
  
  -- Pre-qualification result
  prequalification_result VARCHAR(10), -- green, yellow, red
  prequalification_score INTEGER,
  prequalification_notes TEXT,
  
  -- Deal processing
  assigned_to UUID REFERENCES public.users(id), -- Loan officer assigned
  processed_at TIMESTAMP WITH TIME ZONE,
  funding_date TIMESTAMP WITH TIME ZONE,
  
  -- Document tracking
  documents_complete BOOLEAN DEFAULT false,
  documents_reviewed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create deal_documents table for tracking uploaded documents
CREATE TABLE IF NOT EXISTS public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- customer_id, equipment_quote, spec_sheet, term_sheet, other
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL, -- Path in Supabase storage
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Document status
  is_required BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create deal_messages table for communication
CREATE TABLE IF NOT EXISTS public.deal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal broker notes vs vendor-visible messages
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_partner_id ON public.vendors(partner_id);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX IF NOT EXISTS idx_vendors_invitation_status ON public.vendors(invitation_status);
CREATE INDEX IF NOT EXISTS idx_vendors_invitation_token ON public.vendors(invitation_token);

CREATE INDEX IF NOT EXISTS idx_deals_vendor_id ON public.deals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_deals_partner_id ON public.deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_deal_number ON public.deals(deal_number);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at);

CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_id ON public.deal_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_type ON public.deal_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_deal_messages_deal_id ON public.deal_messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_messages_sender_id ON public.deal_messages(sender_id);

-- 6. Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for vendors
CREATE POLICY "Partners can manage their vendors" ON public.vendors
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 8. Create RLS policies for deals
CREATE POLICY "Vendors can manage own deals" ON public.deals
  FOR ALL USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    ) OR
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 9. Create RLS policies for deal_documents
CREATE POLICY "Deal participants can manage documents" ON public.deal_documents
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR
            d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 10. Create RLS policies for deal_messages
CREATE POLICY "Deal participants can view messages" ON public.deal_messages
  FOR SELECT USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR
            d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

CREATE POLICY "Authenticated users can send messages to their deals" ON public.deal_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.vendors v ON d.vendor_id = v.id
      WHERE v.user_id = auth.uid() OR
            d.partner_id IN (SELECT id FROM public.partners WHERE contact_email = auth.email())
    )
  );

-- 11. Create trigger functions
CREATE OR REPLACE FUNCTION generate_deal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_number IS NULL OR NEW.deal_number = '' THEN
    NEW.deal_number = 'VH' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('deal_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create sequence for deal numbers
CREATE SEQUENCE IF NOT EXISTS deal_number_seq START WITH 1000;

-- 12. Create triggers
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_deal_number_trigger BEFORE INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION generate_deal_number();

-- 13. Grant permissions
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.deal_documents TO authenticated;
GRANT ALL ON public.deal_messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 14. Create function to calculate prequalification score
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

SELECT 'VENDOR TABLES SETUP COMPLETE! All tables created for Vendor Deal Flow.' as status;