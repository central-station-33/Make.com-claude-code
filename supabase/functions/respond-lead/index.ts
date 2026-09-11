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
  } = body;

  if (!phone && !email) return json({ error: 'phone or email required' }, 400);

  const supabase = getServiceClient();

  const [{ data: byPhone }, { data: byEmail }] = await Promise.all([
    phone ? supabase.from('isa_leads').select('id,segment,market,outreach_status,first_response_at')
              .eq('phone', phone).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
    email ? supabase.from('isa_leads').select('id,segment,market,outreach_status,first_response_at')
              .eq('email', email).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
  ]);
  const existing = byPhone ?? byEmail;

  let leadId: string;
  let isNewLead = false;

  if (existing) {
    leadId = existing.id;
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('isa_leads')
      .insert({
        segment, market,
        commission_source:  'inrange_generated',
        full_name:           name ?? 'Inbound Lead',
        phone, email,
        inbound_channel:    channel,
        inbound_message,
        outreach_status:    'new',
        routing:            'new',
        source_name:        source_name ?? channel,
        source_url,
        motivation_signals: [`Inbound ${source_name ?? channel} inquiry — auto-responded`],
        raw_data:           { inbound_message, channel, received_at: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (insertErr || !created) return json({ error: insertErr?.message ?? 'insert failed' }, 500);
    leadId    = created.id;
    isNewLead = true;
  }

  const effectiveSegment = (existing?.segment ?? segment) as string;
  const effectiveMarket  = (existing?.market  ?? market)  as string;
  const alreadyResponded = !!(existing?.first_response_at);

  let claudeResult: ClaudeResult | null = null;
  if (ANTHROPIC_API_KEY) {
    claudeResult = await callClaude({ name, inbound_message, segment: effectiveSegment, market: effectiveMarket, isNewLead, alreadyResponded });
  }

  const smsText = claudeResult?.sms_response ?? fallbackSms(name, effectiveMarket);

  let smsSent = false;
  if (phone && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
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

  const { data: touchNum } = await supabase.rpc('next_touch_number', { p_lead_id: leadId });

  await supabase.from('lead_touches').insert({
    lead_id:      leadId,
    touch_number: touchNum ?? 1,
    channel,
    outcome:      'no_answer',
    notes:        `Auto-responded: "${smsText.slice(0, 120)}"`,
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

  return json({ success: true, lead_id: leadId, is_new_lead: isNewLead, sms_sent: smsSent, response_text: smsText, routing: claudeResult?.routing ?? 'new', bant_score: claudeResult?.bant_score ?? null });
});

interface ClaudeResult {
  sms_response: string;
  ai_summary: string;
  isa_talking_points: string[];
  bant_score: number;
  motivation_score: number;
  routing: string;
}

async function callClaude(params: { name?: string; inbound_message?: string; segment: string; market: string; isNewLead: boolean; alreadyResponded: boolean }): Promise<ClaudeResult | null> {
  const { name, inbound_message, segment, market, isNewLead, alreadyResponded } = params;
  const ctx = SEGMENT_CONTEXT[segment] ?? segment;
  const prompt = `You are an ISA at InRange Real Estate, top NYC/NJ brokerage.
A ${ctx} just contacted you${alreadyResponded ? ' again' : ' for the first time'}.
Lead name: ${name ?? 'Unknown'}
Market: ${market.toUpperCase()}
Their message: "${inbound_message ?? 'No message — form/portal submission'}"
Return ONLY valid JSON:
{"sms_response":"<under 160 chars, warm/direct, ends with one question about timeline or availability, sign off '— InRange', no emojis>","ai_summary":"<2 sentences: who this is + why they need real estate NOW>","isa_talking_points":["<point 1>","<point 2>","<point 3>"],"bant_score":<0-12>,"motivation_score":<1-5>,"routing":"<hot|warm|nurture|cold>"}
ROUTING: hot=bant≥9+motivation≥4 | warm=bant≥7 OR motivation≥3 | nurture=bant≥4 | cold=else
Inbound leads score at least 2 higher than outbound.`;

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

function fallbackSms(name?: string, market = 'nyc'): string {
  const area = market === 'nj' ? 'NJ' : 'NYC & NJ';
  return `Hi${name ? ` ${name}` : ''}, thanks for reaching out to InRange — we cover ${area}. When's a good time for a quick call this week? — InRange`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
