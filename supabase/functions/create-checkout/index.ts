
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId, tier, isSetupFee, isAnnual } = await req.json();
    if (!tier) {
      logStep("ERROR: Tier is missing from request", { priceId, tier, isSetupFee, isAnnual });
      throw new Error("Tier is required");
    }
    
    const origin = req.headers.get("origin");
    logStep("Request data", { priceId, tier, isSetupFee, isAnnual, origin });
    logStep("TIER DEBUG", { 
      tier_received: tier, 
      tier_type: typeof tier,
      tier_lowercase: tier?.toLowerCase(),
      will_set_metadata_to: tier || 'basic'
    });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2023-10-16" 
    });

    // Check if customer exists, create if not
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Check if this is a setup fee checkout
    
    if (isSetupFee) {
      // Map plan types to setup fee price IDs
      const setupFeePriceMap = {
        'basic': 'price_1Rp5uDB1YJBVEg8wydyjK4uL',
        'pro': 'price_1Rp5uSB1YJBVEg8wb8WODNOH', 
        'premium': 'price_1Rp5uiB1YJBVEg8wkLbyhjl1'
      };

      const priceId = setupFeePriceMap[tier as keyof typeof setupFeePriceMap];
      if (!priceId) {
        throw new Error(`Invalid plan type: ${tier}`);
      }

      logStep("Creating setup fee checkout session", { tier, priceId, isAnnual });
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin") || "https://vendorhubos.com"}/setup-complete?plan=${tier}&annual=${isAnnual}`,
        cancel_url: `${req.headers.get("origin") || "https://vendorhubos.com"}/pricing`,
        metadata: {
          plan_type: tier,
          is_annual: isAnnual.toString(),
          flow_step: 'setup_fee'
        }
      });
      
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Original subscription checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin") || "https://vendorhubos.com"}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin") || "https://vendorhubos.com"}/subscription?cancelled=true`,
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          plan_type: tier,
          flow_step: 'subscription'
        }
      },
      metadata: {
        plan_type: tier,
        flow_step: 'subscription'
      }
    });

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      metadataSet: { plan_type: tier, flow_step: 'subscription' }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
