# InRange Project — Claude Code Context

## Existing Infrastructure (DO NOT duplicate these)
- **Database:** Supabase PostgreSQL — use this, not a separate DB
- **Backend:** Supabase Edge Functions — use these, not Render/Railway/Fly
- **Frontend/Dashboard:** JetAdmin — connects directly to Supabase
- **Automation:** Make.com (us2.make.com) — handles orchestration & scheduling
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
JetAdmin Dashboard (direct Supabase connection)
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

## Always Ask Before Building
- Does this already exist in Make.com/JetAdmin/Supabase?
- Can Supabase Edge Functions handle this instead of a separate server?
- What's the Supabase project URL for this feature?
