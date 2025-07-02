
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // First, try to get the stored stripe_customer_id from our database
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('email', user.email)
      .maybeSingle();

    logStep("Database lookup for subscriber", { subscriberData, subscriberError });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    let customerId = null;

    // Use stored customer ID if available
    if (subscriberData?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(subscriberData.stripe_customer_id);
        if (customer && !customer.deleted) {
          customerId = customer.id;
          logStep("Found Stripe customer using stored ID", { customerId });
        } else {
          logStep("Stored customer ID is invalid or deleted", { storedId: subscriberData.stripe_customer_id });
        }
      } catch (error) {
        logStep("Error retrieving customer by stored ID", { error: error.message, storedId: subscriberData.stripe_customer_id });
      }
    }

    // Fall back to email lookup if stored ID didn't work
    if (!customerId) {
      logStep("Falling back to email-based customer lookup");
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) {
        throw new Error(`No Stripe customer found for ${user.email}. Please ensure you have an active subscription.`);
      }
      customerId = customers.data[0].id;
      logStep("Found Stripe customer via email lookup", { customerId });
    }

    // Verify the customer exists and is valid before creating portal session
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        throw new Error(`Customer ${customerId} is deleted or invalid`);
      }
      logStep("Verified customer exists", { customerId: customer.id, email: customer.email });
    } catch (error) {
      throw new Error(`Failed to verify customer: ${error.message}`);
    }

    const origin = req.headers.get("origin") || "https://vendorhubos.com";
    
    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/dashboard`,
      });
      
      logStep("Customer portal session created successfully", { 
        sessionId: portalSession.id, 
        url: portalSession.url,
        customerId: customerId
      });

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeError) {
      logStep("ERROR creating Stripe portal session", { 
        error: stripeError.message, 
        customerId: customerId,
        stripeErrorType: stripeError.type
      });
      throw new Error(`Failed to create customer portal session: ${stripeError.message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
