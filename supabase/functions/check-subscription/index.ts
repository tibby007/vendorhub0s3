
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Helper function to map plan types to subscription tiers
const mapPlanTypeToTier = (planType: string): string => {
  switch (planType?.toLowerCase()) {
    case 'basic':
      return 'Basic';
    case 'pro':
      return 'Pro';
    case 'premium':
      return 'Premium';
    default:
      return 'Basic';
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First check if user is in trial period via partners table
    const { data: partnerData, error: partnerError } = await supabaseClient
      .from('partners')
      .select('billing_status, trial_end, plan_type')
      .eq('contact_email', user.email)
      .maybeSingle();

    if (partnerData && !partnerError) {
      logStep("Found partner data", { partnerData });
      
      if (partnerData.billing_status === 'trialing' && partnerData.trial_end) {
        const trialEnd = new Date(partnerData.trial_end);
        const now = new Date();
        
        if (trialEnd > now) {
          logStep("User is in active trial period");
          const subscriptionTier = mapPlanTypeToTier(partnerData.plan_type);
          
          await supabaseClient.from("subscribers").upsert({
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: false,
            subscription_tier: subscriptionTier,
            subscription_end: partnerData.trial_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          return new Response(JSON.stringify({
            subscribed: false,
            subscription_tier: subscriptionTier,
            subscription_end: partnerData.trial_end,
            trial_active: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          logStep("Trial period has expired");
        }
      }
    }

    // Also check subscribers table for trial status
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (subscriberData && !subscriberError && !subscriberData.subscribed) {
      logStep("Found trial subscriber data", { subscriberData });
      
      if (subscriberData.subscription_end) {
        const trialEnd = new Date(subscriberData.subscription_end);
        const now = new Date();
        
        if (trialEnd > now) {
          logStep("User is in active trial period (from subscribers table)");
          return new Response(JSON.stringify({
            subscribed: false,
            subscription_tier: subscriberData.subscription_tier || 'Basic',
            subscription_end: subscriberData.subscription_end,
            trial_active: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          logStep("Trial period has expired (from subscribers table)");
        }
      }
    }

    // If no trial found, create a new trial for the user
    logStep("No trial found, creating new trial for user");
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3);
    
    // Create trial record in subscribers table
    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: null,
      subscribed: false,
      subscription_tier: 'Basic',
      subscription_end: trialEnd.toISOString(),
      price_id: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });
    
    // Also ensure partner record exists with trial status
    await supabaseClient.from("partners").upsert({
      contact_email: user.email,
      name: user.user_metadata?.name || user.email,
      plan_type: 'basic',
      billing_status: 'trialing',
      trial_end: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
      vendor_limit: 3,
      storage_limit: 5368709120,
      storage_used: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'contact_email' });
    
    logStep("Created new trial for user", { trialEnd: trialEnd.toISOString() });
    
    return new Response(JSON.stringify({ 
      subscribed: false, 
      subscription_tier: 'Basic',
      subscription_end: trialEnd.toISOString(),
      trial_active: true,
      price_id: null 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
