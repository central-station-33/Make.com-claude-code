import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

const NJOGIS = "https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_and_MOD_IV_Composite/FeatureServer/0/query";

// High-distress NJ municipalities
const DEFAULT_TARGETS = [
  { munname: "NEWARK",      county: "ESSEX" },
  { munname: "JERSEY CITY", county: "HUDSON" },
  { munname: "CAMDEN",      county: "CAMDEN" },
  { munname: "PATERSON",    county: "PASSAIC" },
  { munname: "ELIZABETH",   county: "UNION" },
  { munname: "TRENTON",     county: "MERCER" },
];

const NJ_CLASS_MAP: Record<string, string> = {
  "2": "single_family", "4C": "apartment",
  "15A": "single_family", "15B": "multifamily", "15C": "condo",
};

// Residential classes worth scanning
const RESIDENTIAL_CLASSES = "'2','4C','15A','15B','15C'";

const LLC_RE = /\b(LLC|L\.L\.C|INC|CORP|LP|LTD|TRUST|ESTATE|HOLDING|PROP|ASSOC|PARTNER|REALTY|GROUP|CAPITAL)\b/i;

const yearsOwnedFrom = (saleDate: unknown): number => {
  if (!saleDate) return 0;
  const d = new Date(String(saleDate));
  if (isNaN(d.getTime())) return 0;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
};

const fetchMunicipality = async (
  munname: string,
  perMuni: number,
  errors: string[]
): Promise<Record<string, unknown>[]> => {
  try {
    const params = new URLSearchParams({
      where: `MUNNAME='${munname}' AND PROPCLASS IN (${RESIDENTIAL_CLASSES})`,
      outFields: "PROPLOCN,MUNNAME,ZIPCODE,PROPCLASS,NETPRPTAX,ASSMNT,OWNERSNAME,ADDR1,ADDR2,OWNERSCITY,OWNERSSTATE,OWNERSZIP,SALEDATE,SALEPRICE",
      orderByFields: "NETPRPTAX DESC",
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
  const ownerName  = String(attr.OWNERSNAME || "").trim();
  const ownerState = String(attr.OWNERSSTATE || "").toUpperCase().trim();
  const years      = yearsOwnedFrom(attr.SALEDATE);
  const isLLC      = LLC_RE.test(ownerName);
  const isOOState  = ownerState && ownerState !== "NJ";

  // Use field names that mapNJMODIV in process-raw-properties understands
  return {
    source:         "nj_mod_iv",
    address:        String(attr.PROPLOCN || "").trim(),
    city:           String(attr.MUNNAME  || "").trim(),
    state:          "NJ",
    zip:            String(attr.ZIPCODE  || "").trim(),
    county,
    property_type:  NJ_CLASS_MAP[String(attr.PROPCLASS || "")] || "unknown",
    assessed_value: Number(attr.ASSMNT   || 0) || null,
    // No reliable ARV from MOD-IV — leave null, let AI enrichment estimate
    estimated_arv:  null,
    // Pass delinquent_amount=0 so mapNJMODIV doesn't skip indicators
    delinquent_amount: 0,
    // years_owned is read by mapNJMODIV to set burnt_out_landlord indicator
    years_owned:    Math.round(years),
    owner_name:     ownerName,
    owner_mailing_address: [
      String(attr.ADDR1 || ""),
      String(attr.ADDR2 || ""),
      String(attr.OWNERSCITY || ""),
      String(attr.OWNERSSTATE || ""),
      String(attr.OWNERSZIP || ""),
    ].filter(Boolean).join(", ").trim(),
    owner_type:     isLLC ? "llc" : "individual",
    // Explicitly pass owner_state so normalization picks it up
    owner_state:    ownerState || "NJ",
    process_stage:  "pre_foreclosure",
    // Additional context for process-raw-properties mapper
    out_of_state_owner: isOOState,
  };
};

const testConnectivity = async (): Promise<Record<string, unknown>> => {
  const results: Record<string, unknown> = {};

  // Test 1: basic HTTPS to a known-good public API
  try {
    const r = await fetch("https://api.github.com/zen", {
      headers: { "User-Agent": "InRange/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    results.github_status = r.status;
    results.github_ok = r.ok;
  } catch (e) {
    results.github_error = String(e);
  }

  // Test 2: NJOGIS with no WHERE clause — just fetch 1 record to confirm the service exists
  try {
    const params = new URLSearchParams({ where: "1=1", outFields: "*", resultRecordCount: "1", f: "json" });
    const r = await fetch(`${NJOGIS}?${params}`, {
      headers: { "User-Agent": "InRange/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    results.njogis_status = r.status;
    results.njogis_ok = r.ok;
    const text = await r.text();
    results.njogis_body_snippet = text.slice(0, 500);
  } catch (e) {
    results.njogis_error = String(e);
  }

  return results;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Diagnostic mode — returns connectivity test results without touching the DB
    if (body.test === true) {
      const diag = await testConnectivity();
      return ok(diag, "Connectivity test");
    }

    const perMuni   = Math.min(Number(body.per_municipality || 75), 200);
    const targets   = (body.municipalities as typeof DEFAULT_TARGETS) || DEFAULT_TARGETS;

    const results = {
      fetched: 0, inserted: 0, duplicates: 0,
      by_municipality: {} as Record<string, number>,
      errors: [] as string[],
    };

    for (const { munname, county } of targets) {
      const attrs = await fetchMunicipality(munname, perMuni, results.errors);
      let muniCount = 0;

      for (const attr of attrs) {
        if (!attr.PROPLOCN) continue;

        const rawData = toRawRecord(attr, county);
        const addr    = String(rawData.address || "").toUpperCase().trim();
        const zip     = String(rawData.zip     || "").trim();

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
