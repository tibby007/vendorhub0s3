-- Add foreign key constraint to users table after partners table is created
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_partner_id 
FOREIGN KEY (partner_id) REFERENCES public.partners(id);