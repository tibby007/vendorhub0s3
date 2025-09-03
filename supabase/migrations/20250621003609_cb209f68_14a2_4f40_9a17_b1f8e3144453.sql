
-- Create a new SECURITY DEFINER function to check if current user is vendor for a submission
CREATE OR REPLACE FUNCTION public.is_current_user_vendor_for_submission(submission_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the current user is the vendor for the given submission
    -- This bypasses RLS because the function is SECURITY DEFINER
    RETURN EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE id = submission_vendor_id 
        AND user_id = auth.uid()
    );
END;
$$;

-- Grant execution privileges on this function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_vendor_for_submission(uuid) TO authenticated;

-- Now update all the problematic RLS policies on the submissions table

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view submissions in their network" ON public.submissions;
DROP POLICY IF EXISTS "Vendors can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Partner Admins can update their submissions" ON public.submissions;

-- Recreate "Users can view submissions in their network" policy using SECURITY DEFINER functions
CREATE POLICY "Users can view submissions in their network" ON public.submissions
FOR SELECT
USING (
  (partner_admin_id = auth.uid()) OR 
  (public.get_user_role(auth.uid()) = 'Super Admin') OR
  (public.is_current_user_vendor_for_submission(vendor_id))
);

-- Recreate "Vendors can create submissions" policy using SECURITY DEFINER function
CREATE POLICY "Vendors can create submissions" ON public.submissions
FOR INSERT
WITH CHECK (
  public.is_current_user_vendor_for_submission(vendor_id)
);

-- Recreate "Partner Admins can update their submissions" policy with cleaned up type casts
CREATE POLICY "Partner Admins can update their submissions" ON public.submissions
FOR UPDATE
USING (
  (partner_admin_id = auth.uid()) OR (public.get_user_role(auth.uid()) = 'Super Admin')
)
WITH CHECK (
  (partner_admin_id = auth.uid()) OR (public.get_user_role(auth.uid()) = 'Super Admin')
);
