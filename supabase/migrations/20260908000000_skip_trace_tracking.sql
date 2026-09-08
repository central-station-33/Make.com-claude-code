-- Skip trace tracking — records whether a lead/property has already been run
-- through the paid skip-trace vendor, so skip-trace-leads doesn't re-pay for
-- records it already resolved (matched) or already confirmed unreachable
-- (no_match). Safe to re-run.

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS skip_trace_status TEXT,      -- 'matched' | 'no_match' | NULL (never attempted)
  ADD COLUMN IF NOT EXISTS skip_traced_at    TIMESTAMPTZ;

ALTER TABLE public.isa_leads
  ADD COLUMN IF NOT EXISTS skip_trace_status TEXT,
  ADD COLUMN IF NOT EXISTS skip_traced_at    TIMESTAMPTZ;
