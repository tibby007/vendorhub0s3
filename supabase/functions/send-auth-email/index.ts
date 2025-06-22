
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'magic_link' | 'password_reset';
  link: string;
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

    if (type === 'magic_link') {
      subject = "Your Magic Link - VendorHub";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; margin-bottom: 20px;">VendorHub Login</h1>
          <p style="margin-bottom: 20px;">Click the button below to sign in to your VendorHub account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Sign In to VendorHub
            </a>
          </div>
          ${token ? `
          <p style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <strong>Or use this login code:</strong><br>
            <code style="font-size: 18px; font-weight: bold; color: #16a34a;">${token}</code>
          </p>
          ` : ''}
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you didn't request this login, you can safely ignore this email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            VendorHub - Partner Management Platform
          </p>
        </div>
      `;
    } else {
      subject = "Reset Your Password - VendorHub";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; margin-bottom: 20px;">Password Reset</h1>
          <p style="margin-bottom: 20px;">You requested to reset your password for your VendorHub account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            VendorHub - Partner Management Platform
          </p>
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
