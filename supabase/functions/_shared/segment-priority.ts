/**
 * Lead segment priority — governs which segments consume scarce, *paid*
 * resources first: Claude enrichment (per-token) and BatchData skip tracing
 * (per-hit). Set 2026-09-08: residential homeowners are the main search,
 * investors second, celebrities/athletes third.
 *
 * This intentionally does NOT gate notify-isa. Priority is about what we
 * spend money discovering, not about hiding a lead an ISA already has —
 * an already-enriched hot athlete still outranks a cold homeowner on the
 * ISA's call list, and that ordering is bant_score's job.
 */

export const PRIMARY   = 1;
export const SECONDARY = 2;
export const TERTIARY  = 3;

// Only the segments the priority call actually named are listed. Everything
// else falls to DEFAULT_PRIORITY rather than being silently demoted --
// motivated_seller, divorce, empty_nester et al are residential consumer
// segments in the same spirit as homeowner, and no one asked to rank them.
export const SEGMENT_PRIORITY: Record<string, number> = {
  homeowner: PRIMARY,
  investor:  SECONDARY,
  athlete:   TERTIARY,
  film_tv:   TERTIARY,  // the "celebrity" segment — production/talent leads
};

export const DEFAULT_PRIORITY = SECONDARY;

export interface SegmentTier {
  priority: number;
  /** Segments in this tier, or null for "everything not named above". */
  segments: string[] | null;
}

/**
 * Tiers in the order a budget should be spent. One tier has
 * `segments: null` — the catch-all for everything not named in
 * SEGMENT_PRIORITY. It sits at DEFAULT_PRIORITY *in the sort*, not tacked on
 * the end: appending it would rank unnamed segments below tertiary, which is
 * the silent demotion the map above exists to avoid. A segment added to
 * isa_leads later is therefore still picked up rather than becoming
 * invisible to every consumer.
 */
export function segmentTiers(): SegmentTier[] {
  const byPriority = new Map<number, string[]>();

  for (const [segment, priority] of Object.entries(SEGMENT_PRIORITY)) {
    const bucket = byPriority.get(priority) ?? [];
    bucket.push(segment);
    byPriority.set(priority, bucket);
  }

  const tiers: SegmentTier[] = [...byPriority.entries()]
    .map(([priority, segments]) => ({ priority, segments } as SegmentTier));

  tiers.push({ priority: DEFAULT_PRIORITY, segments: null });

  // Stable sort: at equal priority, explicitly named segments run before the
  // catch-all, so the ranked segments get first call on a partial budget.
  return tiers.sort((a, b) =>
    a.priority - b.priority ||
    (a.segments === null ? 1 : 0) - (b.segments === null ? 1 : 0)
  );
}

/**
 * PostgREST filter value excluding every explicitly ranked segment, for the
 * catch-all tier. Matches the '("a","b")' quoting the other functions use.
 */
export function unrankedSegmentFilter(): string {
  return `(${Object.keys(SEGMENT_PRIORITY).map((s) => `"${s}"`).join(',')})`;
}
