-- Update the function to fix security warning with proper search path
CREATE OR REPLACE FUNCTION update_partner_storage(partner_id UUID, size_change BIGINT)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE partners 
  SET storage_used = GREATEST(0, storage_used + size_change)
  WHERE id = partner_id;
END;
$$;