const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Validate environment variables format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
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
    const token = event.queryStringParameters?.token;

    // Input validation
    if (!token) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Missing invitation token' }),
      };
    }

    // Validate token format (should be base64url encoded)
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid token format' }),
      };
    }

    // Use secure token validation function
    const { data: invitationData, error: validationError } = await supabase
      .rpc('validate_invitation_token', { p_token: token });

    if (validationError || !invitationData || invitationData.length === 0) {
      console.error('Token validation error:', validationError);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid or expired invitation token' }),
      };
    }

    const invitation = invitationData[0];

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        invitation_id: invitation.invitation_id,
        organization_id: invitation.organization_id,
        organization_name: invitation.organization_name,
        email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invited_by_name,
        expires_at: invitation.expires_at
      }),
    };

  } catch (error) {
    console.error('Invitation validation error:', error);
    
    // Don't expose detailed error information to prevent information leakage
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Unable to validate invitation' }),
    };
  }
};