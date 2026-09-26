-- 20260926-01: team_agent_logins_guard() is a trigger function only. Revoke
-- direct EXECUTE so it is not reachable via /rest/v1/rpc (Supabase advisor
-- lints 0028/0029). Triggers still fire: trigger execution does not check
-- EXECUTE privilege for the invoking role.
revoke execute on function public.team_agent_logins_guard() from public, anon, authenticated;
