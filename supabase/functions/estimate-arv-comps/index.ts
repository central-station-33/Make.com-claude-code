/**
 * estimate-arv-comps — refines properties.estimated_arv from real recently-
 * sold comparable listings via SimplyRETS (an IDX/MLS data API the user
 * already holds an account with -- CLAUDE.md's "no paid data sources" rule
 * doesn't apply here the way it does to lead sourcing: this doesn't find
 * leads, it prices ones the free distress sources already found).
 *
 * Why this exists: calculateDealQualityScore (_shared/scoring.ts) falls back
 * to assessed_value when estimated_arv is 0, which covers ~3x more rows but
 * is a tax valuation, not a market one -- routinely stale and unrelated to
 * what a property would actually sell for post-repair. Real recent comps are
 * the correct input; this is the first source in the pipeline that can
 * provide them.
 *
 * Method: pull recently-SOLD listings from SimplyRETS matching the subject's
 * zip + property type + a size band (80-120% of its square footage), require
 * a sale within the lookback window, and take the MEDIAN $/sqft across those
 * comps -- median rather than mean because a handful of NYC/NJ comps easily
 * includes an outlier renovation or teardown, and one extreme shouldn't move
 * the estimate the way it would a mean. ARV = median $/sqft * subject sqft.
 * Below MIN_COMPS comps, the estimate is untrusted and nothing is written --
 * a wrong ARV actively corrupts deal_quality_score, so no comps is a better
 * outcome than a guess presented as data.
 *
 * property_type -> SimplyRETS `type` mapping is best-effort (see
 * mapPropertyType) and rows with no confident mapping are skipped entirely
 * rather than searched across all types, which would return comps that
 * aren't actually comparable.
 *
 * IMPORTANT: like the DataSkip integration, SimplyRETS's documented request/
 * response shape (github.com/APIs-guru/openapi-directory's mirror of their
 * OpenAPI spec) hasn't been exercised against the user's real account from
 * this session -- only the public simplyrets/simplyrets demo credentials,
 * which return fixed demo-market listings, not NY/NJ data. Run once with
 * dry_run against a small limit and check the diagnostic row before trusting
 * the mapping or writing real data.
 *
 * Requires secrets SIMPLYRETS_API_KEY / SIMPLYRETS_API_SECRET (Basic Auth) --
 * not set by this session; add them as Supabase Edge Function secrets.
 *
 * POST body: {
 *   property_id?: string,        // one property; default: batch mode
 *   limit?: number,               // batch mode only; default 10, max 50
 *   lookback_months?: number,     // how recent a sold comp must be; default 12
 *   dry_run?: boolean,            // compute + preview, write nothing
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET   = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const SIMPLYRETS_KEY    = Deno.env.get('SIMPLYRETS_API_KEY') ?? '';
const SIMPLYRETS_SECRET = Deno.env.get('SIMPLYRETS_API_SECRET') ?? '';
const SIMPLYRETS_ENDPOINT = 'https://api.simplyrets.com/properties';

// A comp within 20% of the subject's size is close enough to price off of;
// tighter than that and small NY/NJ zip codes often don't have enough sales.
const SIZE_BAND = 0.2;
const MIN_COMPS = 3;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const DEFAULT_LOOKBACK_MONTHS = 12;

interface SimplyRetsListing {
  address?: { postalCode?: string };
  property?: { area?: number };
  sales?: { closePrice?: number; closeDate?: string };
}

// SimplyRETS' `type` is coarser than this pipeline's property_type -- rows
// with no confident mapping are skipped (see header doc) rather than
// searched unfiltered, which would return non-comparable comps.
function mapPropertyType(t: string | null | undefined): string | null {
  switch ((t ?? '').toLowerCase()) {
    case 'single_family': case 'sfr': case 'townhouse': return 'residential';
    case 'duplex': case 'triplex': case 'fourplex': case 'multifamily': case 'apartment': return 'multifamily';
    case 'condo': case 'coop': return 'condominium'; // co-ops aren't a distinct MLS category; nearest fit
    case 'land': return 'land';
    default: return null;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }
  if (!SIMPLYRETS_KEY || !SIMPLYRETS_SECRET) {
    return json({ success: false, error: 'SIMPLYRETS_API_KEY / SIMPLYRETS_API_SECRET not configured' }, 500);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const lookbackMonths = Math.max(Number(body.lookback_months) || DEFAULT_LOOKBACK_MONTHS, 1);
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const supabase = getServiceClient();

  try {
    let subjects: Record<string, unknown>[];

    if (typeof body.property_id === 'string' && body.property_id) {
      const { data, error } = await supabase.from('properties').select('*').eq('id', body.property_id).maybeSingle();
      if (error) return json({ success: false, error: error.message }, 500);
      if (!data) return json({ success: false, error: 'property not found' }, 404);
      subjects = [data];
    } else {
      // Best-scored first -- same reasoning as skip-trace-leads: a limited
      // number of comp lookups should go to the leads that matter most, not
      // whichever rows happen to sort first.
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .is('quarantined_at', null)
        .or('estimated_arv.is.null,estimated_arv.eq.0')
        .not('zip', 'is', null)
        .neq('zip', '')
        .order('composite_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) return json({ success: false, error: error.message }, 500);
      subjects = data ?? [];
    }

    const results: Record<string, unknown>[] = [];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - lookbackMonths);

    for (const subject of subjects) {
      const zip = String(subject.zip ?? '').trim();
      const sqft = Number(subject.square_footage) || 0;
      const mlsType = mapPropertyType(subject.property_type as string);

      if (!zip || !sqft || !mlsType) {
        results.push({ id: subject.id, skipped: true, reason: !zip ? 'no_zip' : !sqft ? 'no_sqft' : 'unmapped_property_type' });
        continue;
      }

      const params = new URLSearchParams({
        status: 'Closed',
        type: mlsType,
        minarea: String(Math.round(sqft * (1 - SIZE_BAND))),
        maxarea: String(Math.round(sqft * (1 + SIZE_BAND))),
        limit: '50',
      });
      params.append('postalCodes', zip);

      const auth = btoa(`${SIMPLYRETS_KEY}:${SIMPLYRETS_SECRET}`);
      const res = await fetch(`${SIMPLYRETS_ENDPOINT}?${params}`, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(20000),
      });

      if (!res.ok) {
        results.push({ id: subject.id, error: `SimplyRETS ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}` });
        continue;
      }

      const listings = await res.json() as SimplyRetsListing[];
      const pricesPerSqft = listings
        .filter((l) => {
          const closeDate = l.sales?.closeDate ? new Date(l.sales.closeDate) : null;
          return l.sales?.closePrice && l.property?.area && closeDate && closeDate >= cutoff;
        })
        .map((l) => (l.sales!.closePrice as number) / (l.property!.area as number))
        .sort((a, b) => a - b);

      if (pricesPerSqft.length < MIN_COMPS) {
        results.push({ id: subject.id, insufficient_comps: true, comps_found: pricesPerSqft.length });
        continue;
      }

      const mid = Math.floor(pricesPerSqft.length / 2);
      const medianPricePerSqft = pricesPerSqft.length % 2 === 0
        ? (pricesPerSqft[mid - 1] + pricesPerSqft[mid]) / 2
        : pricesPerSqft[mid];
      const arv = Math.round(medianPricePerSqft * sqft);

      results.push({
        id: subject.id, address: subject.address, sqft,
        comp_count: pricesPerSqft.length, median_price_per_sqft: Math.round(medianPricePerSqft),
        estimated_arv: arv, previous_estimated_arv: subject.estimated_arv,
      });
    }

    if (dryRun) {
      await persistDiag(supabase, { stage: 'dry_run', lookback_months: lookbackMonths, results });
      return json({ success: true, data: { dry_run: true, results } });
    }

    let written = 0;
    for (const r of results) {
      if (typeof r.estimated_arv !== 'number') continue;
      const { error } = await supabase.from('properties').update({
        estimated_arv: r.estimated_arv,
        arv_source: 'comps',
        arv_comp_count: r.comp_count,
        arv_computed_at: new Date().toISOString(),
      }).eq('id', r.id);
      if (!error) written++;
    }

    await persistDiag(supabase, { stage: 'processed', lookback_months: lookbackMonths, attempted: subjects.length, written, results });
    return json({ success: true, data: { attempted: subjects.length, written, results } });
  } catch (e) {
    const msg = (e as Error).message;
    await persistDiag(supabase, { stage: 'exception', error: msg });
    return json({ success: false, error: msg }, 500);
  }
});

async function persistDiag(supabase: ReturnType<typeof getServiceClient>, data: Record<string, unknown>) {
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: 'diagnostic_estimate_arv_comps',
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
