
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'magic_link' | 'password_reset';
  link?: string;
  token?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, link, token }: AuthEmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, email);

    let subject: string;
    let html: string;
    let actionUrl: string;

    // For now, we'll use the provided link or generate a basic one
    // In production, you'd want to integrate more deeply with Supabase's token system
    const baseUrl = link || (type === 'magic_link' 
      ? 'https://vendorhubos.com/auth#type=magiclink' 
      : 'https://vendorhubos.com/auth#type=recovery');

    if (type === 'magic_link') {
      subject = "Your Magic Link - VendorHub";
      actionUrl = baseUrl;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px; font-size: 28px;">VendorHub</h1>
            <p style="color: #666; margin: 0;">Partner Management Platform</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px;">Sign In to Your Account</h2>
            <p style="margin-bottom: 25px; color: #4b5563; line-height: 1.6;">
              You requested a magic link to sign in to your VendorHub account. Click the button below to access your dashboard.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background-color: #16a34a; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Sign In to VendorHub
              </a>
            </div>
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <a href="${actionUrl}" style="color: #16a34a; word-break: break-all;">${actionUrl}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
              If you didn't request this login link, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 VendorHub. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else {
      subject = "Reset Your Password - VendorHub";
      actionUrl = baseUrl;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px; font-size: 28px;">VendorHub</h1>
            <p style="color: #666; margin: 0;">Partner Management Platform</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 30px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
            <h2 style="color: #dc2626; margin-bottom: 20px; font-size: 24px;">Password Reset Request</h2>
            <p style="margin-bottom: 25px; color: #4b5563; line-height: 1.6;">
              You requested to reset your password for your VendorHub account. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background-color: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Your Password
              </a>
            </div>
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <a href="${actionUrl}" style="color: #dc2626; word-break: break-all;">${actionUrl}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 0;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 VendorHub. All rights reserved.
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "VendorHub <noreply@vendorhubos.com>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
