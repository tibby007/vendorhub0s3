import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables.');
  console.error('Please set the following environment variables in Netlify:');
  console.error('- VITE_SUPABASE_URL: Your Supabase project URL');
  console.error('- VITE_SUPABASE_ANON_KEY: Your Supabase anon key');
  throw new Error('Missing required Supabase environment variables. Please configure them in your deployment settings.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database type definitions for better TypeScript support
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          subscription_tier: 'solo' | 'pro' | 'enterprise';
          brand_colors: any;
          logo_url: string | null;
          contact_info: any;
          settings: any;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subscription_tier?: 'solo' | 'pro' | 'enterprise';
          brand_colors?: any;
          logo_url?: string | null;
          contact_info?: any;
          settings?: any;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subscription_tier?: 'solo' | 'pro' | 'enterprise';
          brand_colors?: any;
          logo_url?: string | null;
          contact_info?: any;
          settings?: any;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
  };
};