import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, err, handleOptions } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url    = new URL(req.url);
    const params = url.searchParams;

    // Filters
    const state         = params.get('state')?.toUpperCase();
    const tier          = params.get('tier');            // e.g. "Tier 1"
    const minScore      = params.get('min_score');
    const dealType      = params.get('deal_type');
    const enrichStatus  = params.get('enrichment_status');
    const limit         = Math.min(parseInt(params.get('limit') || '50'), 200);
    const offset        = parseInt(params.get('offset') || '0');
    const sortBy        = params.get('sort_by') || 'composite_score';
    const sortDir       = params.get('sort_dir') === 'asc' ? true : false;

    let query = supabase
      .from('properties')
      .select(`
        id, address, city, state, zip, county,
        property_type, bedrooms, bathrooms, square_footage, year_built,
        estimated_arv, amount_owed, asking_price, equity, equity_percentage, below_market_percentage,
        owner_name, owner_phone, owner_email, owner_type, owner_state,
        distress_indicators, notice_date, auction_date, process_stage,
        composite_score, priority_tier, deal_type,
        distress_score, deal_quality_score, contact_likelihood_score, timeline_urgency_score,
        burnt_out_landlord_score, burnt_out_signals,
        enrichment_status, ai_enriched_at,
        created_at, updated_at
      `, { count: 'exact' });

    if (state)        query = query.eq('state', state);
    if (tier)         query = query.eq('priority_tier', tier);
    if (dealType)     query = query.eq('deal_type', dealType);
    if (enrichStatus) query = query.eq('enrichment_status', enrichStatus);
    if (minScore)     query = query.gte('composite_score', parseInt(minScore));

    query = query
      .order(sortBy, { ascending: sortDir })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) return err(error.message);

    return ok({
      properties: data ?? [],
      total:      count ?? 0,
      limit,
      offset,
    }, `${count ?? 0} properties found`);
  } catch (e) {
    console.error('fetch-properties error:', e);
    return err((e as Error).message);
  }
});
