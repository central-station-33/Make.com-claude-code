import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

const MAKE_SECRET = Deno.env.get("MAKE_WEBHOOK_SECRET") ?? "";

const NJOGIS = "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_MODIV_NJ_WM/FeatureServer/0/query";

// High-distress NJ municipalities
const DEFAULT_TARGETS = [
  { munname: "NEWARK",      county: "ESSEX" },
  { munname: "JERSEY CITY", county: "HUDSON" },
  { munname: "CAMDEN",      county: "CAMDEN" },
  { munname: "PATERSON",    county: "PASSAIC" },
  { munname: "ELIZABETH",   county: "UNION" },
  { munname: "TRENTON",     county: "MERCER" },
];

// Fallback only -- propertyTypeFromDwell (actual per-parcel unit count) takes
// precedence whenever DWELL is present; this is used just for the rare row
// missing it.
const NJ_CLASS_MAP: Record<string, string> = {
  "2": "single_family",
  "15A": "single_family", "15B": "multifamily", "15C": "condo",
};

// Residential PROP_CLASS values -- deliberately excludes '4C', NJ's official
// class for "Apartments, 5+ units": confirmed live this was ~96% of NJ's
// ingested inventory, and 415 of those 434 rows have a BLANK owner name in
// NJOGIS MOD-IV itself (not an LLC to filter -- nothing at all). That also
// starved the pipeline of the single/small-multi-family homes it actually
// wants -- only 14 existed in the whole dataset. See CLAUDE.md.
const RESIDENTIAL_CLASSES = "'2','15A','15B','15C'";

// Hard cap even with 4C excluded -- DWELL is the parcel's actual dwelling
// unit count, more reliable than trusting every class code's assumed
// meaning. A record with no DWELL value at all is kept (most single-family
// homes report DWELL 1, but treating "missing" as "exclude" would silently
// drop legitimate rows over a data-completeness gap, not a size problem).
const MAX_DWELLING_UNITS = 4;

// Long tenure + real equity: an owner who has held the property 10+ years at
// $500k+ almost certainly has substantial equity (NJ home values didn't stay
// flat over a decade), which is exactly what makes a distress signal into a
// workable deal rather than a house they'd walk away from underwater.
// Overridable per call (min_years_owned, min_value in the request body).
const DEFAULT_MIN_YEARS_OWNED = 10;
const DEFAULT_MIN_VALUE = 500_000;

// 1 -> single_family, 2/3/4 -> duplex/triplex/fourplex -- matches
// scoring.ts's TYPE_PTS exactly, and is a real per-parcel unit count rather
// than the coarse, sometimes-wrong PROP_CLASS assumption.
function propertyTypeFromDwell(dwell: unknown): string | null {
  const n = Number(dwell);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n === 1) return "single_family";
  if (n === 2) return "duplex";
  if (n === 3) return "triplex";
  if (n === 4) return "fourplex";
  return null; // 5+ shouldn't occur with 4C excluded; don't guess if it does
}

const LLC_RE = /\b(LLC|L\.L\.C|INC|CORP|LP|LTD|TRUST|ESTATE|HOLDING|PROP|ASSOC|PARTNER|REALTY|GROUP|CAPITAL)\b/i;

// Strip NJ municipality type suffixes (e.g. "JERSEY CITY CITY" → "JERSEY CITY")
const cleanMunName = (name: string): string =>
  name.replace(/\s+(CITY|TWP|TOWNSHIP|BOROUGH|BORO|VILLAGE|TOWN)\s*$/i, "").trim();

// DEED_DATE can be YYYYMM string, YYYYMMDD string, or epoch milliseconds number
const yearsOwnedFrom = (deedDate: unknown): number => {
  if (!deedDate) return 0;
  const n = Number(deedDate);
  // Epoch milliseconds: large positive number (> year 9999 in ms = ~253402300800000)
  if (!isNaN(n) && n > 9_999_999_999) {
    const d = new Date(n);
    if (!isNaN(d.getTime())) {
      return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    }
  }
  const s = String(deedDate).trim();
  if (s.length >= 6 && /^\d+$/.test(s)) {
    const year = parseInt(s.slice(0, 4), 10);
    const month = parseInt(s.slice(4, 6), 10) - 1;
    const day = s.length >= 8 ? parseInt(s.slice(6, 8), 10) : 1;
    // Sanity check: year must be plausible
    if (year >= 1800 && year <= new Date().getFullYear()) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      }
    }
  }
  return 0;
};

const fetchMunicipality = async (
  munname: string,
  perMuni: number,
  minValue: number,
  individualOwnersOnly: boolean,
  errors: string[]
): Promise<Record<string, unknown>[]> => {
  try {
    // NET_VALUE is a genuine numeric field in this layer (confirmed live --
    // sample rows return it as a JSON number, not a string), unlike some
    // fields elsewhere in this pipeline that only look numeric. Filtering it
    // server-side, unlike years-owned below, is safe and cuts wasted fetches.
    // Same for the blank-OWNER_NAME exclusion below when individualOwnersOnly
    // is set -- OWNER_NAME itself (not the LLC-shape check, which still has
    // to happen client-side against the full name text) is a plain text
    // field, so this cuts the single biggest source of waste (blank owner
    // rows -- see RESIDENTIAL_CLASSES comment / CLAUDE.md) before it's even
    // fetched, rather than fetching then discarding client-side.
    const where = `MUN_NAME LIKE '%${munname}%' AND PROP_CLASS IN (${RESIDENTIAL_CLASSES}) AND NET_VALUE >= ${minValue}`
      + (individualOwnersOnly ? ` AND OWNER_NAME IS NOT NULL AND OWNER_NAME <> ''` : "");
    const params = new URLSearchParams({
      where,
      outFields: "PROP_LOC,MUN_NAME,ZIP_CODE,PROP_CLASS,LAST_YR_TX,NET_VALUE,OWNER_NAME,FAC_NAME,ST_ADDRESS,CITY_STATE,DEED_DATE,SALE_PRICE,COUNTY,DWELL",
      orderByFields: "LAST_YR_TX DESC",
      resultRecordCount: String(perMuni),
      f: "json",
    });

    const url = `${NJOGIS}?${params}`;
    console.log(`Fetching NJOGIS: ${munname}`);

    const res = await fetch(url, {
      headers: { "User-Agent": "InRange/1.0" },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json() as { features?: { attributes: Record<string, unknown> }[]; error?: { message: string } };
    if (json.error) throw new Error(`ArcGIS error: ${json.error.message}`);

    const features = json.features || [];
    console.log(`NJOGIS ${munname}: ${features.length} features`);
    return features.map((f) => f.attributes);
  } catch (e) {
    const msg = `NJOGIS fetch failed for ${munname}: ${String(e)}`;
    console.error(msg);
    errors.push(msg);
    return [];
  }
};

const toRawRecord = (
  attr: Record<string, unknown>,
  county: string
): Record<string, unknown> => {
  // Use OWNER_NAME; fall back to FAC_NAME for apartments/commercial with no owner name
  const ownerName  = (String(attr.OWNER_NAME || "").trim() || String(attr.FAC_NAME || "").trim());
  const cityState  = String(attr.CITY_STATE || "").trim();
  // Extract state from "CITY, ST" format
  const stateMatch = cityState.match(/,\s*([A-Z]{2})\s*$/);
  const ownerState = stateMatch ? stateMatch[1] : "NJ";
  const isOOState  = ownerState !== "NJ";
  const isLLC      = LLC_RE.test(ownerName);
  const years      = yearsOwnedFrom(attr.DEED_DATE);

  return {
    source:         "nj_mod_iv",
    address:        String(attr.PROP_LOC || "").trim(),
    city:           cleanMunName(String(attr.MUN_NAME || "").trim()),
    state:          "NJ",
    zip:            String(attr.ZIP_CODE  || "").trim(),
    county,
    property_type:  propertyTypeFromDwell(attr.DWELL) ?? NJ_CLASS_MAP[String(attr.PROP_CLASS || "")] ?? "unknown",
    dwelling_units: Number.isFinite(Number(attr.DWELL)) && Number(attr.DWELL) > 0 ? Number(attr.DWELL) : null,
    assessed_value: Number(attr.NET_VALUE || 0) || null,
    estimated_arv:  null,
    delinquent_amount: 0,
    years_owned:    Math.round(years),
    owner_name:     ownerName,
    owner_mailing_address: [
      String(attr.ST_ADDRESS || ""),
      cityState,
      String(attr.ZIP_CODE || ""),
    ].filter(Boolean).join(", ").trim(),
    owner_type:     isLLC ? "llc" : "individual",
    owner_state:    ownerState,
    process_stage:  "pre_foreclosure",
    out_of_state_owner: isOOState,
  };
};

const testConnectivity = async (supabase: ReturnType<typeof createClient>): Promise<Record<string, unknown>> => {
  const results: Record<string, unknown> = { ran_at: new Date().toISOString() };

  try {
    const r = await fetch("https://api.github.com/zen", {
      headers: { "User-Agent": "InRange/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    results.github_status = r.status;
    results.github_ok = r.ok;
    results.github_body = await r.text();
  } catch (e) {
    results.github_error = String(e);
  }

  try {
    const params = new URLSearchParams({ where: "1=1", outFields: "*", resultRecordCount: "1", f: "json" });
    const r = await fetch(`${NJOGIS}?${params}`, {
      headers: { "User-Agent": "InRange/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    results.njogis_status = r.status;
    results.njogis_ok = r.ok;
    const json = await r.json() as { features?: { attributes: Record<string, unknown> }[]; error?: unknown; fields?: { name: string }[] };
    results.njogis_error_body = json.error || null;
    results.njogis_feature_count = (json.features || []).length;
    results.njogis_field_names = (json.fields || []).map((f: { name: string }) => f.name);
    if (json.features && json.features[0]) {
      results.njogis_sample = json.features[0].attributes;
    }
  } catch (e) {
    results.njogis_error = String(e);
  }

  await supabase.from("raw_properties").upsert({
    property_hash: "diagnostic_connectivity_test",
    source: "diagnostic",
    raw_data: results,
  }, { onConflict: "property_hash" });

  return results;
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

    if (body.test === true) {
      const diag = await testConnectivity(supabase);
      return ok(diag, "Connectivity test");
    }

    const perMuni             = Math.min(Number(body.per_municipality || 75), 200);
    const targets              = (body.municipalities as typeof DEFAULT_TARGETS) || DEFAULT_TARGETS;
    const minValue             = Math.max(Number(body.min_value) || DEFAULT_MIN_VALUE, 0);
    const minYearsOwned        = Math.max(Number(body.min_years_owned) || DEFAULT_MIN_YEARS_OWNED, 0);
    const individualOwnersOnly = body.individual_owners_only === true;

    const results = {
      fetched: 0, inserted: 0, duplicates: 0,
      skipped_over_dwell_cap: 0, skipped_under_years_owned: 0, skipped_non_individual_owner: 0,
      by_municipality: {} as Record<string, number>,
      errors: [] as string[],
    };

    for (const { munname, county } of targets) {
      const attrs = await fetchMunicipality(munname, perMuni, minValue, individualOwnersOnly, results.errors);
      let muniCount = 0;

      for (const attr of attrs) {
        if (!attr.PROP_LOC) continue;

        // Belt-and-suspenders on top of excluding class 4C: don't trust the
        // class code's assumed meaning alone when a real per-parcel unit
        // count is available and says otherwise. A record with no DWELL at
        // all still passes -- see MAX_DWELLING_UNITS comment.
        const dwellNum = Number(attr.DWELL);
        if (Number.isFinite(dwellNum) && dwellNum > MAX_DWELLING_UNITS) {
          results.skipped_over_dwell_cap++;
          continue;
        }

        // DEED_DATE's format varies (YYYYMM/YYYYMMDD/epoch ms -- see
        // yearsOwnedFrom), so unlike NET_VALUE above this can't be pushed
        // into the ArcGIS $where clause; computed client-side instead. A
        // record with no parseable DEED_DATE yields years=0 and is excluded
        // here rather than assumed to meet the tenure bar.
        if (yearsOwnedFrom(attr.DEED_DATE) < minYearsOwned) {
          results.skipped_under_years_owned++;
          continue;
        }

        const rawData = toRawRecord(attr, county);

        // The ArcGIS query already drops blank OWNER_NAME rows when this flag
        // is set (see fetchMunicipality); this catches the LLC-shaped names
        // that made it through, since that check needs the full name text
        // and isn't expressible in the ArcGIS $where clause.
        if (individualOwnersOnly && rawData.owner_type !== "individual") {
          results.skipped_non_individual_owner++;
          continue;
        }

        const addr = String(rawData.address || "").toUpperCase().trim();
        const zip  = String(rawData.zip     || "").trim();

        if (!addr) continue;

        const key = `nj_mod_iv|${addr}|${zip}`;
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
        const hash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        const { data: existing } = await supabase
          .from("raw_properties")
          .select("id")
          .eq("property_hash", hash)
          .maybeSingle();

        if (existing) { results.duplicates++; continue; }

        const { error } = await supabase.from("raw_properties").insert({
          source:        "nj_mod_iv",
          raw_data:      rawData,
          property_hash: hash,
        });

        if (error) {
          results.errors.push(`${munname}: ${error.message}`);
        } else {
          results.inserted++;
          muniCount++;
        }
        results.fetched++;
      }

      results.by_municipality[munname] = muniCount;
    }

    return ok(
      results,
      `NJ ingestion complete: ${results.inserted} new, ${results.duplicates} already seen`
    );
  } catch (e) {
    console.error("ingest-nj error:", e);
    return err((e as Error).message);
  }
});
