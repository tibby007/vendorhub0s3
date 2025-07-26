-- Remove old conflicting storage policies
DROP POLICY IF EXISTS "Users can upload submission documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view submission documents in their network" ON storage.objects;

-- Verify we only have the secure partner_file_access policy
-- This policy ensures users can only access files in their own folder (user_id/filename structure)