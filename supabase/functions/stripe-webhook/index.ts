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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature found");

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    logStep("Event verified", { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabaseClient);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabaseClient);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabaseClient);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, supabaseClient);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabaseClient);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseClient);
        break;
        
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(session: any, supabase: any) {
  logStep("Processing checkout completed", { sessionId: session.id });
  
  const flowStep = session.metadata?.flow_step;
  
  if (flowStep === 'setup_fee') {
    // Record setup fee payment
    await supabase.from('setup_fee_payments').insert({
      session_id: session.id,
      customer_email: session.customer_details?.email || session.customer_email,
      plan_type: session.metadata.plan_type,
      is_annual: session.metadata.is_annual === 'true',
      amount_paid: session.amount_total,
      payment_status: 'paid'
    });
    
    logStep("Setup fee payment recorded");
  }
}

async function handleSubscriptionCreated(subscription: any, supabase: any) {
  logStep("Processing subscription created", { subscriptionId: subscription.id });
  
  const customerId = subscription.customer;
  const planType = determinePlanType(subscription);
  
  // Update or create partner record
  await supabase.from('partners').upsert({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plan_type: planType,
    billing_status: subscription.status,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    current_period_end: new Date(subscription.current_period_end * 1000)
  }, { 
    onConflict: 'stripe_customer_id',
    ignoreDuplicates: false 
  });
  
  logStep("Partner subscription updated");
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  logStep("Processing subscription updated", { subscriptionId: subscription.id });
  
  const planType = determinePlanType(subscription);
  
  await supabase
    .from('partners')
    .update({
      plan_type: planType,
      billing_status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      current_period_end: new Date(subscription.current_period_end * 1000)
    })
    .eq('stripe_subscription_id', subscription.id);
    
  logStep("Partner subscription updated");
}

async function handleSubscriptionCanceled(subscription: any, supabase: any) {
  logStep("Processing subscription canceled", { subscriptionId: subscription.id });
  
  await supabase
    .from('partners')
    .update({
      billing_status: 'canceled'
    })
    .eq('stripe_subscription_id', subscription.id);
    
  logStep("Partner subscription canceled");
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  logStep("Processing payment succeeded", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    await supabase
      .from('partners')
      .update({
        billing_status: 'active',
        current_period_end: new Date(invoice.period_end * 1000)
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    logStep("Partner billing status updated to active");
  }
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  logStep("Processing payment failed", { invoiceId: invoice.id });
  
  if (invoice.subscription) {
    await supabase
      .from('partners')
      .update({
        billing_status: 'past_due'
      })
      .eq('stripe_subscription_id', invoice.subscription);
      
    logStep("Partner billing status updated to past_due");
  }
}

function determinePlanType(subscription: any): string {
  // Extract plan type from subscription price metadata or amount
  const price = subscription.items?.data?.[0]?.price;
  if (!price) return 'basic';
  
  const amount = price.unit_amount || 0;
  
  // Map amounts to plan types (in cents)
  if (amount >= 39700) return 'premium'; // $397+
  if (amount >= 19700) return 'pro';     // $197+
  return 'basic';                        // $97+
}