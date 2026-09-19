/**
 * ingest-acris-life-event — divorce/estate lead source for the isa_leads
 * `divorce` segment. Signal: a NYC ACRIS DEED with >=2 grantors (joint
 * owners) transferring to a single grantee, recorded at NOMINAL
 * consideration (below max_consideration, default $10,000) — the
 * fingerprint of an interspousal divorce deed or estate consolidation.
 *
 * Uses the same 3-way ACRIS join (Master+Parties+Legals via document_id)
 * proven in ingest-acris-investors.
 *
 * POST body: { dry_run?: boolean, max_consideration?: number (default 10000),
 *   days_back?: number (default 21), limit?: number (default 40, max 200) }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET  = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

const ACRIS_MASTER  = 'https://data.cityofnewyork.us/resource/bnx9-e6tj.json';
const ACRIS_PARTIES = 'https://data.cityofnewyork.us/resource/636b-3b5g.json';
const ACRIS_LEGALS  = 'https://data.cityofnewyork.us/resource/8h5j-fqxa.json';

const BOROUGH_NAMES: Record<string, string> = {
  '1': 'Manhattan', '2': 'Bronx', '3': 'Brooklyn', '4': 'Queens', '5': 'Staten Island',
};

interface MasterRow { document_id: string; document_amt: number; recorded_datetime: string }

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const dryRun = body.dry_run === true;
  const maxConsideration = Math.max(Number(body.max_consideration) || 10_000, 0);
  const daysBack = Math.max(Number(body.days_back) || 21, 1);
  const limit = Math.min(Math.max(Number(body.limit) || 40, 1), 200);

  const errors: string[] = [];
  const supabase = getServiceClient();

  try {
    const cutoffTime = Date.now() - daysBack * 86400000;

    const FETCH_LIMIT = 2000;
    const masterUrl = `${ACRIS_MASTER}?${new URLSearchParams({
      '$where': `doc_type='DEED'`,
      '$select': 'document_id,document_amt,recorded_datetime',
      '$order': 'recorded_datetime DESC',
      '$limit': String(FETCH_LIMIT),
    })}`;

    const masterRes = await fetch(masterUrl, { signal: AbortSignal.timeout(25000) });
    if (!masterRes.ok) {
      const detail = `ACRIS Master ${masterRes.status}: ${(await masterRes.text().catch(() => '')).slice(0, 300)}`;
      await persistDiag(supabase, { stage: 'master_fetch', error: detail });
      return json({ success: false, error: detail }, 502);
    }

    const allMasterRows = await masterRes.json() as MasterRow[];
    const masterRows = allMasterRows
      .filter((r) => Number(r.document_amt) <= maxConsideration && new Date(r.recorded_datetime).getTime() > cutoffTime)
      .slice(0, limit * 4);
    const docIds = [...new Set(masterRows.map((r) => String(r.document_id).trim()).filter(Boolean))];

    if (!docIds.length) {
      await persistDiag(supabase, { stage: 'no_nominal_deeds_in_window', max_consideration: maxConsideration, days_back: daysBack });
      return json({ success: true, data: { fetched: 0, leads_built: 0, leads_posted: 0 } });
    }

    const inList = docIds.map((d) => `'${d}'`).join(',');

    const [partiesRes, legalsRes] = await Promise.all([
      fetch(`${ACRIS_PARTIES}?${new URLSearchParams({
        '$where': `document_id in (${inList})`,
        '$select': 'document_id,party_type,name',
        '$limit': '4000',
      })}`, { signal: AbortSignal.timeout(25000) }),
      fetch(`${ACRIS_LEGALS}?${new URLSearchParams({
        '$where': `document_id in (${inList})`,
        '$select': 'document_id,borough,block,lot,street_number,street_name',
        '$limit': '2000',
      })}`, { signal: AbortSignal.timeout(25000) }),
    ]);

    if (!partiesRes.ok) errors.push(`ACRIS Parties ${partiesRes.status}: ${(await partiesRes.text().catch(() => '')).slice(0, 300)}`);
    if (!legalsRes.ok)  errors.push(`ACRIS Legals ${legalsRes.status}: ${(await legalsRes.text().catch(() => '')).slice(0, 300)}`);

    const grantorsByDoc = new Map<string, string[]>();
    const granteesByDoc = new Map<string, string[]>();
    if (partiesRes.ok) {
      for (const row of await partiesRes.json() as Record<string, unknown>[]) {
        const doc = String(row.document_id ?? '').trim();
        const name = String(row.name ?? '').trim();
        const type = String(row.party_type ?? '').trim();
        if (!doc || !name) continue;
        const map = type === '1' ? grantorsByDoc : type === '2' ? granteesByDoc : null;
        if (!map) continue;
        const arr = map.get(doc) ?? [];
        arr.push(name);
        map.set(doc, arr);
      }
    }

    const addressByDoc = new Map<string, string>();
    if (legalsRes.ok) {
      for (const row of await legalsRes.json() as Record<string, unknown>[]) {
        const doc = String(row.document_id ?? '').trim();
        if (!doc || addressByDoc.has(doc)) continue;
        const streetNum = String(row.street_number ?? '').trim();
        const streetName = String(row.street_name ?? '').trim();
        const borough = BOROUGH_NAMES[String(row.borough ?? '').trim()] ?? '';
        if (!streetNum || !streetName) continue;
        addressByDoc.set(doc, [`${streetNum} ${streetName}`, borough, 'NY'].filter(Boolean).join(', '));
      }
    }

    const leads = masterRows
      .map((m) => {
        const doc = String(m.document_id).trim();
        const grantors = grantorsByDoc.get(doc) ?? [];
        const grantees = granteesByDoc.get(doc) ?? [];
        const address = addressByDoc.get(doc);
        if (grantors.length < 2 || grantees.length !== 1 || !address) return null;
        return {
          document_id: doc,
          full_name: grantees[0],
          entity_name: grantees[0],
          property_address: address,
          contract_value: Number(m.document_amt) || 0,
          motivation_signals: [
            `Joint-to-single deed transfer at nominal consideration ($${Number(m.document_amt) || 0})`,
            `${grantors.length} prior joint owners (${grantors.join(' & ')}) → sole owner`,
            `Recorded ${m.recorded_datetime}`,
            'Consistent with divorce settlement or estate consolidation',
          ],
          raw_data: m,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)
      .slice(0, limit);

    if (dryRun) {
      await persistDiag(supabase, {
        stage: 'dry_run', nominal_deeds_in_window: masterRows.length,
        leads_resolvable: leads.length,
        preview: leads.map((l) => ({ name: l.full_name, address: l.property_address, amount: l.contract_value })),
        errors,
      });
      return json({ success: true, data: {
        dry_run: true, nominal_deeds_in_window: masterRows.length,
        would_ingest: leads.length, preview: leads.slice(0, 20),
      } });
    }

    let posted = 0;
    const postErrors: string[] = [...errors];
    for (const lead of leads) {
      try {
        const { document_id, ...leadBody } = lead;
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ingest-leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-make-secret': MAKE_SECRET,
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`,
          },
          body: JSON.stringify({
            segment: 'divorce', market: 'nyc',
            commission_source: 'inrange_generated', source_name: 'nyc_acris_joint_to_single',
            ...leadBody,
          }),
        });
        if (!res.ok) { postErrors.push(`${document_id}: ingest-leads ${res.status}`); continue; }
        const payload = await res.json().catch(() => null) as { success?: boolean; data?: { upserted?: number } } | null;
        if (payload?.success && (payload.data?.upserted ?? 0) > 0) posted++;
        else postErrors.push(`${document_id}: ingest-leads reported no upsert`);
      } catch (e) {
        postErrors.push(`${lead.document_id}: ${(e as Error).message}`);
      }
    }

    await persistDiag(supabase, {
      stage: 'processed', nominal_deeds_in_window: masterRows.length,
      leads_built: leads.length, leads_posted: posted, errors: postErrors,
    });

    return json({ success: true, data: {
      nominal_deeds_in_window: masterRows.length, leads_built: leads.length, leads_posted: posted,
      errors: postErrors,
    } });
  } catch (e) {
    const msg = (e as Error).message;
    await persistDiag(supabase, { stage: 'exception', error: msg });
    return json({ success: false, error: msg }, 500);
  }
});

async function persistDiag(supabase: ReturnType<typeof getServiceClient>, data: Record<string, unknown>) {
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: 'diagnostic_ingest_acris_life_event',
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
