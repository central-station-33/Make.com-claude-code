-- InRange: Three-module taxonomy resolution + Rental Leasing module (Module 3)
--
-- Context: isa_leads.segment conflated two different things — marketing
-- persona (athlete, expat_relocation, divorce...) and pipeline classification
-- (investor vs residential vs rental). That made it impossible to cleanly
-- route dashboards/agents by module. This migration:
--   1. Adds `module` + `lead_role` as the authoritative pipeline classifiers,
--      backfills them from existing segment data, and leaves `segment` as a
--      pure marketing-persona tag.
--   2. Replaces the flawed (segment, market, name)-based dedup index with
--      phone/email-based dedup, matching what respond-lead already does in
--      application code (verified against live data: zero collisions).
--   3. Adds platform-wide consent/opt-out tracking (nothing tracked this
--      before, for any lead type).
--   4. Adds the Rental Leasing module's tables (Module 3): rental_inquiries,
--      landlord_leads, rental_units, rental_matches, tours,
--      rental_applications.
--   5. Adds lead_source_events (granular UTM/attribution) and lead_tasks
--      (agent "next best action"), usable by all three modules.
--   6. Extends relocation_partners into a general referral-partner table
--      and content_queue for the leasing content workflow.
--
-- NOTE: this migration was applied directly to the live Supabase project
-- (omzugrtgwsjypekuzgtn) via the Supabase MCP tools before this repo's
-- CLAUDE.md/README (documenting the repo/deployment drift problem) were
-- found. It is being committed here after the fact to close that gap for
-- this one change, not to fix the drift documented in README.md item 8
-- generally. Applying it again with `supabase db push` against the same
-- project is a safe no-op check (every statement is idempotent-safe or
-- will simply fail-fast if already applied) but is not expected to be
-- necessary — verify with `select module, lead_role, count(*) from
-- isa_leads group by 1,2` before assuming it needs to run again.

-- ─── 1. Module / lead_role taxonomy on isa_leads ──────────────────────────

ALTER TABLE isa_leads ADD COLUMN module TEXT;
ALTER TABLE isa_leads ADD COLUMN lead_role TEXT;

ALTER TABLE isa_leads ADD CONSTRAINT isa_leads_module_check
  CHECK (module IS NULL OR module IN ('distressed_investor', 'residential_sale', 'rental_leasing'));

ALTER TABLE isa_leads ADD CONSTRAINT isa_leads_lead_role_check
  CHECK (lead_role IS NULL OR lead_role IN ('buyer', 'seller', 'investor', 'renter', 'landlord', 'referral_partner'));

-- Backfill from existing segment data. Verified against live rows
-- (investor=40, homeowner=31, athlete=11 as of this migration):
--   - investor/developer      -> distressed_investor / investor
--   - motivated_seller        -> distressed_investor / seller (active distress signal)
--   - homeowner               -> residential_sale / seller
--       (sampled: high-equity, no-distress "value-qualified" listing
--        prospects sourced from inrange_property_pipeline — a soft seller
--        lead, not an acquisition target)
--   - first_time_buyer        -> residential_sale / buyer
--   - divorce, empty_nester   -> residential_sale / seller (transitioning out of current home)
--   - athlete                 -> residential_sale / buyer
--       (sampled: explicitly "stop renting" / actively shopping to buy)
--   - renter                  -> rental_leasing / renter
--   - film_tv, expat_relocation, general_inquiry -> left NULL.
--       These personas can legitimately be either buy or rent-side and
--       guessing would misroute real leads. They need one-time manual
--       triage (bulk-update after review) rather than an automated guess.
UPDATE isa_leads SET
  module = CASE
    WHEN segment IN ('investor', 'developer', 'motivated_seller') THEN 'distressed_investor'
    WHEN segment IN ('homeowner', 'first_time_buyer', 'divorce', 'empty_nester', 'athlete') THEN 'residential_sale'
    WHEN segment = 'renter' THEN 'rental_leasing'
    ELSE NULL
  END,
  lead_role = CASE
    WHEN segment IN ('investor', 'developer') THEN 'investor'
    WHEN segment = 'motivated_seller' THEN 'seller'
    WHEN segment IN ('homeowner', 'divorce', 'empty_nester') THEN 'seller'
    WHEN segment IN ('first_time_buyer', 'athlete') THEN 'buyer'
    WHEN segment = 'renter' THEN 'renter'
    ELSE NULL
  END
WHERE module IS NULL;

CREATE INDEX idx_isa_leads_module ON isa_leads(module);
CREATE INDEX idx_isa_leads_lead_role ON isa_leads(lead_role);
CREATE INDEX idx_isa_leads_module_needs_triage ON isa_leads(created_at) WHERE module IS NULL;

-- ─── 2. Fix dedup: phone/email, not (segment, market, name) ───────────────
-- The old unique index scoped dedup to (segment, market, name), which does
-- not match respond-lead's actual dedup query (phone/email, no segment
-- filter) and would silently allow two different people with the same
-- common name in the same segment/market to collide, while allowing true
-- duplicates across segments through untouched. Confirmed zero phone/email
-- collisions among active (non-dead/closed) rows before applying this.

DROP INDEX IF EXISTS idx_isa_leads_dedup;

CREATE UNIQUE INDEX idx_isa_leads_dedup_phone ON isa_leads(phone)
  WHERE phone IS NOT NULL AND outreach_status NOT IN ('dead', 'closed');

CREATE UNIQUE INDEX idx_isa_leads_dedup_email ON isa_leads(email)
  WHERE email IS NOT NULL AND outreach_status NOT IN ('dead', 'closed');

-- ─── 3. Consent / do-not-contact tracking (platform-wide gap) ─────────────

ALTER TABLE isa_leads
  ADD COLUMN marketing_consent BOOLEAN,
  ADD COLUMN sms_consent BOOLEAN,
  ADD COLUMN consent_source TEXT,
  ADD COLUMN consent_captured_at TIMESTAMPTZ,
  ADD COLUMN opted_out_at TIMESTAMPTZ,
  ADD COLUMN opted_out_channels TEXT[] NOT NULL DEFAULT '{}';

-- ─── 4. Rental Leasing module (Module 3) ───────────────────────────────────

CREATE TABLE rental_inquiries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isa_lead_id           UUID NOT NULL UNIQUE REFERENCES isa_leads(id) ON DELETE CASCADE,
  move_date             DATE,
  move_date_flexible    BOOLEAN NOT NULL DEFAULT FALSE,
  target_locations      TEXT[] NOT NULL DEFAULT '{}',
  max_rent              NUMERIC,
  min_bedrooms          SMALLINT,
  preferred_bedrooms    SMALLINT,
  bathrooms_needed      NUMERIC,
  household_size        SMALLINT,
  pets                  JSONB NOT NULL DEFAULT '{}',
  parking_needed        BOOLEAN,
  laundry_needed        BOOLEAN,
  accessibility_notes   TEXT,
  unit_style            TEXT CHECK (unit_style IS NULL OR unit_style IN
                           ('furnished', 'unfurnished', 'short_term', 'long_term', 'corporate_housing', 'relocation')),
  tour_availability     JSONB NOT NULL DEFAULT '{}',
  additional_notes      TEXT,
  pipeline_stage        TEXT NOT NULL DEFAULT 'new_inquiry' CHECK (pipeline_stage IN (
                           'new_inquiry', 'contacted', 'awaiting_details', 'qualified', 'matching_inventory',
                           'matches_sent', 'tour_requested', 'tour_booked', 'tour_completed',
                           'application_started', 'application_submitted', 'approved', 'lease_signed',
                           'nurture', 'lost', 'duplicate', 'invalid_spam'
                         )),
  lost_reason           TEXT,
  ai_conversation_summary TEXT,
  ai_missing_info        TEXT[] NOT NULL DEFAULT '{}',
  ai_confidence           SMALLINT CHECK (ai_confidence IS NULL OR ai_confidence BETWEEN 1 AND 5),
  ai_escalation_needed    BOOLEAN NOT NULL DEFAULT FALSE,
  ai_escalation_reason    TEXT,
  ai_model                TEXT,
  ai_enriched_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE landlord_leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isa_lead_id               UUID NOT NULL UNIQUE REFERENCES isa_leads(id) ON DELETE CASCADE,
  owner_id                  UUID REFERENCES owners(owner_id),
  property_address          TEXT,
  city                      TEXT,
  county                    TEXT,
  state                     CHAR(2),
  zip                       TEXT,
  unit_count                SMALLINT,
  unit_details              JSONB NOT NULL DEFAULT '[]',
  expected_rent             NUMERIC,
  vacancy_date              DATE,
  current_status            TEXT,
  leasing_need               TEXT,
  preferred_contact_method  TEXT CHECK (preferred_contact_method IS NULL OR preferred_contact_method IN ('call', 'text', 'email')),
  pipeline_stage             TEXT NOT NULL DEFAULT 'new_lead' CHECK (pipeline_stage IN (
                                'new_lead', 'consultation_scheduled', 'consultation_complete',
                                'listing_agreement_sent', 'listing_agreement_signed', 'active_listing',
                                'tenant_placed', 'recurring_relationship', 'lost'
                              )),
  lost_reason                TEXT,
  notes                      TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rental_units (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_lead_id          UUID REFERENCES landlord_leads(id),
  owner_id                  UUID REFERENCES owners(owner_id),
  building_id                TEXT,
  address                    TEXT NOT NULL,
  unit_number                 TEXT,
  city                        TEXT,
  county                      TEXT,
  state                       CHAR(2) NOT NULL DEFAULT 'NY',
  zip                         TEXT,
  neighborhood                 TEXT,
  lat                          NUMERIC,
  lng                          NUMERIC,
  listing_status                TEXT NOT NULL DEFAULT 'draft' CHECK (listing_status IN
                                 ('draft', 'active', 'pending', 'rented', 'withdrawn', 'expired')),
  available_date                DATE,
  monthly_rent                   NUMERIC,
  estimated_move_in_costs         NUMERIC,
  fee_structure                   JSONB NOT NULL DEFAULT '{}',
  bedrooms                        SMALLINT,
  bathrooms                       NUMERIC,
  square_footage                  INTEGER,
  pet_policy                      TEXT,
  parking                         TEXT,
  laundry                         TEXT,
  amenities                       TEXT[] NOT NULL DEFAULT '{}',
  furnished_status                 TEXT CHECK (furnished_status IS NULL OR furnished_status IN ('furnished', 'unfurnished', 'either')),
  lease_term_options                TEXT[] NOT NULL DEFAULT '{}',
  description                        TEXT,
  photos                              TEXT[] NOT NULL DEFAULT '{}',
  video_url                            TEXT,
  floor_plan_url                        TEXT,
  showing_instructions                   TEXT,
  application_instructions                TEXT,
  listing_source                           TEXT,
  last_verified_at                          TIMESTAMPTZ,
  listing_expiration_date                    DATE,
  assigned_agent_id                           UUID REFERENCES team_agents(id),
  created_at                                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rental_matches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_inquiry_id   UUID NOT NULL REFERENCES rental_inquiries(id) ON DELETE CASCADE,
  rental_unit_id      UUID NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
  fit_score           SMALLINT CHECK (fit_score IS NULL OR fit_score BETWEEN 0 AND 100),
  match_reasons       JSONB NOT NULL DEFAULT '[]',
  match_conflicts     JSONB NOT NULL DEFAULT '[]',
  recommended_rank    SMALLINT,
  match_sent_at       TIMESTAMPTZ,
  renter_response     TEXT,
  tour_status         TEXT,
  final_result        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rental_inquiry_id, rental_unit_id)
);

CREATE TABLE tours (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_inquiry_id   UUID NOT NULL REFERENCES rental_inquiries(id) ON DELETE CASCADE,
  rental_unit_id      UUID NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
  scheduled_at        TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'booked', 'completed', 'no_show', 'cancelled')),
  agent_id              UUID REFERENCES team_agents(id),
  notes                 TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rental_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_inquiry_id   UUID NOT NULL REFERENCES rental_inquiries(id) ON DELETE CASCADE,
  rental_unit_id      UUID NOT NULL REFERENCES rental_units(id) ON DELETE CASCADE,
  status               TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'submitted', 'approved', 'denied', 'withdrawn')),
  submitted_at          TIMESTAMPTZ,
  decided_at             TIMESTAMPTZ,
  notes                  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. Shared attribution + task infrastructure (all 3 modules) ──────────

CREATE TABLE lead_source_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isa_lead_id             UUID REFERENCES isa_leads(id) ON DELETE CASCADE,
  source_channel          TEXT,
  source_platform         TEXT,
  campaign                TEXT,
  ad_creative_id          TEXT,
  utm_source              TEXT,
  utm_medium              TEXT,
  utm_campaign            TEXT,
  utm_content             TEXT,
  landing_page            TEXT,
  referrer_url            TEXT,
  first_touch_at          TIMESTAMPTZ,
  latest_touch_at         TIMESTAMPTZ,
  rental_unit_id          UUID REFERENCES rental_units(id),
  session_id              TEXT,
  phone_tracking_number   TEXT,
  qr_code_id              TEXT,
  relocation_partner_id   UUID REFERENCES relocation_partners(id),
  cost_cents              INTEGER,
  conversion_outcome      TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isa_lead_id         UUID NOT NULL REFERENCES isa_leads(id) ON DELETE CASCADE,
  task_type           TEXT NOT NULL,
  due_at              TIMESTAMPTZ,
  assigned_agent_id   UUID REFERENCES team_agents(id),
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  completed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────

CREATE INDEX idx_rental_inquiries_pipeline_stage ON rental_inquiries(pipeline_stage);
CREATE INDEX idx_landlord_leads_pipeline_stage ON landlord_leads(pipeline_stage);
CREATE INDEX idx_rental_units_status ON rental_units(listing_status);
CREATE INDEX idx_rental_units_city ON rental_units(city);
CREATE INDEX idx_rental_units_landlord_lead ON rental_units(landlord_lead_id);
CREATE INDEX idx_rental_matches_inquiry ON rental_matches(rental_inquiry_id);
CREATE INDEX idx_rental_matches_unit ON rental_matches(rental_unit_id);
CREATE INDEX idx_tours_inquiry ON tours(rental_inquiry_id);
CREATE INDEX idx_tours_scheduled ON tours(scheduled_at);
CREATE INDEX idx_rental_applications_inquiry ON rental_applications(rental_inquiry_id);
CREATE INDEX idx_lead_source_events_lead ON lead_source_events(isa_lead_id);
CREATE INDEX idx_lead_source_events_campaign ON lead_source_events(campaign);
CREATE INDEX idx_lead_tasks_lead ON lead_tasks(isa_lead_id);
CREATE INDEX idx_lead_tasks_due ON lead_tasks(due_at) WHERE status = 'open';

-- ─── updated_at triggers ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rental_inquiries_updated_at BEFORE UPDATE ON rental_inquiries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_landlord_leads_updated_at BEFORE UPDATE ON landlord_leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rental_units_updated_at BEFORE UPDATE ON rental_units FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_rental_applications_updated_at BEFORE UPDATE ON rental_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Row-Level Security (mirrors existing "auth all <table>" convention) ──

ALTER TABLE rental_inquiries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_units         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours                ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all rental_inquiries"    ON rental_inquiries    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all landlord_leads"      ON landlord_leads      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all rental_units"        ON rental_units        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all rental_matches"      ON rental_matches      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all tours"               ON tours               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all rental_applications" ON rental_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all lead_source_events"  ON lead_source_events  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all lead_tasks"          ON lead_tasks          FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── 6. Extend relocation_partners into general referral partners ────────

ALTER TABLE relocation_partners
  ADD COLUMN partner_type TEXT CHECK (partner_type IS NULL OR partner_type IN
    ('relocation_company', 'corporate_hr', 'hospital', 'university', 'attorney', 'realtor', 'other')),
  ADD COLUMN contact_name  TEXT,
  ADD COLUMN contact_email TEXT,
  ADD COLUMN contact_phone TEXT,
  ADD COLUMN company       TEXT;

-- ─── 7. Extend content_queue for the leasing content workflow ────────────

ALTER TABLE content_queue DROP CONSTRAINT content_queue_content_type_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_content_type_check CHECK (content_type = ANY (ARRAY[
  'blog-post', 'linkedin', 'twitter', 'facebook', 'instagram',
  'rental_listing_video', 'reel', 'tiktok', 'youtube_short', 'carousel',
  'listing_email', 'listing_sms', 'neighborhood_guide', 'landlord_vacancy_post',
  'relocation_guide', 'google_business_post'
]::text[]));

ALTER TABLE content_queue DROP CONSTRAINT content_queue_status_check;
ALTER TABLE content_queue ADD CONSTRAINT content_queue_status_check CHECK (status = ANY (ARRAY[
  'pending', 'needs_fact_review', 'needs_compliance_review', 'approved',
  'scheduled', 'published', 'rejected', 'expired', 'archived'
]::text[]));

ALTER TABLE content_queue
  ADD COLUMN linked_rental_unit_id UUID REFERENCES rental_units(id),
  ADD COLUMN linked_market         TEXT,
  ADD COLUMN target_segment        TEXT,
  ADD COLUMN verified_facts        JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN draft_hashtags        TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN draft_cta             TEXT,
  ADD COLUMN tracked_url           TEXT,
  ADD COLUMN utm_campaign          TEXT,
  ADD COLUMN reviewer              TEXT,
  ADD COLUMN expiration_date       DATE,
  ADD COLUMN channel               TEXT,
  ADD COLUMN performance_metrics   JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN compliance_notes      TEXT;

-- Auto-flag property-specific content for review when its listing goes stale.
CREATE OR REPLACE FUNCTION flag_content_on_unit_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.listing_status IS DISTINCT FROM OLD.listing_status
     AND NEW.listing_status IN ('rented', 'withdrawn', 'expired') THEN
    UPDATE content_queue
    SET status = 'needs_fact_review'
    WHERE linked_rental_unit_id = NEW.id
      AND status IN ('approved', 'scheduled', 'published');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_flag_content_on_unit_status_change
AFTER UPDATE ON rental_units
FOR EACH ROW EXECUTE FUNCTION flag_content_on_unit_status_change();

-- ─── 8. Module-scoped dashboard views (Retool-independent) ───────────────

CREATE OR REPLACE VIEW rental_leasing_pipeline AS
SELECT
  il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market,
  il.routing, il.outreach_status, il.assigned_agent_id,
  ri.pipeline_stage, ri.move_date, ri.max_rent, ri.min_bedrooms,
  ri.ai_confidence, ri.ai_escalation_needed, ri.created_at
FROM isa_leads il
JOIN rental_inquiries ri ON ri.isa_lead_id = il.id
WHERE il.module = 'rental_leasing' AND il.lead_role = 'renter';

CREATE OR REPLACE VIEW landlord_leasing_pipeline AS
SELECT
  il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market,
  il.assigned_agent_id,
  ll.pipeline_stage, ll.property_address, ll.expected_rent, ll.vacancy_date, ll.created_at
FROM isa_leads il
JOIN landlord_leads ll ON ll.isa_lead_id = il.id
WHERE il.module = 'rental_leasing' AND il.lead_role = 'landlord';

CREATE OR REPLACE VIEW distressed_investor_pipeline AS
SELECT id AS isa_lead_id, full_name, email, phone, market, routing, outreach_status,
       bant_score, motivation_score, assigned_agent_id, created_at
FROM isa_leads
WHERE module = 'distressed_investor';

CREATE OR REPLACE VIEW residential_sale_pipeline AS
SELECT id AS isa_lead_id, full_name, email, phone, market, lead_role, routing, outreach_status,
       bant_score, motivation_score, assigned_agent_id, created_at
FROM isa_leads
WHERE module = 'residential_sale';

CREATE OR REPLACE VIEW leads_needing_module_triage AS
SELECT id, full_name, segment, market, created_at
FROM isa_leads
WHERE module IS NULL;
