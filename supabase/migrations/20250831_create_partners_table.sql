-- Create partners table for subscription and trial management
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
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

-- Create index on contact_email for fast lookups
CREATE INDEX IF NOT EXISTS idx_partners_contact_email ON public.partners(contact_email);

-- Add RLS policies for partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own partner record
CREATE POLICY "Users can access own partner record" ON public.partners
  FOR ALL USING (
    user_id = auth.uid()
  );

-- Policy: Super admins can access all partner records
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

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.partners TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;