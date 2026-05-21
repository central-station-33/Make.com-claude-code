
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
      max_tokens: 4096,
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
    const { brand, topic, audience } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Run all research steps in parallel for speed
    const [queryResearch, contentGaps, topicClusters] = await Promise.all([

      // Step 1: Query Research — what people actually ask AI engines
      callClaude(apiKey,
        "You are an AI search behavior expert who deeply understands how people query ChatGPT, Claude, Perplexity, and Gemini for service businesses.",
        `Research the search landscape for "${topic}" targeting "${audience}" for a business called "${brand}".

Identify the exact queries ${audience} type into AI search engines.

Return JSON only:
{
  "high_intent_queries": [{"query": string, "volume": "high"|"medium"|"low", "type": "buy"|"compare"|"learn"|"find"}],
  "informational_queries": [{"query": string, "content_format": "guide"|"faq"|"listicle"|"comparison"}],
  "local_queries": [{"query": string, "location_modifier": string}],
  "pain_point_queries": [{"query": string, "pain_point": string}],
  "primary_intent": string,
  "buyer_journey_stage": "awareness"|"consideration"|"decision"
}`
      ),

      // Step 2: Content Gap Analysis
      callClaude(apiKey,
        "You are a content strategy expert specializing in AI search gap analysis.",
        `Analyze content gaps for "${brand}" in the "${topic}" space targeting "${audience}".

What content is currently underserved by AI search engines for this topic?

Return JSON only:
{
  "gaps": [
    {
      "topic": string,
      "reason_underserved": string,
      "opportunity_score": number (1-10),
      "recommended_format": "landing-page"|"blog-post"|"faq"|"guide"|"comparison",
      "target_query": string
    }
  ],
  "quick_wins": [{"action": string, "estimated_impact": string, "effort": "low"|"medium"|"high"}],
  "competitive_opportunities": string[]
}`
      ),

      // Step 3: Topic Cluster Strategy
      callClaude(apiKey,
        "You are an AI search topic cluster strategist. Design content architectures that dominate AI search results.",
        `Design a topic cluster strategy for "${brand}" around "${topic}" for "${audience}".

Return JSON only:
{
  "pillar_topic": string,
  "pillar_description": string,
  "clusters": [
    {
      "cluster_name": string,
      "subtopics": string[],
      "search_volume_potential": "high"|"medium"|"low",
      "ai_citation_likelihood": "high"|"medium"|"low",
      "recommended_content_type": string
    }
  ],
  "content_calendar": [
    {"week": number, "topic": string, "format": string, "priority": "high"|"medium"|"low"}
  ]
}`
      ),
    ]);

    // Parse all results
    const parse = (raw: string): unknown => {
      try { return JSON.parse(raw); } catch { return { raw }; }
    };

    return new Response(JSON.stringify({
      queries: parse(queryResearch),
      gaps: parse(contentGaps),
      clusters: parse(topicClusters),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Intent research error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
