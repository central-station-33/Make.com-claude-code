
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
    const { brand, keyword, queries } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Step 1: Generate realistic search queries people ask AI engines
    const queriesRaw = await callClaude(apiKey,
      "You are an AI search behavior analyst. Generate realistic queries that people type into ChatGPT, Claude, Perplexity, and Gemini.",
      `Generate 12 realistic search queries that potential customers would ask AI chatbots when looking for services related to "${keyword}". These should be natural conversational queries, not just keywords.

Brand to monitor: "${brand}"

Return JSON only:
{
  "queries": [
    {"query": string, "engine": "ChatGPT"|"Claude"|"Perplexity"|"Gemini", "intent": "navigational"|"informational"|"transactional"}
  ]
}`
    );

    let queryList: {query: string, engine: string, intent: string}[] = [];
    try {
      const parsed = JSON.parse(queriesRaw);
      queryList = parsed.queries ?? [];
    } catch {
      queryList = (queries ?? []).map((q: string) => ({ query: q, engine: "Claude", intent: "informational" }));
    }

    // Step 2: For each query, simulate how an AI engine would respond re: the brand
    const monitorPromises = queryList.slice(0, 8).map(async (q) => {
      const simulation = await callClaude(apiKey,
        `You are simulating how ${q.engine} would respond to a user query. Be realistic about whether you would mention "${brand}" based on typical AI search behavior.`,
        `A user asked: "${q.query}"

Simulate a realistic ${q.engine} response. Consider:
- Would you mention "${brand}" specifically?
- If yes, in what context and with what framing?
- What position would "${brand}" appear in the response (1st mention, 2nd, etc.)?
- What is the sentiment toward "${brand}"?

Return JSON only:
{
  "mentions_brand": boolean,
  "position": number (1-5, or 0 if not mentioned),
  "snippet": string (the exact excerpt mentioning the brand, or "Not mentioned" if absent),
  "sentiment": "positive"|"neutral"|"negative",
  "context": string (brief description of how brand was framed),
  "recommendation_strength": "strong"|"moderate"|"weak"|"none",
  "competitor_mentions": string[] (other brands mentioned in same response),
  "full_response_preview": string (first 200 chars of simulated response)
}`
      );

      let simData: Record<string, unknown> = {};
      try { simData = JSON.parse(simulation); } catch { simData = { mentions_brand: false, snippet: "Parse error", sentiment: "neutral" }; }

      return {
        engine: q.engine,
        query: q.query,
        intent: q.intent,
        ...simData,
      };
    });

    const mentions = await Promise.all(monitorPromises);

    // Step 3: Aggregate scoring and insights
    const insights = await callClaude(apiKey,
      "You are an AI visibility strategist. Analyze brand performance across AI search engines.",
      `Analyze these AI search monitoring results for "${brand}" targeting "${keyword}":

${JSON.stringify(mentions, null, 2)}

Return JSON only:
{
  "overall_visibility_score": number (0-100),
  "engine_scores": {
    "ChatGPT": number,
    "Claude": number,
    "Perplexity": number,
    "Gemini": number
  },
  "total_mentions": number,
  "mention_rate": number (percentage of queries where brand was mentioned),
  "avg_position": number,
  "sentiment_breakdown": {"positive": number, "neutral": number, "negative": number},
  "top_insights": string[],
  "improvement_actions": string[],
  "competitive_gap": string
}`
    );

    let insightData: Record<string, unknown> = {};
    try { insightData = JSON.parse(insights); } catch { insightData = {}; }

    return new Response(JSON.stringify({ mentions, insights: insightData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Search monitor error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
