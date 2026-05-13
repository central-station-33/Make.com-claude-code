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
