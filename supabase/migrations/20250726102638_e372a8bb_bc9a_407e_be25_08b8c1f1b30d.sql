-- Step 1: Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Note: storage.objects already has RLS enabled by Supabase

-- Step 2: Core RLS Policies for File Storage
CREATE POLICY "broker_full_access" ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'partner-documents' AND
  -- First folder level must match broker's user ID
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'partner-documents' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy 2: Vendors can only access their own subfolder within broker's folder
CREATE POLICY "vendor_limited_access" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'partner-documents' AND
  -- Check if user is a vendor and accessing their own subfolder
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.user_id = auth.uid()
    AND (string_to_array(name, '/'))[1] = v.partner_id::text
    AND (string_to_array(name, '/'))[2] = ('vendor-' || v.user_id::text)
  )
);

-- Policy 3: Vendors can upload to their own subfolder only
CREATE POLICY "vendor_upload_access" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-documents' AND
  EXISTS (
    SELECT 1 FROM vendors v
    WHERE v.user_id = auth.uid()
    AND (string_to_array(name, '/'))[1] = v.partner_id::text
    AND (string_to_array(name, '/'))[2] = ('vendor-' || v.user_id::text)
  )
);

-- Step 3: Database Table RLS Policies
-- Partners table: Users can only access their own partner record
CREATE POLICY "partners_own_data" ON partners
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Vendors table: Brokers see all their vendors, vendors see only themselves
CREATE POLICY "vendors_broker_access" ON vendors
FOR ALL
TO authenticated
USING (
  partner_id = auth.uid() OR  -- Broker sees all their vendors
  user_id = auth.uid()              -- Vendor sees only themselves
)
WITH CHECK (
  partner_id = auth.uid() OR
  user_id = auth.uid()
);

-- Step 4: File Path Structure Function
CREATE OR REPLACE FUNCTION generate_file_path(
  broker_id UUID,
  vendor_id UUID,
  filename TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Generate path: broker-id/vendor-vendor-id/secure-filename
  RETURN broker_id::text || '/vendor-' || vendor_id::text || '/' || filename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION generate_file_path TO authenticated;

-- Add storage tracking to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 2147483648; -- 2GB default

-- Create storage validation function
CREATE OR REPLACE FUNCTION check_hybrid_storage_limit(
  vendor_id UUID, 
  file_size BIGINT
) RETURNS JSON AS $$
DECLARE
  vendor_used BIGINT;
  vendor_limit BIGINT;
  broker_used BIGINT;
  broker_limit BIGINT;
  result JSON;
BEGIN
  -- Get vendor storage info
  SELECT storage_used, storage_limit INTO vendor_used, vendor_limit
  FROM vendors WHERE id = vendor_id;
  
  -- Get broker storage info
  SELECT p.storage_used, p.storage_limit INTO broker_used, broker_limit
  FROM partners p
  JOIN vendors v ON v.partner_id = p.id
  WHERE v.id = vendor_id;
  
  -- Check vendor individual limit first
  IF (vendor_used + file_size) > vendor_limit THEN
    result := json_build_object(
      'allowed', false,
      'reason', 'vendor_limit',
      'message', 'You have exceeded your individual storage limit. Please delete some files or ask your broker to upgrade.'
    );
    RETURN result;
  END IF;
  
  -- Check broker total limit
  IF (broker_used + file_size) > broker_limit THEN
    result := json_build_object(
      'allowed', false, 
      'reason', 'broker_limit',
      'message', 'Your broker has exceeded their total storage limit. Please contact your broker to upgrade their plan.'
    );
    RETURN result;
  END IF;
  
  -- All checks passed
  result := json_build_object(
    'allowed', true,
    'vendor_remaining', vendor_limit - vendor_used - file_size,
    'broker_remaining', broker_limit - broker_used - file_size
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION check_hybrid_storage_limit TO authenticated;

-- Create storage update function
CREATE OR REPLACE FUNCTION update_hybrid_storage_usage(
  vendor_id UUID,
  file_size BIGINT,
  is_delete BOOLEAN DEFAULT false
) RETURNS VOID AS $$
DECLARE
  size_change BIGINT;
BEGIN
  size_change := CASE WHEN is_delete THEN -file_size ELSE file_size END;
  
  -- Update vendor storage
  UPDATE vendors 
  SET storage_used = storage_used + size_change
  WHERE id = vendor_id;
  
  -- Update broker storage
  UPDATE partners 
  SET storage_used = storage_used + size_change
  WHERE id = (SELECT partner_id FROM vendors WHERE id = vendor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION update_hybrid_storage_usage TO authenticated;

-- Create storage limits based on plan
CREATE OR REPLACE FUNCTION set_storage_limits_by_plan(
  partner_id UUID,
  plan_name TEXT
) RETURNS VOID AS $$
DECLARE
  broker_limit BIGINT;
  vendor_limit BIGINT;
BEGIN
  -- Set limits based on plan
  CASE plan_name
    WHEN 'starter' THEN
      broker_limit := 5368709120;  -- 5GB
      vendor_limit := 2147483648;  -- 2GB per vendor
    WHEN 'professional' THEN
      broker_limit := 26843545600; -- 25GB  
      vendor_limit := 5368709120;  -- 5GB per vendor
    WHEN 'enterprise' THEN
      broker_limit := 107374182400; -- 100GB
      vendor_limit := 10737418240;  -- 10GB per vendor
    ELSE
      RAISE EXCEPTION 'Invalid plan name: %', plan_name;
  END CASE;
  
  -- Update partner limit
  UPDATE partners 
  SET storage_limit = broker_limit
  WHERE id = partner_id;
  
  -- Update all vendor limits for this partner
  UPDATE vendors 
  SET storage_limit = vendor_limit
  WHERE partner_id = partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users  
GRANT EXECUTE ON FUNCTION set_storage_limits_by_plan TO authenticated;