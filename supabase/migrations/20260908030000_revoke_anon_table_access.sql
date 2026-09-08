-- Applied live 2026-09-08 during a full security review; tracked here for
-- parity with the running database.
--
-- The public schema's default privileges grant `anon` (the public,
-- unauthenticated API key shipped in every browser bundle) full
-- SELECT/INSERT/UPDATE/DELETE/TRUNCATE on every table, and every RLS policy
-- in this project is `USING (true)` with no role restriction -- so RLS was
-- enabled but enforcing nothing. In practice this meant properties,
-- isa_leads, owners, contact_activities, deals, outreach/outcomes,
-- agent_commission_summary and every other table in public were reachable
-- directly via PostgREST by anyone with the anon key, no login required --
-- including owner PII and any skip-traced phone/email.
--
-- The app's real access model is: logged-in users (role `authenticated`,
-- gated by PrivateRoute in the frontend) read/write these tables directly;
-- anon has no legitimate use case for any of them (confirmed live: JetAdmin
-- is no longer connected, and no anonymous route touches these tables).
-- `authenticated` grants are intentionally left untouched -- that's the
-- real, working access path for logged-in staff, not a second bug.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
