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

## Known gaps (flagged by Claude Code, 2026-09-21)
Repo `supabase/migrations/` currently has 19 files; the live Supabase
project reportedly has ~36 migrations applied directly, never committed.
This predates the changes in this commit. Anyone touching schema here
should re-pull the live schema before writing new migrations rather than
trusting this repo's migration history.
