-- InRange Backend — Database Schema
-- Run once against your PostgreSQL instance.
-- Requires: pg_trgm extension for fuzzy address matching (optional but recommended).

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- Raw ingest table (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_properties (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_hash TEXT NOT NULL,
    source        TEXT NOT NULL,
    raw_data      JSONB NOT NULL,
    received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS raw_properties_hash_idx ON raw_properties (property_hash);

-- ---------------------------------------------------------------------------
-- Main properties table
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
    lat                       NUMERIC(10, 7),
    lng                       NUMERIC(10, 7),

    -- Property details
    property_type             TEXT,
    bedrooms                  SMALLINT,
    bathrooms                 NUMERIC(4, 1),
    square_footage            INTEGER,
    year_built                SMALLINT,
    lot_size                  TEXT,

    -- Financials
    estimated_arv             NUMERIC(12, 2),
    amount_owed               NUMERIC(12, 2),
    asking_price              NUMERIC(12, 2),
    equity                    NUMERIC(12, 2),
    equity_percentage         SMALLINT,
    below_market_percentage   SMALLINT,
    assessed_value            NUMERIC(12, 2),
    taxes_owed                NUMERIC(12, 2),
    median_home_value         NUMERIC(12, 2),

    -- Owner
    owner_name                TEXT,
    owner_phone               TEXT,
    owner_email               TEXT,
    owner_mailing_address     TEXT,
    owner_type                TEXT,
    owner_state               CHAR(2),

    -- Distress
    distress_indicators       JSONB DEFAULT '[]',
    notice_date               TIMESTAMPTZ,
    auction_date              TIMESTAMPTZ,
    record_date               TIMESTAMPTZ,
    process_stage             TEXT,
    case_number               TEXT,

    -- Scores
    distress_score            SMALLINT CHECK (distress_score BETWEEN 0 AND 100),
    deal_quality_score        SMALLINT CHECK (deal_quality_score BETWEEN 0 AND 100),
    contact_likelihood_score  SMALLINT CHECK (contact_likelihood_score BETWEEN 0 AND 100),
    timeline_urgency_score    SMALLINT CHECK (timeline_urgency_score BETWEEN 0 AND 100),
    composite_score           SMALLINT CHECK (composite_score BETWEEN 0 AND 100),
    priority_tier             TEXT CHECK (priority_tier IN ('Tier 1','Tier 2','Tier 3','Tier 4')),
    deal_type                 TEXT,

    -- AI Enrichment
    ai_analysis               JSONB,
    ai_enriched_at            TIMESTAMPTZ,
    enrichment_status         TEXT DEFAULT 'pending'
                                CHECK (enrichment_status IN ('pending','processing','complete','failed')),

    -- Timestamps
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS properties_composite_score_idx ON properties (composite_score DESC);
CREATE INDEX IF NOT EXISTS properties_priority_tier_idx ON properties (priority_tier);
CREATE INDEX IF NOT EXISTS properties_state_idx ON properties (state);
CREATE INDEX IF NOT EXISTS properties_county_idx ON properties (county);
CREATE INDEX IF NOT EXISTS properties_created_at_idx ON properties (created_at DESC);
CREATE INDEX IF NOT EXISTS properties_auction_date_idx ON properties (auction_date);
CREATE INDEX IF NOT EXISTS properties_address_trgm_idx ON properties USING gin (address gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Contact activities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_activities (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id    UUID REFERENCES properties(id) ON DELETE CASCADE,
    contact_method TEXT,   -- phone, email, sms, mail, door_knock
    contact_date   TIMESTAMPTZ,
    outcome        TEXT,   -- no_answer, left_voicemail, interested, not_interested, callback
    notes          TEXT,
    agent_id       TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_activities_property_idx ON contact_activities (property_id);

-- ---------------------------------------------------------------------------
-- Deals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    status          TEXT,   -- lead, offer_made, under_contract, closed, dead
    deal_type       TEXT,
    offer_price     NUMERIC(12, 2),
    contract_price  NUMERIC(12, 2),
    close_date      DATE,
    profit_estimate NUMERIC(12, 2),
    notes           TEXT,
    agent_id        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Notification log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
    notification_type TEXT,   -- email, slack, sms
    recipient         TEXT,
    status            TEXT,   -- sent, delivered, failed, bounced
    error_message     TEXT,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_log_property_idx ON notification_log (property_id);
CREATE INDEX IF NOT EXISTS notification_log_status_idx ON notification_log (status);
