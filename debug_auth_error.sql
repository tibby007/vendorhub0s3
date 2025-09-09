-- Debug auth API errors

-- Check if auth service is accessible
SELECT 'Auth service check:' as info;
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- Check auth.users table accessibility
SELECT 'Auth users count:' as info;
SELECT COUNT(*) as total_users FROM auth.users;

-- Check specific user we're trying to login with
SELECT 'Keenan auth record:' as info;
SELECT 
  id,
  email,
  encrypted_password IS NOT NULL as has_password,
  email_confirmed_at IS NOT NULL as email_confirmed,
  aud,
  role,
  created_at,
  updated_at,
  deleted_at IS NULL as active
FROM auth.users 
WHERE email = 'keenan@getmybusinesscredit.com';

-- Check for any auth constraints that might be failing
SELECT 'Auth constraints:' as info;
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'auth.users'::regclass;

-- Check auth schema permissions
SELECT 'Auth schema permissions:' as info;
SELECT 
  schemaname,
  schemaowner,
  schemaacl
FROM pg_namespace n
JOIN information_schema.schemata s ON n.nspname = s.schema_name
WHERE schema_name = 'auth';