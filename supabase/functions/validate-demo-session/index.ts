import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoSessionData {
  sessionId: string;
  userRole: string;
  startTime: number;
  lastActivity: number;
  userData: any;
  events: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, ipAddress } = await req.json()
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'No session ID provided'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
    const now = Date.now()

    // Here we would normally check a database table for demo sessions
    // For now, we'll validate based on timestamp in the sessionId itself
    
    // Extract timestamp from session ID (assuming format: timestamp_randomstring)
    const sessionParts = sessionId.split('_')
    if (sessionParts.length < 2) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'Invalid session format'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const sessionStartTime = parseInt(sessionParts[0])
    if (isNaN(sessionStartTime)) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'Invalid session timestamp'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const sessionAge = now - sessionStartTime
    const timeRemaining = SESSION_DURATION - sessionAge

    // Log the session validation attempt
    try {
      await supabase.functions.invoke('log-security-event', {
        body: {
          eventType: 'demo_session_validation',
          details: JSON.stringify({
            sessionId: sessionId.substring(0, 16) + '...',
            timeRemaining: Math.max(0, timeRemaining),
            ipAddress: ipAddress || 'unknown',
            valid: timeRemaining > 0
          }),
          ipAddress: ipAddress || 'unknown'
        }
      })
    } catch (logError) {
      console.warn('Failed to log session validation:', logError)
    }

    if (timeRemaining <= 0) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: 'Session expired',
          timeRemaining: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({
        valid: true,
        timeRemaining: Math.max(0, timeRemaining),
        warningThreshold: 2 * 60 * 1000 // 2 minutes
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in validate-demo-session function:', error)
    
    return new Response(
      JSON.stringify({
        valid: false,
        reason: 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})