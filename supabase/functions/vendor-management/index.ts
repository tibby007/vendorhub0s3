import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";
import { createRateLimiter } from "../_shared/rate-limiter.ts";
import { Resend } from 'https://esm.sh/resend@latest';

interface VendorInviteRequest {
  vendor_name: string;
  contact_email: string;
  contact_phone?: string;
  business_type?: string;
}

interface VendorCreateRequest extends VendorInviteRequest {
  user_id: string;
}

interface VendorRegistrationRequest {
  token: string;
  full_name: string;
  business_name: string;
  contact_email: string;
  phone_number: string;
  password: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[VENDOR-MANAGEMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
    logStep("Vendor management function called");
    
    // Get the request method and path
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    logStep(`Processing ${method} ${path}`);

    // Public routes (no authentication required)
    if (path.includes('/register-vendor') && method === 'POST') {
      return await handleVendorRegistration(req, supabase, corsHeaders);
    }
    
    // For authenticated routes, verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Verify the requesting user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Apply rate limiting (100 requests per minute per user)
    const rateLimiter = createRateLimiter(supabase);
    const rateLimitCheck = await rateLimiter.middleware(req, user.id, { 
      limit: 100,
      skip_authenticated: false // Apply rate limiting even for authenticated users
    });
    
    if (!rateLimitCheck.allowed) {
      logStep("Rate limit exceeded", { user_id: user.id, count: rateLimitCheck.result.count });
      return rateLimitCheck.response!;
    }
    
    logStep("Rate limit check passed", { 
      user_id: user.id, 
      count: rateLimitCheck.result.count,
      remaining: rateLimitCheck.result.remaining 
    });
    
    logStep(`Processing authenticated ${method} ${path}`, { userId: user.id, email: user.email });

    // Authenticated routes
    if (path.includes('/invite-vendor') && method === 'POST') {
      return await handleInviteVendor(req, supabase, user, corsHeaders);
    } 
    else if (path.includes('/create-vendor') && method === 'POST') {
      return await handleCreateVendor(req, supabase, user, corsHeaders);
    }
    else if (path.includes('/list-vendors') && method === 'GET') {
      return await handleListVendors(supabase, user, corsHeaders);
    }
    else if (path.includes('/vendor-details') && method === 'GET') {
      return await handleGetVendorDetails(url, supabase, user, corsHeaders);
    }
    else if (path.includes('/update-vendor') && method === 'PUT') {
      return await handleUpdateVendor(req, supabase, user, corsHeaders);
    }
    else {
      return new Response(JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: [
          "POST /invite-vendor",
          "POST /create-vendor", 
          "GET /list-vendors",
          "GET /vendor-details?id=<vendor_id>",
          "PUT /update-vendor"
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

async function handleInviteVendor(
  req: Request, 
  supabase: any, 
  user: any, 
  corsHeaders: any
) {
  const requestBody = await req.json() as VendorInviteRequest;
  logStep("Inviting vendor", { vendor_name: requestBody.vendor_name });

  // Verify user is a broker/partner admin
  const { data: partnerData, error: partnerError } = await supabase
    .from('partners')
    .select('id, vendor_limit')
    .eq('contact_email', user.email)
    .single();

  if (partnerError || !partnerData) {
    throw new Error("Only Partner Admins can invite vendors");
  }

  // Check vendor limit
  const { count: currentVendorCount } = await supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('partner_id', partnerData.id);

  if (currentVendorCount >= partnerData.vendor_limit) {
    throw new Error(`Vendor limit reached (${partnerData.vendor_limit}). Upgrade your plan to add more vendors.`);
  }

  // Generate invitation token
  const invitationToken = crypto.randomUUID();

  // Create vendor invitation
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      partner_id: partnerData.id,
      vendor_name: requestBody.vendor_name,
      contact_email: requestBody.contact_email,
      contact_phone: requestBody.contact_phone,
      business_type: requestBody.business_type,
      invited_by: user.id,
      invitation_status: 'pending',
      invitation_token: invitationToken
    })
    .select()
    .single();

  if (vendorError) {
    throw new Error(`Failed to create vendor invitation: ${vendorError.message}`);
  }

  // Get broker/partner name for email
  const { data: partnerInfo, error: partnerInfoError } = await supabase
    .from('partners')
    .select('company_name')
    .eq('id', partnerData.id)
    .single();

  const brokerName = partnerInfo?.company_name || 'your broker';

  // Send invitation email
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  const registrationLink = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/vendor-registration?token=${invitationToken}`;
  const { error: emailError } = await resend.emails.send({
    from: 'VendorHub OS <noreply@vendorhubos.com>',
    to: [requestBody.contact_email],
    subject: 'Welcome to VendorHub OS - Complete Your Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to VendorHub OS!</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Please click the link to complete your registration with <strong>${brokerName}</strong> and begin submitting your deals today!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${registrationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Complete Registration
          </a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${registrationLink}">${registrationLink}</a>
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          This invitation was sent by ${brokerName}. If you didn't expect this email, please ignore it.
        </p>
      </div>
    `
  });

  if (emailError) {
    console.error('Failed to send invitation email:', emailError);
    // Continue even if email fails, but log it
  }

  logStep("Vendor invitation created", { vendor_id: vendor.id });

  return new Response(JSON.stringify({
    success: true,
    message: "Vendor invitation sent successfully",
    vendor_id: vendor.id,
    invitation_status: 'pending'
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleCreateVendor(
  req: Request,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const requestBody = await req.json() as VendorCreateRequest;
  logStep("Creating vendor account", { user_id: requestBody.user_id });

  // Create user record for vendor
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: requestBody.user_id,
      email: requestBody.contact_email,
      name: requestBody.vendor_name,
      role: 'Vendor'
    })
    .select()
    .single();

  if (userError) {
    throw new Error(`Failed to create user record: ${userError.message}`);
  }

  // Update vendor record to link to user
  const { error: vendorUpdateError } = await supabase
    .from('vendors')
    .update({
      user_id: requestBody.user_id,
      invitation_status: 'accepted'
    })
    .eq('contact_email', requestBody.contact_email);

  if (vendorUpdateError) {
    throw new Error(`Failed to update vendor record: ${vendorUpdateError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Vendor account created successfully",
    user_id: requestBody.user_id
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleListVendors(
  supabase: any,
  user: any,
  corsHeaders: any
) {
  // Get partner_id for the requesting user
  const { data: partnerData, error: partnerError } = await supabase
    .from('partners')
    .select('id')
    .eq('contact_email', user.email)
    .single();

  if (partnerError || !partnerData) {
    throw new Error("Only Partner Admins can view vendors");
  }

  // Get all vendors for this partner
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select(`
      id,
      vendor_name,
      contact_email,
      contact_phone,
      business_type,
      invitation_status,
      created_at,
      users (
        name,
        email
      )
    `)
    .eq('partner_id', partnerData.id)
    .order('created_at', { ascending: false });

  if (vendorsError) {
    throw new Error(`Failed to fetch vendors: ${vendorsError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    vendors: vendors || []
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleGetVendorDetails(
  url: URL,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const vendorId = url.searchParams.get('id');
  if (!vendorId) {
    throw new Error("Vendor ID is required");
  }

  // Verify access - either the vendor themselves or their partner admin
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select(`
      *,
      partners (
        name,
        contact_email
      ),
      users (
        name,
        email,
        created_at
      )
    `)
    .eq('id', vendorId)
    .single();

  if (vendorError) {
    throw new Error(`Vendor not found: ${vendorError.message}`);
  }

  // Check if user has access to this vendor
  const hasAccess = vendor.user_id === user.id || // Vendor accessing own data
                   vendor.partners?.contact_email === user.email; // Partner accessing their vendor

  if (!hasAccess) {
    throw new Error("Access denied");
  }

  return new Response(JSON.stringify({
    success: true,
    vendor
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleUpdateVendor(
  req: Request,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const requestBody = await req.json();
  const { vendor_id, ...updateData } = requestBody;

  if (!vendor_id) {
    throw new Error("Vendor ID is required");
  }

  // Verify access
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('user_id, partners(contact_email)')
    .eq('id', vendor_id)
    .single();

  if (vendorError) {
    throw new Error(`Vendor not found: ${vendorError.message}`);
  }

  const hasAccess = vendor.user_id === user.id || 
                   vendor.partners?.contact_email === user.email;

  if (!hasAccess) {
    throw new Error("Access denied");
  }

  // Update vendor record
  const { data: updatedVendor, error: updateError } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', vendor_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update vendor: ${updateError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Vendor updated successfully",
    vendor: updatedVendor
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleVendorRegistration(
  req: Request,
  supabase: any,
  corsHeaders: any
) {
  const requestBody = await req.json() as VendorRegistrationRequest;
  logStep("Processing vendor registration", { email: requestBody.contact_email });

  // Validate required fields
  if (!requestBody.token || !requestBody.full_name || !requestBody.business_name || 
      !requestBody.contact_email || !requestBody.phone_number || !requestBody.password) {
    throw new Error("All fields are required: token, full_name, business_name, contact_email, phone_number, password");
  }

  // Find vendor invitation by token
  const { data: vendorInvitation, error: invitationError } = await supabase
    .from('vendors')
    .select('*')
    .eq('invitation_token', requestBody.token)
    .eq('invitation_status', 'pending')
    .single();

  if (invitationError || !vendorInvitation) {
    throw new Error("Invalid or expired invitation token");
  }

  // Verify email matches invitation
  if (vendorInvitation.contact_email !== requestBody.contact_email) {
    throw new Error("Email address does not match the invitation");
  }

  try {
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: requestBody.contact_email,
      password: requestBody.password,
      email_confirm: true,
      user_metadata: {
        full_name: requestBody.full_name,
        business_name: requestBody.business_name,
        phone_number: requestBody.phone_number,
        role: 'Vendor'
      }
    });

    if (authError) {
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Create user record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: requestBody.contact_email,
        name: requestBody.full_name,
        role: 'Vendor'
      });

    if (userError) {
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    // Update vendor record
    const { error: vendorUpdateError } = await supabase
      .from('vendors')
      .update({
        user_id: userId,
        vendor_name: requestBody.business_name,
        contact_phone: requestBody.phone_number,
        invitation_status: 'accepted',
        invitation_accepted_at: new Date().toISOString()
      })
      .eq('id', vendorInvitation.id);

    if (vendorUpdateError) {
      throw new Error(`Failed to update vendor record: ${vendorUpdateError.message}`);
    }

    // Generate login link
    const loginLink = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'}/auth?email=${encodeURIComponent(requestBody.contact_email)}`;

    // Send welcome email with login link
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const { error: emailError } = await resend.emails.send({
      from: 'VendorHub OS <noreply@vendorhubos.com>',
      to: [requestBody.contact_email],
      subject: 'Welcome to VendorHub OS - Your Account is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; margin-bottom: 20px;">Welcome to VendorHub OS!</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Congratulations! Your vendor account has been successfully created. You now have immediate access to your portal and can begin submitting deals.
          </p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Your Account Details:</h3>
            <p><strong>Business Name:</strong> ${requestBody.business_name}</p>
            <p><strong>Email:</strong> ${requestBody.contact_email}</p>
            <p><strong>Phone:</strong> ${requestBody.phone_number}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Your Portal
            </a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${loginLink}">${loginLink}</a>
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            You're all set to start submitting deals through VendorHub OS!
          </p>
        </div>
      `
    });

    if (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails
    }

    logStep("Vendor registration completed", { vendor_id: vendorInvitation.id, user_id: userId });

    return new Response(JSON.stringify({
      success: true,
      message: "Registration completed successfully! You now have access to your vendor portal.",
      login_link: loginLink,
      vendor_id: vendorInvitation.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Registration failed", { error: error.message });
    throw error;
  }
}