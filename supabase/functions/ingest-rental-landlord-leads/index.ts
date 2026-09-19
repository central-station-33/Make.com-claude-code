/**
 * ingest-rental-landlord-leads — the "landlord" ISA segment ingest.
 *
 * Targets landlords with UNREPRESENTED rental units: self-listed (FRBO)
 * postings with no leasing agent, sourced via Make from Apify rental
 * scrapers. This is the ingest half of the segment (writes isa_leads +
 * landlord_leads + rental_units). Deliberately does NOT touch
 * agent_routing_rules, so assign-leads never picks these up -- every row
 * lands with assigned_agent_id = NULL and sits in the unclaimed_leads view
 * until an agent calls claim-lead.
 *
 * POST /ingest-rental-landlord-leads?market=nj&source_name=hotpads_frbo
 * Body: Array<Record<string, unknown>> -- raw actor dataset items.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

const FIELD_CANDIDATES = {
  address: ['address', 'street_address', 'streetAddress', 'location'],
  city: ['city', 'addressCity'],
  zip: ['zip', 'zipcode', 'postal_code', 'addressZipcode'],
  rent: ['rent', 'price', 'monthly_rent', 'monthlyRent', 'listPrice'],
  bedrooms: ['bedrooms', 'beds', 'numBedrooms'],
  bathrooms: ['bathrooms', 'baths', 'numBathrooms'],
  sqft: ['sqft', 'square_footage', 'livingArea', 'floorSize'],
  contactName: ['contact_name', 'contactName', 'ownerName', 'listedBy', 'agentName'],
  contactPhone: ['contact_phone', 'contactPhone', 'phone', 'phoneNumber'],
  contactEmail: ['contact_email', 'contactEmail', 'email'],
  listingUrl: ['listing_url', 'listingUrl', 'url', 'detailUrl'],
  availableDate: ['available_date', 'availableDate', 'availabilityDate'],
  photos: ['photos', 'images', 'photoUrls'],
  description: ['description', 'body', 'remarks'],
  petPolicy: ['pet_policy', 'petPolicy', 'pets'],
  furnished: ['furnished', 'isFurnished'],
};

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
}

function mapFurnished(val: unknown): 'furnished' | 'unfurnished' | null {
  if (val === true) return 'furnished';
  if (val === false) return 'unfurnished';
  const s = String(val ?? '').toLowerCase();
  if (s.includes('furnished') && !s.includes('unfurnished')) return 'furnished';
  if (s.includes('unfurnished')) return 'unfurnished';
  return null;
}

function mapContactMethod(phone: unknown, email: unknown): 'call' | 'email' | null {
  if (phone) return 'call';
  if (email) return 'email';
  return null;
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (!MAKE_SECRET) return json({ success: false, error: 'Server misconfigured' }, 500);
  if (req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const qs = new URL(req.url).searchParams;
  const rawBody = await req.json().catch(() => null);
  const bodyObj: Record<string, unknown> = Array.isArray(rawBody) ? {} : (rawBody as Record<string, unknown> | null) ?? {};
  const market = (qs.get('market') ?? bodyObj.market) === 'nyc' ? 'nyc' : 'nj';
  const sourceName = String(qs.get('source_name') ?? bodyObj.source_name ?? 'apify_rental_frbo');
  const listings = Array.isArray(rawBody)
    ? rawBody as Record<string, unknown>[]
    : Array.isArray(bodyObj.listings) ? bodyObj.listings as Record<string, unknown>[] : [];

  if (!listings.length) return json({ success: true, data: { fetched: 0, upserted: 0, deduped: 0, errors: [] } });

  const supabase = getServiceClient();
  const results = { fetched: listings.length, upserted: 0, deduped: 0, errors: [] as string[] };

  for (const row of listings) {
    try {
      const address  = String(pick(row, FIELD_CANDIDATES.address) ?? '').trim();
      if (!address) { results.errors.push('Skipped: no address field found'); continue; }

      const city         = String(pick(row, FIELD_CANDIDATES.city) ?? '');
      const zip          = String(pick(row, FIELD_CANDIDATES.zip) ?? '');
      const rent         = Number(pick(row, FIELD_CANDIDATES.rent) ?? 0) || null;
      const bedrooms     = Number(pick(row, FIELD_CANDIDATES.bedrooms) ?? NaN);
      const bathrooms    = Number(pick(row, FIELD_CANDIDATES.bathrooms) ?? NaN);
      const sqft         = Number(pick(row, FIELD_CANDIDATES.sqft) ?? NaN);
      const contactName  = pick(row, FIELD_CANDIDATES.contactName) as string | undefined;
      const contactPhone = pick(row, FIELD_CANDIDATES.contactPhone) as string | undefined;
      const contactEmail = pick(row, FIELD_CANDIDATES.contactEmail) as string | undefined;
      const listingUrl   = String(pick(row, FIELD_CANDIDATES.listingUrl) ?? '');
      const availableRaw = pick(row, FIELD_CANDIDATES.availableDate);
      const availableDate = availableRaw ? new Date(String(availableRaw)).toISOString().slice(0, 10) : null;
      const photos       = pick(row, FIELD_CANDIDATES.photos);
      const description  = pick(row, FIELD_CANDIDATES.description) as string | undefined;
      const petPolicy    = pick(row, FIELD_CANDIDATES.petPolicy) as string | undefined;
      const furnished    = mapFurnished(pick(row, FIELD_CANDIDATES.furnished));

      const stateCode = market === 'nyc' ? 'NY' : 'NJ';
      const fullAddress = [address, city, stateCode, zip].filter(Boolean).join(', ');

      let existingQuery = supabase
        .from('isa_leads')
        .select('id')
        .eq('segment', 'landlord')
        .eq('market', market)
        .not('outreach_status', 'in', '("dead","closed")');
      existingQuery = listingUrl
        ? existingQuery.eq('source_url', listingUrl)
        : existingQuery.eq('property_address', fullAddress);
      const { data: existing } = await existingQuery.maybeSingle();

      const motivationSignals = [
        `Self-listed, no leasing agent (${sourceName})`,
        rent ? `Asking rent: $${rent.toLocaleString()}/mo` : 'Asking rent: unknown',
        availableDate ? `Available: ${availableDate}` : undefined,
      ].filter(Boolean) as string[];

      if (existing) {
        await supabase.from('isa_leads').update({
          raw_data: row,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
        results.deduped++;
        continue;
      }

      const { data: newLead, error: leadErr } = await supabase.from('isa_leads').insert({
        segment: 'landlord',
        market,
        commission_source: 'inrange_generated',
        routing: 'new',
        outreach_status: 'new',
        module: 'rental_leasing',
        lead_role: 'landlord',
        full_name: contactName ?? null,
        entity_name: contactName ?? null,
        property_address: fullAddress,
        state: stateCode,
        motivation_signals: motivationSignals,
        source_name: sourceName,
        source_url: listingUrl || null,
        email: contactEmail ?? null,
        phone: contactPhone ?? null,
        raw_data: row,
      }).select('id').single();

      if (leadErr) throw new Error(`isa_leads: ${leadErr.message}`);

      const { data: newLandlordLead, error: llErr } = await supabase.from('landlord_leads').insert({
        isa_lead_id: newLead.id,
        property_address: fullAddress,
        city: city || null,
        state: stateCode,
        zip: zip || null,
        unit_count: 1,
        expected_rent: rent,
        vacancy_date: availableDate,
        current_status: 'unrepresented_active_listing',
        leasing_need: 'find_tenant',
        preferred_contact_method: mapContactMethod(contactPhone, contactEmail),
        pipeline_stage: 'new_lead',
        notes: `Sourced from ${sourceName}${listingUrl ? `: ${listingUrl}` : ''}`,
      }).select('id').single();

      if (llErr) throw new Error(`landlord_leads: ${llErr.message}`);

      const { error: ruErr } = await supabase.from('rental_units').insert({
        landlord_lead_id: newLandlordLead.id,
        address,
        city: city || null,
        state: stateCode,
        zip: zip || null,
        listing_status: 'active',
        available_date: availableDate,
        monthly_rent: rent,
        bedrooms: Number.isFinite(bedrooms) ? bedrooms : null,
        bathrooms: Number.isFinite(bathrooms) ? bathrooms : null,
        square_footage: Number.isFinite(sqft) ? sqft : null,
        pet_policy: petPolicy ?? null,
        furnished_status: furnished,
        description: description ?? null,
        photos: photos ?? null,
        listing_source: sourceName,
        last_verified_at: new Date().toISOString(),
      });

      if (ruErr) throw new Error(`rental_units: ${ruErr.message}`);

      results.upserted++;
    } catch (e) {
      results.errors.push(`${(row as Record<string, unknown>).address ?? 'unknown address'}: ${(e as Error).message}`);
    }
  }

  return json({ success: true, data: results });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
