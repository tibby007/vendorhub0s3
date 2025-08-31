-- Create rate_limits table for API rate limiting
-- This implements a sliding window rate limiter with per-user tracking

-- 1. Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET, -- Track anonymous users by IP
  count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user or IP
  CONSTRAINT unique_user_or_ip UNIQUE NULLS NOT DISTINCT (user_id, ip_address)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON public.rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_reset ON public.rate_limits(last_reset);

-- 3. Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies - only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
  );

-- 5. Grant permissions
GRANT ALL ON public.rate_limits TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;

-- 6. Create function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSON AS $$
DECLARE
  current_record public.rate_limits%ROWTYPE;
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  reset_threshold INTERVAL := '1 minute';
  new_count INTEGER;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO current_record
  FROM public.rate_limits
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR (p_user_id IS NULL AND ip_address = p_ip_address)
  FOR UPDATE;
  
  -- If no record exists, create one
  IF current_record IS NULL THEN
    INSERT INTO public.rate_limits (user_id, ip_address, count, last_reset)
    VALUES (p_user_id, p_ip_address, 1, current_time)
    RETURNING * INTO current_record;
    
    RETURN json_build_object(
      'allowed', true,
      'count', 1,
      'limit', p_limit,
      'reset_time', current_time + reset_threshold,
      'remaining', p_limit - 1
    );
  END IF;
  
  -- Check if we need to reset the counter (more than 1 minute since last reset)
  IF current_time - current_record.last_reset > reset_threshold THEN
    new_count := 1;
    UPDATE public.rate_limits
    SET count = new_count,
        last_reset = current_time,
        updated_at = current_time
    WHERE id = current_record.id;
  ELSE
    new_count := current_record.count + 1;
    UPDATE public.rate_limits
    SET count = new_count,
        updated_at = current_time
    WHERE id = current_record.id;
  END IF;
  
  -- Check if limit is exceeded
  IF new_count > p_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'count', new_count,
      'limit', p_limit,
      'reset_time', current_record.last_reset + reset_threshold,
      'remaining', 0,
      'retry_after', EXTRACT(EPOCH FROM ((current_record.last_reset + reset_threshold) - current_time))
    );
  ELSE
    RETURN json_build_object(
      'allowed', true,
      'count', new_count,
      'limit', p_limit,
      'reset_time', current_record.last_reset + reset_threshold,
      'remaining', p_limit - new_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE last_reset < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_rate_limits_updated_at 
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, INET, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO service_role;

SELECT 'RATE LIMITING SYSTEM SETUP COMPLETE! Table and functions created successfully.' as status;