-- Check if auth users exist in production
SELECT 
    id, 
    email, 
    created_at, 
    email_confirmed_at,
    encrypted_password IS NOT NULL as has_password
FROM auth.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

-- Also check the public users table
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.partner_id,
    u.created_at
FROM public.users u
WHERE u.email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY u.email;