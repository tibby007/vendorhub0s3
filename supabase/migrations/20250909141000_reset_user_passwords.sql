-- Reset passwords for the created auth users
-- This will allow them to login with the test password

-- First, let's use the auth.admin_update_user_by_id function if it exists
-- Otherwise, we'll update the encrypted_password directly

-- Update support@emergestack.dev password
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'password'
  updated_at = NOW()
WHERE email = 'support@emergestack.dev';

-- Update keenan@getmybusinesscredit.com password  
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash for 'password'
  updated_at = NOW()
WHERE email = 'keenan@getmybusinesscredit.com';

-- Verify the updates
SELECT 
  email,
  encrypted_password,
  updated_at
FROM auth.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;