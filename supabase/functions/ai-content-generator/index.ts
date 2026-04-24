import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function callClaude(apiKey: string, system: string, messages: {role: string, content: string}[]): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 4096, system, messages }),
  });
  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// Multi-step content generation agent
async function runContentAgent(apiKey: string, type: string, topic: string, brand: string, audience: string) {
  const steps: {step: string, output: string}[] = [];

  // Step 1: Intent Research
  const intent = await callClaude(apiKey,
    "You are an AI search intent research specialist. Analyze search behavior across ChatGPT, Claude, Perplexity, and Gemini.",
    [{role: "user", content:
      `Research the search intent behind "${topic}" for "${audience}".

Return a JSON object with:
- primary_intent: string (what they really want)
- pain_points: string[] (top 5 pain points)
- common_queries: string[] (top 8 queries people actually ask AI engines)
- content_angle: string (best angle to rank in AI search)
- tone: string (recommended tone: professional/conversational/authoritative)

JSON only, no markdown.`}]
  );

  let intentData: Record<string, unknown> = {};
  try { intentData = JSON.parse(intent); } catch { intentData = { primary_intent: intent }; }
  steps.push({ step: "Intent Research", output: intent });

  // Step 2: Content Structure
  const structure = await callClaude(apiKey,
    "You are a content architecture specialist for AI search optimization. Design content outlines that maximize visibility in AI-generated answers.",
    [{role: "user", content:
      `Design the optimal structure for a ${type} about "${topic}" for ${brand}, targeting "${audience}".

Context from intent research:
${JSON.stringify(intentData, null, 2)}

Return a JSON object with:
- title: string
- meta_description: string (160 chars max)
- sections: [{heading: string, purpose: string, key_points: string[]}]
- faq_questions: string[] (5 questions AI engines commonly surface)
- word_count_target: number

JSON only, no markdown.`}]
  );

  let structureData: Record<string, unknown> = {};
  try { structureData = JSON.parse(structure); } catch { structureData = { title: structure }; }
  steps.push({ step: "Content Structure", output: structure });

  // Step 3: Write Content in Brand Voice
  const content = await callClaude(apiKey,
    `You are an expert content writer specializing in AI search optimization for ${brand}. Write authoritative, helpful content that AI engines love to cite. Use clear headings, answer questions directly, include specific details and credibility signals.`,
    [{role: "user", content:
      `Write a complete ${type} for ${brand} about "${topic}", targeting "${audience}".

Use this structure:
${JSON.stringify(structureData, null, 2)}

Brand voice context:
- Business: ${brand}
- Target audience: ${audience}
- Primary intent: ${intentData.primary_intent ?? topic}
- Recommended tone: ${intentData.tone ?? "professional"}

Requirements:
- Write in markdown format
- Include all sections from the structure
- Answer the FAQ questions with direct, citable answers
- Include trust signals (years of experience, client results, credentials)
- End with a clear call to action
- Target word count: ${structureData.word_count_target ?? 800}+ words

Write the full content now:`}]
  );

  steps.push({ step: "Content Writing", output: content });

  // Step 4: AI Optimization Pass
  const optimized = await callClaude(apiKey,
    "You are an AI search optimization expert. Refine content to maximize citations and visibility in ChatGPT, Claude, Perplexity, and Gemini results.",
    [{role: "user", content:
      `Optimize this content for AI search visibility. Keep the full content but improve:
1. Add a concise summary paragraph at the top (AI engines often pull this)
2. Ensure every key claim is specific and citable
3. Add entity clarity (who/what/where/when for key points)
4. Strengthen FAQ answers to be direct and quotable
5. Verify headings are scannable questions or clear statements

Original content:
${content}

Return the optimized full content in markdown:`}]
  );

  steps.push({ step: "AI Optimization", output: optimized });

  return { steps, final: optimized, structure: structureData, intent: intentData };
}

// Real content grading via Claude
async function runGraderAgent(apiKey: string, content: string, url: string) {
  const result = await callClaude(apiKey,
    "You are an AI search optimization auditor. Analyze content with expert precision and return structured JSON scores.",
    [{role: "user", content:
      `Analyze this content for AI search optimization. Grade it as if you are evaluating whether ChatGPT, Claude, Perplexity, or Gemini would cite it in responses.

URL: ${url || "Not provided"}

Content:
${content}

Return a JSON object (no markdown, JSON only):
{
  "overall": <number 0-100>,
  "categories": [
    {
      "name": "Content Clarity",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    },
    {
      "name": "Structured Headings",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    },
    {
      "name": "Entity & Fact Density",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    },
    {
      "name": "Question Coverage",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    },
    {
      "name": "Credibility Signals",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    },
    {
      "name": "Citation Readiness",
      "score": <0-100>,
      "feedback": "<specific actionable feedback>",
      "pass": <boolean>
    }
  ],
  "top_issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "ai_engines": {
    "chatgpt": <0-100>,
    "claude": <0-100>,
    "perplexity": <0-100>,
    "gemini": <0-100>
  },
  "quick_wins": ["<specific fix that would most improve score>", "<fix 2>", "<fix 3>"]
}`}]
  );

  try {
    return JSON.parse(result);
  } catch {
    return { overall: 50, categories: [], top_issues: [result], strengths: [], ai_engines: {}, quick_wins: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: unknown;

    if (body.type === "grade") {
      result = await runGraderAgent(apiKey, body.content ?? "", body.url ?? "");
    } else {
      result = await runContentAgent(apiKey, body.type, body.topic, body.brand, body.audience);
    }

    return new Response(JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Agent error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
