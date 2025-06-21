
-- Create a new SECURITY DEFINER function to get vendor's partner admin ID
CREATE OR REPLACE FUNCTION public.get_vendor_partner_admin_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get the partner_admin_id for the vendor associated with the given user_id
    -- This bypasses RLS because the function is SECURITY DEFINER
    SELECT partner_admin_id INTO admin_id 
    FROM public.vendors 
    WHERE user_id = user_id;
    
    RETURN admin_id;
END;
$$;

-- Grant execution privileges on this function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_vendor_partner_admin_id(uuid) TO authenticated;

-- Now update all the problematic RLS policies on the resources table

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Partner Admins can manage their resources" ON public.resources;
DROP POLICY IF EXISTS "Vendors can view resources from their partner" ON public.resources;

-- Recreate "Partner Admins can manage their resources" policy using SECURITY DEFINER function
CREATE POLICY "Partner Admins can manage their resources" ON public.resources
FOR ALL
USING (
  (partner_admin_id = auth.uid()) OR 
  (public.get_user_role(auth.uid()) = 'Super Admin')
)
WITH CHECK (
  (partner_admin_id = auth.uid()) OR 
  (public.get_user_role(auth.uid()) = 'Super Admin')
);

-- Recreate "Vendors can view resources from their partner" policy using SECURITY DEFINER function
CREATE POLICY "Vendors can view resources from their partner" ON public.resources
FOR SELECT
USING (
  public.get_vendor_partner_admin_id(auth.uid()) = partner_admin_id
);
