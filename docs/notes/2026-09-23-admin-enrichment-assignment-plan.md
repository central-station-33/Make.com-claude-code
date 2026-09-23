# Admin control, property enrichment, and lead assignment — fix plan

**STATUS: PLAN ONLY — NOT APPROVED FOR EXECUTION**

Requested by: Jet Taffet (Jet Realty Advisors), 2026-09-23
Goal: give `team@joinjra.com` full admin control of InRange, add a dashboard
way to enrich the 924 rows in `properties`, add lead-to-agent assignment for
those same rows with proper access controls, and support agent onboarding.

## 1. Current state (diagnosis)

| Layer | Object | Observed state | Evidence | Confidence |
|---|---|---|---|---|
| Supabase auth | `team@joinjra.com` | Already exists as an `auth.users` row and already has a `team_agents` row: `full_name="James Thompson"`, `role="broker"`, `status="active"`, `brokerage="highline"` | `auth.users`, `team_agents` query | High |
| Supabase RLS | `team_agents` policies | `brokers manage all team_agents` (ALL, `is_broker()`) + `agents view own team_agents row` (SELECT own). `is_broker()` = `EXISTS (SELECT 1 FROM team_agents WHERE auth_user_id = auth.uid() AND role='broker')` | `pg_policies`, `pg_proc` | High |
| Supabase RLS | `properties` (the 924 rows) | One policy: `auth all properties`, `ALL`, `roles={authenticated}`, `qual=true` — **any signed-in user, agent or broker, already has full read/write/delete on all 924 rows.** There is no per-role restriction today. | `pg_policies` | High |
| Supabase RLS | `raw_properties` (853 rows, pre-normalization ingest log) | SELECT only, open to any authenticated user. No write policy exists via RLS (writes happen through the service role in ingest functions). | `pg_policies` | High |
| Frontend | `userRole === 'owner'` checks (`DashboardContainer.tsx`) | Dead code. `team_agents.role` is only ever set to `'agent'` or `'broker'` (enforced in `invite-agent`); `'owner'` is never assignable through any current pathway, so the "Owner Dashboard" / `AgentPerformanceSection` branch never renders for anyone. | `useAuthState.ts`, `invite-agent/index.ts` | High |
| Frontend | `/dashboard` route (`Dashboard.tsx` → `useLeadsQuery`) | **Broken.** Queries `leads`, `profiles`, `crm_contacts`, `lead_imports` — none of these tables exist in the live schema (confirmed against full 28-table list). This is the page a session lands on by default (`/` → `/dashboard` once logged in), so most of the "Dashboard" UI (`LeadAssignments`, `UnassignedLeadsTable`, `AssignLeadDialog`, agent-invite header) is effectively unreachable / non-functional in production. | `useLeadsQuery.ts`, `useAssignLead.ts`, live table list | High |
| Frontend | `/inrange/leads` (`InRangeLeads.tsx`) | **This is the working page** — queries `properties` directly via the `inrange` Supabase client, matches the live schema, and is almost certainly what "InRange.jetreadvisors.com is working" refers to. It has status editing and filtering but **no agent-assignment field or enrichment trigger of any kind.** | `InRangeLeads.tsx` | High |
| Database | `properties.enrichment_status` (the 924 "raw" rows) | 875 `skipped`, 49 `pending`, 0 `complete`. No `assigned_agent_id` column exists on `properties` at all (only `deals.assigned_agent_id`, which only applies once a deal exists). | `execute_sql` count query, `list_tables` | High |
| Backend | `enrich-property` (per-property Claude enrichment) | `verify_jwt: true` — already safely callable from the browser with the signed-in user's session token. No batch mode; one property at a time. | `list_edge_functions` | High |
| Backend | `enrich-pending`, `process-raw-properties`, `rescore-properties` | `verify_jwt: false` at the gateway. `rescore-properties` enforces its own `x-make-secret` check in code; `enrich-pending` and `process-raw-properties` have **no auth check in code either** — currently callable by anyone who has the URL, not just Make. Not directly relevant to this request, but a real gap worth a follow-up (out of scope here unless you want it folded in). | function source + `list_edge_functions` | High |
| Backend | `assign-leads`, `claim-lead` | Fully working agent-assignment mechanism — but it operates on **`isa_leads`** (186 rows, the BANT-scored ISA pipeline), not on `properties`. Gated by `x-make-secret`, Make-only, no dashboard UI. This is not the same table as the 924 rows in question. | function source | High |
| Backend | `invite-agent` | `verify_jwt: true`, already checks caller is `role='broker'` via `team_agents` before creating the new `auth.users` row + `team_agents` row and sending Supabase's invite email. Frontend dialog (`InviteAgentDialog.tsx`) already exists and is wired into `DashboardHeader.tsx` — but that header only renders inside the broken `/dashboard` route above. | `invite-agent/index.ts`, `DashboardHeader.tsx` | High |

### Net effect of the diagnosis
`team@joinjra.com` already has **broker-level admin rights** at the database
layer (manages all `team_agents`, unrestricted `properties` access via the
open RLS policy). What's actually missing is not permission — it's that:

1. The one place agent invitation lives (`/dashboard`) is broken, so there is
   no reachable UI for agent onboarding today.
2. Nothing in the UI calls the enrichment functions for `properties`.
3. `properties` has no assignment column or assignment UI at all — the only
   assignment feature that exists (`assign-leads`/`claim-lead`) targets a
   different table (`isa_leads`).
4. Access control is currently all-or-nothing: any signed-in agent can
   already read/edit/delete every one of the 924 rows. If you want agents to
   see *only* their own assigned leads once assignment exists, that requires
   a new RLS policy — it does not exist today.

## 2. Decisions needed before building (see chat for the actual questions)

- Is `team@joinjra.com` / brokerage `"highline"` correct, or should that be
  `jet_realty`? The account already exists with `highline` — I have not
  changed it.
- Once `assigned_agent_id` exists on `properties`, should an **agent** be
  restricted to their own assigned leads (read/write only their rows), or
  keep today's everyone-sees-everything model and use assignment purely as a
  routing/ownership label with the same access control?
- Which enrichment path: per-property "Enrich" button (safe, already
  browser-authenticated via `enrich-property`) vs. a batch "Enrich all
  pending" trigger (needs a new small browser-facing wrapper function, since
  `enrich-pending` has no auth check today)?
- Should the `/dashboard` route be fixed/retired, or is `/inrange/*` now the
  permanent home and `/dashboard` should just redirect there?

## 3. Proposed implementation (pending approval)

### Phase A — Admin control for team@joinjra.com
- Confirm `team_agents.role='broker'` stays the admin tier (it already grants
  full `team_agents` management + is already unrestricted on `properties`).
  No RLS change needed unless Decision 2 above asks for per-agent
  restriction, in which case brokers get an explicit bypass clause.
- Fix `brokerage` field per Decision 1 above (one-line UPDATE).
- Optional: remove the dead `'owner'` branch in `DashboardContainer.tsx` or
  repoint it at `role==='broker'` so "Owner Dashboard" actually renders for
  admins, once `/dashboard` is fixed or retired.

### Phase B — Enrichment from the dashboard (`properties`, 924 rows)
1. Add an "Enrichment" section to `/inrange/leads` (or a new `/inrange/enrich`
   page) showing the live status split (skipped/pending/complete count).
2. Wire a per-lead "Enrich now" action in `InRangeLeadDetail.tsx` to the
   existing `enrich-property` function (already `verify_jwt:true`, safe as-is).
3. For batch enrichment, add a new browser-facing edge function
   (`verify_jwt:true`) that checks caller is broker/admin, then loops a
   bounded batch through the same enrichment logic as `enrich-pending` —
   rather than exposing `enrich-pending` itself to the browser, since it has
   no caller check today and this avoids touching a function Make also calls.
4. Respect the existing Anthropic budget-pause gate noted in the codebase
   (`ai_budget_tracker`) — surface remaining budget/paused state in the UI so
   admins don't trigger a batch that will silently fail mid-run.

### Phase C — Lead assignment to agents (`properties`, 924 rows)
1. Migration: add `assigned_agent_id uuid references team_agents(id)` to
   `properties`.
2. Add an agent-select control to `InRangeLeads.tsx` (row-level) and
   `InRangeLeadDetail.tsx` (detail view), sourced from `team_agents`
   (not the nonexistent `profiles` table the old broken component used).
3. RLS: per Decision 2 — either leave `properties` policy as-is (assignment
   is a label only) or add a scoped policy so `role='agent'` only sees/edits
   rows where `assigned_agent_id = team_agents.id` for their own row, while
   `role='broker'` keeps full access.
4. Do **not** reuse `assign-leads`/`claim-lead` — those are `isa_leads`-specific
   and Make-only; build a small dashboard-native update instead (a direct
   Supabase update through the already-open/soon-scoped RLS policy is enough,
   no new edge function required for manual single-lead assignment).

### Phase D — Agent onboarding
1. Move `InviteAgentDialog` out from under the broken `/dashboard` route into
   a real page reachable from `/inrange` (e.g. a "Team" tab or
   `/inrange/team`), so brokers/admins can actually reach it in production.
2. Add a simple `team_agents` list/table on that same page (name, email,
   role, status, brokerage, market) with activate/deactivate — `invite-agent`
   already creates the row; this just needs a read view plus a status toggle.
3. No backend change needed — `invite-agent` already does the right checks
   and already sends Supabase's built-in invite email.

## 4. Validation plan (once approved)
- `npx tsc --noEmit -p tsconfig.json && npm run build` after every phase.
- Re-run the `properties` enrichment-status count query before/after a batch
  run to confirm rows actually moved out of `pending`/`skipped`.
- Confirm `team@joinjra.com` can: invite an agent, assign a property lead to
  that agent, and trigger enrichment on a single property, end to end, in a
  fresh browser session (not just via SQL).
- Check the shared edge-function changelog before/after deploying the new
  batch-enrichment function (shared repo, two active agents).

## 5. Rollback
- All new columns/functions are additive (new column, new function, new UI
  section) — nothing existing is deleted or overwritten. Rollback is: drop
  the new column, remove the new function, revert the frontend commit.
- No change to the currently-open `properties` RLS policy will be made
  without explicit approval, since narrowing it affects every agent's access
  immediately in production.
