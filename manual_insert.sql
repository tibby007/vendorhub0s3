-- Create the missing accounts properly
-- First create auth users, then public users with matching IDs

-- Insert auth users first
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
(
  gen_random_uuid(),
  'support@emergestack.dev',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  gen_random_uuid(),
  'keenan@getmybusinesscredit.com',
  crypt('temppassword123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Now insert public users using the auth user IDs
INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  au.id,
  'support@emergestack.dev',
  'super_admin',
  p.id
FROM auth.users au, public.partners p
WHERE au.email = 'support@emergestack.dev'
  AND p.contact_email = 'support@emergestack.dev';

INSERT INTO public.users (
  id,
  email,
  role,
  partner_id
) 
SELECT 
  au.id,
  'keenan@getmybusinesscredit.com',
  'partner_admin',
  p.id
FROM auth.users au, public.partners p
WHERE au.email = 'keenan@getmybusinesscredit.com'
  AND p.contact_email = 'keenan@getmybusinesscredit.com';

-- Insert subscriber records
INSERT INTO public.subscribers (
  user_id,
  email,
  subscription_tier,
  status,
  subscribed
)
SELECT 
  u.id,
  u.email,
  'Premium',
  'active',
  true
FROM public.users u
WHERE u.email IN ('keenan@getmybusinesscredit.com', 'support@emergestack.dev');

-- Verify the insertions
SELECT 'Auth Users Created:' as info;
SELECT id, email FROM auth.users WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com');

SELECT 'Public Users Created:' as info;
SELECT id, email, role FROM public.users WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com');

SELECT 'Subscribers Created:' as info;
SELECT user_id, email, subscription_tier, status FROM public.subscribers WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com');