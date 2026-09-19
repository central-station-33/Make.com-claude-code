/**
 * claim-lead — the manual half of the lead-claim mechanism.
 *
 * isa_leads segments not enrolled in agent_routing_rules (currently:
 * 'landlord') never get an assigned_agent_id from assign-leads, so they
 * sit in the `unclaimed_leads` view until an agent calls this endpoint.
 *
 * The claim itself is a single conditional UPDATE ... WHERE
 * assigned_agent_id IS NULL, so two agents racing to claim the same lead
 * can't both win -- whichever UPDATE lands first flips the row, the second
 * one matches zero rows and gets told the lead is already gone. No
 * separate locking needed.
 *
 * POST body: { lead_id: string (uuid), agent_id: string (uuid) }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const leadId = String(body.lead_id ?? '');
  const agentId = String(body.agent_id ?? '');

  if (!leadId || !agentId) {
    return json({ success: false, error: 'lead_id and agent_id are required' }, 400);
  }

  const supabase = getServiceClient();

  const { data: agent, error: agentErr } = await supabase
    .from('team_agents')
    .select('id, full_name')
    .eq('id', agentId)
    .maybeSingle();

  if (agentErr) return json({ success: false, error: agentErr.message }, 500);
  if (!agent) return json({ success: false, error: 'Unknown agent_id' }, 404);

  const { data: claimed, error: claimErr } = await supabase
    .from('isa_leads')
    .update({ assigned_agent_id: agentId, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .is('assigned_agent_id', null)
    .select('id, segment, property_address, full_name, entity_name')
    .maybeSingle();

  if (claimErr) return json({ success: false, error: claimErr.message }, 500);

  if (!claimed) {
    return json({
      success: false,
      error: 'Lead is no longer available -- it was already claimed, does not exist, or is dead/closed.',
    }, 409);
  }

  return json({ success: true, data: { ...claimed, claimed_by: agent.full_name } });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
