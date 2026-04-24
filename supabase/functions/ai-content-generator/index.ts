import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  type: "landing-page" | "blog-post" | "faq" | "guide" | "grade" | "llmstxt";
  topic?: string;
  brand?: string;
  audience?: string;
  content?: string;
  url?: string;
  pages?: { path: string; description: string }[];
  options?: Record<string, boolean>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (body.type) {
      case "landing-page":
        systemPrompt = "You are an expert copywriter specializing in AI-search-optimized landing pages. Write content that ranks well in ChatGPT, Claude, Perplexity, and Gemini results. Use clear headings, answer common questions, include trust signals, and write in a professional yet approachable tone.";
        userPrompt = `Create a complete landing page for:\n- Business: ${body.brand}\n- Topic/Service: ${body.topic}\n- Target audience: ${body.audience}\n\nInclude: hero headline, value proposition, how it works (3 steps), benefits, FAQ section (5 questions), and a clear CTA. Format with markdown headings.`;
        break;

      case "blog-post":
        systemPrompt = "You are an SEO and AI search expert creating blog content optimized for both traditional Google search and AI search engines. Write informative, authoritative content with clear structure.";
        userPrompt = `Write a comprehensive blog post about "${body.topic}" for ${body.audience}, published by ${body.brand}.\n\nInclude: engaging intro, 5-7 main sections with H2 headings, practical advice, FAQ section, and conclusion with CTA. Aim for 800-1200 words.`;
        break;

      case "faq":
        systemPrompt = "You are an expert at creating FAQ content optimized for AI search. Write clear, direct answers that AI engines can easily cite and surface to users.";
        userPrompt = `Create a comprehensive FAQ page about "${body.topic}" for ${body.audience}, from ${body.brand}.\n\nGenerate 12-15 questions covering: basics, process, costs, results, and how to get started. Format as Q: / A: pairs.`;
        break;

      case "guide":
        systemPrompt = "You are a professional content strategist. Create detailed, structured guides that help readers accomplish specific goals. Content should be comprehensive and actionable.";
        userPrompt = `Create a step-by-step guide on "${body.topic}" for ${body.audience}, from ${body.brand}.\n\nInclude: introduction, 4-5 chapters with practical steps, common mistakes to avoid, resources section, and next steps. Use clear markdown formatting.`;
        break;

      case "grade":
        systemPrompt = "You are an AI search optimization expert. Analyze content and provide a detailed score (0-100) for how well it will perform in AI search engines like ChatGPT, Claude, Perplexity, and Gemini.";
        userPrompt = `Analyze this content for AI search optimization:\n\nURL: ${body.url || "Not provided"}\n\nContent:\n${body.content}\n\nProvide a JSON response with:\n- overall_score (0-100)\n- categories: [{name, score, feedback, pass}] for: Content Clarity, Structured Headings, Entity Mentions, Question Coverage, Credibility Signals, URL Structure\n- top_issues: [string]\n- strengths: [string]`;
        break;

      case "llmstxt":
        systemPrompt = "You are an expert in AI crawler optimization. Generate well-structured llms.txt files that help AI systems accurately understand and represent websites.";
        userPrompt = `Generate an llms.txt file for:\n- Site: ${body.brand}\n- URL: ${body.url}\n- Pages: ${JSON.stringify(body.pages)}\n\nFollow the llms.txt specification format with site description, page index with descriptions, AI instructions, and permissions block.`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid content type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({ result: text, type: body.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
