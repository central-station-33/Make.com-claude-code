import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAKE_SECRET        = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';
const ANTHROPIC_API_KEY  = Deno.env.get('ANTHROPIC_API_KEY')  ?? '';
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')  ?? '';
const TWILIO_FROM_NUMBER = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

const SEGMENT_CONTEXT: Record<string, string> = {
  athlete:            'professional athlete relocating to play for a NY/NJ team',
  investor:           'real estate investor looking for NYC/NJ opportunities',
  motivated_seller:   'motivated seller looking to move their property quickly',
  first_time_buyer:   'first-time home buyer exploring the NYC/NJ market',
  divorce:            'going through a life transition requiring real estate help',
  empty_nester:       'homeowner looking to rightsize after kids moved out',
  developer:          'developer or builder evaluating land and project opportunities',
  expat_relocation:   'professional relocating to the NYC/NJ metro area',
  film_tv:            'film/TV production professional needing housing near set',
  homeowner:          'homeowner who may be open to selling their property',
  renter:             'renter looking for an apartment or home in NY/NJ',
};

// Branding comes from brand profiles (public.brands). Resolution order:
//   1. brand_id (uuid) or brand / brand_slug (e.g. 'jra', 'hlr') in the payload
//   2. the existing lead's brand_id
//   3. the default brand (jra)
// Exclusive-property leads are re-tagged by the DB trigger
// sync_brand_from_exclusive, and we re-read brand_id after insert so the
// text is signed with whatever brand the lead actually landed in.
// The signature is appended in code; the model is told not to sign off.
type BrandProfile = { id: string; slug: string; display_name: string; sms_signature: string; sms_from_number: string | null; status: string };

// Twilio's recognized STOP keywords (case-insensitive, exact match after trim)
// https://www.twilio.com/docs/messaging/features/opt-out-keywords
const OPT_OUT_KEYWORDS = new Set(['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit']);
function isOptOutMessage(message?: string): boolean {
  if (!message) return false;
  return OPT_OUT_KEYWORDS.has(message.trim().toLowerCase());
}

async function sendSms(to: string, from: string, body: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !from) return false;
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );
  return res.ok;
}

const LEAD_ROLE_CONTEXT: Record<string, string> = {
  renter:   'looking for a rental in NY/NJ',
  landlord: 'a property owner who needs leasing/tenant-placement help',
};

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const {
    name, phone, email, inbound_message,
    segment = 'first_time_buyer',
    market  = 'nyc',
    channel = 'sms',
    source_name, source_url,
    module: moduleParam,
    lead_role: leadRoleParam,
    sms_consent = false,
    marketing_consent = false,
    consent_source,
    brand: brandParam, brand_slug: brandSlugParam, brand_id: brandIdParam,
    campaign, utm_source, utm_medium, utm_campaign, utm_content,
    landing_page, referrer_url,
    // Rental Leasing module detail — only meaningful when lead_role is
    // 'renter' or 'landlord'; harmless/unused otherwise.
    move_date, move_date_flexible, target_locations, max_rent,
    min_bedrooms, preferred_bedrooms, bathrooms_needed, household_size,
    pets_description, parking_needed, laundry_needed, accessibility_notes,
    unit_style, tour_availability, additional_notes, preferred_contact_method,
    property_address, property_city, property_county, property_state, property_zip,
    unit_count, expected_rent, vacancy_date, current_status, leasing_need,
  } = body;

  if (!phone && !email) return json({ error: 'phone or email required' }, 400);

  const supabase = getServiceClient();

  const [{ data: byPhone }, { data: byEmail }] = await Promise.all([
    phone ? supabase.from('isa_leads').select('id,segment,market,module,lead_role,outreach_status,first_response_at,sms_consent,sms_opt_out,brand_id')
              .eq('phone', phone).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
    email ? supabase.from('isa_leads').select('id,segment,market,module,lead_role,outreach_status,first_response_at,sms_consent,sms_opt_out,brand_id')
              .eq('email', email).not('outreach_status','in','("dead","closed")').maybeSingle()
          : Promise.resolve({ data: null }),
  ]);
  const existing = byPhone ?? byEmail;

  // Check ALL history (including dead/closed leads) for a prior opt-out, so a
  // new lead row for the same phone/email never silently resets it.
  let everOptedOut = !!existing?.sms_opt_out;
  if (!everOptedOut && (phone || email)) {
    let q = supabase.from('isa_leads').select('id', { count: 'exact', head: true }).eq('sms_opt_out', true);
    q = phone && email ? q.or(`phone.eq.${phone},email.eq.${email}`)
      : phone ? q.eq('phone', phone) : q.eq('email', email!);
    const { count } = await q;
    everOptedOut = !!count && count > 0;
  }

  // Resolve the requested brand (payload) before insert.
  const brandKey = (brandSlugParam || brandParam || '').toString().trim().toLowerCase();
  let requestedBrandId: string | null = null;
  if (brandIdParam) {
    requestedBrandId = String(brandIdParam);
  } else if (brandKey) {
    const { data: b } = await supabase.from('brands').select('id').eq('slug', brandKey).maybeSingle();
    requestedBrandId = b?.id ?? null;
  }

  let leadId: string;
  let isNewLead = false;

  if (existing) {
    leadId = existing.id;
    // A consent flag passed on a follow-up touch strengthens (never weakens) what's on file.
    if (sms_consent || marketing_consent) {
      await supabase.from('isa_leads').update({
        ...(sms_consent && { sms_consent: true }),
        ...(marketing_consent && { marketing_consent: true }),
        ...(consent_source && { consent_source }),
        consent_captured_at: new Date().toISOString(),
      }).eq('id', leadId);
    }
  } else {
    const { data: created, error: insertErr } = await supabase
      .from('isa_leads')
      .insert({
        segment, market,
        // '||' (not '??') on purpose: an empty string from a form field
        // that omitted this value must land as NULL, not '' — the
        // module/lead_role CHECK constraints reject '' but not NULL.
        module:               moduleParam || null,
        lead_role:            leadRoleParam || null,
        commission_source:    'inrange_generated',
        full_name:            name ?? 'Inbound Lead',
        phone, email,
        inbound_channel:      channel,
        inbound_message,
        outreach_status:      'new',
        routing:              'new',
        source_name:          source_name ?? channel,
        source_url,
        ...(requestedBrandId && { brand_id: requestedBrandId }),
        sms_consent:          !!sms_consent,
        marketing_consent:    !!marketing_consent,
        consent_source:       consent_source ?? null,
        consent_captured_at:  (sms_consent || marketing_consent) ? new Date().toISOString() : null,
        motivation_signals:   [`Inbound ${source_name ?? channel} inquiry — auto-responded`],
        raw_data:             { inbound_message, channel, received_at: new Date().toISOString() },
      })
      .select('id')
      .single();

    if (insertErr || !created) return json({ error: insertErr?.message ?? 'insert failed' }, 500);
    leadId    = created.id;
    isNewLead = true;
  }

  if (isNewLead && everOptedOut && !isOptOutMessage(inbound_message)) {
    await supabase.from('isa_leads').update({
      sms_opt_out: true, sms_opt_out_at: new Date().toISOString(),
    }).eq('id', leadId);
  }

  // Brand the lead actually carries (after defaults + exclusive-property trigger).
  const { data: leadBrandRow } = await supabase.from('isa_leads').select('brand_id').eq('id', leadId).single();
  const { data: brandRow } = await supabase
    .from('brands')
    .select('id, slug, display_name, sms_signature, sms_from_number, status')
    .eq('id', leadBrandRow?.brand_id ?? '')
    .maybeSingle();
  const brandProfile = brandRow as BrandProfile | null;
  const brandOk = !!brandProfile && brandProfile.status === 'active' && !!brandProfile.sms_signature?.trim();
  const brand = brandOk ? brandProfile!.display_name : 'our team';
  const signature = brandOk ? brandProfile!.sms_signature.trim() : '';
  const fromNumber = (brandOk && brandProfile!.sms_from_number?.trim()) || TWILIO_FROM_NUMBER;

  // STOP handling first: record it, send the single confirmation carriers expect.
  if (isOptOutMessage(inbound_message)) {
    await supabase.from('isa_leads').update({
      sms_opt_out: true, sms_opt_out_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', leadId);
    const { data: tn } = await supabase.rpc('next_touch_number', { p_lead_id: leadId });
    await supabase.from('lead_touches').insert({
      lead_id: leadId, touch_number: tn ?? 1, channel, outcome: 'not_interested',
      notes: `Opt-out received via inbound message: "${(inbound_message ?? '').slice(0, 120)}"`,
      isa_name: signature ? `${signature} (auto)` : 'InRange Auto', touched_at: new Date().toISOString(),
    });
    const confirmSent = phone
      ? await sendSms(phone, fromNumber, `You've been unsubscribed and won't receive further messages from ${signature || 'us'}.`)
      : false;
    return json({ success: true, lead_id: leadId, is_new_lead: isNewLead, opted_out: true, sms_sent: confirmSent });
  }

  // Previously opted out: never auto-text again without documented re-consent.
  if (everOptedOut) {
    const { data: tn } = await supabase.rpc('next_touch_number', { p_lead_id: leadId });
    await supabase.from('lead_touches').insert({
      lead_id: leadId, touch_number: tn ?? 1, channel, outcome: 'no_answer',
      notes: `Inbound message from opted-out lead (not auto-responded): "${(inbound_message ?? '').slice(0, 120)}"`,
      isa_name: signature ? `${signature} (auto)` : 'InRange Auto', touched_at: new Date().toISOString(),
    });
    return json({ success: true, lead_id: leadId, is_new_lead: isNewLead, opted_out: true, sms_sent: false, note: 'lead previously opted out; no automated message sent' });
  }

  const effectiveSegment = (existing?.segment ?? segment) as string;
  const effectiveMarket  = (existing?.market  ?? market)  as string;
  const effectiveModule  = (existing?.module  ?? moduleParam) as string | null;
  const effectiveLeadRole = (existing?.lead_role ?? leadRoleParam) as string | null;
  const alreadyResponded = !!(existing?.first_response_at);

  // Consent gate: only auto-text if the lead explicitly opted in (form
  // checkbox passed through as sms_consent), or they texted us first —
  // replying to an inbound SMS is not the same as unsolicited outbound
  // marketing. Everything else (website/email leads with a phone number
  // but no consent flag) gets a task for a human to reach out by an
  // allowed channel instead of an automatic text.
  const hasConsentToText = !!(existing?.sms_consent) || !!sms_consent || channel === 'sms';

  let claudeResult: ClaudeResult | null = null;
  if (ANTHROPIC_API_KEY) {
    claudeResult = await callClaude({
      name, inbound_message, segment: effectiveSegment, leadRole: effectiveLeadRole,
      market: effectiveMarket, isNewLead, alreadyResponded, brand,
    });
  }

  let bodyText = (claudeResult?.sms_response ?? fallbackSms(name, effectiveMarket, brand)).trim();
  // Strip any sign-off the model adds anyway; ours is appended in code.
  bodyText = bodyText.replace(/\s*[—-]\s*(InRange|Jet Realty Advisors|JRA|MVP Team[^—-]*|Highline Residential|our team)\.?$/i, '').trim();
  const optOutLine = alreadyResponded ? '' : ' Reply STOP to opt out.';
  const smsText = signature ? `${bodyText} — ${signature}${optOutLine}` : bodyText;

  let smsSent = false;
  // Never send under a missing/paused brand; a human gets the task instead.
  if (phone && hasConsentToText && brandOk) {
    smsSent = await sendSms(phone, fromNumber, smsText);
  }

  if (phone && (!hasConsentToText || !brandOk)) {
    await supabase.from('lead_tasks').insert({
      isa_lead_id: leadId,
      task_type:   'manual_first_contact_no_sms_consent',
      status:      'open',
      notes:       !hasConsentToText
        ? `No SMS consent on file — reach out by phone/email instead. Drafted message: "${smsText}"`
        : `Brand profile missing or paused — not auto-texted. Drafted message: "${smsText}"`,
    });
  }

  // Best-effort attribution row — only when the caller actually sent
  // campaign/UTM/page data (public web forms), never required, and never
  // allowed to fail the lead capture itself.
  if (campaign || utm_source || utm_medium || utm_campaign || utm_content || landing_page || referrer_url) {
    await supabase.from('lead_source_events').insert({
      isa_lead_id: leadId,
      source_channel: channel,
      source_platform: source_name ?? null,
      campaign: campaign ?? null,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      utm_content: utm_content ?? null,
      landing_page: landing_page ?? null,
      referrer_url: referrer_url ?? null,
      first_touch_at: isNewLead ? new Date().toISOString() : null,
      latest_touch_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.error('lead_source_events insert failed', error); });
  }

  // Rental Leasing module detail rows. Best-effort, upserted by isa_lead_id
  // so a repeat submission from the same lead updates rather than errors.
  // Never overwrites with blanks: only fields actually present in this
  // request are included in the upsert object.
  if (effectiveLeadRole === 'renter') {
    const notesParts = [
      preferred_contact_method ? `Preferred contact: ${preferred_contact_method}.` : null,
      additional_notes || null,
    ].filter(Boolean);
    const rentalFields: Record<string, unknown> = { isa_lead_id: leadId };
    if (move_date) rentalFields.move_date = move_date;
    if (move_date_flexible != null) rentalFields.move_date_flexible = !!move_date_flexible;
    if (target_locations) {
      rentalFields.target_locations = Array.isArray(target_locations)
        ? target_locations
        : String(target_locations).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (max_rent != null && max_rent !== '') rentalFields.max_rent = Number(max_rent);
    if (min_bedrooms != null && min_bedrooms !== '') rentalFields.min_bedrooms = Number(min_bedrooms);
    if (preferred_bedrooms != null && preferred_bedrooms !== '') rentalFields.preferred_bedrooms = Number(preferred_bedrooms);
    if (bathrooms_needed != null && bathrooms_needed !== '') rentalFields.bathrooms_needed = Number(bathrooms_needed);
    if (household_size != null && household_size !== '') rentalFields.household_size = Number(household_size);
    if (pets_description) rentalFields.pets = { description: pets_description };
    if (parking_needed != null) rentalFields.parking_needed = !!parking_needed;
    if (laundry_needed != null) rentalFields.laundry_needed = !!laundry_needed;
    if (accessibility_notes) rentalFields.accessibility_notes = accessibility_notes;
    if (unit_style) rentalFields.unit_style = unit_style;
    if (tour_availability) rentalFields.tour_availability = { notes: tour_availability };
    if (notesParts.length > 0) rentalFields.additional_notes = notesParts.join(' ');
    if (Object.keys(rentalFields).length > 1) {
      await supabase.from('rental_inquiries').upsert(rentalFields, { onConflict: 'isa_lead_id' })
        .then(({ error }) => { if (error) console.error('rental_inquiries upsert failed', error); });
    }
  } else if (effectiveLeadRole === 'landlord') {
    const landlordFields: Record<string, unknown> = { isa_lead_id: leadId };
    if (property_address) landlordFields.property_address = property_address;
    if (property_city) landlordFields.city = property_city;
    if (property_county) landlordFields.county = property_county;
    if (property_state) landlordFields.state = property_state;
    if (property_zip) landlordFields.zip = property_zip;
    if (unit_count != null && unit_count !== '') landlordFields.unit_count = Number(unit_count);
    if (expected_rent != null && expected_rent !== '') landlordFields.expected_rent = Number(expected_rent);
    if (vacancy_date) landlordFields.vacancy_date = vacancy_date;
    if (current_status) landlordFields.current_status = current_status;
    if (leasing_need) landlordFields.leasing_need = leasing_need;
    if (preferred_contact_method) landlordFields.preferred_contact_method = preferred_contact_method;
    if (additional_notes) landlordFields.notes = additional_notes;
    if (Object.keys(landlordFields).length > 1) {
      await supabase.from('landlord_leads').upsert(landlordFields, { onConflict: 'isa_lead_id' })
        .then(({ error }) => { if (error) console.error('landlord_leads upsert failed', error); });
    }
  }

  const { data: touchNum } = await supabase.rpc('next_touch_number', { p_lead_id: leadId });

  await supabase.from('lead_touches').insert({
    lead_id:      leadId,
    touch_number: touchNum ?? 1,
    channel,
    outcome:      'no_answer',
    notes:        smsSent ? `Auto-responded: "${smsText.slice(0, 120)}"` : `Drafted (not sent): "${smsText.slice(0, 120)}"`,
    isa_name:     signature ? `${signature} (auto)` : 'InRange Auto',
    touched_at:   new Date().toISOString(),
  });

  const updates: Record<string, unknown> = {
    outreach_status: 'attempting',
    updated_at:      new Date().toISOString(),
    ...(claudeResult && {
      ai_summary:         claudeResult.ai_summary,
      isa_talking_points: claudeResult.isa_talking_points,
      bant_score:         claudeResult.bant_score,
      motivation_score:   claudeResult.motivation_score,
      routing:            claudeResult.routing,
    }),
  };
  if (!alreadyResponded) updates.first_response_at = new Date().toISOString();

  await supabase.from('isa_leads').update(updates).eq('id', leadId);

  return json({
    success: true, lead_id: leadId, is_new_lead: isNewLead, sms_sent: smsSent,
    sms_skipped_no_consent: !!phone && !hasConsentToText,
    response_text: smsText, brand: brandProfile?.slug ?? null, routing: claudeResult?.routing ?? 'new', bant_score: claudeResult?.bant_score ?? null,
  });
});

interface ClaudeResult {
  sms_response: string;
  ai_summary: string;
  isa_talking_points: string[];
  bant_score: number;
  motivation_score: number;
  routing: string;
}

async function callClaude(params: {
  name?: string; inbound_message?: string; segment: string; leadRole?: string | null;
  market: string; isNewLead: boolean; alreadyResponded: boolean; brand: string;
}): Promise<ClaudeResult | null> {
  const { name, inbound_message, segment, leadRole, market, isNewLead, alreadyResponded, brand } = params;
  const ctx = (leadRole && LEAD_ROLE_CONTEXT[leadRole]) ?? SEGMENT_CONTEXT[segment] ?? segment;
  const prompt = `You are an ISA writing on behalf of ${brand}, a NYC/NJ real estate team.
A ${ctx} just contacted you${alreadyResponded ? ' again' : ' for the first time'}.
Lead name: ${name ?? 'Unknown'}
Market: ${market.toUpperCase()}
Their message: "${inbound_message ?? 'No message — form/portal submission'}"
Return ONLY valid JSON:
{"sms_response":"<under 120 chars, warm/direct, ends with one question about timeline or availability, no signature or sign-off (one is appended automatically), no emojis, no links>","ai_summary":"<2 sentences: who this is + why they need real estate NOW>","isa_talking_points":["<point 1>","<point 2>","<point 3>"],"bant_score":<0-12>,"motivation_score":<1-5>,"routing":"<hot|warm|nurture|cold>"}
ROUTING: hot=bant≥9+motivation≥4 | warm=bant≥7 OR motivation≥3 | nurture=bant≥4 | cold=else
Inbound leads score at least 2 higher than outbound.
Never state or imply anything about a neighborhood's schools, crime, safety, or the kind of people who live there, and never mention or infer race, religion, national origin, family status, disability, or other protected characteristics — this is a fair-housing requirement, not a style preference.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw  = data.content[0]?.text ?? '{}';
  const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    if (parsed.sms_response?.length > 130) parsed.sms_response = parsed.sms_response.slice(0, 127) + '...';
    return parsed as ClaudeResult;
  } catch { return null; }
}

function fallbackSms(name?: string, market = 'nyc', brand = 'our team'): string {
  const area = market === 'nj' ? 'NJ' : 'NYC & NJ';
  return `Hi${name ? ` ${name}` : ''}, thanks for reaching out to ${brand}. We cover ${area}. When's a good time for a quick call this week?`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
