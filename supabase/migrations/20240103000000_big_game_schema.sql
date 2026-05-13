-- Big Game Department Schema
-- Properties related to entertainment, sports, and corporate events

CREATE TABLE IF NOT EXISTS big_game_properties (
  id                    SERIAL PRIMARY KEY,
  address               TEXT,
  city                  TEXT,
  state                 TEXT,
  zip                   TEXT,
  listing_type          TEXT,  -- rental | sale | lease
  property_type         TEXT,  -- house | condo | estate | commercial
  price_monthly         NUMERIC(12,2),
  price_sale            NUMERIC(12,2),
  bedrooms              INT,
  bathrooms             NUMERIC(4,1),
  listing_url           TEXT,
  source                TEXT,
  source_id             TEXT,
  entertainment_signals TEXT,
  sports_signals        TEXT,
  corporate_signals     TEXT,
  raw_listing_data      JSONB,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS big_game_state_idx    ON big_game_properties (state);
CREATE INDEX IF NOT EXISTS big_game_city_idx     ON big_game_properties (city);
CREATE INDEX IF NOT EXISTS big_game_type_idx     ON big_game_properties (listing_type);
CREATE INDEX IF NOT EXISTS big_game_created_idx  ON big_game_properties (created_at DESC);

ALTER TABLE big_game_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON big_game_properties;
CREATE POLICY "service_role_all" ON big_game_properties FOR ALL USING (true);

-- Big Game Scores
CREATE TABLE IF NOT EXISTS big_game_scores (
  id                      SERIAL PRIMARY KEY,
  property_id             INT REFERENCES big_game_properties(id) ON DELETE CASCADE,
  opportunity_fit_score   NUMERIC(3,2),
  opportunity_type        TEXT,
  decision_maker_signals  TEXT,
  confidence_level        TEXT,
  claude_analysis         JSONB,
  recommended_action      TEXT,
  tier                    TEXT,
  scored_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS big_game_scores_prop_idx  ON big_game_scores (property_id);
CREATE INDEX IF NOT EXISTS big_game_scores_tier_idx  ON big_game_scores (tier);
CREATE INDEX IF NOT EXISTS big_game_scores_time_idx  ON big_game_scores (scored_at DESC);

ALTER TABLE big_game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON big_game_scores;
CREATE POLICY "service_role_all" ON big_game_scores FOR ALL USING (true);

-- Big Game Leads
CREATE TABLE IF NOT EXISTS big_game_leads (
  id                    SERIAL PRIMARY KEY,
  property_id           INT REFERENCES big_game_properties(id) ON DELETE CASCADE,
  score_id              INT REFERENCES big_game_scores(id) ON DELETE SET NULL,
  decision_maker_name   TEXT,
  decision_maker_title  TEXT,
  decision_maker_org    TEXT,
  contact_email         TEXT,
  contact_phone         TEXT,
  contact_linkedin      TEXT,
  assignment_status     TEXT DEFAULT 'unassigned',
  assigned_to_agent     TEXT,
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS big_game_leads_prop_idx    ON big_game_leads (property_id);
CREATE INDEX IF NOT EXISTS big_game_leads_status_idx  ON big_game_leads (assignment_status);
CREATE INDEX IF NOT EXISTS big_game_leads_agent_idx   ON big_game_leads (assigned_to_agent);

ALTER TABLE big_game_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON big_game_leads;
CREATE POLICY "service_role_all" ON big_game_leads FOR ALL USING (true);
