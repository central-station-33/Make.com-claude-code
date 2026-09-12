/**
 * ingest-nj-developer-leads — the NJ half of the "developer" ISA segment.
 * The Make scenario "ISA S7: Developer Leads" was named "(NYC DOB + NJ
 * Building Permits)" but only ever implemented the NYC half (a direct
 * NYC DOB fetch inside the Make blueprint) -- NJ was never built. This
 * fills that gap.
 *
 * Source: NJ's statewide Construction Permit Data (NJOIT Open Data
 * Center / Socrata, dataset w9se-dmra) -- NJ has no single centralized
 * permit portal like NYC's DOB; this is the closest statewide equivalent,
 * aggregating municipal permit filings.
 *
 * IMPORTANT: this dataset's exact field names could not be verified live
 * from this environment (outbound access to data.nj.gov is blocked, same
 * restriction hit with BatchData earlier this project). Rather than guess
 * a server-side $where clause -- which fails SILENTLY (wrong field name in
 * $where either 400s or just returns zero rows) -- this fetches a broad,
 * unfiltered recent batch and does all matching client-side against a list
 * of plausible field-name candidates per concept (date/cost/type/etc.),
 * so a wrong guess degrades to "matches nothing" for that ONE concept
 * rather than "matches nothing at all". Every run persists the raw
 * response sample into raw_properties (diagnostic_ingest_nj_developer_leads)
 * -- read that after the first real run and correct FIELD_CANDIDATES below
 * against what NJ's API actually returns, the same pattern used for
 * ingest-nyc's field-name fixes and skip-trace-leads' vendor mapping.
 *
 * Filters to match the NYC half's bar: new construction, $1M+ estimated
 * cost, filed in the last 21 days.
 *
 * POST body: { limit?: number, min_cost?: number, days_back?: number }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const NJ_PERMITS_DATASET = 'https://data.nj.gov/resource/w9se-dmra.json';

const MIN_COST_DEFAULT = 1_000_000;
const DAYS_BACK_DEFAULT = 21;

// Best-effort candidate field names per concept -- unverified, see header.
// pick() below tries each in order and uses the first that's present.
const FIELD_CANDIDATES = {
  date: ['date_issued', 'issued_date', 'filing_date', 'permit_date', 'application_date', 'date_filed'],
  cost: ['estimated_cost', 'estimated_job_costs', 'construction_cost', 'total_cost', 'job_value', 'cost'],
  type: ['permit_type', 'type_of_permit', 'work_type', 'class_of_work', 'permit_class', 'type'],
  municipality: ['municipality', 'muni', 'town', 'city', 'municipality_name'],
  county: ['county', 'county_name'],
  owner: ['owner_name', 'applicant_name', 'owner', 'applicant', 'business_name'],
  address: ['address', 'street_address', 'location', 'site_address', 'property_address'],
  permitNumber: ['permit_number', 'permit_no', 'permit_id', 'application_number'],
  units: ['number_of_units', 'units', 'unit_count', 'dwelling_units'],
};

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
}

// New-construction signal, checked loosely against whatever the type field
// actually holds -- exact enum values are as unverified as the field name.
const NEW_CONSTRUCTION_HINTS = ['new', 'nb', 'new building', 'new construction'];

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const limit    = Math.min(Number(body.limit) || 1000, 5000);
  const minCost  = Number(body.min_cost) || MIN_COST_DEFAULT;
  const daysBack = Number(body.days_back) || DAYS_BACK_DEFAULT;

  const supabase = getServiceClient();
  const errors: string[] = [];
  let rawSample: unknown = null;

  try {
    // No server-side $where: a wrong guessed field name there 400s or
    // silently zeroes the whole request. $order=:id is Socrata's always-safe
    // default sort, present on every dataset regardless of schema.
    const params = new URLSearchParams({ '$limit': String(limit), '$order': ':id DESC' });
    const res = await fetch(`${NJ_PERMITS_DATASET}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      return json({ success: false, error: `NJ dataset HTTP ${res.status}: ${bodyText.slice(0, 300)}` }, 502);
    }

    const rows = await res.json() as Record<string, unknown>[];
    rawSample = rows.slice(0, 3);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const qualifying = rows.filter((row) => {
      const cost = Number(pick(row, FIELD_CANDIDATES.cost) ?? 0);
      if (!(cost >= minCost)) return false;

      const type = String(pick(row, FIELD_CANDIDATES.type) ?? '').toLowerCase();
      if (type && !NEW_CONSTRUCTION_HINTS.some((hint) => type.includes(hint))) return false;

      const dateVal = pick(row, FIELD_CANDIDATES.date);
      if (dateVal) {
        const d = new Date(String(dateVal));
        if (!isNaN(d.getTime()) && d < cutoff) return false;
      }

      return true;
    });

    const results = { fetched: rows.length, qualifying: qualifying.length, upserted: 0, deduped: 0 };

    for (const row of qualifying) {
      const owner   = String(pick(row, FIELD_CANDIDATES.owner) ?? 'Unknown Owner');
      const address = String(pick(row, FIELD_CANDIDATES.address) ?? '');
      const muni    = String(pick(row, FIELD_CANDIDATES.municipality) ?? '');
      const county  = String(pick(row, FIELD_CANDIDATES.county) ?? '');
      const cost    = Number(pick(row, FIELD_CANDIDATES.cost) ?? 0);
      const permit  = String(pick(row, FIELD_CANDIDATES.permitNumber) ?? '');
      const units   = pick(row, FIELD_CANDIDATES.units);
      const dateVal = pick(row, FIELD_CANDIDATES.date);

      const fullAddress = [address, muni, county && `${county} County`, 'NJ'].filter(Boolean).join(', ');

      try {
        // Same dedupe rule as ingest-leads: one active lead per person per
        // segment/market, keyed on the identifier we actually have.
        const { data: existing } = await supabase
          .from('isa_leads')
          .select('id')
          .eq('segment', 'developer')
          .eq('market', 'nj')
          .eq('full_name', owner)
          .not('outreach_status', 'in', '("dead","closed")')
          .maybeSingle();

        const motivationSignals = [
          'NJ construction permit filing',
          type_or_unknown(row),
          cost ? `Est cost: $${cost.toLocaleString()}` : 'Est cost: unknown (field not confirmed)',
          dateVal ? `Filed: ${dateVal}` : undefined,
          units ? `Units: ${units}` : undefined,
        ].filter(Boolean) as string[];

        if (existing) {
          const { error } = await supabase.from('isa_leads').update({
            raw_data: row,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
          if (error) throw new Error(error.message);
          results.deduped++;
        } else {
          const { error } = await supabase.from('isa_leads').insert({
            segment: 'developer',
            market: 'nj',
            commission_source: 'inrange_generated',
            routing: 'new',
            outreach_status: 'new',
            full_name: owner,
            entity_name: owner,
            property_address: fullAddress || address,
            permit_number: permit,
            contract_value: cost || null,
            source_name: 'nj_construction_permits',
            motivation_signals: motivationSignals,
            raw_data: row,
          });
          if (error) throw new Error(error.message);
          results.upserted++;
        }
      } catch (e) {
        errors.push(`${owner || 'unknown'}: ${(e as Error).message}`);
      }
    }

    await persistDiag(supabase, {
      stage: 'processed', ...results, errors,
      field_candidates_used: FIELD_CANDIDATES,
      raw_response_sample: rawSample,
    });

    return json({ success: true, data: { ...results, errors } });
  } catch (e) {
    await persistDiag(supabase, { stage: 'fetch_failed', error: (e as Error).message, raw_response_sample: rawSample });
    return json({ success: false, error: (e as Error).message }, 500);
  }
});

function type_or_unknown(row: Record<string, unknown>): string {
  const type = pick(row, FIELD_CANDIDATES.type);
  return type ? `Type: ${type}` : 'Type: unknown (field not confirmed)';
}

async function persistDiag(supabase: ReturnType<typeof getServiceClient>, data: Record<string, unknown>) {
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: 'diagnostic_ingest_nj_developer_leads',
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
