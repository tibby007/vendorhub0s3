-- First, let's disable RLS on the users table to fix the infinite recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;

-- Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies that won't cause infinite recursion
CREATE POLICY "Enable insert for authenticated users" ON public.users
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable select for users based on user_id" ON public.users
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON public.users
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);