-- Fix security issues: Add secure search paths to all functions

-- Update generate_file_path function with secure search path
CREATE OR REPLACE FUNCTION generate_file_path(
  broker_id UUID,
  vendor_id UUID,
  filename TEXT
) RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Generate path: broker-id/vendor-vendor-id/secure-filename
  RETURN broker_id::text || '/vendor-' || vendor_id::text || '/' || filename;
END;
$$;

-- Update check_hybrid_storage_limit function with secure search path
CREATE OR REPLACE FUNCTION check_hybrid_storage_limit(
  vendor_id UUID, 
  file_size BIGINT
) RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  JOIN vendors v ON v.partner_admin_id = p.id
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
$$;

-- Update update_hybrid_storage_usage function with secure search path
CREATE OR REPLACE FUNCTION update_hybrid_storage_usage(
  vendor_id UUID,
  file_size BIGINT,
  is_delete BOOLEAN DEFAULT false
) RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE id = (SELECT partner_admin_id FROM vendors WHERE id = vendor_id);
END;
$$;

-- Update set_storage_limits_by_plan function with secure search path
CREATE OR REPLACE FUNCTION set_storage_limits_by_plan(
  partner_id UUID,
  plan_name TEXT
) RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  WHERE partner_admin_id = partner_id;
END;
$$;

-- Update existing functions with secure search paths
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM users WHERE id = user_id;
    RETURN user_role;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_partner_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    p_id uuid;
BEGIN
    SELECT partner_id INTO p_id FROM users WHERE id = user_id;
    RETURN p_id;
END;
$$;

CREATE OR REPLACE FUNCTION is_current_user_vendor_for_submission(submission_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    is_vendor_owner boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM vendors v
        WHERE v.id = submission_vendor_id
        AND v.user_id = auth.uid()
    ) INTO is_vendor_owner;
    RETURN is_vendor_owner;
END;
$$;

CREATE OR REPLACE FUNCTION get_vendor_partner_admin_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT partner_admin_id INTO admin_id 
    FROM vendors 
    WHERE user_id = user_id;
    RETURN admin_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_partner_storage(partner_id uuid, size_change bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE partners 
  SET storage_used = GREATEST(0, storage_used + size_change)
  WHERE id = partner_id;
END;
$$;