/**
 * assign-leads — auto-assigns unassigned isa_leads to agents
 * based on segment + market + workload from agent_routing_rules.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (MAKE_SECRET && req.headers.get('x-make-secret') !== MAKE_SECRET) return json({ error: 'Unauthorized' }, 401);

  const body    = await req.json().catch(() => ({}));
  const limit   = Number(body.limit   ?? 100);
  const segment = body.segment ?? null;
  const market  = body.market  ?? null;

  const supabase = getServiceClient();

  let q = supabase.from('isa_leads').select('id, segment, market, routing')
    .is('assigned_agent_id', null)
    .not('outreach_status', 'in', '("dead","closed")')
    .order('routing', { ascending: true })
    .limit(limit);
  if (segment) q = q.eq('segment', segment);
  if (market)  q = q.eq('market',  market);

  const { data: leads, error } = await q;
  if (error) return json({ error: error.message }, 500);
  if (!leads?.length) return json({ assigned: 0 });

  const { data: rules } = await supabase
    .from('agent_routing_rules')
    .select('id, agent_id, segment, market, priority, max_active_leads')
    .order('priority', { ascending: true });

  const { data: workloads } = await supabase
    .from('isa_leads').select('assigned_agent_id')
    .not('outreach_status', 'in', '("dead","closed")')
    .not('assigned_agent_id', 'is', null);

  const agentLoad: Record<string, number> = {};
  for (const w of workloads ?? []) {
    if (w.assigned_agent_id) agentLoad[w.assigned_agent_id] = (agentLoad[w.assigned_agent_id] ?? 0) + 1;
  }

  let assigned = 0;
  for (const lead of leads) {
    const candidates = (rules ?? [])
      .filter(r => (r.segment === null || r.segment === lead.segment) && (r.market === null || r.market === lead.market))
      .filter(r => (agentLoad[r.agent_id] ?? 0) < r.max_active_leads)
      .sort((a, b) => a.priority - b.priority);
    const best = candidates[0];
    if (!best) continue;
    const { error: assignErr } = await supabase.from('isa_leads')
      .update({ assigned_agent_id: best.agent_id, updated_at: new Date().toISOString() })
      .eq('id', lead.id);
    if (!assignErr) { agentLoad[best.agent_id] = (agentLoad[best.agent_id] ?? 0) + 1; assigned++; }
  }

  return json({ assigned, total: leads.length });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
