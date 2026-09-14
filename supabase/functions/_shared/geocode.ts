/**
 * Free address geocoding via the US Census Bureau's public geocoder --
 * no API key, no per-call cost, no rate-limit registration required.
 * Used to correct properties.zip for NJ rows: NJOGIS MOD-IV's ZIP_CODE/ZIP5
 * fields are the owner's mailing zip, not the property's (see CLAUDE.md and
 * backfill-nj-zip's header doc), and address-level geocoding is the right
 * granularity fix -- NJ's largest distressed cities (Newark, Jersey City,
 * Elizabeth) each span many zip codes, so a municipality-level lookup table
 * would still be wrong for exactly the rows this pipeline cares about most.
 */

const CENSUS_GEOCODER = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress';

export interface GeocodeResult {
  zip: string;
  matchedAddress: string;
}

// Parcel/tax data commonly gives ranged street numbers ("108-136 ML KING
// BLVD") for a lot spanning several old addresses -- not a mailable address,
// and the geocoder won't match it. The range's first number is a fine stand-
// in: same block, same zip.
function normalizeStreet(street: string): string {
  return street.replace(/^(\d+)\s*-\s*\d+/, '$1');
}

export async function geocodeZip(
  street: string,
  city: string,
  state: string,
): Promise<GeocodeResult | null> {
  const oneLine = `${normalizeStreet(street)}, ${city}, ${state}`;
  const params = new URLSearchParams({
    address: oneLine,
    benchmark: 'Public_AR_Current',
    format: 'json',
  });

  try {
    const res = await fetch(`${CENSUS_GEOCODER}?${params}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const data = await res.json() as {
      result?: { addressMatches?: { matchedAddress?: string; addressComponents?: { zip?: string } }[] };
    };
    const match = data.result?.addressMatches?.[0];
    const zip = match?.addressComponents?.zip;
    if (!zip || !match?.matchedAddress) return null;

    return { zip, matchedAddress: match.matchedAddress };
  } catch {
    return null;
  }
}
