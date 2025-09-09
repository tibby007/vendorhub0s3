-- Drop the function if it already exists to ensure a clean update
DROP FUNCTION IF EXISTS public.get_user_partner_id(uuid);

-- Create the new security definer function
CREATE FUNCTION public.get_user_partner_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- This is CRUCIAL! It allows the function to bypass RLS.
AS $$
DECLARE
    p_id uuid;
BEGIN
    -- Select the partner_id from the public.users table for the given user_id
    -- This read will bypass RLS because the function is SECURITY DEFINER
    SELECT partner_id INTO p_id FROM public.users WHERE id = user_id;
    RETURN p_id;
END;
$$;

-- Grant execution privileges on this function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_partner_id(uuid) TO authenticated;

-- Now update all the RLS policies on the partners table to use the SECURITY DEFINER functions

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Super Admins can manage all partners" ON public.partners;
DROP POLICY IF EXISTS "Partner Admins can view their partner" ON public.partners;
DROP POLICY IF EXISTS "Vendors can view their partner" ON public.partners;
DROP POLICY IF EXISTS "Partner Admins can update their partner" ON public.partners;

-- Recreate policies using the SECURITY DEFINER functions
CREATE POLICY "Super Admins can manage all partners" ON public.partners
FOR ALL
USING (
  public.get_user_role(auth.uid()) = 'Super Admin'
);

CREATE POLICY "Partner Admins can view their partner" ON public.partners
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'Partner Admin'
  AND public.get_user_partner_id(auth.uid()) = id
);

CREATE POLICY "Vendors can view their partner" ON public.partners
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'Vendor'
  AND public.get_user_partner_id(auth.uid()) = id
);

CREATE POLICY "Partner Admins can update their partner" ON public.partners
FOR UPDATE
USING (
  public.get_user_role(auth.uid()) = 'Partner Admin'
  AND public.get_user_partner_id(auth.uid()) = id
)
WITH CHECK (
  public.get_user_role(auth.uid()) = 'Partner Admin'
  AND public.get_user_partner_id(auth.uid()) = id
);