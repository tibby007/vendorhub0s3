-- Fix security warning by setting search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';