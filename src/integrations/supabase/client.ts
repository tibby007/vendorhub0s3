// Supabase client configuration using environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration - must use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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