-- InRange Schema — run in Supabase SQL Editor or via `supabase db push`
-- Safe to re-run (all CREATE statements use IF NOT EXISTS)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- raw_properties — append-only ingest log from Make.com webhooks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_properties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_hash TEXT    NOT NULL,
  source        TEXT    NOT NULL,
  raw_data      JSONB   NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS raw_properties_hash_idx ON raw_properties (property_hash);

-- ---------------------------------------------------------------------------
-- properties — scored, normalized, enriched properties
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_hash             TEXT UNIQUE NOT NULL,
  source                    TEXT,
  data_sources              JSONB DEFAULT '[]',

  -- Address
  address                   TEXT,
  city                      TEXT,
  state                     CHAR(2),
  zip                       TEXT,
  county                    TEXT,
  lat                       NUMERIC(10,7),
  lng                       NUMERIC(10,7),

  -- Property details
  property_type             TEXT,
  bedrooms                  SMALLINT,
  bathrooms                 NUMERIC(4,1),
  square_footage            INTEGER,
  year_built                SMALLINT,

  -- Financials
  estimated_arv             NUMERIC(12,2),
  amount_owed               NUMERIC(12,2),
  asking_price              NUMERIC(12,2),
  equity                    NUMERIC(12,2),
  equity_percentage         SMALLINT,
  below_market_percentage   SMALLINT,
  assessed_value            NUMERIC(12,2),
  taxes_owed                NUMERIC(12,2),

  -- Owner
  owner_name                TEXT,
  owner_phone               TEXT,
  owner_email               TEXT,
  owner_mailing_address     TEXT,
  owner_type                TEXT,
  owner_state               CHAR(2),

  -- Distress signals
  distress_indicators       JSONB DEFAULT '[]',
  notice_date               TIMESTAMPTZ,
  auction_date              TIMESTAMPTZ,
  process_stage             TEXT,
  case_number               TEXT,

  -- Scoring
  distress_score            SMALLINT CHECK (distress_score BETWEEN 0 AND 100),
  deal_quality_score        SMALLINT CHECK (deal_quality_score BETWEEN 0 AND 100),
  contact_likelihood_score  SMALLINT CHECK (contact_likelihood_score BETWEEN 0 AND 100),
  timeline_urgency_score    SMALLINT CHECK (timeline_urgency_score BETWEEN 0 AND 100),
  composite_score           SMALLINT CHECK (composite_score BETWEEN 0 AND 100),
  priority_tier             TEXT CHECK (priority_tier IN ('Tier 1','Tier 2','Tier 3','Tier 4')),
  deal_type                 TEXT,

  -- Burnt out landlord
  burnt_out_landlord_score  SMALLINT CHECK (burnt_out_landlord_score BETWEEN 0 AND 100),
  burnt_out_signals         JSONB,

  -- AI enrichment
  ai_analysis               JSONB,
  ai_enriched_at            TIMESTAMPTZ,
  enrichment_status         TEXT DEFAULT 'pending'
                              CHECK (enrichment_status IN ('pending','processing','complete','failed','skipped')),

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prop_score_idx        ON properties (composite_score DESC);
CREATE INDEX IF NOT EXISTS prop_tier_idx         ON properties (priority_tier);
CREATE INDEX IF NOT EXISTS prop_state_idx        ON properties (state);
CREATE INDEX IF NOT EXISTS prop_county_idx       ON properties (county);
CREATE INDEX IF NOT EXISTS prop_created_idx      ON properties (created_at DESC);
CREATE INDEX IF NOT EXISTS prop_auction_idx      ON properties (auction_date);
CREATE INDEX IF NOT EXISTS prop_enrich_idx       ON properties (enrichment_status);
CREATE INDEX IF NOT EXISTS prop_address_trgm_idx ON properties USING gin (address gin_trgm_ops);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- contact_activities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_activities (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id    UUID REFERENCES properties(id) ON DELETE CASCADE,
  contact_method TEXT,  -- phone | email | sms | mail | door_knock
  contact_date   TIMESTAMPTZ,
  outcome        TEXT,  -- no_answer | left_voicemail | interested | not_interested | callback
  notes          TEXT,
  agent_id       TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_prop_idx ON contact_activities (property_id);

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  status          TEXT,  -- lead | offer_made | under_contract | closed | dead
  deal_type       TEXT,
  offer_price     NUMERIC(12,2),
  contract_price  NUMERIC(12,2),
  close_date      DATE,
  profit_estimate NUMERIC(12,2),
  notes           TEXT,
  agent_id        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- notification_log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  notification_type TEXT,  -- email | slack | sms
  recipient         TEXT,
  status            TEXT,  -- sent | delivered | failed | bounced
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notif_prop_idx    ON notification_log (property_id);
CREATE INDEX IF NOT EXISTS notif_status_idx  ON notification_log (status);

-- ---------------------------------------------------------------------------
-- Row-Level Security — enable but allow service role full access
-- ---------------------------------------------------------------------------
ALTER TABLE raw_properties     ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log   ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; these policies are for anon/authenticated roles
CREATE POLICY IF NOT EXISTS "service_role_all" ON raw_properties     FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON properties         FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON contact_activities FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON deals              FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "service_role_all" ON notification_log   FOR ALL USING (true);
