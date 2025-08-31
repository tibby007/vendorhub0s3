// Utility to handle Supabase Edge Functions for Netlify deployment
import { supabase } from '@/integrations/supabase/client';

// Check if we're running on Netlify
const isNetlify = window.location.hostname !== 'localhost' && 
                  window.location.hostname !== '127.0.0.1' &&
                  !window.location.hostname.includes('supabase');

// Temporary: Log environment detection
console.log('[netlifyFunctions] Environment detection:', {
  hostname: window.location.hostname,
  isNetlify,
  willUseProxy: isNetlify
});

interface FunctionOptions {
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export async function invokeFunction(functionName: string, options?: FunctionOptions) {
  // Allow forcing direct Supabase calls via query parameter for debugging
  const urlParams = new URLSearchParams(window.location.search);
  const forceDirect = urlParams.get('direct') === 'true';
  
  if (isNetlify && !forceDirect) {
    console.log(`[netlifyFunctions] Calling ${functionName} via Netlify proxy`);
    // On Netlify, route through our proxy function
    const response = await fetch(`/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': options?.headers?.Authorization || '',
        ...options?.headers
      },
      body: JSON.stringify(options?.body || {})
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[netlifyFunctions] Proxy error for ${functionName}:`, error);
      throw new Error(error || `Function ${functionName} failed`);
    }

    return { data: await response.json(), error: null };
  } else {
    console.log(`[netlifyFunctions] Calling ${functionName} directly via Supabase`);
    // In development or direct Supabase hosting, use the regular invoke
    return supabase.functions.invoke(functionName, options);
  }
}