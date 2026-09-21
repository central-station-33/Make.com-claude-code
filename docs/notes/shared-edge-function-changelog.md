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

## 2026-09-21 23:35 UTC — `enrich-leads` — derive `routing` from scores instead of trusting the model — Claude Code
No prior entry in this file touched `enrich-leads` — checked before deploying,
clear. The function computed `bant_score` correctly from the model's own
component scores, then separately trusted whatever `routing` string the model
also returned, if it was one of the four valid values. Checked against all
172 enriched rows at the time (162 live + 10 in a dedupe backup table):
151 agreed with the prompt's own stated routing rules, 21 didn't (12%) —
including identical duplicate rows (same `bant_score`, same
`motivation_score`) that came back with different `routing` on different
runs, which is what non-determinism in a business rule looks like from
outside. Fix: added `deriveRouting(bantScore, motivationScore)`, applying the
prompt's own four rules in code; the model's `routing` field is still
requested (prompt unchanged, `ENRICH_PROMPT_VERSION` not bumped) but no
longer read. Deployed v41, `verify_jwt: false` (matched what was already
there, no gateway change).

Backfilled the 19 already-wrong live rows from `bant_score`/`motivation_score`
already stored on each — no re-enrichment, no Anthropic spend. Re-checked
after: 162/162 agree, 0 violations. Two of the 19 corrections were `hot` →
`warm` demotions (`Andrew Thomas`, `Tremaine Edmunds`) that had already gone
out in the real "ISA Notify Receiver" emails sent per the entry above,
labeled `HOT` when the correct label was `WARM` — the notification itself was
correct to fire, the urgency label on those two was wrong at send time.
Noting it here rather than letting it go undocumented.

## 2026-09-21 23:31 UTC — `ingest-leads` — restored `verify_jwt: false` — Claude Code
Confirming the "agent unconfirmed" attribution two entries below: that was me.
I redeployed `ingest-leads` (the comma/ilike fix) without having seen this
file — it didn't exist in my working set yet — and preserved whatever
`verify_jwt` the function already had (`true`) rather than checking it against
convention, silently re-reverting the fix Perplexity Computer made for exactly
this function ~1 hour before mine (see the 20:23 UTC entry). Deployed v39,
`verify_jwt: false`, no code change from v38 — just the gateway flag, back to
matching every sibling function's custom `x-make-secret` auth. Caught this by
reading this changelog before a *different* deploy (`enrich-leads`) and
noticing my own earlier entry already existed, written by someone else,
describing a collision I hadn't known I'd caused. No code diff this time;
logging so the loop closes.

## 2026-09-21 23:15 UTC — Make scenario "ISA Notify Receiver" (id `5077766`) — added real email delivery — Claude Code
Built on top of Perplexity Computer's 20:16 UTC fix on this same scenario
(log-touch module removed) without yet knowing it was theirs — the blueprint
I read right before editing was already just webhook-in → webhook-respond,
which matches their fix exactly, so this is additive, not a collision: added
a `google-email:sendAnEmail` module between the two existing ones, using the
account's existing Gmail OAuth connection (`jtaffairs@gmail.com`, id
`11132254`), populated from fields `notify-isa` already assembles (name,
`ai_summary`, talking points, BANT/motivation scores, contact, commission
split) but had nowhere to send until now.

Separately found and fixed, not a shared-function code change but relevant to
anyone else touching this path: `notify-isa` marks a lead
`outreach_status = 'attempting'` as soon as the webhook call returns 200 —
and this receiver always returns 200 regardless of what (if anything) happens
downstream. So every notify attempt before this fix "succeeded" and
permanently removed the lead from the `'new'` pool `notify-isa` re-queries,
without anything ever being sent — this is presumably also why the pre-fix
receiver got away with doing nothing for as long as it did, nothing ever
errored. Reset the 23 leads (7 hot, 16 warm) this had already stranded back
to `'new'` and re-ran `notify-isa` for both routings: 23/23 sent, confirmed
against 23 individual Make executions (`status: 1, operations: 3` each), not
just the caller's own success count.

Known gaps, not fixed here: SMS and Slack are unbuilt (no Make connection
exists for either — `notify-isa`'s `sms_message` field is composed and
unused); the email step hardcodes the one connected address rather than
routing by the lead's actual `assigned_agent`, so this breaks silently the
moment a second agent exists.

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
