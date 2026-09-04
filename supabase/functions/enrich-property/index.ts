import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';
import { ok, err, handleOptions } from '../_shared/cors.ts';

const buildPrompt = (p: Record<string, unknown>) => `You are a real estate investment analyst. Analyze this distressed property and return ONLY valid JSON.

Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}
Type: ${p.property_type} | Beds/Baths: ${p.bedrooms}/${p.bathrooms} | Sqft: ${p.square_footage}
ARV: $${p.estimated_arv} | Owed: $${p.amount_owed} | Asking: $${p.asking_price}
Equity: $${p.equity} (${p.equity_percentage}%) | Below Market: ${p.below_market_percentage}%
Deal Type: ${p.deal_type} | Indicators: ${(p.distress_indicators as string[] || []).join(', ')}
Score: ${p.composite_score}/100 (${p.priority_tier})
Owner: ${p.owner_name} | Type: ${p.owner_type} | Out-of-State: ${p.state !== p.owner_state ? 'Yes' : 'No'}
Auction: ${p.auction_date || 'N/A'} | Stage: ${p.process_stage || 'N/A'}

Return ONLY this JSON:
{
  "investment_thesis": "2-3 sentence thesis",
  "estimated_arv_refined": 0,
  "profit_potential": {
    "wholesale_fee": 0,
    "fix_and_flip_profit": 0,
    "rental_monthly_cashflow": 0,
    "best_strategy": "wholesale|fix_and_flip|buy_and_hold|subject_to"
  },
  "risks": ["risk1", "risk2"],
  "contact_strategy": "specific outreach approach",
  "talking_points": ["point1", "point2", "point3"],
  "red_flags": [],
  "recommended_offer": 0,
  "max_allowable_offer": 0
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const { property_id, property } = await req.json();

    // Load from DB if only ID provided
    let prop: Record<string, unknown> = property;
    if (property_id && !property) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', property_id)
        .single();
      if (error || !data) return err('Property not found', 404);
      prop = data;
    }

    if (!prop) return err('property or property_id required', 400);

    // Mark as processing
    if (prop.id) {
      await supabase.from('properties')
        .update({ enrichment_status: 'processing' })
        .eq('id', prop.id);
    }

    let analysis: Record<string, unknown>;

    try {
      const response = await anthropic.messages.create({
        model: Deno.env.get('CLAUDE_MODEL') || 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are a real estate investment analyst. Always respond with valid JSON only.',
        messages: [{ role: 'user', content: buildPrompt(prop) }],
      });

      analysis = JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}');
      analysis.model_used  = response.model;
      analysis.tokens_used = (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0);
    } catch (aiErr) {
      console.error('Claude API error:', aiErr);
      // Fallback enrichment
      analysis = {
        investment_thesis: `Distressed ${prop.property_type} in ${prop.city}, ${prop.state}. Score: ${prop.composite_score}/100.`,
        estimated_arv_refined: prop.estimated_arv || 0,
        profit_potential: { wholesale_fee: 0, fix_and_flip_profit: 0, rental_monthly_cashflow: 0, best_strategy: 'wholesale' },
        risks: ['Manual review recommended — AI unavailable'],
        contact_strategy: `Contact ${prop.owner_name || 'owner'} about ${prop.deal_type}.`,
        talking_points: ['Express empathy', 'Offer quick close', 'Cash offer'],
        red_flags: [],
        recommended_offer: prop.asking_price || 0,
        max_allowable_offer: 0,
        model_used: 'fallback',
        tokens_used: 0,
      };
    }

    analysis.enriched_at = new Date().toISOString();

    // Save to DB
    if (prop.id) {
      await supabase.from('properties')
        .update({ ai_analysis: analysis, ai_enriched_at: new Date().toISOString(), enrichment_status: 'complete' })
        .eq('id', prop.id);
    }

    return ok({ property_id: prop.id, analysis }, 'Property enriched');
  } catch (e) {
    console.error('enrich-property error:', e);
    return err((e as Error).message);
  }
});
