-- Applied live 2026-09-12; tracked here for parity with the running database.
--
-- Quarantine marker for rows that must never reach a paid step, an ISA, or the
-- dashboard, but which we do not want to delete outright.
--
-- Motivating case: the retired seed-scores dev script wrote three fabricated
-- "Tier 1 Foreclosure" rows (invented owner names, round ARVs, source='manual').
-- After the 2026-09-12 tier recalibration two of them still ranked Tier 1, and
-- they were the only three properties eligible for BatchData skip tracing --
-- so the first real paid run would have bought contact lookups for people who
-- do not exist. Tier or status flags alone were not enough: rescore-properties
-- recomputes priority_tier from scratch and would have promoted them again,
-- which is why rescore-properties now filters on quarantined_at IS NULL.
--
-- Consumers must treat `quarantined_at IS NOT NULL` as "invisible": excluded
-- from scoring, enrichment, skip tracing, notification and the dashboard.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS quarantined_at timestamptz,
  ADD COLUMN IF NOT EXISTS quarantine_reason text;

CREATE INDEX IF NOT EXISTS properties_quarantined_at_idx
  ON properties (quarantined_at)
  WHERE quarantined_at IS NULL;

COMMENT ON COLUMN properties.quarantined_at IS
  'Set when a row must be excluded from every pipeline stage and the dashboard. Non-destructive alternative to deletion.';

-- The three known fabricated rows. priority_tier and enrichment_status carry
-- CHECK constraints with no "quarantined" member, so they are parked at their
-- least-privileged valid values; quarantined_at is the source of truth.
UPDATE properties SET
  quarantined_at    = now(),
  quarantine_reason = 'Fabricated demo row written by the retired seed-scores dev script (invented owner name, round ARV, source=manual). Not a real property.',
  priority_tier     = 'Tier 4',
  enrichment_status = 'skipped',
  skip_trace_status = 'quarantined'
WHERE source = 'manual' AND quarantined_at IS NULL;
