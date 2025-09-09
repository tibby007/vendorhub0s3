-- Verify that the auth users were created successfully
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

-- Also check if they exist in public.users table
SELECT 
  id,
  email,
  created_at,
  role
FROM public.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

-- Count total users in both tables for reference
SELECT 'auth.users' as table_name, COUNT(*) as total_users FROM auth.users
UNION ALL
SELECT 'public.users' as table_name, COUNT(*) as total_users FROM public.users;