-- Production Rollback Script: Revert NULL Token Fields Migration
-- Date: 2025-01-09
-- Purpose: Rollback the auth.users token fields migration if needed
-- 
-- WARNING: This script will set token fields back to NULL
-- Only use this if the migration causes issues and you need to revert

-- Begin transaction to ensure atomicity
BEGIN;

-- Log the rollback start
DO $$
BEGIN
    RAISE NOTICE 'Starting auth.users token fields rollback at %', NOW();
END $$;

-- Check current state before rollback
DO $$
DECLARE
    empty_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO empty_count
    FROM auth.users 
    WHERE confirmation_token = '' 
       OR recovery_token = '' 
       OR email_change_token_new = '' 
       OR reauthentication_token = '' 
       OR email_change_token_current = '' 
       OR email_change = '';
    
    RAISE NOTICE 'Found % users with empty token fields before rollback', empty_count;
END $$;

-- Revert empty strings back to NULL for token fields
-- NOTE: This will restore the original scanning error issue
UPDATE auth.users 
SET 
    confirmation_token = NULLIF(confirmation_token, ''),
    recovery_token = NULLIF(recovery_token, ''),
    email_change_token_new = NULLIF(email_change_token_new, ''),
    reauthentication_token = NULLIF(reauthentication_token, ''),
    email_change_token_current = NULLIF(email_change_token_current, ''),
    email_change = NULLIF(email_change, '')
WHERE 
    confirmation_token = '' 
    OR recovery_token = '' 
    OR email_change_token_new = '' 
    OR reauthentication_token = '' 
    OR email_change_token_current = '' 
    OR email_change = '';

-- Log the number of affected rows
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Reverted % users back to NULL token fields', affected_rows;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Auth.users token fields rollback completed at %', NOW();
END $$;

-- Commit the transaction
COMMIT;

-- Verification query (run this separately to confirm rollback)
-- SELECT 
--     COUNT(*) as total_users,
--     COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_tokens,
--     COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_tokens,
--     COUNT(CASE WHEN email_change IS NULL THEN 1 END) as null_email_changes
-- FROM auth.users;