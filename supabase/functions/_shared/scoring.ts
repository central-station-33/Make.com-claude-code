// InRange Scoring Engine — Supabase Edge Function shared module

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const round = (v: number) => Math.round(v);

const DISTRESS_INDICATORS: Record<string, number> = {
  foreclosure_notice: 25, lis_pendens: 20, pre_foreclosure: 20,
  tax_lien: 15, tax_delinquent: 15, probate: 10, code_violation: 8,
  hoa_lien: 8, bankruptcy: 12, divorce: 5, vacant: 10,
  condemned: 15, water_shutoff: 8, utility_shutoff: 6,
};

const daysSince = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.round((Date.now() - d.getTime()) / 86400000);
};

const daysUntil = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86400000);
};

export const calculateDistressScore = (property: Record<string, unknown>): number => {
  let score = 0;
  const indicators = (property.distress_indicators as string[]) || [];

  for (const indicator of indicators) {
    const key = indicator.toLowerCase().replace(/[\s-]/g, '_');
    score += DISTRESS_INDICATORS[key] || 5;
  }

  const noticeDays = daysSince(property.notice_date as string);
  if (noticeDays !== null && noticeDays <= 30) score += 10;
  else if (noticeDays !== null && noticeDays <= 90) score += 5;

  if (indicators.length >= 3) score += 15;
  else if (indicators.length >= 2) score += 8;

  return clamp(round(score), 0, 100);
};

export const calculateDealQualityScore = (property: Record<string, unknown>): number => {
  let score = 0;
  const TYPE_PTS: Record<string, number> = {
    sfr: 30, single_family: 30, multifamily: 25, duplex: 22,
    triplex: 22, fourplex: 22, condo: 18, townhouse: 20, land: 8,
  };

  const type = ((property.property_type as string) || '').toLowerCase().replace(/[\s-]/g, '_');
  score += TYPE_PTS[type] || 10;

  const arv = Number(property.estimated_arv || 0);
  const owed = Number(property.amount_owed || 0);
  const ask = Number(property.asking_price || 0);

  if (arv > 0) {
    const eq = ((arv - owed) / arv) * 100;
    if (eq >= 50) score += 30;
    else if (eq >= 30) score += 20;
    else if (eq >= 15) score += 10;
  }

  if (arv > 0 && ask > 0) {
    const bm = ((arv - ask) / arv) * 100;
    if (bm >= 30) score += 25;
    else if (bm >= 20) score += 15;
    else if (bm >= 10) score += 8;
  }

  return clamp(round(score), 0, 100);
};

export const calculateContactLikelihoodScore = (property: Record<string, unknown>): number => {
  let score = 0;
  if (property.owner_phone) score += 25;
  if (property.owner_email) score += 20;
  if (property.owner_mailing_address) score += 15;

  const ownerType = ((property.owner_type as string) || '').toLowerCase();
  if (['individual', 'person'].includes(ownerType)) score += 20;
  else if (ownerType === 'trust') score += 10;
  else if (['llc', 'corporation'].includes(ownerType)) score += 5;

  const pState = ((property.state as string) || '').toUpperCase();
  const oState = ((property.owner_state as string) || '').toUpperCase();
  if (pState && oState && pState !== oState) score += 10;

  return clamp(round(score), 0, 100);
};

export const calculateTimelineUrgencyScore = (property: Record<string, unknown>): number => {
  let score = 0;
  const toAuction = daysUntil(property.auction_date as string);
  if (toAuction !== null) {
    if (toAuction <= 14) score += 50;
    else if (toAuction <= 30) score += 35;
    else if (toAuction <= 60) score += 20;
    else if (toAuction <= 90) score += 10;
  }

  const noticeAge = daysSince(property.notice_date as string);
  if (noticeAge !== null) {
    if (noticeAge <= 7) score += 25;
    else if (noticeAge <= 30) score += 15;
    else if (noticeAge <= 90) score += 5;
  }

  const stage = ((property.process_stage as string) || '').toLowerCase();
  if (stage.includes('auction') || stage.includes('sale')) score += 25;
  else if (stage.includes('notice of sale')) score += 20;
  else if (stage.includes('default')) score += 10;

  return clamp(round(score), 0, 100);
};

export const assignCompositeScore = (s: {
  distress: number; dealQuality: number; contactLikelihood: number; timelineUrgency: number;
}): number =>
  clamp(round(s.distress * 0.35 + s.dealQuality * 0.30 + s.contactLikelihood * 0.20 + s.timelineUrgency * 0.15), 0, 100);

export const assignPriorityTier = (score: number): string => {
  if (score >= 80) return 'Tier 1';
  if (score >= 60) return 'Tier 2';
  if (score >= 40) return 'Tier 3';
  return 'Tier 4';
};

const DEAL_TYPES = [
  { type: 'Foreclosure',    keywords: ['foreclosure_notice', 'lis_pendens', 'pre_foreclosure'] },
  { type: 'Tax Lien',       keywords: ['tax_lien', 'tax_delinquent'] },
  { type: 'Probate',        keywords: ['probate'] },
  { type: 'Divorce',        keywords: ['divorce'] },
  { type: 'Bankruptcy',     keywords: ['bankruptcy'] },
  { type: 'Code Violation', keywords: ['code_violation', 'condemned'] },
  { type: 'Vacant Property',keywords: ['vacant'] },
  { type: 'HOA Lien',       keywords: ['hoa_lien'] },
];

export const identifyDealType = (property: Record<string, unknown>): string => {
  const indicators = ((property.distress_indicators as string[]) || [])
    .map((i) => i.toLowerCase().replace(/[\s-]/g, '_'));
  for (const { type, keywords } of DEAL_TYPES) {
    if (keywords.some((k) => indicators.includes(k))) return type;
  }
  return 'Other Distress';
};

export const scoreProperty = (property: Record<string, unknown>) => {
  const distress          = calculateDistressScore(property);
  const dealQuality       = calculateDealQualityScore(property);
  const contactLikelihood = calculateContactLikelihoodScore(property);
  const timelineUrgency   = calculateTimelineUrgencyScore(property);
  const composite         = assignCompositeScore({ distress, dealQuality, contactLikelihood, timelineUrgency });
  return {
    distress_score: distress,
    deal_quality_score: dealQuality,
    contact_likelihood_score: contactLikelihood,
    timeline_urgency_score: timelineUrgency,
    composite_score: composite,
    priority_tier: assignPriorityTier(composite),
    deal_type: identifyDealType(property),
  };
};
