/**
 * invite-agent-form — form-triggered variant of invite-agent.
 *
 * Same invite + team_agents insert logic, but authenticated via
 * x-make-secret instead of a user session JWT, since Make.com's Google
 * Forms watch has no user session to hand it.
 *
 * POST body: { email, full_name, phone?, license_number?, market, brokerage, role? }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const supabase = serviceClient();
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const email = String(body.email ?? '').trim().toLowerCase();
  const fullName = String(body.full_name ?? '').trim();
  const marketRaw = String(body.market ?? '').trim().toLowerCase();
  const brokerageRaw = String(body.brokerage ?? '').trim().toLowerCase();
  const roleRaw = String(body.role ?? '').trim().toLowerCase();
  const role = roleRaw === 'broker' ? 'broker' : 'agent';
  const phone = body.phone ? String(body.phone).trim() : null;
  const licenseNumber = body.license_number ? String(body.license_number).trim() : null;

  if (!email || !fullName) return json({ success: false, error: 'email and full_name are required' }, 400);
  if (!['nyc', 'nj', 'both'].includes(marketRaw)) {
    return json({ success: false, error: `market must be 'nyc', 'nj', or 'both' — got '${marketRaw}'` }, 400);
  }
  if (!['highline', 'jet_realty'].includes(brokerageRaw)) {
    return json({ success: false, error: `brokerage must be 'highline' or 'jet_realty' — got '${brokerageRaw}'` }, 400);
  }

  const { data: existingAgent } = await supabase
    .from('team_agents')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingAgent) return json({ success: false, error: 'An agent with this email already exists' }, 409);

  const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, invited_via: 'google_form' },
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
      market: marketRaw,
      brokerage: brokerageRaw,
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
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
