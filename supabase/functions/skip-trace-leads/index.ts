/**
 * skip-trace-leads — resolves owner phone/email via BatchData's paid skip
 * trace API, for leads/properties that have a name + address but no contact
 * info yet. Approved 2026-09-08 as an explicit, narrow override of the
 * project's "no paid data sources" default (see CLAUDE.md) — phone/email
 * for individual property owners has no free bulk source, and the ISA
 * pipeline is call/email/social only (no mail campaigns), so this is
 * load-bearing rather than optional.
 *
 * IMPORTANT: BatchData's exact request/response field names could not be
 * verified live from this environment (outbound access to their docs
 * domains is blocked). buildTraceRequest() / parseTraceResult() below are
 * the ONLY two places vendor-specific field names live — everything else
 * (auth, batching, dedupe, DB writes, cost caps) is vendor-agnostic. Every
 * run persists the raw upstream response into raw_properties as
 * diagnostic_skip_trace_<table>, so a field-name mismatch shows up in one
 * run instead of failing silently. Run once with a small limit and check
 * that diagnostic row before trusting the mapping.
 *
 * Billing note: this is the only per-lookup billed step in the pipeline, so
 * it spends best-scored-lead-first and defaults to a small batch. A record
 * the vendor response doesn't describe is left untraced (retryable) rather
 * than marked no_match -- the lookup is billed either way, and marking it
 * would lock the lead out of every future run on the strength of a response
 * we failed to parse. Use dry_run to see what a call would buy, for free.
 *
 * POST body: {
 *   table?: 'isa_leads'|'properties',   // default isa_leads
 *   segment?: string,                   // default: walk the priority tiers
 *   limit?: number,                     // default 5, max 100
 *   min_bant_score?: number,            // isa_leads only; 0 = no filter
 *   dry_run?: boolean,                  // resolve targets, call nothing, spend nothing
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { segmentTiers, unrankedSegmentFilter } from '../_shared/segment-priority.ts';

const MAKE_SECRET         = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const BATCHDATA_API_KEY   = Deno.env.get('BATCHDATA_API_KEY') ?? '';
const BATCHDATA_ENDPOINT  = 'https://api.batchdata.com/api/v1/property/skip-trace';

// BatchData's bulk skip-trace accepts a batch of requests in one call —
// capped at 100 per published limits. The default batch is deliberately far
// below that: this is billed per lookup against a small balance, and the
// field mapping above is unverified, so the first batches should be cheap
// enough that a mismatch costs cents rather than the balance. Raise `limit`
// per call once a run has been confirmed against the diagnostic.
const MAX_BATCH     = 100;
const DEFAULT_BATCH = 5;

interface TraceRecord {
  id: string;
  ownerName: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }
  if (!BATCHDATA_API_KEY) {
    return json({ success: false, error: 'BATCHDATA_API_KEY not configured' }, 500);
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const table   = body.table === 'properties' ? 'properties' : 'isa_leads';
  // No segment named means "spend this budget in priority order" (homeowner,
  // then investor, then athlete/celebrity) rather than a fixed segment —
  // this is the per-hit-billed path, so what it spends on first matters.
  const segment  = table === 'isa_leads' && body.segment ? String(body.segment) : null;
  const limit    = Math.min(Math.max(Number(body.limit) || DEFAULT_BATCH, 1), MAX_BATCH);
  const minScore = Math.max(Number(body.min_bant_score) || 0, 0);
  // Costs nothing: resolves exactly which records *would* be bought and
  // returns them without calling the vendor. Worth running before any batch
  // while the balance is small.
  const dryRun   = body.dry_run === true;

  const supabase = getServiceClient();

  const { records, error: fetchError } = table === 'properties'
    ? await fetchPropertyRecords(supabase, limit)
    : await fetchIsaLeadRecords(supabase, segment, limit, minScore);

  if (fetchError) {
    await persistDiag(supabase, table, { stage: 'query_records', error: fetchError });
    return json({ success: false, error: fetchError }, 500);
  }
  if (!records.length) {
    await persistDiag(supabase, table, { stage: 'no_records_to_trace', segment });
    return json({ success: true, data: { attempted: 0, matched: 0 } });
  }

  if (dryRun) {
    return json({ success: true, data: {
      dry_run: true,
      would_trace: records.length,
      records: records.map((r) => ({ id: r.id, owner: r.ownerName, address: r.address })),
    } });
  }

  let rawResponse: unknown = null;
  let matched = 0;
  let noMatch = 0;
  let unresolved = 0;   // billed, but the response didn't describe them — retryable
  const errors: string[] = [];

  try {
    const res = await fetch(BATCHDATA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BATCHDATA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTraceRequest(records)),
    });

    rawResponse = await res.json().catch(() => null);

    if (!res.ok) {
      errors.push(`BatchData ${res.status}: ${JSON.stringify(rawResponse).slice(0, 300)}`);
    } else {
      const results = parseTraceResult(rawResponse, records);

      for (const record of records) {
        const hit = results.get(record.id);
        const nowIso = new Date().toISOString();

        // A record the response never described is left with a NULL
        // skip_trace_status so a later run retries it. Marking it 'no_match'
        // would be indistinguishable from the vendor genuinely having no
        // contact for them -- and since the untraced query filters on
        // skip_trace_status IS NULL, that would lock the lead out forever on
        // the strength of a response we failed to parse. The lookup is billed
        // either way; there's no reason to lose the lead as well.
        if (!hit) {
          unresolved++;
          continue;
        }

        if (hit.phone || hit.email) {
          const { error: updateError } = table === 'properties'
            ? await supabase.from('properties').update({
                owner_phone: hit.phone ?? null,
                owner_email: hit.email ?? null,
                skip_trace_status: 'matched',
                skip_traced_at: nowIso,
              }).eq('id', record.id)
            : await supabase.from('isa_leads').update({
                phone: hit.phone ?? null,
                email: hit.email ?? null,
                skip_trace_status: 'matched',
                skip_traced_at: nowIso,
              }).eq('id', record.id);

          if (updateError) errors.push(`${record.id}: ${updateError.message}`);
          else matched++;
        } else {
          const { error: updateError } = await supabase.from(table).update({
            skip_trace_status: 'no_match',
            skip_traced_at: nowIso,
          }).eq('id', record.id);

          if (updateError) errors.push(`${record.id}: ${updateError.message}`);
          else noMatch++;
        }
      }
    }
  } catch (e) {
    errors.push((e as Error).message);
  }

  await persistDiag(supabase, table, {
    stage: 'processed', segment,
    requested: records.length, matched, no_match: noMatch, unresolved, errors,
    // Raw upstream body, for confirming/correcting the field mapping above.
    raw_response_sample: rawResponse,
  });

  return json({ success: true, data: {
    attempted: records.length, matched, no_match: noMatch, unresolved, errors,
  } });
});

async function fetchIsaLeadRecords(
  supabase: ReturnType<typeof getServiceClient>,
  segment: string | null,
  limit: number,
  minScore: number,
): Promise<{ records: TraceRecord[]; error: string | null }> {
  // Best-scored first, not newest first. Skip tracing is the only per-hit
  // billed step in the pipeline while enrichment is comparatively cheap, so
  // the right order is enrich everything, then buy contact details only for
  // the leads that scored well enough to be worth a call. Unenriched leads
  // (bant_score NULL) sort last -- their value is still unknown, and unknown
  // value shouldn't outrank a confirmed hot lead for a limited budget.
  const untraced = (max: number) => {
    const q = supabase
      .from('isa_leads')
      .select('id, full_name, entity_name, property_address')
      .is('skip_trace_status', null)
      .is('phone', null)
      .is('email', null)
      .not('property_address', 'is', null)
      .neq('property_address', '')
      .order('bant_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(max);

    // Applied only when asked for: in Postgres NULL >= 0 is NULL, so an
    // unconditional filter would drop every unenriched lead rather than
    // merely ranking it last, quietly narrowing the pool to enriched leads.
    return minScore > 0 ? q.gte('bant_score', minScore) : q;
  };

  const toRecords = (rows: Record<string, unknown>[]) => rows
    .map((row) => ({
      id: row.id as string,
      ownerName: (row.full_name ?? row.entity_name ?? '') as string,
      address: (row.property_address ?? '') as string,
      city: null, state: null, zip: null,
    }))
    .filter((r) => r.ownerName && r.address);

  if (segment) {
    const { data, error } = await untraced(limit).eq('segment', segment);
    if (error) return { records: [], error: error.message };
    return { records: toRecords(data ?? []), error: null };
  }

  let records: TraceRecord[] = [];
  for (const tier of segmentTiers()) {
    const remaining = limit - records.length;
    if (remaining <= 0) break;

    const query = tier.segments
      ? untraced(remaining).in('segment', tier.segments)
      : untraced(remaining).not('segment', 'in', unrankedSegmentFilter());

    const { data, error } = await query;
    if (error) return { records: [], error: error.message };
    records = records.concat(toRecords(data ?? []));
  }

  return { records, error: null };
}

async function fetchPropertyRecords(
  supabase: ReturnType<typeof getServiceClient>,
  limit: number,
): Promise<{ records: TraceRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, owner_name, address, city, state, zip')
    .is('skip_trace_status', null)
    .is('owner_phone', null)
    .is('owner_email', null)
    .not('owner_name', 'is', null)
    .neq('owner_name', '')
    .not('address', 'is', null)
    .neq('address', '')
    // Same reasoning as the isa_leads path: buy contact details for the
    // best-scored properties first. composite_score is the pipeline's own
    // judgement of a lead; assessed_value only breaks ties within it, since
    // an expensive building isn't necessarily a workable lead.
    .order('composite_score', { ascending: false, nullsFirst: false })
    .order('assessed_value',  { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return { records: [], error: error.message };

  const records = (data ?? []).map((row) => ({
    id: row.id as string,
    ownerName: row.owner_name as string,
    address: row.address as string,
    city: (row.city ?? null) as string | null,
    state: (row.state ?? null) as string | null,
    zip: (row.zip ?? null) as string | null,
  }));

  return { records, error: null };
}

// --- Vendor-specific mapping (best-effort, unverified — see file header) ---

function buildTraceRequest(records: TraceRecord[]) {
  return {
    requests: records.map((r) => ({
      requestId: r.id,
      propertyAddress: {
        street: r.address,
        city: r.city ?? undefined,
        state: r.state ?? undefined,
        zip: r.zip ?? undefined,
      },
      name: r.ownerName,
    })),
  };
}

function parseTraceResult(
  raw: unknown,
  records: TraceRecord[],
): Map<string, { phone: string | null; email: string | null }> {
  const out = new Map<string, { phone: string | null; email: string | null }>();
  const results = (raw as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return out;

  const knownIds = new Set(records.map((r) => r.id));
  // Fall back to position only when the response is plainly 1:1 with what we
  // sent. Correlating by position against a response of a different length is
  // a guess, and guessing wrong writes a stranger's phone number onto a lead
  // an ISA then calls -- worse than returning nothing. Anything uncorrelated
  // is left out of the map and counted as unresolved by the caller.
  const positionalOk = results.length === records.length;

  results.forEach((entry, i) => {
    const e = entry as Record<string, unknown>;
    const echoed = e.requestId as string | undefined;
    const requestId = echoed && knownIds.has(echoed)
      ? echoed
      : positionalOk ? records[i]?.id : undefined;
    if (!requestId) return;

    const phones = (e.phoneNumbers ?? e.phones ?? []) as Array<Record<string, unknown>>;
    const emails = (e.emails ?? []) as Array<Record<string, unknown> | string>;

    const phone = phones[0] ? String(phones[0].number ?? phones[0].phone ?? '') || null : null;
    const email = emails[0]
      ? (typeof emails[0] === 'string' ? emails[0] : String((emails[0] as Record<string, unknown>).email ?? '')) || null
      : null;

    out.set(requestId, { phone, email });
  });

  return out;
}

async function persistDiag(
  supabase: ReturnType<typeof getServiceClient>,
  table: string,
  data: Record<string, unknown>,
) {
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: `diagnostic_skip_trace_${table}`,
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), table, ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
