import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Starting API keys test function");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const results = {
    resend: { status: "untested", error: null },
    rapidapi: { status: "untested", error: null },
    anthropic: { status: "untested", error: null },
  };

  // Test Resend API
  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    console.log("Testing Resend API...");
    const testEmail = await resend.emails.send({
      from: "JRA <onboarding@resend.dev>",
      to: "test@resend.dev",
      subject: "API Test",
      html: "<p>This is a test email.</p>",
    });
    results.resend.status = "working";
    console.log("Resend API test successful");
  } catch (error) {
    console.error("Resend API test failed:", error);
    results.resend.status = "failed";
    results.resend.error = error.message;
  }

  // Test RapidAPI
  try {
    console.log("Testing RapidAPI...");
    const rapidApiResponse = await fetch("https://" + Deno.env.get("RAPIDAPI_HOST"), {
      headers: {
        "X-RapidAPI-Key": Deno.env.get("RAPIDAPI_KEY") || "",
        "X-RapidAPI-Host": Deno.env.get("RAPIDAPI_HOST") || "",
      },
    });
    if (rapidApiResponse.ok) {
      results.rapidapi.status = "working";
      console.log("RapidAPI test successful");
    } else {
      throw new Error(`HTTP error! status: ${rapidApiResponse.status}`);
    }
  } catch (error) {
    console.error("RapidAPI test failed:", error);
    results.rapidapi.status = "failed";
    results.rapidapi.error = error.message;
  }

  // Test Anthropic API
  try {
    console.log("Testing Anthropic API...");
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
    });
    if (anthropicResponse.ok) {
      results.anthropic.status = "working";
      console.log("Anthropic API test successful");
    } else {
      throw new Error(`HTTP error! status: ${anthropicResponse.status}`);
    }
  } catch (error) {
    console.error("Anthropic API test failed:", error);
    results.anthropic.status = "failed";
    results.anthropic.error = error.message;
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
};

serve(handler);