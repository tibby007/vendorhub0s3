-- CRITICAL DATABASE FIXES
-- Fix column naming issues and create missing tables

-- 1. Fix vendors table column name if it exists with wrong name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'partner_admin_id') THEN
        ALTER TABLE public.vendors RENAME COLUMN partner_admin_id TO partner_id;
    END IF;
END $$;

-- 2. Fix submissions table column name if it exists with wrong name  
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'partner_admin_id') THEN
        ALTER TABLE public.submissions RENAME COLUMN partner_admin_id TO partner_id;
    END IF;
END $$;

-- 3. Fix resources table column name if it exists with wrong name
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resources' AND column_name = 'partner_admin_id') THEN
        ALTER TABLE public.resources RENAME COLUMN partner_admin_id TO partner_id;
    END IF;
END $$;

-- 4. Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  business_name VARCHAR(255),
  equipment_type VARCHAR(100) NOT NULL,
  equipment_cost DECIMAL(12,2) NOT NULL,
  financing_amount DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2),
  credit_score INTEGER,
  time_in_business INTEGER,
  annual_revenue DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'submitted',
  prequalification_result VARCHAR(10), -- green, yellow, red
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for submissions
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

-- 7. Grant permissions on submissions
GRANT ALL ON public.submissions TO authenticated;

-- 8. Add indexes for submissions table
CREATE INDEX IF NOT EXISTS idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_vendor_id ON public.submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at);

-- 9. Add trigger for updated_at on submissions
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Fix RLS policies to allow authenticated users to read users table
DROP POLICY IF EXISTS "Users can only access own record" ON public.users;
CREATE POLICY "Users can access own record and partner users" ON public.users
  FOR ALL USING (
    id = auth.uid() OR
    partner_id IN (
      SELECT id FROM public.partners WHERE contact_email = auth.email()
    ) OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 11. Ensure authenticated users can read their own data
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.partners TO authenticated;  
GRANT SELECT ON public.vendors TO authenticated;

SELECT 'CRITICAL DATABASE FIXES COMPLETE!' as status;