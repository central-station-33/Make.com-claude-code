# Shared edge function change log

This project's Supabase edge functions (`omzugrtgwsjypekuzgtn`) and Make.com
scenarios are actively modified by more than one agent working from this same
repo (Perplexity Computer and Claude Code). Both agents have direct deploy
access and can push a new function version without the other seeing it happen
in real time — there is no shared session, only this repo.

**Rule: before deploying any change to a shared edge function or Make
scenario, check this file for an entry from the other agent touching the same
target within roughly the last day. After deploying, add an entry here in
the same commit (or the next one, citing the first commit's real SHA) —
don't rely on memory or the git log alone, since a fast-follow deploy can
otherwise silently overwrite unrelated work (see the `ingest-leads` incident
in the legacy entries below, the reason this file exists).**

This is a good-faith protocol between two cooperating agents, not an
enforcement mechanism: neither agent can be blocked from deploying directly
to Supabase/Make outside of git, and every field below except `commit` and
migration filenames is self-attested. The structure exists to make
inaccurate or skipped entries cheap to spot after the fact, not to prevent
them.

## 20260925-03 — Texting consent by notice line (no checkbox)

- **respond-lead v45** (verify_jwt=false, x-make-secret): accepts JSON or form-urlencoded bodies. Strict boolean parsing for `sms_consent` (string "false" no longer counts as consent; consent requires a phone). New optional field `consent_notice_version`; exact notice text per version lives in `CONSENT_NOTICES`. Proof stored in `isa_leads.raw_data.consent_evidence` + `consent_history` (timestamp, source, version, text, page, phone). Consent gate otherwise unchanged. Deployed source matches repo byte-for-byte.
- **Make S16 (5089697)** module 2: switched body from hand-built JSON (broke on quotes/newlines, dropped consent/brand/UTM/rental fields) to form-urlencoded with 49 mapped fields, including `sms_consent`, `consent_source`, `consent_notice_version`, `brand`, UTM, and all rental/landlord detail. Modules 1, 3, 4 unchanged.
- **public-site forms**: checkbox removed; notice line above the button; hidden `sms_consent=true`, `consent_notice_version`, `brand=jra`.
- Tests: no secret → 401. Direct form-urlencoded call with consent → `consent_recorded=true`, notice text stored, rental detail + source event written, quote/newline preserved. Call with `sms_consent=false` → no consent, agent task created. Test rows deleted.
- Found, not changed: S16 webhook requires `x-make-apikey` header, so plain HTML forms get "Unauthorized."; `lead_touches_channel_check` rejects `website_form`, so web-form touch rows fail silently.
- Plan/notes: `docs/notes/2026-09-25-texting-consent-notice.md`.

## 20260925-02 — Brand-aware text signatures + brand-based access

- **follow-up-cadence v40** (verify_jwt=false, x-make-secret): signature and sending number now come from the lead's brand profile (`brands.sms_signature`, `brands.sms_from_number`, fallback env TWILIO_FROM_NUMBER). Removed hardcoded "Jet Realty Advisors" / "MVP Team, Solace Leasing". Leads whose brand is missing/paused are skipped. Consent gate unchanged (sms_consent=true, sms_opt_out=false). Eligible leads at deploy: 0.
- **respond-lead v43** (verify_jwt=false, x-make-secret): deployed v42 had diverged from the repo (v42 = STOP/opt-out handling, no consent gate, signed "— InRange"; repo = consent gate + leasing detail writes, never deployed). v43 merges both: STOP handling + opt-out carry-forward, consent gate (sms_consent or inbound SMS), rental_inquiries/landlord_leads/lead_source_events writes, and brand-profile signature appended in code. New optional payload fields: `brand_id` or `brand`/`brand_slug` ('jra','hlr'). No production auto-replies had ever been logged before this deploy.
- **Migration brand_access** (prod + test branch): `can_access_brand(uuid)` (security definer, authenticated only) and RESTRICTIVE "brand isolation" policies on isa_leads, properties, rental_units, exclusive_properties. Agents only see/write rows in brands where they have an active brand_members row; brokers unaffected; service role unaffected.
- Frontend: Add Lead and CSV import tag new properties with the active brand.
- Tests: branch fixture test (HLR-only agent 2/5 leads, cannot insert or move a lead into JRA; dual-brand agent 3; broker 6; anon 0; anon cannot call can_access_brand). Prod rolled-back check: broker 199 leads/924 properties/196 units/1 exclusive (unchanged); James agent 37 leads, 2 brands. Both functions return 401 without the secret.
- commit: 0d99b86

## Entry format (entries dated 2026-09-23T16:00Z or later)

Append newest entries at the top, immediately below this section, above the
"Legacy entries" divider.

<a id="entry-20260925-01"></a>
## [2026-09-25 11:40 UTC] database+frontend:brand-profiles — brand profiles, brand tagging, brand switcher — perplexity-computer
agent: perplexity-computer
entry-id: 20260925-01
target-type: migration
target-id: 20260925120000_brand_profiles.sql (applied to prod as brand_profiles_part1 + brand_profiles_part2)
window-check: yes
artifact: supabase-migration:brand_profiles_part1, brand_profiles_part2
commit: 65a81cb
status: done
related-entries: entry-20260924-11

User-approved scope: brand profiles + brand switcher only. One shared lead
engine; each brokerage is a brand. New tables `brands` (seeded: jra = Jet
Realty Advisors / NJ; hlr = MVP Team @ Highline Residential / NY) and
`brand_members` (team_agent x brand x license state; seeded James Thompson:
hlr/NY, jra/NJ). `brand_id` (NOT NULL, default `default_brand_id()` = jra)
added to isa_leads, properties, rental_units, exclusive_properties — added
with a constant default so existing rows were not UPDATEd. Solace (exclusive
property, 183 units, and any linked leads) -> hlr; everything else -> jra.
Trigger `sync_brand_from_exclusive` forces records with an
exclusive_property_id to carry that property's brand. RLS: brands visible to
brokers + member agents, writable by brokers only; anon denied. Pipeline
views (rental/landlord/residential_sale/distressed_investor/exclusive_leasing)
now expose brand_id (appended column; security_invoker kept).

NOT in scope / unchanged: row access on leads is NOT yet enforced by brand
(the switcher is a UI filter); Edge Functions still use hardcoded signatures
(follow-up-cadence v39: JRA / Solace) — brand-aware signatures are the next
step. Sharon Nickey (NY hlr + NJ jra) has no team_agents row yet, so no
brand_members rows for her. Re-tagging existing NY leads to hlr: pending.

Edge Functions that insert leads get jra by default — Make/functions that
should create Highline leads must pass brand_id (or exclusive_property_id).

Verified in prod (rolled-back test block): broker sees 2 brands / 199 leads;
James Thompson agent sees 2 brands, 37 leads, cannot edit brands; anon denied
on brands and brand_members; RLS on. Counts: jra 199 leads / 924 properties /
13 units; hlr 183 units / 1 exclusive property.

<a id="entry-20260924-12"></a>
## [2026-09-25 00:40 UTC] edge-function:follow-up-cadence — SMS consent gate + JRA/Solace branding — perplexity-computer
agent: perplexity-computer
entry-id: 20260924-12
target-type: edge-function
target-id: follow-up-cadence
window-check: yes
verify_jwt-before: false
verify_jwt-after: false
artifact: supabase-version:39
commit: 81c22db
status: done
related-entries: entry-20260924-11

User-approved TCPA fix. Baseline was the DEPLOYED v38 (which already had an
`sms_opt_out = false` filter that was never committed to the repo); the repo
copy is now brought in line. Changes: (1) query requires `sms_consent = true`
and `sms_opt_out = false`, plus an independent per-lead check; (2) signature
and "Reply STOP to opt out." (step 1) are appended in code — model is told not
to sign; (3) signature is "Jet Realty Advisors", or for `exclusive_leasing`
leads the property brand (Solace → "MVP Team, Solace Leasing"); an exclusive
lead whose property can't be loaded is skipped rather than mis-branded;
(4) renter/landlord/homeowner segment context and a Solace-specific context;
(5) Fair Housing rule added to the prompt; (6) Twilio non-2xx now counts as a
failure instead of silently marking the lead touched; (7) dry_run returns
message previews. verify_jwt stays false (auth is the x-make-secret header).

Verified: live endpoint returns 401 without/with wrong secret. Eligibility
under old rule = 5 leads (none with consent); under new rule = 0 — i.e. the
next scheduled run texts nobody until consent is captured. Not verified: an
authenticated dry run (Make secret not available to this agent), and which
Make scenario actually calls this function (header said S19, which is the
"High-Value Homeowner Bridge" scenario) — still unresolved.

<a id="entry-20260924-11"></a>
## [2026-09-25 00:30 UTC] database:exclusive-leasing-module — Solace exclusive module + 183 units — perplexity-computer
agent: perplexity-computer
entry-id: 20260924-11
target-type: migration
target-id: 20260924233000_exclusive_leasing_module_solace.sql
window-check: yes
artifact: supabase-migration:exclusive_leasing_module_solace
commit: 81c22db
status: done
related-entries: none

New module value `exclusive_leasing`; tables `exclusive_properties` (seeded:
solace) and `exclusive_property_agents`; `exclusive_property_id` on isa_leads
and rental_units (+ unit columns floor, outdoor_sf, roof_private_sf,
orientation, owner_advertised, staged, marketing_priority,
pricing_review_note); SECURITY DEFINER helpers `can_access_exclusive`,
`exclusive_of_lead/unit/inquiry`; RESTRICTIVE "exclusive isolation" policies
on isa_leads, rental_units, rental_inquiries, rental_matches, tours,
rental_applications, lead_tasks, lead_source_events (only bite on rows tied
to an exclusive); min-advertised-rent trigger; views
`exclusive_leasing_pipeline`, `exclusive_inventory_summary` (security_invoker).
Tested first on branch xqjinjjgeiupmccsdrkf. 183 Solace market units loaded
in prod from the owner tracker (confidential; seed SQL kept out of the repo).
Prod checks: broker sees 183 Solace units, non-team agent 0, anon 0; standard
13 units / 199 leads unchanged. Edge functions that insert leads do NOT yet
route to exclusive_leasing — intake wiring is a later, separately approved step.

<a id="entry-20260923-10"></a>
## [2026-09-24 00:03 UTC] edge-function:send-sms — fixed Twilio secret name, verified live send — perplexity-computer
agent: perplexity-computer
entry-id: 20260923-10
target-type: edge-function
target-id: send-sms
window-check: yes
verify_jwt-before: true
verify_jwt-after: true
artifact: supabase-version:2
commit: 2fe1cd8
status: done
related-entries: entry-20260923-09

Follow-up to entry-20260923-09. The user set Twilio secrets in the
Supabase Dashboard, but the actual secret name is `TWILIO_FROM_NUMBER`,
not `TWILIO_PHONE_NUMBER` as the rebuilt function assumed (confirmed by
a photo of the Dashboard's secrets list -- `TWILIO_ACCOUNT_SID` and
`TWILIO_AUTH_TOKEN` matched correctly). Changed the one `Deno.env.get(...)`
call in `send-sms/index.ts` to read `TWILIO_FROM_NUMBER`; redeployed as
version 2.

Verified with a real Twilio send: used a narrow, secret-header-guarded
diagnostic function (`send-sms-diag`) that does nothing but place one
Twilio API call with the project's own secrets -- no database access, no
user-session minting. First run (old secret name) correctly failed at the
secrets check; after the fix, a second run succeeded
(SID `SMdf367920ee5dd2f9d9025f9d761fad1c`, status `queued`) to a number the
user provided for this test. The diagnostic function was deployed, used
once, and overwritten with a disabled 410 stub immediately after each run
-- it is not left active. A related diagnostic that would have minted a
real broker session was stopped by a safety check before it could be used
and was disabled without ever running; see the session's own report for
detail, not repeated here.

Still open (unchanged from entry-20260923-09): `sms_consent` is NULL on
all 186 existing `isa_leads` rows, so no real lead can be texted yet
through the actual function until a consent-capture step exists or the
user decides otherwise; and no UI entry point renders `SMSMessaging` yet.

<a id="entry-20260923-09"></a>
## [2026-09-23 23:39 UTC] edge-function:send-sms — rebuilt from scratch against isa_leads + lead_touches — perplexity-computer
agent: perplexity-computer
entry-id: 20260923-09
target-type: edge-function
target-id: send-sms
window-check: yes
verify_jwt-before: n/a (function did not exist -- never deployed)
verify_jwt-after: true
artifact: supabase-version:1
commit: afed58a
status: done
related-entries: entry-20260923-08

Old `send-sms` (never deployed, dead code) targeted a `text_messages` table
that doesn't exist in this schema. Rebuilt against tables that already
exist and fit: `isa_leads` (phone, sms_consent, sms_opt_out,
assigned_agent_id) and `lead_touches` (channel enum already includes
'sms', RLS already scopes it to the lead's assigned agent or a broker).
No migration needed.

New function: reads phone from isa_leads server-side (never trusts a
client-supplied number), gates access to the assigned agent or a broker,
refuses to send if sms_opt_out is true or sms_consent is not true,
normalizes phone to E.164 for Twilio, and writes one lead_touches row
(channel='sms') per attempt whether the Twilio call succeeds or fails.
CORS/response helpers inlined directly in index.ts rather than imported
from `_shared/cors.ts` -- the deploy tool used for this deploy couldn't
resolve that relative import ("Module not found"), even though the same
import resolves fine for `invite-agent`; inlining sidesteps it.

Deployed as version 1 (function did not exist before -- every production
call to the old caller code was a 404). Verified live via curl: OPTIONS
preflight returns 200 with full CORS headers; POST without auth returns 401
(`UNAUTHORIZED_NO_AUTH_HEADER`) before reaching function code, consistent
with `verify_jwt: true`.

Frontend also rebuilt in the same commit: `useSMSMessaging`,
`SMSInput`/`SMSList`/`SMSMessaging` now read/write `lead_touches` instead
of the old table, and no longer collect a phone number in the UI (it's
looked up server-side from isa_leads, closing a consent-bypass path the
old design had). The `SMSMessaging` component still has no page that
renders it -- that's a separate, not-yet-approved scope decision, not part
of this entry.

**Not yet functional end-to-end, by design, pending two decisions the user
still needs to make (see the plan/report delivered alongside this entry):**
1. `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` are
   not set as Supabase secrets on this project -- no MCP tool exists to set
   them, so this needs the user to add them directly (Supabase Dashboard
   or CLI), not this agent.
2. `sms_consent` is NULL on all 186 existing isa_leads rows -- the send
   path will refuse every one of them until either a consent-capture step
   populates that column, or the user explicitly decides to relax the gate
   (not recommended -- TCPA risk).

```
<a id="entry-YYYYMMDD-NN"></a>
## [timestamp] target-type:target-id — one-line summary
agent: claude-code | perplexity-computer | unknown
entry-id: YYYYMMDD-NN
target-type: edge-function | make-scenario | migration | code-only | other
target-id: <canonical id>
window-check: yes | no
verify_jwt-before: <true|false|n/a>
verify_jwt-after: <true|false|n/a>
artifact: <checkable proof, see table below>
commit: <sha>
status: done | in-progress | abandoned
related-entries: <anchor ids, if any>

Free-text body as before: what changed, why, what was verified, follow-ups.
```

Field notes:

- **`agent`** — never guess. If it's genuinely unclear which agent made a
  change, use `unknown` rather than a hedge like "likely Claude Code" — an
  explicit `unknown` can be grepped for and flagged later; a guess reads as
  settled and can't be.
- **`target-id`** must be the canonical identifier, not a display name:
  edge function → its deploy/directory name; Make scenario → its numeric
  scenario ID, not its title (titles get renamed — see the 2026-09-21
  Vercel-project-rename entry below for how confusing that can get);
  migration → the migration filename.
- **`window-check`** is a self-attested yes/no on whether you actually
  checked this file for `target-id` in roughly the last 24h before
  deploying. It doesn't enforce the check — it makes a skipped check
  visible instead of silent.
- **`artifact`** is a checkable proof, per target type:

  | target-type | artifact | how it's verified |
  |---|---|---|
  | edge-function | `supabase-version:<N>` | `list_edge_functions`/`get_edge_function` against live state |
  | migration | the migration filename | exists in `supabase/migrations/` by construction |
  | make-scenario | scenario ID + modules touched | `scenarios_get` against the live blueprint (weakest leg — Make has no clean version primitive) |
  | code-only | commit SHA | `git show <sha>` |

  For anything with a code commit, prefer committing the actual change
  first and the changelog entry second, citing the first commit's real SHA
  — avoids citing a commit that doesn't exist yet.
- **`status: in-progress`** is for a multi-step effort spanning a plan doc
  and several deploys (one entry per *effort*, updated as work lands) — not
  a per-deploy pre-announcement ritual. There's no live channel between
  agents, so a per-deploy "claiming X" entry would only help if the other
  agent happens to read it in the exact gap between deploy and changelog
  commit — not meaningfully more likely than it reading the after-the-fact
  entry already required above. Not worth the overhead on every deploy.

---

<a id="entry-20260923-08"></a>
## [2026-09-23T23:02Z] edge-function:invite-agent — fixed missing CORS handling (OPTIONS + json() headers)
agent: perplexity-computer
entry-id: 20260923-08
target-type: edge-function
target-id: invite-agent
window-check: yes
verify_jwt-before: true
verify_jwt-after: true
artifact: curl OPTIONS + POST against live function, both showing Access-Control-Allow-Origin
commit: 46d0280
status: done
related-entries: entry-20260923-07

`invite-agent` had no `OPTIONS` handling and its local `json()` helper never
attached CORS headers, so the newly-wired `InviteAgentDialog` (fixed in
entry-20260923-07) would hit a browser CORS block on the real invite call
even though the function itself worked fine when called directly. Added
`if (req.method === 'OPTIONS') return handleOptions();` as the first line
inside `serve()`, and updated `json()` to spread `...corsHeaders` into its
response headers -- reusing the existing `supabase/functions/_shared/cors.ts`
helpers already used by `enrich-property`, rather than adding a new local
corsHeaders block (avoids yet another duplicate, same lesson as the
`current_team_agent_id()` dedup in entry-20260923-07).

**Deploy note:** the first two `deploy_edge_function` calls in this fix
accidentally shipped placeholder-content test payloads (v11, v12) before
the real code went out as v13 -- caught and corrected within the same few
seconds, verified curl output below is against the final v13.

Verified live: `curl -X OPTIONS .../invite-agent` -> `200` with
`access-control-allow-origin: *`, `-allow-headers`, `-allow-methods` all
present; `curl -X POST .../invite-agent` with no auth -> clean `401 JSON`
(gateway-level, before my code even runs) still carrying
`access-control-allow-origin: *`. Did not touch any other function --
a broader sweep found ~20 other functions in this repo missing the same
`_shared/cors.ts` import (`assign-leads`, `claim-lead`, `enrich-leads`,
`rescore-properties`, several `ingest-*` functions, etc.), but most of
those are Make-only/server-to-server and not called from a browser, so I
left them unchanged pending confirmation of which ones are actually
browser-facing.

---

<a id="entry-20260923-07"></a>
## [2026-09-23T22:10Z] migration+edge-function:properties_agent_assignment_and_rls, enrich-properties-batch — executed the approved admin/enrichment/assignment plan
agent: perplexity-computer
entry-id: 20260923-07
target-type: migration
target-id: properties_agent_assignment_and_rls, dedupe_agent_id_helper_use_existing, enrich-properties-batch
window-check: yes
verify_jwt-before: n/a (new function)
verify_jwt-after: true
artifact: apply_migration success + get_advisors clean + npm run build clean
commit: 4a5b325
status: done
related-entries: entry-20260923-06

Executed the plan persisted in entry-20260923-06 after full user approval.
Applied two Supabase migrations directly (not checked in as SQL files --
noted here per protocol): added `properties.assigned_agent_id` + index,
replaced the single open `properties` RLS policy with broker-full-access +
agent-own-rows-only policies. Discovered `current_team_agent_id()` already
existed (identical to a helper I'd added) and already backs this exact
pattern on `isa_leads`/`deals`/`lead_touches` -- repointed the new policies
at it and dropped my duplicate in a follow-up migration, so `properties`
now matches the existing schema convention exactly. Fixed
`team@joinjra.com`'s `team_agents` row (full_name/brokerage) per approval.
Deployed new edge function `enrich-properties-batch` (verify_jwt:true,
broker-gated, shares the `ai_budget_tracker`/`increment_ai_budget_spend`
gate with `enrich-leads`) -- v1 was deployed with placeholder content by
mistake and immediately corrected to v2 with the real code before any
traffic. Did not touch `enrich-property`, `enrich-pending`,
`process-raw-properties`, `rescore-properties`, `assign-leads`, or
`claim-lead` -- all pre-existing gaps/behavior on those are unchanged.
Frontend changes (InRangeAddLead/Leads/LeadDetail/Team/Dashboard/SidebarNav,
new AgentAssignSelect/useCurrentTeamAgent, fixed InviteAgentDialog stub) are
in the same commit. `npx tsc --noEmit` and `npm run build` both clean.
See `docs/notes/2026-09-23-admin-enrichment-assignment-plan.md` section 6
for the full execution summary, including the corrected `/dashboard`
diagnosis (it was never broken -- a separate dead component tree was
misread as the live route in the original plan).

---

<a id="entry-20260923-06"></a>
## [2026-09-23T21:45Z] code-only:docs/notes/2026-09-23-admin-enrichment-assignment-plan.md — persisted PLAN ONLY doc, no code/infra change
agent: perplexity-computer
entry-id: 20260923-06
target-type: code-only
target-id: docs/notes/2026-09-23-admin-enrichment-assignment-plan.md
window-check: yes
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: plan doc only, no deploy
commit: 6ffd439
status: in-progress
related-entries: n/a

User asked for a plan to give team@joinjra.com full admin control, add
dashboard enrichment of the 924 `properties` rows, add lead-to-agent
assignment on `properties`, and agent onboarding. Diagnosed current state
(team@joinjra.com already has broker-level access via team_agents +
properties RLS; /dashboard route is broken against the live schema;
/inrange/leads is the working page; no assigned_agent_id on properties;
assign-leads/claim-lead target isa_leads, not properties). No code, schema,
edge function, or RLS change made — plan doc only, pending user decisions
and approval. See the plan doc for the diagnosis table and phased proposal.

---

<a id="entry-20260923-05"></a>
## [2026-09-23T22:05Z] code-only:AuthFormContext — root-caused the Set Password silent-failure bug from entry-20260923-04
agent: claude-code
entry-id: 20260923-05
target-type: code-only
target-id: src/contexts/auth/AuthFormContext.tsx, src/hooks/useAuthFormState.ts
window-check: yes
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: `npx tsc --noEmit` clean, `npx vite build` clean
commit: 30d5b3e
status: done
related-entries: entry-20260923-04

Root cause of the "Set Password button does nothing" bug logged in
entry-20260923-04: `AuthFormContext.tsx` mounted two independent state
hooks — `useAuthFormState()` (root, `src/hooks/useAuthFormState.ts`) and
`useAuthFormProvider()` (which internally mounts its own
`src/hooks/auth/useAuthState.ts`). The context exposed `isLoading`,
`error`, and `success` from the *first* hook, but every handler that
actually calls Supabase (`handleSignIn`, `handleForgotPassword`,
`handleResetPassword`, all wired through `useAuthFormProvider`) updates the
*second* hook's state instead. Net effect: `supabase.auth.updateUser()`
genuinely ran and succeeded (matches the two 200s logged in
entry-20260923-04), but the `isLoading`/`success`/`error` values every
consumer component reads (`ResetPasswordForm`, `SignInForm`) never moved —
no spinner, no success alert, no inline error, on both the password-reset
form and the ordinary sign-in form. Toasts fired independently (a separate
global store, unaffected by this), which is likely why the very first
successful submission wasn't obviously silent, and later ones were.

Fix: `AuthFormContext.tsx` now sources `isLoading`/`error`/`success` from
`authFormProvider` (the hook instance the handlers actually update) instead
of the disconnected `authState`. Removed the now-dead `isLoading`/`error`/
`success` state from `src/hooks/useAuthFormState.ts`, which after this fix
only tracks `email` and the rate-limit fields (those were left alone —
still sourced from the same hook on both sides, not part of this bug, and
out of scope here).

**Not fully closed**: this explains and fixes the "succeeded but showed
nothing" pattern. It does not explain the separate report of *zero*
`/auth/v1/user` network activity on later attempts, even after manually
retyping both password fields — that could not be root-caused without
browser console access, which wasn't available. If it recurs post-fix, the
button will now at least show a real spinner or error, which should make
the next occurrence far easier to diagnose.

<a id="entry-20260923-04"></a>
## [2026-09-23T21:30Z] code-only:auth-reset-flow — Priority 0 reset+login cycle confirmed; new domain finding; new open bug
agent: claude-code
entry-id: 20260923-04
target-type: code-only
target-id: src/components/auth/ResetPasswordForm.tsx, src/pages/Settings.tsx
window-check: yes
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: two `PUT /auth/v1/user` 200 responses in auth_logs
  (2026-09-23T21:11:13Z, 2026-09-23T21:29:57Z) plus the user's confirmation
  that logging in with the resulting password worked
commit: n/a — findings only, no code change in this entry
status: done
related-entries: entry-20260923-03

Closes fix-plan Priority 0's outstanding closing step (see this doc's
sign-off checklist and top-of-doc status note): the user completed a real
password-reset + login cycle end-to-end and it worked. Two things surfaced
during this test worth recording:

1. **A second, distinct root cause behind the recurring 404s**, beyond the
   Vercel Git-connection outage in entry-20260923-03:
   `claude-code-inrange.vercel.app`, the domain several reset emails
   redirected to, is not registered to this Vercel project at all
   (confirmed via `list_project_domains` — the project's only domain is
   `inrange.jetreadvisors.com`; the auto-generated fallback would be an
   `inrange-frontend-*.vercel.app` URL, not this). It 404s unconditionally,
   on any path. Most likely explanation: it was Supabase's Site URL at some
   earlier point (before the user corrected it to
   `https://inrange.jetreadvisors.com/`), baked permanently into any
   recovery email sent before that correction — those old links can't be
   fixed retroactively. A fresh `/recover` call placed during this session
   (2026-09-23T21:01:05Z, correct referer and `redirect_to`) is what
   finally led to the two successful `PUT /auth/v1/user` calls above.
2. **New, unresolved bug**: on a repeat visit to `/auth/reset-password`
   after a successful submission, the "Set Password" button stopped
   responding to clicks — no `/auth/v1/user` request reached Supabase at
   all. Ruled out: validation (user confirmed both password fields matched
   and all 5 requirement checks were green), and React/autofill state
   desync (button still didn't respond after manually deleting and
   retyping both fields by hand). Not diagnosed further — needs browser
   console output from the affected session, which wasn't available. Does
   not block Priority 0 (login already confirmed working with a password
   set via an earlier, successful submission on the same page), but is a
   real defect someone should reproduce with devtools open.

<a id="entry-20260923-03"></a>
## [2026-09-23T18:55Z] other:vercel-deploy — GitHub-Vercel Git connection was disconnected, reconnected
agent: claude-code
entry-id: 20260923-03
target-type: other
target-id: vercel-project:prj_nOePJcq0wPWzE7mxjvktOec2C3sO
window-check: n/a
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: deployment dpl_5dNv19EKaYXzvWCFzFtdP3QBrLZr (created 2026-09-22,
  before this fix) vs. the deployment this commit's push should trigger —
  compare `githubCommitSha` on each via `list_deployments`/`get_deployment`
commit: 4d7dbd1 (the fix-confirming push; see body for the full chain)
status: done
related-entries: entry-legacy-20260921-2215

Not an edge function or Make scenario, but a real production incident
worth recording here: discovered mid-session that `inrange.jetreadvisors.com`
was serving a stale build from commit `89e2ba7` (a since-closed PR branch,
`claude-code/log-rename-inrange-frontend`) — every commit made in this
session (today, 2026-09-23) had merged to `main` but never deployed.
Root cause: the Vercel project's Connected Git Repository (Project Settings
→ Git) had no repository connected at all — confirmed visually, the page
showed the "choose a provider" picker, not a connected-repo state. Given
this repo's own history of renames (`Make.com-claude-code` →
`inrange-dashboard` → `inrange-frontend`, logged in the legacy entries
below), the connection likely broke silently during one of those renames
and nobody caught it since manual "Redeploy" on an old deployment still
appeared to work (it just rebuilds the same stale commit, which looks
successful in the dashboard without being new).

User reconnected GitHub → `central-station-33/inrange-frontend` in the
Vercel dashboard. Reconnecting alone doesn't retroactively deploy anything
already merged — it only re-arms the webhook for future pushes.

Took two attempts: the first "Connected it" report turned out to be the
Vercel *account's* GitHub sign-in method (Settings → Authentication —
already connected, unrelated to deployments), not the *project's* Connected
Git Repository (Settings → Git, under this project specifically) — easy to
conflate since both show a GitHub icon. A push made between the two
attempts (commit `d8a5283`) triggered nothing, confirming the first
attempt hadn't actually linked the project. The project's `updatedAt`
timestamp changed only after the second attempt, which is what this
commit's push is testing. **Confirmed fixed.** The push carrying this entry's own prior revision
(`4d7dbd1`) triggered `dpl_CnFFj3iQG1zf2H4gdtgWhcwakYks` — `source: "git"`,
`githubCommitRef: "main"`, built and reached `READY` in ~14 seconds, and
its `alias` list includes `inrange.jetreadvisors.com`. Auto-deploy on push
to `main` is confirmed working again. Every commit from this session
(2026-09-23) is now actually live, not just merged.

<a id="entry-20260923-02"></a>
## [2026-09-23T16:50Z] other:auth-config — leaked-password protection enabled, closing fix-plan item 7
agent: claude-code
entry-id: 20260923-02
target-type: other
target-id: auth-config
window-check: n/a
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: n/a — self-reported by the user, not independently verified; no
  available tool exposes Supabase Auth config (Authentication → Providers →
  Email → "Prevent use of leaked passwords") to confirm it programmatically
commit: n/a
status: done
related-entries: entry-legacy-20260923-0305

Not a code or deploy change — logged here anyway since this file is the
cross-agent coordination point and the setting lives on the same Supabase
project. Closes `docs/notes/2026-09-22-auth-dashboard-fix-plan.md` item 7:
the user enabled "Prevent use of leaked passwords" (checks new passwords
against HaveIBeenPwned) directly in the dashboard. Worth a correction for
whoever reads this next: the fix-plan doc originally pointed at
Authentication → Policies for this — that's wrong, Policies is Postgres
RLS, not Auth. The real location is Authentication → Providers → Email.

<a id="entry-20260923-01"></a>
## [2026-09-23T15:40Z] code-only:send-auth-email — deleted dead edge function, completing item 12
agent: claude-code
entry-id: 20260923-01
target-type: code-only
target-id: supabase/functions/send-auth-email
window-check: yes
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: commit:8cab3a7
commit: 8cab3a7
status: done
related-entries: entry-legacy-20260923-0305

`docs/notes/2026-09-22-auth-dashboard-fix-plan.md` item 12 called
`supabase/functions/send-auth-email/` dead code (absent from
`list_edge_functions`, i.e. never deployed) and asked for it to be deleted
alongside `src/utils/emailUtils.ts`. The legacy entry linked above logged
both as done, but only `emailUtils.ts` had actually been removed — this
repo's review (PR #24) caught the miss. Re-confirmed before deleting: no
references to `send-auth-email` or `sendAuthEmail` remain anywhere in
`src/` or `supabase/functions/` (grep clean). Item 12 is now fully closed.

---

**The five entries below (20260922-02 down to 20260921-01) are backfilled.**
They document real events from 2026-09-21/22 that were originally written up
as prose in PRs #22 and #23, opened as separate branches before this file's
v2 restructure landed and never merged. Merging either as-is would have
silently placed old-format entries inside the "Legacy entries" section below,
so instead their content is reproduced here in the current structured format
— condensed for the header fields, otherwise preserved as originally
written — and both PRs were closed once this landed. `commit` is `n/a` on
these because the underlying actions (Supabase deploys, a Make scenario
edit, a GitHub repo rename) never had a corresponding commit in this repo;
only this backfill commit does.

<a id="entry-20260922-02"></a>
## [2026-09-22T03:00Z] other:repo-naming — naming mismatch found, changelog merge-conflict resolved
agent: claude-code
entry-id: 20260922-02
target-type: other
target-id: repo-naming
window-check: n/a
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: n/a — see body; no single checkable artifact for a naming discrepancy
commit: n/a
status: in-progress
related-entries: entry-20260922-01

Not an edge-function or Make change. Third naming action on this repo/Vercel
project pair in about 6 hours — confusing enough to need its own entry.

What was true at the time, verified directly (GitHub API + a real clone +
live Vercel deployment metadata, not narrative): the GitHub repo was at that
point named `inrange-dashboard`, not `inrange-frontend` — renamed again by
Perplexity per commits `72c4c89` and `81e3e22` on `main` (real timestamps
~02:17–02:19 UTC 2026-09-22 per `git log`, not the "2026-09-21 22:15 UTC"
the legacy entry below states — that header appears mislabeled by about 4
hours plus a day, though the action it describes is real). The Vercel
project's own display name was `inrange-frontend` at the same time — so
GitHub and Vercel disagreed, just swapped from before.

The legacy entry below also states the Vercel project's pre-rename name was
`inrange-dashboard`; that didn't reconcile with this session's own repeated,
direct observation that `get_project` on the same project id
(`prj_nOePJcq0wPWzE7mxjvktOec2C3sO`) returned `make-com-claude-code`
continuously, right up until it changed to `inrange-frontend` immediately
after the GitHub rename logged in the entry below. Not asserting the legacy
entry was wrong — the two accounts didn't line up, flagged for whoever
sorted it out next.

Reported to the project owner at the time; no further rename was made
unilaterally. As of this backfill (2026-09-23), the repo is confirmed named
`inrange-frontend` per this session's own context — the immediate confusion
resolved itself one way or another, but whether the underlying GitHub/Vercel
naming discrepancy was ever actually reconciled, versus the names just
happening to agree now, was never confirmed in this file. Left `status:
in-progress` for that reason rather than backfilling it as `done`.

<a id="entry-20260922-01"></a>
## [2026-09-22T00:55Z] other:repo-rename — GitHub repo renamed Make.com-claude-code → inrange-frontend
agent: claude-code
entry-id: 20260922-01
target-type: other
target-id: repo-rename
window-check: n/a
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: n/a — see body; verify by the repo's current name/redirect behavior, not a SHA
commit: n/a
status: done
related-entries: entry-20260922-02

At the project owner's direction. Not an edge-function or Make-scenario
change, but relevant to anyone working from this repo by its old name: the
GitHub repo this changelog lives in was renamed from `Make.com-claude-code`
to `inrange-frontend`. Reason: this repo is the actual live InRange
dashboard/frontend (`src/pages`, `src/routes`,
`src/integrations/supabase/inrange.ts` wired to `omzugrtgwsjypekuzgtn`,
deployed to Vercel and aliased to the real production domain,
`inrange.jetreadvisors.com`) — the old name was a leftover scaffold default
(`package.json` still said `vite_react_shadcn_ts`) that hid this from anyone
looking for "the InRange frontend" by name.

GitHub redirects the old name transparently for git and API access (both
names resolved to the same commit during the change), so existing clones
and remotes using `Make.com-claude-code` kept working without
reconfiguration.

Old name for cross-reference: `central-station-33/Make.com-claude-code`.
Unrelated repos also named "InRange"-adjacent, noted at the time to avoid
the same confusion recurring: `central-station-33/InRange` (backend
pipeline only, no frontend) and `central-station-33/nextjs-inrange` (a dead
`create-next-app` scaffold — not this repo, not deployed anywhere).

<a id="entry-20260921-03"></a>
## [2026-09-21T23:35Z] edge-function:enrich-leads — derive routing from scores instead of trusting the model
agent: claude-code
entry-id: 20260921-03
target-type: edge-function
target-id: enrich-leads
window-check: yes
verify_jwt-before: false
verify_jwt-after: false
artifact: supabase-version:41
commit: n/a
status: done
related-entries: entry-20260921-01

No prior entry in this file touched `enrich-leads` at the time — checked
before deploying, clear. The function computed `bant_score` correctly from
the model's own component scores, then separately trusted whatever
`routing` string the model also returned, if it was one of the four valid
values. Checked against all 172 enriched rows at the time (162 live + 10 in
a dedupe backup table): 151 agreed with the prompt's own stated routing
rules, 21 didn't (12%) — including identical duplicate rows (same
`bant_score`, same `motivation_score`) that came back with different
`routing` on different runs, which is what non-determinism in a business
rule looks like from outside. Fix: added
`deriveRouting(bantScore, motivationScore)`, applying the prompt's own four
rules in code; the model's `routing` field is still requested (prompt
unchanged, `ENRICH_PROMPT_VERSION` not bumped) but no longer read. Deployed
v41, `verify_jwt: false` (matched what was already there, no gateway
change).

Backfilled the 19 already-wrong live rows from
`bant_score`/`motivation_score` already stored on each — no re-enrichment,
no Anthropic spend. Re-checked after: 162/162 agree, 0 violations. Two of
the 19 corrections were `hot` → `warm` demotions (`Andrew Thomas`, `Tremaine
Edmunds`) that had already gone out in the real "ISA Notify Receiver"
emails sent per the entry below, labeled `HOT` when the correct label was
`WARM` — the notification itself was correct to fire, the urgency label on
those two was wrong at send time.

<a id="entry-20260921-02"></a>
## [2026-09-21T23:31Z] edge-function:ingest-leads — restored verify_jwt: false
agent: claude-code
entry-id: 20260921-02
target-type: edge-function
target-id: ingest-leads
window-check: no
verify_jwt-before: true
verify_jwt-after: false
artifact: supabase-version:39
commit: n/a
status: done
related-entries: entry-legacy-20260921-2131

Confirms the "agent unconfirmed" attribution on the legacy entry below dated
2026-09-21 21:31 UTC: that was Claude Code. That earlier deploy (the
comma/ilike fix) redeployed `ingest-leads` without having seen this file —
it didn't exist in this agent's working set yet — and preserved whatever
`verify_jwt` the function already had (`true`) rather than checking it
against convention, silently re-reverting the fix Perplexity Computer had
made for exactly this function ~1 hour earlier. This entry: deployed v39,
`verify_jwt: false`, no code change from v38 — just the gateway flag, back
to matching every sibling function's custom `x-make-secret` auth. Caught by
reading this changelog before a *different* deploy (`enrich-leads`) and
noticing an earlier entry already existed, written by someone else,
describing a collision not previously known to have been caused. No code
diff this time — logging so the loop closes.

<a id="entry-20260921-01"></a>
## [2026-09-21T23:15Z] make-scenario:5077766 — ISA Notify Receiver: added real email delivery
agent: claude-code
entry-id: 20260921-01
target-type: make-scenario
target-id: 5077766
window-check: no
verify_jwt-before: n/a
verify_jwt-after: n/a
artifact: scenario:5077766 — added google-email:sendAnEmail module
commit: n/a
status: done
related-entries: entry-legacy-20260921-2016

Built on top of Perplexity Computer's 20:16 UTC fix on this same scenario
(legacy entry below — `log-touch` module removed) without first checking
this file for who made it or when — the blueprint read right before editing
was already just webhook-in → webhook-respond, which matches that fix
exactly, so this turned out to be additive, not a collision, but that was
luck from reading the live blueprint, not from following the check-first
rule. Added a `google-email:sendAnEmail` module between the two existing
ones, using the account's existing Gmail OAuth connection
(`jtaffairs@gmail.com`, id `11132254`), populated from fields `notify-isa`
already assembles (name, `ai_summary`, talking points, BANT/motivation
scores, contact, commission split) but had nowhere to send until now.

Separately found and fixed, not a shared-function code change but relevant
to anyone else touching this path: `notify-isa` marks a lead
`outreach_status = 'attempting'` as soon as the webhook call returns 200 —
and this receiver always returned 200 regardless of what (if anything)
happened downstream. So every notify attempt before this fix "succeeded"
and permanently removed the lead from the `'new'` pool `notify-isa`
re-queries, without anything ever being sent — presumably also why the
pre-fix receiver got away with doing nothing for as long as it did, nothing
ever errored. Reset the 23 leads (7 hot, 16 warm) this had already stranded
back to `'new'` and re-ran `notify-isa` for both routings: 23/23 sent,
confirmed against 23 individual Make executions (`status: 1, operations: 3`
each), not just the caller's own success count.

Known gaps, not fixed here: SMS and Slack are unbuilt (no Make connection
exists for either — `notify-isa`'s `sms_message` field is composed and
unused); the email step hardcodes the one connected address rather than
routing by the lead's actual `assigned_agent`, so this breaks silently the
moment a second agent exists.

---

## Legacy entries

Everything below predates the structured format above
(pre-2026-09-23T16:00Z, prose-only). Treat these claims as unverified
unless independently checked — e.g. the 2026-09-23 03:05 UTC entry's
item-12 claim (`send-auth-email` deletion) turned out to be only
half-shipped on inspection, despite being logged as done (closed by
[entry-20260923-01](#entry-20260923-01) above).

---

<a id="entry-legacy-20260923-0305"></a>
## 2026-09-23 03:05 UTC — Auth/dashboard fix plan: DB + code changes shipped — Perplexity (assistant)
User approved execution of `docs/notes/2026-09-22-auth-dashboard-fix-plan.md`.
Shipped so far (not an edge function per se, but logging DB migrations here
since this file is the cross-agent coordination point):

- Migration `fix_increment_ai_budget_spend_search_path` — pinned search_path
  on `public.increment_ai_budget_spend` (plan item 8).
- Migration `revoke_anon_execute_on_internal_auth_functions` +
  `revoke_anon_direct_execute_grant_on_internal_functions` — revoked `anon`'s
  EXECUTE on `public.is_broker()` / `public.current_team_agent_id()`;
  confirmed via `pg_policies` that every RLS policy referencing these two
  functions is scoped to `{authenticated}` only, so nothing anon-facing
  depended on it. `authenticated` still has EXECUTE (plan item 6).
- Regenerated `src/integrations/supabase/types.ts` — it was stale and
  missing several live tables including `team_agents`, which the item-11 fix
  below needed.
- Fixed `src/hooks/useAuthState.ts` and `src/hooks/auth/useAuthState.ts`
  (both are live — confirmed by import graph, correcting the plan doc's
  original item 11 wording) to query `team_agents.role` via `auth_user_id`
  instead of the nonexistent `user_roles` table. This was a real live bug:
  `userRole` silently stayed `null` for every signed-in user because the old
  query always errored. Note for whoever picks up Priority-3-adjacent work:
  the only current `team_agents` row has `role = 'broker'`, not `'admin'` or
  `'owner'` — the `userRole === 'owner'` UI in `DashboardContainer.tsx` and
  the `requireAdmin` check in `PrivateRoute.tsx` won't match until/unless
  someone decides the intended role taxonomy; flagged back to the user
  rather than inventing a mapping.
- Shipped plan item 0 (P0 root cause) and items 10, 12, 15, 16 — see the
  `inrange-frontend` commit(s) right after this changelog entry for the file
  list. `npm run build` and `tsc --noEmit` both pass clean after all of the
  above.
- Correction to the plan doc itself: item 10 incorrectly listed
  `src/hooks/useAuthFormState.ts` (root) and `src/hooks/useAuthActions.ts`
  as dead — re-verified via `grep` before deleting anything and both are
  actually live (imported by `AuthFormContext.tsx` / `AuthContext.tsx`
  respectively). Did NOT delete them. Only the confirmed-dead files were
  removed; see commit for the exact list.
- Plan item 9 (move `pg_net` out of `public`): attempted via
  `ALTER EXTENSION pg_net SET SCHEMA net;` — Postgres rejected it
  ("cannot move extension pg_net into schema net because the extension
  contains the schema"). This looks like a known pg_net quirk where
  `pg_extension.extnamespace` reports `public` even though the extension's
  real tables already live in `net` — not safely actionable without
  dropping/recreating the extension (risk to the existing http request/
  response queue), so left as-is. Low-severity WARN, not blocking.
- Reviewed plan item 20 (`ai_budget_tracker` / `isa_leads_dedupe_backup_20260921`
  RLS-enabled-no-policy, INFO level): both are only ever touched by
  service_role (edge functions), which bypasses RLS — no anon/authenticated
  code path touches either table, so "no policy" is actually the safe
  default-deny state already. No action taken, not a real gap.
- Still open / needs the user directly, not code: plan item 5 (remove
  public self-signup — needs a yes/no), item 7 (enable leaked-password
  protection — Auth dashboard toggle, can't be done from this repo), item
  13 (which duplicate login page to keep), item 14 (broken logo — needs a
  corrected source file).

## 2026-09-23 02:20 UTC — New fix plan: `docs/notes/2026-09-22-auth-dashboard-fix-plan.md` — Perplexity (assistant)
Not an edge-function change itself, but logging here so Claude Code sees it:
after a full audit of the live login flow (Supabase `auth_logs` showed
`team@joinjra.com` hitting repeated `invalid_credentials` then a forced
password reset, twice in 24h) plus a code read of every auth hook/component
and a `get_advisors` pass on the DB, wrote up a prioritized fix plan at
`docs/notes/2026-09-22-auth-dashboard-fix-plan.md`. **The user has only
asked for the plan to be written and shared — execution is NOT yet
approved.** Do not start on any item in that file until the user
explicitly says to proceed. Once that go-ahead comes, work through it
top-to-bottom —
it covers a likely-root-cause `autocomplete` bug on the password-reset
field, an open public self-signup gap, two anon-callable `SECURITY DEFINER`
functions, a pile of dead/duplicate auth hook files (some reference a
`check_rate_limit` RPC and `login_attempts`/`user_roles` tables that don't
exist in this DB — don't try to "fix" those, they're unreachable dead code,
delete them per the plan instead), two duplicate login pages, and a broken
logo asset. If you touch any edge function or Make scenario while working
through it, log that here as its own entry per this file's normal rule —
the fix-plan file itself is not a substitute for that.

<a id="entry-legacy-20260921-2215"></a>
## 2026-09-21 22:15 UTC — Vercel project `inrange-dashboard` renamed to `inrange-frontend` — Perplexity (assistant)
Not an edge-function or Make change, but logged here so Claude Code and any
other agent sharing this repo doesn't get confused by mismatched naming.
GitHub repo was earlier renamed `Make.com-claude-code` -> `INRANGE-FRONTEND`
(see commit e8c78568, this repo is the real, live InRange frontend deployed
to inrange.jetreadvisors.com). The linked Vercel project still carried the
old name and old deployment metadata/aliases (`make-com-claude-code-*`),
which could make an agent think there were two separate apps. Renamed the
Vercel project (`prj_nOePJcq0wPWzE7mxjvktOec2C3sO`, team
`central-station-33s-projects`) to `inrange-frontend` to match. Verified
after: custom domain `inrange.jetreadvisors.com` stayed attached/verified,
Git connection to `main` unaffected, no env vars or build/protection settings
touched. New system deployment URLs going forward use the
`inrange-frontend-*.vercel.app` pattern; old `make-com-claude-code-*.vercel.app`
historical URLs still resolve. See
`docs/notes/2026-09-21-vercel-project-rename.md` for full detail. If you're
about to reference "the make-com-claude-code Vercel project" — it's this
same project, just renamed.

<a id="entry-legacy-20260921-2131"></a>
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

<a id="entry-legacy-20260921-2016"></a>
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
