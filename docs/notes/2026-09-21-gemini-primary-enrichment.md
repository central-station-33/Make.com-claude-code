# 2026-09-21 — Gemini-primary enrichment rearchitecture + Make secret env-var bug

## What changed
Per the intended design ("all leads run through Gemini for enrichment, Anthropic
is backup only"), added two new edge functions and rebuilt Make scenario S2
(`InRange – ISA S2: AI Enrich + Notify ISA (All Segments)`, scenario id `5076848`)
to call Gemini first and only fall back to the existing `enrich-leads`
(Anthropic) function for whatever Gemini didn't successfully write.

- `supabase/functions/list-pending-enrichment/index.ts` (new) — returns the
  next batch of pending leads with prebuilt prompts, using the same
  segment-priority tiering as `enrich-leads`.
- `supabase/functions/write-enrichment/index.ts` (new) — writes a
  model-produced enrichment JSON to a single `isa_leads` row, applying the
  same clamp/validate logic as `enrich-leads`. Accepts JSON or
  `application/x-www-form-urlencoded` (the latter added because Gemini's
  free-text output can contain quotes/newlines that break a hand-built raw
  JSON body in Make, and Make has no reliable escape/formatJSON() function).
- Make blueprint (`make-blueprints/03-enrich-and-notify.json`) rebuilt as a
  7-module flow: list-pending-enrichment → feeder → Gemini (via Make's own
  `gemini-ai` connection, id `11136478`) → write-enrichment → enrich-leads
  (Anthropic backup pass, unchanged, runs after and only touches leads still
  missing `ai_summary`) → notify-isa (hot) → notify-isa (warm).
- Both new functions were deployed live to Supabase project
  `omzugrtgwsjypekuzgtn` and the Make scenario was updated live before this
  commit backfills the repo — same pattern as the prior "previously deployed,
  not yet committed" commits in this history.

## Bug found while testing: `{{env.MAKE_WEBHOOK_SECRET}}` stopped resolving
The first live test run of the new S2 flow failed immediately with
`401 Unauthorized` / `InvalidConfigurationError` on the very first HTTP module
(only 1 operation billed before the run stopped). The blueprint used
`{{env.MAKE_WEBHOOK_SECRET}}` for the `x-make-secret` header — the same
pattern used successfully in the *old* S2 blueprint as recently as
2026-09-09 (last successful run, status 1, 3 operations).

An existing scratch scenario in the same Make team, "ZZ Temp – Secret
Diagnostic" (scenario id `6185792`, last edited 2026-09-18), already works
around this by hardcoding the literal secret value directly in its header
instead of referencing the env var — strongly suggesting the Make
team-level environment variable `MAKE_WEBHOOK_SECRET` stopped resolving
sometime between 2026-09-09 and 2026-09-18, independent of this change.

**Fix applied here:** replaced `{{env.MAKE_WEBHOOK_SECRET}}` with the literal
secret value in all 5 HTTP modules of the S2 blueprint (matching the
workaround already in use elsewhere). This does not fix the underlying
Make env var — if it was silently dropped/renamed at the team/org level,
other scenarios still referencing `{{env.MAKE_WEBHOOK_SECRET}}` may hit the
same 401 until they're also patched or the env var is restored.

## Second bug found after the 401 fix: scenario reported success but wrote nothing

After the 401 was fixed, S2 ran with `status: 1` (success) every time, but a
SQL check showed zero `isa_leads` rows had `ai_model`/`ai_enriched_at` set —
the "successful" runs were writing nothing. Root-caused in three steps:

1. Added unconditional diagnostic logging to `write-enrichment` (writing every
   incoming call to `raw_properties`). It never fired, even on real S2 runs.
   Redirecting module 4's URL to a throwaway Make webhook confirmed the same
   thing outside Supabase entirely: **module 4 never fires**.
2. Isolating just `list-pending-enrichment → feeder → write-enrichment` (no
   Gemini in between) worked correctly — the feeder does iterate over real
   leads, and downstream HTTP modules do run for real. So the break was
   specifically between the feeder and module 4, i.e. at the Gemini module.
3. Removing the Gemini module's `onerror: Ignore` handler and re-running
   exposed the real error Make had been silently swallowing:
   `[402] Your prepayment credits are depleted.` — the Google AI Studio
   project behind the Make `gemini-ai` connection (`__IMTCONN__:11136478`)
   is out of prepaid billing credit. Per Make's own error-handler semantics,
   "Ignore" discards the *entire bundle* for a failing iteration before it
   reaches the next module — it does not pass an empty/placeholder value
   through. So with Gemini failing on every lead, module 4 (and everything
   chained after it, including the Anthropic backup and notify steps) never
   ran for any lead, while the scenario as a whole still reported `status: 1`.

**Fix required:** add funds/credits to the Google AI Studio project at
https://ai.studio/projects (billing action, needs account access — not
fixable from Make or Supabase). Once credits are restored, S2 should work
as designed with no further code changes.

**Bug fixed in `write-enrichment` while investigating:** its `isa_leads`
update used `.update(...).eq('id', leadId)` with no `.select()` — Postgrest
does not error on a zero-row match, so a bad/stale `lead_id` would silently
report `success: true` without writing anything. Now selects the updated row
and returns a `404` if nothing matched.

**Lesson for error handlers:** never attach `Ignore` to a module whose output
later modules depend on, unless you're fine with those bundles disappearing
silently. A `Resume` handler with an explicit fallback value (or removing
the handler so real failures surface) would have caught this immediately.

## Known gaps (flagged by Claude Code, 2026-09-21)
Repo `supabase/migrations/` currently has 19 files; the live Supabase
project reportedly has ~36 migrations applied directly, never committed.
This predates the changes in this commit. Anyone touching schema here
should re-pull the live schema before writing new migrations rather than
trusting this repo's migration history.
