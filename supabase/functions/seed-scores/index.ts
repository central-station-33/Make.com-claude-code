import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase
    .from('properties')
    .update({
      composite_score: 82,
      distress_score: 75,
      deal_quality_score: 80,
      contact_likelihood_score: 60,
      timeline_urgency_score: 70,
      priority_tier: 'Tier 1',
      deal_type: 'Foreclosure',
      enrichment_status: 'pending',
    })
    .is('composite_score', null)
    .select('id, address');

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true, updated: data?.length ?? 0, properties: data }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
