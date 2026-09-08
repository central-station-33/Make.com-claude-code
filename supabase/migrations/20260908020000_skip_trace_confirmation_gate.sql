-- Two-step confirmation gate for skip-trace-leads. Skip tracing is the only
-- per-lookup billed step in the pipeline, run against a small account
-- balance, so no single request -- however its flags are set -- should be
-- able to trigger a paid run. A "propose" call resolves the exact batch and
-- issues a one-time token; only a second, separate "confirm" call presenting
-- that token spends money, and it spends on exactly the batch that was
-- proposed (record_ids is a full snapshot, not re-queried at confirm time).

CREATE TABLE IF NOT EXISTS public.skip_trace_confirmations (
  token        TEXT PRIMARY KEY,
  table_name   TEXT NOT NULL,
  segment      TEXT,
  record_ids   JSONB NOT NULL,   -- full TraceRecord[] snapshot shown at proposal time
  record_count INTEGER NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ
);

-- Lets an expired/consumed backlog be cleared without hand-picking rows.
CREATE INDEX IF NOT EXISTS skip_trace_confirmations_expires_idx
  ON public.skip_trace_confirmations (expires_at);
