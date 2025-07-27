# Supabase Edge Functions Deployment Guide

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Access to your Supabase project
- Environment variables set in your Supabase dashboard

## Required Environment Variables in Supabase Dashboard

Go to your Supabase project → Settings → Edge Functions → Secrets, and add:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deploy Edge Functions

1. Link your project (if not already linked):
```bash
supabase link --project-ref your-project-ref
```

2. Deploy all functions:
```bash
supabase functions deploy
```

3. Or deploy specific functions:
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
supabase functions deploy check-subscription
```

## Verify Deployment

1. Check function status:
```bash
supabase functions list
```

2. Test the create-checkout function:
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/create-checkout \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_test", "tier": "basic"}'
```

## Important Notes

- The `create-checkout` function requires authentication (user must be logged in)
- The function expects: `priceId`, `tier`, and optional `isAnnual` in the request body
- Valid tier values are: 'basic', 'pro', 'premium' (lowercase)
- The function will create a 3-day trial for new subscriptions

## Troubleshooting

If you get a 404 error:
1. Verify the function is deployed: `supabase functions list`
2. Check the function logs: `supabase functions logs create-checkout`
3. Ensure environment variables are set in Supabase dashboard
4. Verify your Netlify environment variables match your Supabase project