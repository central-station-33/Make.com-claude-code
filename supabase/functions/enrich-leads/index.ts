/**
 * enrich-leads — Claude AI enrichment for ISA leads.
 * Scores BANT, motivation, routing, writes talking points, an investment
 * thesis and a contact strategy, and records how the assessment was produced.
 *
 * Every write records ai_model, ai_prompt_version, ai_enriched_at and token
 * counts. This is a paid call whose output an ISA acts on directly, so an
 * assessment that cannot be attributed to a model and prompt version cannot be
 * audited, superseded, or re-run selectively when the prompt changes. Bump
 * ENRICH_PROMPT_VERSION whenever the prompt changes meaning.
 *
 * Re-enrichment is deliberately NOT automatic: the selection below still only
 * picks up leads with no ai_summary at all. Stale-version rows are now
 * identifiable (ai_prompt_version) but re-running them costs money, so that
 * stays an explicit decision rather than a side effect of deploying a new
 * prompt.
 *
 * POST body: { limit?: number, segment?: string }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { segmentTiers, unrankedSegmentFilter } from '../_shared/segment-priority.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MAKE_SECRET       = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

const ENRICH_MODEL = 'claude-sonnet-4-6';
// Bump on any change to ENRICH_SYSTEM_PROMPT or the requested JSON shape.
const ENRICH_PROMPT_VERSION = '2026-09-12.structured-v1';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const ENRICH_SYSTEM_PROMPT = `You are an expert NY/NJ real estate ISA coach with deep knowledge of the local market. Analyze real estate prospects and return structured JSON assessments that ISAs use to prioritize and personalize their outreach.

BANT SCORING (score each component 0-3 separately — do NOT return a total):
- Budget (0-3): 0=unknown, 1=rough range, 2=specific confirmed, 3=pre-approved/verified funds
- Authority (0-3): 0=unknown, 1=likely decision-maker, 2=confirmed, 3=sole DM with urgency
- Need (0-3): 0=browsing, 1=general interest, 2=specific criteria, 3=urgent specific need
- Timing (0-3): 0=no timeline, 1=within 12 months, 2=within 6 months, 3=within 90 days

MOTIVATION SCORE (1-5):
1=cold/browsing | 2=warm, some signals | 3=engaged, specific questions | 4=hot, clear motivation+timeline | 5=urgent/ready now

ROUTING RULES (bant total = sum of the four components, 0-12):
- hot: bant total >= 9 AND motivation_score >= 4
- warm: bant total >= 7 OR motivation_score >= 3
- nurture: bant total >= 4
- cold: all other cases

SEGMENT SCORING GUIDANCE:
- athlete: Contract value = budget. Relocation deadline = timing 3. Always authority 2+.
- investor: Cash buyers = budget 3. Portfolio size affects need score.
- motivated_seller: HPD violations/distress = timing 3. Listing price = budget proxy.
- first_time_buyer: Pre-approval = budget 2-3. Lease expiry/life event = timing boost.
- divorce: Court-ordered sale = timing 3, authority 2.
- empty_nester: Home equity = budget. Kids move-out date = timing.
- developer: Site control timeline = timing. Entitlement stage = need.
- expat_relocation: Start date = timing. Company relocation package = budget signal.
- film_tv: Production schedule = timing. Housing stipend = budget signal.
- renter: Rental demand — someone looking for a place to rent, almost always from an inbound enquiry. Budget = monthly rent they state (0-1 if unstated; rental budgets don't map to purchase budgets, so never infer a sale price). Authority 2 (they decide their own lease). Timing is the key axis and is usually knowable: a stated move-in date inside 60 days = timing 3. Motivation 3+ if they named a neighborhood, unit, or date — inbound renters self-select as active, unlike a prospecting list.
- general_inquiry: Inbound of undetermined intent. Do NOT guess a category. Score conservatively (bant components 0-1, motivation 1-2), and make the talking points discovery questions that establish whether they're renting, buying, or selling. Say plainly in the summary that intent is unconfirmed.
- homeowner: Owner of a $500k+ property with NO distress signal required — this is a value-based prospecting list, not an urgency-based one. Property value = budget 2-3 (higher value = higher confidence, but unconfirmed since not pre-approved). Authority defaults to 2 (presumed titleholder). Need and timing default LOW (0-1) unless motivation_signals state an actual reason to sell/move — do not invent urgency that isn't in the data.

TALKING POINTS RULES:
- Reference the person's actual situation (team, contract, production, property, employer)
- Each point must be actionable for an ISA on a phone call
- Point 1: Lead with their strongest motivation signal
- Point 2: Address their most likely objection
- Point 3: Specific next step or discovery question

AI SUMMARY: Exactly 2 sentences. Sentence 1: who they are + specific detail. Sentence 2: why they need real estate NOW (specific urgency signal). Use their name and concrete details. For the homeowner segment specifically, if no real urgency signal exists, sentence 2 should say so plainly (e.g. "No stated timeline — this is a value-qualified prospect, not an active seller") rather than fabricating one.

INVESTMENT THESIS: 2-3 sentences on why this specific property or person represents a real estate opportunity for the brokerage — the commission logic, not the prospect's logic. Reference property value, unit count, market or portfolio where known. If there is no genuine thesis (low value, no intent, wrong market), say that plainly instead of manufacturing one.

CONTACT STRATEGY: 2-3 sentences naming the channel to use FIRST and the opening angle. Outreach is phone, email and social only — there are no mail campaigns, so never suggest a letter or postcard. If the owner is a company (LLC, corp, condo or co-op board), say so and direct the ISA at finding the responsible individual (registered agent, managing member, board president) rather than calling the entity.

CONFIDENCE (1-5): how much the supplied input actually supports your assessment. 1 = derived from a public record only, with no stated intent from the prospect. 3 = several corroborating signals. 5 = explicit stated intent with a timeline. Most prospecting-list leads are a 1 or 2, and saying so is more useful than sounding certain. Do not let a fluent summary imply confidence the data does not support.

RISK FLAGS: short strings naming anything that should stop or slow an ISA before they dial. Use these where they apply: "entity owner — no individual to call", "no phone or email on file", "no stated selling intent", "address may be incomplete", "owner may be out of state", "data derived from violation record only". Empty array if genuinely none apply.

Return ONLY valid JSON — no markdown, no explanation, no preamble.`;

const ROUTINGS = new Set(['hot', 'warm', 'nurture', 'cold']);

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const limit: number   = body.limit   ?? 30;
  const segment: string = body.segment ?? '';

  const supabase = getServiceClient();

  // Newest-first so freshly ingested hot leads get enriched within hours.
  const pending = (max: number) => supabase
    .from('isa_leads')
    .select('*')
    .is('ai_summary', null)
    .not('outreach_status', 'in', '("dead","closed")')
    .order('created_at', { ascending: false })
    .limit(max);

  let leads: Record<string, unknown>[] = [];

  if (segment) {
    // Explicit segment wins outright — a caller naming a segment is asking
    // for that segment, not for the priority order.
    const { data, error } = await pending(limit).eq('segment', segment);
    if (error) return json({ success: false, error: error.message }, 500);
    leads = data ?? [];
  } else {
    // No segment named: spend the budget in priority order so homeowners are
    // enriched before investors, and investors before athletes/celebrities,
    // instead of whichever segment happens to have ingested most recently.
    for (const tier of segmentTiers()) {
      const remaining = limit - leads.length;
      if (remaining <= 0) break;

      const query = tier.segments
        ? pending(remaining).in('segment', tier.segments)
        : pending(remaining).not('segment', 'in', unrankedSegmentFilter());

      const { data, error } = await query;
      if (error) return json({ success: false, error: error.message }, 500);
      leads = leads.concat(data ?? []);
    }
  }

  if (!leads.length) return json({ success: true, data: { enriched: 0 } });

  let enriched = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const errors: string[] = [];
  const anthropicKeyPresent = ANTHROPIC_API_KEY.length > 0;

  for (const lead of leads) {
    try {
      const { result, usage } = await callClaude(buildPrompt(lead));

      // Clamp before writing. The columns carry CHECK constraints, so an
      // out-of-range number from the model would fail the whole update and
      // lose an assessment already paid for.
      const budget    = clampInt(result.bant?.budget    ?? result.bant_budget,    0, 3);
      const authority = clampInt(result.bant?.authority ?? result.bant_authority, 0, 3);
      const need      = clampInt(result.bant?.need      ?? result.bant_need,      0, 3);
      const timing    = clampInt(result.bant?.timing    ?? result.bant_timing,    0, 3);

      // Keep the total consistent with the parts it is made of; fall back to a
      // model-supplied total only when the components are missing entirely.
      const components = [budget, authority, need, timing];
      const bantScore = components.every((c) => c !== null)
        ? components.reduce((a, c) => a + (c as number), 0)
        : clampInt(result.bant_score, 0, 12);

      const routing = typeof result.routing === 'string' && ROUTINGS.has(result.routing)
        ? result.routing
        : null;

      const nowIso = new Date().toISOString();

      const { error: updateError } = await supabase.from('isa_leads').update({
        ai_summary:           result.ai_summary ?? null,
        ai_investment_thesis: result.ai_investment_thesis ?? null,
        ai_contact_strategy:  result.ai_contact_strategy ?? null,
        isa_talking_points:   Array.isArray(result.isa_talking_points) ? result.isa_talking_points : [],
        ai_risk_flags:        Array.isArray(result.ai_risk_flags) ? result.ai_risk_flags : [],
        ai_bant_budget:       budget,
        ai_bant_authority:    authority,
        ai_bant_need:         need,
        ai_bant_timing:       timing,
        bant_score:           bantScore,
        motivation_score:     clampInt(result.motivation_score, 1, 5),
        ai_confidence:        clampInt(result.ai_confidence, 1, 5),
        ...(routing ? { routing } : {}),
        ai_model:             ENRICH_MODEL,
        ai_prompt_version:    ENRICH_PROMPT_VERSION,
        ai_enriched_at:       nowIso,
        ai_input_tokens:      usage.input,
        ai_output_tokens:     usage.output,
        updated_at:           nowIso,
      }).eq('id', lead.id);

      if (updateError) throw new Error(updateError.message);

      enriched++;
      inputTokens  += usage.input  ?? 0;
      outputTokens += usage.output ?? 0;
    } catch (err) {
      errors.push(`${lead.id}: ${(err as Error).message}`);
    }
  }

  // Make discards the response body, so persist a diagnostic snapshot -- this
  // is the only way to see per-lead errors outside the HTTP response itself.
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: 'diagnostic_enrich_leads',
      source: 'diagnostic',
      raw_data: {
        ran_at: new Date().toISOString(),
        model: ENRICH_MODEL,
        prompt_version: ENRICH_PROMPT_VERSION,
        anthropic_key_present: anthropicKeyPresent,
        anthropic_key_len: ANTHROPIC_API_KEY.length,
        leads_seen: leads.length,
        enriched,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        errors,
      },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }

  return json({ success: true, data: {
    enriched,
    model: ENRICH_MODEL,
    prompt_version: ENRICH_PROMPT_VERSION,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    errors,
  } });
});

const clampInt = (v: unknown, min: number, max: number): number | null => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
};

function buildPrompt(lead: Record<string, unknown>): string {
  const signals = (lead.motivation_signals as string[] ?? []).join(', ');
  return `Analyze this prospect and return JSON only.

PROSPECT:
Segment: ${lead.segment} | Market: ${lead.market}
Name: ${lead.full_name ?? lead.entity_name ?? 'Unknown'}
${lead.team_name        ? `Team: ${lead.team_name}`                                   : ''}
${lead.sport            ? `Sport: ${lead.sport}`                                      : ''}
${lead.contract_value   ? `Contract: $${Number(lead.contract_value).toLocaleString()}` : ''}
${lead.employer         ? `Employer: ${lead.employer}`                                : ''}
${lead.origin_country   ? `From: ${lead.origin_country}`                              : ''}
${lead.production_name  ? `Production: ${lead.production_name}`                       : ''}
${lead.property_address ? `Property: ${lead.property_address}`                        : ''}
${lead.price_range_min  ? `Budget: $${Number(lead.price_range_min).toLocaleString()}–$${Number(lead.price_range_max).toLocaleString()}` : ''}
Contact on file: ${lead.phone || lead.email ? 'yes' : 'none — no phone or email'}
Signals: ${signals || 'None captured'}
Source: ${lead.source_name ?? 'unknown'}

Return ONLY valid JSON:
{
  "ai_summary": "<2 sentences: who this is + why they need real estate NOW>",
  "ai_investment_thesis": "<2-3 sentences: the brokerage's commission logic, or plainly that there isn't one>",
  "ai_contact_strategy": "<2-3 sentences: which channel first and the opening angle. Phone/email/social only>",
  "isa_talking_points": ["<point 1 — reference actual situation>", "<point 2>", "<point 3>"],
  "bant": { "budget": <0-3>, "authority": <0-3>, "need": <0-3>, "timing": <0-3> },
  "motivation_score": <1-5>,
  "ai_confidence": <1-5>,
  "ai_risk_flags": ["<short flag>", "..."],
  "routing": "<hot|warm|nurture|cold>"
}`;
}

async function callClaude(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta':    'prompt-caching-2024-07-31',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      ENRICH_MODEL,
      max_tokens: 1200,
      system: [
        {
          type:          'text',
          text:          ENRICH_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  const raw  = (data.content[0]?.text ?? '{}');
  const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const start    = stripped.indexOf('{');
  const end      = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in Claude response');

  return {
    result: JSON.parse(stripped.slice(start, end + 1)),
    usage: {
      input:  data.usage?.input_tokens  ?? null,
      output: data.usage?.output_tokens ?? null,
    },
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
