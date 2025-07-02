
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking for existing trial user");
      
      // Check if user already has a trial record
      const { data: existingSubscriber } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      if (existingSubscriber) {
        // Check if this is an existing customer who should be reset to trial
        // If they have a stripe_customer_id but no active subscription, reset them to trial
        if (existingSubscriber.stripe_customer_id && !existingSubscriber.subscribed) {
          logStep("Resetting existing customer to trial status");
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 3);
          
          await supabaseClient.from("subscribers").upsert({
            email: user.email,
            user_id: user.id,
            stripe_customer_id: existingSubscriber.stripe_customer_id,
            subscribed: false, // Reset to trial status
            subscription_tier: null,
            subscription_end: trialEnd.toISOString(),
            price_id: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          return new Response(JSON.stringify({ 
            subscribed: false, 
            subscription_tier: null,
            subscription_end: trialEnd.toISOString(),
            price_id: null
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        // Return existing trial data for users without stripe customer
        logStep("Found existing trial user", { 
          subscribed: existingSubscriber.subscribed,
          subscription_end: existingSubscriber.subscription_end 
        });
        
        return new Response(JSON.stringify({ 
          subscribed: existingSubscriber.subscribed,
          subscription_tier: existingSubscriber.subscription_tier,
          subscription_end: existingSubscriber.subscription_end,
          price_id: existingSubscriber.price_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      // Create new 3-day trial for new users
      logStep("Creating new trial user");
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 3);
      
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false, // Trial users are NOT subscribed
        subscription_tier: null,
        subscription_end: trialEnd.toISOString(),
        price_id: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: null,
        subscription_end: trialEnd.toISOString(),
        price_id: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let priceId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      priceId = subscription.items.data[0].price.id;
      
      // Map price IDs to tiers
      const priceToTierMap: Record<string, string> = {
        'price_1Rc1dbB1YJBVEg8wlVQbLAIR': 'Basic', // Basic monthly
        'price_1Rc1e7B1YJBVEg8wjKH1HiZ0': 'Basic', // Basic annual
        'price_1Rc1eXB1YJBVEg8wXyhCVw7X': 'Pro',   // Pro monthly
        'price_1Rc1etB1YJBVEg8wbEgve1jj': 'Pro',   // Pro annual
        'price_1Rc1fkB1YJBVEg8wqjcXMzEK': 'Premium', // Premium monthly
        'price_1Rc1fkB1YJBVEg8wSBzyX6WQ': 'Premium', // Premium annual
      };
      
      subscriptionTier = priceToTierMap[priceId] || 'Basic';
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd, 
        priceId, 
        subscriptionTier 
      });
    } else {
      logStep("No active subscription found");
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      price_id: priceId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { 
      subscribed: hasActiveSub, 
      subscriptionTier,
      priceId 
    });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      price_id: priceId
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
