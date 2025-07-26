-- 1. Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop any existing conflicting policies
DROP POLICY IF EXISTS "broker_full_access" ON storage.objects;
DROP POLICY IF EXISTS "vendor_limited_access" ON storage.objects;
DROP POLICY IF EXISTS "vendor_upload_access" ON storage.objects;
DROP POLICY IF EXISTS "Partners can only access their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users file access control" ON storage.objects;
DROP POLICY IF EXISTS "Partners can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete their own files" ON storage.objects;

-- 3. Create the correct RLS policies for partner file isolation
CREATE POLICY "partner_file_access" ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'partner-documents' AND
  -- Partners can access their folder (user_id is first part of path)
  (string_to_array(name, '/'))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'partner-documents' AND
  (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- 4. Update audit table structure to reference auth.users properly
ALTER TABLE storage_audit_log DROP CONSTRAINT IF EXISTS storage_audit_log_partner_id_fkey;
ALTER TABLE storage_audit_log ADD CONSTRAINT storage_audit_log_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES auth.users(id);

-- 5. Update audit table RLS policy
DROP POLICY IF EXISTS "Partners can view their own audit logs" ON storage_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON storage_audit_log;
DROP POLICY IF EXISTS "users_own_audit_logs" ON storage_audit_log;

CREATE POLICY "users_own_audit_logs" ON storage_audit_log
FOR ALL
TO authenticated
USING (partner_id = auth.uid())
WITH CHECK (partner_id = auth.uid());