-- Brand profiles: one shared lead-generation engine, one branded front per
-- brokerage (Jet Realty Advisors, Highline Residential, future brokerages).
--
-- Scope (approved 2026-09-25): brand profiles + brand tagging + brand switcher.
-- NOT in scope: per-brand access enforcement (RLS by brand) and brand-aware
-- signatures in Edge Functions -- those are separate, later steps. Existing
-- row visibility is unchanged by this migration.
--
-- Backfill: every existing record -> Jet Realty Advisors (status quo), except
-- Solace (exclusive property, its units and any leads tied to it) -> Highline
-- Residential. Re-tagging existing NY leads to Highline is a pending decision.

-- ── 1. brands ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name            TEXT NOT NULL,                 -- brokerage name
  team_name       TEXT,                          -- e.g. MVP Team
  display_name    TEXT NOT NULL,                 -- shown in the switcher / ads
  sms_signature   TEXT NOT NULL,                 -- appended to texts
  email_signature TEXT,
  ad_disclosure   TEXT,                          -- brokerage disclosure line for ads/replies
  license_states  TEXT[] NOT NULL DEFAULT '{}',  -- states this brand's licenses cover
  website_url     TEXT,
  sending_email   TEXT,
  sms_from_number TEXT,                          -- NULL = shared default Twilio number
  logo_url        TEXT,
  primary_color   TEXT CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  initials        TEXT NOT NULL DEFAULT 'IR',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  sort_order      INT  NOT NULL DEFAULT 100,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.brands (slug, name, team_name, display_name, sms_signature, email_signature,
                           ad_disclosure, license_states, initials, primary_color, sort_order)
VALUES
  ('jra', 'Jet Realty Advisors', NULL, 'Jet Realty Advisors', 'Jet Realty Advisors',
   'Jet Realty Advisors', 'Jet Realty Advisors, licensed real estate broker.', ARRAY['NJ'],
   'JRA', '#1E3A5F', 10),
  ('hlr', 'Highline Residential', 'MVP Team', 'MVP Team @ Highline Residential',
   'MVP Team @ Highline Residential', 'The MVP Team @ Highline Residential',
   'The MVP Team @ Highline Residential, licensed real estate broker.', ARRAY['NY'],
   'HLR', '#0F766E', 20)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.default_brand_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.brands WHERE slug = 'jra'
$$;
-- Used as a column default, so every inserting role (incl. anon lead forms)
-- must be able to execute it. It only returns the JRA brand id.
GRANT EXECUTE ON FUNCTION public.default_brand_id() TO anon, authenticated, service_role;

-- ── 2. brand_members (which agents work under which brand, per state) ──────
CREATE TABLE IF NOT EXISTS public.brand_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  team_agent_id  UUID NOT NULL REFERENCES public.team_agents(id) ON DELETE CASCADE,
  license_state  TEXT NOT NULL CHECK (license_state ~ '^[A-Z]{2}$'),
  license_number TEXT,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brand_id, team_agent_id, license_state)
);
CREATE INDEX IF NOT EXISTS brand_members_agent_idx ON public.brand_members(team_agent_id);

-- James Thompson (owner; agent account): NY under Highline, NJ under JRA.
INSERT INTO public.brand_members (brand_id, team_agent_id, license_state)
SELECT b.id, ta.id, s.state
FROM (VALUES ('hlr','NY'), ('jra','NJ')) AS s(slug, state)
JOIN public.brands b ON b.slug = s.slug
JOIN public.team_agents ta ON ta.full_name = 'James Thompson'
ON CONFLICT DO NOTHING;

-- ── 3. brand_id on lead-bearing records ────────────────────────────────────
-- Added with a constant JRA default so existing rows are filled without an
-- UPDATE (no updated_at bumps, no update triggers on 900+ property rows).
DO $$
DECLARE jra UUID := (SELECT id FROM public.brands WHERE slug = 'jra');
        t   TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['isa_leads','properties','rental_units','exclusive_properties'] LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=t AND column_name='brand_id') THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN brand_id UUID NOT NULL DEFAULT %L REFERENCES public.brands(id)', t, jra);
    END IF;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN brand_id SET DEFAULT public.default_brand_id()', t);
  END LOOP;
END $$;

-- Solace -> Highline Residential (property, its units, any leads tied to it).
UPDATE public.exclusive_properties SET brand_id = (SELECT id FROM public.brands WHERE slug='hlr')
 WHERE slug = 'solace';
UPDATE public.isa_leads l SET brand_id = ep.brand_id
  FROM public.exclusive_properties ep
 WHERE l.exclusive_property_id = ep.id AND l.brand_id IS DISTINCT FROM ep.brand_id;
UPDATE public.rental_units u SET brand_id = ep.brand_id
  FROM public.exclusive_properties ep
 WHERE u.exclusive_property_id = ep.id AND u.brand_id IS DISTINCT FROM ep.brand_id;

CREATE INDEX IF NOT EXISTS isa_leads_brand_idx    ON public.isa_leads(brand_id);
CREATE INDEX IF NOT EXISTS properties_brand_idx   ON public.properties(brand_id);
CREATE INDEX IF NOT EXISTS rental_units_brand_idx ON public.rental_units(brand_id);

-- Records tied to an exclusive property always carry that property's brand.
CREATE OR REPLACE FUNCTION public.sync_brand_from_exclusive()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.exclusive_property_id IS NOT NULL THEN
    SELECT brand_id INTO NEW.brand_id FROM public.exclusive_properties WHERE id = NEW.exclusive_property_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_brand_from_exclusive() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_isa_leads_brand_sync ON public.isa_leads;
CREATE TRIGGER trg_isa_leads_brand_sync BEFORE INSERT OR UPDATE OF exclusive_property_id, brand_id
  ON public.isa_leads FOR EACH ROW EXECUTE FUNCTION public.sync_brand_from_exclusive();
DROP TRIGGER IF EXISTS trg_rental_units_brand_sync ON public.rental_units;
CREATE TRIGGER trg_rental_units_brand_sync BEFORE INSERT OR UPDATE OF exclusive_property_id, brand_id
  ON public.rental_units FOR EACH ROW EXECUTE FUNCTION public.sync_brand_from_exclusive();

-- ── 4. RLS on the new tables ───────────────────────────────────────────────
ALTER TABLE public.brands        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_members ENABLE ROW LEVEL SECURITY;

-- Brands are visible to brokers and to the agents who are members of them.
DROP POLICY IF EXISTS "brands read" ON public.brands;
CREATE POLICY "brands read" ON public.brands FOR SELECT TO authenticated USING (
  public.is_broker() OR EXISTS (
    SELECT 1 FROM public.brand_members bm JOIN public.team_agents ta ON ta.id = bm.team_agent_id
     WHERE bm.brand_id = brands.id AND bm.status = 'active' AND ta.auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "brands broker write" ON public.brands;
CREATE POLICY "brands broker write" ON public.brands FOR ALL TO authenticated
  USING (public.is_broker()) WITH CHECK (public.is_broker());

DROP POLICY IF EXISTS "brand members read" ON public.brand_members;
CREATE POLICY "brand members read" ON public.brand_members FOR SELECT TO authenticated USING (
  public.is_broker() OR team_agent_id IN (SELECT id FROM public.team_agents WHERE auth_user_id = auth.uid()));
DROP POLICY IF EXISTS "brand members broker write" ON public.brand_members;
CREATE POLICY "brand members broker write" ON public.brand_members FOR ALL TO authenticated
  USING (public.is_broker()) WITH CHECK (public.is_broker());

REVOKE ALL ON public.brands, public.brand_members FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands, public.brand_members TO authenticated;

-- ── 5. Pipeline views expose brand_id (appended; definitions otherwise unchanged)
CREATE OR REPLACE VIEW public.rental_leasing_pipeline WITH (security_invoker = true) AS
 SELECT il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market, il.routing,
    il.outreach_status, il.assigned_agent_id, ri.pipeline_stage, ri.move_date, ri.max_rent,
    ri.min_bedrooms, ri.ai_confidence, ri.ai_escalation_needed, ri.created_at, il.brand_id
   FROM isa_leads il JOIN rental_inquiries ri ON ri.isa_lead_id = il.id
  WHERE il.module = 'rental_leasing' AND il.lead_role = 'renter';

CREATE OR REPLACE VIEW public.landlord_leasing_pipeline WITH (security_invoker = true) AS
 SELECT il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market, il.assigned_agent_id,
    ll.pipeline_stage, ll.property_address, ll.expected_rent, ll.vacancy_date, ll.created_at, il.brand_id
   FROM isa_leads il JOIN landlord_leads ll ON ll.isa_lead_id = il.id
  WHERE il.module = 'rental_leasing' AND il.lead_role = 'landlord';

CREATE OR REPLACE VIEW public.distressed_investor_pipeline WITH (security_invoker = true) AS
 SELECT id AS isa_lead_id, full_name, email, phone, market, routing, outreach_status, bant_score,
    motivation_score, assigned_agent_id, created_at, brand_id
   FROM isa_leads WHERE module = 'distressed_investor';

CREATE OR REPLACE VIEW public.residential_sale_pipeline WITH (security_invoker = true) AS
 SELECT id AS isa_lead_id, full_name, email, phone, market, lead_role, routing, outreach_status,
    bant_score, motivation_score, assigned_agent_id, created_at, brand_id
   FROM isa_leads WHERE module = 'residential_sale';

CREATE OR REPLACE VIEW public.exclusive_leasing_pipeline WITH (security_invoker = true) AS
 SELECT il.id AS isa_lead_id, ep.slug AS property_slug, ep.name AS property_name, il.full_name,
    il.email, il.phone, il.outreach_status, il.assigned_agent_id, il.sms_consent,
    il.marketing_consent, il.created_at AS lead_created_at, ri.pipeline_stage, ri.move_date,
    ri.max_rent, ri.min_bedrooms, ri.preferred_bedrooms, ri.ai_confidence, ri.ai_escalation_needed,
    il.brand_id
   FROM isa_leads il
     JOIN exclusive_properties ep ON ep.id = il.exclusive_property_id
     LEFT JOIN rental_inquiries ri ON ri.isa_lead_id = il.id
  WHERE il.module = 'exclusive_leasing';
