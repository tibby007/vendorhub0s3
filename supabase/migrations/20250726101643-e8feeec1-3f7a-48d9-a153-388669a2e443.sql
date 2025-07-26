-- Create audit log table for file operations
CREATE TABLE storage_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  action TEXT NOT NULL, -- 'upload', 'delete', 'access', 'validation_check'
  file_name TEXT NOT NULL,
  file_size BIGINT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit log
ALTER TABLE storage_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit log
CREATE POLICY "Partners can view their own audit logs" ON storage_audit_log
FOR SELECT USING (partner_id = auth.uid() OR get_user_role(auth.uid()) = 'Super Admin');

CREATE POLICY "System can insert audit logs" ON storage_audit_log
FOR INSERT WITH CHECK (true);

-- Create storage bucket for partner documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for partner file isolation
CREATE POLICY "Partners can only access their own files" ON storage.objects
FOR ALL USING (
  bucket_id = 'partner-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Additional policy to prevent unauthorized access
CREATE POLICY "Authenticated users file access control" ON storage.objects
FOR SELECT USING (
  bucket_id = 'partner-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for file uploads
CREATE POLICY "Partners can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'partner-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for file deletions
CREATE POLICY "Partners can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'partner-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);