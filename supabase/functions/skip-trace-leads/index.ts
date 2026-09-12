/**
 * skip-trace-leads — resolves owner phone/email via DataSkip's paid skip
 * trace API (dataskip.io), for leads/properties that have a name + address
 * but no contact info yet. This is an explicit, narrow override of the
 * project's "no paid data sources" default (see CLAUDE.md) — phone/email
 * for individual property owners has no free bulk source, and the ISA
 * pipeline is call/email/social only (no mail campaigns), so this is
 * load-bearing rather than optional.
 *
 * Vendor history: CLAUDE.md originally named BatchData for this role
 * (2026-09-08), but no BatchData account was ever actually opened -- that
 * approval covered a concept, not a working integration. DataSkip (2026-09-12)
 * is the vendor actually in use. It calls DataSkip's documented bulk REST
 * endpoint directly via fetch(); it does not use DataSkip's own npm
 * CLI/SDK package, since installing a globally-scoped third-party package and
 * running its browser login flow inside this pipeline would be a large,
 * unnecessary trust expansion for something a plain HTTP call already does.
 *
 * Billing (per DataSkip's docs): matches cost a flat rate per hit; a miss is
 * documented and free (`found: false`, `charged: 0`). This is the one place
 * in the pipeline more contact info costs more money, so it defaults to a
 * small batch and spends best-scored-lead-first. A response entry that
 * doesn't parse as a clean hit or a clean documented miss is left untraced
 * (retryable) rather than assumed either way -- see parseTraceResult.
 * Use dry_run to see what a call would target, for free.
 *
 * TWO-STEP APPROVAL GATE (required 2026-09-08 -- real money, small balance):
 * no single request, regardless of its flags, can spend money. A call
 * without confirm_token PROPOSES a batch: it resolves the exact records,
 * charges nothing, and returns a one-time confirm_token good for 30 minutes
 * and not usable for at least 2 minutes (so a scenario can't auto-chain
 * propose->confirm in one breath -- a human is meant to review the proposal
 * in between). Only a second call presenting that token actually spends,
 * and only on the exact snapshot of records the proposal showed -- nothing
 * is re-queried at confirm time, so the batch can't grow between the two
 * calls. Never wire propose and confirm into the same Make scenario run;
 * the human approval this exists for has to happen in between.
 *
 * IMPORTANT: DataSkip's documented request/response shape below hasn't been
 * exercised against a live account from this session (no way to reach
 * dataskip.io or test a real call here). buildTraceRequest() /
 * parseTraceResult() are the ONLY two places vendor-specific field names
 * live -- everything else (auth, batching, dedupe, DB writes, cost caps) is
 * vendor-agnostic. Every run persists the raw upstream response into
 * raw_properties as diagnostic_skip_trace_<table>, so a mismatch shows up in
 * one run instead of failing silently. Run once with a small limit and check
 * that diagnostic row before trusting the mapping or raising `limit`.
 *
 * POST body: {
 *   table?: 'isa_leads'|'properties',   // default isa_leads
 *   segment?: string,                   // default: walk the priority tiers
 *   limit?: number,                     // default 5, max 100
 *   min_bant_score?: number,            // isa_leads only; 0 = no filter
 *   individuals_only?: boolean,         // properties only; see fetchPropertyRecords
 *   dry_run?: boolean,                  // resolve targets, call nothing, spend nothing, no token
 *   confirm_token?: string,             // from a prior propose call; presence = "run it"
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { segmentTiers, unrankedSegmentFilter } from '../_shared/segment-priority.ts';

const MAKE_SECRET        = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const DATASKIP_API_KEY   = Deno.env.get('DATASKIP_API_KEY') ?? '';
const DATASKIP_ENDPOINT  = 'https://app.dataskip.io/api/v1/skip-trace-bulk';

// DataSkip's bulk endpoint accepts up to 100 addresses per call. The default
// batch is deliberately far below that: this is billed per match against a
// small balance, and though DataSkip's request/response shape is documented,
// it hasn't been exercised against a live account from this session, so the
// first real batches should be small. Raise `limit` per call once a run has
// been confirmed against the diagnostic.
const MAX_BATCH     = 100;
const DEFAULT_BATCH = 5;

// How long a proposed batch stays confirmable, and the minimum gap before it
// CAN be confirmed. The floor exists so a Make scenario can't propose and
// confirm back-to-back in one run and call that "two steps" -- there has to
// be a real gap for a human to actually look at the proposal in between.
const CONFIRM_TTL_MS       = 30 * 60 * 1000;
const MIN_CONFIRM_DELAY_MS = 2  * 60 * 1000;

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
  if (!DATASKIP_API_KEY) {
    return json({ success: false, error: 'DATASKIP_API_KEY not configured' }, 500);
  }

  const body: Record<string, unknown> = await req.json().catch(() => ({}));
  const supabase = getServiceClient();

  // CONFIRM PATH — a confirm_token means "spend money now." Nothing here
  // re-resolves which records to trace: it uses the exact snapshot the
  // matching propose call showed, so the approved batch can't grow between
  // the two calls, and no combination of body flags reaches this path
  // without a token minted by an earlier, separate propose call.
  if (typeof body.confirm_token === 'string' && body.confirm_token) {
    const nowIso = new Date().toISOString();
    const confirmableBefore = new Date(Date.now() - MIN_CONFIRM_DELAY_MS).toISOString();

    const { data: confirmation, error: confirmError } = await supabase
      .from('skip_trace_confirmations')
      .update({ consumed_at: nowIso })
      .eq('token', body.confirm_token)
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .lt('created_at', confirmableBefore)
      .select()
      .maybeSingle();

    if (confirmError) return json({ success: false, error: confirmError.message }, 500);
    if (!confirmation) {
      return json({ success: false, error:
        'confirm_token is invalid, expired, already used, or was issued less than ' +
        '2 minutes ago. Call again without confirm_token to propose a fresh batch.',
      }, 400);
    }

    const records = confirmation.record_ids as TraceRecord[];
    return await runTrace(supabase, confirmation.table_name as string, confirmation.segment as string | null, records);
  }

  // PROPOSE PATH — resolves the batch and, unless dry_run, mints a token.
  // Spends nothing either way.
  const table   = body.table === 'properties' ? 'properties' : 'isa_leads';
  // No segment named means "spend this budget in priority order" (homeowner,
  // then investor, then athlete/celebrity) rather than a fixed segment —
  // this is the per-hit-billed path, so what it spends on first matters.
  const segment  = table === 'isa_leads' && body.segment ? String(body.segment) : null;
  const limit    = Math.min(Math.max(Number(body.limit) || DEFAULT_BATCH, 1), MAX_BATCH);
  const minScore = Math.max(Number(body.min_bant_score) || 0, 0);
  const individualsOnly = table === 'properties' && body.individuals_only === true;
  const dryRun   = body.dry_run === true;

  const { records, error: fetchError } = table === 'properties'
    ? await fetchPropertyRecords(supabase, limit, individualsOnly)
    : await fetchIsaLeadRecords(supabase, segment, limit, minScore);

  if (fetchError) {
    await persistDiag(supabase, table, { stage: 'query_records', error: fetchError });
    return json({ success: false, error: fetchError }, 500);
  }

  const preview = records.map((r) => ({ id: r.id, owner: r.ownerName, address: r.address }));

  if (dryRun) {
    return json({ success: true, data: { dry_run: true, would_trace: records.length, records: preview } });
  }
  if (!records.length) {
    await persistDiag(supabase, table, { stage: 'no_records_to_trace', segment });
    return json({ success: true, data: { attempted: 0, matched: 0 } });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + CONFIRM_TTL_MS).toISOString();

  const { error: proposeError } = await supabase.from('skip_trace_confirmations').insert({
    token, table_name: table, segment, record_ids: records, record_count: records.length, expires_at: expiresAt,
  });
  if (proposeError) return json({ success: false, error: proposeError.message }, 500);

  return json({ success: true, data: {
    confirmation_required: true,
    confirm_token: token,
    confirmable_after: new Date(Date.now() + MIN_CONFIRM_DELAY_MS).toISOString(),
    expires_at: expiresAt,
    would_trace: records.length,
    records: preview,
  } });
});

async function runTrace(
  supabase: ReturnType<typeof getServiceClient>,
  table: string,
  segment: string | null,
  records: TraceRecord[],
): Promise<Response> {
  let rawResponse: unknown = null;
  let matched = 0;
  let noMatch = 0;
  let unresolved = 0;   // response entry didn't parse as a clean hit or documented miss — retryable
  const errors: string[] = [];

  try {
    const res = await fetch(DATASKIP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DATASKIP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTraceRequest(records)),
    });

    rawResponse = await res.json().catch(() => null);

    if (res.status === 402) {
      errors.push(`DataSkip 402: insufficient balance — ${JSON.stringify(rawResponse).slice(0, 200)}`);
    } else if (!res.ok) {
      errors.push(`DataSkip ${res.status}: ${JSON.stringify(rawResponse).slice(0, 300)}`);
    } else {
      const results = parseTraceResult(rawResponse, records);

      for (const record of records) {
        const hit = results.get(record.id);
        const nowIso = new Date().toISOString();

        // A record the response never described as either a clean hit or a
        // clean documented miss is left with a NULL skip_trace_status so a
        // later run retries it, rather than marked 'no_match' -- and since
        // the untraced query filters on skip_trace_status IS NULL, marking it
        // wrongly would lock the lead out forever on the strength of a
        // response we failed to parse.
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
    // Raw upstream body, for confirming the response shape assumed below
    // actually matches what DataSkip returns on a real account.
    raw_response_sample: rawResponse,
  });

  return json({ success: true, data: {
    attempted: records.length, matched, no_match: noMatch, unresolved, errors,
  } });
}

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

// owner_type is not reliable for telling a person from a company: NJ MOD-IV
// writes building names and tax-program labels straight into owner_name with
// owner_type='individual' regardless -- "Legacy@Liberty Park", "Public
// Housing", "North Tower", "5 Year Tax Agreement" all pass through that way.
// Filter on the shape of the name itself instead: 2-3 alphabetic words, no
// digits, none of the vocabulary an entity, building or program name uses.
const ENTITY_NAME_HINTS =
  /\b(llc|l\.l\.c|inc|corp|condo|coop|co-op|associat|ltd|lp|owners|compan|congregation|apt|apartment|realty|holding|manage|partner|plaza|properties|tower|housing|college|school|church|temple|public|agreement|park|lofts|bank|authority|trust|fund|estate|residence|village|garden|heights|spires|ventures|leasing)\b/i;

function looksLikeIndividual(name: string): boolean {
  const words = name.trim().split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;
  if (ENTITY_NAME_HINTS.test(name)) return false;
  return words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w));
}

async function fetchPropertyRecords(
  supabase: ReturnType<typeof getServiceClient>,
  limit: number,
  individualsOnly: boolean,
): Promise<{ records: TraceRecord[]; error: string | null }> {
  // NYC HPD violations -- the source behind most Tier 1 properties -- are
  // filed against buildings, which are overwhelmingly LLC-owned: of the 291
  // properties eligible for tracing, only ~14 have a real individual owner.
  // A plain `.limit(limit)` before filtering would return mostly entities, so
  // when filtering to individuals the candidate pool is fetched much larger
  // and then cut down to `limit` after the name-shape filter runs.
  const poolSize = individualsOnly ? Math.min(limit * 20, 500) : limit;

  const { data, error } = await supabase
    .from('properties')
    .select('id, owner_name, address, city, state, zip')
    .is('skip_trace_status', null)
    .is('quarantined_at', null)
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
    .limit(poolSize);

  if (error) return { records: [], error: error.message };

  let rows = data ?? [];
  if (individualsOnly) {
    rows = rows.filter((row) => looksLikeIndividual(String(row.owner_name ?? '')));
  }
  rows = rows.slice(0, limit);

  const records = rows.map((row) => ({
    id: row.id as string,
    ownerName: row.owner_name as string,
    address: row.address as string,
    city: (row.city ?? null) as string | null,
    state: (row.state ?? null) as string | null,
    zip: (row.zip ?? null) as string | null,
  }));

  return { records, error: null };
}

// --- Vendor-specific mapping (DataSkip bulk API — dataskip.io/developers) ---

// isa_leads.property_address is stored as one combined string
// ("1212 AVENUE V, BROOKLYN, NY 10312"), but DataSkip requires the street
// line alone in `address` -- a combined string there will not match.
// properties.address/city/state/zip are already separate columns and pass
// through unchanged (fetchPropertyRecords never sets a null city).
function splitFullAddress(full: string): { street: string; city?: string; state?: string; zip?: string } {
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  const street = parts[0] ?? full.trim();
  const last = parts[parts.length - 1] ?? '';
  const m = last.match(/^([A-Za-z]{2})\s+(\d{5})(-\d{4})?$/);
  return { street, city: parts.length >= 3 ? parts[1] : undefined, state: m?.[1], zip: m?.[2] };
}

function buildTraceRequest(records: TraceRecord[]) {
  return {
    addresses: records.map((r) => {
      if (!r.city && r.address.includes(',')) {
        const parsed = splitFullAddress(r.address);
        return {
          address: parsed.street,
          city: parsed.city,
          state: parsed.state ?? r.state ?? undefined,
          zip: parsed.zip ?? r.zip ?? undefined,
        };
      }
      return {
        address: r.address,
        city: r.city ?? undefined,
        state: r.state ?? undefined,
        zip: r.zip ?? undefined,
      };
    }),
  };
}

// DataSkip's bulk response has no per-entry ID to echo back -- `results` is
// documented as strictly the same order and length as the request, so
// correlation here is positional only, guarded by a strict length check.
// If that guard ever fails, every record in the batch is left unresolved
// (retried later) rather than guessed at.
function parseTraceResult(
  raw: unknown,
  records: TraceRecord[],
): Map<string, { phone: string | null; email: string | null }> {
  const out = new Map<string, { phone: string | null; email: string | null }>();
  const results = (raw as { results?: unknown[] })?.results;
  if (!Array.isArray(results) || results.length !== records.length) return out;

  results.forEach((entry, i) => {
    const e = entry as { found?: boolean; phones?: Array<{ number?: string; dnc?: boolean }>; emails?: string[] } | null;
    const id = records[i]?.id;
    if (!id || !e || typeof e.found !== 'boolean') return; // malformed entry -- leave unresolved for retry

    if (!e.found) {
      // A documented, unambiguous miss -- DataSkip does not charge for these.
      out.set(id, { phone: null, email: null });
      return;
    }

    // Never surface a Do-Not-Call number as something an ISA should dial --
    // outreach here is call/email/social only. If every number on the match
    // is DNC-flagged, phone stays null even though DataSkip did find one.
    const phone = (e.phones ?? []).find((p) => !p.dnc)?.number ?? null;
    const email = (e.emails ?? [])[0] ?? null;
    out.set(id, { phone, email });
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
