import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const s = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await s
    .from("properties")
    .update({
      composite_score: 82,
      distress_score: 75,
      deal_quality_score: 80,
      contact_likelihood_score: 60,
      timeline_urgency_score: 70,
      priority_tier: "Tier 1",
      deal_type: "Foreclosure",
      enrichment_status: "pending",
    })
    .is("composite_score", null)
    .select("id, address");
  return new Response(
    JSON.stringify({ updated: data?.length ?? 0, error: error?.message ?? null })
  );
});
