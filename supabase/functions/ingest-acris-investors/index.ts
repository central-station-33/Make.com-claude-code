/**
 * ingest-acris-investors — cash-investor lead source for the isa_leads
 * `investor` segment (CLAUDE.md priority #2), built from NYC ACRIS deed
 * transfers over a consideration threshold.
 *
 * Replaces the old "ISA S4: Cash Investor Lead Ingest" Make scenario, which
 * was BROKEN: it queried ACRIS Legals (8h5j-fqxa) for `doc_type` and
 * `consideration`, fields that live on ACRIS Master (bnx9-e6tj) instead --
 * Legals only carries location (borough/block/lot/street). Buyer name is a
 * third dataset again (Parties, 636b-3b5g). All three share `document_id`,
 * but Socrata has no cross-dataset join, so a single Make HTTP module could
 * never do this -- exactly the "needs an edge function" gap the scenario's
 * own broken-run notes already called out. This does the 3-way join.
 *
 * (ingest-nyc already proves this exact Master+Legals join works, for
 * mortgage debt rather than buyer identity -- see ACRIS_MASTER/ACRIS_LEGALS
 * there. Dataset IDs here are the same, checked twice independently before
 * writing this, since getting either wrong reproduces the original bug.)
 *
 * party_type on Parties: '1' = grantor (seller), '2' = grantee (buyer).
 *
 * POST body: {
 *   dry_run?: boolean,        // resolve + preview, write nothing (default false)
 *   min_consideration?: number, // default 1_000_000
 *   days_back?: number,         // default 21
 *   limit?: number,             // default 40, max 200 (Master rows fetched)
 * }
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
  const minConsideration = Math.max(Number(body.min_consideration) || 1_000_000, 1);
  const daysBack = Math.max(Number(body.days_back) || 21, 1);
  const limit = Math.min(Math.max(Number(body.limit) || 40, 1), 200);

  const errors: string[] = [];
  const supabase = getServiceClient();

  try {
    const cutoff = new Date(Date.now() - daysBack * 86400000).toISOString();

    // --- Master: which deeds qualify, and for how much ---
    // Both `>` comparisons here 400 with query.soql.type-mismatch against this
    // dataset (confirmed live, on document_amt AND recorded_datetime in turn) --
    // whatever Socrata's underlying column typing actually is, it doesn't
    // support a numeric/date inequality in $where. Only the equality filter
    // (doc_type='DEED') is trusted; amount and recency are both filtered in JS
    // after fetching, same as ingest-nyc already does for document_amt on this
    // same dataset.
    const FETCH_LIMIT = 2000; // Socrata's practical single-request ceiling
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
    const cutoffTime = new Date(cutoff).getTime();
    const masterRows = allMasterRows
      .filter((r) => Number(r.document_amt) > minConsideration && new Date(r.recorded_datetime).getTime() > cutoffTime)
      .slice(0, limit);
    const docIds = [...new Set(masterRows.map((r) => String(r.document_id).trim()).filter(Boolean))];

    if (!docIds.length) {
      await persistDiag(supabase, { stage: 'no_deeds_in_window', min_consideration: minConsideration, days_back: daysBack });
      return json({ success: true, data: { fetched: 0, leads_built: 0, leads_posted: 0 } });
    }

    const inList = docIds.map((d) => `'${d}'`).join(',');

    // --- Parties + Legals in parallel: buyer name and street address ---
    const [partiesRes, legalsRes] = await Promise.all([
      fetch(`${ACRIS_PARTIES}?${new URLSearchParams({
        '$where': `document_id in (${inList}) AND party_type='2'`,
        '$select': 'document_id,name',
        '$limit': '2000',
      })}`, { signal: AbortSignal.timeout(25000) }),
      fetch(`${ACRIS_LEGALS}?${new URLSearchParams({
        '$where': `document_id in (${inList})`,
        '$select': 'document_id,borough,block,lot,street_number,street_name',
        '$limit': '2000',
      })}`, { signal: AbortSignal.timeout(25000) }),
    ]);

    if (!partiesRes.ok) errors.push(`ACRIS Parties ${partiesRes.status}: ${(await partiesRes.text().catch(() => '')).slice(0, 300)}`);
    if (!legalsRes.ok)  errors.push(`ACRIS Legals ${legalsRes.status}: ${(await legalsRes.text().catch(() => '')).slice(0, 300)}`);

    // First grantee/address per document_id -- a deed can list co-buyers or
    // span more than one lot; the first is a fine representative for a lead.
    const buyerByDoc = new Map<string, string>();
    if (partiesRes.ok) {
      for (const row of await partiesRes.json() as Record<string, unknown>[]) {
        const doc = String(row.document_id ?? '').trim();
        const name = String(row.name ?? '').trim();
        if (doc && name && !buyerByDoc.has(doc)) buyerByDoc.set(doc, name);
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
        const name = buyerByDoc.get(doc);
        const address = addressByDoc.get(doc);
        if (!name || !address) return null;
        return {
          document_id: doc,
          full_name: name,
          entity_name: name,
          property_address: address,
          contract_value: Number(m.document_amt) || 0,
          motivation_signals: [
            `Cash deed transfer > $${minConsideration.toLocaleString()}`,
            `Recorded ${m.recorded_datetime}`,
            `Document: ${doc}`,
            'NYC investor profile — actively deploying capital',
          ],
          raw_data: m,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    const unresolved = masterRows.length - leads.length;

    if (dryRun) {
      await persistDiag(supabase, {
        stage: 'dry_run', deeds_in_window: masterRows.length,
        leads_resolvable: leads.length, unresolved_no_buyer_or_address: unresolved,
        preview: leads.map((l) => ({ name: l.full_name, address: l.property_address, amount: l.contract_value })),
        errors,
      });
      return json({ success: true, data: {
        dry_run: true, deeds_in_window: masterRows.length,
        would_ingest: leads.length, unresolved, preview: leads.slice(0, 20),
      } });
    }

    // --- Real path: hand each resolved lead to ingest-leads (dedup/upsert lives there) ---
    let posted = 0;
    const postErrors: string[] = [...errors];
    for (const lead of leads) {
      try {
        const { document_id, ...leadBody } = lead;
        // ingest-leads has verify_jwt=true, so Supabase's runtime 401s this
        // call before it even reaches ingest-leads' own x-make-secret check
        // unless a valid Authorization bearer is present too (found live --
        // the old Make scenario's module carried an anon-key Authorization
        // header for exactly this reason, which this internal call lacked).
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ingest-leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-make-secret': MAKE_SECRET,
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`,
          },
          body: JSON.stringify({
            segment: 'investor', market: 'nyc',
            commission_source: 'inrange_generated', source_name: 'nyc_acris_deeds',
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
      stage: 'processed', deeds_in_window: masterRows.length,
      leads_built: leads.length, leads_posted: posted, unresolved, errors: postErrors,
    });

    return json({ success: true, data: {
      deeds_in_window: masterRows.length, leads_built: leads.length, leads_posted: posted,
      unresolved, errors: postErrors,
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
      property_hash: 'diagnostic_ingest_acris_investors',
      source: 'diagnostic',
      raw_data: { ran_at: new Date().toISOString(), ...data },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
