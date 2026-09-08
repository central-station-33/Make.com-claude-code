/**
 * notify-isa — pushes newly enriched hot/warm leads to assigned ISAs.
 * Uses the isa_pipeline view. Routes hot leads to SMS+email, warm to Slack.
 *
 * POST body: { routing: 'hot'|'warm', limit?: number }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET      = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const MAKE_ISA_WEBHOOK = Deno.env.get('MAKE_ISA_WEBHOOK') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (MAKE_SECRET && req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body    = await req.json().catch(() => ({}));
  const routing = body.routing ?? 'hot';
  const limit   = body.limit   ?? 50;

  const supabase = getServiceClient();

  const { data: leads, error } = await supabase
    .from('isa_pipeline')
    .select('*')
    .eq('outreach_status', 'new')
    .eq('routing', routing)
    .not('ai_summary', 'is', null)
    .order('bant_score', { ascending: false })
    .limit(limit);

  if (error) {
    await persistDiag({ stage: 'query_isa_pipeline', routing, error: error.message });
    return json({ success: false, error: error.message }, 500);
  }
  if (!leads?.length) {
    await persistDiag({ stage: 'no_leads_matched', routing, webhook_len: MAKE_ISA_WEBHOOK.length });
    return json({ success: true, data: { sent: 0 } });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    try {
      const res = await fetch(MAKE_ISA_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(lead, routing)),
      });

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        errors.push(`Webhook failed ${lead.id}: ${res.status} ${bodyText.slice(0, 150)}`);
        continue;
      }

      await supabase.from('isa_leads')
        .update({ outreach_status: 'attempting', updated_at: new Date().toISOString() })
        .eq('id', lead.id);

      sent++;
    } catch (err) {
      errors.push(`${lead.id}: ${(err as Error).message}`);
    }
  }

  await persistDiag({
    stage: 'processed', routing, webhook_len: MAKE_ISA_WEBHOOK.length,
    leads_matched: leads.length, sent, errors,
  });

  return json({ success: true, data: { sent, errors } });
});

async function persistDiag(data: Record<string, unknown>) {
  try {
    const supabase = getServiceClient();
    await supabase.from('raw_properties').upsert({
      property_hash: `diagnostic_notify_isa_${data.routing}`,
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function buildPayload(lead: Record<string, unknown>, routing: string) {
  const name    = (lead.full_name ?? lead.entity_name ?? 'Unknown') as string;
  const pts     = (lead.isa_talking_points as string[] ?? []).join('\n• ');
  const contact = lead.rep_phone
    ? `Rep: ${lead.rep_name} — ${lead.rep_phone}`
    : lead.phone ? `Direct: ${lead.phone}`
    : lead.email ?? 'TBD';

  const splitLabel = (lead.commission_source as string) === 'brokerage_provided'
    ? '50/50 split'
    : (lead.commission_source as string) === 'agent_sourced'
    ? 'Agent split + override'
    : '85% to you (self-sourced)';

  return {
    lead_id:          lead.id,
    segment:          lead.segment,
    market:           String(lead.market ?? '').toUpperCase(),
    routing:          routing.toUpperCase(),
    name,
    contact,
    ai_summary:       lead.ai_summary,
    talking_points:   pts ? `• ${pts}` : '',
    bant_score:       lead.bant_score,
    motivation_score: lead.motivation_score,
    assigned_agent:   lead.agent_name ?? 'Unassigned',
    assigned_isa:     lead.assigned_isa ?? 'Unassigned',
    commission_note:  splitLabel,
    source:           lead.source_name,
    source_url:       lead.source_url,
    sms_message:      `InRange [${String(lead.segment ?? '').toUpperCase()}] ${name} — ${routing.toUpperCase()} lead, ${String(lead.market ?? '').toUpperCase()}. Check app.`,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
