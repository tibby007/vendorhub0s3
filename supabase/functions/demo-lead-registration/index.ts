
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DemoLeadRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  role: string;
  employees?: string;
  useCase?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const leadData: DemoLeadRequest = await req.json();
    console.log('Processing demo lead registration:', leadData);

    // Generate demo credentials based on role
    const demoCredentials = {
      email: leadData.role === 'Partner Admin' ? 'demo-partner@vendorhub.com' : 'demo-vendor@vendorhub.com',
      password: 'DemoPass123!',
      role: leadData.role
    };

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(7);

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('demo_leads')
      .insert({
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        phone: leadData.phone,
        role: leadData.role,
        employees: leadData.employees,
        use_case: leadData.useCase,
        session_id: sessionId,
        demo_credentials: demoCredentials,
        demo_started_at: new Date().toISOString(),
        follow_up_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw insertError;
    }

    console.log('Lead stored in database:', lead.id);

    // Send admin notification email
    try {
      await resend.emails.send({
        from: 'VendorHub Demo <demo@vendorhub.com>',
        to: ['admin@vendorhub.com'], // Replace with your admin email
        subject: `🚨 New Demo Registration: ${leadData.company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">New Demo Lead Registration</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #334155;">Contact Information</h3>
              <p><strong>Name:</strong> ${leadData.name}</p>
              <p><strong>Email:</strong> ${leadData.email}</p>
              <p><strong>Company:</strong> ${leadData.company}</p>
              <p><strong>Phone:</strong> ${leadData.phone || 'Not provided'}</p>
              <p><strong>Role Interest:</strong> ${leadData.role}</p>
              <p><strong>Company Size:</strong> ${leadData.employees || 'Not specified'}</p>
            </div>

            ${leadData.useCase ? `
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #334155;">Use Case</h3>
                <p>${leadData.useCase}</p>
              </div>
            ` : ''}

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #166534;">Demo Credentials Generated</h3>
              <p><strong>Email:</strong> ${demoCredentials.email}</p>
              <p><strong>Password:</strong> ${demoCredentials.password}</p>
              <p><strong>Role:</strong> ${demoCredentials.role}</p>
              <p><strong>Session ID:</strong> ${sessionId}</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              This lead has been automatically added to your SuperAdmin dashboard for follow-up.
            </p>
          </div>
        `,
      });
      console.log('Admin notification sent successfully');
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail the whole request if email fails
    }

    // Send welcome email to prospect
    try {
      await resend.emails.send({
        from: 'VendorHub Demo <demo@vendorhub.com>',
        to: [leadData.email],
        subject: '🎉 Your VendorHub Demo is Ready!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; padding: 40px 0;">
              <h1 style="color: #16a34a; margin-bottom: 10px;">Welcome to VendorHub!</h1>
              <p style="color: #64748b; font-size: 18px;">Your personalized demo environment is ready</p>
            </div>

            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 30px 0;">
              <h2 style="color: #334155; margin-top: 0;">Hi ${leadData.name},</h2>
              <p style="color: #475569; line-height: 1.6;">
                Thank you for your interest in VendorHub! We've set up a personalized demo environment 
                where you can explore our platform as a <strong>${leadData.role}</strong>.
              </p>
            </div>

            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin-top: 0; color: #166534;">🔐 Your Demo Credentials</h3>
              <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${demoCredentials.email}</p>
                <p style="margin: 5px 0;"><strong>Password:</strong> ${demoCredentials.password}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-app-url.com/auth" 
                 style="background: #16a34a; color: white; padding: 15px 30px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold; 
                        display: inline-block;">
                Start Your Demo Experience →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">⏰ Demo Session Details</h3>
              <ul style="color: #b45309; margin: 10px 0; padding-left: 20px;">
                <li>Duration: 30 minutes</li>
                <li>Full platform access with sample data</li>
                <li>No commitment required</li>
              </ul>
            </div>

            <div style="padding: 20px 0; border-top: 1px solid #e2e8f0; margin-top: 40px;">
              <p style="color: #64748b; text-align: center; margin: 0;">
                Need help? Reply to this email or contact our team.
              </p>
            </div>
          </div>
        `,
      });
      console.log('Welcome email sent successfully');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: sessionId,
        credentials: demoCredentials,
        leadId: lead.id 
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
    console.error('Error in demo lead registration:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process demo registration' 
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
