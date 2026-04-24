/**
 * F50SEO — Seed Content Plan
 * Generates Week 1 drafts for JET Realty Advisors and writes them to content_queue.
 * Called from the ContentPlan UI "Generate Week 1 Drafts" button.
 *
 * Produces 10 drafts:
 *   - 2 pillar intro blog posts (Neighborhood Authority + Seller Guide)
 *   - 6 cluster articles (3 buyer, 3 seller)
 *   - 1 market intelligence report
 *   - 1 agent recruitment article
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function claude(apiKey: string, system: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return d.content?.[0]?.text ?? "";
}

const JRA_SYSTEM = `You are the lead content writer for JET Realty Advisors (JRA), a premier real estate brokerage serving New York and New Jersey.

Brand voice: Authoritative, hyperlocal, direct. You write for F50SEO — JRA's AI search dominance engine. Every piece is structured for AEO (Answer Engine Optimization): direct answer first, then depth. Content must be specific to NY/NJ — real neighborhoods, real commute times, real market data. Never generic.

Format: Markdown with ## headings. Always open with a 2–3 sentence direct answer paragraph that AI engines can cite. Include an FAQ section with 5 Q&As. End with a CTA to contact JET Realty Advisors.`;

const WEEK1_ARTICLES = [
  {
    title: "The Complete Guide to Buying a Home in New Jersey (2026)",
    topic: "buying a home NJ",
    audience: "first-time home buyers in New Jersey",
    type: "blog-post",
    pillar: "Buyer Journey",
    tags: ["home buying", "New Jersey", "first-time buyer", "mortgage", "2026"],
  },
  {
    title: "How to Sell Your Home Fast in NJ: The JRA Seller Playbook (2026)",
    topic: "selling a home NJ fast",
    audience: "home sellers in New Jersey",
    type: "blog-post",
    pillar: "Seller",
    tags: ["home selling", "NJ real estate", "seller guide", "home staging", "2026"],
  },
  {
    title: "How Much Do I Need for a Down Payment in New Jersey?",
    topic: "down payment NJ home purchase",
    audience: "first-time buyers researching finances",
    type: "blog-post",
    pillar: "Buyer Journey",
    tags: ["down payment", "NJ mortgage", "home buying", "first-time buyer"],
  },
  {
    title: "First-Time Homebuyer Programs in New Jersey 2026",
    topic: "NJ first-time homebuyer assistance programs",
    audience: "first-time buyers in NJ looking for financial assistance",
    type: "blog-post",
    pillar: "Buyer Journey",
    tags: ["first-time buyer", "NJ programs", "down payment assistance", "NJHMFA"],
  },
  {
    title: "What Is My Home Worth in New Jersey? (2026 Valuation Guide)",
    topic: "NJ home valuation and pricing",
    audience: "NJ homeowners considering selling",
    type: "blog-post",
    pillar: "Seller",
    tags: ["home value", "NJ real estate", "home appraisal", "CMA", "seller"],
  },
  {
    title: "Home Staging Tips That Sell NJ Homes Faster (And for More)",
    topic: "home staging for NJ sellers",
    audience: "NJ home sellers preparing to list",
    type: "blog-post",
    pillar: "Seller",
    tags: ["home staging", "NJ real estate", "sell faster", "listing tips"],
  },
  {
    title: "NJ Real Estate Market Report — May 2026",
    topic: "New Jersey real estate market update May 2026",
    audience: "buyers, sellers, and investors monitoring the NJ market",
    type: "blog-post",
    pillar: "Market Intelligence",
    tags: ["NJ market", "real estate data", "market report", "2026", "housing inventory"],
  },
  {
    title: "Jersey City vs Hoboken: Which Should You Choose in 2026?",
    topic: "Jersey City vs Hoboken living comparison",
    audience: "NYC relocators and buyers considering Hudson County NJ",
    type: "blog-post",
    pillar: "Neighborhood Authority",
    tags: ["Jersey City", "Hoboken", "NJ neighborhoods", "NYC commute", "Hudson County"],
  },
  {
    title: "Why Top Real Estate Agents Are Joining JET Realty Advisors in 2026",
    topic: "joining JET Realty Advisors brokerage NJ NY",
    audience: "real estate agents evaluating brokerages in NJ and NY",
    type: "blog-post",
    pillar: "Agent Recruitment",
    tags: ["agent recruitment", "NJ brokerage", "JET Realty", "real estate career", "2026"],
  },
  {
    title: "Moving from NYC to New Jersey: The Honest Guide (2026)",
    topic: "relocating from NYC to New Jersey",
    audience: "NYC residents considering a move to NJ",
    type: "blog-post",
    pillar: "Relocation",
    tags: ["NYC to NJ", "relocation", "NJ suburbs", "commuter towns", "moving guide"],
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const runId = crypto.randomUUID();
    const today = new Date().toISOString().split("T")[0];

    console.log(`Seeding ${WEEK1_ARTICLES.length} Week 1 drafts (run ${runId})`);

    // Generate all articles — batch in groups of 3 to avoid overwhelming the API
    const results = [];
    for (let i = 0; i < WEEK1_ARTICLES.length; i += 3) {
      const batch = WEEK1_ARTICLES.slice(i, i + 3);
      const batchResults = await Promise.all(batch.map(async (article) => {
        const body = await claude(apiKey, JRA_SYSTEM,
          `Write a complete, AEO-optimized blog post for JET Realty Advisors:

Title: "${article.title}"
Topic: ${article.topic}
Target audience: ${article.audience}
Content pillar: ${article.pillar}

Requirements:
- Open with a 2–3 sentence direct answer paragraph (AI citation block)
- Use ## headings throughout
- Include specific NJ/NY data, neighborhoods, and market context
- Include an FAQ section with 5 Q&As using real questions buyers/sellers ask
- 800–1,000 words
- End with: "Ready to take the next step? Contact JET Realty Advisors — NJ/NY's AI-powered real estate team."
- Markdown format

Write the full post:`
        );

        return {
          agent_run_id: runId,
          scheduled_for: today,
          status: "pending",
          content_type: article.type,
          title: article.title,
          body,
          tags: article.tags,
          brand: "JET Realty Advisors",
          topic: article.topic,
          audience: article.audience,
          platform_data: { pillar: article.pillar, week: 1, seeded: true },
        };
      }));
      results.push(...batchResults);
    }

    const { error: insertErr } = await supabase.from("content_queue").insert(results);
    if (insertErr) throw insertErr;

    // Also generate social variants for the top 3 articles
    const socialPlatforms = ["linkedin", "twitter", "facebook", "instagram"];
    const topArticles = results.slice(0, 3);

    const socialPosts = [];
    for (const article of topArticles) {
      for (const platform of socialPlatforms) {
        const platformPrompts: Record<string, string> = {
          linkedin: `Write a 200-word LinkedIn post for JET Realty Advisors promoting this blog: "${article.title}". Professional tone, include 3 hashtags.`,
          twitter: `Write a 5-tweet thread for JET Realty Advisors about: "${article.title}". Format: [1/5]... [2/5]... etc.`,
          facebook: `Write a 150-word Facebook post for JET Realty Advisors about: "${article.title}". Conversational, end with a question to drive comments.`,
          instagram: `Write an Instagram caption for JET Realty Advisors about: "${article.title}". 3 short paragraphs + 12 hashtags.`,
        };

        const body = await claude(apiKey,
          "You write social media content for JET Realty Advisors, a NY/NJ real estate brokerage. Keep it brand-consistent, local, and engaging.",
          platformPrompts[platform]
        );

        socialPosts.push({
          agent_run_id: runId,
          scheduled_for: today,
          status: "pending",
          content_type: platform,
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${article.title}`,
          body,
          brand: "JET Realty Advisors",
          topic: article.topic,
          platform_data: { pillar: article.platform_data?.pillar, week: 1, source_blog: article.title },
        });
      }
    }

    if (socialPosts.length) {
      const { error: socialErr } = await supabase.from("content_queue").insert(socialPosts);
      if (socialErr) console.error("Social insert error:", socialErr);
    }

    return new Response(
      JSON.stringify({
        run_id: runId,
        blog_drafts: results.length,
        social_drafts: socialPosts.length,
        total: results.length + socialPosts.length,
        message: `${results.length + socialPosts.length} drafts added to Review Queue`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Seed error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
