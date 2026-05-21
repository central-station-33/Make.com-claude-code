'use strict';

const {
  calculateDistressScore,
  calculateDealQualityScore,
  calculateContactLikelihoodScore,
  calculateTimelineUrgencyScore,
  assignCompositeScore,
  assignPriorityTier,
  identifyDealType,
  scoreProperty,
} = require('../src/services/scoringService');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const baseProperty = {
  address: '123 Main St',
  city: 'Phoenix',
  state: 'AZ',
  zip: '85001',
  property_type: 'sfr',
  distress_indicators: [],
  estimated_arv: 300000,
  amount_owed: 150000,
  asking_price: 200000,
  owner_name: 'John Smith',
  owner_phone: '6025551234',
  owner_email: 'john@example.com',
  owner_mailing_address: '456 Other St, Tucson, AZ 85701',
  owner_type: 'individual',
  owner_state: 'AZ',
};

const foreclosureProperty = {
  ...baseProperty,
  distress_indicators: ['foreclosure_notice', 'tax_delinquent'],
  notice_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  auction_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
  process_stage: 'notice of sale',
};

// ---------------------------------------------------------------------------
// Distress Score
// ---------------------------------------------------------------------------
describe('calculateDistressScore', () => {
  test('returns 0 for property with no distress indicators', () => {
    expect(calculateDistressScore(baseProperty)).toBe(0);
  });

  test('returns positive score for foreclosure notice', () => {
    const score = calculateDistressScore({ ...baseProperty, distress_indicators: ['foreclosure_notice'] });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('gives bonus for recent notice date (≤30 days)', () => {
    const recentNotice = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const oldNotice    = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    const recent = calculateDistressScore({ ...baseProperty, distress_indicators: ['foreclosure_notice'], notice_date: recentNotice });
    const old    = calculateDistressScore({ ...baseProperty, distress_indicators: ['foreclosure_notice'], notice_date: oldNotice });

    expect(recent).toBeGreaterThan(old);
  });

  test('gives bonus for multiple indicators (≥3)', () => {
    const single   = calculateDistressScore({ ...baseProperty, distress_indicators: ['tax_lien'] });
    const multiple = calculateDistressScore({ ...baseProperty, distress_indicators: ['tax_lien', 'foreclosure_notice', 'vacant'] });
    expect(multiple).toBeGreaterThan(single);
  });

  test('score is always between 0 and 100', () => {
    const bigIndicators = Object.keys({ foreclosure_notice: 1, lis_pendens: 1, tax_lien: 1, tax_delinquent: 1,
      probate: 1, code_violation: 1, hoa_lien: 1, bankruptcy: 1, divorce: 1, vacant: 1 });
    const score = calculateDistressScore({
      ...baseProperty,
      distress_indicators: bigIndicators,
      notice_date: new Date().toISOString(),
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Deal Quality Score
// ---------------------------------------------------------------------------
describe('calculateDealQualityScore', () => {
  test('SFR with high equity scores well', () => {
    const score = calculateDealQualityScore({
      ...baseProperty,
      estimated_arv: 400000,
      amount_owed: 100000,   // 75% equity
      asking_price: 250000,  // 37.5% below market
    });
    expect(score).toBeGreaterThan(50);
  });

  test('unknown property type still returns a number', () => {
    const score = calculateDealQualityScore({ ...baseProperty, property_type: 'unknown_type' });
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('property with no equity still returns valid score', () => {
    const score = calculateDealQualityScore({ ...baseProperty, estimated_arv: 0 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Contact Likelihood Score
// ---------------------------------------------------------------------------
describe('calculateContactLikelihoodScore', () => {
  test('all contact info present = high score', () => {
    const score = calculateContactLikelihoodScore(baseProperty);
    expect(score).toBeGreaterThan(50);
  });

  test('no contact info = low score', () => {
    const score = calculateContactLikelihoodScore({
      ...baseProperty,
      owner_phone: null,
      owner_email: null,
      owner_mailing_address: null,
    });
    expect(score).toBeLessThan(30);
  });

  test('out-of-state owner gets bonus', () => {
    const inState  = calculateContactLikelihoodScore({ ...baseProperty, state: 'AZ', owner_state: 'AZ' });
    const outState = calculateContactLikelihoodScore({ ...baseProperty, state: 'AZ', owner_state: 'CA' });
    expect(outState).toBeGreaterThan(inState);
  });
});

// ---------------------------------------------------------------------------
// Timeline Urgency Score
// ---------------------------------------------------------------------------
describe('calculateTimelineUrgencyScore', () => {
  test('imminent auction (≤14 days) = high score', () => {
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const score = calculateTimelineUrgencyScore({ ...baseProperty, auction_date: soon });
    expect(score).toBeGreaterThan(40);
  });

  test('auction far in future = lower score', () => {
    const far = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const score = calculateTimelineUrgencyScore({ ...baseProperty, auction_date: far });
    expect(score).toBeLessThan(20);
  });

  test('no dates = 0', () => {
    expect(calculateTimelineUrgencyScore(baseProperty)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Composite Score
// ---------------------------------------------------------------------------
describe('assignCompositeScore', () => {
  test('weighted average is correct', () => {
    const score = assignCompositeScore({
      distress: 100,
      dealQuality: 100,
      contactLikelihood: 100,
      timelineUrgency: 100,
    });
    expect(score).toBe(100);
  });

  test('all zeroes = 0', () => {
    expect(assignCompositeScore({ distress: 0, dealQuality: 0, contactLikelihood: 0, timelineUrgency: 0 })).toBe(0);
  });

  test('mixed values are bounded 0–100', () => {
    const score = assignCompositeScore({ distress: 80, dealQuality: 60, contactLikelihood: 40, timelineUrgency: 20 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// Tier Assignment
// ---------------------------------------------------------------------------
describe('assignPriorityTier', () => {
  test.each([
    [85, 'Tier 1'],
    [80, 'Tier 1'],
    [79, 'Tier 2'],
    [60, 'Tier 2'],
    [59, 'Tier 3'],
    [40, 'Tier 3'],
    [39, 'Tier 4'],
    [0,  'Tier 4'],
  ])('score %i → %s', (score, tier) => {
    expect(assignPriorityTier(score)).toBe(tier);
  });
});

// ---------------------------------------------------------------------------
// Deal Type
// ---------------------------------------------------------------------------
describe('identifyDealType', () => {
  test('identifies foreclosure', () => {
    expect(identifyDealType({ distress_indicators: ['foreclosure_notice'] })).toBe('Foreclosure');
  });

  test('identifies tax lien', () => {
    expect(identifyDealType({ distress_indicators: ['tax_lien'] })).toBe('Tax Lien');
  });

  test('identifies probate', () => {
    expect(identifyDealType({ distress_indicators: ['probate'] })).toBe('Probate');
  });

  test('returns Other Distress for unknown indicators', () => {
    expect(identifyDealType({ distress_indicators: ['mystery_indicator'] })).toBe('Other Distress');
  });

  test('empty indicators → Other Distress', () => {
    expect(identifyDealType({ distress_indicators: [] })).toBe('Other Distress');
  });
});

// ---------------------------------------------------------------------------
// Full scoreProperty pipeline
// ---------------------------------------------------------------------------
describe('scoreProperty', () => {
  test('returns all required score fields', () => {
    const result = scoreProperty(foreclosureProperty);
    expect(result).toHaveProperty('distress_score');
    expect(result).toHaveProperty('deal_quality_score');
    expect(result).toHaveProperty('contact_likelihood_score');
    expect(result).toHaveProperty('timeline_urgency_score');
    expect(result).toHaveProperty('composite_score');
    expect(result).toHaveProperty('priority_tier');
    expect(result).toHaveProperty('deal_type');
  });

  test('all scores are integers in 0–100 range', () => {
    const result = scoreProperty(foreclosureProperty);
    const scoreFields = ['distress_score','deal_quality_score','contact_likelihood_score','timeline_urgency_score','composite_score'];
    for (const field of scoreFields) {
      expect(result[field]).toBeGreaterThanOrEqual(0);
      expect(result[field]).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result[field])).toBe(true);
    }
  });

  test('high-distress property gets Tier 1 or Tier 2', () => {
    const result = scoreProperty({
      ...foreclosureProperty,
      distress_indicators: ['foreclosure_notice', 'tax_lien', 'vacant'],
      estimated_arv: 500000,
      amount_owed: 100000,
      asking_price: 280000,
      owner_phone: '6025551234',
      owner_email: 'owner@example.com',
    });
    expect(['Tier 1', 'Tier 2']).toContain(result.priority_tier);
  });
});
