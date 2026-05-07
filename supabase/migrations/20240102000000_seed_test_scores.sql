-- Seed test scores for properties with NULL composite_score
-- Run this once in Supabase SQL Editor

DO $$
DECLARE
  prop RECORD;
  score_val INTEGER := 82;
BEGIN
  FOR prop IN SELECT id FROM properties WHERE composite_score IS NULL LOOP
    UPDATE properties SET
      composite_score           = score_val,
      distress_score            = 75,
      deal_quality_score        = 80,
      contact_likelihood_score  = 60,
      timeline_urgency_score    = 70,
      priority_tier             = 'Tier 1',
      deal_type                 = 'Foreclosure',
      enrichment_status         = 'pending'
    WHERE id = prop.id;
  END LOOP;
END;
$$;

SELECT id, address, composite_score, priority_tier, enrichment_status FROM properties;
