// Unified browser Supabase client factory
// Reuse the canonical client that already handles env fallbacks and diagnostics
import { supabase } from '@/integrations/supabase/client';

export function createBrowserClient() {
  return supabase;
}