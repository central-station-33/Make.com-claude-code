import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

// NYC Open Data — HPD Building Violations (wvxf-dwi5)
const HPD_VIOLATIONS = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";

// NYC Evictions (executed eviction filings — strong distress signal)
const NYC_EVICTIONS = "https://data.cityofnewyork.us/resource/6z8x-wfk4.json";

// HPD Registration Contacts — the only free source of NYC owner names and
// mailing addresses. Joins to violations on `registrationid`.
const HPD_CONTACTS = "https://data.cityofnewyork.us/resource/feu5-w2e2.json";

// Which contact on a registration best represents the owner. A registration
// carries several rows (owner, officer, managing agent); lowest rank wins.
const CONTACT_RANK: Record<string, number> = {
  IndividualOwner: 1,
  CorporateOwner:  2,
  HeadOfficer:     3,
  Officer:         4,
  Agent:           5,
};

type Borough = "MANHATTAN" | "BROOKLYN" | "QUEENS" | "BRONX" | "STATEN ISLAND";

const BOROUGHS: Borough[] = ["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"];

// wvxf-dwi5 names the borough column `boro` (not `borough`) and the zip `zip`
// (not `postcode`). Owner name lives in the HPD *registrations* dataset, not here.
const fetchHPDViolations = async (
  borough: Borough,
  limit: number,
  errors: string[],
): Promise<Record<string, unknown>[]> => {
  try {
    const params = new URLSearchParams({
      boro: borough,
      class: "C",                  // Class C = immediately hazardous
      violationstatus: "Open",     // values are "Open" / "Close"
      "$order": "inspectiondate DESC",
      "$limit": String(limit),
      "$select": "violationid,registrationid,housenumber,streetname,zip,boro,block,lot,novdescription,inspectiondate,currentstatus",
    });

    const res = await fetch(`${HPD_VIOLATIONS}?${params}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HPD HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return await res.json() as Record<string, unknown>[];
  } catch (e) {
    const msg = `HPD fetch failed for ${borough}: ${String(e)}`;
    console.error(msg);
    errors.push(msg);
    return [];
  }
};

// 6z8x-wfk4 names the borough column `borough` and carries no respondent name.
const fetchEvictions = async (
  limit: number,
  errors: string[],
): Promise<Record<string, unknown>[]> => {
  try {
    const params = new URLSearchParams({
      residential_commercial_ind: "Residential",
      "$order": "executed_date DESC",
      "$limit": String(limit),
      "$select": "court_index_number,borough,eviction_address,eviction_zip,eviction_apt_num,executed_date,bbl",
    });

    const res = await fetch(`${NYC_EVICTIONS}?${params}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Evictions HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    return await res.json() as Record<string, unknown>[];
  } catch (e) {
    const msg = `Evictions fetch failed: ${String(e)}`;
    console.error(msg);
    errors.push(msg);
    return [];
  }
};

const LLC_RE = /\b(LLC|L\.L\.C|INC|CORP|LP|LTD|TRUST|ESTATE|HOLDING|REALTY|GROUP|PARTNER|ASSOC|MANAGEMENT|MGMT)\b/i;

type Owner = {
  name: string;
  mailing: string;
  type: string;
  state: string;
};

// Socrata omits null fields per record, so a corporate contact simply has no
// firstname/lastname and an individual has no corporationname. Read both.
const contactToOwner = (c: Record<string, unknown>): Owner => {
  const corp   = String(c.corporationname || "").trim();
  const person = [c.firstname, c.lastname]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");

  const name  = person || corp;
  const state = String(c.businessstate || "").trim().toUpperCase();

  const street = [c.businesshousenumber, c.businessstreetname]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");
  const apt = String(c.businessapartment || "").trim();

  const mailing = [
    street,
    apt ? `APT ${apt}` : "",
    String(c.businesscity || "").trim(),
    state,
    String(c.businesszip || "").trim(),
  ].filter(Boolean).join(", ");

  let type = "unknown";
  if (person && !corp)   type = "individual";
  else if (LLC_RE.test(corp)) type = "llc";
  else if (corp)         type = "corporation";

  return { name, mailing, type, state };
};

// Look up owners for the registrations we actually saw. Chunked because the
// id list goes into the query string; no $select, so a column-name change
// upstream can never 400 this request.
const fetchOwners = async (
  registrationIds: Set<string>,
  errors: string[],
): Promise<Map<string, Owner>> => {
  const owners = new Map<string, Owner>();
  const best   = new Map<string, number>();
  const ids    = [...registrationIds].filter(Boolean);
  const CHUNK  = 100;

  for (let i = 0; i < ids.length; i += CHUNK) {
    // Ids come from the API and are numeric strings; strip quotes defensively
    // since they are interpolated into a SoQL literal list.
    const list = ids.slice(i, i + CHUNK)
      .map((id) => `'${id.replace(/[^0-9]/g, "")}'`)
      .join(",");

    try {
      const params = new URLSearchParams({
        "$where": `registrationid in (${list})`,
        "$limit": "2000",
      });

      const res = await fetch(`${HPD_CONTACTS}?${params}`, {
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Contacts HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      for (const c of await res.json() as Record<string, unknown>[]) {
        const reg = String(c.registrationid || "").trim();
        if (!reg) continue;

        const rank = CONTACT_RANK[String(c.type || "")] ?? 99;
        if (rank >= (best.get(reg) ?? 99)) continue;

        const owner = contactToOwner(c);
        if (!owner.name) continue;

        best.set(reg, rank);
        owners.set(reg, owner);
      }
    } catch (e) {
      const msg = `Owner contacts fetch failed @${i}: ${String(e)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return owners;
};

const hpdToRaw = (v: Record<string, unknown>, owner?: Owner): Record<string, unknown> | null => {
  const house  = String(v.housenumber || "").trim();
  const street = String(v.streetname  || "").trim();
  if (!house || !street) return null;

  const indicators = ["code_violation"];
  // An owner registered at an out-of-state address is an absentee landlord
  if (owner?.state && owner.state !== "NY") indicators.push("out_of_state_owner");

  return {
    source:         "nyc_hpd",
    address:        `${house} ${street}`,
    city:           String(v.boro || "NEW YORK").trim(),
    state:          "NY",
    zip:            String(v.zip || "").trim(),
    property_type:  "unknown",
    distress_indicators: indicators,
    process_stage:  "code violation",
    // Owner comes from the HPD registration contacts join, not the violation
    owner_name:            owner?.name    || "",
    owner_mailing_address: owner?.mailing || "",
    owner_type:            owner?.type    || "unknown",
    owner_state:           owner?.state   || "",
    out_of_state_owner:    Boolean(owner?.state && owner.state !== "NY"),
    notice_date:    v.inspectiondate || null,
    case_number:    String(v.violationid || ""),
    violation_desc: String(v.novdescription || "").slice(0, 500),
  };
};

const evictionToRaw = (e: Record<string, unknown>): Record<string, unknown> | null => {
  const address = String(e.eviction_address || "").trim();
  if (!address) return null;

  return {
    source:         "nyc_evictions",
    address,
    city:           String(e.borough || "NEW YORK").trim(),
    state:          "NY",
    zip:            String(e.eviction_zip || "").trim(),
    property_type:  "unknown",
    // An executed eviction means the unit was repossessed — likely vacant now
    distress_indicators: ["eviction", "vacant"],
    process_stage:  "eviction",
    notice_date:    e.executed_date || null,
    owner_name:     "",
    owner_type:     "unknown",
    case_number:    String(e.court_index_number || ""),
  };
};

const hashRecord = async (source: string, address: string, zip: string): Promise<string> => {
  const key = `${source}|${address.toUpperCase().trim()}|${zip.trim()}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Upsert in chunks with ON CONFLICT DO NOTHING. Returns the number actually
// inserted — far fewer round trips than a select-then-insert per record.
const insertBatch = async (
  supabase: ReturnType<typeof createClient>,
  rows: { source: string; raw_data: Record<string, unknown>; property_hash: string }[],
  errors: string[],
): Promise<number> => {
  let inserted = 0;
  const CHUNK = 200;

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from("raw_properties")
      .upsert(chunk, { onConflict: "property_hash", ignoreDuplicates: true })
      .select("id");

    if (error) errors.push(`insert batch @${i}: ${error.message}`);
    else inserted += (data?.length ?? 0);
  }

  return inserted;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const perBorough    = Math.min(Number(body.per_borough    || 100), 500);
    const evictionLimit = Math.min(Number(body.eviction_limit || 200), 500);

    const results = {
      fetched: 0, inserted: 0, duplicates: 0, owners_resolved: 0,
      by_source: { hpd: 0, evictions: 0 } as Record<string, number>,
      errors: [] as string[],
    };

    // A single INSERT cannot touch the same conflict key twice, and one building
    // routinely has many open violations — so dedupe by hash before writing.
    const seen = new Set<string>();
    const hpdRows: { source: string; raw_data: Record<string, unknown>; property_hash: string }[] = [];
    const eviRows: typeof hpdRows = [];

    // Pass 1: collect violations so we know which registrations to look up
    const violations: Record<string, unknown>[] = [];
    for (const borough of BOROUGHS) {
      violations.push(...await fetchHPDViolations(borough, perBorough, results.errors));
    }

    // Pass 2: resolve owners once per registration, not once per violation
    const regIds = new Set(
      violations.map((v) => String(v.registrationid || "").trim()).filter(Boolean)
    );
    const owners = await fetchOwners(regIds, results.errors);
    results.owners_resolved = owners.size;

    for (const v of violations) {
      results.fetched++;
      const owner   = owners.get(String(v.registrationid || "").trim());
      const rawData = hpdToRaw(v, owner);
      if (!rawData) continue;

      const hash = await hashRecord("nyc_hpd", String(rawData.address), String(rawData.zip || ""));
      if (seen.has(hash)) { results.duplicates++; continue; }
      seen.add(hash);

      hpdRows.push({ source: "nyc_hpd", raw_data: rawData, property_hash: hash });
    }

    const evictions = await fetchEvictions(evictionLimit, results.errors);
    for (const e of evictions) {
      results.fetched++;
      const rawData = evictionToRaw(e);
      if (!rawData) continue;

      const hash = await hashRecord("nyc_evictions", String(rawData.address), String(rawData.zip || ""));
      if (seen.has(hash)) { results.duplicates++; continue; }
      seen.add(hash);

      eviRows.push({ source: "nyc_evictions", raw_data: rawData, property_hash: hash });
    }

    results.by_source.hpd       = await insertBatch(supabase, hpdRows, results.errors);
    results.by_source.evictions = await insertBatch(supabase, eviRows, results.errors);
    results.inserted = results.by_source.hpd + results.by_source.evictions;
    // Rows already present from an earlier run are skipped by ON CONFLICT
    results.duplicates += (hpdRows.length + eviRows.length) - results.inserted;

    return ok(
      results,
      `NYC ingestion complete: ${results.inserted} new, ${results.duplicates} already seen`
    );
  } catch (e) {
    console.error("ingest-nyc error:", e);
    return err((e as Error).message);
  }
});
