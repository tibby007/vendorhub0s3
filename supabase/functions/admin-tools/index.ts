import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-TOOLS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Check for admin secret key in header or query param
    const adminSecret = req.headers.get("X-Admin-Secret") || url.searchParams.get("admin_secret");
    const expectedSecret = "emergestack_admin_2024";
    
    const isAdminAccess = adminSecret === expectedSecret;
    
    if (!isAdminAccess) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        throw new Error("No authorization header provided");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError) throw new Error(`Authentication error: ${userError.message}`);
      
      const user = userData.user;
      if (!user) throw new Error("User not authenticated");

      // Only allow superadmin to use admin tools
      if (user.email !== 'support@emergestack.dev') {
        throw new Error("Admin tools restricted to superadmin only");
      }
    } else {
      logStep("ADMIN SECRET ACCESS - Authenticated via admin secret");
    }

    logStep(`Admin tool requested: ${method} ${path}`);

    if (path.includes('/check-user') && method === 'GET') {
      return await handleCheckUser(url, supabase, corsHeaders);
    }
    else if (path.includes('/setup-user') && method === 'POST') {
      return await handleSetupUser(req, supabase, corsHeaders);
    }
    else {
      return new Response(JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: [
          "GET /check-user?email=<email>",
          "POST /setup-user"
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

  } catch (error) {
    logStep("ERROR", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleCheckUser(
  url: URL,
  supabase: any,
  corsHeaders: any
) {
  const email = url.searchParams.get('email');
  if (!email) {
    throw new Error("Email parameter is required");
  }

  logStep("Checking user setup", { email });

  // Check auth.users table
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find((u: any) => u.email === email);

  // Check application tables
  const { data: appUser, error: appUserError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('contact_email', email)
    .maybeSingle();

  const { data: subscriber, error: subscriberError } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  return new Response(JSON.stringify({
    success: true,
    email,
    auth_user: authUser ? {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      user_metadata: authUser.user_metadata,
      raw_user_meta_data: authUser.raw_user_meta_data
    } : null,
    app_user: appUser,
    partner: partner,
    subscriber: subscriber,
    errors: {
      auth_error: authError?.message,
      app_user_error: appUserError?.message,
      partner_error: partnerError?.message,
      subscriber_error: subscriberError?.message
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleSetupUser(
  req: Request,
  supabase: any,
  corsHeaders: any
) {
  const requestBody = await req.json();
  const { 
    email, 
    name, 
    role = 'Partner Admin',
    plan_type = 'pro',
    billing_status = 'active',
    subscribed = true,
    subscription_tier = 'Pro'
  } = requestBody;

  if (!email || !name) {
    throw new Error("Email and name are required");
  }

  logStep("Setting up user", { email, name, role });

  const results = [];

  try {
    // 1. Check if auth user exists, create if not
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    let authUser = authUsers?.users?.find((u: any) => u.email === email);

    if (!authUser) {
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { name, role }
      });
      
      if (createAuthError) {
        throw new Error(`Failed to create auth user: ${createAuthError.message}`);
      }
      
      authUser = newAuthUser.user;
      results.push({ step: 'auth_user', status: 'created', id: authUser.id });
    } else {
      results.push({ step: 'auth_user', status: 'exists', id: authUser.id });
    }

    // 2. Create/update partner record
    const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    const subscriptionEndDate = billing_status === 'trialing' ? trialEndDate : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .upsert({
        name: name,
        contact_email: email,
        plan_type: plan_type,
        billing_status: billing_status,
        trial_end: billing_status === 'trialing' ? trialEndDate.toISOString() : null,
        vendor_limit: plan_type === 'pro' ? 7 : plan_type === 'premium' ? 15 : 1,
        storage_limit: plan_type === 'pro' ? 26843545600 : 5368709120, // 25GB or 5GB
        current_period_end: subscriptionEndDate.toISOString()
      }, { 
        onConflict: 'contact_email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (partnerError) {
      throw new Error(`Partner setup failed: ${partnerError.message}`);
    }
    
    results.push({ step: 'partner', status: 'created/updated', id: partner.id });

    // 3. Create/update application user record
    const { data: appUser, error: appUserError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: email,
        name: name,
        role: role,
        partner_id: partner.id
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (appUserError) {
      throw new Error(`App user setup failed: ${appUserError.message}`);
    }
    
    results.push({ step: 'app_user', status: 'created/updated', id: appUser.id });

    // 4. Create/update subscriber record
    const { data: sub, error: subError } = await supabase
      .from('subscribers')
      .upsert({
        email: email,
        user_id: authUser.id,
        subscribed: subscribed,
        subscription_tier: subscription_tier,
        subscription_end: subscriptionEndDate.toISOString(),
        trial_end: billing_status === 'trialing' ? trialEndDate.toISOString() : null,
        trial_active: billing_status === 'trialing'
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (subError) {
      throw new Error(`Subscriber setup failed: ${subError.message}`);
    }
    
    results.push({ step: 'subscriber', status: 'created/updated', id: sub.id });

    return new Response(JSON.stringify({
      success: true,
      message: `User ${email} setup completed successfully`,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      partial_results: results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}