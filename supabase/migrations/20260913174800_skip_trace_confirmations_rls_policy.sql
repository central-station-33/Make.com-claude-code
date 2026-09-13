-- Applied live 2026-09-13; tracked here for parity with the running database.
--
-- skip_trace_confirmations had RLS enabled with no policy (flagged by
-- Supabase's security advisor). In practice this already denies anon/
-- authenticated access by default -- only the service role (used by
-- skip-trace-leads) ever touches this table, and the service role bypasses
-- RLS entirely. This adds an explicit deny-all policy for anon/authenticated
-- so that default-deny is a documented decision rather than an absence of
-- policy, and survives someone later adding a permissive policy to a
-- *different* table without noticing this one has none at all.

CREATE POLICY "deny_all_client_access" ON skip_trace_confirmations
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
