import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[DATABASE-SETUP] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Check for admin secret key
    const adminSecret = req.headers.get("X-Admin-Secret") || url.searchParams.get("admin_secret");
    const expectedSecret = "emergestack_admin_2024";
    
    if (adminSecret !== expectedSecret) {
      throw new Error("Admin access required");
    }

    logStep(`Database setup requested: ${method} ${path}`);

    if (path.includes('/setup-rate-limiting') && method === 'POST') {
      return await handleRateLimitingSetup(supabase, corsHeaders);
    }
    else {
      return new Response(JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: [
          "POST /setup-rate-limiting - Set up rate limiting tables and functions"
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

  } catch (error) {
    logStep("ERROR", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleRateLimitingSetup(supabase: any, corsHeaders: any) {
  logStep("Setting up rate limiting infrastructure");

  const results = [];

  try {
    // Create rate_limits table
    logStep("Creating rate_limits table");
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.rate_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        ip_address INET,
        count INTEGER NOT NULL DEFAULT 0,
        last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_or_ip UNIQUE NULLS NOT DISTINCT (user_id, ip_address)
      );
    `;
    
    const { error: tableError } = await supabase
      .from('rate_limits')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('does not exist')) {
      // Table doesn't exist, create it via direct SQL approach
      logStep("Creating rate_limits table via migration approach");
      results.push({ step: 'create_table', status: 'skipped', message: 'Use migration file CREATE_RATE_LIMITING.sql manually' });
    } else {
      logStep("rate_limits table already exists");
      results.push({ step: 'create_table', status: 'exists' });
    }

    // Create indexes
    logStep("Creating indexes");
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON public.rate_limits(ip_address);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_last_reset ON public.rate_limits(last_reset);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    if (indexError) throw new Error(`Index creation failed: ${indexError.message}`);
    results.push({ step: 'create_indexes', status: 'success' });

    // Enable RLS
    logStep("Enabling RLS");
    const rlsSQL = `
      ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
      CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
        FOR ALL USING (
          auth.role() = 'service_role' OR
          EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev')
        );
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) throw new Error(`RLS setup failed: ${rlsError.message}`);
    results.push({ step: 'setup_rls', status: 'success' });

    // Grant permissions
    logStep("Granting permissions");
    const permissionsSQL = `
      GRANT ALL ON public.rate_limits TO service_role;
      GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO authenticated;
    `;
    
    const { error: permError } = await supabase.rpc('exec_sql', { sql: permissionsSQL });
    if (permError) throw new Error(`Permission grants failed: ${permError.message}`);
    results.push({ step: 'grant_permissions', status: 'success' });

    // Create rate limiting function
    logStep("Creating check_rate_limit function");
    const functionSQL = `
      CREATE OR REPLACE FUNCTION check_rate_limit(
        p_user_id UUID DEFAULT NULL,
        p_ip_address INET DEFAULT NULL,
        p_limit INTEGER DEFAULT 100
      )
      RETURNS JSON AS $$
      DECLARE
        current_record public.rate_limits%ROWTYPE;
        current_time TIMESTAMP WITH TIME ZONE := NOW();
        reset_threshold INTERVAL := '1 minute';
        new_count INTEGER;
      BEGIN
        SELECT * INTO current_record
        FROM public.rate_limits
        WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
           OR (p_user_id IS NULL AND ip_address = p_ip_address)
        FOR UPDATE;
        
        IF current_record IS NULL THEN
          INSERT INTO public.rate_limits (user_id, ip_address, count, last_reset)
          VALUES (p_user_id, p_ip_address, 1, current_time)
          RETURNING * INTO current_record;
          
          RETURN json_build_object(
            'allowed', true,
            'count', 1,
            'limit', p_limit,
            'reset_time', current_time + reset_threshold,
            'remaining', p_limit - 1
          );
        END IF;
        
        IF current_time - current_record.last_reset > reset_threshold THEN
          new_count := 1;
          UPDATE public.rate_limits
          SET count = new_count,
              last_reset = current_time,
              updated_at = current_time
          WHERE id = current_record.id;
        ELSE
          new_count := current_record.count + 1;
          UPDATE public.rate_limits
          SET count = new_count,
              updated_at = current_time
          WHERE id = current_record.id;
        END IF;
        
        IF new_count > p_limit THEN
          RETURN json_build_object(
            'allowed', false,
            'count', new_count,
            'limit', p_limit,
            'reset_time', current_record.last_reset + reset_threshold,
            'remaining', 0,
            'retry_after', EXTRACT(EPOCH FROM ((current_record.last_reset + reset_threshold) - current_time))
          );
        ELSE
          RETURN json_build_object(
            'allowed', true,
            'count', new_count,
            'limit', p_limit,
            'reset_time', current_record.last_reset + reset_threshold,
            'remaining', p_limit - new_count
          );
        END IF;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: functionSQL });
    if (functionError) throw new Error(`Function creation failed: ${functionError.message}`);
    results.push({ step: 'create_function', status: 'success' });

    // Create cleanup function
    logStep("Creating cleanup function");
    const cleanupSQL = `
      CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        DELETE FROM public.rate_limits
        WHERE last_reset < NOW() - INTERVAL '1 hour';
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: cleanupError } = await supabase.rpc('exec_sql', { sql: cleanupSQL });
    if (cleanupError) throw new Error(`Cleanup function creation failed: ${cleanupError.message}`);
    results.push({ step: 'create_cleanup_function', status: 'success' });

    // Grant execute permissions
    logStep("Granting execute permissions");
    const executeSQL = `
      GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, INET, INTEGER) TO service_role;
      GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO service_role;
    `;
    
    const { error: executeError } = await supabase.rpc('exec_sql', { sql: executeSQL });
    if (executeError) throw new Error(`Execute permission grants failed: ${executeError.message}`);
    results.push({ step: 'grant_execute_permissions', status: 'success' });

    logStep("Rate limiting setup completed successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Rate limiting infrastructure set up successfully",
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Setup failed", { error: error.message });
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      partial_results: results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}