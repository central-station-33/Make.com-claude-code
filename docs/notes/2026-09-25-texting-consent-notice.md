# Texting consent: notice line, no checkbox (2026-09-25)

Approved by James Thompson: "Set it up with the notice line and no checkbox."

## How it works

- Every lead form shows one notice line directly above the submit button. There is no checkbox.
- Submitting the form counts as consent to calls and texts about that inquiry.
- The form sends hidden fields `sms_consent=true`, `consent_source=<form id>`, `consent_notice_version=<version>`, and `brand=<jra|hlr>`.
- `respond-lead` stores proof on the lead (`isa_leads.raw_data.consent_evidence` + `consent_history`): timestamp, form source, notice version, the exact notice text for that version, page, and phone.
- The first text always ends with "Reply STOP to opt out." STOP is honored across all past and future rows for that phone/email.
- Leads with no form behind them (public records, lists, Reddit, etc.) are never auto-texted. They become an agent task (`manual_first_contact_no_sms_consent`).

## Rules for changing the wording

1. Never edit an existing notice version. Add a new version key.
2. Add the new text to `CONSENT_NOTICES` in `supabase/functions/respond-lead/index.ts` and redeploy.
3. Update the form's `consent_notice_version` hidden input to the new key.
4. Keep the notice visible, near the button, and in readable type. Never hide it below the fold.

## Notice versions

| Version | Where | Brand |
|---|---|---|
| `jra-web-rental-v1-2026-09-25` | `public-site/find-my-rental.html` (button "Find My Rental") | Jet Realty Advisors |
| `jra-web-landlord-v1-2026-09-25` | `public-site/lease-my-property.html` (button "Get My Leasing Plan") | Jet Realty Advisors |
| `hlr-solace-web-v1-2026-09-25` | Solace landing page (button "Check Availability"), not built yet | MVP Team @ Highline Residential |
| `jra-meta-v1-2026-09-25` | Facebook/Instagram lead forms, JRA | Jet Realty Advisors |
| `hlr-meta-v1-2026-09-25` | Facebook/Instagram lead forms, Highline | MVP Team @ Highline Residential |

## Solace landing page snippet (HLR)

```html
<input type="hidden" name="sms_consent" value="true">
<input type="hidden" name="consent_source" value="hlr_solace_landing_page">
<input type="hidden" name="consent_notice_version" value="hlr-solace-web-v1-2026-09-25">
<input type="hidden" name="brand" value="hlr">
<p class="consent-notice">By clicking &ldquo;Check Availability&rdquo;, you agree that MVP Team @ Highline Residential may call and text you at the number you provided about your rental inquiry, including texts sent with automated technology. Consent is not a condition of renting, buying, or using our services. Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out at any time.</p>
<button type="submit">Check Availability</button>
```

## Facebook / Instagram lead forms (Meta Instant Forms)

In Meta Ads Manager: Instant Form → Privacy policy section → add a **Custom disclaimer**. Paste the text for the brand. Do not add any checkbox.

JRA:

> By submitting this form, you agree that Jet Realty Advisors may call and text you at the number provided about your inquiry, including texts sent with automated technology. Consent is not a condition of renting, buying, or using our services. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out at any time.

HLR:

> By submitting this form, you agree that MVP Team @ Highline Residential may call and text you at the number provided about your inquiry, including texts sent with automated technology. Consent is not a condition of renting, buying, or using our services. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out at any time.

When the Meta lead connector is built, it must send to `respond-lead`: `sms_consent=true`, `consent_source=facebook_lead_form_<form name>`, `consent_notice_version=jra-meta-v1-2026-09-25` or `hlr-meta-v1-2026-09-25`, `brand=jra` or `hlr`, `channel=facebook_lead_form`. As of 2026-09-25, no Make scenario receives Meta leads.

## Known blockers (not changed, need decisions)

- ~~The S16 Make webhook requires an `x-make-apikey` header.~~ Resolved 2026-09-26: forms now submit to `public-lead-intake` (spam checks, then forwards to `respond-lead`). See `public-site/README.md`.
- `lead_touches.channel` only allows call/sms/email/dm/voicemail/mailer. Web-form leads use `channel=website_form`, so their touch log row fails silently.
