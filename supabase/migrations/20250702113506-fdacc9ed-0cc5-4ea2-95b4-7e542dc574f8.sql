-- Fix role inconsistency for johnsmith@gmail.com
UPDATE public.users 
SET role = 'Partner Admin' 
WHERE email = 'johnsmith@gmail.com';