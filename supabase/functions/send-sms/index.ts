/**
 * send-sms — sends an SMS to an ISA lead via Twilio and logs it to lead_touches.
 *
 * Rebuilt 2026-09-23: the previous version targeted a `text_messages` table
 * that never existed in this schema (dead code, never deployed). This
 * version targets the tables that actually exist and are built for this:
 * `isa_leads` (has phone + sms_consent/sms_opt_out) and `lead_touches`
 * (has channel='sms' in its enum, already RLS-scoped to the assigned agent
 * or a broker).
 *
 * verify_jwt=true; caller must be a broker, or the isa_leads row's
 * assigned_agent. The lead's phone number is read from the database, never
 * trusted from the request body, so a caller cannot redirect a message to
 * an arbitrary number.
 *
 * Compliance: refuses to send if the lead has opted out (sms_opt_out) or
 * has no sms_consent on file. As of this rebuild, sms_consent is NULL for
 * every existing isa_leads row (no consent-capture step exists upstream
 * yet), so this will block sends until that's added -- see the coordination
 * log / plan doc for the decision this needs from the user.
 *
 * POST body: { lead_id: string, message: string }
 *
 * Always writes one lead_touches row (channel='sms') for the attempt,
 * whether the Twilio send succeeds or fails, so the touch history stays
 * complete.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inlined rather than imported from ../_shared/cors.ts: the Supabase MCP
// deploy tool used to ship this function couldn't resolve the cross-file
// relative import ("Module not found") even though the same import works
// for invite-agent when deployed via the CLI/git checkout. Keeping this
// self-contained avoids that bundler quirk. If _shared/cors.ts changes,
// mirror the change here too.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ok = (data: unknown, message = 'Success') =>
  new Response(JSON.stringify({ success: true, message, data, timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const err = (message: string, status = 500, errors: unknown = null) =>
  new Response(JSON.stringify({ success: false, message, errors, status, timestamp: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const handleOptions = () => new Response('ok', { headers: corsHeaders });

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// Twilio needs E.164 (+1XXXXXXXXXX). isa_leads.phone is stored as bare
// 10-digit US numbers today (e.g. "6464271926"), so normalize here rather
// than assuming callers/data are already in the right shape.
function toE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  if (req.method !== 'POST') return err('Method not allowed', 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const callerToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!callerToken) return err('Missing Authorization', 401);

  const supabase = serviceClient();

  const { data: callerData, error: callerErr } = await supabase.auth.getUser(callerToken);
  if (callerErr || !callerData?.user) return err('Invalid session', 401);

  const { data: callerAgent, error: agentErr } = await supabase
    .from('team_agents')
    .select('id, full_name, role')
    .eq('auth_user_id', callerData.user.id)
    .maybeSingle();

  if (agentErr) return err(agentErr.message, 500);
  if (!callerAgent) return err('No team_agents record for this account', 403);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const leadId = String(body.lead_id ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!leadId || !message) return err('lead_id and message are required', 400);
  if (message.length > 1600) return err('Message too long (max 1600 characters)', 400);

  const { data: lead, error: leadErr } = await supabase
    .from('isa_leads')
    .select('id, phone, assigned_agent_id, sms_consent, sms_opt_out')
    .eq('id', leadId)
    .maybeSingle();

  if (leadErr) return err(leadErr.message, 500);
  if (!lead) return err('Lead not found', 404);

  const isOwnLead = lead.assigned_agent_id === callerAgent.id;
  if (callerAgent.role !== 'broker' && !isOwnLead) {
    return err('You can only message leads assigned to you', 403);
  }

  if (!lead.phone) return err('This lead has no phone number on file', 400);
  const toNumber = toE164(lead.phone);
  if (!toNumber) return err('This lead\'s phone number is not in a usable format', 400);

  if (lead.sms_opt_out) return err('This lead has opted out of SMS -- cannot send', 403);
  if (!lead.sms_consent) return err('No SMS consent on file for this lead -- cannot send', 403);

  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  // Named TWILIO_FROM_NUMBER in this project's Supabase secrets (confirmed
  // 2026-09-23 by checking the Dashboard directly), not TWILIO_PHONE_NUMBER.
  const twilioPhoneNumber = Deno.env.get('TWILIO_FROM_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    return err('SMS is not configured yet -- Twilio secrets are missing on this project', 500);
  }

  const { data: lastTouch } = await supabase
    .from('lead_touches')
    .select('touch_number')
    .eq('lead_id', leadId)
    .order('touch_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const touchNumber = (lastTouch?.touch_number ?? 0) + 1;

  let twilioSid: string | null = null;
  let sendStatus: 'sent' | 'failed' = 'sent';
  let failureNote = '';

  try {
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
        body: new URLSearchParams({ To: toNumber, From: twilioPhoneNumber, Body: message }).toString(),
      },
    );
    const twilioData = await twilioResponse.json();
    if (twilioResponse.ok) {
      twilioSid = twilioData.sid ?? null;
    } else {
      sendStatus = 'failed';
      failureNote = twilioData.message || 'Twilio API error';
    }
  } catch (e) {
    sendStatus = 'failed';
    failureNote = e instanceof Error ? e.message : 'Unknown error sending SMS';
  }

  const noteText = sendStatus === 'sent'
    ? `SMS sent: "${message}"${twilioSid ? ` (Twilio ${twilioSid})` : ''}`
    : `SMS failed: "${message}" -- ${failureNote}`;

  const { data: touch, error: touchErr } = await supabase
    .from('lead_touches')
    .insert({
      lead_id: leadId,
      touch_number: touchNumber,
      channel: 'sms',
      notes: noteText,
      isa_name: callerAgent.full_name,
      touched_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (touchErr) {
    return err(`SMS ${sendStatus}, but failed to log the touch: ${touchErr.message}`, 500);
  }

  if (sendStatus === 'failed') {
    return err(`Failed to send SMS: ${failureNote}`, 502, { touch_id: touch.id });
  }

  return ok({ touch_id: touch.id, twilio_sid: twilioSid, status: 'sent' }, 'SMS sent');
});
