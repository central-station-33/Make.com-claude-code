/**
 * enrich-leads — Claude AI enrichment for ISA leads.
 * Scores BANT, motivation, routing, writes talking points.
 *
 * POST body: { limit?: number, segment?: string }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { segmentTiers, unrankedSegmentFilter } from '../_shared/segment-priority.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const MAKE_SECRET       = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key, { auth: { persistSession: false } });
}

const ENRICH_SYSTEM_PROMPT = `You are an expert NY/NJ real estate ISA coach with deep knowledge of the local market. Analyze real estate prospects and return structured JSON assessments that ISAs use to prioritize and personalize their outreach.

BANT SCORING (0-12, four components 0-3 each):
- Budget (0-3): 0=unknown, 1=rough range, 2=specific confirmed, 3=pre-approved/verified funds
- Authority (0-3): 0=unknown, 1=likely decision-maker, 2=confirmed, 3=sole DM with urgency
- Need (0-3): 0=browsing, 1=general interest, 2=specific criteria, 3=urgent specific need
- Timing (0-3): 0=no timeline, 1=within 12 months, 2=within 6 months, 3=within 90 days

MOTIVATION SCORE (1-5):
1=cold/browsing | 2=warm, some signals | 3=engaged, specific questions | 4=hot, clear motivation+timeline | 5=urgent/ready now

ROUTING RULES:
- hot: bant_score >= 9 AND motivation_score >= 4
- warm: bant_score >= 7 OR motivation_score >= 3
- nurture: bant_score >= 4
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
- homeowner: Owner of a $500k+ property with NO distress signal required — this is a value-based prospecting list, not an urgency-based one. Property value = budget 2-3 (higher value = higher confidence, but unconfirmed since not pre-approved). Authority defaults to 2 (presumed titleholder). Need and timing default LOW (0-1) unless motivation_signals state an actual reason to sell/move — do not invent urgency that isn't in the data.

TALKING POINTS RULES:
- Reference the person's actual situation (team, contract, production, property, employer)
- Each point must be actionable for an ISA on a phone call
- Point 1: Lead with their strongest motivation signal
- Point 2: Address their most likely objection
- Point 3: Specific next step or discovery question

AI SUMMARY: Exactly 2 sentences. Sentence 1: who they are + specific detail. Sentence 2: why they need real estate NOW (specific urgency signal). Use their name and concrete details. For the homeowner segment specifically, if no real urgency signal exists, sentence 2 should say so plainly (e.g. "No stated timeline — this is a value-qualified prospect, not an active seller") rather than fabricating one.

Return ONLY valid JSON — no markdown, no explanation, no preamble.`;

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
  const errors: string[] = [];
  const anthropicKeyPresent = ANTHROPIC_API_KEY.length > 0;

  for (const lead of leads) {
    try {
      const result = await callClaude(buildPrompt(lead));
      await supabase.from('isa_leads').update({
        ai_summary:         result.ai_summary,
        isa_talking_points: result.isa_talking_points,
        bant_score:         result.bant_score,
        motivation_score:   result.motivation_score,
        routing:            result.routing,
        updated_at:         new Date().toISOString(),
      }).eq('id', lead.id);
      enriched++;
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
        anthropic_key_present: anthropicKeyPresent,
        anthropic_key_len: ANTHROPIC_API_KEY.length,
        leads_seen: leads.length,
        enriched,
        errors,
      },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }

  return json({ success: true, data: { enriched, errors } });
});

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
Signals: ${signals || 'None captured'}
Source: ${lead.source_name ?? 'unknown'}

Return ONLY valid JSON:
{
  "ai_summary": "<2 sentences: who this is + why they need real estate NOW>",
  "isa_talking_points": ["<point 1 — reference actual situation>", "<point 2>", "<point 3>"],
  "bant_score": <0-12>,
  "motivation_score": <1-5>,
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
      model:      'claude-sonnet-4-6',
      max_tokens: 600,
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
  return JSON.parse(stripped.slice(start, end + 1));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
