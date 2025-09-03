-- Migration to add Keenan user as Enterprise partner

-- Create partner record
DO $$
DECLARE
  partner_uuid UUID;
BEGIN
  INSERT INTO public.partners (
    user_id,
    name,
    contact_email,
    plan_type,
    billing_status,
    vendor_limit,
    storage_limit
  ) VALUES (
    '51825cfc-3574-4a5a-92a0-4391d3000e3b',
    'Keenan Office',
    'keenan@getmybusinesscredit.com',
    'enterprise',
    'active',
    999,
    99999999999
  ) ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_email = EXCLUDED.contact_email,
    plan_type = EXCLUDED.plan_type,
    billing_status = EXCLUDED.billing_status,
    vendor_limit = EXCLUDED.vendor_limit,
    storage_limit = EXCLUDED.storage_limit
  RETURNING id INTO partner_uuid;

  -- Create user record linking to partner
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    partner_id
  ) VALUES (
    '51825cfc-3574-4a5a-92a0-4391d3000e3b',
    'keenan@getmybusinesscredit.com',
    'Keenan',
    'Partner Admin',
    partner_uuid
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    partner_id = EXCLUDED.partner_id;
END $$;