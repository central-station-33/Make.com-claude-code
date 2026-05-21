import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, err, handleOptions } from '../_shared/cors.ts';
import { normalizeProperty } from '../_shared/normalization.ts';

const NYC_API = 'https://data.cityofnewyork.us/resource';
const NJ_PARCELS_API = 'https://services2.arcgis.com/XVOqAjTOJ5P6ngMu/arcgis/rest/services/Parcels_and_MOD_IV_Composite/FeatureServer/0/query';
const FEMA_API = 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query';

// Fetch HPD violations score for a NYC property
const getHPDScore = async (houseNum: string, street: string, borough: string) => {
  try {
    const res = await fetch(`${NYC_API}/wvxf-dwi5.json?${new URLSearchParams({
      housenumber: houseNum, streetname: street.toUpperCase(),
      borough: borough.toUpperCase(), '$limit': '50',
    })}`);
    const data = await res.json() as Record<string, unknown>[];
    const classC = data.filter((v) => v.class === 'C').length;
    const classB = data.filter((v) => v.class === 'B').length;
    const total  = data.length;
    let score = Math.min(classC * 10, 20) + Math.min(classB * 5, 15);
    if (total >= 3) score += 10;
    return { total, classB, classC, score: Math.min(score, 30) };
  } catch { return { total: 0, classB: 0, classC: 0, score: 0 }; }
};

// Fetch NJ parcel data (last sale date = years owned)
const getNJYearsOwned = async (address: string, municipality: string) => {
  try {
    const res = await fetch(`${NJ_PARCELS_API}?${new URLSearchParams({
      where: `PROPLOCN LIKE '%${address.toUpperCase()}%' AND MUNNAME='${municipality.toUpperCase()}'`,
      outFields: 'SALEDATE,NETPRPTAX', f: 'json', resultRecordCount: '1',
    })}`);
    const data = await res.json() as { features?: { attributes: Record<string, unknown> }[] };
    const feature = data.features?.[0]?.attributes;
    if (!feature?.SALEDATE) return { yearsOwned: null, isLongTerm: false, netTax: 0 };
    const years = (Date.now() - new Date(feature.SALEDATE as string).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return { yearsOwned: Math.round(years), isLongTerm: years >= 10, netTax: Number(feature.NETPRPTAX || 0) };
  } catch { return { yearsOwned: null, isLongTerm: false, netTax: 0 }; }
};

// FEMA flood zone check
const getFloodScore = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`${FEMA_API}?${new URLSearchParams({
      geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint',
      inSR: '4326', spatialRel: 'esriSpatialRelIntersects',
      outFields: 'FLD_ZONE,SFHA_TF', returnGeometry: 'false', f: 'json',
    })}`);
    const data = await res.json() as { features?: { attributes: Record<string, unknown> }[] };
    const zone = data.features?.[0]?.attributes?.FLD_ZONE as string || 'X';
    const highRisk = ['A', 'AE', 'AH', 'AO', 'VE', 'V'].includes(zone);
    return { zone, score: highRisk ? (zone.startsWith('V') ? 30 : 25) : 0 };
  } catch { return { zone: 'X', score: 0 }; }
};

const calcBurntOutScore = (signals: Record<string, unknown>) => {
  let score = 0;
  score += Math.min(Number(signals.hpd_score || 0), 25);
  const years = Number(signals.years_owned || 0);
  if (years >= 20) score += 20;
  else if (years >= 15) score += 15;
  else if (years >= 10) score += 10;
  if (signals.out_of_state) score += 15;
  if (signals.is_tax_delinquent) score += 15;
  score += Math.min(Number(signals.flood_score || 0), 10);
  if (signals.is_rental) score += 10;
  return Math.min(Math.round(score), 100);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload = await req.json();
    const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [payload];
    const results = { processed: 0, burnt_out_found: 0, errors: [] as string[] };
    const found: unknown[] = [];

    for (const item of items) {
      try {
        const normalized = normalizeProperty(item);
        const state      = (normalized.state as string || '').toUpperCase();
        const address    = normalized.address as string || '';
        const city       = normalized.city    as string || '';

        let signals: Record<string, unknown> = {
          out_of_state: normalized.state !== normalized.owner_state && !!normalized.owner_state,
          is_tax_delinquent: !!(item.tax_delinquent || item.taxes_owed),
          is_rental: ['multifamily', 'duplex', 'triplex', 'apartment'].includes(
            (normalized.property_type as string || '').toLowerCase()
          ),
        };

        if (state === 'NY') {
          const houseNum = address.split(' ')[0] || '';
          const street   = address.split(' ').slice(1).join(' ');
          const borough  = item.borough as string || 'MANHATTAN';
          const hpd      = await getHPDScore(houseNum, street, borough);
          signals = { ...signals, hpd_score: hpd.score, hpd_violations: hpd.total };
        } else if (state === 'NJ') {
          const nj       = await getNJYearsOwned(address, city);
          signals = { ...signals, years_owned: nj.yearsOwned, is_long_term: nj.isLongTerm };
        }

        // FEMA flood check if coords available
        if (item.lat && item.lng) {
          const flood    = await getFloodScore(Number(item.lat), Number(item.lng));
          signals.flood_zone  = flood.zone;
          signals.flood_score = flood.score;
        }

        const score = calcBurntOutScore(signals);
        const isBurntOut = score >= 40;

        // Update property in DB if id present
        if (item.id || item.property_id) {
          const id = (item.id || item.property_id) as string;
          await supabase.from('properties')
            .update({
              burnt_out_landlord_score: score,
              burnt_out_signals: signals,
              ...(isBurntOut ? { deal_type: 'Burnt Out Landlord' } : {}),
            })
            .eq('id', id);
        }

        results.processed++;
        if (isBurntOut) {
          results.burnt_out_found++;
          found.push({ address: normalized.address, city: normalized.city, state: normalized.state, score, signals });
        }
      } catch (e) {
        results.errors.push((e as Error).message);
      }
    }

    return ok({ ...results, burnt_out_properties: found },
      `Scanned ${results.processed} properties — ${results.burnt_out_found} burnt out landlords found`);
  } catch (e) {
    console.error('burnt-out-landlord-scan error:', e);
    return err((e as Error).message);
  }
});
