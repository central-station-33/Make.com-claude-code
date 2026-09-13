-- Applied live 2026-09-13; tracked here for parity with the running database.
--
-- Provenance for estimate-arv-comps (see supabase/functions/estimate-arv-comps).
-- estimated_arv itself already existed; these track where a value came from
-- so a comps-derived estimate can be told apart from whatever populated it
-- before (ingest normalization, enrich-property's Claude estimate).

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS arv_source text,
  ADD COLUMN IF NOT EXISTS arv_comp_count integer,
  ADD COLUMN IF NOT EXISTS arv_computed_at timestamptz;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_arv_source_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_arv_source_check
  CHECK (arv_source IS NULL OR arv_source IN ('comps', 'ingest', 'ai_refined'));

COMMENT ON COLUMN properties.arv_source IS
  'Where estimated_arv came from: comps (estimate-arv-comps, real sold MLS comps), ingest (source data normalization), ai_refined (enrich-property''s Claude estimate). NULL for rows written before this column existed.';
