/**
 * rescore-properties — recompute scores for properties already in the table.
 *
 * The scoring engine lives in _shared/scoring.ts and every other caller applies
 * it only to rows on their way IN (process-raw-properties, score-property).
 * That left no way to re-apply a changed engine to the ~900 rows already
 * stored, so the database silently kept scores from whatever version of the
 * engine happened to be deployed the day each row arrived.
 *
 * Run this after any change to scoring.ts or to the tier cuts.
 *
 * The response reports the resulting tier distribution, which is also the
 * calibration instrument: `assignPriorityTier`'s cuts are percentiles, so when
 * the source mix shifts, call this with dry_run and move the cuts until Tier 1
 * is back near the intended ~5%.
 *
 * POST body: { dry_run?: boolean, limit?: number }
 *   dry_run: compute and report the distribution, write nothing.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreProperty } from '../_shared/scoring.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const PAGE = 500;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const cap = Number(body.limit) || 0;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const tiers: Record<string, number> = {};
  const scoreHistogram: Record<string, number> = {};
  const errors: string[] = [];
  let read = 0;
  let written = 0;
  let changed = 0;

  try {
    for (let from = 0; ; from += PAGE) {
      const to = cap ? Math.min(from + PAGE, cap) - 1 : from + PAGE - 1;
      if (cap && from >= cap) break;

      const { data: rows, error } = await supabase
        .from('properties')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);

      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        read++;
        const scores = scoreProperty(row as Record<string, unknown>);
        tiers[scores.priority_tier] = (tiers[scores.priority_tier] ?? 0) + 1;
        const k = String(scores.composite_score);
        scoreHistogram[k] = (scoreHistogram[k] ?? 0) + 1;

        if (row.composite_score !== scores.composite_score || row.priority_tier !== scores.priority_tier) {
          changed++;
        }
        if (dryRun) continue;

        const { error: upErr } = await supabase
          .from('properties')
          .update({
            distress_score: scores.distress_score,
            deal_quality_score: scores.deal_quality_score,
            contact_likelihood_score: scores.contact_likelihood_score,
            timeline_urgency_score: scores.timeline_urgency_score,
            composite_score: scores.composite_score,
            priority_tier: scores.priority_tier,
            deal_type: scores.deal_type,
          })
          .eq('id', row.id);

        if (upErr) errors.push(`${row.id}: ${upErr.message}`);
        else written++;
      }

      if (rows.length < PAGE) break;
    }

    const pct = (n: number) => `${((n / Math.max(read, 1)) * 100).toFixed(1)}%`;

    return json({
      success: true,
      data: {
        dry_run: dryRun,
        read,
        written,
        changed,
        tiers,
        tier_share: Object.fromEntries(Object.entries(tiers).map(([t, n]) => [t, pct(n)])),
        score_histogram: scoreHistogram,
        errors: errors.slice(0, 20),
        error_count: errors.length,
      },
    });
  } catch (e) {
    return json({ success: false, error: (e as Error).message, read, written }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
