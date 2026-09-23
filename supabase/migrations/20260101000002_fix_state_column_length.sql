-- Migration: fix_state_column_length
-- Fixes: 'value too long for type character(1)' errors surfaced when testing baseline_foundational_schema
-- on a Supabase branch. state/owner_state columns were declared as bare `character` (defaults to
-- character(1) in Postgres) instead of character(2), so two-letter state codes like 'NY' failed to insert.

ALTER TABLE public.properties ALTER COLUMN state TYPE character(2);
ALTER TABLE public.properties ALTER COLUMN owner_state TYPE character(2);
ALTER TABLE public.inrange_leads ALTER COLUMN state TYPE character(2);
