# Anthropic budget tracker + pause switch (2026-09-21, later segment)

## What was built

A Supabase-side spend tracker for the Anthropic backup enrichment path, with
a hard pause switch, so Anthropic can never be run past a user-approved
monthly ceiling without an explicit review step.

- **Migration `create_ai_budget_tracker`** (applied to production,
  project `omzugrtgwsjypekuzgtn`):
  - `public.ai_budget_tracker` — one row per `(provider, period_start)`
    (calendar month). Columns: `cumulative_cost_usd`, `pause_threshold_usd`
    (default 15.00), `paused`, `paused_at`, `alert_sent`, `updated_at`.
  - `public.increment_ai_budget_spend(p_provider, p_period_start, p_amount)`
    — atomically adds `p_amount` to the period's spend, creates the row on
    first call in a new month (inheriting the prior period's threshold),
    flips `paused = true` once the threshold is crossed, and returns
    `just_paused` so the caller can detect the exact transition.
  - Seed row: `('anthropic', <2026-09-01>, 15.00)` — **user-approved
    threshold, $15/month**, confirmed explicitly before this migration was
    applied (an earlier attempt with an agent-inferred $5 default was
    correctly blocked by the platform's safety classifier as an unreviewed
    production change).

- **`enrich-leads` edge function (v33)** — budget-gated:
  - Checks `ai_budget_tracker` (read-only RPC call, `p_amount=0`) *before*
    touching `isa_leads` or calling Anthropic at all. If the current month
    is already paused, returns immediately with `skipped_reason:
    'budget_paused'` — no leads are queried, no Anthropic calls happen.
  - Computes real per-call cost from Claude's actual token usage
    (`callCostUsd()`), including cache read/write discounts, using Claude
    Sonnet 4.6 published rates ($3/M in, $15/M out, $0.30/M cache read,
    $3.75/M cache write — [Anthropic
    pricing](https://platform.claude.com/docs/en/about-claude/pricing)).
  - Mid-loop local check breaks the per-lead loop early once the run's
    running total would cross the threshold (`budget_tripped_mid_run`).
  - Post-loop, settles up with one atomic `increment_ai_budget_spend` call
    carrying the run's real spend — this is the only call that can flip
    `paused = true` in the DB.
  - Diagnostic snapshot (`raw_properties`, `property_hash =
    'diagnostic_enrich_leads'`) now also carries `budget`,
    `spent_this_run_usd`, `budget_tripped_mid_run`.

- **Hourly watcher** (Computer scheduled task, not a Make scenario): checks
  `ai_budget_tracker` for `provider='anthropic'`, current month; if
  `paused = true` and `alert_sent = false`, sends the user an in-app alert
  with the spend, threshold, and the exact `UPDATE` to resume, then sets
  `alert_sent = true` so it doesn't repeat.

## Resume procedure (also in the table's COMMENT)

```sql
UPDATE ai_budget_tracker
SET paused = false, alert_sent = false
WHERE provider = 'anthropic' AND period_start = date_trunc('month', now())::date;
```

A new row is created automatically at the start of the next calendar month,
inheriting the prior period's threshold.

## Live test result — budget tracker verified working, but no real enrichment happened

Ran S2 (`5076848`) live end-to-end (execution
`b1346cf640934eaab640bc061f7d1f15`, 2026-09-21T18:37:36Z–18:43:23Z,
`status: SUCCESS`) to confirm the deploy. Findings:

1. **Budget tracker itself works correctly.** The diagnostic snapshot shows
   `budget: {paused: false, cumulativeCostUsd: 0, pauseThresholdUsd: 15}` —
   correct shape, correctly not paused, correctly $0 spent (because nothing
   succeeded — see below).

2. **Anthropic 401 is still happening on every lead**, unchanged from the
   pre-budget-tracker diagnostic. All 50 leads in this run returned
   `Anthropic 401`. The user reported "Anthropic credit updated" earlier
   this segment, but a 401 (`authentication_error` — bad/expired/revoked
   key) is a different failure mode from a billing error (400
   `invalid_request_error` / occasional 402), so adding funds alone would
   not fix it ([Anthropic error
   reference](https://apistatuscheck.com/blog/anthropic-status-guide)). The
   `ANTHROPIC_API_KEY` Supabase secret itself needs to be rotated with a
   valid Console API key — this has NOT yet happened.

3. **Gemini (the primary, supposed-to-be-free path) is also still failing
   on every lead**, for the *same reason already root-caused in
   `2026-09-21-gemini-primary-enrichment.md`* earlier today: the Google AI
   Studio project behind the `gemini-ai` connection has depleted prepaid
   credits (402 "prepayment credits depleted" from
   `createACompletionGeminiPro`, confirmed again in this run's window via
   `executions_list`). That fix is a billing action at
   https://ai.studio/projects, not a code change, and it is still
   outstanding as of this run.

**Net effect: two full S2 runs today (16:14–16:22 and 18:37–18:43) each
processed 50 leads and wrote zero real enrichments**, because both the
primary (Gemini, billing) and backup (Anthropic, bad key) paths are
currently blocked by external account issues, not by scenario logic. The
scenario itself reports `status: SUCCESS` throughout, because every module
has an `onerror: Resume` handler — by design, so no lead is ever lost or
retried infinitely — but it means Make's own success/failure status cannot
be used to tell whether real work happened; only the `enrich-leads`
diagnostic row and `isa_leads.ai_enriched_at` can.

## Outstanding, both external to this codebase

- [ ] Rotate `ANTHROPIC_API_KEY` in Supabase project secrets with a valid,
      active Anthropic Console API key (not a Claude Pro/Max subscription
      login — those don't grant API access).
- [ ] Add prepaid credits to the Google AI Studio project behind the
      `gemini-ai` Make connection, or switch that connection to a
      differently-billed API key.

Until at least one of these is resolved, the hourly pause watcher above
will not have anything to alert on, since `cumulative_cost_usd` cannot
accumulate from calls that never succeed.
