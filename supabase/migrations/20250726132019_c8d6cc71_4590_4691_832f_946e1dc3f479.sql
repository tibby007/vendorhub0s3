-- Reset demo account passwords to ensure they match the code
-- Note: Password reset removed due to gen_salt function not being available
-- Users will need to reset passwords manually if needed

-- UPDATE auth.users 
-- SET encrypted_password = crypt('DemoPass123!', gen_salt('bf'))
-- WHERE email IN ('demo-partner@vendorhub.com', 'demo-vendor@vendorhub.com');