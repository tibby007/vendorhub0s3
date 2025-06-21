
-- Add business phone column to customers table
ALTER TABLE public.customers 
ADD COLUMN biz_phone TEXT;

-- Update the validation schema comment for reference
COMMENT ON COLUMN public.customers.biz_phone IS 'Business phone number, separate from personal phone';
