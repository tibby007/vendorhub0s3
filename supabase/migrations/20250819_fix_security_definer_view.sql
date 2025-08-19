-- Fix Supabase security linter issue: Remove SECURITY DEFINER view
-- This addresses the security warning about security_audit_summary view

-- Drop the problematic security_audit_summary view if it exists
DROP VIEW IF EXISTS public.security_audit_summary;

-- If we need an audit summary in the future, create it without SECURITY DEFINER
-- For now, we'll rely on direct queries to audit log tables when needed