
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting demo user cleanup process');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find expired demo leads (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const { data: expiredLeads, error: leadsError } = await supabase
      .from('demo_leads')
      .select('*')
      .lt('demo_started_at', twoHoursAgo.toISOString())
      .is('demo_completed_at', null);

    if (leadsError) {
      console.error('Error fetching expired demo leads:', leadsError);
      throw leadsError;
    }

    console.log(`Found ${expiredLeads?.length || 0} expired demo leads`);

    let cleanedUpCount = 0;

    // Clean up each expired demo lead
    for (const lead of expiredLeads || []) {
      try {
        const credentials = lead.demo_credentials;
        if (credentials?.email) {
          console.log(`Cleaning up demo user: ${credentials.email}`);

          // Get user by email
          const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
          
          if (!getUserError) {
            const demoUser = users.users.find(user => user.email === credentials.email);
            
            if (demoUser) {
              // Delete the demo user
              const { error: deleteError } = await supabase.auth.admin.deleteUser(demoUser.id);
              
              if (deleteError) {
                console.error(`Failed to delete demo user ${credentials.email}:`, deleteError);
              } else {
                console.log(`Successfully deleted demo user: ${credentials.email}`);
                cleanedUpCount++;
              }
            }
          }
        }

        // Mark demo as completed
        await supabase
          .from('demo_leads')
          .update({ demo_completed_at: new Date().toISOString() })
          .eq('id', lead.id);

      } catch (error) {
        console.error(`Error cleaning up lead ${lead.id}:`, error);
      }
    }

    console.log(`Cleanup completed. Removed ${cleanedUpCount} demo users.`);

    return new Response(
      JSON.stringify({ 
        success: true,
        cleanedUp: cleanedUpCount,
        totalExpired: expiredLeads?.length || 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup process:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Cleanup failed',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
