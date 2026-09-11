-- Inbound lead segments — adds the two segments inbound capture produces.
--
-- 'renter'          — rental demand: someone looking for a place to rent.
-- 'general_inquiry' — inbound of undetermined intent. Deliberately its own
--                     value rather than being forced into an existing
--                     segment: enrich-leads scores per segment, so filing an
--                     unknown inquiry under (say) homeowner would have Claude
--                     score it as a $500k+ titleholder it has no evidence is
--                     one.
--
-- Mirrors the earlier add-'homeowner' migration: the CHECK enumerates allowed
-- values, so a new segment needs the constraint rebuilt or every insert fails.

ALTER TABLE public.isa_leads DROP CONSTRAINT IF EXISTS isa_leads_segment_check;

ALTER TABLE public.isa_leads ADD CONSTRAINT isa_leads_segment_check CHECK (
  segment = ANY (ARRAY[
    'athlete',
    'expat_relocation',
    'investor',
    'film_tv',
    'motivated_seller',
    'first_time_buyer',
    'divorce',
    'empty_nester',
    'developer',
    'homeowner',
    'renter',
    'general_inquiry'
  ]::text[])
);
