import { createClient } from "npm:@supabase/supabase-js@2";
import { ok, err, handleOptions } from "../_shared/cors.ts";

const MAKE_SECRET = Deno.env.get("MAKE_WEBHOOK_SECRET") ?? "";

// Deliberately excludes "apartment" (PLUTO/unitsToPropertyType's bucket for
// 5+ unit RENTAL buildings). Sorting by total building value surfaces
// institutional owners of huge multi-unit complexes there, not individual
// homeowners -- this segment is scoped to genuinely residential ownership.
//
// "coop" IS included even though a co-op is legally a multi-unit building --
// unlike a rental building, a co-op's ownername is the tenants' corporation,
// and outreach targets individual shareholder-residents through it, not an
// institutional landlord. See ingest-nyc's unitsToPropertyType for how "coop"
// (bldgclass D4) is distinguished from ordinary rental "apartment" buildings.
//
// "mixed_use" isn't included -- no ingest path produces that value today (no
// dedicated code path classifies it), so filtering on it would silently
// return nothing rather than what the caller expects.
const QUALIFYING_TYPES = [
  "single_family", "multifamily", "duplex", "triplex", "fourplex", "condo", "coop",
];

// Read-side counterpart to ingest-nyc/process-raw-properties: properties
// holds owner PII (name, phone, email), so RLS correctly blocks the anon key
// from reading it directly over PostgREST. This function is the sanctioned
// path -- service role internally, gated by the same shared secret every
// other Make-facing function uses.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  if (!MAKE_SECRET) return err("Server misconfigured", 500);
  if (req.headers.get("x-make-secret") !== MAKE_SECRET) {
    return err("Unauthorized", 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const minValue = Math.max(Number(body.min_value) || 500_000, 0);
    const limit = Math.min(Number(body.limit) || 75, 200);

    const { data, error } = await supabase
      .from("properties")
      .select(
        "id,address,city,state,zip,county,owner_name,owner_phone,owner_email," +
        "property_type,assessed_value,estimated_arv,equity_percentage",
      )
      .in("property_type", QUALIFYING_TYPES)
      .not("owner_name", "is", null)
      .neq("owner_name", "")
      .or(`estimated_arv.gte.${minValue},assessed_value.gte.${minValue}`)
      .order("assessed_value", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) return err(error.message, 500);

    return ok({ properties: data ?? [] }, `${data?.length ?? 0} qualifying properties`);
  } catch (e) {
    return err((e as Error).message, 500);
  }
});
