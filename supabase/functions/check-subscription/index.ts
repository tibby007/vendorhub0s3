
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

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
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Stripe is optional - only needed for paid subscriptions, not trials
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("Checking subscription for user", { email: user.email, user_id: user.id });

    // Get user's subscription and partner data using service role (bypasses RLS)
    const [subscriberResult, partnerResult, appUserResult] = await Promise.all([
      supabaseClient
        .from('subscribers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle(),
      
      supabaseClient
        .from('partners')
        .select('*')
        .eq('contact_email', user.email)
        .maybeSingle(),
      
      supabaseClient
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
    ]);

    const subscriber = subscriberResult.data;
    const partner = partnerResult.data;
    const appUser = appUserResult.data;

    logStep("Database query results", {
      hasSubscriber: !!subscriber,
      hasPartner: !!partner,
      hasAppUser: !!appUser
    });

    // Determine subscription status
    let subscriptionStatus = 'none';
    let isActive = false;
    let trialActive = false;
    let daysRemaining = 0;

    if (subscriber && partner) {
      const now = new Date();
      
      // Check for active trial
      if (partner.billing_status === 'trialing') {
        // Fix missing trial_end dates automatically
        if (!subscriber.trial_end || !partner.trial_end) {
          logStep("Fixing missing trial end dates", { 
            hasSubscriberTrialEnd: !!subscriber.trial_end,
            hasPartnerTrialEnd: !!partner.trial_end 
          });
          
          const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
          
          // Update subscriber table
          if (!subscriber.trial_end) {
            await supabaseClient
              .from('subscribers')
              .update({
                trial_end: trialEndDate.toISOString(),
                subscription_end: trialEndDate.toISOString(),
                trial_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email);
            
            subscriber.trial_end = trialEndDate.toISOString();
            subscriber.subscription_end = trialEndDate.toISOString();
          }
          
          // Update partner table
          if (!partner.trial_end) {
            await supabaseClient
              .from('partners')
              .update({
                trial_end: trialEndDate.toISOString(),
                current_period_end: trialEndDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('contact_email', user.email);
            
            partner.trial_end = trialEndDate.toISOString();
          }
          
          logStep("Trial end dates fixed", { trialEndDate: trialEndDate.toISOString() });
        }
        
        if (subscriber.trial_end) {
          const trialEnd = new Date(subscriber.trial_end);
          if (now < trialEnd) {
            trialActive = true;
            subscriptionStatus = 'trial';
            isActive = true;
            daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            logStep("User has active trial", { daysRemaining, trialEnd: subscriber.trial_end });
            
            return new Response(JSON.stringify({
              subscribed: false, // Trial users are not "subscribed" 
              subscription_tier: subscriber.subscription_tier || 'Pro',
              subscription_end: subscriber.trial_end,
              trial_active: true,
              days_remaining: daysRemaining,
              trialEnd: subscriber.trial_end // Add this for TrialBanner
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
      }
      
      // Check for active paid subscription
      if (subscriber.subscribed && subscriber.stripe_subscription_id) {
        const subscriptionEnd = subscriber.subscription_end ? new Date(subscriber.subscription_end) : null;
        if (!subscriptionEnd || now < subscriptionEnd) {
          subscriptionStatus = 'active';
          isActive = true;
          daysRemaining = subscriptionEnd ? Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 365;
          
          logStep("User has active paid subscription", { tier: subscriber.subscription_tier });
          
          return new Response(JSON.stringify({
            subscribed: true,
            subscription_tier: subscriber.subscription_tier || 'Pro',
            subscription_end: subscriber.subscription_end,
            trial_active: false,
            stripe_subscription_id: subscriber.stripe_subscription_id,
            trialEnd: null // No trial for paid subscribers
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // No subscription or trial found
    logStep("No active subscription or trial found");
    
    return new Response(JSON.stringify({ 
      subscribed: false, 
      subscription_tier: null,
      subscription_end: null,
      trial_active: false,
      needs_setup: true,
      trialEnd: null // No trial for unsubscribed users
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
