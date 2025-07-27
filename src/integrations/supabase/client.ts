// Supabase client configuration using environment variables
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration (public keys - safe to include in code)
const SUPABASE_URL = 'https://ewxsolozmcjdoqyydlcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eHNvbG96bWNqZG9xeXlkbGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NTk3ODEsImV4cCI6MjA2NjAzNTc4MX0.-qgK0wSFhmId-3_SqpEpXB9QiMMFt5uO3YMRyEIuTUQ';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);