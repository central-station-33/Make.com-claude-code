# Vercel project rename: inrange-dashboard -> inrange-frontend

Date: 2026-09-21

## Context
GitHub repo was previously renamed from `Make.com-claude-code` to `INRANGE-FRONTEND` (this repo is the real, live InRange frontend, deployed to inrange.jetreadvisors.com). The connected Vercel project still carried legacy naming (`inrange-dashboard`, with deployment metadata/aliases showing `make-com-claude-code`), which risked confusing future sessions/tools into treating them as separate apps.

## Change made
Renamed the Vercel project (prj_nOePJcq0wPWzE7mxjvktOec2C3sO, team central-station-33s-projects) from `inrange-dashboard` to `inrange-frontend` to match the GitHub repo name.

## Verified after rename
- Custom domain `inrange.jetreadvisors.com` remained attached and verified, no redirect/config changes.
- Git connection to `central-station-33/INRANGE-FRONTEND` (main branch) unaffected.
- No environment variables, build settings, or deployment protection settings were touched.

## Note for future sessions
Generated Vercel preview/production system URLs going forward will use the `inrange-frontend-*.vercel.app` pattern instead of the old `make-com-claude-code-*.vercel.app` pattern. Historical deployment URLs from before this rename remain unchanged and still resolve.

This commit itself also serves as a smoke test: it should trigger a new Vercel production deployment confirming the Git -> Vercel pipeline still works correctly under the renamed project.
