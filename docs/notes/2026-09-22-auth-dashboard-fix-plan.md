# InRange auth/dashboard fix plan — 2026-09-22

**Status: ALL ITEMS REQUIRING A USER DECISION ARE CLOSED (2026-09-23).**
Written by Perplexity Computer after a full audit of the live login flow,
the `inrange-frontend` repo, and the Supabase project
(`omzugrtgwsjypekuzgtn`). The user approved executing this plan. Priority 0
(root cause), Priority 1 items 6/8 (and 9 attempted — see the entry at
`docs/notes/shared-edge-function-changelog.md#entry-legacy-20260923-0305`
for why it couldn't be applied), Priority 2 (dead code, with one correction
to this doc's own item 10 — see that changelog entry), and Priority 4 items
15/16 were done as of that entry. Since then, with the user deciding each
one directly: item 5 (self-signup removal, commit `e071af9`), item 13
(duplicate login page — kept `Index.tsx` at `/`, `/auth` now redirects,
commit `cb43ac3`), item 14 (logo asset — user supplied a corrected file,
swapped in commit `80230f1`), and item 7 (leaked-password protection — the
user enabled it directly in the Supabase dashboard, self-reported done
2026-09-23; Claude Code has no tool access to independently verify an Auth
config toggle, so this is taken on the user's word, not confirmed via API)
are all done. Remaining open items (17-21, database-hygiene, "optional, low
urgency") were never gated on a user decision and can be picked up anytime.

**Priority 0's closing step is now confirmed (2026-09-23):** the user
completed a real reset-and-login cycle and it worked — see
`docs/notes/shared-edge-function-changelog.md#entry-20260923-04`. Getting
there took longer than the original diagnosis implied: the autocomplete
mismatch this section originally names was a real bug and was fixed, but it
was not the thing actually blocking the user's testing for most of this
session. Two infrastructure issues were the real blockers, found and fixed
mid-session: the Vercel project's Git connection was silently disconnected
(`entry-20260923-03`), and reset emails were carrying a dead domain,
`claude-code-inrange.vercel.app`, which isn't registered to this Vercel
project at all (`entry-20260923-04`). A new, separate, still-open bug was
also found during this same test — the "Set Password" button not
responding on a repeat visit to `/auth/reset-password` — logged in
`entry-20260923-04`, not blocking since login itself is confirmed working.

Evidence backing every item here is in the Perplexity Computer session that
produced this plan (Supabase `auth_logs`, `get_advisors`, and direct reads of
the files named below). Re-verify against current `main` before editing —
this repo has multiple agents pushing to it.

---

## Priority 0 — Root cause of the recurring login/password failures

Supabase `auth_logs` show the account `team@joinjra.com` hitting 3-4
consecutive `400 invalid_credentials` responses, twice in the last 24 hours,
each time resolved only by requesting a password-reset email. The leading
suspect is a browser-autofill mismatch caused by incorrect `autocomplete`
attributes.

1. **`src/components/auth/form-fields/PasswordField.tsx`** — this field is
   reused for both the sign-in password field elsewhere and the *new*
   password on the reset-password screen. It's hardcoded to
   `autoComplete="current-password"`. Split this: when the field is being
   used to set a *new* password (i.e. from `ResetPasswordForm.tsx`), pass
   and render `autoComplete="new-password"` instead. Add an `autoComplete`
   prop to `PasswordFieldProps` (default `"current-password"`) rather than
   hardcoding it, and pass `autoComplete="new-password"` from both password
   fields in `ResetPasswordForm.tsx`.
2. **`src/components/auth/SignInForm.tsx`** — the sign-in password `<Input>`
   (the one actually wired to `handleSignIn`) has no `autoComplete`
   attribute at all. Add `autoComplete="current-password"` to it. Add
   `autoComplete="new-password"` to the password input in the `mode ===
   'signup'` branch of the same file.
3. Align the displayed password rules with what's actually enforced.
   `ResetPasswordForm.tsx` only requires `password.length >= 6` to enable
   the submit button, but `PasswordField`'s `showRequirements` checklist
   displays 5 rules (8+ chars, upper, lower, number, special char) that look
   authoritative but aren't enforced. Either enforce all 5 rules before
   enabling "Set Password", or drop the checklist to match what's really
   required — pick whichever the user prefers, but don't ship the mismatch.
4. After the above, ask the user to test one real reset-and-login cycle in
   an incognito/private window (no saved credentials) to confirm the fix
   before closing this item out.

## Priority 1 — Security gaps

5. **DONE (2026-09-23, commit `e071af9`).** **Public self-signup on the login page.** `SignInForm.tsx`'s `mode ===
   'signup'` branch calls `supabase.auth.signUp({ email, password })`
   directly — anyone hitting `inrange.jetreadvisors.com` can create a live
   account with no invite, bypassing `invite-agent`'s broker-approval check
   entirely. **Confirm with the user before removing** — they may want
   self-signup for some flow — but by default: remove the "No account?
   Create one" / "Create Account" path from `SignInForm.tsx` and
   `useSignUpHandler.ts`, and require the `invite-agent` flow for all new
   accounts.
6. **Anonymous-callable `SECURITY DEFINER` functions.** `public.is_broker()`
   and `public.current_team_agent_id()` are currently executable by the
   `anon` role via `/rest/v1/rpc/...` (flagged by Supabase's own security
   advisor). Run: `REVOKE EXECUTE ON FUNCTION public.is_broker() FROM anon;`
   and the same for `current_team_agent_id()`, unless something in the app
   genuinely needs anonymous access (audit callers first — grep the repo for
   both function names before revoking).
7. **DONE (2026-09-23, self-reported by the user — not independently
   verified; no available tool exposes Supabase Auth config to check it).**
   **Enable leaked-password protection** in Supabase Auth settings
   (Authentication → Providers → Email → "Prevent use of leaked
   passwords" — note: not under "Policies", which is Postgres RLS, not
   Auth) — checks new passwords against HaveIBeenPwned. No code change,
   just a project setting; flag it to the user since it's a dashboard
   toggle, not something Claude
   Code can do from this repo.
8. **Function search_path.** `public.increment_ai_budget_spend` has a
   mutable search_path (Supabase security advisor `WARN`). Add `SET
   search_path = public` (or the correct fixed schema) to its definition and
   redeploy via `apply_migration`.
9. **`pg_net` extension in `public` schema.** Move it to a dedicated schema
   (e.g. `extensions`) per the Supabase advisor remediation doc — low risk,
   do this in the same migration pass as item 8.

## Priority 2 — Dead code cleanup (reduces risk of future agents editing the wrong file)

10. There are two parallel, non-overlapping sets of auth hooks. Only one is
    actually wired into the live UI (via `src/contexts/auth/AuthFormContext.tsx`
    → `src/contexts/auth/useAuthFormProvider.ts` → `useSignInHandler.ts`,
    `useSignUpHandler.ts`, `usePasswordResetHandler.ts`). The following are
    **not imported by anything live** and reference a `check_rate_limit`
    RPC and `login_attempts`/`user_roles` tables that **do not exist** in
    the database — confirm with `grep -rn` before deleting each, then
    delete:
    - `src/hooks/useAuthForm.ts`
    - `src/hooks/useAuthFormState.ts` (note: a *different*, live file of
      the same name exists at `src/hooks/auth/useAuthFormState.ts` — do not
      confuse them, only the root-level one is dead)
    - `src/hooks/useAuthActions.ts`
    - `src/hooks/useAuthState.ts` (same caution: `src/hooks/auth/useAuthState.ts`
      is a separate, also-unused file — see item 11)
    - `src/hooks/auth/useAuthSubmit.ts`
    - `src/hooks/auth/useAuthFormHandlers.ts`
    - `src/hooks/auth/useRateLimiting.ts`
    - `src/hooks/auth/useAuthPageContent.ts`
    - `src/hooks/auth/useAuthFormProvider.ts` (dead duplicate of the live
      `src/contexts/auth/useAuthFormProvider.ts` — different folder, same
      name, only the `contexts/auth` one is imported anywhere)
11. `src/hooks/auth/useAuthState.ts` and `src/hooks/useAuthState.ts` both
    query a `user_roles` table that doesn't exist (role data actually lives
    in `team_agents.role`). Check which of these two (if either) is actually
    imported live; fix the live one to query `team_agents` instead of
    `user_roles`, and delete the other if unused.
12. `supabase/functions/send-auth-email/` and `src/utils/emailUtils.ts` are
    dead code — not deployed to Supabase (confirmed absent from
    `list_edge_functions`), and `emailUtils.ts`'s `sendAuthEmail` has zero
    callers anywhere in `src/`. Delete both. Real invite/reset emails go
    through Supabase's built-in mailer via `resetPasswordForEmail` and
    `auth.admin.inviteUserByEmail` already.

## Priority 3 — Duplicate/confusing pages

13. **DONE (2026-09-23, commit `cb43ac3`) — user picked option (a).**
    `src/pages/Index.tsx` (route `/`) and `src/components/auth/AuthPage.tsx`
    (route `/auth`) are two separate, nearly-identical login pages, each
    independently rendering `<SignInForm />` with its own copy of the
    logo/heading markup. `Index.tsx` additionally renders a "Need to create
    an account?" button that just navigates to `/auth` — which renders the
    exact same sign-in form, not an account-creation view. Pick one:
    (a) make `/auth` redirect to `/` and delete `AuthPage.tsx`'s duplicate
    markup, keeping `Index.tsx` as the single login page, or
    (b) keep both routes but have `Index.tsx` reuse `AuthPage.tsx` instead
    of re-declaring its own Card/logo/heading.
    Either way, remove the misleading "Need to create an account?" button
    (its destination doesn't create an account) — replace with nothing, or
    with a real link into the invite-only flow if the user wants one kept.

## Priority 4 — Visual bugs on the login page

14. **DONE (2026-09-23, commit `80230f1`).** **Logo asset is broken.** The
    file at `public/uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png`
    (referenced from `Index.tsx`; `AuthPage.tsx`'s reference was removed
    along with the rest of that file in item 13) contains two overlapping/
    double-exposed copies of the mark, and the tagline text baked into the
    image reads "JET REALTY ADVIRSORS" (misspelled, should be "ADVISORS").
    This needs a corrected source file from the user/design side — Claude
    Code can swap the file once a fixed version is supplied, but cannot
    regenerate the artwork itself. Flag back to the user rather than
    attempting a fix.
15. **Premature validation error on page load.** `src/components/auth/form-fields/EmailField.tsx`
    computes `emailError = validateEmail(value)` unconditionally on every
    render, so with `value` starting as `''` it shows "Email is required"
    and a red border before the user has typed or blurred the field. Add a
    `touched` state (set `true` on first `onBlur` or on first change) and
    only render the error when `touched && emailError`.
16. **Missing gap between "No account? Create one" and "Forgot password?"**
    in `src/components/auth/SignInForm.tsx` — the two link-style `<Button>`s
    sit in a `flex justify-between` container but render with no visible
    space between them at the card's width. Add an explicit `gap-2` (or
    similar) to the container, don't rely on `justify-between` alone at this
    width. (If item 5's self-signup removal ships, this line only has one
    button left and the spacing issue disappears on its own — check item 5's
    status before doing this fix.)

## Priority 5 — Database hygiene (optional, low urgency)

17. Add covering indexes for the 15 foreign keys flagged by
    `get_advisors(type="performance")` (`content_queue`, `deals`,
    `isa_leads`, `landlord_leads`, `lead_source_events`, `lead_tasks`,
    `outreach`, `rental_applications`, `rental_units`, `scores`, `tours` —
    full column list is in the advisor output).
18. Consolidate the redundant/overlapping RLS policies on `deals`,
    `isa_leads`, `lead_touches`, `relocation_partners`, `team_agents` (14
    "multiple permissive policies" findings) into single policies per
    role+action where the logic allows it.
19. Wrap `auth.<function>()` calls in RLS policies on `automation_settings`
    and `team_agents` in `(select auth.<function>())` per Supabase's
    documented RLS performance fix.
20. Either add RLS policies to `public.ai_budget_tracker` and
    `public.isa_leads_dedupe_backup_20260921`, or drop them if they're
    unused (neither is currently referenced anywhere in `src/`, per a repo
    grep — confirm before dropping).
21. Drop the 32 indexes flagged as never-used, or leave them if the tables
    are still low-volume and you'd rather not re-add them later — low
    priority either way.

---

## Sign-off checklist for Claude Code

- [x] Priority 0 shipped and the user has confirmed a clean reset+login
      cycle works — confirmed 2026-09-23 (two `PUT /auth/v1/user` 200s in
      auth_logs plus a successful subsequent login); see
      `shared-edge-function-changelog.md#entry-20260923-04` for what it
      actually took to get there and a new open bug found along the way.
- [x] Priority 1 items 5, 6, 7, 8 shipped (item 5 confirmed with the user
      first and shipped 2026-09-23, commit `e071af9`; item 7 enabled by the
      user directly in the Supabase dashboard, self-reported 2026-09-23, not
      independently verified); item 9 attempted, not applicable (see
      changelog).
- [x] Priority 2 dead files removed — re-verified independently this
      session (grep confirmed all 8 listed files gone; both files named as
      "actually live" in the 03:05 UTC legacy entry's correction are still
      present and imported), commit `2731463`.
- [x] Priority 3 decision made with the user (option (a) — single login
      page at `/`, `/auth` redirects), shipped 2026-09-23, commit `cb43ac3`.
- [x] Priority 4 items 14, 15, 16 shipped. Item 14 was flagged back to the
      user rather than guessed at, per this checklist's original wording —
      the user supplied a corrected file 2026-09-23, swapped in commit
      `80230f1`.
- [ ] Any Supabase migration or edge-function redeploy logged in
      `docs/notes/shared-edge-function-changelog.md` per that file's own
      rule.
