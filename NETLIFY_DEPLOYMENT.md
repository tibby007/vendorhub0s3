# Netlify Deployment Guide for VendorHub Connect Portal

This guide explains how to deploy the VendorHub Connect Portal to Netlify with Supabase Edge Functions integration.

## Prerequisites

1. A Netlify account
2. A Supabase project with Edge Functions deployed
3. GitHub repository connected to Netlify

## Quick Start

### 1. Environment Variables

Add these environment variables in your Netlify dashboard (Site settings > Environment variables):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Deploy to Netlify

1. Push your code to GitHub
2. In Netlify, create a new site from Git
3. Connect to your GitHub repository
4. Deploy settings are automatically configured via `netlify.toml`

## How It Works

### Supabase Edge Functions Integration

The application uses Supabase Edge Functions for:
- Creating checkout sessions (`create-checkout`)
- Checking subscription status (`check-subscription`)
- Processing Stripe webhooks (`stripe-webhook`)

For Netlify deployment, we've implemented a proxy system:

1. **Client-side**: Uses `invokeFunction()` utility that detects the deployment environment
2. **Netlify Proxy**: Routes calls through `/functions/v1/*` to the Netlify Function
3. **Supabase**: The Netlify Function forwards requests to actual Supabase Edge Functions

### File Structure

```
netlify.toml                 # Netlify configuration
netlify/functions/           
  supabase-proxy.js         # Proxy function for Edge Functions
src/utils/
  netlifyFunctions.ts       # Client utility for function invocation
```

## Configuration Details

### netlify.toml
- Sets Node.js version to 18
- Configures build command and publish directory
- Sets up redirects for Edge Functions
- Adds security headers

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key (safe for client-side)

## Testing

1. **Local Development**
   ```bash
   npm run dev
   ```
   Functions will call Supabase directly

2. **Deploy Preview**
   - Push to a feature branch
   - Netlify creates a deploy preview
   - Test all Edge Function calls

## Troubleshooting

### Functions Not Working
1. Check environment variables in Netlify dashboard
2. Verify Supabase Edge Functions are deployed
3. Check Netlify Function logs

### Build Failures
1. Ensure Node.js 18 is specified in netlify.toml
2. Check for missing dependencies
3. Verify environment variables are set

### CORS Issues
The proxy function includes CORS headers. If issues persist:
1. Check Supabase Edge Function CORS settings
2. Verify domain allowlist in Supabase dashboard

## Monitoring

- **Netlify Functions**: View logs in Netlify dashboard > Functions tab
- **Supabase Edge Functions**: Check logs in Supabase dashboard
- **Build logs**: Available in Netlify dashboard for each deploy

## Security Notes

- Environment variables are securely stored in Netlify
- Supabase anon key is safe for client-side use (with RLS policies)
- Never commit sensitive keys to the repository
- Use Netlify's environment variable UI for all secrets