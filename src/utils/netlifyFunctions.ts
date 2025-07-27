// Utility to handle Supabase Edge Functions for Netlify deployment
import { supabase } from '@/integrations/supabase/client';

// Check if we're running on Netlify
const isNetlify = window.location.hostname !== 'localhost' && 
                  window.location.hostname !== '127.0.0.1' &&
                  !window.location.hostname.includes('supabase');

export async function invokeFunction(functionName: string, options?: any) {
  if (isNetlify) {
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
      throw new Error(error || `Function ${functionName} failed`);
    }

    return { data: await response.json(), error: null };
  } else {
    // In development or direct Supabase hosting, use the regular invoke
    return supabase.functions.invoke(functionName, options);
  }
}