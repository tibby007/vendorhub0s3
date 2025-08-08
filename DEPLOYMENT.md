# VendorHub OS Deployment Guide

## Required Environment Variables

To deploy VendorHub OS, you need to set the following environment variables in your deployment platform:

### Netlify Environment Variables

1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
VITE_APP_URL=https://your-site-name.netlify.app
```

### Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to Settings → API
3. Copy your Project URL and anon/public key
4. Set up your database using the migrations in `supabase/migrations/`

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your publishable key from the Stripe dashboard
3. Configure your payment products with the pricing IDs used in the code

### Local Development

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
VITE_APP_URL=http://localhost:5173
```

## Deployment Steps

1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Set the environment variables in Netlify
4. Deploy!

## Troubleshooting

### "Missing required Supabase environment variables" Error
- Make sure you've set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify
- Variables must be prefixed with `VITE_` to be accessible in the frontend

### "Payment not allowed" Error
- This is fixed in the latest netlify.toml with `payment=*` in Permissions-Policy
- Make sure your site is served over HTTPS for Stripe to work

### Build Fails
- Check that Node.js version is set to 18+ in Netlify
- Ensure all dependencies are properly installed

## Security Notes

- Never commit actual environment variables to the repository
- Use different Stripe keys for development (test) and production (live)
- Supabase anon keys are safe to expose in frontend code
- Service role keys should ONLY be used in Netlify Functions, never in frontend