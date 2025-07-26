-- CRITICAL SECURITY FIX: Prevent users from changing their own roles

-- 1. Drop the dangerous UPDATE policy that allows users to change their role
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;

-- 2. Create a restricted UPDATE policy that excludes the role column
CREATE POLICY "Users can update their profile (excluding role)" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes by regular users
  role = (SELECT role FROM public.users WHERE id = auth.uid())
);

-- 3. Create audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can view audit logs
CREATE POLICY "Super Admins can view security audit logs"
ON public.security_audit_log
FOR SELECT
USING (get_user_role(auth.uid()) = 'Super Admin');

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- 4. Create secure function for admin-only role changes
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT,
  reason TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_role TEXT;
  old_role TEXT;
  result JSON;
BEGIN
  -- Verify current user is Super Admin
  SELECT get_user_role(auth.uid()) INTO current_user_role;
  
  IF current_user_role != 'Super Admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only Super Admins can change user roles'
    );
  END IF;
  
  -- Get current role for audit
  SELECT role INTO old_role FROM users WHERE id = target_user_id;
  
  IF old_role IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('Super Admin', 'Partner Admin', 'Vendor') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid role specified'
    );
  END IF;
  
  -- Update the role
  UPDATE users 
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the security event
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    target_user_id,
    old_value,
    new_value,
    performed_by,
    ip_address
  ) VALUES (
    'role_change',
    auth.uid(),
    target_user_id,
    old_role,
    new_role,
    auth.uid(),
    inet_client_addr()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Role updated successfully',
    'old_role', old_role,
    'new_role', new_role
  );
END;
$$;

-- 5. Create function to log failed role change attempts
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  details TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    old_value,
    performed_by,
    ip_address
  ) VALUES (
    event_type,
    auth.uid(),
    details,
    auth.uid(),
    inet_client_addr()
  );
END;
$$;