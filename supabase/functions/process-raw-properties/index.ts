import { createClient } from "npm:@supabase/supabase-js@2";
import { normalizeProperty, generatePropertyHash } from "../_shared/normalization.ts";
import { scoreProperty } from "../_shared/scoring.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NYC 311 complaint type → distress indicator mapping
const NYC311_MAP: Record<string, string[]> = {
  "HEAT/HOT WATER":       ["utility_shutoff", "code_violation"],
  "UNSANITARY CONDITION": ["code_violation"],
  "PAINT/PLASTER":        ["code_violation"],
  "WATER SYSTEM":         ["utility_shutoff"],
  "DOOR/WINDOW":          ["code_violation"],
  "ELEVATOR":             ["code_violation"],
  "PLUMBING":             ["code_violation"],
  "PEST CONTROL":         ["code_violation"],
  "MOLD":                 ["code_violation"],
  "LEAD":                 ["code_violation"],
  "STRUCTURAL":           ["condemned"],
  "BUILDING CONDITION":   ["code_violation"],
  "ILLEGAL CONVERSION":   ["code_violation"],
  "GENERAL CONSTRUCTION": ["code_violation"],
  "FLOORING/STAIRS":      ["code_violation"],
  "CEILING":              ["code_violation"],
  "ELECTRIC":             ["code_violation"],
};

const mapNYC311 = (raw: Record<string, unknown>): Record<string, unknown> => {
  const complaint = String(raw.complaint_type || "").toUpperCase();
  const indicators: Set<string> = new Set(["code_violation"]);
  for (const [key, vals] of Object.entries(NYC311_MAP)) {
    if (complaint.includes(key)) vals.forEach((v) => indicators.add(v));
  }
  return {
    source:              "nyc_311",
    address:             raw.address || raw.incident_address || "",
    city:                raw.city || raw.borough || "NEW YORK",
    state:               "NY",
    zip:                 raw.zip || raw.incident_zip || "",
    property_type:       raw.building_type || "unknown",
    distress_indicators: [...indicators],
    notice_date:         raw.created_date || raw.notice_date || null,
    process_stage:       "code violation",
    estimated_arv:       raw.estimated_arv   || null,
    assessed_value:      raw.assessed_value  || null,
    owner_name:          raw.owner_name      || "",
    owner_phone:         raw.owner_phone     || "",
    owner_email:         raw.owner_email     || "",
    owner_mailing_address: raw.owner_mailing_address || "",
    owner_type:          raw.owner_type      || "unknown",
  };
};

const NJ_CLASS_MAP: Record<string, string> = {
  "1": "land", "2": "single_family", "3A": "farm", "3B": "farm",
  "4A": "commercial", "4B": "industrial", "4C": "apartment",
  "15A": "single_family", "15B": "multifamily", "15C": "condo",
  "15D": "mobile_home",
};

const mapNJMODIV = (raw: Record<string, unknown>): Record<string, unknown> => {
  const indicators: string[] = [];
  if (Number(raw.delinquent_amount) > 0)    indicators.push("tax_delinquent");
  if (Number(raw.delinquent_amount) > 5000)  indicators.push("tax_lien");
  if (raw.code_violations)                   indicators.push("code_violation");
  if (Number(raw.years_owned) >= 15)         indicators.push("burnt_out_landlord");
  if (!indicators.length)                    indicators.push("code_violation");

  return {
    source:              "nj_mod_iv",
    address:             raw.address || raw.property_address || "",
    city:                raw.city || raw.municipality || "",
    state:               "NJ",
    zip:                 raw.zip || raw.postal_code || "",
    property_type:       NJ_CLASS_MAP[String(raw.property_class || "")] || "unknown",
    distress_indicators: indicators,
    estimated_arv:       raw.estimated_arv  || null,
    assessed_value:      raw.assessed_value || null,
    taxes_owed:          raw.delinquent_amount || null,
    owner_name:          raw.owner_name    || "",
    owner_mailing_address: raw.owner_mailing_address || "",
    year_built:          raw.year_built    || null,
    owner_type:          raw.owner_type    || "unknown",
  };
};

// Add new source mappers here as new Make.com data sources come online
const SOURCE_MAPPERS: Record<string, (raw: Record<string, unknown>) => Record<string, unknown>> = {
  nyc_311:    mapNYC311,
  nyc_hpd:    mapNYC311,
  nj_mod_iv:  mapNJMODIV,
  nj_parcels: mapNJMODIV,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let limit = 50;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.limit) limit = Math.min(Number(body.limit), 200);
  } catch { /* no body is fine */ }

  const { data: rawRecords, error: fetchError } = await supabase
    .from("raw_properties")
    .select("*")
    .is("processed_at", null)
    .order("received_at", { ascending: true })
    .limit(limit);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!rawRecords?.length) {
    return new Response(
      JSON.stringify({ processed: 0, message: "No unprocessed records" }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  const results = { processed: 0, upserted: 0, tier1: 0, tier2: 0, skipped: 0, errors: [] as string[] };
  const now = new Date().toISOString();

  for (const record of rawRecords) {
    try {
      const source = String(record.source || "unknown").toLowerCase();
      const rawData = (record.raw_data ?? {}) as Record<string, unknown>;

      const mapper = SOURCE_MAPPERS[source];
      const mapped = mapper ? mapper(rawData) : { ...rawData, source };

      // Skip records with no address — can't deduplicate or locate them
      if (!mapped.address && !rawData.address && !rawData.incident_address) {
        results.skipped++;
        await supabase.from("raw_properties").update({ processed_at: now }).eq("id", record.id);
        continue;
      }

      const normalized = normalizeProperty(mapped);
      const scores     = scoreProperty(normalized);
      const hash       = await generatePropertyHash(normalized);

      const enrichmentStatus =
        scores.priority_tier === "Tier 1" || scores.priority_tier === "Tier 2"
          ? "pending"
          : "skipped";

      const { error: upsertError } = await supabase.from("properties").upsert(
        {
          property_hash:           hash,
          source:                  normalized.source,
          address:                 normalized.address,
          city:                    normalized.city,
          state:                   normalized.state,
          zip:                     normalized.zip,
          county:                  normalized.county,
          property_type:           normalized.property_type,
          bedrooms:                normalized.bedrooms,
          bathrooms:               normalized.bathrooms,
          square_footage:          normalized.square_footage,
          year_built:              normalized.year_built,
          estimated_arv:           normalized.estimated_arv,
          amount_owed:             normalized.amount_owed,
          asking_price:            normalized.asking_price,
          equity:                  normalized.equity,
          equity_percentage:       normalized.equity_percentage,
          below_market_percentage: normalized.below_market_percentage,
          assessed_value:          normalized.assessed_value,
          taxes_owed:              normalized.taxes_owed,
          owner_name:              normalized.owner_name,
          owner_phone:             normalized.owner_phone,
          owner_email:             normalized.owner_email,
          owner_mailing_address:   normalized.owner_mailing_address,
          owner_type:              normalized.owner_type,
          owner_state:             normalized.owner_state,
          distress_indicators:     normalized.distress_indicators,
          notice_date:             normalized.notice_date,
          auction_date:            normalized.auction_date,
          process_stage:           normalized.process_stage,
          case_number:             normalized.case_number,
          ...scores,
          enrichment_status,
          data_sources: [String(normalized.source)],
        },
        { onConflict: "property_hash" }
      );

      if (upsertError) throw new Error(upsertError.message);

      await supabase.from("raw_properties").update({ processed_at: now }).eq("id", record.id);

      results.processed++;
      results.upserted++;
      if (scores.priority_tier === "Tier 1") results.tier1++;
      if (scores.priority_tier === "Tier 2") results.tier2++;
    } catch (e) {
      results.errors.push(`[${record.id}] ${String(e)}`);
      // Mark processed even on error to avoid looping on a permanently bad record
      await supabase.from("raw_properties").update({ processed_at: now }).eq("id", record.id);
    }
  }

  return new Response(
    JSON.stringify({
      ...results,
      message: `Processed ${results.processed} records → ${results.tier1} Tier 1, ${results.tier2} Tier 2 queued for enrichment`,
    }),
    { headers: { ...cors, "Content-Type": "application/json" } }
  );
});
