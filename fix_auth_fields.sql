-- Fix missing auth fields for Keenan's account

-- Update Keenan's auth record with required fields
UPDATE auth.users 
SET 
  aud = 'authenticated',
  role = 'authenticated',
  raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
  raw_user_meta_data = '{"email_verified": true}',
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'keenan@getmybusinesscredit.com';

-- Also fix support@emergestack.dev if it has the same issue
UPDATE auth.users 
SET 
  aud = 'authenticated',
  role = 'authenticated',
  raw_app_meta_data = '{"provider": "email", "providers": ["email"]}',
  raw_user_meta_data = '{"email_verified": true}',
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'support@emergestack.dev';

-- Verify the fixes
SELECT 'Updated auth records:' as info;
SELECT 
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users 
WHERE email IN ('keenan@getmybusinesscredit.com', 'support@emergestack.dev')
ORDER BY email;