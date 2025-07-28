import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let event;
  try {
    const body = await req.text();
    // Use constructEventAsync for Deno compatibility
    event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret!);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    logStep("Processing checkout.session.completed", { sessionId: session.id });
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Extract plan type from metadata, default to 'basic' if not found
    const planType = session.metadata?.plan_type || 'basic';
    const capitalizedTier = planType.charAt(0).toUpperCase() + planType.slice(1);
    
    logStep("Extracted plan data", { 
      planType, 
      capitalizedTier,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: session.customer_email 
    });
    
    // Upsert trial status in subscribers table
    const { data, error } = await supabase.from("subscribers").upsert({
      email: session.customer_email,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      trial_end: new Date(subscription.trial_end * 1000).toISOString(),
      subscribed: false,
      subscription_tier: capitalizedTier,
      subscription_end: new Date(subscription.trial_end * 1000).toISOString(),
      status: "trialing"
    }, { onConflict: "email" });
    
    if (error) {
      logStep("Error saving subscription data", { error: error.message });
    } else {
      logStep("Successfully saved subscription data", { data });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    // Set status to active and update subscription_end
    await supabase.from("subscribers").update({
      subscribed: true,
      status: "active",
      subscription_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
    }).eq("stripe_customer_id", invoice.customer);
  }

  return new Response("ok", { status: 200 });
});