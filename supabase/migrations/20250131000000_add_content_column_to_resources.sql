-- Add missing content column to resources table
-- This fixes the 400 error: column resources.content does not exist

ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS content TEXT;

-- Update existing records to have empty content if null
UPDATE public.resources SET content = '' WHERE content IS NULL;