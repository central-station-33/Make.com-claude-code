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

## 2026-09-22 00:55 UTC — repo renamed `Make.com-claude-code` → `inrange-frontend` — Claude Code (at the project owner's direction)
Not an edge-function or Make-scenario change, but relevant to anyone working
from this repo by its old name: the GitHub repo this changelog lives in was
renamed from `Make.com-claude-code` to `inrange-frontend`. Reason: this repo
is the actual live InRange dashboard/frontend (`src/pages`, `src/routes`,
`src/integrations/supabase/inrange.ts` wired to `omzugrtgwsjypekuzgtn`,
deployed to Vercel project `make-com-claude-code` and aliased to the real
production domain, `inrange.jetreadvisors.com`) — the old name was a leftover
scaffold default (`package.json` still says `vite_react_shadcn_ts`) that hid
this from anyone looking for "the InRange frontend" by name, including this
session earlier in the day, which spent a round trip treating this repo's
Vercel deployment as a misconfiguration before reading its actual contents.

GitHub redirects the old name transparently for git and API access (verified:
both names resolved to the same commit during this change), so existing
clones and remotes using `Make.com-claude-code` keep working without
reconfiguration. This commit is itself the verification that the Vercel
Git integration survived the rename and still triggers a build — if you're
reading this in the deployed app, it did.

Old name for cross-reference: `central-station-33/Make.com-claude-code`.
Unrelated repos also named "InRange"-adjacent, for anyone else who hits the
same confusion this session did: `central-station-33/InRange` (backend
pipeline only, no frontend) and `central-station-33/nextjs-inrange` (a dead
`create-next-app` scaffold — not this repo, not deployed anywhere).

---

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
