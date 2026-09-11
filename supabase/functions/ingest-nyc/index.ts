import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

const MAKE_SECRET = Deno.env.get("MAKE_WEBHOOK_SECRET") ?? "";

// NYC Open Data — HPD Building Violations (wvxf-dwi5)
const HPD_VIOLATIONS = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";

// NYC Evictions (executed eviction filings — strong distress signal)
const NYC_EVICTIONS = "https://data.cityofnewyork.us/resource/6z8x-wfk4.json";

// HPD Registration Contacts — the only free source of NYC owner names and
// mailing addresses. Joins to violations on `registrationid`.
const HPD_CONTACTS = "https://data.cityofnewyork.us/resource/feu5-w2e2.json";

// Parcel-level enrichment, all keyed by BBL. PLUTO supplies building
// characteristics, DOF supplies a market valuation, and ACRIS supplies
// recorded mortgage debt — the three inputs deal-quality scoring needs and
// that the violation feed alone cannot provide.
const PLUTO        = "https://data.cityofnewyork.us/resource/64uk-42ks.json";
const DOF_VALUATION = "https://data.cityofnewyork.us/resource/yjxr-fw8i.json";
const ACRIS_LEGALS = "https://data.cityofnewyork.us/resource/8h5j-fqxa.json";
const ACRIS_MASTER = "https://data.cityofnewyork.us/resource/bnx9-e6tj.json";

// BBL = borough(1) + block(5, zero-padded) + lot(4, zero-padded)
const toBBL = (boroid: unknown, block: unknown, lot: unknown): string => {
  const b = String(boroid || "").trim();
  const bl = String(block || "").trim();
  const lt = String(lot || "").trim();
  if (!b || !bl || !lt) return "";
  return `${b}${bl.padStart(5, "0")}${lt.padStart(4, "0")}`;
};

// PLUTO reports residential unit counts; map them onto the property types the
// scoring engine recognises. NYC violation records carry no type of their own.
//
// "D4" = elevator apartment co-op in NYC DOF's building classification --
// verified empirically against two undisputed NYC co-ops (The Majestic at
// 115 CPW and San Remo at 145 CPW, owner "SAN REMO TENANTS CORP" -- the
// classic co-op legal-entity naming pattern), both bldgclass D4. Checked
// before the unitsRes bucketing below, since a co-op tower would otherwise
// fall into the generic 5+-unit "apartment" bucket alongside rental
// buildings, which is exactly the institutional-owner noise this
// distinction exists to avoid.
const unitsToPropertyType = (unitsRes: number, bldgClass: string): string => {
  const cls = bldgClass.trim().toUpperCase();
  if (cls === "D4") return "coop";
  if (cls.startsWith("R")) return "condo";
  if (unitsRes === 1) return "single_family";
  if (unitsRes === 2) return "duplex";
  if (unitsRes === 3) return "triplex";
  if (unitsRes === 4) return "fourplex";
  if (unitsRes >= 5)  return "apartment";
  return "unknown";
};

type Parcel = {
  property_type?: string;
  year_built?: number | null;
  square_footage?: number | null;
  units_res?: number | null;
  assessed_value?: number | null;
  estimated_arv?: number | null;
  amount_owed?: number | null;
};

// Socrata treats a numeric column and a text column differently in a SoQL
// literal list, and BBL is typed inconsistently across these datasets. Try
// unquoted first, fall back to quoted, and surface the failure rather than
// silently returning nothing.
const soqlIn = async (
  base: string,
  field: string,
  values: string[],
  label: string,
  diagnostics: Record<string, unknown>,
): Promise<Record<string, unknown>[]> => {
  for (const quoted of [false, true]) {
    const list = values.map((v) => (quoted ? `'${v}'` : v)).join(",");
    const url = `${base}?${new URLSearchParams({
      "$where": `${field} in (${list})`,
      "$limit": "2000",
    })}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (res.ok) {
        diagnostics[`${label}_quoted`] = quoted;
        return await res.json() as Record<string, unknown>[];
      }
      const body = await res.text().catch(() => "");
      diagnostics[`${label}_error_${quoted ? "quoted" : "numeric"}`] =
        `HTTP ${res.status}: ${body.slice(0, 200)}`;
    } catch (e) {
      diagnostics[`${label}_exception`] = String(e);
      return [];
    }
  }
  return [];
};

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
};

// One unfiltered record per dataset, recorded so a column rename upstream is
// visible in the run output instead of silently zeroing out enrichment.
const probeSchema = async (
  label: string,
  base: string,
  diagnostics: Record<string, unknown>,
): Promise<void> => {
  try {
    const res = await fetch(`${base}?$limit=1`, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      diagnostics[`${label}_schema_error`] = `HTTP ${res.status}`;
      return;
    }
    const rows = await res.json() as Record<string, unknown>[];
    diagnostics[`${label}_fields`] = rows[0] ? Object.keys(rows[0]) : [];
  } catch (e) {
    diagnostics[`${label}_schema_exception`] = String(e);
  }
};

const fetchParcelData = async (
  bbls: Set<string>,
  diagnostics: Record<string, unknown>,
  errors: string[],
): Promise<Map<string, Parcel>> => {
  const parcels = new Map<string, Parcel>();
  const ids = [...bbls].filter(Boolean);
  if (!ids.length) return parcels;

  const upsert = (bbl: string, patch: Parcel) => {
    parcels.set(bbl, { ...(parcels.get(bbl) ?? {}), ...patch });
  };

  const CHUNK = 100;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);

    // --- PLUTO: building characteristics ---
    try {
      for (const row of await soqlIn(PLUTO, "bbl", chunk, "pluto", diagnostics)) {
        const bbl = String(row.bbl || "").split(".")[0];
        if (!bbl) continue;
        const unitsRes = Number(row.unitsres || 0);
        upsert(bbl, {
          property_type:  unitsToPropertyType(unitsRes, String(row.bldgclass || "")),
          units_res:      unitsRes || null,
          year_built:     num(row.yearbuilt),
          square_footage: num(row.bldgarea),
          assessed_value: num(row.assesstot),
        });
      }
    } catch (e) { errors.push(`PLUTO @${i}: ${String(e)}`); }

    // --- DOF: full market valuation (a real DOF estimate, not assessed value) ---
    try {
      for (const row of await soqlIn(DOF_VALUATION, "bble", chunk, "dof", diagnostics)) {
        const bbl = String(row.bble || row.bbl || "").split(".")[0];
        if (!bbl) continue;
        upsert(bbl, { estimated_arv: num(row.fullval) });
      }
    } catch (e) { errors.push(`DOF @${i}: ${String(e)}`); }
  }

  return parcels;
};

// Longest common mortgage term; past this a recorded mortgage is assumed repaid
const MORTGAGE_MAX_AGE_YEARS = 30;

// ACRIS is a two-hop join: legals maps BBL to document ids, master carries the
// document type and amount. Only recorded mortgages count toward debt.
//
// Caveat worth keeping in mind when reading amount_owed: this is the ORIGINAL
// RECORDED PRINCIPAL, not a current balance. ACRIS records satisfactions as
// separate documents that are not linked back here, so a repaid mortgage still
// appears. Treat the figure as an upper bound on debt — it understates equity,
// which is the safe direction for scoring, but it is not a payoff amount.
const fetchMortgages = async (
  lots: { bbl: string; boroid: string; block: string; lot: string }[],
  diagnostics: Record<string, unknown>,
  errors: string[],
): Promise<Map<string, number>> => {
  const debt = new Map<string, number>();
  if (!lots.length) return debt;

  const CHUNK = 40;
  for (let i = 0; i < lots.length; i += CHUNK) {
    const chunk = lots.slice(i, i + CHUNK);
    try {
      const clauses = chunk
        .map((l) => `(borough=${l.boroid} AND block=${l.block} AND lot=${l.lot})`)
        .join(" OR ");

      const legalsRes = await fetch(`${ACRIS_LEGALS}?${new URLSearchParams({
        "$where": clauses,
        "$limit": "2000",
      })}`, { signal: AbortSignal.timeout(25000) });

      if (!legalsRes.ok) {
        diagnostics.acris_legals_error = `HTTP ${legalsRes.status}: ${(await legalsRes.text().catch(() => "")).slice(0, 200)}`;
        continue;
      }

      const legals = await legalsRes.json() as Record<string, unknown>[];

      // A document covering more than one lot is a blanket mortgage over a
      // portfolio. Its face amount belongs to no single lot, so attributing it
      // to each one inflates debt several-fold — drop those entirely.
      const docLots = new Map<string, Set<string>>();
      for (const l of legals) {
        const bbl = toBBL(l.borough, l.block, l.lot);
        const doc = String(l.document_id || "").trim();
        if (!bbl || !doc) continue;
        if (!docLots.has(doc)) docLots.set(doc, new Set());
        docLots.get(doc)!.add(bbl);
      }

      const docToBBL = new Map<string, string>();
      let blanket = 0;
      for (const [doc, bbls] of docLots) {
        if (bbls.size > 1) { blanket++; continue; }
        docToBBL.set(doc, [...bbls][0]);
      }
      diagnostics.acris_blanket_skipped =
        Number(diagnostics.acris_blanket_skipped ?? 0) + blanket;

      if (!docToBBL.size) continue;

      const docIds = [...docToBBL.keys()].slice(0, 500);
      const masterRes = await fetch(`${ACRIS_MASTER}?${new URLSearchParams({
        "$where": `document_id in (${docIds.map((d) => `'${d}'`).join(",")}) AND doc_type='MTGE'`,
        "$limit": "2000",
      })}`, { signal: AbortSignal.timeout(25000) });

      if (!masterRes.ok) {
        diagnostics.acris_master_error = `HTTP ${masterRes.status}: ${(await masterRes.text().catch(() => "")).slice(0, 200)}`;
        continue;
      }

      // ACRIS never retires a mortgage record, so an old one is probably long
      // repaid. Past a full 30-year term the figure is worse than no figure.
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - MORTGAGE_MAX_AGE_YEARS);
      const cutoffISO = cutoff.toISOString();

      // Most recent qualifying mortgage per lot is the best available figure
      const newest = new Map<string, { amt: number; when: string }>();
      let stale = 0;
      for (const m of await masterRes.json() as Record<string, unknown>[]) {
        const bbl = docToBBL.get(String(m.document_id || "").trim());
        const amt = Number(m.document_amt || 0);
        if (!bbl || !(amt > 0)) continue;

        const when = String(m.recorded_datetime || m.document_date || "");
        if (!when || when < cutoffISO) { stale++; continue; }

        const cur = newest.get(bbl);
        if (!cur || when > cur.when) newest.set(bbl, { amt, when });
      }
      diagnostics.acris_stale_skipped =
        Number(diagnostics.acris_stale_skipped ?? 0) + stale;

      for (const [bbl, v] of newest) debt.set(bbl, v.amt);
    } catch (e) {
      errors.push(`ACRIS @${i}: ${String(e)}`);
    }
  }

  return debt;
};

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
      "$select": "violationid,registrationid,housenumber,streetname,zip,boro,boroid,block,lot,novdescription,inspectiondate,currentstatus",
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

const hpdToRaw = (
  v: Record<string, unknown>,
  owner?: Owner,
  parcel?: Parcel,
): Record<string, unknown> | null => {
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
    bbl:            toBBL(v.boroid, v.block, v.lot),
    // Parcel data comes from the PLUTO / DOF / ACRIS joins; the violation feed
    // itself carries none of it
    property_type:  parcel?.property_type  || "unknown",
    year_built:     parcel?.year_built     ?? null,
    square_footage: parcel?.square_footage ?? null,
    assessed_value: parcel?.assessed_value ?? null,
    estimated_arv:  parcel?.estimated_arv  ?? null,
    amount_owed:    parcel?.amount_owed    ?? null,
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
  if (!MAKE_SECRET) return err("Server misconfigured", 500);
  if (req.headers.get("x-make-secret") !== MAKE_SECRET) return err("Unauthorized", 401);

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
      parcels_resolved: 0, mortgages_resolved: 0,
      by_source: { hpd: 0, evictions: 0 } as Record<string, number>,
      diagnostics: {} as Record<string, unknown>,
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

    // Pass 3: parcel data, resolved once per BBL rather than per violation
    const diagnostics: Record<string, unknown> = {};
    await Promise.all([
      probeSchema("pluto",  PLUTO,        diagnostics),
      probeSchema("dof",    DOF_VALUATION, diagnostics),
      probeSchema("legals", ACRIS_LEGALS, diagnostics),
      probeSchema("master", ACRIS_MASTER, diagnostics),
    ]);

    const lots = new Map<string, { bbl: string; boroid: string; block: string; lot: string }>();
    for (const v of violations) {
      const bbl = toBBL(v.boroid, v.block, v.lot);
      if (bbl && !lots.has(bbl)) {
        lots.set(bbl, {
          bbl,
          boroid: String(v.boroid).trim(),
          block:  String(v.block).trim(),
          lot:    String(v.lot).trim(),
        });
      }
    }

    const parcels = await fetchParcelData(new Set(lots.keys()), diagnostics, results.errors);
    const debt    = await fetchMortgages([...lots.values()], diagnostics, results.errors);
    for (const [bbl, amt] of debt) {
      parcels.set(bbl, { ...(parcels.get(bbl) ?? {}), amount_owed: amt });
    }

    results.parcels_resolved   = parcels.size;
    results.mortgages_resolved = debt.size;
    results.diagnostics        = diagnostics;

    for (const v of violations) {
      results.fetched++;
      const owner   = owners.get(String(v.registrationid || "").trim());
      const parcel  = parcels.get(toBBL(v.boroid, v.block, v.lot));
      const rawData = hpdToRaw(v, owner, parcel);
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

    // The Make caller discards the response body, so persist the run summary.
    // Without this a failed parcel join is invisible outside the HTTP reply.
    await supabase.from("raw_properties").upsert({
      property_hash: "diagnostic_ingest_nyc",
      source:        "diagnostic",
      raw_data:      { ran_at: new Date().toISOString(), ...results },
      processed_at:  new Date().toISOString(),
    }, { onConflict: "property_hash" });

    return ok(
      results,
      `NYC ingestion complete: ${results.inserted} new, ${results.duplicates} already seen`
    );
  } catch (e) {
    console.error("ingest-nyc error:", e);
    return err((e as Error).message);
  }
});
