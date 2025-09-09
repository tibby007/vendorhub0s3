-- Create auth users for production login
-- This migration creates the missing auth users that are causing login failures

-- Create support@emergestack.dev user
DO $$
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'support@emergestack.dev') THEN
    -- Create the auth user using admin function
    PERFORM auth.admin_create_user(
      email => 'support@emergestack.dev',
      password => 'TempPassword123!',
      email_confirm => true,
      user_metadata => '{"name": "EmergeStack Admin", "role": "superadmin"}'
    );
  END IF;
END $$;

-- Create keenan@getmybusinesscredit.com user
DO $$
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'keenan@getmybusinesscredit.com') THEN
    -- Create the auth user using admin function
    PERFORM auth.admin_create_user(
      email => 'keenan@getmybusinesscredit.com',
      password => 'TempPassword123!',
      email_confirm => true,
      user_metadata => '{"name": "Keenan Business Credit", "role": "Partner Admin"}'
    );
  END IF;
END $$;