
-- Add business phone column to customers table if it doesn't exist
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS biz_phone TEXT;

-- Update the validation schema comment for reference
COMMENT ON COLUMN public.customers.biz_phone IS 'Business phone number, separate from personal phone';
