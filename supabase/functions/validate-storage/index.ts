import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string, maxRequests = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract user IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Apply rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        message: 'Too many requests. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { partnerId, fileSize, fileName, mimeType } = await req.json();

    // Validate input parameters
    if (!partnerId || !fileSize || fileSize <= 0) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        message: 'Invalid request parameters' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Additional file validation on server side
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (mimeType && !allowedMimeTypes.includes(mimeType)) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        message: 'File type not allowed' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Server-side storage validation
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('storage_used, storage_limit')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      console.error('Partner lookup error:', partnerError);
      return new Response(JSON.stringify({ 
        allowed: false, 
        message: 'Partner not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const canUpload = (partner.storage_used + fileSize) <= partner.storage_limit;

    if (!canUpload) {
      return new Response(JSON.stringify({ 
        allowed: false, 
        message: `Storage limit exceeded. Current usage: ${Math.round(partner.storage_used / 1024 / 1024)}MB, Limit: ${Math.round(partner.storage_limit / 1024 / 1024)}MB` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log the validation request for audit purposes
    await supabase
      .from('storage_audit_log')
      .insert({
        partner_id: partnerId,
        action: 'validation_check',
        file_name: fileName || 'unknown',
        file_size: fileSize,
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    return new Response(JSON.stringify({ 
      allowed: true,
      message: 'Upload validated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Storage validation error:', error);
    return new Response(JSON.stringify({ 
      allowed: false, 
      message: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});