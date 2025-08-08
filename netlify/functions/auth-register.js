const { createClient } = require('@supabase/supabase-js');
const { withSecurity, errorResponse, successResponse } = require('./_security');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define validation schema for registration
const registrationValidation = {
  email: 'email',
  password: 'password',
  first_name: 'name',
  last_name: 'name',
  organization_name: 'organizationName',
  role: 'userRole',
  phone: 'phone',
  plan: 'subscriptionTier'
};

// Main handler wrapped with security middleware
const registerHandler = async (event, context, sanitizedData) => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      organization_name, 
      role = 'broker', // Default to broker for new registrations
      phone, 
      plan = 'solo' // Default plan
    } = sanitizedData;

    // Additional business logic validation
    if (role !== 'broker') {
      return errorResponse(400, 'Only brokers can register new organizations');
    }

    if (!organization_name) {
      return errorResponse(400, 'Organization name is required for broker registration');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return errorResponse(409, 'User with this email already exists');
    }

    // Create Supabase user with proper error handling
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for demo purposes
      user_metadata: {
        first_name,
        last_name,
        role
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      // Don't expose detailed auth errors to prevent enumeration
      const userFriendlyMessage = authError.message.includes('email') 
        ? 'Invalid email address'
        : 'Unable to create account';
      return errorResponse(400, userFriendlyMessage);
    }

    // Create organization with transaction safety
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization_name,
        subscription_tier: plan,
        contact_info: { phone: phone || null },
        settings: { 
          created_by: authData.user.id,
          setup_completed: false 
        }
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      // Clean up auth user if org creation fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      return errorResponse(400, 'Unable to create organization');
    }

    // Create user record with proper error handling
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        organization_id: orgData.id,
        email,
        role,
        first_name,
        last_name,
        phone,
        is_active: true,
        last_login: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Clean up auth user and organization if user creation fails
      try {
        await Promise.all([
          supabase.auth.admin.deleteUser(authData.user.id),
          supabase.from('organizations').delete().eq('id', orgData.id)
        ]);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      return errorResponse(400, 'Unable to create user account');
    }

    return successResponse({
      user: {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      },
      organization: {
        id: orgData.id,
        name: orgData.name,
        subscription_tier: orgData.subscription_tier
      },
      message: 'Registration successful'
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(500, 'Registration failed');
  }
};

// Export handler wrapped with security middleware
exports.handler = withSecurity(registerHandler, {
  method: 'POST',
  validation: registrationValidation,
  rateLimit: { maxAttempts: 3, windowMinutes: 15 } // Stricter rate limiting for registration
});