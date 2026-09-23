# Shared edge function change log

This project's Supabase edge functions (`omzugrtgwsjypekuzgtn`) and Make.com
scenarios are actively modified by more than one agent working from this same
repo (Perplexity Computer and Claude Code). Both agents have direct deploy
access and can push a new function version without the other seeing it happen
in real time — there is no shared session, only this repo.

**Rule: before deploying any change to a shared edge function or Make
scenario, check this file for an entry from the other agent touching the same
function within roughly the last day. After deploying, add an entry here in
the same commit (or the next one) — don't rely on memory or the git log alone,
since a fast-follow deploy can otherwise silently overwrite unrelated work
(see the `ingest-leads` incident below, the reason this file exists).**

Append newest entries at the top. Keep each entry short: what function, what
changed, why, and what `verify_jwt` ended up as if that's part of the change.

---

## 2026-09-23 02:20 UTC — New fix plan: `docs/notes/2026-09-22-auth-dashboard-fix-plan.md` — Perplexity (assistant)
Not an edge-function change itself, but logging here so Claude Code sees it:
after a full audit of the live login flow (Supabase `auth_logs` showed
`team@joinjra.com` hitting repeated `invalid_credentials` then a forced
password reset, twice in 24h) plus a code read of every auth hook/component
and a `get_advisors` pass on the DB, wrote up a prioritized fix plan at
`docs/notes/2026-09-22-auth-dashboard-fix-plan.md`. **The user has only
asked for the plan to be written and shared — execution is NOT yet
approved.** Do not start on any item in that file until the user
explicitly says to proceed. Once that go-ahead comes, work through it
top-to-bottom —
it covers a likely-root-cause `autocomplete` bug on the password-reset
field, an open public self-signup gap, two anon-callable `SECURITY DEFINER`
functions, a pile of dead/duplicate auth hook files (some reference a
`check_rate_limit` RPC and `login_attempts`/`user_roles` tables that don't
exist in this DB — don't try to "fix" those, they're unreachable dead code,
delete them per the plan instead), two duplicate login pages, and a broken
logo asset. If you touch any edge function or Make scenario while working
through it, log that here as its own entry per this file's normal rule —
the fix-plan file itself is not a substitute for that.

## 2026-09-21 22:15 UTC — Vercel project `inrange-dashboard` renamed to `inrange-frontend` — Perplexity (assistant)
Not an edge-function or Make change, but logged here so Claude Code and any
other agent sharing this repo doesn't get confused by mismatched naming.
GitHub repo was earlier renamed `Make.com-claude-code` -> `INRANGE-FRONTEND`
(see commit e8c78568, this repo is the real, live InRange frontend deployed
to inrange.jetreadvisors.com). The linked Vercel project still carried the
old name and old deployment metadata/aliases (`make-com-claude-code-*`),
which could make an agent think there were two separate apps. Renamed the
Vercel project (`prj_nOePJcq0wPWzE7mxjvktOec2C3sO`, team
`central-station-33s-projects`) to `inrange-frontend` to match. Verified
after: custom domain `inrange.jetreadvisors.com` stayed attached/verified,
Git connection to `main` unaffected, no env vars or build/protection settings
touched. New system deployment URLs going forward use the
`inrange-frontend-*.vercel.app` pattern; old `make-com-claude-code-*.vercel.app`
historical URLs still resolve. See
`docs/notes/2026-09-21-vercel-project-rename.md` for full detail. If you're
about to reference "the make-com-claude-code Vercel project" — it's this
same project, just renamed.

## 2026-09-21 21:31 UTC — `ingest-leads` — fixed comma-in-name duplicate-match bug — agent unconfirmed (likely Claude Code)
Rewrote the duplicate-lookup query: PostgREST's `.or()` reads a bare comma as
a clause separator, and ACRIS-sourced names routinely contain one (e.g.
"SMITH, JOHN") — 552 of 627 leads had this on the day it was found. The filter
silently parsed into malformed clauses, duplicate lookups always returned
nothing, and every ACRIS bridge re-run re-inserted the same people. Fixed by
wrapping values in PostgREST's comma-escape syntax and switching to
case-insensitive `ilike` matching. `verify_jwt` ended up `true` on this
deploy — see the entry directly below for why that's a live collision with a
change made ~1 hour earlier by Perplexity Computer on the same function.
Known follow-up not yet done: matching is still name-only, not name+address,
so two different people sharing a name in the same segment/market can
collide (bounded by a per-lead try/catch, not silent data corruption, but
real — see the code comment in the function for detail).

## 2026-09-21 20:23 UTC — `assign-leads`, `ingest-leads`, `notification-status-` — verify_jwt gateway mismatch fix — Perplexity Computer
All three had `verify_jwt: true` at the gateway while their own code
implements custom `x-make-secret` header auth (matching every sibling
function in this pipeline) — the mismatch causes Make's calls to be rejected
before the function code ever runs. Same root cause already found and fixed
on `log-touch` earlier the same day. Redeployed all three with
`verify_jwt: false`, no code changes.

Confirmed real, high-impact for `assign-leads`: Make's own stored execution
sample showed `assigned: 0` before the fix; a live re-run afterward showed
162/162 active leads assigned, with the underlying `updated_at` writes timed
to the exact test window. This was previously a total, silent block on lead
routing to agents — S10 ("Daily Orchestrator") had run 14 times with 10
errors and had never actually assigned anyone.

For `ingest-leads` specifically, this fix was overwritten by the entry above
about an hour later — see that entry. Live testing after the overwrite
showed Make's actual header pattern (`Authorization: Bearer sb_publishable_…`
+ correct `x-make-secret`) still passes through cleanly regardless of the
`verify_jwt` value, meaning the gateway accepts that publishable-key header
as valid credential either way — so `verify_jwt` may not have been the real
blocker for this particular function to begin with, unlike `assign-leads` and
`log-touch` where the before/after behavior change was unambiguous.

## 2026-09-21 20:16 UTC — `log-touch` + Make scenario "ISA Notify Receiver" (id `5077766`) — verify_jwt mismatch + redundant touch-logging call — Perplexity Computer
Two-layered bug. Layer 1: `verify_jwt: true` mismatched against the function's
own `x-make-secret` auth, same pattern as above — fixed with
`verify_jwt: false`. Layer 2, found once layer 1 was fixed and the call could
reach the function: the calling scenario hardcoded `channel: "isa_notify"`,
which isn't a value the `lead_touches_channel_check` constraint allows,
and the call was semantically redundant besides — `notify-isa` already sets
`outreach_status = 'attempting'` on successful routing, so this was logging a
fake "contact attempt" for a lead that had only been routed, not contacted.
Fix: removed the `log-touch` HTTP module from the scenario entirely rather
than patch the constraint or the value. Confirmed via direct curl test and a
live scenario re-run (0 errors after, was erroring on ~85% of invocations
before).
