
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

interface DemoLeadRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  role: string;
  employees?: string;
  useCase?: string;
  csrfToken?: string;
}

// Input validation functions
const validateInput = (data: DemoLeadRequest): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2 || data.name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.company || data.company.trim().length < 2 || data.company.length > 100) {
    errors.push('Company name must be between 2 and 100 characters');
  }
  
  if (!data.role || !['Partner Admin', 'Vendor'].includes(data.role)) {
    errors.push('Valid role selection is required');
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.useCase && data.useCase.length > 500) {
    errors.push('Use case description too long (max 500 characters)');
  }
  
  return { isValid: errors.length === 0, errors };
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const sanitizeInput = (data: DemoLeadRequest): DemoLeadRequest => {
  return {
    name: sanitizeHtml(data.name.trim()),
    email: data.email.toLowerCase().trim(),
    company: sanitizeHtml(data.company.trim()),
    phone: data.phone ? sanitizeHtml(data.phone.trim()) : undefined,
    role: data.role,
    employees: data.employees ? sanitizeHtml(data.employees) : undefined,
    useCase: data.useCase ? sanitizeHtml(data.useCase.trim()) : undefined,
    csrfToken: data.csrfToken
  };
};

// Rate limiting (simple in-memory implementation)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3;
  
  const record = rateLimits.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    return false;
  }
  
  record.count++;
  return true;
};

const generateSecureCredentials = (role: string): { email: string; password: string; role: string } => {
  // Generate cryptographically secure password
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const password = 'Demo' + Array.from(array, byte => 
    'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'[byte % 54]
  ).join('').substring(0, 12) + '!';
  
  const email = role === 'Partner Admin' ? 'demo-partner@vendorhub.com' : 'demo-vendor@vendorhub.com';
  
  return { email, password, role };
};

const generateSessionId = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const createDemoUser = async (credentials: { email: string; password: string; role: string }, sessionId: string, supabase: any) => {
  try {
    console.log(`[DEMO USER CREATION] Starting creation for: ${credentials.email}`);
    console.log(`[DEMO USER CREATION] Session ID: ${sessionId}`);
    console.log(`[DEMO USER CREATION] Role: ${credentials.role}`);
    
    // First, check if user already exists and delete if so
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(user => user.email === credentials.email);
      
      if (existingUser) {
        console.log(`[DEMO USER CREATION] Found existing user ${credentials.email}, deleting...`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (deleteError) {
          console.error(`[DEMO USER CREATION] Failed to delete existing user:`, deleteError);
        } else {
          console.log(`[DEMO USER CREATION] Successfully deleted existing user`);
        }
      }
    } catch (listError) {
      console.error(`[DEMO USER CREATION] Error checking for existing users:`, listError);
    }

    // Create user in Supabase Auth with enhanced logging
    console.log(`[DEMO USER CREATION] Creating auth user with data:`, {
      email: credentials.email,
      role: credentials.role,
      sessionId: sessionId,
      passwordLength: credentials.password.length
    });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: credentials.email,
      password: credentials.password,
      email_confirm: true,
      user_metadata: {
        name: `Demo ${credentials.role}`,
        role: credentials.role,
        demo_session_id: sessionId,
        demo_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_demo_user: true
      }
    });

    if (authError) {
      console.error(`[DEMO USER CREATION] Auth user creation failed:`, {
        error: authError,
        message: authError.message,
        status: authError.status
      });
      throw new Error(`Failed to create demo user: ${authError.message}`);
    }

    if (!authData?.user) {
      console.error(`[DEMO USER CREATION] No user data returned from auth creation`);
      throw new Error('No user data returned from auth creation');
    }

    console.log(`[DEMO USER CREATION] Auth user created successfully:`, {
      userId: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // Create user profile with enhanced error handling
    try {
      console.log(`[DEMO USER CREATION] Creating user profile for user ID: ${authData.user.id}`);
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: `Demo ${credentials.role}`,
          email: credentials.email,
          role: credentials.role,
          partner_id: credentials.role === 'Partner Admin' ? crypto.randomUUID() : null
        });

      if (profileError) {
        console.error(`[DEMO USER CREATION] Profile creation error:`, profileError);
        // Don't throw here, we can still proceed with the demo even without profile
        console.log(`[DEMO USER CREATION] Continuing without profile creation`);
      } else {
        console.log(`[DEMO USER CREATION] Profile created successfully`);
      }
    } catch (profileError) {
      console.error(`[DEMO USER CREATION] Profile creation exception:`, profileError);
    }

    console.log(`[DEMO USER CREATION] Demo user creation completed successfully`);
    return authData.user;
    
  } catch (error) {
    console.error(`[DEMO USER CREATION] Fatal error in createDemoUser:`, {
      error: error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    console.log(`[DEMO REGISTRATION] Processing new demo registration request`);
    
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      console.log(`[DEMO REGISTRATION] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    console.log(`[DEMO REGISTRATION] Environment check:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      hasResendKey: !!resendApiKey
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[DEMO REGISTRATION] Missing required environment variables`);
      throw new Error('Missing required environment configuration');
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);
    
    const leadData: DemoLeadRequest = await req.json();
    console.log(`[DEMO REGISTRATION] Processing registration for email: ${leadData.email}`);

    // Validate input
    const validation = validateInput(leadData);
    if (!validation.isValid) {
      console.log(`[DEMO REGISTRATION] Validation failed:`, validation.errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Sanitize input
    const sanitizedData = sanitizeInput(leadData);
    console.log(`[DEMO REGISTRATION] Data sanitized for: ${sanitizedData.email}`);

    // Generate secure demo credentials and session ID
    const demoCredentials = generateSecureCredentials(sanitizedData.role);
    const sessionId = generateSessionId();

    console.log(`[DEMO REGISTRATION] Generated credentials:`, {
      email: demoCredentials.email,
      role: demoCredentials.role,
      sessionId: sessionId,
      passwordLength: demoCredentials.password.length
    });

    // Create demo user in Supabase Auth - this is the critical step
    let demoUser = null;
    let userCreationSuccess = false;
    
    try {
      console.log(`[DEMO REGISTRATION] Attempting to create demo user...`);
      demoUser = await createDemoUser(demoCredentials, sessionId, supabase);
      userCreationSuccess = true;
      console.log(`[DEMO REGISTRATION] Demo user created successfully with ID: ${demoUser?.id}`);
    } catch (userError) {
      console.error(`[DEMO REGISTRATION] CRITICAL: Demo user creation failed:`, {
        error: userError,
        message: userError.message,
        stack: userError.stack
      });
      
      // Return error immediately if user creation fails
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create demo user account. Please try again.',
          details: userError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Only proceed with lead registration if user creation was successful
    if (!userCreationSuccess || !demoUser) {
      console.error(`[DEMO REGISTRATION] User creation verification failed`);
      return new Response(
        JSON.stringify({ 
          error: 'Demo user account creation could not be verified. Please try again.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Insert lead into database
    console.log(`[DEMO REGISTRATION] Inserting lead data into database...`);
    const { data: lead, error: insertError } = await supabase
      .from('demo_leads')
      .insert({
        name: sanitizedData.name,
        email: sanitizedData.email,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        role: sanitizedData.role,
        employees: sanitizedData.employees,
        use_case: sanitizedData.useCase,
        session_id: sessionId,
        demo_credentials: demoCredentials,
        demo_started_at: new Date().toISOString(),
        follow_up_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[DEMO REGISTRATION] Database insertion error:`, insertError);
      throw new Error('Failed to register demo lead');
    }

    console.log(`[DEMO REGISTRATION] Lead stored in database with ID: ${lead.id}`);

    // Send emails (don't fail the request if emails fail)
    try {
      const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'admin@vendorhub.com';

      // Send admin notification email
      await resend.emails.send({
        from: 'VendorHub Demo <demo@vendorhub.com>',
        to: [adminEmail],
        subject: `🚨 New Demo Registration: ${sanitizedData.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">New Demo Lead Registration</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #334155;">Contact Information</h3>
              <p><strong>Name:</strong> ${sanitizedData.name}</p>
              <p><strong>Email:</strong> ${sanitizedData.email}</p>
              <p><strong>Company:</strong> ${sanitizedData.company}</p>
              <p><strong>Phone:</strong> ${sanitizedData.phone || 'Not provided'}</p>
              <p><strong>Role Interest:</strong> ${sanitizedData.role}</p>
              <p><strong>Company Size:</strong> ${sanitizedData.employees || 'Not specified'}</p>
            </div>

            ${sanitizedData.useCase ? `
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #334155;">Use Case</h3>
                <p>${sanitizedData.useCase}</p>
              </div>
            ` : ''}

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #166534;">Demo Session Details</h3>
              <p><strong>Session ID:</strong> ${sessionId}</p>
              <p><strong>Role:</strong> ${demoCredentials.role}</p>
              <p><strong>Demo User Created:</strong> ${demoUser ? 'Yes' : 'No'}</p>
              <p><strong>Demo User ID:</strong> ${demoUser?.id || 'N/A'}</p>
              <p><strong>Registration Time:</strong> ${new Date().toISOString()}</p>
            </div>
          </div>
        `,
      });
      console.log(`[DEMO REGISTRATION] Admin notification sent successfully`);
    } catch (emailError) {
      console.error(`[DEMO REGISTRATION] Failed to send admin notification:`, emailError);
    }

    try {
      // Send welcome email to prospect
      await resend.emails.send({
        from: 'VendorHub Demo <demo@vendorhub.com>',
        to: [sanitizedData.email],
        subject: '🎉 Your VendorHub Demo is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
              <h1 style="color: #16a34a; margin-bottom: 10px;">Welcome to VendorHub!</h1>
              <p style="color: #64748b; font-size: 18px;">Your personalized demo environment is ready</p>
            </div>

            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0;">
              <h2 style="color: #334155; margin-top: 0;">Hi ${sanitizedData.name},</h2>
              <p style="color: #475569; line-height: 1.6;">
                Thank you for your interest in VendorHub! We've set up a personalized demo environment 
                where you can explore our platform as a <strong>${sanitizedData.role}</strong>.
              </p>
            </div>

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #166534;">🔐 Your Demo Credentials</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${demoCredentials.email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${demoCredentials.password}</p>
              </div>
              <p style="color: #166534; font-size: 12px; margin-top: 10px;">
                ⚠️ These credentials are for demo purposes only and will expire after 30 minutes of inactivity.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://your-app-url.com'}/auth" 
                 style="background: #16a34a; color: white; padding: 15px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block;">
                Start Your Demo Experience →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">⏰ Demo Session Details</h3>
              <ul style="color: #b45309; margin: 10px 0; padding-left: 20px;">
                <li>Duration: 30 minutes of active use</li>
                <li>Full platform access with sample data</li>
                <li>No commitment required</li>
                <li>Secure, isolated environment</li>
              </ul>
            </div>

            <div style="padding: 20px 0; border-top: 1px solid #e2e8f0; margin-top: 40px;">
              <p style="color: #64748b; text-align: center; margin: 0;">
                Questions? Reply to this email or use our chat support on the website.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`[DEMO REGISTRATION] Welcome email sent successfully`);
    } catch (emailError) {
      console.error(`[DEMO REGISTRATION] Failed to send welcome email:`, emailError);
    }

    console.log(`[DEMO REGISTRATION] Registration completed successfully for: ${sanitizedData.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: sessionId,
        credentials: demoCredentials,
        leadId: lead.id,
        demoUserCreated: userCreationSuccess,
        demoUserId: demoUser?.id
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error(`[DEMO REGISTRATION] Fatal error in demo lead registration:`, {
      error: error,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process demo registration. Please try again.',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
