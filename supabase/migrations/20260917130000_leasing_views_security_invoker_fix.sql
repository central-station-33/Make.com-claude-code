-- Fix security regressions the previous migration introduced, caught by
-- Supabase's security advisor immediately after applying it live:
--   1. The 5 new dashboard views were created SECURITY DEFINER (the default
--      for views created by a privileged role), meaning they'd bypass the
--      querying user's RLS entirely. Recreate them explicitly as
--      security_invoker so they respect the caller's row-level security.
--   2. The two new trigger functions had a mutable search_path (a known
--      privilege-escalation vector). Pin search_path explicitly.
--
-- NOTE: already applied live against the Supabase project via MCP tools
-- before this repo's drift was discovered; committed here to keep the repo
-- matching deployment. Verify current state with the security advisor
-- (`get_advisors`, type: security) before assuming a rerun is needed.

CREATE OR REPLACE VIEW rental_leasing_pipeline WITH (security_invoker = true) AS
SELECT
  il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market,
  il.routing, il.outreach_status, il.assigned_agent_id,
  ri.pipeline_stage, ri.move_date, ri.max_rent, ri.min_bedrooms,
  ri.ai_confidence, ri.ai_escalation_needed, ri.created_at
FROM isa_leads il
JOIN rental_inquiries ri ON ri.isa_lead_id = il.id
WHERE il.module = 'rental_leasing' AND il.lead_role = 'renter';

CREATE OR REPLACE VIEW landlord_leasing_pipeline WITH (security_invoker = true) AS
SELECT
  il.id AS isa_lead_id, il.full_name, il.email, il.phone, il.market,
  il.assigned_agent_id,
  ll.pipeline_stage, ll.property_address, ll.expected_rent, ll.vacancy_date, ll.created_at
FROM isa_leads il
JOIN landlord_leads ll ON ll.isa_lead_id = il.id
WHERE il.module = 'rental_leasing' AND il.lead_role = 'landlord';

CREATE OR REPLACE VIEW distressed_investor_pipeline WITH (security_invoker = true) AS
SELECT id AS isa_lead_id, full_name, email, phone, market, routing, outreach_status,
       bant_score, motivation_score, assigned_agent_id, created_at
FROM isa_leads
WHERE module = 'distressed_investor';

CREATE OR REPLACE VIEW residential_sale_pipeline WITH (security_invoker = true) AS
SELECT id AS isa_lead_id, full_name, email, phone, market, lead_role, routing, outreach_status,
       bant_score, motivation_score, assigned_agent_id, created_at
FROM isa_leads
WHERE module = 'residential_sale';

CREATE OR REPLACE VIEW leads_needing_module_triage WITH (security_invoker = true) AS
SELECT id, full_name, segment, market, created_at
FROM isa_leads
WHERE module IS NULL;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION flag_content_on_unit_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
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
