-- Create automatic trial setup for new signups
-- This trigger will create users and partners records automatically when someone signs up

-- Function to handle new user signup and set up trial
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_partner_id UUID;
BEGIN
  -- Insert into users table
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
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'Partner Admin',
    NOW(),
    NOW()
  );

  -- Insert into partners table with trial setup
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
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
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

  -- Update users table with partner_id
  UPDATE public.users 
  SET partner_id = new_partner_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically set up trial for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();