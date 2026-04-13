'use strict';

const { parseCurrency, formatCurrency, percentage, clamp, round } = require('../src/utils/numberHelpers');
const { parseDate, formatDate, daysBetween, daysUntil, daysSince } = require('../src/utils/dateHelpers');
const { cleanName, formatPhone, parseAddress, sanitize } = require('../src/utils/stringHelpers');
const { deduplicate, groupBy, chunk } = require('../src/utils/arrayHelpers');
const { generatePropertyHash } = require('../src/utils/cryptoHelpers');
const { successResponse, errorResponse, paginatedResponse } = require('../src/utils/responseFormatter');

// ---------------------------------------------------------------------------
// Number helpers
// ---------------------------------------------------------------------------
describe('numberHelpers', () => {
  test('parseCurrency strips $ and commas', () => {
    expect(parseCurrency('$350,000')).toBe(350000);
    expect(parseCurrency('200000')).toBe(200000);
    expect(parseCurrency(null)).toBeNull();
    expect(parseCurrency('')).toBeNull();
  });

  test('formatCurrency formats USD', () => {
    expect(formatCurrency(350000)).toContain('350,000');
  });

  test('percentage calculates correctly', () => {
    expect(percentage(75, 100)).toBe(75);
    expect(percentage(1, 3, 4)).toBe(33.3333);
    expect(percentage(10, 0)).toBeNull();
  });

  test('clamp constrains value', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  test('round to decimal places', () => {
    expect(round(3.14159, 2)).toBe(3.14);
    expect(round(3.5)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
describe('dateHelpers', () => {
  test('parseDate handles ISO strings', () => {
    const d = parseDate('2024-06-15');
    expect(d).toBeInstanceOf(Date);
  });

  test('parseDate returns null for invalid', () => {
    expect(parseDate('not-a-date')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });

  test('daysBetween calculates difference', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-01-11');
    expect(daysBetween(d1, d2)).toBe(10);
  });

  test('daysUntil returns positive for future date', () => {
    const future = new Date(Date.now() + 5 * 86400000);
    expect(daysUntil(future)).toBeGreaterThan(0);
  });

  test('daysSince returns positive for past date', () => {
    const past = new Date(Date.now() - 3 * 86400000);
    expect(daysSince(past)).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// String helpers
// ---------------------------------------------------------------------------
describe('stringHelpers', () => {
  test('cleanName title-cases and trims', () => {
    expect(cleanName('  JOHN   DOE  ')).toBe('John Doe');
    expect(cleanName('')).toBe('');
  });

  test('formatPhone 10-digit', () => {
    expect(formatPhone('6025551234')).toBe('(602) 555-1234');
  });

  test('formatPhone 11-digit with country code', () => {
    expect(formatPhone('16025551234')).toBe('(602) 555-1234');
  });

  test('parseAddress extracts zip and state', () => {
    const result = parseAddress('123 Main St, Phoenix, AZ 85001');
    expect(result.zip).toBe('85001');
    expect(result.state).toBe('AZ');
  });

  test('sanitize removes dangerous chars', () => {
    expect(sanitize('<script>alert("xss")</script>')).not.toContain('<');
    expect(sanitize("O'Brien")).not.toContain("'");
  });
});

// ---------------------------------------------------------------------------
// Array helpers
// ---------------------------------------------------------------------------
describe('arrayHelpers', () => {
  test('deduplicate primitives', () => {
    expect(deduplicate([1, 2, 2, 3])).toEqual([1, 2, 3]);
  });

  test('deduplicate by key', () => {
    const items = [{ id: 1, v: 'a' }, { id: 1, v: 'b' }, { id: 2, v: 'c' }];
    expect(deduplicate(items, 'id')).toHaveLength(2);
  });

  test('groupBy key', () => {
    const items = [{ tier: 'A' }, { tier: 'B' }, { tier: 'A' }];
    const groups = groupBy(items, 'tier');
    expect(groups.A).toHaveLength(2);
    expect(groups.B).toHaveLength(1);
  });

  test('chunk splits array', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------
describe('cryptoHelpers', () => {
  test('same property produces same hash', () => {
    const prop = { address: '123 Main St', city: 'Phoenix', state: 'AZ', zip: '85001', owner_name: 'John', source: 'test' };
    expect(generatePropertyHash(prop)).toBe(generatePropertyHash(prop));
  });

  test('different address produces different hash', () => {
    const p1 = { address: '123 Main St', city: 'Phoenix', state: 'AZ', zip: '85001', owner_name: 'John', source: 'test' };
    const p2 = { ...p1, address: '456 Oak Ave' };
    expect(generatePropertyHash(p1)).not.toBe(generatePropertyHash(p2));
  });
});

// ---------------------------------------------------------------------------
// Response formatter
// ---------------------------------------------------------------------------
describe('responseFormatter', () => {
  test('successResponse has expected shape', () => {
    const r = successResponse({ id: 1 }, 'OK');
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ id: 1 });
    expect(r.message).toBe('OK');
    expect(r.timestamp).toBeDefined();
  });

  test('errorResponse has expected shape', () => {
    const r = errorResponse('Bad input', ['field required'], 400);
    expect(r.success).toBe(false);
    expect(r.statusCode).toBe(400);
    expect(r.errors).toHaveLength(1);
  });

  test('paginatedResponse calculates totalPages', () => {
    const r = paginatedResponse([1, 2], 100, 2, 10);
    expect(r.meta.totalPages).toBe(10);
    expect(r.meta.hasNext).toBe(true);
    expect(r.meta.hasPrev).toBe(true);
  });
});
