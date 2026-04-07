import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  console.log("Starting send-invitation function");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    console.log("Raw request body:", body);

    const { email, token, teamName = "JRA" }: { email: string; token: string; teamName?: string } = JSON.parse(body);
    
    if (!email || !token) {
      console.error("Missing required parameters:", { email, token });
      throw new Error("Email and token are required");
    }

    const baseUrl = Deno.env.get("APP_BASE_URL") ?? "https://jrapaid.retool.com";
    const inviteUrl = `${baseUrl}/auth?invite=${token}`;
    
    console.log("Sending invitation email to:", email);
    console.log("Invite URL:", inviteUrl);

    const emailResponse = await resend.emails.send({
      from: `${teamName} <onboarding@resend.dev>`,
      to: [email],
      subject: `You're invited to join ${teamName}!`,
      html: `
        <h1>Welcome to ${teamName}!</h1>
        <p>You've been invited to join ${teamName}. Click the link below to create your account:</p>
        <p><a href="${inviteUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${inviteUrl}</p>
        <p>This invitation link will expire in 24 hours.</p>
        <p>Best regards,<br>The ${teamName} Team</p>
      `,
      tags: [
        { name: 'invitation_sent', value: 'true' },
        { name: 'team', value: teamName }
      ]
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.body || "No response body"
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.response?.body || "No additional details available"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);