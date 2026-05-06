import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, ok, err, handleOptions } from '../_shared/cors.ts';
import { normalizeProperty, generatePropertyHash } from '../_shared/normalization.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [payload];

    const results = { inserted: 0, duplicates: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const normalized = normalizeProperty(item);
        const hash = await generatePropertyHash(normalized);
        normalized.property_hash = hash;

        // Check for duplicate
        const { data: existing } = await supabase
          .from('raw_properties')
          .select('id')
          .eq('property_hash', hash)
          .single();

        if (existing) {
          results.duplicates++;
          continue;
        }

        const { error } = await supabase
          .from('raw_properties')
          .insert({ source: normalized.source, raw_data: item, property_hash: hash });

        if (error) throw new Error(error.message);
        results.inserted++;
      } catch (e) {
        results.errors.push((e as Error).message);
      }
    }

    return ok(results, `Ingested ${results.inserted} properties (${results.duplicates} duplicates)`);
  } catch (e) {
    console.error('ingest-raw-properties error:', e);
    return err((e as Error).message);
  }
});
