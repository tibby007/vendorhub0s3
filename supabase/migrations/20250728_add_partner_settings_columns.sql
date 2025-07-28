-- Add missing columns for partner settings
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_threshold INTEGER DEFAULT 1000;

-- Create partner_settings table for more complex settings that might grow
CREATE TABLE IF NOT EXISTS partner_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(partner_id, setting_key)
);

-- Enable RLS
ALTER TABLE partner_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for partner_settings
CREATE POLICY "Partners can view their own settings" ON partner_settings
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE id = auth.uid() 
      OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can insert their own settings" ON partner_settings
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE id = auth.uid() 
      OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can update their own settings" ON partner_settings
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM partners WHERE id = auth.uid() 
      OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Partners can delete their own settings" ON partner_settings
  FOR DELETE USING (
    partner_id IN (
      SELECT id FROM partners WHERE id = auth.uid() 
      OR contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_settings_partner_id ON partner_settings(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_settings_key ON partner_settings(partner_id, setting_key);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_partner_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_partner_settings_updated_at
    BEFORE UPDATE ON partner_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_settings_updated_at();