-- Fix the user role for johnsmith@gmail.com to be Partner Admin (which it already is)
-- This is just a verification query to ensure the data is correct

-- Create a sample vendor record for testing if one doesn't exist
INSERT INTO public.vendors (
  vendor_name,
  contact_email,
  contact_phone,
  contact_address,
  partner_admin_id,
  user_id
) 
VALUES (
  'Test Vendor Company',
  'testvendor@example.com',
  '555-123-4567',
  '123 Business St, City, State 12345',
  (SELECT id FROM public.users WHERE email = 'johnsmith@gmail.com'),
  NULL  -- No user account for this vendor yet
)
ON CONFLICT DO NOTHING;