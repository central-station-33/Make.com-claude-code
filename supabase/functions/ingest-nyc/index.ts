import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

// NYC Open Data — HPD Building Violations (wvxf-dwi5 = violations per building)
const HPD_VIOLATIONS = "https://data.cityofnewyork.us/resource/wvxf-dwi5.json";

// NYC Evictions (active eviction filings — strong distress signal)
const NYC_EVICTIONS = "https://data.cityofnewyork.us/resource/6z8x-wfk4.json";

type Borough = "MANHATTAN" | "BROOKLYN" | "QUEENS" | "BRONX" | "STATEN ISLAND";

// Boroughs to scan — all five
const BOROUGHS: Borough[] = ["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"];

const fetchHPDViolations = async (
  borough: Borough,
  limit: number
): Promise<Record<string, unknown>[]> => {
  try {
    // Class C = immediately hazardous. Filter to open/unresolved, last 12 months
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 12);

    const params = new URLSearchParams({
      borough: borough.toUpperCase(),
      class: "C",
      currentstatus: "Open",
      "$order": "inspectiondate DESC",
      "$limit": String(limit),
      "$select": "housenumber,streetname,postcode,borough,bbl,ownername,registrationcontacttype,novdescription,inspectiondate,currentstatus",
    });

    const res = await fetch(`${HPD_VIOLATIONS}?${params}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HPD HTTP ${res.status}`);
    return await res.json() as Record<string, unknown>[];
  } catch (e) {
    console.error(`HPD fetch failed for ${borough}:`, e);
    return [];
  }
};

const fetchEvictions = async (limit: number): Promise<Record<string, unknown>[]> => {
  try {
    const params = new URLSearchParams({
      "$order": "executed_date DESC",
      "$limit": String(limit),
      "$select": "borough,eviction_address,eviction_zip,respondent_first_name,respondent_last_name,executed_date,marshal_first_name,marshal_last_name",
    });

    const res = await fetch(`${NYC_EVICTIONS}?${params}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Evictions HTTP ${res.status}`);
    return await res.json() as Record<string, unknown>[];
  } catch (e) {
    console.error("Evictions fetch failed:", e);
    return [];
  }
};

const boroughToState = (borough: string): string => {
  // All NYC boroughs are in New York state
  return "NY";
};

const hpdToRaw = (v: Record<string, unknown>): Record<string, unknown> | null => {
  const house  = String(v.housenumber || "").trim();
  const street = String(v.streetname  || "").trim();
  if (!house || !street) return null;

  const ownerName  = String(v.ownername || "").trim();
  const isLLC = /\b(LLC|L\.L\.C|INC|CORP|LP|LTD|TRUST|ESTATE|HOLDING|REALTY|GROUP)\b/i.test(ownerName);

  return {
    source:         "nyc_hpd",
    address:        `${house} ${street}`,
    city:           String(v.borough || "NEW YORK"),
    state:          "NY",
    zip:            String(v.postcode || "").trim(),
    property_type:  "unknown",
    distress_indicators: ["code_violation"],
    process_stage:  "code violation",
    owner_name:     ownerName,
    owner_type:     isLLC ? "llc" : (ownerName ? "individual" : "unknown"),
    notice_date:    v.inspectiondate || null,
    // HPD doesn't provide mailing address or owner state — left for skip-trace
  };
};

const evictionToRaw = (e: Record<string, unknown>): Record<string, unknown> | null => {
  const address = String(e.eviction_address || "").trim();
  if (!address) return null;

  const firstName  = String(e.respondent_first_name  || "").trim();
  const lastName   = String(e.respondent_last_name   || "").trim();
  const ownerName  = [firstName, lastName].filter(Boolean).join(" ");

  return {
    source:         "nyc_evictions",
    address,
    city:           String(e.borough || "NEW YORK"),
    state:          "NY",
    zip:            String(e.eviction_zip || "").trim(),
    property_type:  "unknown",
    distress_indicators: ["code_violation"],
    process_stage:  "eviction",
    notice_date:    e.executed_date || null,
    owner_name:     ownerName,
    owner_type:     "individual",
  };
};

const hashRecord = async (source: string, address: string, zip: string): Promise<string> => {
  const key = `${source}|${address.toUpperCase().trim()}|${zip.trim()}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const perBorough     = Math.min(Number(body.per_borough     || 100), 500);
    const evictionLimit  = Math.min(Number(body.eviction_limit  || 200), 500);

    const results = {
      fetched: 0, inserted: 0, duplicates: 0,
      by_source: { hpd: 0, evictions: 0 } as Record<string, number>,
      errors: [] as string[],
    };

    // --- HPD Class C violations ---
    for (const borough of BOROUGHS) {
      const violations = await fetchHPDViolations(borough, perBorough);
      for (const v of violations) {
        const rawData = hpdToRaw(v);
        if (!rawData) continue;

        const hash = await hashRecord(
          "nyc_hpd",
          String(rawData.address),
          String(rawData.zip || "")
        );

        const { data: existing } = await supabase
          .from("raw_properties")
          .select("id")
          .eq("property_hash", hash)
          .maybeSingle();

        if (existing) { results.duplicates++; continue; }

        const { error } = await supabase.from("raw_properties").insert({
          source:        "nyc_hpd",
          raw_data:      rawData,
          property_hash: hash,
        });

        if (error) { results.errors.push(`HPD ${borough}: ${error.message}`); }
        else { results.inserted++; results.by_source.hpd++; }
        results.fetched++;
      }
    }

    // --- NYC Evictions (cross-city, strong distress signal) ---
    const evictions = await fetchEvictions(evictionLimit);
    for (const e of evictions) {
      const rawData = evictionToRaw(e);
      if (!rawData) continue;

      const hash = await hashRecord(
        "nyc_evictions",
        String(rawData.address),
        String(rawData.zip || "")
      );

      const { data: existing } = await supabase
        .from("raw_properties")
        .select("id")
        .eq("property_hash", hash)
        .maybeSingle();

      if (existing) { results.duplicates++; continue; }

      const { error } = await supabase.from("raw_properties").insert({
        source:        "nyc_evictions",
        raw_data:      rawData,
        property_hash: hash,
      });

      if (error) { results.errors.push(`Eviction: ${error.message}`); }
      else { results.inserted++; results.by_source.evictions++; }
      results.fetched++;
    }

    return ok(
      results,
      `NYC ingestion complete: ${results.inserted} new, ${results.duplicates} already seen`
    );
  } catch (e) {
    console.error("ingest-nyc error:", e);
    return err((e as Error).message);
  }
});
