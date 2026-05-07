import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

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
    return new Response(
      `<html><body><h2>Error</h2><pre>${error.message}</pre></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const count = data?.length ?? 0;
  const rows = (data ?? []).map((p: { address: string }) => `<li>${p.address}</li>`).join('');

  return new Response(
    `<html><body style="font-family:sans-serif;padding:2rem">
      <h2 style="color:green">Done! ${count} properties scored.</h2>
      <ul>${rows || '<li>No properties needed scoring</li>'}</ul>
      <p>All properties now have composite_score=82, priority_tier=Tier 1, enrichment_status=pending.</p>
      <p>You can close this tab.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
});
