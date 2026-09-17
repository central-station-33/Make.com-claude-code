import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAKE_SECRET        = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const ANTHROPIC_API_KEY  = Deno.env.get('ANTHROPIC_API_KEY')  ?? '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')  ?? '';
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

const SEGMENT_CONTEXT: Record<string, string> = {
  athlete:            'professional athlete relocating to play for a NY/NJ team',
  investor:           'real estate investor looking for NYC/NJ opportunities',
  motivated_seller:   'motivated seller looking to move their property quickly',
  first_time_buyer:   'first-time home buyer exploring the NYC/NJ market',
  divorce:            'going through a life transition requiring real estate help',
  empty_nester:       'homeowner looking to rightsize after kids moved out',
  developer:          'developer or builder evaluating land and project opportunities',
  expat_relocation:   'professional relocating to the NYC/NJ metro area',
  film_tv:            'film/TV production professional needing housing near set',
  homeowner:          'homeowner who may be open to selling their property',
  renter:             'renter looking for an apartment or home in NY/NJ',
};

// Module -> public brand. distressed_investor stays InRange (internal
// wholesale/acquisitions channel); every consumer-facing residential and
// rental touchpoint uses the public brokerage brand. This is a default —
// override by passing `brand` explicitly in the payload if a specific
// campaign needs something else.
const MODULE_BRAND: Record<string, string> = {
  distressed_investor: 'InRange',
  residential_sale:    'Jet Realty Advisors',
  rental_leasing:       'Jet Realty Advisors',
};

const LEAD_ROLE_CONTEXT: Record<string, string> = {
  renter:   'looking for a rental in NY/NJ',
  landlord: 'a property owner who needs leasing/tenant-placement help',
};

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const {
    name, phone, email, inbound_message,
    segment = 'first_time_buyer',
    market  = 'nyc',
    channel = 'sms',
    source_name, source_url,
    module: moduleParam,
    lead_role: leadRoleParam,
    sms_consent = false,
    marketing_consent = false,
    consent_source,
    brand: brandOverride,
  } = body;

  if (!phone && !email) return json({ error: 'phone or email required' }, 400);

  const supabase = getServiceClient();

  const [{ data: byPhone }, { data: byEmail }] = await Promise.all([
    phone ? supabase.from('isa_leads').select('id,segment,market,module,lead_role,outreach_status,first_response_at,sms_consent')
              .eq('phone', phone).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
    email ? supabase.from('isa_leads').select('id,segment,market,module,lead_role,outreach_status,first_response_at,sms_consent')
              .eq('email', email).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
  ]);
  const existing = byPhone ?? byEmail;

  let leadId: string;
  let isNewLead = false;

  if (existing) {
    leadId = existing.id;
    // A consent flag passed on a follow-up touch strengthens (never weakens) what's on file.
    if (sms_consent || marketing_consent) {
      await supabase.from('isa_leads').update({
        ...(sms_consent && { sms_consent: true }),
        ...(marketing_consent && { marketing_consent: true }),
        ...(consent_source && { consent_source }),
        consent_captured_at: new Date().toISOString(),
      }).eq('id', leadId);
    }
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('isa_leads')
      .insert({
        segment, market,
        module:               moduleParam ?? null,
        lead_role:            leadRoleParam ?? null,
        commission_source:    'inrange_generated',
        full_name:            name ?? 'Inbound Lead',
        phone, email,
        inbound_channel:      channel,
        inbound_message,
        outreach_status:      'new',
        routing:              'new',
        source_name:          source_name ?? channel,
        source_url,
        sms_consent:          !!sms_consent,
        marketing_consent:    !!marketing_consent,
        consent_source:       consent_source ?? null,
        consent_captured_at:  (sms_consent || marketing_consent) ? new Date().toISOString() : null,
        motivation_signals:   [`Inbound ${source_name ?? channel} inquiry — auto-responded`],
        raw_data:             { inbound_message, channel, received_at: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (insertErr || !created) return json({ error: insertErr?.message ?? 'insert failed' }, 500);
    leadId    = created.id;
    isNewLead = true;
  }

  const effectiveSegment = (existing?.segment ?? segment) as string;
  const effectiveMarket  = (existing?.market  ?? market)  as string;
  const effectiveModule  = (existing?.module  ?? moduleParam) as string | null;
  const effectiveLeadRole = (existing?.lead_role ?? leadRoleParam) as string | null;
  const alreadyResponded = !!(existing?.first_response_at);

  // Consent gate: only auto-text if the lead explicitly opted in (form
  // checkbox passed through as sms_consent), or they texted us first —
  // replying to an inbound SMS is not the same as unsolicited outbound
  // marketing. Everything else (website/email leads with a phone number
  // but no consent flag) gets a task for a human to reach out by an
  // allowed channel instead of an automatic text.
  const hasConsentToText = !!(existing?.sms_consent) || !!sms_consent || channel === 'sms';
  const brand = brandOverride ?? MODULE_BRAND[effectiveModule ?? ''] ?? 'InRange';

  let claudeResult: ClaudeResult | null = null;
  if (ANTHROPIC_API_KEY) {
    claudeResult = await callClaude({
      name, inbound_message, segment: effectiveSegment, leadRole: effectiveLeadRole,
      market: effectiveMarket, isNewLead, alreadyResponded, brand,
    });
  }

  const smsText = claudeResult?.sms_response ?? fallbackSms(name, effectiveMarket, brand);

  let smsSent = false;
  if (phone && hasConsentToText && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: phone, From: TWILIO_FROM_NUMBER, Body: smsText }).toString(),
      }
    );
    smsSent = twilioRes.ok;
  }

  if (phone && !hasConsentToText) {
    await supabase.from('lead_tasks').insert({
      isa_lead_id: leadId,
      task_type:   'manual_first_contact_no_sms_consent',
      status:      'open',
      notes:       `No SMS consent on file — reach out by phone/email instead. Drafted message: "${smsText}"`,
    });
  }

  const { data: touchNum } = await supabase.rpc('next_touch_number', { p_lead_id: leadId });

  await supabase.from('lead_touches').insert({
    lead_id:      leadId,
    touch_number: touchNum ?? 1,
    channel,
    outcome:      'no_answer',
    notes:        smsSent ? `Auto-responded: "${smsText.slice(0, 120)}"` : `Drafted (not sent — no consent): "${smsText.slice(0, 120)}"`,
    isa_name:     'InRange Auto',
    touched_at:   new Date().toISOString(),
  });

  const updates: Record<string, unknown> = {
    outreach_status: 'attempting',
    updated_at:      new Date().toISOString(),
    ...(claudeResult && {
      ai_summary:         claudeResult.ai_summary,
      isa_talking_points: claudeResult.isa_talking_points,
      bant_score:         claudeResult.bant_score,
      motivation_score:   claudeResult.motivation_score,
      routing:            claudeResult.routing,
    }),
  };
  if (!alreadyResponded) updates.first_response_at = new Date().toISOString();

  await supabase.from('isa_leads').update(updates).eq('id', leadId);

  return json({
    success: true, lead_id: leadId, is_new_lead: isNewLead, sms_sent: smsSent,
    sms_skipped_no_consent: !!phone && !hasConsentToText,
    response_text: smsText, brand, routing: claudeResult?.routing ?? 'new', bant_score: claudeResult?.bant_score ?? null,
  });
});

interface ClaudeResult {
  sms_response: string;
  ai_summary: string;
  isa_talking_points: string[];
  bant_score: number;
  motivation_score: number;
  routing: string;
}

async function callClaude(params: {
  name?: string; inbound_message?: string; segment: string; leadRole?: string | null;
  market: string; isNewLead: boolean; alreadyResponded: boolean; brand: string;
}): Promise<ClaudeResult | null> {
  const { name, inbound_message, segment, leadRole, market, isNewLead, alreadyResponded, brand } = params;
  const ctx = (leadRole && LEAD_ROLE_CONTEXT[leadRole]) ?? SEGMENT_CONTEXT[segment] ?? segment;
  const prompt = `You are an ISA at ${brand}, a top NYC/NJ brokerage.
A ${ctx} just contacted you${alreadyResponded ? ' again' : ' for the first time'}.
Lead name: ${name ?? 'Unknown'}
Market: ${market.toUpperCase()}
Their message: "${inbound_message ?? 'No message — form/portal submission'}"
Return ONLY valid JSON:
{"sms_response":"<under 160 chars, warm/direct, ends with one question about timeline or availability, sign off '— ${brand}', no emojis>","ai_summary":"<2 sentences: who this is + why they need real estate NOW>","isa_talking_points":["<point 1>","<point 2>","<point 3>"],"bant_score":<0-12>,"motivation_score":<1-5>,"routing":"<hot|warm|nurture|cold>"}
ROUTING: hot=bant≥9+motivation≥4 | warm=bant≥7 OR motivation≥3 | nurture=bant≥4 | cold=else
Inbound leads score at least 2 higher than outbound.
Never state or imply anything about a neighborhood's schools, crime, safety, or the kind of people who live there, and never mention or infer race, religion, national origin, family status, disability, or other protected characteristics — this is a fair-housing requirement, not a style preference.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw  = data.content[0]?.text ?? '{}';
  const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (parsed.sms_response?.length > 160) parsed.sms_response = parsed.sms_response.slice(0, 157) + '...';
    return parsed as ClaudeResult;
  } catch { return null; }
}

function fallbackSms(name?: string, market = 'nyc', brand = 'InRange'): string {
  const area = market === 'nj' ? 'NJ' : 'NYC & NJ';
  return `Hi${name ? ` ${name}` : ''}, thanks for reaching out to ${brand} — we cover ${area}. When's a good time for a quick call this week? — ${brand}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
