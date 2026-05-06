# InRange Project — Claude Code Context

## Existing Infrastructure (DO NOT duplicate these)
- **Database:** Supabase PostgreSQL — use this, not a separate DB
- **Backend:** Supabase Edge Functions — use these, not Render/Railway/Fly
- **Frontend/Dashboard:** Retool — connects directly to Supabase
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
Retool Dashboard (direct Supabase connection)
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

## Free Data Sources in Use
- NYC Open Data (HPD violations, DOB, PLUTO, Evictions)
- NJ MOD-IV via NJOGIS ArcGIS API
- FEMA National Flood Hazard Layer
- NJ municipal open data portals (Newark, Jersey City, Trenton)

## Do NOT Suggest
- Render.com, Railway, Fly.io or any separate hosting
- Paid data sources (PropStream, BatchLeads, etc.)
- Duplicate services that Supabase already provides

## Always Ask Before Building
- Does this already exist in Make.com/Retool/Supabase?
- Can Supabase Edge Functions handle this instead of a separate server?
- What's the Supabase project URL for this feature?
