// Supabase client configuration using environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration - must use environment variables
let SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
let SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Production-only fallback to avoid "No API key found in request" if envs are missing
const isProd = typeof window !== 'undefined'
  && !!window.location?.hostname
  && !['localhost', '127.0.0.1'].includes(window.location.hostname);

if (isProd && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.warn('[Supabase] Missing VITE envs in production; using fallback prod credentials');
  SUPABASE_URL = 'https://kfdlxorqopnibuzexoko.supabase.co';
  SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmZGx4b3Jxb3BuaWJ1emV4b2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjI2OTYsImV4cCI6MjA3MDIzODY5Nn0.d3Q4d75ZOLIDSOVrx6TyQU3dj3ZLOddeMTbIg2VM01Y';
}

// Add masked diagnostics to confirm runtime configuration
const mask = (k?: string) => (k ? `${k.slice(0, 6)}...${k.slice(-4)}` : 'undefined');
console.log('[Supabase] URL:', SUPABASE_URL || 'undefined');
console.log('[Supabase] Anon key present:', !!SUPABASE_ANON_KEY, 'value:', mask(SUPABASE_ANON_KEY));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);