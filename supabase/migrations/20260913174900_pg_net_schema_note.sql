-- Applied live 2026-09-13; tracked here for parity with the running database.
--
-- Supabase's security advisor flags pg_net as installed in the public
-- schema. Investigated live: pg_net's actual functions already live in the
-- `net` schema it creates on install (0 objects in public depend on it), and
-- nothing in this database references net.* (no cron.job table -- pg_cron
-- isn't installed) -- so moving it is low-risk. `ALTER EXTENSION pg_net SET
-- SCHEMA net` fails outright (Postgres error 55000: the extension "contains"
-- the net schema it would be moved into -- circular). A DROP + recreate
-- cycle was tried instead:
--
--   DROP EXTENSION pg_net;               -- also drops the net schema it owned
--   CREATE SCHEMA IF NOT EXISTS net;
--   CREATE EXTENSION pg_net SCHEMA net;
--
-- This succeeded, but the extension's own namespace pointer (pg_extension.
-- extnamespace) reverted to public immediately afterward on its own --
-- confirmed live, not a migration-ordering issue. This points to Supabase's
-- platform actively re-pinning pg_net into public (it backs their own
-- webhook/cron infrastructure), not something fixable from inside this
-- project via SQL. The extension itself is fully functional either way (its
-- functions are correctly under `net`); only the cosmetic advisory persists.
-- Not re-attempting -- re-running the drop/recreate here would just be
-- silently reverted the same way.

CREATE SCHEMA IF NOT EXISTS net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA net;
