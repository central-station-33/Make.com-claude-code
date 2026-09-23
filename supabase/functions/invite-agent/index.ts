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

  const { data: callerAgent, error: agentErr } = await supabase
    .from('team_agents')
    .select('id, role')
    .eq('auth_user_id', callerData.user.id)
    .maybeSingle();

  if (agentErr) return json({ success: false, error: agentErr.message }, 500);
  if (!callerAgent || callerAgent.role !== 'broker') {
    return json({ success: false, error: 'Only a broker can invite agents' }, 403);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const email = String(body.email ?? '').trim().toLowerCase();
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

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
