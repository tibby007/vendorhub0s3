
-- Create RLS policies for the partners table

-- Allow Super Admins full access to all partner records
CREATE POLICY "Super Admins can manage all partners" ON public.partners
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Super Admin'
  )
);

-- Allow Partner Admins to view their own partner information
CREATE POLICY "Partner Admins can view their partner" ON public.partners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Partner Admin'
    AND users.partner_id = partners.id
  )
);

-- Allow vendors to view their partner's information (needed for the app to function)
CREATE POLICY "Vendors can view their partner" ON public.partners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Vendor'
    AND users.partner_id = partners.id
  )
);

-- Allow Partner Admins to update their own partner information
CREATE POLICY "Partner Admins can update their partner" ON public.partners
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Partner Admin'
    AND users.partner_id = partners.id
  )
);
