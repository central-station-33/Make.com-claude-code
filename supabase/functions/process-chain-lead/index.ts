import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Seller in a property chain — they are selling AND buying simultaneously
interface ChainSellerPayload {
  // Seller identity
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  // Property being sold
  sale_address: string;
  sale_property_type?: string;
  sale_asking_price?: string;
  // Property being purchased (next link in chain)
  purchase_address?: string;
  purchase_price?: string;
  // Chain details
  chain_position?: string;   // "top" | "middle" | "bottom"
  chain_length?: string;     // total number of links, e.g. "3"
  mortgage_status?: string;  // "approved" | "in progress" | "not started"
  solicitor_name?: string;
  target_completion?: string;
  notes?: string;
  source?: string;
}

interface ChainQualification {
  chain_risk: "low" | "medium" | "high";
  summary: string;
  follow_up_priority: "urgent" | "normal" | "low";
  weak_links: string;
  recommended_action: string;
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

    const payload: ChainSellerPayload = await req.json();
    console.log("Received chain seller payload:", payload);

    if (!payload.email || !payload.sale_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and sale_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = [payload.first_name, payload.last_name].filter(Boolean).join(" ") || "Unknown";

    // --- Claude chain risk assessment (25s timeout) ---
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
        system: `You are a real estate chain risk analyst.
Assess the seller's position in a property chain and return ONLY a valid JSON object (no markdown) with exactly these fields:
{
  "chain_risk": "low" | "medium" | "high",
  "summary": "<one sentence describing the seller's chain situation>",
  "follow_up_priority": "urgent" | "normal" | "low",
  "weak_links": "<comma-separated list of risk factors, or 'none'>",
  "recommended_action": "<specific next step for the agent>"
}

Risk guide:
- low: mortgage approved, solicitor instructed, short or no chain, clear timeline
- medium: mortgage in progress, chain length 2-3, some unknowns
- high: no mortgage yet, long chain (4+), missing solicitor, vague timeline or chain position unknown`,
        messages: [
          {
            role: "user",
            content: `Assess this seller's chain:
Name: ${name}
Selling: ${payload.sale_address} (${payload.sale_property_type ?? "type unknown"}) at ${payload.sale_asking_price ?? "price unknown"}
Buying: ${payload.purchase_address ?? "not specified"} at ${payload.purchase_price ?? "unknown"}
Chain position: ${payload.chain_position ?? "unknown"}
Chain length: ${payload.chain_length ?? "unknown"}
Mortgage status: ${payload.mortgage_status ?? "unknown"}
Solicitor: ${payload.solicitor_name ?? "not instructed"}
Target completion: ${payload.target_completion ?? "not set"}
Notes: ${payload.notes ?? "none"}`,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    let qualification: ChainQualification = {
      chain_risk: "medium",
      summary: "Chain seller received — risk assessment unavailable",
      follow_up_priority: "normal",
      weak_links: "assessment unavailable",
      recommended_action: "Contact seller to gather chain details",
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

    const rawPrice = payload.sale_asking_price?.replace(/[^0-9.]/g, "");
    const askingPrice = rawPrice ? parseFloat(rawPrice) : null;

    // --- Insert as SELLER lead with chain metadata ---
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name,
        email: payload.email,
        phone: payload.phone ?? null,
        type: "SELLER",
        status: "New",
        source: payload.source ?? "WordPress Chain Form",
        property_type: payload.sale_property_type ?? null,
        budget: askingPrice,
        location: payload.sale_address,
        notes: [
          qualification.summary,
          `Chain risk: ${qualification.chain_risk}`,
          `Weak links: ${qualification.weak_links}`,
          `Recommended action: ${qualification.recommended_action}`,
          payload.notes ? `Additional notes: ${payload.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        distribution_status: qualification.follow_up_priority === "urgent" ? "priority" : "pending",
        source_details: {
          scenario_type: "chain",
          chain_risk: qualification.chain_risk,
          follow_up_priority: qualification.follow_up_priority,
          weak_links: qualification.weak_links,
          recommended_action: qualification.recommended_action,
          chain_position: payload.chain_position ?? null,
          chain_length: payload.chain_length ?? null,
          mortgage_status: payload.mortgage_status ?? null,
          solicitor_name: payload.solicitor_name ?? null,
          target_completion: payload.target_completion ?? null,
          purchase_address: payload.purchase_address ?? null,
          purchase_price: payload.purchase_price ?? null,
          qualified_by: "claude-haiku-4-5-20251001",
        },
      })
      .select()
      .single();

    if (leadError) throw leadError;

    const { error: contactError } = await supabase
      .from("crm_contacts")
      .insert({
        lead_id: lead.id,
        status: "active",
        source: payload.source ?? "WordPress Chain Form",
        lifecycle_stage: "new",
      });

    if (contactError) throw contactError;

    await supabase.from("system_logs").insert({
      action: "chain_seller_intake",
      details: `Chain seller created: ${name} | Risk: ${qualification.chain_risk} | ${payload.sale_address}`,
      type: "system",
    });

    console.log("Chain seller lead created:", lead.id, "risk:", qualification.chain_risk);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        chain_risk: qualification.chain_risk,
        follow_up_priority: qualification.follow_up_priority,
        summary: qualification.summary,
        recommended_action: qualification.recommended_action,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing chain seller lead:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
