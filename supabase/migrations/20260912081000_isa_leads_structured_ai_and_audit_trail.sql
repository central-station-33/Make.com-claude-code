-- Applied live 2026-09-12; tracked here for parity with the running database.
--
-- Structured enrichment output + provenance for every AI write.
--
-- Before this, enrich-leads produced one free-text ai_summary plus three
-- collapsed numbers (bant_score, motivation_score, routing). Two problems:
--
-- 1. The BANT components the prompt actually scores (budget/authority/need/
--    timing, 0-3 each) were summed into one 0-12 figure, so nobody could see
--    WHICH axis made a lead hot -- an ISA cannot act on "7/12", and the score
--    could not be audited or re-weighted after the fact.
-- 2. Nothing recorded which model, prompt or run produced a given assessment.
--    Every enrichment is a paid Claude call whose output an ISA acts on, and
--    the model string in the function has already changed at least once. With
--    no provenance there is no way to tell a stale assessment from a current
--    one, to re-run only the rows a superseded prompt touched, or to attribute
--    a bad call to the version that made it.

ALTER TABLE isa_leads
  -- Structured assessment
  ADD COLUMN IF NOT EXISTS ai_investment_thesis text,
  ADD COLUMN IF NOT EXISTS ai_contact_strategy  text,
  ADD COLUMN IF NOT EXISTS ai_bant_budget       smallint,
  ADD COLUMN IF NOT EXISTS ai_bant_authority    smallint,
  ADD COLUMN IF NOT EXISTS ai_bant_need         smallint,
  ADD COLUMN IF NOT EXISTS ai_bant_timing       smallint,
  -- How much the model trusts its own read given how thin the input was.
  -- Most leads are built from public records with no stated intent, so a
  -- confident-sounding summary over near-zero signal is the failure mode this
  -- exists to surface.
  ADD COLUMN IF NOT EXISTS ai_confidence        smallint,
  ADD COLUMN IF NOT EXISTS ai_risk_flags        text[],
  -- Provenance
  ADD COLUMN IF NOT EXISTS ai_model             text,
  ADD COLUMN IF NOT EXISTS ai_prompt_version    text,
  ADD COLUMN IF NOT EXISTS ai_enriched_at       timestamptz,
  ADD COLUMN IF NOT EXISTS ai_input_tokens      integer,
  ADD COLUMN IF NOT EXISTS ai_output_tokens     integer;

ALTER TABLE isa_leads
  DROP CONSTRAINT IF EXISTS isa_leads_ai_bant_components_check,
  DROP CONSTRAINT IF EXISTS isa_leads_ai_confidence_check;

ALTER TABLE isa_leads
  ADD CONSTRAINT isa_leads_ai_bant_components_check CHECK (
    (ai_bant_budget    IS NULL OR ai_bant_budget    BETWEEN 0 AND 3) AND
    (ai_bant_authority IS NULL OR ai_bant_authority BETWEEN 0 AND 3) AND
    (ai_bant_need      IS NULL OR ai_bant_need      BETWEEN 0 AND 3) AND
    (ai_bant_timing    IS NULL OR ai_bant_timing    BETWEEN 0 AND 3)
  ),
  ADD CONSTRAINT isa_leads_ai_confidence_check CHECK (
    ai_confidence IS NULL OR ai_confidence BETWEEN 1 AND 5
  );

-- Finding every lead a superseded prompt or model touched is the whole point
-- of storing provenance, so make that lookup cheap.
CREATE INDEX IF NOT EXISTS isa_leads_ai_provenance_idx
  ON isa_leads (ai_prompt_version, ai_model, ai_enriched_at DESC);

COMMENT ON COLUMN isa_leads.ai_prompt_version IS
  'ENRICH_PROMPT_VERSION from enrich-leads at write time. Bump it in the function whenever the prompt changes meaning, so superseded assessments are identifiable.';
