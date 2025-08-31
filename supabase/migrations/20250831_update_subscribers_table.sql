-- Add missing fields to subscribers table for trial functionality
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE;

-- Add status field for better subscription tracking
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'inactive';

-- Add trial_end field for explicit trial tracking
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- Update existing policies to allow super admin access
DROP POLICY IF EXISTS "Super admins can access all subscribers" ON public.subscribers;

CREATE POLICY "Super admins can access all subscribers" ON public.subscribers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'support@emergestack.dev' OR
        auth.users.raw_user_meta_data->>'role' = 'Super Admin'
      )
    )
  );

-- Create function to automatically set trial_active based on trial_end
CREATE OR REPLACE FUNCTION update_trial_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If trial_end is set and in the future, mark trial as active
  IF NEW.trial_end IS NOT NULL AND NEW.trial_end > NOW() THEN
    NEW.trial_active = TRUE;
  ELSIF NEW.trial_end IS NOT NULL AND NEW.trial_end <= NOW() THEN
    NEW.trial_active = FALSE;
  END IF;
  
  -- Also update based on subscription_end if trial_end not set
  IF NEW.trial_end IS NULL AND NEW.subscription_end IS NOT NULL THEN
    IF NEW.subscription_end > NOW() AND NOT NEW.subscribed THEN
      NEW.trial_active = TRUE;
    ELSE
      NEW.trial_active = FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update trial status
CREATE TRIGGER update_subscriber_trial_status 
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION update_trial_status();