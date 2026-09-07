/**
 * ingest-leads — receives structured lead payloads from Make.com
 * (Apify actor output) and upserts into isa_leads.
 *
 * POST body: { segment, market, commission_source?, leads[] }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const MAKE_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);
  if (MAKE_SECRET && req.headers.get('x-make-secret') !== MAKE_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ success: false, error: 'Invalid JSON' }, 400); }

  // Accept either batch format { segment, market, leads: [] }
  // or single-lead format (segment + market + all lead fields directly)
  const segment         = body.segment as string;
  const market          = body.market  as string;
  const commission_source = (body.commission_source as string) ?? 'inrange_generated';
  const leads: Record<string, unknown>[] = Array.isArray(body.leads)
    ? body.leads
    : [body]; // single-lead mode — treat whole body as the lead

  if (!segment || !market) {
    return json({ success: false, error: 'segment and market required' }, 400);
  }

  const supabase = getServiceClient();
  let upserted = 0;
  const errors: string[] = [];

  for (const raw of leads) {
    // Normalize camelCase (Apify ESPN format) → snake_case (isa_leads columns)
    const normalized = normalizeLeadFields(raw, segment);
    const identifier = (normalized.full_name ?? normalized.entity_name ?? null) as string | null;
    if (!identifier) { errors.push('Skipped: no full_name or entity_name'); continue; }

    try {
      // Check for active duplicate
      const { data: existing } = await supabase
        .from('isa_leads')
        .select('id, outreach_status')
        .eq('segment', segment)
        .eq('market', market)
        .or(`full_name.eq.${identifier},entity_name.eq.${identifier}`)
        .not('outreach_status', 'in', '("dead","closed")')
        .maybeSingle();

      if (existing) {
        await supabase.from('isa_leads').update({
          motivation_signals: normalized.motivation_signals ?? [],
          raw_data: normalized.raw_data ?? {},
          source_url: normalized.source_url,
          ...(normalized.phone     && { phone:     normalized.phone }),
          ...(normalized.email     && { email:     normalized.email }),
          ...(normalized.rep_name  && { rep_name:  normalized.rep_name }),
          ...(normalized.rep_phone && { rep_phone: normalized.rep_phone }),
          ...(normalized.rep_email && { rep_email: normalized.rep_email }),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('isa_leads').insert({
          segment, market, commission_source,
          routing: normalized.routing ?? 'new',
          outreach_status: 'new',
          motivation_signals: normalized.motivation_signals ?? [],
          isa_talking_points: normalized.isa_talking_points ?? [],
          raw_data: normalized.raw_data ?? {},
          ...normalized,
        });
      }
      upserted++;
    } catch (err) {
      errors.push(`${identifier}: ${(err as Error).message}`);
    }
  }

  // Make discards the response body, so persist a diagnostic snapshot -- this
  // is the only way to see per-lead errors outside the HTTP response itself.
  try {
    await supabase.from('raw_properties').upsert({
      property_hash: `diagnostic_ingest_leads_${segment}`,
      source: 'diagnostic',
      raw_data: {
        ran_at: new Date().toISOString(),
        segment, market,
        fetched: leads.length, upserted, errors,
      },
      processed_at: new Date().toISOString(),
    }, { onConflict: 'property_hash' });
  } catch { /* diagnostics must never break the real response */ }

  return json({ success: true, data: { fetched: leads.length, upserted, errors } });
});

function normalizeLeadFields(
  raw: Record<string, unknown>,
  segment: string
): Record<string, unknown> {
  const norm: Record<string, unknown> = { ...raw };

  if (raw.fullName    && !raw.full_name)    norm.full_name    = raw.fullName;
  if (raw.entityName  && !raw.entity_name)  norm.entity_name  = raw.entityName;
  if (raw.teamName    && !raw.team_name)    norm.team_name    = raw.teamName;
  if (raw.repName     && !raw.rep_name)     norm.rep_name     = raw.repName;
  if (raw.repEmail    && !raw.rep_email)    norm.rep_email    = raw.repEmail;
  if (raw.repPhone    && !raw.rep_phone)    norm.rep_phone    = raw.repPhone;
  if (raw.repAgency   && !raw.rep_agency)   norm.rep_agency   = raw.repAgency;
  if (raw.sourceUrl   && !raw.source_url)   norm.source_url   = raw.sourceUrl;
  if (raw.sourceName  && !raw.source_name)  norm.source_name  = raw.sourceName;
  if (raw.productionName && !raw.production_name) norm.production_name = raw.productionName;
  if (raw.permitNumber   && !raw.permit_number)   norm.permit_number   = raw.permitNumber;
  if (raw.contractValue  && !raw.contract_value)  norm.contract_value  = raw.contractValue;
  if (raw.originCountry  && !raw.origin_country)  norm.origin_country  = raw.originCountry;
  if (raw.priceRangeMin  && !raw.price_range_min) norm.price_range_min = raw.priceRangeMin;
  if (raw.priceRangeMax  && !raw.price_range_max) norm.price_range_max = raw.priceRangeMax;
  if (raw.timelineMonths && !raw.timeline_months) norm.timeline_months = raw.timelineMonths;
  if (raw.motivationSignals && !norm.motivation_signals) norm.motivation_signals = raw.motivationSignals;
  if (raw.isaTalkingPoints  && !norm.isa_talking_points) norm.isa_talking_points = raw.isaTalkingPoints;

  if (segment === 'athlete') {
    if (raw.league && !raw.sport) norm.sport = raw.league;
    const exp = Number(raw.experience ?? raw.experienceYears ?? 0);
    if (!raw.routing) {
      norm.routing = exp >= 4 ? 'warm' : exp >= 1 ? 'nurture' : 'cold';
    }
    const league = String(raw.league ?? raw.sport ?? '');
    if (!raw.price_range_min && !raw.priceRangeMin) {
      if (league === 'nba')      { norm.price_range_min = exp >= 5 ? 2000000 : 800000;  norm.price_range_max = exp >= 5 ? 7000000 : 2000000; }
      else if (league === 'nfl') { norm.price_range_min = exp >= 5 ? 1500000 : 600000;  norm.price_range_max = exp >= 5 ? 5000000 : 1500000; }
      else if (league === 'mlb') { norm.price_range_min = exp >= 5 ? 1000000 : 500000;  norm.price_range_max = exp >= 5 ? 3000000 : 1200000; }
      else if (league === 'nhl') { norm.price_range_min = exp >= 5 ? 800000  : 400000;  norm.price_range_max = exp >= 5 ? 2500000 : 1000000; }
      else if (league === 'mls') { norm.price_range_min = 400000; norm.price_range_max = 1200000; }
    }
    if (!Array.isArray(norm.motivation_signals) || (norm.motivation_signals as unknown[]).length === 0) {
      const signals: string[] = [];
      const status = String(raw.status ?? 'Active');
      if (exp >= 5)  signals.push(`${exp}-year veteran — peak earning window`);
      if (exp >= 10) signals.push('Late career — diversification priority');
      if (exp === 0) signals.push('Rookie contract — first big income, housing need');
      signals.push(`Active ${String(raw.teamName ?? raw.team_name ?? '')} ${league.toUpperCase()} player`);
      signals.push(`NY metro market — ${status.toLowerCase()} roster`);
      norm.motivation_signals = signals;
    }
    norm.raw_data = {
      league: raw.league, teamAbbreviation: raw.teamAbbreviation,
      position: raw.position, jersey: raw.jersey,
      experience: raw.experience, age: raw.age,
      status: raw.status, scrapedAt: raw.scrapedAt,
    };
  }

  const camelKeys = ['fullName','entityName','teamName','repName','repEmail','repPhone',
    'repAgency','sourceUrl','sourceName','productionName','permitNumber','contractValue',
    'originCountry','priceRangeMin','priceRangeMax','timelineMonths',
    'motivationSignals','isaTalkingPoints','experienceYears'];
  for (const k of camelKeys) delete norm[k];

  return norm;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
