// InRange Normalization — shared Deno module

export const parseCurrency = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[$,\s]/g, ''));
  return isNaN(n) ? null : n;
};

export const cleanName = (name: string): string => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ')
    .toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return phone;
};

export const generatePropertyHash = async (property: Record<string, unknown>): Promise<string> => {
  const key = [
    (property.address as string || '').toUpperCase().trim(),
    (property.city    as string || '').toUpperCase().trim(),
    (property.state   as string || '').toUpperCase().trim(),
    (property.zip     as string || '').trim(),
    (property.owner_name as string || '').toUpperCase().trim(),
    (property.source  as string || '').toLowerCase().trim(),
  ].join('|');

  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const normalizeProperty = (raw: Record<string, unknown>): Record<string, unknown> => {
  if (!raw) return {};

  const arv   = parseCurrency(raw.estimated_arv || raw.arv);
  const owed  = parseCurrency(raw.amount_owed   || raw.mortgage_balance);
  const ask   = parseCurrency(raw.asking_price  || raw.list_price);
  const equity = arv !== null && owed !== null ? arv - owed : null;
  const equityPct = arv && equity !== null ? Math.round((equity / arv) * 100) : null;

  const rawIndicators = (raw.distress_indicators as string[]) || [];
  const indicators    = rawIndicators.map((i) => String(i).toLowerCase().replace(/[\s-]+/g, '_').trim());

  return {
    id:           raw.id || raw.property_id,
    source:       (raw.source as string || 'unknown').toLowerCase(),
    address:      ((raw.street || raw.address) as string || '').toUpperCase().trim(),
    city:         (raw.city    as string || '').toUpperCase().trim(),
    state:        (raw.state   as string || '').toUpperCase().trim(),
    zip:          (raw.zip     as string || '').trim(),
    county:       (raw.county  as string || '').toUpperCase().trim(),
    property_type:(raw.property_type as string || '').toLowerCase().replace(/[\s-]/g, '_'),
    bedrooms:     raw.bedrooms     ? parseInt(String(raw.bedrooms), 10) : null,
    bathrooms:    raw.bathrooms    ? parseFloat(String(raw.bathrooms))  : null,
    square_footage: raw.square_footage ? parseInt(String(raw.square_footage), 10) : null,
    year_built:   raw.year_built   ? parseInt(String(raw.year_built), 10) : null,
    estimated_arv:  arv,
    amount_owed:  owed,
    asking_price: ask,
    equity,
    equity_percentage: equityPct,
    below_market_percentage: arv && ask ? Math.round(((arv - ask) / arv) * 100) : null,
    assessed_value: parseCurrency(raw.assessed_value),
    taxes_owed:   parseCurrency(raw.taxes_owed),
    owner_name:   cleanName(raw.owner_name as string || ''),
    owner_phone:  formatPhone(raw.owner_phone as string || ''),
    owner_email:  (raw.owner_email as string || '').toLowerCase().trim(),
    owner_mailing_address: raw.owner_mailing_address as string || '',
    owner_type:   (raw.owner_type  as string || 'unknown').toLowerCase(),
    owner_state:  (raw.owner_state as string || '').toUpperCase().trim(),
    distress_indicators: indicators,
    notice_date:  raw.notice_date  || raw.filing_date || null,
    auction_date: raw.auction_date || raw.sale_date   || null,
    process_stage:(raw.process_stage as string || '').toLowerCase(),
    case_number:  raw.case_number  || raw.file_number || '',
    normalized_at: new Date().toISOString(),
  };
};
