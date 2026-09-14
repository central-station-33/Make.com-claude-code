/**
 * backfill-nj-zip — corrects properties.zip for NJ rows using the free US
 * Census Bureau geocoder (see _shared/geocode.ts), address-level rather than
 * municipality-level. Newark, Jersey City, and Elizabeth -- three of this
 * pipeline's own six NJ ingest targets -- each span many zip codes, so a
 * coarse municipality->zip table would still be wrong for exactly the rows
 * that matter most here.
 *
 * Why this exists (see CLAUDE.md for the full write-up): NJOGIS MOD-IV's
 * ZIP_CODE and ZIP5 fields are identical and both hold the OWNER'S mailing
 * zip, not the property's -- confirmed live (a Jersey City property showing
 * zip 20260, Washington DC, for an out-of-state owner). ingest-nj wrote that
 * straight into properties.zip, so it's only coincidentally right for
 * owner-occupied homes and wrong for absentee/institutional owners -- which
 * contact_likelihood_score itself rewards (+10 for an out-of-state owner),
 * so this hits the pipeline's own priority rows hardest, not a rare edge
 * case.
 *
 * Targets rows where zip_geocoded_at IS NULL, so this doubles as both the
 * one-time backfill for existing rows AND the ongoing fix for newly
 * ingested ones -- ingest-nj itself is left alone (still writes the wrong
 * zip initially), and re-running this periodically after ingest-nj is the
 * intended way new NJ rows get corrected, rather than slowing down ingest
 * with a geocode call per row inline.
 *
 * Safety check: a geocoded zip outside NJ's own range (07xxx/08xxx) is
 * rejected and left uncorrected rather than written -- a bad geocode match
 * substituting one wrong out-of-state zip for another would be exactly the
 * bug this exists to fix.
 *
 * The Census geocoder has no bulk one-line-address endpoint (only a batch
 * FILE upload flow, a separate integration), so this calls it once per
 * property and paginates like rescore-properties -- a conservative default
 * limit per call, call again for more.
 *
 * POST body: { limit?: number, dry_run?: boolean }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { geocodeZip } from '../_shared/geocode.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const NJ_ZIP_RE = /^0[78]\d{3}$/;

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const limit = Math.min(Math.max(Number(body.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const supabase = getServiceClient();

  try {
    const { data: rows, error } = await supabase
      .from('properties')
      .select('id, address, city, zip')
      .eq('state', 'NJ')
      .is('quarantined_at', null)
      .is('zip_geocoded_at', null)
      .not('address', 'is', null)
      .neq('address', '')
      .not('city', 'is', null)
      .neq('city', '')
      .order('composite_score', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) return json({ success: false, error: error.message }, 500);

    const results: Record<string, unknown>[] = [];
    for (const row of rows ?? []) {
      const geo = await geocodeZip(row.address as string, row.city as string, 'NJ');
      const valid = geo && NJ_ZIP_RE.test(geo.zip);
      results.push({
        id: row.id, address: row.address, old_zip: row.zip,
        new_zip: valid ? geo!.zip : null,
        matched_address: valid ? geo!.matchedAddress : null,
        geocode_failed: !valid,
      });
    }

    if (dryRun) {
      await persistDiag(supabase, { stage: 'dry_run', results });
      return json({ success: true, data: { dry_run: true, results } });
    }

    let updated = 0, failed = 0;
    for (const r of results) {
      const patch: Record<string, unknown> = { zip_geocoded_at: new Date().toISOString() };
      if (typeof r.new_zip === 'string') {
        patch.zip = r.new_zip;
        patch.zip_source = 'census_geocoded';
      }
      const { error: upErr } = await supabase.from('properties').update(patch).eq('id', r.id);
      if (upErr) { failed++; continue; }
      if (typeof r.new_zip === 'string') updated++; else failed++;
    }

    await persistDiag(supabase, { stage: 'processed', attempted: rows?.length ?? 0, updated, failed, results });
    return json({ success: true, data: { attempted: rows?.length ?? 0, updated, failed, results } });
  } catch (e) {
    const msg = (e as Error).message;
    await persistDiag(supabase, { stage: 'exception', error: msg });
    return json({ success: false, error: msg }, 500);
  }
});

async function persistDiag(supabase: ReturnType<typeof getServiceClient>, data: Record<string, unknown>) {
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: 'diagnostic_backfill_nj_zip',
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
