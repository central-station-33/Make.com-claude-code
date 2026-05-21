import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCalculatorRequest {
  recipientEmail: string;
  recipientName: string;
  propertyAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, recipientName, propertyAddress } = await req.json() as SendCalculatorRequest;

    console.log("Sending calculator to:", recipientEmail);

    const emailResponse = await resend.emails.send({
      from: "JRA Central Station <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: "Your Property Value Calculator",
      html: `
        <h1>Hello ${recipientName},</h1>
        <p>Thank you for your interest in calculating your property's value${propertyAddress ? ` for ${propertyAddress}` : ''}.</p>
        <p>Attached is your personalized Property Value Calculator worksheet. This tool will help you:</p>
        <ul>
          <li>Calculate your property's estimated market value</li>
          <li>Account for recent improvements and renovations</li>
          <li>Consider important market factors</li>
          <li>Factor in location-specific adjustments</li>
        </ul>
        <p>For the most accurate valuation, we recommend:</p>
        <ul>
          <li>Gathering recent comparable sales data from your neighborhood</li>
          <li>Having documentation of any major improvements</li>
          <li>Considering current market conditions</li>
        </ul>
        <p>Need help or want a professional opinion? Our team is here to assist you with a detailed market analysis.</p>
        <p>Best regards,<br>JRA Team</p>
      `,
      attachments: [
        {
          filename: "property-value-calculator.txt",
          content: getTemplateContent("calculator")
        }
      ]
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error sending calculator:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

const getTemplateContent = (type: string) => {
  // Copy the calculator template content here for the email attachment
  return `# Property Value Calculator...`; // Include the full template content
};

serve(handler);