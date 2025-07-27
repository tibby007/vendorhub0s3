-- Improve the signup trigger to be more robust and handle edge cases
-- This will replace the existing trigger with a better implementation

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Create improved function to handle new user signup and set up trial
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_partner_id UUID;
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Skip if this is a demo user or system user
  IF NEW.email LIKE '%demo-%' OR NEW.email LIKE '%@vendorhub.com' THEN
    RETURN NEW;
  END IF;

  -- Extract user information from metadata
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Partner Admin');

  -- Log the signup attempt
  RAISE LOG 'Creating trial setup for new user: % (ID: %)', NEW.email, NEW.id;

  -- Insert into users table with error handling
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_name,
      user_role,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- User already exists, update instead
    UPDATE public.users 
    SET 
      email = NEW.email,
      name = user_name,
      role = user_role,
      updated_at = NOW()
    WHERE id = NEW.id;
  END;

  -- Insert into partners table with trial setup
  BEGIN
    INSERT INTO public.partners (
      id,
      name,
      contact_email,
      contact_phone,
      plan_type,
      billing_status,
      trial_end,
      current_period_end,
      vendor_limit,
      storage_limit,
      storage_used,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_name,
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      'basic',
      'trialing',
      NOW() + INTERVAL '3 days',
      NOW() + INTERVAL '3 days',
      3,
      5368709120, -- 5GB
      0,
      NOW(),
      NOW()
    ) RETURNING id INTO new_partner_id;
  EXCEPTION WHEN unique_violation THEN
    -- Partner already exists, get the existing ID
    SELECT id INTO new_partner_id FROM public.partners WHERE contact_email = NEW.email;
    
    -- Update the partner record to ensure trial status
    UPDATE public.partners 
    SET 
      name = user_name,
      plan_type = 'basic',
      billing_status = 'trialing',
      trial_end = NOW() + INTERVAL '3 days',
      current_period_end = NOW() + INTERVAL '3 days',
      updated_at = NOW()
    WHERE contact_email = NEW.email;
  END;

  -- Update users table with partner_id
  UPDATE public.users 
  SET partner_id = new_partner_id
  WHERE id = NEW.id;

  -- Create subscriber record for trial
  BEGIN
    INSERT INTO public.subscribers (
      email,
      user_id,
      stripe_customer_id,
      subscribed,
      subscription_tier,
      subscription_end,
      price_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.email,
      NEW.id,
      NULL,
      false, -- Trial users are NOT subscribed
      'basic',
      NOW() + INTERVAL '3 days',
      NULL,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- Subscriber already exists, update trial status
    UPDATE public.subscribers 
    SET 
      user_id = NEW.id,
      subscribed = false,
      subscription_tier = 'basic',
      subscription_end = NOW() + INTERVAL '3 days',
      updated_at = NOW()
    WHERE email = NEW.email;
  END;

  RAISE LOG 'Successfully created trial setup for user: %', NEW.email;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error creating trial setup for user %: %', NEW.email, SQLERRM;
  RETURN NEW; -- Don't fail the signup, just log the error
END;
$$;

-- Create trigger to automatically set up trial for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup(); 