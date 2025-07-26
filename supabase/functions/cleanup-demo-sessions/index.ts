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

    // Clean up demo leads older than 30 days with no activity
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: expiredLeads, error: selectError } = await supabase
      .from('demo_leads')
      .select('id, email, session_id')
      .lt('last_activity_at', thirtyDaysAgo.toISOString())

    if (selectError) {
      throw selectError
    }

    if (expiredLeads && expiredLeads.length > 0) {
      const { error: deleteError } = await supabase
        .from('demo_leads')
        .delete()
        .in('id', expiredLeads.map(lead => lead.id))

      if (deleteError) {
        throw deleteError
      }

      // Log the cleanup
      const { error: logError } = await supabase
        .from('security_audit_log')
        .insert({
          event_type: 'demo_session_cleanup',
          old_value: `Cleaned up ${expiredLeads.length} expired demo sessions`,
          performed_by: null,
          ip_address: req.headers.get('x-forwarded-for') || 'system'
        })

      if (logError) {
        console.error('Error logging cleanup:', logError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Cleaned up ${expiredLeads.length} expired demo sessions`,
          cleaned_sessions: expiredLeads.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'No expired demo sessions found',
        cleaned_sessions: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in cleanup-demo-sessions function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})