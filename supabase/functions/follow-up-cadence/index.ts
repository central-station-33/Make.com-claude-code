/**
 * follow-up-cadence — automated lead nurture sequence.
 *
 * Runs daily at 9 AM via Make.com S19. Sends personalized Claude-generated
 * SMS to every lead that is due at its current cadence step.
 *
 * Cadence (days from previous step):
 *   Step 0 → 1 : 1 day  after creation        (warm check-in)
 *   Step 1 → 2 : 2 more days  = day 3 total   (market insight)
 *   Step 2 → 3 : 4 more days  = day 7 total   (gentle urgency)
 *   Step 3 → 4 : 7 more days  = day 14 total  (new angle)
 *   Step 4 → 5 : 16 more days = day 30 total  (final outreach)
 *
 * POST body: { limit?: number, dry_run?: boolean }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAKE_SECRET        = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const ANTHROPIC_API_KEY  = Deno.env.get('ANTHROPIC_API_KEY')  ?? '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')  ?? '';
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Days to wait from the PREVIOUS step before firing the next one
const CADENCE_DELAYS = [1, 2, 4, 7, 16];

const STEP_TONE: Record<number, string> = {
  1: 'warm check-in — brief, ask about timing, no pressure',
  2: 'add value — mention one relevant market data point or insight',
  3: "gentle urgency — market is active, don't want them to miss the window",
  4: 'new angle — ask a different question, try a different hook for their segment',
  5: 'respectful final message — leave the door open, wish them well',
};

const SEGMENT_CONTEXT: Record<string, string> = {
  athlete:           'professional athlete relocating to play for a NY/NJ team',
  investor:          'real estate investor looking for NYC/NJ opportunities',
  motivated_seller:  'motivated seller looking to move their property quickly',
  first_time_buyer:  'first-time home buyer exploring the NYC/NJ market',
  divorce:           'going through a life transition requiring real estate help',
  empty_nester:      'homeowner looking to rightsize after kids moved out',
  developer:         'developer evaluating land and project opportunities',
  expat_relocation:  'professional relocating to the NYC/NJ metro area',
  film_tv:           'film/TV production professional needing housing near set',
};

const FALLBACK: Record<number, string> = {
  1: "just checking in — did you get a chance to think about timing? When works for a quick call? — InRange",
  2: "NYC/NJ inventory is moving fast right now. Happy to share what's available in your range — worth a 5-min chat? — InRange",
  3: "Market's been active this week. Don't want you to miss the right opportunity. Still thinking about making a move? — InRange",
  4: 'Trying a different angle — is there a specific neighborhood, price point, or timeline question I can answer for you? — InRange',
  5: "Last note from us — if timing or circumstances change, we're always here. Wishing you the best! — InRange",
};

const CADENCE_SYSTEM_PROMPT = `You are an ISA at InRange Real Estate, a top NYC/NJ brokerage. You write personalized follow-up SMS messages to real estate prospects.

YOUR VOICE:
- Warm, human, conversational — never salesy or pushy
- Brief and direct — every word earns its place
- Knowledgeable about the NYC/NJ market without being condescending
- Respectful of the prospect's timeline and decision process

SMS RULES (non-negotiable):
- Under 160 characters total including the signature
- Always end with "— InRange"
- No emojis
- End with exactly one question or call-to-action
- Never repeat phrasing from earlier follow-ups
- Sound like a person, not a template

CADENCE CONTEXT:
Step 1 (day 1): Warm check-in — brief, ask about timing, no pressure. They just heard from us.
Step 2 (day 3): Add value — mention one relevant market data point or neighborhood insight.
Step 3 (day 7): Gentle urgency — market is active, don't want them to miss the window.
Step 4 (day 14): New angle — ask a different question, try a different hook for their segment.
Step 5 (day 30): Respectful final message — leave the door open, wish them well.

Return ONLY the SMS text — no quotes, no explanation, no preamble. Just the message.`;

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body    = await req.json().catch(() => ({}));
  const limit   = Number(body.limit   ?? 50);
  const dry_run = Boolean(body.dry_run ?? false);

  const supabase = getServiceClient();

  const { data: leads, error } = await supabase
    .from('isa_leads')
    .select('id, full_name, entity_name, phone, segment, market, cadence_step, last_cadence_at, created_at')
    .in('outreach_status', ['new', 'attempting', 'contacted'])
    .eq('cadence_paused', false)
    .lt('cadence_step', 5)
    .not('phone', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return json({ error: error.message }, 500);
  if (!leads?.length) return json({ sent: 0, skipped: 0, due: 0 });

  const now = new Date();
  const due = leads.filter(lead => {
    const step      = lead.cadence_step ?? 0;
    const delayDays = CADENCE_DELAYS[step];
    const anchor    = step === 0
      ? new Date(lead.created_at)
      : new Date(lead.last_cadence_at);
    const dueAt = new Date(anchor.getTime() + delayDays * 86_400_000);
    return now >= dueAt;
  });

  if (!due.length) return json({ sent: 0, skipped: leads.length, due: 0 });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of due) {
    try {
      const nextStep = (lead.cadence_step ?? 0) + 1;
      const name     = lead.full_name ?? lead.entity_name;
      const ctx      = SEGMENT_CONTEXT[lead.segment] ?? lead.segment;

      const smsText = ANTHROPIC_API_KEY
        ? await generateSms({ name, segmentCtx: ctx, market: lead.market, step: nextStep })
        : buildFallback(name, nextStep);

      if (!dry_run) {
        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                'Content-Type':  'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                To:   lead.phone,
                From: TWILIO_FROM_NUMBER,
                Body: smsText,
              }).toString(),
            }
          );
        }

        const { data: touchNum } = await supabase.rpc('next_touch_number', { p_lead_id: lead.id });
        await supabase.from('lead_touches').insert({
          lead_id:      lead.id,
          touch_number: touchNum ?? 1,
          channel:      'sms',
          outcome:      'no_answer',
          notes:        `Cadence step ${nextStep}: "${smsText.slice(0, 120)}"`,
          isa_name:     'InRange Auto',
          touched_at:   now.toISOString(),
        });

        await supabase.from('isa_leads').update({
          cadence_step:    nextStep,
          last_cadence_at: now.toISOString(),
          outreach_status: 'attempting',
          updated_at:      now.toISOString(),
        }).eq('id', lead.id);
      }

      sent++;
    } catch (err) {
      failed++;
      errors.push(`${lead.id}: ${(err as Error).message}`);
    }
  }

  return json({ sent, failed, skipped: leads.length - due.length, due: due.length, dry_run, errors });
});

async function generateSms(params: {
  name?: string;
  segmentCtx: string;
  market: string;
  step: number;
}): Promise<string> {
  const { name, segmentCtx, market, step } = params;
  const tone = STEP_TONE[step] ?? STEP_TONE[1];

  const userPrompt = `Write a step ${step} follow-up SMS to a ${segmentCtx}.
Lead name: ${name ?? 'Unknown'}. Market: ${market.toUpperCase()}.
Tone for this step: ${tone}.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':          ANTHROPIC_API_KEY,
      'anthropic-version':  '2023-06-01',
      'anthropic-beta':     'prompt-caching-2024-07-31',
      'content-type':       'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 120,
      system: [
        {
          type:          'text',
          text:          CADENCE_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  let text = (data.content[0]?.text ?? '').trim().replace(/^["']|["']$/g, '');
  if (text.length > 160) text = text.slice(0, 157) + '...';
  return text;
}

function buildFallback(name?: string, step = 1): string {
  const base = FALLBACK[step] ?? FALLBACK[1];
  return name ? `Hi ${name}, ${base}` : `Hi, ${base}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
