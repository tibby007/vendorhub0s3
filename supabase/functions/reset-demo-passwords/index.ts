import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Resetting demo user passwords...')

    // Reset password for demo partner admin
    const { data: partnerUpdate, error: partnerError } = await supabaseAdmin.auth.admin.updateUserById(
      'de91b874-05ef-42bc-8b7b-0a150d985ee5',
      { password: 'demo123!' }
    )

    if (partnerError) {
      console.error('Error updating partner password:', partnerError)
      throw partnerError
    }

    console.log('Updated partner password:', partnerUpdate)

    // Reset password for demo vendor
    const { data: vendorUpdate, error: vendorError } = await supabaseAdmin.auth.admin.updateUserById(
      '11bc6902-1b47-477e-a3e2-286dd5407100',
      { password: 'demo123!' }
    )

    if (vendorError) {
      console.error('Error updating vendor password:', vendorError)
      throw vendorError
    }

    console.log('Updated vendor password:', vendorUpdate)

    // Verify the users are active
    const { data: partnerUser, error: partnerGetError } = await supabaseAdmin.auth.admin.getUserById(
      'de91b874-05ef-42bc-8b7b-0a150d985ee5'
    )

    const { data: vendorUser, error: vendorGetError } = await supabaseAdmin.auth.admin.getUserById(
      '11bc6902-1b47-477e-a3e2-286dd5407100'
    )

    if (partnerGetError || vendorGetError) {
      console.error('Error getting user details:', { partnerGetError, vendorGetError })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo user passwords reset successfully',
        users: {
          partner: {
            id: partnerUser?.user?.id,
            email: partnerUser?.user?.email,
            email_confirmed_at: partnerUser?.user?.email_confirmed_at,
            banned_until: partnerUser?.user?.banned_until
          },
          vendor: {
            id: vendorUser?.user?.id,
            email: vendorUser?.user?.email,
            email_confirmed_at: vendorUser?.user?.email_confirmed_at,
            banned_until: vendorUser?.user?.banned_until
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in reset-demo-passwords function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})