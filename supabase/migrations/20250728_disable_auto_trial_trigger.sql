-- Disable the automatic trial creation trigger that's interfering with Stripe webhook
-- This trigger was creating Basic trials for all users before the webhook could set the correct tier

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Create a minimal signup function that only creates user record without trial
CREATE OR REPLACE FUNCTION public.handle_new_user_minimal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Skip demo users
  IF NEW.email LIKE '%demo-%' OR NEW.email LIKE '%@vendorhub.com' THEN
    RETURN NEW;
  END IF;

  -- Only insert into users table, let Stripe webhook handle subscription data
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'Partner Admin'),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create minimal trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_minimal();