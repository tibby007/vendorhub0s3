import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Starting trial dates fix...')

    // Step 1: Check current state
    const { data: currentIssues, error: checkError } = await supabaseClient
      .from('partners')
      .select(`
        contact_email,
        billing_status,
        trial_end,
        subscribers!inner(email, trial_end, subscription_end, trial_active, subscribed)
      `)
      .eq('billing_status', 'trialing')
      .or('trial_end.is.null,subscribers.trial_end.is.null')

    if (checkError) {
      console.error('Error checking current issues:', checkError)
      throw checkError
    }

    console.log(`Found ${currentIssues?.length || 0} users with missing trial dates`)

    // Step 2: Fix partners table - set trial_end to 3 days from now for missing dates
    const { data: partnersFixed, error: partnersError } = await supabaseClient
      .rpc('fix_partners_trial_dates')

    if (partnersError) {
      console.log('Partners RPC not available, using direct update...')
      
      // Direct update for partners
      const { error: directPartnersError } = await supabaseClient
        .from('partners')
        .update({
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          current_period_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('billing_status', 'trialing')
        .is('trial_end', null)

      if (directPartnersError) {
        console.error('Error fixing partners:', directPartnersError)
        throw directPartnersError
      }
    }

    // Step 3: Fix subscribers table
    const { data: subscribersToFix } = await supabaseClient
      .from('subscribers')
      .select('email, user_id, trial_end, subscription_end')
      .eq('subscribed', false)
      .or('trial_end.is.null,subscription_end.is.null')

    if (subscribersToFix && subscribersToFix.length > 0) {
      for (const subscriber of subscribersToFix) {
        const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        
        const { error: subscriberError } = await supabaseClient
          .from('subscribers')
          .update({
            trial_end: trialEndDate,
            subscription_end: trialEndDate,
            trial_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', subscriber.email)

        if (subscriberError) {
          console.error(`Error fixing subscriber ${subscriber.email}:`, subscriberError)
        }
      }
    }

    // Step 4: Check results after fix
    const { data: afterFix, error: afterError } = await supabaseClient
      .from('partners')
      .select(`
        contact_email,
        billing_status,
        trial_end,
        subscribers!inner(email, trial_end, subscription_end, trial_active, subscribed)
      `)
      .eq('billing_status', 'trialing')

    if (afterError) {
      console.error('Error checking after fix:', afterError)
      throw afterError
    }

    const results = {
      success: true,
      message: 'Trial dates fix completed successfully',
      before: {
        usersWithIssues: currentIssues?.length || 0,
        issues: currentIssues
      },
      after: {
        totalTrialUsers: afterFix?.length || 0,
        fixedUsers: afterFix
      },
      timestamp: new Date().toISOString()
    }

    console.log('✅ Trial dates fix completed:', results)

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error in fix-trial-dates function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})