/**
 * Individual-vs-entity classification for property owner names.
 *
 * owner_type is not reliable for this: NJ MOD-IV writes building names and
 * tax-program labels straight into owner_name with owner_type='individual'
 * regardless -- "Legacy@Liberty Park", "Public Housing", "North Tower",
 * "5 Year Tax Agreement" all pass through that way. This classifies on the
 * shape of the name itself instead: 2-3 alphabetic words, no digits, none of
 * the vocabulary an entity, building or program name uses.
 *
 * Originally lived only inside skip-trace-leads as an in-request filter,
 * recomputed by scanning up to 500 candidate rows on every call just to find
 * a handful of individuals -- of 291 properties eligible for skip tracing,
 * only ~14 have a real individual owner, almost all HPD-violation buildings
 * are LLC-owned. Persisting the result as `properties.owner_kind` at write
 * time means that filter becomes a plain indexed WHERE clause, and the
 * classification is available to any other consumer (a dedicated
 * entity-owner workflow, a dashboard filter) without recomputing it.
 */

// Deliberately unanchored (no \b at the end): most of these are word stems
// meant to catch every inflection ("associat" -> Associates/Association,
// "compan" -> Company/Companies, "corp" -> Corp/Corporation). Anchoring the
// whole list in \b...\b requires a boundary immediately after the stem --
// there is none between "associat" and a following "es" -- which let
// "Roosevelt Island Associates" pass as an "individual" on a live run.
// "lp", "public" and "park" are kept whole-word: unanchored they would
// wrongly flag real surnames/streets like "Alpert" and "Parker".
const ENTITY_NAME_HINTS =
  /(llc|l\.l\.c|inc|corp|condo|coop|co-op|associat|ltd|\blp\b|owners|compan|congregation|apt|apartment|realty|holding|manage|partner|plaza|properties|tower|housing|college|school|church|temple|\bpublic\b|agreement|\bpark\b|lofts|bank|authority|trust|fund|estate|residence|village|garden|heights|spires|ventures|leasing)/i;

export type OwnerKind = 'individual' | 'entity' | 'unknown';

export function classifyOwnerKind(name: string | null | undefined): OwnerKind {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return 'unknown';

  const words = trimmed.split(/\s+/);
  const looksIndividual =
    words.length >= 2 && words.length <= 3 &&
    !ENTITY_NAME_HINTS.test(trimmed) &&
    words.every((w) => /^[A-Za-z][A-Za-z'.-]*$/.test(w));

  return looksIndividual ? 'individual' : 'entity';
}
