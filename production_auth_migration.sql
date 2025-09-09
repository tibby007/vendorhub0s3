-- Production Migration Script: Fix NULL Token Fields in auth.users
-- Date: 2025-01-09
-- Purpose: Resolve authentication scanning errors caused by NULL string fields
-- 
-- IMPORTANT: This script should be run during a maintenance window
-- and after creating a database backup.

-- Begin transaction to ensure atomicity
BEGIN;

-- Log the migration start
DO $$
BEGIN
    RAISE NOTICE 'Starting auth.users NULL token fields migration at %', NOW();
END $$;

-- Check current state before migration
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM auth.users 
    WHERE confirmation_token IS NULL 
       OR recovery_token IS NULL 
       OR email_change_token_new IS NULL 
       OR reauthentication_token IS NULL 
       OR email_change_token_current IS NULL 
       OR email_change IS NULL;
    
    RAISE NOTICE 'Found % users with NULL token fields before migration', null_count;
END $$;

-- Update NULL token fields to empty strings
-- This prevents Go scanning errors in the auth service
UPDATE auth.users 
SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    email_change = COALESCE(email_change, '')
WHERE 
    confirmation_token IS NULL 
    OR recovery_token IS NULL 
    OR email_change_token_new IS NULL 
    OR reauthentication_token IS NULL 
    OR email_change_token_current IS NULL 
    OR email_change IS NULL;

-- Log the number of affected rows
DO $$
DECLARE
    affected_rows INTEGER;
BEGIN
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % users with NULL token fields', affected_rows;
END $$;

-- Verify the migration results
DO $$
DECLARE
    remaining_nulls INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_nulls
    FROM auth.users 
    WHERE confirmation_token IS NULL 
       OR recovery_token IS NULL 
       OR email_change_token_new IS NULL 
       OR reauthentication_token IS NULL 
       OR email_change_token_current IS NULL 
       OR email_change IS NULL;
    
    IF remaining_nulls > 0 THEN
        RAISE EXCEPTION 'Migration failed: % users still have NULL token fields', remaining_nulls;
    ELSE
        RAISE NOTICE 'Migration successful: No NULL token fields remaining';
    END IF;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Auth.users NULL token fields migration completed successfully at %', NOW();
END $$;

-- Commit the transaction
COMMIT;

-- Final verification query (run this separately to confirm)
-- SELECT 
--     COUNT(*) as total_users,
--     COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_tokens,
--     COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_tokens,
--     COUNT(CASE WHEN email_change = '' THEN 1 END) as empty_email_changes
-- FROM auth.users;