# Admin control, property enrichment, and lead assignment — fix plan

**STATUS: APPROVED AND EXECUTED — see "6. Execution summary" at the bottom
for exactly what was built, corrected, and verified. Decisions 1–3 in
section 2 were approved by the user in chat on 2026-09-23; Decision 4 was
resolved by user correction, not by this agent's original diagnosis (see
correction note on the `/dashboard` row below).**

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
| Frontend | `/dashboard` route (`Dashboard.tsx`) | **CORRECTION (2026-09-23, after user pushback):** this diagnosis row was wrong. `AppRoutes.tsx` lazy-loads `src/pages/Dashboard.tsx` for `/dashboard`, and that file is fully functional — it queries `properties` directly via the `inrange` client and renders the "InRange Pipeline / Property distress dashboard" the user confirmed live via screenshot (924 Total, 0 Enriched, 49 Pending, NY=444/NJ=471, Tier1=49/Tier2=69/Tier3=216/Tier4=590). The broken-looking components originally flagged (`src/components/dashboard/Dashboard.tsx`, `DashboardContainer.tsx`, `useLeadsQuery.ts`, `LeadAssignments.tsx`, `UnassignedLeadsTable.tsx`, `useAssignLead.ts`, `AssignLeadDialog.tsx`, `DashboardHeader.tsx`) are a **separate, genuinely dead/orphaned component tree** not reachable from any route — the mixup was reading that tree instead of the live `pages/Dashboard.tsx`. The practical conclusion still held: `DashboardHeader.tsx` (dead) was the only place `InviteAgentDialog` rendered, so agent invite had no reachable UI — fixed in Phase D below via a real `/team` route, not by touching `/dashboard`. | `AppRoutes.tsx`, `pages/Dashboard.tsx`, user screenshot confirmation | High |
| Frontend | `/inrange/leads` (`InRangeLeads.tsx`) | **This is the working page** — queries `properties` directly via the `inrange` Supabase client, matches the live schema, and is almost certainly what "InRange.jetreadvisors.com is working" refers to. It has status editing and filtering but **no agent-assignment field or enrichment trigger of any kind.** | `InRangeLeads.tsx` | High |
| Database | `properties.enrichment_status` (the 924 "raw" rows) | 875 `skipped`, 49 `pending`, 0 `complete`. No `assigned_agent_id` column exists on `properties` at all (only `deals.assigned_agent_id`, which only applies once a deal exists). | `execute_sql` count query, `list_tables` | High |
| Backend | `enrich-property` (per-property Claude enrichment) | `verify_jwt: true` — already safely callable from the browser with the signed-in user's session token. No batch mode; one property at a time. | `list_edge_functions` | High |
| Backend | `enrich-pending`, `process-raw-properties`, `rescore-properties` | `verify_jwt: false` at the gateway. `rescore-properties` enforces its own `x-make-secret` check in code; `enrich-pending` and `process-raw-properties` have **no auth check in code either** — currently callable by anyone who has the URL, not just Make. Not directly relevant to this request, but a real gap worth a follow-up (out of scope here unless you want it folded in). | function source + `list_edge_functions` | High |
| Backend | `assign-leads`, `claim-lead` | Fully working agent-assignment mechanism — but it operates on **`isa_leads`** (186 rows, the BANT-scored ISA pipeline), not on `properties`. Gated by `x-make-secret`, Make-only, no dashboard UI. This is not the same table as the 924 rows in question. | function source | High |
| Backend | `invite-agent` | `verify_jwt: true`, already checks caller is `role='broker'` via `team_agents` before creating the new `auth.users` row + `team_agents` row and sending Supabase's invite email. **CORRECTION:** the frontend dialog (`InviteAgentDialog.tsx`) was a stub — it had a `// TODO: Implement agent invitation logic` and only showed a fake success toast, never calling `invite-agent` at all. It was also only rendered inside the dead `DashboardHeader.tsx`, so it was doubly unreachable and non-functional. Fixed in Phase D below. | `invite-agent/index.ts`, `InviteAgentDialog.tsx` (before fix) | High |

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

## 6. Execution summary (2026-09-23, after approval)

All four decisions in section 2 were resolved: brokerage/name → fixed to
`Jet Realty Advisors` / `jet_realty`; agent access → restricted to own
assigned leads; enrichment trigger → both per-lead and bulk buttons;
`/dashboard` → confirmed working by the user, left untouched (see corrected
diagnosis rows above).

**Database (Supabase project `omzugrtgwsjypekuzgtn`):**
- Migration `properties_agent_assignment_and_rls`: added `properties.assigned_agent_id uuid references team_agents(id)` + index; replaced the single open `"auth all properties"` policy with `"brokers full access properties"` (is_broker()) and three agent-scoped policies (select/update/insert own `assigned_agent_id`).
- Migration `dedupe_agent_id_helper_use_existing`: discovered `current_team_agent_id()` already existed (identical to a helper I'd just added) and already backs the same pattern on `isa_leads`/`deals`/`lead_touches` — repointed the new `properties` policies at it and dropped the duplicate, so `properties` now follows the exact same access convention as the rest of the schema.
- `UPDATE team_agents SET full_name='Jet Realty Advisors', brokerage='jet_realty' WHERE email='team@joinjra.com'` — confirmed applied.
- `get_advisors` (security) re-run after both migrations: no new findings introduced beyond pre-existing informational ones (`ai_budget_tracker`/backup-table RLS-no-policy, `pg_net` extension location) — not part of this change.

**New edge function:** `enrich-properties-batch` (verify_jwt: true, v2 deployed with real code after an initial placeholder-content mistake was caught and corrected). Checks caller is `role='broker'` via `team_agents`, gates on the shared `ai_budget_tracker` via `increment_ai_budget_spend` (same RPC `enrich-leads` uses), enriches up to `limit` (default 10, max 25) pending/skipped properties with Claude Haiku 4.5, and records real per-call cost using Anthropic's published Haiku 4.5 rates ($1/$5 per MTok in/out, checked 2026-09-23 via [Claude's pricing page](https://platform.claude.com/docs/en/about-claude/pricing)). Deliberately does not call `enrich-property` internally (that function has no auth check and is also used by other automation) — duplicates its short prompt instead, so a batch-enriched row's `ai_analysis` shape matches a manually-enriched one.

**Frontend (`central-station-33/inrange-frontend`):**
- `InRangeAddLead.tsx` — manual "Add a Lead" insert now sets `assigned_agent_id` (self-assign for non-brokers, `null`/open for brokers), required so the new RLS `WITH CHECK` doesn't break manual lead creation.
- `src/hooks/useCurrentTeamAgent.ts` (new) — the signed-in user's own `team_agents.id`/role, used across the new UI.
- `src/components/inrange/AgentAssignSelect.tsx` (new) — shared agent-assignment dropdown.
- `InRangeLeadDetail.tsx` — broker-only assignment control, "Enrich now"/"Re-enrich" button (visible to brokers and the lead's assigned agent) calling `enrich-property`.
- `InRangeLeads.tsx` — `assigned_agent_id` column added to the query; broker-only per-row assign dropdown, "Unassigned only" filter toggle, and "Enrich pending" bulk button calling `enrich-properties-batch`.
- `Dashboard.tsx` (the live `/dashboard` route) — added the same broker-only "Enrich pending" bulk-enrich button to the header, since that's the page the user actually uses day to day.
- `InviteAgentDialog.tsx` — was a non-functional stub (TODO, fake success toast); rewired to actually call `invite-agent` with the full required payload (email, full_name, market, brokerage, role, optional phone/license).
- `InRangeTeam.tsx` (new page, `/team`) — broker-gated team roster (name, email, role, market, brokerage, YTD volume) with an active/probation/inactive status toggle, plus the fixed invite dialog. Added to `SidebarNav.tsx` under a new "Admin" section, visible only to brokers.

**Verification:**
- `npx tsc --noEmit -p tsconfig.json` — clean.
- `npm run build` — succeeds (no new errors; pre-existing chunk-size warning only).
- Database state re-queried after migration: `team_agents` row for `team@joinjra.com` confirmed `full_name='Jet Realty Advisors', brokerage='jet_realty', role='broker', status='active'`; `properties` policies confirmed matching the `isa_leads`/`deals` convention exactly.
- Not yet verified: an actual authenticated end-to-end pass (invite an agent, assign a lead, run both enrichment paths, confirm an agent only sees their own leads) — no browser session as `team@joinjra.com` is available to this agent; needs the user's own check or a follow-up session with local-browser access.
