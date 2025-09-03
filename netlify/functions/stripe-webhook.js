const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const logStep = (step, details) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

exports.handler = async (event, context) => {
  // Log every webhook request to see if we're receiving them
  logStep('WEBHOOK REQUEST RECEIVED', {
    method: event.httpMethod,
    headers: event.headers,
    timestamp: new Date().toISOString()
  });

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let stripeEvent;
  try {
    const body = event.body;
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    logStep('Webhook signature verification failed', { error: err.message });
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      logStep('Processing checkout.session.completed', { sessionId: session.id });
      
      // Debug: Log the entire session object to see metadata
      logStep('FULL SESSION DEBUG', { 
        sessionId: session.id,
        sessionMetadata: session.metadata,
        customer_email: session.customer_email,
        subscription: session.subscription,
        sessionMode: session.mode
      });
      
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Also log subscription details to see if metadata is there
        logStep('SUBSCRIPTION DEBUG', {
          subscriptionId: subscription.id,
          subscriptionMetadata: subscription.metadata,
          planType: subscription.metadata?.plan_type
        });
        
        const planType = subscription.metadata?.plan_type || session.metadata?.plan_type || 'basic';
        logStep('Plan type determined', { planType, source: 'subscription.metadata or session.metadata' });
        
        // Update user subscription in database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', session.customer_email)
          .single();
        
        if (userError) {
          logStep('Error finding user', { error: userError, email: session.customer_email });
          throw userError;
        }
        
        const subscriptionEnd = new Date();
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // 30 days from now
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString(),
            plan_type: planType,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subscription.id
          })
          .eq('id', userData.id);
        
        if (updateError) {
          logStep('Error updating user subscription', { error: updateError });
          throw updateError;
        }
        
        logStep('Successfully updated user subscription', {
          userId: userData.id,
          planType,
          subscriptionEnd: subscriptionEnd.toISOString()
        });
      } else if (session.mode === 'payment') {
        // Handle setup fee payment
        logStep('Processing setup fee payment', {
          sessionId: session.id,
          metadata: session.metadata
        });
        
        // Setup fee payments don't create subscriptions immediately
        // They're handled separately in the application flow
      }
    } else if (stripeEvent.type === 'invoice.payment_succeeded') {
      const invoice = stripeEvent.data.object;
      logStep('Processing invoice.payment_succeeded', { invoiceId: invoice.id });
      
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        // Update subscription end date
        const subscriptionEnd = new Date(subscription.current_period_end * 1000);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_end: subscriptionEnd.toISOString()
          })
          .eq('email', customer.email);
        
        if (updateError) {
          logStep('Error updating subscription from invoice', { error: updateError });
          throw updateError;
        }
        
        logStep('Successfully updated subscription from invoice', {
          email: customer.email,
          subscriptionEnd: subscriptionEnd.toISOString()
        });
      }
    } else if (stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object;
      logStep('Processing customer.subscription.deleted', { subscriptionId: subscription.id });
      
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          subscription_status: 'cancelled',
          subscription_end: new Date().toISOString()
        })
        .eq('email', customer.email);
      
      if (updateError) {
        logStep('Error updating cancelled subscription', { error: updateError });
        throw updateError;
      }
      
      logStep('Successfully updated cancelled subscription', {
        email: customer.email
      });
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    logStep('Error processing webhook', { error: error.message });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};