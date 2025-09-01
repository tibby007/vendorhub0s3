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

    // Get the request method and path
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    logStep(`Processing ${method} ${path}`, { userId: user.id, email: user.email });

    // Route handling
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

  // Send invitation email
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  const registrationLink = `https://yourapp.com/register?token=${invitationToken}`; // Update with actual domain
  const { error: emailError } = await resend.emails.send({
    from: 'VendorHub <invites@yourdomain.com>',
    to: [requestBody.contact_email],
    subject: 'Invitation to Join VendorHub as a Vendor',
    html: `<p>Dear ${requestBody.vendor_name},</p><p>You have been invited to join VendorHub. Please register using this link: <a href="${registrationLink}">${registrationLink}</a></p><p>Best regards,<br>VendorHub Team</p>`
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