import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Log every webhook request to see if we're receiving them
  logStep("WEBHOOK REQUEST RECEIVED", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

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
      sessionMetadata: session.metadata,
      customer_email: session.customer_email,
      subscription: session.subscription,
      sessionMode: session.mode
    });
    
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Also log subscription details to see if metadata is there
    logStep("SUBSCRIPTION DEBUG", {
      subscriptionId: subscription.id,
      subscriptionMetadata: subscription.metadata,
      priceId: subscription.items.data[0]?.price?.id,
      priceNickname: subscription.items.data[0]?.price?.nickname,
      priceProduct: subscription.items.data[0]?.price?.product
    });
    
    // ROBUST TIER EXTRACTION - try multiple methods
    let planType = null;
    let tierSource = 'unknown';
    
    // Method 1: Session metadata
    if (session.metadata?.plan_type) {
      planType = session.metadata.plan_type;
      tierSource = 'session_metadata';
      logStep("TIER FROM SESSION METADATA", { 
        plan_type: planType,
        full_metadata: session.metadata
      });
    }
    
    // Method 2: Subscription metadata
    if (!planType && subscription.metadata?.plan_type) {
      planType = subscription.metadata.plan_type;
      tierSource = 'subscription_metadata';
      logStep("TIER FROM SUBSCRIPTION METADATA", { 
        plan_type: planType,
        full_metadata: subscription.metadata
      });
    }
    
    // Method 3: Price ID mapping (most reliable fallback)
    if (!planType) {
      const priceId = subscription.items.data[0]?.price?.id;
      logStep("NO METADATA FOUND, using price ID mapping", { 
        priceId,
        available_methods: ['session_metadata', 'subscription_metadata', 'price_mapping']
      });
      
      // Comprehensive price ID to tier mapping
      const priceToTierMap = {
        'price_1RpnAlB1YJBVEg8wCN2IXtYJ': 'basic',   // Basic monthly
        'price_1RpnBKB1YJBVEg8wbbe6nbYG': 'basic',   // Basic annual
        'price_1RpnBjB1YJBVEg8wXBbCplTi': 'pro',     // Pro monthly
        'price_1RpnC1B1YJBVEg8wGElD9KAG': 'pro',     // Pro annual
        'price_1RpnCLB1YJBVEg8wI01MZIi1': 'premium', // Premium monthly
        'price_1RpnCYB1YJBVEg8wWiT9eQNc': 'premium'  // Premium annual
      };
      
      if (priceToTierMap[priceId]) {
        planType = priceToTierMap[priceId];
        tierSource = 'price_mapping';
        logStep("SUCCESSFULLY MAPPED PRICE TO TIER", { 
          priceId, 
          mappedTier: planType,
          mapping_successful: true
        });
      } else {
        logStep("PRICE ID NOT FOUND IN MAPPING", { 
          priceId,
          available_price_ids: Object.keys(priceToTierMap),
          falling_back_to: 'basic'
        });
        planType = 'basic';
        tierSource = 'fallback_default';
      }
    }
    
    logStep("FINAL TIER EXTRACTION RESULT", {
      extracted_tier: planType,
      tier_source: tierSource,
      session_id: session.id,
      subscription_id: subscription.id
    });
    
    const capitalizedTier = planType.charAt(0).toUpperCase() + planType.slice(1);
    
    // Get customer email from customer details if not in session
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    logStep("Extracted plan data", { 
      planType, 
      capitalizedTier,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: customerEmail 
    });
    
    const trialEndDate = new Date(subscription.trial_end * 1000).toISOString();
    
    // Upsert trial status in subscribers table
    const { data: subscriberData, error: subscriberError } = await supabase.from("subscribers").upsert({
      email: customerEmail,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      subscribed: false,
      subscription_tier: capitalizedTier,
      subscription_end: trialEndDate,
      updated_at: new Date().toISOString()
    }, { onConflict: "email" });
    
    if (subscriberError) {
      logStep("Error saving subscriber data", { error: subscriberError.message });
    } else {
      logStep("Successfully saved subscriber data", { data: subscriberData, tier_set: capitalizedTier });
    }

    // Also create/update partner record for consistency
    const vendorLimit = planType === 'basic' ? 3 : (planType === 'pro' ? 7 : 999);
    const { data: partnerData, error: partnerError } = await supabase.from("partners").upsert({
      contact_email: customerEmail,
      name: session.customer_details?.name || customerEmail.split('@')[0],
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
    
    // Get the subscription to access its metadata
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    logStep("Retrieved subscription for invoice", { 
      subscriptionId: subscription.id, 
      subscriptionMetadata: subscription.metadata,
      priceId: subscription.items.data[0]?.price?.id 
    });
    
    // ROBUST TIER EXTRACTION for invoice.paid (same logic as checkout.session.completed)
    let subscriptionTier = null;
    let tierSource = 'unknown';
    
    // Method 1: Subscription metadata
    if (subscription.metadata?.plan_type) {
      subscriptionTier = subscription.metadata.plan_type;
      tierSource = 'subscription_metadata';
      logStep("INVOICE: Tier from subscription metadata", { tier: subscriptionTier });
    }
    
    // Method 2: Price ID mapping (reliable fallback)
    if (!subscriptionTier) {
      const priceId = subscription.items.data[0]?.price?.id;
      logStep("INVOICE: Using price ID mapping", { priceId });
      
      const priceToTierMap = {
        'price_1RpnAlB1YJBVEg8wCN2IXtYJ': 'basic',   // Basic monthly
        'price_1RpnBKB1YJBVEg8wbbe6nbYG': 'basic',   // Basic annual
        'price_1RpnBjB1YJBVEg8wXBbCplTi': 'pro',     // Pro monthly
        'price_1RpnC1B1YJBVEg8wGElD9KAG': 'pro',     // Pro annual
        'price_1RpnCLB1YJBVEg8wI01MZIi1': 'premium', // Premium monthly
        'price_1RpnCYB1YJBVEg8wWiT9eQNc': 'premium'  // Premium annual
      };
      
      if (priceToTierMap[priceId]) {
        subscriptionTier = priceToTierMap[priceId];
        tierSource = 'price_mapping';
        logStep("INVOICE: Successfully mapped price to tier", { 
          priceId, 
          mappedTier: subscriptionTier 
        });
      } else {
        subscriptionTier = 'basic';
        tierSource = 'fallback_default';
        logStep("INVOICE: Price ID not found, falling back to basic", { 
          priceId,
          available_price_ids: Object.keys(priceToTierMap)
        });
      }
    }
    
    logStep("INVOICE: Final tier extraction", {
      tier: subscriptionTier,
      tier_source: tierSource,
      subscription_id: subscription.id
    });
    
    const capitalizedTier = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
    
    // Update subscribers table
    const { error: subError } = await supabase.from("subscribers").update({
      subscribed: true,
      status: "active",
      subscription_tier: capitalizedTier,
      subscription_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString()
    }).eq("stripe_customer_id", invoice.customer);
    
    if (subError) {
      logStep("Error updating subscriber", { error: subError.message });
    } else {
      logStep("Successfully updated subscriber to active", { 
        tier: capitalizedTier, 
        customerId: invoice.customer,
        subscriptionId: invoice.subscription 
      });
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
        plan_type: subscriberData.subscription_tier?.toLowerCase() || subscriptionTier,
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