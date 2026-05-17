/**
 * Publishes approved blog posts from content_queue to WordPress via REST API.
 * Can be called manually (from UI approve button) or by scheduled-content-runner.
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * WordPress credentials come from automation_settings table (per user).
 * WordPress requires an Application Password:
 *   WP Admin → Users → Profile → Application Passwords → Add New
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    // Accept either a specific queue item ID or a run ID (publishes all approved blog posts in run)
    const { itemId, runId, settingId } = body;

    // Fetch the queue items to publish
    let query = supabase
      .from("content_queue")
      .select("*")
      .eq("content_type", "blog-post")
      .eq("status", "approved");

    if (itemId) query = query.eq("id", itemId);
    else if (runId) query = query.eq("agent_run_id", runId);

    const { data: items, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!items?.length) {
      return new Response(JSON.stringify({ message: "No approved blog posts found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get WordPress credentials
    let wpSettings: Record<string, string> | null = null;

    if (settingId) {
      const { data } = await supabase.from("automation_settings").select("*").eq("id", settingId).single();
      wpSettings = data;
    } else {
      // Use first active settings
      const { data } = await supabase.from("automation_settings").select("*").eq("active", true).limit(1).single();
      wpSettings = data;
    }

    if (!wpSettings?.wordpress_url) throw new Error("WordPress credentials not configured in automation_settings");

    const wpUrl = wpSettings.wordpress_url.replace(/\/$/, "");
    const wpAuth = btoa(`${wpSettings.wordpress_username}:${wpSettings.wordpress_app_password}`);

    const results = [];

    for (const item of items) {
      try {
        // Convert markdown body to HTML (basic conversion — WordPress handles markdown too if Jetpack active)
        const htmlBody = item.body
          .replace(/^## (.+)$/gm, "<h2>$1</h2>")
          .replace(/^### (.+)$/gm, "<h3>$1</h3>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>")
          .replace(/\n\n/g, "</p><p>")
          .replace(/^/, "<p>")
          .replace(/$/, "</p>");

        const wpPayload = {
          title: item.title,
          content: htmlBody,
          status: "publish",
          excerpt: item.meta_description ?? "",
          tags: item.tags ?? [],
          meta: {
            description: item.meta_description ?? "",
          },
        };

        const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${wpAuth}`,
          },
          body: JSON.stringify(wpPayload),
        });

        if (!wpRes.ok) {
          const err = await wpRes.text();
          throw new Error(`WordPress API error ${wpRes.status}: ${err}`);
        }

        const wpPost = await wpRes.json();
        const publishedUrl = wpPost.link ?? `${wpUrl}/?p=${wpPost.id}`;

        // Update queue item status
        await supabase.from("content_queue").update({
          status: "published",
          published_at: new Date().toISOString(),
          published_url: publishedUrl,
        }).eq("id", item.id);

        results.push({ id: item.id, title: item.title, url: publishedUrl, status: "published" });
        console.log(`Published blog: ${item.title} → ${publishedUrl}`);

      } catch (err) {
        console.error(`Failed to publish ${item.id}:`, err);
        results.push({ id: item.id, title: item.title, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ published: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Publish blog error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
