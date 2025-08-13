const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.VITE_RESEND_API_KEY;
const appUrl = process.env.VITE_APP_URL || process.env.URL;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Validate environment variables format
if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid Supabase URL format');
}

// Create a client for token validation using anon key (for auth.getUser)
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

const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
    const { email, firstName, lastName, phone, message } = JSON.parse(event.body || '{}');

    // Input validation
    if (!email || !firstName || !lastName) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: email, firstName, lastName' 
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
    
    console.log('🔍 Debug - Token validation starting...');
    console.log('🔍 Debug - Token length:', token?.length);
    console.log('🔍 Debug - Using auth client with URL:', supabaseUrl);
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    console.log('🔍 Debug - Auth result:', { user: user?.id, error: userError?.message });

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

    // Use admin client if available, otherwise use auth client with user context
    let dbClient;
    if (supabaseAdmin) {
      dbClient = supabaseAdmin;
      console.log('🔍 Debug - Using database client: admin (service key)');
    } else {
      // Set the user session for RLS context
      await supabaseAuth.auth.setSession({
        access_token: token,
        refresh_token: 'dummy_refresh_token'
      });
      dbClient = supabaseAuth;
      console.log('🔍 Debug - Using database client: auth (anon key with user session)');
    }

    // Get broker's user profile
    const { data: brokerProfile, error: profileError } = await dbClient
      .from('users')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .eq('role', 'broker')
      .single();

    if (profileError || !brokerProfile) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Only brokers can send vendor invitations' }),
      };
    }

    // Check if vendor already exists or has pending invitation
    const { data: existingVendor } = await dbClient
      .from('users')
      .select('id, role, organization_id')
      .eq('email', email)
      .single();

    if (existingVendor) {
      if (existingVendor.organization_id === brokerProfile.organization_id) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'This vendor is already in your organization' }),
        };
      } else {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'This user already exists in another organization' }),
        };
      }
    }

    // Check for pending invitations
    const { data: pendingInvitation } = await dbClient
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', brokerProfile.organization_id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (pendingInvitation) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'An invitation to this email is already pending' }),
      };
    }

    // Generate invitation token using the database function
    const { data: tokenData, error: tokenError } = await dbClient
      .rpc('generate_invitation_token', {
        p_organization_id: brokerProfile.organization_id,
        p_invited_by: brokerProfile.id,
        p_email: email,
        p_role: 'vendor',
        p_expires_hours: 72 // 3 days
      });

    if (tokenError || !tokenData) {
      console.error('Token generation error:', tokenError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to generate invitation token' }),
      };
    }

    const invitationToken = tokenData;
    const invitationUrl = `${appUrl}/vendor-signup?token=${invitationToken}`;

    // Send email if Resend is configured
    let emailSent = false;
    if (resend && resendApiKey) {
      try {
        const emailResult = await resend.emails.send({
          from: 'VendorHub OS <noreply@vendorhub-os.com>',
          to: [email],
          subject: `Invitation to join ${brokerProfile.organizations.name} on VendorHub OS`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Vendor Invitation - VendorHub OS</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
                    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
                    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                    .footer { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center; font-size: 14px; color: #6b7280; }
                    .message-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 15px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Join ${brokerProfile.organizations.name} on VendorHub OS</p>
                    </div>
                    <div class="content">
                        <p>Hi ${firstName},</p>
                        <p><strong>${brokerProfile.first_name} ${brokerProfile.last_name}</strong> from <strong>${brokerProfile.organizations.name}</strong> has invited you to join their vendor network on VendorHub OS.</p>
                        
                        ${message ? `<div class="message-box"><p><strong>Personal message from ${brokerProfile.first_name}:</strong></p><p><em>"${message}"</em></p></div>` : ''}
                        
                        <p>VendorHub OS is a modern equipment financing platform that makes it easy to:</p>
                        <ul>
                            <li>Submit and track equipment financing deals</li>
                            <li>Communicate directly with brokers</li>
                            <li>Access competitive financing options</li>
                            <li>Manage your deal pipeline efficiently</li>
                        </ul>
                        
                        <p>Click the button below to accept your invitation and create your account:</p>
                        <p style="text-align: center;">
                            <a href="${invitationUrl}" class="button">Accept Invitation</a>
                        </p>
                        
                        <p><small>If the button doesn't work, copy and paste this URL into your browser:<br>
                        <a href="${invitationUrl}">${invitationUrl}</a></small></p>
                        
                        <p><strong>Important:</strong> This invitation expires in 72 hours. If you have any questions, please contact ${brokerProfile.first_name} directly.</p>
                    </div>
                    <div class="footer">
                        <p>This invitation was sent by ${brokerProfile.organizations.name} via VendorHub OS</p>
                        <p>© 2024 VendorHub OS. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
          `,
          text: `
You're invited to join ${brokerProfile.organizations.name} on VendorHub OS

Hi ${firstName},

${brokerProfile.first_name} ${brokerProfile.last_name} from ${brokerProfile.organizations.name} has invited you to join their vendor network on VendorHub OS.

${message ? `Personal message from ${brokerProfile.first_name}: "${message}"` : ''}

VendorHub OS is a modern equipment financing platform that makes it easy to:
- Submit and track equipment financing deals
- Communicate directly with brokers  
- Access competitive financing options
- Manage your deal pipeline efficiently

To accept your invitation and create your account, visit:
${invitationUrl}

This invitation expires in 72 hours. If you have any questions, please contact ${brokerProfile.first_name} directly.

---
This invitation was sent by ${brokerProfile.organizations.name} via VendorHub OS
© 2024 VendorHub OS. All rights reserved.
          `
        });

        if (emailResult?.id) {
          emailSent = true;
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the invitation if email fails - token is still created
      }
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Vendor invitation sent successfully',
        invitation_url: invitationUrl,
        email_sent: emailSent,
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours from now
      }),
    };

  } catch (error) {
    console.error('Vendor invitation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.vendorhub-os.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to send vendor invitation' }),
    };
  }
};