
-- Add missing columns to resources table for file management
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
