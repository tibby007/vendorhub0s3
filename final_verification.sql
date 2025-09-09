-- Final verification that both accounts are restored
SELECT 'FINAL VERIFICATION - Both accounts should now be in the system:' as info;

SELECT 'Auth Users:' as info;
SELECT id, email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

SELECT 'Partners:' as info;
SELECT id, name, contact_email, plan_type FROM public.partners 
WHERE contact_email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY contact_email;

SELECT 'Public Users:' as info;
SELECT u.id, u.email, u.role, p.name as partner_name FROM public.users u
LEFT JOIN public.partners p ON u.partner_id = p.id
WHERE u.email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY u.email;

SELECT 'Subscribers:' as info;
SELECT user_id, email, subscription_tier, status, subscribed FROM public.subscribers 
WHERE email IN ('support@emergestack.dev', 'keenan@getmybusinesscredit.com')
ORDER BY email;

SELECT 'SUMMARY:' as info;
SELECT 
  'support@emergestack.dev' as account,
  CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'support@emergestack.dev') THEN 'YES' ELSE 'NO' END as auth_user,
  CASE WHEN EXISTS(SELECT 1 FROM public.partners WHERE contact_email = 'support@emergestack.dev') THEN 'YES' ELSE 'NO' END as partner,
  CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'support@emergestack.dev') THEN 'YES' ELSE 'NO' END as public_user,
  CASE WHEN EXISTS(SELECT 1 FROM public.subscribers WHERE email = 'support@emergestack.dev') THEN 'YES' ELSE 'NO' END as subscriber
UNION ALL
SELECT 
  'keenan@getmybusinesscredit.com' as account,
  CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'keenan@getmybusinesscredit.com') THEN 'YES' ELSE 'NO' END as auth_user,
  CASE WHEN EXISTS(SELECT 1 FROM public.partners WHERE contact_email = 'keenan@getmybusinesscredit.com') THEN 'YES' ELSE 'NO' END as partner,
  CASE WHEN EXISTS(SELECT 1 FROM public.users WHERE email = 'keenan@getmybusinesscredit.com') THEN 'YES' ELSE 'NO' END as public_user,
  CASE WHEN EXISTS(SELECT 1 FROM public.subscribers WHERE email = 'keenan@getmybusinesscredit.com') THEN 'YES' ELSE 'NO' END as subscriber;