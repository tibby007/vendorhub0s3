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
    
    // Debug: Log the entire session object to see metadata
    logStep("FULL SESSION DEBUG", { 
      sessionId: session.id,
      metadata: session.metadata,
      customer_email: session.customer_email,
      subscription: session.subscription
    });
    
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Also log subscription details to see if metadata is there
    logStep("SUBSCRIPTION DEBUG", {
      subscriptionId: subscription.id,
      subscriptionMetadata: subscription.metadata,
      priceId: subscription.items.data[0]?.price?.id,
      priceNickname: subscription.items.data[0]?.price?.nickname
    });
    
    // Extract plan type from metadata, with fallback to price ID mapping
    let planType = session.metadata?.plan_type;
    
    // If no metadata, try to infer from price ID
    if (!planType) {
      const priceId = subscription.items.data[0]?.price?.id;
      logStep("NO METADATA FOUND, trying price ID mapping", { priceId });
      
      // Map price IDs to tiers
      const priceToTierMap = {
        'price_1RpnAlB1YJBVEg8wCN2IXtYJ': 'basic', // Basic monthly
        'price_1RpnBKB1YJBVEg8wbbe6nbYG': 'basic', // Basic annual
        'price_1RpnBjB1YJBVEg8wXBbCplTi': 'pro',   // Pro monthly
        'price_1RpnC1B1YJBVEg8wGElD9KAG': 'pro',   // Pro annual
        'price_1RpnCLB1YJBVEg8wI01MZIi1': 'premium', // Premium monthly
        'price_1RpnCYB1YJBVEg8wWiT9eQNc': 'premium'  // Premium annual
      };
      
      planType = priceToTierMap[priceId] || 'basic';
      logStep("MAPPED PRICE TO TIER", { priceId, mappedTier: planType });
    }
    
    const capitalizedTier = planType.charAt(0).toUpperCase() + planType.slice(1);
    
    logStep("Extracted plan data", { 
      planType, 
      capitalizedTier,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: session.customer_email 
    });
    
    const trialEndDate = new Date(subscription.trial_end * 1000).toISOString();
    
    // Upsert trial status in subscribers table
    const { data: subscriberData, error: subscriberError } = await supabase.from("subscribers").upsert({
      email: session.customer_email,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      trial_end: trialEndDate,
      subscribed: false,
      subscription_tier: capitalizedTier,
      subscription_end: trialEndDate,
      status: "trialing"
    }, { onConflict: "email" });
    
    if (subscriberError) {
      logStep("Error saving subscriber data", { error: subscriberError.message });
    } else {
      logStep("Successfully saved subscriber data", { data: subscriberData });
    }

    // Also create/update partner record for consistency
    const vendorLimit = planType === 'basic' ? 3 : (planType === 'pro' ? 7 : 999);
    const { data: partnerData, error: partnerError } = await supabase.from("partners").upsert({
      contact_email: session.customer_email,
      name: session.customer_details?.name || session.customer_email.split('@')[0],
      plan_type: planType,
      billing_status: 'trialing',
      trial_end: trialEndDate,
      current_period_end: trialEndDate,
      vendor_limit: vendorLimit,
      storage_limit: 5368709120,
      storage_used: 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'contact_email' });
    
    if (partnerError) {
      logStep("Error saving partner data", { error: partnerError.message });
    } else {
      logStep("Successfully saved partner data", { data: partnerData });
    }
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    logStep("Processing invoice.paid", { invoiceId: invoice.id, customerId: invoice.customer });
    
    // Update subscribers table
    const { error: subError } = await supabase.from("subscribers").update({
      subscribed: true,
      status: "active",
      subscription_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
    }).eq("stripe_customer_id", invoice.customer);
    
    if (subError) {
      logStep("Error updating subscriber", { error: subError.message });
    }
    
    // Also update partners table to ensure consistency
    const { data: subscriberData } = await supabase
      .from("subscribers")
      .select("email, subscription_tier")
      .eq("stripe_customer_id", invoice.customer)
      .single();
      
    if (subscriberData) {
      const { error: partnerError } = await supabase.from("partners").update({
        billing_status: "active",
        plan_type: subscriberData.subscription_tier?.toLowerCase() || 'basic',
        current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }).eq("contact_email", subscriberData.email);
      
      if (partnerError) {
        logStep("Error updating partner", { error: partnerError.message });
      } else {
        logStep("Successfully updated partner to active status");
      }
      
      // Update user metadata to link partner_id
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("contact_email", subscriberData.email)
        .single();
        
      if (partner) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === subscriberData.email);
        
        if (user && !user.user_metadata?.partner_id) {
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, partner_id: partner.id }
          });
          logStep("Updated user metadata with partner_id", { userId: user.id, partnerId: partner.id });
        }
      }
    }
  }

  return new Response("ok", { status: 200 });
});