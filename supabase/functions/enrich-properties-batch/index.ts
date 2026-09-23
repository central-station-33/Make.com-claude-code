/**
 * enrich-properties-batch — dashboard-triggered bulk AI enrichment for
 * `properties` (the 924-row distressed-property pipeline, distinct from the
 * isa_leads/enrich-leads pipeline).
 *
 * verify_jwt: true — this is a browser-facing function, called with the
 * signed-in user's own session token, not a Make secret. It additionally
 * checks the caller is a broker (via team_agents.role) before doing any
 * paid work, since bulk enrichment spends real Anthropic budget.
 *
 * Reuses the same shared budget gate as enrich-leads
 * (increment_ai_budget_spend / ai_budget_tracker, provider='anthropic') so
 * a bulk dashboard run and the Make-driven ISA enrichment pass draw from one
 * pool and respect the same monthly pause threshold.
 *
 * Uses the same model + prompt shape as enrich-property (Claude Haiku 4.5)
 * so a batch-enriched row looks identical to a manually "Enrich now" one --
 * intentionally NOT calling enrich-property itself, since that function has
 * no auth check and is also called by other automation; duplicating its
 * short prompt here keeps this change additive-only.
 *
 * POST body: { limit?: number (default 10, max 25) }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const BUDGET_PROVIDER = 'anthropic';

// Claude Haiku 4.5 standard API rates, $ per million tokens.
// https://platform.claude.com/docs/en/about-claude/pricing (checked 2026-09-23)
const PRICE_PER_MTOK = { input: 1.0, output: 5.0 };

function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
}

function currentPeriodStart(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

async function checkOrRecordBudget(supabase: ReturnType<typeof serviceClient>, amount: number) {
  const { data, error } = await supabase.rpc('increment_ai_budget_spend', {
    p_provider: BUDGET_PROVIDER,
    p_period_start: currentPeriodStart(),
    p_amount: amount,
  });
  if (error) throw new Error(`budget tracker: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    cumulativeCostUsd: Number(row?.cumulative_cost_usd ?? 0),
    pauseThresholdUsd: Number(row?.pause_threshold_usd ?? 0),
    paused: Boolean(row?.paused),
    justPaused: Boolean(row?.just_paused),
  };
}

const buildPrompt = (p: Record<string, unknown>) => `You are a real estate investment analyst. Analyze this distressed property and return ONLY valid JSON.

Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}
Type: ${p.property_type} | Beds/Baths: ${p.bedrooms}/${p.bathrooms} | Sqft: ${p.square_footage}
ARV: $${p.estimated_arv} | Owed: $${p.amount_owed} | Asking: $${p.asking_price}
Equity: $${p.equity} (${p.equity_percentage}%) | Below Market: ${p.below_market_percentage}%
Deal Type: ${p.deal_type} | Indicators: ${(p.distress_indicators as string[] || []).join(', ')}
Score: ${p.composite_score}/100 (${p.priority_tier})
Owner: ${p.owner_name} | Type: ${p.owner_type} | Out-of-State: ${p.state !== p.owner_state ? 'Yes' : 'No'}
Auction: ${p.auction_date || 'N/A'} | Stage: ${p.process_stage || 'N/A'}

Return ONLY this JSON:
{
  "investment_thesis": "2-3 sentence thesis",
  "estimated_arv_refined": 0,
  "profit_potential": {
    "wholesale_fee": 0,
    "fix_and_flip_profit": 0,
    "rental_monthly_cashflow": 0,
    "best_strategy": "wholesale|fix_and_flip|buy_and_hold|subject_to"
  },
  "risks": ["risk1", "risk2"],
  "contact_strategy": "specific outreach approach",
  "talking_points": ["point1", "point2", "point3"],
  "red_flags": [],
  "recommended_offer": 0,
  "max_allowable_offer": 0
}`;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return json({}, 200);
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
    return json({ success: false, error: 'Only a broker/admin can run bulk enrichment' }, 403);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const limit = Math.max(1, Math.min(25, Number(body.limit ?? 10)));

  // Budget gate FIRST, before touching properties or Anthropic at all.
  const budgetBefore = await checkOrRecordBudget(supabase, 0);
  if (budgetBefore.paused) {
    return json({
      success: true,
      enriched: 0,
      skipped_reason: 'budget_paused',
      budget: budgetBefore,
    });
  }

  const { data: pending, error: pendingErr } = await supabase
    .from('properties')
    .select('*')
    .in('enrichment_status', ['pending', 'skipped'])
    .order('composite_score', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (pendingErr) return json({ success: false, error: pendingErr.message }, 500);
  if (!pending?.length) return json({ success: true, enriched: 0, skipped_reason: 'none_pending' });

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' });
  const model = Deno.env.get('CLAUDE_MODEL') || 'claude-haiku-4-5-20251001';

  let enriched = 0;
  let failed = 0;
  let totalCost = 0;
  const results: Array<{ id: string; status: string }> = [];

  for (const prop of pending) {
    // Re-check the budget mid-loop too, so a run that started under budget
    // stops as soon as it crosses the threshold rather than finishing the
    // whole batch first.
    const midBudget = await checkOrRecordBudget(supabase, 0);
    if (midBudget.paused) {
      results.push({ id: prop.id, status: 'skipped_budget_paused' });
      continue;
    }

    await supabase.from('properties').update({ enrichment_status: 'processing' }).eq('id', prop.id);

    try {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: 'You are a real estate investment analyst. Always respond with valid JSON only.',
        messages: [{ role: 'user', content: buildPrompt(prop) }],
      });

      const textBlock = response.content[0];
      const analysis = JSON.parse(textBlock.type === 'text' ? textBlock.text : '{}');
      analysis.model_used = response.model;
      analysis.enriched_at = new Date().toISOString();

      const inputTok = response.usage.input_tokens || 0;
      const outputTok = response.usage.output_tokens || 0;
      const costUsd = (inputTok * PRICE_PER_MTOK.input + outputTok * PRICE_PER_MTOK.output) / 1_000_000;
      totalCost += costUsd;

      await supabase.from('properties').update({
        ai_analysis: analysis,
        ai_enriched_at: new Date().toISOString(),
        enrichment_status: 'complete',
      }).eq('id', prop.id);

      await checkOrRecordBudget(supabase, costUsd);

      enriched++;
      results.push({ id: prop.id, status: 'complete' });
    } catch (aiErr) {
      console.error('enrich-properties-batch item error:', prop.id, aiErr);
      await supabase.from('properties').update({ enrichment_status: 'failed' }).eq('id', prop.id);
      failed++;
      results.push({ id: prop.id, status: 'failed' });
    }
  }

  const budgetAfter = await checkOrRecordBudget(supabase, 0);

  return json({
    success: true,
    enriched,
    failed,
    total_cost_usd: Math.round(totalCost * 10000) / 10000,
    budget: budgetAfter,
    results,
  });
});
