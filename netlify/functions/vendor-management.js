import { createClient } from '@supabase/supabase-js';

export const handler = async (event, context) => {
  // Initialize Supabase client with service role for admin operations
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Initialize Supabase client with anon key for token validation
  const supabaseAuth = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get the action from query parameters or path
    const { action } = event.queryStringParameters || {};
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    
    console.log('🔍 Vendor management request:', {
      action,
      method,
      queryParams: event.queryStringParameters,
      path: event.path,
      headers: event.headers
    });
    
    // Get user from Authorization header
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Token validation error:', authError);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Route to appropriate handler based on action and method
    if (!action) {
      console.error('❌ No action parameter found');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No action specified',
          debug: {
            queryParams: event.queryStringParameters,
            path: event.path
          }
        })
      };
    }
    
    switch (action) {
      case 'invite-vendor':
        if (method === 'POST') {
          return await handleInviteVendor(body, user, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for invite-vendor' })
        };
      
      case 'create-vendor':
        if (method === 'POST') {
          return await handleCreateVendor(body, user, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for create-vendor' })
        };
      
      case 'list-vendors':
        if (method === 'GET') {
          return await handleListVendors(user, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for list-vendors' })
        };
      
      case 'vendor-details':
        if (method === 'GET') {
          const { vendor_id } = event.queryStringParameters || {};
          return await handleGetVendorDetails(vendor_id, user, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for vendor-details' })
        };
      
      case 'update-vendor':
        if (method === 'PUT') {
          return await handleUpdateVendor(body, user, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for update-vendor' })
        };
      
      case 'register-vendor':
        if (method === 'POST') {
          return await handleVendorRegistration(body, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for register-vendor' })
        };
      
      case 'validate-token':
        if (method === 'GET') {
          const { token } = event.queryStringParameters || {};
          return await handleValidateToken(token, supabase);
        }
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed for validate-token' })
        };
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action or method' })
        };
    }

  } catch (error) {
    console.error('Vendor management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Handler functions
async function handleInviteVendor(body, user, supabase) {
  const { vendor_name, contact_email, contact_phone, business_type } = body;
  
  // Check if user has permission (Super Admin or Partner Admin)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!profile || !['Super Admin', 'Partner Admin'].includes(profile.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions' })
    };
  }

  // Generate invitation token
  const invitationToken = crypto.randomUUID();
  
  // Create vendor record with pending status
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      vendor_name,
      contact_email,
      contact_phone,
      business_type,
      invitation_status: 'pending',
      invitation_token: invitationToken,
      invited_by: user.id,
      invited_at: new Date().toISOString()
    })
    .select()
    .single();

  if (vendorError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: vendorError.message })
    };
  }

  // TODO: Send invitation email (implement email service)
  console.log(`Invitation sent to ${contact_email} with token ${invitationToken}`);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'Vendor invitation sent successfully',
      vendor_id: vendor.id,
      invitation_token: invitationToken
    })
  };
}

async function handleCreateVendor(body, user, supabase) {
  const { vendor_name, contact_email, contact_phone, business_type, user_id } = body;
  
  // Check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!profile || !['Super Admin', 'Partner Admin'].includes(profile.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions' })
    };
  }

  // Create vendor record
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .insert({
      vendor_name,
      contact_email,
      contact_phone,
      business_type,
      user_id,
      invitation_status: 'accepted',
      created_by: user.id
    })
    .select()
    .single();

  if (vendorError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: vendorError.message })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'Vendor created successfully',
      vendor
    })
  };
}

async function handleListVendors(user, supabase) {
  // Check permissions
  const { data: profile } = await supabase
    .from('users')
    .select('role, partner_id')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'User profile not found' })
    };
  }

  let query = supabase.from('vendors').select('*');
  
  // Filter based on role
  if (profile.role === 'Partner Admin' && profile.partner_id) {
    query = query.eq('partner_id', profile.partner_id);
  } else if (profile.role !== 'Super Admin') {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions' })
    };
  }

  const { data: vendors, error } = await query;

  if (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendors })
  };
}

async function handleGetVendorDetails(vendorId, user, supabase) {
  if (!vendorId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Vendor ID required' })
    };
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (error) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Vendor not found' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vendor })
  };
}

async function handleUpdateVendor(body, user, supabase) {
  const { vendor_id, ...updateData } = body;
  
  if (!vendor_id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Vendor ID required' })
    };
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', vendor_id)
    .select()
    .single();

  if (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'Vendor updated successfully',
      vendor
    })
  };
}

async function handleVendorRegistration(body, supabase) {
  const { token, full_name, business_name, contact_email, phone_number, password } = body;
  
  if (!token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invitation token required' })
    };
  }

  // Find vendor by invitation token
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('invitation_token', token)
    .eq('invitation_status', 'pending')
    .single();

  if (vendorError || !vendor) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired invitation token' })
    };
  }

  // Create user account
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: contact_email,
    password: password,
    email_confirm: true
  });

  if (authError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: authError.message })
    };
  }

  // Update vendor record
  const { error: updateError } = await supabase
    .from('vendors')
    .update({
      user_id: authUser.user.id,
      vendor_name: business_name,
      contact_email,
      contact_phone: phone_number,
      invitation_status: 'accepted',
      registered_at: new Date().toISOString()
    })
    .eq('id', vendor.id);

  if (updateError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: updateError.message })
    };
  }

  // Create user record in users table
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: contact_email,
      full_name,
      role: 'Vendor',
      partner_id: vendor.partner_id
    });

  if (userError) {
    console.error('User record creation error:', userError);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'Vendor registration completed successfully',
      user_id: authUser.user.id
    })
  };
}

async function handleValidateToken(token, supabase) {
  if (!token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Token is required' })
    };
  }

  // Find vendor by invitation token
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('invitation_token', token)
    .eq('invitation_status', 'pending')
    .single();

  if (vendorError || !vendor) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired invitation token' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vendor_name: vendor.vendor_name,
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone,
      business_type: vendor.business_type
    })
  };
}