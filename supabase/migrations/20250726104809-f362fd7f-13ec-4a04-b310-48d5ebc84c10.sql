-- Add Stripe fields to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'trialing';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS vendor_limit INTEGER NOT NULL DEFAULT 3;

-- Create setup fee tracking table
CREATE TABLE IF NOT EXISTS setup_fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  is_annual BOOLEAN NOT NULL,
  amount_paid INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on setup_fee_payments
ALTER TABLE setup_fee_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for setup_fee_payments
CREATE POLICY "Super Admins can manage setup fee payments" ON setup_fee_payments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = auth.uid() 
  AND users.role = 'Super Admin'
));

-- Update storage limits based on plan types
CREATE OR REPLACE FUNCTION update_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set storage and vendor limits based on plan
  CASE NEW.plan_type
    WHEN 'basic' THEN
      NEW.storage_limit := 5368709120;  -- 5GB
      NEW.vendor_limit := 3;
    WHEN 'pro' THEN  
      NEW.storage_limit := 26843545600; -- 25GB
      NEW.vendor_limit := 7;
    WHEN 'premium' THEN
      NEW.storage_limit := 107374182400; -- 100GB
      NEW.vendor_limit := 999999; -- unlimited
    ELSE
      NEW.storage_limit := 5368709120;  -- Default to basic
      NEW.vendor_limit := 3;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update limits when plan changes
CREATE TRIGGER update_partner_plan_limits
  BEFORE INSERT OR UPDATE OF plan_type ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_limits();