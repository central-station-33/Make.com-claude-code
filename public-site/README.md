# JRA public intake forms

Two standalone, dependency-free HTML pages for `jetreadvisors.com` (WordPress
on Bluehost). Each is self-contained — inline CSS, inline JS, no build step,
no external requests except the actual form submission.

- `find-my-rental.html` — the "Find My NY/NJ Rental" renter intake form.
- `lease-my-property.html` — the "Lease My Property" landlord intake form.

## How they submit

Updated 2026-09-26 (changelog 20260926-02). Both forms send with `fetch`
(form-urlencoded, no custom headers) to the public Supabase Edge Function:

```
https://omzugrtgwsjypekuzgtn.supabase.co/functions/v1/public-lead-intake
```

They used to POST to the Make S16 webhook, but that webhook requires an
`x-make-apikey` header a browser form cannot send, so every submission failed.

`public-lead-intake` checks, in order: the page's origin (jetreadvisors.com,
www.jetreadvisors.com, joinjra.com, www.joinjra.com, inrange.jetreadvisors.com;
more via the `PUBLIC_INTAKE_ALLOWED_ORIGINS` secret), body size and an allowed
field list, a hidden honeypot field `website`, a `form_loaded_at` timestamp
(must be at least 3 seconds old), and rate limits (5 per visitor per 10 minutes,
20 per day, 3 per phone/email per hour). Spam gets a fake "thank you" and is not
saved as a lead. Real submissions are forwarded server-side to `respond-lead`
(same fields and secret as S16) and then `notify-isa`. The page shows the thank
-you message only when the server confirms, and shows the real error otherwise.

Keep these in the form when editing: `<input name="website">` inside the
hidden `.jra-hp` block, `<input name="form_loaded_at" id="jra-form-loaded-at">`,
and the page script that fills it.

If the form is published on a new domain, add that domain to
`PUBLIC_INTAKE_ALLOWED_ORIGINS` (comma-separated, e.g.
`https://newsite.com,https://www.newsite.com`) in Supabase → Edge Functions →
Secrets, or the form will say it can only be submitted from our website.

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
