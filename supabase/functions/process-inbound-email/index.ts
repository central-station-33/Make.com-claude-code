/**
 * process-inbound-email — turns an inbound email (website form autoresponder,
 * Zillow/Realtor.com rental or sale inquiry, forwarded enquiry) into an
 * isa_leads row.
 *
 * Previously wrote to a `leads` table plus `crm_contacts`. Neither is part of
 * the InRange schema -- `leads` is the table PR #13 removed the CRM dashboard
 * for ("Could not find the table 'public.leads'") -- so every inbound email
 * threw on insert and the lead was lost. Inbound is the only channel that
 * produces renter-side leads at all, since renters file no public record, so
 * this path has to land in the same table the ISA pipeline actually reads.
 *
 * POST body: { from, subject, text, to, segment?, market? }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-make-secret',
};

interface InboundEmail {
  from: string;
  subject?: string;
  text?: string;
  to?: string;
  segment?: string;
  market?: string;
}

// Intent inference is a fallback only. The sending scenario knows what it is
// far better than keywords do -- S17 parsing a Zillow *rental* inquiry should
// pass segment explicitly -- so this exists to avoid dumping everything into
// general_inquiry, not to be the primary classifier.
const RENTAL_HINTS = [
  'rent', 'rental', 'lease', 'leasing', 'tenant', 'apartment for rent',
  'no fee', 'move-in', 'sublet',
];

const SELLER_HINTS = ['sell my', 'selling my', 'list my home', 'home valuation', 'what is my home worth'];
const BUYER_HINTS  = ['pre-approved', 'preapproved', 'looking to buy', 'first home', 'first-time buyer'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  // This endpoint was previously unauthenticated, which made it an open
  // lead-insert vector. Nothing depended on that: it wrote to a table that
  // doesn't exist, so there is no working caller to preserve. Whatever posts
  // here now has to send x-make-secret.
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  let payload: InboundEmail;
  try { payload = await req.json(); }
  catch { return json({ success: false, error: 'Invalid JSON' }, 400); }

  if (!payload?.from) return json({ success: false, error: 'from required' }, 400);

  const { name, email } = parseFrom(payload.from);
  if (!email) return json({ success: false, error: 'No sender address in from' }, 400);

  const segment = resolveSegment(payload);
  const market  = (payload.market ?? 'ny').toLowerCase();

  const supabase = getServiceClient();

  try {
    // Same dedupe rule ingest-leads uses: one active lead per person per
    // segment/market. A second email from someone already in the pipeline
    // updates their record instead of creating a duplicate for the ISA.
    const { data: existing } = await supabase
      .from('isa_leads')
      .select('id')
      .eq('segment', segment)
      .eq('market', market)
      .eq('email', email)
      .not('outreach_status', 'in', '("dead","closed")')
      .maybeSingle();

    const rawData = {
      subject:     payload.subject ?? '',
      body:        payload.text ?? '',
      to:          payload.to ?? '',
      received_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from('isa_leads').update({
        raw_data:   rawData,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
      if (error) throw new Error(error.message);

      return json({ success: true, data: { lead_id: existing.id, segment, deduped: true } });
    }

    const { data: inserted, error } = await supabase.from('isa_leads').insert({
      segment,
      market,
      full_name:         name,
      email,
      commission_source: 'inrange_generated',
      routing:           'new',
      outreach_status:   'new',
      source_name:       payload.to ? `inbound_email:${payload.to}` : 'inbound_email',
      motivation_signals: buildSignals(payload, segment),
      raw_data:          rawData,
    }).select('id').single();

    // insert() resolves rather than throws on a constraint violation, so the
    // error has to be read explicitly -- the failure mode that silently ate
    // 75 homeowner leads before the segment CHECK was fixed.
    if (error) throw new Error(error.message);

    return json({ success: true, data: { lead_id: inserted?.id, segment, deduped: false } });
  } catch (err) {
    console.error('process-inbound-email failed:', err);
    return json({ success: false, error: (err as Error).message }, 500);
  }
});

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/(?:"?([^"<]*)"?\s*)?<?([^\s<>]+@[^\s<>]+)>?/);
  const name  = (match?.[1] ?? '').trim();
  const email = (match?.[2] ?? '').trim().toLowerCase();
  return { name: name || 'Unknown', email };
}

function resolveSegment(payload: InboundEmail): string {
  if (payload.segment) return payload.segment;

  const haystack = `${payload.subject ?? ''} ${payload.text ?? ''}`.toLowerCase();
  if (RENTAL_HINTS.some((hint) => haystack.includes(hint))) return 'renter';
  if (SELLER_HINTS.some((hint) => haystack.includes(hint))) return 'motivated_seller';
  if (BUYER_HINTS.some((hint)  => haystack.includes(hint))) return 'first_time_buyer';

  return 'general_inquiry';
}

function buildSignals(payload: InboundEmail, segment: string): string[] {
  const signals = [`Inbound email enquiry${payload.to ? ` to ${payload.to}` : ''}`];
  if (payload.subject) signals.push(`Subject: ${payload.subject}`);
  if (!payload.segment && segment !== 'general_inquiry') {
    // Flag inferred intent so an ISA (and Claude, via motivation_signals)
    // knows this wasn't declared by the source.
    signals.push(`Intent inferred from email text as "${segment}" — confirm on contact`);
  }
  return signals;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
