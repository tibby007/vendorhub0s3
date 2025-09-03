
-- Update the problematic policy on the vendors table to use the SECURITY DEFINER function

-- Drop the existing policy to recreate it
DROP POLICY IF EXISTS "Partner Admins can manage their vendors" ON public.vendors;

-- Recreate the policy using the SECURITY DEFINER function
CREATE POLICY "Partner Admins can manage their vendors" ON public.vendors
FOR ALL
USING (
  (partner_admin_id = auth.uid()) OR (public.get_user_role(auth.uid()) = 'Super Admin')
)
WITH CHECK (
  (partner_admin_id = auth.uid()) OR (public.get_user_role(auth.uid()) = 'Super Admin')
);

-- Also update the "Vendors can view their own profile" policy to remove unnecessary type casts
DROP POLICY IF EXISTS "Vendors can view their own profile" ON public.vendors;

CREATE POLICY "Vendors can view their own profile" ON public.vendors
FOR SELECT
USING (
  user_id = auth.uid()
);
