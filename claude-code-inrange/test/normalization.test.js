'use strict';

const {
  normalizeAddress,
  normalizeFinancials,
  normalizeOwnerInfo,
  normalizeDistressData,
  normalizeProperty,
} = require('../src/services/normalizationService');

describe('normalizeAddress', () => {
  test('parses a string address', () => {
    const result = normalizeAddress('123 Main St, Phoenix, AZ 85001');
    expect(result).toHaveProperty('street');
    expect(result).toHaveProperty('city');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('zip');
  });

  test('handles object with components', () => {
    const result = normalizeAddress({ street: '  123 elm st  ', city: 'austin', state: 'tx', zip: '78701' });
    expect(result.street).toBe('123 ELM ST');
    expect(result.city).toBe('AUSTIN');
    expect(result.state).toBe('TX');
  });

  test('returns empty strings for null input', () => {
    const result = normalizeAddress(null);
    expect(result.street).toBe('');
  });
});

describe('normalizeFinancials', () => {
  test('parses currency strings', () => {
    const result = normalizeFinancials({ estimated_arv: '$350,000', amount_owed: '200000' });
    expect(result.estimated_arv).toBe(350000);
    expect(result.amount_owed).toBe(200000);
  });

  test('calculates equity correctly', () => {
    const result = normalizeFinancials({ estimated_arv: 400000, amount_owed: 100000 });
    expect(result.equity).toBe(300000);
    expect(result.equity_percentage).toBe(75);
  });

  test('calculates below_market_percentage', () => {
    const result = normalizeFinancials({ estimated_arv: 400000, asking_price: 280000 });
    expect(result.below_market_percentage).toBe(30);
  });

  test('handles missing values gracefully', () => {
    const result = normalizeFinancials({});
    expect(result.equity).toBeNull();
    expect(result.estimated_arv).toBeNull();
  });
});

describe('normalizeOwnerInfo', () => {
  test('cleans and title-cases owner name', () => {
    const result = normalizeOwnerInfo({ owner_name: '  JOHN   DOE  ' });
    expect(result.owner_name).toBe('John Doe');
  });

  test('formats US phone number', () => {
    const result = normalizeOwnerInfo({ owner_phone: '6025551234' });
    expect(result.owner_phone).toBe('(602) 555-1234');
  });

  test('lowercases and validates email', () => {
    const result = normalizeOwnerInfo({ owner_email: 'JOHN@EXAMPLE.COM' });
    expect(result.owner_email).toBe('john@example.com');
  });

  test('strips invalid email', () => {
    const result = normalizeOwnerInfo({ owner_email: 'not-an-email' });
    expect(result.owner_email).toBe('');
  });
});

describe('normalizeDistressData', () => {
  test('normalizes indicator strings to snake_case', () => {
    const result = normalizeDistressData({ distress_indicators: ['Foreclosure Notice', 'Tax-Lien'] });
    expect(result.distress_indicators).toContain('foreclosure_notice');
    expect(result.distress_indicators).toContain('tax_lien');
  });

  test('parses ISO dates', () => {
    const date = '2024-06-15';
    const result = normalizeDistressData({ notice_date: date });
    expect(result.notice_date).not.toBeNull();
  });

  test('handles missing distress fields', () => {
    const result = normalizeDistressData({});
    expect(result.distress_indicators).toEqual([]);
    expect(result.notice_date).toBeNull();
  });
});

describe('normalizeProperty', () => {
  test('returns null for null input', () => {
    expect(normalizeProperty(null)).toBeNull();
  });

  test('returns a normalized_at timestamp', () => {
    const result = normalizeProperty({ address: '123 Main', source: 'test' });
    expect(result).toHaveProperty('normalized_at');
  });

  test('uppercases state and county', () => {
    const result = normalizeProperty({ address: '1 A St', state: 'az', county: 'maricopa' });
    expect(result.state).toBe('AZ');
    expect(result.county).toBe('MARICOPA');
  });
});
