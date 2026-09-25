-- InRange: Exclusive Leasing module (Module 4) — first property: Solace
--
-- Approved by the user 2026-09-24 ~23:30 UTC ("Yes" to building the separate
-- Solace section and loading the 183 market-rate units, branch first).
--
-- Solace (74 St. Marks Pl / 85 4th Ave, Brooklyn) is a building exclusive held
-- by Highline Residential; JRA's MVP Team works it on loan-out. Leads JRA
-- generates are JRA's. Solace leads, units, and pipeline must never mix with
-- the standard rental_leasing module and must only be visible to brokers and
-- agents explicitly placed on the property's team.
--
-- Additive only: new module value, two new tables, new nullable columns,
-- SECURITY DEFINER helpers, RESTRICTIVE RLS policies (which only bite on rows
-- tied to an exclusive property), one validation trigger, two views.
-- Existing permissive policies are untouched, so non-exclusive rows behave
-- exactly as before.

-- ─── 1. Taxonomy ────────────────────────────────────────────────────────────
ALTER TABLE isa_leads DROP CONSTRAINT isa_leads_module_check;
ALTER TABLE isa_leads ADD CONSTRAINT isa_leads_module_check
  CHECK (module IS NULL OR module IN ('distressed_investor', 'residential_sale', 'rental_leasing', 'exclusive_leasing'));

-- ─── 2. Exclusive properties + team ────────────────────────────────────────
CREATE TABLE exclusive_properties (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  display_brand        TEXT NOT NULL,
  address              TEXT NOT NULL,
  alt_address          TEXT,
  neighborhood         TEXT,
  city                 TEXT NOT NULL DEFAULT 'Brooklyn',
  state                CHAR(2) NOT NULL DEFAULT 'NY',
  zip                  TEXT,
  exclusive_holder     TEXT,
  jra_role             TEXT CHECK (jra_role IS NULL OR jra_role IN ('exclusive_agent', 'loan_out', 'co_broke')),
  lead_ownership       TEXT NOT NULL DEFAULT 'jra',
  min_advertised_rent  NUMERIC,
  parking_asking_rent  NUMERIC,
  jra_offer            TEXT,
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exclusive_property_agents (
  exclusive_property_id UUID NOT NULL REFERENCES exclusive_properties(id) ON DELETE CASCADE,
  agent_id              UUID NOT NULL REFERENCES team_agents(id) ON DELETE CASCADE,
  role                  TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('lead', 'agent')),
  added_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (exclusive_property_id, agent_id)
);

-- ─── 3. Link leads and units to an exclusive ──────────────────────────────
ALTER TABLE isa_leads ADD COLUMN exclusive_property_id UUID REFERENCES exclusive_properties(id);
ALTER TABLE isa_leads ADD CONSTRAINT isa_leads_exclusive_property_required
  CHECK (CASE WHEN module = 'exclusive_leasing' THEN exclusive_property_id IS NOT NULL
              ELSE exclusive_property_id IS NULL END);
CREATE INDEX idx_isa_leads_exclusive_property ON isa_leads(exclusive_property_id) WHERE exclusive_property_id IS NOT NULL;

ALTER TABLE rental_units
  ADD COLUMN exclusive_property_id UUID REFERENCES exclusive_properties(id),
  ADD COLUMN floor               SMALLINT,
  ADD COLUMN outdoor_sf          INTEGER,
  ADD COLUMN roof_private_sf     INTEGER,
  ADD COLUMN orientation         TEXT,
  ADD COLUMN owner_advertised    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN staged              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN marketing_priority  TEXT CHECK (marketing_priority IS NULL OR marketing_priority IN ('A', 'B', 'C')),
  ADD COLUMN pricing_review_note TEXT;
CREATE UNIQUE INDEX idx_rental_units_exclusive_unit ON rental_units(exclusive_property_id, unit_number)
  WHERE exclusive_property_id IS NOT NULL;

-- ─── 4. Access helpers (SECURITY DEFINER so RLS checks can't be fooled by
--        rows the caller can't see) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_access_exclusive(p_property UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT p_property IS NULL
      OR public.is_broker()
      OR EXISTS (SELECT 1 FROM exclusive_property_agents epa
                 WHERE epa.exclusive_property_id = p_property
                   AND epa.agent_id = public.current_team_agent_id());
$$;

CREATE OR REPLACE FUNCTION public.exclusive_of_lead(p_lead UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT exclusive_property_id FROM isa_leads WHERE id = p_lead;
$$;

CREATE OR REPLACE FUNCTION public.exclusive_of_unit(p_unit UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT exclusive_property_id FROM rental_units WHERE id = p_unit;
$$;

CREATE OR REPLACE FUNCTION public.exclusive_of_inquiry(p_inquiry UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT il.exclusive_property_id FROM rental_inquiries ri JOIN isa_leads il ON il.id = ri.isa_lead_id WHERE ri.id = p_inquiry;
$$;

REVOKE ALL ON FUNCTION public.can_access_exclusive(UUID), public.exclusive_of_lead(UUID),
  public.exclusive_of_unit(UUID), public.exclusive_of_inquiry(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_exclusive(UUID), public.exclusive_of_lead(UUID),
  public.exclusive_of_unit(UUID), public.exclusive_of_inquiry(UUID) TO authenticated, service_role;

-- ─── 5. RLS on new tables ─────────────────────────────────────────────────
ALTER TABLE exclusive_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusive_property_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brokers manage exclusive_properties" ON exclusive_properties
  FOR ALL TO authenticated USING (public.is_broker()) WITH CHECK (public.is_broker());
CREATE POLICY "team views own exclusive_properties" ON exclusive_properties
  FOR SELECT TO authenticated USING (public.can_access_exclusive(id));

CREATE POLICY "brokers manage exclusive_property_agents" ON exclusive_property_agents
  FOR ALL TO authenticated USING (public.is_broker()) WITH CHECK (public.is_broker());
CREATE POLICY "agents view own exclusive memberships" ON exclusive_property_agents
  FOR SELECT TO authenticated USING (agent_id = public.current_team_agent_id());

REVOKE ALL ON exclusive_properties, exclusive_property_agents FROM anon;

-- ─── 6. RESTRICTIVE policies: exclusive rows only for broker/team ─────────
CREATE POLICY "exclusive isolation" ON isa_leads AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(exclusive_property_id))
  WITH CHECK (public.can_access_exclusive(exclusive_property_id));

CREATE POLICY "exclusive isolation" ON rental_units AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(exclusive_property_id))
  WITH CHECK (public.can_access_exclusive(exclusive_property_id));

CREATE POLICY "exclusive isolation" ON rental_inquiries AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id)));

CREATE POLICY "exclusive isolation" ON lead_tasks AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id)));

CREATE POLICY "exclusive isolation" ON lead_source_events AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id))
     AND public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_lead(isa_lead_id))
     AND public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id)));

CREATE POLICY "exclusive isolation" ON rental_matches AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)));

CREATE POLICY "exclusive isolation" ON tours AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)));

CREATE POLICY "exclusive isolation" ON rental_applications AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)))
  WITH CHECK (public.can_access_exclusive(public.exclusive_of_unit(rental_unit_id))
     AND public.can_access_exclusive(public.exclusive_of_inquiry(rental_inquiry_id)));

-- ─── 7. Minimum advertised rent guard ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_exclusive_min_rent()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE v_min NUMERIC;
BEGIN
  IF NEW.exclusive_property_id IS NOT NULL AND NEW.listing_status = 'active' THEN
    SELECT min_advertised_rent INTO v_min FROM exclusive_properties WHERE id = NEW.exclusive_property_id;
    IF v_min IS NOT NULL AND (NEW.monthly_rent IS NULL OR NEW.monthly_rent < v_min) THEN
      RAISE EXCEPTION 'Unit % rent % is below the minimum advertised rent % for this exclusive',
        NEW.unit_number, NEW.monthly_rent, v_min;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_exclusive_min_rent BEFORE INSERT OR UPDATE ON rental_units
  FOR EACH ROW EXECUTE FUNCTION public.enforce_exclusive_min_rent();

-- ─── 8. Views (security_invoker so RLS above applies) ─────────────────────
CREATE OR REPLACE VIEW exclusive_leasing_pipeline WITH (security_invoker = true) AS
SELECT
  il.id AS isa_lead_id, ep.slug AS property_slug, ep.name AS property_name,
  il.full_name, il.email, il.phone, il.outreach_status, il.assigned_agent_id,
  il.sms_consent, il.marketing_consent, il.created_at AS lead_created_at,
  ri.pipeline_stage, ri.move_date, ri.max_rent, ri.min_bedrooms, ri.preferred_bedrooms,
  ri.ai_confidence, ri.ai_escalation_needed
FROM isa_leads il
JOIN exclusive_properties ep ON ep.id = il.exclusive_property_id
LEFT JOIN rental_inquiries ri ON ri.isa_lead_id = il.id
WHERE il.module = 'exclusive_leasing';

CREATE OR REPLACE VIEW exclusive_inventory_summary WITH (security_invoker = true) AS
SELECT
  ep.slug AS property_slug, ru.bedrooms, ru.listing_status, ru.marketing_priority,
  count(*) AS units, min(ru.monthly_rent) AS min_rent, max(ru.monthly_rent) AS max_rent,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY ru.monthly_rent) AS median_rent,
  count(*) FILTER (WHERE ru.owner_advertised) AS owner_advertised_units,
  count(*) FILTER (WHERE coalesce(ru.outdoor_sf, 0) + coalesce(ru.roof_private_sf, 0) > 0) AS units_with_outdoor
FROM rental_units ru
JOIN exclusive_properties ep ON ep.id = ru.exclusive_property_id
GROUP BY 1, 2, 3, 4;

REVOKE ALL ON exclusive_leasing_pipeline, exclusive_inventory_summary FROM anon;

-- ─── 9. Seed Solace ────────────────────────────────────────────────────────
INSERT INTO exclusive_properties (slug, name, display_brand, address, alt_address, neighborhood, zip,
  exclusive_holder, jra_role, lead_ownership, min_advertised_rent, parking_asking_rent, notes)
VALUES ('solace', 'Solace', 'Solace Leasing by The MVP Team @ Highline Residential',
  '74 St. Marks Place', '85 4th Avenue', 'Park Slope', '11217',
  'Highline Residential', 'loan_out', 'jra', 3217.40, 500,
  'Owner: STK. 183 market-rate units marketed; 63 MIH units handled only through NYC Housing Connect. Initial focus: 2BR and 3BR, plus featured 1BR/studios (marketing_priority A/B).')
ON CONFLICT (slug) DO NOTHING;
