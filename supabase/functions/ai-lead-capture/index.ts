import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function callClaude(apiKey: string, system: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leads } = body; // Array of leads to score/enrich
    if (!leads || !Array.isArray(leads)) throw new Error("leads array required");

    // Score and enrich each lead with Claude
    const enriched = await Promise.all(leads.map(async (lead: Record<string, unknown>) => {
      const scoring = await callClaude(apiKey,
        "You are an AI lead qualification expert for a professional services business. Score and enrich lead data with precision.",
        `Analyze and score this lead:

Name: ${lead.name ?? "Unknown"}
Email: ${lead.email ?? ""}
Phone: ${lead.phone ?? ""}
Source: ${lead.source ?? "unknown"}
Message/Notes: ${lead.notes ?? lead.message ?? ""}
Query that brought them: ${lead.search_query ?? ""}
AI Engine Source: ${lead.ai_source ?? "direct"}
Status: ${lead.status ?? "new"}

Return JSON only:
{
  "quality_score": number (0-100),
  "intent_level": "high"|"medium"|"low",
  "lead_type": "BUYER"|"SELLER"|"INVESTOR"|"CONTRACTOR",
  "urgency": "immediate"|"short-term"|"long-term"|"unknown",
  "recommended_action": string,
  "follow_up_message": string (personalized 2-sentence follow-up to send),
  "key_signals": string[],
  "risk_flags": string[],
  "estimated_value": "high"|"medium"|"low",
  "next_best_action": string,
  "ai_source_credibility": number (0-100, how reliable is this lead source)
}`
      );

      let scoreData: Record<string, unknown> = {};
      try { scoreData = JSON.parse(scoring); } catch { scoreData = { quality_score: 50 }; }

      return { ...lead, ai_enrichment: scoreData, enriched_at: new Date().toISOString() };
    }));

    // If leads have IDs, update them in the database
    for (const lead of enriched) {
      if (lead.id) {
        await supabase.from("leads").update({
          metadata: {
            ...(typeof lead.metadata === "object" && lead.metadata !== null ? lead.metadata : {}),
            ai_enrichment: lead.ai_enrichment,
          }
        }).eq("id", lead.id);
      }
    }

    // Generate batch insights
    const batchInsights = await callClaude(apiKey,
      "You are an AI sales intelligence analyst.",
      `Analyze this batch of ${enriched.length} leads and provide strategic insights:

${JSON.stringify(enriched.map(l => ({ name: l.name, source: l.source, ai_enrichment: l.ai_enrichment })), null, 2)}

Return JSON only:
{
  "batch_summary": string,
  "avg_quality_score": number,
  "top_priority_count": number,
  "source_breakdown": {"ai_search": number, "direct": number, "other": number},
  "recommended_focus": string,
  "pipeline_value_estimate": string,
  "team_actions": string[]
}`
    );

    let batchData: Record<string, unknown> = {};
    try { batchData = JSON.parse(batchInsights); } catch { batchData = {}; }

    return new Response(JSON.stringify({ enriched_leads: enriched, batch_insights: batchData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Lead capture error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
