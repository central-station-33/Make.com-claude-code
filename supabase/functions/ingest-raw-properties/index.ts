import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const items = Array.isArray(payload) ? payload : [payload];
    const results = { inserted: 0, duplicates: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const source = String(item.source || "unknown");
        const rawData = item.raw_data || item;
        const addr = String(rawData.address || rawData.incident_address || "");
        const zip = String(rawData.zip || rawData.incident_zip || "");

        const key = `${source}|${addr.toUpperCase()}|${zip}`;
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
        const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

        const { data: existing } = await supabase
          .from("raw_properties")
          .select("id")
          .eq("property_hash", hash)
          .maybeSingle();

        if (existing) { results.duplicates++; continue; }

        const { error } = await supabase.from("raw_properties").insert({
          source,
          raw_data: rawData,
          property_hash: hash,
        });

        if (error) throw new Error(error.message);
        results.inserted++;
      } catch (e) {
        results.errors.push((e as Error).message);
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
