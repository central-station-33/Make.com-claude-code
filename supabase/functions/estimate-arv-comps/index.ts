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
 * zip + property type, require a sale within the lookback window, and take
 * the MEDIAN across comps -- median rather than mean because a handful of
 * NYC/NJ comps easily includes an outlier renovation or teardown, and one
 * extreme shouldn't move the estimate the way it would a mean. Below
 * MIN_COMPS comps, the estimate is untrusted and nothing is written -- a
 * wrong ARV actively corrupts deal_quality_score, so no comps is a better
 * outcome than a guess presented as data.
 *
 * Two sizing modes, chosen per subject:
 *  - sqft known: size-band comps to 80-120% of the subject's square footage
 *    and price by median $/sqft * subject sqft. This is the precise path.
 *  - sqft unknown: comps by zip+type only (no size band), ARV = median
 *    closePrice directly. Required for NJ -- confirmed live against NJOGIS's
 *    full MOD-IV field list (43 fields) that it carries no building-area
 *    field at all (CALC_ACRE/Shape__Area are LOT size, not building size),
 *    so sqft is null for every NJ property this session found, and a
 *    sqft-only implementation would silently never run for NJ at all -- the
 *    one state this account's coverage actually reaches (confirmed live via
 *    probe: NJ Garden State MLS towns, no NY coverage seen). Less precise
 *    than the $/sqft path, so `arv_comp_method` records which one ran.
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
 * Batch mode defaults to state='NJ' -- confirmed live (see above) as the only
 * state this account actually covers; without this, best-scored-first spent
 * every batch call on NYC properties (they dominate the top of
 * composite_score) that this account can never price, and returned 0 usable
 * comps for all 30 tried. Pass `state: null` explicitly to go unscoped, or a
 * different state string, once/if the account's coverage changes.
 *
 * POST body: {
 *   property_id?: string,        // one property; default: batch mode
 *   limit?: number,               // batch mode only; default 10, max 50
 *   state?: string | null,        // batch mode only; default 'NJ', null = unscoped
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
// Batch mode's default scope -- see the `stateFilter` comment at its use site.
const DEFAULT_BATCH_STATE = 'NJ';

// NOTE: also writes properties.arv_comp_method ('price_per_sqft' |
// 'median_sold_price') alongside arv_source/arv_comp_count/arv_computed_at.

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
  // Defaults to the only state this SimplyRETS account was confirmed live to
  // cover (Garden State MLS towns -- zero NYC coverage seen). Best-scored-
  // first previously wasted every batch call on NYC properties, which
  // dominate the top of composite_score but this account can never price.
  // Pass state: null explicitly to go back to unscoped, once/if NY coverage
  // is added to the account.
  const stateFilter = body.state === null ? null : (typeof body.state === 'string' ? body.state : DEFAULT_BATCH_STATE);

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
      let query = supabase
        .from('properties')
        .select('*')
        .is('quarantined_at', null)
        .or('estimated_arv.is.null,estimated_arv.eq.0')
        .not('zip', 'is', null)
        .neq('zip', '');
      if (stateFilter) query = query.eq('state', stateFilter);
      const { data, error } = await query
        .order('composite_score', { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) return json({ success: false, error: error.message }, 500);
      subjects = data ?? [];
    }

    const results: Record<string, unknown>[] = [];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - lookbackMonths);

    const median = (nums: number[]): number => {
      const mid = Math.floor(nums.length / 2);
      return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
    };

    for (const subject of subjects) {
      const zip = String(subject.zip ?? '').trim();
      const sqft = Number(subject.square_footage) || 0;
      const mlsType = mapPropertyType(subject.property_type as string);

      if (!zip || !mlsType) {
        results.push({ id: subject.id, skipped: true, reason: !zip ? 'no_zip' : 'unmapped_property_type' });
        continue;
      }

      const params = new URLSearchParams({ status: 'Closed', type: mlsType, limit: '50' });
      params.append('postalCodes', zip);
      if (sqft) {
        params.set('minarea', String(Math.round(sqft * (1 - SIZE_BAND))));
        params.set('maxarea', String(Math.round(sqft * (1 + SIZE_BAND))));
      }

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
      const sold = listings.filter((l) => {
        const closeDate = l.sales?.closeDate ? new Date(l.sales.closeDate) : null;
        return l.sales?.closePrice && closeDate && closeDate >= cutoff;
      });

      let arv: number, compCount: number, method: string;

      if (sqft) {
        // Precise path: only comps with a known area count, priced per sqft.
        const pricesPerSqft = sold
          .filter((l) => l.property?.area)
          .map((l) => (l.sales!.closePrice as number) / (l.property!.area as number))
          .sort((a, b) => a - b);
        if (pricesPerSqft.length < MIN_COMPS) {
          results.push({ id: subject.id, insufficient_comps: true, comps_found: pricesPerSqft.length });
          continue;
        }
        compCount = pricesPerSqft.length;
        method = 'price_per_sqft';
        arv = Math.round(median(pricesPerSqft) * sqft);
      } else {
        // NJ fallback (see header doc): no building-area field in NJOGIS
        // MOD-IV, so price off the raw sold price directly -- coarser, but
        // the only option this source can support at all.
        const prices = sold.map((l) => l.sales!.closePrice as number).sort((a, b) => a - b);
        if (prices.length < MIN_COMPS) {
          results.push({ id: subject.id, insufficient_comps: true, comps_found: prices.length, no_sqft: true });
          continue;
        }
        compCount = prices.length;
        method = 'median_sold_price';
        arv = Math.round(median(prices));
      }

      results.push({
        id: subject.id, address: subject.address, sqft: sqft || null, method,
        comp_count: compCount, estimated_arv: arv, previous_estimated_arv: subject.estimated_arv,
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
        arv_comp_method: r.method,
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
