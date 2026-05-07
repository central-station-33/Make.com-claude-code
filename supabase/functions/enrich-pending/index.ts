import { createClient } from "npm:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";

const buildPrompt = (p: Record<string, unknown>) =>
  `You are a real estate investment analyst. Analyze this distressed property and return ONLY valid JSON.

Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}
Deal Type: ${p.deal_type} | Score: ${p.composite_score}/100 (${p.priority_tier})
ARV: $${p.estimated_arv} | Owed: $${p.amount_owed} | Asking: $${p.asking_price}
Owner: ${p.owner_name} | Type: ${p.owner_type}
Indicators: ${(p.distress_indicators as string[] || []).join(", ")}

Return ONLY this JSON:
{
  "investment_thesis": "2-3 sentence thesis",
  "profit_potential": { "best_strategy": "wholesale|fix_and_flip|buy_and_hold", "wholesale_fee": 0, "fix_and_flip_profit": 0 },
  "risks": ["risk1", "risk2"],
  "contact_strategy": "specific outreach approach",
  "talking_points": ["point1", "point2", "point3"],
  "recommended_offer": 0,
  "max_allowable_offer": 0
}`;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("enrichment_status", "pending")
    .limit(5);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!properties?.length) return new Response(JSON.stringify({ message: "No pending properties" }));

  const results = [];
  for (const prop of properties) {
    await supabase.from("properties").update({ enrichment_status: "processing" }).eq("id", prop.id);
    try {
      const msg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(prop) }],
      });
      const text = (msg.content[0] as { text: string }).text;
      const ai = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      await supabase.from("properties").update({
        ai_analysis: ai,
        enrichment_status: "complete",
        ai_enriched_at: new Date().toISOString(),
      }).eq("id", prop.id);
      results.push({ address: prop.address, status: "enriched", strategy: ai.profit_potential?.best_strategy });
    } catch (e) {
      await supabase.from("properties").update({ enrichment_status: "failed" }).eq("id", prop.id);
      results.push({ address: prop.address, status: "failed", error: String(e) });
    }
  }

  return new Response(JSON.stringify({ enriched: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
