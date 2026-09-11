# InRange Project — Claude Code Context

## Existing Infrastructure (DO NOT duplicate these)
- **Database:** Supabase PostgreSQL — use this, not a separate DB
- **Backend:** Supabase Edge Functions — use these, not Render/Railway/Fly
- **Frontend/Dashboard:** the React app in this repo (`src/`) — Supabase Auth
  + PrivateRoute-gated pages, calling Supabase directly as a logged-in user.
  JetAdmin and Retool are retired (2026-09-08) — do not reintroduce either or
  build anything assuming they exist.
- **Automation:** Make.com (us2.make.com), team ID 1761681 — handles
  orchestration & scheduling. **This Make team also hosts "Silent Legacy,"
  an entirely separate, unrelated project (SEC EDGAR/Form D ingest, business
  registry, news RSS), confirmed isolated to Make folder ID 274107.** Never
  touch, reference, list-and-modify, or reason about Silent Legacy's
  scenarios when doing InRange work — the two must never be mixed. Any bulk
  action across this team's scenarios must explicitly exclude folder 274107;
  when in doubt about whether a given scenario is InRange's, check its name
  and folder before acting on it rather than assuming team-wide scope.
- **Code Storage:** GitHub (central-station-33/Make.com-claude-code)
- **AI:** Claude API via Anthropic

## Architecture
```
Make.com Scenarios
    ↓ (webhooks)
Supabase Edge Functions (scoring, normalization, AI enrichment)
    ↓
Supabase PostgreSQL Database
    ↑
React Dashboard (this repo's src/ — Supabase Auth, direct Supabase connection)
```

## Target Markets
- New York (NY) — NYC Open Data available
- New Jersey (NJ) — MOD-IV / NJOGIS data available

## Key Goals
- Find distressed properties (foreclosure, tax lien, probate, etc.)
- Find burnt out landlords (NY/NJ public data — free sources only)
- Score properties (composite 0-100, Tier 1-4)
- AI enrichment via Claude API (investment thesis, contact strategy)
- Notify subscribers of Tier 1 properties

## ISA Segment Priority (set 2026-09-08)
1. **Residential homeowners** — the main search
2. **Investors**
3. **Celebrities / athletes** (`athlete`, `film_tv`) — deliberately last; do
   not let these crowd out the residential pipeline

Renter/inbound segments (`renter`, `general_inquiry`) are unranked and default
to tier 2. Renters file no public record, so they arrive only via inbound
capture (`process-inbound-email`), never via a data source.

Encoded in `_shared/segment-priority.ts` and applied to the two *paid* paths:
Claude enrichment (`enrich-leads`) and skip tracing (`skip-trace-leads`).
Unlisted segments default to tier 2. `notify-isa` is deliberately NOT ranked
by segment — an already-enriched hot lead should reach an ISA on score.

## Free Data Sources in Use
- NYC Open Data (HPD violations, DOB, PLUTO, Evictions)
- NJ MOD-IV via NJOGIS ArcGIS API
- FEMA National Flood Hazard Layer
- NJ municipal open data portals (Newark, Jersey City, Trenton)

## Do NOT Suggest
- Render.com, Railway, Fly.io or any separate hosting
- Paid data sources (PropStream, BatchLeads, etc.) — **except** paid skip
  tracing for owner phone/email, explicitly approved 2026-09-08 (see below)
- Duplicate services that Supabase already provides

## Approved Exception: Paid Skip Tracing
Owner phone/email has no free bulk source (mailing address, yes; phone/email,
no). Outreach is call/email/social only — no mail campaigns — so this is
required, not optional. Vendor: BatchData (`skip-trace-leads` edge function).
This exception is scoped to phone/email contact resolution only; the "no
paid data sources" rule still applies everywhere else.

**Spend approval (set 2026-09-08, small account balance):** never trigger a
real (non-dry-run) skip-trace run without the user's explicit approval given
on two separate occasions. This is enforced in the function itself, not just
by convention — `skip-trace-leads` requires two separate calls (see its
header doc): a `propose` call that resolves the batch and spends nothing,
then a later `confirm` call presenting the token that call returned, which
is the only call that spends money. Never chain propose and confirm together
in one Make scenario run or one script — the gap between them is where the
user's second approval belongs. `dry_run: true` is free and requires no
approval at all.

## Always Ask Before Building
- Does this already exist in Make.com/Supabase/this repo's React dashboard?
- Can Supabase Edge Functions handle this instead of a separate server?
- What's the Supabase project URL for this feature?
