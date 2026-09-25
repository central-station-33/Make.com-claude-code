/**
 * invite-agent — lets a logged-in broker invite a new agent.
 *
 * verify_jwt=true, so Supabase already confirms the caller has a valid
 * session before this code runs; we then check that caller is actually a
 * broker (via team_agents) before doing anything.
 *
 * On success: creates the auth.users row via the Auth Admin API (which
 * sends Supabase's built-in invite email with a signup link), then inserts
 * a linked team_agents row in the same call.
 *
 * POST body: { email: string, full_name: string, phone?: string,
 *   license_number?: string, market: 'nyc'|'nj'|'both',
 *   brokerage: 'highline'|'jet_realty', role?: 'agent'|'broker' }
 *
 * Backup login mode (2026-09-25): { mode: 'backup', email, team_agent_id }
 * sends the invite to a second email and links it to an EXISTING team_agents
 * profile via team_agent_logins (same profile, same permissions). No new
 * team_agents row is created. One active backup per agent.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleOptions } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!callerToken) return json({ success: false, error: 'Missing Authorization' }, 401);

  const supabase = serviceClient();

  const { data: callerData, error: callerErr } = await supabase.auth.getUser(callerToken);
  if (callerErr || !callerData?.user) return json({ success: false, error: 'Invalid session' }, 401);

  // Resolve caller by primary login, then by active backup login.
  let { data: callerAgent, error: agentErr } = await supabase
    .from('team_agents')
    .select('id, role')
    .eq('auth_user_id', callerData.user.id)
    .maybeSingle();
  if (!agentErr && !callerAgent) {
    const { data: link } = await supabase
      .from('team_agent_logins')
      .select('team_agent_id')
      .eq('auth_user_id', callerData.user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (link?.team_agent_id) {
      const res = await supabase.from('team_agents').select('id, role').eq('id', link.team_agent_id).maybeSingle();
      callerAgent = res.data; agentErr = res.error;
    }
  }

  if (agentErr) return json({ success: false, error: agentErr.message }, 500);
  if (!callerAgent || callerAgent.role !== 'broker') {
    return json({ success: false, error: 'Only a broker can invite agents' }, 403);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? '').trim().toLowerCase();

  if (body.mode === 'backup') {
    return await inviteBackupLogin(supabase, email, String(body.team_agent_id ?? ''), callerData.user);
  }
  const fullName = String(body.full_name ?? '').trim();
  const market = body.market;
  const brokerage = body.brokerage;
  const role = body.role === 'broker' ? 'broker' : 'agent';
  const phone = body.phone ? String(body.phone) : null;
  const licenseNumber = body.license_number ? String(body.license_number) : null;

  if (!email || !fullName) return json({ success: false, error: 'email and full_name are required' }, 400);
  if (market !== 'nyc' && market !== 'nj' && market !== 'both') {
    return json({ success: false, error: "market must be 'nyc', 'nj', or 'both'" }, 400);
  }
  if (brokerage !== 'highline' && brokerage !== 'jet_realty') {
    return json({ success: false, error: "brokerage must be 'highline' or 'jet_realty'" }, 400);
  }

  const { data: existingAgent } = await supabase
    .from('team_agents')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingAgent) return json({ success: false, error: 'An agent with this email already exists' }, 409);
  const { data: existingBackup } = await supabase
    .from('team_agent_logins').select('team_agent_id').eq('email', email).maybeSingle();
  if (existingBackup) return json({ success: false, error: 'This email is already a backup login for an agent' }, 409);

  const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, invited_by: callerData.user.email },
  });

  if (inviteErr) return json({ success: false, error: `Invite failed: ${inviteErr.message}` }, 500);

  const newAuthUserId = inviteData.user.id;

  const { data: newAgent, error: insertErr } = await supabase
    .from('team_agents')
    .insert({
      full_name: fullName,
      email,
      phone,
      license_number: licenseNumber,
      market,
      brokerage,
      role,
      status: 'active',
      auth_user_id: newAuthUserId,
    })
    .select('id')
    .single();

  if (insertErr) {
    return json({
      success: false,
      error: `Invite email sent, but team_agents row failed: ${insertErr.message}. Auth user ${newAuthUserId} needs manual linking.`,
    }, 500);
  }

  return json({ success: true, data: { agent_id: newAgent.id, auth_user_id: newAuthUserId, email } });
});

// deno-lint-ignore no-explicit-any
async function inviteBackupLogin(supabase: any, email: string, teamAgentId: string, caller: { id: string; email?: string }) {
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ success: false, error: 'A valid email is required' }, 400);
  if (!teamAgentId) return json({ success: false, error: 'team_agent_id is required' }, 400);

  const { data: agent, error: aErr } = await supabase
    .from('team_agents').select('id, full_name, email, backup_email').eq('id', teamAgentId).maybeSingle();
  if (aErr) return json({ success: false, error: aErr.message }, 500);
  if (!agent) return json({ success: false, error: 'Agent not found' }, 404);
  if (String(agent.email ?? '').toLowerCase() === email) {
    return json({ success: false, error: 'Backup email must be different from the main login email' }, 400);
  }

  const { data: primaryClash } = await supabase.from('team_agents').select('id').ilike('email', email).maybeSingle();
  if (primaryClash) return json({ success: false, error: 'This email is already a main login for an agent' }, 409);

  const { data: activeBackup } = await supabase
    .from('team_agent_logins').select('email').eq('team_agent_id', teamAgentId).eq('status', 'active').maybeSingle();
  if (activeBackup) {
    return json({ success: false, error: `This agent already has a backup login (${activeBackup.email}). Remove it first.` }, 409);
  }

  const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: agent.full_name, invited_by: caller.email, login_kind: 'backup', team_agent_id: teamAgentId },
  });
  if (inviteErr) return json({ success: false, error: `Invite failed: ${inviteErr.message}` }, 500);

  const backupAuthUserId = inviteData.user.id;
  const { error: linkErr } = await supabase.from('team_agent_logins').insert({
    auth_user_id: backupAuthUserId, team_agent_id: teamAgentId, email, kind: 'backup', status: 'active', created_by: caller.id,
  });
  if (linkErr) {
    // Don't leave an orphan login that could create a duplicate profile.
    await supabase.auth.admin.deleteUser(backupAuthUserId).catch(() => null);
    return json({ success: false, error: `Could not link backup login: ${linkErr.message}. Invite was withdrawn.` }, 500);
  }
  await supabase.from('team_agents').update({ backup_email: email, updated_at: new Date().toISOString() }).eq('id', teamAgentId);

  return json({ success: true, data: { mode: 'backup', team_agent_id: teamAgentId, auth_user_id: backupAuthUserId, email } });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
