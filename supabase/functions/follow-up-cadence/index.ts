/**
 * follow-up-cadence — automated lead nurture sequence.
 *
 * Invoked on a schedule by a Make.com scenario (the header previously said
 * "S19", but Make S19 is "High-Value Homeowner Bridge" — the calling scenario
 * is unconfirmed; see docs/notes/shared-edge-function-changelog.md).
 * Sends personalized follow-up SMS to leads that are due at their cadence step.
 *
 * COMPLIANCE (TCPA) — non-negotiable, enforced twice (query + per-lead):
 *   - Only leads with sms_consent = true are ever texted.
 *   - Leads with sms_opt_out = true are never texted.
 *   - Step 1 carries "Reply STOP to opt out".
 *   - Messages never reference protected characteristics (Fair Housing).
 *
 * BRANDING (brand profiles, public.brands):
 *   - Every lead carries brand_id. The text is signed with that brand's
 *     sms_signature (e.g. "Jet Realty Advisors", "MVP Team @ Highline
 *     Residential") and sent from its sms_from_number when one is set.
 *   - Leads whose brand is missing or not active are skipped, never
 *     sent under a fallback name.
 *   The signature and opt-out line are appended in code, never by the model.
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

const OPT_OUT_LINE = 'Reply STOP to opt out.';

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
  divorce:           'person going through a life transition requiring real estate help',
  empty_nester:      'homeowner looking to rightsize',
  developer:         'developer evaluating land and project opportunities',
  expat_relocation:  'professional relocating to the NYC/NJ metro area',
  film_tv:           'film/TV production professional needing housing near set',
  renter:            'renter looking for an apartment in the NYC/NJ area',
  landlord:          'landlord looking to lease their rental unit',
  homeowner:         'homeowner exploring their real estate options',
};

const FALLBACK: Record<number, string> = {
  1: 'just checking in. Did you get a chance to think about timing? When works for a quick call?',
  2: "inventory is moving fast right now. Happy to share what's available in your range. Worth a 5-min chat?",
  3: "the market's been active this week. Still thinking about making a move?",
  4: 'is there a specific neighborhood, price point, or timeline question I can answer for you?',
  5: "last note from us. If timing changes, we're always here. Wishing you the best!",
};

const EXCLUSIVE_FALLBACK: Record<number, string> = {
  1: 'thanks for your interest in {P}. Want to set up a tour this week?',
  2: '{P} has homes with private outdoor space available now. Want me to send a few that fit your range?',
  3: 'tours at {P} are filling up. Is there a day that works for you to see it?',
  4: 'any questions about {P} I can answer, like layouts, move-in timing, or amenities?',
  5: "last note from us about {P}. If timing changes, we're here to help.",
};

const CADENCE_SYSTEM_PROMPT = `You are a leasing and sales assistant for a NYC/NJ real estate team. You write personalized follow-up SMS messages to prospects who have agreed to receive texts.

YOUR VOICE:
- Warm, human, conversational — never salesy or pushy
- Brief and direct — every word earns its place
- Knowledgeable about the NYC/NJ market without being condescending
- Respectful of the prospect's timeline and decision process

SMS RULES (non-negotiable):
- Under 140 characters. Do NOT add a signature or sign-off; one is appended automatically.
- No emojis. No links.
- End with exactly one question or call-to-action
- Never repeat phrasing from earlier follow-ups
- Sound like a person, not a template
- Fair Housing: never mention or allude to race, color, religion, national origin, sex, disability, familial status (kids, family size), age, sexual orientation, gender identity, marital status, source of income, or any other protected characteristic. Never describe who a neighborhood or building is "good for" or "ideal for". Describe homes and amenities only.

CADENCE CONTEXT:
Step 1 (day 1): Warm check-in — brief, ask about timing, no pressure. They just heard from us.
Step 2 (day 3): Add value — mention one relevant market data point or neighborhood insight.
Step 3 (day 7): Gentle urgency — market is active, don't want them to miss the window.
Step 4 (day 14): New angle — ask a different question, try a different hook for their segment.
Step 5 (day 30): Respectful final message — leave the door open, wish them well.

Return ONLY the SMS text — no quotes, no explanation, no preamble. Just the message.`;

type Lead = {
  id: string; full_name: string | null; entity_name: string | null; phone: string | null;
  segment: string; market: string; cadence_step: number | null; last_cadence_at: string | null;
  created_at: string; module: string | null; exclusive_property_id: string | null;
  sms_consent: boolean | null; sms_opt_out: boolean | null; brand_id: string | null;
};

type BrandProfile = { id: string; display_name: string; sms_signature: string; sms_from_number: string | null; status: string };

type Exclusive = { id: string; slug: string; name: string; neighborhood: string | null; address: string };

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
    .select('id, full_name, entity_name, phone, segment, market, cadence_step, last_cadence_at, created_at, module, exclusive_property_id, sms_consent, sms_opt_out, brand_id')
    .in('outreach_status', ['new', 'attempting', 'contacted'])
    .eq('cadence_paused', false)
    // TCPA: only leads with documented SMS consent, never opted-out leads.
    .eq('sms_consent', true)
    .eq('sms_opt_out', false)
    .lt('cadence_step', 5)
    .not('phone', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return json({ error: error.message }, 500);
  if (!leads?.length) return json({ sent: 0, skipped: 0, due: 0, dry_run });

  const now = new Date();
  const due = (leads as Lead[]).filter(lead => {
    // Second, independent consent check — never rely on the query alone.
    if (lead.sms_consent !== true || lead.sms_opt_out === true) return false;
    const step      = lead.cadence_step ?? 0;
    const delayDays = CADENCE_DELAYS[step];
    const anchor    = step === 0
      ? new Date(lead.created_at)
      : new Date(lead.last_cadence_at ?? lead.created_at);
    const dueAt = new Date(anchor.getTime() + delayDays * 86_400_000);
    return now >= dueAt;
  });

  if (!due.length) return json({ sent: 0, skipped: leads.length, due: 0, dry_run });

  // Load exclusive properties referenced by due leads (for branding/context).
  const exclusiveIds = [...new Set(due.map(l => l.exclusive_property_id).filter(Boolean))] as string[];
  const exclusives = new Map<string, Exclusive>();
  if (exclusiveIds.length) {
    const { data: eps } = await supabase
      .from('exclusive_properties')
      .select('id, slug, name, neighborhood, address')
      .in('id', exclusiveIds);
    for (const ep of (eps ?? []) as Exclusive[]) exclusives.set(ep.id, ep);
  }

  // Brand profiles for due leads (signature, sending number, status).
  const brandIds = [...new Set(due.map(l => l.brand_id).filter(Boolean))] as string[];
  const brands = new Map<string, BrandProfile>();
  if (brandIds.length) {
    const { data: bs } = await supabase
      .from('brands')
      .select('id, display_name, sms_signature, sms_from_number, status')
      .in('id', brandIds);
    for (const b of (bs ?? []) as BrandProfile[]) brands.set(b.id, b);
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  const previews: { lead_id: string; text: string }[] = [];

  for (const lead of due) {
    try {
      const nextStep  = (lead.cadence_step ?? 0) + 1;
      const name      = lead.full_name ?? lead.entity_name ?? undefined;
      const exclusive = lead.module === 'exclusive_leasing' && lead.exclusive_property_id
        ? exclusives.get(lead.exclusive_property_id)
        : undefined;
      if (lead.module === 'exclusive_leasing' && !exclusive) {
        throw new Error('exclusive property not found; skipping to avoid wrong branding');
      }

      const brand = lead.brand_id ? brands.get(lead.brand_id) : undefined;
      if (!brand || brand.status !== 'active' || !brand.sms_signature?.trim()) {
        throw new Error('brand profile missing or not active; skipping to avoid wrong branding');
      }

      const ctx = exclusive
        ? `renter who inquired about ${exclusive.name}, a new rental building at ${exclusive.address}${exclusive.neighborhood ? ` in ${exclusive.neighborhood}, Brooklyn` : ''}`
        : (SEGMENT_CONTEXT[lead.segment] ?? lead.segment);

      const bodyText = ANTHROPIC_API_KEY
        ? await generateSms({ name, segmentCtx: ctx, market: lead.market, step: nextStep, brandName: brand.display_name })
        : buildFallback(name, nextStep, exclusive?.name);

      const signature = brand.sms_signature.trim();
      const fromNumber = brand.sms_from_number?.trim() || TWILIO_FROM_NUMBER;
      const smsText = `${bodyText} — ${signature}${nextStep === 1 ? ` ${OPT_OUT_LINE}` : ''}`;

      if (dry_run) {
        previews.push({ lead_id: lead.id, text: smsText });
      } else {
        if (!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && fromNumber)) {
          throw new Error('Twilio not configured');
        }
        const tw = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
              'Content-Type':  'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To:   lead.phone!,
              From: fromNumber,
              Body: smsText,
            }).toString(),
          }
        );
        if (!tw.ok) throw new Error(`Twilio ${tw.status}`);

        const { data: touchNum } = await supabase.rpc('next_touch_number', { p_lead_id: lead.id });
        await supabase.from('lead_touches').insert({
          lead_id:      lead.id,
          touch_number: touchNum ?? 1,
          channel:      'sms',
          outcome:      'no_answer',
          notes:        `Cadence step ${nextStep}: "${smsText.slice(0, 120)}"`,
          isa_name:     `${signature} (auto)`,
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

  return json({
    sent, failed, skipped: leads.length - due.length, due: due.length, dry_run, errors,
    ...(dry_run ? { previews } : {}),
  });
});

async function generateSms(params: {
  name?: string;
  segmentCtx: string;
  market: string;
  step: number;
  brandName: string;
}): Promise<string> {
  const { name, segmentCtx, market, step, brandName } = params;
  const tone = STEP_TONE[step] ?? STEP_TONE[1];

  const userPrompt = `Write a step ${step} follow-up SMS to a ${segmentCtx}.
You are writing on behalf of ${brandName}.
Lead first name: ${name ?? 'Unknown'}. Market: ${(market ?? '').toUpperCase()}.
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
  // Strip any sign-off the model adds anyway; ours is appended in code.
  text = text.replace(/\s*[—-]\s*(InRange|Jet Realty Advisors|JRA|MVP Team[^—-]*|Highline Residential)\.?$/i, '').trim();
  if (text.length > 150) text = text.slice(0, 147) + '...';
  return text;
}

function buildFallback(name?: string, step = 1, propertyName?: string): string {
  const base = propertyName
    ? (EXCLUSIVE_FALLBACK[step] ?? EXCLUSIVE_FALLBACK[1]).replace(/\{P\}/g, propertyName)
    : (FALLBACK[step] ?? FALLBACK[1]);
  return name ? `Hi ${name}, ${base}` : `Hi, ${base}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
