// Secure CORS configuration for edge functions
// This replaces the overly permissive "*" origin with environment-specific allowed origins

const getAllowedOrigins = (): string[] => {
  const allowedOriginsEnv = Deno.env.get("ALLOWED_ORIGINS");
  
  if (allowedOriginsEnv) {
    return allowedOriginsEnv.split(",").map(origin => origin.trim());
  }
  
  // Default fallback origins (should be configured via environment)
  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:8080",  // Claude Code dev server
    "http://localhost:3000", 
    "https://vendorhub-connect-portal.netlify.app",
    "https://vendorhubos.com"
  ];
  
  console.warn("ALLOWED_ORIGINS environment variable not set, using default origins");
  return defaultOrigins;
};

export const getCorsHeaders = (requestOrigin?: string | null) => {
  const allowedOrigins = getAllowedOrigins();
  
  // Check if request origin is allowed
  const origin = requestOrigin && allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : allowedOrigins[0]; // Default to first allowed origin
  
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
    "Access-Control-Max-Age": "86400", // 24 hours
    "Vary": "Origin"
  };
};

export const handleCorsPrelight = (request: Request): Response => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
  return new Response(null, { 
    status: 204,
    headers: corsHeaders 
  });
};