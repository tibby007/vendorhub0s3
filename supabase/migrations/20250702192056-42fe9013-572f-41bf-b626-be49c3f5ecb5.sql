-- Fix demo user UUID mismatch between auth.users and public.users tables
-- Update public.users to match the actual auth user IDs

-- First, let's get the current auth user IDs and update public users accordingly
UPDATE public.users 
SET id = 'de91b874-05ef-42bc-8b7b-0a150d985ee5'
WHERE email = 'demo-partner@vendorhub.com';

UPDATE public.users 
SET id = '11bc6902-1b47-477e-a3e2-286dd5407100'
WHERE email = 'demo-vendor@vendorhub.com';

-- Update vendors table to use correct partner_admin_id and user_id
UPDATE public.vendors 
SET partner_admin_id = 'de91b874-05ef-42bc-8b7b-0a150d985ee5',
    user_id = '11bc6902-1b47-477e-a3e2-286dd5407100'
WHERE contact_email = 'demo-vendor@vendorhub.com';

-- Update partners table to use correct ID if needed
UPDATE public.partners 
SET id = (SELECT partner_id FROM public.users WHERE email = 'demo-partner@vendorhub.com')
WHERE contact_email = 'demo-partner@vendorhub.com' AND id != (SELECT partner_id FROM public.users WHERE email = 'demo-partner@vendorhub.com');