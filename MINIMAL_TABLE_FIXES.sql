-- MINIMAL TABLE FIXES - Just fix what's broken without recreating everything

-- 1. Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'Partner Admin',
  partner_id UUID REFERENCES public.partners(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure customers table exists (needed for submissions joins)
CREATE TABLE IF NOT EXISTS public.customers (
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

-- 3. Fix vendors table structure if needed
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'vendor_name') THEN
    ALTER TABLE public.vendors ADD COLUMN vendor_name VARCHAR(255);
    UPDATE public.vendors SET vendor_name = COALESCE(business_name, 'Unknown Vendor') WHERE vendor_name IS NULL;
    ALTER TABLE public.vendors ALTER COLUMN vendor_name SET NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'contact_address') THEN
    ALTER TABLE public.vendors ADD COLUMN contact_address TEXT;
    UPDATE public.vendors SET contact_address = business_address WHERE contact_address IS NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'status') THEN
    ALTER TABLE public.vendors ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;
END $$;

-- 4. Fix submissions table structure and add missing customer_id relationship
DO $$
BEGIN
  -- Add customer_id foreign key if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'customer_id') THEN
    ALTER TABLE public.submissions ADD COLUMN customer_id UUID REFERENCES public.customers(id);
  END IF;
  
  -- Add missing columns for document URLs that SubmissionsManager expects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'sales_invoice_url') THEN
    ALTER TABLE public.submissions ADD COLUMN sales_invoice_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'drivers_license_url') THEN
    ALTER TABLE public.submissions ADD COLUMN drivers_license_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'misc_documents_url') THEN
    ALTER TABLE public.submissions ADD COLUMN misc_documents_url TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'approval_terms') THEN
    ALTER TABLE public.submissions ADD COLUMN approval_terms TEXT;
  END IF;
  
  -- Ensure submission_date exists (SubmissionsManager orders by this)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submission_date') THEN
    ALTER TABLE public.submissions ADD COLUMN submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 5. Enable RLS on all tables if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 6. Fix RLS policies to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can access own record and partner users" ON public.users;
CREATE POLICY "Users can access own record and partner users" ON public.users
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      id = auth.uid() OR
      partner_id IN (
        SELECT id FROM public.partners WHERE contact_email = auth.email()
      ) OR
      auth.email() = 'support@emergestack.dev'
    )
  );

DROP POLICY IF EXISTS "Partners can access their customers" ON public.customers;
CREATE POLICY "Partners can access their customers" ON public.customers
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.contact_email = auth.email()
      ) OR
      auth.email() = 'support@emergestack.dev'
    )
  );

DROP POLICY IF EXISTS "Partners can manage their vendors" ON public.vendors;
CREATE POLICY "Partners can manage their vendors" ON public.vendors
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      partner_id IN (
        SELECT id FROM public.partners WHERE contact_email = auth.email()
      ) OR
      user_id = auth.uid() OR
      auth.email() = 'support@emergestack.dev'
    )
  );

DROP POLICY IF EXISTS "Partners can manage their submissions" ON public.submissions;
CREATE POLICY "Partners can manage their submissions" ON public.submissions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      partner_id IN (
        SELECT id FROM public.partners WHERE contact_email = auth.email()
      ) OR
      vendor_id IN (
        SELECT id FROM public.vendors WHERE user_id = auth.uid()
      ) OR
      auth.email() = 'support@emergestack.dev'
    )
  );

-- 7. Grant broad permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.vendors TO authenticated;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_partner_id ON public.users(partner_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_vendors_partner_id ON public.vendors(partner_id);
CREATE INDEX IF NOT EXISTS idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX IF NOT EXISTS idx_submissions_partner_id ON public.submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_vendor_id ON public.submissions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_submissions_customer_id ON public.submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_date ON public.submissions(submission_date);

SELECT 'MINIMAL TABLE FIXES COMPLETE! Missing tables created and RLS policies fixed.' as status;