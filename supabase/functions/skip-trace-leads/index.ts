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
 * POST body: { table?: 'isa_leads'|'properties', segment?: string, limit?: number }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { segmentTiers, unrankedSegmentFilter } from '../_shared/segment-priority.ts';

const MAKE_SECRET         = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const BATCHDATA_API_KEY   = Deno.env.get('BATCHDATA_API_KEY') ?? '';
const BATCHDATA_ENDPOINT  = 'https://api.batchdata.com/api/v1/property/skip-trace';

// BatchData's bulk skip-trace accepts a batch of requests in one call —
// capped at 100 per published limits. Default is deliberately small so a
// first real run (while confirming the field mapping above) costs little.
const MAX_BATCH = 100;

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
  const segment = table === 'isa_leads' && body.segment ? String(body.segment) : null;
  const limit   = Math.min(Math.max(Number(body.limit) || 25, 1), MAX_BATCH);

  const supabase = getServiceClient();

  const { records, error: fetchError } = table === 'properties'
    ? await fetchPropertyRecords(supabase, limit)
    : await fetchIsaLeadRecords(supabase, segment, limit);

  if (fetchError) {
    await persistDiag(supabase, table, { stage: 'query_records', error: fetchError });
    return json({ success: false, error: fetchError }, 500);
  }
  if (!records.length) {
    await persistDiag(supabase, table, { stage: 'no_records_to_trace', segment });
    return json({ success: true, data: { attempted: 0, matched: 0 } });
  }

  let rawResponse: unknown = null;
  let matched = 0;
  let noMatch = 0;
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

        if (hit && (hit.phone || hit.email)) {
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
    requested: records.length, matched, no_match: noMatch, errors,
    // Raw upstream body, for confirming/correcting the field mapping above.
    raw_response_sample: rawResponse,
  });

  return json({ success: true, data: { attempted: records.length, matched, no_match: noMatch, errors } });
});

async function fetchIsaLeadRecords(
  supabase: ReturnType<typeof getServiceClient>,
  segment: string | null,
  limit: number,
): Promise<{ records: TraceRecord[]; error: string | null }> {
  const untraced = (max: number) => supabase
    .from('isa_leads')
    .select('id, full_name, entity_name, property_address')
    .is('skip_trace_status', null)
    .is('phone', null)
    .is('email', null)
    .not('property_address', 'is', null)
    .neq('property_address', '')
    .order('created_at', { ascending: false })
    .limit(max);

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
    .order('assessed_value', { ascending: false, nullsFirst: false })
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

  results.forEach((entry, i) => {
    const e = entry as Record<string, unknown>;
    const requestId = (e.requestId as string) ?? records[i]?.id;
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
