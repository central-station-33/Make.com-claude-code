-- Applied live 2026-09-12; tracked here for parity with the running database.
--
-- Persisted individual-vs-entity classification of properties.owner_name.
--
-- Previously recomputed by regex on every skip-trace-leads call, scanning up
-- to 500 candidate rows just to find the handful of real individuals (of 291
-- properties eligible for tracing, only ~14 have one -- HPD-violation
-- buildings are overwhelmingly LLC-owned). Computing this once at write time
-- and indexing it turns that scan into a direct filter, and makes the
-- classification available to any other consumer (a dedicated entity-owner
-- workflow, a dashboard filter) without recomputing it.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_kind text;

ALTER TABLE properties
  DROP CONSTRAINT IF EXISTS properties_owner_kind_check;

ALTER TABLE properties
  ADD CONSTRAINT properties_owner_kind_check
  CHECK (owner_kind IS NULL OR owner_kind IN ('individual', 'entity', 'unknown'));

CREATE INDEX IF NOT EXISTS properties_owner_kind_idx ON properties (owner_kind);

COMMENT ON COLUMN properties.owner_kind IS
  'Computed by classifyOwnerKind() in _shared/owner-classification.ts from owner_name shape. owner_type is not reliable for this -- NJ MOD-IV writes building/program names into owner_name with owner_type=individual regardless.';

-- One-time backfill for the ~894 rows written before this column existed.
-- Mirrors classifyOwnerKind() in _shared/owner-classification.ts; kept in
-- sync manually since Postgres regex and the JS regex are two different
-- engines (Postgres word-boundary is \y, not \b).
WITH base AS (
  SELECT id, COALESCE(TRIM(owner_name), '') name,
    array_length(regexp_split_to_array(COALESCE(TRIM(owner_name), ''), '\s+'), 1) word_count
  FROM properties
  WHERE quarantined_at IS NULL
),
classified AS (
  SELECT id,
    CASE
      WHEN name = '' THEN 'unknown'
      WHEN word_count BETWEEN 2 AND 3
        AND name !~* '(llc|l\.l\.c|inc|corp|condo|coop|co-op|associat|ltd|\ylp\y|owners|compan|congregation|apt|apartment|realty|holding|manage|partner|plaza|properties|tower|housing|college|school|church|temple|\ypublic\y|agreement|\ypark\y|lofts|bank|authority|trust|fund|estate|residence|village|garden|heights|spires|ventures|leasing)'
        AND name ~ '^[A-Za-z][A-Za-z''.-]*( [A-Za-z][A-Za-z''.-]*){1,2}$'
      THEN 'individual'
      ELSE 'entity'
    END AS owner_kind
  FROM base
)
UPDATE properties p SET owner_kind = c.owner_kind
FROM classified c WHERE c.id = p.id;
