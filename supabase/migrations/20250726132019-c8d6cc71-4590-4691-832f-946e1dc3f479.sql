-- Reset demo account passwords to ensure they match the code
-- Note: This uses admin functions to update auth.users directly

UPDATE auth.users 
SET encrypted_password = crypt('DemoPass123!', gen_salt('bf'))
WHERE email IN ('demo-partner@vendorhub.com', 'demo-vendor@vendorhub.com');