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
 * Also (re)computes owner_kind (see _shared/owner-classification.ts) for
 * every row it touches, so this is also how existing rows pick up that
 * classification after it was added.
 *
 * Also syncs enrichment_status with the recomputed tier. process-raw-
 * properties sets enrichment_status once, at ingest time, from whatever
 * priority_tier the row got THEN -- it never revisits it. Without this sync,
 * a row promoted into Tier 1 by a later recalibration (like the 2026-09-12
 * cut change) stays enrichment_status='skipped' forever, since nothing else
 * ever looks at it again: confirmed live, all 444 NY properties showed
 * enrichment_status='skipped' despite 49 being Tier 1 under the current
 * cuts, because none of them were Tier 1 under the old 80/60/40 cuts at
 * ingest time. Only flips 'skipped'->'pending' (promoted into Tier 1) and
 * 'pending'->'skipped' (demoted out, so the Tier-1-only AI gate in
 * enrich-pending doesn't spend on it) -- 'complete', 'processing' and
 * 'failed' are left alone regardless of tier changes, so a re-run never
 * re-queues or discards a row that already went through enrichment.
 *
 * POST body: { dry_run?: boolean, limit?: number }
 *   dry_run: compute and report the distribution, write nothing.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scoreProperty } from '../_shared/scoring.ts';
import { classifyOwnerKind } from '../_shared/owner-classification.ts';

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
  const ownerKinds: Record<string, number> = {};
  const errors: string[] = [];
  let read = 0;
  let written = 0;
  let changed = 0;
  let promotedToPending = 0;
  let demotedToSkipped = 0;

  try {
    for (let from = 0; ; from += PAGE) {
      const to = cap ? Math.min(from + PAGE, cap) - 1 : from + PAGE - 1;
      if (cap && from >= cap) break;

      // Quarantined rows keep whatever tier they were parked at. Rescoring
      // them would recompute priority_tier from their (fabricated) attributes
      // and promote them straight back into Tier 1, which is exactly what the
      // quarantine exists to prevent.
      const { data: rows, error } = await supabase
        .from('properties')
        .select('*')
        .is('quarantined_at', null)
        .order('id', { ascending: true })
        .range(from, to);

      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        read++;
        const scores = scoreProperty(row as Record<string, unknown>);
        const ownerKind = classifyOwnerKind(row.owner_name as string | null);
        tiers[scores.priority_tier] = (tiers[scores.priority_tier] ?? 0) + 1;
        ownerKinds[ownerKind] = (ownerKinds[ownerKind] ?? 0) + 1;
        const k = String(scores.composite_score);
        scoreHistogram[k] = (scoreHistogram[k] ?? 0) + 1;

        const isTier1 = scores.priority_tier === 'Tier 1';
        const currentStatus = row.enrichment_status as string | null;
        let enrichmentStatus = currentStatus;
        if (isTier1 && currentStatus === 'skipped') {
          enrichmentStatus = 'pending';
          promotedToPending++;
        } else if (!isTier1 && currentStatus === 'pending') {
          enrichmentStatus = 'skipped';
          demotedToSkipped++;
        }

        if (row.composite_score !== scores.composite_score || row.priority_tier !== scores.priority_tier
          || row.owner_kind !== ownerKind || enrichmentStatus !== currentStatus) {
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
            owner_kind: ownerKind,
            enrichment_status: enrichmentStatus,
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
        promoted_to_pending: promotedToPending,
        demoted_to_skipped: demotedToSkipped,
        tiers,
        tier_share: Object.fromEntries(Object.entries(tiers).map(([t, n]) => [t, pct(n)])),
        owner_kinds: ownerKinds,
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
