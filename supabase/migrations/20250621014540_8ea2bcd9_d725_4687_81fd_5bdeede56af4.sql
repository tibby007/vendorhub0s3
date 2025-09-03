
-- Update get_user_role function with secure search path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role text;
BEGIN
    -- Set a secure search path for this function
    SET search_path = pg_temp, pg_catalog, public;
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    RETURN user_role;
END;
$$;

-- Update get_user_partner_id function with secure search path
CREATE OR REPLACE FUNCTION public.get_user_partner_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    p_id uuid;
BEGIN
    -- Set a secure search path for this function
    SET search_path = pg_temp, pg_catalog, public;
    SELECT partner_id INTO p_id FROM public.users WHERE id = user_id;
    RETURN p_id;
END;
$$;

-- Update is_current_user_vendor_for_submission function with secure search path
CREATE OR REPLACE FUNCTION public.is_current_user_vendor_for_submission(submission_vendor_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_vendor_owner boolean;
BEGIN
    -- Set a secure search path for this function
    SET search_path = pg_temp, pg_catalog, public;
    SELECT EXISTS (
        SELECT 1
        FROM public.vendors v
        WHERE v.id = submission_vendor_id
        AND v.user_id = auth.uid()
    ) INTO is_vendor_owner;
    RETURN is_vendor_owner;
END;
$$;

-- Update get_vendor_partner_admin_id function with secure search path
CREATE OR REPLACE FUNCTION public.get_vendor_partner_admin_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Set a secure search path for this function
    SET search_path = pg_temp, pg_catalog, public;
    SELECT partner_admin_id INTO admin_id 
    FROM public.vendors 
    WHERE user_id = user_id;
    RETURN admin_id;
END;
$$;
