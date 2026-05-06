import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, ok, err, handleOptions } from '../_shared/cors.ts';
import { normalizeProperty, generatePropertyHash } from '../_shared/normalization.ts';
import { scoreProperty } from '../_shared/scoring.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [payload];

    const results = { upserted: 0, tier1_queued: 0, errors: [] as string[] };

    for (const item of items) {
      try {
        const normalized = normalizeProperty(item);
        const scores     = scoreProperty(normalized);
        const hash       = await generatePropertyHash(normalized);

        const property = {
          property_hash:            hash,
          source:                   normalized.source,
          address:                  normalized.address,
          city:                     normalized.city,
          state:                    normalized.state,
          zip:                      normalized.zip,
          county:                   normalized.county,
          property_type:            normalized.property_type,
          bedrooms:                 normalized.bedrooms,
          bathrooms:                normalized.bathrooms,
          square_footage:           normalized.square_footage,
          year_built:               normalized.year_built,
          estimated_arv:            normalized.estimated_arv,
          amount_owed:              normalized.amount_owed,
          asking_price:             normalized.asking_price,
          equity:                   normalized.equity,
          equity_percentage:        normalized.equity_percentage,
          below_market_percentage:  normalized.below_market_percentage,
          assessed_value:           normalized.assessed_value,
          taxes_owed:               normalized.taxes_owed,
          owner_name:               normalized.owner_name,
          owner_phone:              normalized.owner_phone,
          owner_email:              normalized.owner_email,
          owner_mailing_address:    normalized.owner_mailing_address,
          owner_type:               normalized.owner_type,
          owner_state:              normalized.owner_state,
          distress_indicators:      normalized.distress_indicators,
          notice_date:              normalized.notice_date,
          auction_date:             normalized.auction_date,
          process_stage:            normalized.process_stage,
          case_number:              normalized.case_number,
          ...scores,
          enrichment_status:        scores.priority_tier === 'Tier 1' ? 'pending' : 'skipped',
          data_sources:             [normalized.source],
        };

        const { error } = await supabase
          .from('properties')
          .upsert(property, { onConflict: 'property_hash' });

        if (error) throw new Error(error.message);
        results.upserted++;
        if (scores.priority_tier === 'Tier 1') results.tier1_queued++;
      } catch (e) {
        results.errors.push((e as Error).message);
      }
    }

    return ok(results, `Scored ${results.upserted} properties, ${results.tier1_queued} Tier 1`);
  } catch (e) {
    console.error('score-property error:', e);
    return err((e as Error).message);
  }
});
