import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmt$ = (v: unknown) =>
  v ? `$${Number(v).toLocaleString()}` : "unknown";

const buildPrompt = (p: Record<string, unknown>): string => {
  const indicators = (p.distress_indicators as string[] || []).join(", ") || "none";
  const burntNote  = p.burnt_out_landlord_score
    ? `\nBurnt-Out Landlord Score: ${p.burnt_out_landlord_score}/100`
    : "";
  const burntSigs  = p.burnt_out_signals
    ? `\nBurnt-Out Signals: ${JSON.stringify(p.burnt_out_signals)}`
    : "";

  return `You are a sharp real estate investment analyst specializing in distressed NY/NJ properties. Return ONLY valid JSON — no markdown, no explanation.

PROPERTY: ${p.address}, ${p.city}, ${p.state} ${p.zip}
SCORE: ${p.composite_score}/100 — ${p.priority_tier} | Deal Type: ${p.deal_type}

FINANCIALS:
  ARV: ${fmt$(p.estimated_arv)} | Owed: ${fmt$(p.amount_owed)} | Asking: ${fmt$(p.asking_price)}
  Assessed: ${fmt$(p.assessed_value)} | Equity: ${fmt$(p.equity)} (${p.equity_percentage ?? "?"}%) | Below Market: ${p.below_market_percentage ?? "?"}%

DISTRESS SIGNALS: ${indicators}
PROCESS STAGE: ${p.process_stage || "unknown"} | Notice: ${p.notice_date || "none"} | Auction: ${p.auction_date || "none"}${burntNote}${burntSigs}

OWNER: ${p.owner_name || "unknown"} | Type: ${p.owner_type || "unknown"} | State: ${p.owner_state || "?"}
CONTACT: Phone: ${p.owner_phone ? "YES" : "NO"} | Email: ${p.owner_email ? "YES" : "NO"} | Mailing Address: ${p.owner_mailing_address ? "YES" : "NO"}

PROPERTY DETAILS: ${p.property_type || "unknown"} | ${p.bedrooms ?? "?"}bd / ${p.bathrooms ?? "?"}ba | ${p.square_footage ?? "?"}sqft | Built: ${p.year_built ?? "?"}

Respond with ONLY this JSON:
{
  "investment_thesis": "2-3 sentences specific to this distress type, location, and owner situation",
  "best_strategy": "wholesale|fix_and_flip|buy_and_hold|subject_to",
  "profit_potential": {
    "wholesale_fee": 0,
    "fix_and_flip_profit": 0,
    "max_allowable_offer": 0,
    "recommended_offer": 0
  },
  "risks": ["risk specific to this deal", "risk 2", "risk 3"],
  "contact_strategy": "specific opening line and approach given the owner type and distress situation",
  "talking_points": ["tailored point 1", "tailored point 2", "tailored point 3"],
  "red_flags": ["anything that needs verification before making offer"],
  "priority_action": "single most important step to take within 48 hours"
}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  let limit = 10;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.limit) limit = Math.min(Number(body.limit), 25);
  } catch { /* no body */ }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("enrichment_status", "pending")
    .order("composite_score", { ascending: false }) // best leads first
    .limit(limit);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!properties?.length) {
    return new Response(
      JSON.stringify({ enriched: 0, message: "No pending properties" }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const results = [];

  for (const prop of properties) {
    await supabase
      .from("properties")
      .update({ enrichment_status: "processing" })
      .eq("id", prop.id);

    try {
      // Tier 1 gets Sonnet for best analysis quality — Tier 2 gets Haiku for cost efficiency
      const model =
        prop.priority_tier === "Tier 1"
          ? "claude-sonnet-4-6"
          : "claude-haiku-4-5-20251001";

      const msg = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(prop) }],
      });

      const text = (msg.content[0] as { text: string }).text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in Claude response");

      const ai = JSON.parse(jsonMatch[0]);

      await supabase
        .from("properties")
        .update({
          ai_analysis:    ai,
          enrichment_status: "complete",
          ai_enriched_at: new Date().toISOString(),
        })
        .eq("id", prop.id);

      results.push({
        id:         prop.id,
        address:    prop.address,
        tier:       prop.priority_tier,
        model,
        status:     "enriched",
        strategy:   ai.best_strategy,
        max_offer:  ai.profit_potential?.max_allowable_offer,
      });
    } catch (e) {
      await supabase
        .from("properties")
        .update({ enrichment_status: "failed" })
        .eq("id", prop.id);
      results.push({ id: prop.id, address: prop.address, status: "failed", error: String(e) });
    }
  }

  const enriched = results.filter((r) => r.status === "enriched").length;
  return new Response(
    JSON.stringify({ enriched, results }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
});
