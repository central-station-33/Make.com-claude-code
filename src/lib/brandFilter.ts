/**
 * Scope a Supabase query to the active brand (UI filter from the brand
 * switcher). No-op when no brand is selected. Works on any table or view
 * that exposes `brand_id`.
 */
export function withBrand<T>(query: T, brandId: string | null | undefined): T {
  if (!brandId) return query;
  return (query as unknown as { eq: (c: string, v: string) => T }).eq('brand_id', brandId);
}
