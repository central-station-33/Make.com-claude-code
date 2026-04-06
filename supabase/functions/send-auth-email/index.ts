
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { emailTemplates } from "./emailTemplates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailParams {
  type: 'invitation' | 'reset' | 'verification';
  email: string;
  token?: string;
  name?: string;
  role?: string;
  teamName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Starting send-auth-email function");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: SendEmailParams = await req.json();
    const baseUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";
    
    const template = emailTemplates[params.type];
    if (!template) {
      throw new Error("Invalid email type");
    }

    const emailResponse = await resend.emails.send({
      from: "Onboarding <onboarding@resend.dev>",
      to: [params.email],
      subject: template.subject,
      html: template.html({ ...params, baseUrl }),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    console.error("Full error details:", {
      message: error.message,
      name: error.name,
      status: error.status,
      response: error.response
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
