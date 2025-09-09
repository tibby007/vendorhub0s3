-- Debug login issues for Keenan's account

-- Check auth.users structure and required fields
SELECT 'Auth users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY ordinal_position;

-- Check Keenan's auth record in detail
SELECT 'Keenan auth user details:' as info;
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  phone_confirmed_at IS NOT NULL as phone_confirmed,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  aud,
  role,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  deleted_at IS NULL as active
FROM auth.users 
WHERE email = 'keenan@getmybusinesscredit.com';

-- Check if there are any auth constraints or triggers
SELECT 'Auth table constraints:' as info;
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_schema = 'auth' AND table_name = 'users';

-- Compare with a working auth user
SELECT 'Working auth user for comparison:' as info;
SELECT 
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'keenan@vendorhubos.com' OR email = 'keenan@brokerage.com'
LIMIT 1;