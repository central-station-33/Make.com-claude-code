-- Applied live 2026-09-13; tracked here for parity with the running database.
--
-- Provenance for backfill-nj-zip (see supabase/functions/backfill-nj-zip).
-- zip_geocoded_at doubles as "already attempted" so the function's own
-- selection query (zip_geocoded_at IS NULL) never retries a row forever,
-- including ones where geocoding failed and zip was left untouched.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS zip_source text,
  ADD COLUMN IF NOT EXISTS zip_geocoded_at timestamptz;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_zip_source_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_zip_source_check
  CHECK (zip_source IS NULL OR zip_source IN ('ingest', 'census_geocoded'));

COMMENT ON COLUMN properties.zip_source IS
  'ingest = whatever the raw source wrote (often wrong for NJ -- see CLAUDE.md), census_geocoded = corrected by backfill-nj-zip. NULL for rows never touched by the backfill.';
