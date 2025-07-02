-- Create permanent demo users in the users table
INSERT INTO public.users (id, email, name, role, created_at, updated_at, partner_id) VALUES
('11111111-1111-1111-1111-111111111111', 'demo-partner@vendorhub.com', 'Demo Partner Admin', 'Partner Admin', now(), now(), '22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333333', 'demo-vendor@vendorhub.com', 'Demo Vendor User', 'Vendor', now(), now(), '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now(),
  partner_id = EXCLUDED.partner_id;

-- Create a demo partner
INSERT INTO public.partners (id, name, contact_email, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222222', 'Demo Partner Company', 'demo-partner@vendorhub.com', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  contact_email = EXCLUDED.contact_email,
  updated_at = now();

-- Create a demo vendor
INSERT INTO public.vendors (id, vendor_name, contact_email, partner_admin_id, user_id, created_at, updated_at) VALUES
('44444444-4444-4444-4444-444444444444', 'Demo Vendor LLC', 'demo-vendor@vendorhub.com', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', now(), now())
ON CONFLICT (id) DO UPDATE SET
  vendor_name = EXCLUDED.vendor_name,
  contact_email = EXCLUDED.contact_email,
  partner_admin_id = EXCLUDED.partner_admin_id,
  user_id = EXCLUDED.user_id,
  updated_at = now();