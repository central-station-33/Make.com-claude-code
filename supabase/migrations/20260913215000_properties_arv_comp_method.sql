-- Applied live 2026-09-13; tracked here for parity with the running database.
--
-- estimate-arv-comps has two sizing modes (see its header doc): price-per-
-- sqft when the subject has a known square_footage, median-sold-price
-- directly when it doesn't (required for NJ -- NJOGIS MOD-IV has no
-- building-area field at all). This records which one produced a given
-- estimated_arv, since the two have different confidence.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS arv_comp_method text;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_arv_comp_method_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_arv_comp_method_check
  CHECK (arv_comp_method IS NULL OR arv_comp_method IN ('price_per_sqft', 'median_sold_price'));
