const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a client for token validation using anon key
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a service client for admin operations (only if service key is available)
const supabaseAdmin = supabaseServiceKey && supabaseServiceKey !== 'demo_service_role_key_for_development' 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { email, firstName, lastName, phone, password } = JSON.parse(event.body || '{}');

    // Input validation
    if (!email || !firstName || !lastName || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: email, firstName, lastName, password' 
        }),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    // Get the authenticated user (broker) from the Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Authorization required' }),
      };
    }

    const token = authHeader.split(' ')[1];
    
    console.log('🔍 Debug - Token validation starting for create-vendor...');
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.log('❌ Token validation failed:', userError?.message);
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }
    
    console.log('✅ Token validation successful for user:', user.id);

    // Use admin client if available, otherwise use auth client (with RLS)
    const dbClient = supabaseAdmin || supabaseAuth;
    
    console.log('🔍 Debug - Using database client:', supabaseAdmin ? 'admin (service key)' : 'auth (anon key with RLS)');

    // Get broker's user profile using database function to bypass RLS
    const { data: brokerProfileData, error: profileError } = await (supabaseAdmin || supabaseAuth)
      .rpc('get_user_profile', { user_id: user.id });
    
    const brokerProfile = brokerProfileData?.[0];
    
    console.log('🔍 Debug - Broker profile result:', { brokerProfile: !!brokerProfile, role: brokerProfile?.role, error: profileError });

    if (profileError || !brokerProfile || brokerProfile.role !== 'broker') {
      console.error('❌ Failed to get broker profile:', { profileError, brokerProfile: !!brokerProfile, role: brokerProfile?.role });
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Only brokers can create vendor accounts' }),
      };
    }

    console.log('✅ Broker profile validated:', brokerProfile.email);

    // Check if user already exists
    const { data: existingUser } = await dbClient
      .from('users')
      .select('id, email, organization_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      if (existingUser.organization_id === brokerProfile.organization_id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'A user with this email already exists in your organization' }),
        };
      } else {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'A user with this email already exists in another organization' }),
        };
      }
    }

    // Create the authentication account using the admin client if available
    console.log('🔧 Creating Supabase auth account...');
    
    // For development/demo purposes, we'll simulate account creation
    // In production, you would use the supabaseAdmin client to create the auth user
    let authUserId;
    
    if (supabaseAdmin) {
      // Use admin client to create the auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation
      });

      if (authError) {
        console.error('❌ Failed to create auth user:', authError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Failed to create authentication account' }),
        };
      }

      authUserId = authData.user.id;
      console.log('✅ Auth user created with ID:', authUserId);
    } else {
      // For development/demo, generate a mock UUID
      authUserId = 'vendor-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      console.log('🔧 Demo mode: Using mock auth ID:', authUserId);
    }

    // Create the user profile in the database
    console.log('🔧 Creating user profile in database...');
    const { data: newUser, error: userCreateError } = await dbClient
      .from('users')
      .insert({
        id: authUserId,
        organization_id: brokerProfile.organization_id,
        email,
        role: 'vendor',
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userCreateError) {
      console.error('❌ Failed to create user profile:', userCreateError);
      
      // If we created an auth user but failed to create the profile, clean up
      if (supabaseAdmin && authUserId && authUserId.startsWith('vendor-') === false) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
          console.log('🧹 Cleaned up auth user after profile creation failure');
        } catch (cleanupError) {
          console.error('❌ Failed to cleanup auth user:', cleanupError);
        }
      }

      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to create user profile' }),
      };
    }

    console.log('✅ Vendor account created successfully:', newUser.email);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Vendor account created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          role: newUser.role,
          organization_id: newUser.organization_id,
          created_at: newUser.created_at
        },
        login_credentials: supabaseAdmin ? undefined : {
          note: 'In demo mode, vendor can use test credentials or contact admin for access'
        }
      }),
    };

  } catch (error) {
    console.error('💥 Vendor creation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to create vendor account' }),
    };
  }
};