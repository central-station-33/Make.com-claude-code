/**
 * log-touch — ISA call/contact logger.
 * Writes to lead_touches, advances outreach_status.
 *
 * POST body: { lead_id, channel, outcome, notes?, isa_name? }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

const STATUS_ADVANCE: Record<string, string> = {
  appointment_set:    'appointment_set',
  interested:         'contacted',
  callback_requested: 'contacted',
  not_interested:     'contacted',
  no_answer:          'attempting',
  voicemail:          'attempting',
  wrong_number:       'attempting',
};

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (MAKE_SECRET && req.headers.get('x-make-secret') !== MAKE_SECRET) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  const { lead_id, channel, outcome, notes, isa_name } = body;
  if (!lead_id || !channel) return json({ error: 'lead_id and channel required' }, 400);

  const supabase = getServiceClient();

  const { count } = await supabase.from('lead_touches').select('*', { count: 'exact', head: true }).eq('lead_id', lead_id);
  const touchNumber = (count ?? 0) + 1;

  const { error: touchErr } = await supabase.from('lead_touches').insert({
    lead_id, touch_number: touchNumber, channel, outcome, notes, isa_name,
    touched_at: new Date().toISOString(),
  });
  if (touchErr) return json({ error: touchErr.message }, 500);

  const newStatus = outcome ? STATUS_ADVANCE[outcome] : null;
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (newStatus) updatePayload.outreach_status = newStatus;
  if (outcome === 'appointment_set') { updatePayload.outreach_status = 'appointment_set'; updatePayload.routing = 'hot'; }

  await supabase.from('isa_leads').update(updatePayload).eq('id', lead_id);

  return json({ success: true, touch_number: touchNumber, new_status: newStatus ?? 'unchanged' });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
