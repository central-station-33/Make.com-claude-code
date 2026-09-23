-- Migration: grant_baseline_table_privileges
-- Fixes: 'permission denied for table X' errors surfaced when testing baseline_foundational_schema
-- on a Supabase branch. service_role's RLS-bypass attribute does not substitute for base table grants;
-- CREATE TABLE via raw migration SQL does not automatically pick up Supabase's default grants.

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
