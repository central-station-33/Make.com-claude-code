# InRange

Distressed-property and seller-lead pipeline for Jet Realty Advisors, covering
New York and New Jersey. Free public records in, scored and AI-enriched leads
out, surfaced to ISAs for call/email/social outreach.

**Status: working data pipeline, not yet a working lead-generation product.**
It ingests and scores real public records. It has never produced a contactable
lead or logged a single outreach attempt. The gap between those two facts is
what the rest of this document is about.

All figures below were verified against the live database and Make org API on
**2026-09-12**. Re-verify before trusting them; several are moving targets.

---

## Architecture

```
Make.com scenarios (orchestration + scheduling, us2.make.com, team 1761681)
    │  HTTP + x-make-secret
    ▼
Supabase Edge Functions (ingest, normalize, score, AI enrich, notify)
    │
    ▼
Supabase Postgres  ◄──── React dashboard (src/, Supabase Auth + RLS)
```

Everything runs on Supabase and Make. There is deliberately no separate
application server — see `CLAUDE.md` for the standing constraints, including
the free-data-sources-only rule and the paid skip-tracing exception.

---

## What actually works

Verified by execution history and row counts, not by intent.

| Component | State |
|---|---|
| NYC ingest (HPD violations + evictions) | 11 runs, 0 errors |
| NJ county distress ingest (S1k) | 9 runs, 0 errors |
| NYC 311 / HPD / tax-lien ingest (S1b/c/d) | 1 run each, 0 errors |
| `process-raw-properties` normalize + score | Working; 861 of 861 raw rows processed |
| Claude enrichment (`enrich-leads`) | Working; 42 of 42 leads have `ai_summary` |
| Property → ISA lead bridges (S6, S19) | Run, with intermittent errors |
| React dashboard | 17 pages, Supabase Auth, RLS closed 2026-09-08 |

### What's in the database right now

```
properties           897     nj_mod_iv 450 · nyc_hpd 224 · nyc_evictions 175
raw_properties       861     all processed
isa_leads             42     31 homeowner · 11 athlete
owners                 0
contact_activities     0
deals                  0
```

Priority tiers, recalibrated 2026-09-12 so the cuts are real percentiles:

| Tier | Count | Share |
|---|---|---|
| Tier 1 | 49 | 5.5% |
| Tier 2 | 101 | 11.3% |
| Tier 3 | 290 | 32.3% |
| Tier 4 | 457 | 50.9% |

---

## What is missing for this to work in the real world

In dependency order. Items 1 and 2 are what separate "data project" from
"lead source"; nothing downstream matters until they're done.

### 1. There are no contactable leads — 0 of 42

`phone` and `email` are empty strings on **every** lead. `owner_phone` is empty
on all 897 properties; `owner_name` is present on only ~32%. Outreach is
call/email/social only (no mail campaigns), so today the pipeline's core
deliverable does not exist.

Skip tracing is built (`skip-trace-leads`, BatchData) and is the one approved
paid exception, but **it has never run** — `skip_trace_status` is null across
the board. It is deliberately gated behind two separate approvals (a `propose`
call that spends nothing, then a later `confirm` call), and the second approval
has never been given.

It also could not have worked if it had been. Contact fields were stored as `''`
rather than NULL — `ingest-leads` spread the Make payload wholesale on insert
(`"phone":"{{2.owner_phone}}"` resolves to `""`) and `normalizeProperty`
returned `formatPhone('') === ''`. Skip tracing selects targets with
`phone IS NULL`, so every such row read as "already has a phone" and was
permanently ineligible. Fixed 2026-09-12 in both writers and backfilled:
eligible targets went from 0 to 31 homeowner leads, and from 3 properties (all
three fabricated) to 291.

**Needed:** one real skip-trace run on ~25 Tier 1 leads. That produces the two
numbers the business cannot be planned without: contact-resolution rate and
cost per contactable lead. Without them you cannot price the product, forecast
ISA capacity, or answer a buyer's first diligence question.

### 2. Nothing has ever been contacted

`contact_activities` and `deals` are both empty. The funnel has never been run
end to end, so there is no evidence it converts — no answer rate, no
appointment rate, no cost per appointment.

**Needed:** one full outreach cycle logged, ideally one closed deal attributed
to the pipeline. That is the difference between a data asset and a lead source
with demonstrable ROI.

### 3. The distress premise isn't backed by distress data yet

Deal-type distribution across 897 properties:

```
Code Violation    596
Vacant Property   175
Other Distress    123
Foreclosure         3   ← all 3 are fabricated demo rows
```

There is **no real foreclosure, lis pendens, probate, or tax-lien data** in the
database. `auction_date` is null on every row, so the timeline-urgency scorer's
50-point auction branch can never fire. `amount_owed` is known on 149 of 897,
so equity is unknown for six rows in seven. What exists is code violations,
evictions and vacancy — genuine landlord-fatigue signals, but not the
foreclosure pipeline the project describes.

**Needed:** a real distress source. NY/NJ lis pendens and foreclosure filings
are county-level records, mostly not on open-data portals — this likely means
per-county scraping or a court-records feed, and is the single biggest data gap.

### 4. Fabricated rows are still in production

Three rows with `source = 'manual'` (invented owner names, round ARVs) were
written by the retired `seed-scores` dev script. After recalibration **two are
still in Tier 1**, scoring 37 and 33, and all three were Claude-enriched. Your
top-ranked leads include fake data. They should be deleted; deletion is
destructive so it hasn't been done unilaterally.

### 5. Three lead pipelines are broken on a real data fault

S4 (cash investor), S8 (divorce/estate) and S9 (empty nester) all query ACRIS
dataset `8h5j-fqxa` (Parties) for `doc_type` and `consideration`, which live in
Master (`bte7-2xhs`) as `doc_type` / `document_amt`. They return HTTP 400. The
owner name and the sale amount are in two different ACRIS tables and Socrata
cannot join across datasets, so these cannot be fixed inside a Make HTTP
module — they need an edge function that fetches Master then resolves Parties by
`document_id`. Diagnosis is recorded in each scenario's description.

### 6. Credits are a structural ceiling, not a nuisance

Make Core plan: **10,000 operations/month, 4,050 consumed**, resets
2026-09-21. Standing rule: no run without explicit approval, 250 operations max
per approved run.

The binding constraint is architectural. A Make `BasicFeeder` + per-record HTTP
module costs **one operation per record** — the retired S1h burned 502
operations in a single run. The same work inside an edge function's loop costs
**one operation total**. `ingest-nyc` and `ingest-nj-developer-leads` use the
cheap pattern; the NYC half of S7 and the S6/S19 bridges still use the
expensive one. At the current architecture, ingesting 10k properties/month
would exceed the entire plan.

**Needed:** move the remaining per-record feeders server-side before scaling
volume.

### 7. Enrichment spend is about to jump

`process-raw-properties` sets `enrichment_status = 'pending'` for Tier 1 **or**
Tier 2. Before recalibration that was ~0% of rows; it is now ~17% (150 of 897).
The next ingest will queue roughly 150 properties for paid Claude enrichment
instead of almost none. Nothing auto-runs today, so there is no surprise spend
yet — but this gate should be narrowed to Tier 1 before the next ingest.

### 8. Repo and deployment have drifted apart

- **20 functions exist in the repo but are not deployed**, almost all of a
  marketing/content surface that was never shipped: `ai-content-generator`,
  `ai-intent-research`, `ai-lead-capture`, `ai-search-monitor`,
  `publish-blog-post`, `publish-social-posts`, `scheduled-content-runner`,
  `seed-content-plan`, `send-sms`, `send-invitation`, `send-calculator`,
  `upload-brand-logo`, `upload-marketing-material`, `db-to-storage`,
  `delete-user`, `enrich-pending`, `handle-agent-interaction`,
  `notification-status`, `process-data-feed`, `send-auth-email`.
- **7 functions are deployed but absent from the repo**: `clever-handler`,
  `health-check`, `notification-status-` (note the trailing hyphen — a typo'd
  deploy shadowing `notification-status`), and the diagnostics `coop-diag`,
  `nyc-diag`, `rest-diag`, `secret-diag`.

Live code outside version control fails any diligence review. Decide per
function: commit it, delete it, or document it as a scratch diagnostic.

### 9. Scoring cannot improve without better inputs

With free public data only, the composite tops out in the low 40s: owner
phone/email never populate (costing 45 of contact-likelihood's 100), auction
dates never populate, and debt is usually unknown. The tier cuts are now
calibrated to that reality (32 / 28 / 25), but they are calibrated to *today's*
897-row NY/NJ mix and will drift as sources change. Re-run
`rescore-properties` with `{"dry_run": true}` and move the cuts when the mix
shifts materially.

Two columns are also unpopulated despite "find burnt out landlords" being a
stated project goal: `burnt_out_landlord_score` is computed by
`burnt-out-landlord-scan`, which has never been wired to a scenario and so has
never run, and `burnt_out_score` is computed by nothing at all.

---

## Make scenario inventory

Everything is `on-demand` — nothing fires on a schedule, by design, so that no
run happens without approval.

**Working:** NYC Ingest (HPD + Evictions), S1b/S1c/S1d NYC ingest, S1k NJ
county distress, Process Raw Properties, S2 AI Enrich + Notify, S6 Motivated
Seller Bridge, S19 High-Value Homeowner Bridge.

**Fixed 2026-09-12:** S7 Developer Leads (NYC DOB + the new NJ half), S10
Assign + Enrich orchestrator. Both had HTTP modules missing the mandatory
`followAllRedirects` plus five fields needing explicit values — the cause of
the `BundleValidationError: Validation failed for 6 parameter(s)` that made
every May-built scenario fail 100% of the time. Neither has had a successful
run yet; each needs one approved test run to confirm.

**Broken, diagnosed:** S4, S8, S9 (the ACRIS fault above).

**Archived:** S12 NJ Cash Investor (Zillow scraping — not a free public source,
against ToS), S13 Expat/Relo (paid Apify LinkedIn scraping — breaks the
no-paid-sources rule).

**Parked:** S1 + S5 (athlete), S3 + S11 (film/TV). `CLAUDE.md` ranks these
segments last and explicitly warns against letting them crowd out the
residential pipeline.

> Make team 1761681 also hosts **Silent Legacy**, an unrelated project isolated
> to folder ID 274107. Never include it in InRange work or in any team-wide
> bulk action.

---

## Repo layout

```
src/                      React dashboard (Vite + TypeScript + Tailwind + shadcn/ui)
  pages/                  17 pages; Supabase Auth with PrivateRoute gating
  integrations/supabase/   client.ts reads VITE_INRANGE_URL / VITE_INRANGE_KEY
supabase/functions/       43 edge function directories (30 deployed — see drift above)
  _shared/                scoring.ts, normalization.ts, cors.ts, supabase-client.ts,
                          segment-priority.ts
supabase/migrations/      9 migrations
CLAUDE.md                 standing project constraints — read before building
```

### Local development

```sh
npm install
npm run dev        # Vite dev server
npm run lint
npm run build
```

Required environment variables (both scopes in Vercel — a missing **Preview**
scope renders a blank white screen, because `createClient` throws at module
load before React mounts):

```
VITE_INRANGE_URL    Supabase project URL
VITE_INRANGE_KEY    Supabase publishable/anon key
```

Edge functions authenticate Make callers with the `x-make-secret` header
(`MAKE_WEBHOOK_SECRET`). Server-side work uses `SUPABASE_SERVICE_ROLE_KEY`.

---

## Operational rules that are enforced in code, not just convention

- **Skip tracing requires two separate approvals.** `skip-trace-leads` takes a
  `propose` call (resolves the batch, spends nothing) and a later `confirm`
  call presenting that call's token. Never chain them in one scenario run or
  one script — the gap between them is where the second approval belongs.
  `dry_run: true` is free.
- **No Make run without explicit approval**, 250 operations max per run.
- **Free data sources only.** Paid skip tracing for phone/email is the sole
  approved exception, scoped to contact resolution.

---

## Shortest path to a sellable product

1. Run skip trace on ~25 Tier 1 leads → get contact-resolution rate and cost
   per contactable lead.
2. Log one real outreach cycle → get answer and appointment rates.
3. Delete the fabricated rows.
4. Rewrite the ACRIS pipelines (S4/S8/S9) as an edge function.
5. Find a real foreclosure/lis-pendens source.
6. Move the remaining per-record Make feeders server-side.
7. Reconcile repo against deployed functions.

Distance to *internally useful for Jet Realty*: weeks. Distance to *sellable
product*: gated on items 1, 2 and 5 — on contact-data economics and conversion
proof, not on more code.
