import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const requestBody = await req.json()
    const { event_type, user_id, details, ip_address, user_agent, timestamp } = requestBody

    // Get client IP if not provided
    const clientIP = ip_address || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Log the security event
    const { error } = await supabase
      .from('security_audit_log')
      .insert({
        event_type,
        user_id: user_id || null,
        old_value: details || null,
        performed_by: user_id || null,
        ip_address: clientIP,
        user_agent: user_agent || req.headers.get('user-agent') || 'unknown'
      })

    if (error) {
      console.error('Error inserting security log:', error)
      throw error
    }

    // Check for suspicious patterns and alert if needed
    if (event_type === 'suspicious_activity' || event_type === 'login_failure') {
      // In production, you might want to send alerts here
      console.log('Security alert:', { event_type, details, ip_address: clientIP })
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in log-security-event function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})