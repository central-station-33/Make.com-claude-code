/**
 * public-lead-intake — public endpoint for the JRA website lead forms
 * (public-site/find-my-rental.html, public-site/lease-my-property.html).
 *
 * Why this exists (2026-09-26, changelog 20260926-02): the forms used to POST
 * straight to the Make S16 webhook, which requires an `x-make-apikey` header
 * that a browser form cannot send, so every submission got "Unauthorized".
 * This function is the public front door instead. It never exposes a secret
 * to the browser.
 *
 * verify_jwt=false (public by design). Protection, in order:
 *   1. Origin allowlist (the browser always sends Origin on a cross-site POST).
 *   2. Body size cap + field allowlist + length caps.
 *   3. Honeypot field `website` must be empty (hidden from people, bots fill it).
 *   4. Timing: `form_loaded_at` (set by the page script) must be >= 3 s old
 *      and < 24 h old.
 *   5. Rate limits (hashed IP / hashed phone-or-email, table public_intake_log):
 *      IP 5 per 10 min and 20 per day; same contact 3 per hour.
 * Spam (honeypot / too fast) gets a fake "success" so bots learn nothing.
 *
 * Accepted submissions are forwarded server-side to respond-lead (same
 * x-make-secret + form-urlencoded contract as Make S16 module 2), then
 * notify-isa `{limit:1}` (same as S16 module 3). S16 itself is unchanged and
 * still serves the other inbound channels.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

const DEFAULT_ORIGINS = [
  'https://jetreadvisors.com',
  'https://www.jetreadvisors.com',
  'https://joinjra.com',
  'https://www.joinjra.com',
  'https://inrange.jetreadvisors.com',
];
const EXTRA_ORIGINS = (Deno.env.get('PUBLIC_INTAKE_ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
const ALLOWED_ORIGINS = new Set([...DEFAULT_ORIGINS, ...EXTRA_ORIGINS]);

// Exactly the fields Make S16 module 2 forwards to respond-lead.
const ALLOWED_FIELDS = [
  'name', 'phone', 'email', 'inbound_message', 'segment', 'market', 'channel', 'source_name', 'source_url',
  'module', 'lead_role', 'sms_consent', 'marketing_consent', 'consent_source', 'consent_notice_version', 'brand',
  'campaign', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'landing_page', 'referrer_url',
  'move_date', 'move_date_flexible', 'target_locations', 'max_rent', 'min_bedrooms', 'preferred_bedrooms',
  'bathrooms_needed', 'household_size', 'pets_description', 'parking_needed', 'laundry_needed',
  'accessibility_notes', 'unit_style', 'tour_availability', 'additional_notes', 'preferred_contact_method',
  'property_address', 'property_city', 'property_county', 'property_state', 'property_zip', 'unit_count',
  'expected_rent', 'vacancy_date', 'current_status', 'leasing_need',
];
const LONG_FIELDS = new Set(['inbound_message', 'additional_notes', 'accessibility_notes', 'pets_description', 'target_locations', 'tour_availability']);
const URL_FIELDS = new Set(['source_url', 'landing_page', 'referrer_url']);

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_MS = 3_000;
const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;
const LIMITS = { ip10m: 5, ipDay: 20, contactHour: 3 };

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Vary': 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function reply(origin: string | null, status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

const OK_MESSAGE = 'Thank you. We received your request and will follow up shortly.';

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${MAKE_SECRET}:${value}`));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  return (xff.split(',')[0] || req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown').trim();
}

async function readFields(req: Request): Promise<Record<string, string> | null> {
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return null;
  const type = (req.headers.get('content-type') ?? '').toLowerCase();
  const out: Record<string, string> = {};
  if (type.includes('application/json')) {
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined) out[k] = String(v);
    } catch { return null; }
  } else {
    for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  }
  return out;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return reply(origin, 405, { success: false, error: 'Method not allowed' });
  if (!MAKE_SECRET || !SERVICE_ROLE_KEY) return reply(origin, 500, { success: false, error: 'Server misconfigured' });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const ipHash = await sha256(`ip:${clientIp(req)}`);

  const log = async (outcome: string, form: string | null, contactHash: string | null, detail: string | null = null) => {
    const { error } = await supabase.from('public_intake_log').insert({ outcome, form, ip_hash: ipHash, contact_hash: contactHash, detail });
    if (error) console.error('public_intake_log insert failed:', error.message);
  };

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    await log('bad_origin', null, null, (origin ?? 'none').slice(0, 200));
    return reply(origin, 403, { success: false, error: 'This form can only be submitted from our website.' });
  }

  const body = await readFields(req);
  if (!body) {
    await log('invalid', null, null, 'unreadable or oversized body');
    return reply(origin, 400, { success: false, error: 'We could not read your submission. Please try again.' });
  }
  const form = String(body.consent_source ?? body.source_name ?? '').slice(0, 100) || null;

  // Honeypot + timing: pretend success, forward nothing.
  if ((body.website ?? '').trim() !== '') {
    await log('honeypot', form, null);
    return reply(origin, 200, { success: true, message: OK_MESSAGE });
  }
  const loadedAt = Number(body.form_loaded_at ?? NaN);
  const age = Date.now() - loadedAt;
  if (!Number.isFinite(loadedAt) || age < MIN_FILL_MS || age > MAX_FORM_AGE_MS) {
    await log('too_fast', form, null, Number.isFinite(loadedAt) ? `age_ms=${age}` : 'missing form_loaded_at');
    return reply(origin, 200, { success: true, message: OK_MESSAGE });
  }

  // Allowlist + clean the fields.
  const fields: Record<string, string> = {};
  for (const key of ALLOWED_FIELDS) {
    const v = body[key];
    if (v === undefined) continue;
    const cap = LONG_FIELDS.has(key) ? 2000 : URL_FIELDS.has(key) ? 1000 : 200;
    fields[key] = String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, cap);
  }
  fields.channel = 'website_form';
  if (fields.brand && !['jra', 'hlr'].includes(fields.brand.toLowerCase())) delete fields.brand;

  const phoneDigits = (fields.phone ?? '').replace(/\D/g, '');
  const email = (fields.email ?? '').toLowerCase();
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!fields.name || fields.name.length < 2) {
    await log('invalid', form, null, 'missing name');
    return reply(origin, 400, { success: false, error: 'Please enter your name.' });
  }
  if (!phoneOk && !emailOk) {
    await log('invalid', form, null, 'no usable phone or email');
    return reply(origin, 400, { success: false, error: 'Please enter a valid phone number or email address.' });
  }
  const contactHash = await sha256(`contact:${phoneOk ? phoneDigits.slice(-10) : email}`);

  // Rate limits.
  const since = (ms: number) => new Date(Date.now() - ms).toISOString();
  const countSince = async (col: 'ip_hash' | 'contact_hash', value: string, ms: number) => {
    const { count, error } = await supabase.from('public_intake_log')
      .select('id', { count: 'exact', head: true })
      .eq(col, value).in('outcome', ['accepted', 'forward_failed', 'rate_limited']).gte('created_at', since(ms));
    if (error) throw new Error(error.message);
    return count ?? 0;
  };
  try {
    const [ip10m, ipDay, contactHour] = await Promise.all([
      countSince('ip_hash', ipHash, 10 * 60 * 1000),
      countSince('ip_hash', ipHash, 24 * 60 * 60 * 1000),
      countSince('contact_hash', contactHash, 60 * 60 * 1000),
    ]);
    if (ip10m >= LIMITS.ip10m || ipDay >= LIMITS.ipDay || contactHour >= LIMITS.contactHour) {
      await log('rate_limited', form, contactHash, `ip10m=${ip10m} ipDay=${ipDay} contactHour=${contactHour}`);
      return reply(origin, 429, { success: false, error: 'We already received your request. Please wait a little while before sending another.' });
    }
  } catch (e) {
    console.error('rate limit check failed:', e);
    // Fail open on a logging-table problem so real leads are not lost.
  }

  // Forward to respond-lead exactly like Make S16 module 2.
  let leadOk = false;
  let detail = '';
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/respond-lead`, {
      method: 'POST',
      headers: { 'x-make-secret': MAKE_SECRET, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    });
    const text = await res.text();
    leadOk = res.ok;
    detail = `respond-lead ${res.status}: ${text.slice(0, 300)}`;
  } catch (e) {
    detail = `respond-lead fetch error: ${e instanceof Error ? e.message : String(e)}`;
  }

  if (!leadOk) {
    console.error('public-lead-intake forward failed:', detail);
    await log('forward_failed', form, contactHash, detail);
    return reply(origin, 502, { success: false, error: 'Something went wrong on our end. Please try again, or call or email us directly.' });
  }

  // Same as S16 module 3: nudge the ISA notifier. Best effort.
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/notify-isa`, {
      method: 'POST',
      headers: { 'x-make-secret': MAKE_SECRET, 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 1 }),
    });
  } catch (e) {
    console.error('notify-isa call failed (lead was saved):', e);
  }

  await log('accepted', form, contactHash, detail.slice(0, 300));
  return reply(origin, 200, { success: true, message: OK_MESSAGE });
});
