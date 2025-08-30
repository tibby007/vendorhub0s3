import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    console.log('[HEALTH-CHECK] Function called');
    
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
        hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        hasStripeKey: !!Deno.env.get("STRIPE_SECRET_KEY")
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[HEALTH-CHECK] Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});