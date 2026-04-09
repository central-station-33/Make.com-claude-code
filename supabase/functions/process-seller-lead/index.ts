import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Payload sent by Make.com from the WordPress seller form
interface SellerLeadPayload {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  property_address: string;
  property_type?: string;   // e.g. "Single Family", "Condo", "Multi-Family"
  asking_price?: string;    // raw string from form, e.g. "450000" or "$450,000"
  timeline?: string;        // e.g. "ASAP", "1-3 months", "6+ months"
  motivation?: string;      // reason for selling
  condition?: string;       // property condition description
  source?: string;          // WordPress form / campaign name
}

// Claude's structured qualification output
interface SellerQualification {
  lead_score: "hot" | "warm" | "cold";
  summary: string;
  follow_up_priority: "urgent" | "normal" | "low";
  estimated_price: number | null;
  notes: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: SellerLeadPayload = await req.json();
    console.log("Received seller lead payload:", payload);

    // Basic validation
    if (!payload.email || !payload.property_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and property_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = [payload.first_name, payload.last_name].filter(Boolean).join(" ") || "Unknown";

    // --- Claude qualification (25s timeout) ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: `You are a real estate lead qualification assistant.
Analyze the seller lead details and return ONLY a valid JSON object (no markdown) with these fields:
{
  "lead_score": "hot" | "warm" | "cold",
  "summary": "<one sentence summary of the seller and property>",
  "follow_up_priority": "urgent" | "normal" | "low",
  "estimated_price": <number or null>,
  "notes": "<key observations for the agent>"
}

Scoring guide:
- hot: motivated seller (divorce, relocation, financial distress), ASAP timeline, priced near market
- warm: flexible timeline, reasonable price expectations
- cold: testing the market, unrealistic price, no urgency`,
        messages: [
          {
            role: "user",
            content: `Qualify this seller lead:
Name: ${name}
Property: ${payload.property_address}
Type: ${payload.property_type || "Not specified"}
Asking price: ${payload.asking_price || "Not specified"}
Timeline: ${payload.timeline || "Not specified"}
Motivation: ${payload.motivation || "Not specified"}
Condition: ${payload.condition || "Not specified"}`,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    let qualification: SellerQualification = {
      lead_score: "warm",
      summary: "Seller lead received — qualification unavailable",
      follow_up_priority: "normal",
      estimated_price: null,
      notes: "",
    };

    if (claudeResponse.ok) {
      const claudeData = await claudeResponse.json();
      try {
        qualification = JSON.parse(claudeData.content[0].text);
      } catch {
        console.error("Failed to parse Claude qualification JSON, using defaults");
      }
    } else {
      console.error("Claude API error:", claudeResponse.status);
    }

    // Parse asking price to a number
    const rawPrice = payload.asking_price?.replace(/[^0-9.]/g, "");
    const askingPrice = rawPrice ? parseFloat(rawPrice) : (qualification.estimated_price ?? null);

    // --- Insert lead ---
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        email: payload.email,
        phone: payload.phone ?? null,
        type: "SELLER",
        status: "New",
        source: payload.source ?? "WordPress Seller Form",
        property_type: payload.property_type ?? null,
        budget: askingPrice,
        location: payload.property_address,
        notes: [
          qualification.summary,
          qualification.notes,
          payload.motivation ? `Motivation: ${payload.motivation}` : null,
          payload.timeline ? `Timeline: ${payload.timeline}` : null,
          payload.condition ? `Condition: ${payload.condition}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        distribution_status: qualification.follow_up_priority === "urgent" ? "priority" : "pending",
        source_details: {
          lead_score: qualification.lead_score,
          follow_up_priority: qualification.follow_up_priority,
          asking_price_raw: payload.asking_price ?? null,
          timeline: payload.timeline ?? null,
          motivation: payload.motivation ?? null,
          condition: payload.condition ?? null,
          qualified_by: "claude-haiku-4-5-20251001",
        },
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // --- Create CRM contact ---
    const { error: contactError } = await supabase
      .from("crm_contacts")
      .insert({
        lead_id: lead.id,
        status: "active",
        source: payload.source ?? "WordPress Seller Form",
        lifecycle_stage: "new",
      });

    if (contactError) throw contactError;

    // --- Audit log ---
    await supabase.from("system_logs").insert({
      action: "seller_lead_intake",
      details: `Seller lead created: ${name} | Score: ${qualification.lead_score} | ${payload.property_address}`,
      type: "system",
    });

    console.log("Seller lead created:", lead.id, "score:", qualification.lead_score);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        lead_score: qualification.lead_score,
        follow_up_priority: qualification.follow_up_priority,
        summary: qualification.summary,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing seller lead:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
