const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const logStep = (step, details) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    logStep('Function started');

    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get user from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error('User not authenticated or email not available');
    }
    
    logStep('User authenticated', { userId: user.id, email: user.email });

    const { priceId, tier, isSetupFee, isAnnual } = JSON.parse(event.body);
    
    if (!tier) {
      logStep('ERROR: Tier is missing from request', { priceId, tier, isSetupFee, isAnnual });
      throw new Error('Tier is required');
    }
    
    const origin = event.headers.origin || event.headers.Origin || 'https://vendorhubos.com';
    logStep('Request data', { priceId, tier, isSetupFee, isAnnual, origin });

    // Check if customer exists, create if not
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Found existing customer', { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
      });
      customerId = customer.id;
      logStep('Created new customer', { customerId });
    }

    // Check if this is a setup fee checkout
    if (isSetupFee) {
      // Map plan types to setup fee price IDs
      const setupFeePriceMap = {
        'basic': 'price_1Rp5uDB1YJBVEg8wydyjK4uL',
        'pro': 'price_1Rp5uSB1YJBVEg8wb8WODNOH', 
        'premium': 'price_1Rp5uiB1YJBVEg8wkLbyhjl1'
      };

      const setupPriceId = setupFeePriceMap[tier];
      if (!setupPriceId) {
        throw new Error(`Invalid plan type: ${tier}`);
      }

      logStep('Creating setup fee checkout session', { tier, priceId: setupPriceId, isAnnual });
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{
          price: setupPriceId,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/setup-complete?plan=${tier}&annual=${isAnnual}`,
        cancel_url: `${origin}/pricing`,
        metadata: {
          plan_type: tier,
          is_annual: isAnnual.toString(),
          flow_step: 'setup_fee'
        }
      });
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ url: session.url })
      };
    }

    // Original subscription checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription?cancelled=true`,
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

    logStep('Checkout session created', { 
      sessionId: session.id, 
      url: session.url,
      metadataSet: { plan_type: tier, flow_step: 'subscription' }
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-checkout', { message: errorMessage });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};