# JRA public intake forms

Two standalone, dependency-free HTML pages for `jetreadvisors.com` (WordPress
on Bluehost). Each is self-contained — inline CSS, inline JS, no build step,
no external requests except the actual form submission.

- `find-my-rental.html` — the "Find My NY/NJ Rental" renter intake form.
- `lease-my-property.html` — the "Lease My Property" landlord intake form.

## How they submit

Both POST directly (native HTML form submission, not `fetch`) to the same
public Make.com webhook already used by every other inbound-lead channel:

```
https://hook.us2.make.com/rnad6pwvp8gpnw3hwcqmc852k13fqaha
```

The submission targets a hidden `<iframe>` on the page instead of navigating
away, so the visitor never leaves `jetreadvisors.com` and never sees Make's
raw response. This also means the browser never needs to *read* Make's
response across origins — only a same-origin-agnostic form POST, which
isn't subject to CORS at all — so there's nothing to configure on Make's
side and nothing that can silently fail due to a missing CORS header.

Make (scenario **S16: Inbound Lead Fast Response**) receives the submission,
forwards it server-side (with the `x-make-secret` auth header, never exposed
to the browser) to the `respond-lead` Edge Function, which:

- finds-or-creates the lead in `isa_leads` (deduped by phone/email),
- tags it `module=rental_leasing`, `lead_role=renter` or `landlord`,
- writes the structured detail into `rental_inquiries` or `landlord_leads`,
- records a `lead_source_events` row for UTM/campaign attribution,
- treats submitting the form as texting consent: there is **no checkbox**.
  A notice line sits directly above the submit button, and hidden inputs send
  `sms_consent=true`, `consent_source`, and `consent_notice_version`. The Edge
  Function stores the exact notice wording for that version, the form source,
  and the timestamp on the lead as proof of consent,
- only sends an automatic SMS when that consent is present (or the lead texted
  in first) and a phone number was given — otherwise creates a `lead_tasks`
  row for an agent to reach out manually. Every first text ends with
  "Reply STOP to opt out.",
- always brands the response "Jet Realty Advisors", never "InRange".

## Before this goes live

1. **Branding is a placeholder.** No JRA brand kit (colors, fonts, logo) was
   available when these were built — `--jra-navy` / `--jra-gold` in each
   file's `:root` are a generic professional real-estate palette, not your
   actual brand. Swap those CSS variables (and add a logo if you want one)
   before publishing.
2. **Consent notice (`.consent-notice`).** If you change the wording, bump
   `consent_notice_version` in the form **and** add the new text under the same
   key in `CONSENT_NOTICES` in `supabase/functions/respond-lead/index.ts`, so the
   stored proof always matches what the visitor saw. Never add a pre-checked box
   or hide the notice below the fold. Have counsel review the wording.
3. **Test a real submission** before linking these from the live site — this
   was built and verified against the backend (schema, Edge Function, Make
   scenario) but never click-tested against a real browser/WordPress
   embed, since this session has no way to load `jetreadvisors.com`.

## How to publish (WordPress on Bluehost)

1. Create a new Page for each form (e.g. `/find-my-rental`, `/lease-my-property`).
2. In the block editor, add a **Custom HTML** block.
3. Paste everything from `<style>` through the closing `</script>` (i.e.
   everything except the outer `<!DOCTYPE html>`, `<html>`, `<head>`, and
   `<body>` tags — WordPress pages already provide those) into the block.
4. Preview and submit a real test entry, then check the InRange dashboard's
   Rental Leads / Landlord Leads pages (`/leasing/renters`,
   `/leasing/landlords`) for the new row.

If the theme's Custom HTML block strips `<style>`/`<script>` tags (some
security plugins do), the fallback is a **Code Snippets**-type plugin or an
Elementor **HTML** widget instead — same content, different container.
