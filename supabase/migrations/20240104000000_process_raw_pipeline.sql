-- Track which raw_properties records have been processed into the properties table
ALTER TABLE raw_properties ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ NULL;

-- Partial index so process-raw-properties can quickly find unprocessed records
CREATE INDEX IF NOT EXISTS raw_properties_unprocessed_idx
  ON raw_properties (received_at ASC)
  WHERE processed_at IS NULL;
