-- AUTO USER CREATION TRIGGER
-- This creates a trigger that automatically sets up new users when they sign up

-- 1. Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  trial_end_date TIMESTAMP WITH TIME ZONE;
  partner_record_id UUID;
BEGIN
  -- Skip if this is the super admin
  IF NEW.email = 'support@emergestack.dev' THEN
    RETURN NEW;
  END IF;

  -- Set trial end date to 3 days from now
  trial_end_date := NOW() + INTERVAL '3 days';

  -- Create partner record with trial
  INSERT INTO public.partners (
    name,
    contact_email,
    plan_type,
    billing_status,
    trial_end,
    current_period_end,
    vendor_limit,
    storage_limit,
    storage_used
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'basic',
    'trialing',
    trial_end_date,
    trial_end_date,
    1,
    5368709120,
    0
  ) ON CONFLICT (contact_email) DO UPDATE SET
    name = EXCLUDED.name,
    trial_end = EXCLUDED.trial_end,
    current_period_end = EXCLUDED.current_period_end
  RETURNING id INTO partner_record_id;

  -- Get the partner ID if it was an update
  IF partner_record_id IS NULL THEN
    SELECT id INTO partner_record_id 
    FROM public.partners 
    WHERE contact_email = NEW.email;
  END IF;

  -- Create users table record
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    partner_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'Partner Admin',
    partner_record_id
  ) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    partner_id = EXCLUDED.partner_id;

  -- Create subscriber record with trial
  INSERT INTO public.subscribers (
    user_id,
    email,
    subscribed,
    subscription_tier,
    subscription_end,
    trial_end,
    trial_active
  ) VALUES (
    NEW.id,
    NEW.email,
    false,
    'Basic',
    trial_end_date,
    trial_end_date,
    true
  ) ON CONFLICT (email) DO UPDATE SET
    subscription_end = EXCLUDED.subscription_end,
    trial_end = EXCLUDED.trial_end,
    trial_active = EXCLUDED.trial_active;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- 3. Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO authenticated;

SELECT 'AUTO USER CREATION TRIGGER INSTALLED - New signups will automatically get 3-day trials!' as status;