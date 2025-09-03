
-- Drop dependent policies first
DROP POLICY IF EXISTS "Super Admins can view security audit logs" ON security_audit_log;
DROP POLICY IF EXISTS "Super Admins can view all users" ON public.users;

-- Drop the function if it already exists to ensure a clean update
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create the new security definer function
CREATE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- This is CRUCIAL! It allows the function to bypass RLS.
AS $$
DECLARE
    user_role text;
BEGIN
    -- Select the role from the public.users table for the given user_id
    -- This read will bypass RLS because the function is SECURITY DEFINER
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$;

-- Grant execution privileges on this function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Update the problematic policy to use the new function
DROP POLICY IF EXISTS "Super Admins can view all users" ON public.users;

CREATE POLICY "Super Admins can view all users"
ON public.users FOR ALL
TO public
USING (
    public.get_user_role(auth.uid()) = 'Super Admin'
);

-- Optional: Fix the overly permissive insert policy for better security
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Recreate the security audit log policy
CREATE POLICY "Super Admins can view security audit logs"
ON security_audit_log FOR ALL
TO public
USING (
    public.get_user_role(auth.uid()) = 'Super Admin'
);
