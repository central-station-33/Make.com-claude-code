/**
 * IMPRINT Daily Content Runner
 * Triggered by Supabase cron (configure in Dashboard → Edge Functions → Cron).
 * Recommended schedule: "0 8 * * *" (8 AM daily)
 *
 * What it does:
 *  1. Loads automation_settings for all active users
 *  2. For each user: runs Intent Research to pick today's topic
 *  3. Generates blog post (4-step agent)
 *  4. Generates social variants (LinkedIn, Twitter/X, Facebook, Instagram)
 *  5. Writes all drafts to content_queue with status = 'pending'
 *  6. If auto_publish_* flags are set, immediately triggers the publish functions
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function claude(apiKey: string, system: string, prompt: string, maxTokens = 4096): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error: ${await res.text()}`);
  const d = await res.json();
  return d.content?.[0]?.text ?? "";
}

async function pickTodaysTopic(apiKey: string, brand: string, topic: string, audience: string): Promise<{topic: string, angle: string, keyword: string}> {
  const raw = await claude(apiKey,
    "You are a content strategist for AI search optimization.",
    `Pick ONE specific blog topic for today for "${brand}" about "${topic}" targeting "${audience}".

Today is ${new Date().toDateString()}.

Choose something timely, high-intent, and likely to be cited by ChatGPT/Claude/Perplexity.

Return JSON only:
{
  "topic": string,
  "angle": string,
  "keyword": string
}`, 512
  );
  try { return JSON.parse(raw); } catch { return { topic, angle: "informational guide", keyword: topic }; }
}

async function generateBlogPost(apiKey: string, brand: string, topic: string, angle: string, audience: string): Promise<{title: string, body: string, meta_description: string, tags: string[]}> {
  // Step 1: Structure
  const structureRaw = await claude(apiKey,
    "You are a content architect for AI search optimization.",
    `Create an optimal blog post structure for:
- Brand: ${brand}
- Topic: ${topic}
- Angle: ${angle}
- Audience: ${audience}

Return JSON only:
{
  "title": string,
  "meta_description": string,
  "sections": [{"heading": string, "key_points": string[]}],
  "faq": string[],
  "tags": string[]
}`, 1024
  );
  let structure: Record<string, unknown> = {};
  try { structure = JSON.parse(structureRaw); } catch { structure = { title: topic, tags: [] }; }

  // Step 2: Write
  const body = await claude(apiKey,
    `You are an expert content writer for ${brand}. Write authoritative, helpful blog content optimized for AI search citations. Use markdown formatting with clear H2 headings, direct answers, and credibility signals.`,
    `Write a complete blog post for ${brand} about "${topic}" (angle: ${angle}) for ${audience}.

Use this structure:
${JSON.stringify(structure, null, 2)}

Requirements:
- 800-1200 words
- Markdown format with ## headings
- Include a concise summary paragraph first (AI engines pull this)
- Answer FAQ questions with direct, citable responses
- End with a clear call to action linking to ${brand}
- Include trust signals (expertise, results, credentials)

Write the full post now:`, 4096
  );

  // Step 3: AI optimization pass
  const optimized = await claude(apiKey,
    "You are an AI search optimization expert. Ensure content is maximally citable.",
    `Optimize this blog post for AI search citation. Improve entity clarity, directness of answers, and summary paragraph. Keep all content and structure intact.

${body}

Return the full optimized post:`, 4096
  );

  return {
    title: String(structure.title ?? topic),
    body: optimized,
    meta_description: String(structure.meta_description ?? `${brand} - ${topic}`).slice(0, 160),
    tags: Array.isArray(structure.tags) ? structure.tags as string[] : [],
  };
}

async function generateSocialVariants(apiKey: string, brand: string, blogTitle: string, blogBody: string): Promise<Record<string, string>> {
  const [linkedin, twitter, facebook, instagram] = await Promise.all([
    claude(apiKey,
      `You write LinkedIn posts for ${brand}. Professional, insightful, 150-300 words. Include 3-5 relevant hashtags.`,
      `Write a LinkedIn post promoting this blog: "${blogTitle}"\n\nBlog excerpt:\n${blogBody.slice(0, 500)}\n\nWrite the full LinkedIn post:`, 512
    ),
    claude(apiKey,
      `You write Twitter/X threads for ${brand}. Punchy, engaging. Write a 5-tweet thread.`,
      `Write a 5-tweet thread about: "${blogTitle}"\n\nBlog excerpt:\n${blogBody.slice(0, 400)}\n\nFormat as:\n[1/5] ...\n[2/5] ...\netc.`, 512
    ),
    claude(apiKey,
      `You write Facebook posts for ${brand}. Conversational, community-focused, 100-200 words with a question to drive comments.`,
      `Write a Facebook post for: "${blogTitle}"\n\nBlog excerpt:\n${blogBody.slice(0, 400)}\n\nWrite the post:`, 512
    ),
    claude(apiKey,
      `You write Instagram captions for ${brand}. Visual-first, 2-3 short paragraphs, 10-15 relevant hashtags at the end.`,
      `Write an Instagram caption for a post about: "${blogTitle}"\n\nKey message from blog:\n${blogBody.slice(0, 300)}\n\nWrite the caption + hashtags:`, 512
    ),
  ]);

  return { linkedin, twitter, facebook, instagram };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    // Load all active automation settings
    const { data: settings, error: settingsErr } = await supabase
      .from("automation_settings")
      .select("*")
      .eq("active", true);

    if (settingsErr) throw settingsErr;
    if (!settings?.length) {
      return new Response(JSON.stringify({ message: "No active automation settings found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];

    for (const setting of settings) {
      try {
        const runId = crypto.randomUUID();
        const today = new Date().toISOString().split("T")[0];
        const { brand_name: brand, target_topic: topic, target_audience: audience } = setting;

        console.log(`Running content agent for ${brand} (run ${runId})`);

        // 1. Pick today's topic
        const todaysTopic = await pickTodaysTopic(apiKey, brand, topic, audience);

        // 2. Generate blog post
        const blog = await generateBlogPost(apiKey, brand, todaysTopic.topic, todaysTopic.angle, audience);

        // 3. Generate social variants in parallel
        const social = await generateSocialVariants(apiKey, brand, blog.title, blog.body);

        // 4. Write all drafts to content_queue
        const queueItems = [
          {
            agent_run_id: runId,
            scheduled_for: today,
            content_type: "blog-post",
            title: blog.title,
            body: blog.body,
            meta_description: blog.meta_description,
            tags: blog.tags,
            status: setting.auto_publish_blog ? "approved" : "pending",
            brand,
            topic: todaysTopic.topic,
            audience,
            platform_data: { keyword: todaysTopic.keyword, angle: todaysTopic.angle },
          },
          ...["linkedin", "twitter", "facebook", "instagram"].map((platform) => ({
            agent_run_id: runId,
            scheduled_for: today,
            content_type: platform,
            title: `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${blog.title}`,
            body: social[platform],
            status: setting.auto_publish_social ? "approved" : "pending",
            brand,
            topic: todaysTopic.topic,
            audience,
            platform_data: { source_blog_title: blog.title },
          })),
        ];

        const { error: insertErr } = await supabase.from("content_queue").insert(queueItems);
        if (insertErr) throw insertErr;

        // 5. Auto-publish if flags set
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (setting.auto_publish_blog) {
          await fetch(`${supabaseUrl}/functions/v1/publish-blog-post`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
            body: JSON.stringify({ runId, settingId: setting.id }),
          });
        }

        if (setting.auto_publish_social) {
          await fetch(`${supabaseUrl}/functions/v1/publish-social-posts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
            body: JSON.stringify({ runId, settingId: setting.id }),
          });
        }

        results.push({ brand, runId, status: "queued", items: queueItems.length });
        console.log(`Queued ${queueItems.length} items for ${brand}`);

      } catch (err) {
        console.error(`Failed for setting ${setting.id}:`, err);
        results.push({ brand: setting.brand_name, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ date: new Date().toISOString(), results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
