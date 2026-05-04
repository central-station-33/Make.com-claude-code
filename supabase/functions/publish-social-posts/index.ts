/**
 * Publishes approved social posts from content_queue via Make.com webhook.
 *
 * Make.com scenario setup:
 *   Trigger: Webhooks → Custom webhook
 *   Routes by `platform` field → LinkedIn / Twitter(X) / Facebook / Instagram modules
 *
 * Required env var: none beyond Supabase vars
 * Make.com webhook URL stored in automation_settings.make_webhook_url
 *
 * Payload sent to Make.com per post:
 *   { platform, title, body, brand, topic, scheduled_for, queue_id }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOCIAL_PLATFORMS = ["linkedin", "twitter", "facebook", "instagram"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { itemId, runId, settingId } = body;

    // Fetch approved social queue items
    let query = supabase
      .from("content_queue")
      .select("*")
      .in("content_type", SOCIAL_PLATFORMS)
      .eq("status", "approved");

    if (itemId) query = query.eq("id", itemId);
    else if (runId) query = query.eq("agent_run_id", runId);

    const { data: items, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!items?.length) {
      return new Response(JSON.stringify({ message: "No approved social posts found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get Make.com webhook URL from settings
    let webhookUrl = "";
    if (settingId) {
      const { data } = await supabase.from("automation_settings").select("make_webhook_url").eq("id", settingId).single();
      webhookUrl = data?.make_webhook_url ?? "";
    } else {
      const { data } = await supabase.from("automation_settings").select("make_webhook_url").eq("active", true).limit(1).single();
      webhookUrl = data?.make_webhook_url ?? "";
    }

    if (!webhookUrl) throw new Error("Make.com webhook URL not configured in automation_settings");

    const results = [];

    for (const item of items) {
      try {
        const payload = {
          platform: item.content_type,
          title: item.title,
          body: item.body,
          brand: item.brand,
          topic: item.topic,
          scheduled_for: item.scheduled_for,
          queue_id: item.id,
          tags: item.tags ?? [],
          platform_data: item.platform_data ?? {},
        };

        const makeRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!makeRes.ok) {
          const err = await makeRes.text();
          throw new Error(`Make.com webhook error ${makeRes.status}: ${err}`);
        }

        // Mark as published
        await supabase.from("content_queue").update({
          status: "published",
          published_at: new Date().toISOString(),
          published_url: `make.com/webhook/delivered`,
        }).eq("id", item.id);

        results.push({ id: item.id, platform: item.content_type, status: "sent_to_make" });
        console.log(`Sent ${item.content_type} post to Make.com: ${item.title}`);

      } catch (err) {
        console.error(`Failed to send ${item.id} to Make.com:`, err);
        results.push({ id: item.id, platform: item.content_type, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ sent: results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Publish social error:", err);
    return new Response(JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
