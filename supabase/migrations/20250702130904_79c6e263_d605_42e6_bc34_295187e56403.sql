-- Fix Karen Jones' role and create partner record
UPDATE public.users 
SET role = 'Partner Admin'
WHERE email = 'karenjones@gmail.com';

-- Create a partner company for Karen Jones
INSERT INTO public.partners (name, contact_email, contact_phone)
VALUES ('Jones Financing Partners', 'karenjones@gmail.com', '+1-555-0123');

-- Link Karen to her partner company
UPDATE public.users 
SET partner_id = (SELECT id FROM public.partners WHERE contact_email = 'karenjones@gmail.com')
WHERE email = 'karenjones@gmail.com';