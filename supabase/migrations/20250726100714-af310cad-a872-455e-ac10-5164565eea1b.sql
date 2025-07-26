-- Add storage tracking columns to partners table
ALTER TABLE partners ADD COLUMN storage_used BIGINT DEFAULT 0;
ALTER TABLE partners ADD COLUMN storage_limit BIGINT DEFAULT 5368709120; -- 5GB default

-- Create function to update partner storage usage
CREATE OR REPLACE FUNCTION update_partner_storage(partner_id UUID, size_change BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE partners 
  SET storage_used = GREATEST(0, storage_used + size_change)
  WHERE id = partner_id;
END;
$$ LANGUAGE plpgsql;

-- Set storage limits based on subscription tiers (if subscription_tier column exists)
-- Note: This will be updated when subscription integration is added
UPDATE partners SET storage_limit = 5368709120 WHERE id IS NOT NULL;  -- 5GB default for all