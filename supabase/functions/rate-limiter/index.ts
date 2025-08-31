import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  reset_time: string;
  remaining: number;
  retry_after?: number;
}

interface RateLimitConfig {
  limit?: number;
  window?: string; // '1m', '1h', etc. (currently only supports '1m')
  skip_authenticated?: boolean;
}

const logStep = (step: string, details?: any) => {
  console.log(`[RATE-LIMITER] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Get client IP address from various headers
const getClientIP = (request: Request): string => {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Try headers in order of preference
  if (cfConnectingIP) return cfConnectingIP.split(',')[0].trim();
  if (xRealIP) return xRealIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  // Fallback - won't work in edge functions but good for local testing
  return '127.0.0.1';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  // Initialize Supabase with service role for rate limiting operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    logStep(`Rate limiter called: ${method} ${path}`);

    if (path.includes('/check') && method === 'POST') {
      return await handleRateLimitCheck(req, supabase, corsHeaders);
    }
    else if (path.includes('/cleanup') && method === 'POST') {
      return await handleCleanup(supabase, corsHeaders);
    }
    else if (path.includes('/middleware') && method === 'POST') {
      return await handleMiddlewareCheck(req, supabase, corsHeaders);
    }
    else {
      return new Response(JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: [
          "POST /check - Check rate limit for user/IP",
          "POST /middleware - Middleware rate limit check", 
          "POST /cleanup - Clean up old rate limit records"
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
      status: 500,
    });
  }
});

async function handleRateLimitCheck(
  req: Request,
  supabase: any,
  corsHeaders: any
) {
  const requestBody = await req.json();
  const { user_id, limit = 100 } = requestBody;
  
  const clientIP = getClientIP(req);
  
  logStep("Checking rate limit", { 
    user_id: user_id || 'anonymous', 
    ip: clientIP,
    limit 
  });

  // Call the database function to check/update rate limit
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: user_id || null,
    p_ip_address: user_id ? null : clientIP,
    p_limit: limit
  });

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  const result: RateLimitResult = data;
  
  logStep("Rate limit result", result);

  return new Response(JSON.stringify({
    success: true,
    rate_limit: result
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Add standard rate limit headers
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.reset_time).getTime().toString(),
      ...(result.retry_after && { "Retry-After": Math.ceil(result.retry_after).toString() })
    },
    status: result.allowed ? 200 : 429,
  });
}

async function handleMiddlewareCheck(
  req: Request,
  supabase: any,
  corsHeaders: any
) {
  const requestBody = await req.json();
  const { 
    user_id,
    config = {} as RateLimitConfig
  } = requestBody;
  
  const { limit = 100, skip_authenticated = false } = config;
  
  // Skip rate limiting for authenticated users if configured
  if (skip_authenticated && user_id) {
    return new Response(JSON.stringify({
      success: true,
      rate_limit: {
        allowed: true,
        count: 0,
        limit: limit,
        remaining: limit,
        reset_time: new Date(Date.now() + 60000).toISOString(),
        skipped: true,
        reason: "authenticated_user_skip"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const clientIP = getClientIP(req);
  
  logStep("Middleware rate limit check", { 
    user_id: user_id || 'anonymous',
    ip: clientIP,
    limit,
    skip_authenticated
  });

  // Call the database function
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_user_id: user_id || null,
    p_ip_address: user_id ? null : clientIP,
    p_limit: limit
  });

  if (error) {
    throw new Error(`Middleware rate limit check failed: ${error.message}`);
  }

  const result: RateLimitResult = data;

  if (!result.allowed) {
    logStep("Rate limit exceeded", { 
      user_id: user_id || 'anonymous',
      count: result.count,
      limit: result.limit
    });

    return new Response(JSON.stringify({
      success: false,
      error: "Rate limit exceeded",
      message: `API rate limit exceeded. Maximum ${result.limit} requests per minute allowed.`,
      rate_limit: result,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(result.reset_time).getTime().toString(),
        "Retry-After": Math.ceil(result.retry_after || 60).toString()
      },
      status: 429,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    rate_limit: result
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.reset_time).getTime().toString()
    },
    status: 200,
  });
}

async function handleCleanup(
  supabase: any,
  corsHeaders: any
) {
  logStep("Starting rate limit cleanup");

  const { data: deletedCount, error } = await supabase.rpc('cleanup_old_rate_limits');

  if (error) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }

  logStep("Cleanup completed", { deleted_records: deletedCount });

  return new Response(JSON.stringify({
    success: true,
    message: "Rate limit cleanup completed",
    deleted_records: deletedCount,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}