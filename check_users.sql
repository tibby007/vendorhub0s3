-- Check the users_id_fkey constraint details
SELECT 'users_id_fkey constraint details:' as info;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'users_id_fkey';

-- Check auth.users table structure
SELECT 'Auth users table exists:' as info;
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') as auth_users_exists;

-- Check current auth users
SELECT 'Current auth users:' as info;
SELECT id, email FROM auth.users LIMIT 5;